from pathlib import Path

def rep(s,a,b,label):
    if a not in s: raise SystemExit(f'missing: {label}')
    return s.replace(a,b,1)

p=Path('src/main.js');s=p.read_text(encoding='utf-8')
s=rep(s,
"const LOCAL_MODE=new URLSearchParams(location.search).has('local');const WS_URL=`${location.protocol==='https:'?'wss':'ws'}://${location.host}/api/realtime`;let realtime=null,roomState=null,pendingDeparture=null;",
"const LOCAL_MODE=new URLSearchParams(location.search).has('local');const WS_URL=`${location.protocol==='https:'?'wss':'ws'}://${location.host}/api/realtime`;let realtime=null,roomState=null,pendingDeparture=null,multiplayerAvailable=false,multiplayerFallback=false;",
'network globals')
s=rep(s,
"$('#callsignInput').value=meta.callsign;$('#raidBtn').disabled=!meta.equipment.primary||(!LOCAL_MODE&&(!realtime?.connected||roomState?.joinable===false));",
"$('#callsignInput').value=meta.callsign;$('#raidBtn').disabled=!meta.equipment.primary||(!LOCAL_MODE&&!multiplayerFallback&&roomState?.joinable===false);",
'raid button gate')
s=rep(s,
"function startRaid(){if(!meta.equipment.primary)return;ensureAudio();const departure={name:meta.callsign||'PLAYER',equipment:cp(meta.equipment),inventory:cp(meta.inventory),visionLevel:meta.visionLevel};if(LOCAL_MODE){const local=new LocalSession(departure);local.on('snapshot',processSnapshot);local.on('event',handleEvent);enterRaid(local);return}if(!realtime?.connected)return alert('멀티 서버에 연결 중입니다. 잠시 후 다시 시도해주세요.');if(roomState?.joinable===false)return alert('현재 RAID가 8명으로 가득 찼습니다.');pendingDeparture=departure;$('#raidBtn').disabled=true;$('#roomStateText').textContent='현재 RAID 참가 요청 중...';realtime.join(departure)}",
"function startRaid(){if(!meta.equipment.primary)return;ensureAudio();const departure={name:meta.callsign||'PLAYER',equipment:cp(meta.equipment),inventory:cp(meta.inventory),visionLevel:meta.visionLevel};if(LOCAL_MODE||multiplayerFallback||!realtime?.connected){const local=new LocalSession(departure);local.on('snapshot',processSnapshot);local.on('event',handleEvent);enterRaid(local);return}if(roomState?.joinable===false)return alert('현재 RAID가 8명으로 가득 찼습니다.');pendingDeparture=departure;$('#raidBtn').disabled=true;$('#roomStateText').textContent='현재 RAID 참가 요청 중...';realtime.join(departure)}",
'start raid fallback')
start=s.find('function renderRoomStatus(){')
end=s.find('\nfunction setupRealtime(){',start)
if start<0 or end<0: raise SystemExit('renderRoomStatus block')
new="""function renderRoomStatus(){if(LOCAL_MODE||multiplayerFallback){$('#roomIdText').textContent=LOCAL_MODE?'LOCAL':'LOCAL FALLBACK';$('#roomHumans').textContent='1 / 1';$('#roomAi').textContent=snap?.aliveAI??7;$('#roomTime').textContent='--:--';const st=$('#roomStateText');st.className='roomState';st.textContent=LOCAL_MODE?'로컬 테스트 모드':'멀티 서버 연결 대기 중 · 현재는 로컬 출격 가능';if(!session)$('#raidBtn').disabled=!meta.equipment.primary;return}const r=roomState;if(!r){$('#roomStateText').textContent=realtime?.connected?'방 정보 수신 중...':'멀티 서버 연결 중...';return}const left=Math.max(0,(r.endsAt-Date.now())/1000),m=Math.floor(left/60),sec=Math.floor(left%60);$('#roomIdText').textContent=r.roomId;$('#roomHumans').textContent=`${r.humans} / ${r.capacity}`;$('#roomAi').textContent=r.ai;$('#roomTime').textContent=`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;const st=$('#roomStateText');st.className='roomState '+(r.joinable?'live':'full');st.textContent=r.joinable?'중간 참가 가능 · 빈 인간 슬롯은 AI가 보충합니다.':'현재 방 FULL · 자리가 비면 참가 가능합니다.';if(!session)$('#raidBtn').disabled=!meta.equipment.primary||!r.joinable}"""
s=s[:start]+new+s[end:]
start=s.find('function setupRealtime(){')
end=s.find('\nsetInterval(renderRoomStatus,250);',start)
if start<0 or end<0: raise SystemExit('setupRealtime block')
new="""function setupRealtime(){if(LOCAL_MODE){multiplayerFallback=true;$('#netText').textContent='LOCAL TEST MODE';return}realtime=new WebSocketSession(WS_URL);const fallbackTimer=setTimeout(()=>{if(!multiplayerAvailable&&!session){multiplayerFallback=true;$('#netText').textContent='MULTIPLAYER OFFLINE · LOCAL';renderRoomStatus();renderLobby()}},2500);realtime.on('connection',x=>{if(x.connected){clearTimeout(fallbackTimer);multiplayerAvailable=true;multiplayerFallback=false;$('#netText').textContent='MULTIPLAYER CONNECTED'}else{$('#netText').textContent=multiplayerFallback?'MULTIPLAYER OFFLINE · LOCAL':'MULTIPLAYER RECONNECTING'}renderRoomStatus();renderLobby()});realtime.on('status',r=>{roomState=r;multiplayerAvailable=true;multiplayerFallback=false;renderRoomStatus();renderLobby()});realtime.on('joined',()=>{if(!pendingDeparture)return;pendingDeparture=null;enterRaid(realtime)});realtime.on('join_denied',m=>{pendingDeparture=null;alert(m.reason||'현재 RAID에 참가할 수 없습니다.');renderLobby();renderRoomStatus()});realtime.on('snapshot',s=>{if(session===realtime)processSnapshot(s)});realtime.on('event',e=>{if(session===realtime)handleEvent(e)});realtime.on('disconnect',()=>{if(session===realtime&&!lastResultHandled){lastResultHandled=true;session=null;if(document.pointerLockElement)document.exitPointerLock?.();showResult(false,{reason:'멀티 서버 연결 끊김',kills:snap?.player?.kills||0,lootValue:0})}})}"""
s=s[:start]+new+s[end:]
p.write_text(s,encoding='utf-8')
print('fallback patched')
