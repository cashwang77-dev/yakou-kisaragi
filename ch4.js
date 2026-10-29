/* 夜校・如月　終章：如月車站（場景 5）
   地下書庫往下走 → 候車室（澄香、存檔長椅、末班車乘客名單、事故告示）→ 閘口（車掌查票：手機殼裡的定期票）
   → 第一月台（黑影乘客排隊：不要用手電筒照、不要跑；停著的列車＝壞結局）→ 跨線天橋
   → 第二月台（Teke Teke 在軌道上爬：「テケテケ」聲變大就躲長椅下；被抓到問「我的腳在哪？」）→ 隧道口＝普通結局
   真結局：第三章回答「她還在等」＋把交換日記交給澄香 → 第二月台，妃姬子來了，兩人搭上反方向的列車。
   跟 ch3.js 一樣用「包一層」接進掛勾。 */

const ROOM5 = { wait: [27, 2, 36, 8], conc: [18, 3, 25, 6] };
const in5 = (r, x, y) => { const [x0, y0, x1, y1] = ROOM5[r]; return x >= x0 && x < x1 + 1 && y >= y0 && y < y1 + 1; };
const P_END = 51;   // 10/23 月台由 x25 延長到 x51
const onP1 = (x, y) => x >= 3 && x < P_END && y >= 8 && y < 12, onP2 = (x, y) => x >= 3 && x < P_END && y >= 16 && y < 20;
const TRACK1 = 12.6, TRACK2 = 14.6;   // 兩條軌道的中線（y）
const PAX_SPOTS = [[9.5, 11.3], [12.5, 11.3], [15.5, 11.3], [18.5, 11.3], [21, 11.3], [27.5, 11.3], [31.5, 11.3], [35.5, 11.3], [40.5, 11.3], [44.5, 11.3], [48.5, 11.3]];
const PAX = [];   // 黑影乘客
const TK = { x: 6, y: TRACK2, dir: 6, vx: 1, state: 'track', frame: 0, animD: 0, timer: 0, moving: false };   // Teke Teke
const SUMI = { x: 33.5, y: 4.5, dir: 4, at: 'wait' };
const TRAIN2 = { x: -99, v: 0 };   // 真結局：反方向進站的列車（車頭 x）
const ENDS_KEY = 'yakou_kisaragi_endings', TRUE_KEY = 'yakou_kisaragi_true';
Object.assign(HIDE, { bench: _L('躲到長椅下'), ticketm: _L('擠進售票機之間') });
SCENE_PATROL[5] = [[30.5, 30.5]];   // 裂口女不來車站
SCENES[5] = buildCh4;
loadImages(['passenger', 'passenger2', 'conductor', 'sumika', 'teke', 'walls5', 'train_side', 'train_front']).then(() => { for (const k of ['passenger', 'passenger2', 'conductor', 'teke']) if (IMG[k]) IMG[k].rows = 4; if (IMG.sumika) IMG.sumika.rows = 2; });

function buildCh4() {
  const room = (r, c) => { const [x0, y0, x1, y1] = ROOM5[r]; for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) if (at(x, y) === 'X') put(x, y, '#'); fill(x0, y0, x1, y1, c); };
  room('wait', ':'); room('conc', ':');
  door(26, 5, { locked: true, key: 'ticket', sign: _L('改札'), msg: _L('閘口。欄杆放下來了。') });
  put(19, 7, ':'); put(20, 7, ':');                                // 通道 → 第一月台的樓梯
  fill(3, 8, 24, 11, '='); fill(25, 10, 37, 11, '='); fill(38, 8, P_END - 1, 11, '='); fill(3, 16, P_END - 1, 19, '=');   // 第一月台（站房前面只剩 2 格寬）、第二月台（軌道 y12–15 留 X＝掉不下去）
  for (let x = 38; x < P_END; x++) if (at(x, 7) === 'X') put(x, 7, '#');
  fill(22, 12, 23, 15, '=');                                         // 跨線天橋（從軌道上方跨過去）
  for (let y = 12; y <= 15; y++) { put(21, y, 'f'); put(24, y, 'f'); }
  fill(P_END, 17, 56, 19, '=');                                      // 往隧道口的步道（月台東端）
  // 候車室
  obj('bench', 30, 6, { act: 'rest5', label: _L('在長椅上坐一下（存檔）'), hide: false });
  obj('plist', 29, 2, { act: 'plist', label: _L('看牆上的名單') }); obj('notice', 32, 2, { act: 'notice', label: _L('看事故告示') });
  obj('ticketm', 35, 2); obj('ticketm', 36, 3);
  obj('sumika', 33, 4, { act: 'sumika', label: _L('跟她說話') });
  obj('conductor', 27, 4, { act: 'conductor', label: _L('跟車掌說話') });
  // 第一月台：站牌、長椅、停著的列車
  obj('stsign', 14, 8, { act: 'stsign', label: _L('看站牌') });
  for (const x of [5, 8, 17, 40, 46]) obj('bench', x, 8);
  for (const x of [11, 23, 43]) obj('pillar5', x, 8); for (const x of [11, 23, 33, 43]) obj('pillar5', x, 19);   // 月台的屋簷柱子
  obj('ekimei', 49, 8, { act: 'stsign', label: _L('看站名牌') }); obj('ekimei', 38, 19, { act: 'stsign2', label: _L('看站名牌') });
  for (let x = 4; x <= 17; x++) obj('train', x, 12, x === 7 || x === 13 ? { act: 'board', label: _L('看看車門') } : {});
  // 第二月台
  for (const x of [5, 9, 13, 17, 26, 31, 41, 47]) obj('bench', x, 19);
  obj('stsign', 11, 19, { act: 'stsign2', label: _L('看站牌') });
  obj('tunnel', 57, 18, { act: 'tunnel', label: _L('走向隧道口') });
  // 光源：月台的燈、候車室、隧道口的紅燈
  for (let x = 6.5; x < P_END; x += 6) LIGHTS.push({ x, y: 9.2, r: 2.6, c: '230,225,190' });
  for (let x = 6.5; x < P_END; x += 6) LIGHTS.push({ x, y: 18.2, r: 2.4, c: '200,215,235' });
  LIGHTS.push({ x: 31.5, y: 4.5, r: 3.6, c: '255,230,180' }, { x: 21.5, y: 4.5, r: 2.2, c: '200,210,230' }, { x: 56.5, y: 17.5, r: 1.8, c: '255,60,60', id: 'tunnelLamp' });
  item('can', 10, 10, _L('空罐')); item('can', 15, 17, _L('空罐'));
  item('bandage', 23, 4, _L('繃帶')); item('charm', 10, 17, _L('護身符')); item('drink', 4, 9, _L('能量飲料'));
  item('ext', 19, 4, _L('滅火器')); item('eraser', 31, 7, _L('板擦'));
  ch4Reset();
}
// 軌道、月台黃線、碎石：畫在地板層
function sceneFloor(g) {
  if (G.scene !== 5) return;
  for (let y = 12; y <= 15; y++) for (let x = 0; x <= 62; x++) {
    if (at(x, y) !== 'X') continue;
    diamond(g, x, y, (x + y) % 2 ? '#1c1d22' : '#202127'); speck(g, x, y, ['#2b2c33', '#141519'], 10);
  }
  g.strokeStyle = '#6d6a66'; g.lineWidth = 1.2;
  for (const ty of [TRACK1, TRACK2]) for (const o of [-.28, .28]) {   // 鐵軌（跨線天橋那兩格不畫）
    for (const [a, b] of [[0, 22], [24, 63]]) { const [x0, y0] = isoW(a, ty + o), [x1, y1] = isoW(b, ty + o); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  }
  g.fillStyle = 'rgba(70,55,40,.8)';
  for (const ty of [TRACK1, TRACK2]) for (let x = 0.3; x < 63; x += .7) { if (x > 21.6 && x < 24.4) continue; const [a, b] = isoW(x, ty - .4), [c, d] = isoW(x, ty + .4); g.fillRect(Math.min(a, c), Math.min(b, d), 3, Math.abs(d - b) + 1); }
  // 月台的水泥側面（從軌道這邊看得到）：第一月台南緣（y12）、第二月台南緣（y20）
  if (IMG.walls5) for (const [ey, a, b] of [[12, 3, 22], [12, 24, P_END], [20, 3, 57]]) for (let x = a; x < b; x++) {
    const [x0, y0] = isoW(x, ey); g.setTransform(16 / 64, 8 / 64, 0, 12 / 68, x0, y0); g.drawImage(IMG.walls5, 4 * 64, 0, 64, 68, 0, 0, 64, 68); g.setTransform(1, 0, 0, 1, 0, 0);
  }
}

/* ---------- 開場（第三章結束後，從地下書庫再往下走） ---------- */
async function startCh4() {
  markReach(6);
  await card('card_station', G.flags.ending4 ? [_L('車站裡沒有站務員。'), _L('候車室的燈，是這條路上唯一亮著的燈。'), _L('時刻表上，所有的班次都是 4:44。')] : [_L('書庫最裡面，還有一道往下的樓梯。'), _L('樓梯的盡頭，是一個不該出現在學校底下的地方。'), _L('月台的站牌上寫著——「きさらぎ」。')]);
  loadScene(5);
  Object.assign(P, { x: 35.5, y: 7.4, dir: 1, hidden: null, crouch: false, pose: null });
  GH.active = false; ch4Reset();
  chapter(_L('終章'), _L('如月車站'));
  saveCP('ch4');
  await wait(TEST ? 10 : 1600);
  await says([_L('……候車室。'), _L('日光燈一閃一閃的。時刻表上，所有的班次都是 4:44。')]);
  await phoneCall([_L('我是瑪莉。'), _L('我現在……在月台上。'), _L('有一個人，在候車室等了好久好久哦。')]);
  setObj(_L('跟候車室裡的女生說話'));
}
function ch4Reset() {
  PAX.length = 0;
  PAX_SPOTS.forEach(([x, y], i) => PAX.push({ x, y, hx: x, hy: y, dir: 3, state: 'wait', timer: 0, frame: 0, animD: 0, path: null, img: i % 2 ? 'passenger2' : 'passenger', r: .25 }));
  Object.assign(TK, { x: 6, y: TRACK2, vx: 1, state: 'track', timer: 0 });
  TRAIN2.x = -99; TRAIN2.v = 0;
  const so = OBJ.find(o => o.t === 'sumika');
  if (so) { Object.assign(SUMI, G.flags.gaveDiary ? { x: 13.5, y: 17.4, at: 'p2' } : { x: 33.5, y: 4.5, at: 'wait' }); so.hidden5 = so.solid = !!G.flags.gaveDiary; so.solid = !so.hidden5; }
}

/* ---------- 互動 ---------- */
async function ch4Action(o) {
  const F = G.flags;
  switch (o.act) {
    case 'rest5':
      if (G.hearts < 5) G.hearts = Math.min(5, G.hearts + 2);
      saveCP('bench5'); sfx.click(); updateHUD();
      await says([_L('在冰冷的長椅上坐了一下。'), _L('（已存檔）')]); return;
    case 'plist':
      await says([[_L('末班車乘客名單'), _L('1987　放學後返校　二年C班　……')], [_L('末班車乘客名單'), _L('1995　放學後返校　一年A班　……')], [_L('末班車乘客名單'), _L('2004　二年B班　澄香')], [_L('末班車乘客名單'), _L('2004　二年B班　妃姬子')],
        _L('……最後一行，是我的名字。'), _L('墨水還沒乾。')]);
      sfx.sting(); shake = 4; return;
    case 'notice':
      F.notice = true;
      await says([[_L('事故告示'), _L('2004 年 2 月，本站附近——如月高校後方的平交道，發生女學生遭列車撞擊事故。')], [_L('事故告示'), _L('女學生的下半身，至今仍未尋獲。')], [_L('事故告示'), _L('若在月台上被問到「腳在哪裡」，請告訴她。')],
        _L('……「校後的平交道」。')]);
      return;
    case 'stsign': await says([[_L('站牌'), _L('きさらぎ')], [_L('站牌'), _L('←　やみ　　　　かたす　→')], _L('……沒有一個站名，是我聽過的。')]); return;
    case 'stsign2': await says([[_L('站牌'), _L('きさらぎ　2 番線')], [_L('站牌'), _L('（底下有人用手指在灰塵上寫：「反方向的車，會回去」）')]]); return;
    case 'conductor':
      if (!DOORS['26,5'].locked) { await says([[_L('車掌'), _L('「……請往月台。」')]]); return; }
      {
        const a = await choose(_L('車掌'), _L('「……車票。」'), [_L('出示手機殼裡的定期票'), _L('沒有票')], 0);
        if (a !== 0) { await says([[_L('車掌'), _L('「…………」')], _L('他一動也不動，只是盯著我看。')]); return; }
        await says([_L('把夾在手機殼裡的定期票拿給他。'), [_L('車掌'), _L('「……如月高校前　→　如月。」')], [_L('車掌'), _L('「有效期限……二〇〇四年二月。」')], _L('……我的定期票上，印的是今天的日期才對。'), [_L('車掌'), _L('「請。」')]]);
        DOORS['26,5'].locked = false; sfx.door(); toast(_L('閘口的欄杆抬起來了'));
        setObj(F.gaveDiary ? _L('到第二月台去（跨線天橋）') : _L('去月台看看')); saveCP('gate5');
        await says([_L('（月台上那些人……最好別用手電筒照他們，也別在他們旁邊跑。）')]);
      }
      return;
    case 'sumika': return sumikaTalk();
    case 'board': {
      const a = await choose(_L('列車'), _L('車門開著。車廂裡坐滿了黑色的人影，全都朝著這邊。'), [_L('上車'), _L('不要')], 0);
      if (a === 0) return endBad();
      return;
    }
    case 'tunnel': {
      if (F.gaveDiary && G.flags.trueEnd) { await says([_L('……澄香在第二月台等著。'), _L('現在走掉的話，她們就永遠見不到了。')]); }
      const a = await choose(_L('隧道口'), _L('隧道裡一片漆黑。風從裡面吹出來，帶著雨的味道。'), [_L('一個人走進隧道'), _L('回去')], 0);
      if (a === 0) return endTunnel();
      return;
    }
  }
  return false;
}
async function sumikaTalk() {
  const F = G.flags, N = _L('澄香');
  if (F.gaveDiary) { await says([[N, _L('「我在第二月台等她。」')]]); return; }
  if (!F.metSumi) {
    F.metSumi = true;
    await says([_L('長椅上坐著一個女生。制服的款式，跟我們學校的不一樣——是舊的。'), [N, _L('「……妳也是，放學後回學校的人？」')], [N, _L('「我叫澄香。我在等一個人。」')], [N, _L('「她說過會來接我。……已經二十年了吧。」')]]);
  }
  if (!F.trueEnd) {
    await says([[N, _L('「妃姬子……大概不會來了。」')], [N, _L('「妳走吧。月台上的列車會帶妳去『終點』；隧道的話……也許回得去。」')], [N, _L('「不要回頭。」')],
      _L('（交換日記……她搖搖頭，沒有收下。）'), [N, _L('「那是她的東西。要她自己拿給我。」')]]);
    setObj(_L('離開車站：月台的列車，或是隧道口'));
    if (DOORS['26,5'].locked) setObj(_L('通過閘口（車掌在旁邊）'));
    return;
  }
  const a = await choose(N, _L('「……妳手上那本，是什麼？」'), [_L('把交換日記交給她'), _L('什麼都不說')], 0);
  if (a !== 0) { await says([[N, _L('「……是嗎。」')]]); return; }
  F.gaveDiary = true; sfx.pick();
  await says([_L('把七頁交換日記交給她。'), _L('她一頁一頁地翻。手指停在最後一頁，「澄香，我來接你了」那一行。'), [N, _L('「……妃姬子。」')], [N, _L('「她沒有忘記我。她一直在找我。」')],
    [N, _L('「……反方向的那班車，會帶我們回去。」')], [N, _L('「我去第二月台等她。妳……可以陪我到那裡嗎？」')]]);
  const so = OBJ.find(o => o.t === 'sumika'); if (so) { so.hidden5 = true; so.solid = false; }
  Object.assign(SUMI, { x: 13.5, y: 17.4, at: 'p2' });
  setObj(DOORS['26,5'].locked ? _L('通過閘口，到第二月台去') : _L('到第二月台去（跨線天橋）'));
  saveCP('diary5');
}

/* ---------- 黑影乘客：不要用手電筒照、不要跑 ---------- */
function paxProvoked(p) {
  const d = dist(p.x, p.y, P.x, P.y); if (P.hidden || pInvis()) return false;
  if (P.run && P.moving && d < 3.6) return _L('跑');
  if (!P.crouch && d < 1.15) return _L('近');   // 10/23：直接從旁邊走過去也會被注意到（要蹲著經過）
  if (P.light && d < 5.5) { const [fx, fy] = DIRV[P.dir]; if ((fx * (p.x - P.x) + fy * (p.y - P.y)) / d > .82) return _L('照'); }
  return false;
}
function paxUpdate(dt) {
  for (const p of PAX) {
    p.moving = false;
    if (p.state === 'wait') {
      const why = paxProvoked(p);
      if (why) { p.state = 'follow'; p.timer = 6; p.path = null; sfx.sting(); toast(why === _L('照') ? _L('被照到的人影，慢慢轉過頭來——') : why === _L('近') ? _L('靠太近了——人影轉過頭來（蹲下經過）') : _L('腳步聲太大了——人影轉過頭來')); }
      else { p.dir = 3; }
      continue;
    }
    if (p.state === 'follow') {
      p.timer -= dt;
      if (P.hidden || pInvis() || p.timer <= 0) { p.state = 'back'; p.path = null; continue; }
      walker(p, P.x, P.y, 1.25, dt);
      if (dist(p.x, p.y, P.x, P.y) < .6 && P.inv <= 0 && !G.lock) paxCatch(p);
    } else if (p.state === 'back') { if (walker(p, p.hx, p.hy, .9, dt)) p.state = 'wait'; }
  }
}
async function paxCatch(p) {
  p.state = 'back'; sfx.sting(); shake = 8; damage(1);
  if (G.mode !== 'play') return;
  await says([_L('冰冷的手搭上肩膀。'), [_L('？？？'), _L('「……請上車。」')], _L('用力甩開——'), _L('（回過神來，人在閘口後面的通道上。）')]);
  P.x = 21.5; P.y = 4.6; P.inv = 2; P.light = false;
  for (const q of PAX) Object.assign(q, { x: q.hx, y: q.hy, state: 'wait', path: null });
}

/* ---------- Teke Teke：在軌道上爬，看到人就爬上月台追過來 ---------- */
function tkSees() {
  if (P.hidden || G.mode !== 'play' || pInvis()) return false;
  const d = dist(TK.x, TK.y, P.x, P.y); let range = P.crouch ? 3.5 : 6; if (P.light) range += 2;
  return (onP2(P.x, P.y) || (P.y > 11 && P.x > 21 && P.x < 25)) && d < range;
}
function tkUpdate(dt) {
  TK.moving = false;
  if (TK.state === 'gone' || G.flags.ending) return;
  const d = dist(TK.x, TK.y, P.x, P.y);
  if (TK.state === 'stun') { TK.timer -= dt; tkMove(TK.x + TK.vx, TRACK2, 1.2, dt); if (TK.timer <= 0) TK.state = 'track'; return; }
  if (TK.state === 'track') {
    if (TK.x > P_END - 2) TK.vx = -1; if (TK.x < 3.5) TK.vx = 1;
    tkMove(TK.x + TK.vx, TRACK2, 2.1, dt);
    if (tkSees()) { TK.state = 'chase'; sfx.sting(); shake = 5; toast(_L('テケ、テケ、テケ——！')); }
  } else if (TK.state === 'chase') {
    if ((P.hidden && !TK.sawHide) || pInvis()) { TK.timer = (TK.timer || 0) + dt; if (TK.timer > 1.6) { TK.state = 'track'; TK.timer = 0; } tkMove(TK.x, TRACK2, 1.5, dt); }
    else { TK.timer = 0; tkMove(P.x, P.y, 3.5, dt); if (!onP2(P.x, P.y) && !(P.x > 21 && P.x < 25 && P.y > 11) && d > 4) TK.state = 'track'; }
    if (P.inv <= 0 && !G.lock && ((d < .6 && !P.hidden) || (P.hidden && TK.sawHide && d < 1.3))) tkCatch();
  }
}
function tkMove(tx, ty, sp, dt) {   // 爬行不受地形限制，但只在軌道與第二月台之間
  const dx = tx - TK.x, dy = ty - TK.y, m = Math.hypot(dx, dy); if (m < .05) return;
  const s = Math.min(m, sp * dt); TK.x += dx / m * s; TK.y = Math.max(13.9, Math.min(19.6, TK.y + dy / m * s)); TK.x = Math.max(2.5, Math.min(P_END - .5, TK.x));
  TK.dir = dirFromWorld(dx, dy); TK.moving = true; TK.animD += s; TK.frame = Math.floor(TK.animD / .22) % 4;
}
async function tkCatch() {
  TK.state = 'stun'; TK.timer = 99; P.hidden = null; sfx.sting(); shake = 12;
  // 10/23 難度：選項順序打亂、只有 5 秒；答對她也只會離開一下，之後回來會更兇（沒看過事故告示就只能用猜的）
  const OPT = [_L('校後的平交道'), _L('如月車站的月台'), _L('學校的地下書庫'), _L('隧道裡面')].sort(() => Math.random() - .5);
  const a = await choose('Teke Teke', _L('「……我的腳，在哪裡？」'), OPT, TEST ? OPT.indexOf(_L('校後的平交道')) : 5000);
  if (OPT[a] === _L('校後的平交道')) {
    TK.asked = (TK.asked || 0) + 1;
    await says(TK.asked > 1 ? [_L('「……妳上次也這樣說。」'), _L('「可是，那裡什麼都沒有。」'), _L('指甲刮過小腿——她爬回軌道，又轉過頭來看著這邊。')] : [_L('「…………平交道。」'), _L('她的頭髮後面，傳來很輕的、像是在哭的聲音。'), _L('她轉過身，爬回了軌道上。……可是，她還在看著這邊。')]);
    if (TK.asked > 1) damage(1);
    TK.state = 'stun'; TK.timer = TK.asked > 1 ? 3 : 4.5; TK.vx = TK.x > 12 ? 1 : -1; P.inv = 1.5; return;
  }
  damage(2); if (G.mode !== 'play') return;
  await says([_L('「——不對。」'), _L('指甲刮過腳踝。'), _L('（拚命跑回了天橋上。）')]);
  P.x = 22.5; P.y = 11.2; P.inv = 2.5; TK.state = 'stun'; TK.timer = 3; TK.x = 6; TK.y = TRACK2;
}

/* ---------- 真結局：第二月台 ---------- */
async function endTrue() {
  const F = G.flags, N = _L('澄香'), HKN = _L('妃姬子'); F.ending = 1;
  TK.state = 'gone';
  await says([_L('澄香站在月台的正中央，看著軌道的另一頭。'), [N, _L('「謝謝妳陪我來。」')], _L('……軌道上，Teke Teke 停住了。她抬起頭，往隧道的方向爬走，消失了。')]);
  await wait(TEST ? 10 : 600);
  F.hkShow = 1; sfx.heart(.3);
  await says([_L('腳步聲。'), _L('月台的另一頭，站著一個女生。頭髮往後梳好了，制服是乾淨的。'), _L('手上沒有麻袋。'), [HKN, _L('「……澄香。」')], [N, _L('「妃姬子。妳好慢。」')], [HKN, _L('「對不起。我一直……找不到門。」')], [N, _L('「現在找到了啊。」')]]);
  TRAIN2.x = 40; TRAIN2.v = -9; noise(2.5, .14, 'lowpass', 300, .8); tone(660, 1.6, 'sine', .04, 620);
  const t0 = performance.now(); while (TRAIN2.x > 8 && performance.now() - t0 < 6000) await wait(50);
  TRAIN2.v = 0; sfx.door();
  await says([_L('反方向的列車進站了。車廂裡亮著暖黃色的燈，一個乘客也沒有。'), [HKN, _L('「……這個，還給妳。」')], _L('妃姬子把一張摺好的紙塞進我手裡。'), [N, _L('「咪醬。」')], [N, _L('「回去的時候，不要回頭哦。」')]]);
  F.hkShow = 0; F.sumiGone = 1; sfx.door(); TRAIN2.v = -7;
  await wait(TEST ? 10 : 2600);
  await phoneCall([_L('我是瑪莉。'), _L('我現在……在你後面。'), _L('……好了，可以醒來了。')], _L('瑪莉'));
  finaleEnd('true');
}
async function endBad() {
  G.flags.ending = 1;
  await says([_L('踏進車廂。車門在背後關上了。'), _L('黑色的人影，一個一個轉過頭來。'), _L('車窗外的風景開始流動——'), _L('……是學校的校門。'), _L('一個背著書包的女生，正低著頭，走進沒有上鎖的校門。'), _L('手機在她手裡亮著。'), _L('……她，是下一個「乘客」。')]);
  finaleEnd('bad');
}
async function endTunnel() {
  G.flags.ending = 1;
  await says([_L('走進隧道。腳下的枕木一根、一根往後退。'), _L('背後……有人跟著。'), _L('「テケ……テケ……」'), _L('不要回頭。不要回頭。不要回頭——')]);
  await phoneCall([_L('我是瑪莉。'), _L('我現在……在你後面。'), _L('一直走，不要停哦。')], _L('瑪莉'));
  await says([_L('……光。'), _L('睜開眼睛的時候，天已經亮了。我躺在校門口。'), _L('手機的通話紀錄裡，多了一筆不認識的號碼。'), _L('通話時間：2004 年 2 月 □ 日　4:44。')]);
  finaleEnd('tunnel');
}
const ENDINGS = {
  true: [_L('真結局「到站」'), _L('天亮了。我站在校門口，手機震了一下。<br>「謝謝，我們到站了。」')],
  tunnel: [_L('普通結局「隧道」'), _L('我回來了。<br>……可是澄香，還在那裡等著。')],
  bad: [_L('壞結局「終點站」'), _L('今晚，又有一個人回學校拿東西。')],
};
function finaleEnd(k) {
  let got = []; try { got = JSON.parse(localStorage.getItem(ENDS_KEY)) || []; } catch (e) { }
  if (!got.includes(k)) got.push(k); if (!TEST) try { localStorage.setItem(ENDS_KEY, JSON.stringify(got)); } catch (e) { }
  G.flags.endKind = k;
  G.mode = 'end'; $('#hud').classList.add('hide'); $('#touch').classList.add('hide');
  const e = $('#end'); e.style.backgroundImage = 'url(assets/card_station.jpg)';
  e.querySelector('h2').textContent = ENDINGS[k][0];
  const hint = k === 'true' ? _L('感謝遊玩《夜校・如月》。') : G.flags.trueEnd ? _L('（澄香在等的那個人……把日記交給她試試看。）') : _L('（第三章，妃姬子問妳的那個問題……換一個回答，也許會不一樣。）');
  e.querySelector('p').innerHTML = _L`${ENDINGS[k][1]}<br><br>已收集結局 ${got.length} / 3<br><small>${hint}</small>`;
  e.classList.remove('hide');
  try { localStorage.removeItem(SAVE_KEY); } catch (er) { }
  stat('ending', k);
  if (TEST) document.title = 'END ' + JSON.stringify(stateSummary());
}

/* ---------- 包一層：接進掛勾 ---------- */
TRIG.push(
  { scene: 5, id: 'p1In', when: () => onP1(P.x, P.y), run: async () => { await says([_L('第一月台。'), _L('月台的邊緣，一排黑色的人影面向軌道站著，一動也不動。'), _L('……他們在等車。')]); } },
  { scene: 5, id: 'p2In', when: () => onP2(P.x, P.y) || (P.x > 21.5 && P.x < 24 && P.y > 13.5), run: async () => { await says([_L('……軌道上有東西在爬。'), _L('「テケ……テケ……」'), _L('（聲音變大的時候，要躲起來。）')]); } },
  { scene: 5, id: 'trueEnd5', when: () => G.flags.gaveDiary && G.flags.trueEnd && onP2(P.x, P.y) && dist(P.x, P.y, SUMI.x, SUMI.y) < 2.6, run: () => endTrue() },
);
const _sceneUpdate4 = sceneUpdate;
sceneUpdate = function (dt) {
  if (G.scene !== 5) return _sceneUpdate4(dt);
  paxUpdate(dt); tkUpdate(dt);
  if (TRAIN2.v) TRAIN2.x += TRAIN2.v * dt;
  const tl = LIGHTS.find(l => l.id === 'tunnelLamp'); if (tl) tl.r = Math.sin(G.t * 3) > 0 ? 1.8 : .6;
  if (A.ctx && !['gone'].includes(TK.state)) {   // 「テケテケ」：越近越快越大聲
    const d = dist(TK.x, TK.y, P.x, P.y);
    G.tkTick = (G.tkTick || 0) - dt;
    if (d < 13 && G.tkTick <= 0) { const k = 1 - d / 13; noise(.05, .05 + k * .2, 'bandpass', 1800, 3); noise(.05, .04 + k * .16, 'bandpass', 1400, 3, 0, .11); G.tkTick = TK.state === 'chase' ? .28 : .9 - k * .5; }
    if (d < 6 && TK.state === 'chase') { G.tkHeart = (G.tkHeart || 0) - dt; if (G.tkHeart <= 0) { sfx.heart(.3); G.tkHeart = .5; } }
  }
};
// 躲起來的瞬間，如果她正在看著 → 她知道你躲在哪
const _hide4 = hide;
hide = function (o) { if (G.scene === 5) TK.sawHide = TK.state === 'chase' && dist(TK.x, TK.y, P.x, P.y) < 3; return _hide4(o); };
const _sceneAction4 = sceneAction;
sceneAction = async function (o) { if (G.scene === 5) return ch4Action(o); return _sceneAction4(o); };
const _useDoor4 = useDoor;
useDoor = async function (dr) {
  if (G.scene === 5 && dr.key === 'ticket') { sfx.locked(); await says([dr.msg, _L('（旁邊的車掌一直看著這邊。）')]); return; }
  return _useDoor4(dr);
};
const _sceneSprites4 = sceneSprites;
sceneSprites = function (list) {
  if (G.scene !== 5) return _sceneSprites4(list);
  for (const p of PAX) list.push({ d: p.x + p.y, f: () => drawSprite(IMG[p.img], p.x, p.y, p.dir, p.moving ? p.frame : 0, { alpha: .92 }) });
  if (TK.state !== 'gone') list.push({ d: TK.x + TK.y, f: () => drawSprite(IMG.teke, TK.x, TK.y, TK.dir, TK.moving ? TK.frame : 0, { jit: TK.state === 'chase' ? (Math.random() - .5) * 2 : 0, noShadow: TK.y < 15.9 }) });
  if (SUMI.at === 'p2' && !G.flags.sumiGone) list.push({ d: SUMI.x + SUMI.y, f: () => drawSprite(IMG.sumika, SUMI.x, SUMI.y, 4, 0, { sc: MI_SC }) });
  if (G.flags.hkShow && IMG.hikiko) list.push({ d: 9.5 + 17.6, f: () => drawSprite(IMG.hikiko, 9.5, 17.6, 6, 0, { alpha: .9 }) });
  if (TRAIN2.x > -30) list.push({ d: 18.5, f: () => drawTrain(TRAIN2.x, TRACK2, true) });   // 在第二月台的人前面先畫
};
const _sceneHUD4 = sceneHUD;
sceneHUD = function (s) { _sceneHUD4(s); if (G.scene === 5 && (G.inv.pages || []).length === 7 && !G.flags.gaveDiary) s.push(_L`<div class="s">交換日記 7 / 7</div>`); };
const _sceneOnLoad4 = sceneOnLoad;
sceneOnLoad = function (cp) { if (G.scene !== 5) return _sceneOnLoad4(cp); ch4Reset(); G.flags.ending = 0; G.flags.hkShow = 0; };
const _gameOver4 = gameOver;
gameOver = function () { _gameOver4(); if (G.scene === 5) $('#overTx').textContent = _L('「下一站——如月。下一站——如月。」'); };
// 第三章結束 → 往下走到車站；第三章的回答存起來（章節選擇直接進終章時用）
const _ch3End4 = ch3End;
ch3End = function () { if (!TEST) try { localStorage.setItem(TRUE_KEY, G.flags.trueEnd ? '1' : '0'); } catch (e) { } return startCh4(); };

/* ---------- 繪製 ---------- */
function drawTrain(hx, ty, lit) {   // 車頭在 hx，往 +x 延伸 14 格（兩節）
  for (let i = 0; i < 14; i++) {
    const x = hx + i; if (x < -1 || x > 40) continue;
    box(x, ty - .45, 1, .9, 34, lit ? '#6d7486' : '#3c404b', lit ? '#4c5262' : '#2a2d35', lit ? '#565c6d' : '#30333b');
    if (i % 7 !== 6) faceRect(Math.floor(x), Math.floor(ty - .45), 'L', (x % 1) + .15, (x % 1) + .85, 16, 27, lit ? '#f6dc95' : '#1a1c22');
  }
}
const _sceneDrawObj4 = sceneDrawObj;
sceneDrawObj = function (o, cx, cy, shaking) {
  const { x, y } = o;
  switch (o.t) {
    case 'train':   // 停著的列車：每格畫一段；車門那兩格門是開的
      box(x, y + .15, 1, .9, 36, '#5a5f6c', '#3a3e48', '#42464f');
      faceRect(x, y, 'L', 0, 1, 8, 11, '#8a2f37');                     // 紅色腰帶
      if (o.act) faceRect(x, y, 'L', .2, .8, 0, 29, '#0b0c10');        // 開著的車門
      else faceRect(x, y, 'L', .12, .88, 15, 28, (x % 3) ? '#3b3f2e' : '#4a4630');   // 車窗（裡面是昏黃的燈）
      if (x === 4 || x === 18) faceRect(x, y, 'L', x === 4 ? 0 : .9, x === 4 ? .1 : 1, 0, 36, '#2a2d34');
      break;
    case 'stsign':
      ctx.fillStyle = '#2a2a2e'; ctx.fillRect(cx - 1, cy - 30, 2, 30); ctx.fillRect(cx + 9, cy - 30, 2, 30);
      ctx.fillStyle = '#e8e6de'; ctx.fillRect(cx - 4, cy - 42, 18, 12); ctx.fillStyle = '#222'; ctx.fillRect(cx - 1, cy - 38, 12, 3); ctx.fillStyle = '#2f6a3c'; ctx.fillRect(cx - 4, cy - 31, 18, 2);
      break;
    case 'plist': box(x + .1, y + .05, .8, .12, 4, '#3a2c20', null, null); faceRect(x, y, 'L', .1, .9, 12, 36, '#d8d2c0'); for (let k = 0; k < 6; k++) faceRect(x, y, 'L', .18, .82, 15 + k * 3.4, 16 + k * 3.4, k === 5 ? '#8a1c1c' : '#5a554a'); break;
    case 'notice': faceRect(x, y, 'L', .15, .85, 14, 34, '#e6dfb6'); faceRect(x, y, 'L', .15, .85, 31, 34, '#b03030'); for (let k = 0; k < 4; k++) faceRect(x, y, 'L', .22, .78, 17 + k * 3, 18 + k * 3, '#6a6050'); break;
    case 'ticketm': box(x + .15, y + .2, .7, .6, 30, '#5f6f7d', '#46525d', '#3c4650'); faceRect(x, y, 'L', .3, .7, 16, 24, '#9fd2c8'); break;
    case 'conductor': if (IMG.conductor) drawSprite(IMG.conductor, x + .5, y + .5, 4, 0); break;
    case 'sumika': if (!o.hidden5 && IMG.sumika) drawSprite(IMG.sumika, x + .5, y + .5, 4, 0, { sc: MI_SC }); break;
    case 'tunnel':   // 隧道口：石砌拱門＋黑洞
      box(x + .1, y - 1, .9, 2.6, 46, '#55524c', '#3e3c38', '#36342f');
      faceRect(x, y + 1, 'R', .15, .85, 0, 34, '#050506'); faceRect(x, y, 'R', .15, .85, 0, 34, '#050506');
      break;
    default: return _sceneDrawObj4(o, cx, cy, shaking);
  }
};
// 物件換位置後（澄香去第二月台）的互動判定
const _nearest4 = nearestInteract;
nearestInteract = function () {
  const n = _nearest4();
  if (G.scene === 5 && n && n.kind === 'obj' && n.o.t === 'sumika' && n.o.hidden5) return null;
  if (G.scene === 5 && !n && SUMI.at === 'p2' && !G.flags.sumiGone && dist(P.x, P.y, SUMI.x, SUMI.y) < 1.3) return { kind: 'obj', o: { act: 'sumika', t: 'sumika2' }, label: _L('跟澄香說話') };
  return n;
};

/* ---------- 自動測試（?test=ch4[&end=bad|tunnel]）：閘口→第一月台→天橋→第二月台→結局 ---------- */
async function testCh4() {
  const tp = (x, y) => { P.x = x; P.y = y; };
  const want = Q.get('end') || 'true';
  try {
    G.inv.pages = [1, 2, 3, 4, 5, 6, 7]; G.inv.mirror = true; G.inv.flashlight = true; G.inv.phone = true; G.flags.trueEnd = want === 'true';
    await startCh4(); await waitFree();
    if (G.scene !== 5) throw 'not in scene 5';
    P.inv = 9999;
    TEST_CHOICE = o => Math.max(0, o.findIndex(t => /定期票|交給她|上車|一個人走進隧道|校後/.test(t)));
    tp(33.5, 5.6); P.dir = 0; await interact(); await waitFree();
    if (want === 'true' && !G.flags.gaveDiary) throw 'diary';
    tp(27.5, 5.5); P.dir = 1; await interact(); await waitFree();
    if (DOORS['26,5'].locked) throw 'gate';
    // 黑影乘客：手電筒照過去要被跟上
    tp(16.5, 9.4); P.light = true; P.dir = 4; await wait(200);
    if (!PAX.some(p => p.state === 'follow')) throw 'pax not provoked';
    P.light = false; PAX.forEach(p => Object.assign(p, { x: p.hx, y: p.hy, state: 'wait' }));
    if (want === 'bad') { tp(7.5, 11.4); P.dir = 4; await interact(); }
    else {
      tp(22.5, 13.5); await wait(100); await waitFree();
      if (want === 'tunnel') { TK.state = 'gone'; tp(56.5, 18.5); P.dir = 6; await interact(); }
      else { TK.state = 'track'; tp(13.5, 16.6); }
    }
    let t0 = performance.now(); while (G.mode === 'play' && performance.now() - t0 < 25000) await wait(100);
    document.title = (G.mode === 'end' && G.flags.endKind === want ? 'PASS ' : 'FAIL ') + JSON.stringify(stateSummary());
  } catch (e) { document.title = 'ERR ' + e + ' ' + JSON.stringify(stateSummary()); }
}
