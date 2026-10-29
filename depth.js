/* 夜校・如月　遊戲深度（2026-10-28）
   ①難度選擇（簡單／普通／惡夢，改 systems.js 的 DIFF）　②通關評價＋分享成績圖
   ③2004 年的遺落物：每章一張舊紙條，補完澄香與妃姬子的故事　④隱藏結局：遺落物 7 張＋怪談筆記全收集後，真結局之後多一段後日談
   ⑤二週目（通關後解鎖）：裂口女巡邏路線反轉、兩則二週目限定怪談、可以戴魔女帽
   全部用「包一層」接進引擎。載入順序：最後（halloween.js 之後）。 */
const RUN_KEY = 'yakou_kisaragi_runopt', FRAG_KEY = 'yakou_kisaragi_frags';
const DIFFS = {
  easy: { name: '簡單', v: { chase: 1, walk: .95, hear: 1, stun: 1, fear: .9 }, desc: '鬼比較慢、耳朵沒那麼靈。想好好看故事的人選這個。' },
  normal: { name: '普通', v: { ...DIFF }, desc: '標準的恐怖體驗。' },
  night: { name: '惡夢', v: { chase: 1.32, walk: 1.25, hear: 1.6, stun: .55, fear: 1.6 }, desc: '鬼更快、更敏銳，道具效果更短。給已經通關的人。' },
};
const DEPTH = { diffNow: 'normal', pendingChap: 0, fragScene: 0, base: PATROL.slice(), patrolKey: '', sceneT: 0, sceneOf: 0, twin: null };
const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
const runOpt = () => Object.assign({ diff: 'normal', ng: 0, hat: 0 }, jget(RUN_KEY, {}));
const cleared = () => jget(ENDS_KEY, []).length > 0;
const fragsGot = () => jget(FRAG_KEY, []);

/* ---------- 2004 年的遺落物（場景 → [編號, 名稱, 內容]；編號照章節順序） ---------- */
const FRAGS = {
  1: [1, '班級聯絡簿的一頁', ['2004．2．□　二年B班　班級聯絡簿', '值日生：澄香——這個名字連續三天，都沒有被劃掉。', '導師欄：「家長已來電。請同學不要再討論這件事。」', '……那一行字，被橡皮擦擦過好幾次。']],
  2: [2, '撕下來的社團招募單', ['「神秘學同好會　招募中！」', '「成員：澄香、妃姬子（再一個人就能成立！）」', '底下有人用紅筆寫了：「怪胎俱樂部」。', '紅字旁邊，有一行很小的鉛筆字：「沒關係，兩個人也可以。」']],
  3: [3, '揉成一團的紙條', ['「妃姬子又在翻舊校舍了，超噁。」', '「明天放學把她的書包藏起來。」', '「澄香不在了，看她還能跟誰說。」', '……紙條最後有人寫了「4:44」，又用力塗掉。']],
  4: [4, '保健室的使用紀錄', ['保健室使用紀錄　2004．2．□　下午 4:30', '姓名：妃姬子　傷處：手掌、膝蓋擦傷', '原因（本人填寫）：「在舊校舍跌倒。」', '保健老師備註：「麻袋裡裝的是別人的課本和制服。她說要『還給她』。」']],
  6: [5, '手繪的放學路線', ['一張手繪地圖：學校→商店街→田邊的路→平交道→車站。', '角落寫著：「每天跟妃姬子一起走的路。」', '背面是另一個人的字：', '「如果有一天妳迷路了，我就沿著這條路去接妳。」']],
  7: [6, '洋娃娃的布標', ['平交道旁的草叢裡，勾著一小塊褪色的布標。', '「瑪莉」', '「送給妃姬子　生日快樂　——澄香」', '……瑪莉。整晚打電話給我的，就是這個名字。']],
  5: [7, '車掌的備忘錄', ['如月車站　乘客備忘', '「乘客：澄香（2004）。狀態：等待中。」', '「備註：等待的人尚未抵達，不予發車。」', '下面多了一行還沒乾的墨水：「另一位乘客：咪醬。帶路中。」']],
};
const BASE_LORE = LORE.filter(l => l[0] !== 'pumpkin').map(l => l[0]);   // 隱藏結局要的怪談（不含活動、二週目限定）
const hiddenReady = () => fragsGot().length >= 7 && BASE_LORE.every(id => loreGot().includes(id));

/* 從玩家位置找走得到、靠牆、旁邊沒東西的格子（門一律當成開著） */
function reachTiles() {
  const sx = Math.floor(P.x), sy = Math.floor(P.y), seen = new Uint8Array(W * H), qu = [[sx, sy]], out = []; seen[sy * W + sx] = 1;
  while (qu.length) {
    const [x, y] = qu.pop(); out.push([x, y]);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx]) continue;
      const c = at(nx, ny), o = OBJAT[nx + ',' + ny];
      if (c === 'X' || c === '#' || c === 'P' || c === 'f' || (o && o.solid)) continue;
      seen[ny * W + nx] = 1; qu.push([nx, ny]);
    }
  }
  return out.filter(([x, y]) => at(x, y) !== 'D' && !OBJAT[x + ',' + y] && !ITEMS.some(i => dist(i.x, i.y, x + .5, y + .5) < 1.5));
}
function placeFrag() {
  DEPTH.fragScene = G.scene;
  const n = G.scene; if (!FRAGS[n] || (G.flags.frag || []).includes(n)) return;
  let p = G.flags['fragPos' + n];   // 位置記在存檔裡，讀檔不會換地方
  if (!p) {
    const wall = (x, y) => at(x, y) === '#';
    const c = reachTiles().filter(([x, y]) => (wall(x - 1, y) || wall(x, y - 1) || wall(x + 1, y) || wall(x, y + 1)) && dist(x + .5, y + .5, P.x, P.y) > 8);
    if (!c.length) return;
    const r = rng(n * 977 + Math.floor(Math.random() * 1e6)); p = c[Math.floor(r() * c.length)]; G.flags['fragPos' + n] = p;
  }
  if (OBJAT[p[0] + ',' + p[1]]) return;
  const o = obj('frag', p[0], p[1], { solid: false, act: 'frag', label: '撿起舊紙條', dp: 1 }); OBJAT[p[0] + ',' + p[1]] = o;
}
{ const _d = drawObj; drawObj = function (o, a) {
    if (o.t !== 'frag') return _d(o, a);
    const [cx, cy] = iso(o.x + .5, o.y + .5), pu = .5 + .5 * Math.sin(G.t * 2.6 + o.x);
    ctx.globalAlpha = a * (.25 + .2 * pu); ctx.fillStyle = '#fff3c8'; ctx.beginPath(); ctx.ellipse(cx, cy - 1, 9, 4.5, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = a; ctx.fillStyle = '#e8e0c8'; ctx.beginPath(); ctx.moveTo(cx - 6, cy - 1); ctx.lineTo(cx, cy - 4); ctx.lineTo(cx + 6, cy - 1); ctx.lineTo(cx, cy + 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(90,80,70,.7)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(cx - 3, cy - 1.5); ctx.lineTo(cx + 1, cy - 3.5); ctx.moveTo(cx - 1.5, cy); ctx.lineTo(cx + 3, cy - 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }; }
objAction = (_o => async function (o) {
  if (o.act !== 'frag') return _o(o);
  const n = G.scene, [num, name, lines] = FRAGS[n];
  (G.flags.frag = G.flags.frag || []).push(n);
  const got = fragsGot(); if (!got.includes(num)) { got.push(num); if (!TEST || TEST === 'depth') jset(FRAG_KEY, got); }
  const i = OBJ.indexOf(o); if (i >= 0) OBJ.splice(i, 1); delete OBJAT[o.x + ',' + o.y];
  sfx.pick(); toast(`得到【2004 年的遺落物 ${num}／7：${name}】`);
  await says([['', '地上有一張泛黃的紙。日期是……2004 年。'], ...lines.map(t => ['遺落物', t])]);
  if (got.length >= 7) toast(hiddenReady() ? '七張遺落物都找到了。……真結局之後，好像還有什麼在等著。' : `七張遺落物都找到了！（怪談筆記 ${BASE_LORE.filter(id => loreGot().includes(id)).length}／${BASE_LORE.length}）`);
})(objAction);

/* ---------- 難度、遊玩時間、二週目：每格更新 ---------- */
{ const _u = update; update = function (dt) {
    const k = G.flags.diff || 'normal';
    if (k !== DEPTH.diffNow && DIFFS[k]) { Object.assign(DIFF, DIFFS[k].v); DEPTH.diffNow = k; }
    const want = (G.flags.ng ? 'r' : 'n') + G.scene + ':' + DEPTH.base.length;   // 二週目：裂口女的巡邏順序反過來
    if (DEPTH.patrolKey !== want && DEPTH.base.length) { PATROL.splice(0, PATROL.length, ...(G.flags.ng ? DEPTH.base.slice().reverse() : DEPTH.base)); DEPTH.patrolKey = want; }
    const playing = G.mode === 'play' && !(typeof INVM === 'object' && INVM.open);
    if (playing && !G.lock) {
      G.flags.pt = (G.flags.pt || 0) + dt;
      if (DEPTH.sceneOf !== G.scene) { DEPTH.sceneOf = G.scene; DEPTH.sceneT = 0; } DEPTH.sceneT += dt;
      if (DEPTH.fragScene !== G.scene || (FRAGS[G.scene] && !(G.flags.frag || []).includes(G.scene) && !OBJ.some(o => o.t === 'frag'))) placeFrag();
      if (G.flags.ng) ngTick(dt);
    }
    return _u(dt);
  }; }
{ const _l = loadScene; loadScene = function (n) { _l(n); DEPTH.base = PATROL.slice(); DEPTH.patrolKey = ''; DEPTH.fragScene = 0; DEPTH.twin = null; }; }
{ const _d = damage; damage = function (n) { G.flags.hits = (G.flags.hits || 0) + 1; return _d(n); }; }
{ const _g = gameOver; gameOver = function () {   // 重來會讀回檢查點 → 把死亡次數、時間寫進檢查點
    if (G.cp) G.cp.flags = { ...G.cp.flags, deaths: (G.flags.deaths || 0) + 1, pt: G.flags.pt || 0, hits: G.flags.hits || 0 };
    return _g();
  }; }
{ const _r = resetWorld; resetWorld = function () {
    _r();
    const o = runOpt(); G.flags.diff = DIFFS[o.diff] ? o.diff : 'normal';
    if (cleared()) { if (o.ng) G.flags.ng = 1; if (o.hat) G.flags.hat = 1; }
    if (DEPTH.pendingChap > 1) G.flags.fromChap = DEPTH.pendingChap;
    DEPTH.pendingChap = 0; DEPTH.fragScene = 0; DEPTH.twin = null;
  }; }
startFrom = (_s => function (ch) { DEPTH.pendingChap = ch; return _s(ch); })(startFrom);

/* ---------- 二週目限定怪談 ---------- */
LORE.push(
  ['ngtwin', '另一個咪醬', '二週目的走廊上，有個背影跟妳一模一樣。', '她回過頭，用嘴型說：「快回家。」', () => G.flags.ngTwin],
  ['ngcall', '第二次的來電', '已經走過一次的路，瑪莉又打來了。', '「這次，換妳走在前面。」', () => G.flags.ngCall],
);
function ngTick(dt) {
  const tw = DEPTH.twin;
  if (G.scene === 2 && !G.flags.ngTwin && !tw && DEPTH.sceneT > 40) {   // 第二章（上）：走廊盡頭出現另一個自己
    const nt = nearestThreat(); if (nt && nt.chase) return;
    const c = reachTiles().filter(([x, y]) => { const d = dist(x + .5, y + .5, P.x, P.y); return d > 5 && d < 8 && los(P.x, P.y, x + .5, y + .5); });
    if (c.length) { const [x, y] = c[Math.floor(Math.random() * c.length)]; DEPTH.twin = { x: x + .5, y: y + .5, dir: 0, t: 0, frame: 0, ft: 0 }; sfx.heart(.25); }
  }
  if (tw) {
    tw.t += dt; const d = dist(tw.x, tw.y, P.x, P.y);
    const ax = (tw.x - P.x) / (d || 1), ay = (tw.y - P.y) / (d || 1); moveEnt(tw, ax * 1.1 * dt, ay * 1.1 * dt);   // 慢慢走遠
    let best = 0, bd = -9; SCR.forEach((s, i) => { if (!s) return; const v = ax * s[0] + ay * s[1]; if (v > bd) { bd = v; best = i; } }); tw.dir = best;
    tw.ft += dt; if (tw.ft > .18) { tw.ft = 0; tw.frame = (tw.frame + 1) % 4; }
    if (d < 2.6 || tw.t > 22) {
      DEPTH.twin = null; G.flags.ngTwin = 1;
      says(['……那是我？', '同樣的制服、同樣的髮型。她停下來，回頭看了我一眼。', '嘴型是——「快、回、家」。', '眨眼的瞬間，她就不見了。']);
    }
  }
  if (G.scene === 3 && !G.flags.ngCall && G.inv.phone && DEPTH.sceneT > 50) {   // 第二章（下）：瑪莉的第二通電話
    const nt = nearestThreat(); if (nt && nt.d < 8) return;
    G.flags.ngCall = 1; phoneCall(['我是瑪莉。', '這條路……妳已經走過一次了吧？', '那這次，換妳走在前面。', '……她們，都在等妳。'], '瑪莉');
  }
}
{ const _s = sceneSprites; sceneSprites = function (list) {
    _s(list); const tw = DEPTH.twin;
    if (tw) list.push({ d: tw.x + tw.y, f: () => drawSprite(IMG.mi, tw.x, tw.y, tw.dir, { sc: MI_SC, alpha: .4 + .1 * Math.sin(G.t * 5), frame: 1 + tw.frame }) });
  }; }

/* ---------- 開始遊戲：難度選擇（通關後多二週目、換裝） ---------- */
(() => {
  const st = document.createElement('style');
  st.textContent = `#runSet{z-index:12;background:rgba(0,0,0,.9)}
#runSet .hb{width:min(94vw,calc(var(--u)*400));text-align:center;max-height:94vh;overflow-y:auto}
#runSet h2{font-family:"Noto Serif TC",serif;font-size:calc(var(--u)*16);letter-spacing:.3em;margin-bottom:calc(var(--u)*8)}
#runSet .ds{display:flex;gap:calc(var(--u)*6);justify-content:center}
#runSet .ds button{flex:1;font:inherit;font-family:"Noto Serif TC",serif;font-size:calc(var(--u)*12);padding:calc(var(--u)*6) 0;background:rgba(0,0,0,.6);color:var(--ink);border:1px solid #6b655c;cursor:pointer;letter-spacing:.15em}
#runSet .ds button.on{border-color:var(--red);background:rgba(120,20,28,.45);color:#fff}
#runSet .dd{min-height:3em;color:var(--dim);font-size:calc(var(--u)*9);margin:calc(var(--u)*6) 0 calc(var(--u)*8);line-height:1.6}
#runSet label{display:flex;align-items:center;gap:calc(var(--u)*5);justify-content:center;font-size:calc(var(--u)*10);margin-bottom:calc(var(--u)*5);cursor:pointer}
#runSet input{width:calc(var(--u)*12);height:calc(var(--u)*12);accent-color:#b8323c}
#runSet .lockd{color:var(--dim);font-size:calc(var(--u)*8.5);margin-bottom:calc(var(--u)*8)}
#runSet .btns{margin-top:calc(var(--u)*8)}
.phone #runSet .hb{width:min(94vw,calc(var(--u)*520))}
.phone #runSet .dd{font-size:calc(var(--u)*10);min-height:2em;margin:calc(var(--u)*3) 0 calc(var(--u)*4)}
.phone #runSet h2{font-size:calc(var(--u)*13);margin-bottom:calc(var(--u)*4)}
#end .rk{margin:calc(var(--u)*-6) 0 calc(var(--u)*12);text-align:center;text-shadow:0 0 4px #000;font-size:calc(var(--u)*10);line-height:1.7}
#end .rk b{display:block;font-family:"Noto Serif TC",serif;font-size:calc(var(--u)*34);color:#f2c14e;line-height:1.1}
#end .btns{display:flex;flex-direction:row;gap:calc(var(--u)*8);flex-wrap:wrap;justify-content:center}
#end{overflow-y:auto;justify-content:safe center}
#end .xp{margin-top:calc(var(--u)*10);text-align:center}
#end .xp small{display:block;color:var(--dim);font-size:calc(var(--u)*8);letter-spacing:.2em;margin-bottom:calc(var(--u)*4)}
#end .xpl{display:flex;gap:calc(var(--u)*8);justify-content:center;flex-wrap:wrap}
#end .xpl a{display:grid;grid-template-columns:calc(var(--u)*64) 1fr;grid-template-rows:auto auto;column-gap:calc(var(--u)*6);align-items:center;width:calc(var(--u)*190);background:rgba(0,0,0,.65);border:1px solid #6b655c;color:var(--ink);text-decoration:none;text-align:left;font-size:calc(var(--u)*7.5);line-height:1.35;padding:calc(var(--u)*3)}
#end .xpl a:hover{border-color:var(--red)}
#end .xpyt{display:inline-block;margin-left:calc(var(--u)*4);padding:calc(var(--u)*1) calc(var(--u)*5);background:#c4302b;color:#fff;text-decoration:none;letter-spacing:.05em;border-radius:calc(var(--u)*2)}
#end .xpyt:hover{background:#e0403a}
#end .xpl img{grid-row:1/3;width:100%;aspect-ratio:1.91;object-fit:cover}
#end .xpl b{font-family:"Noto Serif TC",serif;font-size:calc(var(--u)*9.5);color:#efe8dc;align-self:end}
#end .xpl span{color:var(--dim);align-self:start}
.phone #end .xp{margin-top:calc(var(--u)*6)}
.phone #end .xpl a{width:calc(var(--u)*170)}
.phone #end h2{font-size:calc(var(--u)*20);margin-bottom:calc(var(--u)*3)}
.phone #end p{font-size:calc(var(--u)*9.5);line-height:1.5;margin-bottom:calc(var(--u)*8)}
.phone #end .rk{font-size:calc(var(--u)*9);margin:0 0 calc(var(--u)*6);line-height:1.4}
.phone #end .rk b{font-size:calc(var(--u)*22)}
.phone #end .btns button{width:calc(var(--u)*130);padding:calc(var(--u)*3);font-size:calc(var(--u)*11)}`;
  document.head.appendChild(st);
  const el = document.createElement('div'); el.id = 'runSet'; el.className = 'ui full hide';
  el.innerHTML = `<div class="hb"><h2>選擇難度</h2><div class="ds">${Object.entries(DIFFS).map(([k, d]) => `<button type="button" data-d="${k}">${d.name}</button>`).join('')}</div><p class="dd"></p><div class="ng"></div>
<div class="btns"><button type="button" id="rsGo">開始</button><button type="button" id="rsBack">返回</button></div></div>`;
  document.getElementById('wrap').appendChild(el);
  let pick = 'normal', go = null;
  const show = k => { pick = k; el.querySelectorAll('.ds button').forEach(b => b.classList.toggle('on', b.dataset.d === k)); el.querySelector('.dd').textContent = DIFFS[k].desc; };
  el.querySelectorAll('.ds button').forEach(b => b.onclick = () => show(b.dataset.d));
  window.runSetup = cb => {
    const o = runOpt(); go = cb; show(DIFFS[o.diff] ? o.diff : 'normal');
    el.querySelector('.ng').innerHTML = cleared()
      ? `<label><input type="checkbox" id="rsNg" ${o.ng ? 'checked' : ''}>二週目：鬼的路線改變、出現新的怪談</label><label><input type="checkbox" id="rsHat" ${o.hat ? 'checked' : ''}>咪醬戴上魔女帽</label>`
      : `<div class="lockd">通關任一結局後解鎖：二週目、換裝</div>`;
    el.classList.remove('hide');
  };
  $('#rsGo').onclick = () => {
    const ng = $('#rsNg'), hat = $('#rsHat');
    jset(RUN_KEY, { diff: pick, ng: ng && ng.checked ? 1 : 0, hat: hat && hat.checked ? 1 : 0 });
    el.classList.add('hide'); stat('diff', pick); go && go();
  };
  $('#rsBack').onclick = () => el.classList.add('hide');
  const _bs = $('#bStart').onclick;
  $('#bStart').onclick = () => runSetup(() => { DEPTH.pendingChap = 1; _bs(); });
})();

/* ---------- 通關評價、分享成績圖、隱藏結局 ---------- */
ENDINGS.hidden = ['隱藏結局「放學後的約定」', '2004 年沒有說完的話，終於說完了。<br>這一次，大家都準時放學了。'];
function runGrade(k) {
  const F = G.flags, min = (F.pt || 0) / 60, fr = (F.frag || []).length;
  let s = 100 - (F.hits || 0) * 5 - (F.deaths || 0) * 12 - Math.max(0, min - 120) * .3 + fr * 2 - ({ tunnel: 8, bad: 15 }[k] || 0) + ({ easy: -10, night: 8 }[F.diff] || 0);
  s = Math.round(clamp(s, 0, 100));
  return { s, g: s >= 90 ? 'S' : s >= 75 ? 'A' : s >= 55 ? 'B' : 'C', min, fr, hits: F.hits || 0, deaths: F.deaths || 0, diff: (DIFFS[F.diff] || DIFFS.normal).name, ng: !!F.ng, chap: !!F.fromChap };
}
const fmtMin = m => `${Math.floor(m / 60) ? Math.floor(m / 60) + ' 小時 ' : ''}${Math.round(m % 60)} 分`;
async function shareCard(k, r) {
  const c = document.createElement('canvas'); c.width = c.height = 1080; const g = c.getContext('2d');
  const bg = await new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = 'assets/' + (k === 'bad' ? 'card_station' : k === 'hidden' ? 'card_class' : 'card_gate') + '.jpg'; });
  g.fillStyle = '#07080c'; g.fillRect(0, 0, 1080, 1080);
  if (bg) { const s = Math.max(1080 / bg.width, 1080 / bg.height); g.drawImage(bg, (1080 - bg.width * s) / 2, (1080 - bg.height * s) / 2, bg.width * s, bg.height * s); }
  const gr = g.createLinearGradient(0, 0, 0, 1080); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(.5, 'rgba(0,0,0,.72)'); gr.addColorStop(1, 'rgba(0,0,0,.92)'); g.fillStyle = gr; g.fillRect(0, 0, 1080, 1080);
  const T = (t, y, size, color, font = '"Noto Serif TC",serif', w = 600) => { g.font = `${w} ${size}px ${font}`; g.fillStyle = color; g.textAlign = 'center'; g.fillText(t, 540, y); };
  g.shadowColor = '#000'; g.shadowBlur = 12;
  T('夜校・如月', 150, 92, '#efe8dc'); T('放學後，不要回學校。', 215, 34, '#b8323c', '"Noto Serif TC",serif', 400);
  T(ENDINGS[k][0], 330, 50, '#e8dcc4');
  if (r.chap) T('章節選擇遊玩', 560, 70, '#c9b98a');
  else { T('評價', 420, 36, '#c9b98a', '"Noto Sans TC",sans-serif', 400); T(r.g, 640, 230, '#f2c14e'); }
  const lines = [`難度　${r.diff}${r.ng ? '（二週目）' : ''}`, `遊玩時間　${fmtMin(r.min)}`, `被抓 ${r.hits} 次　重來 ${r.deaths} 次`, `2004 年的遺落物　${r.fr}／7`];
  lines.forEach((t, i) => T(t, 760 + i * 54, 36, '#e6dccb', '"Noto Sans TC",sans-serif', 400));
  T('Cash城部落格　搜尋「夜校如月」免費線上玩', 1030, 30, '#9a9187', '"Noto Sans TC",sans-serif', 400);
  const blob = await new Promise(res => c.toBlob(res, 'image/png'));
  const text = `我在《夜校・如月》拿到${ENDINGS[k][0]}${r.chap ? '' : `，評價 ${r.g}`}（難度：${r.diff}）！放學後，你敢回學校嗎？`;
  return { blob, text };
}
async function doShare(k, r) {
  const { blob, text } = await shareCard(k, r), url = BLOG, f = new File([blob], 'yakou_kisaragi.png', { type: 'image/png' });
  try { if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], text, url }); stat('share', k); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'yakou_kisaragi.png'; document.body.appendChild(a); a.click(); a.remove();
  try { await navigator.clipboard.writeText(text + ' ' + url); toast('成績圖已下載，分享文字也複製好了'); } catch (e) { toast('成績圖已下載'); }
  stat('share', k);
}
async function hiddenEpilogue() {
  G.mode = 'cut'; $('#hud').classList.add('hide'); $('#touch').classList.add('hide');
  await card('card_class', ['一週後。', '二年B班的教室裡，那張多出來的課桌不見了。', '黑板角落的值日生，寫著我的名字。', '……我的抽屜裡，放著一個舊舊的洋娃娃。衣服的布標上寫著「瑪莉」。']);
  await phoneCall(['我是瑪莉。', '我現在……在妳的書包裡。', '她們說，謝謝妳陪她們走完那條路。', '所以這次——換我們陪妳放學回家。'], '瑪莉');
  await card('card_gate', ['放學的鐘聲響了。', '我背起書包，走出校門。時鐘指著四點四十四分。', '……我沒有回頭。', '因為我知道，背後有兩個女生，正笑著跟我揮手。']);
}
finaleEnd = (_f => async function (k) {
  let kk = k;
  if (k === 'true' && hiddenReady() && (!TEST || TEST === 'depth')) { await hiddenEpilogue(); kk = 'hidden'; }
  _f(kk);
  const got = jget(ENDS_KEY, []); if (kk === 'hidden' && !got.includes('true')) { got.push('true'); if (!TEST) jset(ENDS_KEY, got); }
  const e = $('#end'), p = e.querySelector('p'), r = runGrade(kk);
  p.innerHTML = p.innerHTML.replace(/已收集結局 \d+ \/ 3/, `已收集結局 ${got.length} / 4`);
  if (kk === 'hidden') p.innerHTML = p.innerHTML.replace(/<small>.*<\/small>/, '<small>感謝遊玩《夜校・如月》。妳找到了這個故事真正的結尾。</small>');
  else if (k === 'true') p.innerHTML = p.innerHTML.replace(/<small>.*<\/small>/, `<small>2004 年的遺落物 ${fragsGot().length}／7・怪談筆記 ${BASE_LORE.filter(id => loreGot().includes(id)).length}／${BASE_LORE.length}<br>全部收集之後，這個故事還有後續……</small>`);
  let rk = e.querySelector('.rk'); if (!rk) { rk = document.createElement('div'); rk.className = 'rk'; p.after(rk); }
  rk.innerHTML = r.chap ? `<small>（從章節選擇開始，不列入評價）</small>` : `評價<b>${r.g}</b>難度 ${r.diff}${r.ng ? '（二週目）' : ''}　遊玩 ${fmtMin(r.min)}　被抓 ${r.hits} 次　重來 ${r.deaths} 次　遺落物 ${r.fr}／7`;
  let sb = $('#bShare'); if (!sb) { sb = document.createElement('button'); sb.id = 'bShare'; sb.type = 'button'; sb.textContent = '📣 分享成績'; $('#bEndTitle').before(sb); }
  sb.onclick = () => doShare(kk, r);
  if (!e.querySelector('.xp')) e.querySelector('.btns').insertAdjacentHTML('afterend', XPROMO);
  if (cleared() && !TEST) setTimeout(() => toast('🔓 已解鎖：二週目、換裝（開始遊戲時選擇）'), 1500);
})(finaleEnd);

/* ---------- 其他遊戲（三款互相導流，連部落格） ---------- */
const XPROMO = `<div class="xp"><small>Cash城的其他免費遊戲　<a class="xpyt" href="https://www.youtube.com/channel/UC8a84AoYc1exBd_8w69dlog?sub_confirmation=1" target="_blank" rel="noopener">▶ YouTube 怪談短影片</a></small><div class="xpl">
<a href="https://cashkingw.blogspot.com/p/cash.html" target="_top" rel="noopener"><img src="assets/x_midnight.jpg" alt=""><b>Cash的午夜檔案室</b><span>台灣法庭推理・找出證詞的矛盾</span></a>
<a href="https://cashkingw.blogspot.com/2026/10/_69.html" target="_top" rel="noopener"><img src="assets/x_sekigahara.jpg" alt=""><b>關原決戰</b><span>六角格戰國戰略・東西軍任選</span></a></div></div>`;
/* ---------- 怪談筆記：加上遺落物與隱藏結局進度 ---------- */
loreOpen = (_lo => function () {
  _lo();
  const el = $('#lore'), got = fragsGot(), byNum = Object.values(FRAGS).sort((a, b) => a[0] - b[0]);
  el.querySelector('.btns').insertAdjacentHTML('beforebegin', `<h2 style="margin-top:calc(var(--u)*14)">2004 年的遺落物</h2><div class="lc">已找到 ${got.length} / 7　（每一章都掉了一張舊紙條）${hiddenReady() ? '　——真結局之後，還有後續。' : ''}</div><div class="lg">` +
    byNum.map(([n, name, lines]) => got.includes(n) ? `<div class="le"><b>${n}．${name}</b>${lines.join('<br>')}</div>` : `<div class="le no"><b>${n}．？？？</b>還沒有找到。</div>`).join('') + '</div>');
})(loreOpen);
if ($('#bLore')) $('#bLore').onclick = loreOpen;

/* ---------- 測試（?test=depth） ---------- */
async function testDepth() {
  try {
    jset(RUN_KEY, { diff: 'night', ng: 1, hat: 1 }); jset(ENDS_KEY, ['tunnel']);
    resetWorld(); startPlay(true); G.inv.flashlight = true; G.inv.phone = true; await wait(200);
    if (G.flags.diff !== 'night' || DIFF.chase !== 1.32) throw 'diff ' + G.flags.diff + ' ' + DIFF.chase;
    if (!G.flags.ng || PATROL[0][0] !== DEPTH.base[DEPTH.base.length - 1][0]) throw 'ng patrol';
    const fo = OBJ.find(o => o.t === 'frag'); if (!fo) throw 'no frag';
    await objAction(fo); await waitFree();
    if (!(G.flags.frag || []).includes(1) || !fragsGot().includes(1)) throw 'frag fail';
    damage(1); if (G.flags.hits !== 1) throw 'hits';
    G.flags.pt = 95 * 60; const r = runGrade('true'); if (r.g !== 'S' || r.s < 90) throw 'grade ' + r.s;
    const sc = await shareCard('true', r); if (!sc.blob || sc.blob.size < 20000) throw 'card';
    // 隱藏結局：遺落物 7 張＋怪談全收集
    jset(FRAG_KEY, [1, 2, 3, 4, 5, 6, 7]); jset(LORE_KEY, BASE_LORE);
    if (!hiddenReady()) throw 'ready';
    loadScene(5); G.mode = 'play'; await finaleEnd('true');
    if (G.flags.endKind !== 'hidden' || !/隱藏結局/.test($('#end h2').textContent) || !$('#bShare') || !/評價/.test($('#end .rk').textContent)) throw 'hidden end';
    if (!/4/.test($('#end p').textContent)) throw 'count';
    document.title = `PASS grade=${r.g}(${r.s}) frag=${fragsGot().length} card=${sc.blob.size}`;
  } catch (e) { document.title = 'ERR ' + e; }
}
{ const _t = runTest; runTest = async function (kind) { if (kind === 'depth') return testDepth(); return _t(kind); }; }
// 截圖：&endshot=true|hidden 直接看結局畫面（評價＋分享鈕）；&runset=1 難度選擇
if (typeof TEST !== 'undefined' && TEST === 'shot' && Q.get('endshot')) setTimeout(() => { G.flags.pt = 6000; G.flags.hits = 3; G.flags.frag = [1, 2, 3]; G.flags.diff = 'normal'; finaleEnd(Q.get('endshot')); }, 600);
if (typeof TEST !== 'undefined' && TEST === 'shot' && Q.get('runset')) setTimeout(() => { if (Q.get('runset') === '2') jset(ENDS_KEY, ['true']); runSetup(() => { }); }, 600);
if (typeof TEST !== 'undefined' && TEST === 'shot' && Q.get('cardshot')) setTimeout(async () => { G.flags.pt = 6000; G.flags.hits = 3; G.flags.frag = [1, 2, 3]; G.flags.diff = 'night'; const { blob } = await shareCard('true', runGrade('true')); const i = new Image(); i.src = URL.createObjectURL(blob); i.style.cssText = 'position:fixed;inset:0;height:100%;z-index:99;margin:auto'; document.body.appendChild(i); }, 600);   // 截圖：&cardshot=1 看分享成績圖
// 測試（?test=ng）：二週目第二章（上）出現另一個咪醬 → 走近消失；第二章（下）瑪莉來電
async function testNg() {
  try {
    jset(RUN_KEY, { diff: 'normal', ng: 1, hat: 1 }); jset(ENDS_KEY, ['true']);
    DEPTH.pendingChap = 2; resetWorld(); G.inv.flashlight = true; G.inv.phone = true; startPlay(); await startCh2(); await waitFree();
    if (!G.flags.ng || !G.flags.hat) throw 'flags';
    GH.active = false; DEPTH.sceneT = 41; let t0 = performance.now();
    while (!DEPTH.twin && performance.now() - t0 < 5000) await wait(50);
    if (!DEPTH.twin) throw 'no twin';
    P.x = DEPTH.twin.x; P.y = DEPTH.twin.y + .3; t0 = performance.now();
    while (!G.flags.ngTwin && performance.now() - t0 < 5000) await wait(50); await waitFree();
    if (!G.flags.ngTwin) throw 'twin stay';
    await startCh2b(); await waitFree(); if (typeof AM === 'object') AM.state = 'off';
    DEPTH.sceneT = 51; t0 = performance.now();
    while (!G.flags.ngCall && performance.now() - t0 < 5000) await wait(50); await waitFree();
    if (!G.flags.ngCall) throw 'no call';
    document.title = 'PASS ng twin+call fromChap=' + G.flags.fromChap;
  } catch (e) { document.title = 'ERR ' + e; }
}
{ const _t = runTest; runTest = async function (kind) { if (kind === 'ng') return testNg(); return _t(kind); }; }
