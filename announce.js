/* MAHMOUD STUDY: إعلان صغير "جرّب المدرّس الذكي" - بينتهي لوحده بعد 24 ساعة */
(function () {
  var EXPIRE = Date.parse('2026-11-27T23:45:00Z'); /* = 28 نوفمبر 2026، 1:45 ص بتوقيت القاهرة */
  if (Date.now() >= EXPIRE) return;
  try { if (localStorage.getItem('ann_tutor_x') === '1') return; } catch (e) { }
  var bar = null;
  function loggedIn() { var b = document.querySelector('[onclick*="go(\'tutor\')"]'); return !!(b && b.offsetParent !== null); }
  function show() {
    if (bar) return;
    bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:99999;max-width:92vw;display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:12px;background:linear-gradient(135deg,#1fa070,#0b6b48);color:#fff;font:700 13px/1.3 inherit;box-shadow:0 4px 14px rgba(0,0,0,.35);direction:rtl';
    bar.innerHTML = '<span>🎓 جرّب المدرّس الذكي الجديد: كويز ذكي وتقرير ومراجعة أخطائك</span>';
    var go1 = document.createElement('button'); go1.type = 'button'; go1.textContent = 'جرّبه';
    go1.style.cssText = 'border:0;border-radius:8px;padding:5px 10px;font:inherit;font-weight:800;background:#fff;color:#0b6b48;cursor:pointer';
    go1.onclick = function () { try { window.go('tutor'); } catch (e) { } kill(true); };
    var x = document.createElement('button'); x.type = 'button'; x.textContent = '✕'; x.setAttribute('aria-label', 'إغلاق');
    x.style.cssText = 'border:0;background:transparent;color:#fff;font-size:15px;cursor:pointer;padding:0 2px';
    x.onclick = function () { kill(true); };
    bar.appendChild(go1); bar.appendChild(x); document.body.appendChild(bar);
  }
  function kill(save) { if (bar && bar.parentNode) bar.parentNode.removeChild(bar); bar = null; if (save) { try { localStorage.setItem('ann_tutor_x', '1'); } catch (e) { } } clearInterval(iv); }
  var iv = setInterval(function () {
    if (Date.now() >= EXPIRE) { kill(false); return; }
    if (loggedIn()) show(); else if (bar) { bar.parentNode && bar.parentNode.removeChild(bar); bar = null; }
  }, 2000);
})();
