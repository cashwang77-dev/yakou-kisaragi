/* 夜校・如月　多人合作（測試版，2026-10-29）：PeerJS 點對點、開房者當主機，零成本。
   用本體的引擎、地圖、光影、角色與怪物 AI。每場隨機場景（1 操場／2 第二章上／3 第二章下／4 舊校舍）＋隨機怪物（裂口女、人體模型、妃姬子）。
   主機跑怪物：每次更新前把 P 暫時換成「離這隻怪物最近、還站著的玩家」，跑完再換回來；怪物抓人＝那位玩家倒地，隊友靠近 2 秒扶起。
   找齊 3 把鑰匙、全員回到出生點＝逃脫成功；全員倒地＝失敗。多人模式不存檔、不觸發劇情。載入順序：最後。 */
const COOP = { on: false, host: false, id: null, peer: null, conns: [], hc: null, P: {}, keys: [], cfg: null, focus: null, sendT: 0, view: {}, name: '' };
const COOP_SCENES = {
  1: { spawn: [27.5, 38.7], mons: ['kuchi'] },
  2: { spawn: [4.5, 23.2], mons: ['kuchi'] },
  3: { spawn: [4.5, 17], mons: ['kuchi', 'am'] },
  4: { spawn: [19.5, 35.5], mons: ['kuchi', 'hk'] },
};
const COOP_NAME = { kuchi: '裂口女', am: '人體模型', hk: '妃姬子' };
const COOP_COLS = ['#ff8a80', '#82b1ff', '#a5d6a7', '#ffe082'];
const coopSend = o => { const s = JSON.stringify(o); if (COOP.host) COOP.conns.forEach(c => c.open && c.send(s)); else if (COOP.hc && COOP.hc.open) COOP.hc.send(s); };
const coopMe = () => ({ x: +P.x.toFixed(2), y: +P.y.toFixed(2), d: P.dir, m: P.moving ? 1 : 0, r: P.run ? 1 : 0, f: P.frame || 0, cr: P.crouch ? 1 : 0, li: P.light ? 1 : 0, hd: P.hidden ? P.hidden.x + ',' + P.hidden.y : null });

/* ---------- 大廳介面 ---------- */
(() => {
  const st = document.createElement('style');
  st.textContent = `#coopP{z-index:13}#coopP .hb{width:min(92vw,calc(var(--u)*380));text-align:center}
#coopP h2{font-family:"Noto Serif TC",serif;letter-spacing:.2em;font-size:calc(var(--u)*16);margin:0 0 calc(var(--u)*4)}
#coopP p{color:var(--dim);font-size:calc(var(--u)*9);margin:calc(var(--u)*4) 0}
#coopP input{font:inherit;font-size:calc(var(--u)*11);padding:calc(var(--u)*4);width:100%;background:#0c0a0d;color:var(--ink);border:1px solid #6b655c;margin:calc(var(--u)*3) 0;touch-action:manipulation}
#coopCode{font:700 calc(var(--u)*24)/1 monospace;letter-spacing:.3em;color:#ffd36a;margin:calc(var(--u)*6) 0}
#coopChat{position:absolute;left:calc(var(--u)*8);bottom:calc(var(--u)*48);width:min(50%,calc(var(--u)*240));z-index:9;pointer-events:none}
#coopLog div{font-size:calc(var(--u)*8.5);text-shadow:0 0 4px #000;animation:cfade 10s forwards}@keyframes cfade{85%{opacity:1}100%{opacity:0}}
#coopMsg{pointer-events:auto;width:100%;font:inherit;font-size:calc(var(--u)*9);background:rgba(0,0,0,.55);color:var(--ink);border:1px solid #514c47;padding:calc(var(--u)*2) calc(var(--u)*4)}`;
  document.head.appendChild(st);
  const el = document.createElement('div'); el.id = 'coopP'; el.className = 'ui full hide';
  el.innerHTML = `<div class="hb"><h2>多人合作（測試版）</h2><p>2～4 人。每場隨機場景、隨機怪物。<br>一起找到 3 把鑰匙，再回到出發的地方。被抓會倒地——隊友靠近 2 秒可以扶起來。</p>
<div id="coopA"><input id="coopName" placeholder="你的名字" maxlength="8"><div class="btns"><button id="coopHost">建立房間</button></div>
<input id="coopJoin" placeholder="房號（4 碼）" maxlength="4" style="text-transform:uppercase"><div class="btns"><button id="coopJoinB">加入</button><button id="coopBack">返回</button></div></div>
<div id="coopB" class="hide"><p>把房號告訴朋友，用同一個網址按「多人合作」→「加入」</p><div id="coopCode"></div><p id="coopWho"></p><div class="btns"><button id="coopStart">開始</button></div></div>
<p id="coopMsgP"></p></div>`;
  document.getElementById('wrap').appendChild(el);
  const ch = document.createElement('div'); ch.id = 'coopChat'; ch.className = 'hide'; ch.innerHTML = '<div id="coopLog"></div><input id="coopMsg" placeholder="Enter 聊天" maxlength="50">';
  document.getElementById('wrap').appendChild(ch);
  $('#title .btns').insertAdjacentHTML('beforeend', '<button id="bCoop">👥 多人合作（測試）</button>');
  $('#bCoop').onclick = () => { try { $('#coopName').value = localStorage.getItem('yko_name') || ''; } catch (e) { } el.classList.remove('hide'); };
  $('#coopBack').onclick = () => el.classList.add('hide');
  $('#coopHost').onclick = () => coopNet(true);
  $('#coopJoinB').onclick = () => coopNet(false);
  $('#coopStart').onclick = () => coopStartHost();
  $('#coopMsg').addEventListener('keydown', e => { e.stopPropagation(); if (e.key !== 'Enter') return; const s = e.target.value.trim(); e.target.value = ''; e.target.blur(); if (!s) return; if (COOP.host) coopChat(COOP.P[COOP.id].n, s, true); else coopSend({ t: 'chat', s }); });
})();
function coopLog(t) { const d = document.createElement('div'); d.textContent = t; $('#coopLog').appendChild(d); while ($('#coopLog').childElementCount > 5) $('#coopLog').firstChild.remove(); }
function coopChat(n, s, relay) { coopLog((n ? n + '：' : '') + s); if (relay && COOP.host) coopSend({ t: 'chat', n, s }); }
const coopSys = s => coopChat('', s, true);
function loadPeer() { return new Promise((res, rej) => { if (window.Peer) return res(); const sc = document.createElement('script'); sc.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'; sc.onload = res; sc.onerror = () => rej('無法載入連線元件'); document.head.appendChild(sc); }); }

/* ---------- 連線 ---------- */
async function coopNet(host) {
  const msg = t => $('#coopMsgP').textContent = t;
  COOP.name = $('#coopName').value.trim() || (host ? '房主' : '同學'); try { localStorage.setItem('yko_name', COOP.name); } catch (e) { }
  try { await loadPeer(); } catch (e) { msg(e); return; }
  COOP.host = host; msg('連線中……');
  if (host) {
    const code = Array.from({ length: 4 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.random() * 31 | 0]).join('');
    const pr = COOP.peer = new Peer('yakou-coop-' + code);
    pr.on('open', id => { COOP.id = id; COOP.P = {}; coopAdd(id, COOP.name); $('#coopA').classList.add('hide'); $('#coopB').classList.remove('hide'); $('#coopCode').textContent = code; coopWho(); msg(''); });
    pr.on('connection', c => {
      c.on('open', () => { if (Object.keys(COOP.P).length >= 4 || COOP.on) { c.send(JSON.stringify({ t: 'full' })); return; } COOP.conns.push(c); });
      c.on('data', raw => coopHostMsg(c.peer, JSON.parse(raw)));
      c.on('close', () => { COOP.conns = COOP.conns.filter(x => x !== c); if (COOP.P[c.peer]) { coopSys(COOP.P[c.peer].n + ' 離開了'); delete COOP.P[c.peer]; coopWho(); } });
    });
    pr.on('error', e => msg('連線錯誤：' + e.type));
  } else {
    const code = $('#coopJoin').value.trim().toUpperCase(); if (code.length !== 4) { msg('請輸入 4 碼房號'); return; }
    const pr = COOP.peer = new Peer();
    pr.on('open', id => {
      COOP.id = id; const c = COOP.hc = pr.connect('yakou-coop-' + code, { reliable: true });
      c.on('open', () => { c.send(JSON.stringify({ t: 'hi', n: COOP.name })); $('#coopA').classList.add('hide'); msg('已加入，等房主開始……'); });
      c.on('data', raw => coopClientMsg(JSON.parse(raw)));
      c.on('close', () => coopLog('與房主的連線中斷了'));
      setTimeout(() => { if (!c.open) msg('找不到這個房間（房號錯誤，或網路擋住了點對點連線，可以改用手機網路試試）'); }, 9000);
    });
    pr.on('error', e => msg('連線錯誤：' + e.type));
  }
}
function coopAdd(id, n) { const i = Object.keys(COOP.P).length; COOP.P[id] = { n, c: COOP_COLS[i % 4], i, x: 0, y: 0, d: 4, m: 0, r: 0, f: 0, cr: 0, li: 0, hd: null, down: 0, rv: 0 }; }
function coopWho() { $('#coopWho').textContent = '目前：' + Object.values(COOP.P).map(p => p.n).join('、'); }
function coopHostMsg(id, m) {
  if (m.t === 'hi') { coopAdd(id, m.n); coopWho(); coopSys(m.n + ' 加入了'); }
  else if (m.t === 'in') { const p = COOP.P[id]; if (p && !p.down) Object.assign(p, m, { t: undefined }); }
  else if (m.t === 'key') coopTakeKey(m.i, id);
  else if (m.t === 'shout') coopShout(id);
  else if (m.t === 'ping') coopPing(id, m.x, m.y);
  else if (m.t === 'chat') coopChat(COOP.P[id] ? COOP.P[id].n : '?', m.s, true);
}
function coopClientMsg(m) {
  if (m.t === 'start') coopBegin(m.cfg);
  else if (m.t === 'w') coopApply(m);
  else if (m.t === 'chat') coopChat(m.n, m.s);
  else if (m.t === 'pg') coopAddPing(m);
  else if (m.t === 'end') coopEnd(m.win);
  else if (m.t === 'full') $('#coopMsgP').textContent = '房間已滿或已經開始了';
}

/* ---------- 開始：主機抽場景與怪物，大家用同一份設定開局 ---------- */
function coopStartHost() {
  const sc = [1, 2, 3, 4][Math.random() * 4 | 0], pool = COOP_SCENES[sc].mons;
  let mons = pool.length > 1 ? [[pool[1]], [pool[0]], pool][Math.random() * 3 | 0] : pool.slice();
  const cfg = { scene: sc, mons, keys: null };
  coopBegin(cfg);   // 主機先開局，用自己的地圖算鑰匙位置
  cfg.keys = COOP.keys.map(k => [k.x, k.y]);
  coopSend({ t: 'start', cfg });
}
function coopBegin(cfg) {
  COOP.on = true; COOP.cfg = cfg; $('#coopP').classList.add('hide'); $('#coopChat').classList.remove('hide');
  audioInit(); resetWorld(); if (G.scene !== cfg.scene) loadScene(cfg.scene);
  const S = COOP_SCENES[cfg.scene], me = COOP.P[COOP.id] || { i: 0 };
  Object.assign(P, { x: S.spawn[0] + ((me.i || 0) % 2) * .6, y: S.spawn[1] - Math.floor((me.i || 0) / 2) * .6, dir: 0, hidden: null, crouch: false, pose: null, stun: 0 });
  G.inv.flashlight = true; P.light = true; G.inv.bandage = 1;
  $('#title').classList.add('hide'); startPlay();
  // 怪物
  GH.active = false;
  if (typeof AM === 'object') AM.state = 'off';
  if (typeof HK === 'object') HK.state = 'off';
  if (cfg.mons.includes('kuchi')) { const far = PATROL.map(w => [dist(w[0], w[1], P.x, P.y), w]).sort((a, b) => b[0] - a[0])[0][1]; spawnGhost(far[0], far[1]); }
  if (cfg.mons.includes('am') && typeof AM === 'object') Object.assign(AM, { state: 'patrol', wp: 0, x: AM_PATROL[0][0], y: AM_PATROL[0][1] });
  if (cfg.mons.includes('hk') && typeof HK === 'object') Object.assign(HK, { state: 'patrol', wp: 0, x: HK_PATROL[2][0], y: HK_PATROL[2][1] });
  // 鑰匙
  if (cfg.keys) COOP.keys = cfg.keys.map(([x, y]) => ({ x, y, t: 0 }));
  else {
    const c = reachTiles().filter(([x, y]) => dist(x + .5, y + .5, P.x, P.y) > 7), out = [];
    for (let i = 0; i < 400 && out.length < 3; i++) { const p = c[Math.random() * c.length | 0]; if (p && out.every(o => dist(o[0], o[1], p[0], p[1]) > 7)) out.push(p); }
    COOP.keys = out.map(([x, y]) => ({ x: x + .5, y: y + .5, t: 0 }));
  }
  chapter('多人合作', ['', '操場', '二年B班的樓層', '特別教室棟', '舊校舍'][cfg.scene] + '・' + cfg.mons.map(m => COOP_NAME[m]).join('、'));
  coopObj();
  coopLog(`這次的地點：${['', '操場', '二年B班的樓層', '特別教室棟', '舊校舍'][cfg.scene]}。出沒的是——${cfg.mons.map(m => COOP_NAME[m]).join('、')}。`);
}
const coopObj = () => { const n = COOP.keys.filter(k => k.t).length; setObj(n < COOP.keys.length ? `找鑰匙 ${n} / ${COOP.keys.length}` : '全員回到出發的地方！'); };

/* ---------- 主機：怪物鎖定最近的玩家、倒地救援、勝負 ---------- */
function coopFocus(e) {   // 這隻怪物最近、還站著的玩家；有人大喊「這邊！」的 4 秒內，14 格內的怪物改追她
  const L = COOP.lure; if (L && G.t < L.until && COOP.P[L.id] && !COOP.P[L.id].down) { const q = L.id === COOP.id ? coopMe() : COOP.P[L.id]; if (dist(q.x, q.y, e.x, e.y) < 14) return [L.id, q]; }
  let best = null, bd = 1e9;
  for (const [id, p] of Object.entries(COOP.P)) { if (p.down) continue; const q = id === COOP.id ? coopMe() : p; const d = dist(q.x, q.y, e.x, e.y); if (d < bd) { bd = d; best = [id, q]; } }
  return best;
}
function coopSwap(e, fn) {
  const f = coopFocus(e); if (!f) return;
  const [id, q] = f; COOP.focus = id; e._cf = id;   // 記在怪物身上：抓人動作可能延遲觸發
  if (id === COOP.id) { fn(); COOP.focus = null; return; }
  const keep = { x: P.x, y: P.y, light: P.light, crouch: P.crouch, hidden: P.hidden, inv: P.inv, run: P.run, moving: P.moving };
  Object.assign(P, { x: q.x, y: q.y, light: !!q.li, crouch: !!q.cr, hidden: q.hd ? OBJAT[q.hd] || null : null, inv: 0, run: !!q.r, moving: !!q.m });
  try { fn(); } finally { Object.assign(P, keep); COOP.focus = null; }
}
function coopDown(id) {
  const p = COOP.P[id]; if (!p || p.down) return;
  p.down = 1; p.rv = 0; coopSys(`${p.n} 被抓住了！快去扶她起來`);
  if (GH.active) { GH.state = 'pause'; GH.timer = 2.5; }
  if (typeof AM === 'object' && AM.state === 'chase') AM.state = 'patrol';
  if (typeof HK === 'object' && HK.state === 'chase') { HK.state = 'patrol'; HK.path = null; }
}
// 怪物更新：主機包一層換 P；客戶端完全不跑（位置由主機同步）
{ const _g = ghostUpdate; ghostUpdate = function (dt) { if (!COOP.on) return _g(dt); if (!COOP.host) return; coopSwap(GH, () => _g(dt)); }; }
if (typeof amUpdate === 'function') { const _a = amUpdate; amUpdate = function (dt) { if (!COOP.on) return _a(dt); if (!COOP.host) return; coopSwap(AM, () => _a(dt)); }; }
if (typeof hkUpdate === 'function') { const _h = hkUpdate; hkUpdate = function (dt) { if (!COOP.on) return _h(dt); if (!COOP.host) return; coopSwap(HK, () => _h(dt)); }; }
// 抓人＝倒地（不跑原本的劇情對話）
{ const _c = catchPlayer; catchPlayer = async function (pulled) { if (!COOP.on) return _c(pulled); coopDown(COOP.focus || GH._cf || COOP.id); }; }
if (typeof amHit === 'function') { const _a = amHit; amHit = async function () { if (!COOP.on) return _a(); coopDown(COOP.focus || AM._cf || COOP.id); }; }
if (typeof hkDrag === 'function') { const _h = hkDrag; hkDrag = async function () { if (!COOP.on) return _h(); coopDown(COOP.focus || HK._cf || COOP.id); }; }
// 多人模式：不存檔、不觸發劇情、不能撿手機（會換章）
{ const _s = saveCP; saveCP = function (n) { if (COOP.on) return; return _s(n); }; }
{ const _t = checkTriggers; checkTriggers = function () { if (COOP.on) return; return _t(); }; }
{ const _k = takeItem; takeItem = async function (it) { if (COOP.on && it.id === 'phone') { toast('（多人模式：先找鑰匙！）'); return; } return _k(it); }; }
objAction = (_o => async function (o) {
  if (!COOP.on) return _o(o);
  if (o.act === 'frag' || o.act === 'hwpk' || o.act === 'xmgift') return _o(o);
  toast('（多人模式：先找鑰匙！）');
})(objAction);
function coopTakeKey(i, id) {
  const k = COOP.keys[i]; if (!k || k.t) return;
  k.t = 1; const n = COOP.keys.filter(q => q.t).length; coopSys(`${COOP.P[id] ? COOP.P[id].n : '?'} 找到了一把鑰匙（${n} / ${COOP.keys.length}）`); coopObj();
}
function coopHostTick(dt) {
  const me = COOP.P[COOP.id]; Object.assign(me, coopMe());
  for (const [id, p] of Object.entries(COOP.P)) {
    const q = id === COOP.id ? me : p;
    if (p.down) {   // 扶起
      const helper = Object.entries(COOP.P).find(([j, o]) => j !== id && !o.down && dist(o.x, o.y, q.x, q.y) < 1.3);
      p.rv = helper ? p.rv + dt : 0; if (p.rv >= 2) { p.down = 0; p.rv = 0; coopSys(`${p.n} 被扶起來了`); }
    } else COOP.keys.forEach((k, i) => { if (!k.t && dist(k.x, k.y, q.x, q.y) < .8) coopTakeKey(i, id); });
  }
  // 手電筒壓制：拿手電筒正對 4 格內的怪物照 1.2 秒 → 牠僵住 2.5 秒（每人冷卻 10 秒）
  for (const [id, p] of Object.entries(COOP.P)) {
    const q = id === COOP.id ? me : p; if (p.down || !q.li || q.hd) { p.fl = 0; continue; }
    const sv = SCR[q.d] || [0, 1], sl = Math.hypot(sv[0], sv[1]);
    const t = threats().find(t => { const dx = t.e.x - q.x, dy = t.e.y - q.y, d = Math.hypot(dx, dy); if (d > 4 || stunned(t.e) || t.e.state === 'stun') return false; const sx = dx - dy, sy = (dx + dy) / 2, l = Math.hypot(sx, sy) || 1; return (sx * sv[0] + sy * sv[1]) / l / sl > .72; });
    p.fl = t ? (p.fl || 0) + dt : 0;
    if (t && p.fl > 1.2 && G.t > (p.flCD || 0)) { t.stun(2.5); p.flCD = G.t + 10; p.fl = 0; coopSys(`🔦 ${p.n} 用手電筒照住了${HW_NAME ? (HW_NAME().get(t.e) || '鬼') : '鬼'}，牠僵住了！`); }
  }
  const all = Object.values(COOP.P), S = COOP_SCENES[COOP.cfg.scene].spawn;
  if (all.length && all.every(p => p.down)) { coopSend({ t: 'end', win: 0 }); coopEnd(0); }
  else if (COOP.keys.every(k => k.t) && all.filter(p => !p.down).every(p => dist(p.x, p.y, S[0], S[1]) < 2.6)) { coopSend({ t: 'end', win: 1 }); coopEnd(1); }
}
/* ---------- 同步 ---------- */
const MON_F = ['x', 'y', 'dir', 'state', 'frame', 'moving', 'active', 'atk', 'animD'];
const pickF = e => { const o = {}; MON_F.forEach(k => { if (e[k] !== undefined) o[k] = e[k]; }); return o; };
function coopApply(m) {
  for (const [id, p] of Object.entries(m.p)) { if (!COOP.P[id]) COOP.P[id] = {}; Object.assign(COOP.P[id], p); }
  for (const id of Object.keys(COOP.P)) if (!m.p[id]) delete COOP.P[id];
  Object.assign(GH, m.g); if (m.am && typeof AM === 'object') Object.assign(AM, m.am); if (m.hk && typeof HK === 'object') Object.assign(HK, m.hk);
  m.k.forEach((t, i) => { if (COOP.keys[i] && t && !COOP.keys[i].t) { COOP.keys[i].t = 1; coopObj(); } });
  const mine = COOP.P[COOP.id];
  if (mine && mine.down && !P.downC) { P.downC = 1; P.stun = G.t + 9999; setPose('down', 9999); P.light = false; }
  else if (mine && !mine.down && P.downC) { P.downC = 0; P.stun = 0; P.pose = null; toast('被扶起來了！'); }
}
{ const _u = update; update = function (dt) {
    const r = _u(dt);
    if (!COOP.on || G.mode !== 'play') return r;
    if (COOP.host) {
      coopHostTick(dt);
      const meP = COOP.P[COOP.id];
      if (meP.down && !P.downC) { P.downC = 1; P.stun = G.t + 9999; setPose('down', 9999); P.light = false; }
      else if (!meP.down && P.downC) { P.downC = 0; P.stun = 0; P.pose = null; toast('被扶起來了！'); }
    } else COOP.keys.forEach((k, i) => { if (!k.t && !P.downC && dist(k.x, k.y, P.x, P.y) < .8) { k.sent = k.sent || 0; if (G.t - k.sent > 1) { k.sent = G.t; coopSend({ t: 'key', i }); } } });
    COOP.sendT -= dt;
    if (COOP.sendT <= 0) {
      COOP.sendT = 1 / 15;
      if (COOP.host) coopSend({ t: 'w', p: COOP.P, g: pickF(GH), am: typeof AM === 'object' ? pickF(AM) : null, hk: typeof HK === 'object' ? pickF(HK) : null, k: COOP.keys.map(k => k.t) });
      else coopSend(Object.assign({ t: 'in' }, coopMe()));
    }
    return r;
  }; }
/* ---------- 畫：隊友與鑰匙 ---------- */
function coopSprites(list) {
  if (!COOP.on) return;
  for (const k of COOP.keys) if (!k.t) list.push({ d: k.x + k.y, f: () => { const [sx, sy] = iso(k.x, k.y), on = Math.sin(G.t * 4 + k.x) > 0; ctx.fillStyle = on ? '#ffe08a' : '#b08f3e'; ctx.fillRect(sx - 4, sy - 7, 7, 3); ctx.fillRect(sx + 1, sy - 5, 2, 5); ctx.fillStyle = 'rgba(255,224,138,.25)'; ctx.beginPath(); ctx.arc(sx, sy - 5, 7, 0, 7); ctx.fill(); } });
  for (const [id, p] of Object.entries(COOP.P)) {
    if (id === COOP.id || p.hd || !isFinite(p.x)) continue;
    let v = COOP.view[id]; if (!v || !isFinite(v.x) || dist(v.x, v.y, p.x, p.y) > 6) v = COOP.view[id] = { x: p.x, y: p.y };   // 第一次或瞬移：直接放到位置上 v.x += (p.x - v.x) * .35; v.y += (p.y - v.y) * .35;
    list.push({ d: v.x + v.y, f: () => {
      { const [fx, fy] = iso(v.x, v.y); ctx.strokeStyle = p.c; ctx.lineWidth = 1.5; ctx.globalAlpha = .8; ctx.beginPath(); ctx.ellipse(fx, fy, 9, 4.2, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }   // 腳下的代表色圈
      if (p.down && IMG.mi_down) drawSprite(IMG.mi_down, v.x, v.y, p.d, { sc: MI_SC, noShadow: true });
      else if (p.cr && IMG.mi_crouch) drawSprite(IMG.mi_crouch, v.x, v.y, p.d, p.m ? p.f % 4 : 0, { sc: MI_SC });
      else if (p.li && !p.m && IMG.mi_light) drawSprite(IMG.mi_light, v.x, v.y, p.d, { sc: MI_SC });
      else drawSprite(IMG.mi, v.x, v.y, p.d, { sc: MI_SC, frame: p.m ? (p.r ? 4 : 0) + p.f : 0, lean: p.r ? .09 : 0 });
    } });
  }
}
// 名字與倒地／救援進度畫在暗幕之上（暗處也找得到隊友）
{ const _r = render; render = function () {
    _r(); if (!COOP.on) return;
    ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
    for (const [id, p] of Object.entries(COOP.P)) {
      if (id === COOP.id || !isFinite(p.x)) continue; const v = COOP.view[id] && isFinite(COOP.view[id].x) ? COOP.view[id] : p; const [sx, sy] = iso(v.x, v.y);
      ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillText(p.n + (p.down ? '（倒地）' : ''), sx + 1, sy - 49); ctx.fillStyle = p.c; ctx.fillText(p.n + (p.down ? '（倒地）' : ''), sx, sy - 50);
      if (p.down && p.rv > 0) { ctx.strokeStyle = '#a5d6a7'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy - 32, 6, -Math.PI / 2, -Math.PI / 2 + p.rv / 2 * Math.PI * 2); ctx.stroke(); }
    }
  }; }
function coopEnd(win) {
  if (G.mode !== 'play') return; G.mode = 'end'; $('#hud').classList.add('hide'); $('#touch').classList.add('hide'); $('#coopChat').classList.add('hide');
  const e = $('#end'); e.style.backgroundImage = 'url(assets/' + (win ? 'card_gate' : 'card_class') + '.jpg)';
  e.querySelector('h2').textContent = win ? '全員逃出！' : '全員倒下……';
  e.querySelector('p').innerHTML = win ? `${Object.values(COOP.P).map(p => p.n).join('、')}——一起看著天亮。<br><small>想再玩一場：回到標題 → 多人合作</small>` : '走廊盡頭，腳步聲停了下來。<br><small>回到標題 → 多人合作，可以再挑戰一次</small>';
  e.classList.remove('hide');
}
addEventListener('keydown', e => { if (COOP.on && e.code === 'Enter' && document.activeElement !== $('#coopMsg') && G.mode === 'play' && !G.lock && !advanceFn) { $('#coopMsg').focus(); e.preventDefault(); } }, true);

/* ---------- 合作：引開、標記、互相壯膽 ---------- */
function coopShout(id) {
  const p = COOP.P[id]; if (!p || p.down || G.t < (p.shCD || 0)) return;
  p.shCD = G.t + 15; const q = id === COOP.id ? coopMe() : p;
  COOP.lure = { id, until: G.t + 4 }; addNoise(q.x, q.y, 12);
  if (GH.active && GH.state !== 'stun') { GH.state = 'chase'; GH.path = null; GH.last = [q.x, q.y]; GH.lastSeenT = G.t; }
  coopSys(`📢 ${p.n}：「這邊！」——怪物轉向她了`);
}
function coopPing(id, x, y) { const p = COOP.P[id]; if (!p) return; const m = { t: 'pg', x, y, n: p.n, c: p.c }; coopAddPing(m); coopSend(m); }
function coopAddPing(m) { (COOP.pings = COOP.pings || []).push(Object.assign({ until: G.t + 6 }, m)); tone(880, .12, 'sine', .05, 1320); }
function coopAct(k) {
  if (!COOP.on || G.mode !== 'play' || P.downC) return;
  if (k === 'shout') { if (G.t < (COOP.myShCD || 0)) { toast(`還要 ${Math.ceil(COOP.myShCD - G.t)} 秒才能再喊`); return; } COOP.myShCD = G.t + 15; if (COOP.host) coopShout(COOP.id); else coopSend({ t: 'shout' }); }
  else if (k === 'ping') { if (COOP.host) coopPing(COOP.id, +P.x.toFixed(1), +P.y.toFixed(1)); else coopSend({ t: 'ping', x: +P.x.toFixed(1), y: +P.y.toFixed(1) }); }
}
addEventListener('keydown', e => { if (!COOP.on || e.repeat || document.activeElement === $('#coopMsg')) return; if (e.code === 'KeyV') coopAct('shout'); if (e.code === 'KeyG') coopAct('ping'); });
(() => { const b = document.createElement('div'); b.id = 'coopBtns'; b.style.cssText = 'pointer-events:auto;display:flex;gap:calc(var(--u)*4);margin-top:calc(var(--u)*4)';
  b.innerHTML = '<button type="button" data-k="shout">📢 引開<small> V</small></button><button type="button" data-k="ping">📍 標記<small> G</small></button>';
  b.querySelectorAll('button').forEach(x => { x.style.cssText = 'font:inherit;font-size:calc(var(--u)*9);padding:calc(var(--u)*3) calc(var(--u)*6);background:rgba(20,16,18,.8);color:var(--ink);border:1px solid #6b655c;touch-action:manipulation'; x.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); coopAct(x.dataset.k); }); });
  $('#coopChat').appendChild(b); })();
// 互相壯膽：隊友在 2.2 格內，恐懼值慢慢下降
{ const _u = update; update = function (dt) { const r = _u(dt);
    if (COOP.on && G.mode === 'play' && !P.downC && Object.entries(COOP.P).some(([id, p]) => id !== COOP.id && !p.down && dist(p.x, p.y, P.x, P.y) < 2.2)) G.fear = Math.max(0, (G.fear || 0) - 6 * dt);
    return r; }; }
// 標記畫在暗幕之上
{ const _r = render; render = function () { _r(); if (!COOP.on || !COOP.pings) return;
    COOP.pings = COOP.pings.filter(m => G.t < m.until);
    for (const m of COOP.pings) { const [sx, sy] = iso(m.x, m.y), k = (G.t * 2) % 1;
      ctx.strokeStyle = m.c; ctx.lineWidth = 2; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.ellipse(sx, sy, 6 + k * 14, (6 + k * 14) / 2, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillStyle = m.c; ctx.beginPath(); ctx.moveTo(sx, sy - 6); ctx.lineTo(sx - 5, sy - 18); ctx.lineTo(sx + 5, sy - 18); ctx.closePath(); ctx.fill();
      ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(m.n, sx + 1, sy - 21); ctx.fillStyle = m.c; ctx.fillText(m.n, sx, sy - 22); }
  }; }
/* ---------- 測試（?test=coop&scene=1..4）：模擬一位遠端玩家，驗證怪物鎖定、倒地、扶起、引開、手電筒壓制、鑰匙、逃脫 ---------- */
async function testCoop() {
  const R = [];
  try {
    COOP.host = true; COOP.id = 'H'; COOP.P = {}; coopAdd('H', '房主'); coopAdd('C', '小美');
    const sc = +(Q.get('scene') || 1), pool = COOP_SCENES[sc].mons;
    coopBegin({ scene: sc, mons: pool.slice(), keys: null }); await wait(300);
    R.push('scene=' + G.scene + ' mons=' + COOP.cfg.mons + ' keys=' + COOP.keys.length + ' gh=' + GH.active + (typeof AM === 'object' ? ' am=' + AM.state : '') + (typeof HK === 'object' ? ' hk=' + HK.state : ''));
    const mon = sc === 3 ? AM : sc === 4 ? HK : GH;
    // 小美站到怪物身上 → 應該被抓倒地
    for (let i = 0; i < 60 && !COOP.P.C.down; i++) { coopHostMsg('C', { t: 'in', x: mon.x, y: mon.y, d: 4, m: 0, r: 0, f: 0, cr: 0, li: 0, hd: null }); if (mon === GH) { GH.state = 'chase'; GH.sus = 1; } else { if (GH.active) { GH.x = 1.5; GH.y = 1.5; GH.state = 'pause'; GH.timer = 99; } if (mon.state !== 'chase') mon.state = 'chase'; } await wait(50); }
    R.push('down=' + COOP.P.C.down);
    // 房主走到她旁邊 → 2 秒扶起
    if (GH.active) { GH.x = 1.5; GH.y = 1.5; GH.state = 'pause'; GH.timer = 99; } if (mon !== GH) { mon.x = 1.5; mon.y = 1.5; mon.state = 'off'; }
    P.x = COOP.P.C.x + .4; P.y = COOP.P.C.y; P.stun = 0; P.pose = null; P.downC = 0; COOP.P.H.down = 0;
    for (let i = 0; i < 80 && COOP.P.C.down; i++) await wait(50);
    R.push('revived=' + !COOP.P.C.down + ' Hdown=' + COOP.P.H.down + ' hk=' + (typeof HK==='object'?HK.state+'@'+HK.x.toFixed(1)+','+HK.y.toFixed(1):'') + ' gh=' + GH.state + ' P=' + P.x.toFixed(1) + ',' + P.y.toFixed(1) + ' C=' + COOP.P.C.x + ',' + COOP.P.C.y + ' log=' + $('#coopLog').innerText.split(String.fromCharCode(10)).join('/'));
    // 引開：小美大喊 → 怪物鎖定小美
    coopHostMsg('C', { t: 'shout' }); const f = coopFocus({ x: P.x, y: P.y }); R.push('lure=' + (f && f[0]));
    // 手電筒壓制：房主正對裂口女照
    if (GH.active) { COOP.lure = null; GH.state = 'patrol'; GH.timer = 0; GH.x = P.x; GH.y = P.y - 2.5; P.light = true; P.dir = 0; for (let i = 0; i < 40 && GH.state !== 'stun'; i++) { P.dir = dirFromWorld(GH.x - P.x, GH.y - P.y); await wait(50); } R.push('flash=' + GH.state); }
    // 鑰匙＋回到出生點
    if (GH.active) { GH.x = 1.5; GH.y = 1.5; GH.state = 'pause'; GH.timer = 99; } if (mon !== GH) { mon.state = 'off'; }
    COOP.keys.forEach((k, i) => coopTakeKey(i, 'H')); const S = COOP_SCENES[sc].spawn;
    P.x = S[0]; P.y = S[1]; coopHostMsg('C', { t: 'in', x: S[0] + .3, y: S[1], d: 4, m: 0, r: 0, f: 0, cr: 0, li: 0, hd: null });
    for (let i = 0; i < 20 && G.mode === 'play'; i++) await wait(50);
    R.push('end=' + G.mode + ' ' + $('#end h2').textContent);
    document.title = 'PASS ' + R.join(' | ');
  } catch (e) { document.title = 'ERR ' + e + ' ' + R.join(' | '); }
}
{ const _t = runTest; runTest = async function (kind) { if (kind === 'coop') return testCoop(); return _t(kind); }; }
// 玩家端測試（?test=coopc）：收主機的世界狀態 → 隊友、怪物、倒地、扶起、鑰匙
async function testCoopClient() {
  const R = [];
  try {
    window.__E = []; addEventListener('error', e => __E.push(e.message));
    COOP.host = false; COOP.id = 'C'; COOP.P = { H: { n: '房主', c: COOP_COLS[0], i: 0 }, C: { n: '小美', c: COOP_COLS[1], i: 1 } };
    coopBegin({ scene: 3, mons: ['kuchi', 'am'], keys: [[10.5, 11.5], [20.5, 5.5], [30.5, 11.5]] }); await wait(200);
    const w = (cdown, k) => ({ t: 'w', p: { H: { n: '房主', c: COOP_COLS[0], x: P.x + 1, y: P.y, d: 4, m: 1, r: 0, f: 2, down: 0, rv: 0 }, C: { n: '小美', c: COOP_COLS[1], x: P.x, y: P.y, down: cdown, rv: cdown ? 1 : 0 } }, g: { x: 12.5, y: 11.5, dir: 2, state: 'chase', moving: true, frame: 1, active: true }, am: { x: 18.5, y: 5.5, dir: 4, state: 'patrol', frame: 0 }, hk: null, k });
    coopClientMsg(w(0, [0, 0, 0])); await wait(100);
    if (Q.get('hold')) { COOP.pings = [{ x: P.x + 2, y: P.y - 1, n: '房主', c: COOP_COLS[0], until: G.t + 99 }]; coopLog('📢 房主：「這邊！」——怪物轉向她了'); return; }
    R.push('gh=' + GH.x + ',' + GH.state + ' am=' + AM.x);
    coopClientMsg(w(1, [1, 0, 0])); await wait(100);
    R.push('down=' + P.downC + ' pose=' + (P.pose && P.pose.k) + ' keys=' + COOP.keys.filter(k => k.t).length + ' obj=' + OBJTEXT);
    coopClientMsg(w(0, [1, 1, 1])); await wait(100);
    R.push('up=' + !P.downC + ' obj=' + OBJTEXT);
    render(); R.push('err=' + JSON.stringify(__E));
    document.title = 'PASS ' + R.join(' | ');
  } catch (e) { document.title = 'ERR ' + e + ' ' + R.join(' | '); }
}
{ const _t = runTest; runTest = async function (kind) { if (kind === 'coopc') return testCoopClient(); return _t(kind); }; }
