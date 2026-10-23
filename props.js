/* 夜校・如月　學校物件改用 Gemini 等角圖（2026-10-23 使用者：桌椅、鞋櫃、牆面……都要再精緻）
   p_<名稱>.png 由 tools/props_cut.py 切（tools/raw/school_props.jfif）。game.js drawObj 一開始會先問 drawProp，回傳 true 就不畫原本的方塊。
   原本靠顏色提示的狀態（自己的課桌、圖書館那本書、刻字的課桌……）在圖上再補畫。 */
const PROP = {   // 物件類型 → [圖, 往下偏移]
  desk: ['p_desk', 7], hdesk: ['p_desk', 7], sdesk: ['p_desk', 7],
  tdesk: ['p_tdesk', 8], gdesk: ['p_tdesk', 8], dutylog: ['p_tdesk', 8],
  shoe: ['p_shoe', 8], locker: ['p_locker', 8], cabinet: ['p_cabinet', 8], medcab: ['p_cabinet', 8],
  shelf: ['p_shelf', 8], oldshelf: ['p_shelf', 8], specshelf: ['p_shelf', 8],
  labtable: ['p_labtable', 8], bed: ['p_bed', 8], vend: ['p_vend', 8], box: ['p_box', 6], piano: ['p_piano', 8], trash: ['p_trash', 5],
};
// 地板：floors_g.png（Gemini 8 格）0 教室木板 1 走廊亞麻 2 廁所磁磚 3 體育館 4 保健室 5 磨石子 6 舊木板 7 水泥；沒有就用程式產生的 floors_hd
loadImages([...new Set(Object.values(PROP).map(v => v[0])), 'walls_hd', 'floors_hd', 'floors_g']).then(() => { if (typeof buildFloor === 'function' && IMG.floors) buildFloor(); });
{ const _bf = buildFloor; buildFloor = function () {
    const g = IMG.floors_g ? 'floors_g' : IMG.floors_hd ? 'floors_hd' : null;
    if (g && G.scene <= 4) {
      FLOORTEX['_'] = G.scene === 4 ? [g, g === 'floors_g' ? 6 : 0, '#5a4632'] : [g, 0, '#8e6a46'];   // 舊校舍：深色舊木板
      FLOORTEX[':'] = [g, 1, '#76806f'];
    } else { delete FLOORTEX['_']; delete FLOORTEX[':']; }
    return _bf();
  }; }
function drawProp(o, cx, cy, shaking) {
  const p = PROP[o.t]; if (!p || G.scene === 6) return false;
  const im = IMG[p[0]]; if (!im) return false;
  const sx = Math.round(cx - im.width / 2 + (shaking ? 1 : 0)), sy = Math.round(cy + p[1] - im.height);
  const k = .88, iw = Math.round(im.width * k), ih = Math.round(im.height * k);   // 10/23 物件跟著人物比例略縮
  if (o.flip) { ctx.save(); ctx.translate(Math.round(cx), 0); ctx.scale(-1, 1); ctx.drawImage(im, Math.round(-iw / 2), Math.round(cy + p[1] * k - ih), iw, ih); ctx.restore(); }
  else ctx.drawImage(im, Math.round(cx - iw / 2 + (shaking ? 1 : 0)), Math.round(cy + p[1] * k - ih), iw, ih);
  // 狀態提示
  if (o.t === 'desk' && o.mine && !G.inv.phone) { ctx.fillStyle = Math.sin(G.t * 5) > 0 ? '#bfe0ff' : '#7aa8d8'; ctx.fillRect(cx - 2, cy - 15, 4, 2); }
  if (o.t === 'hdesk') { ctx.fillStyle = '#2a1e14'; for (let k = 0; k < 4; k++) ctx.fillRect(cx - 7 + k * 3, cy - 17 + (k % 2), 2, 1); }
  if (o.t === 'sdesk') { ctx.fillStyle = '#8a6a70'; ctx.fillRect(cx - 2, cy - 18, 3, 2); }
  if (o.t === 'shelf' && o.act && !G.flags.bookPlaced && !G.inv.book) { ctx.fillStyle = Math.sin(G.t * 4) > 0 ? '#e8cf8a' : '#c8b27a'; ctx.fillRect(cx - 4, cy - 26, 3, 6); }
  if (o.t === 'medcab') { ctx.fillStyle = '#d83a3a'; ctx.fillRect(cx - 4, cy - 26, 7, 2); ctx.fillRect(cx - 1.5, cy - 28.5, 2, 7); }
  if (o.t === 'dutylog') { ctx.fillStyle = '#d8d0b8'; ctx.fillRect(cx - 3, cy - 20, 6, 3); }
  return true;
}
// 牆：有 walls_hd 就用（64×68）。舊索引 0 磚 1 窗 2 門 3 灰泥 4 漏水 5 爬藤 → 新 0 磚 1 窗 2 玻璃門 3 爬藤 4 灰泥 5 污漬 6 氣窗 7 公告欄
{ const MAPI = [0, 1, 2, 4, 5, 3], _tf = texFace;
  texFace = function (x, y, side, idx, shade, h = WALLH, inset = 0) {
    const img = IMG.walls_hd; if (!img || G.scene >= 5) return _tf(x, y, side, idx, shade, h, inset);
    let k = MAPI[idx] ?? idx; if (k === 4) { const hs = (x * 31 + y * 17 + (side === 'R' ? 5 : 0)) % 9; k = hs === 0 ? 6 : hs === 4 ? 7 : 4; }
    const [sx, sy] = side === 'L' ? iso(x + inset, y + 1 - inset) : iso(x + 1 - inset, y + 1 - inset);
    const kk = 1 - 2 * inset;
    ctx.setTransform(.25 * kk, side === 'L' ? .125 * kk : -.125 * kk, 0, h / 68, sx, sy - h);
    ctx.drawImage(img, k * 64, 0, 64, 68, 0, 0, 64, 68);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (shade) { const p = side === 'L' ? [iso(x + inset, y + 1 - inset), iso(x + 1 - inset, y + 1 - inset)] : [iso(x + 1 - inset, y + 1 - inset), iso(x + 1 - inset, y + inset)]; poly([p[0], p[1], [p[1][0], p[1][1] - h], [p[0][0], p[0][1] - h]], shade); }
  }; }
