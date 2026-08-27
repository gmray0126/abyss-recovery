import {createWorld,stepWorld,setPlayerInput,applyAction,buildSnapshot,drainEvents} from './sim.js';

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
 constructor(url){super();this.url=url;this.ws=null;this.manual=false;this.joined=false;this.pendingJoin=null;this.lastSnapshot=null;this.reconnectTimer=null;this.connect()}
 get connected(){return this.ws?.readyState===1}
 connect(){if(this.manual)return;this.ws=new WebSocket(this.url);this.ws.addEventListener('open',()=>{this.emit('connection',{connected:true});this.ws.send(JSON.stringify({type:'watch'}));if(this.pendingJoin)this._sendJoin()});this.ws.addEventListener('message',e=>{let m;try{m=JSON.parse(e.data)}catch{return}if(m.type==='status')this.emit('status',m.data);else if(m.type==='joined'){this.joined=true;this.emit('joined',m.data)}else if(m.type==='join_denied'){this.pendingJoin=null;this.emit('join_denied',m)}else if(m.type==='snapshot'){this.lastSnapshot=m.full||!this.lastSnapshot?m.data:{...this.lastSnapshot,...m.data};this.emit('snapshot',this.lastSnapshot)}else if(m.type==='event')this.emit('event',m.data);else if(m.type==='left'){this.joined=false;this.lastSnapshot=null;this.emit('left')}});this.ws.addEventListener('close',()=>{const wasJoined=this.joined;this.joined=false;this.emit('connection',{connected:false});if(wasJoined)this.emit('disconnect');if(!this.manual){clearTimeout(this.reconnectTimer);this.reconnectTimer=setTimeout(()=>this.connect(),1000)}});this.ws.addEventListener('error',()=>{})}
 _sendJoin(){if(this.connected&&this.pendingJoin)this.ws.send(JSON.stringify({type:'join',data:this.pendingJoin}))}
 join(config){this.pendingJoin=config;if(this.connected)this._sendJoin()}
 leave(){this.pendingJoin=null;if(this.connected)this.ws.send(JSON.stringify({type:'leave'}));this.joined=false;this.lastSnapshot=null}
 sendInput(input){if(this.connected&&this.joined)this.ws.send(JSON.stringify({type:'input',data:input}))}
 sendAction(action){if(this.connected&&this.joined)this.ws.send(JSON.stringify({type:'action',data:action}))}
 close(){this.manual=true;clearTimeout(this.reconnectTimer);this.ws?.close()}
}