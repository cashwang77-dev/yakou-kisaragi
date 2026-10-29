/* 夜校・如月　第三章擴充：舊校舍東棟（2026-10-23，故事延長）
   失物招領箱裡只剩字條（鑰匙被收到東棟二樓講堂的講台）→ 走廊往東 → 「十三階段」：半夜會多出一階，
   第 13 階每次出現在不同位置、只有手電筒照到才看得見，踩到會摔回樓梯底 → 講堂：講台上的地下書庫鑰匙。
   新怪談「隙間女」（整個舊校舍）：每隔一段時間，某個躲藏點的縫隙裡藏著她，躲進去會被抓；用手機閃光拍縫隙可以先看到她的眼睛。
   載入順序：最後。 */

const STAIR = { x0: 50, x1: 51, y0: 11, y1: 23 };   // 樓梯（往北爬），13 階＝y 23→11
const onStair = (x, y) => x >= STAIR.x0 && x < STAIR.x1 + 1 && y >= STAIR.y0 && y < STAIR.y1 + 1;
const HALL4 = [2, 10, 60, 2];   // 講堂 x44–60, y2–10
const GAP = { o: null, t: 0, marked: null };

function buildOldWing() {
  fill(38, 20, 52, 22, ':'); for (let x = 38; x <= 53; x++) { if (at(x, 19) === 'X') put(x, 19, '#'); if (at(x, 23) === 'X') put(x, 23, '#'); }
  put(37, 20, ':'); put(37, 21, ':'); put(37, 22, ':');   // 舊走廊東端打通
  if (at(38, 20) !== ':') fill(38, 20, 38, 22, ':');
  for (let y = 19; y <= 23; y++) if (at(53, y) === 'X' || at(53, y) === '#') put(53, y, '#');
  // 樓梯：x50–51, y11–19（從走廊 y20 往北爬）
  fill(STAIR.x0, STAIR.y0, STAIR.x1, 19, '=');
  for (let y = STAIR.y0; y <= 19; y++) { put(49, y, '#'); put(52, y, '#'); }
  // 講堂 x44–60, y2–10
  for (let y = 1; y <= 11; y++) for (let x = 43; x <= 61; x++) if (at(x, y) === 'X') put(x, y, '#');
  fill(44, 2, 60, 10, '_'); put(50, 11, '='); put(51, 11, '=');
  for (const y of [5, 7, 9]) for (let x = 45; x <= 59; x++) if (x !== 50 && x !== 51) obj('auchair', x, y);
  obj('podium', 52, 3, { g4: 1, act: 'podium', label: _L('講台') });
  for (const x of [45, 46, 58, 59]) obj('oldshelf', x, 2);
  obj('locker', 44, 4); obj('locker', 60, 4); obj('cabinet', 60, 8);
  obj('auport', 56, 2, { g4: 1, act: 'auport', label: _L('看牆上的照片') });
  obj('wingnote', 40, 20, { g4: 1, act: 'wingnote', label: _L('看牆上的紙') });
  LIGHTS.push({ x: 52.5, y: 3.6, r: 2.6, c: '255,210,150', id: 'podL' }, { x: 50.5, y: 21, r: 1.6, c: '150,170,220' }, { x: 50.5, y: 11.5, r: 1.4, c: '150,170,220' });
  item('bandage', 47, 21, _L('繃帶')); item('can', 57, 10, _L('空罐'));
}
{ const _b = SCENES[4]; SCENES[4] = function () { _b(); buildOldWing(); }; }
// 妃姬子的巡邏延伸到東棟（拿走講台的鑰匙之後）
const HK_PATROL_WING = [[44.5, 21], [50.5, 21], [50.5, 15], [52.5, 8], [46.5, 4]];

/* ---------- 地面：樓梯一階一階 ---------- */
{ const _t = sceneTile; sceneTile = function (g, x, y, c) {
    if (G.scene === 4 && onStair(x, y) && c === '=') {
      diamond(g, x, y, y % 2 ? '#5a4632' : '#52402e');
      const [a, b] = isoW(x, y), [c2, d] = isoW(x + 1, y); g.strokeStyle = 'rgba(20,14,8,.6)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(a, b); g.lineTo(c2, d); g.stroke(); g.lineWidth = 1;
      return true;
    }
    return _t(g, x, y, c); }; }

/* ---------- 十三階段 ---------- */
function stairReset() { G.stair13 = [STAIR.x0 + (Math.random() < .5 ? 0 : 1), 12 + Math.floor(Math.random() * 7)]; }
function stairUpdate() {
  if (!onStair(P.x, P.y)) { G.onStairPrev = false; return; }
  if (!G.onStairPrev) { stairReset(); G.onStairPrev = true; if (!G.flags.stairSeen) { G.flags.stairSeen = 1; says([_L('樓梯。白天數過，是十二階。'), _L('……現在數起來，好像多了一階。'), _L('（手電筒照著腳下走。第十三階……踩到的話，會掉到哪裡去？）')]); } }
  const [sx, sy] = G.stair13 || [0, 0];
  if (Math.floor(P.x) === sx && Math.floor(P.y) === sy && P.inv <= 0 && !G.lock) {
    damage(1); sfx.hurt(); shake = 12; setPose('hurt', 1); P.inv = 2;
    P.x = 50.5 + (sx === 50 ? 1 : 0); P.y = 20.6; stairReset();
    toast(_L('第十三階——腳下是空的。整個人摔回了樓梯底。'));
  }
}
/* ---------- 隙間女 ---------- */
const gapSpots = () => OBJ.filter(o => HIDE[o.t] && o.hide !== false && ['oldshelf', 'locker', 'cabinet'].includes(o.t));
function gapUpdate(dt) {
  GAP.t -= dt;
  if (GAP.t <= 0 || !GAP.o) { const s = gapSpots(); GAP.o = s[Math.floor(Math.random() * s.length)]; GAP.t = 45 + Math.random() * 30; GAP.marked = null; }
}
{ const _hd = hide; hide = function (o) {
    const r = _hd(o);
    if (G.scene === 4 && o === GAP.o && !TEST) setTimeout(async () => {
      if (P.hidden !== o) return;
      unhide(); damage(1); sfx.sting(); shake = 12; setPose('hurt', 1); P.inv = 2; G.flags.gapMet = 1;
      await says([_L('縫隙的深處——有一隻眼睛。'), _L('「…………這裡，是我的位置。」'), _L('細得像紙一樣的手指，把我推了出去。'), _L('（這個縫隙裡，有人。）')]);
      GAP.t = 0;
    }, 600);
    return r; }; }
PHOTO_SPOTS.push({ scene: 4, x: 0, y: 0, id: 'gap_dummy', lines: [] });   // 佔位（實際判斷在下面）
{ const _ph = phonePhoto; phonePhoto = async function () {
    if (G.scene === 4 && GAP.o && G.inv.phone && PH.batt >= 20 && PH.flashCD <= G.t && !P.hidden) {
      const o = GAP.o, dx = o.x + .5 - P.x, dy = o.y + .5 - P.y, d = Math.hypot(dx, dy), [fx, fy] = DIRV[P.dir];
      if (d < 4.5 && (fx * dx + fy * dy) / d > .55) { await _ph(); GAP.marked = o; G.flags.gapMet = 1; sfx.sting(); await says([_L('照片裡，書架的縫隙之間——'), _L('有一隻眼睛，正看著鏡頭。'), _L('（那裡面有人。不能躲進去。）')]); return; }
    }
    return _ph(); }; }

/* ---------- 互動 ---------- */
async function wingAction(o) {
  const F = G.flags, I = G.inv;
  switch (o.act) {
    case 'wingnote': await says([[_L('舊校舍東棟'), _L('「東棟二樓講堂，因樓梯危險，暫停使用。」')], _L('底下用鉛筆寫著很小的字：'), ['', _L('「晚上數樓梯的時候，不要數出聲音。」')]]); return;
    case 'auport': await says([_L('講堂牆上的照片。「2004 年度　畢業典禮」。'), _L('……照片裡的二年級座位區，有兩個位子是空的。'), _L('空位上放著兩束花。')]); return;
    case 'podium':
      if (I.archkey) { await says([_L('講台上空空的。')]); return; }
      I.archkey = true; sfx.pick(); updateHUD(); toast(_L('得到【地下書庫的鑰匙】'));
      await says([_L('講台上放著一把生鏽的鑰匙，名條寫著「地下書庫」。'), _L('旁邊壓著一張紙：「宿直・保管」。'), _L('——講堂的燈，「啪」地全熄了。'), _L('樓下的走廊，傳來拖著麻袋的聲音。……她往這邊來了。')]);
      F.wingKey = 1; sfx.sting(); shake = 8;
      HK_PATROL.push(...HK_PATROL_WING.filter(w => !HK_PATROL.some(p => p[0] === w[0] && p[1] === w[1])));
      if (HK.state === 'off' || HK.state === 'patrol') { HK.state = 'patrol'; HK.wp = HK_PATROL.length - 1; HK.x = 44.5; HK.y = 21; HK.path = null; }
      setObj(_L('回到走廊西邊，打開地下書庫')); saveCP('archkey');
      await wait(TEST ? 10 : 700);
      await phoneCall([_L('我是瑪莉。'), _L('我現在……在地下書庫的門口。'), _L('她在下面等你哦。')]); return;
  }
  return false;
}
{ const _a = sceneAction; sceneAction = async function (o) {
    if (G.scene === 4) {
      if (o.act === 'lostbox' && !G.inv.archkey) {
        await says([_L('失物招領箱。褪色的髮夾、一隻手套、寫著名字的直笛……'), _L('箱底沒有鑰匙。只有一張夾在直笛裡的紙條。'), [_L('紙條'), _L('「地下書庫的鑰匙，我收到東棟二樓講堂的講台上了。不要再讓學生進去。——宿直」')], _L('……東棟。走廊的最東邊，好像還有路。')]);
        G.flags.lostNote = 1; setObj(_L('從走廊往東，到東棟二樓的講堂（樓梯要小心）')); saveCP('lostnote'); return true;
      }
      if (['wingnote', 'auport', 'podium'].includes(o.act)) { await wingAction(o); return true; }
    }
    return _a(o); }; }
{ const _u = sceneUpdate; sceneUpdate = function (dt) { _u(dt); if (G.scene !== 4 || G.mode !== 'play') return; stairUpdate(); gapUpdate(dt);
    const pl = LIGHTS.find(l => l.id === 'podL'); if (pl) pl.r = G.inv.archkey ? 0 : 2.6; }; }
{ const _s = sceneSprites; sceneSprites = function (list) {
    _s(list); if (G.scene !== 4) return;
    if (G.stair13 && onStair(P.x, P.y) && P.light) { const [sx, sy] = G.stair13, dx = sx + .5 - P.x, dy = sy + .5 - P.y, d = Math.hypot(dx, dy), [fx, fy] = DIRV[P.dir];
      if (d < 5 && (d < 1 || (fx * dx + fy * dy) / d > .6)) list.push({ d: sx + sy, f: () => { const [cx, cy] = iso(sx + .5, sy + .5); ctx.fillStyle = `rgba(120,140,200,${.25 + .2 * Math.sin(G.t * 6)})`; ctx.beginPath(); ctx.moveTo(cx, cy - 8); ctx.lineTo(cx + 16, cy); ctx.lineTo(cx, cy + 8); ctx.lineTo(cx - 16, cy); ctx.fill(); } }); }
    if (GAP.marked) { const o = GAP.marked; list.push({ d: o.x + o.y + .5, f: () => { const [cx, cy] = iso(o.x + .5, o.y + .5); ctx.fillStyle = Math.sin(G.t * 3) > 0 ? '#ff4a4a' : '#8a1a1a'; ctx.fillRect(cx - 1, cy - 22, 3, 2); } }); }
  }; }
{ const _d = sceneDrawObj; sceneDrawObj = function (o, cx, cy, shaking) {
    if (G.scene !== 4) return _d(o, cx, cy, shaking);
    const { x, y } = o;
    switch (o.t) {
      case 'auchair': box(x + .15, y + .3, .7, .4, 7, '#5a3a2a', '#3e281c', '#352218'); box(x + .15, y + .3, .7, .1, 15, '#6a4a34', '#4a3424', null); return true;
      case 'podium': box(x + .15, y + .2, .7, .6, 18, '#6a4a2e', '#4a3220', '#3e2a1a'); if (!G.inv.archkey) { ctx.fillStyle = '#b89a50'; ctx.fillRect(cx - 2, cy - 21, 4, 2); } return true;
      case 'auport': faceRect(x, y, 'L', .15, .85, 14, 30, '#9a9488'); return true;
      case 'wingnote': faceRect(x, y, 'L', .25, .75, 16, 28, '#d8d0b8'); return true;
    }
    return _d(o, cx, cy, shaking);
  }; }
{ const _o = sceneOnLoad; sceneOnLoad = function (cp) { _o(cp); if (G.scene !== 4) return; GAP.t = 0; GAP.marked = null;
    if (G.flags.wingKey) HK_PATROL.push(...HK_PATROL_WING.filter(w => !HK_PATROL.some(p => p[0] === w[0] && p[1] === w[1]))); }; }
LORE.push(
  ['stair13', _L('十三階段'), _L('白天是十二階的樓梯，半夜會多出一階。'), _L('第十三階每次都在不同的地方。手電筒照著腳下走。'), () => G.flags.stairSeen],
  ['sukima', _L('隙間女'), _L('書架、櫃子的縫隙裡，住著一個很薄很薄的女人。'), _L('躲進去之前，先用手機的閃光燈照照看。'), () => G.flags.gapMet],
);
// 測試：第三章拿鑰匙改走東棟（testCh3 會呼叫）
async function testOldWing() {
  const tp = (x, y) => { P.x = x; P.y = y; };
  tp(11.5, 18.5); P.dir = 6; await interact(); await waitFree();
  if (!G.flags.lostNote) throw 'lost note';
  G.stair13 = [0, 0]; G.onStairPrev = true; G.flags.stairSeen = 1;
  tp(52.5, 4.4); P.dir = 0; await interact(); await waitFree();
  if (!G.inv.archkey) throw 'podium key';
  HK.state = 'off';
}
