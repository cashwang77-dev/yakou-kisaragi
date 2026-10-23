/* 夜校・如月　第三章：舊校舍與妃姬子（場景 4）
   前庭 → 舊校舍玄關 → 走廊（舊二年B班、宿直室、理科準備室）→ 地下書庫
   妃姬子拖著麻袋在走廊巡行：被抓到會被拖回玄關；靠近時用鏡子碎片照她，她會退開（鏡子要等霧氣散了才能再用）。
   宿直室的值班日誌 → 舊二年B班的失物招領箱拿鑰匙 → 地下書庫：用鏡子讓她看見自己、拿回第 7 頁，回答「澄香還在等我嗎？」
   跟 ch2b.js 一樣用「包一層」接進掛勾。 */

const ROOM4 = {
  yard: [15, 31, 24, 37], genkan: [14, 25, 25, 29], hall: [2, 20, 37, 22],
  old2b: [3, 12, 12, 18], shuku: [15, 12, 22, 18], prep: [25, 12, 34, 18], archive: [27, 24, 37, 36],
};
const in4 = (r, x, y) => { const [x0, y0, x1, y1] = ROOM4[r]; return x >= x0 && x < x1 + 1 && y >= y0 && y < y1 + 1; };
const HK_PATROL = [[4.5, 21], [18.5, 21], [35.5, 21], [29.5, 15.5], [29.5, 21], [18.5, 15], [18.5, 21], [8.5, 15], [8.5, 21]];
const HK = { x: 35.5, y: 21, dir: 2, state: 'off', wp: 0, frame: 0, animD: 0, path: null, timer: 0, r: .27 };
const HK_SEAT = [32.5, 31.5], GENKAN_SPOT = [19.5, 27.5];
const MIRROR_CD = 10;   // 鏡子用過後要等幾秒
Object.assign(HIDE, { oldshelf: '擠進書架縫隙' });
SCENE_PATROL[4] = [[19.5, 35.5]];   // 裂口女不進舊校舍
SCENES[4] = buildCh3;

function buildCh3() {
  const room = (r, c) => { const [x0, y0, x1, y1] = ROOM4[r]; for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) if (at(x, y) === 'X') put(x, y, '#'); fill(x0, y0, x1, y1, c); };
  room('yard', '.'); fill(19, 31, 20, 37, ',');
  room('genkan', ':'); room('hall', ':');
  for (const r of ['old2b', 'shuku', 'prep', 'archive']) room(r, '_');
  for (const [x, y] of [[19, 23], [20, 23], [19, 24], [20, 24]]) put(x, y, ':');   // 玄關 → 走廊
  door(19, 30, {}); door(20, 30, {});
  door(8, 19, { sign: '2-B' }); door(18, 19, { sign: '宿直室' }); door(29, 19, { sign: '理科準備室' });
  door(34, 23, { locked: true, key: 'archkey', sign: '地下書庫', msg: '往地下書庫的門。門上掛著生鏽的大鎖，鎖孔是新的刮痕。' });
  // 玄關
  for (const x of [15, 16, 23, 24]) obj('shoe', x, 25, x === 16 ? { act: 'oldshoe', label: '看看鞋箱' } : {});
  obj('cabinet', 14, 29); obj('cabinet', 25, 29);
  // 走廊
  for (const x of [5, 6, 13, 26, 27]) obj('locker', x, 22);
  obj('cabinet', 23, 20); obj('cabinet', 37, 20);
  // 舊二年B班
  for (const x of [4, 6, 8, 10]) for (const y of [14, 16]) {
    if (x === 6 && y === 16) obj('hdesk', x, y, { act: 'hdesk', label: '看這張課桌' });
    else if (x === 10 && y === 14) obj('sdesk', x, y, { act: 'sdesk', label: '看靠窗的課桌' });
    else obj('desk', x, y);
  }
  obj('tdesk', 7, 12); obj('lostbox', 12, 18, { act: 'lostbox', label: '翻失物招領箱' });
  // 宿直室
  obj('bed', 15, 13); obj('dutylog', 20, 12, { act: 'dutylog', label: '看值班日誌' }); obj('keyrack', 22, 14, { act: 'keyrack', label: '看鑰匙櫃' }); obj('cabinet', 22, 17);
  // 理科準備室
  obj('photo', 29, 12, { act: 'photo', label: '看牆上的合照' });
  for (const x of [25, 26, 33, 34]) obj('oldshelf', x, 12);
  obj('labtable', 27, 15); obj('labtable', 31, 15);
  // 地下書庫：書架排成三列，中間留一條走道
  for (const y of [27, 30, 33]) for (let x = 28; x <= 36; x++) if (x !== 32) obj('oldshelf', x, y);
  // 光源
  LIGHTS.push({ x: 19.5, y: 27, r: 2.4, c: '150,170,220' }, { x: 20.5, y: 13, r: 2.2, c: '255,200,120' }, { x: 2.6, y: 21.4, r: 1.6, c: '90,255,140' });
  LIGHTS.push({ x: HK_SEAT[0], y: HK_SEAT[1] - 1, r: 2.8, c: '255,190,110', id: 'bulb' }, { x: 0, y: 0, r: 0, c: '230,240,255', id: 'mflash' });
  item('can', 11, 21, '空罐'); item('can', 30, 17, '空罐'); item('can', 24, 27, '空罐');
  item('bandage', 21, 21, '繃帶'); item('charm', 17, 21, '護身符'); item('drink', 18, 27, '能量飲料');   // 加在最後：舊存檔的道具順序不變
  item('ext', 30, 21, '滅火器'); item('shinai', 5, 13, '竹刀');
}

/* ---------- 開場（第二章結束後接過來） ---------- */
async function startCh3() {
  markReach(4);   // 解鎖章節選擇
  await card('card_gate', ['校園後面的舊校舍，窗戶全用木板釘死了。', '只有一扇窗，亮著昏黃的燈。', '……門口的地上，有一道長長的拖痕。']);
  loadScene(4);
  Object.assign(P, { x: 19.5, y: 35.5, dir: 0, hidden: null, crouch: false, pose: null });
  GH.active = false; Object.assign(HK, { x: 35.5, y: 21, state: 'off', wp: 0, path: null });
  chapter('第三章', '舊校舍與妃姬子');
  saveCP('ch3');
  await wait(TEST ? 10 : 1600);
  await phoneCall(['我是瑪莉。', '我現在……在舊校舍的玄關。', '她拖著的那個袋子，好重哦。']);
  setObj('走進舊校舍');
}

/* ---------- 第 7 頁 ---------- */
PAGE_TEXT[7] = ['2004．2．□', '今晚 4:44，地下書庫的那扇門會打開。', '門的另一邊，是一個地圖上沒有的車站——「如月」。', '澄香，我來接你了。', '（日期的地方，被水暈開了）'];

/* ---------- 互動 ---------- */
async function ch3Action(o) {
  const I = G.inv, F = G.flags;
  switch (o.act) {
    case 'oldshoe': await says(['舊校舍的鞋箱。名牌褪色得幾乎看不清楚。', '只有兩格的字還留著——「妃姬子」「澄香」。', '……兩格並排在一起。']); return;
    case 'dutylog':
      F.dutylog = true;
      await says([['值班日誌（2004）', '2月□日　舊校舍又有人跑進去了。是二年B班那個常被欺負的女生。'], ['值班日誌（2004）', '2月□日　她說她在等朋友。我把地下書庫的鑰匙收走，丟進她們班的失物招領箱。'],
        ['值班日誌（2004）', '2月□日　凌晨 4:44，地下書庫的燈自己亮了。'], '……之後的頁面，全是空白。']);
      if (!I.archkey) setObj('去舊二年B班找失物招領箱'); saveCP('dutylog'); return;
    case 'keyrack': await says(['鑰匙櫃。每個掛勾下面都貼著名條。', '「地下書庫」那一格，是空的。']); return;
    case 'hdesk': await says(['桌面被美工刀刻滿了字。「去死」「噁心」「沒人要你」……', '抽屜裡塞著一本被撕掉封面的筆記本。', '……是交換日記。跟我手上這本，是同一本。']); return;
    case 'sdesk': await says(['靠窗的位子。桌上放著一朵乾掉的花。', '桌角用很小的字寫著：「剩下的部分，等你教我彈」']); return;
    case 'lostbox':
      if (I.archkey) { await says(['失物招領箱。生鏽的鑰匙已經拿走了。']); return; }
      I.archkey = true; sfx.pick(); updateHUD(); toast('得到【地下書庫的鑰匙】');
      await says(['失物招領箱。褪色的髮夾、一隻手套、寫著名字的直笛……', F.dutylog ? '箱底壓著一把生鏽的鑰匙，名條寫著「地下書庫」。' : '箱底壓著一把生鏽的鑰匙，名條寫著「地下書庫」。……為什麼會在這裡？']);
      setObj('打開走廊盡頭的地下書庫'); saveCP('archkey');   // 先改目標再存檔
      await wait(TEST ? 10 : 700);
      await phoneCall(['我是瑪莉。', '我現在……在地下書庫的門口。', '她在下面等你哦。']); return;
    case 'photo': await says(['牆上掛著一張合照。「2004 年度　二年B班」。', '照片裡有兩個女生的臉，被人用指甲刮掉了。', '……刮痕旁邊，有人用紅筆圈起第三個人。', '那是——我。']); sfx.sting(); shake = 5; return;
  }
  return false;
}

/* ---------- 門（地下書庫的鑰匙） ---------- */
const _useDoor3 = useDoor;
useDoor = async function (dr) {
  if (G.scene === 4 && dr.key === 'archkey') {
    if (G.inv.archkey) { dr.locked = false; G.flags.archOpen = true; sfx.door(); toast('用生鏽的鑰匙打開了地下書庫'); setObj('走下地下書庫'); saveCP('archOpen'); return; }
    sfx.locked(); await says([dr.msg, G.flags.dutylog ? '……鑰匙在舊二年B班的失物招領箱。' : '……要鑰匙。']); return;
  }
  return _useDoor3(dr);
};

/* ---------- 妃姬子 ---------- */
function hkSees() {
  if (P.hidden || G.mode !== 'play' || pInvis()) return false;
  const d = dist(HK.x, HK.y, P.x, P.y);
  let range = 5 + (P.light ? 2.5 : 0); if (P.crouch) range *= .6;
  if (d > range) return false;
  if (d > 1.2) { const [fx, fy] = DIRV[HK.dir]; if (fx * (P.x - HK.x) / d + fy * (P.y - HK.y) / d < .4) return false; }
  return los(HK.x, HK.y, P.x, P.y);
}
function hkFar() {   // 離玩家最遠的巡邏點
  return HK_PATROL.map((w, i) => [dist(w[0], w[1], P.x, P.y), i]).sort((a, b) => b[0] - a[0])[0][1];
}
function hkUpdate(dt) {
  HK.moving = false;
  if (['off', 'seat'].includes(HK.state) || HK.dragging) return;
  const d = dist(HK.x, HK.y, P.x, P.y);
  if (HK.state === 'recoil') {   // 被鏡子照到：往反方向退開
    HK.timer -= dt;
    const ax = HK.x - P.x, ay = HK.y - P.y, am = Math.hypot(ax, ay) || 1;
    walker(HK, HK.x + ax / am * 2, HK.y + ay / am * 2, 1.8, dt); HK.dir = dirFromWorld(-ax, -ay);
    if (HK.timer <= 0) { HK.state = 'patrol'; HK.wp = hkFar(); HK.path = null; }
    return;
  }
  const sees = hkSees();
  if (sees && HK.state !== 'chase') { HK.state = 'chase'; HK.path = null; sfx.sting(); toast('她抬起頭了——！'); }
  for (const n of G.noises) if (G.t - n.t < .05 && dist(n.x, n.y, HK.x, HK.y) < n.r + 1 && HK.state !== 'chase') { HK.state = 'investigate'; HK.target = [n.x, n.y]; HK.path = null; }
  switch (HK.state) {
    case 'patrol': { const w = HK_PATROL[HK.wp]; if (walker(HK, w[0], w[1], 1.1, dt)) HK.wp = (HK.wp + 1) % HK_PATROL.length; break; }
    case 'investigate': if (walker(HK, HK.target[0], HK.target[1], 1.6, dt)) { HK.state = 'search'; HK.timer = 3; } break;
    case 'search': HK.timer -= dt; if (HK.timer % 1 < dt) HK.dir = (HK.dir + 2) % 8; if (HK.timer <= 0) { HK.state = 'patrol'; HK.path = null; } break;
    case 'chase':
      if (sees) { HK.last = [P.x, P.y]; walker(HK, P.x, P.y, 2.7, dt); }
      else if (HK.last && walker(HK, HK.last[0], HK.last[1], 2.7, dt)) { HK.state = 'search'; HK.timer = 3.5; }
      break;
  }
  // 抓到：一般情況碰到就抓；正在追的時候躲進去也會被拖出來
  if (P.inv <= 0 && !G.lock && ((d < .65 && !P.hidden) || (P.hidden && HK.state === 'chase' && d < 1.3))) hkDrag();
}
async function hkDrag() {
  HK.dragging = true; P.hidden = null; P.light = false;
  sfx.sting(); shake = 12; damage(1);
  if (G.mode !== 'play') { HK.dragging = false; return; }   // 心用完了 → gameOver
  await says(['冰冷的手抓住了腳踝——', '整個人被拖著，在走廊的地板上滑過去……', '（……回過神來，又躺在玄關了。）']);
  P.x = GENKAN_SPOT[0]; P.y = GENKAN_SPOT[1]; P.inv = 3;
  const far = hkFar(); Object.assign(HK, { x: HK_PATROL[far][0], y: HK_PATROL[far][1], wp: far, state: 'patrol', path: null, dragging: false });
}
// 鏡子：她在附近、看得到她的時候，「調查」變成「舉起鏡子」
const mirrorReady = () => G.scene === 4 && G.inv.mirror && G.t - (G.flags.mirrorT ?? -99) > MIRROR_CD;
const hkMirrorable = () => mirrorReady() && !['off', 'seat', 'recoil'].includes(HK.state) && !HK.dragging && dist(HK.x, HK.y, P.x, P.y) < 3.5 && los(P.x, P.y, HK.x, HK.y);
function mirrorFlash() {
  G.flags.mirrorT = G.t; G.mflash = NOW();
  HK.state = 'recoil'; HK.timer = 5; HK.path = null;
  sfx.sting(); tone(1800, .5, 'sine', .05, 900); shake = 4;
  toast('她看見鏡子裡的自己——退開了！');
}
const _nearest3 = nearestInteract;
nearestInteract = function () {
  if (!P.hidden && hkMirrorable()) return { kind: 'mirror', label: '舉起鏡子' };
  return _nearest3();
};
const _interact3 = interact;
interact = async function () {
  if (!P.hidden && hkMirrorable()) return mirrorFlash();
  return _interact3();
};

/* ---------- 最後：地下書庫 ---------- */
async function ch3Final() {
  const F = G.flags, name = '妃姬子';
  Object.assign(HK, { x: HK_SEAT[0], y: HK_SEAT[1], dir: 4, state: 'seat', path: null });
  await says(['地下書庫。書架之間只有一顆燈泡亮著。', '……她站在走道中間，低著頭。', '腳邊放著那個麻袋。']);
  while (true) {
    const a = await choose(name, '「…………回去。」', ['舉起鏡子', '轉身逃跑'], 0);
    if (a === 0) break;
    sfx.sting(); shake = 10; damage(1);
    if (G.mode !== 'play') return;
    await says(['樓梯的門，自己關上了。', '冰冷的手抓住了肩膀，把人拖回燈泡底下——', '（……逃不掉。）']);
  }
  G.mflash = NOW(); sfx.sting();
  await says(['把鏡子舉到她面前。', '鏡子裡映出來的，是一個穿著乾淨制服的女生。', '……她在哭。',
    [name, '「……這是，我？」'], [name, '「我一直在這裡等。等那扇門打開。等 4:44 的那班車。」'],
    [name, '「可是門一直沒開。我好怕，所以把大家的東西，全部裝進袋子裡。」'], [name, '「……這個，是你的吧。」'], '她解開麻袋的繩子，拿出一張摺起來的紙。']);
  await getPage(7);
  const b = await choose(name, '「……澄香，還在等我嗎？」', ['「她還在等。」', '「……她早就不在了。」', '（什麼都說不出口）'], 0);
  F.trueEnd = b === 0;
  if (F.trueEnd) {
    await says([[name, '「……是嗎。」'], '她第一次抬起頭。頭髮後面，是一張很普通的、哭紅了眼睛的臉。', [name, '「那我們一起去。」'], [name, '「4:44 的末班車……要來了。」'],
      '遠遠地，傳來電車進站的聲音。', '——從校門外，那條沒有盡頭的路的另一邊。']);
  } else {
    await says([[name, '「……是嗎。」'], '她慢慢低下頭，頭髮遮住了臉。', [name, '「那我，就再等一下。」'], '燈泡熄了。等眼睛習慣黑暗的時候，她已經不見了。', '……只剩下麻袋，和遠方隱約的電車聲。']);
  }
  tone(70, 2.4, 'sawtooth', .05, 55); noise(2.2, .12, 'lowpass', 400, .7);
  await wait(TEST ? 10 : 1200);
  ch3End();
}
function ch3End() {
  G.mode = 'end'; $('#hud').classList.add('hide'); $('#touch').classList.add('hide');
  const e = $('#end'); e.querySelector('h2').textContent = '第三章　完';
  e.querySelector('p').innerHTML = '交換日記　7 / 7<br>' + (G.flags.trueEnd ? '「那我們一起去。」<br>' : '她說，她要再等一下。<br>（換一個回答，也許會不一樣）<br>') + '終章「如月車站」製作中。';
  e.classList.remove('hide');
  try { localStorage.removeItem(SAVE_KEY); } catch (er) { }
  if (TEST) document.title = 'END ' + JSON.stringify(stateSummary());
}

/* ---------- 包一層：把場景 4 接進掛勾 ---------- */
TRIG.push(
  { scene: 4, id: 'oldIn', when: () => in4('genkan', P.x, P.y) && P.y < 28.5, run: async () => {
    await says(['舊校舍的玄關。木頭地板每走一步都在叫。', '……走廊那頭，傳來「沙……沙……」的聲音。', '有什麼東西，被拖著走。']);
    Object.assign(HK, { x: 35.5, y: 21, wp: 0, state: 'patrol', path: null });
    setObj('找到地下書庫的鑰匙（宿直室、舊二年B班）');
    await says(['（被她抓到會被拖走。拿鏡子照她，她會退開——鏡子起霧的時候不能用。）']);
  } },
  { scene: 4, id: 'old2bIn', when: () => in4('old2b', P.x, P.y), run: async () => { await says(['二年B班……2004 年的。', '黑板上還留著那天的日期。值日生的欄位寫著——「澄香」。']); } },
  { scene: 4, id: 'archIn', when: () => in4('archive', P.x, P.y) && P.y > 25.5, run: () => ch3Final() },
);
const _sceneUpdate3 = sceneUpdate;
sceneUpdate = function (dt) {
  if (G.scene !== 4) return _sceneUpdate3(dt);
  hkUpdate(dt);
  const mf = LIGHTS.find(l => l.id === 'mflash');
  if (mf) { const k = 1 - (NOW() - (G.mflash || -9)) / .5; mf.x = P.x; mf.y = P.y; mf.r = k > 0 ? 4.5 * k : 0; }
  const bulb = LIGHTS.find(l => l.id === 'bulb'); if (bulb) bulb.r = 2.6 + (Math.random() < .04 ? -1.5 : 0);
  if (A.ctx && !['off', 'seat'].includes(HK.state)) {
    const d = dist(HK.x, HK.y, P.x, P.y);
    G.hkScrape = (G.hkScrape || 0) - dt;
    if (HK.moving && d < 14 && G.hkScrape <= 0) { noise(.45, .03 + .12 * Math.max(0, 1 - d / 14), 'lowpass', 320, .8); G.hkScrape = .9; }   // 麻袋刮地
    G.hkHeart = (G.hkHeart || 0) - dt;
    if (d < 8 && G.hkHeart <= 0) { const k = 1 - d / 8; sfx.heart(.12 + k * .25); G.hkHeart = 1.1 - k * .6; }
  }
};
const _sceneAction3 = sceneAction;
sceneAction = async function (o) { if (G.scene === 4) return ch3Action(o); return _sceneAction3(o); };
const _sceneSprites3 = sceneSprites;
sceneSprites = function (list) {
  if (G.scene !== 4) return _sceneSprites3(list);
  if (IMG.hikiko && HK.state !== 'off') list.push({ d: HK.x + HK.y, f: () => drawSprite(IMG.hikiko, HK.x, HK.y, HK.dir, HK.moving ? HK.frame : 0, { lean: HK.state === 'chase' ? .14 : 0, jit: HK.state === 'recoil' ? (Math.random() - .5) * 2 : HK.state === 'chase' ? (Math.random() - .5) : 0, alpha: HK.state === 'recoil' ? .7 : 1 }) });
};
const _sceneHUD3 = sceneHUD;
sceneHUD = function (s) {
  _sceneHUD3(s);
  if (G.scene !== 4) return;
  if (G.inv.archkey) s.push(`<div class="s">地下書庫的鑰匙</div>`);
  if (G.inv.mirror && !mirrorReady()) s.push(`<div class="s">鏡子起霧中…</div>`);
};
const _sceneOnLoad3 = sceneOnLoad;
sceneOnLoad = function (cp) {
  if (G.scene !== 4) return _sceneOnLoad3(cp);
  const far = hkFar();
  Object.assign(HK, { x: HK_PATROL[far][0], y: HK_PATROL[far][1], wp: far, path: null, dragging: false, state: G.triggers.oldIn ? 'patrol' : 'off' });
  if (G.inv.archkey && G.flags.archOpen) DOORS['34,23'].locked = false;
  G.flags.mirrorT = -99;
};
// 第二章結束 → 直接走向舊校舍
ch2bEnd = function () { return startCh3(); };

/* ---------- 新物件的繪製 ---------- */
const _sceneDrawObj3 = sceneDrawObj;
sceneDrawObj = function (o, cx, cy, shaking) {
  const { x, y } = o;
  switch (o.t) {
    case 'hdesk': case 'sdesk':
      box(x + .2, y + .25, .6, .5, 11, o.t === 'hdesk' ? '#5a4a36' : '#6a553b', '#3b2f22', '#33291d'); box(x + .3, y + .8, .4, .3, 7, '#4f4032', '#33291e', '#2b2219');
      if (o.t === 'hdesk') { ctx.fillStyle = '#2a1e14'; for (let k = 0; k < 4; k++) ctx.fillRect(cx - 6 + k * 3, cy - 13 + (k % 2), 2, 1); }
      else { ctx.fillStyle = '#8a6a70'; ctx.fillRect(cx - 1, cy - 14, 3, 2); }
      break;
    case 'lostbox': box(x + .2, y + .25, .6, .5, 9, '#7a6a4a', '#55492f', '#4a4029'); break;
    case 'dutylog': box(x + .1, y + .2, .8, .6, 13, '#5c4733', '#3f3124', '#352a1f'); ctx.fillStyle = '#d8d0b8'; ctx.fillRect(cx - 3, cy - 16, 6, 3); break;
    case 'keyrack': box(x + .1, y + .2, .8, .6, 30, '#5a4a38', '#3e3326', '#352c20'); for (let k = 0; k < 4; k++) { ctx.fillStyle = k === 2 ? '#2a221a' : '#b8a060'; ctx.fillRect(cx - 6 + k * 4, cy - 22, 2, 3); } break;
    case 'photo': box(x + .1, y + .05, .8, .15, 4, '#3a2c20', '#2a2018', '#241b14'); ctx.fillStyle = '#9a9488'; ctx.fillRect(cx - 9, cy - 40, 18, 11); ctx.fillStyle = '#5a1d1d'; ctx.fillRect(cx + 3, cy - 37, 3, 3); break;
    case 'oldshelf': box(x + .05, y + .2, .9, .6, 34, '#4a3a2a', '#33281c', '#2b2218'); for (let k = 0; k < 3; k++) faceRect(x, y, 'L', .1, .9, 8 + k * 9, 9 + k * 9, '#221a12'); break;
    default: return _sceneDrawObj3(o, cx, cy, shaking);
  }
};

/* ---------- 自動測試（?test=ch3）：進玄關→鏡子逼退→日誌→鑰匙→地下書庫→真結局 ---------- */
async function testCh3() {
  const tp = (x, y) => { P.x = x; P.y = y; };
  try {
    G.inv.pages = [1, 2, 3, 4, 5, 6]; G.inv.mirror = true;
    await startCh3(); await waitFree();
    if (G.scene !== 4) throw 'not in scene 4';
    P.inv = 9999;
    tp(19.5, 27.5); await wait(60); await waitFree();
    if (HK.state !== 'patrol') throw 'hk not patrolling';
    // 鏡子：她在面前 2 格
    Object.assign(HK, { x: 19.5, y: 21.2, state: 'patrol', path: null }); tp(19.5, 23.4); P.dir = 0;
    if (nearestInteract().kind !== 'mirror') throw 'no mirror prompt';
    await interact(); if (HK.state !== 'recoil') throw 'mirror';
    HK.state = 'off';
    tp(20.5, 13.6); P.dir = 0; await interact(); await waitFree();
    if (!G.flags.dutylog) throw 'dutylog';
    if (typeof testOldWing === 'function') await testOldWing(); else { tp(11.5, 18.5); P.dir = 6; await interact(); await waitFree(); }
    if (!G.inv.archkey) throw 'key';
    tp(34.5, 22.4); P.dir = 4; await interact(); await waitFree();
    if (DOORS['34,23'].locked) throw 'arch door';
    TEST_CHOICE = o => Math.max(0, o.findIndex(t => /舉起鏡子|她還在等/.test(t)));
    tp(32.5, 25); await wait(50); tp(32.5, 26.2); await wait(80);
    let t0 = performance.now(); while (G.mode === 'play' && G.scene === 4 && performance.now() - t0 < 20000) await wait(100);
    document.title = ((G.mode === 'end' || G.scene >= 5) && G.inv.pages.length === 7 && G.flags.trueEnd ? 'PASS ' : 'FAIL ') + JSON.stringify(stateSummary());
  } catch (e) { document.title = 'ERR ' + e + ' ' + JSON.stringify(stateSummary()); }
}
