/* ================= bigprops.js：大升級第4階段「大型物件美術」（2026-11-11） =================
   大張的手繪立面圖依地圖格子切成直條，一格一格貼在牆面上（仍走 drawWall 的排序，角色前後遮擋正確）。
   bpFaceL(img, i, n, x, y, h)：x 方向的牆面（L 面，朝 +y＝面向鏡頭左下），第 i 條／共 n 條，貼在格子 (x,y) 的 L 面
   bpFaceR(img, i, n, x, y, h)：y 方向的牆面（R 面，朝 +x），圖片左邊＝靠鏡頭那端（y 大）
   ① 警衛室（第一章 31–34, 32–35）：assets/guard_f.png（南面接待窗）、guard_s.png（東面冷氣／公告欄），tools/guard_tex.py 產生 */
loadImages(['guard_f', 'guard_s']);

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
const BP_ROOF = { a: 1 };
function bpRoof() {
  const g = BP_GUARD, h = WALLH, o = .1;
  const inG = P.x >= g.x0 && P.x < g.x1 + 1 && P.y >= g.y0 && P.y < g.y1 + 1;
  const [psx, psy] = iso(P.x, P.y), [cx, cy] = iso(g.x0 + 2, g.y0 + 2);
  const behind = P.x + P.y < g.x1 + g.y1 + 1 && Math.abs(psx - cx) < 46 && psy < cy + 20 && psy > cy - 60;
  const tgt = inG ? 0 : behind && !P.hidden ? .3 : 1;
  BP_ROOF.a += (tgt - BP_ROOF.a) * .15;
  if (BP_ROOF.a < .02) return;
  const up = ([x, y]) => [x, y - h];
  const A = up(iso(g.x0 - o, g.y0 - o)), B = up(iso(g.x1 + 1 + o, g.y0 - o)), C = up(iso(g.x1 + 1 + o, g.y1 + 1 + o)), D = up(iso(g.x0 - o, g.y1 + 1 + o));
  ctx.globalAlpha = BP_ROOF.a;
  // 屋簷厚度（前、右兩面）
  const th = 3, dn = p => [p[0], p[1] + th];
  poly([D, C, dn(C), dn(D)], '#5f5a52'); poly([C, B, dn(B), dn(C)], '#4a463f');
  // 屋頂面：水泥板＋防水層的格線、積水反光
  poly([A, B, C, D], '#77736b');
  ctx.strokeStyle = 'rgba(40,38,34,.35)'; ctx.lineWidth = 1;
  for (let k = 1; k < 4; k++) {
    const t = k / 4, p1 = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t], p2 = [D[0] + (C[0] - D[0]) * t, D[1] + (C[1] - D[1]) * t];
    ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
  }
  const [wx, wy] = up(iso(g.x0 + 2.6, g.y0 + 2.4));
  ctx.fillStyle = 'rgba(150,165,190,.18)'; ctx.beginPath(); ctx.ellipse(wx, wy, 9, 3.5, 0, 0, 7); ctx.fill();
  // 屋頂上的小東西：通風管、天線
  const [vx, vy] = up(iso(g.x0 + .9, g.y0 + 1.1));
  ctx.fillStyle = '#56524b'; ctx.fillRect(vx - 2, vy - 6, 4, 6); ctx.fillStyle = '#3c3934'; ctx.fillRect(vx - 3, vy - 7, 6, 2);
  const [ax, ay] = up(iso(g.x1 + .6, g.y0 + .5));
  ctx.strokeStyle = '#2e2c29'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay - 14); ctx.moveTo(ax - 4, ay - 11); ctx.lineTo(ax + 4, ay - 11); ctx.moveTo(ax - 3, ay - 8); ctx.lineTo(ax + 3, ay - 8); ctx.stroke();
  // 前緣的亮邊
  ctx.strokeStyle = 'rgba(210,205,190,.3)'; ctx.beginPath(); ctx.moveTo(D[0], D[1]); ctx.lineTo(C[0], C[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
  ctx.globalAlpha = 1;
}
{ const _cs = typeof coopSprites === 'function' ? coopSprites : null;
  coopSprites = function (list) { if (_cs) _cs(list); if (G.scene === 1 && IMG.guard_f) list.push({ d: BP_GUARD.x1 + BP_GUARD.y1 + 1.05, f: bpRoof }); }; }
