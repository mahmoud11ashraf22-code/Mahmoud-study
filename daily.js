/* MAHMOUD STUDY: جدول اليوم التلقائي - بيقسّم تراكم الطالب على ساعات وبريكات (مجاني، على الجهاز) */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(x) { x = Number(x); return isFinite(x) ? x : 0; }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { } }
  function jget(k, d) { try { var v = JSON.parse(ls(k)); return v == null ? d : v; } catch (e) { return d; } }
  function dayStr() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function hm(min) { min = Math.round(min); var h = Math.floor(min / 60) % 24, m = min % 60, ap = h >= 12 ? 'م' : 'ص', h12 = h % 12 || 12; return h12 + ':' + ('0' + m).slice(-2) + ' ' + ap; }
  function DB() { try { return loadDB() || {}; } catch (e) { return {}; } }
  function loggedIn() { var b = document.querySelector('[onclick*="go(\'tutor\')"]'); return !!(b && b.offsetParent !== null); }

  function defaults() {
    var d = DB(), now = new Date(), st = now.getHours() * 60 + now.getMinutes();
    st = Math.ceil(st / 15) * 15; if (st < 360) st = 480; if (st > 1260) st = 1080;
    var h = num(d.profile && d.profile.hours); if (h < 1 || h > 12) h = 4;
    return { start: st, hours: h, sess: 45, brk: 10 };
  }
  function settings() { var s = jget('d6_set', null), d = defaults(); if (!s) return d; return { start: d.start, hours: s.hours || d.hours, sess: s.sess || 45, brk: s.brk || 10 }; }

  function subjectsLeft() {
    var d = DB(), out = [];
    (d.subjects || []).forEach(function (x) { var left = Math.max(0, num(x.backlog) - num(x.backlogDone)); if (left > 0) out.push({ name: x.name, left: left, diff: Math.min(5, Math.max(1, num(x.difficulty) || 3)) }); });
    return out;
  }
  function daysLeft() {
    var d = DB(), ed = d.profile && d.profile.examDate; if (ed) { var t = new Date(ed + 'T00:00:00'); if (!isNaN(t)) { var n = Math.ceil((t - new Date()) / 86400000); if (n >= 1) return Math.min(n, 60); } }
    return 14;
  }

  function build(set) {
    var subs = subjectsLeft(); if (!subs.length) return null;
    var total = Math.round(set.hours * 60), cyc = set.sess + set.brk, nSess = Math.max(1, Math.floor((total + set.brk) / cyc));
    subs.forEach(function (s) { s.w = s.left * (1 + s.diff * 0.35); });
    var W = subs.reduce(function (a, s) { return a + s.w; }, 0), left = nSess;
    subs.forEach(function (s) { s.n = Math.floor(s.w / W * nSess); });
    var used = subs.reduce(function (a, s) { return a + s.n; }, 0);
    subs.slice().sort(function (a, b) { return (b.w / W * nSess - b.n) - (a.w / W * nSess - a.n); }).forEach(function (s) { if (used < nSess) { s.n++; used++; } });
    if (nSess >= subs.length) subs.forEach(function (s) { if (s.n < 1) { var big = subs.slice().sort(function (a, b) { return b.n - a.n; })[0]; if (big.n > 1) { big.n--; s.n = 1; } } });
    var dl = daysLeft();
    subs.forEach(function (s) { s.target = Math.min(s.left, Math.max(1, Math.ceil(s.left / dl))); });
    var order = [], act = subs.filter(function (s) { return s.n > 0; }).sort(function (a, b) { return b.diff - a.diff; }), cnt = {};
    var guard = 0; while (order.length < nSess && guard++ < 500) { act.forEach(function (s) { cnt[s.name] = cnt[s.name] || 0; if (cnt[s.name] < s.n && order.length < nSess) { order.push(s); cnt[s.name]++; } }); }
    var blocks = [], t = set.start, seen = {};
    order.forEach(function (s, i) {
      var k = (seen[s.name] = (seen[s.name] || 0) + 1), per = Math.max(1, Math.ceil(s.target / s.n)), lessons = Math.min(per, Math.max(0, s.target - per * (k - 1)));
      if (lessons < 1) lessons = 1;
      blocks.push({ type: 'study', name: s.name, start: t, min: set.sess, lessons: lessons });
      t += set.sess;
      if (i < order.length - 1) { var long = (i + 1) % 3 === 0, bm = long ? Math.max(20, set.brk * 2) : set.brk; blocks.push({ type: 'break', name: long ? 'راحة طويلة ☕' : 'بريك', start: t, min: bm, long: long }); t += bm; }
    });
    return { day: dayStr(), set: set, blocks: blocks, end: t, nSess: order.length };
  }
  function plan(force) {
    var p = jget('d6_plan', null), set = settings();
    if (!force && p && p.day === dayStr() && p.blocks) return p;
    p = build(set); if (p) { p.done = {}; ls('d6_plan', JSON.stringify(p)); } else ls('d6_plan', '');
    return p;
  }


  /* ---------- خطة الأيام (متعددة الأيام) ---------- */
  var tab = 'today';
  var AR_DAYS = ['الأحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت'];
  function addDays(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); return x; }
  function ds(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function dayLabel(d) { return AR_DAYS[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1); }
  function examDays() {
    var d = DB(), ed = d.profile && d.profile.examDate; if (!ed) return 0;
    var t = new Date(ed + 'T00:00:00'); if (isNaN(t)) return 0;
    var n = Math.ceil((t - new Date()) / 86400000); return n >= 1 ? Math.min(n, 90) : 0;
  }
  function buildDays(N, subs) {
    subs = (subs || subjectsLeft()).map(function (s) { return { name: s.name, left: s.left, diff: s.diff, base: s.left }; });
    if (!subs.length) return null;
    var L = subs.reduce(function (a, s) { return a + s.left; }, 0);
    N = Math.max(1, Math.min(N, L));
    var cap = Math.ceil(L / N), start = new Date(), days = [], i = 0;
    function wt(s) { return s.left * (1 + s.diff * 0.35); }
    while (subs.some(function (s) { return s.left > 0; }) && i < 120) {
      var used = {}, nUsed = 0, items = [], budget = cap;
      while (budget > 0) {
        var cand = subs.filter(function (s) { return s.left > 0 && (nUsed < 3 || used[s.name]); });
        if (!cand.length) break;
        cand.sort(function (a, b) { return wt(b) - wt(a); });
        var s = cand[0], take = Math.min(s.left, budget, Math.max(1, Math.ceil(cap / 2)));
        if (!used[s.name]) { used[s.name] = 1; nUsed++; }
        var it = items.filter(function (x) { return x.name === s.name; })[0];
        if (it) it.n += take; else items.push({ name: s.name, n: take, diff: s.diff });
        s.left -= take; budget -= take;
      }
      var dt = addDays(start, i);
      days.push({ date: ds(dt), label: dayLabel(dt), items: items });
      i++;
    }
    var base = {}; subs.forEach(function (s) { base[s.name] = s.base; });
    return { created: ds(start), N: N, total: L, cap: cap, base: base, days: days, done: {} };
  }
  function dplan() { return jget('d7_plan', null); }
  function dsave(p) { ls('d7_plan', JSON.stringify(p)); }
  function tickedFor(p) {
    var t = {};
    p.days.forEach(function (d, di) { d.items.forEach(function (it) { if (p.done[di + '|' + it.name]) t[it.name] = (t[it.name] || 0) + it.n; }); });
    return t;
  }
  function replan(p, N) {
    var tk = tickedFor(p), cur = subjectsLeft().map(function (s) {
      var b = p.base[s.name]; if (b != null) s.left = Math.min(s.left, Math.max(0, b - (tk[s.name] || 0)));
      return s;
    }).filter(function (s) { return s.left > 0; });
    return buildDays(N, cur);
  }
  function daysHtml() {
    var p = dplan(), ex = examDays(), h = '', defN = ex ? Math.min(ex, 60) : 14;
    var choices = [7, 10, 14, 21, 30]; if (ex && choices.indexOf(ex) < 0 && ex <= 60) choices.push(ex); choices.sort(function (a, b) { return a - b; });
    var curN = p ? p.N : defN;
    h += '<div style="display:flex;gap:6px;align-items:flex-end;margin-bottom:8px;font-size:12px;color:#d6d9ff"><label style="flex:1">عدد الأيام<select id="d7n" style="width:100%">' +
      choices.map(function (v) { return '<option value="' + v + '"' + (v == curN ? ' selected' : '') + '>' + v + ' يوم' + (ex && v === ex ? ' (لحد الامتحان)' : '') + '</option>'; }).join('') + '</select></label>' +
      '<button id="d7go" style="flex:1;padding:10px;border:0;border-radius:11px;font:inherit;font-weight:800;color:#fff;background:linear-gradient(135deg,#1fa070,#0b6b48);cursor:pointer">' + (p ? '🔄 ابني الخطة من جديد' : '✨ ابني خطة الأيام') + '</button></div>';
    if (!p) {
      if (!subjectsLeft().length) return h + '<div style="padding:14px;text-align:center;opacity:.9">مفيش دروس متراكمة متسجلة لسه.<br>ضيف موادك وعدد الدروس المتراكمة في صفحة التراكمات وبعدين ابني الخطة.<br><br><button id="d6bk" style="border:0;border-radius:10px;padding:10px 16px;font:inherit;font-weight:800;cursor:pointer">📚 افتح التراكمات</button></div>';
      return h + '<div style="padding:14px;text-align:center;opacity:.9">اختار عدد الأيام واضغط "ابني خطة الأيام" وهقولك كل يوم تذاكر إيه وكام درس.</div>';
    }
    var today = ds(new Date()), tot = 0, dn = 0, late = 0;
    p.days.forEach(function (d, di) { d.items.forEach(function (it) { tot += it.n; if (p.done[di + '|' + it.name]) dn += it.n; else if (d.date < today) late += it.n; }); });
    var pc = tot ? Math.round(dn / tot * 100) : 0;
    h += '<div style="font-size:13px;margin-bottom:6px">' + p.days.length + ' يوم • ' + tot + ' درس • بمعدل حوالي ' + p.cap + ' درس في اليوم • خلصت ' + dn + '/' + tot + '</div>';
    h += '<div style="height:8px;background:rgba(255,255,255,.15);border-radius:6px;margin-bottom:8px"><div style="height:8px;width:' + pc + '%;background:#34d399;border-radius:6px"></div></div>';
    if (late > 0) h += '<div style="background:rgba(255,120,80,.2);border-radius:10px;padding:8px;font-size:12px;margin-bottom:8px">⚠️ متأخر عليك ' + late + ' درس من أيام فاتت. <button id="d7re" style="border:0;border-radius:8px;padding:5px 9px;font:inherit;font-weight:800;cursor:pointer;margin-right:4px">وزّع المتبقي من النهاردة</button></div>';
    p.days.forEach(function (d, di) {
      var isT = d.date === today, past = d.date < today, all = d.items.length && d.items.every(function (it) { return p.done[di + '|' + it.name]; });
      h += '<div style="margin:6px 0;padding:9px;border-radius:12px;background:' + (all ? 'rgba(52,211,153,.18)' : isT ? 'rgba(99,102,241,.35)' : 'rgba(255,255,255,.07)') + ';' + (isT ? 'border:1px solid #a5b4fc' : '') + '">';
      h += '<div style="font-weight:800;font-size:13px;margin-bottom:4px">يوم ' + (di + 1) + ' • ' + d.label + (isT ? ' • النهاردة 📍' : '') + (all ? ' ✅' : (past ? ' • فات' : '')) + '</div>';
      d.items.forEach(function (it) {
        var k = di + '|' + it.name, dd = !!p.done[k];
        h += '<label style="display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer"><input type="checkbox" data-k="' + k + '"' + (dd ? ' checked' : '') + ' style="width:19px;height:19px"><span style="flex:1;' + (dd ? 'text-decoration:line-through;opacity:.6' : '') + '"><b>' + esc(it.name) + '</b> • ' + it.n + ' ' + (it.n > 1 ? 'دروس' : 'درس') + '</span></label>';
      });
      h += '</div>';
    });
    h += '<div style="font-size:12px;opacity:.75;margin-top:8px;text-align:center">الخطة بتوزّع دروسك المتراكمة على الأيام، والمواد الأصعب والأكبر بتيجي الأول. علّم على المادة لما تخلص دروسها.</div>';
    h += '<button id="d7cp" style="width:100%;margin-top:8px;padding:9px;border:0;border-radius:10px;font:inherit;cursor:pointer">📋 انسخ خطة الأيام</button>';
    return h;
  }
  function bindDays() {
    var g = $, p = dplan();
    g('d6bk') && (g('d6bk').onclick = function () { close(); try { window.go('backlog'); } catch (e) { } });
    g('d7go') && (g('d7go').onclick = function () { var np = buildDays(+g('d7n').value); if (np) dsave(np); else ls('d7_plan', ''); render(); });
    g('d7re') && (g('d7re').onclick = function () { var np = replan(p, +g('d7n').value || p.N); if (np) dsave(np); else ls('d7_plan', ''); render(); });
    if (!p) return;
    ov.querySelectorAll('input[data-k]').forEach(function (c) { c.onchange = function () { p.done[c.getAttribute('data-k')] = c.checked; dsave(p); render(); }; });
    g('d7cp') && (g('d7cp').onclick = function () {
      var tx = '📅 خطة المذاكرة\n' + p.days.map(function (d, i) { return 'يوم ' + (i + 1) + ' (' + d.label + '): ' + d.items.map(function (it) { return it.name + ' ' + it.n + ' درس'; }).join(' + '); }).join('\n');
      try { navigator.clipboard.writeText(tx); g('d7cp').textContent = '✅ اتنسخ'; } catch (e) { }
    });
  }
  function tabsHtml() {
    var st = function (on) { return 'flex:1;padding:9px;border:0;border-radius:10px;font:inherit;font-weight:800;cursor:pointer;color:#fff;background:' + (on ? 'linear-gradient(135deg,#1fa070,#0b6b48)' : 'rgba(255,255,255,.1)'); };
    return '<div style="display:flex;gap:6px;margin-bottom:10px"><button id="d7t1" style="' + st(tab === 'today') + '">⏱ جدول اليوم</button><button id="d7t2" style="' + st(tab === 'days') + '">🗓 خطة الأيام</button></div>';
  }
  function bindTabs() {
    var a = $('d7t1'), b = $('d7t2');
    a && (a.onclick = function () { tab = 'today'; render(); });
    b && (b.onclick = function () { tab = 'days'; render(); });
  }

  /* ---------- الواجهة ---------- */
  var ov = null, timer = null, run = null;
  function beep() { try { var c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value = 880; g.gain.value = 0.2; o.start(); setTimeout(function () { o.stop(); c.close(); }, 700); } catch (e) { } try { navigator.vibrate && navigator.vibrate([300, 150, 300]); } catch (e) { } }
  function save(p) { ls('d6_plan', JSON.stringify(p)); }
  function close() { if (ov && ov.parentNode) ov.parentNode.removeChild(ov); ov = null; }
  function opts(arr, cur, fmt) { return arr.map(function (v) { return '<option value="' + v + '"' + (v == cur ? ' selected' : '') + '>' + fmt(v) + '</option>'; }).join(''); }
  function render() {
    if (!ov) return;
    var set = settings(), p = plan(false), h = '';
    h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><b style="font-size:18px">📅 جدولي</b><button id="d6x" style="border:0;background:transparent;color:#fff;font-size:22px;cursor:pointer">✕</button></div>';
    h += tabsHtml();
    if (tab === 'days') { h += daysHtml(); ov.firstChild.innerHTML = h; $('d6x').onclick = close; bindTabs(); bindDays(); return; }
    h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-bottom:8px;font-size:12px;color:#d6d9ff">';
    h += '<label>البداية<input id="d6st" type="time" value="' + ('0' + Math.floor(set.start / 60)).slice(-2) + ':' + ('0' + (set.start % 60)).slice(-2) + '" style="width:100%"></label>';
    h += '<label>ساعات المذاكرة<select id="d6h" style="width:100%">' + opts([1, 2, 3, 4, 5, 6, 7, 8], Math.round(set.hours), function (v) { return v + ' س'; }) + '</select></label>';
    h += '<label>الجلسة<select id="d6s" style="width:100%">' + opts([25, 30, 45, 50, 60], set.sess, function (v) { return v + ' د'; }) + '</select></label>';
    h += '<label>البريك<select id="d6b" style="width:100%">' + opts([5, 10, 15], set.brk, function (v) { return v + ' د'; }) + '</select></label></div>';
    h += '<button id="d6go" style="width:100%;padding:11px;border:0;border-radius:11px;font:inherit;font-weight:800;color:#fff;background:linear-gradient(135deg,#1fa070,#0b6b48);cursor:pointer;margin-bottom:10px">🔄 وزّع تراكمي على اليوم</button>';
    if (!p) {
      h += '<div style="padding:14px;text-align:center;opacity:.9">مفيش دروس متراكمة متسجلة لسه.<br>ضيف موادك وعدد الدروس المتراكمة في صفحة التراكمات وأنا أقسمها عليك.<br><br><button id="d6bk" style="border:0;border-radius:10px;padding:10px 16px;font:inherit;font-weight:800;cursor:pointer">📚 افتح التراكمات</button></div>';
    } else {
      var st = p.blocks.filter(function (b) { return b.type === 'study'; }), dn = st.filter(function (b, i) { return p.done[b.start]; }).length;
      var pc = Math.round(dn / st.length * 100);
      h += '<div style="font-size:13px;margin-bottom:6px">من ' + hm(p.blocks[0].start) + ' لحد ' + hm(p.end) + ' • ' + st.length + ' جلسات • خلصت ' + dn + '/' + st.length + '</div>';
      h += '<div style="height:8px;background:rgba(255,255,255,.15);border-radius:6px;margin-bottom:10px"><div style="height:8px;width:' + pc + '%;background:#34d399;border-radius:6px"></div></div>';
      p.blocks.forEach(function (b) {
        if (b.type === 'break') { h += '<div style="text-align:center;font-size:12px;opacity:.75;padding:4px 0">' + hm(b.start) + ' • ' + esc(b.name) + ' ' + b.min + ' د</div>'; return; }
        var d = !!p.done[b.start], running = run && run.start === b.start;
        h += '<div style="display:flex;align-items:center;gap:8px;padding:9px;margin:4px 0;border-radius:12px;background:' + (d ? 'rgba(52,211,153,.18)' : 'rgba(255,255,255,.08)') + '">';
        h += '<input type="checkbox" data-d="' + b.start + '"' + (d ? ' checked' : '') + ' style="width:20px;height:20px">';
        h += '<div style="flex:1"><b>' + esc(b.name) + '</b><div style="font-size:12px;opacity:.8">' + hm(b.start) + ' • ' + b.min + ' دقيقة • هدف: ' + b.lessons + ' ' + (b.lessons > 1 ? 'دروس' : 'درس') + '</div></div>';
        h += '<button data-r="' + b.start + '" style="border:0;border-radius:9px;padding:7px 10px;font:inherit;font-weight:800;cursor:pointer">' + (running ? '<span id="d6t">...</span>' : '▶ ابدأ') + '</button></div>';
      });
      h += '<div style="font-size:12px;opacity:.75;margin-top:8px;text-align:center">علّم الجلسة لما تخلصها. التوزيع على حسب عدد دروسك المتراكمة وصعوبة كل مادة، والمواد الأصعب بتيجي الأول.</div>';
      h += '<button id="d6cp" style="width:100%;margin-top:8px;padding:9px;border:0;border-radius:10px;font:inherit;cursor:pointer">📋 انسخ الجدول</button>';
    }
    ov.firstChild.innerHTML = h;
    bindTabs();
    bind(p);
  }
  function bind(p) {
    var g = function (i) { return $(i); };
    g('d6x') && (g('d6x').onclick = close);
    g('d6bk') && (g('d6bk').onclick = function () { close(); try { window.go('backlog'); } catch (e) { } });
    g('d6go') && (g('d6go').onclick = function () {
      var t = (g('d6st').value || '16:00').split(':'), s = { hours: +g('d6h').value, sess: +g('d6s').value, brk: +g('d6b').value };
      ls('d6_set', JSON.stringify(s)); var set = settings(); set.start = (+t[0]) * 60 + (+t[1]);
      var pp = build(set); if (pp) { pp.done = {}; save(pp); } else ls('d6_plan', ''); render();
    });
    if (!p) return;
    ov.querySelectorAll('input[data-d]').forEach(function (c) { c.onchange = function () { p.done[c.getAttribute('data-d')] = c.checked; save(p); render(); }; });
    ov.querySelectorAll('button[data-r]').forEach(function (b) { b.onclick = function () { startRun(+b.getAttribute('data-r'), p); }; });
    g('d6cp') && (g('d6cp').onclick = function () {
      var tx = '📅 جدول اليوم\n' + p.blocks.map(function (b) { return hm(b.start) + ' - ' + (b.type === 'study' ? b.name + ' (' + b.min + ' د، ' + b.lessons + ' درس)' : b.name + ' ' + b.min + ' د'); }).join('\n');
      try { navigator.clipboard.writeText(tx); g('d6cp').textContent = '✅ اتنسخ'; } catch (e) { }
    });
  }
  function startRun(start, p) {
    var b = p.blocks.filter(function (x) { return x.start === start; })[0]; if (!b) return;
    if (run && run.start === start) { run = null; clearInterval(timer); render(); return; }
    run = { start: start, end: Date.now() + b.min * 60000 };
    clearInterval(timer);
    timer = setInterval(function () {
      var left = Math.max(0, Math.round((run.end - Date.now()) / 1000)), el = $('d6t');
      if (el) el.textContent = ('0' + Math.floor(left / 60)).slice(-2) + ':' + ('0' + left % 60).slice(-2);
      if (left <= 0) { clearInterval(timer); var s = run.start; run = null; beep(); p.done[s] = true; save(p); render(); }
    }, 500);
    render();
  }
  function open() {
    if (ov) return;
    ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center;direction:rtl';
    ov.onclick = function (e) { if (e.target === ov) close(); };
    var card = document.createElement('div');
    card.style.cssText = 'width:100%;max-width:520px;max-height:88vh;overflow:auto;background:#14162b;color:#fff;border-radius:18px 18px 0 0;padding:14px;font-family:inherit;box-sizing:border-box';
    ov.appendChild(card); document.body.appendChild(ov); plan(false); render();
  }
  window.openDailyPlan = open; window.openDaysPlan = function () { tab = 'days'; if (ov) render(); else open(); }; window.__d6 = { build: build, settings: settings, hm: hm };

  var fab = null;
  function fabCheck() {
    if (loggedIn()) {
      if (!fab) {
        fab = document.createElement('button'); fab.type = 'button'; fab.textContent = '📅 جدولي';
        fab.style.cssText = 'position:fixed;left:12px;bottom:84px;z-index:99990;border:0;border-radius:22px;padding:10px 14px;font:800 14px inherit;color:#fff;background:linear-gradient(135deg,#1fa070,#0b6b48);box-shadow:0 6px 16px rgba(0,0,0,.4);cursor:pointer';
        fab.onclick = open; document.body.appendChild(fab);
      }
    } else if (fab) { fab.parentNode.removeChild(fab); fab = null; }
  }
  setInterval(fabCheck, 2000);
  /* زرار كبير داخل المدرّس */
  function tutorBtn() {
    var box = $('t4big'); if (!box || $('d6tb')) return;
    var b = document.createElement('button'); b.id = 'd6tb'; b.type = 'button'; b.textContent = '📅 جدول اليوم';
    b.style.cssText = 'flex:1 1 30%;padding:10px 4px;font-size:13px;border:0;border-radius:12px;font-weight:800;color:#fff;background:linear-gradient(135deg,#1fa070,#0b6b48);cursor:pointer';
    b.onclick = open; box.insertBefore(b, box.firstChild);
  }
  setInterval(tutorBtn, 2000);
  /* كارت في الصفحة الرئيسية */
  function homeCard() {
    var home = $('home'); if (!home || $('d6home')) return;
    var hero = home.querySelector('.hero'); if (!hero) return;
    var c = document.createElement('div'); c.id = 'd6home';
    c.style.cssText = 'margin:12px 0;padding:14px;border-radius:16px;background:linear-gradient(135deg,#1fa070,#0b6b48);color:#fff;display:flex;align-items:center;gap:12px;cursor:pointer;box-shadow:0 8px 22px rgba(31,160,112,.35)';
    c.innerHTML = '<div style="font-size:30px">📅</div><div style="flex:1"><b style="font-size:16px">جدول اليوم التلقائي</b><div style="font-size:13px;opacity:.92;margin-top:2px">قسّم تراكمك على ساعات وبريكات في ضغطة واحدة</div></div><div style="font-weight:800;background:#fff;color:#0b6b48;border-radius:10px;padding:8px 12px">افتح ›</div>';
    c.onclick = open;
    if (hero.nextSibling) hero.parentNode.insertBefore(c, hero.nextSibling); else hero.parentNode.appendChild(c);
  }
  setInterval(homeCard, 2000);
})();

