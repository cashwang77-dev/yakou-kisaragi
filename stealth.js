/* ================= stealth.js：大升級第2階段「潛行」（2026-11-11） =================
   ① 腳步聲：跑步（室內 6 格／室外 4.5 格）、走路（室內 2 格／室外 1.2 格）會發出鬼聽得到的噪音；蹲著走沒有聲音。
      發出聲音時腳下出現擴散的聲波圈（讓玩家知道自己被聽見了）。
   ② 鬼會檢查躲藏點：裂口女搜索（search）時，會走到 3.5 格內的躲藏點前查看約 2 秒。
      你躲在那裡就必須全程憋氣（沿用 systems.js 的憋氣條）；鬆開就被拖出來。查過的點 25 秒內不再查。
   ③ 幻覺：恐懼 >70 時，視野邊緣偶爾出現黑影＋耳語，用手電筒照到或靠近就消失。
   多人模式（COOP.on）不啟用②③（隊友的躲藏狀態不在本機）。?stealth=0 全關。 */
const ST = (() => {
  let q = ''; try { q = new URLSearchParams(location.search).get('stealth') || ''; } catch (e) { }
  return { on: q !== '0', lx: null, ly: null, acc: 0, rings: [], hint: 0, hallu: null, halluT: 20, chk: {} };
})();
const stCoop = () => typeof COOP === 'object' && COOP.on;

function stTick(dt) {
  if (!ST.on || G.mode !== 'play') { ST.lx = P.x; ST.ly = P.y; return; }
  // ① 腳步聲
  if (ST.lx != null && !P.hidden) {
    const m = Math.hypot(P.x - ST.lx, P.y - ST.ly);
    if (m > 0 && m < 1) {
      ST.acc += m;
      const running = K.run && !P.tired && !P.crouch, ins = isInside(P.x, P.y);
      const stride = running ? 1.1 : 1.6;
      if (ST.acc >= stride) {
        ST.acc = 0;
        if (!P.crouch) {
          const r = running ? (ins ? 6 : 4.5) : (ins ? 2 : 1.2);
          addNoise(P.x, P.y, r); ST.rings.push({ x: P.x, y: P.y, r, t: 0 }); ST.made = (ST.made || 0) + 1;
          if (running && !ST.hint && GH.active) { ST.hint = 1; toast(isTouch ? _L('跑步的腳步聲會把牠引過來……放開「跑」改用走的') : _L('跑步的腳步聲會把牠引過來……放開 Shift 改用走的，蹲下（C）更安靜')); }
        }
      }
    }
  }
  ST.lx = P.x; ST.ly = P.y;
  for (let i = ST.rings.length - 1; i >= 0; i--) { ST.rings[i].t += dt; if (ST.rings[i].t > .7) ST.rings.splice(i, 1); }
  if (stCoop()) return;
  // ② 鬼檢查躲藏點
  if (GH.active && GH.state === 'search' && !GH.chk) {
    const cand = OBJ.filter(o => HIDE[o.t] && !(ST.chk[o.x + ',' + o.y] > G.t) && dist(o.x + .5, o.y + .5, GH.x, GH.y) < 3.5)
      .sort((a, b) => (b === P.hidden) - (a === P.hidden) || dist(a.x, a.y, GH.x, GH.y) - dist(b.x, b.y, GH.x, GH.y));
    const o = cand[0];
    if (o && Math.random() < (o === P.hidden ? 1.2 : .5) * dt) { GH.chk = { o, t: 0, phase: 'go' }; GH.state = 'checkHide'; GH.path = null; }
  }
  if (GH.state === 'checkHide' && GH.chk) {
    const c = GH.chk, o = c.o, mine = P.hidden === o;
    if (c.phase === 'go') {
      if (walkTo(o.x + .5, o.y + .5, 1.7, dt) || dist(GH.x, GH.y, o.x + .5, o.y + .5) < 1.15) {
        c.phase = 'look'; c.t = 0; GH.moving = false; sfx.click();
        if (mine) { toast(_L('牠停在你躲的地方前面……憋住氣，別出聲！')); shake = 3; }
      }
    } else {
      c.t += dt;
      if (mine && (ST.noHold || !FEAR.holding) && c.t > .35) {   // 給玩家 0.35 秒反應
        GH.chk = null; ST.chk[o.x + ',' + o.y] = G.t + 25;
        toast(_L('……找到你了。')); unhide(); catchPlayer(true); return;
      }
      if (c.t > 2) {
        ST.chk[o.x + ',' + o.y] = G.t + 25; GH.chk = null; GH.state = 'search'; GH.searchT = 1.5;
        if (mine) { toast(_L('……腳步聲走遠了。')); G.fear = Math.max(0, (G.fear || 0) - 10); }
      }
    }
  } else if (GH.chk && GH.state !== 'checkHide') GH.chk = null;   // 被聲音或看到玩家打斷
  // ③ 幻覺
  const f = G.fear || 0;
  if (ST.hallu) {
    const h = ST.hallu; h.t += dt;
    const [hx, hy] = iso(h.x, h.y), [px, py] = iso(P.x, P.y);
    const lit = P.light && (() => { const [fx, fy] = SCR[P.dir], a = Math.atan2(fy * .55, fx), b = Math.atan2(hy - py, hx - px); let d = Math.abs(a - b); if (d > Math.PI) d = 2 * Math.PI - d; return d < .45 && Math.hypot(hx - px, hy - py) < 200; })();
    if (lit || h.t > 2.4 || dist(h.x, h.y, P.x, P.y) < 2.5) { if (lit && !h.gone) { h.gone = 1; noise(.25, .05, 'highpass', 3000, 1); } ST.hallu = null; }
  } else if (f > 70 && !P.hidden && (ST.halluT -= dt) <= 0) {
    ST.halluT = 9 + Math.random() * 10;
    for (let k = 0; k < 12; k++) {
      const a = Math.random() * 7, r = 4.5 + Math.random() * 2.5, x = P.x + Math.cos(a) * r, y = P.y + Math.sin(a) * r, c = at(Math.floor(x), Math.floor(y));
      if (c === '#' || c === 'P' || c === 'X' || c === 'f') continue;
      ST.hallu = { x, y, t: 0, dir: Math.floor(Math.random() * 8) };
      const [sx] = iso(x, y); noise(1.2, .035, 'bandpass', 1800 + Math.random() * 600, 3, (sx - VW / 2) / (VW / 2));   // 耳語
      break;
    }
  }
}
{ const _u = update; update = function (dt) { _u(dt); stTick(dt); }; }

/* 畫：聲波圈、幻覺黑影（插進 render 的排序清單） */
function stSprites(list) {
  if (!ST.on) return;
  for (const r of ST.rings) list.push({ d: r.x + r.y - .5, f: () => {
    const [sx, sy] = iso(r.x, r.y), k = r.t / .7, rr = 4 + k * r.r * 9;
    ctx.strokeStyle = `rgba(220,230,255,${.28 * (1 - k)})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(sx, sy, rr, rr * .5, 0, 0, 7); ctx.stroke();
  } });
  const h = ST.hallu;
  if (h && IMG.kuchisake) list.push({ d: h.x + h.y, f: () => {
    const a = Math.sin(Math.min(1, h.t / 2.4) * Math.PI) * .5;
    drawSprite(IMG.kuchisake, h.x, h.y, h.dir, { tint: 'rgba(0,0,0,1)', alpha: a, noShadow: true, jit: (Math.random() - .5) * 2 });
  } });
}
{ const _cs = typeof coopSprites === 'function' ? coopSprites : null; coopSprites = function (list) { if (_cs) _cs(list); stSprites(list); }; }

/* 讀檔、換場景時清掉狀態 */
{ const _l = loadCP; loadCP = function (cp) { ST.rings.length = 0; ST.hallu = null; ST.chk = {}; GH.chk = null; return _l(cp); }; }

/* ?test=stealth：跑步會引鬼調查；躲著憋氣能撐過檢查；不憋氣會被抓 */
async function testStealth() {
  const R = [];
  try {
    const tp = (x, y) => { P.x = x; P.y = y; };
    await startFrom(1); await waitFree(); await wait(300);
    const o = OBJ.find(q => q.t === 'locker' || q.t === 'cabinet' || q.t === 'box' || q.t === 'trash');
    if (!o) throw 'no hide obj';
    // ① 跑步噪音
    ST.made = 0; tp(o.x + 3.5, o.y + .5); K.run = true; P.tired = false; P.crouch = false; const x0 = P.x;
    for (let i = 0; i < 40; i++) { P.x = x0 + i * .05; await wait(16); }
    K.run = false; R.push('noise=' + (ST.made > 0));
    // ② 憋氣撐過檢查
    tp(o.x + .5, o.y + 1.5); hide(o); spawnGhost(o.x + .5, o.y + 2.5); GH.state = 'checkHide'; GH.chk = { o, t: 0, phase: 'look' }; GH.timer = 99;
    const t0 = G.t; while (G.t - t0 < 2.6 && P.hidden) await wait(20);
    R.push('survive=' + (P.hidden === o && G.mode === 'play'));
    // ③ 不憋氣 → 被抓（測試模式預設會自動憋氣，用 ST.noHold 模擬沒憋氣）
    ST.noHold = true; K.run = false;
    ST.chk = {}; GH.state = 'checkHide'; GH.chk = { o, t: 0, phase: 'look' };
    const t1 = G.t; while (G.t - t1 < 1.5 && P.hidden) await wait(20);
    ST.noHold = false; R.push('caught=' + (!P.hidden));
    document.title = (R.every(x => /=true/.test(x)) ? 'PASS ' : 'FAIL ') + R.join(' ');
  } catch (e) { document.title = 'ERR ' + e + ' ' + R.join(' '); }
}
{ const _t = runTest; runTest = async function (kind) { if (kind === 'stealth') return testStealth(); return _t(kind); }; }
