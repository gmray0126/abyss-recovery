import {
  createWorld, stepWorld, setPlayerInput, applyAction, buildSnapshot, drainEvents,
  addHumanPlayer, removeHumanPlayer, reconcileFillerAI
} from '../src/sim.js';

const CYCLE_MS = 10 * 60 * 1000;
const CAPACITY = 8;
const ENTRY_LOCK_MS = 60_000;
const FIXED = 1 / 30;
const SNAPSHOT_MS = 50;

const roomKey = (now = Date.now()) => Math.floor(now / CYCLE_MS);
const roomId = key => `IND-${String(key).slice(-6)}`;

export default {
  async fetch(request, env) {
    const now = Date.now();
    const key = roomKey(now);
    const id = env.RAID_ROOMS.idFromName(String(key));
    const stub = env.RAID_ROOMS.get(id);
    const url = new URL(request.url);

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
      this.world.events = [];
    } else {
      this.world = createWorld({ players: [], aiCount: CAPACITY, mapIndex: ((key % 3) + 3) % 3 });
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
    server.serializeAttachment({ playerId: null, fullSent: false });
    this.send(server, { type: 'hello', data: { protocol: 1, serverTime: Date.now() } });
    this.send(server, { type: 'status', data: this.status() });

    return new Response(null, { status: 101, webSocket: client });
  }

  attachment(ws) {
    return ws.deserializeAttachment?.() || { playerId: null, fullSent: false };
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
    if (this.liveHumans() > 0 || !this.loop) return;
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
        nextAiFill: this.nextAiFill
      });
    } catch {}
  }

  removeSocketPlayer(ws, drop = true) {
    const a = this.attachment(ws);
    if (!a.playerId || !this.world) return;
    const hadResult = !!this.world.results[a.playerId];
    removeHumanPlayer(this.world, a.playerId, { drop: drop && !hadResult });
    this.setAttachment(ws, { playerId: null, fullSent: false });
    this.broadcastStatus();
    this.stopLoopIfIdle();
  }

  join(ws, config = {}) {
    const att = this.attachment(ws);
    if (att.playerId) return;
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
    this.setAttachment(ws, { playerId: id, fullSent: false });
    this.send(ws, { type: 'joined', data: { playerId: id, roomId: roomId(this.key), endsAt: this.endsAt } });
    this.startLoop();
    this.broadcastStatus();
    this.sendSnapshot(ws, id, true);
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
    this.removeSocketPlayer(ws, true);
  }

  async webSocketError(ws) {
    this.removeSocketPlayer(ws, true);
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
