from pathlib import Path
import re

def rep(s,a,b,label):
    if a not in s:
        raise SystemExit(f'missing target: {label}')
    return s.replace(a,b,1)

# --- sim.js ---
p=Path('src/sim.js'); s=p.read_text(encoding='utf-8')

s=rep(s,
"function blocked(w,x,y,r){if(x-r<0||y-r<0||x+r>WORLD_W||y+r>WORLD_H)return true;return allBlockers(w).some(o=>circleRect(x,y,r,o))}",
"function pointHitsBlocker(w,x,y){for(const o of w.obstacles)if(x>o.x&&x<o.x+o.w&&y>o.y&&y<o.y+o.h)return true;for(const d of w.doors)if(!d.open&&x>d.x&&x<d.x+d.w&&y>d.y&&y<d.y+d.h)return true;return false}\nfunction blocked(w,x,y,r){if(x-r<0||y-r<0||x+r>WORLD_W||y+r>WORLD_H)return true;for(const o of w.obstacles)if(circleRect(x,y,r,o))return true;for(const d of w.doors)if(!d.open&&circleRect(x,y,r,d))return true;return false}",
'collision allocation removal')

s=rep(s,
"function segmentBlocked(w,x1,y1,x2,y2){const d=distXY(x1,y1,x2,y2),n=Math.ceil(d/22);for(let i=1;i<n;i++){const t=i/n,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;if(allBlockers(w).some(o=>x>o.x&&x<o.x+o.w&&y>o.y&&y<o.y+o.h))return true}return false}",
"function segmentBlocked(w,x1,y1,x2,y2){const d=distXY(x1,y1,x2,y2),n=Math.ceil(d/26);for(let i=1;i<n;i++){const t=i/n,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;if(pointHitsBlocker(w,x,y))return true}return false}",
'LOS allocation removal')

s=rep(s,
"function steerToward(w,a,tx,ty,speed,dt){const n=norm(tx-a.x,ty-a.y);if(moveEntity(w,a,n.x*speed*dt,n.y*speed*dt))return;const s=a.strafe||1;if(!moveEntity(w,a,-n.y*s*speed*.72*dt,n.x*s*speed*.72*dt))a.strafe*=-1}",
"function aiTryDoor(w,a,tx,ty){if((a.doorCd||0)>0)return false;const dir=norm(tx-a.x,ty-a.y);let best=null,bd=110;for(const d of w.doors){if(d.open)continue;const cx=d.x+d.w/2,cy=d.y+d.h/2,dx=cx-a.x,dy=cy-a.y,dd=Math.hypot(dx,dy);if(dd>=bd)continue;const dot=(dx*dir.x+dy*dir.y)/(dd||1);if(dot<.15)continue;best=d;bd=dd}if(!best)return false;best.open=true;a.doorCd=.65;addSound(w,best.x+best.w/2,best.y+best.h/2,210,'door',a.id);return true}\nfunction steerToward(w,a,tx,ty,speed,dt){aiTryDoor(w,a,tx,ty);const n=norm(tx-a.x,ty-a.y);if(moveEntity(w,a,n.x*speed*dt,n.y*speed*dt))return;const s=a.strafe||1;if(!moveEntity(w,a,-n.y*s*speed*.72*dt,n.x*s*speed*.72*dt))a.strafe*=-1}",
'AI door opening')

s=rep(s,
"function aiStep(w,a,dt){if(a.dead)return;a.fireCd=Math.max(0,a.fireCd-dt);a.flinch=Math.max(0,a.flinch-dt);a.grenadeCd=Math.max(0,a.grenadeCd-dt);",
"function aiStep(w,a,dt){if(a.dead)return;a.fireCd=Math.max(0,a.fireCd-dt);a.flinch=Math.max(0,a.flinch-dt);a.grenadeCd=Math.max(0,a.grenadeCd-dt);a.doorCd=Math.max(0,(a.doorCd||0)-dt);",
'AI door cooldown')

s=rep(s,
"if(vis){a.targetId=vis.id;a.lastKnown={x:vis.x,y:vis.y,time:w.time};if(a.kind==='pmc')a.cover=chooseCover(w,a,vis)}",
"if(vis){const changed=a.targetId!==vis.id;a.targetId=vis.id;a.lastKnown={x:vis.x,y:vis.y,time:w.time};if(a.kind==='pmc'&&(changed||!a.cover||w.time-(a.coverAt||0)>.95)){a.cover=chooseCover(w,a,vis);a.coverAt=w.time}}",
'cover throttle')

s=rep(s,
"if(allBlockers(w).some(o=>b.x>o.x&&b.x<o.x+o.w&&b.y>o.y&&b.y<o.y+o.h)){emit(w,'impact',{x:b.x,y:b.y});alive=false;break}",
"if(pointHitsBlocker(w,b.x,b.y)){emit(w,'impact',{x:b.x,y:b.y});alive=false;break}",
'bullet blocker allocation')

p.write_text(s,encoding='utf-8')

# --- net.js ---
p=Path('src/net.js'); s=p.read_text(encoding='utf-8')
s=rep(s,"this.snapshotTimer=setInterval(()=>this.pushSnapshot(),50);","this.snapshotTimer=setInterval(()=>this.pushSnapshot(),33);",'snapshot 30hz')
s=rep(s,"const FIXED=1/20;let guard=0;while(this.acc>=FIXED&&guard++<4)","const FIXED=1/30;let guard=0;while(this.acc>=FIXED&&guard++<4)",'simulation 30hz')
p.write_text(s,encoding='utf-8')

# --- main.js ---
p=Path('src/main.js'); s=p.read_text(encoding='utf-8')
s=rep(s,
"let killFeed=[],soundMarks=[],fx=[],shake=0,recoilKick=0,hitMarkerT=0,hitHead=false;",
"let killFeed=[],soundMarks=[],fx=[],shake=0,recoilKick=0,hitMarkerT=0,hitHead=false;\nlet hudBagKey='',hudEqKey='',hudLootKey='';const hitMarkerEl=$('#hitMarker');",
'HUD caches')

s=rep(s,
"lastResultHandled=false;killFeed=[];soundMarks=[];fx=[];input=emptyInput();session=new LocalSession(departure);",
"lastResultHandled=false;killFeed=[];soundMarks=[];fx=[];hudBagKey='';hudEqKey='';hudLootKey='';input=emptyInput();session=new LocalSession(departure);",
'reset HUD caches')

old="function renderRaidEquipment(){const g=$('#raidEquipment');g.innerHTML='';for(const slot of ['primary','secondary','armor','helmet','backpack']){const it=snap.player.gear[slot],d=document.createElement('div');d.className='raidEqSlot';d.innerHTML=`<b>${slotNames[slot]}</b><br>${it?itemName(it):'<span class=\"muted\">비어 있음</span>'}`;g.appendChild(d)}}"
new="function renderRaidEquipment(){const slots=['primary','secondary','armor','helmet','backpack'],key=snap.player.weaponSlot+'|'+slots.map(k=>`${k}:${snap.player.gear[k]?.id||''}`).join('|');if(key===hudEqKey)return;hudEqKey=key;const g=$('#raidEquipment');g.innerHTML='';for(const slot of slots){const it=snap.player.gear[slot],d=document.createElement('div');d.className='raidEqSlot';d.innerHTML=`<b>${slotNames[slot]}</b><br>${it?itemName(it):'<span class=\"muted\">비어 있음</span>'}`;g.appendChild(d)}}"
s=rep(s,old,new,'equipment DOM cache')

old="function renderBag(){const g=$('#bagGrid');g.innerHTML='';const inv=snap.player.inventory;for(let i=0;i<snap.player.bagCapacity;i++){const it=inv[i],d=document.createElement('div');d.className='bagSlot';if(it){d.innerHTML=`<b>${itemName(it)}</b><small>${itemSub(it)}</small>`;if(['weapon','armor','helmet','backpack'].includes(it.kind)){const b=document.createElement('button');b.textContent='장착';b.onpointerdown=e=>{e.preventDefault();e.stopPropagation();session?.sendAction({type:ACTIONS.EQUIP_BAG,slot:i})};d.appendChild(b)}}g.appendChild(d)}}"
new="function renderBag(){const inv=snap.player.inventory,key=snap.player.bagCapacity+'|'+inv.map(it=>`${it.id}:${it.ammo??''}:${it.reserve??''}`).join(',');if(key===hudBagKey)return;hudBagKey=key;const g=$('#bagGrid');g.innerHTML='';for(let i=0;i<snap.player.bagCapacity;i++){const it=inv[i],d=document.createElement('div');d.className='bagSlot';if(it){d.innerHTML=`<b>${itemName(it)}</b><small>${itemSub(it)}</small>`;if(['weapon','armor','helmet','backpack'].includes(it.kind)){const b=document.createElement('button');b.textContent='장착';b.onpointerdown=e=>{e.preventDefault();e.stopPropagation();session?.sendAction({type:ACTIONS.EQUIP_BAG,slot:i})};d.appendChild(b)}}g.appendChild(d)}}"
s=rep(s,old,new,'bag DOM cache')

# replace renderLoot by locating function boundaries, less brittle than exact giant string
start=s.find('function renderLoot(){')
end=s.find('\nfunction renderProgress(){',start)
if start<0 or end<0: raise SystemExit('missing target: renderLoot')
newloot="""function renderLoot(){const p=$('#lootPanel'),c=snap.openContainer;if(!c){if(hudLootKey){hudLootKey='';p.classList.add('hidden')}return}const key=c.id+'|'+c.items.map(i=>i.id).join(',')+'|'+snap.player.inventory.length+'/'+snap.player.bagCapacity;if(key===hudLootKey)return;hudLootKey=key;p.classList.remove('hidden');p.innerHTML=`<div style=\"display:flex;justify-content:space-between\"><b>${c.kind==='corpse'?`시체 · ${c.ownerName}`:'보급 상자'}</b><button id=\"closeLoot\">×</button></div><div class=\"meta\" style=\"margin:5px 0\">가까이 있어야 루팅창이 유지됩니다.</div><div id=\"lootRows\"></div>`;$('#closeLoot').onpointerdown=e=>{e.preventDefault();e.stopPropagation();session?.sendAction({type:ACTIONS.CLOSE_CONTAINER})};const rows=p.querySelector('#lootRows');if(!c.items.length)rows.innerHTML='<div class=\"muted\" style=\"padding:12px\">비어 있음</div>';for(const it of c.items){const r=document.createElement('div');r.className='lootRow';r.innerHTML=`<div><b>${itemName(it)}</b><small>${itemSub(it)}</small></div>`;const b=document.createElement('button');b.textContent='획득';b.disabled=snap.player.inventory.length>=snap.player.bagCapacity;b.onpointerdown=e=>{e.preventDefault();e.stopPropagation();session?.sendAction({type:ACTIONS.LOOT,itemId:it.id,containerId:c.id})};r.appendChild(b);rows.appendChild(r)}}"""
s=s[:start]+newloot+s[end:]

s=rep(s,"$('#hitMarker').style.opacity=hitMarkerT>0?'1':'0';$('#hitMarker').style.filter=hitHead?'sepia(1) saturate(4) hue-rotate(5deg)':'none';","hitMarkerEl.style.opacity=hitMarkerT>0?'1':'0';hitMarkerEl.style.filter=hitHead?'sepia(1) saturate(4) hue-rotate(5deg)':'none';",'hit marker cache')

p.write_text(s,encoding='utf-8')
print('v2.4 AI door + performance patch applied')
