/* 夜校・如月　第二章（上）擴充：美術室（2026-10-23，故事延長）
   鑰匙串上少了圖書室那一把（名牌：借・美術社）→ 走廊往東 → 美術室：
   「回頭的石膏像」：背對它的時候，它會一格一格轉過來；完全轉過來就會尖叫（把走廊的裂口女引來）。用手電筒照著，它會慢慢轉回去。
   「畫中的少女」：畫架上的女孩手裡拿著鑰匙。用手機閃光拍下來，才看得出鑰匙藏在畫框背面 → 拿走後，畫裡的人不見了，三尊石膏像同時尖叫。
   載入順序：最後。 */

const ART = { x0: 42, y0: 6, x1: 56, y1: 16 };
const inArt = (x, y) => x >= ART.x0 && x <= ART.x1 && y >= ART.y0 && y <= ART.y1;
const BUSTS = [[44, 7], [50, 7], [55, 12]].map(([x, y]) => ({ x, y, turn: 0, t: 0 }));   // turn 0＝背對，3＝正對（尖叫）

function buildArt() {
  fill(38, 10, 40, 12, ':'); for (let x = 38; x <= 41; x++) { if (at(x, 9) === 'X') put(x, 9, '#'); if (at(x, 13) === 'X') put(x, 13, '#'); }
  put(37, 10, ':'); put(37, 11, ':'); put(37, 12, ':');
  for (let y = ART.y0 - 1; y <= ART.y1 + 1; y++) for (let x = ART.x0 - 1; x <= ART.x1 + 1; x++) if (at(x, y) === 'X' || at(x, y) === ':') put(x, y, '#');
  fill(ART.x0, ART.y0, ART.x1, ART.y1, '_');
  door(41, 11, { sign: _L('美術室') });
  BUSTS.forEach((b, i) => obj('bust', b.x, b.y, { i }));
  obj('easel', 49, 12, { g2: 1, act: 'painting', label: _L('畫架上的畫') });
  for (const [x, y] of [[45, 10], [47, 10], [45, 14], [47, 14], [52, 10]]) obj('arttable', x, y);
  for (const x of [43, 54]) obj('shelf', x, 6);
  obj('cabinet', 56, 15); obj('artnote', 43, 16, { g2: 1, act: 'artnote', label: _L('看黑板上的字') });
  LIGHTS.push({ x: 49.5, y: 12.2, r: 2, c: '255,214,160', id: 'easelL' }, { x: 39.5, y: 11, r: 1.4, c: '150,170,220' });
  item('can', 53, 15, _L('空罐')); item('bandage', 44, 15, _L('繃帶'));
}
{ const _b = SCENES[2]; SCENES[2] = function () { _b(); buildArt(); }; }

/* ---------- 石膏像 ---------- */
function bustLooked(b) {
  const dx = b.x + .5 - P.x, dy = b.y + .5 - P.y, d = Math.hypot(dx, dy), [fx, fy] = DIRV[P.dir];
  return d < (P.light ? 7 : 3.5) && (fx * dx + fy * dy) / d > (P.light ? .75 : .5);
}
// 10/23 修正：原本三尊一起轉、每 3 秒一格，不可能同時看著三尊 → 一直尖叫。
// 現在：只有 6 格內的會轉、每 5–8 秒一格；叫過的那尊冷卻 20 秒；全部之間至少隔 12 秒；手電筒照著轉回去較快。
function bustUpdate(dt) {
  if (!inArt(P.x, P.y)) { for (const b of BUSTS) b.turn = Math.max(0, b.turn - dt * .5); return; }
  G.bustCD = Math.max(0, (G.bustCD || 0) - dt);
  for (const b of BUSTS) {
    b.t -= dt; b.cd = Math.max(0, (b.cd || 0) - dt);
    const turnBack = bustLooked(b) && P.light;
    if (turnBack) { if (b.t <= 0 && b.turn > 0) { b.turn = Math.max(0, Math.ceil(b.turn) - 1); b.t = .6; noise(.2, .05, 'lowpass', 300, 1); } continue; }
    if (bustLooked(b) || b.cd > 0 || dist(b.x + .5, b.y + .5, P.x, P.y) > 6) continue;
    if (b.t <= 0) {
      if (b.turn >= 2 && G.bustCD > 0) { b.t = 1.5; continue; }   // 另一尊剛叫過：先忍住
      b.turn = Math.floor(b.turn) + 1; b.t = 5 + Math.random() * 3; noise(.25, .07, 'lowpass', 260, 1);   // 石頭摩擦的聲音
      if (b.turn >= 3) bustScream(b);
    }
  }
}
function bustScream(b) {
  b.turn = 0; b.cd = 20; b.t = 6; G.bustCD = 12; sfx.sting(); shake = 10; addNoise(b.x + .5, b.y + .5, 14); G.fear = Math.min(100, (G.fear || 0) + 25);
  for (let k = 0; k < 4; k++) tone(900 - k * 120, .25, 'sawtooth', .04, 400, 0, k * .08);
  toast(_L('石膏像張開嘴——發出了刺耳的尖叫！（走廊上的腳步聲，往這邊來了）'));
  if (GH.active && GH.state !== 'chase' && typeof investigate === 'function') investigate(b.x + .5, b.y + .5);
}

/* ---------- 互動 ---------- */
async function artAction(o) {
  const F = G.flags, I = G.inv;
  switch (o.act) {
    case 'artnote': await says([[_L('黑板'), _L('「石膏素描：不要背對你的模特兒。」')], _L('……底下有一行很小的字：'), [_L('黑板'), _L('「它們會看你。你不看它們的時候，它們會看你。」')]]); return;
    case 'painting':
      if (I.libkey) { await says([_L('畫布上只剩下一張空椅子。'), _L('……畫裡的女孩，去哪裡了？')]); return; }
      if (!F.artPhoto) { await says([_L('畫架上是一幅還沒畫完的油畫。'), _L('一個穿著舊式水手服的女孩，坐在椅子上，手裡拿著一把鑰匙。'), _L('……畫得好真。好像隨時會動。'), _L('（光線太暗，看不清楚細節。用手機的閃光燈照照看？）')]); return; }
      I.libkey = 1; sfx.pick(); updateHUD(); toast(_L('得到【圖書室的鑰匙】'));
      await says([_L('把畫框翻過來——背面的木條上，用膠帶貼著一把鑰匙。名牌寫著「圖書室」。'), _L('把畫轉回正面的時候……'), _L('畫裡的女孩不見了。只剩下一張空椅子。'), _L('——身後，三尊石膏像同時轉過了頭。')]);
      F.artKey = 1; bustScream(BUSTS[1]); BUSTS.forEach(b => { b.turn = 0; b.t = 8; b.cd = 15; }); G.bustCD = 15;   // 只叫一次，給玩家時間逃出去
      setObj(_L('用鑰匙打開圖書室（走廊西側）')); saveCP('libkey'); return;
  }
  return false;
}
{ const _a = sceneAction; sceneAction = async function (o) { if (G.scene === 2 && (o.act === 'painting' || o.act === 'artnote')) { await artAction(o); return true; } return _a(o); }; }
// 圖書室的門：鑰匙串上少了那一把
{ const _ud = useDoor; useDoor = async function (dr) {
    if (G.scene === 2 && dr.key === 'staffkeys' && G.inv.staffkeys && !G.inv.libkey) {
      sfx.locked();
      await says([_L('鑰匙串上的鑰匙一把一把試過了。'), _L('……「圖書室」那一把的掛環是空的，只剩一張小名牌：「借・美術社」。'), _L('美術室……走廊的最東邊。')]);
      if (!G.flags.libHint) { G.flags.libHint = 1; setObj(_L('到走廊東邊的美術室，找圖書室的鑰匙')); saveCP('libhint'); }
      return;
    }
    return _ud(dr); }; }
PHOTO_SPOTS.push({ scene: 2, x: 49.5, y: 12.5, id: 'painting', lines: [_L('閃光燈照亮了畫布。'), _L('……照片裡，女孩手上沒有鑰匙。'), _L('她的另一隻手，指著畫框的背面。'), _L('而且——照片裡的她，正看著鏡頭。')], then: () => { G.flags.artPhoto = 1; } });
{ const _u = sceneUpdate; sceneUpdate = function (dt) { _u(dt); if (G.scene === 2 && G.mode === 'play') bustUpdate(dt); }; }
{ const _d = sceneDrawObj; sceneDrawObj = function (o, cx, cy, shaking) {
    if (G.scene !== 2) return _d(o, cx, cy, shaking);
    const { x, y } = o;
    switch (o.t) {
      case 'bust': {
        const b = BUSTS[o.i]; box(x + .2, y + .2, .6, .6, 16, '#7a756c', '#5a564f', '#4e4a44');
        const [a, c] = iso(x + .5, y + .5), hy = c - 26, tw = [0, .35, .7, 1][Math.min(3, Math.floor(b.turn))];
        ctx.fillStyle = '#d8d4c8'; ctx.beginPath(); ctx.ellipse(a, hy, 6, 7, 0, 0, 7); ctx.fill(); ctx.fillRect(a - 4, hy + 5, 8, 6);
        ctx.fillStyle = '#c8c4b8'; ctx.beginPath(); ctx.ellipse(a + 1, hy - 3, 5.5, 4, 0, 0, 7); ctx.fill();
        if (tw > 0) {   // 臉轉過來的程度：眼睛、嘴巴越來越清楚
          ctx.fillStyle = `rgba(30,24,20,${tw})`; ctx.fillRect(a - 3 + (1 - tw) * 3, hy - 1, 2, 2); ctx.fillRect(a + 1 + (1 - tw) * 3, hy - 1, 2, 2);
          if (tw >= .7) { ctx.fillRect(a - 2, hy + 3, 4, b.turn >= 3 ? 3 : 1); }
        }
        return true;
      }
      case 'easel': {
        ctx.fillStyle = '#6a4a2e'; ctx.fillRect(cx - 7, cy - 30, 2, 30); ctx.fillRect(cx + 5, cy - 30, 2, 30); ctx.fillRect(cx - 1, cy - 34, 2, 34);
        ctx.fillStyle = '#3a3428'; ctx.fillRect(cx - 9, cy - 42, 18, 20); ctx.fillStyle = '#7a6a50'; ctx.fillRect(cx - 8, cy - 41, 16, 18);
        if (!G.inv.libkey) { ctx.fillStyle = '#2a2a3a'; ctx.fillRect(cx - 3, cy - 37, 6, 11); ctx.fillStyle = '#e8d8c8'; ctx.fillRect(cx - 2, cy - 39, 4, 4); ctx.fillStyle = '#1a1a1a'; ctx.fillRect(cx - 3, cy - 40, 6, 2); }
        else { ctx.fillStyle = '#5a4a3a'; ctx.fillRect(cx - 3, cy - 30, 6, 4); }
        return true;
      }
      case 'arttable': box(x + .05, y + .2, .9, .6, 12, '#7a6a5a', '#5a4a3a', '#4e4032'); ctx.fillStyle = ['#c83a3a', '#3a7ac8', '#e8c84a'][(x + y) % 3]; ctx.fillRect(cx - 3, cy - 15, 3, 2); return true;
      case 'artnote': faceRect(x, y, 'L', .1, .9, 12, 30, '#26352c'); return true;
    }
    return _d(o, cx, cy, shaking);
  }; }
{ const _h = sceneHUD; sceneHUD = function (s) { _h(s); if (G.scene === 2 && G.inv.libkey) s.push(_L`<div class="s">圖書室的鑰匙</div>`); }; }
{ const _o = sceneOnLoad; sceneOnLoad = function (cp) { _o(cp); if (G.scene === 2) BUSTS.forEach(b => { b.turn = 0; b.t = 2; }); }; }
TRIG.push({ scene: 2, id: 'artIn', when: () => inArt(P.x, P.y), run: async () => { await says([_L('美術室。松節油的味道。'), _L('三尊石膏像……都背對著門口。'), _L('……剛剛，好像有一尊動了一下。')]); } });
LORE.push(
  ['bust', _L('回頭的石膏像'), _L('美術室的石膏像，在你背對它的時候慢慢轉過頭來。'), _L('完全轉過來的時候，它會尖叫。用手電筒照著它，它會轉回去。'), () => G.flags.artPhoto || G.flags.artKey],
  ['painting', _L('畫中的少女'), _L('還沒畫完的油畫裡，穿著舊式水手服的女孩。'), _L('拿走她手上的東西之後，她就從畫裡消失了。'), () => G.flags.artKey],
);
// 測試：第二章拿鑰匙串之後，走美術室拿圖書室鑰匙（testCh2 會呼叫）
async function testArtRoute() {
  const tp = (x, y) => { P.x = x; P.y = y; };
  G.flags.artPhoto = 1;
  tp(49.5, 13.5); P.dir = 0; await interact(); await waitFree();
  if (!G.inv.libkey) throw 'libkey';
  GH.active = false;
}
// 測試（?test=art）：站在美術室中央不照手電筒 40 秒，數尖叫幾次（修正前約 10 次以上）
async function testArt() {
  try {
    await startCh2(); await waitFree(); GH.active = false;
    P.x = 49.5; P.y = 11.5; P.dir = 4; P.light = false; P.inv = 9999;
    let n = 0; const _s = bustScream; bustScream = b => { n++; _s(b); };
    const t0 = G.t; while (G.t - t0 < 40) await wait(20);
    document.title = (n <= 3 ? 'PASS ' : 'FAIL ') + 'screams=' + n;
  } catch (e) { document.title = 'ERR ' + e; }
}
