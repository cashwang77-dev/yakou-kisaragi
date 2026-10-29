/* 夜校・如月　終章「如月車站」外觀（2026-10-23 使用者：車站不像車站、電車不像電車）
   walls5.png（Gemini，tools/street_walls.py 切）：0 木板牆＋腰板 1 售票窗口 2 時刻表 3 亮燈的窗 4 月台水泥側面 5 紅磚隧道口 6 候車室綠牆＋時鐘 7 舊海報框
   train_side.png／train_front.png（Gemini，tools/train_tex.py 切）：一節車廂 7 格長。載入順序：ch5.js 之後（包住第四章的 sceneWall／sceneTile）。 */

const CAR = 7, TRAIN_H = 50;
// 貼圖貼到 x 方向的牆面（L 面＝朝 +y、面向鏡頭）：src 從 sx 起取 sw 寬
function faceTexL(img, sx, sw, x, yF, w, h, base = 0) {
  const [X, Y] = iso(x, yF);
  ctx.setTransform(16 * w / sw, 8 * w / sw, 0, h / img.height, X, Y - h - base);
  ctx.drawImage(img, sx, 0, sw, img.height, 0, 0, sw, img.height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
function faceTexR(img, x, yF, w, h, base = 0) {   // R 面（朝 +x）：從 (x, yF) 往 -y 延伸 w
  const [X, Y] = iso(x, yF);
  ctx.setTransform(16 * w / img.width, -8 * w / img.width, 0, h / img.height, X, Y - h - base);
  ctx.drawImage(img, 0, 0); ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/* 電車的一格：i＝從車頭算起第幾格（每 7 格一節）；front：最右邊那格畫車頭 */
function trainSeg(x, ty, i, len, opt = {}) {
  const yF = ty + .45, sideImg = IMG.train_side;
  box(x, ty - .45, 1, .9, TRAIN_H, '#6c6f72', null, null);
  if (sideImg) {
    const k = i % CAR, sw = sideImg.width / CAR;
    faceTexL(sideImg, k * sw, sw, x, yF, 1, TRAIN_H);
    if (!opt.lit) { const [a, b] = iso(x, yF), [c, d] = iso(x + 1, yF); poly([[a, b], [c, d], [c, d - TRAIN_H], [a, b - TRAIN_H]], 'rgba(5,6,12,.38)'); }
    if (opt.open) faceRect(Math.floor(x), Math.floor(ty - .45), 'L', (x % 1) + .3, (x % 1) + .7, 12, 38, '#07080b');
  }
  if (i === len - 1 && IMG.train_front) faceTexR(IMG.train_front, x + 1, yF, .9, TRAIN_H);
  if (k0(i) === 3) {   // 集電弓
    const [a, b] = iso(x + .5, ty); ctx.strokeStyle = '#2a2c30'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(a - 6, b - TRAIN_H); ctx.lineTo(a, b - TRAIN_H - 10); ctx.lineTo(a + 6, b - TRAIN_H); ctx.moveTo(a - 8, b - TRAIN_H - 10); ctx.lineTo(a + 8, b - TRAIN_H - 10); ctx.stroke();
  }
}
const k0 = i => i % CAR;

/* ---------- 站房的牆：外面木板、候車室裡面綠牆 ---------- */
{ const _w = typeof sceneWall === 'function' ? sceneWall : null;
  sceneWall = function (x, y) {
    if (G.scene !== 5 || !IMG.walls5) return _w ? _w(x, y) : false;
    if (at(x, y) === 'D') return false;
    const L = !['#', 'D'].includes(at(x, y + 1)), R = !['#', 'D'].includes(at(x + 1, y)), H = 56;
    const inWait = x >= 26 && x <= 37 && y <= 9, interiorN = y <= 2;   // 北牆：從室內看
    if (L) {
      const idx = interiorN ? (inWait ? 6 : 2) : x === 24 ? 1 : [0, 3, 0, 7][x % 4];
      faceTexL(IMG.walls5, idx * 64, 64, x, y + 1, 1, H);
      const [a, b] = iso(x, y + 1), [c, d] = iso(x + 1, y + 1); poly([[a, b], [c, d], [c, d - H], [a, b - H]], 'rgba(0,0,0,.1)');
    }
    if (R) {
      const inside = (x === 26 && y >= 2 && y <= 8) || (x === 17 && y >= 3 && y <= 6);
      const [X, Y] = iso(x + 1, y + 1);
      ctx.setTransform(16 / 64, -8 / 64, 0, H / 68, X, Y - H); ctx.drawImage(IMG.walls5, (inside && x === 26 ? 6 : 0) * 64, 0, 64, 68, 0, 0, 64, 68); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const [a, b] = iso(x + 1, y + 1), [c, d] = iso(x + 1, y); poly([[a, b], [c, d], [c, d - H], [a, b - H]], 'rgba(0,0,0,.38)');
    }
    box(x, y, 1, 1, H, '#3a3430', null, null);
    return true;
  }; }

/* ---------- 地面：月台水泥、邊緣黃色導盲磚 ---------- */
{ const _t = typeof sceneTile === 'function' ? sceneTile : null;
  sceneTile = function (g, x, y, c) {
    if (G.scene !== 5) return _t ? _t(g, x, y, c) : false;
    if (c !== '=') return false;
    const edge = (y === 11 || y === 16) && !(x >= 22 && x <= 23 && y !== 19) && x < P_END;
    if (edge) {
      diamond(g, x, y, '#b89a2a');
      g.fillStyle = 'rgba(80,60,10,.55)';
      for (let u = .15; u < 1; u += .23) for (let v = .15; v < 1; v += .23) { const [a, b] = isoW(x + u, y + v); g.fillRect(a | 0, b | 0, 1, 1); }
    } else {
      diamond(g, x, y, ['#7d7c78', '#787773', '#82817c'][(x * 7 + y * 3) % 3]); speck(g, x, y, ['#8e8d88', '#66655f'], 6);
      const [a, b] = isoW(x, y), [c2, d] = isoW(x + 1, y); g.strokeStyle = 'rgba(40,40,38,.25)'; g.beginPath(); g.moveTo(a, b); g.lineTo(c2, d); g.stroke();
    }
    return true;
  }; }

/* ---------- 物件：電車、屋簷柱子、站名牌、隧道口 ---------- */
{ const _d = sceneDrawObj;
  sceneDrawObj = function (o, cx, cy, shaking) {
    if (G.scene !== 5) return _d(o, cx, cy, shaking);
    const { x, y } = o;
    if (o.t === 'train' && IMG.train_side) { trainSeg(x, TRACK1, x - 4, 14, { open: !!o.act }); return; }
    if (o.t === 'pillar5') {
      box(x + .42, y + .42, .16, .16, 62, '#5a5650', '#48443f', '#3c3934');
      const [a, b] = iso(x + .5, y + .5); ctx.fillStyle = '#2e2b27'; ctx.fillRect(a - 18, b - 66, 36, 4);   // 屋簷的梁
      ctx.fillStyle = '#f2ecd0'; ctx.fillRect(a - 5, b - 62, 10, 2);                                      // 日光燈
      return;
    }
    if (o.t === 'ekimei' || o.t === 'stsign') { drawEkimei(x, y); return; }
    if (o.t === 'tunnel' && IMG.walls5) {
      box(x, y - 1.5, 1, 4, 56, '#5a3a30', null, null);
      const [X, Y] = iso(x + 1, y + 2.5); ctx.setTransform(16 * 4 / 64, -8 * 4 / 64, 0, 56 / 68, X, Y - 56); ctx.drawImage(IMG.walls5, 5 * 64, 0, 64, 68, 0, 0, 64, 68); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const [a, b] = iso(x + 1, y + 1.6); ctx.fillStyle = '#030304'; ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(a, b - 30); ctx.quadraticCurveTo(a + 10, b - 44, a + 22, b - 41); ctx.lineTo(a + 22, b - 11); ctx.fill();
      return;
    }
    return _d(o, cx, cy, shaking);
  }; }
// 站名牌：白底「きさらぎ」，下面綠色帶寫前後站
function drawEkimei(x, y) {
  const [X, Y] = iso(x - .3, y + .5);
  ctx.fillStyle = '#3a3a3e'; ctx.fillRect(X + 2, Y - 22, 2, 22); const [X2, Y2] = iso(x + 1.3, y + .5); ctx.fillRect(X2 - 4, Y2 - 22, 2, 22);
  ctx.setTransform(1, .5, 0, 1, X, Y - 46);
  ctx.fillStyle = '#ecebe4'; ctx.fillRect(0, 0, 26, 18); ctx.strokeStyle = '#2a2a2e'; ctx.strokeRect(0, 0, 26, 18);
  ctx.fillStyle = '#1a1a1c'; ctx.font = 'bold 7px "Noto Sans JP","Yu Gothic",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(_L('きさらぎ'), 13, 8);
  ctx.font = '3px sans-serif'; ctx.fillText('kisaragi', 13, 11.5);
  ctx.fillStyle = '#2f6a3c'; ctx.fillRect(0, 13, 26, 5); ctx.fillStyle = '#f0f0e8'; ctx.font = '3.2px sans-serif';
  ctx.textAlign = 'left'; ctx.fillText(_L('← やみ'), 1, 16.8); ctx.textAlign = 'right'; ctx.fillText(_L('かたす →'), 25, 16.8);
  ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
// 反方向進站的列車（真結局）：每格各自排深度
drawTrain = function (hx, ty, lit) { for (let i = 0; i < 14; i++) trainSeg(hx + i, ty, i, 14, { lit }); };
{ const _s = sceneSprites;
  sceneSprites = function (list) {
    if (G.scene !== 5 || !IMG.train_side) return _s(list);
    const keep = TRAIN2.x; TRAIN2.x = -99; _s(list); TRAIN2.x = keep;   // 原本整列一起畫的那段先拿掉
    if (TRAIN2.x > -30) for (let i = 0; i < 14; i++) { const x = TRAIN2.x + i; if (x > -2 && x < 64) list.push({ d: x + TRACK2 + .4, f: () => trainSeg(x, TRACK2, i, 14, { lit: true }) }); }
  }; }
