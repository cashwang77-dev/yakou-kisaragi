'use strict';
/* 夜校・如月　試玩版（序章～第二章）
   斜角像素渲染＋光照、鬼怪視線/聽覺 AI、躲藏、反擊、劇情腳本、Web Audio 合成音效。 */

const TW = 32, TH = 16, WALLH = 34;
let VW = 640, VH = 360;  // 手機縮小內部解析度（＝放大畫面與文字），平板直向會拉高
const $ = s => document.querySelector(s);
const cvs = $('#c'), ctx = cvs.getContext('2d');
ctx.imageSmoothingEnabled = false;
const Q = new URLSearchParams(location.search);
const TEST = Q.get('test');
const SAVE_KEY = 'yakou_kisaragi_v1';

/* ---------- 亂數 ---------- */
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(444);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const dist = (a, b, c, d) => Math.hypot(a - c, b - d);

/* ---------- 素材 ---------- */
const IMG = {};
function loadImages(list) {
  return Promise.all(list.map(n => new Promise(res => { const i = new Image(); i.onload = () => { IMG[n] = i; res(); }; i.onerror = res; i.src = 'assets/' + n + '.png'; })));
}

/* ---------- 地圖 ---------- */
const W = 40, H = 40;
const T = new Array(W * H).fill('X');
const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 'X' : T[y * W + x];
const put = (x, y, c) => { T[y * W + x] = c; };
const fill = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, c); };

const DOORS = {};
function door(x, y, o) { put(x, y, 'D'); DOORS[x + ',' + y] = Object.assign({ x, y, locked: false }, o); }
const INDOOR = new Set(['_', ':', 'D']);
const isInside = (x, y) => { const c = at(Math.floor(x), Math.floor(y)); return c === '_' || c === ':'; };
const OBJ = [], OBJAT = {}, LIGHTS = [], ITEMS = [];
const HIDE = { bush: '躲進草叢', trash: '躲進垃圾桶', box: '躲進器材箱', bleach: '躲到看台下', desk: '躲到桌子底下', tdesk: '躲到講台下', locker: '躲進置物櫃', bed: '躲到床簾後', shelf: '擠進書架縫隙', cabinet: '躲進掃除用具櫃' };
function obj(t, x, y, o) { const b = Object.assign({ t, x, y, solid: true }, o); OBJ.push(b); return b; }
function item(id, x, y, name) { ITEMS.push({ id, x: x + .5, y: y + .5, name, taken: false }); }
let STATUE = {}, LAMPS = [];
/* 場景：每章一張 40x40 地圖。loadScene 清空後重建地圖、物件、光源、道具、巡邏路線，並重畫地板 */
const SCENES = { 1: buildCh1 };
function resetMap() { T.fill('X'); for (const k in DOORS) delete DOORS[k]; for (const k in OBJAT) delete OBJAT[k]; OBJ.length = LIGHTS.length = ITEMS.length = 0; }
function indexObjs() { OBJ.forEach(o => { OBJAT[o.x + ',' + o.y] = o; }); if (Object.keys(OBJAT).length !== OBJ.length) console.warn('物件重疊'); }
function loadScene(n) { resetMap(); G.scene = n; SCENES[n](); indexObjs(); PATROL.splice(0, PATROL.length, ...SCENE_PATROL[n]); if (IMG.floors) buildFloor(); }

/* 第一章：校園（主校舍 y1-12、操場、前庭、器材小屋、警衛室） */
function buildCh1() {
// 主校舍：y1 外牆、y2-7 教室、y8 走廊牆、y9-11 走廊、y12 正面外牆
fill(1, 1, 38, 12, '#');
fill(2, 2, 11, 7, '_'); fill(13, 2, 21, 7, '_'); fill(23, 2, 31, 7, '_'); fill(33, 2, 37, 7, '_');
fill(2, 9, 37, 11, ':');
// 戶外
fill(1, 13, 38, 14, '=');
fill(1, 15, 16, 36, ',');
fill(18, 15, 38, 36, '.');
fill(17, 15, 17, 36, 'f'); put(17, 25, '.'); put(17, 26, '.');
fill(27, 15, 28, 36, '=');
fill(0, 13, 0, 37, 'f'); fill(39, 13, 39, 37, 'f'); fill(0, 37, 39, 37, 'f');
fill(26, 37, 29, 37, '='); put(25, 37, 'P'); put(30, 37, 'P');
fill(18, 38, 38, 39, 'r');
// 器材小屋、警衛室
fill(3, 32, 7, 35, '#'); fill(4, 33, 6, 34, '_');
fill(31, 32, 34, 35, '#'); fill(32, 33, 33, 34, '_');

door(4, 8, { locked: true, sign: '1-A', msg: '一年A班。門鎖著。' });
door(10, 8, { locked: true, msg: '一年A班。門鎖著。' });
door(14, 8, { sign: '2-B' }); door(20, 8, {});
door(24, 8, { locked: true, sign: '2-A', msg: '二年A班。門從裡面卡住了……裡面好像有什麼在呼吸。' });
door(30, 8, { locked: true, msg: '二年A班。門鎖著。' });
door(35, 8, { locked: true, sign: '倉庫', msg: '倉庫。門鎖著。' });
door(8, 12, { locked: true, key: 'sidekey', msg: '側門鎖著。' });
door(27, 12, { locked: true, chain: true, msg: 'chain' }); door(28, 12, { locked: true, chain: true, msg: 'chain' });
door(5, 32, {}); door(31, 33, {});

/* 物件 */
[[20, 18], [23, 24], [35, 18], [37, 24], [21, 32], [37, 31], [19, 21], [33, 25]].forEach(p => obj('tree', p[0], p[1]));
[[24, 20], [33, 22], [19, 28], [36, 27], [22, 35], [12, 35]].forEach(p => obj('bush', p[0], p[1]));
LAMPS = [[26, 19], [29, 26], [26, 33], [8, 16], [15, 32], [3, 24]];
LAMPS.forEach(p => obj('lamp', p[0], p[1]));
obj('vend', 15, 15, { act: 'vend' }); obj('vend', 16, 15, { act: 'vend' });
for (let y = 18; y <= 30; y++) if (y !== 24) { obj('bleach', 1, y); obj('bleach', 2, y, { hideOnly: true }); }
[[10, 21], [14, 29], [6, 26]].forEach(p => obj('box', p[0], p[1]));
obj('box', 6, 34, { act: 'keybox', hide: false });
[[24, 15], [31, 15], [13, 13]].forEach(p => obj('trash', p[0], p[1]));
STATUE = obj('statue', 32, 17, { act: 'statue' });
for (let x = 33; x <= 37; x++) obj('bike', x, 29);
obj('board', 30, 14, { act: 'board' });
obj('fount', 34, 20, { act: 'fount' });
obj('bench', 21, 16); obj('bench', 36, 33, { v: 1 });
obj('gdesk', 33, 33, { act: 'log' });
// 教室（2-B 與其他班的桌子）
for (const [x0, x1] of [[2, 11], [13, 21], [23, 31]]) {
  for (let x = x0 + 1; x <= x1 - 1; x += 2) for (const y of [4, 6]) obj('desk', x, y, x0 === 13 && x === 18 && y === 6 ? { mine: true } : {});
  obj('tdesk', Math.floor((x0 + x1) / 2), 2);
}
for (const x of [16, 17, 18]) obj('locker', x, 7);
for (const x of [5, 6, 15, 16]) obj('locker', x, 11);
for (const x of [23, 24, 25, 30, 31, 32]) obj('shoe', x, 11, { act: 'shoe' });

/* 光源 */
LAMPS.forEach(([x, y], i) => LIGHTS.push({ x: x + .5, y: y + .5, r: 3.8, c: '255,190,120', fl: i === 3 }));
LIGHTS.push({ x: 15.5, y: 15.9, r: 2.4, c: '170,210,255' }, { x: 16.5, y: 15.9, r: 2.4, c: '170,210,255' });
LIGHTS.push({ x: 32.8, y: 33.8, r: 2.4, c: '255,200,140', id: 'guard' });
LIGHTS.push({ x: 2.6, y: 10.4, r: 1.7, c: '90,255,140' }, { x: 37.4, y: 10.4, r: 1.7, c: '90,255,140' });

/* 地上物品 */
item('flashlight', 32, 34, '手電筒');
item('bandage', 33, 34, '繃帶');
item('broom', 32, 30, '掃把');
item('lid', 22, 15, '垃圾桶蓋');
item('can', 29, 23, '空罐');
item('can', 11, 17, '空罐');
item('can', 9, 10, '空罐');
item('phone', 18, 6, '手機');
}
buildCh1(); indexObjs();   // 開機先建第一章（這時 G 還沒建立，不能呼叫 loadScene）

/* 碰撞 */
function solidTile(x, y) {
  const c = at(x, y);
  if (c === 'X' || c === '#' || c === 'P' || c === 'f') return true;
  if (c === 'D') return DOORS[x + ',' + y].locked;
  const o = OBJAT[x + ',' + y];
  return !!(o && o.solid && !(o.t === 'statue' && o.gone));
}
function opaqueTile(x, y) {
  const c = at(x, y);
  if (c === '#' || c === 'P') return true;
  if (c === 'D') return DOORS[x + ',' + y].locked;
  const o = OBJAT[x + ',' + y];
  return !!(o && (o.t === 'locker' || o.t === 'shoe' || o.t === 'vend'));
}
function hitAt(x, y, r) {
  return solidTile(Math.floor(x - r), Math.floor(y - r)) || solidTile(Math.floor(x + r), Math.floor(y - r)) ||
    solidTile(Math.floor(x - r), Math.floor(y + r)) || solidTile(Math.floor(x + r), Math.floor(y + r));
}
function moveEnt(e, dx, dy) {
  const r = e.r || .27;
  if (!hitAt(e.x + dx, e.y, r)) e.x += dx;
  if (!hitAt(e.x, e.y + dy, r)) e.y += dy;
}
function los(x0, y0, x1, y1) {
  const d = dist(x0, y0, x1, y1), n = Math.ceil(d / .2);
  for (let i = 1; i < n; i++) { const t = i / n; if (opaqueTile(Math.floor(x0 + (x1 - x0) * t), Math.floor(y0 + (y1 - y0) * t))) return false; }
  return true;
}
/* A* 尋路（8 方向，不切牆角） */
function findPath(sx, sy, tx, ty) {
  sx = Math.floor(sx); sy = Math.floor(sy); tx = Math.floor(tx); ty = Math.floor(ty);
  if (solidTile(tx, ty)) {
    let best = null, bd = 1e9;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!solidTile(tx + dx, ty + dy)) { const d = Math.abs(dx) + Math.abs(dy); if (d < bd) { bd = d; best = [tx + dx, ty + dy]; } }
    if (!best) return null; [tx, ty] = best;
  }
  const key = (x, y) => y * W + x, open = [[sx, sy]], g = new Map([[key(sx, sy), 0]]), from = new Map(), closed = new Set();
  const h = (x, y) => Math.max(Math.abs(x - tx), Math.abs(y - ty));
  let guard = 0;
  while (open.length && guard++ < 3000) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (g.get(key(...open[i])) + h(...open[i]) < g.get(key(...open[bi])) + h(...open[bi])) bi = i;
    const [cx, cy] = open.splice(bi, 1)[0], ck = key(cx, cy);
    if (cx === tx && cy === ty) { const p = []; let k = ck; while (k !== key(sx, sy)) { p.unshift([k % W + .5, Math.floor(k / W) + .5]); k = from.get(k); } return p; }
    closed.add(ck);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = cx + dx, ny = cy + dy, nk = key(nx, ny);
      if (solidTile(nx, ny) || closed.has(nk)) continue;
      if (dx && dy && (solidTile(cx + dx, cy) || solidTile(cx, cy + dy))) continue;
      const ng = g.get(ck) + (dx && dy ? 1.414 : 1);
      if (!g.has(nk) || ng < g.get(nk)) { g.set(nk, ng); from.set(nk, ck); if (!open.some(o => o[0] === nx && o[1] === ny)) open.push([nx, ny]); }
    }
  }
  return null;
}

/* ---------- 斜角投影 ---------- */
const ORX = H * 16 + 24, ORY = 72;
const FW = (W + H) * 16 + 48, FH = (W + H) * 8 + 110;
let camX = 0, camY = 0, shake = 0;
const isoW = (x, y) => [ORX + (x - y) * 16, ORY + (x + y) * 8];
const iso = (x, y) => [Math.round(ORX + (x - y) * 16 - camX), Math.round(ORY + (x + y) * 8 - camY)];

/* ---------- 地板預先繪製 ---------- */
const floorC = document.createElement('canvas'); floorC.width = FW; floorC.height = FH;
const maskC = document.createElement('canvas'); maskC.width = FW; maskC.height = FH;
function diamond(g, x, y, col) {
  const [sx, sy] = isoW(x, y);
  g.fillStyle = col; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + 16, sy + 8); g.lineTo(sx, sy + 16); g.lineTo(sx - 16, sy + 8); g.closePath(); g.fill();
}
function speck(g, x, y, cols, n) {
  for (let i = 0; i < n; i++) { const u = R(), v = R(); const [sx, sy] = isoW(x + u, y + v); g.fillStyle = cols[i % cols.length]; g.fillRect(sx | 0, sy | 0, 1, 1); }
}
/* 斜角地磚貼圖：64x64 一組（2x2 格），依格子奇偶取四分之一，仿射到菱形 */
function texTile(g, img, idx, x, y, base) {
  diamond(g, x, y, base);
  const [sx, sy] = isoW(x, y);
  g.setTransform(.5, .25, -.5, .25, sx, sy);
  g.drawImage(img, idx * 64 + (x % 2) * 32, (y % 2) * 32, 32, 32, 0, 0, 32, 32);
  g.setTransform(1, 0, 0, 1, 0, 0);
}
const FLOORTEX = { // 地形: [圖, 索引, 底色]
  '.': ['floors2', 0, '#4a6b36'], ',': ['floors2', 1, '#857563'], '=': ['floors', 0, '#8f8778'],
  'r': ['floors', 7, '#3b3e4c'], ':': ['floors', 3, '#8a877c'], 'hall': ['floors', 4, '#9a5a44'],
};
function buildFloor() {
  const g = floorC.getContext('2d'), m = maskC.getContext('2d');
  const useTex = !!(IMG.floors && IMG.floors2);
  g.imageSmoothingEnabled = true;
  g.clearRect(0, 0, FW, FH); m.clearRect(0, 0, FW, FH);   // 換場景時重畫
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = at(x, y);
    if (c === 'f' || c === 'P') c = x < 17 && y < 37 ? ',' : '.';
    if (c === 'D') c = y === 8 || y === 12 ? ':' : '_';
    if (c === '#' || c === 'X') continue;
    const key = c === ':' && x >= 22 && x <= 33 ? 'hall' : c;
    if (useTex && FLOORTEX[key]) { const [im, i, b] = FLOORTEX[key]; texTile(g, IMG[im], i, x, y, b); }
    else if (useTex && c === '_') { diamond(g, x, y, (x % 2) ? '#6a4c34' : '#62462f'); const [sx, sy] = isoW(x, y + .5); g.fillStyle = '#47321f'; for (let k = -14; k < 14; k += 2) g.fillRect(sx + k, sy + k / 2 | 0, 1, 1); }
    else if (c === '.') { diamond(g, x, y, ['#17221a', '#19251b', '#152019'][(x * 7 + y * 3) % 3]); speck(g, x, y, ['#22332a', '#0f1711', '#1e2e22'], 9); }
    else if (c === ',') { diamond(g, x, y, (x + y) % 2 ? '#352d25' : '#382f27'); speck(g, x, y, ['#433628', '#2a221b'], 7); }
    else if (c === '=') { diamond(g, x, y, (x + y) % 2 ? '#303137' : '#2d2e34'); const [sx, sy] = isoW(x, y); g.strokeStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.moveTo(sx + 16, sy + 8); g.lineTo(sx, sy + 16); g.lineTo(sx - 16, sy + 8); g.stroke(); speck(g, x, y, ['#3b3c43'], 3); }
    else if (c === 'r') { diamond(g, x, y, '#18191e'); speck(g, x, y, ['#222329', '#121317'], 6); }
    else if (c === '_') { diamond(g, x, y, (x % 2) ? '#30231a' : '#2d2118'); const [sx, sy] = isoW(x, y + .5); g.fillStyle = '#231a13'; for (let k = -14; k < 14; k += 2) g.fillRect(sx + k, sy + k / 2 | 0, 1, 1); }
    else if (c === ':') { diamond(g, x, y, (x + y) % 2 ? '#262a2f' : '#2b3035'); speck(g, x, y, ['#30353b'], 2); }
    if (INDOOR.has(at(x, y)) || c === '_' || c === ':') diamond(m, x, y, 'rgba(0,0,0,.38)');   // 室內額外暗度
  }
  // 夜色：整片地面乘上冷色調
  if (useTex) {
    const keep = document.createElement('canvas'); keep.width = FW; keep.height = FH; keep.getContext('2d').drawImage(floorC, 0, 0);
    g.globalCompositeOperation = 'multiply'; g.fillStyle = '#727b94'; g.fillRect(0, 0, FW, FH);
    g.globalCompositeOperation = 'destination-in'; g.drawImage(keep, 0, 0);   // 相乘會把透明處也塗上顏色 → 只保留原本有地板的地方
    g.globalCompositeOperation = 'source-over';
  }
  if (G.scene === 1) {   // 第一章：操場跑道、道路標線
  // 操場跑道
  g.strokeStyle = 'rgba(210,200,180,.22)'; g.lineWidth = 1;
  for (const k of [0, 1.1]) {
    g.beginPath();
    for (let i = 0; i <= 80; i++) { const a = i / 80 * Math.PI * 2; const [sx, sy] = isoW(8.6 + (6 - k) * Math.cos(a), 25.6 + (9.2 - k) * Math.sin(a)); i ? g.lineTo(sx, sy) : g.moveTo(sx, sy); }
    g.stroke();
  }
  // 道路標線
  g.fillStyle = 'rgba(220,210,170,.35)';
  for (let x = 18; x < 39; x += 1.5) { const [a, b] = isoW(x, 39); g.fillRect(a | 0, b | 0, 9, 2); }
  }
  // 水窪
  for (let i = 0; i < 26; i++) {
    const x = 1 + R() * 37, y = 13 + R() * 24; const c = at(x | 0, y | 0);
    if (c !== '.' && c !== ',' && c !== '=') continue;
    const [sx, sy] = isoW(x, y); g.fillStyle = 'rgba(120,140,170,.12)'; g.beginPath(); g.ellipse(sx, sy, 6 + R() * 7, 2 + R() * 2, 0, 0, Math.PI * 2); g.fill();
  }
}

/* ---------- 繪圖工具 ---------- */
function poly(pts, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fill(); }
/* 方塊：腳印 (x,y)-(x+w,y+d)，高 h 像素；回傳左右面四角供細節繪製 */
function box(x, y, w, d, h, top, left, right, z = 0) {
  const a = iso(x, y), b = iso(x + w, y), c = iso(x + w, y + d), e = iso(x, y + d);
  const up = p => [p[0], p[1] - h - z], dn = p => [p[0], p[1] - z];
  if (left) poly([dn(e), dn(c), up(c), up(e)], left);
  if (right) poly([dn(b), dn(c), up(c), up(b)], right);
  poly([up(a), up(b), up(c), up(e)], top);
  return { a, b, c, e };
}
/* 在牆的左面（朝 +y）或右面（朝 +x）上畫矩形：u 沿面水平 0..1，v 由下往上像素 */
function faceRect(x, y, side, u0, u1, v0, v1, col) {
  const p = side === 'L' ? [iso(x, y + 1), iso(x + 1, y + 1)] : [iso(x + 1, y + 1), iso(x + 1, y)];
  const P = (u, v) => [p[0][0] + (p[1][0] - p[0][0]) * u, p[0][1] + (p[1][1] - p[0][1]) * u - v];
  poly([P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)], col);
}

/* ---------- 狀態 ---------- */
const G = {
  mode: 'title', lock: 0, t: 0, flags: {}, inv: { cans: 0, candy: 0, weapon: null, key: false, flashlight: false, phone: false, bandage: 0 },
  scene: 1, hearts: 5, cp: null, noises: [], projs: [], candies: [], flash: 0, nextBolt: 12, triggers: {}, shadow: null
};
const P = { x: 27.5, y: 38.7, dir: 0, vx: 0, vy: 0, r: .26, stam: 100, tired: false, crouch: false, run: false, light: false, hidden: null, hiddenSeen: false, step: 0, inv: 0, moving: false };
const GH = { x: 9, y: 18, dir: 4, r: .28, active: false, state: 'idle', path: null, pathT: 0, wp: 0, sus: 0, timer: 0, look: 0, last: null, lastSeenT: -9, mode: 'patrol', freeze: 5, script: 0, step: 0, visible: false, seeT: 0 };
const SCENE_PATROL = { 1: [[9.5, 18.5], [14.5, 21.5], [12.5, 30.5], [8.5, 33.5], [4.5, 29.5], [4.5, 20.5], [9.5, 25.5]] };   // 裂口女巡邏點（各章）
const PATROL = [...SCENE_PATROL[1]];
const SCRIPT = [[25.5, 10.5], [20.5, 10.5], [20.5, 8.5], [20.5, 7.5], [19.5, 5.5], [15.5, 5.5], [13.5, 3.5], [16.5, 3.5], [20.5, 3.5], [20.5, 7.5], [20.5, 9.5], [27.5, 10.5], [33.5, 10.5]];

/* ---------- 輸入 ---------- */
const K = {};
const KEYMAP = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', ShiftLeft: 'run', ShiftRight: 'run' };
addEventListener('keydown', e => {
  audioInit();
  if (KEYMAP[e.code]) { K[KEYMAP[e.code]] = true; e.preventDefault(); }
  if (e.repeat) return;
  if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); press('act'); }
  if (e.code === 'KeyF') press('flash');
  if (e.code === 'KeyC' || e.code === 'ControlLeft') press('crouch');
  if (e.code === 'Digit1') press('throwCan');
  if (e.code === 'Digit2') press('throwCandy');
  if (/^Digit[1-5]$/.test(e.code) && DLG.choices) DLG.pick(+e.code.slice(5) - 1);
});
addEventListener('keyup', e => { if (KEYMAP[e.code]) K[KEYMAP[e.code]] = false; });
let advanceFn = null;
function press(k) {
  if (k === 'act' && advanceFn) { advanceFn(); return; }
  if (G.mode !== 'play' || G.lock) return;
  if (k === 'act') interact();
  else if (k === 'flash') { if (G.inv.flashlight) { P.light = !P.light; sfx.click(); } else toast('沒有手電筒'); }
  else if (k === 'crouch') { P.crouch = !P.crouch; }
  else if (k === 'throwCan') throwItem('can');
  else if (k === 'throwCandy') throwItem('candy');
  updateHUD();
}
/* 觸控 */
const TOUCH = { x: 0, y: 0, id: null };
const isTouch = !!Q.get('touch') || matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const KEY = isTouch ? { flash: '按「燈」', act: '按「調查」', can: '點下方道具欄', candy: '點下方道具欄' } : { flash: '按 F', act: '按 E', can: '按 1', candy: '按 2' };
(function setupTouch() {
  const st = $('#stick'), kn = st.querySelector('b');
  const upd = (cx, cy) => { const r = st.getBoundingClientRect(); let dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2); const m = Math.hypot(dx, dy), mx = r.width / 2; if (m > mx) { dx *= mx / m; dy *= mx / m; } TOUCH.x = dx / mx; TOUCH.y = dy / mx; kn.style.transform = `translate(${dx}px,${dy}px)`; };
  st.addEventListener('pointerdown', e => { audioInit(); TOUCH.id = e.pointerId; st.setPointerCapture(e.pointerId); upd(e.clientX, e.clientY); });
  st.addEventListener('pointermove', e => { if (e.pointerId === TOUCH.id) upd(e.clientX, e.clientY); });
  const end = e => { if (e.pointerId === TOUCH.id) { TOUCH.id = null; TOUCH.x = TOUCH.y = 0; kn.style.transform = ''; } };
  st.addEventListener('pointerup', end); st.addEventListener('pointercancel', end);
  document.querySelectorAll('#tbtns button').forEach(b => {
    const k = b.dataset.k;
    if (k === 'run') {
      b.addEventListener('pointerdown', e => { e.preventDefault(); K.run = true; b.classList.add('on'); });
      const off = () => { K.run = false; b.classList.remove('on'); };
      b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
    } else b.addEventListener('pointerdown', e => { e.preventDefault(); audioInit(); press(k); });
  });
  $('#dlg').addEventListener('pointerdown', e => { if (e.target.tagName !== 'BUTTON' && advanceFn) advanceFn(); });
  $('#card').addEventListener('pointerdown', () => { audioInit(); if (advanceFn) advanceFn(); });
  $('#comic').addEventListener('pointerdown', () => { audioInit(); if (advanceFn) advanceFn(); });
  $('#phone').addEventListener('pointerdown', () => { if (advanceFn) advanceFn(); });
})();

/* ---------- 音效（Web Audio 合成） ---------- */
const A = { ctx: null };
function audioInit() {
  if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
  // iPhone 靜音開關打開時 Web Audio 預設會被靜音（主題曲也走 Web Audio）→ 宣告成「播放」類，靜音模式也有聲音
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { }
  try { A.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  const c = A.ctx; A.master = c.createGain(); A.master.gain.value = .85 * VOL.s; A.master.connect(c.destination);
  const len = c.sampleRate * 2, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  A.noise = b;
  const rs = c.createBufferSource(); rs.buffer = b; rs.loop = true;
  const rf = c.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 1500;
  A.rain = c.createGain(); A.rain.gain.value = 0; rs.connect(rf).connect(A.rain).connect(A.master); rs.start();
  A.drone = c.createGain(); A.drone.gain.value = 0;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160; lp.connect(A.drone).connect(A.master);
  [55, 55.6, 82.7].forEach(f => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(); });
  const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = .07; lg.gain.value = 70; lfo.connect(lg).connect(lp.frequency); lfo.start();
  A.tension = c.createGain(); A.tension.gain.value = 0; A.tension.connect(A.master);
  const t1 = c.createOscillator(), t2 = c.createOscillator(); t1.type = t2.type = 'triangle'; t1.frequency.value = 466; t2.frequency.value = 494;
  const tf = c.createBiquadFilter(); tf.type = 'bandpass'; tf.frequency.value = 900; t1.connect(tf); t2.connect(tf); tf.connect(A.tension); t1.start(); t2.start();
}
function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
function panNode(p) { const c = A.ctx; if (c.createStereoPanner) { const s = c.createStereoPanner(); s.pan.value = clamp(p || 0, -1, 1); return s; } return c.createGain(); }
function tone(f, dur, type = 'sine', vol = .2, slide, pan = 0, delay = 0) {
  if (!A.ctx) return; const c = A.ctx, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain(), p = panNode(pan);
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  env(g, t, .005, vol, dur); o.connect(g).connect(p).connect(A.master); o.start(t); o.stop(t + dur + .05);
}
function noise(dur, vol = .2, type = 'bandpass', f = 1000, q = 1, pan = 0, delay = 0, att = .003) {
  if (!A.ctx) return; const c = A.ctx, t = c.currentTime + delay, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(), p = panNode(pan);
  s.buffer = A.noise; s.playbackRate.value = .7 + Math.random() * .6; fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  env(g, t, att, vol, dur); s.connect(fl).connect(g).connect(p).connect(A.master); s.start(t, Math.random()); s.stop(t + dur + att + .05);
}
const sfx = {
  step(inside, vol, pan) { inside ? noise(.06, vol, 'bandpass', 2400, 2, pan) : noise(.09, vol, 'bandpass', 700 + Math.random() * 300, 1.2, pan); },
  heart(v) { tone(58, .16, 'sine', v); tone(52, .2, 'sine', v * .8, null, 0, .2); },
  sting() { [233, 247, 349, 370].forEach((f, i) => tone(f, 1.4, 'sawtooth', .07, f * .97, 0, i * .01)); noise(1.2, .18, 'highpass', 3000, .7); },
  pick() { tone(880, .25, 'sine', .08); tone(1320, .35, 'sine', .05, null, 0, .08); },
  click() { noise(.03, .15, 'highpass', 3000); },
  door() { tone(140, .5, 'sawtooth', .05, 90); noise(.4, .08, 'bandpass', 500, 3); },
  locked() { noise(.05, .2, 'bandpass', 1800, 4); noise(.05, .2, 'bandpass', 1500, 4, 0, .09); },
  chain() { for (let i = 0; i < 5; i++) noise(.05, .12, 'bandpass', 3000 + Math.random() * 2000, 6, 0, i * .05); },
  snip() { noise(.04, .3, 'highpass', 5000, 1); noise(.05, .3, 'highpass', 4200, 1, 0, .12); },
  hurt() { tone(110, .4, 'square', .12, 50); noise(.3, .25, 'lowpass', 900); },
  clank(pan) { tone(1200, .2, 'triangle', .07, 900, pan); tone(1700, .15, 'triangle', .05, null, pan, .02); noise(.08, .1, 'highpass', 4000, 1, pan); },
  thunder() { noise(2.6, .5, 'lowpass', 300, .5, 0, 0, .05); noise(.5, .3, 'lowpass', 1200, .5); },
  whoosh() { noise(.25, .12, 'bandpass', 1200, .8); },
  hit() { noise(.12, .35, 'lowpass', 600); tone(90, .2, 'square', .1, 50); },
  ring() { for (let i = 0; i < 16; i++) { tone(440, .045, 'square', .05, null, 0, i * .05); tone(480, .045, 'square', .04, null, 0, i * .05 + .025); } },
  laugh() { [0, .22, .4].forEach((d, i) => tone(300 - i * 30, .18, 'sawtooth', .04, 220, 0, d)); },
  vend() { tone(330, .08, 'square', .05); noise(.25, .15, 'lowpass', 400, 1, 0, .1); },
};

/* ---------- 主題曲《帰れない放課後》（Gemini 生成，3:00）：標題畫面＋開場漫畫播放、進入遊戲淡出、結局畫面再播 ---------- */
const LYRICS = [[16, '午前四時四十四分'], [18.6, '止まった時計'], [21.3, '誰もいない廊下'], [26.7, '闇に溶ける足音'], [32, '金次郎の目が動く'],
  [37.3, '赤い靴の少女'], [42.7, 'マスクの女'], [48, '「わたし、きれい？」'], [53.3, 'ハナコさんの声が'], [58.7, '奥の扉から'], [64, '裂けた口の奥に'],
  [69.3, '呑み込まれる夜'], [74.7, '鳴り続ける電話'], [112, 'メリーさんの囁き'], [117.3, '帰れない放課後'], [122.7, '迷い込んだ迷路'], [128, '非常口を抜けても'],
  [133.3, 'また同じ四時四十四分'], [138.7, 'マスクの女'], [144, '「わたし、きれい？」'], [149.3, '逃げ場のない校舎'], [154.7, '四の呪いに満ちて'],
  [160, 'ハナコさんの笑いが'], [165.3, '木霊する闇へ'], [170.7, '如月']];
const THEME = { el: null, t: 0, f: 0, on: true };
// 音量設定（音樂 VOL.m、音效 VOL.s，0～1）；舊版的「主題曲 OFF」換成音樂 0
const VOL = { m: .9, s: 1 };
try { const v = JSON.parse(localStorage.getItem('kisaragi_vol')); if (v) Object.assign(VOL, v); else if (localStorage.getItem('kisaragi_theme') === 'off') VOL.m = 0; } catch (e) { }
THEME.on = VOL.m > 0;
function saveVol() { try { localStorage.setItem('kisaragi_vol', JSON.stringify(VOL)); } catch (e) { } }
// 直接用 <audio> 播（不經 Web Audio：任何環節沒接上就整個無聲，iPhone 靜音開關下 <audio> 也照樣出聲）
// 前奏放大 2.2 倍已經做進音檔（ffmpeg，見 主題曲_帰れない放課後.txt）
function themeEl() {
  if (!THEME.el) { const e = THEME.el = new Audio('assets/theme.mp3'); e.loop = true; e.preload = 'auto'; }
  return THEME.el;
}
function themePlay(restart) {
  if (!THEME.on || TEST) return Promise.resolve(false);
  const e = themeEl(); clearTimeout(THEME.t); clearInterval(THEME.f);
  if (restart) e.currentTime = 0;
  e.volume = VOL.m;
  return e.play().then(() => true, () => false);
}
// 淡出用 audio.volume；iPhone 不能改音量 → 時間到直接停
function themeStop(sec = 4) {
  const e = THEME.el; if (!e || e.paused) return;
  clearInterval(THEME.f); const v0 = e.volume, t0 = performance.now();
  THEME.f = setInterval(() => {
    const k = (performance.now() - t0) / (sec * 1000);
    if (k >= 1) { clearInterval(THEME.f); e.pause(); e.volume = VOL.m; } else e.volume = v0 * (1 - k);
  }, 50);
}
// 標題／結局畫面顯示目前唱到的歌詞
setInterval(() => {
  const box = $('#lyric'); if (!box) return;
  const e = THEME.el, scr = !$('#title').classList.contains('hide') ? $('#title') : !$('#end').classList.contains('hide') ? $('#end') : null;
  let line = '';
  if (e && !e.paused && scr) { const ct = e.currentTime; for (let i = LYRICS.length - 1; i >= 0; i--) if (ct >= LYRICS[i][0]) { if (ct - LYRICS[i][0] < 5.6) line = LYRICS[i][1]; break; } }
  if (scr && box.parentNode !== scr) scr.appendChild(box);
  if (box.dataset.t !== line) { box.dataset.t = line; box.classList.remove('show'); if (line) setTimeout(() => { box.textContent = line; box.classList.add('show'); }, 250); }
}, 200);

/* ---------- UI ---------- */
function layout() {
  const w = innerWidth, h = innerHeight, wrap = $('#wrap');
  const small = isTouch && Math.min(w, h) < 540;          // 手機：鏡頭拉近、字放大
  const tall = isTouch && h > w && w >= 600;               // 平板直向：往下延伸
  let nvw = 640, nvh = 360;
  if (small) { nvh = 210; nvw = h > w ? 400 : clamp(Math.round(210 * w / h), 360, 520); }
  document.documentElement.classList.toggle('phone', small);
  if (tall) nvh = Math.min(1100, Math.round(640 * h / w));
  if (nvw !== VW || nvh !== VH) { VW = nvw; VH = nvh; cvs.width = VW; cvs.height = VH; ctx.imageSmoothingEnabled = false; }
  const s = Math.min(w / VW, h / VH);
  wrap.style.width = VW * s + 'px'; wrap.style.height = VH * s + 'px';
  document.documentElement.style.setProperty('--u', s + 'px');
  $('#rot').classList.toggle('hide', !(isTouch && h > w && w < 600));
}
addEventListener('resize', layout); addEventListener('orientationchange', () => setTimeout(layout, 300)); layout();
/* 全螢幕：Android、平板用 Fullscreen API；iPhone Safari 不支援 → 教玩家「加入主畫面」（manifest／apple-mobile-web-app-capable 開啟時沒有網址列） */
const canFS = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
const isStandalone = !!navigator.standalone || matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
const isIPhone = /iPhone|iPod/.test(navigator.userAgent);
function goFS() {
  const de = document.documentElement, req = de.requestFullscreen || de.webkitRequestFullscreen;
  if (!canFS || !req || document.fullscreenElement || document.webkitFullscreenElement) return Promise.resolve();
  const r = req.call(de);
  return (r && r.then ? r : Promise.resolve()).then(() => { try { screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } });
}
const showA2hs = () => $('#a2hs').classList.remove('hide');
(function setupFS() {
  const b = $('#fs');
  if (canFS) {
    b.classList.remove('hide');
    b.addEventListener('click', () => {
      audioInit();
      if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else goFS().catch(() => { });
    });
  } else if (isTouch && !isStandalone && !Q.get('embed')) {
    b.classList.remove('hide'); b.addEventListener('click', showA2hs);
  }
})();
/* 匿名遊玩統計：送到使用者自己的 Apps Script（Downloads\夜校如月_統計）寫進試算表；不記個資、不用 cookie，只在正式網站送 */
const STAT_URL = 'https://script.google.com/macros/s/AKfycbwLvOgx2so4aQKHEB3VlOg6HyVjFptfe41YJY4rgVrqvokEfMdD_9VdbFy1z6yl7hj6WA/exec';
function stat(ev, d) {
  if (TEST || !/github\.io$/.test(location.hostname)) return;
  try {
    const q = new URLSearchParams({ ev, d: d || '', m: isTouch ? 'm' : 'd', s: Q.get('embed') ? 'e' : 'w' });
    fetch(STAT_URL + '?' + q, { mode: 'no-cors', keepalive: true }).catch(() => { });
  } catch (e) { }
}
let toastT = 0;
function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('show'), 2200); }
function chapter(sub, title) {
  stat('reach', sub + ' ' + title);
  const e = $('#chap'); e.querySelector('span').textContent = sub; e.querySelector('b').textContent = title;
  e.classList.add('show'); setTimeout(() => e.classList.remove('show'), 3200);
}
let OBJTEXT = '';
function setObj(t) { OBJTEXT = t; updateHUD(); }
function updateHUD() {
  $('#hearts').innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${i < G.hearts ? '' : 'off'}"></i>`).join('');
  $('#obj').innerHTML = OBJTEXT ? `<small>目標</small>${OBJTEXT}` : '';
  const I = G.inv, s = [];
  if (I.flashlight) s.push(`<div class="s ${P.light ? 'on' : ''} tap" data-k="flash">手電筒<em>${isTouch ? '點按開關' : 'F'}</em></div>`);
  if (I.weapon) s.push(`<div class="s">${I.weapon.name}<em>耐久 ${I.weapon.dur}</em></div>`);
  if (I.cans) s.push(`<div class="s tap" data-k="throwCan">空罐×${I.cans}<em>${isTouch ? '點按丟出' : '1 丟出'}</em></div>`);
  if (I.candy) s.push(`<div class="s tap" data-k="throwCandy">鼈甲糖×${I.candy}<em>${isTouch ? '點按丟出' : '2 丟出'}</em></div>`);
  if (I.bandage) s.push(`<div class="s">繃帶×${I.bandage}</div>`);
  if (I.key) s.push(`<div class="s">側門鑰匙</div>`);
  if (I.phone) s.push(`<div class="s">手機</div>`);
  if (typeof sceneHUD === 'function') sceneHUD(s);
  if (P.crouch) s.push(`<div class="s on">蹲下中<em>${isTouch ? '' : 'C'}</em></div>`);
  $('#inv').innerHTML = s.join('');
  $('#inv').querySelectorAll('.tap').forEach(e => e.addEventListener('pointerdown', ev => { ev.preventDefault(); press(e.dataset.k); }));
}
/* 對話 */
const DLG = {
  choices: null, pick: () => { },
};
function typeText(el, text, onDone) {
  let i = 0; el.textContent = '';
  const id = setInterval(() => { i += 1; el.textContent = text.slice(0, i); if (i >= text.length) { clearInterval(id); onDone && onDone(); } }, TEST ? 1 : 28);
  return () => { clearInterval(id); el.textContent = text; onDone && onDone(); };
}
function say(name, text, face) {
  return new Promise(res => {
    G.lock++;
    const d = $('#dlg'); d.classList.remove('hide'); d.querySelector('.nm').textContent = name || '';
    const f = d.querySelector('.face'); f.classList.toggle('none', !face); if (face) f.style.backgroundImage = `url(${face})`;
    d.querySelector('.ch').innerHTML = ''; d.querySelector('.more').classList.remove('hide');
    let done = false; const skip = typeText(d.querySelector('.tx'), text, () => { done = true; });
    advanceFn = () => { if (!done) { skip(); return; } advanceFn = null; d.classList.add('hide'); G.lock--; res(); };
    if (TEST) setTimeout(() => advanceFn && advanceFn() || advanceFn && advanceFn(), 5);
  });
}
async function says(lines) { for (const l of lines) await (Array.isArray(l) ? say(l[0], l[1], l[2]) : say('咪醬', l)); }
function choose(name, text, options, timeout, face) {
  return new Promise(res => {
    G.lock++;
    const d = $('#dlg'); d.classList.remove('hide'); d.querySelector('.nm').textContent = name;
    const f = d.querySelector('.face'); f.classList.toggle('none', !face); if (face) f.style.backgroundImage = `url(${face})`;
    d.querySelector('.tx').textContent = text; d.querySelector('.more').classList.add('hide');
    const ch = d.querySelector('.ch'); ch.innerHTML = options.map((o, i) => `<button>${i + 1}. ${o}</button>`).join('');
    const tm = d.querySelector('.timer'); let tid = 0, start = performance.now();
    const fin = i => { if (!DLG.choices) return; DLG.choices = null; clearInterval(tid); tm.classList.add('hide'); ch.innerHTML = ''; d.classList.add('hide'); G.lock--; res(i); };
    DLG.choices = options; DLG.pick = i => { if (i >= 0 && i < options.length) fin(i); };
    ch.querySelectorAll('button').forEach((b, i) => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fin(i); }));
    if (timeout) { tm.classList.remove('hide'); tid = setInterval(() => { const r = 1 - (performance.now() - start) / timeout; tm.style.transform = `scaleX(${Math.max(0, r)})`; if (r <= 0) fin(-1); }, 50); }
    if (TEST && !Q.get('hold')) setTimeout(() => fin(TEST_CHOICE(options)), 5);
  });
}
let TEST_CHOICE = () => 0;
function card(img, lines) {
  return new Promise(async res => {
    G.lock++;
    const c = $('#card'); c.style.backgroundImage = `url(assets/${img}.jpg)`; c.classList.remove('hide');
    const tx = c.querySelector('.ctx');
    for (const l of lines) {
      await new Promise(r2 => { let done = false; const skip = typeText(tx, l, () => { done = true; }); advanceFn = () => { if (!done) { skip(); return; } advanceFn = null; r2(); }; if (TEST) setTimeout(() => { advanceFn && advanceFn(); advanceFn && advanceFn(); }, 5); });
    }
    c.classList.add('hide'); G.lock--; res();
  });
}
/* 開場漫畫：steps＝[{p: 格 0-3, nar: 旁白} 或 {p, say: 台詞}]，四格依序亮起，前面的格變暗留著 */
function comic(steps) {
  return new Promise(async res => {
    G.lock++;
    const c = $('#comic'), pns = [...c.querySelectorAll('.pn')];
    pns.forEach((pn, i) => { pn.className = 'pn'; pn.style.backgroundImage = `url(assets/comic${i + 1}.jpg)`; pn.innerHTML = '<div class="cap"></div><div class="bub"></div>'; });
    c.classList.remove('hide');
    for (const [si, st] of steps.entries()) {
      const hold = TEST === 'comic' && si >= +(Q.get('step') || 0);   // 截圖測試：停在第 step 步
      pns.forEach((pn, i) => { pn.classList.toggle('cur', i === st.p); if (i === st.p) pn.classList.add('on'); });
      const pn = pns[st.p], el = pn.querySelector(st.say ? '.bub' : '.cap');
      pn.querySelector(st.say ? '.cap' : '.bub').textContent = '';
      await new Promise(r2 => { let done = false; const skip = typeText(el, st.say || st.nar, () => { done = true; }); advanceFn = () => { if (!done) { skip(); return; } advanceFn = null; r2(); }; if (TEST && !hold) setTimeout(() => { advanceFn && advanceFn(); advanceFn && advanceFn(); }, 5); });
    }
    c.classList.add('hide'); G.lock--; res();
  });
}
function phoneCall(lines, num = '未知號碼') {
  return new Promise(async res => {
    G.lock++;
    const p = $('#phone'); p.classList.remove('hide'); p.querySelector('.num').textContent = num;
    const tx = p.querySelector('.ptx'); tx.textContent = '……'; const img = p.querySelector('img'); img.classList.add('ring');
    sfx.ring(); await wait(TEST ? 10 : 900); sfx.ring(); await wait(TEST ? 10 : 1100);
    img.classList.remove('ring'); p.querySelector('.who').textContent = '通話中';
    for (const l of lines) {
      await new Promise(r2 => { let done = false; const skip = typeText(tx, l, () => { done = true; }); advanceFn = () => { if (!done) { skip(); return; } advanceFn = null; r2(); }; if (TEST) setTimeout(() => { advanceFn && advanceFn(); advanceFn && advanceFn(); }, 5); });
    }
    tone(400, .3, 'square', .04);
    p.classList.add('hide'); p.querySelector('.who').textContent = '來電'; G.lock--; res();
  });
}
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------- 互動 ---------- */
function nearestInteract() {
  let best = null, bd = 1.35;
  for (const it of ITEMS) if (!it.taken && !it.hiddenUntil) { const d = dist(P.x, P.y, it.x, it.y); if (d < bd) { bd = d; best = { kind: 'item', it, label: '撿起' + it.name }; } }
  if (best) return best;
  bd = 1.3;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const tx = Math.floor(P.x) + dx, ty = Math.floor(P.y) + dy, d = dist(P.x, P.y, tx + .5, ty + .5);
    if (d >= bd) continue;
    const dr = DOORS[tx + ',' + ty];
    if (dr && dr.locked) { bd = d; best = { kind: 'door', dr, label: dr.key && G.inv.key ? '用鑰匙開門' : '調查門' }; continue; }
    const o = OBJAT[tx + ',' + ty];
    if (!o || (o.t === 'statue' && o.gone && G.flags.statueSeenGone)) continue;
    if (o.act === 'keybox' && G.inv.key) continue;
    if (o.act) { bd = d; best = { kind: 'obj', o, label: o.label || { vend: '調查販賣機', statue: '調查雕像', log: '看值班日誌', keybox: '打開器材箱', shoe: '看看鞋箱', board: '看公告欄', fount: '看看噴水池' }[o.act] }; }
    else if (HIDE[o.t] && o.hide !== false) { bd = d; best = { kind: 'hide', o, label: HIDE[o.t] }; }
  }
  return best;
}
async function interact() {
  if (P.hidden) { unhide(); return; }
  const n = nearestInteract(); if (!n) return;
  if (n.kind === 'item') return takeItem(n.it);
  if (n.kind === 'hide') return hide(n.o);
  if (n.kind === 'door') return useDoor(n.dr);
  if (n.kind === 'obj') return objAction(n.o);
}
function hide(o) {
  P.hidden = o; P.light = false; P.crouch = false;
  P.hiddenSeen = GH.active && GH.state === 'chase' && G.t - GH.lastSeenT < .9;
  noise(.15, .08, 'lowpass', 600);
  toast(HIDE[o.t] + '……（' + KEY.act + '出來）');
  updateHUD();
}
function unhide() {
  const o = P.hidden; P.hidden = null;
  // 出來的位置：躲藏點旁最近的空地
  const tx = o.x + .5, ty = o.y + .5;
  if (hitAt(P.x, P.y, P.r)) {
    let best = null, bd = 9;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!hitAt(tx + dx, ty + dy, P.r)) { const d = dist(P.x, P.y, tx + dx, ty + dy); if (d < bd) { bd = d; best = [tx + dx, ty + dy]; } }
    if (best) { P.x = best[0]; P.y = best[1]; }
  }
  if (o.t === 'trash' || o.t === 'locker' || o.t === 'box') { noise(.2, .12, 'bandpass', 1500, 2); addNoise(P.x, P.y, 3); }
}
async function takeItem(it) {
  const I = G.inv;
  if (it.id === 'phone') return phoneScene(it);
  if (it.id === 'broom' || it.id === 'lid') {
    if (I.weapon) { const old = ITEMS.find(x => x.taken && x.id === I.weapon.id); if (old) { old.taken = false; old.x = P.x; old.y = P.y; } }
    I.weapon = it.id === 'broom' ? { id: 'broom', name: '掃把', dur: 2 } : { id: 'lid', name: '垃圾桶蓋', dur: 3 };
  }
  it.taken = true; sfx.pick();
  if (it.id === 'flashlight') { I.flashlight = true; P.light = true; toast('得到【手電筒】　' + KEY.flash + '開關'); }
  else if (it.id === 'can') { I.cans++; toast('得到【空罐】　' + KEY.can + '丟出去，可以引開注意'); }
  else if (it.id === 'bandage') { I.bandage++; toast('得到【繃帶】　受傷時會自動使用'); }
  else if (it.id === 'broom') { toast('拿起【掃把】　被抓住時可以反擊（2 次）'); }
  else if (it.id === 'lid') { toast('拿起【垃圾桶蓋】　被抓住時可以擋一下（3 次）'); }
  updateHUD();
}
async function useDoor(dr) {
  if (dr.key && G.inv.key) {
    dr.locked = false; sfx.door(); G.inv.key = false; updateHUD();
    toast('側門打開了');
    return;
  }
  sfx.locked();
  if (dr.chain) {
    sfx.chain();
    await says(['玄關的門被粗鐵鍊纏了好幾圈，還上了大鎖。',
      G.flags.log ? '日誌說側門的鑰匙在操場的器材小屋……只能從那邊進去了。' : '……只能找找別的入口了。']);
    if (!G.flags.log) setObj('去亮著燈的警衛室看看');
    return;
  }
  if (dr.key) { await says([G.flags.log ? '側門鎖著。鑰匙應該在操場的器材小屋。' : '側門鎖著。']); return; }
  await says([dr.msg]);
}
async function objAction(o) {
  if (G.scene !== 1 && typeof sceneAction === 'function' && await sceneAction(o) !== false) return;
  if (o.act === 'vend') {
    if (G.flags.vend) { await says(['販賣機的燈一閃一閃的。已經沒有東西掉出來了。']); return; }
    G.flags.vend = true; sfx.vend(); G.inv.candy += 2; updateHUD();
    await says(['咦……還沒投錢，出貨口就「咚」地掉出東西。', '兩包鼈甲糖（べっこう飴）。包裝上的保存期限是……2004年？']);
    toast('得到【鼈甲糖】×2　' + KEY.candy + '丟出');
    return;
  }
  if (o.act === 'statue') {
    if (o.gone) { G.flags.statueSeenGone = true; await says(['……台座上什麼都沒有。', '剛剛明明還在這裡的。地上留著一串濕濕的、往校舍方向的腳印。']); return; }
    await says(['二宮金次郎像。背著柴薪、邊走邊看書的少年。',
      '聽說他白天要一直保持這個姿勢，沒辦法好好讀書，所以到了半夜，會自己走去圖書室借書……',
      '……雕像手上那本書，翻開的頁數好像跟白天不一樣。']);
    return;
  }
  if (o.act === 'shoe') { await says(['鞋箱。咪醬的室內鞋還好好地放在裡面。', '……旁邊那格的名牌被撕掉了，裡面放著一雙很舊的室內鞋，鞋跟寫著「2004」。']); return; }
  if (o.act === 'keybox') {
    G.inv.key = true; sfx.pick(); updateHUD(); toast('得到【側門鑰匙】');
    await says(['找到了，掛著「側門」名牌的鑰匙。']);
    STATUE.gone = true;
    setObj('用鑰匙打開校舍側門');
    saveCP('key');
    if (GH.active && GH.state !== 'chase') investigate(5.5, 31.2);
    return;
  }
  if (o.act === 'log') return readLog();
  if (o.act === 'board') { await says(['公告欄。運動會的照片、社團招生、校外教學通知……', '角落有一張褪色的尋人啟事。', '「二年級　澄香　2004年2月起下落不明」', '……照片上的臉，被人用紅筆整個塗掉了。']); return; }
  if (o.act === 'fount') { await says(['乾掉的噴水池，池底積著一層黑色的水。', '水面映出的路燈……比實際上多了一盞。', '那一盞燈下，好像站著一個人。']); return; }
}
async function readLog() {
  if (G.flags.log) { await says(['值班日誌。最後一行的墨水……還是濕的。']); return; }
  G.flags.log = true;
  await says([['值班日誌', '二月×日　18:30　巡邏完畢。玄關鐵鍊已上鎖。側門鑰匙放回操場器材小屋。'],
  ['值班日誌', '19:10　操場傳來剪刀的聲音。去看了，沒有人。'],
  ['值班日誌', '19:40　又是剪刀聲。路燈下有個戴口罩的女人。她問我「我美嗎」。我說了「普普通通」，她就愣住了。趁那時候跑回來。'],
  ['值班日誌', '——如果有人看到這本日誌：遇到她，就回答「普普通通」。她喜歡甜的東西。'],
  ['值班日誌', '4:44　時鐘停了。'],
  ['值班日誌', '4:44　一個綁雙馬尾的女生從校門走進來，拿著——'],
  '……咦？',
  ['值班日誌', '4:44　她正在讀這本日誌。'],
  '…………', '這、這是誰寫的？警衛先生呢？']);
  sfx.sting(); shake = 6;
  setObj('到操場的器材小屋拿側門鑰匙');
  chapter('第一章', '操場的口罩女');
  spawnGhost();
  saveCP('log');
}

/* ---------- 丟東西／噪音 ---------- */
function addNoise(x, y, r) { G.noises.push({ x, y, r, t: G.t }); }
function throwItem(kind) {
  if (P.hidden) return;
  const I = G.inv;
  if (kind === 'can' && !I.cans) { toast('沒有空罐'); return; }
  if (kind === 'candy' && !I.candy) { toast('沒有鼈甲糖'); return; }
  if (kind === 'can') I.cans--; else I.candy--;
  const [fx, fy] = DIRV[P.dir], m = Math.hypot(fx, fy);
  G.projs.push({ kind, x: P.x, y: P.y, vx: fx / m * 9, vy: fy / m * 9, life: .5, h: 0 });
  setPose('throw', .35); sfx.whoosh(); updateHUD();
}
// 方向：0 U,1 UL,2 L,3 DL,4 D,5 DR,6 R,7 UR（畫面方向）→ 世界向量
const SCR = [[0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1]];
const DIRV = SCR.map(([sx, sy]) => { const wx = sx / 32 + sy / 16, wy = sy / 16 - sx / 32, m = Math.hypot(wx, wy); return [wx / m, wy / m]; });
const K2S = [6, 5, 4, 3, 2, 1, 0, 7];
function dirFromWorld(vx, vy) { const sx = 2 * (vx - vy), sy = vx + vy; const k = ((Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) % 8) + 8) % 8; return K2S[k]; }

/* ---------- 鬼（裂口女） ---------- */
function spawnGhost(x = 9.5, y = 33.5) { Object.assign(GH, { x, y, active: true, state: 'patrol', mode: 'patrol', wp: 3, sus: 0, path: null, freeze: 5 }); }
function investigate(x, y) { GH.state = 'investigate'; GH.target = [x, y]; GH.path = null; }
function ghostFacing() { return DIRV[GH.dir]; }
function canSeePlayer() {
  if (P.hidden || G.mode !== 'play') return false;
  if (typeof sceneSafe === 'function' && sceneSafe(P.x, P.y)) return false;   // 安全屋（第二章保健室）
  const d = dist(GH.x, GH.y, P.x, P.y);
  let range = 5.2;
  if (P.light) range += 3.2;
  if (P.crouch) range *= .6;
  if (LIGHTS.some(l => dist(l.x, l.y, P.x, P.y) < l.r * .7)) range += 1.6;
  if (d > range) return false;
  if (d > 1.2) {
    const [fx, fy] = ghostFacing(), dx = (P.x - GH.x) / d, dy = (P.y - GH.y) / d;
    if (fx * dx + fy * dy < Math.cos(58 * Math.PI / 180)) return false;
  }
  return los(GH.x, GH.y, P.x, P.y);
}
function walkTo(tx, ty, speed, dt) {
  if (!GH.path || GH.pathFor !== Math.floor(tx) + ',' + Math.floor(ty) || GH.pathT <= 0) {
    GH.path = findPath(GH.x, GH.y, tx, ty) || []; GH.pathFor = Math.floor(tx) + ',' + Math.floor(ty); GH.pathT = .4;
  }
  GH.pathT -= dt;
  let tgt = GH.path[0];
  if (!tgt || GH.path.length === 1) tgt = [tx, ty];
  const dx = tgt[0] - GH.x, dy = tgt[1] - GH.y, d = Math.hypot(dx, dy);
  if (d < .12) { if (GH.path.length) GH.path.shift(); return dist(GH.x, GH.y, tx, ty) < .25; }
  const s = Math.min(d, speed * dt);
  const ox = GH.x, oy = GH.y; moveEnt(GH, dx / d * s, dy / d * s);
  if (Math.hypot(GH.x - ox, GH.y - oy) < s * .2) GH.pathT = 0;
  GH.dir = dirFromWorld(dx, dy); GH.moving = true;
  GH.animD = (GH.animD || 0) + s; GH.frame = 1 + Math.floor(GH.animD / (speed > 2.5 ? .48 : .34)) % 4;
  GH.step += s; if (GH.step > .55) { GH.step = 0; ghostStep(); }
  return false;
}
function ghostStep() {
  const d = dist(GH.x, GH.y, P.x, P.y); if (d > 11) return;
  const [sx] = iso(GH.x, GH.y); sfx.step(isInside(GH.x, GH.y), .16 * (1 - d / 11) * (GH.state === 'chase' ? 1.6 : 1), (sx - VW / 2) / (VW / 2));
}
function lookAround(dt) { GH.look += dt; if (GH.look > .7) { GH.look = 0; GH.dir = (GH.dir + (R() < .5 ? 2 : 6)) % 8; } }
function ghostUpdate(dt) {
  if (!GH.active) return;
  GH.moving = false;
  const d = dist(GH.x, GH.y, P.x, P.y);
  const sees = canSeePlayer();
  GH.visible = sees;
  if (['stun', 'confused', 'candy', 'pause'].includes(GH.state)) {
    GH.timer -= dt; if (GH.state === 'confused' || GH.state === 'candy') lookAround(dt * .4);
    if (GH.timer <= 0) { GH.state = sees ? 'chase' : 'search'; GH.target = [P.x, P.y]; GH.look = 0; GH.searchT = 3; GH.path = null; }
    return;
  }
  // 感知
  if (sees) {
    GH.lastSeenT = G.t; GH.last = [P.x, P.y];
    if (GH.state !== 'chase') {
      const rate = (1.9 * (1 - d / 9) + .5) * (P.light ? 1.4 : 1) * (P.crouch ? .6 : 1);
      GH.sus = Math.min(1, GH.sus + rate * dt);
      if (GH.sus > .25) GH.dir = dirFromWorld(P.x - GH.x, P.y - GH.y);
      if (GH.sus >= 1) { GH.state = 'chase'; GH.path = null; sfx.sting(); sfx.snip(); shake = 4; }
    }
  } else if (GH.state !== 'chase') GH.sus = Math.max(0, GH.sus - dt * .3);
  // 聽覺
  for (const n of G.noises) if (G.t - n.t < .05 && dist(n.x, n.y, GH.x, GH.y) < n.r && GH.state !== 'chase' && !GH.goCandy) { investigate(n.x, n.y); GH.sus = Math.max(GH.sus, .4); }
  // 糖果
  if (!GH.goCandy) { const c = G.candies.find(c => dist(c.x, c.y, GH.x, GH.y) < (GH.state === 'chase' ? 7 : 10)); if (c) { GH.goCandy = c; GH.state = 'candyGo'; GH.path = null; } }
  switch (GH.state) {
    case 'patrol': {
      const w = PATROL[GH.wp]; if (walkTo(w[0], w[1], 1.5, dt)) { GH.wp = (GH.wp + 1) % PATROL.length; GH.state = 'pauseLook'; GH.timer = 1.2; }
      break;
    }
    case 'pauseLook': GH.timer -= dt; lookAround(dt); if (GH.timer <= 0) GH.state = GH.mode === 'script' ? 'script' : 'patrol'; break;
    case 'script': {
      const w = SCRIPT[GH.script];
      if (!w) { GH.active = false; break; }
      if (walkTo(w[0], w[1], 1.35, dt)) {
        GH.script++;
        if (GH.script === 6 || GH.script === 9) { GH.state = 'pauseLook'; GH.timer = 1.6; }
        if (GH.script >= SCRIPT.length) { GH.active = false; scriptDone(); }
      }
      break;
    }
    case 'investigate': {
      if (walkTo(GH.target[0], GH.target[1], 2, dt)) { GH.state = 'search'; GH.searchT = 3; GH.target = null; }
      break;
    }
    case 'candyGo': {
      const c = GH.goCandy;
      if (!G.candies.includes(c)) { GH.goCandy = null; GH.state = 'search'; GH.searchT = 2; break; }
      if (walkTo(c.x, c.y, 2.4, dt)) { G.candies.splice(G.candies.indexOf(c), 1); GH.goCandy = null; GH.state = 'candy'; GH.timer = 5; sfx.laugh(); }
      break;
    }
    case 'chase': {
      if (P.hidden) {
        if (P.hiddenSeen) {
          const o = P.hidden;
          if (walkTo(o.x + .5, o.y + .5, 3.3, dt) || dist(GH.x, GH.y, o.x + .5, o.y + .5) < 1.25) { unhide(); catchPlayer(true); }
        } else { GH.state = 'search'; GH.searchT = 4; GH.target = GH.last; GH.path = null; }
        break;
      }
      if (sees) walkTo(P.x, P.y, 3.25, dt);
      else if (GH.last) { const arrived = walkTo(GH.last[0], GH.last[1], 3.25, dt); if (arrived || G.t - GH.lastSeenT > 3) { GH.state = 'search'; GH.searchT = 4.5; GH.target = null; GH.sus = .5; } }
      if (d < .62 && P.inv <= 0 && !P.hidden && !(typeof sceneSafe === 'function' && sceneSafe(P.x, P.y))) catchPlayer(false);
      break;
    }
    case 'search': {
      if (GH.target && !walkTo(GH.target[0], GH.target[1], 1.8, dt)) break;
      GH.target = null; lookAround(dt); GH.searchT -= dt;
      if (GH.searchT <= 0) { GH.sus = 0; GH.state = GH.mode === 'script' ? 'script' : 'patrol'; GH.path = null; if (GH.mode === 'patrol') GH.wp = nearestWp(); }
      break;
    }
  }
}
function nearestWp() { let b = 0, bd = 1e9; PATROL.forEach((w, i) => { const d = dist(w[0], w[1], GH.x, GH.y); if (d < bd) { bd = d; b = i; } }); return b; }

/* 被抓到：裂口女的提問 */
async function catchPlayer(pulled) {
  if (G.lock || G.mode !== 'play') return;
  GH.state = 'pause'; GH.timer = 99; P.vx = P.vy = 0;
  sfx.snip(); shake = 8;
  const face = faceURL();
  if (pulled) await say('', '躲藏的地方被一把掀開——', face);
  const opts = ['「……很美。」', '「不、不美！」', '「普普通通吧。」'];
  const acts = ['beauty', 'ugly', 'normal'];
  if (G.inv.weapon) { opts.push(G.inv.weapon.id === 'broom' ? '用掃把打她！' : '舉起垃圾桶蓋擋住！'); acts.push('weapon'); }
  if (G.inv.candy) { opts.push('把鼈甲糖丟向旁邊'); acts.push('candy'); }
  const i = await choose('戴口罩的女人', '「わたし、きれい？」……我，美嗎？', opts, 7000, face);
  const a = acts[i] || 'silent';
  P.inv = 2.2;
  if (a === 'normal') {
    sfx.laugh();
    await say('戴口罩的女人', '「……ふつう？　普……通……？」她歪著頭，整個人僵住了。', face);
    GH.state = 'confused'; GH.timer = GH.freeze; GH.freeze = Math.max(2.2, GH.freeze - 1.2);
    toast('她愣住了！快逃！');
  } else if (a === 'weapon') {
    const w = G.inv.weapon; w.dur--; sfx.hit(); shake = 6;
    GH.state = 'stun'; GH.timer = w.id === 'broom' ? 4 : 2.8;
    toast(w.id === 'broom' ? '掃把打中了！她踉蹌了一下' : '剪刀砍在桶蓋上，被彈開了！');
    if (w.dur <= 0) { toast(w.name + '壞掉了'); G.inv.weapon = null; }
  } else if (a === 'candy') {
    G.inv.candy--; const [fx, fy] = DIRV[(P.dir + 2) % 8];
    G.candies.push({ x: clampFree(P.x + fx * 2.5, P.y + fy * 2.5)[0], y: clampFree(P.x + fx * 2.5, P.y + fy * 2.5)[1] });
    GH.state = 'search'; GH.searchT = 0; sfx.whoosh(); toast('她轉頭去追那包糖了！');
  } else {
    const line = a === 'beauty' ? '「……這樣也美嗎？」她扯下了口罩。' : a === 'ugly' ? '「……醜？」剪刀閃了一下。' : '沉默。剪刀「喀嚓」一聲張開了。';
    await say('戴口罩的女人', line, face);
    GH.atk = NOW(); await wait(260);           // 揮剪刀動畫砍到第 2 格時才受傷
    sfx.snip(); sfx.hurt(); damage(a === 'ugly' ? 2 : 1);
    GH.state = 'stun'; GH.timer = 1.3;
    const [fx, fy] = DIRV[GH.dir]; moveEnt(P, fx * .8, fy * .8);
  }
  updateHUD();
}
function clampFree(x, y) { for (let k = 0; k < 10; k++) { if (!hitAt(x, y, .2)) return [x, y]; x = (x + P.x) / 2; y = (y + P.y) / 2; } return [P.x, P.y]; }
const faceURL = () => 'assets/kuchisake_face.png';
/* 咪醬的動作姿勢（受傷／丟東西／倒地），用真實時間計時，對話中也會播 */
const NOW = () => performance.now() / 1000;
function setPose(k, dur) { P.pose = { k, t0: NOW(), until: dur ? NOW() + dur : Infinity }; }
function damage(n) {
  G.hearts -= n; shake = 10; setPose('hurt', .8);
  if (G.hearts <= 0 && G.inv.bandage) { G.inv.bandage--; G.hearts = 1; toast('用掉了繃帶……還撐得住'); }
  if (G.hearts <= 0) { G.hearts = 0; gameOver(); }
  updateHUD();
}

/* ---------- 劇情 ---------- */
async function intro() {
  G.mode = 'cut';
  await comic([
    { p: 0, nar: '二月某日，晚上七點。' }, { p: 0, nar: '回家的電車上，咪醬伸手摸口袋——手機不見了。' },
    { p: 1, say: '啊……忘在教室的抽屜裡了。' },
    { p: 2, nar: '手機殼裡還夾著定期票。沒有它，明天連學校都去不了。' },
    { p: 3, nar: '她在下一站下車，沿著來時的路走回學校。' },
  ]);
  startPlay();
  chapter('序章', '放學後');
  setObj('回學校，到二年B班拿手機');
  saveCP('start');
  $('#hint').innerHTML = isTouch ? '左下搖桿移動　調查：撿東西／開門／躲藏' : 'WASD／方向鍵 移動　Shift 跑　C 蹲<br>E／空白鍵 調查・躲藏　F 手電筒　1・2 丟東西';
  setTimeout(() => $('#hint').innerHTML = '', 16000);
}
function startPlay() {
  themeStop(8);
  G.mode = 'play'; $('#hud').classList.remove('hide'); $('#touch').classList.toggle('hide', !isTouch); $('#title').classList.add('hide'); updateHUD();
}
const TRIG = [
  { id: 'gate', when: () => P.y < 36.6, run: async () => { await says(['校門……沒有鎖。', '整棟校舍黑漆漆的。只有警衛室好像還亮著燈。']); setObj('去亮著燈的警衛室看看'); } },
  { id: 'shadow', when: () => dist(P.x, P.y, 26.5, 20.6) < .9 || dist(P.x, P.y, 27.4, 20.4) < .9, run: async () => { shadowScare(); } },
  { id: 'clock', when: () => P.y < 16 && P.x > 20, run: async () => { await says(['校舍正面的時鐘……停在四點四十四分。', '今天放學的時候，它明明還在走。']); } },
  { id: 'statueGone', when: () => STATUE.gone && dist(P.x, P.y, 32.5, 17.5) < 3.2, run: async () => { await says(['……咦？', '二宮金次郎像……不見了？']); } },
  { id: 'inside', when: () => isInside(P.x, P.y) && P.y < 12 && P.y > 8.5, run: async () => { await says(['走廊好冷。緊急出口的綠色燈是唯一的光。', '二年B班就在前面。']); setObj('到二年B班拿回手機'); saveCP('inside'); } },
  { id: 'classroom', when: () => P.x > 13 && P.x < 22 && P.y < 8 && P.y > 2, run: async () => { await says(['黑板上寫著明天的值日生……', '「值日生：澄香」……我們班有這個人嗎？']); } },
];
function checkTriggers() {
  if (G.lock) return;
  for (const t of TRIG) if ((t.scene || 1) === G.scene && !G.triggers[t.id] && t.when()) { G.triggers[t.id] = true; t.run(); return; }
}
/* 原創怪談：慢一拍的影子 */
function shadowScare() {
  G.shadow = { x: P.x, y: P.y, dir: P.dir, t: 0 };
  setTimeout(async () => {
    while (G.lock) await wait(100);
    if (!G.shadow) return;
    await says(['……？', '路燈下面，我的影子……還站在剛剛的地方。']);
    G.shadow.turn = true; sfx.sting();
    setTimeout(() => { if (G.shadow) G.shadow.leave = true; }, 900);
  }, 1500);
}
async function phoneScene(it) {
  it.taken = true; G.inv.phone = true; sfx.pick(); updateHUD();
  saveCP('phone');
  await says(['找到了！我的手機。定期票也還在。', '……螢幕亮著。相簿被打開了。', '最新的一張照片——是走廊上，拿著手電筒的我的背影。', '拍攝時間：今天 4:44。', '……手機明明一直在抽屜裡。是誰拍的？']);
  await phoneCall(['……喂？', '我是瑪莉。', '我現在……在校門口。']);
  await says(['瑪莉……？', '……走廊有腳步聲。還有，「喀嚓、喀嚓」的剪刀聲。', '要快點躲起來！']);
  setObj('躲起來，別被發現');
  Object.assign(GH, { x: 30.5, y: 10.5, active: true, state: 'script', mode: 'script', script: 0, sus: 0, path: null, freeze: Math.max(GH.freeze, 3) });
}
async function scriptDone() {
  if (G.mode !== 'play') return;
  await wait(800);
  await says(['……腳步聲走遠了。']);
  await phoneCall(['我是瑪莉。', '我現在……在鞋箱前面。', '……我知道你在哪裡哦。']);
  if (typeof startCh2 === 'function') return startCh2();
  G.mode = 'end'; $('#hud').classList.add('hide'); $('#touch').classList.add('hide');
  $('#end').classList.remove('hide');
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
  if (TEST) document.title = 'END ' + JSON.stringify(stateSummary());
}

/* ---------- 檢查點 ---------- */
function snapshot() {
  return { scene: G.scene, flags: { ...G.flags }, inv: JSON.parse(JSON.stringify(G.inv)), hearts: Math.max(G.hearts, 3), triggers: { ...G.triggers }, statue: !!STATUE.gone, items: ITEMS.map(i => i.taken), doors: Object.values(DOORS).map(d => d.locked), px: P.x, py: P.y, obj: OBJTEXT };
}
function saveCP(name) {
  G.cp = { name, ...snapshot() };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.cp)); } catch (e) { }
}
function loadCP(cp) {
  if ((cp.scene || 1) !== G.scene) loadScene(cp.scene || 1);
  G.flags = { ...cp.flags }; G.inv = JSON.parse(JSON.stringify(cp.inv)); G.hearts = cp.hearts; G.triggers = { ...cp.triggers };
  STATUE.gone = cp.statue; ITEMS.forEach((it, i) => it.taken = cp.items[i]); Object.values(DOORS).forEach((d, i) => d.locked = cp.doors[i]);
  P.x = cp.px; P.y = cp.py; P.hidden = null; P.light = G.inv.flashlight; P.crouch = false; P.inv = 2; P.stam = 100; P.pose = null; GH.atk = 0;
  G.candies = []; G.projs = []; G.noises = []; G.shadow = null;
  GH.active = false;
  if (cp.name === 'phone') { const ph = ITEMS.find(i => i.id === 'phone'); ph.taken = false; G.inv.phone = false; }
  else if (G.scene !== 1) { if (typeof sceneOnLoad === 'function') sceneOnLoad(cp); }
  else if (G.flags.log) { spawnGhost(); const far = PATROL.map((w, i) => [dist(w[0], w[1], P.x, P.y), i]).sort((a, b) => b[0] - a[0])[0][1]; GH.x = PATROL[far][0]; GH.y = PATROL[far][1]; GH.wp = far; }
  setObj(cp.obj);
}
function gameOver() {
  stat('over', '場景' + G.scene);
  G.mode = 'over'; sfx.sting(); setTimeout(() => setPose('down'), 500);
  $('#overTx').textContent = ['剪刀的聲音，就在耳邊。', '「……下次，要回答得好聽一點哦。」'][Math.floor(Math.random() * 2)];
  setTimeout(() => { $('#hud').classList.add('hide'); $('#touch').classList.add('hide'); $('#over').classList.remove('hide'); }, 1800);
}

/* ---------- 更新 ---------- */
function update(dt) {
  G.t += dt;
  if (G.mode !== 'play' || G.lock) return;
  // 玩家移動
  let ix = (K.right ? 1 : 0) - (K.left ? 1 : 0) + TOUCH.x, iy = (K.down ? 1 : 0) - (K.up ? 1 : 0) + TOUCH.y;
  const im = Math.hypot(ix, iy);
  P.moving = false;
  if (P.hidden) { ix = iy = 0; }
  if (im > .2 && !P.hidden) {
    const sx = ix / Math.max(1, im), sy = iy / Math.max(1, im);
    let wx = sx / 32 + sy / 16, wy = sy / 16 - sx / 32; const wm = Math.hypot(wx, wy); wx /= wm; wy /= wm;
    const running = K.run && !P.tired && !P.crouch;
    const sp = (running ? 4.3 : P.crouch ? 1.4 : 2.5) * Math.min(1, im);
    const ox = P.x, oy = P.y;
    moveEnt(P, wx * sp * dt, wy * sp * dt);
    const moved = Math.hypot(P.x - ox, P.y - oy);
    P.dir = dirFromWorld(wx, wy); P.moving = moved > .001; P.run = running && P.moving;
    P.animD = (P.animD || 0) + moved; P.frame = 1 + Math.floor(P.animD / (P.run ? .5 : P.crouch ? .26 : .34)) % 4;
    if (P.run) { P.stam -= 26 * dt; if (P.stam <= 0) { P.stam = 0; P.tired = true; } }
    P.step += moved;
    const stride = P.run ? .62 : P.crouch ? .5 : .55;
    if (P.step > stride) {
      P.step = 0;
      const nr = P.run ? 6.5 : P.crouch ? .6 : 2.6;
      if (!P.crouch) addNoise(P.x, P.y, nr);
      sfx.step(isInside(P.x, P.y), P.run ? .2 : P.crouch ? .04 : .1, 0);
    }
  } else { P.run = false; P.animD = 0; P.frame = 0; }
  if (!P.run) { P.stam = Math.min(100, P.stam + 16 * dt); if (P.tired && P.stam > 35) P.tired = false; }
  P.inv -= dt;
  // 投擲物
  for (const p of G.projs) {
    p.life -= dt; const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
    if (hitAt(nx, ny, .1) || p.life <= 0) {
      p.dead = true; const [sx] = iso(p.x, p.y), pan = (sx - VW / 2) / (VW / 2);
      if (p.kind === 'can') { addNoise(p.x, p.y, 8); sfx.clank(pan); }
      else { G.candies.push({ x: p.x, y: p.y }); noise(.08, .1, 'bandpass', 1500, 2, pan); }
    } else { p.x = nx; p.y = ny; }
  }
  G.projs = G.projs.filter(p => !p.dead);
  G.noises = G.noises.filter(n => G.t - n.t < .1);
  ghostUpdate(dt);
  if (G.scene !== 1 && typeof sceneUpdate === 'function') sceneUpdate(dt);
  // 影子
  if (G.shadow) { const s = G.shadow; s.t += dt; if (s.turn && !s.turned) { s.turned = true; s.dir = dirFromWorld(P.x - s.x, P.y - s.y); } if (s.leave) { s.a = (s.a ?? 1) - dt * .35; s.x -= dt * .5; s.y -= dt * .5; s.dir = 1; if (s.a <= 0) G.shadow = null; } }
  // 雷
  if (!isInside(P.x, P.y)) { G.nextBolt -= dt; if (G.nextBolt <= 0) { G.nextBolt = 22 + R() * 25; G.flash = 1; setTimeout(sfx.thunder, 400 + R() * 900); } }
  G.flash = Math.max(0, G.flash - dt * 2.6);
  // 心跳、緊張感、環境音
  if (A.ctx) {
    const gd = GH.active ? dist(GH.x, GH.y, P.x, P.y) : 99;
    const danger = GH.active ? clamp(1 - gd / 9, 0, 1) * (GH.state === 'chase' ? 1 : .6) : 0;
    G.danger = danger;
    G.heartT = (G.heartT || 0) - dt;
    if (danger > .1 && G.heartT <= 0) { sfx.heart(.12 + danger * .25); G.heartT = 1.1 - danger * .65; }
    const now = A.ctx.currentTime, inside = isInside(P.x, P.y);
    A.rain.gain.setTargetAtTime(inside ? .025 : .09, now, .5);
    A.drone.gain.setTargetAtTime(inside ? .07 : .045, now, 1);
    A.tension.gain.setTargetAtTime(GH.state === 'chase' && GH.active ? .02 : 0, now, .3);
  }
  checkTriggers();
  // 互動提示
  const n = !P.hidden ? nearestInteract() : null;
  const pr = $('#prompt');
  const lbl = P.hidden ? '躲藏中…　' + (isTouch ? '按調查出來' : 'E 出來') : n ? n.label + (isTouch ? '' : '　E') : '';
  if (lbl) {
    const [sx, sy] = iso(P.x, P.y); const u = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--u')) || 1;
    pr.textContent = lbl; pr.style.left = sx * u + 'px'; pr.style.top = (sy - 60) * u + 'px'; pr.classList.remove('hide');
  } else pr.classList.add('hide');
  $('#stam b').style.width = P.stam + '%';
  $('#stam b').style.background = P.tired ? '#a14b4b' : '#9fb3a6';
}

/* ---------- 繪製 ---------- */
const dark = document.createElement('canvas'); dark.width = VW; dark.height = VH;
const dctx = dark.getContext('2d');
const grain = [0, 1, 2].map(() => { const c = document.createElement('canvas'); c.width = 160; c.height = 90; const g = c.getContext('2d'); const d = g.createImageData(160, 90); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); return c; });
const RAIN = Array.from({ length: 140 }, () => ({ x: Math.random() * VW, y: Math.random() * VH, s: 380 + Math.random() * 200 }));

/* 牆面貼圖（walls.png：0 磚 1 窗 2 門 3 灰泥 4 灰泥漏水 5 爬藤），斜切貼到方塊左面(+y)或右面(+x) */
function texFace(x, y, side, idx, shade, h = WALLH, inset = 0) {
  const img = IMG.walls; if (!img) return;
  const [sx, sy] = side === 'L' ? iso(x + inset, y + 1 - inset) : iso(x + 1 - inset, y + 1 - inset);
  const k = 1 - 2 * inset;
  ctx.setTransform(.5 * k, side === 'L' ? .25 * k : -.25 * k, 0, h / 34, sx, sy - h);
  ctx.drawImage(img, idx * 32, 0, 32, 34, 0, 0, 32, 34);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (shade) {
    const p = side === 'L' ? [iso(x + inset, y + 1 - inset), iso(x + 1 - inset, y + 1 - inset)] : [iso(x + 1 - inset, y + 1 - inset), iso(x + 1 - inset, y + inset)];
    poly([p[0], p[1], [p[1][0], p[1][1] - h], [p[0][0], p[0][1] - h]], shade);
  }
}
const isExt = (x, y) => y === 1 || y === 12 || x === 1 || x === 38 || (x >= 3 && x <= 7 && y >= 32) || (x >= 31 && x <= 34 && y >= 32);
function wallTex(x, y, side) {
  const hsh = (x * 73 + y * 31 + (side === 'R' ? 7 : 0)) % 23;
  if (isExt(x, y)) {
    if ((side === 'L' && (y === 12 || y === 35) && x % 3 === 1) || (side === 'R' && x === 38 && y % 3 === 1)) return 1;
    return hsh === 5 ? 5 : 0;
  }
  return hsh % 7 === 0 ? 4 : hsh === 11 ? 5 : 3;
}
function wallColors(x, y) {
  const ext = y === 1 || y === 12 || x === 1 || x === 38 || (x >= 3 && x <= 7 && y >= 32) || (x >= 31 && x <= 34 && y >= 32);
  return ext ? ['#4b4f49', '#343833', '#2b2e2a'] : ['#6a6352', '#4a4538', '#3e3a30'];
}
function drawWall(x, y, alpha) {
  ctx.globalAlpha = alpha;
  const c = at(x, y);
  if (c === 'P' && IMG.walls) { texFace(x, y, 'L', 0, 'rgba(0,0,0,.1)', 46, .1); texFace(x, y, 'R', 0, 'rgba(0,0,0,.4)', 46, .1); box(x + .1, y + .1, .8, .8, 46, '#8d8475', null, null); if (x === 25) { faceRect(x, y, 'L', .2, .8, 14, 36, '#2a2722'); } ctx.globalAlpha = 1; return; }
  if (c === 'P') { box(x + .1, y + .1, .8, .8, 46, '#5a5852', '#3e3c37', '#33312d'); if (x === 25) { faceRect(x, y, 'L', .2, .8, 14, 36, '#2a2722'); } ctx.globalAlpha = 1; return; }
  if (c === 'D') {
    const dr = DOORS[x + ',' + y];
    if (!dr.locked) { // 開著的門：門框橫梁
      box(x, y, 1, 1, 6, '#3a3328', null, null, WALLH - 6); ctx.globalAlpha = 1; return;
    }
    const [t, l, r] = wallColors(x, y);
    const side = at(x - 1, y) === '#' || at(x + 1, y) === '#' ? 'L' : 'R';   // 左右是牆＝門開在橫向的牆上
    if (IMG.walls) {
      texFace(x, y, 'L', side === 'L' && isExt(x, y) ? 2 : wallTex(x, y, 'L'), 'rgba(0,0,0,.12)');
      texFace(x, y, 'R', side === 'R' && isExt(x, y) ? 2 : wallTex(x, y, 'R'), 'rgba(0,0,0,.4)');
      box(x, y, 1, 1, WALLH, isExt(x, y) ? '#8d8475' : '#7c7466', null, null);
      if (!isExt(x, y)) { faceRect(x, y, side, .12, .88, 0, 26, '#4a3a2a'); faceRect(x, y, side, .25, .75, 14, 23, 'rgba(20,24,30,.9)'); }
      if (dr.chain) { ctx.strokeStyle = '#a5a5a0'; ctx.lineWidth = 1; const [sx, sy] = iso(x, y + 1); ctx.beginPath(); ctx.moveTo(sx + 2, sy - 22); ctx.lineTo(sx + 14, sy - 4); ctx.moveTo(sx + 14, sy - 16); ctx.lineTo(sx + 2, sy - 2); ctx.stroke(); }
      ctx.globalAlpha = 1; return;
    }
    box(x, y, 1, 1, WALLH, t, l, r);
    faceRect(x, y, side, .12, .88, 0, 26, dr.chain ? '#3a2c22' : '#4a3a2a');
    faceRect(x, y, side, .25, .75, 14, 23, 'rgba(20,24,30,.9)');
    if (dr.chain) { ctx.strokeStyle = '#8a8a86'; ctx.lineWidth = 1; const [sx, sy] = iso(x, y + 1); ctx.beginPath(); ctx.moveTo(sx + 2, sy - 22); ctx.lineTo(sx + 14, sy - 4); ctx.moveTo(sx + 14, sy - 16); ctx.lineTo(sx + 2, sy - 2); ctx.stroke(); }
    ctx.globalAlpha = 1; return;
  }
  const [t, l, r] = wallColors(x, y);
  const L = !['#', 'D'].includes(at(x, y + 1)) ? l : null, Rr = !['#', 'D'].includes(at(x + 1, y)) ? r : null;
  if (IMG.walls) {
    if (L) texFace(x, y, 'L', wallTex(x, y, 'L'), 'rgba(0,0,0,.12)');
    if (Rr) texFace(x, y, 'R', wallTex(x, y, 'R'), 'rgba(0,0,0,.4)');
    box(x, y, 1, 1, WALLH, isExt(x, y) ? '#8d8475' : '#7c7466', null, null);
  } else box(x, y, 1, 1, WALLH, t, L, Rr);
  // 窗戶（外牆）、黑板、班牌、時鐘（第一章的固定位置）
  if (G.scene !== 1) { if (typeof sceneWallDeco === 'function') sceneWallDeco(x, y, L, Rr); ctx.globalAlpha = 1; return; }
  if (!IMG.walls && L && y === 12 && x % 3 === 1) { faceRect(x, y, 'L', .18, .82, 13, 28, '#141a24'); faceRect(x, y, 'L', .2, .45, 15, 26, 'rgba(90,110,140,.25)'); }
  if (L && y === 1 && ((x >= 15 && x <= 19) || (x >= 4 && x <= 9) || (x >= 25 && x <= 29))) faceRect(x, y, 'L', 0, 1, 10, 27, '#1f3327');
  if (L && y === 1 && x === 17) { ctx.fillStyle = 'rgba(220,220,210,.55)'; const [sx, sy] = iso(x, y + 1); ctx.fillRect(sx + 3, sy - 22, 9, 1); ctx.fillRect(sx + 5, sy - 18, 6, 1); }
  if (L && y === 8 && DOORS[(x + 1) + ',8'] && DOORS[(x + 1) + ',8'].sign) { faceRect(x, y, 'L', .3, 1, 27, 32, '#c9c2ae'); }
  if (L && y === 12 && x === 26) { const [sx, sy] = iso(x + .5, y + 1); ctx.fillStyle = '#d8d2c0'; ctx.beginPath(); ctx.ellipse(sx, sy - 24, 5, 5, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#222'; ctx.beginPath(); ctx.moveTo(sx, sy - 24); ctx.lineTo(sx - 3, sy - 25); ctx.moveTo(sx, sy - 24); ctx.lineTo(sx + 1, sy - 28); ctx.stroke(); }
  if (Rr && y === 10 && x === 1) faceRect(x, y, 'R', .2, .8, 26, 31, '#1d6b3a');
  ctx.globalAlpha = 1;
}
function drawFence(x, y) {
  const [sx, sy] = iso(x + .5, y + .5);
  ctx.fillStyle = '#4a4d4f'; ctx.fillRect(sx, sy - 22, 1, 22);
  ctx.strokeStyle = 'rgba(110,115,118,.55)'; ctx.lineWidth = 1;
  for (const [dx, dy] of [[1, 0], [0, 1]]) {
    if (at(x + dx, y + dy) !== 'f') continue;
    const [tx, ty] = iso(x + .5 + dx, y + .5 + dy);
    ctx.beginPath(); ctx.moveTo(sx, sy - 21); ctx.lineTo(tx, ty - 21); ctx.moveTo(sx, sy - 2); ctx.lineTo(tx, ty - 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(110,115,118,.18)';
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(sx + (tx - sx) * k / 4, sy - 21 + (ty - sy) * k / 4); ctx.lineTo(sx + (tx - sx) * (k + 1) / 4, sy - 2 + (ty - sy) * (k + 1) / 4); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(110,115,118,.55)';
  }
}
function drawObj(o, alpha) {
  const { x, y } = o; ctx.globalAlpha = alpha;
  const [cx, cy] = iso(x + .5, y + .5);
  const shaking = P.hidden === o && G.danger > .5 && Math.sin(G.t * 40) > 0 ? 1 : 0;
  const spr = (n, dy = 0) => { const im = IMG[n]; if (im) ctx.drawImage(im, Math.round(cx - im.width / 2), Math.round(cy - im.height + dy)); return !!im; };
  const v = (x * 7 + y * 13) % 4;
  if (o.t === 'tree' && spr(v < 2 ? 't_tree' : v === 2 ? 't_dead1' : 't_dead2', 5)) { ctx.globalAlpha = 1; return; }
  if (o.t === 'bush' && spr(['t_bush1', 't_bush2', 't_bush3'][(x + y) % 3], 4 + shaking)) { ctx.globalAlpha = 1; return; }
  if (o.t === 'lamp' && IMG.t_lamp) { spr('t_lamp', 3); o.on = !(o.x === 8 && o.y === 16) || Math.sin(G.t * 17) + Math.sin(G.t * 5.3) > -.6; if (!o.on) { ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(cx - 5, cy - 54, 10, 10); } ctx.globalAlpha = 1; return; }
  if (o.t === 'trash' && spr('t_trash', 3 + shaking)) { ctx.globalAlpha = 1; return; }
  if (o.t === 'bike' && IMG.t_rack) { if (x === 35) spr('t_rack', 6); else if (x === 33 || x === 37) spr('t_bike', 4); ctx.globalAlpha = 1; return; }
  if (o.t === 'bench') { spr(o.v ? 't_bench2' : 't_bench1', 5); ctx.globalAlpha = 1; return; }
  if (o.t === 'board') { spr('t_board', 4); ctx.globalAlpha = 1; return; }
  if (o.t === 'fount') { spr('t_fount', 6); ctx.globalAlpha = 1; return; }
  switch (o.t) {
    case 'tree': {
      ctx.fillStyle = '#2a1e16'; ctx.fillRect(cx - 2, cy - 22, 4, 22);
      const blobs = [[0, -40, 15], [-8, -32, 11], [9, -31, 11], [-4, -50, 10], [6, -46, 9]];
      blobs.forEach(([dx, dy, r], i) => { ctx.fillStyle = ['#0f1a12', '#132017', '#0c160f', '#16241a', '#112016'][i]; ctx.beginPath(); ctx.ellipse(cx + dx, cy + dy, r, r * .8, 0, 0, 7); ctx.fill(); });
      ctx.fillStyle = '#1c2e21'; for (let i = 0; i < 14; i++) ctx.fillRect(cx - 12 + ((i * 37) % 24), cy - 52 + ((i * 53) % 26), 2, 1);
      break;
    }
    case 'bush': ctx.fillStyle = '#132219'; ctx.beginPath(); ctx.ellipse(cx, cy - 6 + shaking, 14, 9, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#1a2d20'; ctx.beginPath(); ctx.ellipse(cx - 4, cy - 9 + shaking, 8, 5, 0, 0, 7); ctx.fill(); break;
    case 'lamp': {
      ctx.fillStyle = '#3d3f42'; ctx.fillRect(cx - 1, cy - 50, 2, 50); ctx.fillRect(cx - 1, cy - 50, 8, 2);
      const on = !(o.x === 8 && o.y === 16) || Math.sin(G.t * 17) + Math.sin(G.t * 5.3) > -.6;
      ctx.fillStyle = on ? '#ffe2a8' : '#5a5040'; ctx.fillRect(cx + 4, cy - 48, 4, 2); o.on = on; break;
    }
    case 'vend': { const b = box(x + .15, y + .2, .7, .6, 34, '#cfd4d8', '#9aa3aa', '#7f878d'); faceRect(x, y, 'L', .25, .75, 14, 30, 'rgba(200,230,255,.85)'); faceRect(x, y, 'L', .3, .7, 4, 8, '#111'); break; }
    case 'bleach': box(x, y, 1, 1, o.hideOnly ? 9 : 18, '#5a5048', '#3e3630', '#342d28'); if (!o.hideOnly) box(x, y, .5, 1, 9, '#61574e', null, null, 18); break;
    case 'box': box(x + .15, y + .2, .7, .6, 14 + shaking, '#6b5232', '#4c3a24', '#3f301d'); ctx.fillStyle = '#2e2416'; ctx.fillRect(cx - 6, cy - 9, 12, 1); break;
    case 'trash': box(x + .3, y + .3, .4, .4, 12 + shaking, '#596066', '#3d4247', '#33373b'); break;
    case 'statue': box(x + .15, y + .15, .7, .7, 10, '#6c6a64', '#4a4843', '#403e3a'); if (!o.gone && IMG.ninomiya) ctx.drawImage(IMG.ninomiya, cx - 16, cy - 58); break;
    case 'bike': ctx.strokeStyle = '#555a5e'; ctx.beginPath(); ctx.ellipse(cx - 6, cy - 5, 5, 4, 0, 0, 7); ctx.ellipse(cx + 6, cy - 2, 5, 4, 0, 0, 7); ctx.moveTo(cx - 6, cy - 5); ctx.lineTo(cx, cy - 10); ctx.lineTo(cx + 6, cy - 2); ctx.stroke(); break;
    case 'gdesk': box(x + .1, y + .2, .8, .6, 12, '#5a4632', '#3e3022', '#33281c'); ctx.fillStyle = '#d8cfb8'; ctx.fillRect(cx - 4, cy - 15, 7, 4); break;
    case 'desk': {
      box(x + .2, y + .25, .6, .5, 11, o.mine && !G.inv.phone ? '#7a6244' : '#6a553b', '#3b2f22', '#33291d');
      box(x + .3, y + .8, .4, .3, 7, '#4f4032', '#33291e', '#2b2219');
      break;
    }
    case 'tdesk': box(x + .05, y + .2, .9, .6, 14, '#5c4733', '#3f3124', '#352a1f'); break;
    case 'locker': box(x + .1, y + .2, .8, .6, 32, '#5c6266', '#43494d', '#3a3f43'); ctx.fillStyle = '#2a2e31'; ctx.fillRect(cx - 1, cy - 28, 1, 24); break;
    case 'shoe': box(x + .1, y + .15, .8, .7, 28, '#6a5845', '#4b3e30', '#413528'); for (let k = 0; k < 3; k++) faceRect(x, y, 'L', .15, .85, 6 + k * 8, 7 + k * 8, '#2e251c'); break;
    default: if (typeof sceneDrawObj === 'function') sceneDrawObj(o, cx, cy, shaking);
  }
  ctx.globalAlpha = 1;
}
// 裂口女：揮剪刀（4 格 × .14 秒）＞ 追擊時舉剪刀衝刺 ＞ 一般走路
function ghSpr() {
  const t = GH.atkLoop ? NOW() % .56 : NOW() - (GH.atk || 0);
  if (t < .56 && IMG.kuchisake_atk) return [IMG.kuchisake_atk, GH.x, GH.y, GH.dir, Math.floor(t / .14)];
  return [GH.state === 'chase' && IMG.kuchisake_chase || IMG.kuchisake, GH.x, GH.y, GH.dir, GH.moving ? GH.frame : 0];
}
// 咪醬：動作姿勢 ＞ 蹲 ＞ 拿手電筒站著 ＞ 一般走跑
function drawMi() {
  const k = P.pose && NOW() < P.pose.until ? P.pose.k : null, img = k && IMG['mi_' + k];
  if (img) return drawSprite(img, P.x, P.y, P.dir, { frame: k === 'hurt' ? Math.floor(NOW() * 6) : k === 'throw' ? +(NOW() - P.pose.t0 > .12) : 0, noShadow: k === 'down' });
  if (P.crouch && IMG.mi_crouch) return drawSprite(IMG.mi_crouch, P.x, P.y, P.dir, P.moving ? P.frame % 4 : 0);
  if (P.light && !P.moving && IMG.mi_light) return drawSprite(IMG.mi_light, P.x, P.y, P.dir);
  drawSprite(IMG.mi, P.x, P.y, P.dir, { frame: P.moving ? (P.run ? 4 : 0) + P.frame : 0 });
}
function drawSprite(img, x, y, dir, frame, opt) {
  if (typeof frame === 'object') { opt = frame; frame = undefined; }   // drawSprite(img,x,y,dir,opt) 或 (img,x,y,dir,frame,opt)
  opt = { ...(opt || {}) }; if (frame !== undefined) opt.frame = frame;
  if (!img) return;
  const rows = img.rows || (img.height > img.width / 8 * 1.8 ? 4 : 1);   // 咪醬 9 列（站/走4/跑4）、鬼 4 列
  const fw = img.width / 8, fh = img.height / rows, fy = ((opt.frame || 0) % rows) * fh, [sx, sy] = iso(x, y);
  const bob = opt.bob || 0;
  ctx.globalAlpha = opt.alpha ?? 1;
  if (!opt.noShadow) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(sx, sy, 9, 4, 0, 0, 7); ctx.fill(); }
  const h = opt.crouch ? fh * .78 : fh;
  if (opt.tint) {
    const t = drawSprite.tc || (drawSprite.tc = document.createElement('canvas')); t.width = fw; t.height = fh;
    const g = t.getContext('2d'); g.clearRect(0, 0, fw, fh); g.drawImage(img, dir * fw, fy, fw, fh, 0, 0, fw, fh); g.globalCompositeOperation = 'source-atop'; g.fillStyle = opt.tint; g.fillRect(0, 0, fw, fh); g.globalCompositeOperation = 'source-over';
    ctx.drawImage(t, 0, 0, fw, fh, Math.round(sx - fw / 2), Math.round(sy - h + 1 - bob), fw, h);
  } else ctx.drawImage(img, dir * fw, fy, fw, fh, Math.round(sx - fw / 2 + (opt.jit || 0)), Math.round(sy - h + 1 - bob), fw, h);
  ctx.globalAlpha = 1;
}
const DARK = .6;
function render() {
  if (dark.height !== VH || dark.width !== VW) { dark.width = VW; dark.height = VH; }
  // 鏡頭
  const [px, py] = isoW(P.x, P.y);
  const tx = px - VW / 2, ty = py - VH / 2 - 14;
  camX += (tx - camX) * .12; camY += (ty - camY) * .12;
  if (G.mode === 'title') { camX = tx; camY = ty; }
  const sh = shake > 0 ? (shake -= .5, (Math.random() - .5) * shake) : 0;
  camX += sh; camY += sh * .5;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
  ctx.drawImage(floorC, -Math.round(camX), -Math.round(camY));
  // 地上的糖、物品光點
  for (const c of G.candies) { const [sx, sy] = iso(c.x, c.y); ctx.fillStyle = '#d99a2b'; ctx.fillRect(sx - 2, sy - 2, 4, 3); }
  // 可見範圍內的物件排序
  const list = [];
  const pd = P.x + P.y;
  const [psx, psy] = iso(P.x, P.y);
  const near = (sx, sy, top) => Math.abs(sx - psx) < 30 && sy > psy - 50 && sy - top < psy + 4;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = at(x, y);
    const o = OBJAT[x + ',' + y];
    if (c !== '#' && c !== 'P' && c !== 'D' && c !== 'f' && !o) continue;
    const [sx, sy] = iso(x + .5, y + .5);
    if (sx < -40 || sx > VW + 40 || sy < -20 || sy > VH + 90) continue;
    const dep = x + y + 1;
    if (c === 'f') list.push({ d: dep, f: () => drawFence(x, y) });
    else if (c === '#' || c === 'P' || c === 'D') list.push({ d: dep, f: a => drawWall(x, y, a), tall: 40, sx, sy });
    if (o) list.push({ d: dep + .01, f: a => drawObj(o, a), tall: o.t === 'tree' ? 56 : o.t === 'locker' || o.t === 'shoe' || o.t === 'vend' || o.t === 'board' || o.t === 'lamp' ? 34 : 0, sx, sy });
  }
  for (const it of ITEMS) if (!it.taken) list.push({ d: it.x + it.y - .3, f: () => { const [sx, sy] = iso(it.x, it.y); const on = Math.sin(G.t * 4 + it.x) > .3; ctx.fillStyle = on ? 'rgba(255,240,200,.9)' : 'rgba(255,240,200,.35)'; ctx.fillRect(sx - 1, sy - (it.id === 'phone' ? 13 : 3), 2, 2); if (on) { ctx.fillRect(sx - 3, sy - (it.id === 'phone' ? 12 : 2), 6, 0.6); } } });
  for (const p of G.projs) list.push({ d: p.x + p.y, f: () => { const [sx, sy] = iso(p.x, p.y); ctx.fillStyle = p.kind === 'can' ? '#9aa' : '#d99a2b'; ctx.fillRect(sx - 2, sy - 10 - Math.sin((.5 - p.life) / .5 * Math.PI) * 12, 4, 3); } });
  if (!P.hidden) list.push({ d: pd, f: drawMi });
  if (G.shadow) { const s = G.shadow; list.push({ d: s.x + s.y, f: () => drawSprite(IMG.mi, s.x, s.y, s.dir, { tint: 'rgba(0,0,0,1)', alpha: .85 * (s.a ?? 1), noShadow: true }) }); }
  if (GH.active) list.push({ d: GH.x + GH.y, f: () => drawSprite(...ghSpr(), { bob: GH.moving && GH.frame % 2 ? -1 : 0, jit: GH.state === 'chase' ? (Math.random() - .5) * 2 : 0 }) });
  if (G.scene !== 1 && typeof sceneSprites === 'function') sceneSprites(list);
  list.sort((a, b) => a.d - b.d);
  for (const l of list) l.f(l.tall && l.d > pd + .2 && near(l.sx, l.sy, l.tall) && !P.hidden ? .3 : 1);
  // 光照（DARK＝整體暗幕濃度，太暗玩起來很累 → 2026-10-21 由 .8 調到 .6）
  const fl = G.flash;
  dctx.globalCompositeOperation = 'source-over'; dctx.clearRect(0, 0, VW, VH);
  dctx.fillStyle = `rgba(3,4,10,${DARK - fl * .4})`; dctx.fillRect(0, 0, VW, VH);
  dctx.globalAlpha = 1 - fl * .7; dctx.drawImage(maskC, -Math.round(camX), -Math.round(camY)); dctx.globalAlpha = 1;
  dctx.globalCompositeOperation = 'destination-out';
  const glow = (x, y, r, a) => { const g = dctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(.55, `rgba(0,0,0,${a * .55})`); g.addColorStop(1, 'rgba(0,0,0,0)'); dctx.fillStyle = g; dctx.beginPath(); dctx.arc(x, y, r, 0, 7); dctx.fill(); };
  for (const l of LIGHTS) {
    const lampObj = OBJAT[Math.floor(l.x) + ',' + Math.floor(l.y)];
    if (lampObj && lampObj.t === 'lamp' && lampObj.on === false) continue;
    const [sx, sy] = iso(l.x, l.y); if (sx < -150 || sx > VW + 150 || sy < -150 || sy > VH + 150) continue;
    glow(sx, sy - 4, l.r * 22, .92);
  }
  if (!P.hidden) glow(psx, psy - 18, 52, .7);   // 咪醬周圍的微光（看得到腳邊）
  if (P.light && !P.hidden) {
    const [fx, fy] = SCR[P.dir], ang = Math.atan2(fy * .55, fx), len = 200, spread = .48;
    const g = dctx.createRadialGradient(psx, psy - 14, 6, psx, psy - 14, len);
    g.addColorStop(0, 'rgba(0,0,0,.98)'); g.addColorStop(.7, 'rgba(0,0,0,.8)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = g; dctx.beginPath(); dctx.moveTo(psx, psy - 14); dctx.arc(psx, psy - 14, len, ang - spread, ang + spread); dctx.closePath(); dctx.fill();
  }
  dctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(dark, 0, 0);
  // 光的顏色
  ctx.globalCompositeOperation = 'lighter';
  for (const l of LIGHTS) {
    const lampObj = OBJAT[Math.floor(l.x) + ',' + Math.floor(l.y)];
    if (lampObj && lampObj.t === 'lamp' && lampObj.on === false) continue;
    const [sx, sy] = iso(l.x, l.y); const r = l.r * 22; const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    g.addColorStop(0, `rgba(${l.c},.13)`); g.addColorStop(1, `rgba(${l.c},0)`); ctx.fillStyle = g; ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  // 鬼的剪影（在黑暗中隱約可見）與狀態符號
  if (GH.active && G.mode === 'play') {
    const d = dist(GH.x, GH.y, P.x, P.y);
    if (d < 8) drawSprite(...ghSpr(), { alpha: .14 * (1 - d / 8), noShadow: true });
    const [gx, gy] = iso(GH.x, GH.y);
    const mark = GH.state === 'chase' ? '!' : (GH.sus > .25 || GH.state === 'investigate' || GH.state === 'search') ? '?' : GH.state === 'confused' ? '…' : '';
    if (mark && d < 14) { ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = mark === '!' ? '#ff3b3b' : '#ffd35a'; ctx.fillText(mark, gx, gy - 66); }
  }
  // 雨
  if (!isInside(P.x, P.y)) {
    ctx.strokeStyle = 'rgba(170,185,210,.22)'; ctx.lineWidth = 1; ctx.beginPath();
    for (const r of RAIN) { r.y += r.s / 60; r.x -= r.s / 600; if (r.y > VH) { r.y = -10; r.x = Math.random() * VW; } ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - 1.5, r.y + 7); }
    ctx.stroke();
  }
  if (fl > .5) { ctx.fillStyle = `rgba(200,210,255,${(fl - .5) * .5})`; ctx.fillRect(0, 0, VW, VH); }
  // 躲藏中、危險紅暈
  const vg = ctx.createRadialGradient(VW / 2, VH / 2, VH * .3, VW / 2, VH / 2, VH * .85);
  const dg = G.danger || 0;
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, P.hidden ? 'rgba(0,0,0,.92)' : `rgba(${Math.round(150 * dg)},0,0,${.6 + dg * .2 * (1 + Math.sin(G.t * 8)) / 2})`);
  ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);
  ctx.globalAlpha = .025 + dg * .05; ctx.drawImage(grain[Math.floor(G.t * 20) % 3], 0, 0, VW, VH); ctx.globalAlpha = 1;
}

/* ---------- 主迴圈 ---------- */
let last = performance.now();
function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  update(dt); render();
  requestAnimationFrame(loop);
}

/* ---------- 標題、選單 ---------- */
function stateSummary() { return { mode: G.mode, x: +P.x.toFixed(2), y: +P.y.toFixed(2), hearts: G.hearts, inv: G.inv, ghost: GH.active ? GH.state : 'off', gx: +GH.x.toFixed(1), gy: +GH.y.toFixed(1), flags: G.flags, trig: Object.keys(G.triggers), lock: G.lock, path: GH.path && GH.path.length, scr: GH.script, t: +G.t.toFixed(1) }; }
function resetWorld() {
  if (G.scene !== 1) loadScene(1);
  G.flags = {}; G.triggers = {}; G.inv = { cans: 0, candy: 0, weapon: null, key: false, flashlight: false, phone: false, bandage: 0 }; G.hearts = 5;
  ITEMS.forEach(i => i.taken = false); STATUE.gone = false;
  Object.values(DOORS).forEach(d => { d.locked = !!(d.msg || d.key); });
  Object.assign(P, { x: 27.5, y: 38.7, dir: 0, hidden: null, light: false, crouch: false, stam: 100 });
  GH.active = false; G.candies = []; G.projs = []; G.shadow = null;
}
// 手機按開始時順便全螢幕（Android）
const fsOnStart = () => { if (isTouch && !Q.get('embed')) goFS().catch(() => { }); };
$('#bStart').onclick = () => { stat('start'); audioInit(); fsOnStart(); resetWorld(); $('#title').classList.add('hide'); intro(); };
$('#bCont').onclick = () => { stat('cont'); audioInit(); fsOnStart(); let s = null; try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { } if (!s) return; resetWorld(); G.cp = s; loadCP(s); startPlay(); };
$('#bHelp').onclick = () => $('#help').classList.remove('hide');
/* 章節選擇：玩到哪一章才解鎖（沒玩過序章的人看不到這個按鈕） */
const REACH_KEY = 'yakou_kisaragi_reach';
function getReach() {
  let r = 1;
  try { r = Math.max(r, +localStorage.getItem(REACH_KEY) || 1); const sv = JSON.parse(localStorage.getItem(SAVE_KEY)); if (sv && sv.scene) r = Math.max(r, sv.scene); } catch (e) { }
  return r;
}
function markReach(n) { if (TEST) return; try { if (n > (+localStorage.getItem(REACH_KEY) || 1)) localStorage.setItem(REACH_KEY, String(n)); } catch (e) { } }
function refreshChapBtn() {
  const r = getReach(); $('#bChap').classList.toggle('hide', r < 2);
  document.querySelectorAll('#chapSel [data-ch]').forEach(b => b.classList.toggle('hide', +b.dataset.ch > r));
}
async function startFrom(ch) {
  stat('chap', String(ch));
  audioInit(); fsOnStart(); resetWorld();
  $('#chapSel').classList.add('hide'); $('#title').classList.add('hide');
  if (ch === 1) return intro();
  G.inv.flashlight = true; G.inv.phone = true;   // 第一章結束時身上一定有的東西
  if (ch === 3) G.inv.pages = [1, 2];             // 第二章（上）拿到的兩頁日記
  startPlay();
  if (ch === 2) await startCh2(); else await startCh2b();
}
$('#bChap').onclick = () => { refreshChapBtn(); $('#chapSel').classList.remove('hide'); };
$('#bChapBack').onclick = () => $('#chapSel').classList.add('hide');
document.querySelectorAll('#chapSel [data-ch]').forEach(b => b.onclick = () => startFrom(+b.dataset.ch));
refreshChapBtn();
stat('open');
// 主題曲：一打開就自動播放；被瀏覽器擋下（還沒互動過不准出聲）才顯示「點擊畫面進入」入口
const gateOpen = () => {
  const g = $('#gate'); if (g.classList.contains('hide') || g.classList.contains('out')) return;
  audioInit(); themePlay(); g.classList.add('out'); setTimeout(() => { g.classList.add('hide'); g.classList.remove('out'); }, 850);
};
// 入口畫面：場景框依畫面比例做 cover（動畫層才會對準圖上的手機、出口燈、窗戶）
function gateFit() { const g = $('#gate'), sc = $('#gate .gscene'), r = 1376 / 768; if (!g.clientWidth) return; const w = Math.max(g.clientWidth, g.clientHeight * r); sc.style.width = w + 'px'; }
addEventListener('resize', () => setTimeout(gateFit, 50));
// 入口畫面的雜訊顆粒（監視器感）
(function gateNoise() {
  const cv = $('#gate .gnoise'), g = cv.getContext('2d'), img = g.createImageData(cv.width, cv.height);
  setInterval(() => {
    if ($('#gate').classList.contains('hide')) return;
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
  }, 90);
})();
// 手機觸控的 pointerdown 不算「使用者操作」（要手指放開才算），在 pointerdown 裡 play() 會被擋 → 一律用 click
$('#gate').addEventListener('click', gateOpen);
// 每次打開都先顯示入口畫面（測試模式除外）；瀏覽器允許的話主題曲先在入口畫面後面響起，點擊進入時一定會播
if (!TEST || Q.get('gate')) { $('#gate').classList.remove('hide'); setTimeout(gateFit, 0); }
if (!TEST && THEME.on) themePlay();
$('#title').addEventListener('click', () => { audioInit(); themePlay(); });
// 保險：標題畫面上任何一次放開手指／點擊，音樂沒在播就補播（也順便解鎖音效）
const themeRetry = () => { audioInit(); if (THEME.on && !$('#title').classList.contains('hide') && $('#gate').classList.contains('hide') && (!THEME.el || THEME.el.paused)) themePlay(); };
addEventListener('touchend', themeRetry, { passive: true }); addEventListener('pointerup', themeRetry);
addEventListener('keydown', () => { if (!$('#gate').classList.contains('hide')) gateOpen(); else if (!$('#title').classList.contains('hide')) themePlay(); });
/* 聲音設定面板：標題右上「⚙ 聲音」、遊戲中右上 ⚙（打開時遊戲暫停） */
let sndPaused = false;
function openSnd() {
  $('#volM').value = Math.round(VOL.m * 100); $('#volS').value = Math.round(VOL.s * 100); sndLabels();
  if (G.mode === 'play' && !sndPaused) { sndPaused = true; G.lock++; }
  $('#snd').classList.remove('hide');
}
function closeSnd() { $('#snd').classList.add('hide'); if (sndPaused) { sndPaused = false; G.lock = Math.max(0, G.lock - 1); } }
function sndLabels() { $('#volMv').textContent = VOL.m ? Math.round(VOL.m * 100) : '關'; $('#volSv').textContent = VOL.s ? Math.round(VOL.s * 100) : '關'; }
$('#volM').addEventListener('input', e => {
  VOL.m = e.target.value / 100; const was = THEME.on; THEME.on = VOL.m > 0; saveVol(); sndLabels();
  if (THEME.el) THEME.el.volume = VOL.m;
  const onTitle = !$('#title').classList.contains('hide') || !$('#end').classList.contains('hide');
  if (!THEME.on) themeStop(.3); else if (!was && onTitle) themePlay();
});
$('#volS').addEventListener('input', e => {
  VOL.s = e.target.value / 100; saveVol(); sndLabels();
  if (A.master) A.master.gain.value = .85 * VOL.s;
});
$('#volS').addEventListener('change', () => { audioInit(); sfx.pick(); });   // 放開時試聽
$('#bTheme').addEventListener('click', e => { e.stopPropagation(); openSnd(); });
$('#bSnd').addEventListener('click', e => { e.stopPropagation(); openSnd(); });
$('#bSndClose').addEventListener('click', e => { e.stopPropagation(); closeSnd(); });
new MutationObserver(() => { if (!$('#end').classList.contains('hide')) { themePlay(true); stat('end', $('#end h2').textContent); } }).observe($('#end'), { attributes: true, attributeFilter: ['class'] });
$('#bA2hsBack').onclick = () => $('#a2hs').classList.add('hide');
// 手機在部落格裡（iframe）畫面太小：提供全螢幕／新分頁開啟；iPhone 直接開網頁時教加入主畫面
if (Q.get('embed') && isTouch) {
  const bf = $('#bFull'); bf.classList.remove('hide');
  bf.onclick = () => { audioInit(); if (canFS) goFS().catch(() => window.open(location.pathname, '_blank')); else window.open(location.pathname, '_blank'); };
} else if (isIPhone && !isStandalone) {
  const bf = $('#bFull'); bf.classList.remove('hide'); bf.onclick = showA2hs;
}
$('#bHelpBack').onclick = () => $('#help').classList.add('hide');
$('#bRetry').onclick = () => { $('#over').classList.add('hide'); loadCP(G.cp); startPlay(); };
const toTitle = () => { location.href = location.pathname + location.search; };
$('#bToTitle').onclick = toTitle; $('#bEndTitle').onclick = toTitle;
try { if (localStorage.getItem(SAVE_KEY)) $('#bCont').classList.remove('hide'); } catch (e) { }
const BLOG = 'https://cashkingw.blogspot.com/2026/10/444.html';
if (!Q.get('embed')) $('#foot').innerHTML = `戴上耳機遊玩效果最佳　｜　<a href="${Q.get('blog') || BLOG}" target="_top" style="pointer-events:auto">Cash城部落格</a>`;

loadImages(['anatomy', 'tvwoman', 'beethoven', 'hanako', 'ninomiya_walk', 'mi', 'mi_crouch', 'mi_hurt', 'mi_throw', 'mi_light', 'mi_down', 'kuchisake', 'kuchisake_chase', 'kuchisake_atk', 'ninomiya', 'floors', 'floors2', 'walls', 't_tree', 't_dead1', 't_dead2', 't_dead3', 't_bush1', 't_bush2', 't_bush3', 't_cypress', 't_lamp', 't_rack', 't_bike', 't_bench1', 't_bench2', 't_trash', 't_fount', 't_board']).then(() => {
  buildFloor();
  if (IMG.mi) IMG.mi.rows = 9;
  for (const [k, r] of [['mi_crouch', 4], ['mi_hurt', 2], ['mi_throw', 2], ['mi_light', 1], ['mi_down', 1], ['kuchisake_atk', 4], ['ninomiya_walk', 4], ['anatomy', 4]]) if (IMG[k]) IMG[k].rows = r;
  if (TEST && TEST !== 'shot') { setInterval(() => { update(1 / 30); }, 8); setInterval(render, 200); runTest(TEST); }
  else { requestAnimationFrame(loop); if (TEST) runTest(TEST); }
});

/* ---------- 自動測試（?test=...） ---------- */
async function runTest(kind) {
  const tp = (x, y) => { P.x = x; P.y = y; };
  try {
    resetWorld(); G.mode = 'play'; startPlay();
    if (kind === 'ch2') return testCh2();
    if (kind === 'ch2load') return testCh2Load();
    if (kind === 'ch2b') return testCh2b();
    if (kind === 'chap') {   // 章節選擇：直接從第二章（上）、（下）開始
      await startFrom(2); await waitFree(); const a = G.scene === 2 && G.inv.flashlight && G.mode === 'play';
      await startFrom(3); await waitFree(); const b = G.scene === 3 && G.inv.pages.length === 2 && !$('#hud').classList.contains('hide');
      document.title = (a && b ? 'PASS ' : 'FAIL ') + JSON.stringify(stateSummary()); return;
    }
    if (kind === 'comic') { intro(); document.title = 'COMIC'; return; }
    if (kind === 'shot') { if (Q.get('scene')) loadScene(+Q.get('scene')); tp(Number(Q.get('x') || 27.5), Number(Q.get('y') || 30)); P.dir = 0; G.inv.flashlight = true; P.light = true; if (Q.get('ghost')) { const ch = Q.get('ghost') === 'chase'; spawnGhost(P.x - (ch ? 6 : 2), P.y - (ch ? 6 : 2)); GH.state = ch ? 'chase' : 'pause'; GH.timer = 99; GH.dir = 4; } if (Q.get('crouch')) P.crouch = true; if (Q.get('pose')) setPose(Q.get('pose')); if (Q.get('atk')) GH.atkLoop = true; if (Q.get('dir')) P.dir = +Q.get('dir'); if (Q.get('hold')) { G.inv.weapon = { id: 'broom', name: '掃把', dur: 2 }; G.inv.candy = 2; catchPlayer(false); } document.title = 'SHOT'; return; }
    if (kind === 'chase') {
      G.flags.log = true; G.inv.flashlight = true; P.light = true; G.inv.candy = 1; G.inv.weapon = { id: 'broom', name: '掃把', dur: 2 };
      spawnGhost(9.5, 20.5); tp(9.5, 24.5); P.dir = 0; GH.state = 'pauseLook'; GH.timer = 9; GH.look = -9; GH.dir = dirFromWorld(P.x - GH.x, P.y - GH.y);
      const want = Q.get('pick') || '普普通通'; let picked = '';
      TEST_CHOICE = o => { const i = o.findIndex(t => t.includes(want)); picked = o.join('/'); return i < 0 ? 0 : i; };
      const t0 = G.t; while (G.t - t0 < 8 && GH.state !== 'confused' && GH.state !== 'stun' && GH.state !== 'search') await wait(20);
      document.title = 'CHASE ' + GH.state + ' opts=' + picked + ' ' + JSON.stringify(stateSummary()); return;
    }
    // 劇情全流程：警衛室 → 日誌 → 器材小屋 → 側門 → 教室 → 手機 → 躲藏 → 結束
    tp(27.5, 36); await wait(50); await waitFree();
    tp(30.5, 33.5); await waitFree(); P.dir = 6;
    tp(32.4, 34.3); await wait(20); await interact(); await waitFree();
    tp(32.6, 33.6); for (let k = 0; k < 3 && !G.flags.log; k++) { await interact(); await waitFree(); }
    if (!G.flags.log) throw 'log not read';
    tp(5.5, 34.4); await wait(20); await interact(); await waitFree();
    if (!STATUE.gone) throw 'key not taken';
    GH.active = false;
    tp(8.5, 13.4); await wait(20); await interact(); await waitFree();
    if (DOORS['8,12'].locked) throw 'side door locked';
    tp(8.5, 10.5); await wait(60); await waitFree();
    tp(18.5, 7.5); await wait(60); await waitFree();
    tp(18.5, 7.2); await interact();
    await waitFree();
    // 躲到置物櫃
    tp(17.5, 8.0 - .9); P.y = 6.6; P.x = 17.5;
    hide(OBJAT['17,7']);
    const t0 = performance.now();
    while (G.mode === 'play' && G.scene === 1 && performance.now() - t0 < 60000) await wait(100);
    document.title = (G.mode === 'end' || G.scene === 2 ? 'PASS ' : 'FAIL ') + JSON.stringify(stateSummary());
  } catch (e) { document.title = 'ERR ' + e + ' ' + JSON.stringify(stateSummary()); }
}
async function waitFree() { for (let i = 0; i < 400 && G.lock; i++) await wait(20); }
