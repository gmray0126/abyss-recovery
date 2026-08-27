import {
  createWorld,stepWorld,setPlayerInput,applyAction,buildSnapshot,drainEvents,
  addHumanPlayer,removeHumanPlayer,reconcileFillerAI
} from '../src/sim.js';

const CYCLE_MS=10*60*1000;
const CAPACITY=8;
const FIXED=1/30;
const SNAPSHOT_MS=33;
const STATUS_MS=1000;
const shared=globalThis.__DEAD_DROP_RT__||(globalThis.__DEAD_DROP_RT__={rooms:new Map(),sockets:new Set(),timer:null,lastTick:Date.now(),lastStatus:0});

const safeSend=(ws,msg)=>{try{ws.send(JSON.stringify(msg))}catch{}};
const roomKey=(now=Date.now())=>Math.floor(now/CYCLE_MS);
const roomId=k=>`IND-${String(k).slice(-6)}`;
const meta=ws=>ws.data||{};

function createRoom(key){const start=key*CYCLE_MS,end=start+CYCLE_MS,world=createWorld({players:[],aiCount:CAPACITY});world.timeLeft=Math.max(0,(end-Date.now())/1000);const r={key,id:roomId(key),start,end,world,clients:new Set(),byPlayer:new Map(),nextAiFill:start+60_000,lastSnapshot:0,ended:false};shared.rooms.set(key,r);return r}
function currentRoom(now=Date.now()){const k=roomKey(now);return shared.rooms.get(k)||createRoom(k)}
function liveHumans(r){let n=0;for(const id of r.byPlayer.keys()){const a=r.world.actors.find(x=>x.id===id);if(a&&!a.dead&&!r.world.results[id])n++}return n}
function liveAI(r){return r.world.actors.filter(a=>a.kind!=='player'&&!a.dead).length}
function statusData(now=Date.now()){const r=currentRoom(now),humans=liveHumans(r),ai=liveAI(r);return{roomId:r.id,roomKey:r.key,humans,ai,capacity:CAPACITY,endsAt:r.end,remainingMs:Math.max(0,r.end-now),joinable:humans<CAPACITY}}
function broadcastStatus(now=Date.now()){const data=statusData(now);for(const ws of shared.sockets)safeSend(ws,{type:'status',data})}
function cleanupPlayer(ws,{drop=true}={}){const d=meta(ws),key=d.roomKey,id=d.playerId;if(key==null||!id)return;const r=shared.rooms.get(key);if(r){const hadResult=!!r.world.results[id];removeHumanPlayer(r.world,id,{drop:drop&&!hadResult});r.byPlayer.delete(id);r.clients.delete(ws)}d.roomKey=null;d.playerId=null;d.fullSent=false}
function joinCurrent(ws,config={}){const d=meta(ws);if(d.playerId)return;const r=currentRoom(),humans=liveHumans(r);if(humans>=CAPACITY){safeSend(ws,{type:'join_denied',reason:'현재 방이 가득 찼습니다.'});return}reconcileFillerAI(r.world,Math.max(0,CAPACITY-(humans+1)),{onlyRemove:true});const id=addHumanPlayer(r.world,{...config,name:(config.name||'PLAYER').slice(0,18)});d.roomKey=r.key;d.playerId=id;d.fullSent=false;r.byPlayer.set(id,ws);r.clients.add(ws);safeSend(ws,{type:'joined',data:{playerId:id,roomId:r.id,endsAt:r.end}});const snap=buildSnapshot(r.world,id);snap.room=statusData();safeSend(ws,{type:'snapshot',full:true,data:snap});d.fullSent=true}
function handleMessage(ws,raw){let m;try{m=JSON.parse(String(raw))}catch{return}if(m.type==='watch')return safeSend(ws,{type:'status',data:statusData()});if(m.type==='join')return joinCurrent(ws,m.data||{});if(m.type==='leave'){cleanupPlayer(ws,{drop:true});safeSend(ws,{type:'left'});return}const d=meta(ws),r=shared.rooms.get(d.roomKey),id=d.playerId;if(!r||!id)return;if(m.type==='input')setPlayerInput(r.world,id,m.data||{});else if(m.type==='action')applyAction(r.world,id,m.data||{})}
function sendEvents(r){for(const e of drainEvents(r.world)){if(e.recipient){const ws=r.byPlayer.get(e.recipient);if(ws)safeSend(ws,{type:'event',data:e})}else for(const ws of r.clients)safeSend(ws,{type:'event',data:e})}}
function sendSnapshots(r,now){if(now-r.lastSnapshot<SNAPSHOT_MS)return;r.lastSnapshot=now;const humans=liveHumans(r),st={roomId:r.id,roomKey:r.key,humans,ai:liveAI(r),capacity:CAPACITY,endsAt:r.end,remainingMs:Math.max(0,r.end-now),joinable:humans<CAPACITY};for(const [id,ws] of r.byPlayer){const snap=buildSnapshot(r.world,id);if(!snap)continue;snap.room=st;const d=meta(ws),full=!d.fullSent;if(!full){delete snap.obstacles;delete snap.zones;delete snap.extracts;delete snap.worldW;delete snap.worldH}safeSend(ws,{type:'snapshot',full,data:snap});d.fullSent=true}}
function tick(){const now=Date.now(),elapsed=Math.min(.1,Math.max(0,(now-shared.lastTick)/1000));shared.lastTick=now;currentRoom(now);for(const [key,r] of shared.rooms){const remaining=Math.max(0,(r.end-now)/1000);r.world.timeLeft=remaining;if(remaining>0){r._acc=(r._acc||0)+elapsed;let guard=0;while(r._acc>=FIXED&&guard++<4){stepWorld(r.world,FIXED);r._acc-=FIXED;r.world.timeLeft=Math.max(0,(r.end-Date.now())/1000)}}else if(!r.ended){r.world.timeLeft=0;stepWorld(r.world,.001);r.ended=true}if(remaining>0&&now>=r.nextAiFill){reconcileFillerAI(r.world,Math.max(0,CAPACITY-liveHumans(r)));while(r.nextAiFill<=now)r.nextAiFill+=60_000}sendEvents(r);sendSnapshots(r,now);if(now>r.end+30_000&&r.byPlayer.size===0)shared.rooms.delete(key)}if(now-shared.lastStatus>=STATUS_MS){shared.lastStatus=now;broadcastStatus(now)}}
if(!shared.timer)shared.timer=setInterval(tick,16);

Bun.serve({
  fetch(request,server){
    if(server.upgrade(request,{data:{roomKey:null,playerId:null,fullSent:false}}))return;
    return Response.json({ok:false,message:'WebSocket upgrade required',room:statusData()},{status:426});
  },
  websocket:{
    open(ws){shared.sockets.add(ws);safeSend(ws,{type:'hello',data:{protocol:1,serverTime:Date.now()}});safeSend(ws,{type:'status',data:statusData()})},
    message(ws,message){handleMessage(ws,message)},
    close(ws){cleanupPlayer(ws,{drop:true});shared.sockets.delete(ws)}
  }
});
