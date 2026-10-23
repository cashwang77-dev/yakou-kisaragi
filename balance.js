/* 夜校・如月　平衡調整（2026-10-23 使用者：補血道具出現率增加 0.5 倍 → 繃帶 10 → 15 個）
   新道具一律加在各場景道具清單的最後（存檔用索引記錄撿過的道具）。載入順序：所有場景擴充檔之後。 */
const EXTRA_BANDAGE = { 1: [20, 14], 3: [28, 11], 5: [30, 17], 6: [48, 25], 7: [40, 7] };
for (const [n, [x, y]] of Object.entries(EXTRA_BANDAGE)) {
  const _b = SCENES[n]; SCENES[n] = function () { _b(); item('bandage', x, y, '繃帶'); };
}
if (G.scene === 1 && !ITEMS.some(i => i.id === 'bandage' && Math.floor(i.x) === 20 && Math.floor(i.y) === 14)) item('bandage', 20, 14, '繃帶');   // 開機時已經建好的第一章
