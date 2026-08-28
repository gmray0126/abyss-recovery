import {
  createWorld, stepWorld, setPlayerInput, applyAction, buildSnapshot, drainEvents,
  addHumanPlayer, removeHumanPlayer, reconcileFillerAI
} from '../src/sim.js';
import { emptyInput } from '../src/protocol.js';

const CYCLE_MS = 10 * 60 * 1000;
const CAPACITY = 8;
const ENTRY_LOCK_MS = 60_000;
const FIXED = 1 / 30;
const SNAPSHOT_MS = 50;
const RECONNECT_GRACE_MS = 150_000;

const roomKey = (now = Date.now()) => Math.floor(now / CYCLE_MS);
const roomId = key => `IND-${String(key).slice(-6)}`;

export default {
  async fetch(request, env) {
    const now = Date.now();
    const currentKey = roomKey(now);
    const url = new URL(request.url);
    const requestedKey = Number(url.searchParams.get('roomKey'));
    const wantsWs = request.headers.get('Upgrade')?.toLowerCase() === 'websocket';
    const key = wantsWs && Number.isFinite(requestedKey) && requestedKey >= currentKey - 1 && requestedKey <= currentKey ? requestedKey : currentKey;
    const id = env.RAID_ROOMS.idFromName(String(key));
    const stub = env.RAID_ROOMS.get(id);

    if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      const target = new URL(request.url);
      target.pathname = '/websocket';
      target.searchParams.set('roomKey', String(key));
      return stub.fetch(new Request(target, request));
    }

    if (url.pathname === '/status' || url.pathname === '/' || url.pathname === '/health') {
      const target = new URL(request.url);
      target.pathname = '/status';
      target.searchParams.set('roomKey', String(key));
      return stub.fetch(target.toString());
    }

    return new Response('Not found', { status: 404 });
  }
};

export class RaidRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.key = null;
    this.world = null;
    this.endsAt = 0;
    this.nextAiFill = 0;
    this.loop = null;
    this.lastTick = Date.now();
    this.lastSnapshot = 0;
    this.acc = 0;
    this.persistAt = 0;
    this.reconnects = new Map();
  }

  async ensure(key) {
    if (this.world && this.key === key) return;
    this.key = key;
    this.endsAt = (key + 1) * CYCLE_MS;
    this.nextAiFill = Math.floor(Date.now() / 60000) * 60000 + 60000;

    const saved = await this.ctx.storage.get('raid');
    if (saved?.key === key && saved.world) {
      this.world = saved.world;
      this.nextAiFill = saved.nextAiFill || this.nextAiFill;
      this.reconnects = new Map(saved.reconnects || []);
      this.world.events = [];
    } else {
      this.reconnects = new Map();
      this.world = createWorld({ players: [], aiCount: CAPACITY, mapIndex: ((key % 3) + 3) % 3, coverSeed: key });
    }
    this.world.timeLeft = Math.max(0, (this.endsAt - Date.now()) / 1000);
  }

  async fetch(request) {
    const url = new URL(request.url);
    const key = Number(url.searchParams.get('roomKey') || roomKey());
    await this.ensure(key);

    if (url.pathname === '/status') {
      return Response.json(this.status(), {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store'
        }
      });
    }

    if (url.pathname !== '/websocket') return new Response('Not found', { status: 404 });
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ playerId: null, fullSent: false, resumeToken: null });
    this.send(server, { type: 'hello', data: { protocol: 1, serverTime: Date.now() } });
    this.send(server, { type: 'status', data: this.status() });

    return new Response(null, { status: 101, webSocket: client });
  }

  attachment(ws) {
    return ws.deserializeAttachment?.() || { playerId: null, fullSent: false, resumeToken: null };
  }

  setAttachment(ws, data) {
    ws.serializeAttachment?.(data);
  }

  send(ws, msg) {
    try { ws.send(JSON.stringify(msg)); } catch {}
  }

  sockets() {
    return this.ctx.getWebSockets();
  }

  playerSocket(playerId) {
    for (const ws of this.sockets()) {
      if (this.attachment(ws).playerId === playerId) return ws;
    }
    return null;
  }

  liveHumans() {
    if (!this.world) return 0;
    return this.world.actors.filter(a => a.kind === 'player' && !a.dead && !this.world.results[a.id]).length;
  }

  liveAI() {
    if (!this.world) return 0;
    return this.world.actors.filter(a => a.kind !== 'player' && !a.dead).length;
  }

  status(now = Date.now()) {
    const humans = this.liveHumans();
    const remainingMs = Math.max(0, this.endsAt - now);
    const entryClosed = remainingMs <= ENTRY_LOCK_MS;
    return {
      roomId: roomId(this.key),
      roomKey: this.key,
      humans,
      ai: this.liveAI(),
      capacity: CAPACITY,
      endsAt: this.endsAt,
      remainingMs,
      entryClosed,
      mapId: this.world.map?.id,
      mapName: this.world.map?.name,
      joinable: humans < CAPACITY && !entryClosed
    };
  }

  broadcastStatus() {
    const msg = { type: 'status', data: this.status() };
    for (const ws of this.sockets()) this.send(ws, msg);
  }

  startLoop() {
    if (this.loop || this.liveHumans() <= 0) return;
    this.lastTick = Date.now();
    this.loop = setInterval(() => this.tick(), 16);
  }

  stopLoopIfIdle() {
    if (this.liveHumans() > 0 || this.hasPendingReconnects() || !this.loop) return;
    clearInterval(this.loop);
    this.loop = null;
    this.ctx.waitUntil(this.persist());
  }

  async persist() {
    if (!this.world) return;
    try {
      await this.ctx.storage.put('raid', {
        key: this.key,
        world: this.world,
        nextAiFill: this.nextAiFill,
        reconnects: [...this.reconnects.entries()]
      });
    } catch {}
  }

  hasPendingReconnects() {
    for (const rec of this.reconnects.values()) if ((rec.expiresAt || 0) > 0) return true;
    return false;
  }

  newResumeToken() {
    return crypto.randomUUID();
  }

  clearReconnectForPlayer(playerId) {
    for (const [token, rec] of this.reconnects) {
      if (rec.playerId === playerId) this.reconnects.delete(token);
    }
  }

  removeSocketPlayer(ws, drop = true) {
    const a = this.attachment(ws);
    if (!a.playerId || !this.world) return;
    const hadResult = !!this.world.results[a.playerId];
    if (a.resumeToken) this.reconnects.delete(a.resumeToken);
    else this.clearReconnectForPlayer(a.playerId);
    removeHumanPlayer(this.world, a.playerId, { drop: drop && !hadResult });
    this.setAttachment(ws, { playerId: null, fullSent: false, resumeToken: null });
    this.broadcastStatus();
    this.stopLoopIfIdle();
    this.ctx.waitUntil(this.persist());
  }

  markSocketDisconnected(ws) {
    const a = this.attachment(ws);
    if (!a.playerId || !this.world) return;
    this.setAttachment(ws, { playerId: null, fullSent: false, resumeToken: null });
    setPlayerInput(this.world, a.playerId, emptyInput());
    const rec = a.resumeToken ? this.reconnects.get(a.resumeToken) : null;
    if (!rec || rec.playerId !== a.playerId) {
      const hadResult = !!this.world.results[a.playerId];
      removeHumanPlayer(this.world, a.playerId, { drop: !hadResult });
    } else {
      rec.expiresAt = Date.now() + RECONNECT_GRACE_MS;
      this.reconnects.set(a.resumeToken, rec);
      this.startLoop();
    }
    this.broadcastStatus();
    this.ctx.waitUntil(this.persist());
  }

  expireReconnect(token, rec) {
    if (!rec) return;
    const ws = this.playerSocket(rec.playerId);
    if (ws) return;
    const hadResult = !!this.world.results[rec.playerId];
    removeHumanPlayer(this.world, rec.playerId, { drop: !hadResult });
    this.reconnects.delete(token);
  }

  cleanupReconnects(now = Date.now()) {
    let changed = false;
    for (const [token, rec] of [...this.reconnects.entries()]) {
      if (!(rec.expiresAt > 0) || now < rec.expiresAt) continue;
      this.expireReconnect(token, rec);
      changed = true;
    }
    if (changed) {
      this.broadcastStatus();
      this.ctx.waitUntil(this.persist());
    }
  }

  resume(ws, data = {}) {
    const att = this.attachment(ws);
    if (att.playerId) return;
    const token = String(data.token || '');
    const rec = this.reconnects.get(token);
    const now = Date.now();
    if (!token || !rec) {
      this.send(ws, { type: 'resume_denied', reason: '복귀 가능한 RAID 세션이 없습니다.' });
      return;
    }
    if (rec.expiresAt > 0 && now > rec.expiresAt) {
      this.expireReconnect(token, rec);
      this.send(ws, { type: 'resume_denied', reason: '재접속 제한 시간 2분 30초를 초과했습니다.' });
      this.broadcastStatus();
      this.ctx.waitUntil(this.persist());
      return;
    }
    const actor = this.world.actors.find(a => a.id === rec.playerId);
    if (!actor) {
      this.reconnects.delete(token);
      this.send(ws, { type: 'resume_denied', reason: '복귀할 캐릭터 상태를 찾을 수 없습니다.' });
      this.ctx.waitUntil(this.persist());
      return;
    }

    const oldSocket = this.playerSocket(rec.playerId);
    if (oldSocket && oldSocket !== ws) {
      this.setAttachment(oldSocket, { playerId: null, fullSent: false, resumeToken: null });
      try { oldSocket.close(4001, 'Session resumed elsewhere'); } catch {}
    }

    this.reconnects.delete(token);
    const nextToken = this.newResumeToken();
    this.reconnects.set(nextToken, { playerId: rec.playerId, expiresAt: 0 });
    this.setAttachment(ws, { playerId: rec.playerId, fullSent: false, resumeToken: nextToken });
    this.send(ws, { type: 'joined', data: { playerId: rec.playerId, roomId: roomId(this.key), roomKey: this.key, endsAt: this.endsAt, resumeToken: nextToken, reconnectGraceMs: RECONNECT_GRACE_MS, resumed: true } });
    this.startLoop();
    this.broadcastStatus();
    this.sendSnapshot(ws, rec.playerId, true);
    this.ctx.waitUntil(this.persist());
  }

  join(ws, config = {}) {
    const att = this.attachment(ws);
    if (att.playerId) return;
    this.cleanupReconnects(Date.now());
    const humans = this.liveHumans();
    const remainingMs = Math.max(0, this.endsAt - Date.now());
    if (humans >= CAPACITY || remainingMs <= ENTRY_LOCK_MS) {
      this.send(ws, { type: 'join_denied', reason: humans >= CAPACITY ? '현재 방이 가득 찼습니다.' : '현재 RAID는 종료 1분 전이라 신규 참가가 마감되었습니다.' });
      return;
    }

    // AI never blocks a human slot. Remove filler immediately when a human joins.
    reconcileFillerAI(this.world, Math.max(0, CAPACITY - (humans + 1)), { onlyRemove: true });
    const id = addHumanPlayer(this.world, {
      ...config,
      name: (config.name || 'PLAYER').slice(0, 18)
    });
    const resumeToken = this.newResumeToken();
    this.reconnects.set(resumeToken, { playerId: id, expiresAt: 0 });
    this.setAttachment(ws, { playerId: id, fullSent: false, resumeToken });
    this.send(ws, { type: 'joined', data: { playerId: id, roomId: roomId(this.key), roomKey: this.key, endsAt: this.endsAt, resumeToken, reconnectGraceMs: RECONNECT_GRACE_MS, resumed: false } });
    this.startLoop();
    this.broadcastStatus();
    this.sendSnapshot(ws, id, true);
    this.ctx.waitUntil(this.persist());
  }

  async webSocketMessage(ws, message) {
    let m;
    try { m = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message)); }
    catch { return; }

    if (m.type === 'watch') {
      this.send(ws, { type: 'status', data: this.status() });
      return;
    }
    if (m.type === 'join') {
      this.join(ws, m.data || {});
      return;
    }
    if (m.type === 'resume') {
      this.resume(ws, m.data || {});
      return;
    }
    if (m.type === 'leave') {
      this.removeSocketPlayer(ws, true);
      this.send(ws, { type: 'left' });
      return;
    }

    const id = this.attachment(ws).playerId;
    if (!id) return;
    if (m.type === 'input') setPlayerInput(this.world, id, m.data || {});
    else if (m.type === 'action') applyAction(this.world, id, m.data || {});
  }

  async webSocketClose(ws) {
    this.markSocketDisconnected(ws);
  }

  async webSocketError(ws) {
    this.markSocketDisconnected(ws);
  }

  sendEvents() {
    for (const e of drainEvents(this.world)) {
      if (e.recipient) {
        const ws = this.playerSocket(e.recipient);
        if (ws) this.send(ws, { type: 'event', data: e });
      } else {
        for (const ws of this.sockets()) {
          if (this.attachment(ws).playerId) this.send(ws, { type: 'event', data: e });
        }
      }
    }
  }

  sendSnapshot(ws, playerId, forceFull = false) {
    const snap = buildSnapshot(this.world, playerId);
    if (!snap) return;
    snap.room = this.status();
    const att = this.attachment(ws);
    const full = forceFull || !att.fullSent;
    if (!full) {
      delete snap.obstacles;
      delete snap.zones;
      delete snap.extracts;
      delete snap.worldW;
      delete snap.worldH;
    }
    this.send(ws, { type: 'snapshot', full, data: snap });
    if (!att.fullSent) this.setAttachment(ws, { ...att, fullSent: true });
  }

  sendSnapshots(now) {
    if (now - this.lastSnapshot < SNAPSHOT_MS) return;
    this.lastSnapshot = now;
    for (const ws of this.sockets()) {
      const id = this.attachment(ws).playerId;
      if (id) this.sendSnapshot(ws, id, false);
    }
  }

  tick() {
    if (!this.world) return;
    const now = Date.now();
    const elapsed = Math.min(0.1, Math.max(0, (now - this.lastTick) / 1000));
    this.lastTick = now;
    this.world.timeLeft = Math.max(0, (this.endsAt - now) / 1000);
    this.acc += elapsed;
    this.cleanupReconnects(now);

    let guard = 0;
    while (this.acc >= FIXED && guard++ < 4 && this.world.timeLeft > 0) {
      stepWorld(this.world, FIXED);
      this.acc -= FIXED;
      this.world.timeLeft = Math.max(0, (this.endsAt - Date.now()) / 1000);
    }

    // Once per real minute, fill empty human slots with AI.
    if (now >= this.nextAiFill && this.world.timeLeft > 0) {
      reconcileFillerAI(this.world, Math.max(0, CAPACITY - this.liveHumans()));
      while (this.nextAiFill <= now) this.nextAiFill += 60000;
      this.broadcastStatus();
    }

    this.sendEvents();
    this.sendSnapshots(now);

    if (now - this.persistAt > 5000) {
      this.persistAt = now;
      this.ctx.waitUntil(this.persist());
    }

    if (this.world.timeLeft <= 0) {
      stepWorld(this.world, 0.001);
      this.sendEvents();
      this.sendSnapshots(now);
    }

    this.stopLoopIfIdle();
  }
}
