from pathlib import Path

def rep(s,a,b,label):
    if a not in s:
        raise SystemExit(f'missing target: {label}')
    return s.replace(a,b,1)

# --- sim.js: dynamic humans + AI filler slots ---
p=Path('src/sim.js'); s=p.read_text(encoding='utf-8')
start=s.find('export function createWorld(config={}){')
end=s.find('\n\nexport function setPlayerInput',start)
if start<0 or end<0: raise SystemExit('createWorld block not found')
new_world=r'''function pickHumanSpawn(w){
 const alive=w.actors.filter(a=>!a.dead);let best=SPAWNS[0],score=-1;
 for(const s of SPAWNS){if(blocked(w,s.x,s.y,15))continue;const nearest=alive.length?Math.min(...alive.map(a=>distXY(s.x,s.y,a.x,a.y))):99999;if(nearest>score){score=nearest;best=s}}
 return best
}
function spawnFillerAI(w,index=0){
 const pos=PATROLS[(index+(w.aiSpawnSeq||0))%PATROLS.length];w.aiSpawnSeq=(w.aiSpawnSeq||0)+1;
 const pmc=(w.aiSpawnSeq%4===0),kind=pmc?'pmc':'scav',guns=pmc?['ar','dmr','smg']:['smg','shotgun','pistol','ar'];
 const primary=weaponItem(guns[w.aiSpawnSeq%guns.length],pmc?1.02:.92),inventory=[];if(Math.random()<.38)inventory.push(gearItem('med'));if(pmc&&Math.random()<.45)inventory.push(gearItem('grenade'));
 const a=makeActor(kind,pos.x+(Math.random()-.5)*80,pos.y+(Math.random()-.5)*80,pmc?`filler-pmc-${w.aiSpawnSeq}`:'filler-scav',{name:pmc?`RAIDER-${60+w.aiSpawnSeq}`:`SCAV-${60+w.aiSpawnSeq}`,primary,inventory});a.filler=true;w.actors.push(a);return a
}
export function addHumanPlayer(w,pc={}){
 const s=pickHumanSpawn(w),team=`human-${uid('team')}`,a=makeActor('player',s.x,s.y,team,{name:pc.name||'PLAYER',primary:pc.equipment?.primary,secondary:pc.equipment?.secondary,armor:pc.equipment?.armor,helmet:pc.equipment?.helmet,backpack:pc.equipment?.backpack,inventory:pc.inventory||[],visionLevel:pc.visionLevel||3});
 w.actors.push(a);w.humanIds.push(a.id);w.inputs[a.id]=emptyInput();return a.id
}
export function removeHumanPlayer(w,id,{drop=true}={}){
 const a=getActor(w,id);if(!a)return false;if(drop&&!a.dead&&!w.results[id])killActor(w,a,null);w.humanIds=w.humanIds.filter(x=>x!==id);delete w.inputs[id];delete w.openContainers[id];delete w.interactions[id];delete w.results[id];w.actors=w.actors.filter(x=>x.id!==id);return true
}
export function reconcileFillerAI(w,target,{onlyRemove=false}={}){
 target=Math.max(0,target|0);let ai=w.actors.filter(a=>a.kind!=='player'&&!a.dead);
 if(ai.length>target){const humans=w.actors.filter(a=>a.kind==='player'&&!a.dead);ai.sort((a,b)=>{const da=humans.length?Math.min(...humans.map(h=>dist(a,h))):0,db=humans.length?Math.min(...humans.map(h=>dist(b,h))):0;return db-da});const remove=new Set(ai.slice(0,ai.length-target).map(a=>a.id));w.actors=w.actors.filter(a=>!remove.has(a.id));ai=ai.filter(a=>!remove.has(a.id))}
 if(!onlyRemove&&ai.length<target)for(let i=ai.length;i<target;i++)spawnFillerAI(w,i);return w.actors.filter(a=>a.kind!=='player'&&!a.dead).length
}

export function createWorld(config={}){
 const players=config.players||[{}];const w={time:0,timeLeft:18*60,obstacles:MAP_OBSTACLES.map(copy),doors:DOOR_DEFS.map(d=>({...d,open:false})),zones:ZONES,extracts:EXTRACTS,actors:[],humanIds:[],bullets:[],grenades:[],crates:[],corpses:[],sounds:[],events:[],results:{},openContainers:{},interactions:{},inputs:{},aiSpawnSeq:0};
 players.forEach(pc=>addHumanPlayer(w,pc));
 if(Number.isFinite(config.aiCount))reconcileFillerAI(w,config.aiCount);else{
  const pmcLoads=[{primary:weaponItem('ar',1.05),inventory:[gearItem('med'),gearItem('grenade')]},{primary:weaponItem('dmr',1.04),secondary:weaponItem('pistol'),inventory:[gearItem('med')]}];
  const pmcPos=[{x:2500,y:1570},{x:3500,y:720}];pmcPos.forEach((q,i)=>w.actors.push(makeActor('pmc',q.x,q.y,`pmc-${i}`,{name:`RAIDER-${21+i}`,...pmcLoads[i]})));
  const scavPos=[{x:630,y:670},{x:2100,y:860},{x:820,y:2220},{x:2350,y:2210},{x:3590,y:2280}];const scavGuns=['smg','shotgun','pistol','smg','shotgun'];scavPos.forEach((q,i)=>w.actors.push(makeActor('scav',q.x,q.y,'scav',{name:`SCAV-${40+i}`,primary:weaponItem(scavGuns[i],.92),inventory:Math.random()<.4?[gearItem('med')]:[]})));
 }
 CRATES.forEach((q,i)=>w.crates.push({id:`crate-${i}`,kind:'crate',x:q.x,y:q.y,r:19,opened:false,items:rollCrate(i)}));return w
}'''
s=s[:start]+new_world+s[end:]
p.write_text(s,encoding='utf-8')

# --- net.js: persistent lobby/game WebSocket ---
p=Path('src/net.js'); s=p.read_text(encoding='utf-8')
start=s.find('export class WebSocketSession extends Emitter{')
if start<0: raise SystemExit('WebSocketSession not found')
s=s[:start]+r'''export class WebSocketSession extends Emitter{
 constructor(url){super();this.url=url;this.ws=null;this.manual=false;this.joined=false;this.pendingJoin=null;this.lastSnapshot=null;this.reconnectTimer=null;this.connect()}
 get connected(){return this.ws?.readyState===1}
 connect(){if(this.manual)return;this.ws=new WebSocket(this.url);this.ws.addEventListener('open',()=>{this.emit('connection',{connected:true});this.ws.send(JSON.stringify({type:'watch'}));if(this.pendingJoin)this._sendJoin()});this.ws.addEventListener('message',e=>{let m;try{m=JSON.parse(e.data)}catch{return}if(m.type==='status')this.emit('status',m.data);else if(m.type==='joined'){this.joined=true;this.emit('joined',m.data)}else if(m.type==='join_denied'){this.pendingJoin=null;this.emit('join_denied',m)}else if(m.type==='snapshot'){this.lastSnapshot=m.full||!this.lastSnapshot?m.data:{...this.lastSnapshot,...m.data};this.emit('snapshot',this.lastSnapshot)}else if(m.type==='event')this.emit('event',m.data);else if(m.type==='left'){this.joined=false;this.lastSnapshot=null;this.emit('left')}});this.ws.addEventListener('close',()=>{const wasJoined=this.joined;this.joined=false;this.emit('connection',{connected:false});if(wasJoined)this.emit('disconnect');if(!this.manual){clearTimeout(this.reconnectTimer);this.reconnectTimer=setTimeout(()=>this.connect(),1000)}});this.ws.addEventListener('error',()=>{})}
 _sendJoin(){if(this.connected&&this.pendingJoin)this.ws.send(JSON.stringify({type:'join',data:this.pendingJoin}))}
 join(config){this.pendingJoin=config;if(this.connected)this._sendJoin()}
 leave(){this.pendingJoin=null;if(this.connected)this.ws.send(JSON.stringify({type:'leave'}));this.joined=false;this.lastSnapshot=null}
 sendInput(input){if(this.connected&&this.joined)this.ws.send(JSON.stringify({type:'input',data:input}))}
 sendAction(action){if(this.connected&&this.joined)this.ws.send(JSON.stringify({type:'action',data:action}))}
 close(){this.manual=true;clearTimeout(this.reconnectTimer);this.ws?.close()}
}'''
p.write_text(s,encoding='utf-8')

# --- index.html ---
p=Path('index.html'); s=p.read_text(encoding='utf-8')
s=s.replace('<title>DEAD DROP // v2.1 Extraction Shooter</title>','<title>DEAD DROP // v2.5 Multiplayer Extraction</title>')
s=s.replace('DARK INDUSTRIAL EXTRACTION SHOOTER // SERVER-AUTH READY','DARK INDUSTRIAL EXTRACTION SHOOTER // LIVE RAID NETWORK')
s=s.replace('<div class="net"><span id="netDot"></span><span id="netText">LOCAL AUTHORITATIVE SIM</span></div>','<div class="net"><span id="netDot"></span><span id="netText">MULTIPLAYER CONNECTING</span></div>')
needle='''        <button id="raidBtn" class="primary big">RAID 출격</button>'''
room='''        <div class="roomCard">
          <div class="roomHead"><b>현재 멀티 레이드</b><span id="roomIdText">연결 중</span></div>
          <div class="roomStats"><span>인간 <b id="roomHumans">- / 8</b></span><span>AI <b id="roomAi">-</b></span><span>남은 시간 <b id="roomTime">--:--</b></span></div>
          <label class="callsign">콜사인 <input id="callsignInput" maxlength="18" placeholder="PLAYER"></label>
          <div id="roomStateText" class="roomState">멀티 서버에 연결 중입니다.</div>
        </div>
        <button id="raidBtn" class="primary big">현재 RAID 참가</button>'''
if needle not in s: raise SystemExit('raid button html not found')
s=s.replace(needle,room,1)
s=s.replace('대형 야간 산업지대 · AI 7명 · 엄폐물 증설 · 상자 채널링 루팅 · 수류탄 · 방향성 소리 표시 · 시야 원뿔 · 총기 타격감 보강','10분 실시간 RAID · 인간 최대 8명 · AI 빈자리 보충 · 중간 참가/탈출 · WebSocket 실시간 동기화')
p.write_text(s,encoding='utf-8')

# --- styles.css ---
p=Path('styles.css'); s=p.read_text(encoding='utf-8')
if '.roomCard{' not in s:s+='''\n.roomCard{margin:10px 0;padding:10px 12px;border:1px solid #33434a;background:#101719;border-radius:5px}.roomHead,.roomStats{display:flex;justify-content:space-between;gap:10px;align-items:center}.roomHead span{color:#8fd0df;font-family:monospace}.roomStats{margin-top:8px;padding:7px 0;border-top:1px solid #263338;border-bottom:1px solid #263338;font-size:12px}.callsign{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:12px}.callsign input{flex:1;background:#0b1012;border:1px solid #34454c;color:#d9e3e5;padding:6px 8px;border-radius:3px}.roomState{margin-top:7px;color:#89999d;font-size:11px}.roomState.live{color:#8ecaa0}.roomState.full{color:#d49a80}\n'''
p.write_text(s,encoding='utf-8')

# --- main.js ---
p=Path('src/main.js'); s=p.read_text(encoding='utf-8')
s=rep(s,"import {LocalSession} from './net.js';","import {LocalSession,WebSocketSession} from './net.js';",'network import')
s=rep(s,"const defaultMeta=()=>({money:3200,visionLevel:3,equipment:","const defaultMeta=()=>({money:3200,visionLevel:3,callsign:`P-${Math.floor(1000+Math.random()*9000)}`,equipment:",'callsign meta')
s=rep(s,"if(!meta.equipment)meta.equipment=defaultMeta().equipment;if(!Array.isArray(meta.inventory))meta.inventory=[];if(!Array.isArray(meta.stash))meta.stash=[];","if(!meta.equipment)meta.equipment=defaultMeta().equipment;if(!Array.isArray(meta.inventory))meta.inventory=[];if(!Array.isArray(meta.stash))meta.stash=[];if(!meta.callsign)meta.callsign=`P-${Math.floor(1000+Math.random()*9000)}`;",'callsign migration')
s=rep(s," $('#raidBtn').disabled=!meta.equipment.primary;"," $('#callsignInput').value=meta.callsign;$('#raidBtn').disabled=!meta.equipment.primary||(!LOCAL_MODE&&(!realtime?.connected||roomState?.joinable===false));",'raid button network gate')
s=rep(s,"$('#visionLevel').addEventListener('input',e=>{meta.visionLevel=Number(e.target.value);$('#visionLevelText').textContent=meta.visionLevel;save()});","$('#visionLevel').addEventListener('input',e=>{meta.visionLevel=Number(e.target.value);$('#visionLevelText').textContent=meta.visionLevel;save()});$('#callsignInput').addEventListener('input',e=>{meta.callsign=(e.target.value||'PLAYER').slice(0,18);save()});",'callsign listener')
old="let session=null,snap=null,input=emptyInput(),keys=new Set(),mouse={x:640,y:360},lastResultHandled=false,audioCtx=null;"
new="const LOCAL_MODE=new URLSearchParams(location.search).has('local');const WS_URL=`${location.protocol==='https:'?'wss':'ws'}://${location.host}/api/realtime`;let realtime=null,roomState=null,pendingDeparture=null;\nlet session=null,snap=null,input=emptyInput(),keys=new Set(),mouse={x:640,y:360},lastResultHandled=false,audioCtx=null;"
s=rep(s,old,new,'network globals')
start=s.find('function startRaid(){')
end=s.find("\n$('#raidBtn').onclick=startRaid;",start)
if start<0 or end<0: raise SystemExit('startRaid block not found')
newstart=r'''function processSnapshot(s){snap=s;if(s.room)roomState=s.room;if(s.openContainer&&document.pointerLockElement===canvas)document.exitPointerLock?.();renderHUD();renderRoomStatus();if(s.result&&!lastResultHandled)handleResult(s.result)}
function enterRaid(activeSession){meta.equipment={primary:null,secondary:null,armor:null,helmet:null,backpack:null};meta.inventory=[];save();renderLobby();$('#lobby').classList.add('hidden');$('#raid').classList.remove('hidden');lastResultHandled=false;killFeed=[];soundMarks=[];fx=[];hudBagKey='';hudEqKey='';hudLootKey='';input=emptyInput();session=activeSession;canvas.focus()}
function startRaid(){if(!meta.equipment.primary)return;ensureAudio();const departure={name:meta.callsign||'PLAYER',equipment:cp(meta.equipment),inventory:cp(meta.inventory),visionLevel:meta.visionLevel};if(LOCAL_MODE){const local=new LocalSession(departure);local.on('snapshot',processSnapshot);local.on('event',handleEvent);enterRaid(local);return}if(!realtime?.connected)return alert('멀티 서버에 연결 중입니다. 잠시 후 다시 시도해주세요.');if(roomState?.joinable===false)return alert('현재 RAID가 8명으로 가득 찼습니다.');pendingDeparture=departure;$('#raidBtn').disabled=true;$('#roomStateText').textContent='현재 RAID 참가 요청 중...';realtime.join(departure)}'''
s=s[:start]+newstart+s[end:]
old="function handleResult(r){lastResultHandled=true;if(document.pointerLockElement)document.exitPointerLock?.();input.shoot=false;keys.clear();session?.close();session=null;"
new="function handleResult(r){lastResultHandled=true;if(document.pointerLockElement)document.exitPointerLock?.();input.shoot=false;keys.clear();if(session===realtime)realtime.leave();else session?.close();session=null;"
s=rep(s,old,new,'result leave')
old="$('#abandonBtn').onclick=()=>{if(!session)return;if(confirm('출격 장비와 전리품을 모두 포기할까요?')){if(document.pointerLockElement)document.exitPointerLock?.();input.shoot=false;keys.clear();session.close();session=null;"
new="$('#abandonBtn').onclick=()=>{if(!session)return;if(confirm('출격 장비와 전리품을 모두 포기할까요?')){if(document.pointerLockElement)document.exitPointerLock?.();input.shoot=false;keys.clear();if(session===realtime)realtime.leave();else session.close();session=null;"
s=rep(s,old,new,'abandon leave')
s=rep(s,"function actorColor(a){if(a.id===snap.playerId)return'#76b8cf';return a.kind==='pmc'?'#aba89a':'#948b6d'}","function actorColor(a){if(a.id===snap.playerId)return'#76b8cf';if(a.kind==='player')return'#c87561';return a.kind==='pmc'?'#aba89a':'#948b6d'}",'remote player color')
# Insert realtime setup before eventOnScreen
marker='function eventOnScreen(e){'
pos=s.find(marker)
if pos<0: raise SystemExit('event marker missing')
setup=r'''function renderRoomStatus(){if(LOCAL_MODE){$('#roomIdText').textContent='LOCAL';$('#roomHumans').textContent='1 / 1';$('#roomAi').textContent=snap?.aliveAI??7;$('#roomTime').textContent='--:--';$('#roomStateText').textContent='로컬 테스트 모드';return}const r=roomState;if(!r){$('#roomStateText').textContent=realtime?.connected?'방 정보 수신 중...':'멀티 서버 연결 중...';return}const left=Math.max(0,(r.endsAt-Date.now())/1000),m=Math.floor(left/60),sec=Math.floor(left%60);$('#roomIdText').textContent=r.roomId;$('#roomHumans').textContent=`${r.humans} / ${r.capacity}`;$('#roomAi').textContent=r.ai;$('#roomTime').textContent=`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;const st=$('#roomStateText');st.className='roomState '+(r.joinable?'live':'full');st.textContent=r.joinable?'중간 참가 가능 · 빈 인간 슬롯은 AI가 보충합니다.':'현재 방 FULL · 자리가 비면 참가 가능합니다.';if(!session)$('#raidBtn').disabled=!meta.equipment.primary||!realtime?.connected||!r.joinable}
function setupRealtime(){if(LOCAL_MODE){$('#netText').textContent='LOCAL TEST MODE';return}realtime=new WebSocketSession(WS_URL);realtime.on('connection',x=>{$('#netText').textContent=x.connected?'MULTIPLAYER CONNECTED':'MULTIPLAYER RECONNECTING';renderRoomStatus();renderLobby()});realtime.on('status',r=>{roomState=r;renderRoomStatus()});realtime.on('joined',()=>{if(!pendingDeparture)return;pendingDeparture=null;enterRaid(realtime)});realtime.on('join_denied',m=>{pendingDeparture=null;alert(m.reason||'현재 RAID에 참가할 수 없습니다.');renderLobby();renderRoomStatus()});realtime.on('snapshot',s=>{if(session===realtime)processSnapshot(s)});realtime.on('event',e=>{if(session===realtime)handleEvent(e)});realtime.on('disconnect',()=>{if(session===realtime&&!lastResultHandled){lastResultHandled=true;session=null;if(document.pointerLockElement)document.exitPointerLock?.();showResult(false,{reason:'멀티 서버 연결 끊김',kills:snap?.player?.kills||0,lootValue:0})}})}
setInterval(renderRoomStatus,250);

'''
s=s[:pos]+setup+s[pos:]
# Initialize realtime before final render loop call
needle='ensureBasicPistol();renderLobby();requestAnimationFrame(draw);'
if needle not in s: raise SystemExit('final init not found')
s=s.replace(needle,'ensureBasicPistol();setupRealtime();renderLobby();renderRoomStatus();requestAnimationFrame(draw);',1)
p.write_text(s,encoding='utf-8')
print('v2.5 multiplayer patch applied')
