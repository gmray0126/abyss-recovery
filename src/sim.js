import {ACTIONS,emptyInput} from './protocol.js';

export const WORLD_W=4200,WORLD_H=3000;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distXY=(x1,y1,x2,y2)=>Math.hypot(x2-x1,y2-y1);
const dist=(a,b)=>distXY(a.x,a.y,b.x,b.y);
const norm=(x,y)=>{const l=Math.hypot(x,y)||1;return{x:x/l,y:y/l}};
const uid=(()=>{let n=1;return p=>`${p}${n++}`})();
const copy=o=>o?JSON.parse(JSON.stringify(o)):o;

export const WEAPONS={
 pistol:{name:'M9 권총',price:220,damage:28,mag:15,reserve:60,rate:.21,reload:1.35,speed:1180,spread:.018,range:900,auto:false,recoil:1.6,sound:620},
 smg:{name:'VX-9 SMG',price:540,damage:17,mag:30,reserve:120,rate:.075,reload:1.7,speed:1040,spread:.06,range:760,auto:true,recoil:1.15,sound:760},
 ar:{name:'AK-12 돌격소총',price:820,damage:24,mag:30,reserve:90,rate:.105,reload:1.95,speed:1260,spread:.035,range:1080,auto:true,recoil:2.0,sound:980},
 shotgun:{name:'M870 산탄총',price:730,damage:12,pellets:8,mag:6,reserve:30,rate:.68,reload:2.1,speed:980,spread:.17,range:520,auto:false,recoil:4.2,sound:1120},
 dmr:{name:'M14 DMR',price:1050,damage:46,mag:10,reserve:50,rate:.34,reload:2.2,speed:1460,spread:.012,range:1350,auto:false,recoil:3.4,sound:1180}
};

export const GEAR={
 armor_light:{kind:'armor',name:'경량 방탄복',price:480,armor:45,maxArmor:45},
 armor_heavy:{kind:'armor',name:'중형 방탄복',price:880,armor:72,maxArmor:72},
 helmet:{kind:'helmet',name:'방탄 헬멧',price:360,durability:35,maxDurability:35},
 backpack:{kind:'backpack',name:'전술 백팩',price:420,capacity:12},
 med:{kind:'med',name:'IFAK 치료키트',price:160,heal:45},
 grenade:{kind:'grenade',name:'M67 수류탄',price:240,damage:92,radius:165}
};

const rect=(x,y,w,h,kind='wall')=>({x,y,w,h,kind});
const O=[];
const add=(...r)=>O.push(...r);
// WEST CONTAINER YARD
add(rect(180,220,38,980),rect(180,220,1120,38),rect(1262,220,38,390),rect(1262,760,38,440),rect(180,1162,1120,38));
for(const [x,y,w,h] of [[310,360,300,76],[700,330,360,76],[270,520,360,76],[760,510,300,76],[340,700,300,76],[720,700,390,76],[260,890,350,76],[700,900,350,76]])add(rect(x,y,w,h,'container'));
add(rect(1130,420,72,170,'forklift'),rect(430,1030,170,70,'vehicle'),rect(900,1030,190,70,'vehicle'));
// CENTRAL WAREHOUSE with several doors
add(rect(1480,260,1280,38),rect(1480,260,38,1160),rect(2722,260,38,500),rect(2722,900,38,520),rect(1480,1382,520,38),rect(2140,1382,620,38));
for(const [x,y,w,h] of [[1650,430,260,55],[2050,430,260,55],[2420,430,190,55],[1680,650,220,55],[2020,650,260,55],[2390,650,220,55],[1640,930,260,55],[2050,930,220,55],[2390,930,220,55],[1770,1160,210,55],[2220,1160,250,55]])add(rect(x,y,w,h,'shelf'));
add(rect(1570,540,90,180,'machine'),rect(2560,1040,90,190,'machine'));
// EAST OFFICE / LAB
add(rect(3060,250,930,38),rect(3060,250,38,1030),rect(3952,250,38,1030),rect(3060,1242,350,38),rect(3530,1242,460,38));
add(rect(3340,250,28,370),rect(3630,250,28,360),rect(3098,650,400,28),rect(3610,650,342,28),rect(3290,820,28,422),rect(3610,820,28,422));
for(const [x,y,w,h] of [[3150,380,120,55],[3410,410,120,55],[3730,390,120,55],[3140,930,120,55],[3390,1020,140,55],[3700,960,140,55]])add(rect(x,y,w,h,'desk'));
// SOUTH WEST MAINTENANCE
add(rect(250,1760,1280,38),rect(250,1760,38,970),rect(1492,1760,38,420),rect(1492,2320,38,410),rect(250,2692,510,38),rect(900,2692,630,38));
add(rect(430,1940,300,120,'vehicle'),rect(900,1910,330,130,'vehicle'),rect(410,2250,170,210,'machine'),rect(760,2200,190,240,'machine'),rect(1130,2230,170,210,'machine'));
for(const [x,y,w,h] of [[340,2530,160,55],[570,2530,160,55],[1030,2520,180,55],[1260,2520,150,55]])add(rect(x,y,w,h,'cratewall'));
// SOUTH CENTRAL FUEL FARM
for(const [x,y,w,h] of [[1840,1850,150,210],[2100,1820,150,240],[2390,1860,150,210],[2650,1815,150,245],[1870,2280,150,220],[2170,2290,150,210],[2500,2280,150,220]])add(rect(x,y,w,h,'tank'));
add(rect(1740,1710,1160,34),rect(1740,1710,34,970),rect(2866,1710,34,970),rect(1740,2646,420,34),rect(2300,2646,600,34));
for(const [x,y,w,h] of [[1990,2140,180,42],[2290,2130,210,42],[2590,2150,180,42]])add(rect(x,y,w,h,'pipe'));
// EAST CHECKPOINT
add(rect(3180,1760,850,34),rect(3180,1760,34,950),rect(3996,1760,34,950),rect(3180,2676,310,34),rect(3600,2676,430,34));
add(rect(3290,1930,300,90,'vehicle'),rect(3690,2060,210,80,'vehicle'),rect(3350,2290,190,60,'barricade'),rect(3620,2320,240,60,'barricade'),rect(3470,2500,330,52,'barricade'));
// ROADSIDE COVER and scattered barricades
for(const [x,y,w,h,k] of [[1360,1530,170,55,'barricade'],[1600,1510,190,55,'barricade'],[2950,1470,200,55,'barricade'],[3220,1450,180,55,'barricade'],[2860,520,100,180,'truck'],[1360,650,80,180,'truck'],[2980,2140,120,80,'vehicle'],[1560,2400,120,80,'vehicle']])add(rect(x,y,w,h,k));
export const MAP_OBSTACLES=O;
export const DOOR_DEFS=[
 {id:'door-yard-east',name:'야적장 철문',x:1262,y:640,w:38,h:96},
 {id:'door-warehouse-east',name:'물류창고 동문',x:2722,y:782,w:38,h:96},
 {id:'door-warehouse-south',name:'물류창고 남문',x:2022,y:1382,w:96,h:38},
 {id:'door-office-south',name:'연구동 출입문',x:3422,y:1242,w:96,h:38},
 {id:'door-maint-east',name:'정비동 동문',x:1492,y:2202,w:38,h:96},
 {id:'door-maint-south',name:'정비동 남문',x:782,y:2692,w:96,h:38},
 {id:'door-fuel-south',name:'연료저장소 철문',x:2182,y:2646,w:96,h:34},
 {id:'door-check-south',name:'검문소 철문',x:3498,y:2676,w:94,h:34}
];

export const ZONES=[
 {name:'컨테이너 야적장',x:180,y:220,w:1120,h:980},{name:'중앙 물류창고',x:1480,y:260,w:1280,h:1160},{name:'행정 연구동',x:3060,y:250,w:930,h:1030},
 {name:'정비동',x:250,y:1760,w:1280,h:970},{name:'연료 저장소',x:1740,y:1710,w:1160,h:970},{name:'동부 검문소',x:3180,y:1760,w:850,h:950}
];
const SPAWNS=[{x:100,y:1500},{x:4080,y:1440},{x:1450,y:2860},{x:3000,y:2850},{x:2050,y:1500},{x:2950,y:150},{x:1300,y:150}];
const PATROLS=[{x:600,y:700},{x:2100,y:820},{x:3500,y:700},{x:850,y:2250},{x:2300,y:2200},{x:3600,y:2250},{x:3000,y:1500},{x:1450,y:1500},{x:2800,y:900}];
export const EXTRACTS=[{id:'west',name:'서쪽 폐문',x:25,y:1380,w:105,h:260},{id:'north',name:'북부 철도',x:1950,y:20,w:300,h:100},{id:'east',name:'동부 검문소',x:4055,y:2120,w:115,h:280}];
const CRATES=[
 {x:420,y:430},{x:1020,y:1040},{x:1260,y:740},{x:1580,y:360},{x:1940,y:820},{x:2660,y:1310},{x:3180,y:340},{x:3840,y:1160},
 {x:340,y:1840},{x:1410,y:2620},{x:1800,y:2550},{x:2800,y:1770},{x:3040,y:2550},{x:3900,y:1840},{x:3020,y:1320},{x:1540,y:1670}
];
const COVER_POINTS=[];
for(const o of MAP_OBSTACLES){if(o.w>500||o.h>500)continue;const m=28;COVER_POINTS.push({x:o.x-m,y:o.y+o.h/2},{x:o.x+o.w+m,y:o.y+o.h/2},{x:o.x+o.w/2,y:o.y-m},{x:o.x+o.w/2,y:o.y+o.h+m})}

function weaponItem(type,quality=1){const d=WEAPONS[type];return{kind:'weapon',id:uid('w'),type,name:d.name,damage:Math.round(d.damage*quality),ammo:d.mag,reserve:d.reserve,value:Math.round(d.price*quality)}}
function gearItem(key){const d=GEAR[key];return{id:uid('g'),key,...copy(d),value:d.price}}
function valuable(name,value){return{kind:'valuable',id:uid('v'),name,value}}
function ammoItem(type,qty){return{kind:'ammo',id:uid('a'),type,name:`${WEAPONS[type].name} 탄약`,qty,value:qty*3}}
function normalizeItem(it){const x=copy(it);if(!x.id)x.id=uid('i');if(x.kind==='weapon'){const d=WEAPONS[x.type];x.name=x.name||d.name;x.ammo=x.ammo??d.mag;x.reserve=x.reserve??d.reserve;x.damage=x.damage??d.damage;x.value=x.value??d.price}return x}
function circleRect(x,y,r,o){const cx=clamp(x,o.x,o.x+o.w),cy=clamp(y,o.y,o.y+o.h);return (x-cx)**2+(y-cy)**2<r*r}
function allBlockers(w){return w?[...w.obstacles,...w.doors.filter(d=>!d.open)]:MAP_OBSTACLES}
function blocked(w,x,y,r){if(x-r<0||y-r<0||x+r>WORLD_W||y+r>WORLD_H)return true;return allBlockers(w).some(o=>circleRect(x,y,r,o))}
function moveEntity(w,e,dx,dy){let moved=false;const nx=e.x+dx;if(!blocked(w,nx,e.y,e.r)){e.x=nx;moved=true}const ny=e.y+dy;if(!blocked(w,e.x,ny,e.r)){e.y=ny;moved=true}return moved}
function segmentBlocked(w,x1,y1,x2,y2){const d=distXY(x1,y1,x2,y2),n=Math.ceil(d/22);for(let i=1;i<n;i++){const t=i/n,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;if(allBlockers(w).some(o=>x>o.x&&x<o.x+o.w&&y>o.y&&y<o.y+o.h))return true}return false}
function los(w,a,b,max=1000){return dist(a,b)<=max&&!segmentBlocked(w,a.x,a.y,b.x,b.y)}
function angleDiff(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b))}
function visionParams(level=3){const near=190+level*34;return{near,far:near+430+level*58,half:1.05}}
function canSee(w,viewer,target,level=3){const d=dist(viewer,target),v=visionParams(level);if(d<=v.near)return !segmentBlocked(w,viewer.x,viewer.y,target.x,target.y);if(d>v.far)return false;const a=Math.atan2(target.y-viewer.y,target.x-viewer.x);return Math.abs(angleDiff(a,viewer.angle))<=v.half&&!segmentBlocked(w,viewer.x,viewer.y,target.x,target.y)}
function currentWeapon(a){return a.gear[a.weaponSlot]||null}
function bagCapacity(a){return a.gear.backpack?.capacity||8}
function emit(w,type,data={}){w.events.push({type,...data})}
function getActor(w,id){return w.actors.find(a=>a.id===id)}
function getPlayer(w,id){return getActor(w,id)}
function addSound(w,x,y,range,kind,source){w.sounds.push({x,y,range,kind,source,age:0});for(const pid of w.humanIds){if(pid===source)continue;const p=getPlayer(w,pid);if(!p||p.dead)continue;const d=distXY(x,y,p.x,p.y);if(d<=range){const angle=Math.atan2(y-p.y,x-p.x);emit(w,'heard',{recipient:pid,kind,angle,intensity:d<range*.35?'near':d<range*.7?'mid':'far'})}}}

function makeActor(kind,x,y,team,load={}){
 const primary=normalizeItem(load.primary||weaponItem(kind==='scav'?'pistol':'ar',kind==='pmc'?1.04:1));
 const secondary=load.secondary?normalizeItem(load.secondary):null;
 const armor=load.armor?normalizeItem(load.armor):kind==='pmc'?gearItem('armor_light'):kind==='scav'?null:gearItem('armor_light');
 const helmet=load.helmet?normalizeItem(load.helmet):kind==='pmc'?gearItem('helmet'):null;
 const backpack=load.backpack?normalizeItem(load.backpack):kind==='player'?gearItem('backpack'):null;
 const inventory=(load.inventory||[]).map(normalizeItem);
 return{id:uid(kind[0]),kind,team,name:load.name||kind.toUpperCase(),x,y,r:13,hp:100,maxHp:100,gear:{primary,secondary,armor,helmet,backpack},weaponSlot:'primary',inventory,angle:0,moveSpeed:kind==='scav'?126:150,fireCd:0,reload:0,input:emptyInput(),triggerHeld:false,dead:false,kills:0,thinkCd:Math.random()*.3,patrol:{...PATROLS[Math.floor(Math.random()*PATROLS.length)]},targetId:null,lastKnown:null,heard:null,cover:null,strafe:Math.random()<.5?-1:1,stepCd:Math.random()*.4,healCd:0,flinch:0,grenadeCd:5+Math.random()*6,sleepAcc:0,interactLatch:false,visionLevel:load.visionLevel||3};
}

function rollCrate(i){const out=[];const names=['암호화 SSD','군용 무전기','광학 부품','공구 세트','의약품 박스','배터리 팩','제어 모듈'];out.push(valuable(names[i%names.length],260+Math.floor(Math.random()*650)));if(Math.random()<.72)out.push(ammoItem(['pistol','smg','ar','shotgun','dmr'][i%5],18+Math.floor(Math.random()*35)));if(Math.random()<.38)out.push(gearItem('med'));if(Math.random()<.24)out.push(gearItem('grenade'));if(Math.random()<.12)out.push(weaponItem(['smg','ar','shotgun','dmr'][i%4],1+.04*Math.random()));return out}

export function createWorld(config={}){
 const players=config.players||[{}];const w={time:0,timeLeft:18*60,obstacles:MAP_OBSTACLES.map(copy),doors:DOOR_DEFS.map(d=>({...d,open:false})),zones:ZONES,extracts:EXTRACTS,actors:[],humanIds:[],bullets:[],grenades:[],crates:[],corpses:[],sounds:[],events:[],results:{},openContainers:{},interactions:{},inputs:{}};
 players.forEach((pc,i)=>{const s=SPAWNS[i%SPAWNS.length],a=makeActor('player',s.x,s.y,`human-${i}`,{name:pc.name||`PLAYER-${i+1}`,primary:pc.equipment?.primary,secondary:pc.equipment?.secondary,armor:pc.equipment?.armor,helmet:pc.equipment?.helmet,backpack:pc.equipment?.backpack,inventory:pc.inventory||[],visionLevel:pc.visionLevel||3});w.actors.push(a);w.humanIds.push(a.id);w.inputs[a.id]=emptyInput()});
 const pmcLoads=[{primary:weaponItem('ar',1.05),inventory:[gearItem('med'),gearItem('grenade')]},{primary:weaponItem('dmr',1.04),secondary:weaponItem('pistol'),inventory:[gearItem('med')]}];
 const pmcPos=[{x:2500,y:1570},{x:3500,y:720}];pmcPos.forEach((p,i)=>w.actors.push(makeActor('pmc',p.x,p.y,`pmc-${i}`,{name:`RAIDER-${21+i}`,...pmcLoads[i]})));
 const scavPos=[{x:630,y:670},{x:2100,y:860},{x:820,y:2220},{x:2350,y:2210},{x:3590,y:2280}];const scavGuns=['smg','shotgun','pistol','smg','shotgun'];scavPos.forEach((p,i)=>w.actors.push(makeActor('scav',p.x,p.y,'scav',{name:`SCAV-${40+i}`,primary:weaponItem(scavGuns[i],.92),inventory:Math.random()<.4?[gearItem('med')]:[]})));
 CRATES.forEach((p,i)=>w.crates.push({id:`crate-${i}`,kind:'crate',x:p.x,y:p.y,r:19,opened:false,items:rollCrate(i)}));
 return w;
}

export function setPlayerInput(w,id,input){const a=getPlayer(w,id);if(!a||a.dead)return;w.inputs[id]={...w.inputs[id],...input};a.input=w.inputs[id]}
function startReload(a){const gun=currentWeapon(a);if(!gun)return;const d=WEAPONS[gun.type];if(a.reload>0||gun.ammo>=d.mag||gun.reserve<=0)return;a.reload=d.reload}
function finishReload(a){const gun=currentWeapon(a);if(!gun)return;const d=WEAPONS[gun.type],need=d.mag-gun.ammo,take=Math.min(need,gun.reserve);gun.ammo+=take;gun.reserve-=take;a.reload=0}
function shoot(w,a,aimX,aimY,ai=false){const gun=currentWeapon(a);if(!gun)return;const d=WEAPONS[gun.type];if(a.reload>0||a.fireCd>0||a.flinch>0)return;if(gun.ammo<=0){startReload(a);return}gun.ammo--;a.fireCd=d.rate;const base=Math.atan2(aimY,aimX),pellets=d.pellets||1;for(let i=0;i<pellets;i++){const spread=d.spread*(ai?1.35:1),ang=base+(Math.random()-.5)*spread*2;w.bullets.push({id:uid('b'),owner:a.id,x:a.x+Math.cos(ang)*21,y:a.y+Math.sin(ang)*21,vx:Math.cos(ang)*d.speed,vy:Math.sin(ang)*d.speed,damage:gun.damage||d.damage,life:d.range/d.speed,headChance:ai?.10:.18})}if(w.bullets.length>360)w.bullets.splice(0,w.bullets.length-360);addSound(w,a.x,a.y,d.sound,'gunshot',a.id);emit(w,'shot',{actor:a.id,x:a.x,y:a.y,weapon:gun.type,recoil:d.recoil})}
function hostile(a,b){if(!a||!b||a.dead||b.dead||a.id===b.id)return false;if(a.team===b.team)return false;if(a.kind==='scav'&&b.kind==='scav')return false;return true}
function damageActor(w,t,raw,source,headshot=false){if(t.dead)return;let damage=raw;if(headshot&&t.gear.helmet?.durability>0){const absorbed=Math.min(t.gear.helmet.durability,damage*.42);t.gear.helmet.durability-=absorbed;damage-=absorbed}if(t.gear.armor?.armor>0){const absorbed=Math.min(t.gear.armor.armor,damage*.48);t.gear.armor.armor-=absorbed;damage-=absorbed}t.hp-=damage;t.flinch=.07;emit(w,'hit',{target:t.id,source,damage:Math.round(damage),headshot});if(t.hp<=0){t.hp=0;killActor(w,t,source)}}
function killActor(w,a,source){if(a.dead)return;a.dead=true;const killer=getActor(w,source);if(killer)killer.kills++;const items=[];for(const k of ['primary','secondary','armor','helmet','backpack'])if(a.gear[k])items.push(normalizeItem(a.gear[k]));items.push(...a.inventory.map(normalizeItem));if(a.kind!=='player')items.push(valuable('인식표',a.kind==='pmc'?480:110));w.corpses.push({id:uid('corpse'),kind:'corpse',x:a.x,y:a.y,r:20,ownerName:a.name,items});emit(w,'kill',{killer:killer?.name||'UNKNOWN',victim:a.name,playerKill:killer?.kind==='player'});if(a.kind==='player')w.results[a.id]={status:'dead',reason:'사망',kills:a.kills,lootValue:0}}

function getContainer(w,id){return w.crates.find(c=>c.id===id)||w.corpses.find(c=>c.id===id)}
function nearContainer(w,p,max=72){let best=null,bd=max;for(const c of [...w.crates,...w.corpses]){const d=dist(p,c);if(d<bd){best=c;bd=d}}return best}
function nearExtract(w,p){return w.extracts.find(e=>p.x>e.x&&p.x<e.x+e.w&&p.y>e.y&&p.y<e.y+e.h)}
function nearDoor(w,p,max=82){let best=null,bd=max;for(const d of w.doors){const cx=d.x+d.w/2,cy=d.y+d.h/2,dd=distXY(p.x,p.y,cx,cy);if(dd<bd){best=d;bd=dd}}return best}
function updateInteraction(w,p,dt){const inp=w.inputs[p.id]||emptyInput();const openId=w.openContainers[p.id];if(openId){const c=getContainer(w,openId);if(!c||dist(p,c)>145)delete w.openContainers[p.id]}
 if(!inp.interact){p.interactLatch=false;delete w.interactions[p.id];return}
 const ext=nearExtract(w,p);if(ext){let q=w.interactions[p.id];if(!q||q.kind!=='extract'||q.targetId!==ext.id)q=w.interactions[p.id]={kind:'extract',targetId:ext.id,progress:0,duration:3};q.progress+=dt;if(q.progress>=q.duration){const loot=p.inventory.reduce((s,i)=>s+(i.value||0),0);w.results[p.id]={status:'extracted',reason:ext.name,kills:p.kills,lootValue:loot,equipment:copy(p.gear),items:copy(p.inventory)};emit(w,'extract',{recipient:p.id,name:ext.name})}return}
 const door=nearDoor(w,p);if(door){if(!p.interactLatch){door.open=!door.open;emit(w,'door',{recipient:p.id,id:door.id,name:door.name,open:door.open});addSound(w,door.x+door.w/2,door.y+door.h/2,180,'door',p.id)}p.interactLatch=true;delete w.interactions[p.id];delete w.openContainers[p.id];return}
 p.interactLatch=true;
 const c=nearContainer(w,p);if(!c){delete w.interactions[p.id];return}if(c.opened||c.kind==='corpse'){w.openContainers[p.id]=c.id;delete w.interactions[p.id];return}
 let q=w.interactions[p.id];if(!q||q.kind!=='container'||q.targetId!==c.id)q=w.interactions[p.id]={kind:'container',targetId:c.id,progress:0,duration:1.15};q.progress+=dt;if(q.progress>=q.duration){c.opened=true;w.openContainers[p.id]=c.id;delete w.interactions[p.id];emit(w,'container_open',{recipient:p.id,id:c.id})}}

function applyBagEquip(p,index){const it=p.inventory[index];if(!it)return false;if(it.kind==='weapon'){const slot=p.weaponSlot||'primary',old=p.gear[slot];p.gear[slot]=it;p.inventory[index]=old||null;if(!p.inventory[index])p.inventory.splice(index,1);p.reload=0;return true}if(it.kind==='armor'||it.kind==='helmet'||it.kind==='backpack'){const slot=it.kind,old=p.gear[slot];p.gear[slot]=it;p.inventory[index]=old||null;if(!p.inventory[index])p.inventory.splice(index,1);return true}return false}
function throwGrenade(w,p){const i=p.inventory.findIndex(x=>x.kind==='grenade');if(i<0)return;const g=p.inventory.splice(i,1)[0],v=norm(p.input.aimX,p.input.aimY);w.grenades.push({id:uid('nade'),owner:p.id,x:p.x+v.x*22,y:p.y+v.y*22,vx:v.x*520,vy:v.y*520,fuse:2.2,damage:g.damage||92,radius:g.radius||165});addSound(w,p.x,p.y,180,'throw',p.id);emit(w,'grenade_throw',{actor:p.id})}
function useMed(w,p){if(p.hp>=p.maxHp)return;const i=p.inventory.findIndex(x=>x.kind==='med');if(i<0)return;const m=p.inventory.splice(i,1)[0];p.hp=Math.min(p.maxHp,p.hp+(m.heal||45));emit(w,'heal',{actor:p.id})}
export function applyAction(w,id,action){const p=getPlayer(w,id);if(!p||p.dead||w.results[id])return;if(action.type===ACTIONS.CLOSE_CONTAINER)delete w.openContainers[id];else if(action.type===ACTIONS.LOOT){const c=getContainer(w,action.containerId||w.openContainers[id]);if(!c||dist(p,c)>145||p.inventory.length>=bagCapacity(p))return;const i=c.items.findIndex(x=>x.id===action.itemId);if(i<0)return;const it=c.items.splice(i,1)[0];p.inventory.push(normalizeItem(it));w.openContainers[id]=c.id;emit(w,'loot',{recipient:id,item:it.name,itemId:it.id})}else if(action.type===ACTIONS.EQUIP_BAG){if(applyBagEquip(p,action.slot))emit(w,'equip',{recipient:id,item:currentWeapon(p)?.name||'장비'})}else if(action.type===ACTIONS.SWAP_WEAPON){const slot=action.slot==='secondary'?'secondary':'primary';if(p.gear[slot]){p.weaponSlot=slot;p.reload=0;emit(w,'equip',{recipient:id,item:p.gear[slot].name})}}else if(action.type===ACTIONS.GRENADE)throwGrenade(w,p);else if(action.type===ACTIONS.USE_MED)useMed(w,p)}

function movePlayer(w,p,dt){const inp=w.inputs[p.id]||emptyInput(),v=norm(inp.moveX,inp.moveY);if(inp.moveX||inp.moveY){const sp=p.moveSpeed*(inp.sprint?1.48:1);moveEntity(w,p,v.x*sp*dt,v.y*sp*dt);p.stepCd-=dt;if(p.stepCd<=0){p.stepCd=inp.sprint?.36:.58;addSound(w,p.x,p.y,inp.sprint?250:135,'footstep',p.id)}}p.angle=Math.atan2(inp.aimY,inp.aimX);p.fireCd=Math.max(0,p.fireCd-dt);p.flinch=Math.max(0,p.flinch-dt);if(p.reload>0){p.reload-=dt;if(p.reload<=0)finishReload(p)}if(inp.reload)startReload(p);const gun=currentWeapon(p),def=gun?WEAPONS[gun.type]:null;if(inp.shoot&&def&&(def.auto||!p.triggerHeld))shoot(w,p,inp.aimX,inp.aimY,false);p.triggerHeld=!!inp.shoot;updateInteraction(w,p,dt)}

function nearestVisibleHostile(w,a,max){let best=null,bd=max;for(const b of w.actors){if(!hostile(a,b))continue;const d=dist(a,b);if(d<bd&&canSee(w,a,b,a.kind==='pmc'?4:2)){best=b;bd=d}}return best}
function recentHeard(w,a){let best=null,score=Infinity;for(const s of w.sounds){if(s.source===a.id||s.age>2.1)continue;const d=distXY(a.x,a.y,s.x,s.y);if(d>s.range*.8)continue;const v=d+(s.kind==='gunshot'?0:220);if(v<score){score=v;best=s}}return best}
function chooseCover(w,a,target){let best=null,score=Infinity;for(const c of COVER_POINTS){const da=distXY(a.x,a.y,c.x,c.y);if(da>470||blocked(w,c.x,c.y,a.r))continue;if(!segmentBlocked(w,c.x,c.y,target.x,target.y))continue;const dt=distXY(target.x,target.y,c.x,c.y),s=da+Math.abs(300-dt)*.35;if(s<score){score=s;best=c}}return best}
function steerToward(w,a,tx,ty,speed,dt){const n=norm(tx-a.x,ty-a.y);if(moveEntity(w,a,n.x*speed*dt,n.y*speed*dt))return;const s=a.strafe||1;if(!moveEntity(w,a,-n.y*s*speed*.72*dt,n.x*s*speed*.72*dt))a.strafe*=-1}
function aiFire(w,a,t){const n=norm(t.x-a.x,t.y-a.y),err=a.kind==='pmc'?.035:.075,ang=Math.atan2(n.y,n.x)+(Math.random()-.5)*err*2;shoot(w,a,Math.cos(ang),Math.sin(ang),true)}
function aiStep(w,a,dt){if(a.dead)return;a.fireCd=Math.max(0,a.fireCd-dt);a.flinch=Math.max(0,a.flinch-dt);a.grenadeCd=Math.max(0,a.grenadeCd-dt);if(a.reload>0){a.reload-=dt;if(a.reload<=0)finishReload(a)}const humans=w.humanIds.map(id=>getPlayer(w,id)).filter(Boolean),nearHuman=humans.some(p=>!p.dead&&dist(a,p)<1500);if(!nearHuman&&!a.targetId&&!a.heard){a.sleepAcc+=dt;if(a.sleepAcc<.28)return;dt=a.sleepAcc;a.sleepAcc=0}else a.sleepAcc=0;
 a.thinkCd-=dt;if(a.thinkCd<=0){a.thinkCd=a.kind==='pmc'?.22:.34;const vis=nearestVisibleHostile(w,a,a.kind==='pmc'?820:610);if(vis){a.targetId=vis.id;a.lastKnown={x:vis.x,y:vis.y,time:w.time};if(a.kind==='pmc')a.cover=chooseCover(w,a,vis)}else{const h=recentHeard(w,a);if(h){a.heard={x:h.x,y:h.y,time:w.time};a.targetId=null}else if(a.lastKnown&&w.time-a.lastKnown.time>5)a.lastKnown=null}}
 const t=getActor(w,a.targetId);if(t&&!t.dead&&canSee(w,a,t,a.kind==='pmc'?4:2)){const gun=currentWeapon(a),def=WEAPONS[gun.type],d=dist(a,t),desired=gun.type==='shotgun'?145:gun.type==='dmr'?520:a.kind==='pmc'?330:250;a.angle=Math.atan2(t.y-a.y,t.x-a.x);
   if(a.kind==='pmc'&&a.grenadeCd<=0&&d>230&&d<520&&a.inventory.some(i=>i.kind==='grenade')&&Math.random()<.035){const old=a.input;a.input={...old,aimX:Math.cos(a.angle),aimY:Math.sin(a.angle)};throwGrenade(w,a);a.grenadeCd=9+Math.random()*5;return}
   if(a.cover&&distXY(a.x,a.y,a.cover.x,a.cover.y)>42)steerToward(w,a,a.cover.x,a.cover.y,a.moveSpeed,dt);else if(d>desired+80)steerToward(w,a,t.x,t.y,a.moveSpeed,dt);else if(d<desired-70){const n=norm(t.x-a.x,t.y-a.y);moveEntity(w,a,-n.x*a.moveSpeed*.7*dt,-n.y*a.moveSpeed*.7*dt)}else{const n=norm(t.x-a.x,t.y-a.y);moveEntity(w,a,-n.y*a.strafe*a.moveSpeed*.28*dt,n.x*a.strafe*a.moveSpeed*.28*dt)}
   if(d<Math.min(def.range*.82,a.kind==='pmc'?760:560)&&!segmentBlocked(w,a.x,a.y,t.x,t.y))aiFire(w,a,t);if(gun.ammo<=0)startReload(a);return}
 const goal=a.lastKnown||a.heard||a.patrol;if(goal){a.angle=Math.atan2(goal.y-a.y,goal.x-a.x);if(distXY(a.x,a.y,goal.x,goal.y)>45)steerToward(w,a,goal.x,goal.y,a.moveSpeed*.72,dt);else{if(a.heard)a.heard=null;if(a.lastKnown)a.lastKnown=null;a.patrol={...PATROLS[Math.floor(Math.random()*PATROLS.length)]}}}}

function updateBullets(w,dt){for(const b of w.bullets){let alive=true;const steps=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vy)*dt/24)),sd=dt/steps;for(let s=0;s<steps&&alive;s++){b.x+=b.vx*sd;b.y+=b.vy*sd;b.life-=sd;if(b.life<=0||b.x<0||b.y<0||b.x>WORLD_W||b.y>WORLD_H){alive=false;break}if(allBlockers(w).some(o=>b.x>o.x&&b.x<o.x+o.w&&b.y>o.y&&b.y<o.y+o.h)){emit(w,'impact',{x:b.x,y:b.y});alive=false;break}for(const a of w.actors){if(a.dead||a.id===b.owner)continue;if(distXY(b.x,b.y,a.x,a.y)<a.r+3){const hs=Math.random()<b.headChance;damageActor(w,a,b.damage,b.owner,hs);alive=false;break}}}b.alive=alive}w.bullets=w.bullets.filter(b=>b.alive)}
function updateGrenades(w,dt){for(const g of w.grenades){g.fuse-=dt;g.vx*=Math.pow(.64,dt);g.vy*=Math.pow(.64,dt);const nx=g.x+g.vx*dt,ny=g.y+g.vy*dt;if(blocked(w,nx,g.y,7))g.vx*=-.48;else g.x=nx;if(blocked(w,g.x,ny,7))g.vy*=-.48;else g.y=ny;if(g.fuse<=0){for(const a of w.actors){if(a.dead)continue;const d=distXY(g.x,g.y,a.x,a.y);if(d>g.radius)continue;const cover=segmentBlocked(w,g.x,g.y,a.x,a.y),fall=1-d/g.radius,raw=g.damage*(.35+.65*fall)*(cover?.22:1);damageActor(w,a,raw,g.owner,false)}emit(w,'explosion',{x:g.x,y:g.y,radius:g.radius,owner:g.owner});addSound(w,g.x,g.y,1350,'explosion',g.owner);g.dead=true}}w.grenades=w.grenades.filter(g=>!g.dead)}

export function stepWorld(w,dt){if(dt<=0)return;w.time+=dt;w.timeLeft=Math.max(0,w.timeLeft-dt);for(const s of w.sounds)s.age+=dt;w.sounds=w.sounds.filter(s=>s.age<2.2);for(const id of w.humanIds){const p=getPlayer(w,id);if(p&&!p.dead&&!w.results[id])movePlayer(w,p,dt)}for(const a of w.actors)if(a.kind!=='player')aiStep(w,a,dt);updateBullets(w,dt);updateGrenades(w,dt);if(w.timeLeft<=0){for(const id of w.humanIds)if(!w.results[id]){const p=getPlayer(w,id);w.results[id]={status:'dead',reason:'시간 초과',kills:p?.kills||0,lootValue:0}}}}

function publicItem(it){if(!it)return null;return copy(it)}
function actorPublic(a){const gun=currentWeapon(a);return{id:a.id,kind:a.kind,name:a.name,x:a.x,y:a.y,r:a.r,hp:a.hp,maxHp:a.maxHp,angle:a.angle,dead:a.dead,weaponType:gun?.type||null}}
export function buildSnapshot(w,viewerId){const p=getPlayer(w,viewerId);if(!p)return null;const visible=w.actors.filter(a=>a.id===viewerId||(!a.dead&&canSee(w,p,a,p.visionLevel))).map(actorPublic);const openId=w.openContainers[viewerId],oc=getContainer(w,openId);const interaction=w.interactions[viewerId]?copy(w.interactions[viewerId]):null;const gear={};for(const k of ['primary','secondary','armor','helmet','backpack'])gear[k]=publicItem(p.gear[k]);const gun=currentWeapon(p);return{time:w.time,timeLeft:w.timeLeft,worldW:WORLD_W,worldH:WORLD_H,obstacles:w.obstacles,zones:w.zones,extracts:w.extracts,crates:w.crates.filter(c=>canSee(w,p,c,p.visionLevel)).map(c=>({id:c.id,x:c.x,y:c.y,opened:c.opened,empty:c.items.length===0})),corpses:w.corpses.filter(c=>canSee(w,p,c,p.visionLevel)).map(c=>({id:c.id,x:c.x,y:c.y,ownerName:c.ownerName,empty:c.items.length===0})),doors:w.doors.filter(d=>canSee(w,p,{x:d.x+d.w/2,y:d.y+d.h/2},p.visionLevel)).map(d=>({id:d.id,name:d.name,x:d.x,y:d.y,w:d.w,h:d.h,open:d.open})),actors:visible,bullets:w.bullets.filter(b=>distXY(p.x,p.y,b.x,b.y)<1100).map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy,owner:b.owner})),grenades:w.grenades.filter(g=>distXY(p.x,p.y,g.x,g.y)<1100).map(g=>({x:g.x,y:g.y,fuse:g.fuse})),playerId:viewerId,aliveAI:w.actors.filter(a=>a.kind!=='player'&&!a.dead).length,player:{id:p.id,x:p.x,y:p.y,hp:p.hp,maxHp:p.maxHp,angle:p.angle,kills:p.kills,visionLevel:p.visionLevel,weaponSlot:p.weaponSlot,weapon:publicItem(gun),gear,inventory:p.inventory.map(publicItem),bagCapacity:bagCapacity(p),armor:p.gear.armor?.armor||0,maxArmor:p.gear.armor?.maxArmor||p.gear.armor?.armor||0,reload:p.reload},openContainer:oc?{id:oc.id,kind:oc.kind,ownerName:oc.ownerName,items:oc.items.map(publicItem)}:null,interaction,result:w.results[viewerId]?copy(w.results[viewerId]):null};}
export function drainEvents(w){const e=w.events;w.events=[];return e}
