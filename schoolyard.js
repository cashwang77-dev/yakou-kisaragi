/* 夜校・如月　第一章：操場（2026-10-23 使用者：操場不像操場）
   地面：紅褐色 PU 跑道（白色分道線、起跑線）、內圈草地（中線、中圈）。
   設施（Gemini 等角圖 y_*.png，tools/props_cut.py 切）：足球門、旗桿、司令台、單槓、攀爬架、跨欄、畫線車、記分板。
   開機時第一章已經建好 → 這裡載入後補建一次。載入順序：gym.js 之後。 */

const TRACK = { cx: 9.5, cy: 25, rx: 5.6, ry: 7.8, w: 1.4 };
const YARD = [   // [類型, x, y, 擋路, 調查文字]
  ['goal', 9, 19, true, ['足球門。網子破了一個大洞。', '……球門裡面，好像有人站著。']],
  ['goal', 9, 30, true, null, 1],   // 第 6 欄：鏡像（兩座球門面對面）
  ['flag', 15, 17, true, ['旗桿。繩子在風裡「鏘、鏘」地敲著桿子。', '旗子是白的。……白天升的明明是校旗。']],
  ['stage', 15, 24, true, ['司令台。朝會的時候，校長站在這裡講話。', '台上留著一雙室內鞋，整整齊齊地擺著。']],
  ['bars', 12, 35, true, null], ['jungle', 14, 33, true, null],
  ['hurdle', 4, 22, false, null], ['hurdle', 4, 28, false, null],
  ['cart', 11, 34, false, null], ['score', 2, 16, true, ['記分板。最後一場比賽的分數還留在上面……', '不對，板子是空白的。是我看錯了。']],
];
function buildYard() {
  for (const [t, x, y, solid, lines, flip] of YARD) if (!OBJAT[x + ',' + y]) obj('y_' + t, x, y, Object.assign({ solid, flip: !!flip }, lines ? { g1: 1, act: 'yard', label: '看看', lines } : {}));
}
{ const _b = SCENES[1]; SCENES[1] = function () { _b(); buildYard(); }; }
if (G.scene === 1 && !OBJ.some(o => o.t === 'y_goal')) { buildYard(); indexObjs(); }
loadImages(YARD.map(y => 'y_' + y[0]).filter((v, i, a) => a.indexOf(v) === i));

/* ---------- 地面：跑道與球場 ---------- */
function ellipsePath(g, rx, ry, steps = 96) {
  for (let i = 0; i <= steps; i++) { const a = i / steps * Math.PI * 2, [x, y] = isoW(TRACK.cx + rx * Math.cos(a), TRACK.cy + ry * Math.sin(a)); i ? g.lineTo(x, y) : g.moveTo(x, y); }
}
function drawTrack(g) {
  const { rx, ry, w } = TRACK;
  // 跑道（外圈減內圈）
  g.save(); g.beginPath(); ellipsePath(g, rx, ry); ellipsePath(g, rx - w, ry - w); g.fillStyle = '#6e3a2c'; g.fill('evenodd');
  // 內圈：草地
  g.beginPath(); ellipsePath(g, rx - w, ry - w); g.fillStyle = '#2c4627'; g.fill();
  g.strokeStyle = 'rgba(70,110,60,.35)'; g.lineWidth = 6;   // 割草的條紋
  for (let k = -5; k <= 5; k += 2) { const [a, b] = isoW(TRACK.cx - (rx - w) + .3, TRACK.cy + k), [c, d] = isoW(TRACK.cx + (rx - w) - .3, TRACK.cy + k); g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
  g.restore();
  // 分道線、起跑線
  g.strokeStyle = 'rgba(235,230,215,.55)'; g.lineWidth = 1;
  for (const k of [0, .47, .93, 1.4]) { g.beginPath(); ellipsePath(g, rx - k, ry - k); g.stroke(); }
  for (let k = 0; k < 4; k++) { const [a, b] = isoW(TRACK.cx + rx - .05, TRACK.cy + .2 + k * .12), [c, d] = isoW(TRACK.cx + rx - w + .05, TRACK.cy + .2 + k * .12); g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
  // 球場線：中線、中圈、禁區
  g.strokeStyle = 'rgba(235,235,225,.45)';
  { const [a, b] = isoW(TRACK.cx - (rx - w), TRACK.cy), [c, d] = isoW(TRACK.cx + (rx - w), TRACK.cy); g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
  g.beginPath(); for (let i = 0; i <= 40; i++) { const t = i / 40 * Math.PI * 2, [x, y] = isoW(TRACK.cx + 1.4 * Math.cos(t), TRACK.cy + 1.4 * Math.sin(t)); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  for (const sy of [-1, 1]) { const y0 = TRACK.cy + sy * (ry - w - .1), y1 = TRACK.cy + sy * (ry - w - 2.2); const P4 = [[TRACK.cx - 2, y0], [TRACK.cx - 2, y1], [TRACK.cx + 2, y1], [TRACK.cx + 2, y0]].map(([x, y]) => isoW(x, y)); g.beginPath(); g.moveTo(...P4[0]); P4.slice(1).forEach(p => g.lineTo(...p)); g.stroke(); }
}
{ const _f = sceneFloor; sceneFloor = function (g) { if (G.scene === 1) drawTrack(g); return _f(g); }; }

/* ---------- 物件 ---------- */
{ const _d = sceneDrawObj; sceneDrawObj = function (o, cx, cy, shaking) {
    if (G.scene === 1 && o.t.startsWith('y_')) {
      const im = IMG[o.t]; if (!im) return true;
      if (o.flip) { ctx.save(); ctx.translate(Math.round(cx), 0); ctx.scale(-1, 1); ctx.drawImage(im, Math.round(-im.width / 2), Math.round(cy + 8 - im.height)); ctx.restore(); }
      else ctx.drawImage(im, Math.round(cx - im.width / 2), Math.round(cy + 8 - im.height));
      return true;
    }
    return _d(o, cx, cy, shaking); }; }
{ const _a = sceneAction; sceneAction = async function (o) { if (G.scene === 1 && o.act === 'yard') { await says(o.lines); return true; } return _a(o); }; }
