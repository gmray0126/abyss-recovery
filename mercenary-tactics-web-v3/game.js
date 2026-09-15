(() => {
  const canvas = document.querySelector('#board');
  const ctx = canvas.getContext('2d');
  const regen = document.querySelector('#regen');
  const heroEl = document.querySelector('.hero-piece');

  const N = 8;
  const T = { GROUND:0, RIVER:1, BRIDGE:2, FOREST:3, ROCK:4 };
  const corners = {
    tl:{x:230,y:145}, tr:{x:1045,y:145}, br:{x:1160,y:675}, bl:{x:115,y:675}
  };

  let map = [];
  let riverPath = [];
  let phase = 0;
  let reachable = new Map();
  let parents = new Map();
  const hero = { r:6, c:3, move:3, selected:false, moving:false };

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
    hero.r=6;
    hero.c=3;
    hero.selected=false;
    hero.moving=false;
    map[hero.r][hero.c]=T.GROUND;
    reachable.clear();
    parents.clear();
    syncHeroToCell();
    updateHeroState();
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

  function drawMovementOverlay(){
    if(!hero.selected || hero.moving) return;

    for(const k of reachable.keys()){
      const [r,c]=k.split(',').map(Number);
      if(r===hero.r && c===hero.c) continue;
      const p=poly(r,c);
      fill(p,'rgba(100,210,235,.26)');
      stroke(p,'rgba(146,232,250,.88)',2.4);
    }

    const current=poly(hero.r,hero.c);
    fill(current,'rgba(235,204,92,.20)');
    stroke(current,'rgba(245,219,117,.92)',2.8);
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
    drawMovementOverlay();
    stroke(outline,'rgba(191,199,181,.22)',2);
  }

  function moveCost(r,c){
    const t=map[r][c];
    if(t===T.RIVER || t===T.ROCK) return Infinity;
    if(t===T.FOREST) return 2;
    return 1;
  }

  function computeReachable(){
    reachable=new Map();
    parents=new Map();
    const startKey=key(hero.r,hero.c);
    reachable.set(startKey,0);
    const queue=[{r:hero.r,c:hero.c,cost:0}];

    while(queue.length){
      queue.sort((a,b)=>a.cost-b.cost);
      const cur=queue.shift();
      if(cur.cost!==reachable.get(key(cur.r,cur.c))) continue;

      for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nr=cur.r+dr,nc=cur.c+dc;
        if(nr<0||nr>=N||nc<0||nc>=N) continue;
        const step=moveCost(nr,nc);
        if(!Number.isFinite(step)) continue;
        const nextCost=cur.cost+step;
        if(nextCost>hero.move) continue;
        const nk=key(nr,nc);
        if(!reachable.has(nk) || nextCost<reachable.get(nk)){
          reachable.set(nk,nextCost);
          parents.set(nk,{r:cur.r,c:cur.c});
          queue.push({r:nr,c:nc,cost:nextCost});
        }
      }
    }
  }

  function buildPath(targetR,targetC){
    const targetKey=key(targetR,targetC);
    if(!reachable.has(targetKey) || (targetR===hero.r&&targetC===hero.c)) return [];
    const path=[];
    let cur={r:targetR,c:targetC};
    while(cur.r!==hero.r || cur.c!==hero.c){
      path.unshift(cur);
      const prev=parents.get(key(cur.r,cur.c));
      if(!prev) return [];
      cur=prev;
    }
    return path;
  }

  function pointInPoly(x,y,points){
    let inside=false;
    for(let i=0,j=points.length-1;i<points.length;j=i++){
      const xi=points[i].x,yi=points[i].y,xj=points[j].x,yj=points[j].y;
      const hit=((yi>y)!==(yj>y)) && (x<(xj-xi)*(y-yi)/((yj-yi)||1e-9)+xi);
      if(hit) inside=!inside;
    }
    return inside;
  }

  function cellAtCanvasPoint(x,y){
    for(let r=N-1;r>=0;r--){
      for(let c=N-1;c>=0;c--){
        if(pointInPoly(x,y,poly(r,c))) return {r,c};
      }
    }
    return null;
  }

  function setHeroVisualPosition(x,y){
    if(!heroEl) return;
    heroEl.style.left=`${x/canvas.width*100}%`;
    heroEl.style.top=`${y/canvas.height*100}%`;
  }

  function syncHeroToCell(){
    const p=center(hero.r,hero.c);
    setHeroVisualPosition(p.x,p.y);
  }

  function updateHeroState(){
    if(!heroEl) return;
    heroEl.classList.toggle('selected',hero.selected);
    heroEl.classList.toggle('moving',hero.moving);
  }

  function animateStep(nextCell){
    return new Promise(resolve=>{
      const from=center(hero.r,hero.c);
      const to=center(nextCell.r,nextCell.c);
      const duration=190;
      const started=performance.now();

      function tick(now){
        const raw=Math.min(1,(now-started)/duration);
        const t=1-Math.pow(1-raw,3);
        const hop=Math.sin(Math.PI*raw)*11;
        setHeroVisualPosition(lerp(from.x,to.x,t),lerp(from.y,to.y,t)-hop);
        if(raw<1){ requestAnimationFrame(tick); return; }
        hero.r=nextCell.r;
        hero.c=nextCell.c;
        syncHeroToCell();
        resolve();
      }
      requestAnimationFrame(tick);
    });
  }

  async function moveHero(path){
    if(!path.length || hero.moving) return;
    hero.moving=true;
    hero.selected=false;
    reachable.clear();
    parents.clear();
    updateHeroState();
    for(const cell of path) await animateStep(cell);
    hero.moving=false;
    updateHeroState();
  }

  function selectHero(){
    if(hero.moving) return;
    hero.selected=true;
    computeReachable();
    updateHeroState();
  }

  function canvasCoordsFromEvent(e){
    const rect=canvas.getBoundingClientRect();
    return {
      x:(e.clientX-rect.left)*(canvas.width/rect.width),
      y:(e.clientY-rect.top)*(canvas.height/rect.height)
    };
  }

  canvas.addEventListener('pointerdown',e=>{
    if(hero.moving) return;
    const p=canvasCoordsFromEvent(e);
    const cell=cellAtCanvasPoint(p.x,p.y);
    if(!cell) return;

    if(cell.r===hero.r && cell.c===hero.c){
      selectHero();
      return;
    }

    if(hero.selected && reachable.has(key(cell.r,cell.c))){
      const path=buildPath(cell.r,cell.c);
      moveHero(path);
    }
  });

  regen.addEventListener('click',generate);
  window.addEventListener('keydown',e=>{
    if((e.key==='r'||e.key==='R')&&!e.repeat) generate();
    if(e.key==='Escape'&&!hero.moving){
      hero.selected=false;
      reachable.clear();
      parents.clear();
      updateHeroState();
    }
  });

  function frame(now){
    phase=now/1000;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawBackdrop();
    drawBoard();
    requestAnimationFrame(frame);
  }

  generate();
  requestAnimationFrame(frame);
})();
