const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const statusText = document.querySelector('#statusText');
const regenBtn = document.querySelector('#regenBtn');
const waitBtn = document.querySelector('#waitBtn');

const SIZE = 8;
const PLAIN = 0;
const RIVER = 1;
const BRIDGE = 2;
const FOREST = 3;
const ROCK = 4;

const corners = {
  tl: { x: 155, y: 125 },
  tr: { x: 1045, y: 125 },
  br: { x: 1150, y: 690 },
  bl: { x: 50, y: 690 },
};

let terrain = [];
let unit = { r: 7, c: 3 };
let selected = false;
let reachable = new Map();
let hover = null;
let anim = null;
let pulse = 0;
let audioCtx = null;

const lerp = (a, b, t) => a + (b - a) * t;
const mixPoint = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
const key = (r, c) => `${r},${c}`;
const inBounds = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

function pointAt(gx, gy) {
  const u = gx / SIZE;
  const v = gy / SIZE;
  const top = mixPoint(corners.tl, corners.tr, u);
  const bottom = mixPoint(corners.bl, corners.br, u);
  return mixPoint(top, bottom, v);
}

function cellPoly(r, c) {
  return [pointAt(c, r), pointAt(c + 1, r), pointAt(c + 1, r + 1), pointAt(c, r + 1)];
}

function cellCenter(r, c) {
  const p = cellPoly(r, c);
  return {
    x: (p[0].x + p[1].x + p[2].x + p[3].x) / 4,
    y: (p[0].y + p[1].y + p[2].y + p[3].y) / 4,
  };
}

function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function generateMap() {
  terrain = Array.from({ length: SIZE }, () => Array(SIZE).fill(PLAIN));

  let row = rand(2, 5);
  const riverCells = [];
  for (let c = 0; c < SIZE; c++) {
    terrain[row][c] = RIVER;
    riverCells.push({ r: row, c });
    if (c < SIZE - 1) {
      const roll = Math.random();
      let next = row;
      if (roll < 0.28) next = Math.max(2, row - 1);
      else if (roll > 0.72) next = Math.min(5, row + 1);
      if (next !== row) {
        terrain[next][c] = RIVER;
        riverCells.push({ r: next, c });
      }
      row = next;
    }
  }

  const bridgeCols = shuffle([1, 2, 3, 4, 5, 6]).slice(0, 2);
  for (const c of bridgeCols) {
    for (let r = 2; r <= 5; r++) {
      if (terrain[r][c] === RIVER) terrain[r][c] = BRIDGE;
    }
  }

  let open = [];
  for (let r = 2; r <= 5; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (terrain[r][c] === PLAIN) open.push({ r, c });
    }
  }
  open = shuffle(open);
  for (let i = 0; i < 7 && open.length; i++) {
    const p = open.pop();
    terrain[p.r][p.c] = FOREST;
  }
  for (let i = 0; i < 4 && open.length; i++) {
    const p = open.pop();
    terrain[p.r][p.c] = ROCK;
  }

  unit = { r: 7, c: 3 };
  selected = false;
  reachable.clear();
  anim = null;
  setStatus('가운데 세라 말을 클릭해서 시작하세요.');
}

function passable(r, c) {
  return inBounds(r, c) && terrain[r][c] !== RIVER && terrain[r][c] !== ROCK;
}

function moveCost(r, c) {
  return terrain[r][c] === FOREST ? 2 : 1;
}

function findPath(start, goal, maxCost = 3) {
  if (!passable(goal.r, goal.c)) return [];
  if (start.r === goal.r && start.c === goal.c) return [];

  const frontier = [{ ...start, cost: 0 }];
  const best = new Map([[key(start.r, start.c), 0]]);
  const parent = new Map();
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

  while (frontier.length) {
    frontier.sort((a, b) => a.cost - b.cost);
    const cur = frontier.shift();
    if (cur.r === goal.r && cur.c === goal.c) break;

    for (const [dr, dc] of dirs) {
      const nr = cur.r + dr;
      const nc = cur.c + dc;
      if (!passable(nr, nc)) continue;
      const nextCost = cur.cost + moveCost(nr, nc);
      if (nextCost > maxCost) continue;
      const k = key(nr, nc);
      if (!best.has(k) || nextCost < best.get(k)) {
        best.set(k, nextCost);
        parent.set(k, { r: cur.r, c: cur.c });
        frontier.push({ r: nr, c: nc, cost: nextCost });
      }
    }
  }

  const goalKey = key(goal.r, goal.c);
  if (!best.has(goalKey)) return [];

  const path = [];
  let cur = { ...goal };
  while (cur.r !== start.r || cur.c !== start.c) {
    path.unshift({ ...cur });
    cur = parent.get(key(cur.r, cur.c));
  }
  return path;
}

function refreshReachable() {
  reachable.clear();
  if (!selected) return;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const path = findPath(unit, { r, c }, 3);
      if (path.length) reachable.set(key(r, c), path);
    }
  }
}

function selectUnit(value) {
  selected = value;
  if (selected) {
    refreshReachable();
    setStatus('세라 선택됨 · 푸른 칸을 클릭하면 이동합니다.');
  } else {
    reachable.clear();
    setStatus('선택 해제 · 세라 말을 클릭하세요.');
  }
}

function moveUnit(target) {
  const path = reachable.get(key(target.r, target.c));
  if (!path || anim) return;
  reachable.clear();
  anim = {
    path,
    index: 0,
    from: { ...unit },
    started: performance.now(),
    duration: 180,
  };
  setStatus(`${cellName(unit)} → ${cellName(target)} 이동 중…`);
}

function cellName(cell) {
  return `${'ABCDEFGH'[cell.c]}${8 - cell.r}`;
}

function currentUnit(now) {
  if (!anim) {
    const p = cellCenter(unit.r, unit.c);
    return { x: p.x, y: p.y, hop: 0, squash: 0 };
  }

  const target = anim.path[anim.index];
  const raw = Math.min(1, (now - anim.started) / anim.duration);
  const t = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
  const a = cellCenter(anim.from.r, anim.from.c);
  const b = cellCenter(target.r, target.c);
  const pos = mixPoint(a, b, t);
  const hop = Math.sin(Math.PI * raw) * 12;
  const squash = raw > 0.84 ? Math.sin(((raw - 0.84) / 0.16) * Math.PI) * 0.08 : 0;

  if (raw >= 1) {
    unit = { ...target };
    clack();
    anim.index++;
    if (anim.index >= anim.path.length) {
      anim = null;
      refreshReachable();
      setStatus(`${cellName(unit)} 도착 · 계속 선택된 상태입니다.`);
    } else {
      anim.from = { ...target };
      anim.started = now;
    }
  }

  return { x: pos.x, y: pos.y, hop, squash };
}

function setStatus(text) {
  statusText.textContent = text;
}

function clack() {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    const gain = audioCtx.createGain();
    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180 + Math.random() * 28, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.055);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.065);
  } catch {}
}

function fillPoly(points, color) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function strokePoly(points, color, width = 1) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawBackdrop() {
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, '#111813');
  g.addColorStop(0.55, '#0a0f0c');
  g.addColorStop(1, '#060906');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const glow = ctx.createRadialGradient(910, 70, 0, 910, 70, 250);
  glow.addColorStop(0, 'rgba(220,225,205,.13)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(620, -100, 580, 430);
}

function drawBoard() {
  const outline = [corners.tl, corners.tr, corners.br, corners.bl];
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.58)';
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 22;
  fillPoly(outline, '#151c18');
  ctx.restore();

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const poly = cellPoly(r, c);
      const type = terrain[r][c];
      let color = (r + c) % 2 ? '#79836d' : '#858d78';
      if (r <= 1) color = (r + c) % 2 ? '#7b7968' : '#878573';
      if (r >= 6) color = (r + c) % 2 ? '#718272' : '#7d8c7c';
      if (type === RIVER || type === BRIDGE) color = '#3f94b0';
      if (type === FOREST) color = '#526e57';
      if (type === ROCK) color = '#64675f';

      fillPoly(poly, color);
      strokePoly(poly, 'rgba(20,28,23,.78)', 1.5);

      const center = cellCenter(r, c);
      if (type === RIVER || type === BRIDGE) drawWater(center, c);
      if (type === BRIDGE) drawBridge(poly);
      if (type === FOREST) drawForest(center);
      if (type === ROCK) drawRock(center);

      if (reachable.has(key(r, c))) {
        fillPoly(poly, 'rgba(81,215,235,.27)');
        strokePoly(poly, 'rgba(137,234,246,.92)', 2.1);
      }

      if (selected && unit.r === r && unit.c === c) {
        fillPoly(poly, 'rgba(224,190,94,.18)');
        strokePoly(poly, 'rgba(244,214,118,.95)', 2.3);
      }

      if (hover && hover.r === r && hover.c === c) {
        strokePoly(poly, 'rgba(255,239,182,.98)', 2.4);
      }
    }
  }
}

function drawWater(p, seed) {
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = '#d7f4f7';
  ctx.lineWidth = 1.2;
  for (let i = -1; i <= 1; i++) {
    const y = p.y + i * 10 + Math.sin(pulse * 1.5 + seed) * 2;
    ctx.beginPath();
    ctx.moveTo(p.x - 26, y);
    ctx.quadraticCurveTo(p.x, y - 3, p.x + 26, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBridge(poly) {
  const left = { x: (poly[0].x + poly[3].x) / 2, y: (poly[0].y + poly[3].y) / 2 };
  const right = { x: (poly[1].x + poly[2].x) / 2, y: (poly[1].y + poly[2].y) / 2 };
  ctx.save();
  ctx.strokeStyle = '#9b7148';
  ctx.lineWidth = 9;
  for (let i = 0; i < 6; i++) {
    const a = mixPoint(left, right, (i + 0.12) / 6);
    const b = mixPoint(left, right, (i + 0.84) / 6);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTree(x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#294936';
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(-12, 8);
  ctx.lineTo(12, 8);
  ctx.fill();
  ctx.fillStyle = '#3a6045';
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(-10, 12);
  ctx.lineTo(10, 12);
  ctx.fill();
  ctx.fillStyle = '#4a3d2b';
  ctx.fillRect(-2, 9, 4, 9);
  ctx.restore();
}

function drawForest(p) {
  drawTree(p.x - 13, p.y + 3, 0.86);
  drawTree(p.x + 5, p.y - 4, 0.72);
  drawTree(p.x + 19, p.y + 7, 0.55);
}

function drawRock(p) {
  const pts = [[-15,7],[-10,-6],[1,-12],[14,-4],[17,8],[6,12],[-8,11]]
    .map(([x, y]) => ({ x: p.x + x, y: p.y + y }));
  fillPoly(pts, '#a3a49b');
  strokePoly(pts, '#4a4e48', 1.4);
}

function drawUnit(u) {
  const { x, y, hop, squash } = u;
  ctx.save();

  const shadowScale = 1 - hop / 58;
  ctx.fillStyle = 'rgba(0,0,0,.42)';
  ctx.beginPath();
  ctx.ellipse(x, y + 10, 34 * shadowScale, 11 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  if (selected) {
    const a = 0.64 + Math.sin(pulse * 4) * 0.2;
    ctx.strokeStyle = `rgba(246,211,104,${a})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y + 7, 42, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.translate(x, y - hop - 8);
  ctx.scale(1 + squash, 1 - squash * 0.55);

  ctx.fillStyle = '#f0edf0';
  ctx.strokeStyle = '#2a2b30';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -54, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#d9d2dc';
  ctx.beginPath();
  ctx.moveTo(-18, -59);
  ctx.quadraticCurveTo(-28, -80, -5, -81);
  ctx.quadraticCurveTo(10, -82, 20, -61);
  ctx.quadraticCurveTo(6, -72, -2, -66);
  ctx.quadraticCurveTo(-10, -75, -18, -59);
  ctx.fill();

  ctx.fillStyle = '#202329';
  ctx.beginPath();
  ctx.moveTo(-20, -39);
  ctx.lineTo(20, -39);
  ctx.lineTo(30, 4);
  ctx.lineTo(0, 18);
  ctx.lineTo(-30, 4);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#c5a95d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-8, -35);
  ctx.lineTo(4, 6);
  ctx.stroke();

  ctx.strokeStyle = '#e7e7e7';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(17, -30);
  ctx.lineTo(37, 18);
  ctx.stroke();
  ctx.strokeStyle = '#666a70';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(17, -30);
  ctx.lineTo(37, 18);
  ctx.stroke();

  ctx.fillStyle = '#f4bfc5';
  ctx.beginPath();
  ctx.arc(-6, -55, 2.5, 0, Math.PI * 2);
  ctx.arc(6, -55, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function pointInPoly(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    const hit = ((a.y > p.y) !== (b.y > p.y)) &&
      (p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x);
    if (hit) inside = !inside;
  }
  return inside;
}

function pointerCell(evt) {
  const rect = canvas.getBoundingClientRect();
  const p = {
    x: (evt.clientX - rect.left) * canvas.width / rect.width,
    y: (evt.clientY - rect.top) * canvas.height / rect.height,
  };
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (pointInPoly(p, cellPoly(r, c))) return { r, c };
    }
  }
  return null;
}

canvas.addEventListener('pointermove', (e) => {
  hover = pointerCell(e);
  canvas.style.cursor = hover ? 'pointer' : 'default';
});

canvas.addEventListener('pointerleave', () => {
  hover = null;
});

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (anim) return;
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  const cell = pointerCell(e);
  if (!cell) return;

  if (!selected) {
    if (cell.r === unit.r && cell.c === unit.c) selectUnit(true);
    else setStatus('세라 말을 먼저 클릭하세요.');
    return;
  }

  if (cell.r === unit.r && cell.c === unit.c) {
    setStatus('세라가 선택되어 있습니다 · 푸른 칸을 클릭하세요.');
    return;
  }

  if (reachable.has(key(cell.r, cell.c))) moveUnit(cell);
  else setStatus('그 칸은 이동력 3 안에서 갈 수 없습니다.');
});

regenBtn.addEventListener('click', generateMap);
waitBtn.addEventListener('click', () => selectUnit(false));

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') selectUnit(false);
  if ((e.key === 'r' || e.key === 'R') && !e.repeat) generateMap();
});

function frame(now) {
  pulse = now / 1000;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackdrop();
  drawBoard();
  drawUnit(currentUnit(now));
  requestAnimationFrame(frame);
}

generateMap();
requestAnimationFrame(frame);
