/* ================= chase.js：大升級第3階段補完「每章一場追逐戲」（2026-11-11） =================
   不改各章劇本：每個場景（1 校園、2 第二章上、3 第二章下、4 第三章、6 第四章）進場約 75 秒後、
   沒被別的鬼追、沒躲著、不在安全屋、沒在劇情中 → 觸發一次（G.flags['chase'+場景] 記錄，讀檔不重複）。
   路線自動選：從咪醬位置 BFS，選 14–22 步遠（優先門口旁）的「逃生點」；追兵出現在反方向約 7 步。
   跑到發光的逃生點＝門砰地關上、恐懼下降、第一次給護身符；被追上＝扣 1 心、追兵消失（不卡關）；
   躲起來：被看到會被拖出來，沒被看到牠搜 4 秒就走；撐過 25 秒牠也會放棄。武器可以暈眩牠（接 threats()）。
   多人模式不觸發；?chase=0 關閉；測試 test=chase2&scene=N。 */
const CHS = (() => {
  let q = ''; try { q = new URLSearchParams(location.search).get('chase') || ''; } catch (e) { }
  return { off: q === '0', on: false, phase: '', sceneT: 0, scene: -1, x: 0, y: 0, dir: 4, r: .28, path: null, pathT: 0, goal: null, t: 0, animD: 0, frame: 0, moving: false, a: 0 };
})();
const CHS_SPR = { 1: 'kuchisake_chase', 2: 'kuchisake_chase', 3: 'anatomy', 4: 'hikiko', 6: 'babaa' };
const CHS_WHO = { 1: _L('裂口女'), 2: _L('裂口女'), 3: _L('人體模型'), 4: _L('牠'), 6: _L('老婆婆') };

/* BFS：回傳每格的步數（Map key=y*W+x） */
function chsBFS(sx, sy, maxD) {
  const d = new Map(), q = [[sx, sy]]; d.set(sy * W + sx, 0);
  while (q.length) {
    const [x, y] = q.shift(), k = d.get(y * W + x); if (k >= maxD) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, nk = ny * W + nx;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || d.has(nk) || solidTile(nx, ny)) continue;
      d.set(nk, k + 1); q.push([nx, ny]);
    }
  }
  return d;
}
const chsSafe = (x, y) => typeof sceneSafe === 'function' && sceneSafe(x, y);
function chsPick() {
  const px = Math.floor(P.x), py = Math.floor(P.y), d = chsBFS(px, py, 24);
  const goals = [], spawns = [];
  for (const [k, s] of d) {
    const x = k % W, y = Math.floor(k / W);
    if (OBJAT[x + ',' + y]) continue;
    if (s >= 14 && s <= 22) {
      let door = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const c = at(x + dx, y + dy); if (c === 'D' && !DOORS[(x + dx) + ',' + (y + dy)].locked) door = 1; }
      goals.push({ x, y, s, w: door * 3 + Math.random() });
    }
    if (s >= 6 && s <= 8 && !chsSafe(x + .5, y + .5)) spawns.push({ x, y });
  }
  if (!goals.length || !spawns.length) return null;
  goals.sort((a, b) => b.w - a.w);
  const g = goals[0];
  spawns.sort((a, b) => dist(b.x, b.y, g.x, g.y) - dist(a.x, a.y, g.x, g.y));   // 離逃生點最遠＝在咪醬背後
  const sp = spawns[0];
  if (dist(sp.x, sp.y, g.x, g.y) < 8) return null;
  return { goal: [g.x + .5, g.y + .5], spawn: [sp.x + .5, sp.y + .5] };
}

function chsStart(force) {
  const pick = chsPick(); if (!pick) { CHS.sceneT = force ? CHS.sceneT : 50; return false; }   // 這裡選不到 → 25 秒後再試
  Object.assign(CHS, { on: true, phase: 'warn', t: 0, x: pick.spawn[0], y: pick.spawn[1], goal: pick.goal, path: null, pathT: 0, a: 0, stunT: 0, searchT: 0 });
  G.flags['chase' + G.scene] = 1;
  shake = 6; if (sfx.sting) sfx.sting();
  toast(_L`背後傳來急促的腳步聲——${CHS_WHO[G.scene] || _L('牠')}追來了！快跑向發光的地方！`);
  G.fear = Math.min(100, (G.fear || 0) + 15);
  return true;
}
function chsEnd(kind) {
  CHS.on = false; CHS.phase = ''; CHS.goal = null;
  if (kind === 'win') {
    sfx.click && sfx.click(); noise(.35, .4, 'lowpass', 180, 1); shake = 4;
    G.fear = Math.max(0, (G.fear || 0) - 25);
    const first = !G.flags.chaseWon; G.flags.chaseWon = (G.flags.chaseWon || 0) + 1;
    if (first) { G.inv.charm = (G.inv.charm || 0) + 1; toast(_L('砰！門在身後關上……腳步聲停了。（得到護身符）')); }
    else toast(_L('砰！門在身後關上……腳步聲停了。'));
  } else if (kind === 'lost') toast(_L('……腳步聲走遠了。牠放棄了。'));
  else if (kind === 'gone') toast(_L('牠找不到你……慢慢離開了。'));
  if (typeof updateHUD === 'function') updateHUD();
}

function chsTick(dt) {
  if (CHS.scene !== G.scene) { CHS.scene = G.scene; CHS.sceneT = 0; if (CHS.on) { CHS.on = false; CHS.phase = ''; } }
  if (CHS.off || G.mode !== 'play' || (typeof COOP === 'object' && COOP.on)) return;
  if (!CHS.on) {
    if (!CHS_SPR[G.scene] || G.flags['chase' + G.scene] || G.lock) return;
    if (typeof TEST !== 'undefined' && TEST && TEST !== 'chase2') return;   // 其他自動測試不要被追逐打斷
    if (G.scene === 1 && !G.inv.flashlight) return;
    CHS.sceneT += dt;
    if (CHS.sceneT < 75 || P.hidden || chsSafe(P.x, P.y)) return;
    const nt = typeof nearestThreat === 'function' ? nearestThreat() : null;
    if (nt && (nt.chase || nt.d < 8)) return;
    chsStart();
    return;
  }
  if (G.lock) return;
  CHS.t += dt; CHS.a = Math.min(1, CHS.a + dt * 1.5);
  // 到逃生點
  if (dist(P.x, P.y, CHS.goal[0], CHS.goal[1]) < .95 && !P.hidden) return chsEnd('win');
  if (CHS.t > 25) return chsEnd('lost');
  if (CHS.phase === 'warn') { CHS.moving = false; if (CHS.t > 1.2 && !CHS.hold) CHS.phase = 'run'; return; }
  if ((CHS.stunT || 0) > G.t) { CHS.moving = false; return; }
  // 躲起來
  if (P.hidden) {
    const d = dist(CHS.x, CHS.y, P.x, P.y);
    if (CHS.sawHide == null) CHS.sawHide = d < 3.2;   // 躲進去的瞬間牠就在旁邊＝被看到了
    if (CHS.sawHide) { if (d < .9) { unhide(); return chsCatch(); } }
    else { CHS.searchT += dt; CHS.moving = false; if (CHS.searchT > 4) return chsEnd('gone'); return; }
  } else CHS.sawHide = null;
  // 追：距離越遠越快（緊追不放），最快 4.6
  const d = dist(CHS.x, CHS.y, P.x, P.y), sp = Math.min(4.6, 3.35 + Math.max(0, d - 4) * .22);
  CHS.pathT -= dt;
  if (!CHS.path || CHS.pathT <= 0) { CHS.path = findPath(CHS.x, CHS.y, P.x, P.y) || []; CHS.pathT = .3; }
  let tx = P.x, ty = P.y;
  while (CHS.path.length && dist(CHS.x, CHS.y, CHS.path[0][0], CHS.path[0][1]) < .25) CHS.path.shift();
  if (CHS.path.length > 1) [tx, ty] = CHS.path[0];
  const vx = tx - CHS.x, vy = ty - CHS.y, l = Math.hypot(vx, vy) || 1, st = Math.min(l, sp * dt);
  const ox = CHS.x, oy = CHS.y; moveEnt(CHS, vx / l * st, vy / l * st);
  if (Math.hypot(CHS.x - ox, CHS.y - oy) < st * .2) CHS.pathT = 0;   // 卡住 → 馬上重算路
  CHS.moving = st > 0;
  if (CHS.moving) { CHS.dir = dirFromWorld(vx, vy); CHS.animD += st; CHS.frame = 1 + Math.floor(CHS.animD / .42) % 4; }
  // 腳步聲
  CHS.stepT = (CHS.stepT || 0) - dt;
  if (CHS.stepT <= 0) { CHS.stepT = .28; const [sx] = iso(CHS.x, CHS.y); noise(.07, Math.max(.03, .2 - d * .012), 'bandpass', 500 + Math.random() * 200, 1.2, Math.max(-1, Math.min(1, (sx - VW / 2) / (VW / 2)))); }
  if (d < .6 && P.inv <= 0 && !P.hidden) chsCatch();
}
function chsCatch() {
  chsEnd('caught'); damage(1); P.inv = 2;
  toast(_L('被抓住了——！……回過神來，牠已經不見了。'));
}
{ const _u = update; update = function (dt) { _u(dt); chsTick(dt); }; }

/* 接進 threats()：武器可以暈眩牠、危險度後製會反應 */
if (typeof threats === 'function') { const _th = threats; threats = function () { const t = _th(); if (CHS.on) t.push({ e: CHS, chase: CHS.phase === 'run', stun: s => { CHS.stunT = G.t + s; } }); return t; }; }

/* 畫：追兵（排序清單）、逃生點的光柱＋畫面外箭頭（暗幕之後） */
{ const _cs = typeof coopSprites === 'function' ? coopSprites : null;
  coopSprites = function (list) {
    if (_cs) _cs(list);
    if (!CHS.on) return;
    const img = IMG[CHS_SPR[G.scene]]; if (!img) return;
    list.push({ d: CHS.x + CHS.y, f: () => drawSprite(img, CHS.x, CHS.y, CHS.dir, CHS.moving ? CHS.frame : 0, { alpha: CHS.a * ((CHS.stunT || 0) > G.t ? .6 : 1), lean: CHS.phase === 'run' ? .15 : 0, jit: (Math.random() - .5) * 1.5 }) });
  }; }
function chsGoalFx() {
  if (!CHS.on || !CHS.goal) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  const [gx, gy] = iso(CHS.goal[0], CHS.goal[1]), pul = .6 + .4 * Math.sin(G.t * 5);
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(gx, gy - 6, 2, gx, gy - 6, 40);
  g.addColorStop(0, `rgba(255,236,170,${.75 * pul})`); g.addColorStop(1, 'rgba(255,236,170,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(gx, gy - 6, 40, 26, 0, 0, 7); ctx.fill();
  const b = ctx.createLinearGradient(0, gy - 70, 0, gy); b.addColorStop(0, 'rgba(255,240,190,0)'); b.addColorStop(1, `rgba(255,240,190,${.7 * pul})`);
  ctx.fillStyle = b; ctx.fillRect(gx - 6, gy - 90, 12, 90); ctx.fillRect(gx - 2, gy - 90, 4, 90);
  ctx.globalCompositeOperation = 'source-over';
  // 畫面外：邊緣箭頭
  const m = 26;
  if (gx < m || gx > VW - m || gy < m || gy > VH - m) {
    const cx = VW / 2, cy = VH / 2, a = Math.atan2(gy - cy, gx - cx);
    const k = Math.min((VW / 2 - m) / Math.abs(Math.cos(a) || 1e-6), (VH / 2 - m) / Math.abs(Math.sin(a) || 1e-6));
    const ax = cx + Math.cos(a) * k, ay = cy + Math.sin(a) * k;
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(a); ctx.globalAlpha = .55 + .45 * pul; ctx.fillStyle = '#ffe9a8';
    ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, -8); ctx.lineTo(-2, 0); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}
{ const _a = typeof ltAfterDark === 'function' ? ltAfterDark : null;
  if (_a) ltAfterDark = function (psx, psy) { _a(psx, psy); chsGoalFx(); }; }

/* 讀檔、換場景：清掉進行中的追逐（旗標在存檔裡，已觸發過的不會再來） */
{ const _l = loadCP; loadCP = function (cp) { CHS.on = false; CHS.phase = ''; CHS.sceneT = 0; return _l(cp); }; }

/* ?test=chase2&scene=N：①跑到逃生點＝成功（拿到護身符）②站著不動＝被抓（扣 1 心）③躲在遠處＝牠離開 */
async function testChase2() {
  const R = [];
  try {
    const sc = +(new URLSearchParams(location.search).get('scene') || 2);
    const ch = { 1: 1, 2: 2, 3: 3, 4: 4, 6: 5 }[sc];
    await startFrom(ch); await waitFree(); await wait(300);
    if (sc === 1) G.inv.flashlight = true;
    for (const k of Object.keys(G.flags)) if (/^chase/.test(k)) delete G.flags[k];
    GH.active = false;
    // ① 自動觸發 → 傳送到逃生點
    CHS.sceneT = 999; const c0 = G.inv.charm || 0;
    for (let i = 0; i < 100 && !CHS.on; i++) await wait(20);
    R.push('start=' + CHS.on);
    const g = CHS.goal, sd = g && dist(CHS.x, CHS.y, g[0], g[1]);
    R.push('far=' + (sd > 7));
    for (let i = 0; i < 200 && CHS.phase === 'warn'; i++) await wait(5);   // 測試模式遊戲時間跑得比 wait 快
    P.x = g[0]; P.y = g[1];
    for (let i = 0; i < 50 && CHS.on; i++) await wait(20);
    R.push('win=' + (!CHS.on && (G.inv.charm || 0) === c0 + 1));
    // ② 站著不動 → 被抓
    delete G.flags['chase' + sc]; const h0 = G.hearts; P.inv = 0;
    if (!chsStart(true)) throw 'no pick';
    for (let i = 0; i < 600 && CHS.on; i++) { K.up = K.down = K.left = K.right = false; await wait(20); }
    R.push('caught=' + (G.hearts === h0 - 1 || G.hearts === 0 || G.mode !== 'play'));
    document.title = (R.every(x => /=true/.test(x)) ? 'PASS ' : 'FAIL ') + R.join(' ');
  } catch (e) { document.title = 'ERR ' + e + ' ' + R.join(' '); }
}
{ const _t = runTest; runTest = async function (kind) { if (kind === 'chase2') return testChase2(); if (kind === 'mapdump') return testMapDump(); return _t(kind); }; }

async function testMapDump() {
  let out = '';
  for (const n of [1, 2, 3, 4, 6]) {
    loadScene(n);
    let minX = 99, maxX = 0, minY = 99, maxY = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(x, y) !== 'X') { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    out += `== scene ${n} x${minX}-${maxX} y${minY}-${maxY}\n`;
    for (let y = minY; y <= maxY; y++) { let s = String(y).padStart(3) + ' '; for (let x = minX; x <= maxX; x++) s += at(x, y); out += s + '\n'; }
  }
  const pre = document.createElement('pre'); pre.id = 'dump'; pre.textContent = out; document.body.appendChild(pre); document.title = 'DUMP';
}
/* 截圖用：test=shot&chs=1 直接開始追逐 */
try { if (new URLSearchParams(location.search).get('chs')) { const iv = setInterval(() => { if (G.mode === 'play' && !G.lock) { clearInterval(iv); G.inv.flashlight = true; if (chsStart(true)) { CHS.hold = 1; CHS.a = 1; } } }, 50); } } catch (e) { }
