/* 夜校・如月　萬聖夜限定（2026-10-28）：每年 10/29–11/07 自動開啟；?halloween=1 強制開、=0 關。
   ①校園南瓜燈＋蜘蛛網　②咪醬戴魔女帽　③限定怪談「南瓜頭」：每章角落各躲一個，找到會分糖果
   ④不給糖就搗蛋：鬼靠近時偶爾來討糖，給了牠會發呆，不給會被搗蛋（手電筒被吹熄、恐懼上升）
   全部用「包一層」接進引擎；裝飾在進入場景後第一個畫面才擺（要從玩家位置找走得到的地方）。載入順序：最後。 */
const HW = (() => {
  const q = Q.get('halloween'), d = new Date(), m = d.getMonth() + 1, day = d.getDate();
  const season = (m === 10 && day >= 29) || (m === 11 && day <= 7);
  return { on: q === '1' || (q !== '0' && season && (!TEST || TEST === 'halloween')), scene: 0, nextAsk: 0, darkT: 0, laughT: 0 };
})();
const HW_KEY = 'yakou_kisaragi_pumpkin';   // 找過南瓜頭的章節（跨存檔）
const hwGot = () => { try { return JSON.parse(localStorage.getItem(HW_KEY)) || []; } catch (e) { return []; } };
const HW_LINES = {   // 每章南瓜頭說的話
  1: ['嘻嘻，被妳找到了。', '今天是萬聖夜喔。這間學校的「大家」也想要糖果。', '鬼來跟妳討糖的時候，給牠一顆——牠就會乖乖發呆一下。'],
  2: ['走廊好長喔。我數過，晚上的階梯比白天多一階。', '糖果分妳。不要全部吃掉喔，要留給「大家」。'],
  3: ['家政教室的冰箱，我不敢打開。', '妳很勇敢。這個給妳。'],
  4: ['舊校舍的那個姐姐，一直拖著袋子走來走去。', '我把糖果放在她袋子旁邊，她都沒有拿……她是不是不喜歡甜的？'],
  5: ['這條路，我以前也跟媽媽一起走過。', '後來媽媽就沒有來接我了。……糖果給妳。'],
  6: ['火車會不會有萬聖節特別班次呢？', '如果妳要搭的話，記得帶糖果給車掌先生。'],
  7: ['平交道的燈，一閃一閃的，好像南瓜燈。', '欸，我的頭也是南瓜喔。妳看——（他把南瓜轉了一圈。裡面是空的。）'],
};

/* ---------- 擺裝飾：靠牆、走得到、彼此隔開的空地 ---------- */
function hwFloor(x, y) { const c = at(x, y); return !(c === 'X' || c === '#' || c === 'P' || c === 'f' || c === 'D') && !OBJAT[x + ',' + y]; }
function hwDecorate() {
  HW.scene = G.scene;
  const sx = Math.floor(P.x), sy = Math.floor(P.y), seen = new Uint8Array(W * H), qu = [[sx, sy]]; seen[sy * W + sx] = 1;
  while (qu.length) {   // 從玩家位置找走得到的格子（門一律當成開著）
    const [x, y] = qu.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx]) continue;
      const c = at(nx, ny), o = OBJAT[nx + ',' + ny];
      if (c === 'X' || c === '#' || c === 'P' || c === 'f' || (o && o.solid)) continue;
      seen[ny * W + nx] = 1; qu.push([nx, ny]);
    }
  }
  const wall = (x, y) => at(x, y) === '#';
  const cand = [], webs = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (!seen[y * W + x] || !hwFloor(x, y)) continue;
    if (ITEMS.some(i => dist(i.x, i.y, x + .5, y + .5) < 1.5) || dist(x + .5, y + .5, P.x, P.y) < 2) continue;
    if (wall(x - 1, y) && wall(x, y - 1)) webs.push([x, y]);   // 畫面上方的牆角
    if (wall(x - 1, y) || wall(x, y - 1) || wall(x + 1, y) || wall(x, y + 1)) cand.push([x, y]);
  }
  const r = rng(G.scene * 131 + 7), pick = (list, n, gap) => {
    const out = [], L = list.slice();
    for (let i = L.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [L[i], L[j]] = [L[j], L[i]]; }
    for (const p of L) { if (out.length >= n) break; if (out.every(o => Math.abs(o[0] - p[0]) + Math.abs(o[1] - p[1]) >= gap)) out.push(p); }
    return out;
  };
  const add = (t, x, y, o) => { const b = obj(t, x, y, Object.assign({ solid: false, hw: 1 }, o)); OBJAT[x + ',' + y] = b; return b; };
  // 南瓜頭：躲在離入口比較遠的地方
  if (!G.flags['hwpk' + G.scene]) {
    const far = cand.filter(([x, y]) => dist(x + .5, y + .5, P.x, P.y) > 9).sort((a, b) => dist(b[0], b[1], P.x, P.y) - dist(a[0], a[1], P.x, P.y));
    const pool = far.slice(0, Math.max(1, Math.floor(far.length * .45)));
    const p = pool.length && pool[Math.floor(r() * pool.length)];
    if (p) { add('hw_head', p[0], p[1], { solid: true, act: 'hwpk', label: '跟南瓜頭說話', ph: r() * 6 }); HW.head = { x: p[0] + .5, y: p[1] + .5 }; }
  } else HW.head = null;
  for (const [x, y] of pick(cand.filter(([x, y]) => !OBJAT[x + ',' + y]), 14, 6)) {
    add('hw_pumpkin', x, y, { v: Math.floor(r() * 3), ph: r() * 6 });
    LIGHTS.push({ x: x + .5, y: y + .5, r: 1.5, c: '255,140,40' });
  }
  for (const [x, y] of pick(webs.filter(([x, y]) => !OBJAT[x + ',' + y]), 10, 5)) add('hw_web', x, y, { s: .8 + r() * .5 });
}
{ const _u = update; update = function (dt) {
    if (HW.on && G.mode === 'play' && !G.lock && (HW.scene !== G.scene || !OBJ.some(o => o.hw))) hwDecorate();
    const r = _u(dt);
    if (HW.on && G.mode === 'play' && !G.lock) hwTick();
    return r;
  }; }

/* ---------- 畫：南瓜燈、蜘蛛網、南瓜頭 ---------- */
function hwPumpkin(cx, cy, s, glowA, face) {
  ctx.fillStyle = '#c4581a'; ctx.beginPath(); ctx.ellipse(cx, cy, 7.5 * s, 5.8 * s, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#e07a26'; ctx.beginPath(); ctx.ellipse(cx - 2.6 * s, cy, 3.6 * s, 5.4 * s, 0, 0, 7); ctx.ellipse(cx + 2.6 * s, cy, 3.6 * s, 5.4 * s, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#ef9a3c'; ctx.beginPath(); ctx.ellipse(cx, cy, 2.4 * s, 5.6 * s, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#4b5a2a'; ctx.fillRect(cx - 1 * s, cy - 8 * s, 2 * s, 3 * s);
  ctx.fillStyle = `rgba(255,${210 + Math.round(30 * glowA)},90,${.55 + .45 * glowA})`;   // 刻出來的臉（裡面有燭光）
  const tri = (x, y, w, h, up) => { ctx.beginPath(); ctx.moveTo(x - w, y + (up ? h : 0)); ctx.lineTo(x + w, y + (up ? h : 0)); ctx.lineTo(x, y + (up ? 0 : h)); ctx.fill(); };
  tri(cx - 3 * s, cy - 2.6 * s, 1.6 * s, 2.2 * s, true); tri(cx + 3 * s, cy - 2.6 * s, 1.6 * s, 2.2 * s, true);
  if (face === 1) { ctx.fillRect(cx - 3.5 * s, cy + 1.4 * s, 7 * s, 1.4 * s); }
  else { ctx.beginPath(); ctx.moveTo(cx - 4.2 * s, cy + .8 * s); ctx.quadraticCurveTo(cx, cy + 5 * s, cx + 4.2 * s, cy + .8 * s); ctx.quadraticCurveTo(cx, cy + 2.6 * s, cx - 4.2 * s, cy + .8 * s); ctx.fill(); }
}
function hwDraw(o, a) {
  ctx.globalAlpha = a; const [cx, cy] = iso(o.x + .5, o.y + .5);
  if (o.t === 'hw_pumpkin') {
    const fl = .6 + .4 * Math.sin(G.t * 9 + o.ph) * Math.sin(G.t * 3.3 + o.ph * 2);
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(cx, cy + 1, 8, 3.5, 0, 0, 7); ctx.fill();
    hwPumpkin(cx, cy - 5, o.v === 2 ? .8 : 1, fl, o.v);
    if (o.v === 2) hwPumpkin(cx + 7, cy - 3, .62, fl, 1);
  } else if (o.t === 'hw_web') {
    const [tx, ty] = iso(o.x, o.y), top = ty - WALLH + 6, L = 16 * o.s;
    ctx.strokeStyle = 'rgba(225,225,235,.5)'; ctx.lineWidth = .7; ctx.beginPath();
    const ang = [-.2, .35, .9, 1.5, 2.05, 2.6, 3.35];   // 從牆角往下散開
    for (const g of ang) { ctx.moveTo(tx, top); ctx.lineTo(tx + Math.cos(g) * L, top + Math.abs(Math.sin(g)) * L * .9 + 2); }
    for (let k = 1; k <= 3; k++) { const rr = L * k / 3.4; ctx.moveTo(tx + Math.cos(ang[0]) * rr, top + Math.abs(Math.sin(ang[0])) * rr * .9 + 2); for (const g of ang.slice(1)) ctx.lineTo(tx + Math.cos(g) * rr, top + Math.abs(Math.sin(g)) * rr * .9 + 2); }
    ctx.stroke();
    const sy = top + 8 + Math.sin(G.t * 1.3 + o.x) * 3;   // 垂下來的小蜘蛛
    ctx.strokeStyle = 'rgba(225,225,235,.35)'; ctx.beginPath(); ctx.moveTo(tx + 5, top + 3); ctx.lineTo(tx + 5, sy); ctx.stroke();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(tx + 5, sy + 1.5, 1.8, 0, 7); ctx.fill();
  } else if (o.t === 'hw_head') {   // 披著黑斗篷的南瓜頭小孩
    const b = Math.sin(G.t * 2 + o.ph) * 1.2, fl = .7 + .3 * Math.sin(G.t * 7 + o.ph);
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(cx, cy, 8, 3.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#18141c'; ctx.beginPath(); ctx.moveTo(cx - 9, cy); ctx.lineTo(cx - 5, cy - 22 + b); ctx.lineTo(cx + 5, cy - 22 + b); ctx.lineTo(cx + 9, cy);
    for (let i = 0; i < 4; i++) ctx.lineTo(cx + 9 - i * 4.5 - 2.2, cy - 2.5 - (i % 2) * 1.5);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b2333'; ctx.fillRect(cx - 5, cy - 22 + b, 10, 3);
    hwPumpkin(cx, cy - 29 + b, 1.15, fl, 0);
    const d = dist(P.x, P.y, o.x + .5, o.y + .5);   // 走近時頭上冒出「？」
    if (d < 5 && G.mode === 'play') { ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffb347'; ctx.fillText('♪', cx + 9, cy - 40 + Math.sin(G.t * 4) * 2); }
  }
  ctx.globalAlpha = 1;
}
{ const _d = drawObj; drawObj = function (o, a) { if (o.hw) return hwDraw(o, a); return _d(o, a); }; }
// 南瓜頭在暗處也看得到一點輪廓（畫在暗幕之上，很淡）
{ const _r = render; render = function () {
    _r();
    if (!HW.on || !HW.head || G.mode !== 'play' || G.flags['hwpk' + G.scene]) return;
    const d = dist(P.x, P.y, HW.head.x, HW.head.y); if (d > 9) return;
    const [cx, cy] = iso(HW.head.x, HW.head.y);
    ctx.globalAlpha = .35 * (1 - d / 9) * (.7 + .3 * Math.sin(G.t * 7)); hwPumpkin(cx, cy - 29, 1.15, 1, 0); ctx.globalAlpha = 1;
  }; }

/* ---------- 咪醬的魔女帽：記下 drawMi 實際畫的那一格，從圖的透明度找頭頂 ---------- */
const HW_TOP = new Map();
function hwHeadTop(img, dir, frame) {
  const rows = img.rows || (img.height > img.width / 8 * 1.8 ? 4 : 1), fw = img.width / 8, fh = img.height / rows, row = (frame || 0) % rows, k = img.src + '|' + dir + '|' + row;
  if (HW_TOP.has(k)) return HW_TOP.get(k);
  let v = [.06, .5];
  try {
    const c = document.createElement('canvas'); c.width = fw; c.height = fh; const g = c.getContext('2d');
    g.drawImage(img, dir * fw, row * fh, fw, fh, 0, 0, fw, fh); const px = g.getImageData(0, 0, fw, fh).data;
    let top = -1; for (let y = 0; y < fh && top < 0; y++) for (let x = 0; x < fw; x++) if (px[(y * fw + x) * 4 + 3] > 120) { top = y; break; }
    if (top >= 0) {   // 頭頂往下 12% 內的不透明像素，取左右中點
      let x0 = fw, x1 = 0; for (let y = top; y < Math.min(fh, top + fh * .12); y++) for (let x = 0; x < fw; x++) if (px[(y * fw + x) * 4 + 3] > 120) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
      v = [top / fh, (x0 + x1) / 2 / fw];
    }
  } catch (e) { }
  HW_TOP.set(k, v); return v;
}
function hwHat(cx, cy, s, tilt) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt);
  ctx.fillStyle = '#231530'; ctx.beginPath(); ctx.ellipse(0, 0, 11 * s, 3.2 * s, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-6 * s, -1 * s); ctx.quadraticCurveTo(-3 * s, -10 * s, 2 * s, -17 * s); ctx.quadraticCurveTo(5 * s, -19 * s, 8 * s, -15 * s); ctx.quadraticCurveTo(3 * s, -12 * s, 6 * s, -1 * s); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e07a26'; ctx.beginPath(); ctx.moveTo(-6 * s, -1.2 * s); ctx.lineTo(6 * s, -1.2 * s); ctx.lineTo(5.6 * s, -3.6 * s); ctx.lineTo(-5.3 * s, -3.6 * s); ctx.fill();
  ctx.fillStyle = '#f2c14e'; ctx.fillRect(-1.2 * s, -3.4 * s, 2.4 * s, 2 * s);
  ctx.restore();
}
{ const _m = drawMi; drawMi = function () {
    if (!HW.on) return _m();
    let call = null; const _s = drawSprite;
    drawSprite = function (img, x, y, dir, frame, opt) { call = [img, x, y, dir, frame, opt]; return _s.apply(this, arguments); };
    try { _m(); } finally { drawSprite = _s; }
    if (!call || !call[0]) return;
    let [img, x, y, dir, frame, opt] = call; if (typeof frame === 'object') { opt = frame; frame = undefined; } opt = opt || {}; if (frame === undefined) frame = opt.frame || 0;
    if (img === IMG.mi_down) return;   // 倒地時帽子掉了
    const rows = img.rows || (img.height > img.width / 8 * 1.8 ? 4 : 1), fw = img.width / 8, fh = img.height / rows;
    const sc = (opt.sc || 1) * CHAR_SC, h = fh * sc, w = fw * sc, [sx, sy] = iso(x, y);
    const br = !(frame > 0) && !opt.still ? 1 + .022 * Math.sin(G.t * 2.4 + x * 3.1) : 1, hh = Math.round(h * br);
    const [tr, xr] = hwHeadTop(img, dir, frame);
    const hx = sx - w / 2 + xr * w + (opt.jit || 0), hy = sy - hh + 1 - (opt.bob || 0) + tr * hh;
    ctx.globalAlpha = opt.alpha ?? 1; hwHat(hx, hy + 4.5 * sc, sc * 1.05, (SCR[dir] ? Math.sign(SCR[dir][0]) : 0) * -.12); ctx.globalAlpha = 1;
  }; }

/* ---------- 南瓜糖：南瓜頭給的，可以吃（恐懼下降），鬼來討糖時給牠 ---------- */
{ const _h = sceneHUD; sceneHUD = function (s) {
    _h(s);
    if (HW.on && G.inv.hcandy) s.push(`<div class="s tap" data-k="useHCandy">🎃 南瓜糖×${G.inv.hcandy}<em>${isTouch ? '點按吃掉' : '8 吃掉'}</em></div>`);
  }; }
{ const _p = press; press = function (k) {
    if (k !== 'useHCandy') return _p(k);
    if (G.mode !== 'play' || G.lock || !G.inv.hcandy) return;
    G.inv.hcandy--; G.fear = Math.max(0, (G.fear || 0) - 35); P.stam = 100; P.tired = false; sfx.pick();
    toast('南瓜糖甜甜的……心跳慢慢平靜下來了'); updateHUD();
  }; }
addEventListener('keydown', e => { if (e.code === 'Digit8' && !e.repeat) press('useHCandy'); });
objAction = (_o => async function (o) {
  if (o.act !== 'hwpk') return _o(o);
  const n = G.scene, first = !hwGot().length;
  sfx.laugh();
  await says([['南瓜頭', 'Trick or treat！'], ...(first ? [['南瓜頭', '……騙妳的，是我要給妳糖果。']] : []), ...(HW_LINES[n] || HW_LINES[1]).map(t => ['南瓜頭', t])]);
  G.flags['hwpk' + n] = 1; G.inv.hcandy = (G.inv.hcandy || 0) + 2; sfx.pick();
  const got = hwGot(); if (!got.includes(n)) { got.push(n); try { localStorage.setItem(HW_KEY, JSON.stringify(got)); } catch (e) { } }
  const i = OBJ.indexOf(o); if (i >= 0) OBJ.splice(i, 1); delete OBJAT[o.x + ',' + o.y]; HW.head = null;
  await says([['', '南瓜頭咯咯笑著，咚咚咚地跑進黑暗裡——不見了。']]);
  toast(`得到【🎃 南瓜糖】×2　鬼來討糖時可以給牠（南瓜頭 ${got.length} / 7）`);
  if (got.length === 7) setTimeout(() => toast('🎃 七章的南瓜頭全部找到了！Happy Halloween！'), 2600);
  updateHUD();
})(objAction);

/* ---------- 不給糖就搗蛋：鬼靠近（4 格內）時，偶爾停下來跟妳討糖 ---------- */
const HW_NAME = () => new Map([[GH, '裂口女'], [typeof AM === 'object' && AM, '人體模型'], [typeof HK === 'object' && HK, '妃姬子'], [typeof TK === 'object' && TK, 'Teke Teke'], [typeof BABA === 'object' && BABA, '高速婆婆']]);
function hwTick() {
  if (G.t < HW.darkT) P.light = false;   // 被搗蛋：手電筒暫時打不開
  if (HW.head && !G.flags['hwpk' + G.scene] && G.t > HW.laughT && dist(P.x, P.y, HW.head.x, HW.head.y) < 7) { HW.laughT = G.t + 9; sfx.laugh(); }   // 附近傳來小孩的笑聲
  if (G.t < HW.nextAsk || P.hidden || typeof INVM === 'object' && INVM.open) return;
  const t = nearestThreat(); if (!t || t.d > 4 || stunned(t.e) || (t.e === GH && GH.state === 'stun')) return;
  HW.nextAsk = G.t + 1;   // 每秒擲一次
  if (Math.random() > .3) return;
  HW.nextAsk = G.t + 80; hwTrick(t);
}
async function hwTrick(t) {
  const name = HW_NAME().get(t.e) || '黑影', n = G.inv.hcandy || 0;
  sfx.sting();
  const opts = n ? [`給牠南瓜糖（剩 ${n} 顆）`, '不給！'] : ['……我沒有糖果'];
  const r = await choose(name, '「Trick or treat……」不給糖，就搗蛋。', opts, 5000);
  if (n && r === 0) {
    G.inv.hcandy--; t.stun(6); sfx.pick(); toast(`${name}捧著南瓜糖發呆……（6 秒）`);
  } else {
    t.stun(1.2); sfx.laugh(); shake = 10; G.fear = Math.min(100, (G.fear || 0) + 30);
    if (G.inv.flashlight) { HW.darkT = G.t + 4; P.light = false; }
    toast(G.inv.flashlight ? '「搗蛋！」——手電筒被吹熄了！（4 秒）' : '「搗蛋！」——耳邊有人吹了一口冷氣！');
  }
  updateHUD();
}

/* ---------- 標題畫面、怪談筆記 ---------- */
if (HW.on) {
  const st = document.createElement('style');
  st.textContent = `#hwBadge{display:inline-block;margin-top:calc(var(--u)*4);padding:calc(var(--u)*2) calc(var(--u)*10);border:1px solid #e07a26;color:#ffb347;background:rgba(40,16,4,.7);font-size:calc(var(--u)*9);letter-spacing:.15em;text-shadow:0 0 8px rgba(255,140,40,.8);animation:hwPulse 2.4s ease-in-out infinite}
@keyframes hwPulse{50%{box-shadow:0 0 14px rgba(255,140,40,.55)}}
#title h1 em{text-shadow:0 0 18px rgba(255,120,30,.55)}`;
  document.head.appendChild(st);
  const sub = $('#title .sub'); if (sub) sub.insertAdjacentHTML('afterend', '<div id="hwBadge">🎃 萬聖夜限定　找出躲在各章的南瓜頭</div>');
  if (typeof LORE === 'object') LORE.push(['pumpkin', '南瓜頭', '萬聖夜才會出現的小孩，躲在每一章的角落。', '找到他會分妳南瓜糖；鬼來討糖時給牠，牠就會發呆。', () => hwGot().length > 0]);
}

/* ---------- 測試（?test=halloween）：裝飾擺好 → 找南瓜頭拿糖 → 鬼來討糖、給糖後暈眩 ---------- */
async function testHalloween() {
  try {
    resetWorld(); startPlay(true); G.inv.flashlight = true; P.light = true;
    await wait(200);
    const pk = OBJ.filter(o => o.t === 'hw_pumpkin').length, web = OBJ.filter(o => o.t === 'hw_web').length, head = OBJ.find(o => o.t === 'hw_head');
    if (!pk || !head) throw 'no deco pk=' + pk;
    P.x = head.x + .5; P.y = head.y + 1.5; if (hitAt(P.x, P.y, P.r)) { P.x = head.x - .5; P.y = head.y + .5; }
    await objAction(head);
    if (G.inv.hcandy !== 2 || !G.flags.hwpk1 || OBJ.includes(head)) throw 'head fail ' + G.inv.hcandy;
    spawnGhost(P.x + 2, P.y); GH.state = 'pause'; GH.timer = 99;
    TEST_CHOICE = () => 0; HW.nextAsk = 0; const t = nearestThreat();
    await hwTrick(t);
    if (G.inv.hcandy !== 1 || GH.state !== 'stun') throw 'treat fail ' + GH.state;
    GH.state = 'pause'; TEST_CHOICE = o => o.length - 1; await hwTrick(nearestThreat());
    if (P.light || G.fear < 25) throw 'trick fail';
    document.title = `PASS pumpkins=${pk} webs=${web} candy=${G.inv.hcandy}`;
  } catch (e) { document.title = 'ERR ' + e; }
}
{ const _t = runTest; runTest = async function (kind) { if (kind === 'halloween') return testHalloween(); return _t(kind); }; }
if (typeof TEST !== 'undefined' && TEST === 'shot' && Q.get('hwhead')) setTimeout(() => { const h = OBJ.find(o => o.t === 'hw_head'); if (h) { P.x = h.x + 1.5; P.y = h.y + 1.5; if (hitAt(P.x, P.y, P.r)) { P.x = h.x - .5; P.y = h.y + 1.5; } } }, 500);   // 截圖：&hwhead=1 走到南瓜頭旁邊
