(() => {
  const canvas = document.querySelector('#board');
  const ctx = canvas.getContext('2d');
  const regen = document.querySelector('#regen');

  const N = 8;
  const T = { GROUND:0, RIVER:1, BRIDGE:2, FOREST:3, ROCK:4 };
  const corners = {
    tl:{x:230,y:145}, tr:{x:1045,y:145}, br:{x:1160,y:675}, bl:{x:115,y:675}
  };

  let map = [];
  let riverPath = [];
  let phase = 0;

  const lerp = (a,b,t) => a + (b-a)*t;
  const mix = (a,b,t) => ({x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t)});
  const key = (r,c) => `${r},${c}`;

  function pointAt(gx,gy){
    const u=gx/N,v=gy/N;
    return mix(mix(corners.tl,corners.tr,u),mix(corners.bl,corners.br,u),v);
  }
  function poly(r,c){ return [pointAt(c,r),pointAt(c+1,r),pointAt(c+1,r+1),pointAt(c,r+1)]; }
  function center(r,c){
    const p=poly(r,c);
    return {x:(p[0].x+p[1].x+p[2].x+p[3].x)/4,y:(p[0].y+p[1].y+p[2].y+p[3].y)/4};
  }
  function fill(points,color){
    ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
    for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);
    ctx.closePath();ctx.fillStyle=color;ctx.fill();
  }
  function stroke(points,color,width=1){
    ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
    for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);
    ctx.closePath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
  }
  function shuffle(a){
    const out=[...a];
    for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
    return out;
  }

  // River rule: begin at the left edge, always progress right,
  // and when changing rows first carve a vertical connector in the same column.
  // This guarantees one orthogonally connected river from left to right.
  function carveConnectedRiver(){
    riverPath=[];
    let r=2+Math.floor(Math.random()*4);
    let c=0;
    const used=new Set();
    const add=(rr,cc)=>{
      if(rr<1||rr>N-1||cc<0||cc>=N)return;
      const k=key(rr,cc);
      if(!used.has(k)){ used.add(k); riverPath.push({r:rr,c:cc}); map[rr][cc]=T.RIVER; }
    };
    add(r,c);
    while(c<N-1){
      if(Math.random()<0.48){
        const dirs=shuffle([-1,1]);
        for(const d of dirs){
          const nr=r+d;
          if(nr>=2 && nr<=5){ add(nr,c); r=nr; break; }
        }
      }
      c++;
      add(r,c);
    }
  }

  function addBridges(){
    const byColumn=new Map();
    for(const p of riverPath){
      if(!byColumn.has(p.c))byColumn.set(p.c,[]);
      byColumn.get(p.c).push(p);
    }
    const candidates=[...byColumn.entries()].filter(([c,cells])=>c>0&&c<N-1&&cells.length===1).map(([c])=>c);
    const cols=shuffle(candidates.length>=2?candidates:[1,2,3,4,5,6]).slice(0,2);
    for(const c of cols){
      const cells=byColumn.get(c)||[];
      if(cells.length) map[cells[0].r][c]=T.BRIDGE;
    }
  }

  function addScenery(){
    let open=[];
    for(let r=1;r<N;r++)for(let c=0;c<N;c++)if(map[r][c]===T.GROUND)open.push({r,c});
    open=shuffle(open);
    for(let i=0;i<8&&open.length;i++){const p=open.pop();map[p.r][p.c]=T.FOREST;}
    for(let i=0;i<5&&open.length;i++){const p=open.pop();map[p.r][p.c]=T.ROCK;}
  }

  function generate(){
    map=Array.from({length:N},()=>Array(N).fill(T.GROUND));
    carveConnectedRiver();
    addBridges();
    addScenery();
  }

  function drawBackdrop(){
    const g=ctx.createLinearGradient(0,0,0,canvas.height);
    g.addColorStop(0,'#131b15');g.addColorStop(.55,'#0b110d');g.addColorStop(1,'#070b08');
    ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);
    const glow=ctx.createRadialGradient(970,95,10,970,95,280);
    glow.addColorStop(0,'rgba(235,229,190,.12)');glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=glow;ctx.fillRect(620,-80,660,420);
  }

  function drawTree(x,y,s){
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    ctx.fillStyle='#294d37';
    ctx.beginPath();ctx.moveTo(0,-21);ctx.lineTo(-13,5);ctx.lineTo(13,5);ctx.closePath();ctx.fill();
    ctx.fillStyle='#365c42';
    ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(-11,11);ctx.lineTo(11,11);ctx.closePath();ctx.fill();
    ctx.fillStyle='#493b29';ctx.fillRect(-2,9,4,8);ctx.restore();
  }
  function drawForest(p){ drawTree(p.x-17,p.y+6,.9); drawTree(p.x+3,p.y-2,.72); drawTree(p.x+21,p.y+8,.55); }
  function drawRock(p){
    const pts=[[-18,8],[-13,-5],[-3,-14],[12,-10],[20,4],[14,14],[-8,15]].map(([x,y])=>({x:p.x+x,y:p.y+y}));
    fill(pts,'#aaa99e');stroke(pts,'#4d514b',1.6);
    ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(p.x-8,p.y-4);ctx.lineTo(p.x+4,p.y-9);ctx.stroke();
  }
  function drawWater(p,c){
    ctx.save();ctx.globalAlpha=.28;ctx.strokeStyle='#d9f1f5';ctx.lineWidth=1.3;
    for(let i=-1;i<=1;i++){
      const y=p.y+i*9+Math.sin(phase*1.5+c*.8+i)*1.8;
      ctx.beginPath();ctx.moveTo(p.x-30,y);ctx.quadraticCurveTo(p.x,y-3,p.x+30,y);ctx.stroke();
    }
    ctx.restore();
  }
  function drawBridge(points){
    const a=mix(points[0],points[3],.5), b=mix(points[1],points[2],.5);
    ctx.save();ctx.lineCap='butt';ctx.strokeStyle='#a97949';ctx.lineWidth=10;
    for(let i=0;i<6;i++){
      const p1=mix(a,b,(i+.12)/6),p2=mix(a,b,(i+.86)/6);
      ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();
    }
    ctx.strokeStyle='#684b32';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(a.x,a.y-7);ctx.lineTo(b.x,b.y-7);ctx.moveTo(a.x,a.y+7);ctx.lineTo(b.x,b.y+7);ctx.stroke();ctx.restore();
  }

  function drawBoard(){
    const outline=[corners.tl,corners.tr,corners.br,corners.bl];
    ctx.save();ctx.shadowColor='rgba(0,0,0,.62)';ctx.shadowBlur=38;ctx.shadowOffsetY=25;fill(outline,'#111813');ctx.restore();

    for(let r=0;r<N;r++)for(let c=0;c<N;c++){
      const p=poly(r,c),t=map[r][c];
      let color=(r+c)%2?'#7d8772':'#8b957f';
      if(t===T.RIVER||t===T.BRIDGE)color=(r+c)%2?'#3c8dab':'#4698b6';
      if(t===T.FOREST)color=(r+c)%2?'#4d6a52':'#58765d';
      if(t===T.ROCK)color=(r+c)%2?'#60645d':'#6a6e66';
      fill(p,color);stroke(p,'rgba(22,30,25,.75)',1.6);
      const cp=center(r,c);
      if(t===T.RIVER||t===T.BRIDGE)drawWater(cp,c);
      if(t===T.BRIDGE)drawBridge(p);
      if(t===T.FOREST)drawForest(cp);
      if(t===T.ROCK)drawRock(cp);
    }
    stroke(outline,'rgba(191,199,181,.22)',2);
  }

  function frame(now){
    phase=now/1000;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawBackdrop();
    drawBoard();
    requestAnimationFrame(frame);
  }

  regen.addEventListener('click',generate);
  window.addEventListener('keydown',e=>{ if((e.key==='r'||e.key==='R')&&!e.repeat)generate(); });
  generate();
  requestAnimationFrame(frame);
})();
