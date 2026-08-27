import fs from 'node:fs';

function update(path,fn){
  const before=fs.readFileSync(path,'utf8');
  const after=fn(before);
  if(after===before)throw new Error(`no change: ${path}`);
  fs.writeFileSync(path,after);
}
function mustReplace(s,from,to,label){
  if(!s.includes(from))throw new Error(`missing ${label}`);
  return s.replace(from,to);
}
function replaceBetween(s,start,end,replacement,label){
  const a=s.indexOf(start);if(a<0)throw new Error(`missing start ${label}`);
  const b=s.indexOf(end,a+start.length);if(b<0)throw new Error(`missing end ${label}`);
  return s.slice(0,a)+replacement+s.slice(b);
}

update('src/protocol.js',s=>mustReplace(
  s,
  " SWAP_WEAPON:'swap_weapon',GRENADE:'grenade',USE_MED:'use_med'",
  " SWAP_WEAPON:'swap_weapon',GRENADE:'grenade',USE_MED:'use_med',DISCARD_ITEM:'discard_item'",
  'discard action protocol'
));

update('src/sim.js',s=>{
  const interaction=`function updateInteraction(w,p,dt){const inp=w.inputs[p.id]||emptyInput();const openId=w.openContainers[p.id];if(openId){const c=getContainer(w,openId);if(!c||dist(p,c)>145)delete w.openContainers[p.id]}\n if(!inp.interact){p.interactLatch=false;delete w.interactions[p.id];return}\n // Nearby loot always wins over a door so a corpse/crate beside a doorway is usable.\n const c=nearContainer(w,p);if(c){\n  p.interactLatch=true;\n  if(c.opened||c.kind==='corpse'){w.openContainers[p.id]=c.id;delete w.interactions[p.id];return}\n  let q=w.interactions[p.id];if(!q||q.kind!=='container'||q.targetId!==c.id)q=w.interactions[p.id]={kind:'container',targetId:c.id,progress:0,duration:1.15};q.progress+=dt;if(q.progress>=q.duration){c.opened=true;w.openContainers[p.id]=c.id;delete w.interactions[p.id];emit(w,'container_open',{recipient:p.id,id:c.id})}return\n }\n const ext=nearExtract(w,p);if(ext){let q=w.interactions[p.id];if(!q||q.kind!=='extract'||q.targetId!==ext.id)q=w.interactions[p.id]={kind:'extract',targetId:ext.id,progress:0,duration:3};q.progress+=dt;if(q.progress>=q.duration){const loot=p.inventory.reduce((s,i)=>s+(i.value||0),0);w.results[p.id]={status:'extracted',reason:ext.name,kills:p.kills,lootValue:loot,equipment:copy(p.gear),items:copy(p.inventory)};emit(w,'extract',{recipient:p.id,name:ext.name})}return}\n const door=nearDoor(w,p);if(door){if(!p.interactLatch){if(door.open&&doorOccupied(w,door)){emit(w,'door_blocked',{recipient:p.id,id:door.id,name:door.name})}else{door.open=!door.open;emit(w,'door',{recipient:p.id,id:door.id,name:door.name,open:door.open});addSound(w,door.x+door.w/2,door.y+door.h/2,180,'door',p.id)}}p.interactLatch=true;delete w.interactions[p.id];delete w.openContainers[p.id];return}\n p.interactLatch=true;delete w.interactions[p.id]\n}\n\n`;
  s=replaceBetween(s,'function updateInteraction(w,p,dt){','function applyBagEquip',interaction,'interaction priority');
  const old="else if(action.type===ACTIONS.SWAP_WEAPON){const slot=action.slot==='secondary'?'secondary':'primary';if(p.gear[slot]){p.weaponSlot=slot;p.reload=0;emit(w,'equip',{recipient:id,item:p.gear[slot].name})}}else if(action.type===ACTIONS.GRENADE)";
  const neu="else if(action.type===ACTIONS.SWAP_WEAPON){const slot=action.slot==='secondary'?'secondary':'primary';if(p.gear[slot]){p.weaponSlot=slot;p.reload=0;emit(w,'equip',{recipient:id,item:p.gear[slot].name})}}else if(action.type===ACTIONS.DISCARD_ITEM){const i=p.inventory.findIndex(x=>x.id===action.itemId);if(i>=0){const [it]=p.inventory.splice(i,1);emit(w,'discard',{recipient:id,item:it.name||'아이템'})}}else if(action.type===ACTIONS.GRENADE)";
  s=mustReplace(s,old,neu,'server discard action');
  return s;
});

update('src/main.js',s=>{
  const equipment=`function renderRaidEquipment(){const slots=['primary','secondary','armor','helmet','backpack'],key=snap.player.weaponSlot+'|'+slots.map(k=>\`${'${'}k}:${'${'}snap.player.gear[k]?.id||''}\`).join('|');if(key===hudEqKey)return;hudEqKey=key;const g=$('#raidEquipment');g.innerHTML='';for(const slot of slots){const it=snap.player.gear[slot],d=document.createElement('div'),hotkey=slot==='primary'?'[1] ':slot==='secondary'?'[2] ':'';d.className='raidEqSlot';if(slot===snap.player.weaponSlot&&(slot==='primary'||slot==='secondary')){d.style.borderColor='rgba(116,210,255,.9)';d.style.boxShadow='0 0 0 1px rgba(116,210,255,.25) inset'}d.innerHTML=\`<b>${'${'}hotkey}${'${'}slotNames[slot]}</b><br>${'${'}it?itemName(it):'<span class="muted">비어 있음</span>'}\`;g.appendChild(d)}}\n`;
  s=replaceBetween(s,'function renderRaidEquipment(){','function renderBag(){',equipment,'raid equipment hotkeys');
  const bag=`function renderBag(){const inv=snap.player.inventory,key=snap.player.bagCapacity+'|'+inv.map(it=>\`${'${'}it.id}:${'${'}it.ammo??''}:${'${'}it.qty??''}:${'${'}it.tier??''}:${'${'}it.ammoTier??''}\`).join(',');if(key===hudBagKey)return;hudBagKey=key;const g=$('#bagGrid');g.innerHTML='';for(let i=0;i<snap.player.bagCapacity;i++){const it=inv[i],d=document.createElement('div');d.className='bagSlot';if(it){d.innerHTML=\`<b>${'${'}itemName(it)}</b><small>${'${'}itemSub(it)}</small>\`;const actions=document.createElement('div');actions.style.display='flex';actions.style.gap='4px';actions.style.flexWrap='wrap';if(['weapon','armor','helmet','backpack'].includes(it.kind)){const b=document.createElement('button');b.textContent='장착';b.onpointerdown=e=>{e.preventDefault();e.stopPropagation();session?.sendAction({type:ACTIONS.EQUIP_BAG,slot:i})};actions.appendChild(b)}const drop=document.createElement('button');drop.textContent='버리기';drop.className='danger';drop.title='이 아이템을 RAID에서 영구 삭제';drop.onpointerdown=e=>{e.preventDefault();e.stopPropagation();session?.sendAction({type:ACTIONS.DISCARD_ITEM,itemId:it.id})};actions.appendChild(drop);d.appendChild(actions)}g.appendChild(d)}}\n`;
  s=replaceBetween(s,'function renderBag(){','function renderLoot(){',bag,'bag discard UI');
  return s;
});

update('index.html',s=>{
  s=mustReplace(s,'<title>DEAD DROP // v3.1 Dynamic Cover Raids</title>','<title>DEAD DROP // v3.1.1 Loot Priority & Raid Inventory</title>','page title');
  s=mustReplace(s,'<div>1 · 2 무기 전환</div>','<div>1 주무기 / 2 보조무기</div>','control legend');
  s=mustReplace(s,'E 상자·시체 열기 / 탈출','E 상자·시체 우선 상호작용 / 문 / 탈출','interaction help');
  s=mustReplace(s,'v3.1 · RAID마다 엄폐물 재배치 · 엄폐물 대폭 증가 · 문/스폰/탈출구 안전배치 · 탄약 T1~T5 · 10분 맵 순환','v3.1.1 · 상자·시체 우선 상호작용 · 1/2 무기 전환 · RAID 가방 아이템 버리기 · 랜덤 엄폐물','patch note');
  return s;
});

console.log('v3.1.1 interaction/inventory patch applied');
