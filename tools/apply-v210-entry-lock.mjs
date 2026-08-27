import fs from 'node:fs';

function patch(path, fn){
  let s=fs.readFileSync(path,'utf8');
  const out=fn(s);
  if(out===s) throw new Error(`no changes: ${path}`);
  fs.writeFileSync(path,out);
}

patch('api/realtime.js',s=>{
  s=s.replace(
    'const CYCLE_MS=10*60*1000,CAPACITY=8,FIXED=1/30,SNAPSHOT_MS=50,STATUS_MS=1000;',
    'const CYCLE_MS=10*60*1000,CAPACITY=8,ENTRY_LOCK_MS=60_000,FIXED=1/30,SNAPSHOT_MS=50,STATUS_MS=1000;'
  );
  s=s.replace(
    /function statusData\(now=Date\.now\(\)\)\{[^\n]+\}/,
    `function statusData(now=Date.now()){const r=currentRoom(now),humans=liveHumans(r),remainingMs=Math.max(0,r.end-now),entryClosed=remainingMs<=ENTRY_LOCK_MS;return{roomId:r.id,roomKey:r.key,humans,ai:liveAI(r),capacity:CAPACITY,endsAt:r.end,remainingMs,entryClosed,joinable:humans<CAPACITY&&!entryClosed}}`
  );
  s=s.replace(
    /function joinCurrent\(ws,config=\{\}\)\{[^\n]+\}/,
    `function joinCurrent(ws,config={}){const d=sm(ws);if(d.playerId)return;const r=currentRoom(),humans=liveHumans(r),remainingMs=Math.max(0,r.end-Date.now());if(humans>=CAPACITY||remainingMs<=ENTRY_LOCK_MS)return safeSend(ws,{type:'join_denied',reason:humans>=CAPACITY?'현재 방이 가득 찼습니다.':'현재 RAID는 종료 1분 전이라 신규 참가가 마감되었습니다.'});reconcileFillerAI(r.world,Math.max(0,CAPACITY-(humans+1)),{onlyRemove:true});const id=addHumanPlayer(r.world,{...config,name:(config.name||'PLAYER').slice(0,18)});d.roomKey=r.key;d.playerId=id;d.fullSent=false;r.byPlayer.set(id,ws);r.clients.add(ws);safeSend(ws,{type:'joined',data:{playerId:id,roomId:r.id,endsAt:r.end}});const snap=buildSnapshot(r.world,id);snap.room=statusData();safeSend(ws,{type:'snapshot',full:true,data:snap});d.fullSent=true}`
  );
  s=s.replace(
    /function sendSnapshots\(r,now\)\{[^\n]+\}/,
    `function sendSnapshots(r,now){if(now-r.lastSnapshot<SNAPSHOT_MS)return;r.lastSnapshot=now;const humans=liveHumans(r),remainingMs=Math.max(0,r.end-now),entryClosed=remainingMs<=ENTRY_LOCK_MS,st={roomId:r.id,roomKey:r.key,humans,ai:liveAI(r),capacity:CAPACITY,endsAt:r.end,remainingMs,entryClosed,joinable:humans<CAPACITY&&!entryClosed};for(const [id,ws] of r.byPlayer){const snap=buildSnapshot(r.world,id);if(!snap)continue;snap.room=st;const d=sm(ws),full=!d.fullSent;if(!full){delete snap.obstacles;delete snap.zones;delete snap.extracts;delete snap.worldW;delete snap.worldH}safeSend(ws,{type:'snapshot',full,data:snap});d.fullSent=true}}`
  );
  if(!s.includes('ENTRY_LOCK_MS=60_000')||!s.includes('신규 참가가 마감'))throw new Error('api entry lock patch incomplete');
  return s;
});

patch('cloudflare/worker.js',s=>{
  s=s.replace('const CAPACITY = 8;','const CAPACITY = 8;\nconst ENTRY_LOCK_MS = 60_000;');
  s=s.replace(
`  status(now = Date.now()) {
    const humans = this.liveHumans();
    return {
      roomId: roomId(this.key),
      roomKey: this.key,
      humans,
      ai: this.liveAI(),
      capacity: CAPACITY,
      endsAt: this.endsAt,
      remainingMs: Math.max(0, this.endsAt - now),
      joinable: humans < CAPACITY && now < this.endsAt
    };
  }`,
`  status(now = Date.now()) {
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
      joinable: humans < CAPACITY && !entryClosed
    };
  }`
  );
  s=s.replace(
`    const humans = this.liveHumans();
    if (humans >= CAPACITY || Date.now() >= this.endsAt) {
      this.send(ws, { type: 'join_denied', reason: humans >= CAPACITY ? '현재 방이 가득 찼습니다.' : '현재 RAID가 종료되었습니다.' });
      return;
    }`,
`    const humans = this.liveHumans();
    const remainingMs = Math.max(0, this.endsAt - Date.now());
    if (humans >= CAPACITY || remainingMs <= ENTRY_LOCK_MS) {
      this.send(ws, { type: 'join_denied', reason: humans >= CAPACITY ? '현재 방이 가득 찼습니다.' : '현재 RAID는 종료 1분 전이라 신규 참가가 마감되었습니다.' });
      return;
    }`
  );
  if(!s.includes('ENTRY_LOCK_MS = 60_000')||!s.includes('entryClosed'))throw new Error('cloudflare entry lock patch incomplete');
  return s;
});

patch('src/main.js',s=>{
  s=s.replace(
    "if(roomState?.joinable===false)return alert('현재 RAID가 8명으로 가득 찼습니다.');",
    "if(roomState?.joinable===false)return alert(roomState?.entryClosed?'현재 RAID는 종료 1분 전이라 신규 참가가 마감되었습니다. 다음 RAID를 기다려주세요.':'현재 RAID가 8명으로 가득 찼습니다.');"
  );
  const start=s.indexOf('function renderRoomStatus(){');
  const end=s.indexOf('function setupRealtime(){',start);
  if(start<0||end<0)throw new Error('renderRoomStatus boundary missing');
  const replacement=`function renderRoomStatus(){
 const raidBtn=$('#raidBtn');
 if(LOCAL_MODE||multiplayerFallback){
   $('#roomIdText').textContent=LOCAL_MODE?'LOCAL':'LOCAL FALLBACK';$('#roomHumans').textContent='1 / 1';$('#roomAi').textContent=snap?.aliveAI??7;$('#roomTime').textContent='--:--';
   const st=$('#roomStateText');st.className='roomState';st.textContent=LOCAL_MODE?'로컬 테스트 모드':'멀티 서버 연결 대기 중 · 현재는 로컬 출격 가능';raidBtn.textContent='현재 RAID 참가';if(!session)raidBtn.disabled=!meta.equipment.primary;return
 }
 const r=roomState;if(!r){$('#roomStateText').textContent=realtime?.connected?'방 정보 수신 중...':'멀티 서버 연결 중...';return}
 const left=Math.max(0,(r.endsAt-Date.now())/1000),m=Math.floor(left/60),sec=Math.floor(left%60),timeText=\`${'${'}String(m).padStart(2,'0')}:${'${'}String(sec).padStart(2,'0')}\`,entryClosed=r.entryClosed===true||left<=60;
 $('#roomIdText').textContent=r.roomId;$('#roomHumans').textContent=\`${'${'}r.humans} / ${'${'}r.capacity}\`;$('#roomAi').textContent=r.ai;$('#roomTime').textContent=timeText;
 const st=$('#roomStateText');
 if(entryClosed){st.className='roomState full';st.textContent=\`신규 참가 마감 · 다음 RAID ${'${'}timeText} 후 시작\`;raidBtn.textContent='신규 참가 마감';if(!session)raidBtn.disabled=true;return}
 if(!r.joinable){st.className='roomState full';st.textContent='현재 방 FULL · 자리가 비면 참가 가능합니다.';raidBtn.textContent='현재 RAID FULL';if(!session)raidBtn.disabled=true;return}
 st.className='roomState live';st.textContent='중간 참가 가능 · 빈 인간 슬롯은 AI가 보충합니다.';raidBtn.textContent='현재 RAID 참가';if(!session)raidBtn.disabled=!meta.equipment.primary
}
`;
  s=s.slice(0,start)+replacement+s.slice(end);
  if(!s.includes("left<=60")||!s.includes('신규 참가 마감'))throw new Error('client entry lock patch incomplete');
  return s;
});
