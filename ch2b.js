/* 夜校・如月　第二章（下）：校舍樓上（場景 3）
   音樂教室（哭泣的貝多芬：眼睛發光時別被看到，照黑板的譜彈「月光」→ 第 4 頁）
   生物教室（人體模型在走廊巡邏；找回心臟、肺、胃放回標本台 → 第 5 頁）
   視聽教室（電視一台台亮起，在她爬出來前關掉；全關後廣播室開 → 4:44 放學廣播、第 6 頁）
   三樓女廁（敲第三間、回答花子 → 第 3 頁；慢半拍的鏡子 → 鏡子碎片）
   ch2.js 已經定義了 sceneXxx 掛勾，這裡用「包一層」的方式接上場景 3（不能重複宣告同名函式）。 */

const ROOM3 = {
  music: [2, 2, 11, 8], bio: [13, 2, 21, 8], av: [23, 2, 31, 8], bc: [33, 2, 37, 8],
  hall: [2, 10, 37, 12], landing: [2, 14, 6, 19], stair3: [34, 14, 37, 15], wc: [26, 17, 37, 24],
};
const in3 = (r, x, y) => { const [x0, y0, x1, y1] = ROOM3[r]; return x >= x0 && x < x1 + 1 && y >= y0 && y < y1 + 1; };
const AM_PATROL = [[18.5, 5.5], [17.5, 10.5], [30.5, 11.5], [36.5, 11.5], [24.5, 11.5], [10.5, 11.5], [3.5, 11.5], [12.5, 11.5], [17.5, 10.5]];
const AM = { x: 18.5, y: 5.5, dir: 4, state: 'patrol', wp: 0, frame: 0, animD: 0, path: null, timer: 0, r: .27 };
const NOTES = ['C', 'C#', 'D', 'E', 'F', 'G', 'G#', 'A', 'B'], MOON = ['G#', 'C#', 'E'];   // 音名用英文（使用者要求，原本是日文ドレミ）
const TVS = [];   // { o, state:'idle'|'on'|'off', t }
Object.assign(HIDE, { curtain: '躲到窗簾後', labtable: '躲到實驗桌下', specshelf: '擠進標本架之間' });
SCENE_PATROL[3] = [[18.5, 11.5]];   // 裂口女不上樓
SCENES[3] = buildCh2b;

function buildCh2b() {
  const room = (r, c) => { const [x0, y0, x1, y1] = ROOM3[r]; for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) if (at(x, y) === 'X') put(x, y, '#'); fill(x0, y0, x1, y1, c); };
  for (const r of ['music', 'bio', 'av', 'bc']) room(r, '_');
  room('hall', ':'); room('landing', ':'); room('stair3', ':'); room('wc', ':');
  put(3, 13, ':'); put(4, 13, ':');
  door(7, 9, { sign: '音樂教室' }); door(17, 9, { sign: '生物教室' }); door(27, 9, { sign: '視聽教室' });
  door(35, 9, { locked: true, sign: '廣播室', msg: '廣播室。門鎖著，門縫透出紅色的「ON AIR」燈。', key: 'tvs' });
  door(35, 13, { sign: '往三樓' }); door(35, 16, { sign: '女廁' });
  // 音樂教室
  obj('portrait', 6, 2); obj('piano', 5, 5, { act: 'piano', label: '彈鋼琴' }); obj('chalk', 9, 2, { act: 'score', label: '看黑板上的樂譜' });
  obj('curtain', 2, 4); obj('curtain', 2, 7);
  // 生物教室
  for (const x of [14, 16, 18]) for (const y of [4, 6]) obj('labtable', x, y);
  obj('stand', 21, 3, { act: 'stand', label: '空的標本台' }); obj('specshelf', 13, 2); obj('specshelf', 15, 2);
  // 視聽教室、廣播室
  TVS.length = 0;
  [[24, 3], [26, 3], [28, 3], [30, 3], [25, 6], [29, 6]].forEach(([x, y], i) => TVS.push({ o: obj('tv', x, y, { act: 'tv', label: '關掉電視', i }), state: 'idle', t: 0 }));
  obj('mic', 36, 3, { act: 'mic', label: '廣播設備' });
  // 走廊、樓梯
  for (const x of [8, 9, 24, 30]) obj('locker', x, 12);
  obj('cabinet', 20, 10); obj('downstair', 3, 18, { act: 'downstair', label: '往一樓的樓梯' });
  // 三樓女廁
  [27, 29, 31, 33].forEach((x, i) => obj('stall', x, 18, { act: 'stall', label: '敲敲廁所門', n: i + 1 }));
  obj('sink', 37, 20); obj('mirror', 37, 21, { act: 'mirror', label: '看鏡子' }); obj('sink', 37, 22);
  obj('graffiti', 26, 20, { act: 'graffiti', label: '看牆上的塗鴉' }); obj('cabinet', 26, 24);
  // 光源（電視的光由 tvLights 控制）
  LIGHTS.push({ x: 2.6, y: 11.4, r: 1.7, c: '90,255,140' }, { x: 37.4, y: 11.4, r: 1.7, c: '90,255,140' });
  LIGHTS.push({ x: 31.5, y: 21, r: 2.6, c: '220,230,255', id: 'wc' });
  LIGHTS.push({ x: 36.5, y: 3.5, r: 1.6, c: '255,60,60' });
  LIGHTS.push({ x: 6.5, y: 3, r: 0, c: '255,40,40', id: 'eyes' });
  TVS.forEach((tv, i) => LIGHTS.push({ x: tv.o.x + .5, y: tv.o.y + 1, r: 0, c: '170,200,255', id: 'tv' + i }));
  // 道具：三個器官模型
  item('organ_heart', 10, 7, '心臟模型'); item('organ_lung', 23, 8, '肺臟模型'); item('organ_stomach', 30, 23, '胃的模型');
  item('can', 12, 11, '空罐'); item('can', 33, 11, '空罐');
}

/* ---------- 開場（從第二章（上）接過來） ---------- */
async function startCh2b() {
  markReach(3);   // 解鎖章節選擇
  await card('card_hall', ['堆在樓梯上的桌椅倒了一地。', '樓上很安靜。安靜到聽得見自己的心跳。', '……還有，遠遠地，一台電視沒關的沙沙聲。']);
  loadScene(3);
  Object.assign(P, { x: 4.5, y: 17, dir: 0, hidden: null, crouch: false, pose: null });
  GH.active = false; Object.assign(AM, { x: 18.5, y: 5.5, state: TEST ? 'off' : 'patrol', wp: 0, path: null });
  chapter('第二章', '七大不思議（下）');
  saveCP('ch2b');
  await wait(TEST ? 10 : 1600);
  await phoneCall(['我是瑪莉。', '我現在……在音樂教室。', '那個人，一直在哭哦。']);
  setObj('二樓還有四頁日記（音樂教室、生物教室、視聽教室、三樓女廁）');
}

/* ---------- 日記第 3～6 頁 ---------- */
Object.assign(PAGE_TEXT, {
  3: ['她們把我關在三樓廁所的第三間。', '門外有人小聲地說：「別哭，我陪你。」', '是花子。', '……原來，不是所有的怪談都可怕。'],
  4: ['音樂教室的肖像在哭。', '澄香以前最喜歡彈《月光》。', '她只彈得出開頭那三個音，每次都笑著說：「剩下的，等你教我。」'],
  5: ['生物教室的人體模型少了心臟、肺和胃。', '我把保健室的模型偷來放回去，它就讓我過去了。', '……它是不是也在找自己少掉的東西？'],
  6: ['還差一頁。', '最後一頁，我藏在舊校舍的地下書庫。', '今晚 4:44，我要打開那扇門。', '澄香，等我。'],
});
async function ch2bCheck() {
  const p = G.inv.pages || [];
  const left = [3, 4, 5, 6].filter(n => !p.includes(n));
  if (left.length) { setObj(`樓上還有 ${left.length} 頁日記`); return; }
  await wait(TEST ? 10 : 900);
  await phoneCall(['我是瑪莉。', '我現在……在舊校舍。', '最後一頁，在「她」那裡哦。']);
  await says(['六頁了。', '……窗外，校園後面那棟早就封起來的舊校舍，亮起了一盞燈。']);
  ch2bEnd();
}
function ch2bEnd() {
  G.mode = 'end'; $('#hud').classList.add('hide'); $('#touch').classList.add('hide');
  const e = $('#end'); e.querySelector('h2').textContent = '第二章　完';
  e.querySelector('p').innerHTML = '交換日記　6 / 7<br>最後一頁，在拖著麻袋的她手上。<br>第三章「舊校舍與妃姬子」製作中。';
  e.classList.remove('hide');
  try { localStorage.removeItem(SAVE_KEY); } catch (er) { }
  if (TEST) document.title = 'END ' + JSON.stringify(stateSummary());
}

/* ---------- 互動 ---------- */
async function ch2bAction(o) {
  const I = G.inv, F = G.flags;
  switch (o.act) {
    case 'score': F.score = true; await says(['黑板上留著用粉筆畫的五線譜，旁邊寫著：', ['黑板', '《月光》第一樂章　開頭：G#　C#　E　（一直反覆）'], '……字跡跟交換日記的很像。']); return;
    case 'piano': {
      if (F.piano) { await says(['鋼琴蓋闔上了。肖像安安靜靜的。']); return; }
      await says(['（掀開琴蓋……要彈哪幾個音？）']);
      for (let k = 0; k < 3; k++) {
        const i = await choose('鋼琴', `第 ${k + 1} 個音`, NOTES, 0);
        sfx.click(); tone(330 * Math.pow(2, i / 12), .5, 'triangle', .06);
        if (NOTES[i] !== MOON[k]) { F.cryT = G.t; sfx.sting(); amAlarm(7.5, 10.5); await says(['……不對。', '牆上的肖像流下了紅色的眼淚，眼睛直直瞪著這邊——', '（走廊上有腳步聲往這邊來了！）']); return; }
      }
      F.piano = true; sfx.laugh();
      await says(['G#、C#、E……', '琴聲在空教室裡迴盪。肖像的眼淚停了。', '……畫框裡掉出一張摺起來的紙。']);
      item('page4', 6, 3, '交換日記'); return;
    }
    case 'stand': {
      const n = (I.organs || []).length;
      if (F.organsPlaced) { await says(['人體模型站回標本台上，一動也不動。']); return; }
      if (n < 3) { await says(['空的標本台。名牌寫著「人體模型」。', `……地上有拖行的痕跡，往走廊去了。（器官模型 ${n} / 3）`]); return; }
      F.organsPlaced = true; I.organs = []; updateHUD(); sfx.click();
      await says(['把心臟、肺、胃的模型，一個一個放回標本台的托盤上。', '……走廊那頭的腳步聲，停了。然後，慢慢地往這邊走回來。']);
      AM.state = 'toStand'; AM.path = null; return;
    }
    case 'tv': return tvOff(o);
    case 'mic': {
      if (F.broadcast) { await says(['麥克風的紅燈熄了。']); return; }
      F.broadcast = true; sfx.ring();
      await says(['……廣播設備自己開始運作了。', ['廣播', '（叮咚——）'], ['廣播', '現在時間，下午四點四十四分。'], ['廣播', '還留在校內的同學，請注意。'],
        ['廣播', '二年B班，澄香同學。'], ['廣播', '二年B班，妃姬子同學。'], ['廣播', '……二年B班，咪醬同學。'], ['廣播', '請立刻到——舊校舍。'], ['廣播', '（叮咚——）'],
        '……是 2004 年的放學廣播。', '為什麼會叫到我的名字？', '……桌上的點名簿裡，夾著一張紙。']);
      sfx.sting(); shake = 6; await getPage(6); saveCP('p6'); return ch2bCheck();
    }
    case 'downstair': await says(['往一樓的樓梯。……樓下的走廊，傳來剪刀的聲音。不回去了。']); return;
    case 'graffiti': F.graffiti = true; await says(['廁所牆上的塗鴉被刷過好幾次油漆，還是透出來：', ['塗鴉', '「花子さん、あそびましょ」　→ 第三間'], ['塗鴉', '「妃姬子去死」'], '……後面那行字，被人用指甲刮掉了一半。']); return;
    case 'stall': return knock(o);
    case 'mirror': return mirror();
  }
  return false;
}
async function knock(o) {
  const F = G.flags;
  if (F.hanako) { await says([o.n === 3 ? '第三間的門開著一條縫。裡面空空的，只有一股洗衣粉的味道。' : '一般的廁所隔間。']); return; }
  const i = await choose('三樓女廁', `第 ${o.n} 間。要敲門嗎？`, ['敲三下，問「花子，出來玩嗎？」', '算了'], 0);
  if (i !== 0) return;
  sfx.locked(); await wait(300); sfx.locked(); await wait(300); sfx.locked();
  if (o.n !== 3) {
    sfx.sting(); shake = 10; damage(1); setPose('hurt', .8);
    await says(['……門猛地打開，一隻濕冷的手抓住了手腕，把人往裡面拖——', '（拼命甩開了。不是這一間……）']);
    return;
  }
  const face = 'assets/hanako_face.png';
  F.hanakoOut = true;
  await says([['', '……門，自己慢慢地打開了。', face], ['紅裙子的女孩', '「……要玩什麼？」', face], ['紅裙子的女孩', '「好久沒有人來找我玩了。上一次，是一個一直在哭的女生。」', face],
    ['紅裙子的女孩', '「她們把她關在這裡。我陪她到天亮。她說，她要去接一個朋友回來。」', face]]);
  const a = await choose('花子', '「你……是來帶她們回家的嗎？」', ['「是。我想帶她們回家。」', '「不是，我只想拿回手機……」', '「……我不知道。」'], 0, face);
  if (a !== 0) {
    F.hanakoOut = false; sfx.laugh(); damage(1);
    await says([['花子', '「……那你就留下來陪我吧。」', face], '門砰地關上，冰冷的水從頭頂澆下來——', '（……再想想該怎麼回答。）']);
    return;
  }
  F.hanako = true;
  await says([['花子', '「……嗯。那這個給你。」', face], ['花子', '「她留下來的。還有，把洗手台那面鏡子帶走吧。拖麻袋的那個女生……很怕鏡子。」', face]]);
  F.hanakoOut = false;
  await getPage(3); saveCP('p3');
  setObj('拿走洗手台的鏡子');
}
async function mirror() {
  const F = G.flags, I = G.inv;
  if (I.mirror) { await says(['牆上只剩下鏡框。', '……框裡的咪醬，還留在那裡。']); return; }
  if (!F.hanako) {
    if (!F.mirror1) { F.mirror1 = true; await says(['洗手台的鏡子。', '……咦？', '鏡子裡的我，比我晚一拍才眨眼。']); sfx.sting(); return; }
    await says(['不想再看那面鏡子了。']); return;
  }
  I.mirror = true; sfx.pick(); updateHUD(); toast('得到【鏡子碎片】');
  await says(['把鏡子從牆上拆下來……', '鏡子拆下來了。', '可是，牆上的鏡框裡，鏡中的咪醬還站在那裡——', '對我揮了揮手。']);
  sfx.sting(); shake = 6; saveCP('mirror');
  return ch2bCheck();
}

/* ---------- 電視 ---------- */
async function tvOff(o) {
  const tv = TVS[o.i];
  if (tv.state === 'off') { await says(['插頭拔掉了。螢幕黑漆漆的，映著自己的臉。']); return; }
  if (tv.state !== 'on') { await says(['舊型的映像管電視，沒有開。']); return; }
  tv.state = 'off'; tv.t = 0; sfx.click(); noise(.15, .1, 'lowpass', 600);
  G.flags.tvOff = (G.flags.tvOff || 0) + 1; toast(`拔掉插頭（${G.flags.tvOff} / 6）`);
  if (G.flags.tvOff >= 6) {
    G.flags.tvDone = true; DOORS['35,9'].locked = false; sfx.door();
    await says(['最後一台電視也暗了。', '……走廊盡頭傳來「喀」的一聲。廣播室的門開了。']);
    setObj('去廣播室看看'); saveCP('tvs');
  } else G.tvNext = G.t + 1.2;
}
function tvUpdate(dt) {
  if (!G.flags.tvStart || G.flags.tvDone) return;
  const inAv = in3('av', P.x, P.y);
  const cur = TVS.find(t => t.state === 'on');
  if (!cur && G.t >= (G.tvNext || 0)) { const idle = TVS.filter(t => t.state === 'idle'); if (idle.length) { const t = idle[Math.floor(R() * idle.length)]; t.state = 'on'; t.t = 0; sfx.ring(); } }
  if (cur && inAv) {
    cur.t += dt;
    if (cur.t > 7) {   // 她爬出來了
      cur.t = 0; G.tvScare = { x: cur.o.x + .5, y: cur.o.y + 1.4, t: NOW() };
      sfx.sting(); shake = 10; damage(1); setPose('hurt', .8); toast('她從電視裡爬出來了！');
    }
  }
  TVS.forEach((t, i) => { const l = LIGHTS.find(l => l.id === 'tv' + i); if (l) l.r = t.state === 'on' ? 2.4 + Math.sin(G.t * 30) * .2 : 0; });
}

/* ---------- 人體模型 ---------- */
function walker(e, tx, ty, speed, dt) {
  if (!e.path || e.pathFor !== Math.floor(tx) + ',' + Math.floor(ty) || (e.pathT -= dt) <= 0) { e.path = findPath(e.x, e.y, tx, ty) || []; e.pathFor = Math.floor(tx) + ',' + Math.floor(ty); e.pathT = .5; }
  let tgt = e.path[0]; if (!tgt || e.path.length === 1) tgt = [tx, ty];
  const dx = tgt[0] - e.x, dy = tgt[1] - e.y, d = Math.hypot(dx, dy);
  if (d < .12) { if (e.path.length) e.path.shift(); return dist(e.x, e.y, tx, ty) < .3; }
  const s = Math.min(d, speed * dt); moveEnt(e, dx / d * s, dy / d * s);
  e.dir = dirFromWorld(dx, dy); e.moving = true; e.animD += s; e.frame = Math.floor(e.animD / .38) % 4;
  e.step = (e.step || 0) + s; if (e.step > .6) { e.step = 0; if (dist(e.x, e.y, P.x, P.y) < 10) sfx.step(true, .14, 0); }
  return false;
}
function amSees() {
  if (P.hidden || G.mode !== 'play') return false;
  const d = dist(AM.x, AM.y, P.x, P.y);
  let range = 5 + (P.light ? 2.5 : 0); if (P.crouch) range *= .6;
  if (d > range) return false;
  if (d > 1.2) { const [fx, fy] = DIRV[AM.dir]; if (fx * (P.x - AM.x) / d + fy * (P.y - AM.y) / d < .5) return false; }
  return los(AM.x, AM.y, P.x, P.y);
}
function amAlarm(x, y) { if (['patrol', 'search'].includes(AM.state)) { AM.state = 'investigate'; AM.target = [x, y]; AM.path = null; } }
function amUpdate(dt) {
  AM.moving = false;
  if (['off', 'frozen'].includes(AM.state)) return;
  if (AM.state === 'toStand') {
    if (walker(AM, 20.5, 3.5, 1.6, dt)) { AM.state = 'frozen'; AM.dir = 4; if (!G.flags.page5Drop) { G.flags.page5Drop = true; item('page5', 20, 4, '交換日記'); toast('……人體模型的胸腔裡，夾著一張紙。'); } }
    return;
  }
  const sees = amSees();
  if (sees && AM.state !== 'chase') { AM.state = 'chase'; AM.path = null; sfx.sting(); toast('人體模型轉過頭來了！'); }
  for (const n of G.noises) if (G.t - n.t < .05 && dist(n.x, n.y, AM.x, AM.y) < n.r && AM.state !== 'chase') amAlarm(n.x, n.y);
  switch (AM.state) {
    case 'patrol': { const w = AM_PATROL[AM.wp]; if (walker(AM, w[0], w[1], 1.3, dt)) AM.wp = (AM.wp + 1) % AM_PATROL.length; break; }
    case 'investigate': if (walker(AM, AM.target[0], AM.target[1], 1.8, dt)) { AM.state = 'search'; AM.timer = 3; } break;
    case 'search': AM.timer -= dt; if (AM.timer % 1 < dt) AM.dir = (AM.dir + 2) % 8; if (AM.timer <= 0) { AM.state = 'patrol'; AM.path = null; } break;
    case 'pause': AM.timer -= dt; if (AM.timer <= 0) AM.state = 'patrol'; break;
    case 'chase': {
      if (sees) { AM.last = [P.x, P.y]; walker(AM, P.x, P.y, 2.3, dt); }
      else if (AM.last && walker(AM, AM.last[0], AM.last[1], 2.3, dt)) { AM.state = 'search'; AM.timer = 3.5; }
      if (dist(AM.x, AM.y, P.x, P.y) < .7 && !P.hidden && P.inv <= 0) amHit();
      break;
    }
  }
}
async function amHit() {
  AM.state = 'pause'; AM.timer = 2.5; AM.path = null;
  sfx.snip(); shake = 10; damage(1); setPose('hurt', .8); P.inv = 2;
  const [fx, fy] = DIRV[AM.dir]; for (let k = 0; k < 8; k++) moveEnt(P, fx * .15, fy * .15);
  await says(['冰冷的塑膠手指抓住了肩膀——解剖刀劃過袖子。', '「……ない。……ない。」（沒有了……沒有了……）', '（掙脫了！快跑！）']);
}

/* ---------- 撿道具：器官、日記 ---------- */
const _takeItem2 = takeItem;
takeItem = async function (it) {
  if (G.scene !== 3) return _takeItem2(it);
  if (it.id.startsWith('organ_')) {
    it.taken = true; sfx.pick(); (G.inv.organs = G.inv.organs || []).push(it.id); updateHUD();
    toast(`得到【${it.name}】（${G.inv.organs.length} / 3）`);
    if (G.inv.organs.length === 1) await says(['塑膠做的器官模型，背面寫著「生物教室」。', '……那個在走廊上晃的人體模型，胸口是空的。']);
    return;
  }
  const m = it.id.match(/^page(\d)$/);
  if (m) { it.taken = true; await getPage(+m[1]); saveCP(it.id); return ch2bCheck(); }
  return _takeItem2(it);
};

/* ---------- 包一層：把場景 3 接進 ch2.js 的掛勾 ---------- */
TRIG.push(
  { scene: 3, id: 'avIn', when: () => in3('av', P.x, P.y), run: async () => { G.flags.tvStart = true; G.tvNext = G.t + 1; await says(['視聽教室。六台舊電視排成兩排。', '……其中一台，自己亮了起來。螢幕裡的雪花，好像有什麼在動。', '（在她爬出來之前，拔掉插頭！）']); } },
  { scene: 3, id: 'musicIn', when: () => in3('music', P.x, P.y), run: async () => { await says(['音樂教室。牆上掛著作曲家的肖像。', '……肖像的眼睛，好像會發光。被看到的話，一定會出事。', '（眼睛發光的時候，躲到窗簾後面）']); } },
  { scene: 3, id: 'wcIn', when: () => in3('wc', P.x, P.y), run: async () => { await says(['三樓的女廁。燈管一閃一閃的。', '四間隔間，門都關著。']); } },
);
const eyesOn = () => G.scene === 3 && !G.flags.piano && (G.t % 9) > 6;   // 每 9 秒有 3 秒眼睛發光
const _sceneUpdate = sceneUpdate;
sceneUpdate = function (dt) {
  if (G.scene !== 3) return _sceneUpdate(dt);
  amUpdate(dt); tvUpdate(dt);
  const eyes = LIGHTS.find(l => l.id === 'eyes'); if (eyes) eyes.r = eyesOn() ? 2.2 : 0;
  if (eyesOn() && in3('music', P.x, P.y) && !P.hidden && G.t - (G.flags.seenT || -9) > 4) {
    G.flags.seenT = G.t; sfx.sting(); shake = 5; toast('肖像的眼睛盯住你了！'); amAlarm(7.5, 10.5);
  }
};
const _sceneAction = sceneAction;
sceneAction = async function (o) { if (G.scene === 3) return ch2bAction(o); return _sceneAction(o); };
const _sceneSprites = sceneSprites;
sceneSprites = function (list) {
  if (G.scene !== 3) return _sceneSprites(list);
  if (IMG.anatomy && AM.state !== 'off') list.push({ d: AM.x + AM.y, f: () => drawSprite(IMG.anatomy, AM.x, AM.y, AM.dir, AM.moving ? AM.frame : 0, { jit: AM.state === 'chase' ? (Math.random() - .5) * 1.5 : 0 }) });
  if (G.flags.hanakoOut && IMG.hanako) list.push({ d: 31.5 + 19.3, f: () => { const [sx, sy] = iso(31.5, 19.3); ctx.drawImage(IMG.hanako, Math.round(sx - IMG.hanako.width / 2), Math.round(sy - IMG.hanako.height + 1)); } });   // 單張圖，不走 8 方向的 drawSprite
  const sc = G.tvScare;
  if (sc && NOW() - sc.t < 1.4 && IMG.tvwoman) list.push({ d: sc.x + sc.y, f: () => { const im = IMG.tvwoman, fw = im.width / 4, fh = im.height / 2, k = Math.floor((NOW() - sc.t) / .2) % 4, [sx, sy] = iso(sc.x, sc.y); ctx.drawImage(im, k * fw, fh, fw, fh, Math.round(sx - fw / 2), Math.round(sy - fh + 2), fw, fh); } });
};
const _sceneHUD = sceneHUD;
sceneHUD = function (s) {
  _sceneHUD(s);
  const I = G.inv;
  if (I.organs && I.organs.length) s.push(`<div class="s">器官模型<em>${I.organs.length} / 3</em></div>`);
  if (I.mirror) s.push(`<div class="s">鏡子碎片</div>`);
};
const _sceneOnLoad = sceneOnLoad;
sceneOnLoad = function (cp) {
  if (G.scene !== 3) return _sceneOnLoad(cp);
  Object.assign(AM, { x: 18.5, y: 5.5, wp: 0, path: null, state: G.flags.organsPlaced ? 'toStand' : 'patrol' });
  TVS.forEach(t => { t.state = 'idle'; t.t = 0; });
  for (let i = 0; i < (G.flags.tvOff || 0); i++) TVS[i].state = 'off';
  if (G.flags.tvDone) DOORS['35,9'].locked = false;
  for (const [f, id, x, y] of [['piano', 'page4', 6, 3], ['page5Drop', 'page5', 20, 4]]) if (G.flags[f] && !ITEMS.some(i => i.id === id)) { item(id, x, y, '交換日記'); if ((G.inv.pages || []).includes(+id[4])) ITEMS.at(-1).taken = true; }
};
// 第二章（上）結束 → 直接上樓
ch2End = function () { return startCh2b(); };

/* ---------- 新物件的繪製 ---------- */
const _sceneDrawObj = sceneDrawObj;
sceneDrawObj = function (o, cx, cy, shaking) {
  const { x, y } = o;
  switch (o.t) {
    case 'portrait': {
      box(x + .1, y + .05, .8, .15, 4, '#3a2c20', '#2a2018', '#241b14');
      const im = IMG.beethoven; if (!im) break;
      const fw = im.width / 3, cry = G.flags.cryT && G.t - G.flags.cryT < 4, k = G.flags.piano ? 0 : cry ? 2 : eyesOn() ? 1 : 0;
      ctx.drawImage(im, k * fw, 0, fw, im.height, Math.round(cx - fw / 2 - 6), Math.round(cy - 58), fw, im.height);
      break;
    }
    case 'piano': box(x - .1, y + .1, 1.2, .8, 16, '#1a1a1e', '#0e0e12', '#0a0a0d'); box(x - .05, y + .1, 1.1, .25, 12, '#e8e4dc', null, null, 16); break;
    case 'chalk': box(x, y + .05, 1, .2, 6, '#3a3a36', '#2a2a26', '#222'); break;
    case 'curtain': box(x + .05, y + .1, .3, .8, 36 + shaking, '#5a1f24', '#3e1518', '#341215'); break;
    case 'labtable': box(x + .05, y + .2, .9, .6, 13, '#2e3236', '#1f2225', '#1a1c1f'); ctx.fillStyle = '#9aa3a6'; ctx.fillRect(cx - 2, cy - 17, 3, 2); break;
    case 'stand': box(x + .2, y + .2, .6, .6, 8, '#7a6a52', '#544836', '#4a3f30'); if (AM.state === 'frozen') break; ctx.fillStyle = '#5a1d1d'; ctx.fillRect(cx - 3, cy - 12, 6, 2); break;
    case 'specshelf': box(x + .05, y + .2, .9, .6, 32, '#4a4a42', '#33332d', '#2b2b26'); for (let k = 0; k < 3; k++) { ctx.fillStyle = ['#c9c6a8', '#a8b8a0', '#d4c2a0'][k]; ctx.fillRect(cx - 6 + k * 5, cy - 22 + (k % 2) * 8, 3, 5); } break;
    case 'tv': {
      const tv = TVS[o.i], im = IMG.tvwoman;
      box(x + .1, y + .2, .8, .6, 8, '#4a3a2a', '#33281c', '#2b2218');
      if (tv && tv.state === 'on' && im) { const fw = im.width / 4, fh = im.height / 2, k = Math.min(3, Math.floor(tv.t / 7 * 4)); ctx.drawImage(im, k * fw, 0, fw, fh, Math.round(cx - fw / 2), Math.round(cy - fh - 4), fw, fh); }
      else { box(x + .15, y + .3, .7, .5, 16, '#3c3530', '#2a2420', '#221d19', 8); faceRect(x, y, 'L', .25, .75, 11, 21, tv && tv.state === 'off' ? '#08090b' : '#1a1e24'); }
      break;
    }
    case 'mic': box(x + .1, y + .2, .8, .6, 12, '#3a3a3e', '#28282c', '#202024'); ctx.fillStyle = G.flags.broadcast ? '#401010' : '#ff3030'; ctx.fillRect(cx + 3, cy - 16, 3, 2); ctx.fillStyle = '#888'; ctx.fillRect(cx - 2, cy - 24, 2, 8); break;
    case 'downstair': for (let k = 0; k < 4; k++) box(x + .1, y + .1 + k * .2, .8, .2, 14 - k * 3, '#4a4642', '#33302d', '#2b2926'); break;
    case 'stall': box(x + .05, y + .1, .9, .8, 30, '#4e5a58', '#3a4442', '#323b39'); faceRect(x, y, 'L', .2, .8, 2, 27, o.n === 3 && G.flags.hanakoOut ? '#0a0a0a' : '#46514f'); faceRect(x, y, 'L', .72, .76, 12, 15, '#9a9a8a'); break;
    case 'sink': box(x + .2, y + .2, .6, .6, 12, '#d8dcdc', '#a8acac', '#949898'); break;
    case 'mirror': box(x + .2, y + .2, .6, .6, 12, '#d8dcdc', '#a8acac', '#949898'); if (!G.inv.mirror) { ctx.fillStyle = 'rgba(170,190,210,.8)'; ctx.fillRect(cx + 2, cy - 30, 6, 10); } else { ctx.fillStyle = '#1e2a3a'; ctx.fillRect(cx + 2, cy - 30, 6, 10); ctx.fillStyle = '#2a3a6a'; ctx.fillRect(cx + 4, cy - 28, 2, 5); } break;
    case 'graffiti': box(x + .1, y + .1, .8, .2, 2, '#4a4a4a', null, null); break;
    default: return _sceneDrawObj(o, cx, cy, shaking);
  }
};

/* ---------- 自動測試（?test=ch2b）：肖像→鋼琴→器官→標本台→電視六台→廣播→花子→鏡子→結束 ---------- */
async function testCh2b() {
  const tp = (x, y) => { P.x = x; P.y = y; };
  const take = async (id) => { const it = ITEMS.find(i => i.id === id && !i.taken); if (!it) throw 'no item ' + id; tp(it.x, it.y - .3); await interact(); await waitFree(); };
  try {
    G.inv.pages = [1, 2];
    await startCh2b(); await waitFree();
    if (G.scene !== 3) throw 'not in scene 3';
    P.inv = 9999;
    tp(9.5, 3.5); await wait(50); await waitFree(); await interact(); await waitFree();
    let k = 0; TEST_CHOICE = o => o.indexOf(MOON[k++ % 3]);
    tp(5.5, 6.3); P.dir = 0; await interact(); await waitFree();
    if (!G.flags.piano) throw 'piano';
    await take('page4');
    await take('organ_heart'); await take('organ_lung'); await take('organ_stomach');
    tp(21.5, 4.4); P.dir = 0; await interact(); await waitFree();
    if (!G.flags.organsPlaced) throw 'stand';
    AM.x = 19.5; AM.y = 6.5;
    let t0 = performance.now(); while (!ITEMS.some(i => i.id === 'page5') && performance.now() - t0 < 20000) await wait(100);
    await take('page5');
    tp(27.5, 7.5); await wait(50); await waitFree();
    for (let n = 0; n < 6; n++) {
      t0 = performance.now(); let on; while (!(on = TVS.find(t => t.state === 'on')) && performance.now() - t0 < 10000) await wait(50);
      if (!on) throw 'tv not on ' + n;
      tp(on.o.x + .5, on.o.y + 1.4); P.dir = 0; await interact(); await waitFree();
    }
    if (DOORS['35,9'].locked) throw 'bc door';
    tp(36.5, 4.4); P.dir = 0; await interact(); await waitFree();
    TEST_CHOICE = o => Math.max(0, o.findIndex(t => /^敲三下|^「是/.test(t)));
    tp(35.5, 15); await wait(50); tp(31.5, 19.4); await wait(50); await waitFree();
    P.dir = 0; await interact(); await waitFree();
    if (!G.flags.hanako) throw 'hanako';
    tp(36.4, 21.5); P.dir = 6; await interact(); await waitFree();
    t0 = performance.now(); while (G.mode === 'play' && G.scene === 3 && performance.now() - t0 < 20000) await wait(100);
    document.title = ((G.mode === 'end' || G.scene === 4) && G.inv.pages.length === 6 ? 'PASS ' : 'FAIL ') + JSON.stringify(stateSummary());   // 第二章結束會直接接第三章
  } catch (e) { document.title = 'ERR ' + e + ' ' + JSON.stringify(stateSummary()); }
}
