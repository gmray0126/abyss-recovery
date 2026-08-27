from pathlib import Path
p=Path('src/sim.js')
s=p.read_text(encoding='utf-8')
old="function canSee(w,viewer,target,level=3){const d=dist(viewer,target),v=visionParams(level);if(d<=v.near)return !segmentBlocked(w,viewer.x,viewer.y,target.x,target.y);if(d>v.far)return false;const a=Math.atan2(target.y-viewer.y,target.x-viewer.x);return Math.abs(angleDiff(a,viewer.angle))<=v.half&&!segmentBlocked(w,viewer.x,viewer.y,target.x,target.y)}"
new="function inVisionArc(viewer,target,level=3){const d=dist(viewer,target),v=visionParams(level);if(d<=v.near)return true;if(d>v.far)return false;const a=Math.atan2(target.y-viewer.y,target.x-viewer.x);return Math.abs(angleDiff(a,viewer.angle))<=v.half}\nfunction canSee(w,viewer,target,level=3){return inVisionArc(viewer,target,level)&&!segmentBlocked(w,viewer.x,viewer.y,target.x,target.y)}"
if new not in s:
    if old not in s:raise SystemExit('canSee target missing')
    s=s.replace(old,new,1)
old2="doors:w.doors.filter(d=>canSee(w,p,{x:d.x+d.w/2,y:d.y+d.h/2},p.visionLevel)).map(d=>({id:d.id,name:d.name,x:d.x,y:d.y,w:d.w,h:d.h,open:d.open}))"
new2="doors:w.doors.filter(d=>inVisionArc(p,{x:d.x+d.w/2,y:d.y+d.h/2},p.visionLevel)).map(d=>({id:d.id,name:d.name,x:d.x,y:d.y,w:d.w,h:d.h,open:d.open}))"
if new2 not in s:
    if old2 not in s:raise SystemExit('door snapshot target missing')
    s=s.replace(old2,new2,1)
p.write_text(s,encoding='utf-8')
