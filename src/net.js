import {createWorld,stepWorld,setPlayerInput,applyAction,buildSnapshot,drainEvents} from './sim.js';

const RESUME_KEY='deadDropRaidResumeV1';
const DEFAULT_RECONNECT_GRACE_MS=150_000;

function loadResume(){
  try{
    const raw=localStorage.getItem(RESUME_KEY);if(!raw)return null;
    const data=JSON.parse(raw);if(!data?.token)return null;
    if(data.endsAt&&Date.now()>data.endsAt+DEFAULT_RECONNECT_GRACE_MS){localStorage.removeItem(RESUME_KEY);return null}
    return data;
  }catch{return null}
}
function saveResume(data){try{localStorage.setItem(RESUME_KEY,JSON.stringify(data))}catch{}}
function clearResume(){try{localStorage.removeItem(RESUME_KEY)}catch{}}
function recoveryFromSnapshot(s){const p=s?.player;if(!p)return null;return{name:p.name,x:p.x,y:p.y,hp:p.hp,maxHp:p.maxHp,kills:p.kills,baseVisionLevel:p.baseVisionLevel||p.visionLevel,weaponSlot:p.weaponSlot,recoil:p.recoil||0,secureItemId:p.secureItemId||null,gear:p.gear,inventory:p.inventory}}

class Emitter{constructor(){this.handlers=new Map()}on(name,fn){if(!this.handlers.has(name))this.handlers.set(name,new Set());this.handlers.get(name).add(fn);return()=>this.handlers.get(name)?.delete(fn)}emit(name,data){for(const fn of this.handlers.get(name)||[])fn(data)}}

export class LocalSession extends Emitter{
 constructor(config={}){super();const now=Date.now(),cycle=Math.floor(now/(10*60*1000));this.closed=false;this.world=createWorld({players:[config],mapIndex:((cycle%3)+3)%3,coverSeed:now});this.playerId=this.world.humanIds[0];this.acc=0;this.last=performance.now();this.timer=setInterval(()=>this.loop(),16);this.snapshotTimer=setInterval(()=>this.pushSnapshot(),50);this.pushSnapshot()}
 loop(){if(this.closed)return;const now=performance.now(),frame=Math.min(.08,(now-this.last)/1000);this.last=now;this.acc+=frame;const FIXED=1/30;let guard=0;while(this.acc>=FIXED&&guard++<4){stepWorld(this.world,FIXED);this.acc-=FIXED;for(const e of drainEvents(this.world)){if(!e.recipient||e.recipient===this.playerId)this.emit('event',e)}}}
 pushSnapshot(){if(!this.closed)this.emit('snapshot',buildSnapshot(this.world,this.playerId))}
 sendInput(input){if(!this.closed)setPlayerInput(this.world,this.playerId,input)}sendAction(action){if(!this.closed)applyAction(this.world,this.playerId,action)}close(){if(this.closed)return;this.closed=true;clearInterval(this.timer);clearInterval(this.snapshotTimer)}
}

export class WebSocketSession extends Emitter{
 constructor(url){super();const saved=loadResume();this.url=url;this.ws=null;this.manual=false;this.joined=false;this.pendingJoin=null;this.lastSnapshot=null;this.reconnectTimer=null;this.disconnectTimer=null;this.resumeToken=saved?.token||null;this.resumeInfo=saved||null;this.reconnectGraceMs=Number(saved?.reconnectGraceMs)||DEFAULT_RECONNECT_GRACE_MS;this.connect()}
 get connected(){return this.ws?.readyState===1}
 socketUrl(){if(!this.resumeToken||!this.resumeInfo?.roomKey)return this.url;try{const u=new URL(this.url,location.href);u.searchParams.set('roomKey',String(this.resumeInfo.roomKey));return u.toString()}catch{return this.url}}
 connect(){if(this.manual)return;this.ws=new WebSocket(this.socketUrl());this.ws.addEventListener('open',()=>{this.emit('connection',{connected:true});this.ws.send(JSON.stringify({type:'watch'}));if(this.resumeToken)this._sendResume();else if(this.pendingJoin)this._sendJoin()});this.ws.addEventListener('message',e=>{let m;try{m=JSON.parse(e.data)}catch{return}if(m.type==='status')this.emit('status',m.data);else if(m.type==='joined'){this.joined=true;clearTimeout(this.disconnectTimer);this.disconnectTimer=null;this.pendingJoin=null;if(m.data?.resumeToken){this.resumeToken=m.data.resumeToken;this.reconnectGraceMs=Number(m.data.reconnectGraceMs)||DEFAULT_RECONNECT_GRACE_MS;this.resumeInfo={...(this.resumeInfo||{}),token:this.resumeToken,roomId:m.data.roomId||null,roomKey:m.data.roomKey??this.resumeInfo?.roomKey??null,endsAt:m.data.endsAt||0,reconnectGraceMs:this.reconnectGraceMs,savedAt:Date.now()};saveResume(this.resumeInfo)}this.emit('joined',m.data)}else if(m.type==='resume_denied'){this.joined=false;this.pendingJoin=null;clearTimeout(this.disconnectTimer);this.disconnectTimer=null;this._clearResume();this.emit('resume_denied',m);this.emit('disconnect',{reason:m.reason||'재접속 제한 시간이 초과되었습니다.'})}else if(m.type==='join_denied'){this.pendingJoin=null;this.emit('join_denied',m)}else if(m.type==='snapshot'){this.lastSnapshot=m.full||!this.lastSnapshot?m.data:{...this.lastSnapshot,...m.data};if(this.resumeToken&&this.resumeInfo){this.resumeInfo.recovery=recoveryFromSnapshot(this.lastSnapshot);this.resumeInfo.roomKey=this.lastSnapshot?.room?.roomKey??this.resumeInfo.roomKey;this.resumeInfo.endsAt=this.lastSnapshot?.room?.endsAt??this.resumeInfo.endsAt;this.resumeInfo.savedAt=Date.now();saveResume(this.resumeInfo)}this.emit('snapshot',this.lastSnapshot)}else if(m.type==='event')this.emit('event',m.data);else if(m.type==='left'){this.joined=false;this.lastSnapshot=null;this._clearResume();this.emit('left')}});this.ws.addEventListener('close',()=>{const wasJoined=this.joined;this.joined=false;this.emit('connection',{connected:false});if(wasJoined&&this.resumeToken)this._armDisconnectTimeout();else if(wasJoined)this.emit('disconnect',{reason:'멀티 서버 연결 끊김'});if(!this.manual){clearTimeout(this.reconnectTimer);this.reconnectTimer=setTimeout(()=>this.connect(),1000)}});this.ws.addEventListener('error',()=>{})}
 _armDisconnectTimeout(){clearTimeout(this.disconnectTimer);this.disconnectTimer=setTimeout(()=>{if(this.joined)return;this.pendingJoin=null;this._clearResume();this.emit('disconnect',{reason:'재접속 제한 시간 2분 30초 초과'})},Math.max(1000,this.reconnectGraceMs+1500))}
 _sendJoin(){if(this.connected&&this.pendingJoin)this.ws.send(JSON.stringify({type:'join',data:this.pendingJoin}))}
 _sendResume(){if(this.connected&&this.resumeToken)this.ws.send(JSON.stringify({type:'resume',data:{token:this.resumeToken,roomKey:this.resumeInfo?.roomKey,recovery:this.resumeInfo?.recovery||null,savedAt:this.resumeInfo?.savedAt||0}}))}
 _clearResume(){this.resumeToken=null;this.resumeInfo=null;clearResume()}
 join(config){this.pendingJoin=config;if(this.connected){if(this.resumeToken)this._sendResume();else this._sendJoin()}}
 leave(){this.pendingJoin=null;clearTimeout(this.disconnectTimer);this.disconnectTimer=null;this._clearResume();if(this.connected)this.ws.send(JSON.stringify({type:'leave'}));this.joined=false;this.lastSnapshot=null}
 sendInput(input){if(this.connected&&this.joined)this.ws.send(JSON.stringify({type:'input',data:input}))}sendAction(action){if(this.connected&&this.joined)this.ws.send(JSON.stringify({type:'action',data:action}))}close(){this.manual=true;clearTimeout(this.reconnectTimer);clearTimeout(this.disconnectTimer);this.ws?.close()}
}
