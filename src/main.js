import {LocalSession} from './net.js';
import {WEAPONS,GEAR} from './sim.js';
import {ACTIONS,emptyInput} from './protocol.js';

const $=s=>document.querySelector(s),canvas=$('#game'),ctx=canvas.getContext('2d');
const SAVE_KEY='deadDropMetaV21';
const cp=o=>JSON.parse(JSON.stringify(o));
const id=()=>`m${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`;
const makeWeapon=type=>({id:id(),kind:'weapon',type,name:WEAPONS[type].name,ammo:WEAPONS[type].mag,reserve:WEAPONS[type].reserve,damage:WEAPONS[type].damage,value:WEAPONS[type].price});
const makeGear=key=>({id:id(),key,...cp(GEAR[key]),value:GEAR[key].price});
const defaultMeta=()=>({money:3200,visionLevel:3,equipment:{primary:null,secondary:null,armor:null,helmet:null,backpack:null},inventory:[],stash:[makeWeapon('ar'),makeWeapon('pistol'),makeGear('armor_light'),makeGear('helmet'),makeGear('backpack'),makeGear('med'),makeGear('med'),makeGear('grenade'),makeGear('grenade')]});
let meta=defaultMeta();try{const s=localStorage.getItem(SAVE_KEY);if(s)meta={...defaultMeta(),...JSON.parse(s)}}catch{}
if(!meta.equipment)meta.equipment=defaultMeta().equipment;if(!Array.isArray(meta.inventory))meta.inventory=[];if(!Array.isArray(meta.stash))meta.stash=[];
const save=()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(meta))}catch{}};
function hasBasicPistol(){
 const items=[meta.equipment?.primary,meta.equipment?.secondary,...(meta.inventory||[]),...(meta.stash||[])];
 return items.some(it=>it?.kind==='weapon'&&it.type==='pistol');
}
function ensureBasicPistol(){
 if(hasBasicPistol())return false;
 const w=makeWeapon('pistol');
 w.name='M9 권총 … 기담 지급';
 w.value=0;
 w.starterIssue=true;
 meta.stash.push(w);
 save();
 return true;
}
const money=n=>`${Math.round(n||0).toLocaleString()} G`;
const slotNames={primary:'주무기',secondary:'보조무기',armor:'방탄복',helmet:'헬멧',backpack:'백팩'};
const equipKind={armor:'armor',helmet:'helmet',backpack:'backpack'};
const weaponDesc={pistol:'기동성 좋은 저가 단발',smg:'근거리 고연사',ar:'중거리 범용',shotgun:'실내 근접전',dmr:'장거리 고화력'};
function itemName(it){return it?.name||'빈 슬롯'}
function itemMeta(it){if(!it)return'';if(it.kind==='weapon')return`${weaponDesc[it.type]} · ${it.ammo??WEAPONS[it.type].mag}/${it.reserve??0}`;if(it.kind==='armor')return`방탄 ${Math.round(it.armor??it.maxArmor??0)}/${it.maxArmor||0}`;if(it.kind==='helmet')return`내구 ${Math.round(it.durability??it.maxDurability??0)}/${it.maxDurability||0}`;if(it.kind==='backpack')return`가방 ${it.capacity||8}칸`;if(it.kind==='med')return`회복 +${it.heal}`;if(it.kind==='grenade')return`폭발 반경 ${it.radius}`;return`가치 ${money(it.value)}`}
function canEquipTo(it,slot){if(!it)return false;if(slot==='primary'||slot==='secondary')return it.kind==='weapon';return it.kind===equipKind[slot]}
function moveEquipToInventory(slot){const it=meta.equipment[slot];if(!it||meta.inventory.length>=12)return;meta.inventory.push(it);meta.equipment[slot]=null;save();renderLobby()}
function equipFromInventory(index,slot){const it=meta.inventory[index];if(!canEquipTo(it,slot))return;const old=meta.equipment[slot];meta.equipment[slot]=it;meta.inventory.splice(index,1);if(old)meta.inventory.push(old);save();renderLobby()}
function stashToInventory(i){if(meta.inventory.length>=12)return;meta.inventory.push(meta.stash.splice(i,1)[0]);save();renderLobby()}
function inventoryToStash(i){meta.stash.push(meta.inventory.splice(i,1)[0]);save();renderLobby()}

function renderLobby(){
 $('#moneyText').textContent=money(meta.money);$('#visionLevel').value=meta.visionLevel;$('#visionLevelText').textContent=meta.visionLevel;$('#raidInvCount').textContent=`${meta.inventory.length}/12`;
 const eq=$('#equipmentGrid');eq.innerHTML='';for(const slot of ['primary','secondary','armor','helmet','backpack']){const it=meta.equipment[slot],d=document.createElement('div');d.className='equipmentSlot'+(it?' filled':'');d.innerHTML=`<div class="slotLabel">${slotNames[slot]}</div><div class="slotTitle">${itemName(it)}</div><div class="slotMeta">${itemMeta(it)}</div>`;if(it){const b=document.createElement('button');b.textContent='인벤토리로';b.disabled=meta.inventory.length>=12;b.onclick=()=>moveEquipToInventory(slot);d.appendChild(b)}eq.appendChild(d)}
 const inv=$('#raidInventory');inv.innerHTML='';for(let i=0;i<12;i++){const it=meta.inventory[i],d=document.createElement('div');d.className='inventorySlot';if(it){d.innerHTML=`<b>${itemName(it)}</b><span class="slotMeta">${itemMeta(it)}</span>`;const actions=document.createElement('div');actions.style.display='flex';actions.style.gap='3px';if(it.kind==='weapon'){for(const [slot,label] of [['primary','주'],['secondary','보']]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>equipFromInventory(i,slot);actions.appendChild(b)}}else if(['armor','helmet','backpack'].includes(it.kind)){const b=document.createElement('button');b.textContent='장착';b.onclick=()=>equipFromInventory(i,it.kind);actions.appendChild(b)}const s=document.createElement('button');s.textContent='창고';s.onclick=()=>inventoryToStash(i);actions.appendChild(s);d.appendChild(actions)}inv.appendChild(d)}
 const stash=$('#stashList');stash.innerHTML='';if(!meta.stash.length)stash.innerHTML='<div class="muted">창고가 비어 있습니다.</div>';meta.stash.forEach((it,i)=>{const d=document.createElement('div');d.className='stashItem';d.innerHTML=`<b>${itemName(it)}</b><div class="meta">${itemMeta(it)}<br>${money(it.value||0)}</div>`;const b=document.createElement('button');b.textContent='출격 인벤토리로';b.disabled=meta.inventory.length>=12;b.onclick=()=>stashToInventory(i);d.appendChild(b);stash.appendChild(d)});
 const shop=$('#shopList');shop.innerHTML='';const products=[...Object.keys(WEAPONS).map(k=>({name:WEAPONS[k].name,price:WEAPONS[k].price,make:()=>makeWeapon(k)})),...['armor_light','armor_heavy','helmet','backpack','med','grenade'].map(k=>({name:GEAR[k].name,price:GEAR[k].price,make:()=>makeGear(k)}))];for(const p of products){const r=document.createElement('div');r.className='shopItem';r.innerHTML=`<b>${p.name}</b><div class="meta">${money(p.price)}</div>`;const b=document.createElement('button');b.textContent='창고로 구매';b.onclick=()=>{if(meta.money<p.price)return alert('자금이 부족합니다.');meta.money-=p.price;meta.stash.push(p.make());save();renderLobby()};r.appendChild(b);shop.appendChild(r)}
 $('#raidBtn').disabled=!meta.equipment.primary;
}
$('#visionLevel').addEventListener('input',e=>{meta.visionLevel=Number(e.target.value);$('#visionLevelText').textContent=meta.visionLevel;save()});

let session=null,snap=null,input=emptyInput(),keys=new Set(),mouse={x:640,y:360},lastResultHandled=false,audioCtx=null;
let killFeed=[],soundMarks=[],fx=[],shake=0,recoilKick=0,hitMarkerT=0,hitHead=false;
function ensureAudio(){if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}
function noiseBurst(duration=.06,volume=.04,low=160,high=900){if(!audioCtx)return;const n=Math.max(1,Math.floor(audioCtx.sampleRate*duration)),buf=audioCtx.createBuffer(1,n,audioCtx.sampleRate),data=buf.getChannelData(0);for(let i=0;i<n;i++)data[i]=(Math.random()*2-1)*(1-i/n);const src=audioCtx.createBufferSource(),f=audioCtx.createBiquadFilter(),g=audioCtx.createGain();src.buffer=buf;f.type='bandpass';f.frequency.value=(low+high)/2;f.Q.value=.65;g.gain.value=volume;src.connect(f).connect(g).connect(audioCtx.destination);src.start()}
function shotSound(type,volume=1){if(!audioCtx)return;const d={pistol:[.035,360],smg:[.026,430],ar:[.045,300],shotgun:[.075,170],dmr:[.06,220]}[type]||[.04,300];noiseBurst(type==='shotgun'?.10:.065,d[0]*volume,70,d[1]*3);const o=audioCtx.createOscillator(),g=audioCtx.createGain(),now=audioCtx.currentTime;o.type='square';o.frequency.setValueAtTime(d[1],now);o.frequency.exponentialRampToValueAtTime(55,now+.055);g.gain.setValueAtTime(d[0]*.5*volume,now);g.gain.exponentialRampToValueAtTime(.001,now+.07);o.connect(g).connect(audioCtx.destination);o.start();o.stop(now+.08)}
function explosionSound(volume=1){noiseBurst(.18,.10*volume,45,500)}
function currentPlayer(){return snap?.player}
function startRaid(){if(!meta.equipment.primary)return;ensureAudio();const departure={equipment:cp(meta.equipment),inventory:cp(meta.inventory),visionLevel:meta.visionLevel};meta.equipment={primary:null,secondary:null,armor:null,helmet:null,backpack:null};meta.inventory=[];save();renderLobby();$('#lobby').classList.add('hidden');$('#raid').classList.remove('hidden');lastResultHandled=false;killFeed=[];soundMarks=[];fx=[];input=emptyInput();session=new LocalSession(departure);session.on('snapshot',s=>{snap=s;renderHUD();if(s.result&&!lastResultHandled)handleResult(s.result)});session.on('event',handleEvent);canvas.focus()}
$('#raidBtn').onclick=startRaid;
function handleResult(r){lastResultHandled=true;session?.close();session=null;if(r.status==='extracted'){meta.equipment=r.equipment||{primary:null,secondary:null,armor:null,helmet:null,backpack:null};const cap=12;const items=r.items||[];meta.inventory=items.slice(0,cap);if(items.length>cap)meta.stash.push(...items.slice(cap));meta.money+=Math.round((r.lootValue||0)*.08);save()}showResult(r.status==='extracted',r)}
function showResult(ok,r){const p=$('#resultPanel');p.classList.remove('hidden');p.innerHTML=`<div class="resultCard"><h2 class="${ok?'success':'failed'}">${ok?'EXTRACTED':'RAID LOST'}</h2><p>${ok?`탈출 성공 · ${r.reason}`:`${r.reason} · 출격 장비와 전리품 상실`}</p><p>처치 ${r.kills||0} · 회수 가치 ${money(r.lootValue||0)}</p><button id="backLobby" class="primary">로비로 돌아가기</button></div>`;$('#backLobby').onclick=()=>{p.classList.add('hidden');$('#raid').classList.add('hidden');$('#lobby').classList.remove('hidden');snap=null;ensureBasicPistol();renderLobby()}}
$('#abandonBtn').onclick=()=>{if(!session)return;if(confirm('출격 장비와 전리품을 모두 포기할까요?')){session.close();session=null;lastResultHandled=true;$('#raid').classList.add('hidden');$('#lobby').classList.remove('hidden');snap=null;ensureBasicPistol();renderLobby()}};

function eventOnScreen(e){if(!snap?.player)return false;return Math.hypot(e.x-snap.player.x,e.y-snap.player.y)<1000}
function handleEvent(e){
 if(e.type==='shot'){if(eventOnScreen(e)){shotSound(e.weapon,e.actor===snap?.playerId?1:.42);fx.push({kind:'muzzle',x:e.x,y:e.y,t:.08,max:.08});if(e.actor===snap?.playerId){recoilKick=Math.min(11,recoilKick+(e.recoil||2)*1.35);shake=Math.max(shake,(e.recoil||2)*.7);fx.push({kind:'casing',x:e.x,y:e.y,vx:(Math.random()-.5)*80,vy:-40-Math.random()*45,t:.5,max:.5})}}}
 if(e.type==='impact'&&eventOnScreen(e))fx.push({kind:'impact',x:e.x,y:e.y,t:.18,max:.18});
 if(e.type==='explosion'){if(eventOnScreen(e)){explosionSound(.8);shake=Math.max(shake,10);for(let i=0;i<16;i++)fx.push({kind:'spark',x:e.x,y:e.y,vx:(Math.random()-.5)*380,vy:(Math.random()-.5)*380,t:.45,max:.45})}}
 if(e.type==='hit'){if(e.source===snap?.playerId){hitMarkerT=.16;hitHead=!!e.headshot;shake=Math.max(shake,e.headshot?3:1.5)}if(e.target===snap?.playerId)shake=Math.max(shake,7)}
 if(e.type==='kill'){killFeed.unshift(`${e.killer}  ▸  ${e.victim}`);killFeed=killFeed.slice(0,5);renderKillFeed()}
 if(e.type==='heard')soundMarks.push({angle:e.angle,t:1.35,max:1.35});
 if(e.type==='loot')toast(`획득: ${e.item}`);if(e.type==='equip')toast(`장착: ${e.item}`);if(e.type==='door')toast(`${e.name} ${e.open?'열림':'닫힘'}`);if(e.type==='heal'&&e.actor===snap?.playerId)toast(`치료 완료 +${e.amount||0} HP`);
}
function renderKillFeed(){$('#killFeed').innerHTML=killFeed.map(x=>`<div class="killMsg">${x}</div>`).join('')}
function toast(t){const el=$('#interactHint'),old=el.textContent;el.textContent=t;clearTimeout(toast.t);toast.t=setTimeout(()=>el.textContent=old,1000)}

function itemSub(it){return itemMeta(it)}
function renderHUD(){if(!snap?.player)return;const p=snap.player;$('#hpText').textContent=Math.ceil(p.hp);$('#hpBar').style.width=`${Math.max(0,p.hp/p.maxHp*100)}%`;$('#armorText').textContent=Math.ceil(p.armor);$('#armorBar').style.width=`${Math.max(0,p.maxArmor?p.armor/p.maxArmor*100:0)}%`;$('#weaponName').textContent=p.weapon?.name||'무기 없음';$('#ammoText').textContent=p.weapon?`${p.weapon.ammo} / ${p.weapon.reserve}`:'0 / 0';$('#fireMode').textContent=p.weapon&&WEAPONS[p.weapon.type].auto?'AUTO':'SEMI';const m=Math.floor(snap.timeLeft/60),s=Math.floor(snap.timeLeft%60);$('#raidTimer').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;$('#visionHudText').textContent=p.visionLevel;$('#killCount').textContent=p.kills;$('#aliveCount').textContent=snap.aliveAI;$('#bagCount').textContent=`${p.inventory.length}/${p.bagCapacity}`;$('#lootValue').textContent=money(p.inventory.reduce((a,b)=>a+(b.value||0),0));$('#grenadeCount').textContent=p.inventory.filter(i=>i.kind==='grenade').length;$('#medCount').textContent=p.inventory.filter(i=>i.kind==='med').length;renderBag();renderRaidEquipment();renderLoot();renderProgress()}
function renderRaidEquipment(){const g=$('#raidEquipment');g.innerHTML='';for(const slot of ['primary','secondary','armor','helmet','backpack']){const it=snap.player.gear[slot],d=document.createElement('div');d.className='raidEqSlot';d.innerHTML=`<b>${slotNames[slot]}</b><br>${it?itemName(it):'<span class="muted">비어 있음</span>'}`;g.appendChild(d)}}
function renderBag(){const g=$('#bagGrid');g.innerHTML='';const inv=snap.player.inventory;for(let i=0;i<snap.player.bagCapacity;i++){const it=inv[i],d=document.createElement('div');d.className='bagSlot';if(it){d.innerHTML=`<b>${itemName(it)}</b><small>${itemSub(it)}</small>`;if(['weapon','armor','helmet','backpack'].includes(it.kind)){const b=document.createElement('button');b.textContent='장착';b.onpointerdown=e=>{e.preventDefault();e.stopPropagation();session?.sendAction({type:ACTIONS.EQUIP_BAG,slot:i})};d.appendChild(b)}}g.appendChild(d)}}
function renderLoot(){const p=$('#lootPanel'),c=snap.openContainer;if(!c){p.classList.add('hidden');return}p.classList.remove('hidden');p.innerHTML=`<div style="display:flex;justify-content:space-between"><b>${c.kind==='corpse'?`시체 · ${c.ownerName}`:'보급 상자'}</b><button id="closeLoot">×</button></div><div class="meta" style="margin:5px 0">가까이 있어야 루팅창이 유지됩니다.</div><div id="lootRows"></div>`;$('#closeLoot').onpointerdown=e=>{e.preventDefault();e.stopPropagation();session?.sendAction({type:ACTIONS.CLOSE_CONTAINER})};const rows=p.querySelector('#lootRows');if(!c.items.length)rows.innerHTML='<div class="muted" style="padding:12px">비어 있음</div>';for(const it of c.items){const r=document.createElement('div');r.className='lootRow';r.innerHTML=`<div><b>${itemName(it)}</b><small>${itemSub(it)}</small></div>`;const b=document.createElement('button');b.textContent='획득';b.disabled=snap.player.inventory.length>=snap.player.bagCapacity;b.onpointerdown=e=>{e.preventDefault();e.stopPropagation();session?.sendAction({type:ACTIONS.LOOT,itemId:it.id,containerId:c.id})};r.appendChild(b);rows.appendChild(r)}}
function renderProgress(){const q=snap.interaction,box=$('#openProgress');if(!q){box.classList.add('hidden');return}box.classList.remove('hidden');const pct=Math.min(1,q.progress/q.duration);$('#openProgressFill').style.width=`${pct*100}%`;$('#openProgressText').textContent=q.kind==='extract'?`탈출 중 ${(q.duration-q.progress).toFixed(1)}초`:`상자 여는 중 ${(q.duration-q.progress).toFixed(1)}초`}

function camera(){if(!snap?.player)return{x:0,y:0};const kick=recoilKick,dx=Math.cos(snap.player.angle)*kick,dy=Math.sin(snap.player.angle)*kick;return{x:Math.max(0,Math.min(snap.worldW-canvas.width,snap.player.x-canvas.width/2+dx)),y:Math.max(0,Math.min(snap.worldH-canvas.height,snap.player.y-canvas.height/2+dy))}}
function onScreen(x,y,cam,pad=80){return x>cam.x-pad&&x<cam.x+canvas.width+pad&&y>cam.y-pad&&y<cam.y+canvas.height+pad}
function visionShape(){const p=snap?.player;if(!p)return null;const near=190+p.visionLevel*34,far=near+430+p.visionLevel*58;return{p,near,far,half:1.05}}
function angleDelta(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b))}
function pointInVision(x,y){const v=visionShape();if(!v)return false;const dx=x-v.p.x,dy=y-v.p.y,d=Math.hypot(dx,dy);if(d<=v.near)return true;if(d>v.far)return false;return Math.abs(angleDelta(Math.atan2(dy,dx),v.p.angle))<=v.half}
function rectInVision(o){const v=visionShape();if(!v)return false;const px=Math.max(o.x,Math.min(v.p.x,o.x+o.w)),py=Math.max(o.y,Math.min(v.p.y,o.y+o.h));if(Math.hypot(px-v.p.x,py-v.p.y)<=v.near)return true;const pts=[[o.x,o.y],[o.x+o.w,o.y],[o.x,o.y+o.h],[o.x+o.w,o.y+o.h],[o.x+o.w/2,o.y+o.h/2],[px,py]];return pts.some(([x,y])=>pointInVision(x,y))}
function draw(){requestAnimationFrame(draw);const dt=.016;recoilKick*=.78;shake*=.86;hitMarkerT=Math.max(0,hitMarkerT-dt);soundMarks.forEach(s=>s.t-=dt);soundMarks=soundMarks.filter(s=>s.t>0);for(const f of fx){f.t-=dt;if(f.vx!=null){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=120*dt}}fx=fx.filter(f=>f.t>0);$('#hitMarker').style.opacity=hitMarkerT>0?'1':'0';$('#hitMarker').style.filter=hitHead?'sepia(1) saturate(4) hue-rotate(5deg)':'none';if(!snap)return;let cam=camera();if(shake>.2){cam={x:cam.x+(Math.random()-.5)*shake,y:cam.y+(Math.random()-.5)*shake}}ctx.fillStyle='#030506';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(-cam.x,-cam.y);drawGround(cam);drawZones(cam);drawExtracts(cam);drawObstacles(cam);drawDoors(cam);drawCrates(cam);drawCorpses(cam);drawActors(cam);drawGrenades(cam);drawFxWorld(cam);ctx.restore();drawDarkness(cam);ctx.save();ctx.translate(-cam.x,-cam.y);drawBullets(cam);ctx.restore();drawSoundIndicators();}
function drawGround(cam){ctx.fillStyle='#15191a';ctx.fillRect(cam.x-10,cam.y-10,canvas.width+20,canvas.height+20);const sx=Math.floor(cam.x/80)*80,sy=Math.floor(cam.y/80)*80;for(let y=sy;y<cam.y+canvas.height+80;y+=80)for(let x=sx;x<cam.x+canvas.width+80;x+=80){ctx.fillStyle=((x/80+y/80)%2)?'#161a1b':'#141819';ctx.fillRect(x,y,78,78)}ctx.fillStyle='#1d2223';ctx.fillRect(0,1420,snap.worldW,260);ctx.fillRect(1330,0,180,snap.worldH);ctx.fillRect(2930,0,150,snap.worldH);ctx.fillStyle='rgba(230,220,180,.08)';ctx.fillRect(0,1543,snap.worldW,4)}
function drawZones(cam){ctx.font='bold 34px monospace';ctx.fillStyle='rgba(210,218,218,.035)';for(const z of snap.zones)if(onScreen(z.x+z.w/2,z.y+z.h/2,cam,500)&&rectInVision(z))ctx.fillText(z.name,z.x+24,z.y+54)}
function drawExtracts(cam){for(const e of snap.extracts){if(!onScreen(e.x,e.y,cam,300))continue;ctx.fillStyle='rgba(69,156,96,.11)';ctx.fillRect(e.x,e.y,e.w,e.h);ctx.strokeStyle='rgba(92,205,126,.38)';ctx.strokeRect(e.x,e.y,e.w,e.h);ctx.fillStyle='rgba(145,216,166,.55)';ctx.font='11px monospace';ctx.fillText('EXTRACT',e.x+7,e.y+17)}}
function obstacleColor(k){return k==='container'?'#554536':k==='vehicle'||k==='truck'?'#30383b':k==='tank'?'#39413f':k==='shelf'?'#3a342b':k==='machine'?'#343b3c':k==='desk'?'#37332e':k==='barricade'||k==='cratewall'?'#4a4236':k==='pipe'?'#3a3f3d':'#292e30'}
function drawObstacles(cam){for(const o of snap.obstacles){if(o.x+o.w<cam.x-40||o.x>cam.x+canvas.width+40||o.y+o.h<cam.y-40||o.y>cam.y+canvas.height+40||!rectInVision(o))continue;ctx.fillStyle=obstacleColor(o.kind);ctx.fillRect(o.x,o.y,o.w,o.h);ctx.fillStyle='rgba(255,255,255,.055)';ctx.fillRect(o.x,o.y,o.w,3);ctx.strokeStyle='rgba(0,0,0,.42)';ctx.strokeRect(o.x,o.y,o.w,o.h)}}
function drawDoors(cam){for(const d of snap.doors||[]){if(!rectInVision(d))continue;ctx.save();const cx=d.x+d.w/2,cy=d.y+d.h/2;ctx.translate(cx,cy);if(d.open){ctx.strokeStyle='#92785e';ctx.lineWidth=5;ctx.beginPath();if(d.w>d.h){ctx.moveTo(-d.w/2,0);ctx.lineTo(-d.w/2,-Math.min(72,d.w));}else{ctx.moveTo(0,-d.h/2);ctx.lineTo(Math.min(72,d.h),-d.h/2);}ctx.stroke()}else{ctx.fillStyle='#6f5945';ctx.fillRect(-d.w/2,-d.h/2,d.w,d.h);ctx.strokeStyle='#b29269';ctx.strokeRect(-d.w/2,-d.h/2,d.w,d.h)}ctx.restore()}}
function drawCrates(cam){for(const c of snap.crates){if(!onScreen(c.x,c.y,cam)||!pointInVision(c.x,c.y))continue;ctx.fillStyle=c.opened?'#403b31':'#79633b';ctx.fillRect(c.x-16,c.y-12,32,24);ctx.strokeStyle=c.empty?'#4d4d47':'#b39454';ctx.strokeRect(c.x-16,c.y-12,32,24);if(!c.opened){ctx.fillStyle='#c8a961';ctx.fillRect(c.x-10,c.y-3,20,3)}}}
function drawCorpses(cam){for(const c of snap.corpses){if(!onScreen(c.x,c.y,cam)||!pointInVision(c.x,c.y))continue;ctx.fillStyle='#302928';ctx.beginPath();ctx.ellipse(c.x,c.y,19,10,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#685a55';ctx.stroke()}}
function actorColor(a){if(a.id===snap.playerId)return'#76b8cf';return a.kind==='pmc'?'#aba89a':'#948b6d'}
function drawActors(cam){for(const a of snap.actors){if(a.dead||!onScreen(a.x,a.y,cam))continue;ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.angle);ctx.fillStyle='rgba(0,0,0,.45)';ctx.beginPath();ctx.ellipse(0,10,14,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=actorColor(a);ctx.fillRect(-9,-10,18,21);ctx.fillStyle='#181d20';ctx.fillRect(-6,-15,12,8);ctx.strokeStyle='#c9ced0';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(5,0);ctx.lineTo(25,0);ctx.stroke();ctx.restore();if(a.id===snap.playerId){ctx.strokeStyle='rgba(115,192,217,.8)';ctx.beginPath();ctx.arc(a.x,a.y,18,0,Math.PI*2);ctx.stroke()}}}
function drawBullets(cam){for(const b of snap.bullets){if(!onScreen(b.x,b.y,cam))continue;const a=Math.atan2(b.vy,b.vx);ctx.save();ctx.strokeStyle='rgba(255,230,140,.98)';ctx.lineWidth=3;ctx.shadowColor='rgba(255,210,90,.95)';ctx.shadowBlur=7;ctx.beginPath();ctx.moveTo(b.x-Math.cos(a)*24,b.y-Math.sin(a)*24);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore()}}
function drawGrenades(cam){for(const g of snap.grenades){if(!onScreen(g.x,g.y,cam))continue;ctx.fillStyle='#59605c';ctx.beginPath();ctx.arc(g.x,g.y,6,0,Math.PI*2);ctx.fill();ctx.fillStyle=g.fuse<.7?'#e06757':'#9ca59e';ctx.fillRect(g.x-1,g.y-9,2,4)}}
function drawFxWorld(cam){for(const f of fx){if(!onScreen(f.x,f.y,cam))continue;const a=Math.max(0,f.t/f.max);ctx.globalAlpha=a;if(f.kind==='muzzle'){ctx.fillStyle='#ffd776';ctx.beginPath();ctx.arc(f.x,f.y,15*(1-a)+8,0,Math.PI*2);ctx.fill()}else if(f.kind==='impact'){ctx.fillStyle='#e5d9b4';for(let i=0;i<4;i++)ctx.fillRect(f.x+(Math.random()-.5)*10,f.y+(Math.random()-.5)*10,2,2)}else if(f.kind==='spark'){ctx.fillStyle='#f1b75e';ctx.fillRect(f.x-2,f.y-2,4,4)}else if(f.kind==='casing'){ctx.fillStyle='#c5a258';ctx.fillRect(f.x,f.y,4,2)}ctx.globalAlpha=1}}
function drawDarkness(cam){
 if(!snap?.player)return;
 const p=snap.player,sx=p.x-cam.x,sy=p.y-cam.y,level=p.visionLevel;
 const near=190+level*34,far=near+430+level*58,half=1.05;
 const fog=drawDarkness._fog||(drawDarkness._fog=document.createElement('canvas'));
 if(fog.width!==canvas.width||fog.height!==canvas.height){fog.width=canvas.width;fog.height=canvas.height}
 const fctx=fog.getContext('2d');
 fctx.setTransform(1,0,0,1,0,0);fctx.clearRect(0,0,fog.width,fog.height);
 // Terrain always remains readable. Vision only controls actor visibility and local brightness.
 fctx.globalCompositeOperation='source-over';
 fctx.fillStyle='rgba(2,5,8,.43)';fctx.fillRect(0,0,fog.width,fog.height);
 // Cut holes only in the fog layer, never in the world canvas itself.
 fctx.globalCompositeOperation='destination-out';
 let g=fctx.createRadialGradient(sx,sy,16,sx,sy,near);
 g.addColorStop(0,'rgba(0,0,0,.82)');g.addColorStop(.58,'rgba(0,0,0,.66)');g.addColorStop(1,'rgba(0,0,0,0)');
 fctx.fillStyle=g;fctx.beginPath();fctx.arc(sx,sy,near,0,Math.PI*2);fctx.fill();
 fctx.save();fctx.translate(sx,sy);fctx.rotate(p.angle);
 const cone=fctx.createRadialGradient(0,0,near*.18,0,0,far);
 cone.addColorStop(0,'rgba(0,0,0,.98)');cone.addColorStop(.62,'rgba(0,0,0,.94)');cone.addColorStop(.86,'rgba(0,0,0,.66)');cone.addColorStop(1,'rgba(0,0,0,0)');
 fctx.fillStyle=cone;fctx.beginPath();fctx.moveTo(0,0);fctx.arc(0,0,far,-half,half);fctx.closePath();fctx.fill();fctx.restore();
 fctx.globalCompositeOperation='source-over';
 ctx.drawImage(fog,0,0);
}
function drawSoundIndicators(){const cx=canvas.width/2,cy=canvas.height/2,r=Math.min(canvas.width,canvas.height)*.43;for(const s of soundMarks){const a=s.t/s.max,x=cx+Math.cos(s.angle)*r,y=cy+Math.sin(s.angle)*r;ctx.save();ctx.translate(x,y);ctx.rotate(s.angle);ctx.globalAlpha=Math.min(1,a*1.5)*.8;ctx.fillStyle='#d5d9d8';ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-8,-8);ctx.lineTo(-3,0);ctx.lineTo(-8,8);ctx.closePath();ctx.fill();ctx.restore()}ctx.globalAlpha=1}

function updateInput(){if(!session||!snap?.player)return;let x=0,y=0;if(keys.has('w'))y--;if(keys.has('s'))y++;if(keys.has('a'))x--;if(keys.has('d'))x++;const cam=camera(),wx=mouse.x+cam.x,wy=mouse.y+cam.y,dx=wx-snap.player.x,dy=wy-snap.player.y,l=Math.hypot(dx,dy)||1;input={...input,seq:input.seq+1,moveX:x,moveY:y,aimX:dx/l,aimY:dy/l,sprint:keys.has('shift'),interact:keys.has('e'),reload:keys.has('r')};session.sendInput(input);input.reload=false}
setInterval(updateInput,1000/30);
canvas.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect();mouse.x=(e.clientX-r.left)*canvas.width/r.width;mouse.y=(e.clientY-r.top)*canvas.height/r.height});canvas.addEventListener('mousedown',e=>{if(e.button===0){ensureAudio();input.shoot=true}});window.addEventListener('mouseup',e=>{if(e.button===0)input.shoot=false});canvas.addEventListener('contextmenu',e=>e.preventDefault());window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['w','a','s','d','shift','e','r','g','h','1','2'].includes(k))e.preventDefault();keys.add(k);if(!session||e.repeat)return;if(k==='g')session.sendAction({type:ACTIONS.GRENADE});else if(k==='h')session.sendAction({type:ACTIONS.USE_MED});else if(k==='1')session.sendAction({type:ACTIONS.SWAP_WEAPON,slot:'primary'});else if(k==='2')session.sendAction({type:ACTIONS.SWAP_WEAPON,slot:'secondary'})});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
ensureBasicPistol();renderLobby();requestAnimationFrame(draw);
