/* ================= bigprops.js：大升級第4階段「大型物件美術」（2026-11-11） =================
   大張的手繪立面圖依地圖格子切成直條，一格一格貼在牆面上（仍走 drawWall 的排序，角色前後遮擋正確）。
   bpFaceL(img, i, n, x, y, h)：x 方向的牆面（L 面，朝 +y＝面向鏡頭左下），第 i 條／共 n 條，貼在格子 (x,y) 的 L 面
   bpFaceR(img, i, n, x, y, h)：y 方向的牆面（R 面，朝 +x），圖片左邊＝靠鏡頭那端（y 大）
   ① 警衛室（第一章 31–34, 32–35）：assets/guard_f.png（南面接待窗）、guard_s.png（東面冷氣／公告欄），tools/guard_tex.py 產生 */
loadImages(['guard_f', 'guard_s', 'school_f']);

function bpFaceL(img, i, n, x, y, h) {
  const sw = img.width / n, [X, Y] = iso(x, y + 1);
  ctx.setTransform(16 / sw, 8 / sw, 0, h / img.height, X, Y - h);
  ctx.drawImage(img, i * sw, 0, sw + .5, img.height, 0, 0, sw + .5, img.height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
function bpFaceR(img, i, n, x, y, h) {
  const sw = img.width / n, [X, Y] = iso(x + 1, y + 1);
  ctx.setTransform(16 / sw, -8 / sw, 0, h / img.height, X, Y - h);
  ctx.drawImage(img, i * sw, 0, sw + .5, img.height, 0, 0, sw + .5, img.height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/* 在牆面上畫一塊（u 沿牆 0..1、v 由下往上 0..1 的比例）：給發光窗戶用 */
function bpFacePoly(side, x0, x1, y, v0, v1, h, col) {   // side L：x0..x1 是世界 x、y 是牆的前緣；R：x0..x1 是世界 y（由大到小）、y 是牆的 x
  const p = side === 'L' ? [iso(x0, y), iso(x1, y)] : [iso(y, x0), iso(y, x1)];
  poly([[p[0][0], p[0][1] - v0 * h], [p[1][0], p[1][1] - v0 * h], [p[1][0], p[1][1] - v1 * h], [p[0][0], p[0][1] - v1 * h]], col);
}

const BP_GUARD = { x0: 31, x1: 34, y0: 32, y1: 35 };
const bpInGuard = (x, y) => G.scene === 1 && x >= BP_GUARD.x0 && x <= BP_GUARD.x1 && y >= BP_GUARD.y0 && y <= BP_GUARD.y1;

{ const _w = typeof sceneWall === 'function' ? sceneWall : null;
  sceneWall = function (x, y) {
    if (bpSchool(x, y)) return true;
    if (bpInGuard(x, y) && at(x, y) === '#' && IMG.guard_f && IMG.guard_s && (y === BP_GUARD.y1 || x === BP_GUARD.x1)) {
      const h = WALLH;
      if (y === BP_GUARD.y1) {
        bpFaceL(IMG.guard_f, x - BP_GUARD.x0, 4, x, y, h);
        const [a, b] = iso(x, y + 1), [c, d] = iso(x + 1, y + 1); poly([[a, b], [c, d], [c, d - h], [a, b - h]], 'rgba(0,0,0,.08)');
      }
      if (x === BP_GUARD.x1) {
        bpFaceR(IMG.guard_s, BP_GUARD.y1 - y, 4, x, y, h);
        const [a, b] = iso(x + 1, y + 1), [c, d] = iso(x + 1, y); poly([[a, b], [c, d], [c, d - h], [a, b - h]], 'rgba(0,0,0,.36)');
      }
      box(x, y, 1, 1, h, '#8a8478', null, null);
      // 屋頂邊緣的水泥壓條（讓頂面不像切開的磚塊）
      const [a, b] = iso(x, y), [c, d] = iso(x + 1, y), [e, f] = iso(x + 1, y + 1), [g, k] = iso(x, y + 1);
      ctx.strokeStyle = 'rgba(200,195,180,.35)'; ctx.lineWidth = 1;
      ctx.beginPath();
      if (y === BP_GUARD.y1) { ctx.moveTo(g, k - h + .5); ctx.lineTo(e, f - h + .5); }
      if (x === BP_GUARD.x1) { ctx.moveTo(e, f - h + .5); ctx.lineTo(c, d - h + .5); }
      ctx.stroke();
      return true;
    }
    return _w ? _w(x, y) : false;
  }; }

/* 暗幕之後：亮著的窗戶自己發光（不被夜色壓暗）＋窗前地面一塊暖光 */
function bpGlow() {
  if (G.scene !== 1 || !IMG.guard_f) return;
  const gx = BP_GUARD, inG = P.x >= gx.x0 && P.x < gx.x1 + 1 && P.y >= gx.y0 && P.y < gx.y1 + 1;
  if (inG) return;
  const fl = .85 + .15 * Math.sin(G.t * 7.3) * Math.sin(G.t * 2.1), h = WALLH;
  ctx.globalCompositeOperation = 'lighter';
  // 南面接待窗：圖上 33%–67%、高度 34%–74%
  const wx0 = gx.x0 + 4 * .335, wx1 = gx.x0 + 4 * .665, fy = gx.y1 + 1;
  bpFacePoly('L', wx0, wx1, fy, .34, .74, h, `rgba(255,214,130,${.22 * fl})`);
  // 窗前地面的光
  const [cx, cy] = iso((wx0 + wx1) / 2, fy + .9), g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 34);
  g.addColorStop(0, `rgba(255,205,120,${.16 * fl})`); g.addColorStop(1, 'rgba(255,205,120,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, 34, 15, 0, 0, 7); ctx.fill();
  // 東面鐵窗：圖上 10%–31%、高度 42%–80%（圖左＝靠鏡頭 y 大）
  const sy0 = gx.y1 + 1 - 4 * .10, sy1 = gx.y1 + 1 - 4 * .31;
  bpFacePoly('R', sy0, sy1, gx.x1 + 1, .42, .8, h, `rgba(255,214,140,${.14 * fl})`);
  ctx.globalCompositeOperation = 'source-over';
}
{ const _a = typeof ltAfterDark === 'function' ? ltAfterDark : null;
  if (_a) ltAfterDark = function (psx, psy) { _a(psx, psy); bpGlow(); }; }

/* 警衛室屋頂：人在外面時蓋上（遮住空心的牆頂），走進去或走到它後面時變淡 */
const BP_ROOFS = [{ ...BP_GUARD, a: 1 }, { x0: 3, x1: 7, y0: 32, y1: 35, a: 1, shed: 1 }];   // 警衛室、器材小屋
function bpRoof(g) {
  const h = WALLH, o = .1;
  const inG = P.x >= g.x0 && P.x < g.x1 + 1 && P.y >= g.y0 && P.y < g.y1 + 1;
  const [psx, psy] = iso(P.x, P.y), [cx, cy] = iso((g.x0 + g.x1 + 1) / 2, (g.y0 + g.y1 + 1) / 2);
  const behind = P.x + P.y < g.x1 + g.y1 + 1 && Math.abs(psx - cx) < 16 * (g.x1 - g.x0 + 2) && psy < cy + 20 && psy > cy - 60;
  const tgt = inG ? 0 : behind && !P.hidden ? .3 : 1;
  g.a += (tgt - g.a) * .15;
  if (g.a < .02) return;
  const up = ([x, y]) => [x, y - h];
  const A = up(iso(g.x0 - o, g.y0 - o)), B = up(iso(g.x1 + 1 + o, g.y0 - o)), C = up(iso(g.x1 + 1 + o, g.y1 + 1 + o)), D = up(iso(g.x0 - o, g.y1 + 1 + o));
  ctx.globalAlpha = g.a;
  // 屋簷厚度（前、右兩面）
  const th = 3, dn = p => [p[0], p[1] + th];
  poly([D, C, dn(C), dn(D)], '#5f5a52'); poly([C, B, dn(B), dn(C)], '#4a463f');
  // 屋頂面：水泥板＋防水層的格線、積水反光
  poly([A, B, C, D], '#77736b');
  ctx.strokeStyle = 'rgba(40,38,34,.35)'; ctx.lineWidth = 1;
  const nk = g.x1 - g.x0 + 1;
  for (let k = 1; k < nk; k++) {
    const t = k / nk, p1 = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t], p2 = [D[0] + (C[0] - D[0]) * t, D[1] + (C[1] - D[1]) * t];
    ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
  }
  const [wx, wy] = up(iso(g.x0 + 2.6, g.y0 + 2.4));
  ctx.fillStyle = 'rgba(150,165,190,.18)'; ctx.beginPath(); ctx.ellipse(wx, wy, 9, 3.5, 0, 0, 7); ctx.fill();
  // 屋頂上的小東西：通風管、天線
  const [vx, vy] = up(iso(g.x0 + .9, g.y0 + 1.1));
  ctx.fillStyle = '#56524b'; ctx.fillRect(vx - 2, vy - 6, 4, 6); ctx.fillStyle = '#3c3934'; ctx.fillRect(vx - 3, vy - 7, 6, 2);
  if (!g.shed) {
  const [ax, ay] = up(iso(g.x1 + .6, g.y0 + .5));
  ctx.strokeStyle = '#2e2c29'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay - 14); ctx.moveTo(ax - 4, ay - 11); ctx.lineTo(ax + 4, ay - 11); ctx.moveTo(ax - 3, ay - 8); ctx.lineTo(ax + 3, ay - 8); ctx.stroke();
  }
  // 前緣的亮邊
  ctx.strokeStyle = 'rgba(210,205,190,.3)'; ctx.beginPath(); ctx.moveTo(D[0], D[1]); ctx.lineTo(C[0], C[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
  ctx.globalAlpha = 1;
}
{ const _cs = typeof coopSprites === 'function' ? coopSprites : null;
  coopSprites = function (list) { if (_cs) _cs(list); if (G.scene === 1 && IMG.guard_f) for (const g of BP_ROOFS) list.push({ d: g.x1 + g.y1 + 1.05, f: () => bpRoof(g) }); }; }

/* ② 看台（第一章 x=1 上層、x=2 下層，y=18–30，y=24 是走道）：程式逐格畫
   水泥階梯＋立面水漬、褪色的塑膠座椅（偶爾缺一張、一張是紅的）、上層後方欄杆、走道兩側的端牆 */
const bpH = (x, y, k = 0) => ((x * 73856093) ^ (y * 19349663) ^ (k * 83492791)) >>> 0;
function bpSeat(sx, sy, z, col) {   // 座椅面向 +x（面向操場）：sx,sy＝世界座標中心
  const q = (dx, dy, dz) => { const [a, b] = iso(sx + dx, sy + dy); return [a, b - z - dz]; };
  poly([q(-.14, -.13, 3), q(.14, -.13, 3), q(.14, .13, 3), q(-.14, .13, 3)], col[0]);            // 座面
  poly([q(-.14, -.13, 3), q(-.14, .13, 3), q(-.14, .13, 9), q(-.14, -.13, 9)], col[1]);           // 椅背
  poly([q(-.14, .13, 3), q(.14, .13, 3), q(.14, .13, 2), q(-.14, .13, 2)], col[2]);              // 座面前緣
  const [a, b] = iso(sx, sy); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(a - 1, b - z - 2, 2, 2);  // 支腳
}
const BP_SEATC = { blue: ['#46627c', '#3a5269', '#2c3e50'], red: ['#7c3a3a', '#673030', '#4a2222'], grey: ['#6c6e70', '#5a5c5e', '#444648'] };
function bpBleach(o) {
  const { x, y } = o, low = !!o.hideOnly, h = low ? 9 : 18;
  // 水泥本體
  box(x, y, 1, 1, h, '#6f6b63', y === 30 || y === 23 ? '#4f4b45' : null, '#4a4640');
  // 立面（朝操場的 R 面）：模板接縫、水漬往下流
  const [rx0, ry0] = iso(x + 1, y + 1), [rx1, ry1] = iso(x + 1, y);
  ctx.fillStyle = 'rgba(20,20,18,.28)';
  for (let k = 0; k < 3; k++) { const t = (bpH(x, y, k) % 100) / 100, len = 3 + bpH(x, y, k + 9) % (h - 3); const px = rx0 + (rx1 - rx0) * t, py = ry0 + (ry1 - ry0) * t; ctx.fillRect(Math.round(px), Math.round(py - h), 1, len); }
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(rx0, ry0 - h + 1.5); ctx.lineTo(rx1, ry1 - h + 1.5); ctx.stroke();   // 踏面前緣的陰影
  ctx.strokeStyle = 'rgba(190,185,170,.3)'; ctx.beginPath(); ctx.moveTo(rx0, ry0 - h + .5); ctx.lineTo(rx1, ry1 - h + .5); ctx.stroke();
  if (y === 30 || y === 23) {   // 端牆：一道裂縫
    const [lx, ly] = iso(x + .55, y + 1); ctx.strokeStyle = 'rgba(15,15,14,.5)'; ctx.beginPath(); ctx.moveTo(lx, ly - h + 2); ctx.lineTo(lx + 2, ly - h + 6); ctx.lineTo(lx + 1, ly - h + 9); ctx.stroke();
  }
  // 座椅：每格兩張
  for (let k = 0; k < 2; k++) {
    const hv = bpH(x, y, k + 3) % 23; if (hv === 0) continue;   // 缺一張
    const c = hv === 7 && !low ? BP_SEATC.red : hv % 9 === 4 ? BP_SEATC.grey : BP_SEATC.blue;
    bpSeat(x + .6, y + .27 + k * .46, h, c);
  }
  // 上層後方欄杆
  if (!low) {
    const [a, b] = iso(x + .08, y), [c2, d] = iso(x + .08, y + 1);
    ctx.fillStyle = '#3a3c3e'; ctx.fillRect(Math.round(a), Math.round(b - h - 13), 1, 13);
    if (y === 30 || y === 23) ctx.fillRect(Math.round(c2), Math.round(d - h - 13), 1, 13);
    ctx.strokeStyle = '#4a4c4f'; ctx.beginPath(); ctx.moveTo(a, b - h - 12.5); ctx.lineTo(c2, d - h - 12.5); ctx.moveTo(a, b - h - 6.5); ctx.lineTo(c2, d - h - 6.5); ctx.stroke();
  }
}
{ const _dp = typeof drawProp === 'function' ? drawProp : null;
  drawProp = function (o, cx, cy, shaking) {
    if (o.t === 'bleach' && G.scene === 1) { bpBleach(o); return true; }
    return _dp ? _dp(o, cx, cy, shaking) : false;
  }; }

/* ③ 校舍外牆（第一章 正面 y=12、東側 x=38）：assets/school_f.png 8 格一循環（tools/guard_tex.py） */
function bpSchool(x, y) {
  if (G.scene !== 1 || !IMG.school_f || at(x, y) !== '#') return false;
  const front = y === 12 && x >= 1 && x <= 38 && !['#', 'D'].includes(at(x, y + 1));
  const east = x === 38 && y >= 1 && y <= 12 && !['#', 'D'].includes(at(x + 1, y));
  if (!front && !east) return false;
  const h = WALLH;
  if (front) {
    bpFaceL(IMG.school_f, (x - 1) % 8, 8, x, y, h);
    const [a, b] = iso(x, y + 1), [c, d] = iso(x + 1, y + 1); poly([[a, b], [c, d], [c, d - h], [a, b - h]], 'rgba(0,0,0,.12)');
    if (x === 26) {   // 正門上方的時鐘（原本 drawWall 畫的）
      const [sx, sy] = iso(x + .5, y + 1); ctx.fillStyle = '#d8d2c0'; ctx.beginPath(); ctx.ellipse(sx, sy - 24, 5, 5, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#222'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx, sy - 24); ctx.lineTo(sx - 3, sy - 25); ctx.moveTo(sx, sy - 24); ctx.lineTo(sx + 1, sy - 28); ctx.stroke();
    }
  }
  if (east) {
    bpFaceR(IMG.school_f, (12 - y + 3) % 8, 8, x, y, h);
    const [a, b] = iso(x + 1, y + 1), [c, d] = iso(x + 1, y); poly([[a, b], [c, d], [c, d - h], [a, b - h]], 'rgba(0,0,0,.4)');
  }
  box(x, y, 1, 1, h, '#8d8475', null, null);
  return true;
}
