const WORLD_W=2500,WORLD_H=1700;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const len=(x,y)=>Math.hypot(x,y)||1;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const uid=(()=>{let n=1;return p=>p+(n++)})();

export const WEAPONS={
 pistol:{name:'M9 권총',icon:'▰',price:220,damage:29,mag:12,reserve:48,rate:.24,reload:1.45,speed:1020,spread:.025,range:850,auto:false},
 smg:{name:'VX-9 SMG',icon:'▰▰',price:520,damage:17,mag:30,reserve:120,rate:.078,reload:1.8,speed:900,spread:.075,range:720,auto:true},
 ar:{name:'AK-12 돌격소총',icon:'▰━',price:780,damage:24,mag:30,reserve:90,rate:.115,reload:2.05,speed:1080,spread:.042,range:970,auto:true},
 shotgun:{name:'M870 산탄총',icon:'▰═',price:690,damage:11,pellets:8,mag:6,reserve:30,rate:.72,reload:2.25,speed:880,spread:.19,range:520,auto:false},
 dmr:{name:'M14 DMR',icon:'▰━━',price:990,damage:44,mag:10,reserve:50,rate:.38,reload:2.35,speed:1250,spread:.018,range:1200,auto:false}
};

const rect=(x,y,w,h,kind='wall')=>({x,y,w,h,kind});
const MAP_OBSTACLES=[
  rect(230,180,520,34),rect(230,180,34,350),rect(230,496,210,34),rect(540,496,210,34),rect(716,180,34,350),
  rect(335,270,120,70,'machine'),rect(525,260,110,100,'machine'),
  rect(930,420,650,34),rect(930,420,34,430),rect(930,816,235,34),rect(1295,816,285,34),rect(1546,420,34,430),
  rect(1040,535,150,70,'shelf'),rect(1300,530,160,65,'shelf'),rect(1120,700,110,65,'shelf'),rect(1360,690,110,75,'shelf'),
  rect(1810,180,430,34),rect(1810,180,34,440),rect(1810,586,430,34),rect(2206,180,34,440),
  rect(1980,180,28,180),rect(1844,390,170,28),rect(2100,350,140,28),
  rect(320,1120,560,34),rect(320,1120,34,340),rect(320,1426,560,34),rect(846,1120,34,340),rect(500,1240,190,90,'vehicle'),
  rect(1030,1140,80,150,'tank'),rect(1180,1120,80,170,'tank'),rect(1340,1160,80,150,'tank'),rect(1510,1130,80,170,'tank'),
  rect(130,690,210,74,'container'),rect(390,650,210,74,'container'),rect(185,810,210,74,'container'),rect(470,820,210,74,'container'),
  rect(1860,1110,390,34),rect(1860,1110,34,280),rect(1860,1356,390,34),rect(2216,1110,34,280),rect(1990,1200,120,55,'barricade')
];

const SPAWNS=[{x:120,y:220},{x:2380,y:240},{x:120,y:1510},{x:2380,y:1510},{x:1220,y:120},{x:1200,y:1580}];
const PATROL_POINTS=[
 {x:460,y:380},{x:1160,y:610},{x:1430,y:610},{x:2040,y:300},{x:2050,y:520},{x:560,y:1320},
 {x:250,y:770},{x:540,y:760},{x:1080,y:1010},{x:1480,y:1010},{x:2040,y:1260},{x:820,y:930},{x:1660,y:760}
];
const EXTRACTS=[{id:'west',name:'서쪽 폐문',x:35,y:720,w:95,h:260},{id:'east',name:'동부 검문소',x:2280,y:1180,w:160,h:150}];
const CRATE_POS=[{x:410,y:340},{x:605,y:405},{x:1080,y:480},{x:1450,y:770},{x:1970,y:280},{x:2140,y:500},{x:610,y:1380},{x:1160,y:1040},{x:1540,y:1050},{x:2100,y:1320},{x:260,y:940}];

function weaponInstance(type,quality=1){const d=WEAPONS[type];return{kind:'weapon',id:uid('w'),type,name:d.name,damage:Math.round(d.damage*quality),mag:d.mag,ammo:d.mag,reserve:d.reserve,value:Math.round(d.price*quality)}}
function makeValuable(name,value){return{kind:'valuable',id:uid('v'),name,value}}
function makeMed(){return{kind:'med',id:uid('m'),name:'IFAK 치료키트',value:130,heal:45}}
function makeAmmo(type,qty){return{kind:'ammo',id:uid('a'),type,name:`${WEAPONS[type].name} 탄약`,qty,value:Math.round(qty*3)}}
function circleRectCollision(x,y,r,o){const cx=clamp(x,o.x,o.x+o.w),cy=clamp(y,o.y,o.y+o.h);return (x-cx)**2+(y-cy)**2<r*r}
function blocked(x,y,r){if(x-r<0||y-r<0||x+r>WORLD_W||y+r>WORLD_H)return true;return MAP_OBSTACLES.some(o=>circleRectCollision(x,y,r,o))}
function moveEntity(e,dx,dy){const nx=e.x+dx;if(!blocked(nx,e.y,e.r))e.x=nx;const ny=e.y+dy;if(!blocked(e.x,ny,e.r))e.y=ny}
function segmentBlocked(x1,y1,x2,y2){const d=Math.hypot(x2-x1,y2-y1),n=Math.ceil(d/18);for(let i=1;i<n;i++){const t=i/n,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;if(MAP_OBSTACLES.some(o=>x>o.x&&x<o.x+o.w&&y>o.y&&y<o.y+o.h))return true}return false}
function lineVisible(a,b,max=850){return dist(a,b)<=max&&!segmentBlocked(a.x,a.y,b.x,b.y)}
function randPatrol(){return{...PATROL_POINTS[Math.floor(Math.random()*PATROL_POINTS.length)]}}
function hostile(a,b){if(a.dead||b.dead||a.id===b.id)return false;if(a.kind==='scav'&&b.kind==='scav')return false;return true}

function makeActor(kind,x,y,weaponType,team){const w=weaponInstance(weaponType,kind==='pmc'?1.05:kind==='player'?1:0.9);return{id:uid(kind[0]),kind,team,x,y,r:13,hp:100,maxHp:100,armor:kind==='pmc'?45:kind==='player'?50:15,maxArmor:kind==='pmc'?45:kind==='player'?50:15,weapon:w,inventory:[makeMed()],dead:false,angle:0,moveSpeed:kind==='scav'?120:145,fireCd:Math.random(),reload:0,target:null,patrol:randPatrol(),think:0,heard:null,healTimer:0,kills:0,interactLock:0,name:kind==='player'?'YOU':kind==='scav'?`SCAV-${Math.floor(Math.random()*90+10)}`:`PMC-${Math.floor(Math.random()*90+10)}`};}

export function createWorld(config={}){
 const selected=config.weaponType&&WEAPONS[config.weaponType]?config.weaponType:'ar';
 const world={time:0,timeLeft:15*60,obstacles:MAP_OBSTACLES,extracts:EXTRACTS,actors:[],bullets:[],crates:[],containers:[],sounds:[],events:[],result:null,playerId:null,openContainerId:null,extractProgress:0};
 const p=makeActor('player',SPAWNS[2].x,SPAWNS[2].y,selected,'player');if(config.weapon) p.weapon={...config.weapon,id:uid('w')};p.inventory=[makeMed()];world.actors.push(p);world.playerId=p.id;
 const pmcWeapons=['ar','smg','shotgun','dmr'],pmcSpawnIdx=[0,1,3,4,5];for(let i=0;i<5;i++){const s=SPAWNS[pmcSpawnIdx[i]],a=makeActor('pmc',s.x+(Math.random()-.5)*80,s.y+(Math.random()-.5)*80,pmcWeapons[i%pmcWeapons.length],`pmc-${i}`);world.actors.push(a)}
 for(let i=0;i<11;i++){const pnt=PATROL_POINTS[i%PATROL_POINTS.length],a=makeActor('scav',pnt.x+(Math.random()-.5)*130,pnt.y+(Math.random()-.5)*130,Math.random()<.35?'shotgun':Math.random()<.5?'smg':'pistol','scav');world.actors.push(a)}
 for(const [i,pnt] of CRATE_POS.entries())world.crates.push({id:`crate-${i}`,x:pnt.x,y:pnt.y,r:18,opened:false,items:rollCrate(i)});
 return world;
}

function rollCrate(seed){const items=[];if(Math.random()<.8)items.push(makeValuable(['군용 무전기','암호화 SSD','공구 세트','의약품 상자','전자 제어기'][seed%5],220+Math.floor(Math.random()*520)));if(Math.random()<.55)items.push(makeAmmo(['pistol','smg','ar','shotgun','dmr'][seed%5],15+Math.floor(Math.random()*25)));if(Math.random()<.25)items.push(makeMed());return items}
function getPlayer(w){return w.actors.find(a=>a.id===w.playerId)}
function emit(w,type,data={}){w.events.push({type,...data})}
function addSound(w,x,y,range,type,source){w.sounds.push({x,y,range,type,source,age:0})}
function startReload(a){const d=WEAPONS[a.weapon.type];if(a.reload>0||a.weapon.ammo>=d.mag||a.weapon.reserve<=0)return;a.reload=d.reload}
function finishReload(a){const d=WEAPONS[a.weapon.type],need=d.mag-a.weapon.ammo,take=Math.min(need,a.weapon.reserve);a.weapon.ammo+=take;a.weapon.reserve-=take;a.reload=0}
function shoot(w,a,aimX,aimY,ai=false){const gun=WEAPONS[a.weapon.type];if(a.reload>0||a.fireCd>0)return;if(a.weapon.ammo<=0){startReload(a);return}a.weapon.ammo--;a.fireCd=gun.rate;const base=Math.atan2(aimY,aimX),pellets=gun.pellets||1;for(let i=0;i<pellets;i++){const spread=gun.spread*(ai?1.35:1),ang=base+(Math.random()-.5)*spread*2;w.bullets.push({id:uid('b'),owner:a.id,x:a.x+Math.cos(ang)*18,y:a.y+Math.sin(ang)*18,vx:Math.cos(ang)*gun.speed,vy:Math.sin(ang)*gun.speed,damage:gun.damage,life:gun.range/gun.speed});}addSound(w,a.x,a.y,gun===WEAPONS.pistol?430:gun===WEAPONS.smg?600:gun===WEAPONS.shotgun?760:850,'gunshot',a.id);emit(w,'shot',{actor:a.id,x:a.x,y:a.y,type:a.weapon.type})}

function damageActor(w,target,damage,source){if(target.dead)return;let left=damage;if(target.armor>0){const absorbed=Math.min(target.armor,left*.55);target.armor-=absorbed;left-=absorbed}target.hp-=left;emit(w,'hit',{target:target.id,source,damage:Math.round(damage)});if(target.hp<=0){target.hp=0;killActor(w,target,source)}}
function killActor(w,a,source){a.dead=true;const killer=w.actors.find(x=>x.id===source);if(killer)killer.kills++;const items=[a.weapon,...a.inventory];if(a.kind!=='player'){if(Math.random()<.6)items.push(makeValuable('인식표',a.kind==='pmc'?420:95));}const c={id:uid('corpse'),kind:'corpse',x:a.x,y:a.y,r:20,ownerName:a.name,items};w.containers.push(c);emit(w,'kill',{killer:killer?.name||'UNKNOWN',victim:a.name,playerKill:killer?.kind==='player'});if(a.kind==='player'){w.result={status:'dead',reason:'사망',lootValue:0,kills:a.kills};}}
function nearestHostile(w,a,max=750){let best=null,bd=max;for(const b of w.actors){if(!hostile(a,b))continue;const d=dist(a,b);if(d<bd&&lineVisible(a,b,max)){best=b;bd=d}}return best}
function chooseCover(a,target){let best=null,bestScore=Infinity;for(const o of MAP_OBSTACLES){const candidates=[{x:o.x-30,y:clamp(a.y,o.y,o.y+o.h)},{x:o.x+o.w+30,y:clamp(a.y,o.y,o.y+o.h)},{x:clamp(a.x,o.x,o.x+o.w),y:o.y-30},{x:clamp(a.x,o.x,o.x+o.w),y:o.y+o.h+30}];for(const c of candidates){if(blocked(c.x,c.y,a.r))continue;const score=Math.hypot(a.x-c.x,a.y-c.y)+Math.abs(260-Math.hypot(target.x-c.x,target.y-c.y))*.45;if(score<bestScore&&segmentBlocked(c.x,c.y,target.x,target.y)){bestScore=score;best=c}}}return best}
function moveToward(a,p,speed,dt){const dx=p.x-a.x,dy=p.y-a.y,l=len(dx,dy);moveEntity(a,dx/l*speed*dt,dy/l*speed*dt)}
function aiStep(w,a,dt){if(a.dead)return;a.fireCd=Math.max(0,a.fireCd-dt);if(a.reload>0){a.reload-=dt;if(a.reload<=0)finishReload(a)}a.think-=dt;if(a.healTimer>0){a.healTimer-=dt;if(a.healTimer<=0){const i=a.inventory.findIndex(x=>x.kind==='med');if(i>=0){a.inventory.splice(i,1);a.hp=Math.min(100,a.hp+45);emit(w,'heal',{actor:a.id})}}return}
 if(a.think<=0){a.think=.16+Math.random()*.12;const vis=nearestHostile(w,a,a.kind==='scav'?520:720);if(vis)a.target=vis.id;else if(a.heard&&w.time-a.heard.time<5)a.target=null;else a.target=null}
 const target=w.actors.find(x=>x.id===a.target&&!x.dead);if(target){const d=dist(a,target),dx=target.x-a.x,dy=target.y-a.y,l=len(dx,dy);a.angle=Math.atan2(dy,dx);if(a.kind==='pmc'&&a.hp<38&&a.inventory.some(x=>x.kind==='med')&&d>330){a.healTimer=1.8;return}
   let desired=a.kind==='scav'?250:310;if(a.weapon.type==='shotgun')desired=150;if(a.weapon.type==='dmr')desired=480;
   if(d>desired+65)moveEntity(a,dx/l*a.moveSpeed*dt,dy/l*a.moveSpeed*dt);else if(d<desired-70)moveEntity(a,-dx/l*a.moveSpeed*.75*dt,-dy/l*a.moveSpeed*.75*dt);else if(a.kind==='pmc'){const cover=chooseCover(a,target);if(cover&&dist(a,cover)>45)moveToward(a,cover,a.moveSpeed*.6,dt)}
   if(lineVisible(a,target,WEAPONS[a.weapon.type].range)&&d<WEAPONS[a.weapon.type].range){const jitter=(a.kind==='pmc'?.045:.095),ang=a.angle+(Math.random()-.5)*jitter;shoot(w,a,Math.cos(ang),Math.sin(ang),true)}
 }else if(a.heard&&w.time-a.heard.time<5){moveToward(a,a.heard,a.moveSpeed*.82,dt);a.angle=Math.atan2(a.heard.y-a.y,a.heard.x-a.x)}else{if(!a.patrol||dist(a,a.patrol)<45)a.patrol=randPatrol();moveToward(a,a.patrol,a.moveSpeed*.42,dt);a.angle=Math.atan2(a.patrol.y-a.y,a.patrol.x-a.x)}
 if(a.weapon.ammo<=0)startReload(a);
}
function updateHearing(w){for(const a of w.actors){if(a.dead||a.kind==='player')continue;let best=null;for(const s of w.sounds){if(s.source===a.id)continue;const d=Math.hypot(a.x-s.x,a.y-s.y);if(d<s.range&&(best==null||d<best.d))best={...s,d,time:w.time}}if(best)a.heard=best}}
function stepBullets(w,dt){for(const b of w.bullets){const ox=b.x,oy=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.life<=0||b.x<0||b.y<0||b.x>WORLD_W||b.y>WORLD_H){b.dead=true;continue}if(segmentBlocked(ox,oy,b.x,b.y)){b.dead=true;continue}for(const a of w.actors){if(a.dead||a.id===b.owner)continue;const owner=w.actors.find(x=>x.id===b.owner);if(owner&&!hostile(owner,a))continue;if(Math.hypot(a.x-b.x,a.y-b.y)<a.r+3){damageActor(w,a,b.damage,b.owner);b.dead=true;break}}}w.bullets=w.bullets.filter(b=>!b.dead)}

function playerStep(w,p,input,dt){if(p.dead||w.result)return;p.fireCd=Math.max(0,p.fireCd-dt);if(p.reload>0){p.reload-=dt;if(p.reload<=0)finishReload(p)}const i=input||{};let mx=Number(i.moveX)||0,my=Number(i.moveY)||0,l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}const speed=160*(i.sprint?1.45:1);moveEntity(p,mx*speed*dt,my*speed*dt);if(i.aimX||i.aimY)p.angle=Math.atan2(i.aimY||0,i.aimX||1);if(i.reload)startReload(p);if(i.shoot)shoot(w,p,Math.cos(p.angle),Math.sin(p.angle),false);if(i.useMed){const idx=p.inventory.findIndex(x=>x.kind==='med');if(idx>=0&&p.hp<100){p.inventory.splice(idx,1);p.hp=Math.min(100,p.hp+45);emit(w,'heal',{actor:p.id})}}
 let inExtract=null;for(const ex of EXTRACTS)if(p.x>ex.x&&p.x<ex.x+ex.w&&p.y>ex.y&&p.y<ex.y+ex.h)inExtract=ex;if(inExtract&&i.interact){w.extractProgress+=dt;if(w.extractProgress>=3){const value=p.inventory.reduce((s,x)=>s+(x.value||0),0);w.result={status:'extracted',reason:inExtract.name,lootValue:value,kills:p.kills,items:p.inventory.map(x=>({...x})),weapon:{...p.weapon}};emit(w,'extract',{name:inExtract.name})}}else w.extractProgress=0;
 if(i.interact&&!inExtract&&p.interactLock<=0){const c=findNearestContainer(w,p,55);if(c){w.openContainerId=c.id;p.interactLock=.3}}p.interactLock=Math.max(0,(p.interactLock||0)-dt);
}
function findNearestContainer(w,p,max){let best=null,bd=max;for(const c of [...w.crates,...w.containers]){const d=Math.hypot(c.x-p.x,c.y-p.y);if(d<bd){best=c;bd=d}}return best}
export function stepWorld(w,input,dt){if(w.result)return;w.time+=dt;w.timeLeft=Math.max(0,w.timeLeft-dt);const p=getPlayer(w);if(w.timeLeft<=0&&!w.result){w.result={status:'dead',reason:'RAID 시간 초과',lootValue:0,kills:p?.kills||0};return}playerStep(w,p,input,dt);if(w.openContainerId){const c=[...w.crates,...w.containers].find(x=>x.id===w.openContainerId);if(!c||dist(c,p)>75)w.openContainerId=null}for(const a of w.actors)if(a.kind!=='player')aiStep(w,a,dt);updateHearing(w);stepBullets(w,dt);for(const s of w.sounds){s.age+=dt}soundsCleanup(w);}
function soundsCleanup(w){w.sounds=w.sounds.filter(s=>s.age<1.1)}

export function applyAction(w,action){const p=getPlayer(w);if(!p||p.dead||w.result)return;if(action.type==='close-container'){w.openContainerId=null;return}if(action.type==='loot'){const c=[...w.crates,...w.containers].find(x=>x.id===w.openContainerId);if(!c||dist(c,p)>65||p.inventory.length>=8)return;const idx=c.items.findIndex(x=>x.id===action.itemId);if(idx<0)return;const item=c.items.splice(idx,1)[0];p.inventory.push(item);if(c.opened!==undefined)c.opened=true;emit(w,'loot',{item:item.name});return}if(action.type==='equip'){const idx=Number(action.slot);const item=p.inventory[idx];if(!item||item.kind!=='weapon')return;const old=p.weapon;p.weapon=item;p.inventory[idx]=old;emit(w,'equip',{item:item.name});}}
export function makeSnapshot(w){const p=getPlayer(w),open=[...w.crates,...w.containers].find(x=>x.id===w.openContainerId);return{time:w.time,timeLeft:w.timeLeft,worldW:WORLD_W,worldH:WORLD_H,obstacles:w.obstacles,extracts:w.extracts,crates:w.crates.map(c=>({id:c.id,x:c.x,y:c.y,r:c.r,opened:c.opened,itemCount:c.items.length})),containers:w.containers.map(c=>({id:c.id,kind:c.kind,x:c.x,y:c.y,r:c.r,ownerName:c.ownerName,itemCount:c.items.length})),actors:w.actors.map(a=>({id:a.id,kind:a.kind,name:a.name,x:a.x,y:a.y,r:a.r,hp:a.hp,maxHp:a.maxHp,armor:a.armor,maxArmor:a.maxArmor,dead:a.dead,angle:a.angle,weapon:{...a.weapon},reload:a.reload,kills:a.kills})),bullets:w.bullets.map(b=>({...b})),playerId:w.playerId,player:p?{...p,inventory:p.inventory.map(x=>({...x})),weapon:{...p.weapon}}:null,openContainer:open?{id:open.id,kind:open.kind,ownerName:open.ownerName,items:open.items.map(x=>({...x}))}:null,extractProgress:w.extractProgress,result:w.result?JSON.parse(JSON.stringify(w.result)):null,aliveAI:w.actors.filter(a=>!a.dead&&a.kind!=='player').length};}
