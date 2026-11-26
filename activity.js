/* MAHMOUD STUDY - admin activity card (counts only, no names/phones). Admin-only: loads data only when admin is unlocked. */
(function () {
  'use strict';
  function fb() { return self.__cl; }
  function ready() { try { return fb() && fb().apps && fb().apps.length && fb().firestore; } catch (e) { return false; } }
  function isAdminNow() { try { return !!adminUnlocked; } catch (e) { return false; } }
  var DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  function toMs(v) {
    if (!v) return 0;
    if (typeof v.toMillis === 'function') return v.toMillis();
    if (typeof v.toDate === 'function') return v.toDate().getTime();
    if (typeof v === 'number') return v;
    if (typeof v.seconds === 'number') return v.seconds * 1000;
    var t = Date.parse(v); return isNaN(t) ? 0 : t;
  }
  function dayKey(ms) { var d = new Date(ms); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function last7() {
    var out = [], now = new Date();
    for (var i = 6; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      out.push({ key: dayKey(d.getTime()), label: i === 0 ? 'النهاردة' : DAYS[d.getDay()] });
    }
    return out;
  }
  function stats(docs, field) { // docs: array of plain data objects
    var days = last7(), idx = {}, today = dayKey(Date.now()), todayN = 0, total = docs.length;
    days.forEach(function (d, i) { idx[d.key] = i; d.n = 0; });
    docs.forEach(function (v) {
      var ms = toMs(v[field]); if (!ms) return;
      var k = dayKey(ms); if (k === today) todayN++;
      if (k in idx) days[idx[k]].n++;
    });
    return { total: total, today: todayN, days: days };
  }

  function card() {
    var c = document.getElementById('msActCard'); if (c) return c;
    var admin = document.getElementById('admin'); if (!admin) return null;
    c = document.createElement('div'); c.className = 'card'; c.id = 'msActCard';
    c.innerHTML =
      '<style>#msActCard .ag{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}#msActCard .ak{background:rgba(99,102,241,.10);border:1px solid rgba(99,102,241,.28);border-radius:16px;padding:12px 14px}#msActCard .ak b{display:block;font-size:30px;line-height:1.1}#msActCard .ak span{font-size:13px;opacity:.8}#msActCard .ak i{font-style:normal;font-size:12px;color:#4ade80;display:block;margin-top:2px}#msActCard .ch{display:flex;align-items:flex-end;gap:6px;height:120px;margin:10px 0 4px}#msActCard .cb{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;font-size:11px}#msActCard .cb div{width:100%;border-radius:8px 8px 3px 3px;background:linear-gradient(180deg,#38bdf8,#6366f1);min-height:3px}#msActCard .cl{display:flex;gap:6px;font-size:11px;opacity:.75}#msActCard .cl span{flex:1;text-align:center}</style>' +
      '<div class="row"><h2>📈 النشاط على المنصة</h2><button class="btn ghost small" id="msActReload">تحديث</button></div>' +
      '<p class="smallnote">أرقام فقط، من غير أسماء أو أرقام تليفونات. اليوم = حسب توقيت جهازك.</p>' +
      '<div class="muted" id="msActStatus">لم يتم التحميل</div>' +
      '<div id="msActBody"></div>';
    var anchor = document.getElementById('msBanCard') || document.getElementById('gradingQueue');
    var ref = anchor && anchor.closest ? anchor.closest('.card') : null;
    if (ref && ref.parentNode) ref.parentNode.insertBefore(c, ref); else admin.appendChild(c);
    document.getElementById('msActReload').onclick = load;
    return c;
  }

  function chart(title, days, color) {
    var max = Math.max.apply(null, days.map(function (d) { return d.n; }).concat([1]));
    var bars = days.map(function (d) {
      return '<div class="cb"><span>' + d.n + '</span><div style="height:' + Math.round(d.n / max * 90) + '%' + (color ? ';background:' + color : '') + '"></div></div>';
    }).join('');
    var labels = days.map(function (d) { return '<span>' + d.label + '</span>'; }).join('');
    return '<h3 style="margin:14px 0 0;font-size:15px">' + title + '</h3><div class="ch">' + bars + '</div><div class="cl">' + labels + '</div>';
  }
  function kpi(n, label, sub) {
    return '<div class="ak"><b>' + n + '</b><span>' + label + '</span>' + (sub ? '<i>' + sub + '</i>' : '') + '</div>';
  }

  function render(d) {
    var body = document.getElementById('msActBody'); if (!body) return;
    body.innerHTML =
      '<div class="ag">' +
      kpi(d.visitors.total, 'طلاب دخلوا المنصة (إجمالي)', d.visitors.today + ' نشطين النهاردة') +
      kpi(d.scores, 'طلاب في لوحة المسابقات') +
      kpi(d.exams.total, 'تسليمات امتحانات', '+' + d.exams.today + ' النهاردة') +
      kpi(d.forum.total, 'منشورات المنتدى', '+' + d.forum.today + ' النهاردة') +
      '</div>' +
      chart('طلاب نشطين آخر ٧ أيام (حسب آخر ظهور)', d.visitors.days, 'linear-gradient(180deg,#4ade80,#16a34a)') +
      chart('تسليمات الامتحانات آخر ٧ أيام', d.exams.days) +
      chart('منشورات المنتدى آخر ٧ أيام', d.forum.days, 'linear-gradient(180deg,#f59e0b,#ef4444)') +
      '<p class="smallnote" style="margin-top:10px">ملاحظة: عدد المسجلين الجدد النهاردة يظهر في Firebase Authentication فقط، ومش متاح هنا. "آخر ظهور" بيعرض آخر يوم دخل فيه كل طالب.</p>';
  }

  function all(db, name) {
    return db.collection(name).limit(5000).get().then(function (s) {
      var a = []; s.forEach(function (d) { a.push(d.data() || {}); }); return a;
    }).catch(function () { return null; });
  }

  function load() {
    var st = document.getElementById('msActStatus');
    if (!isAdminNow()) { if (st) st.textContent = 'للإدارة فقط'; return; }
    if (!ready()) { if (st) st.textContent = 'جارٍ تجهيز الاتصال...'; return; }
    if (st) st.textContent = 'جارٍ التحميل...';
    var db = fb().firestore();
    Promise.all(['publicVisitors', 'examSubmissions', 'forumPosts', 'publicScores'].map(function (n) { return all(db, n); }))
      .then(function (r) {
        var failed = r.filter(function (x) { return x === null; }).length;
        function z(x) { return x || []; }
        render({
          visitors: stats(z(r[0]), 'lastSeen'),
          exams: stats(z(r[1]), 'createdAt'),
          forum: stats(z(r[2]), 'createdAt'),
          scores: z(r[3]).length
        });
        if (st) st.textContent = failed ? ('تم التحميل (تعذر قراءة ' + failed + ' مجموعة)') : ('آخر تحديث: ' + new Date().toLocaleTimeString('ar-EG'));
      });
  }

  window.msActivityRender = function (d) { card(); render(d); };
  window.msActivityStats = stats;

  function mount() {
    var tries = 0;
    (function wait() {
      if (document.getElementById('admin') && ready()) {
        card();
        var t2 = 0;
        (function adm() { if (isAdminNow()) { load(); return; } if (++t2 < 600) setTimeout(adm, 1000); })();
        return;
      }
      if (++tries < 120) setTimeout(wait, 500);
    })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
