from pathlib import Path
import re

def rep(s,a,b,label):
    if a not in s:
        raise SystemExit(f'missing: {label}')
    return s.replace(a,b,1)

p=Path('src/sim.js'); s=p.read_text(encoding='utf-8')
s=rep(s,
"function addSound(w,x,y,range,kind,source){w.sounds.push({x,y,range,kind,source,age:0});for(const pid of w.humanIds){if(pid===source)continue;const p=getPlayer(w,pid);if(!p||p.dead)continue;const d=distXY(x,y,p.x,p.y);if(d<=range){const angle=Math.atan2(y-p.y,x-p.x);emit(w,'heard',{recipient:pid,kind,angle,intensity:d<range*.35?'near':d<range*.7?'mid':'far'})}}}",
"function addSound(w,x,y,range,kind,source){w.sounds.push({x,y,range,kind,source,age:0});const loud=kind==='footstep'&&range>=300,src=getActor(w,source);if(kind==='footstep'&&src?.kind==='player')emit(w,'self_step',{recipient:source,loud});for(const pid of w.humanIds){if(pid===source)continue;const p=getPlayer(w,pid);if(!p||p.dead)continue;const d=distXY(x,y,p.x,p.y);if(d<=range){const angle=Math.atan2(y-p.y,x-p.x);emit(w,'heard',{recipient:pid,kind,angle,loud,intensity:d<range*.35?'near':d<range*.7?'mid':'far'})}}}",
'addSound loud footsteps')
s=rep(s,"addSound(w,p.x,p.y,inp.sprint&&!healing?250:135,'footstep',p.id)","addSound(w,p.x,p.y,inp.sprint&&!healing?380:135,'footstep',p.id)",'sprint range')
p.write_text(s,encoding='utf-8')

p=Path('src/main.js'); s=p.read_text(encoding='utf-8')
s=rep(s,
"function explosionSound(volume=1){noiseBurst(.18,.10*volume,45,500)}",
"function explosionSound(volume=1){noiseBurst(.18,.10*volume,45,500)}\nfunction footstepSound(loud=false,volume=1){if(!audioCtx)return;noiseBurst(loud?.045:.022,(loud?.032:.014)*volume,55,loud?260:190);const o=audioCtx.createOscillator(),g=audioCtx.createGain(),now=audioCtx.currentTime;o.type='sine';o.frequency.setValueAtTime(loud?92:120,now);o.frequency.exponentialRampToValueAtTime(48,now+(loud?.07:.045));g.gain.setValueAtTime((loud?.035:.018)*volume,now);g.gain.exponentialRampToValueAtTime(.001,now+(loud?.08:.055));o.connect(g).connect(audioCtx.destination);o.start();o.stop(now+.09)}",
'footstep audio')
s=rep(s,
"function handleResult(r){lastResultHandled=true;session?.close();session=null;",
"function handleResult(r){lastResultHandled=true;if(document.pointerLockElement)document.exitPointerLock?.();input.shoot=false;keys.clear();session?.close();session=null;",
'game over pointer unlock')
s=rep(s,
"$('#abandonBtn').onclick=()=>{if(!session)return;if(confirm('출격 장비와 전리품을 모두 포기할까요?')){session.close();session=null;",
"$('#abandonBtn').onclick=()=>{if(!session)return;if(confirm('출격 장비와 전리품을 모두 포기할까요?')){if(document.pointerLockElement)document.exitPointerLock?.();input.shoot=false;keys.clear();session.close();session=null;",
'abandon pointer unlock')
s=rep(s,
"if(e.type==='heard'){const life=e.kind==='footstep'?0.95:e.kind==='gunshot'?1.45:e.kind==='explosion'?1.7:1.1;soundMarks.push({angle:e.angle,kind:e.kind||'sound',intensity:e.intensity||'mid',t:life,max:life});if(soundMarks.length>18)soundMarks.splice(0,soundMarks.length-18)}",
"if(e.type==='self_step')footstepSound(!!e.loud,e.loud?1:.72);if(e.type==='heard'){const life=e.kind==='footstep'?0.95:e.kind==='gunshot'?1.45:e.kind==='explosion'?1.7:1.1;if(e.kind==='footstep')footstepSound(!!e.loud,e.intensity==='near'?.72:e.intensity==='mid'?.48:.28);soundMarks.push({angle:e.angle,kind:e.kind||'sound',loud:!!e.loud,intensity:e.intensity||'mid',t:life,max:life});if(soundMarks.length>18)soundMarks.splice(0,soundMarks.length-18)}",
'heard footstep audio')
pat=r"const fade=Math\.min\(1,\(s\.t/s\.max\)\*1\.7\),x=cx\+Math\.cos\(s\.angle\)\*r,y=cy\+Math\.sin\(s\.angle\)\*r,scale=[^;]+;"
repl="const fade=Math.min(1,(s.t/s.max)*1.7),x=cx+Math.cos(s.angle)*r,y=cy+Math.sin(s.angle)*r,baseScale=s.intensity==='near'?1.18:s.intensity==='far'?0.82:1,scale=baseScale*(s.loud?1.35:1);"
s,n=re.subn(pat,repl,s,count=1)
if n!=1: raise SystemExit('missing: loud footstep mark regex')
s=rep(s,
"$('#openProgressText').textContent=`치료 중 ${heal.toFixed(1)}초`;",
"$('#openProgressText').textContent=`치료키트 사용중 · ${heal.toFixed(1)}초`;",
'heal progress label')
p.write_text(s,encoding='utf-8')
print('v2.3.1 UX patch applied')
