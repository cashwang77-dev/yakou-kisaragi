/* 夜校・如月　第四章：回家的路（場景 6）
   校門外 → 關門的商店街（不打烊的便利商店：存檔、鹽包；電器行櫥窗的電視；巷口的人面犬：一半提示一半謊話，理牠太多次會被尾隨）
   → 田邊公路（高速婆婆從背後追上來：躲進公車亭／水溝，她會跑過頭再折回來；田裡的「扭來扭去」不要用手電筒照著看）
   → 住宅區圍牆小巷（八尺大人從圍牆上探頭，學媽媽的聲音叫妳：不要回應；被抓到時撒鹽逼退）→ 巷子盡頭的車站（接終章）
   跟 ch3.js、ch4.js 一樣用「包一層」接進掛勾。 */

const ROOM6 = { conv: [8, 26, 13, 29], elec: [16, 26, 21, 29], shopA: [3, 26, 6, 29], shopB: [23, 26, 28, 29] };
const in6 = (r, x, y) => { const [x0, y0, x1, y1] = ROOM6[r]; return x >= x0 && x < x1 + 1 && y >= y0 && y < y1 + 1; };
const onRoad6 = (x, y) => x >= 32 && x < 38 && y >= 7 && y < 30, inAlley6 = (x, y) => y < 6;
const BABA = { x: 34.5, y: 36, dir: 0, state: 'off', timer: 0, frame: 0, animD: 0, moving: false, r: .3 };
const DOG = { x: 30.5, y: 27.5, dir: 4, state: 'sit', frame: 0, animD: 0, moving: false, path: null, r: .25, talk: 0 };
const KUNE = { x: 25.5, y: 15.5 };
const HACHI_SPOTS = [[29.5, 2.6], [19.5, 2.6], [10.5, 2.6]];
const HACHI = { i: -1, show: 0, dir: 4 };
Object.assign(HIDE, { cshelf: '擠進貨架之間', busstop: '躲進公車亭', ditch: '躲進水溝' });
SCENE_PATROL[6] = [[20.5, 37.5]];   // 裂口女不出校門
SCENES[6] = buildCh5;
loadImages(['jinmen', 'babaa', 'hachi', 'walls6']).then(() => { for (const k of ['jinmen', 'babaa']) if (IMG[k]) IMG[k].rows = 4; if (IMG.hachi) IMG.hachi.rows = 1; });

function buildCh5() {
  // 商店街：人行道、馬路
  fill(2, 31, 31, 31, ','); fill(2, 32, 36, 33, '='); fill(2, 34, 31, 34, ',');
  for (let x = 1; x <= 37; x++) { put(x, 30, at(x, 30) === 'X' ? '#' : at(x, 30)); put(x, 35, '#'); }
  put(1, 31, '#'); put(1, 32, '#'); put(1, 33, '#'); put(1, 34, '#');
  const room = (r, c) => { const [x0, y0, x1, y1] = ROOM6[r]; for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) if (at(x, y) === 'X') put(x, y, '#'); fill(x0, y0, x1, y1, c); };
  for (const r of ['conv', 'elec', 'shopA', 'shopB']) room(r, '_');
  for (let x = 2; x <= 31; x++) if (at(x, 30) === 'X') put(x, 30, '#');
  door(10, 30, { sign: '便利商店' });
  fill(30, 26, 31, 29, ','); put(30, 30, ','); put(31, 30, ',');           // 人面犬的巷子
  for (let y = 25; y <= 29; y++) { put(29, y, '#'); put(32, y, '#'); } put(30, 25, '#'); put(31, 25, '#');
  // 田邊公路：往北，兩邊是田
  fill(34, 6, 35, 31, '='); fill(33, 6, 33, 31, ','); fill(36, 6, 36, 31, ',');
  fill(22, 7, 32, 29, '.'); fill(37, 7, 38, 29, '.');
  fill(32, 31, 36, 34, '='); put(37, 32, '#'); put(37, 33, '#');
  for (let y = 30; y <= 35; y++) if (at(32, y) === '#') put(32, y, '=');
  // 住宅區圍牆小巷：往西
  fill(3, 3, 37, 4, ','); for (let x = 2; x <= 38; x++) { put(x, 2, '#'); if (at(x, 5) !== '=' && at(x, 5) !== ',') put(x, 5, '#'); }
  fill(33, 5, 36, 5, ','); put(2, 3, '#'); put(2, 4, '#'); put(38, 3, '#'); put(38, 4, '#');
  for (const x of [25, 15]) { fill(x, 5, x + 1, 7, ','); put(x - 1, 6, '#'); put(x - 1, 7, '#'); put(x + 2, 6, '#'); put(x + 2, 7, '#'); fill(x - 1, 8, x + 2, 8, '#'); }   // 死巷
  // 物件：便利商店
  obj('register', 12, 27, { act: 'register', label: '櫃台（存檔）' });
  for (const y of [27, 28]) obj('cshelf', 9, y);
  obj('cshelf', 11, 29);
  obj('tvwin', 18, 31, { act: 'tvwin', label: '看電器行的櫥窗', solid: false });
  obj('dogspot', 30, 27, { act: 'dog', label: '跟那隻狗說話' });
  for (const x of [5, 24]) obj('vend2', x, 31);
  // 公路：公車亭、水溝
  obj('busstop', 36, 24); obj('busstop', 33, 16); obj('busstop', 36, 9);
  obj('ditch', 33, 21); obj('ditch', 36, 13);
  obj('roadsign', 36, 29, { act: 'roadsign', label: '看路標', solid: false });
  // 小巷盡頭：車站的燈
  obj('stlight', 3, 3, { act: 'toStation', label: '走向亮著燈的車站' });
  // 光源
  LIGHTS.push({ x: 11, y: 27.5, r: 3.6, c: '220,240,255' });                 // 便利商店的日光燈
  LIGHTS.push({ x: 18.5, y: 31.2, r: 2, c: '170,190,255', id: 'tvwin' });
  for (const x of [7.5, 20.5, 28.5]) LIGHTS.push({ x, y: 33.5, r: 2.4, c: '255,200,140' });
  LIGHTS.push({ x: 35.5, y: 24.5, r: 1.8, c: '255,230,170' }, { x: 33.5, y: 16.5, r: 1.6, c: '255,230,170' });
  LIGHTS.push({ x: 3.5, y: 3.5, r: 3.2, c: '255,220,150' });
  // 街景（10/23：原本看起來跟學校一樣）：路燈、電線桿、機車、垃圾袋（都不擋路）
  for (const x of [7, 20, 28]) obj('lamp', x, 34, { solid: false });
  for (const x of [3, 13, 24]) obj('pole6', x, 34, { solid: false });
  obj('scooter', 15, 31, { solid: false }); obj('scooter', 27, 31, { solid: false, v: 1 }); obj('scooter', 3, 31, { solid: false, v: 2 });
  // 道具
  item('salt', 13, 26, '鹽包'); item('salt', 13, 29, '鹽包'); item('bandage', 22, 32, '繃帶'); item('drink', 35, 27, '能量飲料');
  item('can', 15, 34, '空罐'); item('can', 34, 18, '空罐'); item('charm', 27, 4, '護身符'); item('eraser', 6, 33, '板擦');
}
// 地面細節：馬路的白線、田的條紋
function road6Floor(g) {
  g.fillStyle = 'rgba(230,225,200,.35)';
  for (let x = 2; x < 32; x += 1.6) { const [a, b] = isoW(x, 33); g.fillRect(a | 0, b | 0, 8, 2); }
  for (let y = 7; y < 30; y += 1.6) { const [a, b] = isoW(35, y); g.fillRect(a | 0, b | 0, 2, 2); }
  g.strokeStyle = 'rgba(40,60,30,.5)'; g.lineWidth = 1;
  for (let k = 22; k < 33; k += 1) { const [a, b] = isoW(k, 7), [c, d] = isoW(k, 29.9); g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
}
const _sceneFloor6 = typeof sceneFloor === 'function' ? sceneFloor : null;
sceneFloor = function (g) { if (G.scene === 6) return road6Floor(g); if (_sceneFloor6) return _sceneFloor6(g); };

/* ---------- 開場（第三章結束後，走出校門） ---------- */
async function startRoad() {
  markReach(5);
  await card('card_gate', ['……校門，開了。', '門外不是熟悉的小鎮。商店全都拉下了鐵捲門，路燈一盞一盞地熄掉。', '只有很遠很遠的地方，亮著一點燈。']);
  loadScene(6);
  Object.assign(P, { x: 3.5, y: 32.5, dir: 6, hidden: null, crouch: false, pose: null });
  GH.active = false; roadReset();
  chapter('第四章', '回家的路');
  saveCP('road');
  await wait(TEST ? 10 : 1600);
  await phoneCall(['我是瑪莉。', '我現在……在商店街。', '那間便利商店，一直都開著哦。']);
  setObj('穿過商店街（便利商店可以存檔）');
}
function roadReset() {
  Object.assign(BABA, { x: 34.5, y: 36, state: 'off', timer: 0 });
  Object.assign(DOG, { x: 30.5, y: 27.5, state: G.flags.dogFollow ? 'follow' : 'sit', path: null });
  HACHI.i = -1; HACHI.show = 0;
}

/* ---------- 互動 ---------- */
async function ch5Action(o) {
  const F = G.flags, I = G.inv;
  switch (o.act) {
    case 'register':
      if (G.hearts < 5) G.hearts = Math.min(5, G.hearts + 1);
      if (!F.receipt) {
        F.receipt = true;
        await says(['「歡迎光臨。」', '……店裡一個人都沒有。自動門一直重複著同一句話。', '收銀機「喀啦」一聲，自己吐出一張收據。',
          ['收據', '日期：2004．2．□　時間：4:44'], ['收據', '品項：定期票　一張　¥0'], '……我手上的定期票，好像越來越重了。']);
        sfx.sting();
      } else await says(['「歡迎光臨。」……收銀機安靜下來了。']);
      saveCP('conv'); toast('（已存檔）'); updateHUD(); return;
    case 'tvwin':
      await says(['電器行的櫥窗。裡面每一台電視都開著。', '每一台，都在播同一個女人。', '……她慢慢地，把臉轉向櫥窗外的我。']);
      sfx.sting(); shake = 4; return;
    case 'roadsign': await says([['路標', '↑　如月　2km'], '……路標的柱子上，貼滿了寫著「不要回頭」的紙條。']); return;
    case 'dog': return dogTalk();
    case 'toStation':
      if (!F.alleyDone && !TEST) { await says(['……還不能過去。圍牆後面，有什麼東西在看著我。']); }
      return roadEnd();
  }
  return false;
}
async function dogTalk() {
  const N = '人面犬';
  DOG.talk++;
  if (DOG.talk === 1) {
    await says(['巷子裡蹲著一隻狗。牠轉過頭來——', '是一張中年男人的臉。', [N, '「……別理我。」']]);
    return;
  }
  if (DOG.talk === 2) {
    const a = await choose(N, '「……又是妳。想問什麼？」', ['問往車站的路', '問圍牆後面的聲音'], 0);
    if (a === 0) await says([[N, '「往東，再沿著公路往北。」'], [N, '「公路上，聽到背後有腳步聲，就躲進公車亭。別回頭。」'], '（……這聽起來是真的。）']);
    else await says([[N, '「那個聲音會叫妳的名字。」'], [N, '「……回應她就沒事了。她只是想確認妳還在。」'], '（……這是真的嗎？）']);
    return;
  }
  G.flags.dogFollow = true; DOG.state = 'follow';
  await says([[N, '「妳很喜歡跟我說話嘛。」'], [N, '「……那我陪妳走一段。」'], '牠站起來，跟在我後面。', '（理牠太多次了……牠的腳步聲很吵。）']);
}
async function roadEnd() {
  G.flags.ending4 = 1;
  await says(['巷子的盡頭，是一座亮著燈的小車站。', '月台的站牌上寫著——「きさらぎ」。']);
  return startCh4();
}

/* ---------- 高速婆婆：從背後追上來，跑過頭再折回來 ---------- */
function babaUpdate(dt) {
  BABA.moving = false;
  if ((BABA.stunT || 0) > G.t) return;
  const onRoad = onRoad6(P.x, P.y);
  if (BABA.state === 'off') { if (onRoad && P.y < 27) { BABA.state = 'idle'; BABA.timer = TEST ? .2 : 2.5; } return; }
  if (!onRoad && BABA.state !== 'return') { if (BABA.state !== 'idle') { BABA.state = 'return'; } }
  const mv = (tx, ty, sp) => { const dx = tx - BABA.x, dy = ty - BABA.y, m = Math.hypot(dx, dy); if (m < .1) return true; const s = Math.min(m, sp * dt); BABA.x += dx / m * s; BABA.y += dy / m * s; BABA.dir = dirFromWorld(dx, dy); BABA.moving = true; BABA.animD += s; BABA.frame = Math.floor(BABA.animD / .45) % 4; return false; };
  switch (BABA.state) {
    case 'idle':   // 在南邊路口等著
      BABA.x = 34.5; BABA.y = Math.max(BABA.y, 31); BABA.timer -= dt;
      if (BABA.timer <= 0 && onRoad) { BABA.state = 'charge'; BABA.x = 34.5 + (Math.random() < .5 ? 0 : 1); BABA.y = Math.max(P.y + 9, 31); sfx.sting(); toast('背後……有很快的腳步聲！'); }
      break;
    case 'charge': {   // 衝向玩家；玩家躲起來就繼續往前衝（跑過頭）
      const tx = P.hidden ? BABA.x : P.x, ty = P.hidden ? BABA.y - 1 : P.y;
      mv(tx, ty, 5.8);
      if (P.hidden && !BABA.over) BABA.over = P.y - 8;
      if (BABA.over != null && BABA.y <= BABA.over) { BABA.state = 'return'; BABA.over = null; }
      if (!P.hidden && P.inv <= 0 && !G.lock && dist(BABA.x, BABA.y, P.x, P.y) < .7) babaHit();
      if (BABA.y < 7.5) { BABA.state = 'return'; BABA.over = null; }
      break;
    }
    case 'return':   // 慢慢走回南邊；看到沒躲好的玩家就再衝一次
      mv(BABA.x, 31.5, 2.2);
      if (!P.hidden && !pInvis() && onRoad && dist(BABA.x, BABA.y, P.x, P.y) < 3.2) { BABA.state = 'charge'; BABA.over = null; sfx.sting(); }
      if (BABA.y >= 31.4) { BABA.state = 'idle'; BABA.timer = (G.flags.dogFollow ? 3 : 6) + Math.random() * 3; }   // 人面犬跟著＝很吵，她來得更快
      break;
  }
}
async function babaHit() {
  BABA.state = 'return'; BABA.over = null; sfx.hurt(); shake = 10; damage(1);
  if (G.mode !== 'play') return;
  await says(['一陣風從背後撞上來——', '老婆婆的臉，貼在我的臉旁邊，咧嘴笑著跑過去了。', '（……要躲起來才行。）']);
  P.inv = 2;
}

/* ---------- 人面犬：跟著走的時候會吠（製造聲音） ---------- */
function dogUpdate(dt) {
  DOG.moving = false;
  if (DOG.state !== 'follow') return;
  const d = dist(DOG.x, DOG.y, P.x, P.y);
  if (d > 1.6 && typeof walker === 'function') walker(DOG, P.x, P.y, d > 4 ? 4 : 2.4, dt);
  G.dogBark = (G.dogBark || 0) - dt;
  if (G.dogBark <= 0) { G.dogBark = 7 + Math.random() * 4; addNoise(DOG.x, DOG.y, 5); tone(180, .25, 'square', .03, 140); }
}

/* ---------- 扭來扭去：不要用手電筒照著看 ---------- */
function kuneUpdate(dt) {
  if (!P.light || P.hidden) return;
  const dx = KUNE.x - P.x, dy = KUNE.y - P.y, d = Math.hypot(dx, dy); if (d > 14) return;
  const [fx, fy] = DIRV[P.dir];
  if ((fx * dx + fy * dy) / d > .8) {
    G.fear = Math.min(100, (G.fear || 0) + 26 * dt); G.kuneLook = (G.kuneLook || 0) + dt;
    if (G.kuneLook > .6 && !G.flags.kuneSeen) { G.flags.kuneSeen = true; toast('田裡有白色的東西在扭——不要看！'); sfx.sting(); }
  } else G.kuneLook = 0;
}

/* ---------- 八尺大人：圍牆上探頭，學媽媽的聲音 ---------- */
async function hachiEvent(i) {
  HACHI.i = i; HACHI.show = 1; G.flags['hachi' + i] = 1;
  const [hx] = HACHI_SPOTS[i];
  for (let k = 0; k < 3; k++) { tone(200 + k * 15, .18, 'triangle', .05); await wait(TEST ? 5 : 220); }
  await says([['？？？', '「ぽ……ぽぽ……ぽぽぽ……」'], '圍牆上面……探出一頂白色的大帽子。']);
  const opts = ['「……媽？」（回應）', '不要出聲，低頭繼續走'];
  if ((G.inv.salt || 0) > 0) opts.push('撒鹽');
  const a = await choose('？？？', i === 2 ? '「咪醬。媽媽在這裡等妳好久了。過來，讓媽媽抱一下。」' : '「咪醬？是媽媽喔。這麼晚了，快點過來。」', opts, TEST ? 0 : 7000);
  if (a === 2) {
    G.inv.salt--; updateHUD(); sfx.whoosh();
    await says(['把整包鹽撒向圍牆。', '「ぽ——」聲音一下子斷掉了。白色的帽子，縮回了圍牆後面。']);
  } else if (a === 0) {
    sfx.sting(); shake = 12; damage(1); G.fear = Math.min(100, (G.fear || 0) + 30);
    if (G.mode !== 'play') return;
    await says(['一隻好長好長的手，從圍牆上伸了下來——', '冰冷的指尖碰到了臉頰。', '……那不是媽媽的聲音。（不能回應她。）']);
  } else {
    await says(['低著頭，一步一步往前走。', '「ぽぽ……ぽ……」', '……聲音慢慢遠了。']);
  }
  HACHI.show = 0;
  if (i === 2) { G.flags.alleyDone = 1; setObj('走到巷子盡頭的車站'); saveCP('alley'); }
}

/* ---------- 包一層：接進掛勾 ---------- */
TRIG.push(
  { scene: 6, id: 'convIn', when: () => in6('conv', P.x, P.y), run: async () => { await says(['「歡迎光臨。」', '「歡迎光臨。」', '「歡迎光臨。」……自動門沒有關上，一直在說話。']); } },
  { scene: 6, id: 'roadIn', when: () => onRoad6(P.x, P.y) && P.y < 29, run: async () => { await says(['往北的公路。兩邊是黑漆漆的田。', '……路燈只到這裡為止。']); setObj('沿著公路往北走（聽到背後有腳步聲就躲進公車亭）'); saveCP('road2'); } },
  { scene: 6, id: 'alleyIn', when: () => inAlley6(P.x, P.y), run: async () => { await says(['住宅區的小巷。兩邊是高高的圍牆。', '……每一戶都沒有開燈。']); setObj('穿過住宅區的小巷，往西走'); saveCP('alley0'); } },
  ...HACHI_SPOTS.map(([hx], i) => ({ scene: 6, id: 'hachi' + i, when: () => inAlley6(P.x, P.y) && Math.abs(P.x - hx) < 2.2, run: () => hachiEvent(i) })),
);
const _sceneUpdate5 = sceneUpdate;
sceneUpdate = function (dt) { if (G.scene !== 6) return _sceneUpdate5(dt); babaUpdate(dt); dogUpdate(dt); kuneUpdate(dt); };
const _sceneAction5 = sceneAction;
sceneAction = async function (o) { if (G.scene === 6) return ch5Action(o); return _sceneAction5(o); };
const _sceneSprites5 = sceneSprites;
sceneSprites = function (list) {
  if (G.scene !== 6) return _sceneSprites5(list);
  if (BABA.state !== 'off' && IMG.babaa) list.push({ d: BABA.x + BABA.y, f: () => drawSprite(IMG.babaa, BABA.x, BABA.y, BABA.dir, BABA.moving ? BABA.frame : 0, { lean: BABA.state === 'charge' ? .22 : 0, jit: BABA.state === 'charge' ? (Math.random() - .5) * 2 : 0 }) });
  if (IMG.jinmen) list.push({ d: DOG.x + DOG.y, f: () => drawSprite(IMG.jinmen, DOG.x, DOG.y, DOG.state === 'sit' ? 4 : DOG.dir, DOG.moving ? DOG.frame : 0) });
  if (HACHI.show && IMG.hachi) { const [hx, hy] = HACHI_SPOTS[HACHI.i]; list.push({ d: hx + hy - 1, f: () => drawSprite(IMG.hachi, hx, hy - .2, 4, 0, { bob: 18 + Math.sin(G.t * 3) * 2, noShadow: true }) }); }
  list.push({ d: KUNE.x + KUNE.y, f: () => drawKune() });
};
function drawKune() {   // 田裡的白色人形：只是扭動的線條（遠看看不清楚）
  const [sx, sy] = iso(KUNE.x, KUNE.y); if (sx < -40 || sx > VW + 40 || sy < -60 || sy > VH + 40) return;
  ctx.strokeStyle = 'rgba(235,235,240,.85)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  const t = G.t * 3.2;
  for (const [ox, ph, len] of [[0, 0, 26], [-3, 1.7, 18], [3, 3.1, 18], [-2, 4.4, 14], [2, 5.6, 14]]) {
    ctx.beginPath();
    for (let k = 0; k <= 10; k++) { const v = k / 10, x = sx + ox + Math.sin(t + ph + v * 5) * (4 + v * 6), y = sy - v * len - (ph ? 10 : 0); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(240,240,245,.9)'; ctx.beginPath(); ctx.arc(sx + Math.sin(t) * 6, sy - 28, 3.2, 0, 7); ctx.fill();
}
const _sceneHUD5 = sceneHUD;
sceneHUD = function (s) { _sceneHUD5(s); if (G.inv.salt) s.push(`<div class="s">鹽包×${G.inv.salt}<em>八尺大人用</em></div>`); };
const _sceneOnLoad5 = sceneOnLoad;
sceneOnLoad = function (cp) { if (G.scene !== 6) return _sceneOnLoad5(cp); roadReset(); };
const _takeItem5 = takeItem;
takeItem = async function (it) {
  if (G.scene === 6 && it.id === 'salt') { it.taken = true; G.inv.salt = (G.inv.salt || 0) + 1; sfx.pick(); updateHUD(); toast('得到【鹽包】　八尺大人探頭時可以撒鹽逼退'); return; }
  return _takeItem5(it);
};
const _sceneDrawObj5 = sceneDrawObj;
sceneDrawObj = function (o, cx, cy, shaking) {
  const { x, y } = o;
  switch (o.t) {
    case 'register': box(x + .1, y + .2, .8, .6, 16, '#d8dce0', '#a8acb0', '#989ca0'); ctx.fillStyle = '#3a3e44'; ctx.fillRect(cx - 4, cy - 26, 9, 7); ctx.fillStyle = '#7fe0a0'; ctx.fillRect(cx - 3, cy - 25, 6, 2); break;
    case 'cshelf': box(x + .1, y + .2, .8, .6, 26, '#c8ccd0', '#9aa0a6', '#8a9096'); for (let k = 0; k < 3; k++) faceRect(x, y, 'L', .15, .85, 6 + k * 7, 9 + k * 7, ['#c84a3a', '#3a8ac8', '#e8c84a'][k]); break;
    case 'tvwin': {
      box(x, y + .1, 1, .3, 26, '#2a2c30', '#1c1e22', '#18191c');
      const on = Math.sin(G.t * 7) > -.6;
      for (let k = 0; k < 3; k++) { ctx.fillStyle = on ? '#9aa8c8' : '#222'; ctx.fillRect(cx - 12 + k * 8, cy - 22, 6, 5); if (on) { ctx.fillStyle = '#2a2a30'; ctx.fillRect(cx - 10 + k * 8, cy - 21, 2, 3); } }
      break;
    }
    case 'dogspot': break;   // 人面犬由 sceneSprites 畫
    case 'vend2': box(x + .15, y + .2, .7, .6, 32, '#b83a3a', '#8a2a2a', '#7a2424'); faceRect(x, y, 'L', .2, .8, 18, 28, '#e8f0ff'); break;
    case 'busstop': box(x + .05, y + .1, .9, .8, 4, '#5a5e64', '#404448', '#383b40', 28); box(x + .05, y + .1, .9, .1, 28, '#6a6e74', '#4a4e54', null); box(x + .2, y + .5, .6, .25, 8, '#6a5038', '#4a3826', '#3e2f20'); break;
    case 'ditch': box(x, y + .2, 1, .6, 2, '#1a1c1e', '#111', '#111'); ctx.fillStyle = 'rgba(90,110,130,.4)'; ctx.fillRect(cx - 8, cy - 3, 16, 2); break;
    case 'roadsign': ctx.fillStyle = '#5a5e64'; ctx.fillRect(cx - 1, cy - 30, 2, 30); ctx.fillStyle = '#2f6a3c'; ctx.fillRect(cx - 10, cy - 40, 20, 10); ctx.fillStyle = '#fff'; ctx.fillRect(cx - 1, cy - 38, 2, 6); break;
    case 'stlight': box(x + .1, y + .1, .8, .8, 36, '#6a6058', '#4a423c', '#3e3832'); ctx.fillStyle = '#ffe8b0'; ctx.fillRect(cx - 6, cy - 30, 12, 6); ctx.fillStyle = '#2a2420'; ctx.fillRect(cx - 4, cy - 29, 8, 1); break;
    default: return _sceneDrawObj5(o, cx, cy, shaking);
  }
};
// 第三章結束 → 走出校門（原本直接到車站）
ch3End = function () { if (!TEST) try { localStorage.setItem('yakou_kisaragi_true', G.flags.trueEnd ? '1' : '0'); } catch (e) { } return startRoad(); };

/* ---------- 自動測試（?test=ch5）：便利商店存檔 → 人面犬 → 公路（婆婆追來時躲公車亭）→ 小巷三次八尺（不回應）→ 車站 ---------- */
async function testCh5() {
  const tp = (x, y) => { P.x = x; P.y = y; };
  try {
    G.inv.pages = [1, 2, 3, 4, 5, 6, 7]; G.inv.flashlight = true; G.inv.phone = true; G.flags.trueEnd = true;
    await startRoad(); await waitFree();
    if (G.scene !== 6) throw 'not in scene 6';
    TEST_CHOICE = o => Math.max(0, o.findIndex(t => /不要出聲|問往車站/.test(t)));
    tp(12.5, 28.3); P.dir = 0; await interact(); await waitFree();
    if (!G.flags.receipt) throw 'receipt';
    tp(30.5, 28.6); P.dir = 0; await interact(); await waitFree(); await interact(); await waitFree();
    if (G.flags.dogFollow) throw 'dog follows too early';
    tp(34.5, 26); await wait(80); await waitFree();
    const t0 = G.t; while (BABA.state !== 'charge' && G.t - t0 < 8) await wait(20);
    if (BABA.state !== 'charge') throw 'baba ' + BABA.state;
    tp(36.5, 23.4); const bs = OBJ.find(o => o.t === 'busstop' && o.y === 24); hide(bs);
    const t1 = G.t; while (BABA.state === 'charge' && G.t - t1 < 8) await wait(20);
    if (G.hearts < 5) throw 'hit while hiding';
    unhide(); BABA.state = 'off';
    for (const [hx] of HACHI_SPOTS) { tp(hx + .2, 3.5); await wait(80); await waitFree(); }
    if (!G.flags.alleyDone || G.hearts < 5) throw 'hachi ' + G.hearts;
    tp(4.5, 3.5); P.dir = 2; await interact();
    const t2 = performance.now(); while (G.scene !== 5 && performance.now() - t2 < 15000) await wait(100);
    document.title = (G.scene === 5 ? 'PASS ' : 'FAIL ') + JSON.stringify(stateSummary());
  } catch (e) { document.title = 'ERR ' + e + ' ' + JSON.stringify(stateSummary()); }
}

/* ---------- 街景外觀（10/23）：店面、圍牆、護欄取代學校的牆；柏油路與人行道地磚 ----------
   walls6.png（Gemini，tools/street_walls.py 切）：0 鐵捲門 1 生鏽鐵捲門 2 便利商店玻璃 3 暗櫥窗 4 磁磚牆＋鐵窗 5 水泥磚圍牆 6 圍牆＋爬藤 7 灰泥牆＋亮窗 */
function texFace6(x, y, side, idx, shade, h, u0 = 0, u1 = 1) {
  const img = IMG.walls6; if (!img) return;
  const P0 = side === 'L' ? iso(x + u0, y + 1) : iso(x + 1, y + 1 - u0), P1 = side === 'L' ? iso(x + u1, y + 1) : iso(x + 1, y + 1 - u1);
  const w = u1 - u0;
  ctx.setTransform(.5 * w / 2, (side === 'L' ? .25 : -.25) * w / 2, 0, h / 68, P0[0], P0[1] - h);
  ctx.drawImage(img, idx * 64 + u0 * 64, 0, 64 * w, 68, 0, 0, 64 * w * 1, 68);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (shade) poly([P0, P1, [P1[0], P1[1] - h], [P0[0], P0[1] - h]], shade);
}
const SHOPS6 = [[2, 6, 0], [7, 14, 2], [15, 22, 3], [23, 28, 1]];   // y=30 店面：x 範圍 → 貼圖
function wall6Kind(x, y) {
  if (y === 35 || x === 1 || (y >= 30 && x >= 32) || (x === 37 && y >= 30)) return 'rail';
  if (y >= 25 && y <= 30 && x >= 2 && x <= 29 && !(x === 29 && y < 30)) return 'shop';
  if (y === 2 || (y <= 4 && (x === 2 || x === 38))) return 'house';
  return 'block';
}
function sceneWall(x, y) {
  if (G.scene !== 6 || !IMG.walls6) return false;
  const c = at(x, y); if (c === 'D' && !DOORS[x + ',' + y].locked) return false;
  const k = wall6Kind(x, y), h0 = (x * 73 + y * 31) % 7;
  const L = !['#', 'D'].includes(at(x, y + 1)), R = !['#', 'D'].includes(at(x + 1, y));
  if (k === 'rail') {   // 低矮的水泥護欄＋鐵欄杆
    box(x, y + .35, 1, .3, 7, '#8a8a84', '#6a6a66', '#5a5a56');
    ctx.strokeStyle = '#9aa0a4'; ctx.lineWidth = 1; const [a, b] = iso(x, y + .5), [c2, d] = iso(x + 1, y + .5);
    ctx.beginPath(); ctx.moveTo(a, b - 15); ctx.lineTo(c2, d - 15); ctx.moveTo(a, b - 7); ctx.lineTo(a, b - 15); ctx.stroke();
    return true;
  }
  if (k === 'shop') {
    const H = 44, inner = y < 30 && x >= 7 && x <= 14;   // 便利商店裡面：白牆
    if (L) { const sh = y === 30 ? (SHOPS6.find(([a, b]) => x >= a && x <= b) || [0, 0, 4])[2] : 4;
      if (inner) box(x, y, 1, 1, H, null, '#c9cdc8', null); else texFace6(x, y, 'L', sh, 'rgba(0,0,0,.08)', H); }
    if (R) { if (inner) box(x, y, 1, 1, H, null, null, '#a9ada8'); else texFace6(x, y, 'R', 4, 'rgba(0,0,0,.4)', H); }
    box(x, y, 1, 1, H, '#3b3833', null, null);
    if (L && y === 30 && [4, 17, 25].includes(x)) {   // 直立招牌（沒有字，只有燈）
      const col = { 4: '#c84a3a', 17: '#3a7ac8', 25: '#d8a83a' }[x], on = x !== 25 || Math.sin(G.t * 9) + Math.sin(G.t * 2.3) > -.8;
      box(x + .45, y + 1, .1, .45, 20, '#2a2a2a', on ? col : '#3a3a3a', '#222', 16);
    }
    return true;
  }
  const H = k === 'house' ? WALLH : 20;
  const idx = k === 'house' ? (h0 < 2 ? 7 : h0 < 4 ? 4 : 5) : (h0 === 3 ? 6 : 5);
  if (L) texFace6(x, y, 'L', idx, 'rgba(0,0,0,.1)', H);
  if (R) texFace6(x, y, 'R', idx === 7 ? 5 : idx, 'rgba(0,0,0,.4)', H);
  box(x, y, 1, 1, H, k === 'house' ? '#4a3c34' : '#8c8c86', null, null);
  return true;
}
// 地面：馬路＝柏油、人行道＝地磚、住宅區小巷＝較舊的柏油；田邊路肩維持原本的土
function sceneTile(g, x, y, c) {
  if (G.scene !== 6) return false;
  const v = (x * 7 + y * 3) % 3;
  if (c === '=' || (c === ',' && y < 9 && !(x === 33 || x === 36))) {
    diamond(g, x, y, c === '=' ? ['#3c3e44', '#3a3c42', '#3e4046'][v] : ['#4a4a4c', '#47474a', '#4c4c4e'][v]);
    speck(g, x, y, ['#55575c', '#2e3034', '#4a4c51'], 10); return true;
  }
  if (c === ',' && !(x === 33 || x === 36)) {   // 人行道：灰紅色方磚
    diamond(g, x, y, (x + y) % 2 ? '#7a6660' : '#74605a');
    g.strokeStyle = 'rgba(30,20,18,.35)'; g.lineWidth = 1; g.beginPath();
    for (const t of [0, .5]) { let [a, b] = isoW(x + t, y), [c2, d] = isoW(x + t, y + 1); g.moveTo(a, b); g.lineTo(c2, d); [a, b] = isoW(x, y + t); [c2, d] = isoW(x + 1, y + t); g.moveTo(a, b); g.lineTo(c2, d); }
    g.stroke(); speck(g, x, y, ['#8a7670', '#5e4c46'], 4); return true;
  }
  return false;
}
const _road6Floor0 = road6Floor;
road6Floor = function (g) {
  _road6Floor0(g);
  g.fillStyle = 'rgba(200,200,190,.5)';   // 路緣石
  for (let x = 2; x < 32; x += .25) for (const yy of [32, 34]) { const [a, b] = isoW(x, yy); g.fillRect(a | 0, b | 0, 2, 1); }
  for (let k = 0; k < 4; k++) { const [a, b] = isoW(32.1 + k * .45, 32); const [c2, d] = isoW(32.1 + k * .45, 34); g.fillStyle = 'rgba(230,228,215,.4)'; g.beginPath(); g.moveTo(a, b); g.lineTo(a + 6, b + 3); g.lineTo(c2 + 6, d + 3); g.lineTo(c2, d); g.fill(); }   // 斑馬線
  for (const [mx, my] of [[9.5, 32.6], [22.5, 33.4], [34.6, 19.5]]) { const [a, b] = isoW(mx, my); g.fillStyle = '#26282c'; g.beginPath(); g.ellipse(a, b, 6, 3, 0, 0, 7); g.fill(); g.strokeStyle = '#4c4e52'; g.stroke(); }   // 人孔蓋
};
// 街景道具
const _sceneDrawObj6b = sceneDrawObj;
sceneDrawObj = function (o, cx, cy, shaking) {
  if (G.scene !== 6) return _sceneDrawObj6b(o, cx, cy, shaking);
  const { x, y } = o;
  if (o.t === 'pole6') {   // 電線桿＋往下一根拉的電線
    box(x + .4, y + .4, .2, .2, 70, '#6a6660', '#55514c', '#48443f');
    ctx.fillStyle = '#4a4640'; ctx.fillRect(cx - 9, cy - 66, 18, 2);
    const nx = OBJ.find(p => p.t === 'pole6' && p.x > x);
    if (nx) { const [ax, ay] = iso(nx.x + .5, nx.y + .5); ctx.strokeStyle = 'rgba(20,20,22,.8)'; ctx.lineWidth = 1;
      for (const dx of [-8, 8]) { ctx.beginPath(); ctx.moveTo(cx + dx, cy - 66); ctx.quadraticCurveTo((cx + ax) / 2 + dx, (cy + ay) / 2 - 52, ax + dx, ay - 66); ctx.stroke(); } }
    return true;
  }
  if (o.t === 'scooter') {
    const col = ['#c8c4b8', '#3a5a8a', '#8a2a2a'][o.v || 0];
    ctx.fillStyle = '#151515'; ctx.beginPath(); ctx.ellipse(cx - 7, cy - 2, 3, 3, 0, 0, 7); ctx.ellipse(cx + 7, cy + 2, 3, 3, 0, 0, 7); ctx.fill();
    poly([[cx - 9, cy - 6], [cx + 4, cy], [cx + 5, cy - 8], [cx - 6, cy - 13]], col);
    ctx.fillStyle = '#222'; ctx.fillRect(cx - 7, cy - 15, 9, 3);
    ctx.fillStyle = col; ctx.fillRect(cx + 4, cy - 16, 3, 12); ctx.fillStyle = '#ccc'; ctx.fillRect(cx + 2, cy - 18, 8, 2);
    return true;
  }
  return _sceneDrawObj6b(o, cx, cy, shaking);
};
