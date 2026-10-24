/* 夜校・如月　平衡調整（2026-10-23 使用者：補血道具出現率增加 0.5 倍 → 繃帶 10 → 15 個）
   新道具一律加在各場景道具清單的最後（存檔用索引記錄撿過的道具）。載入順序：所有場景擴充檔之後。 */
const EXTRA_BANDAGE = { 1: [20, 14], 3: [28, 11], 5: [30, 17], 6: [48, 25], 7: [40, 7] };
for (const [n, [x, y]] of Object.entries(EXTRA_BANDAGE)) {
  const _b = SCENES[n]; SCENES[n] = function () { _b(); item('bandage', x, y, '繃帶'); };
}
if (G.scene === 1 && !ITEMS.some(i => i.id === 'bandage' && Math.floor(i.x) === 20 && Math.floor(i.y) === 14)) item('bandage', 20, 14, '繃帶');   // 開機時已經建好的第一章

/* 自動存檔（2026-10-23 使用者：不然玩家每次都要重來）：原本只在固定存檔點存。
   現在每 45 秒、以及切到別的 App／關掉網頁時，只要「安全」就存一次：沒被追、6 格內沒有鬼、沒在躲、沒在對話或過場。 */
function autoSaveSafe(force) {
  if ((TEST && !force) || G.mode !== 'play' || G.lock || P.hidden || !G.cp) return false;
  if (GH.active && GH.state === 'chase') return false;
  for (const t of threats()) if (t.chase || dist(t.e.x, t.e.y, P.x, P.y) < 6) return false;
  return true;
}
function autoSave(force) { if (autoSaveSafe(force === true)) { saveCP('auto'); return true; } return false; }
setInterval(autoSave, 45000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') autoSave(); });
addEventListener('pagehide', autoSave);
// 測試（?test=autosave）：第三章走到走廊 → 自動存檔 → 重置 → 讀檔，應該回到同一個位置
async function testAutoSave() {
  try {
    G.inv.pages = [1, 2, 3, 4, 5, 6]; G.inv.mirror = true; await startCh3(); await waitFree();
    HK.state = 'off'; P.x = 12.5; P.y = 21.5;
    if (!autoSave(true)) throw 'not saved';
    const sv = JSON.parse(localStorage.getItem(SAVE_KEY)); resetWorld(); if (G.scene !== 1) throw 'reset';
    loadCP(sv);
    document.title = (G.scene === 4 && Math.abs(P.x - 12.5) < .1 && Math.abs(P.y - 21.5) < .1 ? 'PASS ' : 'FAIL ') + JSON.stringify(stateSummary());
  } catch (e) { document.title = 'ERR ' + e; }
}

/* 被抓之後的喘息時間（2026-10-24 使用者：被抓到後很容易被黏住、逃不掉）
   任何扣血之後：所有敵人（裂口女＋各章的鬼）停住 1.5 秒，咪醬至少再無敵 2.7 秒（停住結束後還有 1.2 秒可以拉開距離）。
   只在「可以操作」的時間倒數：被抓後的對話、過場不會吃掉這段時間。 */
const CATCH_HOLD = 1.5, CATCH_INV = 1.2;
const HOLD = { t: 0, fresh: false };
{ const _d = damage; damage = function (n) { _d(n); HOLD.t = CATCH_HOLD; HOLD.fresh = true; }; }
{ const _u = update; update = function (dt) {
    if (HOLD.t <= 0 || G.mode !== 'play' || G.lock) return _u(dt);
    if (HOLD.fresh) { HOLD.fresh = false; P.inv = Math.max(P.inv, HOLD.t + CATCH_INV); }
    const g = ghostUpdate, s = sceneUpdate; ghostUpdate = () => {}; sceneUpdate = () => {};
    try { _u(dt); } finally { ghostUpdate = g; sceneUpdate = s; }
    HOLD.t -= dt;
  }; }
{ const _l = loadCP; loadCP = function (...a) { HOLD.t = 0; HOLD.fresh = false; return _l(...a); }; }
// 測試（?test=hold）：第三章妃姬子在身邊追 → 扣血 → 停住期間她不動、咪醬無敵 → 結束後她又開始追
async function testHold() {
  try {
    G.inv.pages = [1, 2, 3, 4, 5, 6]; G.inv.mirror = true; await startCh3(); await waitFree();
    P.x = 12.5; P.y = 21.5; Object.assign(HK, { x: 15.5, y: 21.5, state: 'chase', timer: 99, path: null });
    damage(1); const x0 = HK.x, y0 = HK.y; await wait(200);   // 測試模式時間約 4 倍速：200ms ≈ 0.8 秒
    const m = Math.hypot(HK.x - x0, HK.y - y0); if (m > .01) throw 'moved during hold ' + m.toFixed(2);
    if (P.inv <= 0) throw 'no inv';
    await wait(1000);
    if (Math.hypot(HK.x - x0, HK.y - y0) < .3) throw 'never resumed ' + HK.state;
    document.title = 'PASS hold inv=' + P.inv.toFixed(2);
  } catch (e) { document.title = 'ERR ' + e; }
}
