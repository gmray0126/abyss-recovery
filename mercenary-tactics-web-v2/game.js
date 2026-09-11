const canvas=document.querySelector('#gameCanvas');
const ctx=canvas.getContext('2d');
const panel=document.querySelector('#characterPanel');
const statusText=document.querySelector('#statusText');
const regenBtn=document.querySelector('#regenBtn');
const moveBtn=document.querySelector('#moveBtn');
const attackBtn=document.querySelector('#attackBtn');
const skillBtn=document.querySelector('#skillBtn');
const waitBtn=document.querySelector('#waitBtn');
const toast=document.querySelector('#toast');
const W=canvas.width,H=canvas.height,SIZE=8;
const PLAIN=0,RIVER=1,BRIDGE=2,FOREST=3,ROCK=4;
const corners={tl:{x:140,y:130},tr:{x:1030,y:130},br:{x:1150,y:690},bl:{x:50,y:690}};
const seraImg=new Image();seraImg.src=window.MT_ASSETS.seraBoard;document.querySelector('#portraitImg').src=window.MT_ASSETS.seraPortrait;
let imageReady=false;seraImg.onload=()=>imageReady=true;
let terrain=[],hoverCell=null,seraCell={r:7,c:3},selected=false,reachable=new Map(),animation=null,pulse=0,toastTimer=0,audioCtx=null;
function lerpPoint(a,b,t){return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}}
function pointAt(gx,gy){const u=gx/SIZE,v=gy/SIZE;return lerpPoint(lerpPoint(corners.tl,corners.tr,u),lerpPoint(corners.bl,corners.br,u),v)}
function cellPoly(r,c){return[pointAt(c,r),pointAt(c+1,r),pointAt(c+1,r+1),pointAt(c,r+1)]}
function cellCenter(r,c){const p=cellPoly(r,c);return{x:(p[0].x+p[1].x+p[2].x+p[3].x)/4,y:(p[0].y+p[1].y+p[2].y+p[3].y)/4}}
function key(r,c){return`${r},${c}`}
function inBounds(r,c){return r>=0&&r<SIZE&&c>=0&&c<SIZE}
function isPassable(r,c){return inBounds(r,c)&&terrain[r][c]!==RIVER&&terrain[r][c]!==ROCK}
function moveCost(r,c){return terrain[r][c]===FOREST?2:1}
function randInt(a,b){return a+Math.floor(Math.random()*(b-a+1))}
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function generateMap(){
 terrain=Array.from({length:SIZE},()=>Array(SIZE).fill(PLAIN));let row=randInt(2,5);
 for(let c=0;c<SIZE;c++){terrain[row][c]=RIVER;if(c<SIZE-1){const roll=Math.random();let next=row;if(roll<.28)next=Math.max(2,row-1);else if(roll>.72)next=Math.min(5,row+1);if(next!==row)terrain[next][c]=RIVER;row=next}}
 for(const c of shuffle([1,2,3,4,5,6]).slice(0,2))for(let r=2;r<=5;r++)if(terrain[r][c]===RIVER)terrain[r][c]=BRIDGE;
 let free=[];for(let r=2;r<=5;r++)for(let c=0;c<SIZE;c++)if(terrain[r][c]===PLAIN)free.push({r,c});free=shuffle(free);
 for(let i=0;i<Math.min(7,free.length);i++){const p=free.pop();terrain[p.r][p.c]=FOREST}for(let i=0;i<Math.min(4,free.length);i++){const p=free.pop();terrain[p.r][p.c]=ROCK}
 seraCell={r:7,c:3};selected=false;reachable.clear();panel.classList.add('is-hidden');setAction(moveBtn);status('새 전장을 생성했습니다. 세라를 클릭해 선택하세요.')
}
function findPath(start,goal,maxCost=3){
 if((start.r===goal.r&&start.c===goal.c)||!isPassable(goal.r,goal.c))return[];
 const frontier=[{...start,cost:0}],best=new Map([[key(start.r,start.c),0]]),parent=new Map(),dirs=[[1,0],[-1,0],[0,1],[0,-1]];
 while(frontier.length){frontier.sort((a,b)=>a.cost-b.cost);const cur=frontier.shift();if(cur.r===goal.r&&cur.c===goal.c)break;for(const[dr,dc]of dirs){const nr=cur.r+dr,nc=cur.c+dc;if(!isPassable(nr,nc))continue;const cost=cur.cost+moveCost(nr,nc);if(cost>maxCost)continue;const k=key(nr,nc);if(!best.has(k)||cost<best.get(k)){best.set(k,cost);parent.set(k,{r:cur.r,c:cur.c});frontier.push({r:nr,c:nc,cost})}}}
 const gk=key(goal.r,goal.c);if(!best.has(gk))return[];const path=[];let cur={...goal};while(cur.r!==start.r||cur.c!==start.c){path.unshift({...cur});cur=parent.get(key(cur.r,cur.c))}return path
}
function refreshReachable(){reachable.clear();if(!selected)return;for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){const p=findPath(seraCell,{r,c},3);if(p.length)reachable.set(key(r,c),p)}}
function setSelected(value){selected=value;panel.classList.toggle('is-hidden',!value);if(value){refreshReachable();status('세라 선택. 푸른 칸을 클릭하면 이동합니다.')}else{reachable.clear();status('선택 해제. 세라를 클릭하면 다시 선택됩니다.')}}
function moveTo(target){const path=reachable.get(key(target.r,target.c));if(!path||animation)return;reachable.clear();animation={path,index:0,from:{...seraCell},started:performance.now(),duration:210};status(`${cellName(seraCell)} → ${cellName(target)} 이동 중…`)}
function cellName(cell){return`${'ABCDEFGH'[cell.c]}${8-cell.r}`}
function currentUnitRender(now){
 if(!animation)return{...cellCenter(seraCell.r,seraCell.c),hop:0,squash:0};const seg=animation,target=seg.path[seg.index],t=Math.min(1,(now-seg.started)/seg.duration),ease=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,a=cellCenter(seg.from.r,seg.from.c),b=cellCenter(target.r,target.c),pos=lerpPoint(a,b,ease),hop=Math.sin(Math.PI*t)*13;
 if(t>=1){seraCell={...target};clack();seg.index++;if(seg.index>=seg.path.length){animation=null;refreshReachable();status(`${cellName(seraCell)} 도착. 세라는 계속 선택된 상태입니다.`)}else{seg.from={...target};seg.started=now}}
 return{...pos,hop,squash:t>.87?Math.sin((t-.87)/.13*Math.PI)*.07:0}
}
function clack(){try{audioCtx||=new(window.AudioContext||window.webkitAudioContext)();const now=audioCtx.currentTime,gain=audioCtx.createGain(),osc=audioCtx.createOscillator();gain.gain.setValueAtTime(.045,now);gain.gain.exponentialRampToValueAtTime(.001,now+.055);osc.type='square';osc.frequency.setValueAtTime(150+Math.random()*25,now);osc.frequency.exponentialRampToValueAtTime(85,now+.055);osc.connect(gain).connect(audioCtx.destination);osc.start(now);osc.stop(now+.06)}catch{}}
function draw(now){pulse=now/1000;ctx.clearRect(0,0,W,H);drawBackdrop();drawBoard();drawUnit(currentUnitRender(now));requestAnimationFrame(draw)}
function drawBackdrop(){
 const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#101711');g.addColorStop(.55,'#0a0f0c');g.addColorStop(1,'#060907');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 const moon=ctx.createRadialGradient(910,90,0,910,90,230);moon.addColorStop(0,'rgba(210,217,197,.15)');moon.addColorStop(.5,'rgba(130,145,128,.045)');moon.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=moon;ctx.fillRect(660,-120,500,430);
 ctx.globalAlpha=.35;ctx.fillStyle='#26342b';for(let i=0;i<12;i++){const x=i*115-70,h=60+(i%4)*22;ctx.beginPath();ctx.moveTo(x,H);ctx.lineTo(x+70,H-h);ctx.lineTo(x+145,H);ctx.fill()}ctx.globalAlpha=1
}
function drawBoard(){
 const outline=[corners.tl,corners.tr,corners.br,corners.bl];ctx.save();ctx.shadowColor='rgba(0,0,0,.6)';ctx.shadowBlur=35;ctx.shadowOffsetY=20;fillPoly(outline,'#141b17');ctx.restore();
 for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){const poly=cellPoly(r,c),type=terrain[r][c];let base=(r+c)%2===0?'#7d876d':'#747e65';if(r<=1)base=mix(base,'#6a3d43',.2);else if(r>=6)base=mix(base,'#356b65',.21);if(type===RIVER||type===BRIDGE)base='#3d8ba8';if(type===FOREST)base='#526b52';if(type===ROCK)base='#62645d';fillPoly(poly,base);strokePoly(poly,'rgba(18,25,21,.76)',1.4);const center=cellCenter(r,c);if(type===RIVER||type===BRIDGE)drawWater(center,c);if(type===FOREST)drawForest(center);if(type===ROCK)drawRock(center);if(type===BRIDGE)drawBridge(poly);const k=key(r,c);if(reachable.has(k)){fillPoly(poly,'rgba(86,205,230,.26)');strokePoly(poly,'rgba(132,229,245,.82)',2)}if(selected&&seraCell.r===r&&seraCell.c===c){fillPoly(poly,'rgba(226,191,104,.16)');strokePoly(poly,'rgba(235,207,128,.9)',2.4)}if(hoverCell&&hoverCell.r===r&&hoverCell.c===c)strokePoly(poly,'rgba(247,230,175,.95)',2.2)}
}
function drawWater(center,c){ctx.save();ctx.globalAlpha=.18;ctx.strokeStyle='#d1f3f4';ctx.lineWidth=1.2;for(let i=-1;i<=1;i++){ctx.beginPath();const y=center.y+i*10+Math.sin(pulse*1.5+c)*2;ctx.moveTo(center.x-27,y);ctx.quadraticCurveTo(center.x,y-3,center.x+27,y);ctx.stroke()}ctx.restore()}
function drawForest(p){drawTree(p.x-11,p.y+2,.9);drawTree(p.x+7,p.y-4,.72);drawTree(p.x+19,p.y+6,.56)}
function drawTree(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#2b4736';ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(-12,6);ctx.lineTo(12,6);ctx.fill();ctx.fillStyle='#355841';ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(-10,11);ctx.lineTo(10,11);ctx.fill();ctx.fillStyle='#42392c';ctx.fillRect(-2,8,4,9);ctx.restore()}
function drawRock(p){const pts=[[-15,7],[-10,-6],[1,-12],[14,-4],[17,8],[6,12],[-8,11]].map(([x,y])=>({x:p.x+x,y:p.y+y}));fillPoly(pts,'#96978e');strokePoly(pts,'#454944',1.4);ctx.fillStyle='rgba(255,255,255,.13)';ctx.beginPath();ctx.moveTo(p.x-8,p.y-4);ctx.lineTo(p.x+1,p.y-9);ctx.lineTo(p.x+8,p.y-4);ctx.fill()}
function mid(a,b){return{x:(a.x+b.x)/2,y:(a.y+b.y)/2}}
function drawBridge(poly){const l=mid(poly[0],poly[3]),r=mid(poly[1],poly[2]);ctx.save();ctx.strokeStyle='#9b7248';ctx.lineWidth=10;ctx.lineCap='butt';for(let i=0;i<6;i++){const a=lerpPoint(l,r,(i+.12)/6),b=lerpPoint(l,r,(i+.86)/6);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}ctx.strokeStyle='rgba(60,41,25,.65)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(l.x,l.y-9);ctx.lineTo(r.x,r.y-9);ctx.stroke();ctx.beginPath();ctx.moveTo(l.x,l.y+9);ctx.lineTo(r.x,r.y+9);ctx.stroke();ctx.restore()}
function drawUnit(unit){
 const{x,y,hop,squash}=unit;ctx.save();const shadowScale=1-hop/55;ctx.globalAlpha=.38;ctx.fillStyle='#050706';ctx.beginPath();ctx.ellipse(x,y+9,31*shadowScale,10*shadowScale,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;if(selected){const alpha=.62+.3*Math.sin(pulse*4);ctx.strokeStyle=`rgba(237,204,112,${alpha})`;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y+7,38,13,0,0,Math.PI*2);ctx.stroke()}if(imageReady){const h=132*(1-squash*.3),ratio=seraImg.width/seraImg.height,w=h*ratio*(1+squash);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(seraImg,x-w/2,y-h-hop+7,w,h)}else{ctx.fillStyle='#eee';ctx.fillRect(x-12,y-68-hop,24,68)}ctx.restore()
}
function pointInPoly(p,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j],hit=(a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x;if(hit)inside=!inside}return inside}
function pointerCell(evt){const rect=canvas.getBoundingClientRect(),p={x:(evt.clientX-rect.left)*W/rect.width,y:(evt.clientY-rect.top)*H/rect.height};for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(pointInPoly(p,cellPoly(r,c)))return{r,c};return null}
canvas.addEventListener('pointermove',e=>{hoverCell=pointerCell(e);canvas.style.cursor=hoverCell?'pointer':'default'});canvas.addEventListener('pointerleave',()=>hoverCell=null);canvas.addEventListener('pointerdown',e=>{if(animation)return;if(audioCtx?.state==='suspended')audioCtx.resume();const cell=pointerCell(e);if(!cell)return;if(!selected){if(cell.r===seraCell.r&&cell.c===seraCell.c)setSelected(true);else status('세라를 먼저 클릭해 선택하세요.');return}if(cell.r===seraCell.r&&cell.c===seraCell.c){status('세라가 선택되어 있습니다. 푸른 칸을 클릭하세요.');return}if(reachable.has(key(cell.r,cell.c)))moveTo(cell);else status('그 칸은 이동력 3 안에서 갈 수 없습니다.')});
regenBtn.addEventListener('click',generateMap);moveBtn.addEventListener('click',()=>{refreshReachable();setAction(moveBtn);status('이동 모드. 푸른 칸을 클릭하세요.')});attackBtn.addEventListener('click',()=>{setAction(attackBtn);showToast('공격 대상 판정은 다음 단계에서 연결합니다.')});skillBtn.addEventListener('click',()=>{setAction(skillBtn);showToast('스킬 「돌파」 효과는 다음 단계에서 연결합니다.')});waitBtn.addEventListener('click',()=>{setAction(waitBtn);setSelected(false)});window.addEventListener('keydown',e=>{if(e.key==='Escape'&&selected)setSelected(false);if((e.key==='r'||e.key==='R')&&!e.repeat)generateMap()});
function setAction(btn){document.querySelectorAll('.action-btn').forEach(b=>b.classList.toggle('active',b===btn))}function status(text){statusText.textContent=text}function showToast(text){toast.textContent=text;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),1600)}function fillPoly(poly,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(poly[0].x,poly[0].y);for(let i=1;i<poly.length;i++)ctx.lineTo(poly[i].x,poly[i].y);ctx.closePath();ctx.fill()}function strokePoly(poly,color,width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(poly[0].x,poly[0].y);for(let i=1;i<poly.length;i++)ctx.lineTo(poly[i].x,poly[i].y);ctx.closePath();ctx.stroke()}function mix(a,b,t){const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16),ar=pa>>16&255,ag=pa>>8&255,ab=pa&255,br=pb>>16&255,bg=pb>>8&255,bb=pb&255,f=x=>Math.round(x).toString(16).padStart(2,'0');return`#${f(ar+(br-ar)*t)}${f(ag+(bg-ag)*t)}${f(ab+(bb-ab)*t)}`}
generateMap();requestAnimationFrame(draw);
