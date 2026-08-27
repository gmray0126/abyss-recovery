from pathlib import Path

sim=Path("src/sim.js")
s=sim.read_text(encoding="utf-8")
main=Path("src/main.js")
m=main.read_text(encoding="utf-8")

def rep(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f"missing target: {label}")
    return text.replace(old,new,1)

s = rep(s,
"export const MAP_OBSTACLES=O;\n\nexport const ZONES=[",
"""export const MAP_OBSTACLES=O;
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

export const ZONES=[""",
"door defs")

old_collision = """function blocked(x,y,r){if(x-r<0||y-r<0||x+r>WORLD_W||y+r>WORLD_H)return true;return MAP_OBSTACLES.some(o=>circleRect(x,y,r,o))}
function moveEntity(e,dx,dy){let moved=false;const nx=e.x+dx;if(!blocked(nx,e.y,e.r)){e.x=nx;moved=true}const ny=e.y+dy;if(!blocked(e.x,ny,e.r)){e.y=ny;moved=true}return moved}
function segmentBlocked(x1,y1,x2,y2){const d=distXY(x1,y1,x2,y2),n=Math.ceil(d/22);for(let i=1;i<n;i++){const t=i/n,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;if(MAP_OBSTACLES.some(o=>x>o.x&&x<o.x+o.w&&y>o.y&&y<o.y+o.h))return true}return false}
function los(a,b,max=1000){return dist(a,b)<=max&&!segmentBlocked(a.x,a.y,b.x,b.y)}
function angleDiff(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b))}
function visionParams(level=3){const near=150+level*28;return{near,far:near+360+level*50,half:1.05}}
function canSee(viewer,target,level=3){const d=dist(viewer,target),v=visionParams(level);if(d<=v.near)return !segmentBlocked(viewer.x,viewer.y,target.x,target.y);if(d>v.far)return false;const a=Math.atan2(target.y-viewer.y,target.x-viewer.x);return Math.abs(angleDiff(a,viewer.angle))<=v.half&&!segmentBlocked(viewer.x,viewer.y,target.x,target.y)}"""
new_collision = """function allBlockers(w){return w?[...w.obstacles,...w.doors.filter(d=>!d.open)]:MAP_OBSTACLES}
function blocked(w,x,y,r){if(x-r<0||y-r<0||x+r>WORLD_W||y+r>WORLD_H)return true;return allBlockers(w).some(o=>circleRect(x,y,r,o))}
function moveEntity(w,e,dx,dy){let moved=false;const nx=e.x+dx;if(!blocked(w,nx,e.y,e.r)){e.x=nx;moved=true}const ny=e.y+dy;if(!blocked(w,e.x,ny,e.r)){e.y=ny;moved=true}return moved}
function segmentBlocked(w,x1,y1,x2,y2){const d=distXY(x1,y1,x2,y2),n=Math.ceil(d/22);for(let i=1;i<n;i++){const t=i/n,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;if(allBlockers(w).some(o=>x>o.x&&x<o.x+o.w&&y>o.y&&y<o.y+o.h))return true}return false}
function los(w,a,b,max=1000){return dist(a,b)<=max&&!segmentBlocked(w,a.x,a.y,b.x,b.y)}
function angleDiff(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b))}
function visionParams(level=3){const near=190+level*34;return{near,far:near+430+level*58,half:1.05}}
function canSee(w,viewer,target,level=3){const d=dist(viewer,target),v=visionParams(level);if(d<=v.near)return !segmentBlocked(w,viewer.x,viewer.y,target.x,target.y);if(d>v.far)return false;const a=Math.atan2(target.y-viewer.y,target.x-viewer.x);return Math.abs(angleDiff(a,viewer.angle))<=v.half&&!segmentBlocked(w,viewer.x,viewer.y,target.x,target.y)}"""
s = rep(s, old_collision, new_collision, "collision/vision")

s = rep(s,
"const players=config.players||[{}];const w={time:0,timeLeft:18*60,obstacles:MAP_OBSTACLES,zones:ZONES,extracts:EXTRACTS,actors:[],humanIds:[],bullets:[],grenades:[],crates:[],corpses:[],sounds:[],events:[],results:{},openContainers:{},interactions:{},inputs:{}};",
"const players=config.players||[{}];const w={time:0,timeLeft:18*60,obstacles:MAP_OBSTACLES.map(copy),doors:DOOR_DEFS.map(d=>({...d,open:false})),zones:ZONES,extracts:EXTRACTS,actors:[],humanIds:[],bullets:[],grenades:[],crates:[],corpses:[],sounds:[],events:[],results:{},openContainers:{},interactions:{},inputs:{}};",
"world doors")

s = s.replace("sleepAcc:0,visionLevel:load.visionLevel||3};","sleepAcc:0,interactLatch:false,visionLevel:load.visionLevel||3};",1)

repls = [
("moveEntity(p,v.x*sp*dt,v.y*sp*dt)", "moveEntity(w,p,v.x*sp*dt,v.y*sp*dt)"),
("moveEntity(a,n.x*speed*dt,n.y*speed*dt)", "moveEntity(w,a,n.x*speed*dt,n.y*speed*dt)"),
("moveEntity(a,-n.y*s*speed*.72*dt,n.x*s*speed*.72*dt)", "moveEntity(w,a,-n.y*s*speed*.72*dt,n.x*s*speed*.72*dt)"),
("moveEntity(a,-n.x*a.moveSpeed*.7*dt,-n.y*a.moveSpeed*.7*dt)", "moveEntity(w,a,-n.x*a.moveSpeed*.7*dt,-n.y*a.moveSpeed*.7*dt)"),
("moveEntity(a,-n.y*a.strafe*a.moveSpeed*.28*dt,n.x*a.strafe*a.moveSpeed*.28*dt)", "moveEntity(w,a,-n.y*a.strafe*a.moveSpeed*.28*dt,n.x*a.strafe*a.moveSpeed*.28*dt)"),
("blocked(c.x,c.y,a.r)", "blocked(w,c.x,c.y,a.r)"),
("blocked(nx,g.y,7)", "blocked(w,nx,g.y,7)"),
("blocked(g.x,ny,7)", "blocked(w,g.x,ny,7)"),
("segmentBlocked(c.x,c.y,target.x,target.y)", "segmentBlocked(w,c.x,c.y,target.x,target.y)"),
("segmentBlocked(a.x,a.y,t.x,t.y)", "segmentBlocked(w,a.x,a.y,t.x,t.y)"),
("segmentBlocked(g.x,g.y,a.x,a.y)", "segmentBlocked(w,g.x,g.y,a.x,a.y)"),
("canSee(a,b,a.kind==='pmc'?4:2)", "canSee(w,a,b,a.kind==='pmc'?4:2)"),
("canSee(a,t,a.kind==='pmc'?4:2)", "canSee(w,a,t,a.kind==='pmc'?4:2)"),
("canSee(p,a,p.visionLevel)", "canSee(w,p,a,p.visionLevel)"),
("function chooseCover(a,target)", "function chooseCover(w,a,target)"),
("chooseCover(a,vis)", "chooseCover(w,a,vis)"),
("function steerToward(a,tx,ty,speed,dt)", "function steerToward(w,a,tx,ty,speed,dt)"),
("steerToward(a,a.cover.x,a.cover.y,a.moveSpeed,dt)", "steerToward(w,a,a.cover.x,a.cover.y,a.moveSpeed,dt)"),
("steerToward(a,t.x,t.y,a.moveSpeed,dt)", "steerToward(w,a,t.x,t.y,a.moveSpeed,dt)"),
("steerToward(a,goal.x,goal.y,a.moveSpeed*.72,dt)", "steerToward(w,a,goal.x,goal.y,a.moveSpeed*.72,dt)"),
("MAP_OBSTACLES.some(o=>b.x>o.x&&b.x<o.x+o.w&&b.y>o.y&&b.y<o.y+o.h)", "allBlockers(w).some(o=>b.x>o.x&&b.x<o.x+o.w&&b.y>o.y&&b.y<o.y+o.h)"),
]
for old,new in repls:
    if old in s:s=s.replace(old,new)
    elif new not in s:raise SystemExit(f"missing call target {old}")

s = rep(s,
"function nearExtract(w,p){return w.extracts.find(e=>p.x>e.x&&p.x<e.x+e.w&&p.y>e.y&&p.y<e.y+e.h)}\nfunction updateInteraction(w,p,dt){const inp=w.inputs[p.id]||emptyInput();const openId=w.openContainers[p.id];if(openId){const c=getContainer(w,openId);if(!c||dist(p,c)>105)delete w.openContainers[p.id]}\n if(!inp.interact){delete w.interactions[p.id];return}\n const ext=nearExtract(w,p);if(ext){",
"""function nearExtract(w,p){return w.extracts.find(e=>p.x>e.x&&p.x<e.x+e.w&&p.y>e.y&&p.y<e.y+e.h)}
function nearDoor(w,p,max=82){let best=null,bd=max;for(const d of w.doors){const cx=d.x+d.w/2,cy=d.y+d.h/2,dd=distXY(p.x,p.y,cx,cy);if(dd<bd){best=d;bd=dd}}return best}
function updateInteraction(w,p,dt){const inp=w.inputs[p.id]||emptyInput();const openId=w.openContainers[p.id];if(openId){const c=getContainer(w,openId);if(!c||dist(p,c)>145)delete w.openContainers[p.id]}
 if(!inp.interact){p.interactLatch=false;delete w.interactions[p.id];return}
 const ext=nearExtract(w,p);if(ext){""",
"door interaction start")

s = rep(s,
"emit(w,'extract',{recipient:p.id,name:ext.name})}return}\n const c=nearContainer(w,p);",
"""emit(w,'extract',{recipient:p.id,name:ext.name})}return}
 const door=nearDoor(w,p);if(door){if(!p.interactLatch){door.open=!door.open;emit(w,'door',{recipient:p.id,id:door.id,name:door.name,open:door.open});addSound(w,door.x+door.w/2,door.y+door.h/2,180,'door',p.id)}p.interactLatch=true;delete w.interactions[p.id];delete w.openContainers[p.id];return}
 p.interactLatch=true;
 const c=nearContainer(w,p);""",
"door interaction body")

old_loot="const c=getContainer(w,w.openContainers[id]);if(!c||dist(p,c)>105||p.inventory.length>=bagCapacity(p))return;const i=c.items.findIndex(x=>x.id===action.itemId);if(i<0)return;const it=c.items.splice(i,1)[0];p.inventory.push(normalizeItem(it));emit(w,'loot',{recipient:id,item:it.name})"
new_loot="const c=getContainer(w,action.containerId||w.openContainers[id]);if(!c||dist(p,c)>145||p.inventory.length>=bagCapacity(p))return;const i=c.items.findIndex(x=>x.id===action.itemId);if(i<0)return;const it=c.items.splice(i,1)[0];p.inventory.push(normalizeItem(it));w.openContainers[id]=c.id;emit(w,'loot',{recipient:id,item:it.name,itemId:it.id})"
s = rep(s,old_loot,new_loot,"loot action")

old_snap="crates:w.crates.map(c=>({id:c.id,x:c.x,y:c.y,opened:c.opened,empty:c.items.length===0})),corpses:w.corpses.map(c=>({id:c.id,x:c.x,y:c.y,ownerName:c.ownerName,empty:c.items.length===0})),actors:visible,"
new_snap="crates:w.crates.filter(c=>canSee(w,p,c,p.visionLevel)).map(c=>({id:c.id,x:c.x,y:c.y,opened:c.opened,empty:c.items.length===0})),corpses:w.corpses.filter(c=>canSee(w,p,c,p.visionLevel)).map(c=>({id:c.id,x:c.x,y:c.y,ownerName:c.ownerName,empty:c.items.length===0})),doors:w.doors.filter(d=>canSee(w,p,{x:d.x+d.w/2,y:d.y+d.h/2},p.visionLevel)).map(d=>({id:d.id,name:d.name,x:d.x,y:d.y,w:d.w,h:d.h,open:d.open})),actors:visible,"
s = rep(s,old_snap,new_snap,"snapshot doors/hidden loot")
sim.write_text(s,encoding="utf-8")

m = rep(m,"b.onclick=()=>session?.sendAction({type:ACTIONS.LOOT,itemId:it.id});","b.onclick=()=>session?.sendAction({type:ACTIONS.LOOT,itemId:it.id,containerId:c.id});","loot button container id")

m = rep(m,
"function onScreen(x,y,cam,pad=80){return x>cam.x-pad&&x<cam.x+canvas.width+pad&&y>cam.y-pad&&y<cam.y+canvas.height+pad}\nfunction draw(){",
"""function onScreen(x,y,cam,pad=80){return x>cam.x-pad&&x<cam.x+canvas.width+pad&&y>cam.y-pad&&y<cam.y+canvas.height+pad}
function visionShape(){const p=snap?.player;if(!p)return null;const near=190+p.visionLevel*34,far=near+430+p.visionLevel*58;return{p,near,far,half:1.05}}
function angleDelta(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b))}
function pointInVision(x,y){const v=visionShape();if(!v)return false;const dx=x-v.p.x,dy=y-v.p.y,d=Math.hypot(dx,dy);if(d<=v.near)return true;if(d>v.far)return false;return Math.abs(angleDelta(Math.atan2(dy,dx),v.p.angle))<=v.half}
function rectInVision(o){const v=visionShape();if(!v)return false;const px=Math.max(o.x,Math.min(v.p.x,o.x+o.w)),py=Math.max(o.y,Math.min(v.p.y,o.y+o.h));if(Math.hypot(px-v.p.x,py-v.p.y)<=v.near)return true;const pts=[[o.x,o.y],[o.x+o.w,o.y],[o.x,o.y+o.h],[o.x+o.w,o.y+o.h],[o.x+o.w/2,o.y+o.h/2],[px,py]];return pts.some(([x,y])=>pointInVision(x,y))}
function draw(){""",
"vision helpers")

m = rep(m,"drawGround(cam);drawZones(cam);drawExtracts(cam);drawObstacles(cam);drawCrates(cam);drawCorpses(cam);drawActors(cam);","drawGround(cam);drawZones(cam);drawExtracts(cam);drawObstacles(cam);drawDoors(cam);drawCrates(cam);drawCorpses(cam);drawActors(cam);","draw door call")
m = rep(m,"function drawObstacles(cam){for(const o of snap.obstacles){if(o.x+o.w<cam.x-40||o.x>cam.x+canvas.width+40||o.y+o.h<cam.y-40||o.y>cam.y+canvas.height+40)continue;","function drawObstacles(cam){for(const o of snap.obstacles){if(o.x+o.w<cam.x-40||o.x>cam.x+canvas.width+40||o.y+o.h<cam.y-40||o.y>cam.y+canvas.height+40||!rectInVision(o))continue;","obstacle visibility")

marker="function drawCrates(cam){"
doorfn="""function drawDoors(cam){for(const d of snap.doors||[]){if(!rectInVision(d))continue;ctx.save();const cx=d.x+d.w/2,cy=d.y+d.h/2;ctx.translate(cx,cy);if(d.open){ctx.strokeStyle='#92785e';ctx.lineWidth=5;ctx.beginPath();if(d.w>d.h){ctx.moveTo(-d.w/2,0);ctx.lineTo(-d.w/2,-Math.min(72,d.w));}else{ctx.moveTo(0,-d.h/2);ctx.lineTo(Math.min(72,d.h),-d.h/2);}ctx.stroke()}else{ctx.fillStyle='#6f5945';ctx.fillRect(-d.w/2,-d.h/2,d.w,d.h);ctx.strokeStyle='#b29269';ctx.strokeRect(-d.w/2,-d.h/2,d.w,d.h)}ctx.restore()}}
"""
if doorfn not in m:
    if marker not in m:raise SystemExit("missing drawCrates marker")
    m=m.replace(marker,doorfn+marker,1)

m = rep(m,"function drawCrates(cam){for(const c of snap.crates){if(!onScreen(c.x,c.y,cam))continue;","function drawCrates(cam){for(const c of snap.crates){if(!onScreen(c.x,c.y,cam)||!pointInVision(c.x,c.y))continue;","crate visibility")
m = rep(m,"function drawCorpses(cam){for(const c of snap.corpses){if(!onScreen(c.x,c.y,cam))continue;","function drawCorpses(cam){for(const c of snap.corpses){if(!onScreen(c.x,c.y,cam)||!pointInVision(c.x,c.y))continue;","corpse visibility")
m = rep(m,"for(const z of snap.zones)if(onScreen(z.x+z.w/2,z.y+z.h/2,cam,500))ctx.fillText(z.name,z.x+24,z.y+54)","for(const z of snap.zones)if(onScreen(z.x+z.w/2,z.y+z.h/2,cam,500)&&rectInVision(z))ctx.fillText(z.name,z.x+24,z.y+54)","zone visibility")
m = rep(m,"if(e.type==='loot')toast(`획득: ${e.item}`);if(e.type==='equip')toast(`장착: ${e.item}`);","if(e.type==='loot')toast(`획득: ${e.item}`);if(e.type==='equip')toast(`장착: ${e.item}`);if(e.type==='door')toast(`${e.name} ${e.open?'열림':'닫힘'}`);","door feedback")
m=m.replace("E 상자·시체 열기 / 탈출","E 문·상자·시체 / 탈출")
main.write_text(m,encoding="utf-8")
print("v2.2 patch applied")
