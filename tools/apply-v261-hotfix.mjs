import fs from 'node:fs';

function replace(path,label,from,to){
  let s=fs.readFileSync(path,'utf8');
  if(!s.includes(from)) throw new Error(`${path}: missing ${label}`);
  s=s.replace(from,to);
  fs.writeFileSync(path,s);
}

replace('src/sim.js','player armor default',
" const armor=load.armor?normalizeItem(load.armor):kind==='pmc'?gearItem('armor_light'):kind==='scav'?null:gearItem('armor_light');",
" const armor=load.armor?normalizeItem(load.armor):kind==='pmc'?gearItem('armor_light'):null;");

replace('src/sim.js','player backpack default',
" const backpack=load.backpack?normalizeItem(load.backpack):kind==='player'?gearItem('backpack'):null;",
" const backpack=load.backpack?normalizeItem(load.backpack):null;");

replace('src/sim.js','dog tag ownership',
"if(a.kind!=='player')items.push(valuable('인식표',a.kind==='pmc'?480:110));",
"if(a.kind==='player')items.push(valuable((a.name||'PLAYER')+' 인식표',350));");

replace('src/main.js','sprint camera bob',
"function camera(){const p=visualPlayer();if(!p)return{x:0,y:0};const kick=recoilKick,dx=Math.cos(p.angle)*kick,dy=Math.sin(p.angle)*kick;let bobX=0,bobY=0;const moving=keys.has('w')||keys.has('a')||keys.has('s')||keys.has('d'),sprinting=keys.has('shift')&&moving;if(sprinting){const bob=Math.sin(performance.now()*.022)*1.8,side=(p.moveAngle??p.angle)+Math.PI/2;bobX=Math.cos(side)*bob;bobY=Math.sin(side)*bob}return{x:Math.max(0,Math.min(snap.worldW-canvas.width,p.x-canvas.width/2+dx+bobX)),y:Math.max(0,Math.min(snap.worldH-canvas.height,p.y-canvas.height/2+dy+bobY))}}",
"function camera(){const p=visualPlayer();if(!p)return{x:0,y:0};const kick=recoilKick,dx=Math.cos(p.angle)*kick,dy=Math.sin(p.angle)*kick;return{x:Math.max(0,Math.min(snap.worldW-canvas.width,p.x-canvas.width/2+dx)),y:Math.max(0,Math.min(snap.worldH-canvas.height,p.y-canvas.height/2+dy))}}"
);

console.log('v2.6.1 hotfix applied');
