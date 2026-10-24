/* 夜校・如月　道具選單（2026-10-24 使用者：道具太多時下方列擺不下 → 改成選單，打開時時間暫停）
   下方列只留手電筒、蹲下狀態和「🎒 道具」按鈕；其他道具（含手機、鹽包、鑰匙類）都收進選單。
   選單打開時整個 update 停住（G.t 也不走：護身符、加速、煙霧的倒數不會被吃掉）。I／Tab 鍵開關。載入順序：最後。 */
const INVM = { open: false };
(() => {
  const st = document.createElement('style');
  st.textContent = `#invMenu{position:fixed;inset:0;z-index:20;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;pointer-events:auto}
#invMenu.hide{display:none}
#invMenu .box{width:min(92vw,calc(var(--u)*420));max-height:86vh;overflow-y:auto;touch-action:pan-y;background:rgba(14,12,14,.96);border:1px solid #6b655c;padding:calc(var(--u)*10)}
#invMenu h3{font-family:"Noto Serif TC",serif;font-size:calc(var(--u)*13);letter-spacing:.2em;margin:0 0 calc(var(--u)*4);text-align:center}
#invMenu .pz{text-align:center;color:var(--dim);font-size:calc(var(--u)*8);margin-bottom:calc(var(--u)*8)}
#invMenu .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(var(--u)*92),1fr));gap:calc(var(--u)*5)}
#invMenu .s{min-height:calc(var(--u)*34);border:1px solid #514c47;background:rgba(30,26,26,.9);font-size:calc(var(--u)*10);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:calc(var(--u)*3);cursor:pointer;text-align:center}
#invMenu .s em{font-style:normal;color:var(--dim);font-size:calc(var(--u)*8)}
#invMenu .s.on{border-color:#c9b98a}
#invMenu .s.info{cursor:default;opacity:.8}
#invMenu .close{display:block;margin:calc(var(--u)*10) auto 0;padding:calc(var(--u)*5) calc(var(--u)*24);font:inherit;font-size:calc(var(--u)*10);background:#2a2424;color:#e8dcc4;border:1px solid #6b655c}
#inv .s.bag{border-color:#c9b98a}`;
  document.head.appendChild(st);
  const m = document.createElement('div'); m.id = 'invMenu'; m.className = 'hide';
  m.innerHTML = `<div class="box"><h3>道具</h3><div class="pz">（時間暫停中）</div><div class="grid"></div><button class="close" type="button">關閉</button></div>`;
  document.body.appendChild(m);
  m.querySelector('.close').addEventListener('click', e => { e.stopPropagation(); invMenu(false); });
  m.addEventListener('click', e => { if (e.target === m) invMenu(false); });
  addEventListener('keydown', e => {
    if (e.repeat) return;
    if (e.code === 'KeyI' || e.code === 'Tab') { e.preventDefault(); if (INVM.open) invMenu(false); else if (G.mode === 'play' && !G.lock) invMenu(true); }
    else if (e.code === 'Escape' && INVM.open) invMenu(false);
  });
})();
function invMenu(on) {
  if (on === INVM.open) return;
  INVM.open = on; G.lock += on ? 1 : -1;
  $('#invMenu').classList.toggle('hide', !on); sfx.click();
  updateHUD();
}
const KEEP_IN_BAR = new Set(['flash']);
{ const _h = updateHUD; updateHUD = function () {
    _h();
    const inv = $('#inv'), grid = $('#invMenu .grid'); if (!inv || !grid) return;
    const items = [];
    for (const el of [...inv.children]) {
      if (!el.dataset.k && /^手機/.test(el.textContent)) el.dataset.k = 'phone';
      if (KEEP_IN_BAR.has(el.dataset.k) || /^蹲下中/.test(el.textContent)) continue;
      items.push(el); el.remove();
    }
    grid.innerHTML = '';
    if (!items.length) grid.innerHTML = '<div class="s info">（什麼都沒有）</div>';
    for (const el of items) {
      if (!el.dataset.k) el.classList.add('info');
      el.addEventListener('click', ev => { ev.stopPropagation(); const k = el.dataset.k; if (!k) return; invMenu(false); press(k); });
      grid.appendChild(el);
    }
    const b = document.createElement('div'); b.className = 's tap bag';
    b.innerHTML = `🎒 道具 ${items.length}<em>${isTouch ? '點按打開' : 'I 打開'}</em>`;
    b.addEventListener('pointerdown', ev => { ev.preventDefault(); if (G.mode === 'play' && !G.lock) invMenu(true); });
    const fl = inv.querySelector('[data-k="flash"]'); fl ? fl.after(b) : inv.prepend(b);
  }; }
// 選單打開時整個遊戲停住（連 G.t 都不走）
{ const _u = update; update = function (dt) { if (INVM.open) return; return _u(dt); }; }
// 回到標題、結局、遊戲結束時關掉選單
setInterval(() => { if (INVM.open && G.mode !== 'play') { INVM.open = false; G.lock = Math.max(0, G.lock - 1); $('#invMenu').classList.add('hide'); } }, 300);
// 測試（?test=inv）：打開選單 → 時間停住 → 用繃帶 → 選單關閉、血量回復
async function testInv() {
  try {
    await startCh3(); await waitFree(); HK.state = 'off';
    G.inv.bandage = 1; G.inv.charm = 1; G.hearts = 2; updateHUD();
    invMenu(true); const t0 = G.t; await wait(300);
    if (G.t !== t0) throw 'time moved';
    const b = [...document.querySelectorAll('#invMenu .s')].find(e => e.dataset.k === 'useBandage'); if (!b) throw 'no bandage';
    b.click(); await wait(100);
    if (INVM.open || G.lock) throw 'still open';
    if (G.hearts <= 2) throw 'no heal';
    document.title = 'PASS hearts=' + G.hearts;
  } catch (e) { document.title = 'ERR ' + e; }
}
if (typeof TEST !== 'undefined' && TEST === 'shot' && Q.get('menu')) setTimeout(() => { Object.assign(G.inv, { bandage: 2, drink: 1, charm: 1, eraser: 1, ext: 1, cans: 2, phone: true, flashlight: true }); updateHUD(); if (Q.get('menu') === '2') invMenu(true); }, 500);   // 截圖：&menu=1 下方列、&menu=2 選單
