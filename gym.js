/* 夜校・如月　第一章擴充：體育館與游泳池（2026-10-23，使用者：故事要延長到 2 小時、地圖要大、互動要多）
   器材小屋的鑰匙箱是空的（字條：側門鑰匙借給游泳社了）→ 操場東邊圍欄的破洞 → 體育館（自己運球的籃球：聽到聲音就滾過來）
   → 舞台布幕繩上的器材室鑰匙（拿走時，沒有頭的學生出現）→ 器材室的撈網 → 游泳池（水裡伸出的手：看到漣漪就退開）
   → 用撈網撈三次，撈起側門鑰匙 → 回到原本流程（開側門）。
   第一章開機時是直接 buildCh1()，所以這裡載入後要對目前的地圖補建一次。載入順序：最後。 */

const GYM = { x0: 43, y0: 13, x1: 62, y1: 26 }, POOL = { x0: 47, y0: 29, x1: 58, y1: 34 };
const inGym = (x, y) => x > GYM.x0 && x < GYM.x1 && y > GYM.y0 && y < GYM.y1;
const BALL = { x: 52.5, y: 19.5, vx: 1.2, vy: .8, z: 0, vz: 0, chase: 0 };
const HL = { x: 52.5, y: 15.5, dir: 4, state: 'off', frame: 0, animD: 0, moving: false, path: null, r: .25 };
const HANDS = [];   // {x, y, t0}
Object.assign(HIDE, { vault: _L('躲到跳箱後面') });

function buildGym() {
  put(39, 20, '='); put(39, 21, '='); fill(40, 20, 42, 21, '=');                 // 圍欄的破洞 → 體育館
  fill(GYM.x0, GYM.y0, GYM.x1, GYM.y1, '#'); fill(GYM.x0 + 1, GYM.y0 + 1, GYM.x1 - 1, GYM.y1 - 1, '_');
  door(43, 20, { sign: _L('體育館') });
  fill(57, 21, 61, 21, '#'); for (let y = 21; y <= 25; y++) put(57, y, '#');   // 器材室
  door(57, 23, { locked: true, key: 'gymkey', sign: _L('器材室'), msg: _L('器材室。門鎖著。') });
  door(52, 26, {});                                                              // 體育館 → 游泳池
  fill(43, 27, 62, 37, 'f'); fill(44, 27, 61, 36, '=');                          // 游泳池（四周是圍欄）
  for (let y = POOL.y0; y <= POOL.y1; y++) for (let x = POOL.x0; x <= POOL.x1; x++) put(x, y, 'X');
  for (let x = 46; x <= 58; x++) if (x !== 52) obj('stage', x, 14);
  obj('stage', 52, 14, { g1: 1, act: 'stagekey', label: _L('舞台的布幕繩') });
  obj('hoop', 44, 19); obj('hoop', 56, 19);
  for (const [x, y] of [[47, 24], [50, 24], [45, 16]]) obj('vault', x, y);
  obj('gymnote', 59, 25, { g1: 1, act: 'net', label: _L('牆上掛著的撈網') });
  obj('gymboard', 44, 25, { g1: 1, act: 'gymboard', label: _L('看體育館的公告') });
  obj('poolkey', 52, 35, { g1: 1, act: 'fish', label: _L('池底……有東西在發光'), solid: false });
  obj('poolbench', 45, 35, { g1: 1, act: 'poolnote', label: _L('看長椅上的東西') });
  LIGHTS.push({ x: 52.5, y: 15.2, r: 2.2, c: '255,214,160', id: 'stageL' }, { x: 59.5, y: 24, r: 1.6, c: '220,230,255' });
  LIGHTS.push({ x: 52.5, y: 35.6, r: 1.4, c: '160,230,255', id: 'poolkeyL' }, { x: 44.5, y: 28, r: 2.4, c: '200,220,255' }, { x: 60.5, y: 36, r: 2.4, c: '200,220,255' });
  item('bandage', 58, 22, _L('繃帶')); item('can', 45, 22, _L('空罐'));
}
{ const _b = SCENES[1]; SCENES[1] = function () { _b(); buildGym(); }; }
if (G.scene === 1 && !OBJ.some(o => o.t === 'stage')) { buildGym(); indexObjs(); }   // 開機時已經建好的第一章

/* ---------- 地面：體育館木地板（有球場線）、泳池水面 ---------- */
{ const _t = sceneTile; sceneTile = function (g, x, y, c) {
    if (G.scene === 1 && c === '_' && inGym(x, y) && IMG.floors_g) { texTile(g, IMG.floors_g, 3, x, y, '#b07a3e'); return true; }
    if (G.scene === 1 && c === '=' && x >= 44 && y >= 27 && y <= 36) { diamond(g, x, y, (x + y) % 2 ? '#8a9a9e' : '#84949a'); speck(g, x, y, ['#9aaaae', '#6a7a80'], 4); return true; }
    return _t(g, x, y, c); }; }
{ const _f = sceneFloor; sceneFloor = function (g) {
    if (G.scene !== 1) return _f(g);
    for (let y = POOL.y0; y <= POOL.y1; y++) for (let x = POOL.x0; x <= POOL.x1; x++) {
      diamond(g, x, y, (x + y) % 2 ? '#1c3a4a' : '#1a3646'); speck(g, x, y, ['#2a5468', '#12293a'], 6);
      if (y % 2 === 0) { const [a, b] = isoW(x, y + .5), [c, d] = isoW(x + 1, y + .5); g.strokeStyle = 'rgba(160,210,230,.18)'; g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }   // 水道線
    }
    g.strokeStyle = 'rgba(240,240,230,.4)'; g.lineWidth = 1;   // 球場線
    for (const [a, b, c2, d] of [[45, 16, 60, 16], [45, 23, 60, 23], [45, 16, 45, 23], [60, 16, 60, 23], [52.5, 16, 52.5, 23]]) { const [x0, y0] = isoW(a, b), [x1, y1] = isoW(c2, d); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
    g.lineWidth = 1;
  }; }

/* ---------- 互動 ---------- */
// 器材小屋的鑰匙箱（game.js 會先問這個）
async function gymKeybox() {
  if (G.flags.gymHint) { await says([_L('鑰匙箱是空的。……字條上寫著，鑰匙借給游泳社了。')]); return true; }
  G.flags.gymHint = 1; sfx.click();
  await says([_L('掛著「側門」名牌的鉤子是空的。'), _L('鉤子上夾著一張字條。'), [_L('字條'), _L('「側門鑰匙借給游泳社晨練用，練完放回。——體育股長」')], [_L('字條'), _L('日期：2004 年 2 月 □ 日')], _L('……二十年前借走的鑰匙。'), _L('游泳池在體育館後面。操場東邊的圍欄，好像有一個破洞。')]);
  setObj(_L('穿過操場東邊圍欄的破洞，去體育館找側門鑰匙')); saveCP('gymhint');
  return true;
}
async function gymAction(o) {
  const F = G.flags, I = G.inv;
  switch (o.act) {
    case 'gymboard': await says([[_L('體育館公告'), _L('「夜間禁止進入體育館。」')], [_L('體育館公告'), _L('「籃球社的同學：請不要在晚上練球。值班老師說每天晚上都聽到運球聲。」')], _L('……底下有人用原子筆補了一行：「那不是我們。」')]); return;
    case 'stagekey':
      if (F.gymkey) { await says([_L('布幕繩上什麼都沒有了。')]); return; }
      await says([_L('舞台的布幕繩上，綁著一把小鑰匙。名牌上寫著「器材室」。'), _L('……布幕後面，好像有人站著。')]);
      { const a = await choose('', _L('要解下鑰匙嗎？'), [_L('解下來'), _L('先不要')], 0); if (a !== 0) return; }
      F.gymkey = 1; I.gymkey = 1; sfx.pick(); updateHUD();
      sfx.sting(); shake = 10;
      await says([_L('解下鑰匙的瞬間，舞台的燈「啪」地熄了。'), _L('布幕後面走出來一個穿著運動服的學生。'), _L('……脖子上面，什麼都沒有。'), _L('籃球場的另一頭，那顆球停止了彈跳。他在找他的頭。')]);
      HL.state = 'chase'; HL.x = 52.5; HL.y = 15.6; HL.path = null;
      setObj(_L('用鑰匙打開器材室（體育館的東南角）')); saveCP('gymkey'); return;
    case 'net':
      if (I.net) return;
      I.net = 1; sfx.pick(); updateHUD();
      await says([_L('器材室的牆上，掛著一支清理泳池用的長柄撈網。'), _L('得到【撈網】'), _L('……把手上用麥克筆寫著：「游泳社　澄香」。')]);
      setObj(_L('到體育館後面的游泳池，把側門鑰匙撈起來')); saveCP('net'); return;
    case 'poolnote':
      await says([_L('長椅上放著一件摺好的運動外套。'), _L('口袋裡有一張紙條。'), [_L('紙條'), _L('「池底的手不會抓看著它的人。看到水面起漣漪，就往後退。」')], [_L('紙條'), _L('「……可是，撈東西的時候，眼睛只能看著網子。」')]]); return;
    case 'fish': return fishKey(o);
  }
  return false;
}
async function fishKey(o) {
  const F = G.flags;
  if (G.inv.key || F.poolKey) return;
  if (!G.inv.net) { await says([_L('池底有一個亮亮的東西……是一把鑰匙。'), _L('手搆不到。要有長一點的東西才行。（體育館的器材室？）')]); return; }
  F.fish = (F.fish || 0);
  G.lock++; sfx.click(); toast(_L('把撈網伸進水裡……')); noise(.8, .06, 'lowpass', 500, 1);
  const n0 = HANDS.length;
  await wait(TEST ? 10 : 1300);
  G.lock--;
  const grabbed = HANDS.some(h => G.t - h.t0 > .8 && dist(h.x, h.y, P.x, P.y) < 1.6) && !TEST;
  if (grabbed) { damage(1); sfx.hurt(); shake = 10; setPose('hurt', .8); F.fish = Math.max(0, F.fish - 1); toast(_L('水裡的手抓住了網子——差點被拖下去！')); return; }
  F.fish++;
  if (F.fish < 3) { toast(_L`網子碰到鑰匙了……（${F.fish} / 3）`); spawnHand(true); return; }
  F.poolKey = 1; o.act = null;
  G.inv.key = true; sfx.pick(); updateHUD(); toast(_L('得到【側門鑰匙】'));
  await says([_L('撈起來了。生鏽的鑰匙，名牌上寫著「側門」。'), _L('……網子上纏著一縷長長的黑頭髮。'), _L('水面上，好幾隻白色的手慢慢沉了下去。')]);
  STATUE.gone = true; setObj(_L('用鑰匙打開校舍側門')); saveCP('key');
}
// 器材室的門
{ const _ud = useDoor; useDoor = async function (dr) {
    if (G.scene === 1 && dr.key === 'gymkey') {
      if (G.inv.gymkey) { dr.locked = false; G.inv.gymkey = 0; sfx.door(); updateHUD(); toast(_L('器材室的門打開了')); return; }
      sfx.locked(); await says([dr.msg, _L('（鑰匙……舞台那邊？）')]); return;
    }
    return _ud(dr); }; }

/* ---------- 自己運球的籃球 ---------- */
function ballUpdate(dt) {
  if (!inGym(P.x, P.y) && !BALL.chase) return;
  for (const n of G.noises || []) if (G.t - n.t < .1 && inGym(n.x, n.y)) { BALL.chase = 4; BALL.tx = n.x; BALL.ty = n.y; }
  BALL.chase = Math.max(0, BALL.chase - dt);
  if (BALL.chase > 0) { const dx = BALL.tx - BALL.x, dy = BALL.ty - BALL.y, m = Math.hypot(dx, dy) || 1; BALL.vx += dx / m * 4 * dt; BALL.vy += dy / m * 4 * dt; }
  const sp = Math.hypot(BALL.vx, BALL.vy), mx = BALL.chase ? 3.6 : 1.6; if (sp > mx) { BALL.vx *= mx / sp; BALL.vy *= mx / sp; }
  let nx = BALL.x + BALL.vx * dt, ny = BALL.y + BALL.vy * dt;
  if (solidTile(Math.floor(nx), Math.floor(BALL.y)) || OBJAT[Math.floor(nx) + ',' + Math.floor(BALL.y)]) { BALL.vx *= -1; nx = BALL.x; }
  if (solidTile(Math.floor(BALL.x), Math.floor(ny)) || OBJAT[Math.floor(BALL.x) + ',' + Math.floor(ny)]) { BALL.vy *= -1; ny = BALL.y; }
  BALL.x = nx; BALL.y = ny;
  BALL.vz -= 30 * dt; BALL.z += BALL.vz * dt;
  if (BALL.z <= 0) { BALL.z = 0; BALL.vz = 7; const d = dist(BALL.x, BALL.y, P.x, P.y); if (d < 14) noise(.06, .14 * (1 - d / 14), 'lowpass', 180, 1); }
  if (!P.hidden && P.inv <= 0 && !G.lock && BALL.z < .6 && dist(BALL.x, BALL.y, P.x, P.y) < .45) {
    damage(1); sfx.hurt(); shake = 6; P.inv = 1.8; addNoise(P.x, P.y, 9); BALL.vx *= -1.5; BALL.vy *= -1.5;
    toast(_L('球砸在身上……好重。不是籃球的重量。'));
  }
}
/* ---------- 沒有頭的學生：拿走器材室鑰匙後，在體育館裡追人 ---------- */
function hlUpdate(dt) {
  HL.moving = false;
  if (HL.state !== 'chase' || stunned(HL)) return;
  if (!inGym(P.x, P.y)) { if (walker(HL, 52.5, 15.6, 1.2, dt)) HL.dir = 4; return; }   // 他不會離開體育館
  if (P.hidden && !HL.sawHide) { walker(HL, BALL.x, BALL.y, 1.4, dt); return; }       // 跟丟了：去找他的頭
  walker(HL, P.x, P.y, 2.35, dt);
  if (!P.hidden && P.inv <= 0 && !G.lock && dist(HL.x, HL.y, P.x, P.y) < .6) hlHit();
  if (P.hidden && HL.sawHide && dist(HL.x, HL.y, P.x, P.y) < 1.2) { unhide(); hlHit(); }
}
async function hlHit() {
  damage(1); sfx.sting(); shake = 10; P.inv = 2.2; setPose('hurt', .8);
  const [fx, fy] = DIRV[HL.dir]; moveEnt(P, fx * 1.2, fy * 1.2); HL.stunT = G.t + 1.5;
  toast(_L('冰冷的手在妳的臉上摸來摸去……像是在確認那是不是他的頭。'));
}
/* ---------- 泳池的手：看到漣漪就退開 ---------- */
function spawnHand(atKey) {
  let best = null, bd = 9;
  for (let y = POOL.y0; y <= POOL.y1; y++) for (let x = POOL.x0; x <= POOL.x1; x++) {
    if (!(x === POOL.x0 || x === POOL.x1 || y === POOL.y0 || y === POOL.y1)) continue;
    const d = dist(x + .5, y + .5, P.x, P.y) + (atKey ? 0 : Math.random() * .8); if (d < bd) { bd = d; best = [x + .5, y + .5]; }
  }
  if (best && bd < 2.6) HANDS.push({ x: best[0], y: best[1], t0: G.t });
}
function handsUpdate(dt) {
  for (let i = HANDS.length - 1; i >= 0; i--) {
    const h = HANDS[i], age = G.t - h.t0;
    if (age > .8 && age < 1.6 && !G.lock && P.inv <= 0 && dist(h.x, h.y, P.x, P.y) < 1.15) { damage(1); sfx.hurt(); shake = 8; P.inv = 1.6; P.stun = G.t + .8; toast(_L('水裡伸出的手抓住了腳踝！')); }
    if (age > 2) HANDS.splice(i, 1);
  }
  const nearPool = P.x > POOL.x0 - 2 && P.x < POOL.x1 + 3 && P.y > POOL.y0 - 2 && P.y < POOL.y1 + 3;
  G.handT = (G.handT || 0) - dt;
  if (nearPool && G.handT <= 0) { G.handT = 2.2 + Math.random() * 1.5; spawnHand(false); }
}

/* ---------- 掛勾 ---------- */
{ const _a = sceneAction; sceneAction = async function (o) {
    if (G.scene === 1 && ['gymboard', 'stagekey', 'net', 'poolnote', 'fish'].includes(o.act)) { await gymAction(o); return true; }
    return _a(o); }; }
{ const _u = sceneUpdate; sceneUpdate = function (dt) { _u(dt); if (G.scene !== 1 || G.mode !== 'play') return; ballUpdate(dt); hlUpdate(dt); handsUpdate(dt);
    const sl = LIGHTS.find(l => l.id === 'stageL'); if (sl) sl.r = G.flags.gymkey ? (Math.random() < .05 ? 2 : .2) : 2.2; }; }
{ const _s = sceneSprites; sceneSprites = function (list) {
    _s(list); if (G.scene !== 1) return;
    list.push({ d: BALL.x + BALL.y, f: () => { const [cx, cy] = iso(BALL.x, BALL.y); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(cx, cy, 4, 2, 0, 0, 7); ctx.fill();
      const by = cy - 5 - BALL.z * 10; ctx.fillStyle = '#c0602a'; ctx.beginPath(); ctx.arc(cx, by, 4, 0, 7); ctx.fill(); ctx.strokeStyle = '#3a1a0a'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(cx - 4, by); ctx.lineTo(cx + 4, by); ctx.moveTo(cx, by - 4); ctx.lineTo(cx, by + 4); ctx.stroke(); } });
    if (HL.state !== 'off' && IMG.passenger2) list.push({ d: HL.x + HL.y, f: () => drawSprite(IMG.passenger2, HL.x, HL.y, HL.dir, HL.moving ? HL.frame : 0, { alpha: stunned(HL) ? .5 : .9, lean: .1, tint: 'rgba(60,70,110,.55)' }) });
    for (const h of HANDS) list.push({ d: h.x + h.y, f: () => { const age = G.t - h.t0, [cx, cy] = iso(h.x, h.y);
      ctx.strokeStyle = `rgba(180,220,240,${Math.max(0, .6 - age * .25)})`; ctx.lineWidth = 1; for (const r of [4, 8, 12]) { ctx.beginPath(); ctx.ellipse(cx, cy, r * (1 + age * .3), r * .5 * (1 + age * .3), 0, 0, 7); ctx.stroke(); }
      if (age > .8 && age < 1.8) { const up = Math.min(1, (age - .8) * 4) * 14; ctx.fillStyle = '#d8dcd8'; ctx.fillRect(cx - 1.5, cy - up, 3, up); ctx.fillRect(cx - 3, cy - up - 2, 6, 3); ctx.fillStyle = '#b8bcb8'; for (let k = -3; k <= 3; k += 1.5) ctx.fillRect(cx + k, cy - up - 5, 1, 3); } } });
  }; }
{ const _d = sceneDrawObj; sceneDrawObj = function (o, cx, cy, shaking) {
    if (G.scene !== 1) return _d(o, cx, cy, shaking);
    const { x, y } = o;
    switch (o.t) {
      case 'stage': box(x, y, 1, 1, 12, '#6a4a2e', '#4a3220', '#3e2a1a'); if (o.act) { ctx.fillStyle = '#7a1e22'; ctx.fillRect(cx - 9, cy - 46, 4, 34); if (!G.flags.gymkey) { ctx.fillStyle = '#d8c070'; ctx.fillRect(cx - 8, cy - 22, 3, 4); } } else if (x % 3 === 0) { ctx.fillStyle = '#6a1a1e'; ctx.fillRect(cx - 2, cy - 46, 5, 34); } return true;
      case 'hoop': ctx.fillStyle = '#5a5a5e'; ctx.fillRect(cx - 1, cy - 50, 2, 50); ctx.fillStyle = '#e8e8e0'; ctx.fillRect(cx - 8, cy - 58, 16, 10); ctx.strokeStyle = '#d0502a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, cy - 47, 5, 2, 0, 0, 7); ctx.stroke(); return true;
      case 'vault': box(x + .1, y + .2, .8, .6, 16 + shaking, '#c8a070', '#9a7650', '#86663f'); box(x + .1, y + .2, .8, .6, 4, '#e8e0d0', null, null, 16 + shaking); return true;
      case 'gymnote': ctx.fillStyle = '#7a6a4a'; ctx.fillRect(cx + 2, cy - 40, 2, 32); if (!G.inv.net) { ctx.strokeStyle = '#4a8a6a'; ctx.beginPath(); ctx.ellipse(cx + 3, cy - 42, 5, 3, 0, 0, 7); ctx.stroke(); } return true;
      case 'gymboard': faceRect(x, y, 'L', .15, .85, 14, 30, '#c8b890'); return true;
      case 'poolkey': if (!G.flags.poolKey) { const on = Math.sin(G.t * 3) > 0; ctx.fillStyle = on ? 'rgba(220,240,255,.9)' : 'rgba(180,210,230,.5)'; ctx.fillRect(cx - 1, cy - 12, 3, 2); } return true;
      case 'poolbench': box(x + .1, y + .35, .8, .3, 8, '#7a6a5a', '#5a4a3a', '#4a3a2e'); ctx.fillStyle = '#2a3a6a'; ctx.fillRect(cx - 4, cy - 11, 8, 3); return true;
    }
    return _d(o, cx, cy, shaking);
  }; }
{ const _h = sceneHUD; sceneHUD = function (s) { _h(s); if (G.scene !== 1) return; if (G.inv.gymkey) s.push(_L`<div class="s">器材室鑰匙</div>`); if (G.inv.net && !G.flags.poolKey) s.push(_L`<div class="s">撈網${G.flags.fish ? ` ${G.flags.fish}/3` : ''}</div>`); }; }
{ const _th = threats; threats = function () { const t = _th(); if (G.scene === 1 && HL.state === 'chase' && inGym(P.x, P.y)) t.push({ e: HL, chase: true, stun: s => { HL.stunT = G.t + s; } }); return t; }; }
{ const _hd = hide; hide = function (o) { if (G.scene === 1) HL.sawHide = HL.state === 'chase' && dist(HL.x, HL.y, P.x, P.y) < 2.5; return _hd(o); }; }
{ const _o = sceneOnLoad; sceneOnLoad = function (cp) { _o(cp); if (G.scene === 1) gymReset(); }; }
function gymReset() {
  Object.assign(BALL, { x: 52.5, y: 19.5, vx: 1.2, vy: .8, chase: 0 }); HANDS.length = 0;
  Object.assign(HL, { x: 52.5, y: 15.6, state: G.flags.gymkey && !G.inv.net ? 'chase' : G.flags.gymkey ? 'chase' : 'off', path: null, stunT: 0 });
  for (const o of OBJ) if (o.act === 'fish' && G.flags.poolKey) o.act = null;
}
{ const _r = resetWorld; resetWorld = function () { const r = _r(); gymReset(); return r; }; }
TRIG.push(
  { scene: 1, id: 'gymIn', when: () => inGym(P.x, P.y), run: async () => { await says([_L('體育館。天花板很高，月光從高窗照進來。'), _L('「咚……咚……咚……」'), _L('……球場正中央，一顆籃球在自己彈跳。'), _L('（不要發出聲音。它好像會往有聲音的地方滾過來。）')]); } },
  { scene: 1, id: 'poolIn', when: () => P.y > 27 && P.x > 44 && P.x < 61, run: async () => { await says([_L('游泳池。水是黑的，看不到底。'), _L('池底有一個小小的、亮亮的東西。'), _L('水面靜靜的……可是靠近池邊的時候，好像有什麼在下面跟著。')]); } },
);
LORE.push(
  ['ball', _L('半夜的運球聲'), _L('體育館裡，一顆籃球自己在彈跳。'), _L('它會往有聲音的地方滾過來。被砸到的話……那不是籃球的重量。'), () => G.flags.gymkey],
  ['pool', _L('游泳池的手'), _L('黑色的池水裡，伸出好幾隻白色的手。'), _L('水面起漣漪的地方，就是它們要伸出來的地方。'), () => G.flags.fish],
);
// 測試：第一章流程裡，拿鑰匙改走體育館路線（runTest flow 會呼叫）
async function testGymRoute() {
  const tp = (x, y) => { P.x = x; P.y = y; };
  const inv0 = P.inv; P.inv = 9999; GH.active = false;
  tp(52.5, 15.4); P.dir = 0; await interact(); await waitFree();
  if (!G.inv.gymkey) throw 'gymkey';
  tp(56.4, 23.5); P.dir = 2; await interact(); await waitFree();
  if (DOORS['57,23'].locked) throw 'gym door';
  tp(59.5, 24.4); P.dir = 0; await interact(); await waitFree();
  if (!G.inv.net) throw 'net';
  HL.state = 'off';
  tp(52.5, 35.4); P.dir = 0; for (let k = 0; k < 4 && !G.inv.key; k++) { await interact(); await waitFree(); }
  if (!G.inv.key) throw 'pool key';
  P.inv = inv0;
}
