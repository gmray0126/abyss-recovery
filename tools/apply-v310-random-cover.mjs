import fs from 'node:fs';

function update(path, fn){
  const before=fs.readFileSync(path,'utf8');
  const after=fn(before);
  if(after===before)throw new Error(`no change: ${path}`);
  fs.writeFileSync(path,after);
}
function mustReplace(s,from,to,label){
  if(!s.includes(from))throw new Error(`missing ${label}`);
  return s.replace(from,to);
}

update('src/sim.js',s=>{
  const anchor="function selectedMap(index=0){const n=((Number(index)||0)%MAPS.length+MAPS.length)%MAPS.length;return MAPS[n]}\n";
  const insertion=String.raw`

const MOVABLE_COVER_KINDS=new Set(['vehicle','truck','forklift','barricade','cratewall']);
function hashSeed(value){const text=String(value??'raid');let h=2166136261>>>0;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function seededRandom(seed){let a=(hashSeed(seed)||0x6d2b79f5)>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function rectOverlap(a,b,pad=0){return a.x<b.x+b.w+pad&&a.x+a.w+pad>b.x&&a.y<b.y+b.h+pad&&a.y+a.h+pad>b.y}
function safeRect(x,y,r){return{x:x-r,y:y-r,w:r*2,h:r*2}}
function coverPlacementBlocked(c,fixed,placed,def){
 if(c.x<70||c.y<70||c.x+c.w>WORLD_W-70||c.y+c.h>WORLD_H-70)return true;
 for(const o of fixed)if(rectOverlap(c,o,o.kind==='water'?24:14))return true;
 for(const o of placed)if(rectOverlap(c,o,24))return true;
 for(const d of def.doors){const q={x:d.x-95,y:d.y-95,w:d.w+190,h:d.h+190};if(rectOverlap(c,q))return true}
 for(const e of def.extracts){const q={x:e.x-80,y:e.y-80,w:e.w+160,h:e.h+160};if(rectOverlap(c,q))return true}
 for(const p of def.spawns)if(rectOverlap(c,safeRect(p.x,p.y,165)))return true;
 for(const p of def.crates)if(rectOverlap(c,safeRect(p.x,p.y,72)))return true;
 for(const p of def.patrols)if(rectOverlap(c,safeRect(p.x,p.y,42)))return true;
 return false
}
function buildRaidObstacles(def,seed){
 const layoutSeed=hashSeed(String(seed??Date.now())+'|'+def.id),rng=seededRandom(layoutSeed);
 const fixed=def.obstacles.filter(o=>!MOVABLE_COVER_KINDS.has(o.kind)).map(copy);
 const movable=def.obstacles.filter(o=>MOVABLE_COVER_KINDS.has(o.kind)).map(o=>({...copy(o),_original:true}));
 const templates=[
  {w:170,h:52,kind:'barricade'},{w:130,h:58,kind:'cratewall'},{w:210,h:68,kind:'container'},
  {w:160,h:72,kind:'vehicle'},{w:105,h:105,kind:'cratewall'},{w:92,h:168,kind:'truck'},
  {w:145,h:48,kind:'barricade'},{w:235,h:72,kind:'container'}
 ];
 const extraCount=28+Math.floor(rng()*8),shapes=[...movable];
 for(let i=0;i<extraCount;i++)shapes.push({...templates[Math.floor(rng()*templates.length)]});
 const placed=[];
 for(const base of shapes){
  let done=false;
  for(let attempt=0;attempt<130&&!done;attempt++){
   let w=base.w,h=base.h;if(rng()<.38)[w,h]=[h,w];
   const zone=rng()<.82?def.zones[Math.floor(rng()*def.zones.length)]:null;
   let minX=90,maxX=WORLD_W-w-90,minY=90,maxY=WORLD_H-h-90;
   if(zone&&zone.w>w+100&&zone.h>h+100){minX=Math.max(minX,zone.x+45);maxX=Math.min(maxX,zone.x+zone.w-w-45);minY=Math.max(minY,zone.y+45);maxY=Math.min(maxY,zone.y+zone.h-h-45)}
   if(maxX<=minX||maxY<=minY)continue;
   const c={x:Math.round(minX+rng()*(maxX-minX)),y:Math.round(minY+rng()*(maxY-minY)),w,h,kind:base.kind,dynamic:true};
   if(coverPlacementBlocked(c,fixed,placed,def))continue;
   placed.push(c);done=true
  }
 }
 return{seed:layoutSeed,obstacles:[...fixed,...placed],dynamicCount:placed.length,baseMovableCount:movable.length,extraRequested:extraCount}
}
`;
  if(s.includes('function buildRaidObstacles('))throw new Error('random cover already installed');
  s=mustReplace(s,anchor,anchor+insertion,'selectedMap anchor');
  const oldWorld="export function createWorld(config={}){\n const players=config.players||[{}],def=selectedMap(config.mapIndex||0),map={id:def.id,name:def.name,palette:copy(def.palette),roads:copy(def.roads)};\n const w={time:0,timeLeft:18*60,map,obstacles:def.obstacles.map(copy),doors:def.doors.map(d=>({...copy(d),open:false})),zones:def.zones.map(copy),extracts:def.extracts.map(copy),spawns:def.spawns.map(copy),patrols:def.patrols.map(copy),coverPoints:coverPointsFor(def.obstacles),actors:[],humanIds:[],bullets:[],grenades:[],crates:[],corpses:[],sounds:[],events:[],results:{},openContainers:{},interactions:{},inputs:{},aiSpawnSeq:0};";
  const newWorld="export function createWorld(config={}){\n const players=config.players||[{}],def=selectedMap(config.mapIndex||0),layout=buildRaidObstacles(def,config.coverSeed),map={id:def.id,name:def.name,palette:copy(def.palette),roads:copy(def.roads),layoutSeed:layout.seed,dynamicCoverCount:layout.dynamicCount};\n const w={time:0,timeLeft:18*60,map,obstacles:layout.obstacles.map(copy),doors:def.doors.map(d=>({...copy(d),open:false})),zones:def.zones.map(copy),extracts:def.extracts.map(copy),spawns:def.spawns.map(copy),patrols:def.patrols.map(copy),coverPoints:coverPointsFor(layout.obstacles),actors:[],humanIds:[],bullets:[],grenades:[],crates:[],corpses:[],sounds:[],events:[],results:{},openContainers:{},interactions:{},inputs:{},aiSpawnSeq:0};";
  s=mustReplace(s,oldWorld,newWorld,'createWorld layout');
  return s;
});

update('src/net.js',s=>mustReplace(
 s,
 "super();this.closed=false;this.world=createWorld({players:[config],mapIndex:Math.floor(Date.now()/(10*60*1000))%3});this.playerId=this.world.humanIds[0];this.acc=0;this.last=performance.now();",
 "super();const now=Date.now(),cycle=Math.floor(now/(10*60*1000));this.closed=false;this.world=createWorld({players:[config],mapIndex:((cycle%3)+3)%3,coverSeed:now});this.playerId=this.world.humanIds[0];this.acc=0;this.last=performance.now();",
 'LocalSession cover seed'
));

update('api/realtime.js',s=>mustReplace(
 s,
 "world=createWorld({players:[],aiCount:CAPACITY,mapIndex});",
 "world=createWorld({players:[],aiCount:CAPACITY,mapIndex,coverSeed:key});",
 'Vercel room cover seed'
));

update('cloudflare/worker.js',s=>mustReplace(
 s,
 "this.world = createWorld({ players: [], aiCount: CAPACITY, mapIndex: ((key % 3) + 3) % 3 });",
 "this.world = createWorld({ players: [], aiCount: CAPACITY, mapIndex: ((key % 3) + 3) % 3, coverSeed: key });",
 'Cloudflare room cover seed'
));

update('index.html',s=>{
 s=mustReplace(s,'<title>DEAD DROP // v3.0 Ammo Economy & Rotating Maps</title>','<title>DEAD DROP // v3.1 Dynamic Cover Raids</title>','page title');
 s=mustReplace(s,'탄약 T1~T5 · 방어구 수리 · 10분 맵 순환 · 구역 색상 강화 · 20Hz 네트워크 + 60fps 보간','RAID마다 엄폐물 재배치 · 엄폐물 대폭 증가 · 문/스폰/탈출구 안전배치 · 탄약 T1~T5 · 10분 맵 순환','patch note');
 return s;
});

console.log('v3.1 randomized cover patch applied');
