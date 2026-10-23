/* 夜校・如月　第二章（下）擴充：家政教室與座敷童子（2026-10-23，故事延長）
   三個器官模型裡的「肺臟」不在視聽教室了，而是在家政教室最裡面的冰箱裡。
   座敷童子面對牆壁數「だ・る・ま・さ・ん・が・こ・ろ・ん・だ」：數的時候可以動；她一回頭，妳還在動就會被抓（扣 1 心、送回門口）。
   拿到肺臟之後，她數得更快。躲起來（實驗桌下）的時候她看不到。zashiki.png（Gemini 1×4：背對摀眼、背對、回頭、正面）。
   載入順序：最後。 */

const HE = { x0: 42, y0: 4, x1: 56, y1: 16 };
const inHE = (x, y) => x >= HE.x0 && x <= HE.x1 && y >= HE.y0 && y <= HE.y1;
const ZW = { x: 55.5, y: 10.5, state: 'chant', t: 3, word: 0, caught: 0 };
const DARUMA = ['だ', 'る', 'ま', 'さ', 'ん', 'が', 'こ', 'ろ', 'ん', 'だ'];
loadImages(['zashiki']);

function buildHomeEc() {
  fill(38, 10, 40, 12, ':'); for (let x = 38; x <= 41; x++) { if (at(x, 9) === 'X') put(x, 9, '#'); if (at(x, 13) === 'X') put(x, 13, '#'); }
  put(37, 10, ':'); put(37, 11, ':'); put(37, 12, ':');
  for (let y = HE.y0 - 1; y <= HE.y1 + 1; y++) for (let x = HE.x0 - 1; x <= HE.x1 + 1; x++) if (at(x, y) === 'X' || at(x, y) === ':') put(x, y, '#');
  fill(HE.x0, HE.y0, HE.x1, HE.y1, '_');
  door(41, 11, { sign: '家政教室' });
  for (const [x, y] of [[45, 6], [45, 9], [45, 13], [49, 6], [49, 13], [52, 9]]) obj('labtable', x, y);   // 調理台（可以躲在下面）
  obj('fridge', 55, 5, { act: 'fridge', label: '打開冰箱' });
  obj('stove', 52, 4); obj('stove', 50, 4);
  obj('henote', 43, 16, { act: 'henote', label: '看牆上的貼紙' });
  LIGHTS.push({ x: 55.5, y: 6, r: 1.6, c: '200,230,255', id: 'fridgeL' }, { x: 39.5, y: 11, r: 1.4, c: '150,170,220' }, { x: 55.5, y: 10.5, r: 1.6, c: '255,180,170' });
  // 肺臟模型不在視聽教室了（存檔用索引：不刪，只關掉）
  const lung = ITEMS.find(i => i.id === 'organ_lung'); if (lung) lung.off = true;
}
{ const _b = SCENES[3]; SCENES[3] = function () { _b(); buildHomeEc(); }; }

/* ---------- だるまさんがころんだ ---------- */
function zwUpdate(dt) {
  if (!inHE(P.x, P.y) || G.lock) { ZW.state = 'chant'; ZW.t = 2; ZW.word = 0; return; }
  const fast = G.flags.lungTaken ? .55 : 1;
  ZW.t -= dt;
  if (ZW.state === 'chant') {
    const total = (2.6 + Math.random() * 0) * fast, per = total / DARUMA.length;
    const w = Math.min(DARUMA.length, Math.floor((total - ZW.t) / per));
    while (ZW.word < w) { tone(520 - ZW.word * 18, .12, 'triangle', .04); ZW.word++; toast(DARUMA.slice(0, ZW.word).join('・')); }
    if (ZW.t <= 0) { ZW.state = 'look'; ZW.t = 2.1; ZW.grace = .25; sfx.sting(); toast('——她回頭了。（不要動）'); }
  } else {
    ZW.grace -= dt;
    if (ZW.grace <= 0 && P.moving && !P.hidden && !pInvis() && !G.lock) zwCatch();
    if (ZW.t <= 0) { ZW.state = 'chant'; ZW.t = (2.6 + Math.random() * 1.6) * fast; ZW.word = 0; }
  }
}
async function zwCatch() {
  ZW.state = 'chant'; ZW.t = 3; ZW.word = 0; ZW.caught++;
  damage(1); sfx.hurt(); shake = 12; setPose('hurt', 1);
  if (G.mode !== 'play') return;
  await says(['「——動了。」', '小小的、冰冷的手牽住了我的手。', '「妳輸了。再來一次。」', '（回過神來，人站在家政教室的門口。）']);
  P.x = 42.5; P.y = 11.5; P.inv = 1.5;
}

/* ---------- 互動 ---------- */
async function heAction(o) {
  const F = G.flags, I = G.inv;
  switch (o.act) {
    case 'henote': await says([['貼紙', '「家政教室使用守則：用完的食材請放回冰箱。」'], '底下有人用蠟筆畫了一個小女孩，旁邊寫著：', ['', '「陪我玩。だるまさんがころんだ。動了就輸。」']]); return;
    case 'fridge':
      if (F.lungTaken) { await says(['冰箱裡只剩下一盒過期的牛奶。']); return; }
      F.lungTaken = 1; (I.organs = I.organs || []).push('organ_lung'); sfx.pick(); updateHUD();
      toast(`得到【肺臟模型】（${I.organs.length} / 3）`);
      await says(['冰箱的冷光照亮了整個房間。', '冷藏室裡，整整齊齊地擺著一個塑膠的肺臟模型。……用保鮮膜包著。', '身後，數數的聲音變快了。']);
      saveCP('lung'); return;
  }
  return false;
}
{ const _a = sceneAction; sceneAction = async function (o) { if (G.scene === 3 && (o.act === 'fridge' || o.act === 'henote')) { await heAction(o); return true; } return _a(o); }; }
{ const _u = sceneUpdate; sceneUpdate = function (dt) { _u(dt); if (G.scene === 3 && G.mode === 'play') zwUpdate(dt); }; }
{ const _s = sceneSprites; sceneSprites = function (list) {
    _s(list); if (G.scene !== 3) return;
    list.push({ d: ZW.x + ZW.y, f: () => {
      const im = IMG.zashiki, [sx, sy] = iso(ZW.x, ZW.y);
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(sx, sy, 6, 3, 0, 0, 7); ctx.fill();
      if (!im) { ctx.fillStyle = '#a02a2a'; ctx.fillRect(sx - 4, sy - 22, 8, 16); ctx.fillStyle = '#111'; ctx.fillRect(sx - 4, sy - 30, 8, 8); return; }
      const fw = im.width / 4, k = ZW.state === 'look' ? (G.t % 1 < .15 ? 2 : 3) : (ZW.word < 9 ? 0 : 1);
      ctx.drawImage(im, k * fw, 0, fw, im.height, Math.round(sx - fw / 2), Math.round(sy - im.height + 1), fw, im.height);
    } });
  }; }
{ const _d = sceneDrawObj; sceneDrawObj = function (o, cx, cy, shaking) {
    if (G.scene !== 3) return _d(o, cx, cy, shaking);
    const { x, y } = o;
    switch (o.t) {
      case 'fridge': box(x + .1, y + .15, .8, .7, 34, '#d8dcd8', '#aeb2ae', '#9a9e9a'); ctx.fillStyle = '#7a7e7a'; ctx.fillRect(cx - 7, cy - 22, 1, 6); return true;
      case 'stove': box(x + .05, y + .2, .9, .6, 14, '#5a5e64', '#404448', '#383b40'); ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.ellipse(cx - 4, cy - 15, 3, 1.5, 0, 0, 7); ctx.ellipse(cx + 4, cy - 15, 3, 1.5, 0, 0, 7); ctx.fill(); return true;
      case 'henote': faceRect(x, y, 'L', .25, .75, 14, 26, '#e8dcb8'); return true;
    }
    return _d(o, cx, cy, shaking);
  }; }
{ const _o = sceneOnLoad; sceneOnLoad = function (cp) { _o(cp); if (G.scene !== 3) return; Object.assign(ZW, { state: 'chant', t: 3, word: 0 }); const lung = ITEMS.find(i => i.id === 'organ_lung'); if (lung) lung.off = true; }; }
TRIG.push({ scene: 3, id: 'heIn', when: () => inHE(P.x, P.y), run: async () => { await says(['家政教室。冰箱的燈在最裡面一閃一閃。', '房間的另一頭，一個穿紅色和服的小女孩，面對著牆壁站著。', '「だるまさんが……」', '（她數數的時候可以走。她回頭的時候——絕對不能動。）']); } });
// 器官模型的提示改成三個地方
LORE.push(['zashiki', '座敷童子的遊戲', '家政教室裡，面對牆壁數數的紅色和服小女孩。', '「だるまさんがころんだ」——她回頭的時候還在動，就輸了。', () => G.flags.lungTaken]);
// 測試：第二章（下）的肺臟改在家政教室冰箱（testCh2b 會呼叫）
async function testHomeEc() {
  P.x = 54.5; P.y = 5.4; P.dir = 0; ZW.state = 'chant'; ZW.t = 99;
  await interact(); await waitFree();
  if (!G.flags.lungTaken) throw 'lung';
}
