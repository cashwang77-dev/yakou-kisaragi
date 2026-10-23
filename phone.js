/* 夜校・如月　手機（2026-10-23 使用者：手機不能只是裝飾品）
   P 開關手機：地圖（走過的地方才會畫出來）、Q 相機閃光（前方的鬼暈眩、照出隱藏的東西）、靜音（沒靜音的話來電鈴聲會把鬼引來）
   電量：開著地圖會慢慢掉、閃光一次 20%；在存檔點充電。載入順序在 systems.js 之後。 */

const PH = { open: false, batt: 100, silent: false, flashCD: 0, seen: {} };
const phSeen = () => PH.seen[G.scene] || (PH.seen[G.scene] = new Set());

/* ---------- 介面 ---------- */
(() => {
  const st = document.createElement('style');
  st.textContent = `#phoneApp{position:fixed;right:calc(var(--u)*14);bottom:calc(var(--u)*70);width:calc(var(--u)*190);background:#0c0d10;border:2px solid #3a3d44;border-radius:calc(var(--u)*14);padding:calc(var(--u)*8);z-index:30;pointer-events:auto;box-shadow:0 0 18px rgba(120,160,220,.18)}
#phoneApp.hide{display:none}
#phoneApp .bar{display:flex;justify-content:space-between;font-size:calc(var(--u)*10);color:#9aa4b4;margin-bottom:calc(var(--u)*4)}
#phoneApp canvas{width:100%;display:block;background:#05060a;border-radius:calc(var(--u)*6)}
#phoneApp .btns{display:flex;flex-direction:row;gap:calc(var(--u)*4);margin-top:calc(var(--u)*6)}
#phoneApp button{flex:1;width:auto;min-width:0;margin:0;font:inherit;font-size:calc(var(--u)*11);padding:calc(var(--u)*5) 0;background:#1c1f26;color:#dfe6f0;border:1px solid #3a3d44;border-radius:calc(var(--u)*5)}
#phoneApp button.on{background:#3a2a2e;border-color:#8a4a52}
#phoneApp button:disabled{opacity:.4}
#flashFx{position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:29;transition:opacity .45s}`;
  document.head.appendChild(st);
  const d = document.createElement('div'); d.id = 'phoneApp'; d.className = 'hide';
  d.innerHTML = `<div class="bar"><span>4:44</span><span id="phBatt"></span></div><canvas id="phMap" width="360" height="300"></canvas>
<div class="btns"><button data-a="photo">📷 拍照</button><button data-a="silent">🔔 鈴聲</button><button data-a="close">收起</button></div>`;
  document.body.appendChild(d);
  const f = document.createElement('div'); f.id = 'flashFx'; document.body.appendChild(f);
  d.querySelectorAll('button').forEach(b => b.addEventListener('pointerup', e => { e.preventDefault(); e.stopPropagation(); phoneBtn(b.dataset.a); }));
  addEventListener('keydown', e => { if (e.repeat) return; if (e.code === 'KeyP') press('phone'); if (e.code === 'KeyQ') press('photo'); });
})();
function phoneBtn(a) {
  if (a === 'photo') phonePhoto();
  else if (a === 'silent') { PH.silent = !PH.silent; sfx.click(); toast(PH.silent ? '切成靜音（來電只會震動）' : '鈴聲開啟'); }
  else if (a === 'close') phoneToggle(false);
  phoneUI();
}
function phoneUI() {
  const d = $('#phoneApp'); d.classList.toggle('hide', !PH.open);
  $('#phBatt').textContent = `🔋 ${Math.round(PH.batt)}%`;
  const [bp, bs] = d.querySelectorAll('button');
  bp.disabled = PH.batt < 20 || PH.flashCD > G.t; bs.classList.toggle('on', PH.silent); bs.textContent = PH.silent ? '🔕 靜音' : '🔔 鈴聲';
}
function phoneToggle(on = !PH.open) {
  if (!G.inv.phone) { toast('手機不在身上'); return; }
  if (on && PH.batt <= 0) { toast('手機沒電了（到存檔的地方充電）'); return; }
  PH.open = on; sfx.click(); phoneUI(); updateHUD();
}

/* ---------- 地圖：只畫走過、照亮過的地方 ---------- */
function phoneMap() {
  const c = $('#phMap'), g = c.getContext('2d'); g.fillStyle = '#05060a'; g.fillRect(0, 0, c.width, c.height);
  const k = 6.5, seen = phSeen(), ox = c.width / 2 - (P.x - P.y) * k, oy = c.height / 2 - (P.x + P.y) * k / 2;
  const pt = (x, y) => [ox + (x - y) * k, oy + (x + y) * k / 2];
  for (const key of seen) {
    const x = key % W, y = (key / W) | 0, t = at(x, y); if (t === 'X') continue;
    const [a, b] = pt(x, y), wall = t === '#' || t === 'P';
    g.fillStyle = wall ? '#5d6878' : t === 'D' ? '#b08a50' : INDOOR.has(t) || t === '_' || t === ':' ? '#26303e' : '#1d2a22';
    g.beginPath(); g.moveTo(a, b); g.lineTo(a + k, b + k / 2); g.lineTo(a, b + k); g.lineTo(a - k, b + k / 2); g.fill();
  }
  for (const o of OBJ) if (o.act && seen.has(o.y * W + o.x)) { const [a, b] = pt(o.x + .5, o.y + .5); g.fillStyle = '#e8c860'; g.fillRect(a - 1.5, b - 1.5, 3, 3); }
  const [px, py] = pt(P.x, P.y); g.fillStyle = Math.sin(G.t * 8) > 0 ? '#ff5a6a' : '#ffb0b8'; g.beginPath(); g.arc(px, py, 3.5, 0, 7); g.fill();
  const [fx, fy] = DIRV[P.dir]; const [qx, qy] = pt(P.x + fx * 2, P.y + fy * 2); g.strokeStyle = '#ff8090'; g.beginPath(); g.moveTo(px, py); g.lineTo(qx, qy); g.stroke();
}

/* ---------- 相機閃光 ---------- */
const PHOTO_SPOTS = [];   // {scene, x, y, id, lines}：對著這裡拍照會照出東西（各章自己 push）
async function phonePhoto() {
  if (!G.inv.phone || G.mode !== 'play' || G.lock || P.hidden) return;
  if (PH.batt < 20) { toast('電量不足，沒辦法開閃光燈'); return; }
  if (PH.flashCD > G.t) { toast('閃光燈還在充電'); return; }
  PH.batt -= 20; PH.flashCD = G.t + 8; sfx.click(); tone(1800, .08, 'square', .05);
  const fx = $('#flashFx'); fx.style.transition = 'none'; fx.style.opacity = .85; requestAnimationFrame(() => { fx.style.transition = 'opacity .5s'; fx.style.opacity = 0; });
  addNoise(P.x, P.y, 2.5);
  const [dx, dy] = DIRV[P.dir]; let hit = 0;
  const inFront = (x, y, r) => { const vx = x - P.x, vy = y - P.y, d = Math.hypot(vx, vy); return d < r && (d < .6 || (vx * dx + vy * dy) / d > .55) && los(P.x, P.y, x, y); };
  for (const t of threats()) if (inFront(t.e.x, t.e.y, 4.5)) { t.stun(2.5 * DIFF.stun); hit++; }
  phoneUI();
  if (hit) { toast('閃光正面打在牠臉上——牠僵住了！'); return; }
  const sp = PHOTO_SPOTS.find(s => s.scene === G.scene && !G.flags['photo_' + s.id] && inFront(s.x, s.y, 4));
  if (sp) { G.flags['photo_' + sp.id] = 1; sfx.sting(); await says(sp.lines); if (sp.then) sp.then(); return; }
  toast('喀嚓。照片裡只有一片黑。');
}

/* ---------- 接進引擎 ---------- */
{ const _p = press; press = function (k) {
    if (k === 'phone') { if (G.mode === 'play' && !G.lock) phoneToggle(); return; }
    if (k === 'photo') { phonePhoto(); return; }
    return _p(k); }; }
{ const _u = update; update = function (dt) {
    _u(dt);
    if (G.mode !== 'play') { if (PH.open) phoneToggle(false); return; }
    const seen = phSeen(), r = P.light ? 5 : 3;
    for (let y = Math.floor(P.y - r); y <= P.y + r; y++) for (let x = Math.floor(P.x - r); x <= P.x + r; x++) if (x >= 0 && y >= 0 && x < W && y < H && dist(x + .5, y + .5, P.x, P.y) <= r) seen.add(y * W + x);
    if (PH.open) { PH.batt = Math.max(0, PH.batt - .35 * dt); if (PH.batt <= 0) { phoneToggle(false); toast('手機沒電了'); } else phoneMap(); }
    if (PH.open && Math.floor(G.t * 2) !== PH.tick) { PH.tick = Math.floor(G.t * 2); phoneUI(); }
  }; }
{ const _s = saveCP; saveCP = function (...a) { if (PH.batt < 70) { PH.batt = 70; } return _s(...a); }; }   // 存檔點順便充電
{ const _c = phoneCall; phoneCall = function (lines, num) {   // 沒有靜音：鈴聲會把附近的鬼引過來
    if (G.mode === 'play' && G.inv.phone) { if (PH.silent) toast('口袋裡的手機在震動……'); else addNoise(P.x, P.y, 7); }
    return _c(lines, num); }; }
{ const _h = updateHUD; updateHUD = function () {
    _h();
    if (!G.inv.phone) return;
    const inv = $('#inv'), old = [...inv.children].find(e => e.textContent === '手機');
    const el = document.createElement('div'); el.className = 'tap s' + (PH.open ? ' on' : '');
    el.innerHTML = `手機 ${Math.round(PH.batt)}%<em>${isTouch ? '點按打開' : 'P 打開・Q 拍照'}</em>`;
    el.addEventListener('pointerdown', ev => { ev.preventDefault(); press('phone'); });
    old ? old.replaceWith(el) : inv.appendChild(el);
  }; }
// 手機版：拍照按鈕放在手機畫面上就好（不另外加觸控鍵）
// 測試：?test=phone
async function testPhone() {
  try {
    G.inv.pages = [1, 2, 3, 4, 5, 6]; G.inv.mirror = true; G.inv.phone = true; await startCh3(); await waitFree();
    phoneToggle(true); await wait(300); if (!PH.open || !phSeen().size) throw 'map';
    Object.assign(HK, { x: P.x + DIRV[P.dir][0] * 2, y: P.y + DIRV[P.dir][1] * 2, state: 'search', timer: 99, path: null });
    const b0 = PH.batt; await phonePhoto(); if (!stunned(HK) || PH.batt > b0 - 19) throw 'flash ' + stunned(HK);
    document.title = 'PASS batt=' + Math.round(PH.batt);
  } catch (e) { document.title = 'ERR ' + e; }
}
if (typeof TEST !== 'undefined' && TEST === 'shot' && Q.get('phone')) setTimeout(() => { G.inv.phone = true; for (let y = 20; y < 40; y++) for (let x = 0; x < 40; x++) phSeen().add(y * W + x); phoneToggle(true); }, 400);   // 截圖：&phone=1
