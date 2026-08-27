import {LocalSession} from './net.js';
import {WEAPONS} from './sim.js';
import {ACTIONS,emptyInput} from './protocol.js';

const $=s=>document.querySelector(s);
const canvas=$('#game'),ctx=canvas.getContext('2d');
const SAVE_KEY='deadDropMetaV1';
const defaultMeta=()=>({money:2200,selected:'ar',stash:[{kind:'weapon',type:'pistol',name:WEAPONS.pistol.name,value:WEAPONS.pistol.price},{kind:'weapon',type:'ar',name:WEAPONS.ar.name,value:WEAPONS.ar.price}]});
let meta=defaultMeta();try{const s=localStorage.getItem(SAVE_KEY);if(s)meta=JSON.parse(s)}catch{}
let session=null,snap=null,input=emptyInput(),keys=new Set(),mouse={x:640,y:360},killFeed=[],lastResultHandled=false,audioCtx=null;
const save=()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(meta))}catch{}};
const money=n=>`${Math.round(n).toLocaleString()} G`;
const weaponDesc={pistol:'저렴한 보험. 단발 · 기동성 좋음',smg:'근거리 연사 · 낮은 단발 피해',ar:'중거리 표준형 · 안정적인 주력',shotgun:'실내전 강력 · 짧은 유효거리',dmr:'장거리 고화력 · 느린 연사'};

function ensureAudio(){if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}
function shotSound(type){if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain(),now=audioCtx.currentTime;o.type='square';o.frequency.setValueAtTime(type==='shotgun'?90:type==='dmr'?120:type==='smg'?180:150,now);o.frequency.exponentialRampToValueAtTime(45,now+.06);g.gain.setValueAtTime(type==='shotgun'?.08:.045,now);g.gain.exponentialRampToValueAtTime(.001,now+.08);o.connect(g).connect(audioCtx.destination);o.start();o.stop(now+.09)}
function saveMeta(){save();renderLobby()}

function renderLobby(){
 $('#moneyText').textContent=money(meta.money);
 const cards=$('#loadoutCards');cards.innerHTML='';
 for(const [type,d] of Object.entries(WEAPONS)){
   const owned=meta.stash.some(x=>x.kind==='weapon'&&x.type===type),el=document.createElement('div');
   el.className='loadoutCard'+(meta.selected===type?' selected':'');
   el.innerHTML=`<div class="gunIcon">${d.icon}</div><h3>${d.name}</h3><small>${weaponDesc[type]}</small><small><br>DMG ${d.damage} · MAG ${d.mag} · ${d.auto?'AUTO':'SEMI'}</small><small><br>${owned?'보관함 보유':'미보유'}</small>`;
   el.onclick=()=>{if(!owned)return;meta.selected=type;saveMeta()};cards.appendChild(el);
 }
 const stash=$('#stashList');stash.innerHTML='';
 if(!meta.stash.length)stash.innerHTML='<div class="muted">보관함이 비었습니다.</div>';
 meta.stash.forEach((it,i)=>{const d=document.createElement('div');d.className='stashItem';d.innerHTML=`<div><b>${it.name||it.kind}</b><div class="meta">${it.kind==='weapon'?weaponDesc[it.type]:'회수 전리품'} · ${money(it.value||0)}</div></div>`;if(it.kind==='weapon'){const b=document.createElement('button');b.textContent='장착';b.onclick=()=>{meta.selected=it.type;saveMeta()};d.appendChild(b)}else{const b=document.createElement('button');b.textContent='판매';b.onclick=()=>{meta.money+=it.value||0;meta.stash.splice(i,1);saveMeta()};d.appendChild(b)}stash.appendChild(d)});
 const shop=$('#shopList');shop.innerHTML='';for(const [type,d] of Object.entries(WEAPONS)){const row=document.createElement('div');row.className='shopItem';row.innerHTML=`<div><b>${d.name}</b><div class="meta">${money(d.price)}</div></div>`;const b=document.createElement('button');b.textContent='구매';b.onclick=()=>{if(meta.money<d.price)return alert('자금이 부족합니다.');meta.money-=d.price;meta.stash.push({kind:'weapon',type,name:d.name,value:d.price});saveMeta()};row.appendChild(b);shop.appendChild(row)}
 const owned=meta.stash.some(x=>x.kind==='weapon'&&x.type===meta.selected);$('#raidBtn').disabled=!owned;
}

function startRaid(){
 ensureAudio();const idx=meta.stash.findIndex(x=>x.kind==='weapon'&&x.type===meta.selected);if(idx<0)return;
 const load=meta.stash.splice(idx,1)[0];save();$('#lobby').classList.add('hidden');$('#raid').classList.remove('hidden');lastResultHandled=false;killFeed=[];input=emptyInput();
 session=new LocalSession({weaponType:load.type});session.on('snapshot',s=>{snap=s;renderHUD();if(s.result&&!lastResultHandled)handleResult(s.result,load)});session.on('event',handleEvent);canvas.focus();
}

function handleEvent(e){
 if(e.type==='shot')shotSound(e.type);
 if(e.type==='kill'){killFeed.unshift(`${e.killer}  ▸  ${e.victim}`);killFeed=killFeed.slice(0,5);renderKillFeed()}
 if(e.type==='loot')toast(`획득: ${e.item}`);
 if(e.type==='equip')toast(`장착: ${e.item}`);
}
function renderKillFeed(){const el=$('#killFeed');el.innerHTML=killFeed.map(x=>`<div class="killMsg">${x}</div>`).join('')}
function toast(t){const el=$('#interactHint'),old=el.textContent;el.textContent=t;clearTimeout(toast.t);toast.t=setTimeout(()=>el.textContent=old,1000)}

function handleResult(result,originalLoad){
 lastResultHandled=true;session?.close();session=null;
 if(result.status==='extracted'){
   meta.stash.push({kind:'weapon',type:result.weapon.type,name:result.weapon.name,value:WEAPONS[result.weapon.type].price});
   for(const it of result.items||[]){if(it.kind==='weapon')meta.stash.push({kind:'weapon',type:it.type,name:it.name,value:it.value||WEAPONS[it.type].price});else meta.stash.push({...it})}
   meta.money+=Math.round((result.lootValue||0)*.15);save();showResult(true,result);
 }else{save();showResult(false,result)}
}
function showResult(ok,r){const p=$('#resultPanel');p.classList.remove('hidden');p.innerHTML=`<div class="resultCard"><h2 class="${ok?'success':'failed'}">${ok?'EXTRACTED':'RAID LOST'}</h2><p>${ok?`탈출 성공 · ${r.reason}`:`${r.reason} · 장비/전리품 상실`}</p><p>처치 ${r.kills||0} · 전리품 가치 ${money(r.lootValue||0)}</p><button id="backLobby" class="primary">로비로 돌아가기</button></div>`;$('#backLobby').onclick=()=>{p.classList.add('hidden');$('#raid').classList.add('hidden');$('#lobby').classList.remove('hidden');snap=null;renderLobby()}}

function renderHUD(){if(!snap?.player)return;const p=snap.player;$('#hpText').textContent=Math.ceil(p.hp);$('#hpBar').style.width=`${Math.max(0,p.hp)}%`;$('#armorText').textContent=Math.ceil(p.armor);$('#armorBar').style.width=`${Math.max(0,p.maxArmor?p.armor/p.maxArmor*100:0)}%`;$('#weaponName').textContent=p.weapon.name;$('#ammoText').textContent=`${p.weapon.ammo} / ${p.weapon.reserve}`;$('#fireMode').textContent=WEAPONS[p.weapon.type].auto?'AUTO':'SEMI';const m=Math.floor(snap.timeLeft/60),s=Math.floor(snap.timeLeft%60);$('#raidTimer').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;$('#killCount').textContent=p.kills;$('#aliveCount').textContent=snap.aliveAI;$('#bagCount').textContent=`${p.inventory.length}/8`;$('#lootValue').textContent=money(p.inventory.reduce((a,b)=>a+(b.value||0),0));renderBag();renderLoot();}
function itemSub(it){if(it.kind==='weapon')return `${WEAPONS[it.type].name} · ${it.ammo??WEAPONS[it.type].mag}/${it.reserve??0}`;if(it.kind==='ammo')return `탄약 ${it.qty}`;if(it.kind==='med')return `HP +${it.heal}`;return money(it.value||0)}
function renderBag(){const g=$('#bagGrid');g.innerHTML='';const inv=snap.player.inventory;for(let i=0;i<8;i++){const it=inv[i],d=document.createElement('div');d.className='bagSlot';if(it){d.innerHTML=`<b>${it.name}</b><small>${itemSub(it)}</small>`;if(it.kind==='weapon'){const b=document.createElement('button');b.textContent='장착';b.onclick=()=>session?.sendAction({type:ACTIONS.EQUIP,slot:i});d.appendChild(b)}}g.appendChild(d)}}
function renderLoot(){const p=$('#lootPanel'),c=snap.openContainer;if(!c){p.classList.add('hidden');return}p.classList.remove('hidden');p.innerHTML=`<div style="display:flex;justify-content:space-between"><b>${c.kind==='corpse'?`시체 · ${c.ownerName}`:'보급 상자'}</b><button id="closeLoot">×</button></div><div id="lootRows"></div>`;$('#closeLoot').onclick=()=>session?.sendAction({type:ACTIONS.CLOSE_CONTAINER});const rows=p.querySelector('#lootRows');if(!c.items.length)rows.innerHTML='<div class="muted" style="padding:12px">비어 있음</div>';for(const it of c.items){const r=document.createElement('div');r.className='lootRow';r.innerHTML=`<div><b>${it.name}</b><small>${itemSub(it)}</small></div>`;const b=document.createElement('button');b.textContent='획득';b.disabled=snap.player.inventory.length>=8;b.onclick=()=>session?.sendAction({type:ACTIONS.LOOT,itemId:it.id});r.appendChild(b);rows.appendChild(r)}}

function camera(){if(!snap?.player)return{x:0,y:0};return{x:Math.max(0,Math.min(snap.worldW-canvas.width,snap.player.x-canvas.width/2)),y:Math.max(0,Math.min(snap.worldH-canvas.height,snap.player.y-canvas.height/2))}}
function draw(){requestAnimationFrame(draw);if(!snap)return;const cam=camera();ctx.fillStyle='#0b0e10';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(-cam.x,-cam.y);drawGround();drawExtracts();drawObstacles();drawCrates();drawContainers();drawActors();drawBullets();ctx.restore();drawFog(cam);}
function drawGround(){ctx.fillStyle='#24292b';ctx.fillRect(0,0,snap.worldW,snap.worldH);ctx.fillStyle='#303538';ctx.fillRect(0,620,snap.worldW,300);ctx.fillRect(880,0,410,snap.worldH);ctx.strokeStyle='rgba(220,210,170,.12)';ctx.lineWidth=2;ctx.setLineDash([22,22]);ctx.beginPath();ctx.moveTo(0,770);ctx.lineTo(snap.worldW,770);ctx.moveTo(1085,0);ctx.lineTo(1085,snap.worldH);ctx.stroke();ctx.setLineDash([]);for(let y=0;y<snap.worldH;y+=64)for(let x=0;x<snap.worldW;x+=64){ctx.fillStyle=((x+y)/64%2)?'rgba(255,255,255,.012)':'rgba(0,0,0,.018)';ctx.fillRect(x,y,62,62)}}
function drawExtracts(){for(const e of snap.extracts){ctx.fillStyle='rgba(72,170,105,.12)';ctx.fillRect(e.x,e.y,e.w,e.h);ctx.strokeStyle='rgba(99,216,137,.65)';ctx.lineWidth=2;ctx.strokeRect(e.x,e.y,e.w,e.h);ctx.fillStyle='#8ad5a2';ctx.font='12px monospace';ctx.fillText(`EXTRACT // ${e.name}`,e.x+6,e.y+18)}}
function drawObstacles(){for(const o of snap.obstacles){ctx.fillStyle=o.kind==='container'?'#6a4935':o.kind==='tank'?'#555e5d':o.kind==='vehicle'?'#41494e':o.kind==='shelf'?'#493f32':'#2e353a';ctx.fillRect(o.x,o.y,o.w,o.h);ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(o.x,o.y,o.w,4);ctx.strokeStyle='rgba(0,0,0,.35)';ctx.strokeRect(o.x,o.y,o.w,o.h)}}
function drawCrates(){for(const c of snap.crates){ctx.fillStyle=c.opened?'#4b4639':'#77653b';ctx.fillRect(c.x-14,c.y-11,28,22);ctx.strokeStyle='#b49b5c';ctx.strokeRect(c.x-14,c.y-11,28,22)}}
function drawContainers(){for(const c of snap.containers){ctx.fillStyle='#3c2f2c';ctx.beginPath();ctx.ellipse(c.x,c.y,18,11,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8b7770';ctx.fillRect(c.x-8,c.y-6,16,8)}}
function actorColor(a){if(a.id===snap.playerId)return'#78bdd4';if(a.kind==='pmc')return'#b5b0a1';return'#a49b76'}
function drawActors(){for(const a of snap.actors){if(a.dead)continue;ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.angle);ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(0,9,14,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=actorColor(a);ctx.fillRect(-9,-10,18,21);ctx.fillStyle='#20252a';ctx.fillRect(-6,-14,12,7);ctx.strokeStyle='#d2d6d7';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(4,0);ctx.lineTo(24,0);ctx.stroke();ctx.restore();ctx.fillStyle='rgba(25,8,8,.75)';ctx.fillRect(a.x-15,a.y-24,30,3);ctx.fillStyle='#bd5757';ctx.fillRect(a.x-15,a.y-24,30*Math.max(0,a.hp/a.maxHp),3);if(a.id===snap.playerId){ctx.strokeStyle='#8bd3eb';ctx.lineWidth=2;ctx.beginPath();ctx.arc(a.x,a.y,18,0,Math.PI*2);ctx.stroke()}}}
function drawBullets(){for(const b of snap.bullets){const a=Math.atan2(b.vy,b.vx);ctx.strokeStyle='#f5d77e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x-Math.cos(a)*14,b.y-Math.sin(a)*14);ctx.lineTo(b.x,b.y);ctx.stroke()}}
function drawFog(cam){if(!snap?.player)return;const x=snap.player.x-cam.x,y=snap.player.y-cam.y,g=ctx.createRadialGradient(x,y,170,x,y,580);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.7,'rgba(0,0,0,.15)');g.addColorStop(1,'rgba(0,0,0,.58)');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);if(snap.extractProgress>0){ctx.fillStyle='rgba(5,8,10,.9)';ctx.fillRect(canvas.width/2-120,canvas.height-76,240,12);ctx.fillStyle='#77d49a';ctx.fillRect(canvas.width/2-118,canvas.height-74,236*Math.min(1,snap.extractProgress/3),8);ctx.fillStyle='#dff3e5';ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText(`탈출 중 ${(3-snap.extractProgress).toFixed(1)}초`,canvas.width/2,canvas.height-84);ctx.textAlign='start'}}

function updateInput(){if(!session||!snap?.player)return;let x=0,y=0;if(keys.has('w'))y--;if(keys.has('s'))y++;if(keys.has('a'))x--;if(keys.has('d'))x++;const cam=camera(),wx=mouse.x+cam.x,wy=mouse.y+cam.y,dx=wx-snap.player.x,dy=wy-snap.player.y,l=Math.hypot(dx,dy)||1;input={...input,seq:input.seq+1,moveX:x,moveY:y,aimX:dx/l,aimY:dy/l,sprint:keys.has('shift'),interact:keys.has('e'),reload:keys.has('r'),useMed:keys.has('1')};session.sendInput(input);input.reload=false;input.useMed=false;}
setInterval(updateInput,1000/30);
canvas.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect();mouse.x=(e.clientX-r.left)*canvas.width/r.width;mouse.y=(e.clientY-r.top)*canvas.height/r.height});canvas.addEventListener('mousedown',e=>{if(e.button===0){ensureAudio();input.shoot=true}});window.addEventListener('mouseup',e=>{if(e.button===0)input.shoot=false});canvas.addEventListener('contextmenu',e=>e.preventDefault());window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['w','a','s','d','shift','e','r','1'].includes(k))e.preventDefault();keys.add(k)});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
$('#raidBtn').onclick=startRaid;$('#abandonBtn').onclick=()=>{if(!session)return;if(confirm('장비와 전리품을 포기하고 로비로 돌아갈까요?')){session.close();session=null;lastResultHandled=true;$('#raid').classList.add('hidden');$('#lobby').classList.remove('hidden');snap=null;renderLobby()}};
renderLobby();requestAnimationFrame(draw);
