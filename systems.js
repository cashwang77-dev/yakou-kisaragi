/* 夜校・如月　共用系統（2026-10-23）：恐懼值、憋氣、所有鬼的共用威脅清單、竹刀／板擦／滅火器
   載入順序在所有章節之後，用「包一層」接進引擎（update、render、updateHUD、damage、各章的抓人函式）。 */

/* ---------- 威脅清單：每隻鬼 {e: 位置物件, chase: 是否在追, stun(秒)} ---------- */
function threats() {
  const t = [];
  if (GH.active) t.push({ e: GH, chase: GH.state === 'chase', stun: s => { GH.state = 'stun'; GH.timer = s; } });
  if (G.scene === 3 && typeof AM === 'object' && !['off', 'frozen', 'toStand'].includes(AM.state)) t.push({ e: AM, chase: AM.state === 'chase', stun: s => { AM.stunT = G.t + s; } });
  if (G.scene === 4 && typeof HK === 'object' && !['off', 'seat'].includes(HK.state)) t.push({ e: HK, chase: HK.state === 'chase', stun: s => { HK.stunT = G.t + s; } });
  if (G.scene === 5 && typeof TK === 'object' && TK.state !== 'gone') t.push({ e: TK, chase: TK.state === 'chase', stun: s => { TK.stunT = G.t + s; } });
  if (G.scene === 5 && typeof PAX === 'object') for (const p of PAX) if (p.state === 'follow') t.push({ e: p, chase: true, stun: s => { p.stunT = G.t + s; } });
  return t;
}
const stunned = e => (e.stunT || 0) > G.t;
function nearestThreat() {
  let best = null, bd = 99;
  for (const t of threats()) { const d = dist(t.e.x, t.e.y, P.x, P.y); if (d < bd) { bd = d; best = t; } }
  return best ? { ...best, d: bd } : null;
}
// 各章的鬼：暈眩中不動（板擦、竹刀、滅火器）
if (typeof amUpdate === 'function') { const _f = amUpdate; amUpdate = function (dt) { if (stunned(AM)) { AM.moving = false; return; } return _f(dt); }; }
if (typeof hkUpdate === 'function') { const _f = hkUpdate; hkUpdate = function (dt) { if (stunned(HK)) { HK.moving = false; return; } return _f(dt); }; }
if (typeof tkUpdate === 'function') { const _f = tkUpdate; tkUpdate = function (dt) { if (stunned(TK)) { TK.moving = false; return; } return _f(dt); }; }
if (typeof paxUpdate === 'function') { const _f = paxUpdate; paxUpdate = function (dt) { const keep = PAX.filter(stunned).map(p => [p, p.x, p.y]); _f(dt); for (const [p, x, y] of keep) { p.x = x; p.y = y; p.moving = false; } }; }

/* ---------- 竹刀：被任何鬼抓到都能反擊（裂口女在 catchPlayer 自己處理） ---------- */
function weaponBlock(e, stun) {
  const w = G.inv.weapon; if (!w || G.mode !== 'play') return false;
  w.dur--; sfx.hit(); shake = 6; stun(w.id === 'shinai' ? 5 : w.id === 'broom' ? 3.5 : 2.5); P.inv = 1.5;
  toast(w.id === 'lid' ? '用垃圾桶蓋擋住了！' : `${w.name}打中了！牠退開了`);
  if (w.dur <= 0) { toast(w.name + '壞掉了'); G.inv.weapon = null; }
  updateHUD(); return true;
}
if (typeof amHit === 'function') { const _f = amHit; amHit = async function () { if (weaponBlock(AM, s => { AM.stunT = G.t + s; })) return; return _f(); }; }
if (typeof hkDrag === 'function') { const _f = hkDrag; hkDrag = async function () { if (weaponBlock(HK, s => { HK.stunT = G.t + s; HK.state = 'patrol'; HK.path = null; })) return; return _f(); }; }
if (typeof tkCatch === 'function') { const _f = tkCatch; tkCatch = async function () { if (weaponBlock(TK, s => { TK.stunT = G.t + s; TK.state = 'track'; })) return; return _f(); }; }
if (typeof paxCatch === 'function') { const _f = paxCatch; paxCatch = async function (p) { if (weaponBlock(p, s => { p.stunT = G.t + s; p.state = 'back'; })) return; return _f(p); }; }

/* ---------- 板擦：落地／打中的地方 1.6 格內的鬼看不見 4 秒 ---------- */
function eraserHit(x, y) {
  noise(.25, .12, 'highpass', 2500, 1); let hit = 0;
  for (const t of threats()) if (dist(t.e.x, t.e.y, x, y) < 1.8) { t.stun(4); hit++; }
  G.puffs = (G.puffs || []).concat({ x, y, t: G.t, r: 1.4, end: G.t + 1.2, c: '235,235,225' });
  toast(hit ? '粉筆灰糊住了牠的眼睛！' : '板擦掉在地上，揚起一片粉筆灰');
}

/* ---------- 滅火器：周圍噴出煙霧，鬼暈眩 3 秒；7 秒內站在煙裡鬼看不到妳 ---------- */
function useExt() {
  if (G.mode !== 'play' || G.lock || !G.inv.ext || P.hidden) return;
  G.inv.ext--; G.smoke = { x: P.x, y: P.y, end: G.t + 7 };
  noise(1.6, .22, 'highpass', 1800, .7); shake = 3;
  for (const t of threats()) if (dist(t.e.x, t.e.y, P.x, P.y) < 3.8) t.stun(3);
  toast('白煙一下子噴滿了四周！（7 秒）'); updateHUD();
}
const smokeHide = () => !!(G.smoke && G.t < G.smoke.end && dist(P.x, P.y, G.smoke.x, G.smoke.y) < 3.2);

/* ---------- 恐懼值與憋氣 ---------- */
const FEAR = { breath: 100, holding: false, exposeT: 0, panicT: 0, coughed: 0 };
function fearUpdate(dt) {
  const f0 = G.fear || 0, nt = nearestThreat(), d = nt ? nt.d : 99;
  const safe = typeof sceneSafe === 'function' && sceneSafe(P.x, P.y);
  const lit = LIGHTS.some(l => l.r > 1 && dist(l.x, l.y, P.x, P.y) < l.r * .7);
  let df = 0;
  if (d < 8) df += (8 - d) / 8 * (nt.chase ? 20 : 8);
  else df -= 5;
  if (lit || P.light) df -= 2;
  if (safe) df -= 14;
  if (P.hidden && d < 4.5 && !FEAR.holding) df += 6;
  const calm = P.hidden || (GH.active && GH.mode === 'script');   // 躲著（摀住嘴）或腳本演出中：不會尖叫
  G.fear = FEAR.lock != null ? FEAR.lock : clamp(f0 + df * dt, 0, calm ? 95 : 100);   // lock：截圖用
  // 腿軟：恐懼值滿了 → 尖叫（引鬼過來）、2 秒動不了
  if (G.fear >= 100 && G.t > FEAR.panicT) {
    FEAR.panicT = G.t + 12; G.fear = 72; P.stun = G.t + 1.8; setPose('hurt', 1.8);
    addNoise(P.x, P.y, 7); tone(620, .6, 'sawtooth', .05, 300); toast('受不了了——忍不住叫出聲來！');
  }
  G.fearSlow = (P.stun || 0) > G.t ? 0 : G.fear > 75 ? .82 : 1;
  // 憋氣：躲起來、鬼在 4.5 格內才需要
  const scripted = GH.active && GH.mode === 'script';   // 第一章裂口女進教室的腳本演出：不會被發現
  const need = P.hidden && d < 4.5;
  FEAR.holding = need && (K.run || !!TEST);           // 自動測試裡一律當作有憋氣
  if (FEAR.holding) FEAR.breath = Math.max(0, FEAR.breath - 20 * dt);
  else FEAR.breath = Math.min(100, FEAR.breath + 28 * dt);
  if (scripted) FEAR.exposeT = 0;
  else if (need && FEAR.breath <= 0) expose('憋不住了，咳了出來——！');
  else if (need && !FEAR.holding && d < 3) {
    FEAR.exposeT += dt;
    if (FEAR.exposeT > 1) { FEAR.exposeT = 0; if (Math.random() < .3) expose('呼吸聲太大了——被發現了！'); }
  } else FEAR.exposeT = 0;
  if (need !== FEAR.need && FEAR.lock == null) { FEAR.need = need; if (need) toast(isTouch ? '牠就在旁邊……按住「跑」憋氣！' : '牠就在旁邊……按住 Shift 憋氣！'); updateHUD(); }
}
function expose(msg) {
  const o = P.hidden; if (!o) return;
  FEAR.breath = 35; noise(.35, .2, 'bandpass', 900, 1.5); toast(msg); addNoise(P.x, P.y, 5); G.fear = Math.min(100, (G.fear || 0) + 20);
  unhide(); P.inv = 0;
  if (GH.active && dist(GH.x, GH.y, P.x, P.y) < 6) { GH.state = 'chase'; GH.path = null; GH.lastSeenT = G.t; }
}

/* ---------- 接進引擎 ---------- */
const _updateS = update;
update = function (dt) {
  _updateS(dt);
  if (G.mode !== 'play' || G.lock) return;
  fearUpdate(dt);
  const nt = nearestThreat();   // 所有鬼都會讓畫面變紅、心跳（原本只有裂口女）
  if (nt) G.danger = Math.max(G.danger || 0, clamp(1 - nt.d / 9, 0, 1) * (nt.chase ? 1 : .6));
  if (G.puffs) G.puffs = G.puffs.filter(p => G.t < p.end);
  if (Math.floor(G.t * 2) !== Math.floor((G.t - dt) * 2)) fearBar();
};
// 腿軟時不能動
const _moveEntS = moveEnt;
moveEnt = function (e, dx, dy) { if (e === P && (P.stun || 0) > G.t) return; return _moveEntS(e, dx, dy); };
const _damageS = damage;
damage = function (n) { G.fear = Math.min(100, (G.fear || 0) + 18 * n); return _damageS(n); };
const _stingS = sfx.sting;
sfx.sting = function () { if (G.mode === 'play') G.fear = Math.min(100, (G.fear || 0) + 8); return _stingS.apply(this, arguments); };

// 恐懼條（心形下面、體力條旁）＋憋氣條
function fearBar() {
  let el = document.getElementById('fearbar');
  if (!el) {
    el = document.createElement('div'); el.id = 'fearbar';
    el.innerHTML = '<small>恐懼</small><i><b></b></i><span class="br"><small>憋氣</small><i><b></b></i></span>';
    const st = document.createElement('style');
    st.textContent = '#fearbar{position:absolute;left:calc(var(--u)*8);top:calc(var(--u)*30);display:flex;align-items:center;gap:calc(var(--u)*3);font-size:calc(var(--u)*7);color:#c9b9d8;pointer-events:none}#fearbar i{display:block;width:calc(var(--u)*46);height:calc(var(--u)*3);background:rgba(255,255,255,.12)}#fearbar b{display:block;height:100%;background:#9a5ac8;transition:width .3s}#fearbar .br{display:none;align-items:center;gap:calc(var(--u)*3);margin-left:calc(var(--u)*6);color:#a8d0e8}#fearbar .br b{background:#6ab0e0}#fearbar.need .br{display:flex}#fearbar.hi>i b{background:#c84a6a}.phone #fearbar{top:calc(var(--u)*34);font-size:calc(var(--u)*9)}';
    document.head.appendChild(st); $('#hud').appendChild(el);
  }
  const f = G.fear || 0;
  el.querySelector('i b').style.width = f + '%';
  el.classList.toggle('hi', f > 75); el.classList.toggle('need', !!FEAR.need);
  el.querySelector('.br b').style.width = FEAR.breath + '%';
}
const _updateHUDS = updateHUD;
updateHUD = function () { _updateHUDS(); fearBar(); };

// 畫面效果：恐懼值高 → 色偏、雜訊、手電筒閃爍；滅火器的煙；板擦的粉筆灰
const _renderS = render;
render = function () {
  _renderS();
  if (G.mode === 'title') return;
  const f = (G.fear || 0) / 100;
  for (const p of (G.puffs || []).concat(G.smoke && G.t < G.smoke.end ? [{ x: G.smoke.x, y: G.smoke.y, r: 3.4, c: '210,214,220', end: G.smoke.end, smoke: 1 }] : [])) {
    const [sx, sy] = iso(p.x, p.y), k = Math.min(1, (p.end - G.t) / 1.2), R = p.r * 20;
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * 6.28 + G.t * (p.smoke ? .4 : 1.5), rr = R * (.35 + .5 * ((i * 37) % 10) / 10);
      const g = ctx.createRadialGradient(sx + Math.cos(a) * rr, sy - 10 + Math.sin(a) * rr * .5, 0, sx + Math.cos(a) * rr, sy - 10 + Math.sin(a) * rr * .5, R * .55);
      g.addColorStop(0, `rgba(${p.c},${.45 * k})`); g.addColorStop(1, `rgba(${p.c},0)`); ctx.fillStyle = g; ctx.fillRect(sx - R * 2, sy - R * 2, R * 4, R * 4);
    }
  }
  if (f > .5) {   // 色偏：整個畫面往左右錯開一點點、疊紅藍
    const k = (f - .5) * 2, off = Math.round(1 + k * 2 + (Math.random() < .1 ? 2 : 0));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .12 * k;
    ctx.drawImage(ctx.canvas, off, 0); ctx.globalAlpha = .1 * k; ctx.drawImage(ctx.canvas, -off, 0); ctx.restore();
    ctx.fillStyle = `rgba(90,0,30,${.08 * k})`; ctx.fillRect(0, 0, VW, VH);
    if (Math.random() < .04 * k) { ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(0, Math.random() * VH, VW, 2 + Math.random() * 6); }
  }
  if (f > .75 && P.light && Math.random() < .08) { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, VW, VH); }   // 手電筒接觸不良
};
// 讀檔、重來時恐懼值歸零
const _loadCPS = loadCP;
loadCP = function (cp) { G.fear = 0; G.smoke = null; G.puffs = []; FEAR.breath = 100; P.stun = 0; return _loadCPS(cp); };

/* ---------- 自動測試 ---------- */
// ?test=items：每個場景的每個道具都放在走得到的格子上（不是牆、不是家具）
async function testItems() {
  const bad = [];
  for (const n of [1, 2, 3, 4, 5]) {
    loadScene(n);
    for (const it of ITEMS) { if (it.id === 'phone') continue;   // 手機本來就放在課桌抽屜裡
      const x = Math.floor(it.x), y = Math.floor(it.y); if (solidTile(x, y) || OBJAT[x + ',' + y]) bad.push(`${n}:${it.id}@${x},${y}`); }
  }
  document.title = (bad.length ? 'FAIL ' : 'PASS ') + bad.join(' ');
}
// ?test=fear：鬼靠近 → 恐懼值上升；躲起來不憋氣 → 會被發現；竹刀擋住妃姬子
async function testFear() {
  try {
    G.inv.pages = [1, 2, 3, 4, 5, 6]; G.inv.mirror = true; await startCh3(); await waitFree();
    Object.assign(HK, { x: 19.5, y: 21.2, state: 'search', timer: 99, path: null }); P.x = 19.5; P.y = 23; P.inv = 0;
    G.fear = 0; const t0 = G.t; while (G.t - t0 < 2) await wait(20);
    if (!(G.fear > 5)) throw 'fear ' + G.fear;
    G.inv.weapon = { id: 'shinai', name: '竹刀', dur: 3 }; G.hearts = 5;
    await hkDrag(); if (G.inv.weapon.dur !== 2 || G.hearts !== 5 || !stunned(HK)) throw 'shinai';
    G.inv.ext = 1; useExt(); if (!smokeHide() || !pInvis()) throw 'smoke';
    document.title = 'PASS fear=' + Math.round(G.fear);
  } catch (e) { document.title = 'ERR ' + e; }
}
// 截圖：&fear=0-100（看恐懼效果）、&smoke=1（滅火器煙霧）
if (typeof TEST !== 'undefined' && TEST === 'shot') setTimeout(() => { if (Q.get('fear')) { FEAR.lock = G.fear = +Q.get('fear'); FEAR.need = !!Q.get('breath'); fearBar(); } if (Q.get('smoke')) G.smoke = { x: P.x + 1, y: P.y, end: G.t + 99 }; }, 300);

/* ---------- 環境音（Gemini 生成的循環音檔）：戶外雨聲／校舍走廊／如月車站，依位置淡入淡出 ---------- */
const AMB = { rain: { f: 'assets/amb_rain.mp3', v: .55 }, hall: { f: 'assets/amb_hall.mp3', v: .5 }, station: { f: 'assets/amb_station.mp3', v: .55 } };
for (const k in AMB) AMB[k].el = null;
function ambWant() {
  if (G.mode !== 'play') return null;
  if (G.scene === 5) return 'station';
  return isInside(P.x, P.y) ? 'hall' : 'rain';
}
function ambUpdate(dt) {
  if (!A.ctx || TEST) return;                // 還沒有使用者操作（瀏覽器不准出聲）或在測試
  const want = ambWant(), vs = typeof VOL === 'object' ? VOL.s : 1;
  for (const [k, a] of Object.entries(AMB)) { if (!a || !a.f) continue;
    const target = k === want ? a.v * vs : 0;
    if (target > 0 && !a.el) { a.el = new Audio(a.f); a.el.loop = true; a.el.volume = 0; if (a.el.volume !== 0) AMB.fixedVol = true; a.el.play().catch(() => { }); }   // iPhone：音量改不動
    if (!a.el) continue;
    if (AMB.fixedVol) { if (target > 0 && a.el.paused) a.el.play().catch(() => { }); if (target === 0 && !a.el.paused) a.el.pause(); continue; }
    const v = a.el.volume + Math.sign(target - a.el.volume) * Math.min(Math.abs(target - a.el.volume), dt * .6);
    a.el.volume = clamp(v, 0, 1);
    if (target > 0 && a.el.paused) a.el.play().catch(() => { });
    if (target === 0 && a.el.volume < .01 && !a.el.paused) a.el.pause();
  }
  if (A.rain && AMB.rain.el && !AMB.rain.el.paused) A.rain.gain.setTargetAtTime(.008, A.ctx.currentTime, .5);   // 有真的雨聲時，合成雨聲調小
}
const _updateA = update;
update = function (dt) { _updateA(dt); ambUpdate(dt); };
// 回到標題、結束畫面、暫停聲音設定時停掉
setInterval(() => { if (G.mode !== 'play') for (const a of Object.values(AMB)) if (a && a.el && !a.el.paused) { if (AMB.fixedVol) { a.el.pause(); continue; } a.el.volume = Math.max(0, a.el.volume - .1); if (a.el.volume < .02) a.el.pause(); } }, 100);
