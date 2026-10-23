/* 夜校・如月　對話立繪（2026-10-23 使用者：角色要更精緻、構圖更好）
   assets/face_<代碼>.png 由 tools/faces_cut.py 從 Gemini 半身像表切出。say／choose 沒指定立繪時，依說話者名字自動帶入。 */
const FACE_OF = {
  '咪醬': () => (G.fear || 0) > 60 || G.hearts <= 2 ? 'mi2' : 'mi',
  '澄香': 'sumika', '妃姬子': () => G.flags.hkShow || G.flags.sumiGone ? 'hikiko2' : 'hikiko', '瑪莉': 'mary',
  '戴口罩的女人': 'kuchi', '裂口女': 'kuchi', '花子': 'hanako', '三樓女廁': 'hanako',
  'Teke Teke': 'teke', '人面犬': 'jinmen', '車掌': 'conductor', '稻草人': 'kakashi',
  '來電：媽媽': 'hachi', '媽媽': () => G.scene === 6 ? 'hachi' : null, '？？？': () => G.scene === 6 ? 'hachi' : G.scene === 5 ? 'shadow' : null,
};
const FACE_OK = new Set();
['mi', 'mi2', 'sumika', 'hikiko', 'hikiko2', 'mary', 'kuchi', 'hanako', 'teke', 'hachi', 'jinmen', 'baba', 'conductor', 'anatomy', 'shadow', 'kakashi'].forEach(k => { const im = new Image(); im.onload = () => FACE_OK.add(k); im.src = `assets/face_${k}.png`; });
function faceFor(name) {
  let f = FACE_OF[name]; if (typeof f === 'function') f = f();
  return f && FACE_OK.has(f) ? `assets/face_${f}.png` : null;
}
{ const _s = say; say = function (name, text, face) { return _s(name, text, face || faceFor(name || '')); }; }
{ const _c = choose; choose = function (name, text, options, timeout, face) { return _c(name, text, options, timeout, face || faceFor(name || '')); }; }
(() => { const st = document.createElement('style'); st.textContent = `#dlg .face{width:calc(var(--u)*86);height:calc(var(--u)*86);margin-top:calc(var(--u)*-34);background-color:#0e0a0c;border:1px solid #6b4a4e;box-shadow:0 0 calc(var(--u)*10) rgba(0,0,0,.8)}`; document.head.appendChild(st); })();
