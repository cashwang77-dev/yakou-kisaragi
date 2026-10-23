/* 夜校・如月　第四章後半：八尺大人的住宅區（2026-10-23 重做）
   使用者：八尺大人答對就不攻擊太簡單；她要比一般人高 4 倍；地圖要大、互動要多。
   公路往東 → 住宅迷宮（x39–61, y3–31）。通往車站的小巷被「結界」（しめ縄）擋住：
   住宅區裡三尊被打壞的地藏，各要一樣供品才能修好（鹽包／お札／飯糰）→ 三尊都修好，結界才會鬆開。
   八尺大人在巷弄間巡迴：她看得到矮牆後面、聽得到聲音；被抓到扣 2 心、被拎回住宅區入口。
   鹽包可以撒向她（逼退 4 秒）——但地藏也要用鹽，要自己取捨。媽媽打來的電話不要接。
   修好的地藏旁邊 1.8 格內，她碰不到妳。全部修好後，她會一路追進小巷，跑到車站的燈下才安全。
   載入順序：最後（要用到 systems.js 的 threats／DIFF、phone.js 的 PHOTO_SPOTS／phoneMap）。 */

const MZ = { x0: 39, x1: 61, y0: 3, y1: 31 };
const JIZO = [
  { x: 39, y: 31, need: 'salt', name: '鹽包', hint: '……地藏的頭被打掉了。台座上有一個空空的小碟子。（要放鹽）' },
  { x: 61, y: 10, need: 'ofuda', name: 'お札', hint: '……地藏背後的木牌上，原本貼著一張紙。被撕掉了。（要一張お札）' },
  { x: 61, y: 31, need: 'onigiri', name: '飯糰', hint: '……地藏前面的供品盤是空的。旁邊有烏鴉的羽毛。（要供品）' },
];
const HA = { x: 55, y: 18, dir: 4, state: 'off', frame: 0, animD: 0, moving: false, path: null, r: .35, wp: 0, timer: 0, last: null };
const HA_PATROL = [[53.5, 17.5], [46.5, 10.5], [53.5, 4], [60.5, 10.5], [60.5, 24.5], [46.5, 24.5], [40, 17.5], [46.5, 30.5], [53.5, 30.5]];
const inMaze = (x, y) => x >= MZ.x0 && x <= MZ.x1 + 1 && y >= MZ.y0 && y <= MZ.y1 + 1;
const haSafe = (x, y) => JIZO.some((j, i) => G.flags['jizo' + i] && dist(x, y, j.x + .5, j.y + .5) < 1.8);
Object.assign(HIDE, { hedge6: '躲進樹籬後面', bin6: '躲進垃圾集中箱' });
loadImages(['hachi_walk']).then(() => { if (IMG.hachi_walk) IMG.hachi_walk.rows = 4; });

/* ---------- 地圖 ---------- */
{ const _b = SCENES[6]; SCENES[6] = buildCh5b = function () { _b(); buildMaze(); }; }
var buildCh5b;
function buildMaze() {
  const { x0, x1, y0, y1 } = MZ;
  fill(x0, y0, x1, y1, '#');
  for (const x of [39, 46, 53, 60]) fill(x, y0, x + 1, y1, '=');          // 縱向巷子（2 格寬）
  for (const y of [3, 10, 17, 24, 30]) fill(x0, y, x1, y + 1, '=');       // 橫向巷子
  for (let y = y0 - 1; y <= y1 + 1; y++) { put(62, y, '#'); }
  for (let x = x0 - 1; x <= 62; x++) { put(x, 2, '#'); put(x, 32, '#'); }
  for (let y = 5; y <= 31; y++) if (y !== 17 && y !== 18) put(38, y, '#');
  fill(37, 17, 38, 18, '=');                                               // 公路 → 住宅區入口
  put(38, 3, '='); put(38, 4, '=');                                        // 住宅區 → 小巷（結界擋著）
  // 死巷：截斷幾段巷子，讓路線繞起來
  for (const [x, y] of [[46, 13], [47, 13], [53, 27], [54, 27], [39, 21], [40, 21], [56, 10], [56, 11], [43, 30], [43, 31], [60, 20], [61, 20], [49, 3], [49, 4]]) put(x, y, '#');
  // 圍牆裡面挖空（只留沿著巷子那一圈矮圍牆），八尺大人的帽子才會從圍牆上面露出來
  const solid = (x, y) => { const c = at(x, y); return c === '#' || c === 'X'; };
  const hollow = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (at(x, y) === '#' && [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].every(([dx, dy]) => solid(x + dx, y + dy))) hollow.push([x, y]);
  for (const [x, y] of hollow) put(x, y, 'X');
  // 小巷入口的結界、公路北端也拉起しめ縄（不能直接走去小巷）
  obj('shimenawa', 38, 3, { act: 'shimenawa', label: '看那條繩子' }); obj('shimenawa', 38, 4, { act: 'shimenawa', label: '看那條繩子' });
  for (const x of [33, 34, 35, 36]) obj('shimenawa', x, 5, { act: 'shimenawa', label: '看那條繩子' });
  JIZO.forEach((j, i) => obj('jizo', j.x, j.y, { act: 'jizo', label: '看看地藏', i }));
  // 可以翻找的東西
  obj('mailbox', 45, 10, { act: 'search', label: '翻翻信箱', find: 'ofuda' });
  obj('mailbox', 52, 24, { act: 'search', label: '翻翻信箱', find: 'note1' });
  obj('mailbox', 59, 17, { act: 'search', label: '翻翻信箱', find: 'salt' });
  obj('mailbox', 41, 30, { act: 'search', label: '翻翻信箱', find: null });
  obj('nboard', 37, 19, { act: 'nboard', label: '看社區公告欄' });
  // 躲藏點
  for (const [x, y] of [[42, 11], [50, 18], [57, 25], [44, 4], [58, 4], [41, 24]]) obj('hedge6', x, y);
  for (const [x, y] of [[48, 31], [55, 11]]) obj('bin6', x, y);
  for (const [x, y] of [[40.5, 10.5], [53.5, 17.5], [46.5, 24.5], [60.5, 30.5], [46.5, 3.5]]) LIGHTS.push({ x, y, r: 2.2, c: '255,214,150' });
  JIZO.forEach(j => LIGHTS.push({ x: j.x + .5, y: j.y + .5, r: 1.2, c: '255,170,120', id: 'jizoL' }));
  item('onigiri', 9, 29, '飯糰');   // 便利商店的貨架（新道具一律加在最後，存檔用索引）
}
// 牆：住宅區一律是民宅
{ const _k = wall6Kind; wall6Kind = function (x, y) { if (x >= 38 && x <= 62 && y >= 2 && y <= 32 && !(x === 38 && y < 5)) return (x * 7 + y * 13) % 11 === 0 ? 'house' : 'block'; return _k(x, y); }; }

/* ---------- 互動 ---------- */
async function ch5bAction(o) {
  const F = G.flags, I = G.inv;
  switch (o.act) {
    case 'shimenawa':
      if (F.kekkai) return false;
      await says(['兩根電線桿之間，拉著一條很粗的稻草繩。上面垂著一張一張的白紙。', '……繩子在發抖。明明沒有風。', '（過不去。好像有什麼東西，不讓任何東西通過。）']);
      if (!F.kekkaiSeen) { F.kekkaiSeen = 1; setObj('在住宅區裡找到被打壞的地藏，把它們修好'); } return;
    case 'nboard':
      await says([['社區公告', '「夜間請勿外出。聽到有人叫你的名字，不要回答。」'], ['社區公告', '「本社區三尊地藏遭人破壞，請居民留意。」'], '公告欄的地圖褪色了，看不清楚。……用手機拍下來的話？']); return;
    case 'jizo': return jizoAct(o);
    case 'search': return searchAct(o);
  }
  return false;
}
async function jizoAct(o) {
  const j = JIZO[o.i], F = G.flags, I = G.inv;
  if (F['jizo' + o.i]) { await says(['地藏的小臉，在燈下好像笑了一下。', '（這附近，她好像碰不到我。）']); return; }
  const have = j.need === 'salt' ? (I.salt || 0) > 0 : !!I[j.need];
  if (!have) { await says([j.hint]); return; }
  const a = await choose('地藏', `供上【${j.name}】嗎？`, ['供上', '先不要'], 0);
  if (a !== 0) return;
  if (j.need === 'salt') I.salt--; else I[j.need] = 0;
  F['jizo' + o.i] = 1; sfx.door(); updateHUD();
  const n = [0, 1, 2].filter(i => F['jizo' + i]).length;
  await says(['雙手合十。', '……地藏前面的小燈，亮了起來。', `（修好的地藏：${n} / 3）`]);
  if (n === 3) {
    F.kekkai = 1; kekkaiOpen(); HA.state = 'hunt'; HA.path = null; sfx.sting(); shake = 10;
    await says(['遠處傳來「啪」的一聲——稻草繩斷了。', '「ぽ。」', '「ぽぽぽぽぽぽぽぽぽぽぽぽ——」', '……她知道了。快走，往小巷，去車站的燈那裡！']);
    setObj('往西穿過小巷，跑到車站的燈下'); saveCP('kekkai');
  } else saveCP('jizo' + o.i);
}
async function searchAct(o) {
  if (o.searched) { await says(['……裡面已經沒有東西了。']); return; }
  G.lock++; sfx.click(); toast('翻找中……'); addNoise(o.x + .5, o.y + .5, 3.5);
  await wait(TEST ? 10 : 1400); G.lock--;
  o.searched = 1; G.flags['srch_' + o.x + '_' + o.y] = 1;
  const I = G.inv;
  if (o.find === 'ofuda') { I.ofuda = 1; sfx.pick(); await says(['信箱最裡面，夾著一張摺起來的白紙。', '……是神社的お札。上面的字被雨水暈開了。', '得到【お札】']); }
  else if (o.find === 'salt') { I.salt = (I.salt || 0) + 1; sfx.pick(); await says(['信箱裡有一小包用和紙包著的鹽。', '……「給回不了家的孩子」。', '得到【鹽包】']); }
  else if (o.find === 'note1') { await says(['一封沒有寄出去的信。', ['信', '「媽媽，那個人又在圍牆外面了。帽子好白好白。」'], ['信', '「她會學妳的聲音叫我。所以如果妳真的來接我，請先敲三下門。」']]); }
  else await says(['……只有被雨淋濕的廣告單。']);
  updateHUD();
}

function kekkaiOpen() { for (const o of OBJ) if (o.t === 'shimenawa') { o.solid = false; o.act = null; } }

/* ---------- 八尺大人 ---------- */
function haSees() {
  if (P.hidden || pInvis() || G.mode !== 'play' || haSafe(P.x, P.y)) return false;
  const d = dist(HA.x, HA.y, P.x, P.y);
  const range = (P.crouch ? 3.5 : 7.5) + (P.light ? 2.5 : 0);
  if (d > range) return false;
  return P.crouch ? los(HA.x, HA.y, P.x, P.y) : true;   // 她很高：站著的話，圍牆擋不住她的視線
}
function haUpdate(dt) {
  HA.moving = false;
  if (HA.state === 'off') { if (inMaze(P.x, P.y)) { HA.state = 'patrol'; HA.x = 53.5; HA.y = 17.5; } return; }
  if (stunned(HA)) return;
  const d = dist(HA.x, HA.y, P.x, P.y);
  const go = (tx, ty, sp) => walker(HA, tx, ty, sp, dt);
  // 聽到聲音
  for (const n of G.noises || []) if (G.t - n.t < .1 && dist(n.x, n.y, HA.x, HA.y) < n.r * 1.4 && HA.state === 'patrol') { HA.state = 'investigate'; HA.target = [n.x, n.y]; HA.path = null; }
  switch (HA.state) {
    case 'patrol': { const w = HA_PATROL[HA.wp]; if (go(w[0], w[1], 1.3)) HA.wp = (HA.wp + 1 + (Math.random() < .3 ? 1 : 0)) % HA_PATROL.length;
      if (haSees()) haSpot(); break; }
    case 'investigate': if (go(HA.target[0], HA.target[1], 1.9)) { HA.state = 'search'; HA.timer = 4; } if (haSees()) haSpot(); break;
    case 'search': HA.timer -= dt; HA.dir = (HA.dir + (Math.sin(G.t * 2) > .95 ? 1 : 0)) % 8; if (haSees()) haSpot(); if (HA.timer <= 0) { HA.state = 'patrol'; HA.path = null; } break;
    case 'chase': {
      if (haSees()) { HA.last = [P.x, P.y]; HA.lostT = 0; }
      else HA.lostT = (HA.lostT || 0) + dt;
      if (P.hidden && HA.sawHide) { if (go(P.hidden.x + .5, P.hidden.y + .5, 3.4) || d < 1.2) { unhide(); haCatch(); } break; }
      if (HA.last) go(HA.last[0], HA.last[1], 3.4);
      if (HA.lostT > 3) { HA.state = 'search'; HA.timer = 5; HA.last = null; }
      break;
    }
    case 'hunt': {   // 結界斷了：一路追到車站
      if (haSafe(P.x, P.y) && d < 2.5) break;
      go(P.x, P.y, P.y < 6 ? 3.1 : 2.9);
      break;
    }
  }
  if (!G.lock && P.inv <= 0 && !P.hidden && d < .7 && !haSafe(P.x, P.y)) haCatch();
  HA.step = (HA.step || 0) - dt;
  if (HA.moving && HA.step <= 0 && d < 14) { HA.step = .9; tone(70, .25, 'sine', .05 * (1 - d / 14)); }
  // 「ぽぽぽ」：距離越近越大聲
  HA.po = (HA.po || 0) - dt;
  if (HA.po <= 0 && d < 16) { HA.po = HA.state === 'chase' || HA.state === 'hunt' ? 1.6 : 4 + Math.random() * 3; for (let k = 0; k < 3; k++) tone(190 + k * 12, .14, 'triangle', .05 * (1 - d / 16), undefined, 0, k * .2); }
}
function haSpot() { HA.state = 'chase'; HA.last = [P.x, P.y]; HA.lostT = 0; HA.path = null; sfx.sting(); shake = 6; toast('白色的帽子……轉向這邊了！'); }
async function haCatch() {
  if (G.lock) return;
  HA.state = 'search'; HA.timer = 6; sfx.sting(); shake = 14; setPose('hurt', 1);
  damage(2); if (G.mode !== 'play') return;
  await says(['一隻好長好長的手，從頭頂上方伸下來——', '整個人被拎了起來。腳碰不到地面。', '「ぽ……ぽぽ……」帽子底下，那張臉在笑。', '（拚命掙扎——摔在地上的時候，已經回到了住宅區的入口。）']);
  P.x = 37.5; P.y = 17.5; P.inv = 2.5; HA.x = 57.5; HA.y = 24.5; HA.path = null;
  if (G.flags.kekkai) { HA.state = 'hunt'; }
}
// 修好的地藏會擋住她；被撒鹽暈眩
function throwSalt() {
  if (G.mode !== 'play' || G.lock || !(G.inv.salt > 0) || G.scene !== 6) return;
  G.inv.salt--; sfx.whoosh(); updateHUD();
  G.puffs = (G.puffs || []).concat({ x: P.x, y: P.y, t: G.t, r: 1.6, end: G.t + 1, c: '245,245,240' });
  if (HA.state !== 'off' && dist(HA.x, HA.y, P.x, P.y) < 3.2) { HA.stunT = G.t + 4 * DIFF.stun; HA.state = HA.state === 'hunt' ? 'hunt' : 'search'; HA.timer = 4; toast('撒出去的鹽打在她身上——「ぽ——！」她退開了'); }
  else toast('鹽撒在地上……她不在附近');
}
// 媽媽打來的電話：不要接
async function momCall() {
  G.flags.momCalls = (G.flags.momCalls || 0) + 1;
  if (!PH.silent) addNoise(P.x, P.y, 7); else toast('口袋裡的手機在震動……');
  sfx.ring();
  const a = await choose('來電：媽媽', '螢幕上顯示「媽媽」。', ['接聽', '掛斷'], TEST ? 1 : 4500);
  if (a === 0) {
    await says([['媽媽', '「咪醬？妳在哪裡？媽媽來接妳了。」'], ['媽媽', '「媽媽就在妳旁邊喔。……妳看，上面。」'], '——手機那頭的聲音，跟頭頂上傳來的聲音，是同一個。']);
    HA.state = 'chase'; HA.last = [P.x, P.y]; HA.lostT = 0; HA.x = P.x + 5; HA.y = P.y; HA.path = null; sfx.sting();
  }
}

/* ---------- 掛勾 ---------- */
{ const _a = sceneAction; sceneAction = async function (o) { if (G.scene === 6 && ['shimenawa', 'nboard', 'jizo', 'search'].includes(o.act)) { const r = await ch5bAction(o); return r === false ? undefined : r; } return _a(o); }; }
{ const _u = sceneUpdate; sceneUpdate = function (dt) {
    _u(dt); if (G.scene !== 6) return;
    haUpdate(dt);
    if (inMaze(P.x, P.y) && G.inv.phone && !G.lock && !G.flags.kekkai && HA.state === 'patrol') { G.momT = (G.momT ?? 25) - dt; if (G.momT <= 0) { G.momT = 35 + Math.random() * 20; momCall(); } }
  }; }
{ const _s = sceneSprites; sceneSprites = function (list) {
    _s(list); if (G.scene !== 6) return;
    if (HA.state !== 'off' && IMG.hachi_walk) list.push({ d: HA.x + HA.y, f: () => drawSprite(IMG.hachi_walk, HA.x, HA.y, HA.dir, HA.moving ? HA.frame : 0, { alpha: stunned(HA) ? .6 : 1, jit: HA.state === 'hunt' ? (Math.random() - .5) * 1.5 : 0 }) });
  }; }
{ const _d = sceneDrawObj; sceneDrawObj = function (o, cx, cy, shaking) {
    if (G.scene !== 6) return _d(o, cx, cy, shaking);
    const { x, y } = o;
    switch (o.t) {
      case 'shimenawa': if (G.flags.kekkai) return true;
        ctx.strokeStyle = '#c8b88a'; ctx.lineWidth = 3; ctx.beginPath(); { const [a, b] = iso(x, y + .5), [c, d] = iso(x + 1, y + .5); ctx.moveTo(a, b - 26); ctx.quadraticCurveTo((a + c) / 2, (b + d) / 2 - 20, c, d - 26); } ctx.stroke();
        ctx.fillStyle = '#f2f0e6'; for (const u of [.25, .7]) { const [a, b] = iso(x + u, y + .5); const sw = Math.sin(G.t * 9 + x) * 1.5; ctx.fillRect(a - 1 + sw, b - 22, 3, 8); }
        return true;
      case 'jizo': {
        const ok = G.flags['jizo' + o.i];
        box(x + .25, y + .3, .5, .4, 6, '#6a6862', '#55534e', '#4a4844');
        box(x + .32, y + .36, .36, .28, 14, '#8a8780', '#6e6c66', '#62605a', 6);
        const [a, b] = iso(x + .5, y + .5);
        if (ok) { ctx.fillStyle = '#8a8780'; ctx.beginPath(); ctx.arc(a, b - 24, 4, 0, 7); ctx.fill(); ctx.fillStyle = '#b8342c'; ctx.fillRect(a - 4, b - 19, 8, 3); }
        else { ctx.fillStyle = '#6e6c66'; ctx.fillRect(a + 6, b - 3, 5, 3); }   // 被打掉的頭掉在旁邊
        return true;
      }
      case 'mailbox': box(x + .35, y + .4, .3, .2, 12, '#7a4a3a', '#5a362a', '#4e2e24', 8); box(x + .45, y + .45, .1, .1, 8, '#3a3a3a', '#2a2a2a', '#222'); return true;
      case 'nboard': box(x + .1, y + .4, .8, .12, 20, '#4a3e30', null, null, 10); faceRect(x, y, 'L', .15, .85, 13, 28, o.photo ? '#e8e2c8' : '#c8c0a0'); ctx.fillStyle = '#4a3e30'; { const [a, b] = iso(x + .2, y + .5); ctx.fillRect(a, b - 10, 2, 10); } return true;
      case 'hedge6': box(x + .05, y + .1, .9, .8, 20 + shaking, '#2c4a2a', '#203a1e', '#1a3218'); return true;
      case 'bin6': box(x + .1, y + .15, .8, .7, 22, '#3e5a6a', '#2c4450', '#263c46'); return true;
    }
    return _d(o, cx, cy, shaking);
  }; }
{ const _h = sceneHUD; sceneHUD = function (s) {
    _h(s); if (G.scene !== 6) return;
    for (let i = s.length - 1; i >= 0; i--) if (/鹽包×/.test(s[i])) s.splice(i, 1);
    if (G.inv.salt) s.push(`<div class="s tap" data-k="throwSalt">鹽包×${G.inv.salt}<em>${isTouch ? '點按撒鹽' : '8 撒鹽'}</em></div>`);
    if (G.inv.ofuda) s.push(`<div class="s">お札</div>`); if (G.inv.onigiri) s.push(`<div class="s">飯糰（供品）</div>`);
    if (G.flags.kekkaiSeen && !G.flags.kekkai) s.push(`<div class="s">地藏 ${[0, 1, 2].filter(i => G.flags['jizo' + i]).length} / 3</div>`);
  }; }
{ const _p = press; press = function (k) { if (k === 'throwSalt') { throwSalt(); return; } return _p(k); }; }
addEventListener('keydown', e => { if (!e.repeat && e.code === 'Digit8') press('throwSalt'); });
{ const _t = takeItem; takeItem = async function (it) {
    if (G.scene === 6 && it.id === 'onigiri') { it.taken = true; G.inv.onigiri = 1; sfx.pick(); updateHUD(); toast('得到【飯糰】　……可以當作供品'); return; }
    return _t(it); }; }
{ const _o = sceneOnLoad; sceneOnLoad = function (cp) {
    _o(cp); if (G.scene !== 6) return;
    Object.assign(HA, { state: G.flags.kekkai ? 'hunt' : 'off', x: 57.5, y: 24.5, path: null, stunT: 0 });
    for (const o of OBJ) if (o.act === 'search' && G.flags['srch_' + o.x + '_' + o.y]) o.searched = 1;
    if (G.flags.kekkai) kekkaiOpen();
  }; }
{ const _r = roadReset; roadReset = function () { _r(); Object.assign(HA, { state: 'off', x: 57.5, y: 24.5, path: null }); }; }
// 被抓時的威脅清單（恐懼值、竹刀、板擦、滅火器、手機閃光都對她有效）
{ const _th = threats; threats = function () { const t = _th(); if (G.scene === 6 && HA.state !== 'off') t.push({ e: HA, chase: HA.state === 'chase' || HA.state === 'hunt', stun: s => { HA.stunT = G.t + s; } }); return t; }; }
{ const _hd = hide; hide = function (o) { if (G.scene === 6) HA.sawHide = (HA.state === 'chase' || HA.state === 'hunt') && dist(HA.x, HA.y, P.x, P.y) < 6; return _hd(o); }; }
// 舊的「圍牆上探頭→回答問題」三個事件拿掉；小巷盡頭的車站要等結界斷了
for (let i = TRIG.length - 1; i >= 0; i--) if (/^hachi\d$/.test(TRIG[i].id)) TRIG.splice(i, 1);
TRIG.push({ scene: 6, id: 'mazeIn', when: () => inMaze(P.x, P.y), run: async () => {
  await says(['住宅區。每一戶的窗戶都暗著。', '……圍牆的上面，有一頂白色的帽子，慢慢地移動著。', '比圍牆還高。比電線桿還高。', '（被她看到就完了。蹲下來的話，圍牆擋得住。）']);
  setObj(G.flags.kekkaiSeen ? '在住宅區裡找到被打壞的地藏，把它們修好' : '找路去車站'); saveCP('maze0'); } });
// 手機：拍公告欄的地圖 → 手機地圖上標出地藏的位置
PHOTO_SPOTS.push({ scene: 6, x: 37.5, y: 19.5, id: 'nboard', lines: ['閃光燈照亮了褪色的地圖。', '……照片裡，地圖上浮出三個紅色的圈。', '（手機地圖上標出了地藏的位置。）'], then: () => { G.flags.jizoMap = 1; } });
{ const _m = phoneMap; phoneMap = function () {
    _m(); if (G.scene !== 6 || !G.flags.jizoMap) return;
    const c = $('#phMap'), g = c.getContext('2d'), k = 6.5, ox = c.width / 2 - (P.x - P.y) * k, oy = c.height / 2 - (P.x + P.y) * k / 2;
    JIZO.forEach((j, i) => { const a = ox + (j.x - j.y) * k, b = oy + (j.x + j.y) * k / 2; g.strokeStyle = G.flags['jizo' + i] ? '#7ad07a' : '#ff4040'; g.lineWidth = 2; g.beginPath(); g.arc(a, b + k / 2, 6, 0, 7); g.stroke(); });
  }; }
// 小巷盡頭的車站：結界斷了才過得去（原本看 alleyDone）
{ const _a = ch5Action; ch5Action = async function (o) {
    if (o.act === 'toStation') { G.flags.alleyDone = G.flags.kekkai ? 1 : 0; if (!G.flags.kekkai && !TEST) { await says(['……還不能過去。']); return; } }
    return _a(o); }; }
// 車站燈下：安全
{ const _sf = typeof sceneSafe === 'function' ? sceneSafe : null; sceneSafe = function (x, y) { if (G.scene === 6 && (haSafe(x, y) || dist(x, y, 3.5, 3.5) < 2.2)) return true; return _sf ? _sf(x, y) : false; }; }

/* ---------- 測試（?test=ch5）：便利商店 → 公路 → 住宅區（三尊地藏）→ 結界斷 → 小巷 → 車站 ---------- */
testCh5 = async function () {
  const tp = (x, y) => { P.x = x; P.y = y; };
  try {
    G.inv.pages = [1, 2, 3, 4, 5, 6, 7]; G.inv.flashlight = true; G.inv.phone = true; G.flags.trueEnd = true;
    await startRoad(); await waitFree();
    if (G.scene !== 6) throw 'not in scene 6';
    TEST_CHOICE = o => Math.max(0, o.findIndex(t => /不要出聲|問往車站|供上|掛斷/.test(t)));
    tp(12.5, 28.3); P.dir = 0; await interact(); await waitFree();
    if (!G.flags.receipt) throw 'receipt';
    for (const it of ITEMS.filter(i => (i.id === 'salt' || i.id === 'onigiri') && !i.off)) { tp(it.x, it.y - .3); await interact(); await waitFree(); }
    if (!(G.inv.salt > 0) || !G.inv.onigiri) throw 'salt/onigiri ' + G.inv.salt;
    P.inv = 9999;
    tp(40, 17.5); await wait(80); await waitFree();
    if (HA.state === 'off') throw 'hachi off';
    tp(45.5, 11.5); P.dir = 0; await interact(); await waitFree();
    if (!G.inv.ofuda) throw 'ofuda';
    for (const [i, x, y] of [[0, 39.5, 30.4], [1, 60.4, 10.5], [2, 60.4, 31.5]]) { tp(x, y); P.dir = i === 0 ? 4 : 6; await wait(60); const n = nearestInteract(); if (!n || n.o.act !== 'jizo') throw 'no jizo ' + i; await interact(); await waitFree(); }
    if (!G.flags.kekkai) throw 'kekkai';
    tp(5, 3.5); P.dir = 2; tp(4.5, 3.5); await interact();
    const t2 = performance.now(); while (G.scene !== 5 && performance.now() - t2 < 15000) await wait(100);
    document.title = (G.scene === 5 ? 'PASS ' : 'FAIL ') + JSON.stringify(stateSummary());
  } catch (e) { document.title = 'ERR ' + e + ' ' + JSON.stringify(stateSummary()); }
};
// 圍牆裡面：庭院（草地＋踏石），不能走
{ const _f = road6Floor; road6Floor = function (g) {
    _f(g);
    for (let y = MZ.y0; y <= MZ.y1; y++) for (let x = MZ.x0; x <= MZ.x1; x++) if (at(x, y) === 'X') {
      diamond(g, x, y, ['#26331f', '#29371f', '#233020'][(x * 5 + y * 3) % 3]); speck(g, x, y, ['#34452a', '#1b2618'], 8);
      if ((x * 7 + y * 11) % 9 === 0) { const [a, b] = isoW(x + .5, y + .5); g.fillStyle = '#5a5a56'; g.beginPath(); g.ellipse(a, b, 5, 2.5, 0, 0, 7); g.fill(); }
    }
  }; }
