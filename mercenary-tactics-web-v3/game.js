(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const statusText = document.getElementById('statusText');
  const regenBtn = document.getElementById('regenBtn');
  const waitBtn = document.getElementById('waitBtn');
  const moveBtn = document.getElementById('moveBtn');
  const boardImg = new Image();
  boardImg.src = './assets/sera_board.webp?v=sera-art-1';

  const COLS = 8;
  const ROWS = 8;
  const tileW = 112;
  const tileH = 64;
  const originX = 130;
  const originY = 130;

  const terrainColors = {
    plain: '#8f9278',
    forest: '#76886b',
    rock: '#6c6c65',
    river: '#4297c5',
    bridge: '#4790bb'
  };

  let unit = { col: 4, row: 6, move: 3, selected: true, moving: false, px: 0, py: 0, tx: 0, ty: 0 };
  let hoverCell = null;
  let reachable = new Set();
  let parents = new Map();
  let grid = [];

  function key(c, r) { return `${c},${r}`; }
  function inBounds(c, r) { return c >= 0 && c < COLS && r >= 0 && r < ROWS; }
  function tileTopLeft(c, r) { return { x: originX + c * tileW * 0.9, y: originY + r * tileH * 0.82 }; }
  function tileCenter(c, r) { const p = tileTopLeft(c, r); return { x: p.x + tileW / 2, y: p.y + tileH / 2 }; }
  function tilePolygon(c, r) {
    const p = tileTopLeft(c, r); return [
      { x: p.x, y: p.y + 8 },
      { x: p.x + tileW - 4, y: p.y },
      { x: p.x + tileW, y: p.y + tileH - 12 },
      { x: p.x + 8, y: p.y + tileH }
    ];
  }
  function pointInPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y;
      const xj = poly[j].x, yj = poly[j].y;
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
  function findCellAt(x, y) {
    for (let r = ROWS - 1; r >= 0; r--) {
      for (let c = COLS - 1; c >= 0; c--) {
        if (pointInPoly(x, y, tilePolygon(c, r))) return { col: c, row: r };
      }
    }
    return null;
  }

  function makeGrid() {
    grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 'plain'));
    let riverRow = 2 + Math.floor(Math.random() * 2);
    for (let c = 0; c < COLS; c++) {
      if (Math.random() < 0.33 && c > 0 && c < COLS - 1) riverRow += Math.random() < 0.5 ? -1 : 1;
      riverRow = Math.max(2, Math.min(4, riverRow));
      grid[riverRow][c] = 'river';
      if (Math.random() < 0.35 && riverRow + 1 < ROWS) grid[riverRow + 1][c] = 'river';
    }
    const bridgeCols = [1 + Math.floor(Math.random() * 2), 4 + Math.floor(Math.random() * 2)];
    for (const c of bridgeCols) {
      for (let r = 0; r < ROWS; r++) if (grid[r][c] === 'river') grid[r][c] = 'bridge';
    }
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] !== 'plain') continue;
        const n = Math.random();
        if (n < 0.12) grid[r][c] = 'forest';
        else if (n < 0.18) grid[r][c] = 'rock';
      }
    }
    unit.col = 4; unit.row = 6; unit.selected = true; unit.moving = false;
    const ctr = tileCenter(unit.col, unit.row); unit.px = ctr.x; unit.py = ctr.y;
    computeReachable();
  }

  function moveCost(type) {
    if (type === 'river' || type === 'rock') return Infinity;
    if (type === 'forest') return 2;
    return 1;
  }

  function computeReachable() {
    reachable = new Set([key(unit.col, unit.row)]);
    parents = new Map();
    const costs = new Map([[key(unit.col, unit.row), 0]]);
    const queue = [{ c: unit.col, r: unit.row, cost: 0 }];
    while (queue.length) {
      queue.sort((a, b) => a.cost - b.cost);
      const cur = queue.shift();
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      for (const [dc, dr] of dirs) {
        const nc = cur.c + dc, nr = cur.r + dr;
        if (!inBounds(nc, nr)) continue;
        const cost = moveCost(grid[nr][nc]);
        if (!Number.isFinite(cost)) continue;
        const next = cur.cost + cost;
        const nk = key(nc, nr);
        if (next > unit.move) continue;
        if (!costs.has(nk) || next < costs.get(nk)) {
          costs.set(nk, next);
          reachable.add(nk);
          parents.set(nk, key(cur.c, cur.r));
          queue.push({ c: nc, r: nr, cost: next });
        }
      }
    }
  }

  function reconstructPath(destC, destR) {
    const path = [];
    let current = key(destC, destR);
    if (!reachable.has(current)) return path;
    while (current !== key(unit.col, unit.row)) {
      const [c, r] = current.split(',').map(Number);
      path.unshift({ c, r });
      current = parents.get(current);
      if (!current) break;
    }
    return path;
  }

  function animateMove(path) {
    if (!path.length) return;
    unit.moving = true;
    let step = 0;
    function nextStep() {
      if (step >= path.length) {
        unit.moving = false;
        computeReachable();
        statusText.textContent = '세라가 이동했습니다. 다른 칸도 테스트해보세요.';
        draw();
        return;
      }
      const target = path[step];
      const start = tileCenter(unit.col, unit.row);
      const end = tileCenter(target.c, target.r);
      const duration = 220;
      const startTime = performance.now();
      function frame(now) {
        const t = Math.min(1, (now - startTime) / duration);
        const ease = 1 - Math.pow(1 - t, 3);
        unit.px = start.x + (end.x - start.x) * ease;
        unit.py = start.y + (end.y - start.y) * ease - Math.sin(ease * Math.PI) * 12;
        draw();
        if (t < 1) requestAnimationFrame(frame);
        else {
          unit.col = target.c; unit.row = target.r;
          unit.px = end.x; unit.py = end.y;
          step += 1; nextStep();
        }
      }
      requestAnimationFrame(frame);
    }
    nextStep();
  }

  function drawTile(c, r) {
    const poly = tilePolygon(c, r);
    const type = grid[r][c];
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    ctx.fillStyle = terrainColors[type];
    ctx.fill();
    ctx.strokeStyle = 'rgba(24,34,30,0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (type === 'river') {
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const p = tileTopLeft(c, r);
        ctx.moveTo(p.x + 22, p.y + 20 + i * 7);
        ctx.quadraticCurveTo(p.x + 48, p.y + 16 + i * 7, p.x + 74, p.y + 20 + i * 7);
        ctx.stroke();
      }
    }
    if (type === 'bridge') {
      const p = tileTopLeft(c, r);
      ctx.fillStyle = '#a97a46';
      ctx.fillRect(p.x + 18, p.y + 22, tileW - 34, 12);
      ctx.fillStyle = '#87704f';
      for (let i = 0; i < 6; i++) ctx.fillRect(p.x + 22 + i * 13, p.y + 21, 8, 14);
    }
    if (type === 'forest') {
      const p = tileTopLeft(c, r);
      ctx.fillStyle = '#395842';
      const trees = [[30,40],[46,28],[61,38]];
      trees.forEach(([dx, dy]) => {
        ctx.beginPath(); ctx.moveTo(p.x+dx, p.y+dy-18); ctx.lineTo(p.x+dx-10, p.y+dy+2); ctx.lineTo(p.x+dx+10, p.y+dy+2); ctx.closePath(); ctx.fill();
        ctx.fillRect(p.x+dx-1.5, p.y+dy+2, 3, 8);
      });
    }
    if (type === 'rock') {
      const p = tileTopLeft(c, r);
      ctx.fillStyle = '#c1c5ba';
      ctx.beginPath();
      ctx.moveTo(p.x + 42, p.y + 40); ctx.lineTo(p.x + 53, p.y + 28); ctx.lineTo(p.x + 68, p.y + 31); ctx.lineTo(p.x + 75, p.y + 44); ctx.lineTo(p.x + 66, p.y + 52); ctx.lineTo(p.x + 47, p.y + 50); ctx.closePath();
      ctx.fill();
    }
    const k = key(c, r);
    if (unit.selected && reachable.has(k) && k !== key(unit.col, unit.row)) {
      ctx.fillStyle = 'rgba(139, 238, 255, 0.22)';
      ctx.beginPath(); ctx.moveTo(poly[0].x, poly[0].y); for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(132, 230, 255, 0.8)'; ctx.lineWidth = 2; ctx.stroke();
    }
    if (hoverCell && hoverCell.col === c && hoverCell.row === r) {
      ctx.strokeStyle = 'rgba(246, 224, 145, 0.92)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  }

  function drawUnit() {
    const x = unit.px || tileCenter(unit.col, unit.row).x;
    const y = unit.py || tileCenter(unit.col, unit.row).y;
    ctx.beginPath();
    ctx.ellipse(x, y + 20, 28, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(203,179,109,0.65)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(226, 203, 112, 0.8)';
    ctx.stroke();

    if (boardImg.complete && boardImg.naturalWidth > 0) {
      const h = 152;
      const w = h * (boardImg.naturalWidth / boardImg.naturalHeight);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(boardImg, x - w / 2, y - h + 12, w, h);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 22, y - 52, 44, 52);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) drawTile(c, r);
    drawUnit();
  }

  function onPointer(ev) {
    const rect = canvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
    const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
    const cell = findCellAt(x, y);
    hoverCell = cell;
    if (!cell || unit.moving) { draw(); return; }
    if (ev.type === 'pointerdown') {
      const center = tileCenter(unit.col, unit.row);
      const dist = Math.hypot(x - center.x, y - center.y);
      if (dist < 60) {
        unit.selected = true;
        computeReachable();
        statusText.textContent = '이동할 칸을 선택하세요.';
      } else if (unit.selected && reachable.has(key(cell.col, cell.row))) {
        const path = reconstructPath(cell.col, cell.row);
        statusText.textContent = '세라가 이동 중입니다.';
        animateMove(path);
      }
    }
    draw();
  }

  canvas.addEventListener('pointermove', onPointer);
  canvas.addEventListener('pointerdown', onPointer);
  regenBtn.addEventListener('click', () => { makeGrid(); statusText.textContent = '전장을 다시 생성했습니다.'; draw(); });
  waitBtn.addEventListener('click', () => { unit.selected = false; reachable.clear(); statusText.textContent = '선택을 해제했습니다.'; draw(); });
  moveBtn.addEventListener('click', () => { unit.selected = true; computeReachable(); statusText.textContent = '이동할 칸을 선택하세요.'; draw(); });
  window.addEventListener('keydown', (ev) => {
    if (ev.key.toLowerCase() === 'r') { makeGrid(); statusText.textContent = '전장을 다시 생성했습니다.'; draw(); }
    if (ev.key === 'Escape') { unit.selected = false; reachable.clear(); statusText.textContent = '선택을 해제했습니다.'; draw(); }
  });

  boardImg.onload = () => draw();
  makeGrid();
  draw();
})();
