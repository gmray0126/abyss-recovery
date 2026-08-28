from pathlib import Path


def must_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f"missing patch anchor: {label}")
    return text.replace(old, new, 1)


NET_JS = r'''import {createWorld,stepWorld,setPlayerInput,applyAction,buildSnapshot,drainEvents} from './sim.js';

const RESUME_KEY='deadDropRaidResumeV1';
const DEFAULT_RECONNECT_GRACE_MS=30_000;

function loadResume(){
  try{
    const raw=localStorage.getItem(RESUME_KEY);
    if(!raw)return null;
    const data=JSON.parse(raw);
    if(!data?.token)return null;
    if(data.endsAt&&Date.now()>data.endsAt+60_000){localStorage.removeItem(RESUME_KEY);return null}
    return data;
  }catch{return null}
}
function saveResume(data){try{localStorage.setItem(RESUME_KEY,JSON.stringify(data))}catch{}}
function clearResume(){try{localStorage.removeItem(RESUME_KEY)}catch{}}

class Emitter{
 constructor(){this.handlers=new Map()}
 on(name,fn){if(!this.handlers.has(name))this.handlers.set(name,new Set());this.handlers.get(name).add(fn);return()=>this.handlers.get(name)?.delete(fn)}
 emit(name,data){for(const fn of this.handlers.get(name)||[])fn(data)}
}

export class LocalSession extends Emitter{
 constructor(config={}){
   super();const now=Date.now(),cycle=Math.floor(now/(10*60*1000));this.closed=false;this.world=createWorld({players:[config],mapIndex:((cycle%3)+3)%3,coverSeed:now});this.playerId=this.world.humanIds[0];this.acc=0;this.last=performance.now();
   this.timer=setInterval(()=>this.loop(),16);this.snapshotTimer=setInterval(()=>this.pushSnapshot(),50);this.pushSnapshot();
 }
 loop(){if(this.closed)return;const now=performance.now(),frame=Math.min(.08,(now-this.last)/1000);this.last=now;this.acc+=frame;const FIXED=1/30;let guard=0;while(this.acc>=FIXED&&guard++<4){stepWorld(this.world,FIXED);this.acc-=FIXED;for(const e of drainEvents(this.world)){if(!e.recipient||e.recipient===this.playerId)this.emit('event',e)}}}
 pushSnapshot(){if(this.closed)return;this.emit('snapshot',buildSnapshot(this.world,this.playerId))}
 sendInput(input){if(!this.closed)setPlayerInput(this.world,this.playerId,input)}
 sendAction(action){if(!this.closed)applyAction(this.world,this.playerId,action)}
 close(){if(this.closed)return;this.closed=true;clearInterval(this.timer);clearInterval(this.snapshotTimer)}
}

export class WebSocketSession extends Emitter{
 constructor(url){
   super();
   const saved=loadResume();
   this.url=url;this.ws=null;this.manual=false;this.joined=false;this.pendingJoin=null;this.lastSnapshot=null;this.reconnectTimer=null;this.disconnectTimer=null;
   this.resumeToken=saved?.token||null;this.resumeInfo=saved||null;this.reconnectGraceMs=Number(saved?.reconnectGraceMs)||DEFAULT_RECONNECT_GRACE_MS;
   this.connect();
 }
 get connected(){return this.ws?.readyState===1}
 connect(){
   if(this.manual)return;
   this.ws=new WebSocket(this.url);
   this.ws.addEventListener('open',()=>{
     this.emit('connection',{connected:true});
     this.ws.send(JSON.stringify({type:'watch'}));
     if(this.resumeToken)this._sendResume();else if(this.pendingJoin)this._sendJoin();
   });
   this.ws.addEventListener('message',e=>{
     let m;try{m=JSON.parse(e.data)}catch{return}
     if(m.type==='status')this.emit('status',m.data);
     else if(m.type==='joined'){
       this.joined=true;clearTimeout(this.disconnectTimer);this.disconnectTimer=null;this.pendingJoin=null;
       if(m.data?.resumeToken){
         this.resumeToken=m.data.resumeToken;
         this.reconnectGraceMs=Number(m.data.reconnectGraceMs)||DEFAULT_RECONNECT_GRACE_MS;
         this.resumeInfo={token:this.resumeToken,roomId:m.data.roomId||null,endsAt:m.data.endsAt||0,reconnectGraceMs:this.reconnectGraceMs,savedAt:Date.now()};
         saveResume(this.resumeInfo);
       }
       this.emit('joined',m.data);
     }
     else if(m.type==='resume_denied'){
       this.joined=false;this.pendingJoin=null;clearTimeout(this.disconnectTimer);this.disconnectTimer=null;this._clearResume();
       this.emit('resume_denied',m);
       this.emit('disconnect',{reason:m.reason||'재접속 제한 시간이 초과되었습니다.'});
     }
     else if(m.type==='join_denied'){this.pendingJoin=null;this.emit('join_denied',m)}
     else if(m.type==='snapshot'){this.lastSnapshot=m.full||!this.lastSnapshot?m.data:{...this.lastSnapshot,...m.data};this.emit('snapshot',this.lastSnapshot)}
     else if(m.type==='event')this.emit('event',m.data);
     else if(m.type==='left'){this.joined=false;this.lastSnapshot=null;this._clearResume();this.emit('left')}
   });
   this.ws.addEventListener('close',()=>{
     const wasJoined=this.joined;this.joined=false;this.emit('connection',{connected:false});
     if(wasJoined&&this.resumeToken)this._armDisconnectTimeout();
     else if(wasJoined)this.emit('disconnect',{reason:'멀티 서버 연결 끊김'});
     if(!this.manual){clearTimeout(this.reconnectTimer);this.reconnectTimer=setTimeout(()=>this.connect(),1000)}
   });
   this.ws.addEventListener('error',()=>{});
 }
 _armDisconnectTimeout(){
   clearTimeout(this.disconnectTimer);
   const wait=Math.max(1000,this.reconnectGraceMs+1500);
   this.disconnectTimer=setTimeout(()=>{
     if(this.joined)return;
     this.pendingJoin=null;this._clearResume();
     this.emit('disconnect',{reason:'재접속 제한 시간 초과'});
   },wait);
 }
 _sendJoin(){if(this.connected&&this.pendingJoin)this.ws.send(JSON.stringify({type:'join',data:this.pendingJoin}))}
 _sendResume(){if(this.connected&&this.resumeToken)this.ws.send(JSON.stringify({type:'resume',data:{token:this.resumeToken}}))}
 _clearResume(){this.resumeToken=null;this.resumeInfo=null;clearResume()}
 join(config){this.pendingJoin=config;if(this.connected){if(this.resumeToken)this._sendResume();else this._sendJoin()}}
 leave(){this.pendingJoin=null;clearTimeout(this.disconnectTimer);this.disconnectTimer=null;this._clearResume();if(this.connected)this.ws.send(JSON.stringify({type:'leave'}));this.joined=false;this.lastSnapshot=null}
 sendInput(input){if(this.connected&&this.joined)this.ws.send(JSON.stringify({type:'input',data:input}))}
 sendAction(action){if(this.connected&&this.joined)this.ws.send(JSON.stringify({type:'action',data:action}))}
 close(){this.manual=true;clearTimeout(this.reconnectTimer);clearTimeout(this.disconnectTimer);this.ws?.close()}
}
'''

Path('src/net.js').write_text(NET_JS, encoding='utf-8')

worker_path=Path('cloudflare/worker.js')
worker=worker_path.read_text(encoding='utf-8')
worker=must_replace(worker,
"} from '../src/sim.js';\n",
"} from '../src/sim.js';\nimport { emptyInput } from '../src/protocol.js';\n",
'worker protocol import')
worker=must_replace(worker,
"const SNAPSHOT_MS = 50;\n",
"const SNAPSHOT_MS = 50;\nconst RECONNECT_GRACE_MS = 30_000;\n",
'worker reconnect constant')
worker=must_replace(worker,
"    this.persistAt = 0;\n",
"    this.persistAt = 0;\n    this.reconnects = new Map();\n",
'worker reconnect map')
worker=must_replace(worker,
"      this.nextAiFill = saved.nextAiFill || this.nextAiFill;\n      this.world.events = [];\n    } else {\n      this.world = createWorld({ players: [], aiCount: CAPACITY, mapIndex: ((key % 3) + 3) % 3, coverSeed: key });\n    }",
"      this.nextAiFill = saved.nextAiFill || this.nextAiFill;\n      this.reconnects = new Map(saved.reconnects || []);\n      this.world.events = [];\n    } else {\n      this.reconnects = new Map();\n      this.world = createWorld({ players: [], aiCount: CAPACITY, mapIndex: ((key % 3) + 3) % 3, coverSeed: key });\n    }",
'worker restore reconnect map')
worker=must_replace(worker,
"    server.serializeAttachment({ playerId: null, fullSent: false });",
"    server.serializeAttachment({ playerId: null, fullSent: false, resumeToken: null });",
'worker initial attachment')
worker=must_replace(worker,
"    return ws.deserializeAttachment?.() || { playerId: null, fullSent: false };",
"    return ws.deserializeAttachment?.() || { playerId: null, fullSent: false, resumeToken: null };",
'worker attachment default')
worker=must_replace(worker,
"  stopLoopIfIdle() {\n    if (this.liveHumans() > 0 || !this.loop) return;",
"  stopLoopIfIdle() {\n    if (this.liveHumans() > 0 || this.hasPendingReconnects() || !this.loop) return;",
'worker idle reconnect guard')
worker=must_replace(worker,
"        world: this.world,\n        nextAiFill: this.nextAiFill\n",
"        world: this.world,\n        nextAiFill: this.nextAiFill,\n        reconnects: [...this.reconnects.entries()]\n",
'worker persist reconnect map')

start=worker.index("  removeSocketPlayer(ws, drop = true) {")
end=worker.index("  async webSocketMessage(ws, message) {", start)
new_block=r'''  hasPendingReconnects() {
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
      this.send(ws, { type: 'resume_denied', reason: '재접속 제한 시간 30초를 초과했습니다.' });
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
    this.send(ws, { type: 'joined', data: { playerId: rec.playerId, roomId: roomId(this.key), endsAt: this.endsAt, resumeToken: nextToken, reconnectGraceMs: RECONNECT_GRACE_MS, resumed: true } });
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
    this.send(ws, { type: 'joined', data: { playerId: id, roomId: roomId(this.key), endsAt: this.endsAt, resumeToken, reconnectGraceMs: RECONNECT_GRACE_MS, resumed: false } });
    this.startLoop();
    this.broadcastStatus();
    this.sendSnapshot(ws, id, true);
    this.ctx.waitUntil(this.persist());
  }

'''
worker=worker[:start]+new_block+worker[end:]
worker=must_replace(worker,
"    if (m.type === 'join') {\n      this.join(ws, m.data || {});\n      return;\n    }\n    if (m.type === 'leave') {",
"    if (m.type === 'join') {\n      this.join(ws, m.data || {});\n      return;\n    }\n    if (m.type === 'resume') {\n      this.resume(ws, m.data || {});\n      return;\n    }\n    if (m.type === 'leave') {",
'worker resume message')
worker=must_replace(worker,
"  async webSocketClose(ws) {\n    this.removeSocketPlayer(ws, true);\n  }\n\n  async webSocketError(ws) {\n    this.removeSocketPlayer(ws, true);\n  }",
"  async webSocketClose(ws) {\n    this.markSocketDisconnected(ws);\n  }\n\n  async webSocketError(ws) {\n    this.markSocketDisconnected(ws);\n  }",
'worker disconnect grace')
worker=must_replace(worker,
"    this.world.timeLeft = Math.max(0, (this.endsAt - now) / 1000);\n    this.acc += elapsed;\n",
"    this.world.timeLeft = Math.max(0, (this.endsAt - now) / 1000);\n    this.acc += elapsed;\n    this.cleanupReconnects(now);\n",
'worker reconnect cleanup tick')
worker_path.write_text(worker, encoding='utf-8')

main_path=Path('src/main.js')
main=main_path.read_text(encoding='utf-8')
main=must_replace(main,
"realtime.on('joined',()=>{if(!pendingDeparture)return;pendingDeparture=null;enterRaid(realtime)});",
"realtime.on('joined',d=>{if(d?.resumed){pendingDeparture=null;if(session!==realtime)enterRaid(realtime,true);return}if(!pendingDeparture)return;pendingDeparture=null;enterRaid(realtime)});",
'main resumed join')
main=must_replace(main,
"function enterRaid(activeSession){meta.equipment={primary:null,secondary:null,armor:null,helmet:null,backpack:null};meta.inventory=[];save();renderLobby();",
"function enterRaid(activeSession,resumed=false){if(!resumed){meta.equipment={primary:null,secondary:null,armor:null,helmet:null,backpack:null};meta.inventory=[];save();renderLobby()}",
'main resumed raid entry')
main_path.write_text(main, encoding='utf-8')

print('v3.3.0 reconnect protection patch applied')
