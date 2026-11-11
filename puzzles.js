/* ================= puzzles.js：大升級第3階段「謎題與探索」（2026-11-11） =================
   ① 翻找：場景 1,2,3,4,6,7 各放 4 個可翻找的紙箱（位置、內容記在存檔 G.flags），翻找要 1.6 秒、會發出聲音（3.5 格，鬼聽得到）。
      其中 3 個藏著「密碼紙條」（各寫一位數字），1 個是補給（消毒水或繃帶），紙條箱另有機會撿到糖。
   ② 密碼箱：每章一個上鎖的金屬箱，三位數密碼＝三張紙條。輸入錯會「喀啦」一聲（引鬼、恐懼+10）。
      解開：護身符×1＋一則 2004 年的隱藏故事。支線，不擋主線。
   ③ 組合：繃帶＋消毒水 → 急救包（回滿 5 顆心）。道具選單裡出現「組合」。
   載入順序：faces.js 之後、inventory.js 之前（道具欄的新按鈕要先加進 #inv，inventory.js 才會收進選單）。
   多人模式不放。?pz=0 關閉。測試 ?test=puzzle。 */
const PZ = (() => { let q = ''; try { q = new URLSearchParams(location.search).get('pz') || ''; } catch (e) { } return { on: q !== '0', scene: -1, open: false }; })();
const PZ_SCENES = [1, 2, 3, 4, 6, 7];
const PZ_SUPPLY = { 1: 'antiseptic', 2: 'bandage', 3: 'antiseptic', 4: 'bandage', 6: 'antiseptic', 7: 'bandage' };
const PZ_LORE = {
  1: [_L('值班老師的備忘'), [_L('2004．2．□　晚上　值班備忘'), _L('「放學後有個學生在校門口等人，等到很晚。」'), _L('「問她等誰，她說：『等朋友一起回家。』」'), _L('「我叫她先回去。……隔天，她就沒有來上學了。」')]],
  2: [_L('二年B班的座位表'), [_L('座位表上，窗邊倒數第二個位置寫著「澄香」。'), _L('隔壁的位置原本寫著「妃姬子」，被人用立可白蓋掉了。'), _L('立可白底下，看得到鉛筆描了很多次的小小愛心。')]],
  3: [_L('家政課的作業袋'), [_L('兩人一組的家政作業：手縫布偶。'), _L('「組員：澄香、妃姬子」　「作品名稱：瑪莉」'), _L('老師評語：「縫線很用心。另一隻眼睛還沒縫上喔。」'), _L('……袋子裡只有一顆黑色的鈕扣。')]],
  4: [_L('神秘學同好會的鑰匙'), [_L('一串生鏽的鑰匙，掛著貓咪鑰匙圈。'), _L('吊牌：「舊校舍・社團教室（神秘學同好會）」'), _L('吊牌背面：「如果我們走散了，就在 4:44 的社團教室見。」')]],
  6: [_L('壞掉的透明雨傘'), [_L('傘柄貼著名牌：「二年B班　澄香」。'), _L('傘骨上綁著一條紅繩，是平交道旁的小神社求來的。'), _L('繩結上掛著小紙籤：「保佑我們兩個平安回家」。')]],
  7: [_L('2004 年的車票'), [_L('一張車票，終點站被雨水暈開了，只看得出最後一個字：「月」。'), _L('票的背面用原子筆寫著：'), _L('「對不起，我先走了。妳要慢慢來。」')]],
};
const PZ_NOTE = [
  (d, p) => [['', _L('箱底壓著一張被撕下來的便條。')], [_L('便條'), _L`「密碼的第${p}位數是 ${d}。不要告訴別人。」`]],
  (d, p) => [['', _L('一本數學講義，空白處用紅筆圈著一個數字。')], [_L('講義'), _L`圈起來的 ${d} 旁邊寫著：「第${p}個」`]],
  (d, p) => [['', _L('一張摺成小方塊的紙，打開是歪歪的字。')], [_L('紙條'), _L`「${p === _L('一') ? _L('第一') : p === _L('二') ? _L('第二') : _L('最後')}個號碼：${d}。（妃姬子一定記不住）」`]],
];
const pzOn = () => PZ.on && !(typeof COOP === 'object' && COOP.on) && PZ_SCENES.includes(G.scene);
function pzState(n) {
  const F = G.flags, k = 'pz' + n;
  if (!F[k]) {
    const code = String(100 + Math.floor(Math.random() * 900));
    const order = [0, 1, 2, 3].sort(() => Math.random() - .5);   // order[i]＝第 i 個箱子裝什麼：0,1,2＝第幾位數字、3＝補給
    F[k] = { code, order, pos: null, box: null, srch: [], open: 0, candy: [Math.random() < .5, Math.random() < .5, Math.random() < .5, 0] };
  }
  return F[k];
}
/* 放置：靠牆、走得到、彼此相距 ≥5 格、離玩家 >4 格 */
function pzPlace() {
  PZ.scene = G.scene; if (!pzOn()) return;
  const n = G.scene, S = pzState(n);
  const valid = p => p && reachTiles().some(([x, y]) => x === p[0] && y === p[1]) && !OBJ.some(o => o.act && o.t !== 'stash' && o.t !== 'lockbox' && dist(o.x, o.y, p[0], p[1]) < 2.5);
  if (!S.pos || !S.pos.every(valid) || !valid(S.box)) {
    const wall = (x, y) => at(x, y) === '#';
    const clear = (x, y) => !OBJ.some(o => (o.act || o.t === 'frag') && o.t !== 'stash' && o.t !== 'lockbox' && dist(o.x, o.y, x, y) < 2.5)   // 不要擋在劇情物件旁邊（按調查會先翻到紙箱）
      && !Object.values(DOORS).some(d => dist(d.x, d.y, x, y) < 2) && !ITEMS.some(i => !i.taken && dist(i.x, i.y, x + .5, y + .5) < 2);
    const c = reachTiles().filter(([x, y]) => (wall(x - 1, y) || wall(x, y - 1) || wall(x + 1, y) || wall(x, y + 1)) && dist(x + .5, y + .5, P.x, P.y) > 4 && clear(x, y))
      .sort(() => Math.random() - .5);
    const pick = [];
    for (const p of c) { if (pick.every(q => dist(q[0], q[1], p[0], p[1]) >= 5)) pick.push(p); if (pick.length >= 5) break; }
    if (pick.length < 5) return;
    S.box = pick.pop(); S.pos = pick;
  }
  S.pos.forEach((p, i) => { if (OBJAT[p[0] + ',' + p[1]]) return; const o = obj('stash', p[0], p[1], { solid: false, act: S.srch.includes(i) ? null : 'stash', label: _L('翻找紙箱'), i, g1: 1, done: S.srch.includes(i) }); OBJAT[p[0] + ',' + p[1]] = o; });
  const [bx, by] = S.box;
  if (!OBJAT[bx + ',' + by]) { const o = obj('lockbox', bx, by, { solid: false, act: S.open ? null : 'lockbox', label: _L('打開密碼箱'), g1: 1, done: !!S.open }); OBJAT[bx + ',' + by] = o; }
}
{ const _u = update; update = function (dt) { _u(dt); if (G.mode === 'play' && !G.lock && PZ_SCENES.includes(G.scene) && (PZ.scene !== G.scene || !OBJ.some(o => o.t === 'stash'))) pzPlace(); }; }

/* 畫：紙箱、密碼箱 */
{ const _d = drawObj; drawObj = function (o, a) {
    if (o.t !== 'stash' && o.t !== 'lockbox') return _d(o, a);
    const [cx, cy] = iso(o.x + .5, o.y + .5); ctx.globalAlpha = a;
    const box = (w, h, top, l, r, y0 = 0) => {   // 等角小方塊：w 半寬、h 高
      ctx.fillStyle = l; ctx.beginPath(); ctx.moveTo(cx - w, cy - w / 2 - y0); ctx.lineTo(cx, cy - y0); ctx.lineTo(cx, cy - h - y0); ctx.lineTo(cx - w, cy - w / 2 - h - y0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = r; ctx.beginPath(); ctx.moveTo(cx + w, cy - w / 2 - y0); ctx.lineTo(cx, cy - y0); ctx.lineTo(cx, cy - h - y0); ctx.lineTo(cx + w, cy - w / 2 - h - y0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = top; ctx.beginPath(); ctx.moveTo(cx, cy - h - y0); ctx.lineTo(cx - w, cy - w / 2 - h - y0); ctx.lineTo(cx, cy - w - h - y0); ctx.lineTo(cx + w, cy - w / 2 - h - y0); ctx.closePath(); ctx.fill();
    };
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(cx, cy, 11, 5, 0, 0, 7); ctx.fill();
    if (o.t === 'stash') {
      box(10, 9, o.done ? '#3b2c1f' : '#a07a4c', '#7a5a36', '#8e6a40');
      ctx.strokeStyle = 'rgba(230,210,160,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - 5, cy - 9 - 7.5); ctx.lineTo(cx + 5, cy - 9 - 2.5); ctx.stroke();   // 膠帶
      if (o.done) { ctx.fillStyle = '#b48a58'; ctx.beginPath(); ctx.moveTo(cx - 10, cy - 14); ctx.lineTo(cx - 14, cy - 20); ctx.lineTo(cx - 4, cy - 23); ctx.closePath(); ctx.fill(); }   // 翻開的蓋子
    } else {
      box(9, 10, '#7b8088', '#4c5158', '#5e646c');
      const on = o.done ? '#5cff8a' : (Math.sin(G.t * 3) > 0 ? '#ff4a3a' : '#5a1a14');
      ctx.fillStyle = '#1d1f22'; ctx.fillRect(cx + 2, cy - 12, 5, 6); ctx.fillStyle = on; ctx.fillRect(cx + 3.5, cy - 11, 2, 1.5);
    }
    ctx.globalAlpha = 1;
  }; }

/* 互動 */
objAction = (_o => async function (o) {
  if (o.act === 'stash') return pzSearch(o);
  if (o.act === 'lockbox') return pzLock(o);
  return _o(o);
})(objAction);
const PZ_POS = [_L('一'), _L('二'), _L('三')];
async function pzSearch(o) {
  const S = pzState(G.scene);
  G.lock++; sfx.click(); toast(_L('翻找中……')); addNoise(o.x + .5, o.y + .5, 3.5);
  await wait(TEST ? 10 : 1600); G.lock--;
  if (G.mode !== 'play') return;
  S.srch.push(o.i); o.done = true; o.act = null;
  const what = S.order[o.i], I = G.inv;
  if (what === 3) {
    const k = PZ_SUPPLY[G.scene]; I[k] = (I[k] || 0) + 1; sfx.pick();
    await says(k === 'antiseptic' ? [['', _L('紙箱裡有保健室的東西。')], ['', _L('得到【消毒水】　（和繃帶一起可以組合成急救包）')]] : [['', _L('紙箱裡有一捲還沒拆封的繃帶。')], ['', _L('得到【繃帶】')]]);
  } else {
    const d = S.code[what];
    await says(PZ_NOTE[what](d, PZ_POS[what]));
    (S.know = S.know || [null, null, null])[what] = d;
    if (S.candy[o.i]) { I.candy = (I.candy || 0) + 1; sfx.pick(); toast(_L('紙條下面還有一顆鼈甲糖')); }
  }
  updateHUD();
}
async function pzLock(o) {
  const S = pzState(G.scene), k = S.know || [];
  const got = await pzKeypad(k.map(d => d ?? '?').join(''));
  if (got == null) return;
  if (got === S.code) {
    S.open = 1; o.done = true; o.act = null; sfx.door(); G.inv.charm = (G.inv.charm || 0) + 1;
    const [name, lines] = PZ_LORE[G.scene];
    await says([['', _L('「喀。」……密碼箱開了。')], ['', _L('得到【護身符】')], ['', _L`箱子裡還有：${name}`], ...lines.map(t => ['2004', t])]);
    G.flags.pzOpen = (G.flags.pzOpen || 0) + 1;
    if (PZ_SCENES.every(n => G.flags['pz' + n] && G.flags['pz' + n].open)) toast(_L('六個密碼箱全部打開了。'));
    updateHUD();
  } else {
    noise(.2, .18, 'bandpass', 500, 2); addNoise(o.x + .5, o.y + .5, 4.5); G.fear = Math.min(100, (G.fear || 0) + 10); shake = 3;
    toast(_L('「喀啦！」……密碼不對。聲音好大。'));
  }
}
/* 三位數密碼輸入（觸控：上下箭頭；鍵盤：數字鍵、Enter、Esc） */
function pzKeypad(hint) {
  return new Promise(res => {
    let el = document.getElementById('pzPad');
    if (!el) {
      const st = document.createElement('style');
      st.textContent = `#pzPad{position:fixed;inset:0;z-index:21;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center}
#pzPad .box{background:rgba(18,18,22,.97);border:1px solid #6b655c;padding:calc(var(--u)*12);text-align:center;min-width:calc(var(--u)*220)}
#pzPad h3{font-family:"Noto Serif TC",serif;font-size:calc(var(--u)*13);margin:0 0 calc(var(--u)*4);letter-spacing:.15em}
#pzPad .hint{color:var(--dim);font-size:calc(var(--u)*9);margin-bottom:calc(var(--u)*8)}
#pzPad .ds{display:flex;gap:calc(var(--u)*8);justify-content:center}
#pzPad .d{display:flex;flex-direction:column;align-items:center}
#pzPad .d button{font:inherit;font-size:calc(var(--u)*11);width:calc(var(--u)*34);background:#2a2424;color:#e8dcc4;border:1px solid #6b655c;padding:calc(var(--u)*2)}
#pzPad .d b{font-size:calc(var(--u)*24);margin:calc(var(--u)*4) 0;font-family:monospace;color:#ffd77a}
#pzPad .d.cur b{text-decoration:underline}
#pzPad .act{margin-top:calc(var(--u)*10);display:flex;gap:calc(var(--u)*8);justify-content:center}
#pzPad .act button{font:inherit;font-size:calc(var(--u)*10);padding:calc(var(--u)*4) calc(var(--u)*16);background:#2a2424;color:#e8dcc4;border:1px solid #6b655c}`;
      document.head.appendChild(st);
      el = document.createElement('div'); el.id = 'pzPad'; document.body.appendChild(el);
    }
    const v = [0, 0, 0]; let cur = 0;
    const draw = () => {
      el.innerHTML = _L`<div class="box"><h3>密碼箱</h3><div class="hint">找到的紙條：${hint}</div><div class="ds">${v.map((n, i) => `<div class="d${i === cur ? ' cur' : ''}"><button data-u="${i}">▲</button><b>${n}</b><button data-dn="${i}">▼</button></div>`).join('')}</div><div class="act"><button data-x="1">離開</button><button data-ok="1">轉開</button></div></div>`;
    };
    const done = r => { removeEventListener('keydown', kd, true); el.remove(); PZ.open = false; G.lock--; res(r); };
    const kd = e => {
      e.stopPropagation(); e.preventDefault();
      if (/^Digit\d$|^Numpad\d$/.test(e.code)) { v[cur] = +e.code.slice(-1); cur = Math.min(2, cur + 1); draw(); }
      else if (e.code === 'ArrowUp') { v[cur] = (v[cur] + 1) % 10; draw(); } else if (e.code === 'ArrowDown') { v[cur] = (v[cur] + 9) % 10; draw(); }
      else if (e.code === 'ArrowLeft') { cur = Math.max(0, cur - 1); draw(); } else if (e.code === 'ArrowRight') { cur = Math.min(2, cur + 1); draw(); }
      else if (e.code === 'Enter' || e.code === 'KeyE' || e.code === 'Space') done(v.join(''));
      else if (e.code === 'Escape') done(null);
    };
    el.onclick = e => {
      e.stopPropagation(); const b = e.target.closest('button'); if (!b) { if (e.target === el) done(null); return; }
      if (b.dataset.u) { cur = +b.dataset.u; v[cur] = (v[cur] + 1) % 10; draw(); } else if (b.dataset.dn) { cur = +b.dataset.dn; v[cur] = (v[cur] + 9) % 10; draw(); }
      else if (b.dataset.ok) done(v.join('')); else if (b.dataset.x) done(null);
    };
    PZ.open = true; G.lock++; addEventListener('keydown', kd, true); draw(); sfx.click();
    if (TEST === 'puzzle' && PZ.testCode !== undefined) setTimeout(() => done(PZ.testCode), 30);
  });
}

/* 組合：繃帶＋消毒水 → 急救包（回滿心） */
{ const _h = updateHUD; updateHUD = function () {
    _h(); const inv = $('#inv'); if (!inv) return; const I = G.inv;
    if (I.antiseptic) inv.insertAdjacentHTML('beforeend', _L`<div class="s">消毒水×${I.antiseptic}<em>和繃帶組合</em></div>`);
    if (I.antiseptic && I.bandage) inv.insertAdjacentHTML('beforeend', _L`<div class="s tap" data-k="pzCombine">🧰 組合<em>繃帶＋消毒水→急救包</em></div>`);
    if (I.medkit) inv.insertAdjacentHTML('beforeend', _L`<div class="s tap" data-k="pzMedkit">急救包×${I.medkit}<em>回滿 5 顆心</em></div>`);
  }; }
{ const _p = press; press = function (k) {
    if (k === 'pzCombine' && G.mode === 'play' && !G.lock) { const I = G.inv; if (I.antiseptic && I.bandage) { I.antiseptic--; I.bandage--; I.medkit = (I.medkit || 0) + 1; sfx.pick(); toast(_L('組合成【急救包】')); updateHUD(); } return; }
    if (k === 'pzMedkit' && G.mode === 'play' && !G.lock) { const I = G.inv; if (I.medkit) { if (G.hearts >= 5) { toast(_L('現在不需要')); return; } I.medkit--; G.hearts = 5; sfx.pick(); toast(_L('用急救包仔細包紮好了（心全滿）')); updateHUD(); } return; }
    return _p(k);
  }; }

/* ?test=puzzle：第一章放了 4 箱＋密碼箱；翻完 3 張紙條知道密碼；錯的密碼會出聲；對的拿到護身符；組合急救包 */
async function testPuzzle() {
  const R = [];
  try {
    await startFrom(1); await waitFree(); await wait(600);
    const st = OBJ.filter(o => o.t === 'stash'), lb = OBJ.find(o => o.t === 'lockbox');
    R.push('placed=' + (st.length === 4 && !!lb));
    for (const o of st) { await pzSearch(o); await waitFree(); }
    const S = pzState(1); R.push('know=' + ((S.know || []).join('') === S.code));
    const c0 = G.inv.charm || 0;
    PZ.testCode = S.code === '000' ? '111' : '000'; await pzLock(lb); R.push('wrong=' + !S.open);
    PZ.testCode = S.code; await pzLock(lb); await waitFree(); R.push('open=' + (S.open === 1 && (G.inv.charm || 0) === c0 + 1));
    G.inv.bandage = 1; G.inv.antiseptic = 1; press('pzCombine'); G.hearts = 2; press('pzMedkit'); R.push('medkit=' + (G.hearts === 5 && !G.inv.bandage));
    document.title = (R.every(x => /=true/.test(x)) ? 'PASS ' : 'FAIL ') + R.join(' ');
  } catch (e) { document.title = 'ERR ' + e + ' ' + R.join(' '); }
}
{ const _t = runTest; runTest = async function (kind) { if (kind === 'puzzle') return testPuzzle(); return _t(kind); }; }
// 截圖：test=shot&pzview=1 → 走到密碼箱旁（看紙箱、密碼箱長怎樣）
if (typeof TEST !== 'undefined' && TEST === 'shot' && Q.get('pzview')) setTimeout(() => { G.mode = 'play'; pzPlace(); const b = OBJ.find(o => o.t === 'lockbox'); if (b) { P.x = b.x + 1.5; P.y = b.y + 1.5; } const s = OBJ.find(o => o.t === 'stash'); if (s && b) { OBJAT[s.x + ',' + s.y] = undefined; delete OBJAT[s.x + ',' + s.y]; s.x = b.x + 2; s.y = b.y; OBJAT[s.x + ',' + s.y] = s; } }, 400);
