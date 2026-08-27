from pathlib import Path

def must_replace(s, old, new, label):
    if old not in s:
        raise SystemExit(f"missing target: {label}")
    return s.replace(old, new, 1)

p=Path("src/sim.js")
s=p.read_text(encoding="utf-8")
old="""function moveEntity(w,e,dx,dy){let moved=false;const nx=e.x+dx;if(!blocked(w,nx,e.y,e.r)){e.x=nx;moved=true}const ny=e.y+dy;if(!blocked(w,e.x,ny,e.r)){e.y=ny;moved=true}return moved}"""
new="""function moveEntity(w,e,dx,dy){let moved=false;const nx=e.x+dx;if(!blocked(w,nx,e.y,e.r)){e.x=nx;moved=true}const ny=e.y+dy;if(!blocked(w,e.x,ny,e.r)){e.y=ny;moved=true}if(moved&&e.kind&&e.kind!=='player'){e.stepDist=(e.stepDist||0)+Math.hypot(dx,dy);if(e.stepDist>=58){e.stepDist=0;addSound(w,e.x,e.y,e.kind==='pmc'?190:155,'footstep',e.id)}}return moved}"""
s=must_replace(s,old,new,"moveEntity footsteps")
old="""healCd:0,flinch:0,grenadeCd:5+Math.random()*6,sleepAcc:0,interactLatch:false,visionLevel:load.visionLevel||3"""
new="""healCd:0,healTimer:0,healDuration:0,healItemId:null,flinch:0,grenadeCd:5+Math.random()*6,sleepAcc:0,interactLatch:false,visionLevel:load.visionLevel||3"""
s=must_replace(s,old,new,"healing actor fields")
old="""emit(w,'shot',{actor:a.id,x:a.x,y:a.y,weapon:gun.type,recoil:d.recoil})"""
new="""emit(w,'shot',{actor:a.id,x:a.x,y:a.y,weapon:gun.type,recoil:d.recoil,angle:base,ownerKind:a.kind})"""
s=must_replace(s,old,new,"shot angle")
old="""function useMed(w,p){if(p.hp>=p.maxHp)return;const i=p.inventory.findIndex(x=>x.kind==='med');if(i<0)return;const m=p.inventory.splice(i,1)[0];p.hp=Math.min(p.maxHp,p.hp+(m.heal||45));emit(w,'heal',{actor:p.id})}"""
new="""function useMed(w,p){if(p.hp>=p.maxHp||p.healTimer>0)return;const m=p.inventory.find(x=>x.kind==='med');if(!m)return;p.healTimer=2;p.healDuration=2;p.healItemId=m.id;p.reload=0;emit(w,'heal_start',{actor:p.id,duration:2})}\nfunction updateHealing(w,p,dt){if(p.healTimer<=0)return;p.healTimer=Math.max(0,p.healTimer-dt);if(p.healTimer>0)return;const i=p.inventory.findIndex(x=>x.id===p.healItemId&&x.kind==='med');p.healItemId=null;if(i<0)return;const m=p.inventory.splice(i,1)[0],before=p.hp;p.hp=Math.min(p.maxHp,p.hp+(m.heal||45));emit(w,'heal',{actor:p.id,amount:Math.round(p.hp-before)})}"""
s=must_replace(s,old,new,"useMed channel")
old="""function movePlayer(w,p,dt){const inp=w.inputs[p.id]||emptyInput(),v=norm(inp.moveX,inp.moveY);if(inp.moveX||inp.moveY){const sp=p.moveSpeed*(inp.sprint?1.48:1);moveEntity(w,p,v.x*sp*dt,v.y*sp*dt);p.stepCd-=dt;if(p.stepCd<=0){p.stepCd=inp.sprint?.36:.58;addSound(w,p.x,p.y,inp.sprint?250:135,'footstep',p.id)}}p.angle=Math.atan2(inp.aimY,inp.aimX);p.fireCd=Math.max(0,p.fireCd-dt);p.flinch=Math.max(0,p.flinch-dt);if(p.reload>0){p.reload-=dt;if(p.reload<=0)finishReload(p)}if(inp.reload)startReload(p);const gun=currentWeapon(p),def=gun?WEAPONS[gun.type]:null;if(inp.shoot&&def&&(def.auto||!p.triggerHeld))shoot(w,p,inp.aimX,inp.aimY,false);p.triggerHeld=!!inp.shoot;updateInteraction(w,p,dt)}"""
new="""function movePlayer(w,p,dt){const inp=w.inputs[p.id]||emptyInput();updateHealing(w,p,dt);const healing=p.healTimer>0,v=norm(inp.moveX,inp.moveY);if(inp.moveX||inp.moveY){const sp=p.moveSpeed*(inp.sprint&&!healing?1.48:1)*(healing?.55:1);moveEntity(w,p,v.x*sp*dt,v.y*sp*dt);p.stepCd-=dt;if(p.stepCd<=0){p.stepCd=inp.sprint&&!healing?.36:.58;addSound(w,p.x,p.y,inp.sprint&&!healing?250:135,'footstep',p.id)}}p.angle=Math.atan2(inp.aimY,inp.aimX);p.fireCd=Math.max(0,p.fireCd-dt);p.flinch=Math.max(0,p.flinch-dt);if(p.reload>0){p.reload-=dt;if(p.reload<=0)finishReload(p)}if(inp.reload&&!healing)startReload(p);const gun=currentWeapon(p),def=gun?WEAPONS[gun.type]:null;if(inp.shoot&&def&&!healing&&(def.auto||!p.triggerHeld))shoot(w,p,inp.aimX,inp.aimY,false);p.triggerHeld=!!inp.shoot&&!healing;updateInteraction(w,p,dt)}"""
s=must_replace(s,old,new,"movePlayer healing")
old="""armor:p.gear.armor?.armor||0,maxArmor:p.gear.armor?.maxArmor||p.gear.armor?.armor||0,reload:p.reload"""
new="""armor:p.gear.armor?.armor||0,maxArmor:p.gear.armor?.maxArmor||p.gear.armor?.armor||0,reload:p.reload,healTimer:p.healTimer||0,healDuration:p.healDuration||0"""
s=must_replace(s,old,new,"snapshot healing")
p.write_text(s,encoding="utf-8")

p=Path("src/main.js")
s=p.read_text(encoding="utf-8")
old="""if(e.type==='shot'){if(eventOnScreen(e)){shotSound(e.weapon,e.actor===snap?.playerId?1:.42);fx.push({kind:'muzzle',x:e.x,y:e.y,t:.08,max:.08});if(e.actor===snap?.playerId){recoilKick=Math.min(11,recoilKick+(e.recoil||2)*1.35);shake=Math.max(shake,(e.recoil||2)*.7);fx.push({kind:'casing',x:e.x,y:e.y,vx:(Math.random()-.5)*80,vy:-40-Math.random()*45,t:.5,max:.5})}}}"""
new="""if(e.type==='shot'){if(eventOnScreen(e)){const self=e.actor===snap?.playerId,visible=self||snap?.actors?.some(a=>a.id===e.actor);shotSound(e.weapon,self?1:.42);if(visible){const ang=e.angle??0;fx.push({kind:'muzzle',x:e.x+Math.cos(ang)*25,y:e.y+Math.sin(ang)*25,angle:ang,self,t:self?.115:.095,max:self?.115:.095});}if(self){recoilKick=Math.min(11,recoilKick+(e.recoil||2)*1.35);shake=Math.max(shake,(e.recoil||2)*.7);fx.push({kind:'casing',x:e.x,y:e.y,vx:(Math.random()-.5)*80,vy:-40-Math.random()*45,t:.5,max:.5})}}}"""
s=must_replace(s,old,new,"shot client effects")
old="""if(e.type==='heard')soundMarks.push({angle:e.angle,t:1.35,max:1.35});"""
new="""if(e.type==='heard'){const life=e.kind==='footstep'?.95:e.kind==='gunshot'?1.45:e.kind==='explosion'?1.7:1.1;soundMarks.push({angle:e.angle,kind:e.kind||'sound',intensity:e.intensity||'mid',t:life,max:life});if(soundMarks.length>18)soundMarks.splice(0,soundMarks.length-18)}"""
s=must_replace(s,old,new,"heard marks")
old="""if(e.type==='loot')toast(`획득: ${e.item}`);if(e.type==='equip')toast(`장착: ${e.item}`);if(e.type==='door')toast(`${e.name} ${e.open?'열림':'닫힘'}`);if(e.type==='heal'&&e.actor===snap?.playerId)toast(`치료 완료 +${e.amount||0} HP`);"""
new="""if(e.type==='loot')toast(`획득: ${e.item}`);if(e.type==='equip')toast(`장착: ${e.item}`);if(e.type==='door')toast(`${e.name} ${e.open?'열림':'닫힘'}`);if(e.type==='heal_start'&&e.actor===snap?.playerId)toast('치료 시작 · 2초');if(e.type==='heal'&&e.actor===snap?.playerId)toast(`치료 완료 +${e.amount||0} HP`);"""
s=must_replace(s,old,new,"heal feedback")
old="""function renderProgress(){const q=snap.interaction,box=$('#openProgress');if(!q){box.classList.add('hidden');return}box.classList.remove('hidden');const pct=Math.min(1,q.progress/q.duration);$('#openProgressFill').style.width=`${pct*100}%`;$('#openProgressText').textContent=q.kind==='extract'?`탈출 중 ${(q.duration-q.progress).toFixed(1)}초`:`상자 여는 중 ${(q.duration-q.progress).toFixed(1)}초`}"""
new="""function renderProgress(){const box=$('#openProgress'),heal=snap.player?.healTimer||0;if(heal>0){box.classList.remove('hidden');const dur=snap.player.healDuration||2,pct=Math.max(0,Math.min(1,1-heal/dur));$('#openProgressFill').style.width=`${pct*100}%`;$('#openProgressText').textContent=`치료 중 ${heal.toFixed(1)}초`;return}const q=snap.interaction;if(!q){box.classList.add('hidden');return}box.classList.remove('hidden');const pct=Math.min(1,q.progress/q.duration);$('#openProgressFill').style.width=`${pct*100}%`;$('#openProgressText').textContent=q.kind==='extract'?`탈출 중 ${(q.duration-q.progress).toFixed(1)}초`:`상자 여는 중 ${(q.duration-q.progress).toFixed(1)}초`}"""
s=must_replace(s,old,new,"renderProgress heal")
old="""function drawBullets(cam){for(const b of snap.bullets){if(!onScreen(b.x,b.y,cam))continue;const a=Math.atan2(b.vy,b.vx);ctx.save();ctx.strokeStyle='rgba(255,230,140,.98)';ctx.lineWidth=3;ctx.shadowColor='rgba(255,210,90,.95)';ctx.shadowBlur=7;ctx.beginPath();ctx.moveTo(b.x-Math.cos(a)*24,b.y-Math.sin(a)*24);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore()}}"""
new="""function drawBullets(cam){for(const b of snap.bullets){if(!onScreen(b.x,b.y,cam))continue;const a=Math.atan2(b.vy,b.vx),self=b.owner===snap.playerId;ctx.save();ctx.strokeStyle=self?'rgba(205,246,255,.99)':'rgba(255,164,92,.99)';ctx.lineWidth=self?3.4:3;ctx.shadowColor=self?'rgba(110,220,255,.98)':'rgba(255,104,48,.95)';ctx.shadowBlur=9;ctx.beginPath();ctx.moveTo(b.x-Math.cos(a)*30,b.y-Math.sin(a)*30);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore()}}"""
s=must_replace(s,old,new,"bullet ownership color")
old="""if(f.kind==='muzzle'){ctx.fillStyle='#ffd776';ctx.beginPath();ctx.arc(f.x,f.y,15*(1-a)+8,0,Math.PI*2);ctx.fill()}"""
new="""if(f.kind==='muzzle'){ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.angle||0);ctx.fillStyle=f.self?'#dff9ff':'#ff9857';ctx.shadowColor=f.self?'#7fdfff':'#ff5f32';ctx.shadowBlur=f.self?18:13;const len=(f.self?34:27)*(1+.35*(1-a));ctx.beginPath();ctx.moveTo(len,0);ctx.lineTo(-5,-8);ctx.lineTo(2,0);ctx.lineTo(-5,8);ctx.closePath();ctx.fill();ctx.beginPath();ctx.arc(0,0,f.self?9:7,0,Math.PI*2);ctx.fill();ctx.restore()}"""
s=must_replace(s,old,new,"muzzle draw")
old="""drawDarkness(cam);ctx.save();ctx.translate(-cam.x,-cam.y);drawBullets(cam);ctx.restore();drawSoundIndicators();}"""
new="""drawDarkness(cam);ctx.save();ctx.translate(-cam.x,-cam.y);drawBullets(cam);ctx.restore();drawSoundIndicators();drawCrosshair();}"""
s=must_replace(s,old,new,"draw crosshair call")
start=s.index("function drawSoundIndicators(){")
end=s.index("\n\nfunction updateInput(){", start)
new_block="""function drawSoundIndicators(){const cx=canvas.width/2,cy=canvas.height/2,r=Math.min(canvas.width,canvas.height)*.43;for(const s of soundMarks){const fade=Math.min(1,(s.t/s.max)*1.7),x=cx+Math.cos(s.angle)*r,y=cy+Math.sin(s.angle)*r,scale=s.intensity==='near'?1.18:s.intensity==='far'?.82:1;ctx.save();ctx.translate(x,y);ctx.rotate(s.angle);ctx.globalAlpha=fade;if(s.kind==='footstep'){ctx.strokeStyle='#e9edf0';ctx.lineWidth=3;for(const off of [-6,6]){ctx.beginPath();ctx.arc(0,off,5*scale,-.9,.9);ctx.stroke()}ctx.fillStyle='#e9edf0';ctx.font='bold 9px monospace';ctx.fillText('STEP',-12,18)}else if(s.kind==='gunshot'){ctx.fillStyle='#ffb36b';ctx.beginPath();ctx.moveTo(16*scale,0);ctx.lineTo(-9,-9);ctx.lineTo(-3,0);ctx.lineTo(-9,9);ctx.closePath();ctx.fill();ctx.strokeStyle='#ffcf9d';ctx.lineWidth=2;for(const yy of [-11,11]){ctx.beginPath();ctx.moveTo(-2,yy);ctx.lineTo(7,yy*1.25);ctx.stroke()}}else if(s.kind==='explosion'){ctx.strokeStyle='#ff7b61';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,12*scale,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(18,0);ctx.moveTo(0,-18);ctx.lineTo(0,18);ctx.stroke()}else{ctx.fillStyle='#d5d9d8';ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-8,-8);ctx.lineTo(-3,0);ctx.lineTo(-8,8);ctx.closePath();ctx.fill()}ctx.restore()}ctx.globalAlpha=1}\nfunction drawCrosshair(){if(!session)return;ctx.save();ctx.translate(mouse.x,mouse.y);ctx.strokeStyle='rgba(225,242,247,.92)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.moveTo(-13,0);ctx.lineTo(-5,0);ctx.moveTo(13,0);ctx.lineTo(5,0);ctx.moveTo(0,-13);ctx.lineTo(0,-5);ctx.moveTo(0,13);ctx.lineTo(0,5);ctx.stroke();ctx.restore()}"""
s=s[:start]+new_block+s[end:]
old="""session.on('snapshot',s=>{snap=s;renderHUD();if(s.result&&!lastResultHandled)handleResult(s.result)});"""
new="""session.on('snapshot',s=>{snap=s;if(s.openContainer&&document.pointerLockElement===canvas)document.exitPointerLock?.();renderHUD();if(s.result&&!lastResultHandled)handleResult(s.result)});"""
s=must_replace(s,old,new,"snapshot unlock loot")
old="""canvas.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect();mouse.x=(e.clientX-r.left)*canvas.width/r.width;mouse.y=(e.clientY-r.top)*canvas.height/r.height});canvas.addEventListener('mousedown',e=>{if(e.button===0){ensureAudio();input.shoot=true}});window.addEventListener('mouseup',e=>{if(e.button===0)input.shoot=false});"""
new="""canvas.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect(),sx=canvas.width/r.width,sy=canvas.height/r.height;if(document.pointerLockElement===canvas){mouse.x=Math.max(8,Math.min(canvas.width-8,mouse.x+e.movementX*sx));mouse.y=Math.max(8,Math.min(canvas.height-8,mouse.y+e.movementY*sy))}else{mouse.x=Math.max(8,Math.min(canvas.width-8,(e.clientX-r.left)*sx));mouse.y=Math.max(8,Math.min(canvas.height-8,(e.clientY-r.top)*sy))}});canvas.addEventListener('mousedown',e=>{if(e.button===0){ensureAudio();if(session&&!snap?.openContainer&&document.pointerLockElement!==canvas&&canvas.requestPointerLock){canvas.requestPointerLock();toast('마우스 조준 고정 · ESC로 해제');return}input.shoot=true}});window.addEventListener('mouseup',e=>{if(e.button===0)input.shoot=false});document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement!==canvas)input.shoot=false});"""
s=must_replace(s,old,new,"pointer lock input")
p.write_text(s,encoding="utf-8")

p=Path("index.html")
s=p.read_text(encoding="utf-8")
s=s.replace("WASD 이동 · SHIFT 전력질주 · 좌클릭 사격 · R 재장전 · E 상호작용 · G 수류탄 · 1/2 무기 전환","WASD 이동 · SHIFT 전력질주 · 클릭 후 마우스 고정(ESC 해제) · 좌클릭 사격 · R 재장전 · E 상호작용 · G 수류탄 · H 치료(2초) · 1/2 무기 전환")
p.write_text(s,encoding="utf-8")
print("patched combat UX v2.3")
