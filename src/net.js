import {createWorld,stepWorld,setPlayerInput,applyAction,buildSnapshot,drainEvents} from './sim.js';

class Emitter{
 constructor(){this.handlers=new Map()}
 on(name,fn){if(!this.handlers.has(name))this.handlers.set(name,new Set());this.handlers.get(name).add(fn);return()=>this.handlers.get(name)?.delete(fn)}
 emit(name,data){for(const fn of this.handlers.get(name)||[])fn(data)}
}

export class LocalSession extends Emitter{
 constructor(config={}){
   super();this.closed=false;this.world=createWorld({players:[config]});this.playerId=this.world.humanIds[0];this.acc=0;this.last=performance.now();
   this.timer=setInterval(()=>this.loop(),16);this.snapshotTimer=setInterval(()=>this.pushSnapshot(),33);this.pushSnapshot();
 }
 loop(){if(this.closed)return;const now=performance.now(),frame=Math.min(.08,(now-this.last)/1000);this.last=now;this.acc+=frame;const FIXED=1/30;let guard=0;while(this.acc>=FIXED&&guard++<4){stepWorld(this.world,FIXED);this.acc-=FIXED;for(const e of drainEvents(this.world)){if(!e.recipient||e.recipient===this.playerId)this.emit('event',e)}}}
 pushSnapshot(){if(this.closed)return;this.emit('snapshot',buildSnapshot(this.world,this.playerId))}
 sendInput(input){if(!this.closed)setPlayerInput(this.world,this.playerId,input)}
 sendAction(action){if(!this.closed)applyAction(this.world,this.playerId,action)}
 close(){if(this.closed)return;this.closed=true;clearInterval(this.timer);clearInterval(this.snapshotTimer)}
}

export class WebSocketSession extends Emitter{
 constructor(url,hello){super();this.ws=new WebSocket(url);this.ws.addEventListener('open',()=>this.ws.send(JSON.stringify({type:'hello',...hello})));this.ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.type==='snapshot')this.emit('snapshot',m.data);else if(m.type==='event')this.emit('event',m.data)});this.ws.addEventListener('close',()=>this.emit('close'))}
 sendInput(input){if(this.ws.readyState===1)this.ws.send(JSON.stringify({type:'input',data:input}))}
 sendAction(action){if(this.ws.readyState===1)this.ws.send(JSON.stringify({type:'action',data:action}))}
 close(){this.ws.close()}
}
