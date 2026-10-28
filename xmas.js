/* 夜校・如月　聖誕夜限定（2026-10-29 預先做好）：每年 12/20–12/26 自動開；?xmas=1 強制預覽、=0 關；測試模式只有 test=xmas 或帶 xmas=1 才開。
   ①雨變成雪、校園擺聖誕樹（會閃的燈泡）②咪醬戴聖誕帽（沿用萬聖夜的帽子畫法，換成紅白帽）
   ③每章藏一個聖誕禮物（隨機給繃帶／能量飲料／護身符，7 章收集）④限定怪談「紅色背心」：躲起來時有聲音問「要不要穿紅色背心？」
   載入順序：depth.js 之後（用到 reachTiles）。 */
const XM = (() => {
  const q = Q.get('xmas'), d = new Date(), m = d.getMonth() + 1, day = d.getDate();
  return { on: q === '1' || (q !== '0' && m === 12 && day >= 20 && day <= 26 && (!TEST || TEST === 'xmas')), scene: 0, snow: [], askT: 0 };
})();
const XM_KEY = 'yakou_kisaragi_gifts';
const xmGot = () => { try { return JSON.parse(localStorage.getItem(XM_KEY)) || []; } catch (e) { return []; } };
if (XM.on) {
  RAIN.length = 0;   // 雨停了，改下雪
  for (let i = 0; i < 90; i++) XM.snow.push({ x: Math.random() * 640, y: Math.random() * 400, s: .3 + Math.random() * .9, w: Math.random() * 6 });
  // 帽子：萬聖夜的魔女帽換成聖誕帽
  hwHat = function (cx, cy, s, tilt) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt);
    ctx.fillStyle = '#c62828'; ctx.beginPath(); ctx.moveTo(-7 * s, -1 * s); ctx.quadraticCurveTo(-2 * s, -12 * s, 6 * s, -15 * s); ctx.quadraticCurveTo(4 * s, -9 * s, 7 * s, -1 * s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f5f1ea'; ctx.beginPath(); ctx.ellipse(0, 0, 8.5 * s, 2.6 * s, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(6.5 * s, -15 * s, 2.3 * s, 0, 7); ctx.fill();
    ctx.restore();
  };
}
/* ---------- 擺聖誕樹與禮物 ---------- */
function xmDecorate() {
  XM.scene = G.scene;
  const wall = (x, y) => at(x, y) === '#';
  const c = reachTiles().filter(([x, y]) => (wall(x - 1, y) || wall(x, y - 1)) && dist(x + .5, y + .5, P.x, P.y) > 3);
  const r = rng(G.scene * 211 + 5), pick = n => { const out = []; const L = c.slice(); for (let i = L.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [L[i], L[j]] = [L[j], L[i]]; } for (const p of L) { if (out.length >= n) break; if (!OBJAT[p[0] + ',' + p[1]] && out.every(o => Math.abs(o[0] - p[0]) + Math.abs(o[1] - p[1]) >= 8)) out.push(p); } return out; };
  for (const [x, y] of pick(4)) { const o = obj('xm_tree', x, y, { solid: true, xm: 1, ph: r() * 6 }); OBJAT[x + ',' + y] = o; LIGHTS.push({ x: x + .5, y: y + .5, r: 1.6, c: '255,220,140' }); }
  if (!G.flags['xmg' + G.scene]) {
    const far = c.filter(([x, y]) => dist(x + .5, y + .5, P.x, P.y) > 9 && !OBJAT[x + ',' + y]);
    const p = far[Math.floor(r() * far.length)];
    if (p) { const o = obj('xm_gift', p[0], p[1], { solid: false, xm: 1, act: 'xmgift', label: '打開聖誕禮物', col: ['#c62828', '#2e7d32', '#1565c0'][G.scene % 3] }); OBJAT[p[0] + ',' + p[1]] = o; }
  }
}
{ const _u = update; update = function (dt) {
    if (XM.on && G.mode === 'play' && !G.lock && (XM.scene !== G.scene || !OBJ.some(o => o.xm))) xmDecorate();
    const r = _u(dt);
    if (XM.on && G.mode === 'play' && !G.lock) xmTick();
    return r;
  }; }
{ const _d = drawObj; drawObj = function (o, a) {
    if (!o.xm) return _d(o, a);
    ctx.globalAlpha = a; const [cx, cy] = iso(o.x + .5, o.y + .5);
    if (o.t === 'xm_tree') {
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(cx, cy, 10, 4, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#5d4037'; ctx.fillRect(cx - 2, cy - 6, 4, 6);
      [[0, 14, 22], [8, 11, 17], [15, 8, 12]].forEach(([dy, w, h], i) => { ctx.fillStyle = i % 2 ? '#2e6b3a' : '#1f5a2f'; ctx.beginPath(); ctx.moveTo(cx - w, cy - 6 - dy); ctx.lineTo(cx + w, cy - 6 - dy); ctx.lineTo(cx, cy - 6 - dy - h); ctx.closePath(); ctx.fill(); });
      const cols = ['#ff5252', '#ffd54f', '#64b5f6', '#fff'];
      for (let i = 0; i < 9; i++) { const on = Math.sin(G.t * 3 + i * 1.7 + o.ph) > 0; ctx.fillStyle = on ? cols[i % 4] : 'rgba(255,255,255,.15)'; ctx.fillRect(cx - 10 + (i * 7) % 20, cy - 10 - (i * 5) % 26, 2, 2); }
      ctx.fillStyle = '#ffeb3b'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? 2 : 4.5, an = -Math.PI / 2 + k * Math.PI / 5; ctx.lineTo(cx + Math.cos(an) * rr, cy - 42 + Math.sin(an) * rr); } ctx.closePath(); ctx.fill();
    } else if (o.t === 'xm_gift') {
      const b = Math.abs(Math.sin(G.t * 2)) * 1.5;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(cx, cy, 7, 3, 0, 0, 7); ctx.fill();
      ctx.fillStyle = o.col; ctx.fillRect(cx - 6, cy - 10 - b, 12, 9);
      ctx.fillStyle = '#ffd54f'; ctx.fillRect(cx - 1, cy - 10 - b, 2, 9); ctx.fillRect(cx - 6, cy - 7 - b, 12, 2);
      ctx.beginPath(); ctx.ellipse(cx - 3, cy - 12 - b, 3, 2, -.4, 0, 7); ctx.ellipse(cx + 3, cy - 12 - b, 3, 2, .4, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }; }
// 雪：畫在最上層，戶外比較密、室內窗邊零星
{ const _r = render; render = function () {
    _r(); if (!XM.on) return;
    const out = !isInside(P.x, P.y); ctx.fillStyle = 'rgba(255,255,255,.85)';
    XM.snow.forEach((f, i) => { if (!out && i % 4) return; f.y += f.s; f.x += Math.sin(G.t + f.w) * .3; if (f.y > VH) { f.y = -4; f.x = Math.random() * VW; } ctx.fillRect(f.x % VW, f.y, f.s > .8 ? 2 : 1, f.s > .8 ? 2 : 1); });
  }; }
/* ---------- 禮物 ---------- */
objAction = (_o => async function (o) {
  if (o.act !== 'xmgift') return _o(o);
  const n = G.scene, I = G.inv, gift = ['bandage', 'drink', 'charm'][Math.floor(Math.random() * 3)];
  I[gift] = (I[gift] || 0) + 1; G.flags['xmg' + n] = 1; sfx.pick();
  const got = xmGot(); if (!got.includes(n)) { got.push(n); if (!TEST || TEST === 'xmas') try { localStorage.setItem(XM_KEY, JSON.stringify(got)); } catch (e) { } }
  const i = OBJ.indexOf(o); if (i >= 0) OBJ.splice(i, 1); delete OBJAT[o.x + ',' + o.y];
  const nm = { bandage: '繃帶', drink: '能量飲料', charm: '護身符' }[gift];
  await says([['', '包裝紙上寫著：「給今晚還留在學校的妳。」'], ['', `打開一看，是【${nm}】。`]]);
  toast(`🎁 聖誕禮物 ${got.length} / 7`); if (got.length === 7) setTimeout(() => toast('🎄 七個禮物都找到了！Merry Christmas！'), 2400);
  updateHUD();
})(objAction);
/* ---------- 限定怪談「紅色背心」：躲起來超過 3 秒時，有一定機率被問 ---------- */
function xmTick() {
  if (!P.hidden) { XM.hideT = 0; return; }
  XM.hideT = (XM.hideT || 0) + 1 / 30;
  if (G.flags.xmVest === G.scene || XM.hideT < 3 || G.t < XM.askT || Math.random() > .02) return;
  G.flags.xmVest = G.scene; xmVest();
}
async function xmVest() {
  sfx.sting();
  const r = await choose('？？？', '躲著的地方，旁邊傳來很輕的聲音：「……要不要，穿上紅色的背心？」', ['要', '不要', '（屏住呼吸，不出聲）'], 6000);
  if (r === 0) { damage(1); shake = 12; await says([['', '背上突然一陣溫熱，濕濕的，一路往下滲——'], ['', '……是血。像一件紅色的背心。']]); }
  else if (r === 1) { await says([['？？？', '「……是嗎。」'], ['', '聲音嘆了一口氣，慢慢走遠了。']]); }
  else { G.inv.charm = (G.inv.charm || 0) + 1; updateHUD(); await says([['', '……等了很久，聲音沒有再出現。'], ['', '腳邊多了一個用紅布包著的護身符。']]); }
  G.flags.xmVestSeen = 1;
}
if (XM.on) {
  if (typeof LORE === 'object') LORE.push(['xmvest', '紅色背心', '聖誕夜，躲起來的時候會有聲音問妳：「要不要穿紅色背心？」', '回答「要」的人，背上會被染紅。最好什麼都不要說。', () => G.flags.xmVestSeen]);
  const st = document.createElement('style');
  st.textContent = `#xmBadge{display:inline-block;margin-top:calc(var(--u)*4);padding:calc(var(--u)*2) calc(var(--u)*10);border:1px solid #c62828;color:#ffcdd2;background:rgba(40,4,4,.7);font-size:calc(var(--u)*9);letter-spacing:.15em;text-shadow:0 0 8px rgba(255,80,80,.7)}`;
  document.head.appendChild(st);
  const sub = $('#title .sub'); if (sub) sub.insertAdjacentHTML('afterend', '<div id="xmBadge">🎄 聖誕夜限定　每一章都藏著一個禮物</div>');
  setTimeout(() => { if (!TEST) toast('🎄 聖誕夜限定：校園下雪了，每一章都藏著一個禮物'); }, 2500);
}
/* ---------- 測試（?test=xmas） ---------- */
async function testXmas() {
  try {
    resetWorld(); startPlay(true); G.inv.flashlight = true; await wait(200);
    const trees = OBJ.filter(o => o.t === 'xm_tree').length, gift = OBJ.find(o => o.t === 'xm_gift');
    if (!trees || !gift) throw 'deco ' + trees;
    const before = (G.inv.bandage || 0) + (G.inv.drink || 0) + (G.inv.charm || 0);
    await objAction(gift); await waitFree();
    if ((G.inv.bandage || 0) + (G.inv.drink || 0) + (G.inv.charm || 0) !== before + 1 || !G.flags.xmg1) throw 'gift';
    TEST_CHOICE = () => 2; const c0 = G.inv.charm || 0; await xmVest(); await waitFree();
    if ((G.inv.charm || 0) !== c0 + 1) throw 'vest';
    document.title = `PASS trees=${trees} rain=${RAIN.length}`;
  } catch (e) { document.title = 'ERR ' + e; }
}
{ const _t = runTest; runTest = async function (kind) { if (kind === 'xmas') return testXmas(); return _t(kind); }; }
