/* ================= lighting.js：大升級第1階段「光影氛圍」（2026-11-11） =================
   game.js render() 透過三個掛勾呼叫這裡（沒載入本檔時照舊畫法）：
   ltClip(c, key, fn)  ：把光照限制在光源「看得到」的範圍（射線遇到牆 # / P 就停，牆面往上抬一段＝照亮牆面）
                          key＝'P'（手電筒，每格重算）或 LIGHTS 裡的物件（固定燈，依場景快取）
   ltWorld()           ：暗幕之前（會被夜色壓暗）：飄動的霧團、雨滴濺起的漣漪
   ltAfterDark(...)    ：暗幕之後：手電筒光束的暖色＋灰塵、路燈在濕地上的倒影
   ltPost(dg)          ：最後：細顆粒底片雜訊、危險/驚嚇時紅藍色偏移
   ?lt=0 關閉全部（比較用）；?lt=lite 只開陰影、關後製（給慢的手機） */
const LT = (() => {
  let q = ''; try { q = new URLSearchParams(location.search).get('lt') || ''; } catch (e) { }
  const lowEnd = (navigator.hardwareConcurrency || 4) <= 2;
  return { on: q !== '0', post: q !== '0' && q !== 'lite' && !lowEnd, rays: 90, cache: new Map(), cacheScene: -1 };
})();
const ltOpaque = c => c === '#' || c === 'P';

/* 射線投射：回傳世界座標的命中點 [x, y, hit] */
function ltCastWorld(x0, y0, maxR, n) {
  const out = [], st = .1;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a);
    let t = 0, hit = false;
    while (t < maxR) { t += st; if (ltOpaque(at(Math.floor(x0 + dx * t), Math.floor(y0 + dy * t)))) { hit = true; break; } }
    const e = hit ? t + .45 : maxR;          // 打到牆：再往牆裡推一點，讓牆的上緣也進到光裡
    out.push([x0 + dx * e, y0 + dy * e, hit]);
  }
  return out;
}
/* 世界座標命中點 → 畫面多邊形；在光源「後方」（畫面上方）的牆，把點往上抬 lift 像素＝照亮那面牆 */
function ltPoly(hits, srcSy, lift) {
  return hits.map(([x, y, hit]) => {
    const [sx, sy] = iso(x, y);
    const up = hit ? lift * Math.max(0, Math.min(1, (srcSy - sy) / 18)) : 0;
    return [sx, sy - up];
  });
}
function ltGetPoly(key) {
  if (key === 'P') {
    const [, psy] = iso(P.x, P.y);
    return ltPoly(ltCastWorld(P.x, P.y, 18, LT.rays), psy, WALLH * .95);   // 往畫面上方投射時 1 格只佔約 11px → 要 18 格才夠 200px
  }
  if (LT.cacheScene !== G.scene) { LT.cache.clear(); LT.cacheScene = G.scene; }
  let h = LT.cache.get(key);
  if (!h) { h = ltCastWorld(key.x, key.y, key.r * 1.5 + .5, 72); LT.cache.set(key, h); }
  const [, sy] = iso(key.x, key.y);
  return ltPoly(h, sy, isInside(key.x, key.y) ? 0 : WALLH * .9);   // 室內燈不抬：不然會把屋頂照出一塊亮三角
}
function ltClip(c, key, fn) {
  if (!LT.on) return fn();
  const poly = ltGetPoly(key);
  c.save(); c.beginPath();
  poly.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath(); c.clip(); fn(); c.restore();
}

/* ---------- 霧、雨的漣漪（暗幕之前） ---------- */
const LT_FOG = Array.from({ length: 16 }, () => ({ x: Math.random() * 40, y: Math.random() * 40, r: 3 + Math.random() * 4, v: .08 + Math.random() * .12, ph: Math.random() * 7 }));
const LT_SPL = [];
function ltWorld() {
  if (!LT.on) return;
  const out = !isInside(P.x, P.y);
  // 霧團：以世界座標漂移，只在室外、靠近玩家的範圍畫
  ctx.globalCompositeOperation = 'screen';
  for (const f of LT_FOG) {
    f.x += f.v / 60; if (f.x > P.x + 14) f.x = P.x - 14; if (f.x < P.x - 14) f.x = P.x + 14;
    if (f.y > P.y + 14) f.y = P.y - 14; if (f.y < P.y - 14) f.y = P.y + 14;
    if (isInside(f.x, f.y)) continue;
    const [sx, sy] = iso(f.x, f.y), r = f.r * 26, a = (out ? .075 : .03) * (.75 + .25 * Math.sin(G.t * .4 + f.ph));
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    g.addColorStop(0, `rgba(150,160,190,${a})`); g.addColorStop(1, 'rgba(150,160,190,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(sx, sy, r, r * .55, 0, 0, 7); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  // 雨滴落地的漣漪（只在室外）
  if (out && G.mode !== 'title') {
    for (let i = 0; i < 3; i++) {
      const x = P.x + (Math.random() - .5) * 22, y = P.y + (Math.random() - .5) * 22;
      if (!isInside(x, y) && !ltOpaque(at(Math.floor(x), Math.floor(y))) && at(Math.floor(x), Math.floor(y)) !== 'X') LT_SPL.push({ x, y, t: 0 });
    }
  }
  ctx.lineWidth = 1;
  for (let i = LT_SPL.length - 1; i >= 0; i--) {
    const s = LT_SPL[i]; s.t += 1 / 60; if (s.t > .45) { LT_SPL.splice(i, 1); continue; }
    const [sx, sy] = iso(s.x, s.y), k = s.t / .45;
    ctx.strokeStyle = `rgba(190,205,230,${.35 * (1 - k)})`;
    ctx.beginPath(); ctx.ellipse(sx, sy, 1 + k * 5, .5 + k * 2.2, 0, 0, 7); ctx.stroke();
  }
  if (LT_SPL.length > 120) LT_SPL.splice(0, LT_SPL.length - 120);
}

/* ---------- 暗幕之後：光束暖色＋灰塵、濕地倒影 ---------- */
const LT_DUST = Array.from({ length: 26 }, () => ({ d: Math.random(), a: Math.random() * 2 - 1, h: Math.random() * 30, s: .03 + Math.random() * .05, ph: Math.random() * 7 }));
function ltAfterDark(psx, psy) {
  if (!LT.on) return;
  ctx.globalCompositeOperation = 'lighter';
  // 路燈在濕地上的倒影（室外的燈）：燈下方一道搖晃的光帶
  for (const l of LIGHTS) {
    if (isInside(l.x, l.y)) continue;
    const lo = OBJAT[Math.floor(l.x) + ',' + Math.floor(l.y)]; if (lo && lo.t === 'lamp' && lo.on === false) continue;
    const [sx, sy] = iso(l.x, l.y); if (sx < -60 || sx > VW + 60 || sy < -60 || sy > VH + 80) continue;
    for (let k = 0; k < 4; k++) {
      const y = sy + 4 + k * 5, w = 3 + k * 1.2 + Math.sin(G.t * 3 + k + l.x) * 1.2;
      ctx.fillStyle = `rgba(${l.c},${.10 - k * .02})`; ctx.fillRect(sx - w / 2 + Math.sin(G.t * 2.2 + k * 1.7) * 1.5, y, w, 2);
    }
  }
  // 手電筒：暖色光束＋飄浮灰塵（限制在看得到的範圍）
  if (P.light && !P.hidden && G.mode !== 'title') {
    const [fx, fy] = SCR[P.dir], ang = Math.atan2(fy * .55, fx), len = 200, spread = .48, ox = psx, oy = psy - 14;
    ltClip(ctx, 'P', () => {
      const g = ctx.createRadialGradient(ox, oy, 4, ox, oy, len);
      g.addColorStop(0, 'rgba(255,236,190,.07)'); g.addColorStop(.55, 'rgba(255,226,170,.03)'); g.addColorStop(1, 'rgba(255,220,160,0)');
      ctx.fillStyle = g;
      for (const sp of [spread, spread * .62, spread * .3]) { ctx.beginPath(); ctx.moveTo(ox, oy); ctx.arc(ox, oy, len, ang - sp, ang + sp); ctx.closePath(); ctx.fill(); }   // 三層疊出柔和的邊
      for (const m of LT_DUST) {
        m.d += m.s / 60; if (m.d > 1) { m.d = 0; m.a = Math.random() * 2 - 1; }
        const r = 20 + m.d * (len - 30), aa = ang + m.a * spread * .85;
        const x = ox + Math.cos(aa) * r + Math.sin(G.t + m.ph) * 3, y = oy + Math.sin(aa) * r - m.h * .3 + Math.cos(G.t * .7 + m.ph) * 2;
        ctx.fillStyle = `rgba(255,240,210,${.35 * Math.sin(m.d * Math.PI)})`; ctx.fillRect(x, y, 1, 1);
      }
    });
  }
  ctx.globalCompositeOperation = 'source-over';
}

/* ---------- 後製：細顆粒雜訊、紅藍色偏移 ---------- */
const LT_GRAIN = [0, 1, 2, 3].map(() => {
  const c = document.createElement('canvas'); c.width = 320; c.height = 180; const g = c.getContext('2d'), d = g.createImageData(320, 180);
  for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (Math.random() - .5) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); return c;
});
const LT_TMP = document.createElement('canvas'), LT_TC = LT_TMP.getContext('2d');
function ltPost(dg) {
  // 底片顆粒：用平滑縮放，不再是一格一格的方塊
  ctx.imageSmoothingEnabled = true;
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .07 + dg * .08;
  ctx.drawImage(LT_GRAIN[Math.floor(G.t * 24) % 4], 0, 0, VW, VH);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.imageSmoothingEnabled = false;
  if (!LT.post) return;
  // 危險（被追、鬼很近）或驚嚇（畫面震動）時：紅藍色偏移
  const k = Math.max(dg > .35 ? (dg - .35) / .65 : 0, Math.min(1, (typeof shake === 'number' ? shake : 0) / 5));
  if (k < .05) return;
  if (LT_TMP.width !== VW || LT_TMP.height !== VH) { LT_TMP.width = VW; LT_TMP.height = VH; }
  LT_TC.globalCompositeOperation = 'source-over'; LT_TC.clearRect(0, 0, VW, VH); LT_TC.drawImage(cvs, 0, 0);
  const off = 1 + k * 2.5 + Math.sin(G.t * 9) * k;
  ctx.globalCompositeOperation = 'screen';
  LT_TC.globalCompositeOperation = 'multiply'; LT_TC.fillStyle = '#ff2a2a'; LT_TC.fillRect(0, 0, VW, VH);
  ctx.globalAlpha = .22 * k; ctx.drawImage(LT_TMP, off, 0);
  LT_TC.globalCompositeOperation = 'source-over'; LT_TC.drawImage(cvs, 0, 0);
  LT_TC.globalCompositeOperation = 'multiply'; LT_TC.fillStyle = '#2a6bff'; LT_TC.fillRect(0, 0, VW, VH);
  ctx.drawImage(LT_TMP, -off, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
