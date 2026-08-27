import {TICK_DT} from './protocol.js';
import {createWorld, stepWorld, applyAction, makeSnapshot} from './sim.js';

// Browser-local authoritative simulation. This implements the exact shape the
// future realtime server will expose: input commands in, snapshots/events out.
export class LocalSession {
  constructor(config={}){
    this.world=createWorld(config);
    this.input=null;
    this.acc=0;
    this.last=performance.now()/1000;
    this.listeners={snapshot:[],event:[]};
    this.running=true;
    this.frame=this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }
  on(type,fn){this.listeners[type]?.push(fn);return()=>{this.listeners[type]=this.listeners[type].filter(x=>x!==fn)}}
  emit(type,payload){for(const fn of this.listeners[type]||[])fn(payload)}
  sendInput(input){this.input={...input}}
  sendAction(action){applyAction(this.world,action)}
  frame(nowMs){
    if(!this.running)return;
    const now=nowMs/1000,dt=Math.min(.1,now-this.last);this.last=now;this.acc+=dt;
    while(this.acc>=TICK_DT){stepWorld(this.world,this.input,TICK_DT);this.acc-=TICK_DT}
    this.emit('snapshot',makeSnapshot(this.world));
    if(this.world.events.length){for(const e of this.world.events.splice(0))this.emit('event',e)}
    requestAnimationFrame(this.frame);
  }
  close(){this.running=false}
}

// Future multiplayer adapter. The UI/gameplay code does not need to change;
// only LocalSession is swapped for this transport when a websocket game server exists.
export class WebSocketSession {
  constructor(url,token){
    this.ws=new WebSocket(url);this.listeners={snapshot:[],event:[]};
    this.ws.addEventListener('open',()=>this.ws.send(JSON.stringify({t:'join',token})));
    this.ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.t==='snapshot')this.emit('snapshot',m.data);else if(m.t==='event')this.emit('event',m.data)});
  }
  on(type,fn){this.listeners[type]?.push(fn)}
  emit(type,payload){for(const fn of this.listeners[type]||[])fn(payload)}
  sendInput(input){if(this.ws.readyState===1)this.ws.send(JSON.stringify({t:'input',data:input}))}
  sendAction(action){if(this.ws.readyState===1)this.ws.send(JSON.stringify({t:'action',data:action}))}
  close(){this.ws.close()}
}
