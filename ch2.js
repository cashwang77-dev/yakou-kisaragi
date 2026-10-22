/* 夜校・如月　第二章（上）：校舍一樓
   保健室（安全屋、怪談筆記、存檔）→ 教職員室（假死魔靈子的內線電話，日記第 2 頁＋鑰匙串）
   → 中庭（二宮像的台座、借書單）→ 圖書室（二宮像在讀書，換書拿日記第 1 頁）
   原創怪談：多出來的課桌（每次回到 2-B 都多一張）。裂口女在走廊巡邏。
   靠 game.js 的場景掛勾運作：SCENES、SCENE_PATROL、TRIG（scene:2）、sceneAction／sceneDrawObj／sceneUpdate／sceneSprites／sceneHUD／sceneOnLoad／sceneWallDeco／sceneSafe */

const ROOM2 = {
  staff: [2, 2, 11, 8], nurse: [13, 2, 18, 8], c2b: [20, 2, 27, 8],
  hall: [2, 10, 37, 12], genkan: [2, 14, 6, 25], court: [8, 14, 21, 25], stairs: [23, 14, 25, 18], lib: [27, 14, 37, 25],
};
const inRoom = (r, x, y) => { const [x0, y0, x1, y1] = ROOM2[r]; return x >= x0 && x < x1 + 1 && y >= y0 && y < y1 + 1; };
const NM_SEAT = [35.5, 20.5], NM_COUNTER = [34.5, 16.5];
const NM = { x: NM_SEAT[0], y: NM_SEAT[1], dir: 4, state: 'read', frame: 0, animD: 0, path: null, timer: 0 };

SCENE_PATROL[2] = [[36.5, 11.5], [27.5, 11.5], [19.5, 11.5], [11.5, 11.5], [3.5, 11.5], [4.5, 18.5], [3.5, 11.5], [15.5, 11.5], [30.5, 11.5]];
SCENES[2] = buildCh2;

function buildCh2() {
  // 每個房間自己圍一圈牆（沒用到的地方留空，不會變成一大塊實心牆）
  const room = (r, c) => { const [x0, y0, x1, y1] = ROOM2[r]; for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) if (at(x, y) === 'X') put(x, y, '#'); fill(x0, y0, x1, y1, c); };
  room('staff', '_'); room('nurse', '_'); room('c2b', '_'); room('hall', ':');
  room('genkan', ':'); room('court', '.'); room('stairs', ':'); room('lib', '_');
  fill(14, 14, 15, 25, ','); fill(8, 19, 21, 20, ',');   // 中庭步道
  put(3, 13, ':'); put(4, 13, ':');                       // 走廊 → 玄關的開口
  door(7, 9, { sign: '職員室' }); door(15, 9, { sign: '保健室' }); door(23, 9, { sign: '2-B' });
  door(31, 13, { locked: true, key: 'staffkeys', sign: '圖書室', msg: '圖書室。門鎖著……裡面傳來翻書的聲音。' });
  door(14, 13, {}); door(24, 13, {});
  door(3, 26, { locked: true, chain: true, msg: 'chain' }); door(4, 26, { locked: true, chain: true, msg: 'chain' });
  // 教職員室
  for (const x of [3, 5, 7, 9]) for (const y of [4, 6]) obj('desk', x, y);
  obj('cabinet', 2, 2); obj('cabinet', 3, 2);
  obj('phone2', 11, 3, { act: 'staffphone', label: '看看內線電話' });
  obj('plaque', 7, 2, { act: 'history', label: '看校史年表' });
  // 保健室（安全屋）
  obj('bed', 14, 3); obj('bed', 16, 3);
  obj('medcab', 18, 2, { act: 'rest', label: '在保健室休息（存檔）' });
  obj('ndesk', 17, 7, { act: 'notebook', label: '看桌上的筆記本' });
  // 2-B（多出來的課桌：visit 次數增加時 deskExtra() 動態加桌子）
  for (const x of [21, 23, 25]) for (const y of [4, 6]) obj('desk', x, y);
  obj('tdesk', 23, 2);
  // 走廊
  for (const x of [9, 10, 28, 29]) obj('locker', x, 12);
  obj('cabinet', 19, 10); obj('cabinet', 35, 10);
  // 玄關
  for (const x of [2, 3, 5, 6]) obj('shoe', x, 17, { act: 'shoe2', label: '看看鞋箱' });
  for (const x of [2, 3, 5, 6]) obj('shoe', x, 21, { act: 'shoe2', label: '看看鞋箱' });
  obj('floormap', 2, 23, { act: 'floormap', label: '看牆上的平面圖' });   // 掛在玄關左牆上
  // 中庭
  obj('pedestal', 11, 16, { act: 'pedestal', label: '調查台座' });
  [[9, 23], [19, 15], [20, 23], [9, 15]].forEach(([x, y]) => obj('bush', x, y));
  obj('trash', 17, 24); obj('lamp', 12, 21);
  // 樓梯（被桌椅堵住）
  obj('barricade', 23, 15); obj('barricade', 24, 15, { act: 'barricade', label: '調查樓梯' }); obj('barricade', 25, 15);
  // 圖書室
  for (const y of [17, 20, 23]) for (let x = 28; x <= 32; x++) obj('shelf', x, y, x === 28 && y === 23 ? { act: 'bookshelf', label: '看看窗邊第三排的書架' } : {});
  for (let x = 34; x <= 36; x++) obj('counter', x, 15, x === 35 ? { act: 'counter', label: '櫃台' } : {});
  obj('rdesk', 35, 21);
  // 光源
  LIGHTS.push({ x: 2.6, y: 11.4, r: 1.7, c: '90,255,140' }, { x: 37.4, y: 11.4, r: 1.7, c: '90,255,140' });
  LIGHTS.push({ x: 15.5, y: 5.5, r: 3.4, c: '255,230,190' });        // 保健室的燈還亮著
  LIGHTS.push({ x: 35.5, y: 21.2, r: 2.6, c: '255,200,130' });       // 二宮的檯燈
  LIGHTS.push({ x: 35.5, y: 15.8, r: 2.4, c: '255,215,150' });       // 櫃台的檯燈
  LIGHTS.push({ x: 12.5, y: 21.5, r: 3.6, c: '255,190,120' });       // 中庭路燈
  LIGHTS.push({ x: 4, y: 24.5, r: 2, c: '150,170,230' });             // 玄關玻璃門透進的月光
  // 道具
  item('bandage', 18, 5, '繃帶');
  item('lid', 16, 24, '垃圾桶蓋');
  item('broom', 26, 7, '掃把');
  item('can', 21, 11, '空罐'); item('can', 33, 12, '空罐'); item('can', 4, 15, '空罐');
  item('drink', 22, 11, '能量飲料'); item('charm', 5, 24, '護身符');   // 加在最後：舊存檔的道具順序不變
  item('ext', 12, 11, '滅火器'); item('eraser', 24, 5, '板擦');
}

/* ---------- 開場 ---------- */
async function startCh2() {
  markReach(2);   // 解鎖章節選擇
  await card('card_hall', ['……鞋箱前面，一個人都沒有。', '只有咪醬的室內鞋，整整齊齊地擺在走廊正中間。', '玄關的門被鐵鍊纏死了。外面的雨聲，聽起來好遠。']);
  loadScene(2);
  Object.assign(P, { x: 4.5, y: 23.2, dir: 0, hidden: null, crouch: false, pose: null });
  GH.active = false; Object.assign(NM, { x: NM_SEAT[0], y: NM_SEAT[1], dir: 4, state: 'read', path: null });
  G.flags.c2b = 0;
  chapter('第二章', '七大不思議（上）');
  saveCP('ch2');
  await wait(TEST ? 10 : 1600);
  await says(['回不去了……', '……手機在震動。']);
  await phoneCall(['我是瑪莉。', '我現在……在保健室。', '那裡很亮哦。']);
  await says(['……保健室在哪裡？', '玄關的牆上，好像掛著一張平面圖。']);
  setObj('去走廊另一頭的保健室看看');
}

/* ---------- 互動 ---------- */
const PAGE_TEXT = {
  1: ['2004．2．□', '澄香已經三天沒來學校了。大家說她離家出走。', '可是我知道。她最後傳給我的訊息是——', '「我下了一個地圖上沒有的車站。」'],
  2: ['圖書室最裡面的那本書說：', '湊齊七大不思議，就能打開通往「另一個月台」的門。', '我要去接她回來。', '不管她們再怎麼對我。'],
};
async function getPage(n) {
  if (!G.inv.pages) G.inv.pages = [];
  if (!G.inv.pages.includes(n)) G.inv.pages.push(n);
  sfx.pick(); updateHUD(); toast(`得到【交換日記　第 ${n} 頁】`);
  await says(PAGE_TEXT[n].map(t => ['交換日記', t]));
  if (n === 1) await says(['……交換日記？寫的人叫「妃姬子」。', '澄香……黑板上那個值日生的名字。']);
  else if (n === 2) await says(['……交換日記？寫的人叫「妃姬子」。', '七大不思議……所以這間學校的怪談，都是「門」？']);
}
async function sceneAction(o) {
  const I = G.inv;
  switch (o.act) {
    case 'notebook':
      G.flags.notebook = true;
      await says([['怪談筆記', '（字跡很工整，像是值班老師寫的）'],
        ['怪談筆記', '【教職員室的內線電話】半夜響起時，接起來的是「假死魔靈子」。她會出三道題。'],
        ['怪談筆記', '問到她的名字，要回答「假面的假、死人的死、惡魔的魔」。答錯的人，會被拿走身體的一部分。'],
        ['怪談筆記', '【二宮金次郎像】半夜會去圖書室借書。在圖書室裡要保持安靜——蹲著走，別用燈照他。'],
        ['怪談筆記', '他想借的書，台座上的借書單會寫。把書放在櫃台，他就會放下手上那本。'],
        '……謝謝你，不知道是誰的老師。']);
      if (!G.flags.quiz) setObj('到教職員室，接那通內線電話');
      updateHUD(); return;
    case 'rest':
      if (G.hearts < 5) G.hearts = Math.min(5, G.hearts + 2);
      saveCP('nurse'); sfx.click(); updateHUD();
      await says(['在病床邊坐了一下。保健室的燈很暖。', '（已存檔。這裡鬼不會進來）']);
      return;
    case 'floormap': G.flags.sawMap = true; return showFloorMap();
    case 'staffphone': return staffPhone();
    case 'history':
      await says([['校史年表', '1962　創校。　1980　新校舍落成。'], ['校史年表', '2004　（這一行被白色修正液塗掉了，底下透出「二月」兩個字）'], ['校史年表', '2005　舊校舍封閉。']]);
      return;
    case 'shoe2': await says(['鞋箱。名牌一格一格都是空白的。', '只有一格寫著「澄香」，裡面放著一封沒拆的信，收件人是「妃姬子」。']); return;
    case 'pedestal':
      G.flags.slip = true;
      await says(['空的台座。銅牌上寫著「勤勉」。', '台座下面壓著一張圖書館的借書單——', ['借書單', '借閱人：二宮金次郎　　書名：《報德記》'], ['借書單', '備註：請歸還至圖書室　窗邊第三排'], '……他想借的，是這本？']);
      return;
    case 'barricade':
      await says(['往二樓的樓梯，被桌子和椅子堆得滿滿的。', '……桌腳上綁著好幾條跳繩，像是故意不讓人上去，也不讓上面的東西下來。']);
      return;
    case 'bookshelf':
      if (I.book || G.flags.bookPlaced) { await says(['窗邊第三排。《報德記》本來在的位置，空了一格。']); return; }
      I.book = true; sfx.pick(); updateHUD(); toast('得到【《報德記》】');
      await says(['窗邊第三排……有了，《報德記》。', '書很舊，借書卡上最後一個借閱人是「妃姬子」，日期 2004 年 2 月。']);
      setObj('把《報德記》放在櫃台上（別吵到他）');
      return;
    case 'counter':
      if (G.flags.bookPlaced) { await says(['櫃台上的《報德記》被翻開了。']); return; }
      if (!I.book) { await says(['圖書室的櫃台。還書箱裡塞滿了泛黃的書。']); return; }
      I.book = false; G.flags.bookPlaced = true; updateHUD(); sfx.click();
      await says(['（輕輕把《報德記》放在櫃台上……）']);
      NM.state = 'toCounter'; NM.path = null;
      setObj('趁他看新書的時候，拿走他放下的那本');
      return;
    case 'mydesk':
      await says(['最後一張課桌。桌面上用美工刀刻著字——', '「咪醬」', '……是我的名字。刀痕還很新。']);
      sfx.sting(); shake = 5; return;
  }
  return false;
}
// 假死魔靈子：內線電話三道題，全對拿日記第 2 頁＋鑰匙串；答錯受傷，可重打
async function staffPhone() {
  if (G.flags.quiz) { await says(['電話安安靜靜的。話筒還有一點溫溫的。']); return; }
  sfx.ring(); await wait(TEST ? 10 : 700); sfx.ring();
  await says(['內線電話……響了。', '（拿起話筒）']);
  const V = '電話裡的聲音';
  await says([[V, '……你好。我是靈子。'], [V, '三個問題。答對了，我就給你東西。答錯了……我就拿走你的東西。']]);
  const qs = [
    ['第一題。這間學校的時鐘，停在幾點？', ['12:00', '4:44', '2:22', '6:06'], 1],
    ['第二題。明天的值日生，是誰？', ['咪醬', '花子', '澄香', '妃姬子'], 2],
    ['最後一題。……我的名字，怎麼寫？', ['花子的花、子孫的子', '假面的假、死人的死、惡魔的魔', '靈魂的靈、孩子的子'], 1],
  ];
  for (const [q, opts, ok] of qs) {
    const i = await choose(V, q, opts, 12000);
    if (i !== ok) {
      sfx.hurt(); damage(1); setPose('hurt', .8);
      await says([[V, '……答錯了。'], '右手突然好重……像是有什麼被拿走了。', '（電話斷了。要再打一次嗎……）']);
      return;
    }
  }
  G.flags.quiz = true; G.inv.staffkeys = true; updateHUD();
  await says([[V, '……全對。好久沒有人答對了。'], [V, '抽屜裡的東西，給你。'], [V, '那孩子……也是這樣一題一題答完，才去了圖書室的。'], '（嘟——）']);
  sfx.pick(); toast('得到【鑰匙串】');
  await getPage(2);
  setObj(G.flags.slip ? '用鑰匙打開圖書室' : '用鑰匙打開圖書室（先去中庭看看台座？）'); saveCP('quiz');   // 先改目標再存檔
  await phoneCall(['我是瑪莉。', '我現在……在圖書室門口。', '裡面有人在看書。要安靜哦。']);
}

/* ---------- 門（鑰匙串） ---------- */
const _useDoor = useDoor;
useDoor = async function (dr) {
  if (G.scene === 2 && dr.key === 'staffkeys') {
    if (G.inv.staffkeys) { dr.locked = false; sfx.door(); toast('用鑰匙串打開了圖書室'); return; }
    sfx.locked(); await says([dr.msg, '……要鑰匙。教職員室應該有。']); return;
  }
  return _useDoor(dr);
};

/* ---------- 多出來的課桌 ---------- */
const EXTRA_DESKS = [[22, 5], [24, 5], [26, 5]];
function deskExtra(n) {
  for (let k = 0; k < Math.min(n, 3); k++) {
    const [x, y] = EXTRA_DESKS[k], key = x + ',' + y;
    if (OBJAT[key]) continue;
    const o = obj('desk', x, y, k === 2 ? { act: 'mydesk', label: '看看最後一張課桌' } : {}); OBJAT[key] = o;
  }
}
TRIG.push(
  { scene: 2, id: 'nurseIn', when: () => inRoom('nurse', P.x, P.y), run: async () => { await says(['保健室的燈是亮的。暖暖的。', '……在這裡，好像就不會被找到。']); if (!G.flags.notebook) setObj('看看保健室桌上的筆記本'); } },
  { scene: 2, id: 'ghostIn', when: () => G.triggers.nurseIn && !inRoom('nurse', P.x, P.y) && inRoom('hall', P.x, P.y), run: async () => {
    spawnGhost(36.5, 11.5); GH.wp = 0; sfx.snip();
    await says(['……喀嚓。', '走廊盡頭，傳來剪刀的聲音。她也進來了。']);
  } },
  { scene: 2, id: 'libIn', when: () => inRoom('lib', P.x, P.y), run: async () => { await says(['……圖書室裡有一盞檯燈亮著。', '檯燈下面，二宮金次郎像坐在那裡看書。', '（要安靜——蹲著走，別用手電筒照他）']); } },
);
// 2-B：每「重新走進來」一次，課桌就多一張
function c2bWatch() {
  const inside = inRoom('c2b', P.x, P.y);
  if (inside && !G.flags.in2b) {
    G.flags.in2b = true; G.flags.c2b = (G.flags.c2b || 0) + 1;
    const n = G.flags.c2b;
    if (n >= 2) deskExtra(n - 1);
    const lines = { 1: ['二年B班。……跟剛剛在另一棟看到的，一模一樣。', '黑板上寫著明天的值日生：「澄香」。'], 2: ['……桌子，是不是多了一張？'], 3: ['又多了一張。', '剛剛明明數過的……'], 4: ['最後一排，多了一張全新的課桌。'] }[Math.min(n, 4)];
    if (lines) says(lines);
    if (n >= 4) setTimeout(() => { sfx.sting(); }, 300);
  } else if (!inside) G.flags.in2b = false;
}

/* ---------- 二宮金次郎像 ---------- */
function nmWalk(tx, ty, speed, dt) {
  if (!NM.path || NM.pathFor !== Math.floor(tx) + ',' + Math.floor(ty)) { NM.path = findPath(NM.x, NM.y, tx, ty) || []; NM.pathFor = Math.floor(tx) + ',' + Math.floor(ty); }
  let tgt = NM.path[0]; if (!tgt || NM.path.length === 1) tgt = [tx, ty];
  const dx = tgt[0] - NM.x, dy = tgt[1] - NM.y, d = Math.hypot(dx, dy);
  if (d < .12) { if (NM.path.length) NM.path.shift(); return dist(NM.x, NM.y, tx, ty) < .3; }
  const s = Math.min(d, speed * dt); moveEnt(NM, dx / d * s, dy / d * s);
  NM.dir = dirFromWorld(dx, dy); NM.moving = true; NM.animD += s; NM.frame = Math.floor(NM.animD / .4) % 4;
  NM.step = (NM.step || 0) + s; if (NM.step > .7) { NM.step = 0; if (dist(NM.x, NM.y, P.x, P.y) < 9) sfx.step(true, .22, 0); }   // 石頭的腳步聲，比較重
  return false;
}
function nmNotice() {   // 回傳：注意到玩家的位置，或 null
  if (!inRoom('lib', P.x, P.y) || P.hidden || pInvis()) return null;
  const d = dist(NM.x, NM.y, P.x, P.y);
  if (P.light && d < 6.5) {   // 被手電筒照到
    const [fx, fy] = DIRV[P.dir], vx = (NM.x - P.x) / d, vy = (NM.y - P.y) / d;
    if (fx * vx + fy * vy > .8) return [P.x, P.y];
  }
  if (P.moving && !P.crouch && d < (P.run ? 9 : 4.2)) return [P.x, P.y];
  return null;
}
function sceneUpdate(dt) {
  if (G.scene !== 2) return;
  c2bWatch();
  NM.moving = false;
  const heard = G.noises.find(n => G.t - n.t < .05 && inRoom('lib', n.x, n.y) && dist(n.x, n.y, NM.x, NM.y) < n.r + 2);
  switch (NM.state) {
    case 'read': case 'counterRead': {
      NM.dir = NM.state === 'read' ? 4 : 2;
      const seen = NM.state === 'read' ? nmNotice() : (P.run && inRoom('lib', P.x, P.y) ? [P.x, P.y] : null);
      if (seen || (heard && NM.state === 'read')) {
        NM.state = 'hunt'; NM.target = seen || [heard.x, heard.y]; NM.path = null; NM.timer = 0;
        sfx.sting(); toast('……他抬起頭了！');
      }
      break;
    }
    case 'hunt': {
      const seen = nmNotice(); if (seen) NM.target = seen;
      if (!inRoom('lib', NM.target[0], NM.target[1])) { NM.state = 'return'; NM.path = null; break; }
      const arrived = nmWalk(NM.target[0], NM.target[1], 1.9, dt);
      if (dist(NM.x, NM.y, P.x, P.y) < .75 && !P.hidden && P.inv <= 0) { nmHit(); break; }
      if (arrived) { NM.timer += dt; NM.dir = (NM.dir + (NM.timer % 1 < dt ? 2 : 0)) % 8; if (NM.timer > 3) { NM.state = 'return'; NM.path = null; } }
      break;
    }
    case 'return': {
      const home = G.flags.bookPlaced ? NM_COUNTER : NM_SEAT;
      if (nmNotice()) { NM.state = 'hunt'; NM.target = [P.x, P.y]; NM.path = null; NM.timer = 0; break; }
      if (nmWalk(home[0], home[1], 1.4, dt)) NM.state = G.flags.bookPlaced ? 'counterRead' : 'read';
      break;
    }
    case 'toCounter': {
      if (nmWalk(NM_COUNTER[0], NM_COUNTER[1], 1.3, dt)) {
        NM.state = 'counterRead';
        if (!G.flags.page1Drop) { G.flags.page1Drop = true; item('page1', 36, 21, '交換日記'); toast('……他放下了原本那本書，拿起《報德記》。'); }
      }
      break;
    }
  }
}
async function nmHit() {
  NM.state = 'return'; NM.path = null;
  sfx.hit(); shake = 10; damage(1); setPose('hurt', .8); P.inv = 2;
  const [fx, fy] = DIRV[NM.dir]; for (let k = 0; k < 8; k++) moveEnt(P, fx * .15, fy * .15);
  await says(['石頭的手，冷冰冰地抓住了手臂——', '「……安靜。」', '（被甩開了。好痛……）']);
}
function sceneSprites(list) {
  if (G.scene !== 2 || !IMG.ninomiya_walk) return;
  list.push({ d: NM.x + NM.y, f: () => drawSprite(IMG.ninomiya_walk, NM.x, NM.y, NM.dir, NM.moving ? NM.frame : 0, { jit: NM.state === 'hunt' ? (Math.random() - .5) : 0 }) });
}
// 保健室是安全屋：裂口女看不到也抓不到
function sceneSafe(x, y) { return G.scene === 2 && inRoom('nurse', x, y); }

/* ---------- 撿道具：日記第 1 頁 ---------- */
const _takeItem = takeItem;
takeItem = async function (it) {
  if (it.id === 'page1') { it.taken = true; await getPage(1); saveCP('page1'); return ch2Check(); }
  return _takeItem(it);
};
async function ch2Check() {   // 圖書室要鑰匙串（電話問答才拿得到），所以拿到第 1 頁時第 2 頁一定已經有了
  const p = G.inv.pages || [];
  if (!(p.includes(1) && p.includes(2))) return;
  await wait(TEST ? 10 : 900);
  await phoneCall(['我是瑪莉。', '我現在……在樓梯上面。', '二樓的門，打開了哦。']);
  sfx.thunder(); shake = 12;
  await says(['樓梯那邊傳來好大的聲響——', '堆在樓梯上的桌椅，被人從上面推倒了。', '……二樓有東西在等我。']);
  ch2End();
}
function ch2End() {
  G.mode = 'end'; $('#hud').classList.add('hide'); $('#touch').classList.add('hide');
  const e = $('#end'); e.querySelector('h2').textContent = '第二章（上）　完';
  e.querySelector('p').innerHTML = '交換日記　2 / 7<br>二樓的花子、哭泣的肖像、人體模型……<br>第二章（下）製作中。';
  e.classList.remove('hide');
  try { localStorage.removeItem(SAVE_KEY); } catch (er) { }
  if (TEST) document.title = 'END ' + JSON.stringify(stateSummary());
}

/* ---------- HUD、存讀檔 ---------- */
function sceneHUD(s) {
  const I = G.inv;
  if (I.pages && I.pages.length) s.push(`<div class="s">交換日記<em>${I.pages.length} / 7</em></div>`);
  if (I.staffkeys) s.push(`<div class="s">鑰匙串</div>`);
  if (I.book) s.push(`<div class="s">《報德記》</div>`);
}
function sceneOnLoad(cp) {
  Object.assign(NM, { x: NM_SEAT[0], y: NM_SEAT[1], dir: 4, state: G.flags.bookPlaced ? 'return' : 'read', path: null });
  if (G.flags.c2b > 3) deskExtra(3); else if (G.flags.c2b > 1) deskExtra(G.flags.c2b - 1);
  G.flags.in2b = false;
  if (G.triggers.ghostIn) { spawnGhost(36.5, 11.5); GH.wp = 0; }
  if (G.flags.page1Drop && !ITEMS.some(i => i.id === 'page1')) { item('page1', 36, 21, '交換日記'); if ((G.inv.pages || []).includes(1)) ITEMS.at(-1).taken = true; }
}

/* ---------- 玄關的平面圖：斜角投影跟遊戲畫面同方向，紅點是現在位置 ---------- */
const MAP2_LABEL = { staff: '教職員室', nurse: '保健室', c2b: '2年B組', hall: '走廊', genkan: '玄關', court: '中庭', stairs: '樓梯', lib: '圖書室' };
function showFloorMap(R = ROOM2, L = MAP2_LABEL, title = '校舍一樓　平面圖', mark = 'nurse', markTx = '在這裡哦', note = '※ 二樓以上請由中央樓梯') {
  return new Promise(res => {
    G.lock++; sfx.click();
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:9;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;pointer-events:auto';
    const cv = document.createElement('canvas'), W = Math.min(innerWidth * .97, 1100), H = Math.min(innerHeight * .95, W / 1.6), dpr = devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.cssText = `width:${W}px;height:${H}px;box-shadow:0 0 30px #000`;
    ov.appendChild(cv); document.body.appendChild(ov);
    const g = cv.getContext('2d'); g.scale(dpr, dpr);
    // 舊紙＋框
    g.fillStyle = '#3a2f24'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#d9d0b8'; g.fillRect(W * .02, H * .035, W * .96, H * .93);
    g.fillStyle = 'rgba(120,95,60,.1)'; for (let i = 0; i < 30; i++) { g.beginPath(); g.arc((i * 137) % W, (i * 89) % H, 8 + (i * 7) % 30, 0, 7); g.fill(); }
    // 斜角投影（跟遊戲同方向）
    const pr = (x, y) => [x - y, (x + y) / 2], rs = Object.values(R);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const [a, b, c, d] of rs) for (const [x, y] of [[a, b], [c + 1, b], [c + 1, d + 2], [a, d + 2]]) { const [u, v] = pr(x, y); x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, v); y1 = Math.max(y1, v); }
    const k = Math.min(W * .86 / (x1 - x0), H * .74 / (y1 - y0)), ox = W / 2 - (x0 + x1) / 2 * k, oy = H * .17 - y0 * k;
    const P2 = (x, y) => { const [u, v] = pr(x, y); return [ox + u * k, oy + v * k]; };
    const quad = (a, b, c, d, fill, line) => { g.beginPath(); [[a, b], [c, b], [c, d], [a, d]].forEach(([x, y], i) => { const [sx, sy] = P2(x, y); i ? g.lineTo(sx, sy) : g.moveTo(sx, sy); }); g.closePath(); g.fillStyle = fill; g.fill(); if (line) { g.strokeStyle = line; g.lineWidth = 2; g.stroke(); } };
    for (const [r, [a, b, c, d]] of Object.entries(R)) quad(a, b, c + 1, d + 1, r === 'hall' || r === 'genkan' || r === 'landing' ? '#ece5d0' : r === 'court' ? '#c9d0b0' : '#f3eedf', '#4a3f33');
    for (const dr of Object.values(DOORS)) quad(dr.x + .1, dr.y + .1, dr.x + .9, dr.y + .9, dr.chain ? '#7a2a2a' : '#f3eedf', null);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const fs = Math.max(13, Math.min(W / 48, H / 26));
    for (const [r, [a, b, c, d]] of Object.entries(R)) { const here = P.x >= a && P.x < c + 1 && P.y >= b && P.y < d + 1, [sx, sy0] = P2((a + c + 1) / 2, (b + d + 1) / 2), sy = sy0 + (here ? fs * 1.3 : 0); g.fillStyle = '#2a241d';   // 現在所在的房間：名稱往下挪，讓出紅點的位置
      g.font = `600 ${fs}px "Noto Serif TC",serif`; g.fillText(L[r], sx, sy); }
    // 不知道是誰用紅筆圈起來的保健室
    if (mark) { const [a, b, c, d] = R[mark], [sx, sy] = P2((a + c + 1) / 2, (b + d + 1) / 2); g.strokeStyle = 'rgba(180,20,20,.85)'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(sx, sy, fs * 3.4, fs * 1.5, -.12, .3, 6.5); g.stroke(); g.fillStyle = 'rgba(170,20,20,.9)'; g.font = `${fs * .9}px "Noto Serif TC",serif`; g.fillText(markTx, sx + fs * 3.6, sy - fs * 1.8); }
    // 標題、現在地、方位
    g.fillStyle = '#2a241d'; g.font = `900 ${fs * 1.5}px "Noto Serif TC",serif`; g.textAlign = 'left'; g.fillText(title, W * .05, H * .1);
    const [px, py] = P2(P.x, P.y); g.fillStyle = '#c81e1e'; g.beginPath(); g.arc(px, py, fs * .45, 0, 7); g.fill();
    g.font = `700 ${fs}px "Noto Serif TC",serif`; g.textAlign = 'center'; g.strokeStyle = '#efe7d2'; g.lineWidth = 4; g.strokeText('現在地', px, py - fs * 1.1); g.fillText('現在地', px, py - fs * 1.1);   // 寫在紅點上方，不壓到房間名
    g.fillStyle = '#5a5045'; g.font = `${fs * .8}px "Noto Serif TC",serif`; g.textAlign = 'right'; g.fillText(note + '　　（點擊關閉）', W * .96, H * .93);
    const close = () => { if (!ov.parentNode) return; ov.remove(); advanceFn = null; G.lock--; res(); };
    advanceFn = close; ov.addEventListener('click', close);
    if (TEST && TEST !== 'shot') setTimeout(close, 30);
  });
}

/* ---------- 牆面裝飾：門牌 ---------- */
function sceneWallDeco(x, y, L) {
  const dr = DOORS[(x + 1) + ',' + y];
  if (L && dr && dr.sign) faceRect(x, y, 'L', .3, 1, 27, 32, '#c9c2ae');
}

/* ---------- 新物件的繪製 ---------- */
function sceneDrawObj(o, cx, cy, shaking) {
  const { x, y } = o;
  switch (o.t) {
    case 'shelf': {
      box(x + .05, y + .2, .9, .6, 36, '#5a4330', '#3e2e20', '#35271b');
      const cols = ['#7a3b2e', '#2f4f6a', '#6b6a3a', '#4a2f4f', '#8a6a3a'];
      for (let k = 0; k < 4; k++) for (let b = 0; b < 5; b++) faceRect(x, y, 'L', .08 + b * .17, .22 + b * .17, 4 + k * 8, 10 + k * 8, cols[(x * 3 + y + k + b) % 5]);
      if (o.act && !G.flags.bookPlaced && !G.inv.book) faceRect(x, y, 'L', .4, .55, 12, 18, '#c8b27a');   // 那本《報德記》
      break;
    }
    case 'counter': {   // 借還書櫃台：淺色木頭、加高，中間那格有檯燈和「借還書」牌子（10/22 使用者反映找不到）
      box(x, y + .2, 1, .6, 22, '#a7835a', '#7c5f3e', '#6b5234'); box(x, y + .2, 1, .08, 24, '#c39a68', '#8d6b45', null);
      if (o.act) {
        faceRect(x, y, 'L', .25, .75, 9, 17, '#e6dcc0'); faceRect(x, y, 'L', .3, .7, 11, 15, '#7a2f2a');   // 牌子
        ctx.fillStyle = '#2e2a24'; ctx.fillRect(cx + 5, cy - 34, 1, 9); ctx.fillStyle = '#d8b25a'; ctx.fillRect(cx + 2, cy - 36, 7, 3); ctx.fillStyle = '#fff2c0'; ctx.fillRect(cx + 3, cy - 33, 5, 1);   // 檯燈
        if (G.flags.bookPlaced) { ctx.fillStyle = '#c8b27a'; ctx.fillRect(cx - 4, cy - 26, 8, 3); }
      }
      break;
    }
    case 'rdesk': box(x + .1, y + .2, .8, .6, 12, '#6a5038', '#4a3826', '#3e2f20'); ctx.fillStyle = '#ffe0a0'; ctx.fillRect(cx + 5, cy - 22, 4, 3); ctx.fillStyle = '#3a3a3a'; ctx.fillRect(cx + 6, cy - 19, 1, 6); break;
    case 'bed': box(x + .05, y + .1, .9, .8, 10 + shaking, '#d8d6d0', '#a9a7a1', '#96948e'); box(x + .05, y + .1, .9, .2, 26, '#cfd6d2', '#9fb0a8', null); break;
    case 'medcab': box(x + .1, y + .2, .8, .6, 30, '#d0d4d2', '#a6aaa8', '#8f9391'); faceRect(x, y, 'L', .4, .6, 20, 24, '#b83232'); faceRect(x, y, 'L', .47, .53, 18, 26, '#b83232'); break;
    case 'ndesk': box(x + .1, y + .2, .8, .6, 12, '#7a6650', '#55473a', '#493d32'); ctx.fillStyle = '#e8e2d0'; ctx.fillRect(cx - 4, cy - 15, 7, 4); break;
    case 'phone2': box(x + .2, y + .25, .6, .5, 12, '#5a4632', '#3e3022', '#33281c'); ctx.fillStyle = '#d8d4c8'; ctx.fillRect(cx - 3, cy - 17, 7, 3); if (!G.flags.quiz && Math.sin(G.t * 9) > .3) { ctx.fillStyle = '#ff4444'; ctx.fillRect(cx + 3, cy - 17, 2, 1); } break;
    case 'plaque': box(x + .1, y + .1, .8, .3, 26, '#4a4038', '#352d27', '#2c2520'); faceRect(x, y, 'L', .2, .8, 10, 22, '#c9c2ae'); break;
    case 'cabinet': box(x + .1, y + .2, .8, .6, 32, '#6d7378', '#4f5559', '#444a4e'); ctx.fillStyle = '#2a2e31'; ctx.fillRect(cx - 1, cy - 28, 1, 24); break;
    case 'pedestal': box(x + .15, y + .15, .7, .7, 12, '#6c6a64', '#4a4843', '#403e3a'); ctx.fillStyle = '#e8e0c8'; ctx.fillRect(cx - 2, cy - 14, 5, 2); break;
    case 'floormap': {   // 畫在左牆面上：木框、紙、幾塊房間色塊
      faceRect(x - 1, y, 'R', .08, .92, 12, 34, '#4a3a2a'); faceRect(x - 1, y, 'R', .14, .86, 14, 32, '#d9d0b8');
      faceRect(x - 1, y, 'R', .2, .45, 24, 30, '#a99c80'); faceRect(x - 1, y, 'R', .52, .8, 24, 30, '#a99c80'); faceRect(x - 1, y, 'R', .2, .8, 19, 22, '#a99c80');
      if (!G.flags[G.scene === 3 ? 'sawMap3' : 'sawMap'] && Math.sin(G.t * 4) > 0) faceRect(x - 1, y, 'R', .6, .66, 26, 28, '#ff3030');
      break;
    }
    case 'barricade': box(x + .05, y + .1, .9, .8, 18, '#5a4632', '#3e3022', '#33281c'); box(x + .25, y + .3, .5, .4, 12, '#6a553b', '#3b2f22', '#33291d', 18); break;
  }
}

/* ---------- 自動測試（?test=ch2）：保健室筆記 → 電話三題 → 台座 → 圖書室換書 → 第 1 頁 → 結束 ---------- */
async function testCh2() {
  const tp = (x, y) => { P.x = x; P.y = y; };
  try {
    await startCh2(); await waitFree();
    if (G.scene !== 2) throw 'not in ch2';
    tp(2.9, 23.5); P.dir = 6; await interact(); await waitFree();
    if (!G.flags.sawMap || G.lock) throw 'floormap';
    tp(15.5, 7.2); await wait(60); await waitFree();
    tp(16.6, 6.6); P.dir = 5; await interact(); await waitFree();
    if (!G.flags.notebook) throw 'notebook';
    GH.active = false;
    TEST_CHOICE = o => Math.max(0, o.findIndex(t => /4:44|澄香|假面/.test(t)));
    tp(10.6, 3.5); await interact(); await waitFree(); await waitFree();
    if (!G.inv.staffkeys) throw 'quiz';
    GH.active = false;
    tp(11.5, 17.2); await interact(); await waitFree();
    tp(31.5, 12.4); await interact(); await waitFree();
    if (DOORS['31,13'].locked) throw 'lib door';
    tp(31.5, 14.6); await wait(60); await waitFree();
    P.crouch = true;
    tp(28.5, 22.3); await interact(); await waitFree();
    if (!G.inv.book) throw 'book';
    tp(35.5, 16.2); P.dir = 0; await interact(); await waitFree();
    if (!G.flags.bookPlaced) throw 'counter';
    const t0 = performance.now(); while (!ITEMS.some(i => i.id === 'page1') && performance.now() - t0 < 30000) await wait(100);
    const pg = ITEMS.find(i => i.id === 'page1'); if (!pg) throw 'page1 not dropped';
    tp(pg.x, pg.y - .4); await interact(); await waitFree();
    const t1 = performance.now(); while (G.mode === 'play' && G.scene === 2 && performance.now() - t1 < 20000) await wait(100);
    document.title = ((G.mode === 'end' || G.scene === 3) && (G.inv.pages || []).length === 2 ? 'PASS ' : 'FAIL ') + JSON.stringify(stateSummary());
  } catch (e) { document.title = 'ERR ' + e + ' ' + JSON.stringify(stateSummary()); }
}
// ?test=ch2load：第二章存檔 → 回到第一章 → 讀檔，應該回到第二章且物件、道具正確
async function testCh2Load() {
  try {
    await startCh2(); await waitFree();
    G.flags.c2b = 3; G.inv.pages = [2]; G.inv.staffkeys = true; saveCP('t');
    resetWorld(); if (G.scene !== 1) throw 'reset';
    loadCP(G.cp);
    const ok = G.scene === 2 && OBJAT['11,16'] && OBJAT['11,16'].t === 'pedestal' && OBJAT['24,5'] && G.inv.pages.length === 1 && NM.state === 'read';
    document.title = (ok ? 'PASS ' : 'FAIL ') + JSON.stringify(stateSummary());
  } catch (e) { document.title = 'ERR ' + e; }
}
