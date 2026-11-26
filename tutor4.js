/* المدرّس الذكي 4 - كويز ذكي (مراجعة متباعدة للأخطاء) + تقرير أسبوعي. مجاني وعلى الجهاز */
(function () {
  'use strict';
  var BUILD = 1;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) {
    return String(s || '').toLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 1632); })
      .replace(/[؟?!.,،؛:"'()\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { } }
  function jget(k, d) { try { var v = JSON.parse(ls(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { ls(k, JSON.stringify(v)); }
  function num(x) { x = Number(x); return isFinite(x) ? x : 0; }
  function dayStr(t) { var d = new Date(t || Date.now()); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function fu(list) { return '<div class="t2-fu">' + list.map(function (t) { return '<button data-q="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div>'; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var QB = [
    ['إنجليزي', 'She ___ to school every day.', ['go', 'goes', 'going'], 1, 'مع she نضيف s للفعل في Present Simple.'],
    ['إنجليزي', 'I ___ him yesterday.', ['see', 'saw', 'have seen'], 1, 'yesterday = ماضي بسيط.'],
    ['إنجليزي', 'If it rains, we ___ at home.', ['stay', 'will stay', 'would stay'], 1, 'Type 1: will + V1.'],
    ['إنجليزي', 'The letter ___ by Ali.', ['wrote', 'was written', 'is writing'], 1, 'Passive: was + V3.'],
    ['إنجليزي', 'He has lived here ___ 2020.', ['for', 'since', 'ago'], 1, 'since مع نقطة بداية.'],
    ['عربي', 'الفاعل في الجملة يكون:', ['منصوب', 'مرفوع', 'مجرور'], 1, 'الفاعل دائماً مرفوع.'],
    ['عربي', 'إنّ وأخواتها تنصب:', ['الخبر', 'الاسم', 'الاثنين'], 1, 'تنصب الاسم وترفع الخبر.'],
    ['عربي', 'جمع المذكر السالم يُرفع بـ:', ['الواو', 'الألف', 'الكسرة'], 0, 'يُرفع بالواو ويُنصب ويُجر بالياء.'],
    ['فيزياء', 'قانون أوم:', ['V = I × R', 'V = I / R', 'V = R / I'], 0, 'الجهد = التيار × المقاومة.'],
    ['فيزياء', 'وحدة القوة:', ['جول', 'نيوتن', 'واط'], 1, 'القوة بالنيوتن.'],
    ['فيزياء', 'مقاومتان 4 و 4 أوم على التوالي، المقاومة الكلية:', ['2', '8', '16'], 1, 'التوالي: نجمع.'],
    ['كيمياء', 'الصيغة العامة للألكانات:', ['CnH2n', 'CnH2n+2', 'CnH2n-2'], 1, 'ألكان = CnH2n+2.'],
    ['كيمياء', 'عدد المولات = ', ['الكتلة ÷ الكتلة المولية', 'الكتلة × الكتلة المولية', 'الحجم × الكتلة'], 0, 'n = m / M.'],
    ['رياضيات', 'مشتقة x³:', ['3x²', 'x²', '3x'], 0, 'n x^(n-1).'],
    ['رياضيات', 'الحد العاشر في متتابعة 3, 7, 11, ...', ['39', '43', '40'], 0, 'a10 = 3 + 9×4 = 39.'],
    ['رياضيات', 'مساحة دائرة نصف قطرها 7 (π=22/7):', ['154', '44', '49'], 0, 'π r² = 154.'],
    ['أحياء', 'الانقسام الميوزي ينتج:', ['خليتين', '4 خلايا', 'خلية واحدة'], 1, 'ينتج 4 خلايا بنصف العدد.'],
    ['أحياء', 'مادة الوراثة هي:', ['DNA', 'ATP', 'RNA فقط'], 0, 'DNA.'],
    ['عام', 'أفضل طريقة للحفظ:', ['القراءة المتكررة فقط', 'الاسترجاع النشط والمراجعة المتباعدة', 'السهر قبل الامتحان'], 1, 'Active recall + spacing.'],
    ['عام', 'مدة جلسة بومودورو:', ['25 دقيقة', '3 ساعات', '5 دقايق'], 0, '25 + 5 راحة.']
  ];
  var EXAMS = [['physics', 'فيزياء 2027'], ['english2027', 'إنجليزي 2027'], ['november', 'إنجليزي نوفمبر'], ['grammar', 'جرامر'], ['arabic', 'عربي بكالوريا'], ['networks', 'الشبكات']];
  var SUBJ = ['إنجليزي', 'عربي', 'فيزياء', 'كيمياء', 'رياضيات', 'أحياء', 'شبكات', 'عام'];
  var EB = [];
  try { fetch('qbank.json?v=1').then(function (r) { return r.json(); }).then(function (a) { if (Array.isArray(a)) EB = a; }).catch(function () { }); } catch (e) { }

  function allItems() {
    var out = QB.map(function (x) { return { s: x[0], q: x[1], o: x[2], a: x[3], n: x[4], src: '' }; });
    EB.forEach(function (x) { out.push({ s: x.s, q: x.q, o: x.o, a: x.a, n: '', src: x.t, e: x.e }); });
    out.forEach(function (x) { x.k = norm(x.q).slice(0, 80) + '|' + norm(x.o[x.a]); });
    return out;
  }

  /* ---------- مخزن المراجعة (Leitner): غلط = يرجع بكرة، صح = يتباعد ---------- */
  var GAP = [1, 3, 7, 14];
  function weakStore() { return jget('t4_weak', {}); }
  function dueKeys() { var w = weakStore(), t = dayStr(), r = []; for (var k in w) if (w[k].due <= t) r.push(k); return r; }
  function weakCount() { return Object.keys(weakStore()).length; }
  function stats() { return jget('t4_stats', {}); }
  function record(item, ok) {
    var st = stats(), s = st[item.s] || { ok: 0, tot: 0 }; s.tot++; if (ok) s.ok++; st[item.s] = s; jset('t4_stats', st);
    var lg = jget('t4_log', []), d = dayStr(), last = lg[lg.length - 1];
    if (!last || last.d !== d) { last = { d: d, ok: 0, tot: 0 }; lg.push(last); }
    last.tot++; if (ok) last.ok++; if (lg.length > 60) lg = lg.slice(-60); jset('t4_log', lg);
    var w = weakStore(), e = w[item.k];
    if (!ok) { w[item.k] = { box: 0, due: dayStr(Date.now() + 86400000), it: { s: item.s, q: item.q, o: item.o, a: item.a, n: item.n, src: item.src } }; }
    else if (e) { e.box++; if (e.box >= GAP.length) delete w[item.k]; else e.due = dayStr(Date.now() + GAP[e.box] * 86400000); }
    jset('t4_weak', w);
  }

  /* ---------- الكويز الذكي ---------- */
  var quiz = null;
  function buildPool(opt) {
    var items = allItems(), w = weakStore(), pool = [], N = 8;
    var due = dueKeys().map(function (k) { var e = w[k].it; return { s: e.s, q: e.q, o: e.o, a: e.a, n: e.n, src: e.src, k: k }; });
    if (opt.weakOnly) { pool = shuffle(Object.keys(w).map(function (k) { var e = w[k].it; return { s: e.s, q: e.q, o: e.o, a: e.a, n: e.n, src: e.src, k: k }; })); return pool.slice(0, N); }
    var base = items;
    if (opt.exam) base = items.filter(function (x) { return x.e === opt.exam; });
    else if (opt.subj) base = items.filter(function (x) { return x.s === opt.subj; });
    if (base.length < 3) base = items;
    var seen = {};
    if (!opt.exam && !opt.subj) shuffle(due).slice(0, 3).forEach(function (x) { pool.push(x); seen[x.k] = 1; });
    var st = stats(), weakSubj = null, worst = 2;
    for (var sj in st) if (st[sj].tot >= 3) { var r = st[sj].ok / st[sj].tot; if (r < worst) { worst = r; weakSubj = sj; } }
    if (opt.adaptive && weakSubj && worst < 0.7) {
      shuffle(items.filter(function (x) { return x.s === weakSubj && !seen[x.k]; })).slice(0, 3).forEach(function (x) { pool.push(x); seen[x.k] = 1; });
    }
    shuffle(base).forEach(function (x) { if (pool.length < N && !seen[x.k]) { pool.push(x); seen[x.k] = 1; } });
    return shuffle(pool);
  }
  function prep(x) {
    var correct = x.o[x.a], opts = shuffle(x.o);
    return { s: x.s, q: x.q, o: opts, a: opts.indexOf(correct), n: x.n, src: x.src, k: x.k || (norm(x.q).slice(0, 80) + '|' + norm(correct)) };
  }
  function parseOpt(q) {
    var n = norm(q), o = {};
    if (/اخطا|غلطات|ضعف|المراجعه/.test(n)) { o.weakOnly = true; return o; }
    if (/امتحان/.test(n)) { EXAMS.forEach(function (e) { if (n.indexOf(norm(e[1])) > -1) o.exam = e[0]; }); if (o.exam) return o; }
    SUBJ.forEach(function (s) { if (n.indexOf(norm(s)) > -1) o.subj = s; });
    if (!o.subj) o.adaptive = true;
    return o;
  }
  function start(q) {
    var opt = parseOpt(q), pool = buildPool(opt);
    if (!pool.length) return 'مفيش أخطاء محفوظة للمراجعة دلوقتي 🎉 اعمل كويز عادي وأي سؤال تغلط فيه هيتحفظ تلقائياً وأرجّعهولك بعدين.' + fu(['كويز ذكي', 'تقريري']);
    quiz = { q: pool.map(prep), i: 0, ok: 0, wrong: [], weakMode: !!opt.weakOnly };
    var head = opt.weakOnly ? '🔁 <b>مراجعة أخطائك</b> (' + pool.length + ' أسئلة)<br><br>' : '🎯 <b>كويز ذكي</b> (' + pool.length + ' أسئلة، بيختار لك الأضعف أول)<br><br>';
    return head + ask();
  }
  function ask() {
    var x = quiz.q[quiz.i];
    return '<b>سؤال ' + (quiz.i + 1) + '/' + quiz.q.length + ' (' + esc(x.s) + ')</b><br><span dir="auto">' + esc(x.q) + '</span>' + fu(x.o.concat(['إنهاء الكويز']));
  }
  function finish() {
    var ok = quiz.ok, tot = quiz.q.length, bad = quiz.wrong.slice(), pc = Math.round(ok / tot * 100); quiz = null;
    var by = {}; bad.forEach(function (s) { by[s] = (by[s] || 0) + 1; });
    var worst = Object.keys(by).sort(function (a, b) { return by[b] - by[a]; })[0];
    var h = '🏁 <b>نتيجتك: ' + ok + '/' + tot + ' (' + pc + '%)</b><br>' + (pc >= 80 ? 'ممتاز 🔥 كمّل.' : pc >= 50 ? 'كويس، المراجعة هتثبّت الباقي.' : 'محتاج مراجعة، بس ده طبيعي، الغلط هو اللي بيعلّم.');
    if (bad.length) h += '<br>📌 حفظت ' + bad.length + ' سؤال غلط، هرجّعهملك بكرة وبعدها بالتدريج لحد ما تثبّت.';
    if (worst) h += '<br>أضعف حاجة النهارده: <b>' + esc(worst) + '</b>.';
    var ch = ['كويز ذكي', 'تقريري']; if (worst) ch.unshift('اختبرني في ' + worst); if (weakCount()) ch.unshift('راجع أخطائي في الكويز');
    return h + fu(ch);
  }
  function handleAnswer(q) {
    var n = norm(q);
    if (/^(انهاء الكويز|الغاء|وقف)/.test(n)) { quiz = null; return 'وقّفت الكويز. اللي جاوبته اتسجّل 👍' + fu(['كويز ذكي', 'تقريري']); }
    var x = quiz.q[quiz.i], idx = x.o.map(norm).indexOf(n);
    if (idx < 0) { quiz = null; return null; }
    var msg, ok = idx === x.a;
    record(x, ok);
    if (ok) { quiz.ok++; msg = '✅ صح! ' + esc(x.n || (x.src ? 'من امتحان: ' + x.src : '')); }
    else { quiz.wrong.push(x.s); msg = '❌ غلط. الإجابة الصح: <b>' + esc(x.o[x.a]) + '</b><br>' + esc(x.n || (x.src ? 'من امتحان: ' + x.src : '')); }
    quiz.i++;
    if (quiz.i >= quiz.q.length) return msg + '<br><br>' + finish();
    return msg + '<br><br>' + ask();
  }

  /* ---------- التقرير الأسبوعي ---------- */
  function report() {
    var a = {}, d = {};
    try { a = (arenaGet() || {}).st || {}; } catch (e) { }
    try { d = loadDB() || {}; } catch (e) { }
    var lg = jget('t4_log', []), cut = dayStr(Date.now() - 6 * 86400000), ok = 0, tot = 0, days = 0;
    lg.forEach(function (x) { if (x.d >= cut) { ok += x.ok; tot += x.tot; days++; } });
    var st = stats(), best = null, worst = null;
    for (var s in st) if (st[s].tot >= 3) { var r = st[s].ok / st[s].tot; if (!best || r > best.r) best = { s: s, r: r }; if (!worst || r < worst.r) worst = { s: s, r: r }; }
    var h = '📊 <b>تقريرك آخر 7 أيام</b><br>';
    h += '🔥 السلسلة: ' + num(a.streak) + ' يوم' + (num(a.bestStreak) > num(a.streak) ? ' (أعلى سلسلة ' + num(a.bestStreak) + ')' : '') + '<br>';
    if (a.week) h += '🏆 نقاط الأسبوع: ' + num(a.week.points) + ' | امتحانات: ' + num(a.week.exams) + '<br>';
    if (d.focus) h += '⏱️ التركيز: ' + num(d.focus.minutes) + ' دقيقة في ' + num(d.focus.sessions) + ' جلسة<br>';
    var left = 0; (d.subjects || []).forEach(function (x) { left += Math.max(0, num(x.backlog) - num(x.backlogDone)); });
    if (left) h += '📚 دروس متراكمة متبقية: ' + left + '<br>';
    if (tot) h += '🎯 الكويز: ' + ok + '/' + tot + ' صح (' + Math.round(ok / tot * 100) + '%) في ' + days + ' يوم<br>';
    else h += '🎯 لسه ماعملتش كويز الأسبوع ده. جرّب الكويز الذكي.<br>';
    if (best && worst && best.s !== worst.s) h += '💪 أقوى مادة: <b>' + esc(best.s) + '</b> (' + Math.round(best.r * 100) + '%)<br>⚠️ محتاجة شغل: <b>' + esc(worst.s) + '</b> (' + Math.round(worst.r * 100) + '%)<br>';
    var due = dueKeys().length;
    if (due) h += '🔁 عندك ' + due + ' سؤال مستحقين للمراجعة النهارده.<br>';
    var tip = due ? 'ابدأ بمراجعة أخطائك، دي أسرع طريقة ترفع بيها مستواك.' : worst && worst.r < 0.6 ? 'ركّز الأسبوع ده على ' + worst.s + ' وخد كويز قصير كل يوم.' : tot < 10 ? 'ابدأ بـ 8 أسئلة كل يوم، 5 دقايق بس.' : 'ماشي كويس، حافظ على الاستمرار.';
    return h + '<br>💡 ' + tip + fu((due ? ['راجع أخطائي في الكويز'] : []).concat(['كويز ذكي', 'اعملي جدول مذاكرة']));
  }

  /* ---------- الربط بواجهة المدرّس ---------- */
  function addRow(html, me) {
    var lg = $('t2log'); if (!lg) return;
    var r = document.createElement('div'); r.className = 't2-row' + (me ? ' me' : '');
    var b = document.createElement('span'); b.className = 't2-b';
    if (me) b.textContent = html; else b.innerHTML = html;
    r.appendChild(b); lg.appendChild(r); lg.scrollTop = lg.scrollHeight; return r;
  }
  var QRE = /^(اختبرني|كويز|اسالني|quiz|اختبار سريع|راجع اخطا)/, RRE = /^(تقريري|تقرير|تقرير الاسبوع|تقريري الاسبوعي|مستوايا في الكويز)/;
  function route(q) {
    var n = norm(q);
    if (quiz) { var r = handleAnswer(q); if (r != null) return r; }
    if (RRE.test(n)) return report();
    if (/^كويز ذكي/.test(n) || QRE.test(n)) return start(q);
    return null;
  }
  function handle(q) {
    var r = route(q); if (r == null) return false;
    addRow(q, true); setTimeout(function () { addRow(r, false); }, 300); return true;
  }
  function would(q) { var n = norm(q); return !!quiz || RRE.test(n) || /^كويز ذكي/.test(n) || QRE.test(n); }
  window.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('#t2chips button,.t2-fu button,#t2send,#t4big button') : null;
    if (!t) return;
    var q;
    if (t.id === 't2send') { var i = $('t2inp'); q = i ? i.value : ''; } else q = (t.getAttribute('data-q') || t.textContent || '').trim();
    if (!q || !would(q)) return;
    var inp = $('t2inp');
    var r = route(q); if (r == null) return;
    e.stopImmediatePropagation(); e.preventDefault();
    if (t.id === 't2send' && inp) inp.value = '';
    addRow(q, true); setTimeout(function () { addRow(r, false); }, 300);
  }, true);
  window.addEventListener('keydown', function (e) {
    if (!e.target || e.target.id !== 't2inp' || (e.key !== 'Enter' && e.keyCode !== 13)) return;
    var q = e.target.value; if (!q.trim() || !would(q)) return;
    var r = route(q); if (r == null) return;
    e.stopImmediatePropagation(); e.preventDefault(); e.target.value = '';
    addRow(q, true); setTimeout(function () { addRow(r, false); }, 300);
  }, true);

  function init() {
    var card = $('t2'); if (!card || !$('t2log')) return false;
    if (!$('t4big')) {
      var box = document.createElement('div'); box.id = 't4big'; box.style.cssText = 'display:flex;gap:8px;margin:6px 12px';
      [['🎯 كويز ذكي', 'كويز ذكي'], ['📊 تقريري', 'تقريري']].forEach(function (p) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = p[0]; b.setAttribute('data-q', p[1]);
        b.style.cssText = 'flex:1;padding:12px;border:0;border-radius:12px;font:inherit;font-weight:800;color:#fff;background:linear-gradient(135deg,#5b6cf0,#3a45b8);cursor:pointer';
        box.appendChild(b);
      });
      var after = $('t3big') || card.querySelector('.t2-head');
      if (after && after.nextSibling) card.insertBefore(box, after.nextSibling); else card.appendChild(box);
    }
    if (ls('t4_due_shown') !== dayStr()) {
      var due = dueKeys().length;
      if (due) { ls('t4_due_shown', dayStr()); setTimeout(function () { addRow('🔁 عندك <b>' + due + '</b> سؤال غلطت فيهم قبل كده وجه وقت مراجعتهم.' + fu(['راجع أخطائي في الكويز', 'تقريري']), false); }, 2500); }
    }
    return true;
  }
  window.tutor4Build = BUILD; window.tutor4Route = route;
  var tries = 0, iv = setInterval(function () { if (init() || ++tries > 60) clearInterval(iv); }, 500);
})();
