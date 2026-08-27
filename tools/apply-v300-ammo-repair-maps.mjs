import fs from 'node:fs';

function patch(path, fn){
  let s=fs.readFileSync(path,'utf8');
  const out=fn(s);
  if(out===s) throw new Error(`no changes: ${path}`);
  fs.writeFileSync(path,out);
}
function between(s,start,end,repl){
  const a=s.indexOf(start),b=s.indexOf(end,a);
  if(a<0||b<0)throw new Error(`boundary missing: ${start} -> ${end}`);
  return s.slice(0,a)+repl+s.slice(b);
}

patch('src/sim.js',s=>{
  const weaponBlock=`export const WEAPONS={
 pistol:{name:'M9 권총',price:220,damage:28,mag:15,caliber:'9mm',rate:.21,reload:1.35,speed:1180,spread:.018,range:900,auto:false,recoil:1.6,sound:620},
 smg:{name:'VX-9 SMG',price:540,damage:17,mag:30,caliber:'9mm',rate:.075,reload:1.7,speed:1040,spread:.06,range:760,auto:true,recoil:1.15,sound:760},
 ar:{name:'AK-12 돌격소총',price:820,damage:24,mag:30,caliber:'5.56',rate:.105,reload:1.95,speed:1260,spread:.035,range:1080,auto:true,recoil:2.0,sound:980},
 shotgun:{name:'M870 산탄총',price:730,damage:12,pellets:8,mag:6,caliber:'12g',rate:.68,reload:2.1,speed:980,spread:.17,range:520,auto:false,recoil:4.2,sound:1120},
 dmr:{name:'M14 DMR',price:1050,damage:46,mag:10,caliber:'7.62',rate:.34,reload:2.2,speed:1460,spread:.012,range:1350,auto:false,recoil:3.4,sound:1180}
};

export const AMMO_TIERS={
 1:{name:'T1',damageMult:.85,unitPrice:3},
 2:{name:'T2',damageMult:1.00,unitPrice:5},
 3:{name:'T3',damageMult:1.15,unitPrice:8},
 4:{name:'T4',damageMult:1.32,unitPrice:13},
 5:{name:'T5',damageMult:1.52,unitPrice:20}
};
export const AMMO_CALIBERS={
 '9mm':{name:'9×19mm',pack:30},
 '5.56':{name:'5.56mm',pack:30},
 '7.62':{name:'7.62mm',pack:30},
 '12g':{name:'12게이지',pack:12}
};

`;
  s=between(s,'export const WEAPONS={','export const GEAR={',weaponBlock);

  const mapInsert=`
const MAP_PALETTES={
 industrial:{ground:'#1b2223',gridA:'#1d2627',gridB:'#20292a',road:'#29363a',line:'rgba(221,184,92,.16)',wall:'#354044',container:'#87573b',vehicle:'#415763',tank:'#58634a',shelf:'#6e5a39',machine:'#3f6061',desk:'#594a43',barricade:'#75603e',pipe:'#526a62',water:'#25505e',door:'#936f49'},
 harbor:{ground:'#19262b',gridA:'#1b2a30',gridB:'#1e3036',road:'#30414a',line:'rgba(118,196,214,.16)',wall:'#354c56',container:'#a15d3c',vehicle:'#426675',tank:'#667356',shelf:'#78603b',machine:'#396b70',desk:'#5c5148',barricade:'#897044',pipe:'#557c77',water:'#173f52',door:'#a77645'},
 research:{ground:'#202229',gridA:'#242630',gridB:'#272a34',road:'#303541',line:'rgba(129,211,190,.15)',wall:'#424752',container:'#6a5668',vehicle:'#4d5f70',tank:'#5c6755',shelf:'#665b76',machine:'#3f6c68',desk:'#605567',barricade:'#77674e',pipe:'#4f716b',water:'#284c55',door:'#92745e'}
};
function coverPointsFor(obstacles){const out=[];for(const o of obstacles){if(o.w>500||o.h>500||o.kind==='water')continue;const m=28;out.push({x:o.x-m,y:o.y+o.h/2},{x:o.x+o.w+m,y:o.y+o.h/2},{x:o.x+o.w/2,y:o.y-m},{x:o.x+o.w/2,y:o.y+o.h+m})}return out}
function portMap(){
 const o=[],a=(...r)=>o.push(...r);
 // northern container stacks and customs shed
 for(const [x,y,w,h] of [[240,260,340,74],[660,250,300,74],[1040,300,270,74],[280,470,300,74],[690,500,390,74],[250,720,390,74],[760,760,360,74],[310,980,300,74],[720,1010,430,74]])a(rect(x,y,w,h,'container'));
 a(rect(1450,220,1180,34),rect(1450,220,34,850),rect(2596,220,34,350),rect(2596,720,34,350),rect(1450,1036,420,34),rect(2010,1036,620,34));
 for(const [x,y,w,h] of [[1600,380,220,52],[1920,380,220,52],[2250,380,220,52],[1580,650,250,52],[1960,650,250,52],[2310,650,190,52],[1700,880,260,52],[2180,870,270,52]])a(rect(x,y,w,h,'shelf'));
 // water basins make the harbor layout fundamentally different
 a(rect(250,1390,1040,310,'water'),rect(2820,980,1120,300,'water'),rect(1710,2070,900,300,'water'));
 // west cold storage
 a(rect(260,1880,1120,34),rect(260,1880,34,850),rect(1346,1880,34,330),rect(1346,2360,34,370),rect(260,2696,420,34),rect(820,2696,560,34));
 a(rect(430,2040,270,90,'machine'),rect(830,2030,300,100,'machine'),rect(430,2320,180,190,'shelf'),rect(790,2310,210,190,'shelf'),rect(1110,2320,150,190,'shelf'));
 // east fuel pier and customs checkpoint
 for(const [x,y,w,h] of [[2810,1570,160,210],[3080,1540,160,240],[3380,1580,160,210],[3690,1540,160,240],[2930,1940,160,210],[3290,1950,160,210],[3650,1930,160,220]])a(rect(x,y,w,h,'tank'));
 a(rect(2760,1430,1180,32),rect(2760,1430,32,1250),rect(3908,1430,32,1250),rect(2760,2648,430,32),rect(3340,2648,600,32));
 for(const [x,y,w,h] of [[1440,1260,210,58],[1810,1230,180,58],[2160,1250,220,58],[2460,1290,180,58],[1450,1750,230,62],[2420,1760,240,62]])a(rect(x,y,w,h,'barricade'));
 return{
  id:'harbor',name:'침수 항만 09',palette:MAP_PALETTES.harbor,
  roads:[{x:0,y:1160,w:4200,h:170},{x:1330,y:0,w:160,h:3000},{x:2630,y:0,w:150,h:3000}],obstacles:o,
  doors:[{id:'port-custom-east',name:'세관창고 동문',x:2596,y:600,w:34,h:96},{id:'port-custom-south',name:'세관창고 남문',x:1892,y:1036,w:96,h:34},{id:'port-cold-east',name:'냉동창고 동문',x:1346,y:2240,w:34,h:96},{id:'port-cold-south',name:'냉동창고 남문',x:702,y:2696,w:96,h:34},{id:'port-fuel-south',name:'연료부두 철문',x:3215,y:2648,w:96,h:32}],
  zones:[{name:'북부 컨테이너 스택',x:180,y:180,w:1180,h:980,color:'#b0643f'},{name:'세관 창고',x:1450,y:220,w:1180,h:850,color:'#55798b'},{name:'침수 선적로',x:180,y:1160,w:2480,h:610,color:'#32758a'},{name:'냉동 창고',x:260,y:1880,w:1120,h:850,color:'#6388a0'},{name:'연료 부두',x:2760,y:1430,w:1180,h:1250,color:'#89904d'},{name:'동부 수로',x:2800,y:850,w:1140,h:500,color:'#28677e'}],
  spawns:[{x:100,y:1120},{x:4100,y:1370},{x:1500,y:2860},{x:2860,y:2860},{x:2780,y:160},{x:1380,y:150}],
  patrols:[{x:620,y:620},{x:2050,y:620},{x:3450,y:720},{x:850,y:2260},{x:2350,y:1650},{x:3400,y:2200},{x:1600,y:1500},{x:2700,y:1320}],
  extracts:[{id:'port-west',name:'서부 페리램프',x:20,y:1040,w:105,h:260},{id:'port-north',name:'북부 세관로',x:1960,y:20,w:280,h:95},{id:'port-east',name:'동부 서비스게이트',x:4060,y:2110,w:110,h:290}],
  crates:[{x:350,y:360},{x:1120,y:920},{x:1540,y:300},{x:2100,y:820},{x:2540,y:980},{x:3060,y:820},{x:3820,y:850},{x:390,y:1960},{x:1260,y:2600},{x:1540,y:1800},{x:2670,y:1850},{x:2890,y:2550},{x:3820,y:2450},{x:2420,y:1220}]
 };
}
function researchMap(){
 const o=[],a=(...r)=>o.push(...r);
 // west decontamination wing
 a(rect(220,250,1040,34),rect(220,250,34,980),rect(1226,250,34,410),rect(1226,810,34,420),rect(220,1196,390,34),rect(760,1196,500,34));
 a(rect(500,250,26,360),rect(820,250,26,360),rect(254,650,430,26),rect(790,650,436,26),rect(480,830,26,366),rect(850,820,26,376));
 for(const [x,y,w,h] of [[310,370,120,48],[610,390,120,48],[930,360,120,48],[310,930,130,48],[610,980,150,48],[970,940,130,48]])a(rect(x,y,w,h,'desk'));
 // central reactor ring
 a(rect(1550,520,1120,34),rect(1550,520,34,1190),rect(2636,520,34,480),rect(2636,1140,34,570),rect(1550,1676,460,34),rect(2160,1676,510,34));
 for(const [x,y,w,h] of [[1770,720,210,210],[2200,700,220,220],[1780,1110,220,220],[2200,1110,220,220]])a(rect(x,y,w,h,'machine'));
 a(rect(2020,930,180,260,'tank'));
 // east archive/server wing
 a(rect(3020,250,960,34),rect(3020,250,34,1210),rect(3946,250,34,1210),rect(3020,1426,360,34),rect(3520,1426,460,34));
 for(const [x,y,w,h] of [[3160,390,100,260],[3340,390,100,260],[3520,390,100,260],[3700,390,100,260],[3160,820,100,260],[3380,820,100,260],[3600,820,100,260],[3800,820,100,260]])a(rect(x,y,w,h,'shelf'));
 // southern botanical and maintenance blocks
 a(rect(300,1880,1180,34),rect(300,1880,34,820),rect(1446,1880,34,300),rect(1446,2320,34,380),rect(300,2666,470,34),rect(920,2666,560,34));
 for(const [x,y,w,h] of [[430,2040,280,100],[850,2030,300,110],[420,2320,190,180],[760,2290,210,210],[1110,2320,180,180]])a(rect(x,y,w,h,'machine'));
 a(rect(1770,2010,850,270,'water'),rect(2870,2050,980,220,'water'));
 for(const [x,y,w,h] of [[1620,1840,220,55],[1990,1810,190,55],[2380,1840,220,55],[2770,1770,220,55],[3210,1780,200,55],[3620,1760,210,55],[1710,2440,230,55],[2420,2450,220,55],[3140,2460,240,55],[3650,2480,180,55]])a(rect(x,y,w,h,'barricade'));
 return{
  id:'research',name:'오로라 폐쇄 연구기지',palette:MAP_PALETTES.research,
  roads:[{x:0,y:1480,w:4200,h:190},{x:1350,y:0,w:150,h:3000},{x:2750,y:0,w:150,h:3000}],obstacles:o,
  doors:[{id:'lab-west-east',name:'제독동 동문',x:1226,y:690,w:34,h:96},{id:'lab-west-south',name:'제독동 남문',x:640,y:1196,w:96,h:34},{id:'reactor-east',name:'반응로 동문',x:2636,y:1020,w:34,h:96},{id:'reactor-south',name:'반응로 남문',x:2040,y:1676,w:96,h:34},{id:'archive-south',name:'자료동 남문',x:3400,y:1426,w:96,h:34},{id:'green-east',name:'생체동 동문',x:1446,y:2210,w:34,h:96},{id:'green-south',name:'생체동 남문',x:800,y:2666,w:96,h:34}],
  zones:[{name:'제독 연구동',x:220,y:250,w:1040,h:980,color:'#6c5d8b'},{name:'중앙 반응로',x:1550,y:520,w:1120,h:1190,color:'#4f8b79'},{name:'자료 서버동',x:3020,y:250,w:960,h:1210,color:'#5d7294'},{name:'생체 유지동',x:300,y:1880,w:1180,h:820,color:'#68865e'},{name:'냉각 수조',x:1700,y:1950,w:2200,h:600,color:'#3c7683'},{name:'남부 격리선',x:1500,y:1700,w:2600,h:1100,color:'#7f684f'}],
  spawns:[{x:120,y:1500},{x:4080,y:1510},{x:1510,y:2860},{x:2920,y:2850},{x:2050,y:180},{x:1280,y:160}],
  patrols:[{x:650,y:720},{x:2100,y:1050},{x:3500,y:760},{x:900,y:2260},{x:1900,y:1880},{x:3400,y:1850},{x:2600,y:1500},{x:1450,y:1510}],
  extracts:[{id:'research-west',name:'서부 제독터널',x:20,y:1370,w:105,h:250},{id:'research-north',name:'북부 헬리패드',x:1940,y:20,w:320,h:95},{id:'research-east',name:'동부 격리게이트',x:4060,y:2210,w:110,h:270}],
  crates:[{x:300,y:330},{x:1180,y:1100},{x:1600,y:610},{x:2100,y:1450},{x:2590,y:1600},{x:3100,y:330},{x:3890,y:1320},{x:370,y:1940},{x:1390,y:2580},{x:1600,y:1810},{x:2670,y:1800},{x:2920,y:2520},{x:3890,y:1800},{x:2820,y:1380}]
 };
}
const BASE_MAP={id:'industrial',name:'칼리고 산업단지',palette:MAP_PALETTES.industrial,roads:[{x:0,y:1420,w:4200,h:260},{x:1330,y:0,w:180,h:3000},{x:2930,y:0,w:150,h:3000}],obstacles:MAP_OBSTACLES,doors:DOOR_DEFS,zones:ZONES.map((z,i)=>({...z,color:['#9a623d','#6b7647','#547b86','#76604d','#7b7443','#596c78'][i%6]})),spawns:SPAWNS,patrols:PATROLS,extracts:EXTRACTS,crates:CRATES};
export const MAPS=[BASE_MAP,portMap(),researchMap()];
function selectedMap(index=0){const n=((Number(index)||0)%MAPS.length+MAPS.length)%MAPS.length;return MAPS[n]}
`;
  if(!s.includes('const COVER_POINTS=[];'))throw new Error('cover marker missing');
  s=s.replace('const COVER_POINTS=[];',mapInsert+'\nconst COVER_POINTS=[];');

  s=s.replace(
    "function weaponItem(type,quality=1){const d=WEAPONS[type];return{kind:'weapon',id:uid('w'),type,name:d.name,damage:Math.round(d.damage*quality),ammo:d.mag,reserve:d.reserve,value:Math.round(d.price*quality)}}\nfunction gearItem(key){const d=GEAR[key];return{id:uid('g'),key,...copy(d),value:d.price}}\nfunction valuable(name,value){return{kind:'valuable',id:uid('v'),name,value}}\nfunction ammoItem(type,qty){return{kind:'ammo',id:uid('a'),type,name:`${WEAPONS[type].name} 탄약`,qty,value:qty*3}}\nfunction normalizeItem(it){const x=copy(it);if(!x.id)x.id=uid('i');if(x.kind==='weapon'){const d=WEAPONS[x.type];x.name=x.name||d.name;x.ammo=x.ammo??d.mag;x.reserve=x.reserve??d.reserve;x.damage=x.damage??d.damage;x.value=x.value??d.price}return x}",
    "function weaponItem(type,quality=1,tier=1){const d=WEAPONS[type];return{kind:'weapon',id:uid('w'),type,name:d.name,damage:d.damage,ammo:d.mag,ammoTier:tier,value:Math.round(d.price*quality)}}\nfunction gearItem(key){const d=GEAR[key];return{id:uid('g'),key,...copy(d),value:d.price}}\nfunction valuable(name,value){return{kind:'valuable',id:uid('v'),name,value}}\nfunction ammoItem(caliber,qty,tier=1){const c=AMMO_CALIBERS[caliber]||AMMO_CALIBERS['9mm'],t=AMMO_TIERS[tier]||AMMO_TIERS[1];return{kind:'ammo',id:uid('a'),caliber,tier,name:`${c.name} T${tier} 탄약`,qty,value:Math.round(qty*t.unitPrice)}}\nfunction normalizeItem(it){const x=copy(it);if(!x.id)x.id=uid('i');if(x.kind==='weapon'){const d=WEAPONS[x.type];x.name=x.name||d.name;x.ammo=x.ammo??d.mag;x.ammoTier=x.ammoTier||1;x.reserve=0;x.damage=x.damage??d.damage;x.value=x.value??d.price}else if(x.kind==='ammo'){x.caliber=x.caliber||WEAPONS[x.type]?.caliber||'9mm';x.tier=Math.max(1,Math.min(5,Number(x.tier)||1));x.qty=Math.max(0,Number(x.qty)||0);x.name=x.name||`${AMMO_CALIBERS[x.caliber]?.name||x.caliber} T${x.tier} 탄약`;x.value=x.value??Math.round(x.qty*(AMMO_TIERS[x.tier]?.unitPrice||3))}return x}"
  );
  s=s.replace("patrol:{...PATROLS[Math.floor(Math.random()*PATROLS.length)]}","patrol:{...(load.patrols||PATROLS)[Math.floor(Math.random()*(load.patrols||PATROLS).length)]}");
  s=s.replace('for(const s of SPAWNS){','for(const s of (w.spawns||SPAWNS)){');

  s=between(s,'function spawnFillerAI(w,index=0){','export function addHumanPlayer',`function spawnFillerAI(w,index=0){
 const patrols=w.patrols||PATROLS,pos=patrols[(index+(w.aiSpawnSeq||0))%patrols.length];w.aiSpawnSeq=(w.aiSpawnSeq||0)+1;
 const pmc=(w.aiSpawnSeq%4===0),kind=pmc?'pmc':'scav',guns=pmc?['ar','dmr','smg']:['smg','shotgun','pistol','ar'];
 const gunType=guns[w.aiSpawnSeq%guns.length],tier=pmc?2:1,primary=weaponItem(gunType,pmc?1.02:.92,tier),inventory=[ammoItem(WEAPONS[gunType].caliber,AMMO_CALIBERS[WEAPONS[gunType].caliber].pack,tier)];if(Math.random()<.38)inventory.push(gearItem('med'));if(pmc&&Math.random()<.45)inventory.push(gearItem('grenade'));
 const a=makeActor(kind,pos.x+(Math.random()-.5)*80,pos.y+(Math.random()-.5)*80,pmc?\`filler-pmc-${'${'}w.aiSpawnSeq}\`:\`filler-scav-${'${'}w.aiSpawnSeq}\`,{name:pmc?\`RAIDER-${'${'}60+w.aiSpawnSeq}\`:\`SCAV-${'${'}60+w.aiSpawnSeq}\`,primary,inventory,patrols});a.filler=true;w.actors.push(a);return a
}
`);

  s=between(s,'export function createWorld(config={}){','\n\nexport function setPlayerInput',`export function createWorld(config={}){
 const players=config.players||[{}],def=selectedMap(config.mapIndex||0),map={id:def.id,name:def.name,palette:copy(def.palette),roads:copy(def.roads)};
 const w={time:0,timeLeft:18*60,map,obstacles:def.obstacles.map(copy),doors:def.doors.map(d=>({...copy(d),open:false})),zones:def.zones.map(copy),extracts:def.extracts.map(copy),spawns:def.spawns.map(copy),patrols:def.patrols.map(copy),coverPoints:coverPointsFor(def.obstacles),actors:[],humanIds:[],bullets:[],grenades:[],crates:[],corpses:[],sounds:[],events:[],results:{},openContainers:{},interactions:{},inputs:{},aiSpawnSeq:0};
 players.forEach(pc=>addHumanPlayer(w,pc));
 if(Number.isFinite(config.aiCount))reconcileFillerAI(w,config.aiCount);else reconcileFillerAI(w,7);
 def.crates.forEach((q,i)=>w.crates.push({id:\`crate-${'${'}i}\`,kind:'crate',x:q.x,y:q.y,r:19,opened:false,items:rollCrate(i)}));return w
}`);

  s=s.replace("function rollCrate(i){const out=[];const names=['암호화 SSD','군용 무전기','광학 부품','공구 세트','의약품 박스','배터리 팩','제어 모듈'];out.push(valuable(names[i%names.length],260+Math.floor(Math.random()*650)));if(Math.random()<.72)out.push(ammoItem(['pistol','smg','ar','shotgun','dmr'][i%5],18+Math.floor(Math.random()*35)));if(Math.random()<.38)out.push(gearItem('med'));if(Math.random()<.24)out.push(gearItem('grenade'));if(Math.random()<.12)out.push(weaponItem(['smg','ar','shotgun','dmr'][i%4],1+.04*Math.random()));return out}","function rollCrate(i){const out=[];const names=['암호화 SSD','군용 무전기','광학 부품','공구 세트','의약품 박스','배터리 팩','제어 모듈'],cals=['9mm','5.56','7.62','12g'];out.push(valuable(names[i%names.length],260+Math.floor(Math.random()*650)));if(Math.random()<.72){const caliber=cals[i%cals.length],tier=Math.min(5,1+Math.floor(Math.pow(Math.random(),1.7)*5)),pack=AMMO_CALIBERS[caliber].pack;out.push(ammoItem(caliber,Math.max(6,Math.round(pack*(.55+Math.random()*.7))),tier))}if(Math.random()<.38)out.push(gearItem('med'));if(Math.random()<.24)out.push(gearItem('grenade'));if(Math.random()<.12)out.push(weaponItem(['smg','ar','shotgun','dmr'][i%4],1+.04*Math.random(),1+Math.floor(Math.random()*2)));return out}");

  s=s.replace('function chooseCover(w,a,target){let best=null,score=Infinity;for(const c of COVER_POINTS){','function chooseCover(w,a,target){let best=null,score=Infinity;for(const c of (w.coverPoints||COVER_POINTS)){');

  s=s.replace("function startReload(a){const gun=currentWeapon(a);if(!gun)return;const d=WEAPONS[gun.type];if(a.reload>0||gun.ammo>=d.mag||gun.reserve<=0)return;a.reload=d.reload}\nfunction finishReload(a){const gun=currentWeapon(a);if(!gun)return;const d=WEAPONS[gun.type],need=d.mag-gun.ammo,take=Math.min(need,gun.reserve);gun.ammo+=take;gun.reserve-=take;a.reload=0}",`function ammoReserve(a,gun){if(!gun)return 0;const cal=WEAPONS[gun.type]?.caliber;return a.inventory.filter(i=>i.kind==='ammo'&&i.caliber===cal).reduce((n,i)=>n+(i.qty||0),0)}
function reloadTierFor(a,gun){if(a.kind!=='player')return gun.ammoTier|| (a.kind==='pmc'?2:1);const cal=WEAPONS[gun.type]?.caliber,tiers=a.inventory.filter(i=>i.kind==='ammo'&&i.caliber===cal&&(i.qty||0)>0).map(i=>i.tier||1);if(!tiers.length)return 0;if(gun.ammo>0){const cur=gun.ammoTier||1;return tiers.includes(cur)?cur:0}return Math.max(...tiers)}
function startReload(a){const gun=currentWeapon(a);if(!gun)return;const d=WEAPONS[gun.type],tier=reloadTierFor(a,gun);if(a.reload>0||gun.ammo>=d.mag||!tier)return;a.reload=d.reload;a.reloadTier=tier}
function finishReload(a){const gun=currentWeapon(a);if(!gun){a.reload=0;return}const d=WEAPONS[gun.type],need=d.mag-gun.ammo;if(a.kind!=='player'){gun.ammo=d.mag;gun.ammoTier=a.reloadTier||gun.ammoTier||1;a.reload=0;a.reloadTier=0;return}const tier=a.reloadTier||reloadTierFor(a,gun);if(!tier){a.reload=0;return}let left=need;for(let i=a.inventory.length-1;i>=0&&left>0;i--){const it=a.inventory[i];if(it.kind!=='ammo'||it.caliber!==d.caliber||(it.tier||1)!==tier)continue;const take=Math.min(left,it.qty||0);it.qty-=take;left-=take;if(it.qty<=0)a.inventory.splice(i,1)}const loaded=need-left;if(loaded>0){gun.ammo+=loaded;gun.ammoTier=tier}a.reload=0;a.reloadTier=0}`);

  s=between(s,'function shoot(w,a,aimX,aimY,ai=false){','\nfunction hostile',`function shoot(w,a,aimX,aimY,ai=false){const gun=currentWeapon(a);if(!gun)return;const d=WEAPONS[gun.type];if(a.reload>0||a.fireCd>0||a.flinch>0)return;if(gun.ammo<=0){startReload(a);return}gun.ammo--;a.fireCd=d.rate;const base=Math.atan2(aimY,aimX),pellets=d.pellets||1,tier=gun.ammoTier||1,mult=AMMO_TIERS[tier]?.damageMult||1,shotDamage=(gun.damage||d.damage)*mult;for(let i=0;i<pellets;i++){const spread=d.spread*(ai?1.35:1),ang=base+(Math.random()-.5)*spread*2;w.bullets.push({id:uid('b'),owner:a.id,x:a.x+Math.cos(ang)*21,y:a.y+Math.sin(ang)*21,vx:Math.cos(ang)*d.speed,vy:Math.sin(ang)*d.speed,damage:shotDamage,life:d.range/d.speed,headChance:ai?.10:.18,ammoTier:tier})}if(w.bullets.length>360)w.bullets.splice(0,w.bullets.length-360);addSound(w,a.x,a.y,d.sound,'gunshot',a.id);emit(w,'shot',{actor:a.id,x:a.x,y:a.y,weapon:gun.type,ammoTier:tier,recoil:d.recoil,angle:base,ownerKind:a.kind})}`);

  s=s.replace('return{time:w.time,timeLeft:w.timeLeft,worldW:WORLD_W,worldH:WORLD_H,', 'return{time:w.time,timeLeft:w.timeLeft,map:copy(w.map),worldW:WORLD_W,worldH:WORLD_H,');
  s=s.replace('weapon:publicItem(gun),gear,inventory:p.inventory.map(publicItem),bagCapacity:bagCapacity(p),', 'weapon:publicItem(gun),ammoReserve:gun?ammoReserve(p,gun):0,gear,inventory:p.inventory.map(publicItem),bagCapacity:bagCapacity(p),');
  if(!s.includes('export const AMMO_TIERS')||!s.includes("name:'침수 항만 09'")||!s.includes("name:'오로라 폐쇄 연구기지'")||!s.includes('ammoReserve:gun?ammoReserve'))throw new Error('sim patch incomplete');
  return s;
});

patch('src/net.js',s=>{
  s=s.replace("this.world=createWorld({players:[config]});","this.world=createWorld({players:[config],mapIndex:Math.floor(Date.now()/(10*60*1000))%3});");
  if(!s.includes('mapIndex:Math.floor'))throw new Error('net map rotation patch incomplete');
  return s;
});

patch('api/realtime.js',s=>{
  s=s.replace('world=createWorld({players:[],aiCount:CAPACITY});','mapIndex=((key%3)+3)%3,world=createWorld({players:[],aiCount:CAPACITY,mapIndex});');
  s=s.replace('remainingMs,entryClosed,joinable:humans<CAPACITY&&!entryClosed}', 'remainingMs,entryClosed,mapId:r.world.map?.id,mapName:r.world.map?.name,joinable:humans<CAPACITY&&!entryClosed}');
  s=s.replace('remainingMs,entryClosed,joinable:humans<CAPACITY&&!entryClosed};for(const [id,ws]', 'remainingMs,entryClosed,mapId:r.world.map?.id,mapName:r.world.map?.name,joinable:humans<CAPACITY&&!entryClosed};for(const [id,ws]');
  if(!s.includes('aiCount:CAPACITY,mapIndex')||!s.includes('mapName:r.world.map?.name'))throw new Error('api map rotation patch incomplete');
  return s;
});

patch('cloudflare/worker.js',s=>{
  s=s.replace('this.world = createWorld({ players: [], aiCount: CAPACITY });','this.world = createWorld({ players: [], aiCount: CAPACITY, mapIndex: ((key % 3) + 3) % 3 });');
  s=s.replace('      remainingMs,\n      entryClosed,\n      joinable:', '      remainingMs,\n      entryClosed,\n      mapId: this.world.map?.id,\n      mapName: this.world.map?.name,\n      joinable:');
  if(!s.includes('mapIndex: ((key % 3) + 3) % 3')||!s.includes('mapName: this.world.map?.name'))throw new Error('cloudflare map rotation patch incomplete');
  return s;
});

patch('index.html',s=>{
  s=s.replace('<title>DEAD DROP // v2.6 Smooth Combat Economy</title>','<title>DEAD DROP // v3.0 Ammo Economy & Rotating Maps</title>');
  s=s.replace('<div class="roomStats"><span>인간 <b id="roomHumans">- / 8</b></span><span>AI <b id="roomAi">-</b></span><span>남은 시간 <b id="roomTime">--:--</b></span></div>','<div class="roomStats"><span>맵 <b id="roomMap">-</b></span><span>인간 <b id="roomHumans">- / 8</b></span><span>AI <b id="roomAi">-</b></span><span>남은 시간 <b id="roomTime">--:--</b></span></div>');
  s=s.replace('<div id="shopList" class="shopList"></div>','<div id="shopList" class="shopList"></div>\n        <div class="sectionTitle minor">탄약 상점</div>\n        <div class="ammoHint">탄약은 구경별로 별도 구매 · T1~T5가 높을수록 피해량 증가</div>\n        <div id="ammoShopList" class="ammoShopList"></div>');
  s=s.replace('<div id="raidTimer" class="timer">17:59</div>','<div id="raidTimer" class="timer">17:59</div>\n        <div id="mapHud" class="mapHud">-</div>');
  s=s.replace('피격 가시성 · 문 끼임 방지 · 직접 판매 경제 · 전력질주 시각효과 · 20Hz 네트워크 + 60fps 보간','탄약 T1~T5 · 방어구 수리 · 10분 맵 순환 · 구역 색상 강화 · 20Hz 네트워크 + 60fps 보간');
  if(!s.includes('ammoShopList')||!s.includes('roomMap')||!s.includes('mapHud'))throw new Error('index patch incomplete');
  return s;
});

patch('styles.css',s=>s+`

/* v3.0 ammo economy / repairs / map identity */
.ammoHint{font-size:11px;color:#8fa0a4;margin:-3px 0 7px;line-height:1.35}
.ammoShopList{display:grid;gap:7px;margin-bottom:12px}
.ammoGroup{border:1px solid rgba(135,159,164,.18);background:rgba(13,20,22,.55);padding:7px;border-radius:5px}
.ammoHead{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;font-size:12px}.ammoHead span{color:#819397;font-size:10px}
.ammoTiers{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}.ammoTiers button{padding:5px 2px;font-size:10px}.ammoTiers button[data-tier="3"]{border-color:#66866f}.ammoTiers button[data-tier="4"]{border-color:#987849}.ammoTiers button[data-tier="5"]{border-color:#a45757}
.repairBtn{border-color:#6d8359!important;color:#bad49f!important}.conditionBad{color:#e49a77}.conditionGood{color:#9bc7a5}
.mapHud{position:absolute;top:46px;left:50%;transform:translateX(-50%);font:700 11px monospace;letter-spacing:1.4px;color:rgba(185,214,215,.75);text-shadow:0 1px 3px #000;pointer-events:none}
.roomStats{flex-wrap:wrap}.roomStats span:first-child{flex-basis:100%;margin-bottom:2px;color:#a9c4c4}
`);

patch('src/main.js',s=>{
  s=s.replace("import {WEAPONS,GEAR} from './sim.js';","import {WEAPONS,GEAR,AMMO_TIERS,AMMO_CALIBERS} from './sim.js';");
  s=s.replace("const makeWeapon=type=>({id:id(),kind:'weapon',type,name:WEAPONS[type].name,ammo:WEAPONS[type].mag,reserve:WEAPONS[type].reserve,damage:WEAPONS[type].damage,value:WEAPONS[type].price});\nconst makeGear=key=>({id:id(),key,...cp(GEAR[key]),value:GEAR[key].price});\nconst defaultMeta=()=>({money:3200,visionLevel:3,callsign:`P-${Math.floor(1000+Math.random()*9000)}`,equipment:{primary:null,secondary:null,armor:null,helmet:null,backpack:null},inventory:[],stash:[makeWeapon('ar'),makeWeapon('pistol'),makeGear('armor_light'),makeGear('helmet'),makeGear('backpack'),makeGear('med'),makeGear('med'),makeGear('grenade'),makeGear('grenade')]});",
`const makeWeapon=type=>({id:id(),kind:'weapon',type,name:WEAPONS[type].name,ammo:0,ammoTier:1,reserve:0,damage:WEAPONS[type].damage,value:WEAPONS[type].price});
const makeGear=key=>({id:id(),key,...cp(GEAR[key]),value:GEAR[key].price});
const ammoPrice=(caliber,tier,qty=AMMO_CALIBERS[caliber]?.pack||30)=>Math.round(qty*(AMMO_TIERS[tier]?.unitPrice||3));
const makeAmmo=(caliber,tier=1,qty=AMMO_CALIBERS[caliber]?.pack||30,starterIssue=false)=>({id:id(),kind:'ammo',caliber,tier,qty,name:\`${'${'}AMMO_CALIBERS[caliber]?.name||caliber} T${'${'}tier} 탄약\`,value:starterIssue?0:ammoPrice(caliber,tier,qty),starterIssue});
const defaultMeta=()=>({money:3200,visionLevel:3,callsign:\`P-${'${'}Math.floor(1000+Math.random()*9000)}\`,equipment:{primary:null,secondary:null,armor:null,helmet:null,backpack:null},inventory:[],stash:[makeWeapon('ar'),makeWeapon('pistol'),makeGear('armor_light'),makeGear('helmet'),makeGear('backpack'),makeGear('med'),makeGear('med'),makeGear('grenade'),makeGear('grenade'),makeAmmo('9mm',1),makeAmmo('5.56',1)]});`);
  s=s.replace("const save=()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(meta))}catch{}};","const save=()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(meta))}catch{}};\nfunction migrateAmmoEconomy(){if(meta.ammoEconomyV1)return;const items=[meta.equipment?.primary,meta.equipment?.secondary,...(meta.inventory||[]),...(meta.stash||[])].filter(Boolean),bonus=[];for(const it of items){if(it.kind==='weapon'){it.ammoTier=it.ammoTier||1;if((it.reserve||0)>0){bonus.push(makeAmmo(WEAPONS[it.type]?.caliber||'9mm',1,it.reserve));it.reserve=0}}else if(it.kind==='ammo'){it.caliber=it.caliber||WEAPONS[it.type]?.caliber||'9mm';it.tier=Math.max(1,Math.min(5,Number(it.tier)||1));it.qty=Math.max(0,Number(it.qty)||0);it.name=`${AMMO_CALIBERS[it.caliber]?.name||it.caliber} T${it.tier} 탄약`;it.value=it.value??ammoPrice(it.caliber,it.tier,it.qty)}}meta.stash.push(...bonus);meta.ammoEconomyV1=true;save()}\nmigrateAmmoEconomy();");
  s=s.replace(" w.name='M9 권총 … 기담 지급';\n w.value=0;\n w.starterIssue=true;\n meta.stash.push(w);"," w.name='M9 권총 · 긴급 지급';\n w.value=0;\n w.starterIssue=true;\n meta.stash.push(w);\n meta.stash.push(makeAmmo('9mm',1,15,true));");

  s=s.replace("function sellPrice(it){if(!it||it.starterIssue||(it.value||0)<=0)return 0;const rate=it.kind==='valuable'?1:it.kind==='ammo' ? .75 : it.kind==='weapon' ? .65 : .7;return Math.max(1,Math.round((it.value||0)*rate))}","function conditionRatio(it){if(it?.kind==='armor')return Math.max(0,Math.min(1,(it.armor??it.maxArmor??0)/(it.maxArmor||1)));if(it?.kind==='helmet')return Math.max(0,Math.min(1,(it.durability??it.maxDurability??0)/(it.maxDurability||1)));return 1}\nfunction sellPrice(it){if(!it||it.starterIssue||(it.value||0)<=0)return 0;const rate=it.kind==='valuable'?1:it.kind==='ammo'?.75:it.kind==='weapon'?.65:.7;return Math.max(1,Math.round((it.value||0)*rate*(.55+.45*conditionRatio(it))))}\nfunction repairInfo(it){if(!it||!['armor','helmet'].includes(it.kind))return null;const cur=it.kind==='armor'?(it.armor??it.maxArmor??0):(it.durability??it.maxDurability??0),max=it.kind==='armor'?(it.maxArmor||cur):(it.maxDurability||cur),missing=Math.max(0,max-cur),base=it.price||it.value||0;return{cur,max,missing,cost:missing>0?Math.max(1,Math.ceil(base*.6*(missing/Math.max(1,max)))):0}}\nfunction repairItem(it){const r=repairInfo(it);if(!r||r.cost<=0)return;if(meta.money<r.cost)return alert('수리비가 부족합니다.');meta.money-=r.cost;if(it.kind==='armor')it.armor=it.maxArmor;else it.durability=it.maxDurability;save();renderLobby()}");

  s=s.replace("function itemMeta(it){if(!it)return'';if(it.kind==='weapon'){const s=weaponSpec(it.type);return`${weaponDesc[it.type]} · DMG ${s.damage} · ${it.ammo??WEAPONS[it.type].mag}/${it.reserve??0}`};if(it.kind==='armor')return`방탄 ${Math.round(it.armor??it.maxArmor??0)}/${it.maxArmor||0}`;if(it.kind==='helmet')return`내구 ${Math.round(it.durability??it.maxDurability??0)}/${it.maxDurability||0}`;if(it.kind==='backpack')return`가방 ${it.capacity||8}칸`;if(it.kind==='med')return`회복 +${it.heal}`;if(it.kind==='grenade')return`폭발 반경 ${it.radius}`;return`가치 ${money(it.value)}`}","function itemMeta(it){if(!it)return'';if(it.kind==='weapon'){const w=weaponSpec(it.type);return`${weaponDesc[it.type]} · ${WEAPONS[it.type].caliber} · DMG ${w.damage} · 탄창 ${it.ammo??0}/${WEAPONS[it.type].mag} · T${it.ammoTier||1}`};if(it.kind==='ammo'){const t=AMMO_TIERS[it.tier||1];return`${AMMO_CALIBERS[it.caliber]?.name||it.caliber} · T${it.tier||1} · ${it.qty||0}발 · 피해 ×${(t?.damageMult||1).toFixed(2)}`};if(it.kind==='armor')return`방탄 ${Math.round(it.armor??it.maxArmor??0)}/${it.maxArmor||0}`;if(it.kind==='helmet')return`내구 ${Math.round(it.durability??it.maxDurability??0)}/${it.maxDurability||0}`;if(it.kind==='backpack')return`가방 ${it.capacity||8}칸`;if(it.kind==='med')return`회복 +${it.heal}`;if(it.kind==='grenade')return`폭발 반경 ${it.radius}`;return`가치 ${money(it.value)}`}");

  s=between(s,'function renderWeaponStats(){','\n\nfunction renderLobby(){',`function renderWeaponStats(){const root=$('#weaponStatsList');if(!root||root.childElementCount)return;for(const [type,d] of Object.entries(WEAPONS)){const w=weaponSpec(type),lo=Math.round(d.damage*AMMO_TIERS[1].damageMult),hi=Math.round(d.damage*AMMO_TIERS[5].damageMult),card=document.createElement('div');card.className='weaponStatCard';card.innerHTML=\`<div class="weaponStatHead"><b>${'${'}d.name}</b><span>${'${'}money(d.price)}</span></div><div class="weaponStatGrid"><span>구경 <b>${'${'}AMMO_CALIBERS[d.caliber]?.name||d.caliber}</b></span><span>피해 <b>${'${'}lo}~${'${'}hi}</b></span><span>연사 <b>${'${'}w.rpm} RPM</b></span><span>탄창 <b>${'${'}w.mag}</b></span><span>재장전 <b>${'${'}w.reload}s</b></span><span>유효거리 <b>${'${'}w.range}</b></span><span>반동 <b>${'${'}w.recoil}</b></span></div>\`;root.appendChild(card)}}`);

  const lobby=`function renderLobby(){
 $('#moneyText').textContent=money(meta.money);$('#visionLevel').value=meta.visionLevel;$('#visionLevelText').textContent=meta.visionLevel;$('#raidInvCount').textContent=\`${'${'}meta.inventory.length}/12\`;
 const addRepair=(actions,it)=>{const ri=repairInfo(it);if(!ri)return;const rb=document.createElement('button');rb.className='repairBtn';rb.textContent=ri.cost>0?\`수리 ${'${'}money(ri.cost)}\`:'수리 완료';rb.disabled=ri.cost<=0;rb.onclick=()=>repairItem(it);actions.appendChild(rb)};
 const eq=$('#equipmentGrid');eq.innerHTML='';for(const slot of ['primary','secondary','armor','helmet','backpack']){const it=meta.equipment[slot],d=document.createElement('div');d.className='equipmentSlot'+(it?' filled':'');d.innerHTML=\`<div class="slotLabel">${'${'}slotNames[slot]}</div><div class="slotTitle">${'${'}itemName(it)}</div><div class="slotMeta">${'${'}itemMeta(it)}</div>\`;if(it){const actions=document.createElement('div');actions.style.display='flex';actions.style.gap='3px';actions.style.flexWrap='wrap';const b=document.createElement('button');b.textContent='인벤토리로';b.disabled=meta.inventory.length>=12;b.onclick=()=>moveEquipToInventory(slot);actions.appendChild(b);addRepair(actions,it);d.appendChild(actions)}eq.appendChild(d)}
 const inv=$('#raidInventory');inv.innerHTML='';for(let i=0;i<12;i++){const it=meta.inventory[i],d=document.createElement('div');d.className='inventorySlot';if(it){d.innerHTML=\`<b>${'${'}itemName(it)}</b><span class="slotMeta">${'${'}itemMeta(it)}</span>\`;const actions=document.createElement('div');actions.style.display='flex';actions.style.gap='3px';actions.style.flexWrap='wrap';if(it.kind==='weapon'){for(const [slot,label] of [['primary','주'],['secondary','보']]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>equipFromInventory(i,slot);actions.appendChild(b)}}else if(['armor','helmet','backpack'].includes(it.kind)){const b=document.createElement('button');b.textContent='장착';b.onclick=()=>equipFromInventory(i,it.kind);actions.appendChild(b)}const st=document.createElement('button');st.textContent='창고';st.onclick=()=>inventoryToStash(i);actions.appendChild(st);addRepair(actions,it);const price=sellPrice(it),sell=document.createElement('button');sell.className='sellBtn';sell.textContent=price>0?\`판매 +${'${'}money(price)}\`:'판매 불가';sell.disabled=price<=0;sell.onclick=()=>sellFromInventory(i);actions.appendChild(sell);d.appendChild(actions)}inv.appendChild(d)}
 const stash=$('#stashList');stash.innerHTML='';if(!meta.stash.length)stash.innerHTML='<div class="muted">창고가 비어 있습니다.</div>';meta.stash.forEach((it,i)=>{const d=document.createElement('div');d.className='stashItem';const price=sellPrice(it),ri=repairInfo(it);d.innerHTML=\`<b>${'${'}itemName(it)}</b><div class="meta">${'${'}itemMeta(it)}<br>평가 ${'${'}money(it.value||0)} · 판매 ${'${'}money(price)}${'${'}ri&&ri.missing>0?\` · 수리비 ${'${'}money(ri.cost)}\`:''}</div>\`;const actions=document.createElement('div');actions.className='stashActions';const b=document.createElement('button');b.textContent='출격 인벤토리로';b.disabled=meta.inventory.length>=12;b.onclick=()=>stashToInventory(i);actions.appendChild(b);addRepair(actions,it);const sell=document.createElement('button');sell.className='sellBtn';sell.textContent=price>0?'판매':'판매 불가';sell.disabled=price<=0;sell.onclick=()=>sellFromStash(i);actions.appendChild(sell);d.appendChild(actions);stash.appendChild(d)});
 const shop=$('#shopList');shop.innerHTML='';const products=[...Object.keys(WEAPONS).map(k=>({name:WEAPONS[k].name,price:WEAPONS[k].price,meta:\`빈 탄창 · ${'${'}AMMO_CALIBERS[WEAPONS[k].caliber].name}\`,make:()=>makeWeapon(k)})),...['armor_light','armor_heavy','helmet','backpack','med','grenade'].map(k=>({name:GEAR[k].name,price:GEAR[k].price,meta:'',make:()=>makeGear(k)}))];for(const p of products){const r=document.createElement('div');r.className='shopItem';r.innerHTML=\`<b>${'${'}p.name}</b><div class="meta">${'${'}p.meta||''}${'${'}p.meta?' · ':''}${'${'}money(p.price)}</div>\`;const b=document.createElement('button');b.textContent='창고로 구매';b.onclick=()=>{if(meta.money<p.price)return alert('자금이 부족합니다.');meta.money-=p.price;meta.stash.push(p.make());save();renderLobby()};r.appendChild(b);shop.appendChild(r)}
 const ammoRoot=$('#ammoShopList');ammoRoot.innerHTML='';for(const [cal,c] of Object.entries(AMMO_CALIBERS)){const group=document.createElement('div');group.className='ammoGroup';group.innerHTML=\`<div class="ammoHead"><b>${'${'}c.name}</b><span>${'${'}c.pack}발 묶음</span></div>\`;const tiers=document.createElement('div');tiers.className='ammoTiers';for(let tier=1;tier<=5;tier++){const t=AMMO_TIERS[tier],price=ammoPrice(cal,tier,c.pack),b=document.createElement('button');b.dataset.tier=tier;b.innerHTML=\`T${'${'}tier}<br>${'${'}money(price)}<br>×${'${'}t.damageMult.toFixed(2)}\`;b.onclick=()=>{if(meta.money<price)return alert('자금이 부족합니다.');meta.money-=price;meta.stash.push(makeAmmo(cal,tier));save();renderLobby()};tiers.appendChild(b)}group.appendChild(tiers);ammoRoot.appendChild(group)}
 renderWeaponStats();$('#callsignInput').value=meta.callsign;$('#raidBtn').disabled=!meta.equipment.primary||(!LOCAL_MODE&&!multiplayerFallback&&roomState?.joinable===false);
}`;
  s=between(s,'function renderLobby(){',"\n$('#visionLevel').addEventListener",lobby);

  s=s.replace("$('#weaponName').textContent=p.weapon?.name||'무기 없음';$('#ammoText').textContent=p.weapon?`${p.weapon.ammo} / ${p.weapon.reserve}`:'0 / 0';$('#fireMode').textContent=p.weapon&&WEAPONS[p.weapon.type].auto?'AUTO':'SEMI';", "$('#weaponName').textContent=p.weapon?.name||'무기 없음';$('#ammoText').textContent=p.weapon?`${p.weapon.ammo} / ${p.ammoReserve||0}`:'0 / 0';$('#fireMode').textContent=p.weapon?`${WEAPONS[p.weapon.type].auto?'AUTO':'SEMI'} · T${p.weapon.ammoTier||1}`:'-';");
  s=s.replace("$('#visionHudText').textContent=p.visionLevel;", "$('#visionHudText').textContent=p.visionLevel;const mapHud=$('#mapHud');if(mapHud)mapHud.textContent=snap.map?.name||roomState?.mapName||'-';");

  s=s.replace("$('#roomIdText').textContent=LOCAL_MODE?'LOCAL':'LOCAL FALLBACK';$('#roomHumans').textContent='1 / 1';", "$('#roomIdText').textContent=LOCAL_MODE?'LOCAL':'LOCAL FALLBACK';$('#roomMap').textContent=snap?.map?.name||'로컬 순환맵';$('#roomHumans').textContent='1 / 1';");
  s=s.replace("$('#roomIdText').textContent=r.roomId;$('#roomHumans').textContent=", "$('#roomIdText').textContent=r.roomId;$('#roomMap').textContent=r.mapName||'-';$('#roomHumans').textContent=");

  s=between(s,'function drawGround(cam){','\nfunction drawZones(cam){',`function drawGround(cam){const p=snap.map?.palette||{},ground=p.ground||'#1b2223',a=p.gridA||'#1d2627',b=p.gridB||'#20292a';ctx.fillStyle=ground;ctx.fillRect(cam.x-10,cam.y-10,canvas.width+20,canvas.height+20);const sx=Math.floor(cam.x/80)*80,sy=Math.floor(cam.y/80)*80;for(let y=sy;y<cam.y+canvas.height+80;y+=80)for(let x=sx;x<cam.x+canvas.width+80;x+=80){ctx.fillStyle=((x/80+y/80)%2)?a:b;ctx.fillRect(x,y,78,78)}ctx.fillStyle=p.road||'#29363a';for(const r of snap.map?.roads||[])ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle=p.line||'rgba(221,184,92,.16)';for(const r of snap.map?.roads||[]){if(r.w>r.h)ctx.fillRect(r.x,r.y+r.h/2-2,r.w,4);else ctx.fillRect(r.x+r.w/2-2,r.y,4,r.h)}}`);
  s=between(s,'function drawZones(cam){','\nfunction drawExtracts(cam){',`function drawZones(cam){for(const z of snap.zones){if(z.x+z.w<cam.x-20||z.x>cam.x+canvas.width+20||z.y+z.h<cam.y-20||z.y>cam.y+canvas.height+20)continue;ctx.save();ctx.globalAlpha=.09;ctx.fillStyle=z.color||'#668080';ctx.fillRect(z.x,z.y,z.w,z.h);ctx.globalAlpha=.18;ctx.strokeStyle=z.color||'#668080';ctx.lineWidth=2;ctx.strokeRect(z.x,z.y,z.w,z.h);ctx.globalAlpha=.38;ctx.font='bold 30px monospace';ctx.fillStyle=z.color||'#b6c4c4';ctx.fillText(z.name,z.x+24,z.y+50);ctx.restore()}}`);
  s=between(s,'function obstacleColor(k){','\nfunction drawObstacles(cam){',`function obstacleColor(k){const p=snap.map?.palette||{};return k==='container'?(p.container||'#87573b'):k==='vehicle'||k==='truck'?(p.vehicle||'#415763'):k==='tank'?(p.tank||'#58634a'):k==='shelf'?(p.shelf||'#6e5a39'):k==='machine'?(p.machine||'#3f6061'):k==='desk'?(p.desk||'#594a43'):k==='barricade'||k==='cratewall'?(p.barricade||'#75603e'):k==='pipe'?(p.pipe||'#526a62'):k==='water'?(p.water||'#25505e'):(p.wall||'#354044')}`);
  s=s.replace("ctx.strokeStyle='#92785e';","ctx.strokeStyle=snap.map?.palette?.door||'#92785e';").replace("ctx.fillStyle='#6f5945';","ctx.fillStyle=snap.map?.palette?.door||'#6f5945';");
  s=s.replace("fctx.fillStyle='rgba(2,5,8,.43)'","fctx.fillStyle='rgba(2,5,8,.34)'");
  if(!s.includes('AMMO_TIERS')||!s.includes("$('#ammoShopList')")||!s.includes("snap.map?.palette")||!s.includes("$('#roomMap')"))throw new Error('main patch incomplete');
  return s;
});
