/* MAHMOUD STUDY - admin activity card v2 (study activity only, aggregates only: no names, phones or ids shown). Admin-only: loads data only when admin is unlocked. */
(function () {
  'use strict';
  function fb() { return self.__cl; }
  function ready() { try { return fb() && fb().apps && fb().apps.length && fb().firestore; } catch (e) { return false; } }
  function isAdminNow() { try { return !!adminUnlocked; } catch (e) { return false; } }
  var DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  var TZ = 'Africa/Cairo';
  var DAY = 86400000;
  var HIST_DOC = ['publicSettings', 'activityHistory'];

  function toMs(v) {
    if (!v) return 0;
    if (typeof v.toMillis === 'function') return v.toMillis();
    if (typeof v.toDate === 'function') return v.toDate().getTime();
    if (typeof v === 'number') return v;
    if (typeof v.seconds === 'number') return v.seconds * 1000;
    var t = Date.parse(v); return isNaN(t) ? 0 : t;
  }

  /* Cairo-time calendar parts (so "today" does not depend on the admin's device zone) */
  var fmt = null;
  function parts(ms) {
    try {
      if (!fmt) fmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short' });
      var o = {}; fmt.formatToParts(new Date(ms)).forEach(function (p) { o[p.type] = p.value; });
      var dow = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday];
      return { key: o.year + '-' + o.month + '-' + o.day, h: parseInt(o.hour, 10) % 24, dow: dow };
    } catch (e) {
      var d = new Date(ms), p2 = function (n) { return n < 10 ? '0' + n : '' + n; };
      return { key: d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()), h: d.getHours(), dow: d.getDay() };
    }
  }
  function lastN(n, now) {
    var out = [];
    for (var i = n - 1; i >= 0; i--) {
      var p = parts(now - i * DAY);
      out.push({ key: p.key, label: i === 0 ? 'النهاردة' : DAYS[p.dow], short: p.key.slice(8), n: 0 });
    }
    return out;
  }
  function num(v) { v = Number(v); return isFinite(v) ? v : null; }
  function avg(a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : null; }
  function r1(x) { return x === null ? '-' : (Math.round(x * 10) / 10); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* raw = { visitors, exams, forum, scores } each an array of plain objects or null (unreadable) */
  function compute(raw, now) {
    now = now || Date.now();
    var z = function (x) { return x || []; };
    var today = parts(now).key;
    var days14 = lastN(14, now), idx14 = {};
    days14.forEach(function (d, i) { idx14[d.key] = i; });
    var hours = []; for (var h = 0; h < 24; h++) hours.push({ label: String(h), n: 0 });
    var dowCount = [0, 0, 0, 0, 0, 0, 0];
    var seenWeek = 0, seenDay = 0, seenMonth = 0;

    function addEvent(ms, series, opts) {
      if (!ms) return;
      var p = parts(ms);
      if (series && p.key in idx14) series[idx14[p.key]].n++;
      if (opts && opts.dow !== false) dowCount[p.dow]++;
      if (p.key === today) hours[p.h].n++;
    }

    // visitors (lastSeen only)
    var vDays = lastN(14, now), vIdx = {}; vDays.forEach(function (d, i) { vIdx[d.key] = i; });
    var vToday = 0;
    z(raw.visitors).forEach(function (v) {
      var ms = toMs(v.lastSeen); if (!ms) return;
      var p = parts(ms);
      if (p.key === today) { vToday++; hours[p.h].n++; }
      if (p.key in vIdx) vDays[vIdx[p.key]].n++;
      dowCount[p.dow]++;
      var age = now - ms; if (age <= 7 * DAY) seenWeek++; if (age <= 30 * DAY) seenMonth++;
    });

    // exams
    var eDays = lastN(14, now), eToday = 0, eIdx = {}; eDays.forEach(function (d, i) { eIdx[d.key] = i; });
    var perExam = {}, perSubject = {}, pcts = [], pcts7 = [], students = {}, students7 = {}, studentsToday = {};
    var buckets = [0, 0, 0, 0, 0]; // 0-39, 40-59, 60-74, 75-89, 90-100
    z(raw.exams).forEach(function (v) {
      var ms = toMs(v.createdAt);
      if (ms) {
        var p = parts(ms);
        if (p.key === today) { eToday++; hours[p.h].n++; }
        if (p.key in eIdx) eDays[eIdx[p.key]].n++;
        dowCount[p.dow]++;
        if (v.studentUid) { students[v.studentUid] = 1; if (now - ms <= 7 * DAY) students7[v.studentUid] = 1; if (p.key === today) studentsToday[v.studentUid] = 1; }
      } else if (v.studentUid) students[v.studentUid] = 1;
      var pc = num(v.percent);
      if (pc !== null) {
        pc = Math.max(0, Math.min(100, pc)); pcts.push(pc);
        if (ms && now - ms <= 7 * DAY) pcts7.push(pc);
        buckets[pc < 40 ? 0 : pc < 60 ? 1 : pc < 75 ? 2 : pc < 90 ? 3 : 4]++;
        var title = String(v.examTitle || v.examId || 'غير معروف').slice(0, 70);
        var e = perExam[title] || (perExam[title] = { title: title, n: 0, sum: 0, st: {} });
        e.n++; e.sum += pc; if (v.studentUid) e.st[v.studentUid] = 1;
        var sj = String(v.subject || 'غير محدد').slice(0, 40);
        var s = perSubject[sj] || (perSubject[sj] = { subject: sj, n: 0, sum: 0 });
        s.n++; s.sum += pc;
      }
    });
    var examRows = Object.keys(perExam).map(function (k) { var e = perExam[k]; return { title: e.title, n: e.n, avg: e.sum / e.n, st: Object.keys(e.st).length }; });
    var byCount = examRows.slice().sort(function (a, b) { return b.n - a.n; });
    var ranked = examRows.filter(function (e) { return e.n >= 3; });
    var best = ranked.slice().sort(function (a, b) { return b.avg - a.avg; })[0] || null;
    var worst = ranked.slice().sort(function (a, b) { return a.avg - b.avg; })[0] || null;
    if (best && worst && best.title === worst.title) worst = null;
    var subjectRows = Object.keys(perSubject).map(function (k) { var s = perSubject[k]; return { subject: s.subject, n: s.n, avg: s.sum / s.n }; }).sort(function (a, b) { return b.n - a.n; });

    // forum
    var fDays = lastN(14, now), fToday = 0, fIdx = {}, posters = {}; fDays.forEach(function (d, i) { fIdx[d.key] = i; });
    z(raw.forum).forEach(function (v) {
      var ms = toMs(v.createdAt);
      if (v.authorUid) posters[v.authorUid] = 1;
      if (!ms) return;
      var p = parts(ms);
      if (p.key === today) { fToday++; hours[p.h].n++; }
      if (p.key in fIdx) fDays[fIdx[p.key]].n++;
      dowCount[p.dow]++;
    });

    // contests
    var sc = z(raw.scores), pts = [], streaks = [], ex = [], active7 = 0, s3 = 0, s7 = 0, maxStreak = 0;
    sc.forEach(function (v) {
      var p = num(v.points); if (p !== null) pts.push(p);
      var st = num(v.streak); if (st !== null) { streaks.push(st); if (st >= 3) s3++; if (st >= 7) s7++; if (st > maxStreak) maxStreak = st; }
      var e = num(v.exams); if (e !== null) ex.push(e);
      var u = toMs(v.updatedAt); if (u && now - u <= 7 * DAY) active7++;
      if (u) { var pp = parts(u); if (pp.key === today) hours[pp.h].n++; }
    });

    var dowRows = DAYS.map(function (n, i) { return { label: n, n: dowCount[i] }; });
    var topDow = dowRows.slice().sort(function (a, b) { return b.n - a.n; })[0];
    var peakHour = hours.slice().sort(function (a, b) { return b.n - a.n; })[0];

    return {
      now: now, todayKey: today,
      visitors: { total: z(raw.visitors).length, today: vToday, week: seenWeek, month: seenMonth, days: vDays, ok: raw.visitors !== null },
      exams: { total: z(raw.exams).length, today: eToday, days: eDays, students: Object.keys(students).length, students7: Object.keys(students7).length, studentsToday: Object.keys(studentsToday).length, avg: avg(pcts), avg7: avg(pcts7), buckets: buckets, rows: byCount.slice(0, 8), distinctExams: examRows.length, best: best, worst: worst, subjects: subjectRows.slice(0, 6), ok: raw.exams !== null },
      forum: { total: z(raw.forum).length, today: fToday, days: fDays, posters: Object.keys(posters).length, ok: raw.forum !== null },
      contests: { total: sc.length, avgPoints: avg(pts), avgExams: avg(ex), active7: active7, s3: s3, s7: s7, maxStreak: maxStreak, ok: raw.scores !== null },
      hours: hours, dow: dowRows, topDow: topDow && topDow.n ? topDow : null, peakHour: peakHour && peakHour.n ? peakHour : null
    };
  }

  function card() {
    var c = document.getElementById('msActCard'); if (c) return c;
    var admin = document.getElementById('admin'); if (!admin) return null;
    c = document.createElement('div'); c.className = 'card'; c.id = 'msActCard';
    c.innerHTML =
      '<style>#msActCard .ag{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}#msActCard .ak{background:rgba(99,102,241,.10);border:1px solid rgba(99,102,241,.28);border-radius:16px;padding:12px 14px}#msActCard .ak b{display:block;font-size:28px;line-height:1.1}#msActCard .ak span{font-size:13px;opacity:.85}#msActCard .ak i{font-style:normal;font-size:12px;color:#4ade80;display:block;margin-top:2px}#msActCard .ak i.m{color:inherit;opacity:.65}#msActCard h3{margin:18px 0 0;font-size:15px}#msActCard .ch{display:flex;align-items:flex-end;gap:4px;height:110px;margin:10px 0 4px}#msActCard .ch.h{gap:2px;height:90px}#msActCard .cb{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;font-size:10px}#msActCard .cb div{width:100%;border-radius:6px 6px 2px 2px;background:linear-gradient(180deg,#38bdf8,#6366f1);min-height:3px}#msActCard .cl{display:flex;gap:4px;font-size:10px;opacity:.75}#msActCard .cl span{flex:1;min-width:0;text-align:center;overflow:hidden}#msActCard .hb{display:flex;align-items:center;gap:8px;margin:5px 0;font-size:12px}#msActCard .hb em{font-style:normal;width:84px;flex:none;opacity:.85}#msActCard .hb .t{flex:1;background:rgba(148,163,184,.18);border-radius:8px;height:14px;overflow:hidden}#msActCard .hb .t div{height:100%;border-radius:8px;background:linear-gradient(90deg,#38bdf8,#6366f1)}#msActCard .hb b{width:34px;text-align:left;flex:none}#msActCard table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}#msActCard th,#msActCard td{padding:6px 4px;text-align:right;border-bottom:1px solid rgba(148,163,184,.2)}#msActCard td.n{white-space:nowrap}#msActCard .pill{display:inline-block;padding:3px 9px;border-radius:999px;font-size:12px;margin:3px 3px 0 0;background:rgba(74,222,128,.14);border:1px solid rgba(74,222,128,.35)}#msActCard .pill.w{background:rgba(248,113,113,.14);border-color:rgba(248,113,113,.4)}#msActCard .bad{color:#f87171;font-size:12px}</style>' +
      '<div class="row"><h2>📈 النشاط على المنصة</h2><button class="btn ghost small" id="msActReload">تحديث</button></div>' +
      '<p class="smallnote">نشاط دراسي فقط. أرقام مجمعة من غير أسماء أو تليفونات. "النهاردة" بتوقيت القاهرة.</p>' +
      '<div class="muted" id="msActStatus">لم يتم التحميل</div>' +
      '<div id="msActBody"></div>';
    var anchor = document.getElementById('msBanCard') || document.getElementById('gradingQueue');
    var ref = anchor && anchor.closest ? anchor.closest('.card') : null;
    if (ref && ref.parentNode) ref.parentNode.insertBefore(c, ref); else admin.appendChild(c);
    document.getElementById('msActReload').onclick = load;
    return c;
  }

  function chart(title, days, color, cls) {
    var max = Math.max.apply(null, days.map(function (d) { return d.n; }).concat([1]));
    var bars = days.map(function (d) {
      return '<div class="cb"><span>' + (d.n || '') + '</span><div style="height:' + Math.round(d.n / max * 88) + '%' + (color ? ';background:' + color : '') + '"></div></div>';
    }).join('');
    var labels = days.map(function (d) { return '<span>' + esc(cls === 'h' ? d.label : (d.short || d.label)) + '</span>'; }).join('');
    return '<h3>' + title + '</h3><div class="ch ' + (cls || '') + '">' + bars + '</div><div class="cl">' + labels + '</div>';
  }
  function hbars(rows, color) {
    var max = Math.max.apply(null, rows.map(function (r) { return r.n; }).concat([1]));
    return rows.map(function (r) {
      return '<div class="hb"><em>' + esc(r.label) + '</em><div class="t"><div style="width:' + Math.round(r.n / max * 100) + '%' + (color ? ';background:' + color : '') + '"></div></div><b>' + r.n + '</b></div>';
    }).join('');
  }
  function kpi(n, label, sub, muted) {
    return '<div class="ak"><b>' + n + '</b><span>' + label + '</span>' + (sub ? '<i' + (muted ? ' class="m"' : '') + '>' + sub + '</i>' : '') + '</div>';
  }
  function pct(x) { return x === null ? '-' : Math.round(x) + '%'; }

  function render(d, hist) {
    var body = document.getElementById('msActBody'); if (!body) return;
    var V = d.visitors, E = d.exams, F = d.forum, C = d.contests;
    var newSub = '', newVal = '-';
    if (hist && hist.prevKey) { newVal = Math.max(0, V.total - hist.prevTotal); newSub = 'من ' + hist.prevKey + ' (آخر مرة اتسجل فيها)'; }
    else newSub = 'العد بيبدأ من أول تحديث النهاردة وبيظهر من بكرة';
    var h = '';
    h += '<div class="ag">' +
      kpi(V.total, 'طلاب دخلوا المنصة', V.today + ' نشطين النهاردة') +
      kpi(newVal, 'طلاب جداد دخلوا', newSub, true) +
      kpi(V.week, 'نشطين آخر ٧ أيام', 'آخر ٣٠ يوم: ' + V.month, true) +
      kpi(C.total, 'طلاب في المسابقات', C.active7 + ' نشطين آخر ٧ أيام', true) +
      kpi(E.total, 'تسليمات امتحانات', '+' + E.today + ' النهاردة') +
      kpi(E.students, 'طلاب سلموا امتحانات', E.students7 + ' آخر ٧ أيام | ' + E.studentsToday + ' النهاردة', true) +
      kpi(pct(E.avg), 'متوسط الدرجات', 'آخر ٧ أيام: ' + pct(E.avg7), true) +
      kpi(F.total, 'منشورات المنتدى', '+' + F.today + ' النهاردة | ' + F.posters + ' كاتبين', false) +
      '</div>';
    h += chart('طلاب نشطين آخر ١٤ يوم (حسب آخر ظهور)', V.days, 'linear-gradient(180deg,#4ade80,#16a34a)');
    h += chart('تسليمات الامتحانات آخر ١٤ يوم', E.days);
    h += chart('منشورات المنتدى آخر ١٤ يوم', F.days, 'linear-gradient(180deg,#f59e0b,#ef4444)');
    h += chart('النشاط النهاردة بالساعة (توقيت القاهرة)', d.hours, 'linear-gradient(180deg,#a78bfa,#6366f1)', 'h');
    if (d.peakHour) h += '<p class="smallnote">أعلى ساعة النهاردة: ' + d.peakHour.label + ':00 (' + d.peakHour.n + ' حدث: دخول، تسليم، منشور أو تحديث نقاط)</p>';
    h += '<h3>أكتر أيام نشاط في الأسبوع</h3>' + hbars(d.dow, 'linear-gradient(90deg,#34d399,#0ea5e9)');
    if (d.topDow) h += '<p class="smallnote">الأعلى: ' + esc(d.topDow.label) + '</p>';
    h += '<h3>توزيع درجات الامتحانات</h3>' + hbars([
      { label: 'أقل من 40%', n: E.buckets[0] }, { label: '40 - 59%', n: E.buckets[1] }, { label: '60 - 74%', n: E.buckets[2] },
      { label: '75 - 89%', n: E.buckets[3] }, { label: '90% وأكتر', n: E.buckets[4] }]);
    if (E.best || E.worst) {
      h += '<div>';
      if (E.best) h += '<span class="pill">أعلى متوسط: ' + esc(E.best.title) + ' (' + pct(E.best.avg) + ', ' + E.best.n + ' تسليم)</span>';
      if (E.worst) h += '<span class="pill w">أقل متوسط: ' + esc(E.worst.title) + ' (' + pct(E.worst.avg) + ', ' + E.worst.n + ' تسليم)</span>';
      h += '</div><p class="smallnote">الأعلى والأقل محسوبين للامتحانات اللي عليها ٣ تسليمات أو أكتر بس.</p>';
    }
    if (E.rows.length) {
      h += '<h3>الامتحانات الأكتر حلاً (' + E.distinctExams + ' امتحان مختلف)</h3><table><tr><th>الامتحان</th><th>تسليمات</th><th>طلاب</th><th>المتوسط</th></tr>' +
        E.rows.map(function (r) { return '<tr><td>' + esc(r.title) + '</td><td class="n">' + r.n + '</td><td class="n">' + r.st + '</td><td class="n">' + pct(r.avg) + '</td></tr>'; }).join('') + '</table>';
    }
    if (E.subjects.length) {
      h += '<h3>حسب المادة</h3><table><tr><th>المادة</th><th>تسليمات</th><th>المتوسط</th></tr>' +
        E.subjects.map(function (r) { return '<tr><td>' + esc(r.subject) + '</td><td class="n">' + r.n + '</td><td class="n">' + pct(r.avg) + '</td></tr>'; }).join('') + '</table>';
    }
    h += '<h3>المسابقات</h3><div class="ag">' +
      kpi(C.total, 'طلاب في لوحة المسابقات') +
      kpi(r1(C.avgPoints), 'متوسط النقاط', 'متوسط الامتحانات: ' + r1(C.avgExams), true) +
      kpi(C.s3, 'ستريك ٣ أيام أو أكتر', 'ستريك ٧+: ' + C.s7, true) +
      kpi(C.maxStreak, 'أعلى ستريك (أيام)') +
      '</div>';
    var bad = [];
    if (!V.ok) bad.push('الزوار'); if (!E.ok) bad.push('الامتحانات'); if (!F.ok) bad.push('المنتدى'); if (!C.ok) bad.push('المسابقات');
    if (bad.length) h += '<p class="bad">تعذر قراءة: ' + bad.join('، ') + '. الأرقام اللي فوق ناقصة.</p>';
    h += '<p class="smallnote" style="margin-top:10px">ملاحظات الدقة: "آخر ظهور" بيحفظ آخر يوم دخل فيه كل طالب، يعني الرسم مش عدد الزيارات اليومية. تاريخ التسجيل الحقيقي موجود في Firebase Authentication بس، فـ"الطلاب الجداد" هنا بتتحسب من فرق عدد الطلاب بين تحديثات اللوحة. القراءة بتجيب لحد ٥٠٠٠ سجل من كل مجموعة.</p>';
    body.innerHTML = h;
  }

  function all(db, name) {
    return db.collection(name).limit(5000).get().then(function (s) {
      var a = []; s.forEach(function (d) { a.push(d.data() || {}); }); return a;
    }).catch(function () { return null; });
  }

  /* daily totals history (aggregate numbers only) kept in publicSettings/activityHistory; failure is harmless */
  function history(db, d) {
    var ref = db.collection(HIST_DOC[0]).doc(HIST_DOC[1]);
    return ref.get().then(function (s) {
      var days = (s.exists && s.data() && s.data().days) || {};
      var prevKey = null, prevTotal = 0;
      Object.keys(days).sort().forEach(function (k) { if (k < d.todayKey && days[k] && typeof days[k].v === 'number') { prevKey = k; prevTotal = days[k].v; } });
      var upd = {}; upd[d.todayKey] = { v: d.visitors.total, e: d.exams.total, f: d.forum.total, s: d.contests.total, t: d.now };
      if (d.visitors.ok) ref.set({ days: upd }, { merge: true }).catch(function () {});
      return prevKey ? { prevKey: prevKey, prevTotal: prevTotal } : null;
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
        var d = compute({ visitors: r[0], exams: r[1], forum: r[2], scores: r[3] });
        return history(db, d).then(function (hist) {
          render(d, hist);
          var failed = r.filter(function (x) { return x === null; }).length;
          if (st) st.textContent = (failed ? 'تم التحميل (تعذر قراءة ' + failed + ' مجموعة) | ' : '') + 'آخر تحديث: ' + new Date(d.now).toLocaleString('ar-EG', { timeZone: TZ });
        });
      }).catch(function () { if (st) st.textContent = 'حصل خطأ في التحميل، جرب تحديث'; });
  }

  window.msActivityPreview = function (raw, hist, now) { card(); render(compute(raw, now), hist); var st = document.getElementById('msActStatus'); if (st) st.textContent = 'معاينة ببيانات تجريبية'; };
  window.msActivityCompute = compute;

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
