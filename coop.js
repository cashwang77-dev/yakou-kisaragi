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
const COOP_NAME = { kuchi: _L('裂口女'), am: _L('人體模型'), hk: _L('妃姬子') };
const COOP_COLS = ['#ff8a80', '#82b1ff', '#a5d6a7', '#ffe082'];
/* 外觀：咪醬的 sprite 換髮色／制服色（tools/coop_looks.py 產生 assets/<sheet>_v1~3.png） */
const COOP_LOOKS = [_L('深藍水手服'), _L('茶髮・酒紅'), _L('黑髮・墨綠'), _L('銀髮・紫')];
const LOOK_ROWS = { mi: 9, mi_crouch: 4, mi_light: 1, mi_down: 1, mi_hurt: 2, mi_throw: 2 }, LOOK_IMG = {};
function coopLookImg(lk, k) {
  const base = (COOP.imgBak && COOP.imgBak[k]) || IMG[k];
  if (!lk) return base;
  const id = k + '_v' + lk; let im = LOOK_IMG[id];
  if (!im) { im = LOOK_IMG[id] = new Image(); im.rows = LOOK_ROWS[k]; im.src = 'assets/' + id + '.png'; }
  return im.complete && im.naturalWidth ? im : base;
}
function coopWear(on) {   // 開局：把自己的 sprite 換成選的外觀；結束換回來
  if (on) { if (COOP.imgBak) return; COOP.imgBak = {}; for (const k in LOOK_ROWS) { COOP.imgBak[k] = IMG[k]; const im = coopLookImg(COOP.look, k); if (im !== IMG[k]) IMG[k] = im; } }
  else if (COOP.imgBak) { Object.assign(IMG, COOP.imgBak); COOP.imgBak = null; }
}
const coopSend = o => { const s = JSON.stringify(o); if (COOP.host) COOP.conns.forEach(c => c.open && c.send(s)); else if (COOP.hc && COOP.hc.open) COOP.hc.send(s); };
const coopMe = () => ({ x: +P.x.toFixed(2), y: +P.y.toFixed(2), d: P.dir, m: P.moving ? 1 : 0, r: P.run ? 1 : 0, f: P.frame || 0, cr: P.crouch ? 1 : 0, li: P.light ? 1 : 0, hd: P.hidden ? P.hidden.x + ',' + P.hidden.y : null });

/* ---------- 大廳介面 ---------- */
(() => {
  const st = document.createElement('style');
  st.textContent = `#coopP{z-index:13;overflow-y:auto;touch-action:pan-y;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;justify-content:flex-start;padding:calc(var(--u)*10) 0}
#coopP .hb{width:min(92vw,calc(var(--u)*380));text-align:center;margin:auto 0}#coopMsgP{word-break:break-all}
#coopB .btns{flex-wrap:wrap;justify-content:center}#coopStart{font-weight:700;color:#ffd36a;border-color:#ffd36a}
#coopP h2{font-family:"Noto Serif TC",serif;letter-spacing:.2em;font-size:calc(var(--u)*16);margin:0 0 calc(var(--u)*4)}
#coopP p{color:var(--dim);font-size:calc(var(--u)*9);margin:calc(var(--u)*4) 0}
#coopP input{font:inherit;font-size:calc(var(--u)*11);padding:calc(var(--u)*4);width:100%;background:#0c0a0d;color:var(--ink);border:1px solid #6b655c;margin:calc(var(--u)*3) 0;touch-action:manipulation}
#coopCode{font:700 calc(var(--u)*24)/1 monospace;letter-spacing:.3em;color:#ffd36a;margin:calc(var(--u)*6) 0}
#coopChat{position:absolute;left:50%;transform:translateX(-50%);top:calc(var(--u)*6);width:min(46%,calc(var(--u)*250));z-index:9;pointer-events:none}
#coopBtns{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(var(--u)*42);z-index:9;pointer-events:auto;display:flex;gap:calc(var(--u)*6)}
#coopLook{display:flex;justify-content:center;gap:calc(var(--u)*5);margin:calc(var(--u)*3) 0}#coopLook button{padding:calc(var(--u)*2);border:1px solid #514c47;background:#0c0a0d;color:var(--dim);font-size:calc(var(--u)*7.5);display:flex;flex-direction:column;align-items:center;touch-action:manipulation}
#coopLook button.on{border-color:#ffd36a;color:#ffd36a}#coopLook i{display:block;width:calc(var(--u)*30);height:calc(var(--u)*37);background-size:800% 900%;background-position:57.14% 0;image-rendering:pixelated}
#coopStart:disabled{opacity:.45;color:var(--dim);border-color:#514c47}#coopWho{color:var(--ink)!important;font-size:calc(var(--u)*10)!important}
#coopLog div{font-size:calc(var(--u)*8.5);text-shadow:0 0 4px #000;animation:cfade 10s forwards}@keyframes cfade{85%{opacity:1}100%{opacity:0}}
#coopMsg{pointer-events:auto;width:100%;font:inherit;font-size:calc(var(--u)*9);background:rgba(0,0,0,.55);color:var(--ink);border:1px solid #514c47;padding:calc(var(--u)*2) calc(var(--u)*4)}`;
  document.head.appendChild(st);
  const el = document.createElement('div'); el.id = 'coopP'; el.className = 'ui full hide';
  el.innerHTML = _L`<div class="hb"><h2>多人合作（測試版）</h2><p>2～4 人。每場隨機場景、隨機怪物。<br>一起找到 3 把鑰匙，再回到出發的地方。被抓會倒地——隊友靠近 2 秒可以扶起來。</p>
<div id="coopA"><input id="coopName" placeholder="你的名字" maxlength="8"><p style="margin:0">選擇外觀</p><div id="coopLook">${COOP_LOOKS.map((n, i) => `<button type="button" data-lk="${i}"><i style="background-image:url(assets/mi${i ? '_v' + i : ''}.png)"></i>${n}</button>`).join('')}</div><div class="btns"><button id="coopHost">建立房間</button></div>
<input id="coopJoin" placeholder="房號（4 碼）" maxlength="4" style="text-transform:uppercase"><div class="btns"><button id="coopJoinB">加入</button><button id="coopBack">返回</button></div></div>
<div id="coopB" class="hide"><p>把房號告訴朋友，用同一個網址按「多人合作」→「加入」</p><div id="coopCode"></div><p id="coopWho"></p><div class="btns"><button id="coopInv">📋 複製邀請連結</button><button id="coopStart" disabled>等待隊友加入…</button></div></div>
<p id="coopMsgP"></p></div>`;
  document.getElementById('wrap').appendChild(el);
  const ch = document.createElement('div'); ch.id = 'coopChat'; ch.className = 'hide'; ch.innerHTML = _L('<div id="coopLog"></div><input id="coopMsg" placeholder="Enter 聊天" maxlength="50">');
  document.getElementById('wrap').appendChild(ch);
  const cb = document.createElement('div'); cb.id = 'coopBtns'; cb.className = 'hide'; document.getElementById('wrap').appendChild(cb);
  $('#title .btns').insertAdjacentHTML('beforeend', _L('<button id="bCoop">👥 多人合作（測試）</button>'));
  const setLook = i => { COOP.look = i; for (const k in LOOK_ROWS) coopLookImg(i, k); el.querySelectorAll('#coopLook button').forEach(b => b.classList.toggle('on', +b.dataset.lk === i)); try { localStorage.setItem('yko_look', i); } catch (e) { } };
  el.querySelectorAll('#coopLook button').forEach(b => b.onclick = () => setLook(+b.dataset.lk));
  let lk0 = 0; try { lk0 = +localStorage.getItem('yko_look') || 0; } catch (e) { } setLook(lk0 < COOP_LOOKS.length ? lk0 : 0);
  $('#bCoop').onclick = () => { try { $('#coopName').value = localStorage.getItem('yko_name') || ''; } catch (e) { } el.classList.remove('hide'); };
  $('#coopBack').onclick = () => el.classList.add('hide');
  $('#coopHost').onclick = () => coopNet(true);
  $('#coopJoinB').onclick = () => coopNet(false);
  $('#coopStart').onclick = () => { if (Object.keys(COOP.P).length < 2) return; coopStartHost(); };
  $('#coopInv').onclick = async () => { const u = BLOG + '?join=' + $('#coopCode').textContent; /* 邀請連結走部落格，文章裡的小程式會把房號轉給遊戲 */ try { await navigator.clipboard.writeText(_L`來玩《夜校・如月》多人合作！房號 ${$('#coopCode').textContent}：${u}`); $('#coopInv').textContent = _L('✓ 已複製，貼給朋友'); } catch (e) { $('#coopMsgP').textContent = u; } };
  const jc = new URLSearchParams(location.search).get('join'); if (jc) { $('#coopJoin').value = jc.toUpperCase().slice(0, 4); setTimeout(() => { el.classList.remove('hide'); try { $('#coopName').value = localStorage.getItem('yko_name') || ''; } catch (e) { } $('#coopMsgP').textContent = _L('朋友邀請你加入！輸入名字後按「加入」'); }, 600); }
  $('#coopMsg').addEventListener('keydown', e => { e.stopPropagation(); if (e.key !== 'Enter') return; const s = e.target.value.trim(); e.target.value = ''; e.target.blur(); if (!s) return; if (COOP.host) coopChat(COOP.P[COOP.id].n, s, true); else coopSend({ t: 'chat', s }); });
})();
function coopLog(t) { const d = document.createElement('div'); d.textContent = t; $('#coopLog').appendChild(d); while ($('#coopLog').childElementCount > 5) $('#coopLog').firstChild.remove(); }
function coopChat(n, s, relay) { coopLog((n ? n + _L('：') : '') + s); if (relay && COOP.host) coopSend({ t: 'chat', n, s }); }
const coopSys = s => coopChat('', s, true);
function loadPeer() { return new Promise((res, rej) => { if (window.Peer) return res(); const sc = document.createElement('script'); sc.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'; sc.onload = res; sc.onerror = () => rej(_L('無法載入連線元件')); document.head.appendChild(sc); }); }

/* ---------- 連線 ---------- */
/* 手機網路（電信 NAT）常擋直連 → 加 TURN 中繼；房主切到 LINE 傳房號時瀏覽器會斷開連線伺服器 → 自動重連 */
const COOP_PEER_OPT = { debug: 0, config: { iceServers: [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  { urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp'], username: 'openrelayproject', credential: 'openrelayproject' }] } };
const COOP_ERR = {
  'peer-unavailable': _L('找不到這個房間：房號錯了，或房主的手機切到別的 App／螢幕關了。請房主回到遊戲畫面，再按一次「加入」'),
  'unavailable-id': _L('房號剛好重複，正在換一個……'), 'network': _L('連不上連線伺服器（網路不穩），正在重新連線……'),
  'server-error': _L('連線伺服器暫時故障，請稍後再試'), 'socket-error': _L('連線伺服器斷線，正在重新連線……'), 'socket-closed': _L('連線伺服器斷線，正在重新連線……'),
  'browser-incompatible': _L('這個瀏覽器不支援連線，請用 Chrome 或 Safari 開（LINE／FB 內建瀏覽器請改用外部瀏覽器）'),
  'webrtc': _L('點對點連線失敗：網路擋住了，建議兩台都改用手機行動網路或都連同一個 Wi-Fi 再試'), 'disconnected': _L('連線伺服器斷線，正在重新連線……')
};
const coopErrText = e => (COOP_ERR[e.type] || (_L('連線錯誤：') + e.type)) + _L`（${e.type}）`;
function coopKeepAlive(pr) {   // 被系統暫停後自動重連連線伺服器（房間才不會消失）
  pr.on('disconnected', () => { if (pr.destroyed) return; setTimeout(() => { try { if (pr.disconnected && !pr.destroyed) pr.reconnect(); } catch (e) { } }, 800); });
}
document.addEventListener('visibilitychange', () => { const pr = COOP.peer; if (document.visibilityState === 'visible' && pr && pr.disconnected && !pr.destroyed) try { pr.reconnect(); } catch (e) { } });
async function coopNet(host, tries) {
  const msg = t => $('#coopMsgP').textContent = t;
  COOP.name = $('#coopName').value.trim() || (host ? _L('房主') : _L('同學')); try { localStorage.setItem('yko_name', COOP.name); } catch (e) { }
  try { await loadPeer(); } catch (e) { msg(e); return; }
  if (COOP.peer && !COOP.on) { try { COOP.peer.destroy(); } catch (e) { } COOP.peer = null; COOP.conns = []; }   // 重按不會留下舊連線
  COOP.host = host; msg(_L('連線中……'));
  if (host) {
    const code = Array.from({ length: 4 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.random() * 31 | 0]).join('');
    const pr = COOP.peer = new Peer('yakou-coop-' + code, COOP_PEER_OPT); coopKeepAlive(pr);
    pr.on('open', id => { if (COOP.id === id) { msg(''); return; } COOP.id = id; COOP.P = {}; coopAdd(id, COOP.name, COOP.look || 0); $('#coopA').classList.add('hide'); $('#coopB').classList.remove('hide'); $('#coopCode').textContent = code; coopWho(); msg(_L('建好了！傳房號給朋友時，傳完請馬上回到這個畫面')); });
    pr.on('connection', c => {
      c.on('open', () => { if (Object.keys(COOP.P).length >= 4 || COOP.on) { c.send(JSON.stringify({ t: 'full' })); return; } COOP.conns.push(c); });
      c.on('data', raw => coopHostMsg(c.peer, JSON.parse(raw)));
      c.on('close', () => { COOP.conns = COOP.conns.filter(x => x !== c); if (COOP.P[c.peer]) { coopSys(COOP.P[c.peer].n + _L(' 離開了')); delete COOP.P[c.peer]; coopWho(); } });
    });
    pr.on('error', e => { if (e.type === 'unavailable-id' && !COOP.id) { msg(coopErrText(e)); pr.destroy(); COOP.peer = null; setTimeout(() => coopNet(true), 300); return; } if (e.type === 'peer-unavailable') return; msg(coopErrText(e)); });
  } else {
    const code = $('#coopJoin').value.trim().toUpperCase(); if (code.length !== 4) { msg(_L('請輸入 4 碼房號')); return; }
    tries = tries || 0;
    const pr = COOP.peer = new Peer(COOP_PEER_OPT); coopKeepAlive(pr); let done = false, joined = false;
    const retry = why => { if (done) return; done = true; if (tries < 2) { msg(why + _L`——自動重試（${tries + 1}/2）……`); setTimeout(() => { if (COOP.peer === pr) coopNet(false, tries + 1); }, 2500); } else msg(why); };
    pr.on('open', id => {
      COOP.id = id; const c = COOP.hc = pr.connect('yakou-coop-' + code, { reliable: true, serialization: 'raw' });
      c.on('open', () => { done = joined = true; c.send(JSON.stringify({ t: 'hi', n: COOP.name, lk: COOP.look || 0 })); $('#coopA').classList.add('hide'); msg(_L('已加入，等房主開始……')); });
      c.on('data', raw => coopClientMsg(JSON.parse(raw)));
      c.on('error', e => retry(coopErrText({ type: 'webrtc' })));
      c.on('iceStateChanged', s => { if (s === 'failed') retry(coopErrText({ type: 'webrtc' })); });
      c.on('close', () => { if (!joined) return; if (!COOP.on) { msg(_L('與房主的連線中斷了，請重新加入')); $('#coopA').classList.remove('hide'); return; } coopLog(_L('與房主的連線中斷了')); if (COOP.on && G.mode === 'play') { toast(_L('與房主的連線中斷了，這場結束')); setTimeout(() => { G.mode = 'play'; coopEnd(0); $('#end h2').textContent = _L('連線中斷'); }, 1500); } });
      setTimeout(() => { if (!c.open) retry(_L('連不上房主（房號錯誤、房主手機休眠，或網路擋住了點對點連線）')); }, 15000);
    });
    pr.on('error', e => { if (e.type === 'peer-unavailable') retry(coopErrText(e)); else msg(coopErrText(e)); });
  }
}
function coopAdd(id, n, lk) { const i = Object.keys(COOP.P).length; COOP.P[id] = { n, lk: lk || 0, c: COOP_COLS[i % 4], i, kc: 0, sv: 0, dn: 0, sh: 0, fs: 0, x: 0, y: 0, d: 4, m: 0, r: 0, f: 0, cr: 0, li: 0, hd: null, down: 0, rv: 0 }; }
function coopWho() {
  const ns = Object.values(COOP.P).map(p => p.n), n = ns.length, b = $('#coopStart');
  $('#coopWho').innerHTML = _L`房間裡 ${n} 人：${ns.join(_L('、'))}` + (COOP.host && n < 2 ? _L('<br><small style="color:#ffd36a">⏳ 還沒有人加入——把房號或邀請連結傳給朋友，有人加入後才能開始</small>') : '');
  b.disabled = n < 2; b.textContent = n < 2 ? _L('等待隊友加入…') : _L`▶ 立刻開始（${n} 人）`;
  if (COOP.host && !COOP.on) { $('#coopMsgP').textContent = n < 2 ? '' : _L('隊友到齊就可以開始了（最多 4 人）'); coopSend({ t: 'lobby', ns }); }
}
function coopHostMsg(id, m) {
  if (m.t === 'hi') { coopAdd(id, m.n, m.lk); coopWho(); coopSys(m.n + _L(' 加入了')); if (!COOP.on) { toast('🔔 ' + m.n + _L(' 加入了！')); try { audioInit(); tone(660, .12, 'sine', .08, 990); } catch (e) { } } }
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
  else if (m.t === 'lobby' && !COOP.on) $('#coopMsgP').textContent = _L`已加入！房間裡 ${m.ns.length} 人：${m.ns.join(_L('、'))}。等房主按開始……`;
  else if (m.t === 'full') $('#coopMsgP').textContent = _L('房間已滿或已經開始了');
}

/* ---------- 開始：主機抽場景與怪物，大家用同一份設定開局 ---------- */
function coopStartHost() {
  const sc = [1, 2, 3, 4][Math.random() * 4 | 0], pool = COOP_SCENES[sc].mons;
  const np = Object.keys(COOP.P).length;
  let mons = np >= 3 ? pool.slice() : pool.length > 1 ? [[pool[1]], [pool[0]], pool][Math.random() * 3 | 0] : pool.slice();   // 3 人以上：場景裡的怪物全部出動
  const cfg = { scene: sc, mons, keys: null };
  coopBegin(cfg);   // 主機先開局，用自己的地圖算鑰匙位置
  cfg.keys = COOP.keys.map(k => [k.x, k.y]);
  coopSend({ t: 'start', cfg });
}
function coopBegin(cfg) {
  COOP.on = true; COOP.cfg = cfg; $('#coopP').classList.add('hide'); $('#coopChat').classList.remove('hide'); $('#coopBtns').classList.remove('hide'); coopWear(true);
  audioInit(); resetWorld(); if (G.scene !== cfg.scene) loadScene(cfg.scene);
  const S = COOP_SCENES[cfg.scene], me = COOP.P[COOP.id] || { i: 0 };
  Object.assign(P, { x: S.spawn[0] + ((me.i || 0) % 2) * .6, y: S.spawn[1] - Math.floor((me.i || 0) / 2) * .6, dir: 0, hidden: null, crouch: false, pose: null, stun: 0 });
  G.inv.flashlight = true; P.light = true; G.inv.bandage = 1;
  $('#title').classList.add('hide'); startPlay();
  // 人數越多怪物越快（只有主機跑怪物）：3 人 +6%、4 人 +12%
  if (COOP.host) { const ex = Math.max(0, Object.keys(COOP.P).length - 2) * .06; COOP.diff0 = COOP.diff0 || { chase: DIFF.chase, walk: DIFF.walk }; DIFF.chase = COOP.diff0.chase * (1 + ex); DIFF.walk = COOP.diff0.walk * (1 + ex); }
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
  chapter(_L('多人合作'), ['', _L('操場'), _L('二年B班的樓層'), _L('特別教室棟'), _L('舊校舍')][cfg.scene]);
  coopObj();
  coopLog(_L`這次的地點：${['', _L('操場'), _L('二年B班的樓層'), _L('特別教室棟'), _L('舊校舍')][cfg.scene]}。出沒的是——${cfg.mons.map(m => COOP_NAME[m]).join(_L('、'))}。`);
}
const coopObj = () => { const n = COOP.keys.filter(k => k.t).length; setObj(n < COOP.keys.length ? _L`找鑰匙 ${n} / ${COOP.keys.length}` : _L('全員回到出發的地方！')); };

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
  p.down = 1; p.rv = 0; p.dn = (p.dn || 0) + 1; coopSys(_L`${p.n} 被抓住了！快去扶她起來`);
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
{ const _k = takeItem; takeItem = async function (it) { if (COOP.on && it.id === 'phone') { toast(_L('（多人模式：先找鑰匙！）')); return; } return _k(it); }; }
objAction = (_o => async function (o) {
  if (!COOP.on) return _o(o);
  if (o.act === 'frag' || o.act === 'hwpk' || o.act === 'xmgift') return _o(o);
  toast(_L('（多人模式：先找鑰匙！）'));
})(objAction);
function coopTakeKey(i, id) {
  const k = COOP.keys[i]; if (!k || k.t) return;
  k.t = 1; if (COOP.P[id]) COOP.P[id].kc = (COOP.P[id].kc || 0) + 1; const n = COOP.keys.filter(q => q.t).length; coopSys(_L`${COOP.P[id] ? COOP.P[id].n : '?'} 找到了一把鑰匙（${n} / ${COOP.keys.length}）`); coopObj();
}
function coopHostTick(dt) {
  const me = COOP.P[COOP.id]; Object.assign(me, coopMe());
  for (const [id, p] of Object.entries(COOP.P)) {
    const q = id === COOP.id ? me : p;
    if (p.down) {   // 扶起
      const helper = Object.entries(COOP.P).find(([j, o]) => j !== id && !o.down && dist(o.x, o.y, q.x, q.y) < 1.3);
      p.rv = helper ? p.rv + dt : 0; if (p.rv >= 2) { p.down = 0; p.rv = 0; helper[1].sv = (helper[1].sv || 0) + 1; coopSys(_L`🤝 ${helper[1].n} 把 ${p.n} 扶起來了`); }
    } else COOP.keys.forEach((k, i) => { if (!k.t && dist(k.x, k.y, q.x, q.y) < .8) coopTakeKey(i, id); });
  }
  // 手電筒壓制：拿手電筒正對 4 格內的怪物照 1.2 秒 → 牠僵住 2.5 秒（每人冷卻 10 秒）
  for (const [id, p] of Object.entries(COOP.P)) {
    const q = id === COOP.id ? me : p; if (p.down || !q.li || q.hd) { p.fl = 0; continue; }
    const sv = SCR[q.d] || [0, 1], sl = Math.hypot(sv[0], sv[1]);
    const t = threats().find(t => { const dx = t.e.x - q.x, dy = t.e.y - q.y, d = Math.hypot(dx, dy); if (d > 4 || stunned(t.e) || t.e.state === 'stun') return false; const sx = dx - dy, sy = (dx + dy) / 2, l = Math.hypot(sx, sy) || 1; return (sx * sv[0] + sy * sv[1]) / l / sl > .72; });
    p.fl = t ? (p.fl || 0) + dt : 0;
    if (t && p.fl > 1.2 && G.t > (p.flCD || 0)) { t.stun(2.5); p.flCD = G.t + 10; p.fl = 0; p.fs = (p.fs || 0) + 1; coopSys(_L`🔦 ${p.n} 用手電筒照住了${HW_NAME ? (HW_NAME().get(t.e) || _L('鬼')) : _L('鬼')}，牠僵住了！`); }
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
  else if (mine && !mine.down && P.downC) { P.downC = 0; P.stun = 0; P.pose = null; toast(_L('被扶起來了！')); }
}
{ const _u = update; update = function (dt) {
    const r = _u(dt);
    if (!COOP.on || G.mode !== 'play') return r;
    if (COOP.host) {
      coopHostTick(dt);
      const meP = COOP.P[COOP.id];
      if (meP.down && !P.downC) { P.downC = 1; P.stun = G.t + 9999; setPose('down', 9999); P.light = false; }
      else if (!meP.down && P.downC) { P.downC = 0; P.stun = 0; P.pose = null; toast(_L('被扶起來了！')); }
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
    let v = COOP.view[id]; if (!v || !isFinite(v.x) || dist(v.x, v.y, p.x, p.y) > 6) v = COOP.view[id] = { x: p.x, y: p.y };   // 第一次或瞬移：直接放到位置上
    v.x += (p.x - v.x) * .35; v.y += (p.y - v.y) * .35;
    list.push({ d: v.x + v.y, f: () => {
      { const [fx, fy] = iso(v.x, v.y); ctx.strokeStyle = p.c; ctx.lineWidth = 1.5; ctx.globalAlpha = .8; ctx.beginPath(); ctx.ellipse(fx, fy, 9, 4.2, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }   // 腳下的代表色圈
      const L = k => coopLookImg(p.lk, k);
      if (p.down && IMG.mi_down) drawSprite(L('mi_down'), v.x, v.y, p.d, { sc: MI_SC, noShadow: true });
      else if (p.cr && IMG.mi_crouch) drawSprite(L('mi_crouch'), v.x, v.y, p.d, p.m ? p.f % 4 : 0, { sc: MI_SC });
      else if (p.li && !p.m && IMG.mi_light) drawSprite(L('mi_light'), v.x, v.y, p.d, { sc: MI_SC });
      else drawSprite(L('mi'), v.x, v.y, p.d, { sc: MI_SC, frame: p.m ? (p.r ? 4 : 0) + p.f : 0, lean: p.r ? .09 : 0 });
    } });
  }
}
// 名字與倒地／救援進度畫在暗幕之上（暗處也找得到隊友）
{ const _r = render; render = function () {
    _r(); if (!COOP.on) return;
    ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
    for (const [id, p] of Object.entries(COOP.P)) {
      if (id === COOP.id || !isFinite(p.x)) continue; const v = COOP.view[id] && isFinite(COOP.view[id].x) ? COOP.view[id] : p; const [sx, sy] = iso(v.x, v.y);
      ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillText(p.n + (p.down ? _L('（倒地）') : ''), sx + 1, sy - 49); ctx.fillStyle = p.c; ctx.fillText(p.n + (p.down ? _L('（倒地）') : ''), sx, sy - 50);
      if (p.down && p.rv > 0) { ctx.strokeStyle = '#a5d6a7'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy - 32, 6, -Math.PI / 2, -Math.PI / 2 + p.rv / 2 * Math.PI * 2); ctx.stroke(); }
    }
  }; }
function coopEnd(win) {
  if (G.mode !== 'play') return; G.mode = 'end'; $('#hud').classList.add('hide'); $('#touch').classList.add('hide'); $('#coopChat').classList.add('hide'); $('#coopBtns').classList.add('hide'); coopWear(false);
  const e = $('#end'); e.style.backgroundImage = 'url(assets/' + (win ? 'card_gate' : 'card_class') + '.jpg)';
  e.querySelector('h2').textContent = win ? _L('全員逃出！') : _L('全員倒下……');
  e.querySelector('p').innerHTML = win ? _L`${Object.values(COOP.P).map(p => p.n).join(_L('、'))}——一起看著天亮。<br><small>想再玩一場：回到標題 → 多人合作</small>` : _L('走廊盡頭，腳步聲停了下來。<br><small>回到標題 → 多人合作，可以再挑戰一次</small>');
  const ps = Object.values(COOP.P), score = p => (p.kc || 0) * 3 + (p.sv || 0) * 4 + (p.sh || 0) * 2 + (p.fs || 0) * 2 - (p.dn || 0), mvp = ps.slice().sort((a, b) => score(b) - score(a))[0];
  if (ps.length && ps[0].kc !== undefined) e.querySelector('p').insertAdjacentHTML('afterend', _L`<div class="coopRes" style="margin:-6px auto 12px;font-size:calc(var(--u)*9);line-height:1.8;text-align:center;text-shadow:0 0 4px #000">${ps.map(p => _L`<span style="color:${p.c}">${p === mvp ? '👑 ' : ''}${p.n}</span>　鑰匙 ${p.kc || 0}・救人 ${p.sv || 0}・引開 ${p.sh || 0}・壓制 ${p.fs || 0}・倒地 ${p.dn || 0}`).join('<br>')}<br><small>👑 本場 MVP：${mvp ? mvp.n : ''}</small></div>`);
  e.classList.remove('hide');
}
addEventListener('keydown', e => { if (COOP.on && e.code === 'Enter' && document.activeElement !== $('#coopMsg') && G.mode === 'play' && !G.lock && !advanceFn) { $('#coopMsg').focus(); e.preventDefault(); } }, true);

/* ---------- 合作：引開、標記、互相壯膽 ---------- */
function coopShout(id) {
  const p = COOP.P[id]; if (!p || p.down || G.t < (p.shCD || 0)) return;
  p.shCD = G.t + 15; p.sh = (p.sh || 0) + 1; const q = id === COOP.id ? coopMe() : p;
  COOP.lure = { id, until: G.t + 4 }; addNoise(q.x, q.y, 12);
  if (GH.active && GH.state !== 'stun') { GH.state = 'chase'; GH.path = null; GH.last = [q.x, q.y]; GH.lastSeenT = G.t; }
  coopSys(_L`📢 ${p.n}：「這邊！」——怪物轉向她了`);
}
function coopPing(id, x, y) { const p = COOP.P[id]; if (!p) return; const m = { t: 'pg', x, y, n: p.n, c: p.c }; coopAddPing(m); coopSend(m); }
function coopAddPing(m) { (COOP.pings = COOP.pings || []).push(Object.assign({ until: G.t + 6 }, m)); tone(880, .12, 'sine', .05, 1320); }
function coopAct(k) {
  if (!COOP.on || G.mode !== 'play' || P.downC) return;
  if (k === 'shout') { if (G.t < (COOP.myShCD || 0)) { toast(_L`還要 ${Math.ceil(COOP.myShCD - G.t)} 秒才能再喊`); return; } COOP.myShCD = G.t + 15; if (COOP.host) coopShout(COOP.id); else coopSend({ t: 'shout' }); }
  else if (k === 'ping') { if (COOP.host) coopPing(COOP.id, +P.x.toFixed(1), +P.y.toFixed(1)); else coopSend({ t: 'ping', x: +P.x.toFixed(1), y: +P.y.toFixed(1) }); }
}
addEventListener('keydown', e => { if (!COOP.on || e.repeat || document.activeElement === $('#coopMsg')) return; if (e.code === 'KeyV') coopAct('shout'); if (e.code === 'KeyG') coopAct('ping'); });
(() => { const b = $('#coopBtns');
  b.innerHTML = _L('<button type="button" data-k="shout">📢 引開<small> V</small></button><button type="button" data-k="ping">📍 標記<small> G</small></button>');
  b.querySelectorAll('button').forEach(x => { x.style.cssText = 'font:inherit;font-size:calc(var(--u)*9);padding:calc(var(--u)*3) calc(var(--u)*6);background:rgba(20,16,18,.8);color:var(--ink);border:1px solid #6b655c;touch-action:manipulation'; x.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); coopAct(x.dataset.k); }); });
})();
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
    COOP.host = true; COOP.id = 'H'; COOP.P = {}; coopAdd('H', _L('房主')); coopAdd('C', _L('小美'));
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
    COOP.host = false; COOP.id = 'C'; COOP.P = { H: { n: _L('房主'), c: COOP_COLS[0], i: 0 }, C: { n: _L('小美'), c: COOP_COLS[1], i: 1 } };
    coopBegin({ scene: 3, mons: ['kuchi', 'am'], keys: [[10.5, 11.5], [20.5, 5.5], [30.5, 11.5]] }); await wait(200);
    const w = (cdown, k) => ({ t: 'w', p: { H: { n: _L('房主'), c: COOP_COLS[0], x: P.x + 1, y: P.y, d: 4, m: 1, r: 0, f: 2, down: 0, rv: 0 }, C: { n: _L('小美'), c: COOP_COLS[1], x: P.x, y: P.y, down: cdown, rv: cdown ? 1 : 0 } }, g: { x: 12.5, y: 11.5, dir: 2, state: 'chase', moving: true, frame: 1, active: true }, am: { x: 18.5, y: 5.5, dir: 4, state: 'patrol', frame: 0 }, hk: null, k });
    coopClientMsg(w(0, [0, 0, 0])); await wait(100);
    if (Q.get('hold')) { COOP.pings = [{ x: P.x + 2, y: P.y - 1, n: _L('房主'), c: COOP_COLS[0], until: G.t + 99 }]; coopLog(_L('📢 房主：「這邊！」——怪物轉向她了')); return; }
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
// 大廳測試（?test=coopl）：一個人不能開始、有人加入才能開始、外觀換裝與還原；&hold=1 停在大廳畫面（截圖用）
async function testCoopLobby() {
  const R = [];
  try {
    $('#title').classList.add('hide'); $('#coopP').classList.remove('hide');
    $('#coopLook button[data-lk="1"]').click(); await wait(400); if (Q.get('hold') === 'a') return;
    COOP.host = true; COOP.id = 'H'; COOP.P = {}; coopAdd('H', _L('房主'), COOP.look); $('#coopA').classList.add('hide'); $('#coopB').classList.remove('hide'); $('#coopCode').textContent = 'K7QX'; coopWho();
    R.push('solo=' + $('#coopStart').disabled);
    if (Q.get('hold') === '1') return;
    coopHostMsg('C', { t: 'hi', n: _L('小美'), lk: 2 });
    R.push('two=' + !$('#coopStart').disabled + ' ' + $('#coopStart').textContent + ' lk=' + COOP.P.C.lk);
    if (Q.get('hold') === '2') return;
    const base = IMG.mi; coopBegin({ scene: 1, mons: ['kuchi'], keys: null }); await wait(300);
    R.push('wear=' + /mi_v1/.test(IMG.mi.src) + ' mate=' + /mi_v2/.test(coopLookImg(2, 'mi').src || '') + ' btns=' + !$('#coopBtns').classList.contains('hide'));
    if (Q.get('hold') === '3') { coopHostMsg('C', { t: 'in', x: P.x + 1.2, y: P.y + .3, d: 4, m: 0, r: 0, f: 0, cr: 0, li: 0, hd: null }); GH.x = 1.5; GH.y = 1.5; GH.state = 'pause'; GH.timer = 99; coopLog(_L('房主：測試聊天位置')); return; }
    G.mode = 'play'; coopEnd(1); R.push('restore=' + (IMG.mi === base));
    document.title = (R.every(x => !/=false/.test(x)) ? 'PASS ' : 'FAIL ') + R.join(' | ');
  } catch (e) { document.title = 'ERR ' + e + ' ' + R.join(' | '); }
}
{ const _t = runTest; runTest = async function (kind) { if (kind === 'coopl') return testCoopLobby(); return _t(kind); }; }
