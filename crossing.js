/* 夜校・如月　第五章：平交道（場景 7，2026-10-23 新增：使用者要求故事延長到 2 小時以上）
   小巷盡頭 → 稻田小路（稻草人：沒被看著的時候才會動）→ 拿稻草人手上的鑰匙 → 信號所（黑板＝拉桿順序，用手機閃光拍才看得清楚）
   → 拉對順序，平交道的柵欄才會升起（電車會定時通過，站在軌道上會被撞）→ 軌道北邊的慰靈碑旁，找到 Teke Teke 的腳
   → 她從軌道爬出來追 → 逃到往車站的小路。帶著腳到終章，Teke Teke 那段會不一樣。
   載入順序：最後（要用到 trainSeg、PHOTO_SPOTS、DIFF）。 */

const TRK7 = 20.6;
const KAKASHI = [[6, 37], [14, 42], [19, 35], [21, 29], [26, 26], [16, 32]].map(([x, y]) => ({ x: x + .5, y: y + .5, hx: x + .5, hy: y + .5, tilt: 0, moveT: 0 }));
const TR7 = { x: 99, v: 0, warn: 0, next: 6 };
const TK7 = { x: 37.5, y: TRK7, dir: 4, state: 'off', frame: 0, animD: 0, moving: false, r: .25 };
const LEVER_OK = [4, 2, 1, 3];
Object.assign(HIDE, { bush7: _L('躲進草叢') });
SCENE_PATROL[7] = [[60.5, 60.5]];
SCENES[7] = buildCh7;
loadImages(['kakashi_a', 'kakashi_b']);

function buildCh7() {
  // 田間小路（其他地方是水田＝不能走）
  fill(2, 39, 24, 40, ','); fill(23, 22, 24, 40, ','); fill(10, 31, 11, 38, ',');
  fill(25, 30, 30, 30, ',');
  // 信號所
  for (let y = 23; y <= 29; y++) for (let x = 27; x <= 33; x++) put(x, y, '#');
  fill(28, 24, 32, 28, '_'); door(30, 29, { locked: true, key: 'hutkey', sign: _L('信號所'), msg: _L('信號所的門鎖著。') });
  // 平交道（軌道 y20–21 只有這兩格能走）、北邊的小路
  fill(23, 20, 24, 21, '='); fill(23, 8, 24, 19, ','); fill(23, 7, 53, 8, ','); fill(36, 9, 37, 18, ',');
  for (const [x, y] of [[23, 22], [24, 22], [23, 19], [24, 19]]) obj('gate7', x, y, { act: 'gate7', label: _L('看平交道的柵欄'), n: y < 20 });
  obj('xsig', 22, 22, { solid: false }); obj('xsig', 25, 19, { solid: false });
  // 稻草人（手上掛著鑰匙的那一個）
  obj('kakashiK', 10, 30, { act: 'kakashiK', label: _L('看看那個稻草人') });
  // 信號所裡面
  obj('hutboard', 29, 23, { act: 'hutboard', label: _L('看黑板') });
  obj('panel7', 31, 24, { act: 'panel7', label: _L('拉桿控制盤') });
  obj('hutdesk', 32, 27, { act: 'hutlog', label: _L('看值班簿') });
  // 慰靈碑、Teke Teke 的腳、往車站的路
  obj('memorial', 36, 18, { act: 'memorial', label: _L('看看那個小石碑') });
  obj('legs7', 37, 18, { act: 'legs7', label: _L('草叢裡……有東西') });
  obj('exit7', 53, 7, { act: 'exit7', label: _L('往車站的燈走去') });
  for (const [x, y] of [[42, 8], [48, 8], [24, 12]]) obj('bush7', x, y);
  // 光
  LIGHTS.push({ x: 23.5, y: 22.5, r: 2.2, c: '255,60,50', id: 'xs1' }, { x: 24.5, y: 19.5, r: 2.2, c: '255,60,50', id: 'xs2' });
  LIGHTS.push({ x: 30.5, y: 26, r: 3, c: '255,226,170' }, { x: 53.5, y: 7.5, r: 3.4, c: '255,226,170' }, { x: 36.5, y: 17.5, r: 1.2, c: '255,190,140' });
  LIGHTS.push({ x: 3.5, y: 39.5, r: 2.4, c: '255,214,150' });
  item('bandage', 29, 25, _L('繃帶')); item('drink', 45, 7, _L('能量飲料')); item('can', 20, 39, _L('空罐'));
}
// 地面：水田、稻株、軌道碎石、北邊的草地
function ch7Floor(g) {
  for (let y = 0; y < 50; y++) for (let x = 0; x < 64; x++) {
    if (at(x, y) !== 'X') continue;
    if (y === 20 || y === 21) { diamond(g, x, y, (x + y) % 2 ? '#2a2724' : '#2e2b27'); speck(g, x, y, ['#3e3a34', '#1c1a18', '#4a453e'], 12); continue; }
    if (y > 21 && y < 46 && x < 40) {   // 水田：水面＋一排排稻株
      diamond(g, x, y, (x + y) % 2 ? '#1e2924' : '#202c27');
      g.fillStyle = 'rgba(140,170,190,.18)'; { const [a, b] = isoW(x + .3, y + .6); g.fillRect(a | 0, b | 0, 5, 1); }
      g.fillStyle = '#3c5a2c'; for (const u of [.25, .75]) for (const v of [.25, .75]) { const [a, b] = isoW(x + u, y + v); g.fillRect(a | 0, (b | 0) - 3, 1, 3); g.fillRect((a | 0) + 1, (b | 0) - 2, 1, 2); }
      continue;
    }
    if (y < 46) { diamond(g, x, y, ['#1f2e1c', '#22331f', '#1c2a19'][(x * 5 + y * 3) % 3]); speck(g, x, y, ['#2e4428', '#152013'], 7); }
  }
  // 鐵軌與枕木
  g.fillStyle = 'rgba(70,55,40,.85)';
  for (let x = .2; x < 64; x += .7) { if (x > 22.8 && x < 25.2) continue; const [a, b] = isoW(x, TRK7 - .45), [c, d] = isoW(x, TRK7 + .45); g.fillRect(Math.min(a, c), Math.min(b, d), 3, Math.abs(d - b) + 1); }
  g.strokeStyle = '#7a7670'; g.lineWidth = 1.2;
  for (const o of [-.3, .3]) { const [x0, y0] = isoW(0, TRK7 + o), [x1, y1] = isoW(64, TRK7 + o); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  // 平交道的黃黑線
  g.fillStyle = 'rgba(220,190,40,.55)'; for (const yy of [19.95, 22.05]) for (let k = 0; k < 6; k++) { const [a, b] = isoW(23 + k * .33, yy); g.fillRect(a | 0, b | 0, 4, 2); }
}
{ const _f = sceneFloor; sceneFloor = function (g) { if (G.scene === 7) return ch7Floor(g); return _f(g); }; }
{ const _t = sceneTile; sceneTile = function (g, x, y, c) {
    if (G.scene !== 7) return _t(g, x, y, c);
    if (c === '=') { diamond(g, x, y, '#4a3e30'); for (let k = .2; k < 1; k += .25) { const [a, b] = isoW(x, y + k), [c2, d] = isoW(x + 1, y + k); g.strokeStyle = 'rgba(20,14,8,.5)'; g.beginPath(); g.moveTo(a, b); g.lineTo(c2, d); g.stroke(); } return true; }
    return false; }; }
{ const _w = sceneWall; sceneWall = function (x, y) {
    if (G.scene !== 7 || !IMG.walls5) return _w(x, y);
    if (at(x, y) === 'D') return false;
    const L = !['#', 'D'].includes(at(x, y + 1)), R = !['#', 'D'].includes(at(x + 1, y)), H = 48, inner = y === 23;
    if (L) { faceTexL(IMG.walls5, (inner ? 2 : [0, 3, 0, 7][x % 4]) * 64, 64, x, y + 1, 1, H); const [a, b] = iso(x, y + 1), [c, d] = iso(x + 1, y + 1); poly([[a, b], [c, d], [c, d - H], [a, b - H]], 'rgba(0,0,0,.12)'); }
    if (R) { const [X, Y] = iso(x + 1, y + 1); ctx.setTransform(16 / 64, -8 / 64, 0, H / 68, X, Y - H); ctx.drawImage(IMG.walls5, 0, 0, 64, 68, 0, 0, 64, 68); ctx.setTransform(1, 0, 0, 1, 0, 0); const [a, b] = iso(x + 1, y + 1), [c, d] = iso(x + 1, y); poly([[a, b], [c, d], [c, d - H], [a, b - H]], 'rgba(0,0,0,.4)'); }
    box(x, y, 1, 1, H, '#3a3430', null, null); return true; }; }

/* ---------- 開場（小巷盡頭 → 平交道） ---------- */
async function startCrossing() {
  markReach(7);
  await card('card_gate', [_L('巷子的盡頭沒有車站。'), _L('是一片很大很大的水田。田的另一邊，有一條鐵軌。'), _L('……車站的燈，在平交道的對面。')]);
  loadScene(7);
  Object.assign(P, { x: 3.5, y: 39.5, dir: 6, hidden: null, crouch: false, pose: null });
  GH.active = false; ch7Reset();
  chapter(_L('第五章'), _L('平交道'));
  saveCP('cross0');
  await wait(TEST ? 10 : 1400);
  await says([_L('田裡站著好幾個稻草人。'), _L('……剛剛回頭的時候，它們好像都是背對著我的。')]);
  await phoneCall([_L('我是瑪莉。'), _L('我現在……在平交道。'), _L('稻草人很害羞哦。被看著的時候，它們不會動的。')]);
  setObj(_L('沿著田間小路走到平交道'));
}
function ch7Reset() {
  KAKASHI.forEach(k => Object.assign(k, { x: k.hx, y: k.hy, tilt: 0 }));
  Object.assign(TR7, { x: 99, v: 0, warn: 0, next: 6 });
  Object.assign(TK7, { x: 37.5, y: TRK7, state: G.flags.legs && !G.flags.out7 ? 'chase' : 'off', stunT: 0 });
  const F = G.flags;
  for (const o of OBJ) { if (o.t === 'gate7') o.solid = !F.gate7; if (o.t === 'legs7') o.solid = false; }
}

/* ---------- 互動 ---------- */
async function ch7Action(o) {
  const F = G.flags, I = G.inv;
  switch (o.act) {
    case 'gate7':
      if (F.gate7) return;
      await says([_L('平交道的柵欄放下來了。警鈴一直「噹、噹、噹」地響。'), _L('……可是，沒有電車來。'), _L('柵欄旁邊的小屋，門牌上寫著「信號所」。')]);
      setObj(I.hutkey ? _L('打開信號所，把柵欄升起來') : _L('找到信號所的鑰匙（田裡的稻草人……？）')); return;
    case 'kakashiK':
      if (I.hutkey || F.hutOpen) { await says([_L('稻草人的手是空的。'), _L('……它的頭，比剛才更歪了一點。')]); return; }
      await says([_L('小路盡頭的稻草人，手上掛著一串鑰匙。鑰匙牌上寫著「信號所」。'), _L('稻草人的臉，是用麻布縫的。……縫線，是一張笑著的嘴。')]);
      { const a = await choose(_L('稻草人'), _L('要拿鑰匙嗎？'), [_L('拿'), _L('先不要')], 0); if (a !== 0) return; }
      I.hutkey = 1; F.scareMad = 1; sfx.pick(); updateHUD(); sfx.sting(); shake = 6;
      await says([_L('拿下鑰匙的瞬間——'), _L('「沙……」'), _L('田裡所有的稻草人，同時把頭轉向了這邊。'), _L('（不要背對它們。用手電筒照著，它們就不會動。）')]);
      setObj(_L('打開信號所（田間小路的東邊）')); saveCP('hutkey'); return;
    case 'hutboard':
      await says([_L('黑板上用粉筆寫著拉桿的順序。'), [_L('黑板'), _L('「柵欄故障時：拉桿依序　④　？　①　？」')], _L('中間的字被擦掉了。……用手機的閃光燈照照看的話？')]); return;
    case 'hutlog':
      F.hutlog = 1;
      await says([[_L('信號所值班簿'), _L('2004 年 2 月 □ 日　4:40　平交道警鈴故障，柵欄未放下。')], [_L('信號所值班簿'), _L('4:44　下行列車通過。……平交道上，有一位穿制服的女學生。')], [_L('信號所值班簿'), _L('（之後的頁面，全部都只寫著同一句話）')], [_L('信號所值班簿'), _L('「是我沒有放下柵欄。是我沒有放下柵欄。是我沒有放下柵欄。」')]]);
      return;
    case 'panel7': return leverPanel();
    case 'memorial':
      await says([_L('軌道旁邊的小石碑。上面放著一束早就枯掉的花。'), [_L('石碑'), _L('「平成十六年二月　如月高校二年　慰靈」')], _L('……石碑旁邊的草叢裡，好像有什麼東西。')]); return;
    case 'legs7':
      if (F.legs) return;
      await says([_L('撥開草叢——'), _L('……是一雙穿著黑色長襪的腿。膝蓋以下，還穿著學校的室內鞋。'), _L('冰冷，可是很乾淨。好像一直有人在幫它擦乾淨一樣。')]);
      { const a = await choose('', _L('……要帶走嗎？'), [_L('帶走（還給她）'), _L('不要碰')], 0); if (a !== 0) { await says([_L('……退開了。可是，不帶走的話，她就永遠找不到了。')]); return; } }
      F.legs = 1; o.hidden7 = 1; o.act = null; updateHUD(); sfx.sting(); shake = 12;
      await says([_L('把那雙腿抱起來的瞬間，軌道上傳來聲音。'), _L('「テケ、テケ、テケ、テケ——」'), _L('「…………那是，我的。」'), _L('（跑！往東邊，車站的燈那裡！）')]);
      TK7.state = 'chase'; TK7.x = 37.5; TK7.y = TRK7; setObj(_L('帶著她的腳，逃到車站的燈那裡')); saveCP('legs');
      return;
    case 'exit7':
      if (!F.legs) { await says([_L('車站的燈就在前面。'), _L('……可是，慰靈碑那邊，好像有人在等著什麼。'), _L('（還有事情沒做完。）')]); if (!TEST) return; }
      F.out7 = 1; TK7.state = 'off';
      await says([_L('跑到燈下的時候，聲音停了。'), _L('回頭——軌道上什麼都沒有。'), _L('只有懷裡這雙腿，還是冰冷的。'), _L('前面的路，通往一座亮著燈的小車站。')]);
      G.flags.ending4 = 1;
      return startCh4();
  }
  return false;
}
async function leverPanel() {
  const F = G.flags;
  if (F.gate7) { await says([_L('拉桿都在正確的位置。柵欄升起來了。')]); return; }
  await says([_L('控制盤上有四根生鏽的拉桿，編號 ① 到 ④。')]);
  const pick = [];
  for (let i = 0; i < 4; i++) {
    G.leverStep = i;
    const a = await choose(_L('拉桿'), _L`第 ${i + 1} 次，要拉哪一根？`, ['①', '②', '③', '④'], 0);
    pick.push(a + 1); sfx.click(); tone(120, .2, 'square', .05);
  }
  if (pick.join() === LEVER_OK.join()) {
    F.gate7 = 1; for (const o of OBJ) if (o.t === 'gate7') o.solid = false;
    sfx.door(); await says([_L('「喀啦——」'), _L('外面的柵欄，慢慢地升了起來。警鈴的聲音也停了。'), _L('（電車還是會經過。要看準時機穿過平交道。）')]);
    setObj(_L('穿過平交道（警鈴響的時候不要靠近軌道）')); saveCP('gate7'); return;
  }
  // 拉錯：警鈴大響，稻草人暴走
  addNoise(P.x, P.y, 10); G.scareRage = G.t + 12; sfx.sting(); shake = 8;
  await says([_L('「噹噹噹噹噹噹噹——」'), _L('警鈴突然響得震耳欲聾。……外面的田裡，傳來稻草被拖動的聲音。'), _L('（順序不對。黑板上的字……）')]);
}

/* ---------- 稻草人：沒被看著的時候才會動 ---------- */
function watched(k) {
  const dx = k.x - P.x, dy = k.y - P.y, d = Math.hypot(dx, dy); if (d < .01) return true;
  const [fx, fy] = DIRV[P.dir], dot = (fx * dx + fy * dy) / d;
  const range = P.light ? 9 : 3.2;
  return !P.hidden && d < range && dot > (P.light ? .78 : .55);
}
function kakashiUpdate(dt) {
  if (G.mode !== 'play' || P.hidden) return;
  const mad = G.flags.scareMad, rage = (G.scareRage || 0) > G.t;
  for (const k of KAKASHI) {
    const d = dist(k.x, k.y, P.x, P.y);
    k.tilt *= .9;
    if (watched(k) || d > 13 || (!mad && !rage)) { if (watched(k) && d < 6) G.fear = Math.min(100, (G.fear || 0) + 4 * dt); continue; }
    if (stunned(k)) continue;
    const sp = (rage ? 1.6 : 1.05) * DIFF.walk * dt, m = Math.max(d, .01);
    k.x += (P.x - k.x) / m * Math.min(sp, d); k.y += (P.y - k.y) / m * Math.min(sp, d); k.tilt = Math.sin(G.t * 30) * .3; k.moveT = G.t;
    if (Math.random() < dt * 2 && d < 7) noise(.12, .05, 'highpass', 3000, 1);
    if (d < .6 && P.inv <= 0 && !G.lock) kakashiHit(k);
  }
}
async function kakashiHit(k) {
  damage(1); sfx.hurt(); shake = 8; setPose('hurt', .8); P.inv = 2;
  k.x = k.hx; k.y = k.hy;
  if (G.mode !== 'play') return;
  toast(_L('乾草的手臂，一把抓住了脖子——（看著它們！）'));
}

/* ---------- 電車：警鈴響 3.5 秒後高速通過 ---------- */
function trainUpdate(dt) {
  const nearX = Math.abs(P.x - 24) < 22;
  if (TR7.v) {
    TR7.x += TR7.v * dt;
    if (P.y > 19.5 && P.y < 22.4 && P.x > TR7.x - .3 && P.x < TR7.x + 14.3 && P.inv <= 0 && !G.lock) trainHit();
    if (TR7.x < -16) { TR7.v = 0; TR7.x = 99; TR7.next = 9 + Math.random() * 6; }
    return;
  }
  if (TR7.warn > 0) { TR7.warn -= dt; if (Math.floor(TR7.warn * 2.5) !== Math.floor((TR7.warn + dt) * 2.5)) tone(Math.floor(TR7.warn * 2.5) % 2 ? 760 : 640, .16, 'square', nearX ? .035 : .012); if (TR7.warn <= 0) { TR7.x = 66; TR7.v = -15; noise(2.2, .16, 'lowpass', 320, .8); } return; }
  TR7.next -= dt; if (TR7.next <= 0 && nearX) TR7.warn = TEST ? .2 : 3.5;
}
async function trainHit() {
  damage(2); sfx.hurt(); shake = 18; setPose('hurt', 1); P.inv = 2.5;
  P.y = P.y < TRK7 ? 18.6 : 22.6;
  if (G.mode !== 'play') return;
  await says([_L('——光。'), _L('整個人被風壓甩了出去。'), _L('（警鈴響的時候，不能靠近軌道……）')]);
}

/* ---------- Teke Teke：拿走她的腳之後一路追來 ---------- */
function tk7Update(dt) {
  TK7.moving = false;
  if (TK7.state !== 'chase' || stunned(TK7)) return;
  const d = dist(TK7.x, TK7.y, P.x, P.y);
  if (P.hidden && !TK7.sawHide) { TK7.lost = (TK7.lost || 0) + dt; if (TK7.lost > 2.2) { TK7.state = 'lurk'; TK7.lost = 0; toast(_L('「テケ……テケ……」聲音往軌道那邊去了')); } return; }
  TK7.lost = 0;
  const sp = 3.5 * DIFF.chase * dt, m = Math.max(d, .01), dx = P.x - TK7.x, dy = P.y - TK7.y;
  TK7.x += dx / m * Math.min(sp, d); TK7.y += dy / m * Math.min(sp, d);
  TK7.dir = dirFromWorld(dx, dy); TK7.moving = true; TK7.animD += sp; TK7.frame = Math.floor(TK7.animD / .22) % 4;
  G.tk7Tick = (G.tk7Tick || 0) - dt; if (G.tk7Tick <= 0) { G.tk7Tick = .3; noise(.05, .12, 'bandpass', 1800, 3); }
  if (P.hidden && TK7.sawHide && d < 1.3) { unhide(); tk7Catch(); }
  else if (!P.hidden && d < .6 && P.inv <= 0 && !G.lock) tk7Catch();
}
async function tk7Catch() {
  damage(2); sfx.sting(); shake = 14; P.inv = 2.5; TK7.stunT = G.t + 3;
  if (G.mode !== 'play') return;
  await says([_L('冰冷的手指扣住了腳踝——'), _L('「還給我。還、給、我。」'), _L('（拚命甩開——她被甩回了軌道那邊。）')]);
  TK7.x = Math.max(23, P.x - 6); TK7.y = TRK7;
}
// 躲起來之後：她回到軌道附近徘徊，看到人又會追
function tk7Lurk(dt) {
  if (TK7.state !== 'lurk') return;
  const d = dist(TK7.x, TK7.y, P.x, P.y);
  if (!P.hidden && d < 5.5 && !pInvis()) { TK7.state = 'chase'; sfx.sting(); toast(_L('テケ、テケ、テケ——！')); }
}

/* ---------- 掛勾 ---------- */
{ const _a = sceneAction; sceneAction = async function (o) { if (G.scene === 7) { const r = await ch7Action(o); return r === false ? undefined : r; } return _a(o); }; }
{ const _u = sceneUpdate; sceneUpdate = function (dt) {
    if (G.scene !== 7) return _u(dt);
    kakashiUpdate(dt); trainUpdate(dt); tk7Update(dt); tk7Lurk(dt);
    const blink = TR7.warn > 0 || (!G.flags.gate7 && Math.sin(G.t * 6) > 0);
    for (const l of LIGHTS) if (l.id === 'xs1' || l.id === 'xs2') l.r = blink ? 2.2 : .3;
    if (!G.flags.gate7 && Math.floor(G.t * 2.5) !== Math.floor((G.t - dt) * 2.5) && Math.abs(P.x - 24) < 14 && !TR7.warn) tone(Math.floor(G.t * 2.5) % 2 ? 760 : 640, .14, 'square', .012);
  }; }
{ const _s = sceneSprites; sceneSprites = function (list) {
    if (G.scene !== 7) return _s(list);
    for (const k of KAKASHI) list.push({ d: k.x + k.y, f: () => drawKakashi(k.x, k.y, k.tilt, false) });
    if (TK7.state !== 'off' && IMG.teke) list.push({ d: TK7.x + TK7.y, f: () => drawSprite(IMG.teke, TK7.x, TK7.y, TK7.dir, TK7.moving ? TK7.frame : 0, { jit: TK7.state === 'chase' ? (Math.random() - .5) * 2 : 0, noShadow: true, alpha: stunned(TK7) ? .6 : 1 }) });
    if (TR7.v) for (let i = 0; i < 14; i++) { const x = TR7.x + i; if (x > -2 && x < 64) list.push({ d: x + TRK7 + .4, f: () => trainSeg(x, TRK7, i, 14, { lit: true }) }); }
  }; }
function drawKakashi(x, y, tilt, hasKey) {
  const [cx, cy] = iso(x, y);
  const im = IMG[(Math.floor(x * 3 + y * 7) % 2) ? 'kakashi_a' : 'kakashi_b'];
  if (im) {   // Gemini 稻草人
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(cx, cy, 7, 3, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt * .15); ctx.drawImage(im, Math.round(-im.width / 2), -im.height + 2);
    if (hasKey) { ctx.fillStyle = '#e8d070'; ctx.fillRect(im.width / 2 - 4, -im.height + 22, 3, 4); ctx.fillRect(im.width / 2 - 3, -im.height + 26, 1, 3); }
    ctx.restore(); return;
  }
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt * .15);
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 3, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#4a3a26'; ctx.fillRect(-1, -40, 2, 40);                        // 竹竿
  ctx.fillStyle = '#5a4630'; ctx.fillRect(-14, -30, 28, 2);                      // 橫桿
  ctx.fillStyle = '#6a5a48'; ctx.fillRect(-10, -31, 20, 15);                     // 舊衣服
  ctx.fillStyle = '#8a7a4a'; for (const s of [-14, 13]) { ctx.fillRect(s, -31, 2, 7); ctx.fillRect(s - 1, -25, 1, 3); ctx.fillRect(s + 2, -25, 1, 3); }   // 稻草手
  ctx.fillStyle = '#b8a888'; ctx.beginPath(); ctx.arc(0, -36, 6, 0, 7); ctx.fill();   // 麻布頭
  ctx.fillStyle = '#2a1e14'; ctx.fillRect(-3, -37, 1, 1); ctx.fillRect(2, -37, 1, 1); ctx.fillRect(-3, -33, 6, 1); for (let k = -3; k < 3; k += 2) ctx.fillRect(k, -34, 1, 3);   // 縫起來的笑臉
  ctx.fillStyle = '#c8a860'; ctx.beginPath(); ctx.ellipse(0, -41, 10, 3, 0, 0, 7); ctx.fill(); ctx.fillRect(-5, -45, 10, 4);   // 斗笠
  if (hasKey) { ctx.fillStyle = '#d8c070'; ctx.fillRect(13, -24, 3, 4); ctx.fillRect(14, -20, 1, 3); }
  ctx.restore();
}
{ const _d = sceneDrawObj; sceneDrawObj = function (o, cx, cy, shaking) {
    if (G.scene !== 7) return _d(o, cx, cy, shaking);
    const { x, y } = o;
    switch (o.t) {
      case 'kakashiK': drawKakashi(x + .5, y + .5, Math.sin(G.t * 1.3) * .2, !G.inv.hutkey && !G.flags.hutOpen); return true;
      case 'gate7': {   // 柵欄：放下＝黃黑橫桿，升起＝直立
        box(x + .4, y + .4, .2, .2, 14, '#ddd', '#aaa', '#999');
        const [a, b] = iso(x + .5, y + .5);
        if (!G.flags.gate7) { ctx.fillStyle = '#e8c830'; ctx.fillRect(a - 16, b - 13, 32, 3); ctx.fillStyle = '#1a1a1a'; for (let k = -16; k < 16; k += 8) ctx.fillRect(a + k, b - 13, 4, 3); }
        else { ctx.fillStyle = '#e8c830'; ctx.fillRect(a - 1, b - 46, 3, 34); ctx.fillStyle = '#1a1a1a'; for (let k = 0; k < 34; k += 8) ctx.fillRect(a - 1, b - 46 + k, 3, 4); }
        return true;
      }
      case 'xsig': {   // 平交道警報器：X 形標誌＋兩顆紅燈
        const on = TR7.warn > 0 || !G.flags.gate7, ph = Math.sin(G.t * 9) > 0;
        ctx.fillStyle = '#3a3a3a'; ctx.fillRect(cx - 1, cy - 48, 2, 48);
        ctx.strokeStyle = '#e8c830'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 9, cy - 50); ctx.lineTo(cx + 9, cy - 40); ctx.moveTo(cx + 9, cy - 50); ctx.lineTo(cx - 9, cy - 40); ctx.stroke();
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(cx - 10, cy - 36, 20, 7);
        ctx.fillStyle = on && ph ? '#ff3a2a' : '#4a1612'; ctx.beginPath(); ctx.arc(cx - 5, cy - 32.5, 2.6, 0, 7); ctx.fill();
        ctx.fillStyle = on && !ph ? '#ff3a2a' : '#4a1612'; ctx.beginPath(); ctx.arc(cx + 5, cy - 32.5, 2.6, 0, 7); ctx.fill();
        return true;
      }
      case 'hutboard': faceRect(x, y, 'L', .1, .9, 12, 30, '#26352c'); ctx.fillStyle = '#d8d8c8'; ctx.fillRect(cx - 6, cy - 22, 3, 2); ctx.fillRect(cx + 2, cy - 18, 3, 2); return true;
      case 'panel7': box(x + .15, y + .3, .7, .4, 22, '#5a6058', '#3e443e', '#353a35'); ctx.fillStyle = '#a03a2a'; for (let k = 0; k < 4; k++) ctx.fillRect(cx - 7 + k * 4, cy - 28 + (G.flags.gate7 ? 4 : 0), 2, 6); return true;
      case 'hutdesk': box(x + .1, y + .2, .8, .6, 12, '#5c4733', '#3f3124', '#352a1f'); ctx.fillStyle = '#d8d0b8'; ctx.fillRect(cx - 3, cy - 16, 6, 3); return true;
      case 'memorial': box(x + .3, y + .3, .4, .4, 16, '#7a7870', '#5a5852', '#4e4c46'); ctx.fillStyle = '#6a4a5a'; ctx.fillRect(cx - 3, cy - 4, 6, 3); return true;
      case 'legs7': if (G.flags.legs) return true; ctx.fillStyle = '#141418'; ctx.fillRect(cx - 6, cy - 3, 9, 3); ctx.fillRect(cx - 2, cy, 9, 3); ctx.fillStyle = '#e8e4dc'; ctx.fillRect(cx + 3, cy - 3, 3, 3); ctx.fillRect(cx + 7, cy, 3, 3); return true;
      case 'exit7': ctx.fillStyle = '#3a3a3a'; ctx.fillRect(cx - 1, cy - 44, 2, 44); ctx.fillStyle = '#ffe2a8'; ctx.fillRect(cx - 4, cy - 46, 8, 3); return true;
      case 'bush7': ctx.fillStyle = '#1c2e1a'; ctx.beginPath(); ctx.ellipse(cx, cy - 7 + shaking, 15, 10, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#26402a'; ctx.beginPath(); ctx.ellipse(cx - 4, cy - 11 + shaking, 8, 6, 0, 0, 7); ctx.fill(); return true;
    }
    return _d(o, cx, cy, shaking);
  }; }
{ const _h = sceneHUD; sceneHUD = function (s) {
    _h(s); if (G.scene === 7 || G.scene === 5) { if (G.flags.legs) s.push(_L`<div class="s">她的腳</div>`); }
    if (G.scene === 7 && G.inv.hutkey && !G.flags.hutOpen) s.push(_L`<div class="s">信號所的鑰匙</div>`);
  }; }
{ const _o = sceneOnLoad; sceneOnLoad = function (cp) { _o(cp); if (G.scene === 7) ch7Reset(); }; }
{ const _ud = useDoor; useDoor = async function (dr) {
    if (G.scene === 7 && dr.key === 'hutkey') {
      if (G.inv.hutkey) { dr.locked = false; G.inv.hutkey = 0; G.flags.hutOpen = 1; sfx.door(); updateHUD(); toast(_L('信號所的門打開了')); setObj(_L('把平交道的柵欄升起來（信號所的控制盤）')); return; }
      sfx.locked(); await says([dr.msg, _L('（鑰匙……田裡那個稻草人手上，好像掛著什麼。）')]); return;
    }
    return _ud(dr); }; }
{ const _th = threats; threats = function () {
    const t = _th(); if (G.scene !== 7) return t;
    if (TK7.state === 'chase') t.push({ e: TK7, chase: true, stun: s => { TK7.stunT = G.t + s; } });
    for (const k of KAKASHI) if (dist(k.x, k.y, P.x, P.y) < 8 && (G.flags.scareMad || G.scareRage > G.t)) t.push({ e: k, chase: false, stun: s => { k.stunT = G.t + s; } });
    return t; }; }
{ const _hd = hide; hide = function (o) { if (G.scene === 7) TK7.sawHide = TK7.state === 'chase' && dist(TK7.x, TK7.y, P.x, P.y) < 3; return _hd(o); }; }
// 第四章的小巷盡頭 → 先到平交道
roadEnd = async function () { await says([_L('巷子的盡頭，是一片看不到邊的水田。'), _L('……遠遠的，有平交道的警鈴聲。')]); return startCrossing(); };
// 手機：拍黑板 → 看到被擦掉的數字
PHOTO_SPOTS.push({ scene: 7, x: 29.5, y: 23.5, id: 'hutboard', lines: [_L('閃光燈一閃，黑板上被擦掉的粉筆痕浮了出來。'), [_L('黑板'), _L('「柵欄故障時：拉桿依序　④　②　①　③」')]], then: () => { G.flags.leverHint = 1; } });
// 終章：帶著腳的話，Teke Teke 抓到妳時可以把腳還給她
if (typeof tkCatch === 'function') { const _tc = tkCatch; tkCatch = async function () {
    if (G.scene === 5 && G.flags.legs && !G.flags.legsGiven) {
      TK.state = 'stun'; TK.timer = 99; P.hidden = null; sfx.sting();
      const a = await choose('Teke Teke', _L('「……我的腳，在哪裡？」'), [_L('把抱著的那雙腿還給她'), _L('不說話')], TEST ? 0 : 6000);
      if (a === 0) {
        G.flags.legsGiven = 1; G.flags.legs = 0; updateHUD();
        await says([_L('把那雙腿放在她面前。'), _L('她伸出手，很慢、很慢地摸了摸那雙室內鞋。'), _L('「…………找到了。」'), _L('頭髮後面，第一次露出了一點點臉。是一個很普通的女生。'), _L('「謝謝。……我要回家了。」'), _L('她抱著自己的腿，沿著軌道慢慢走遠——是「走」的。')]);
        TK.state = 'gone'; return;
      }
    }
    return _tc(); }; }
// 怪談筆記
LORE.push(
  ['kakashi', _L('稻草人'), _L('水田裡的稻草人，被看著的時候一動也不動。'), _L('只要用手電筒照著它們，它們就不會靠近。'), () => G.flags.scareMad],
  ['fumikiri', _L('校後的平交道'), _L('2004 年 2 月，警鈴故障的平交道上，一位女學生被列車撞上。'), _L('信號所的值班簿上，同一句話寫了好幾百遍。'), () => G.flags.hutlog],
  ['legs', _L('Teke Teke 的腳'), _L('慰靈碑旁的草叢裡，一雙穿著室內鞋的腿。'), _L('把它還給她的話……'), () => G.flags.legs || G.flags.legsGiven],
);

/* ---------- 測試（?test=ch7） ---------- */
async function testCh7() {
  const tp = (x, y) => { P.x = x; P.y = y; };
  try {
    G.inv.pages = [1, 2, 3, 4, 5, 6, 7]; G.inv.flashlight = true; G.inv.phone = true; G.flags.trueEnd = true;
    await startCrossing(); await waitFree();
    if (G.scene !== 7) throw 'not in scene 7';
    P.inv = 9999;
    TEST_CHOICE = o => { if (o[0] === '①') return LEVER_OK[G.leverStep] - 1; return Math.max(0, o.findIndex(t => /^拿$|帶走|把抱著/.test(t))); };
    tp(10.5, 31.4); P.dir = 0; await interact(); await waitFree();
    if (!G.inv.hutkey) throw 'key';
    tp(30.5, 30.4); P.dir = 0; await interact(); await waitFree();
    if (DOORS['30,29'].locked) throw 'door';
    tp(31.5, 25.4); P.dir = 0; await interact(); await waitFree();
    if (!G.flags.gate7) throw 'levers';
    TR7.v = 0; TR7.warn = 0; TR7.next = 99;
    tp(23.5, 23.2); await wait(50); tp(23.5, 18.4); await wait(50);
    tp(37.5, 17.3); P.dir = 4; await interact(); await waitFree();
    if (!G.flags.legs) throw 'legs';
    tp(52.5, 7.5); P.dir = 6; await interact();
    const t2 = performance.now(); while (G.scene !== 5 && performance.now() - t2 < 15000) await wait(100);
    document.title = (G.scene === 5 ? 'PASS ' : 'FAIL ') + JSON.stringify(stateSummary());
  } catch (e) { document.title = 'ERR ' + e + ' ' + JSON.stringify(stateSummary()); }
}
