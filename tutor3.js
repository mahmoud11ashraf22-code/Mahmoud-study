/* المدرّس الذكي 2.0 - مجاني، بيشتغل على جهازك بالكامل (بدون أي API مدفوع) */
(function () {
  'use strict';
  var BUILD = 3;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 1632); })
      .replace(/[؟?!.,،؛:"'()\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function DB() { try { return loadDB() || {}; } catch (e) { return {}; } }
  function AR() { try { var a = arenaGet(); return (a && a.st) || {}; } catch (e) { return {}; } }
  function num(x) { x = Number(x); return isFinite(x) ? x : 0; }
  var DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  /* ---------- بيانات الطالب ---------- */
  function snapshot() {
    var d = DB(), a = AR(), s = {};
    s.name = (d.profile && d.profile.name) || '';
    s.subjects = d.subjects || [];
    s.points = num(a.points); s.streak = num(a.streak); s.best = num(a.bestStreak); s.exams = num(a.exams);
    s.weekPoints = a.week ? num(a.week.points) : 0; s.weekExams = a.week ? num(a.week.exams) : 0;
    s.backlogTotal = num(d.backlogTotal); s.backlogDone = num(d.backlogDone);
    var subjLeft = 0; s.subjBacklog = [];
    s.subjects.forEach(function (x) { var left = Math.max(0, num(x.backlog) - num(x.backlogDone)); subjLeft += left; if (left > 0) s.subjBacklog.push({ name: x.name, left: left, diff: num(x.difficulty) }); });
    s.subjBacklog.sort(function (p, q) { return (q.left * (1 + q.diff * 0.3)) - (p.left * (1 + p.diff * 0.3)); });
    s.backlogLeft = Math.max(subjLeft, Math.max(0, s.backlogTotal - s.backlogDone));
    s.target = d.backlogTarget || null;
    s.focusMin = d.focus ? num(d.focus.minutes) : 0; s.focusSessions = d.focus ? num(d.focus.sessions) : 0;
    s.tasks = d.tasks || []; s.openTasks = s.tasks.filter(function (t) { return !t.done; });
    s.reviews = d.reviews || []; s.words = d.words || [];
    var subs = d.localSubmissions || [];
    s.subs = subs; s.mist = [];
    try {
      if (Array.isArray(d.mistakes)) s.mist = d.mistakes.slice();
      subs.forEach(function (m) { var w = m.wrong || m.mistakes || m.wrongs; if (Array.isArray(w)) s.mist = s.mist.concat(w); });
    } catch (e) { }
    s.mistCount = s.mist.length;
    s.examDate = d.profile && d.profile.examDate ? d.profile.examDate : '';
    s.daysToExam = null;
    if (s.examDate) { var t = new Date(s.examDate + 'T00:00:00'); if (!isNaN(t)) s.daysToExam = Math.ceil((t - new Date()) / 86400000); }
    s.hours = d.profile ? num(d.profile.hours) : 0;
    s.plan = d.plan || [];
    var today = DAYS[new Date().getDay()];
    s.todayName = today; s.todayItems = [];
    try { var ti = todayPlanItems(); if (Array.isArray(ti)) s.todayItems = ti; } catch (e) { }
    if (!s.todayItems.length) { s.plan.forEach(function (p) { if (p.day === today && p.items) s.todayItems = p.items; }); }
    return s;
  }
  function firstName(s) { return s.name ? s.name.split(' ')[0] : ''; }

  /* ---------- قاعدة المعرفة (عربي أولاً) ---------- */
  var KB = [
    { id: 'tenses', k: ['tenses', 'tense', 'زمن', 'ازمنه', 'present simple', 'past simple', 'continuous', 'future'], a: '<b>الأزمنة في الإنجليزي (الأساس):</b><br>• Present Simple: عادة/حقيقة (He plays). + s مع he/she/it.<br>• Present Continuous: بيحصل دلوقتي (is playing).<br>• Past Simple: خلص في الماضي (played) - مع yesterday/ago/last.<br>• Past Continuous: كان بيحصل لما حاجة قاطعته (was playing when...).<br>• Present Perfect: حاجة ليها أثر دلوقتي (has played) - مع for/since/already/yet/just.<br>• Future: will (قرار لحظي/توقع) / going to (خطة).<br>💡 اللي بيجيب الزمن: الكلمة الدالة في الجملة. دورلها الأول.', c: ['Present Perfect بالتفصيل', 'جملة شرط', 'Passive Voice', 'نصيحة للإنجليزي'] },
    { id: 'perfect', k: ['present perfect', 'has played', 'since', 'for و since'], a: '<b>Present Perfect:</b> have/has + الفعل التالت (V3).<br>• for + مدة (for 3 years)، since + نقطة بداية (since 2020).<br>• already في الإثبات، yet في النفي والسؤال، just = لسه حالاً.<br>• مبنستخدمهوش مع زمن محدد ماضي (yesterday). نقول: I saw him yesterday مش I have seen.', c: ['الأزمنة', 'جملة شرط'] },
    { id: 'cond', k: ['شرط', 'if clause', 'conditional', 'if '], a: '<b>جمل الشرط (If):</b><br>• Type 0: If + present, present (حقيقة علمية).<br>• Type 1: If + present, will + V1 (ممكن يحصل).<br>• Type 2: If + past, would + V1 (خيال في الحاضر).<br>• Type 3: If + had + V3, would have + V3 (ندم على الماضي).<br>💡 مفيش will/would بعد if مباشرة.', c: ['الأزمنة', 'Passive Voice', 'نصيحة للإنجليزي'] },
    { id: 'passive', k: ['passive', 'مبني للمجهول', 'للمجهول'], a: '<b>Passive Voice:</b> be + V3.<br>• Present: is/are + V3. Past: was/were + V3. Future: will be + V3. Perfect: has/have been + V3.<br>الخطوات: الـ object بقى subject، حط الـ be المناسب، الفعل V3، و by + الفاعل (لو مهم).<br>مثال: Ahmed wrote the letter → The letter was written by Ahmed.', c: ['الأزمنة', 'جملة شرط'] },
    { id: 'essay', k: ['essay', 'مقال', 'موضوع تعبير', 'تعبير', 'writing', 'paragraph', 'برجراف'], a: '<b>كتابة الـ Essay/Paragraph:</b><br>1) Introduction: جملة تعرّف الموضوع ورأيك.<br>2) Body: فقرتين، كل واحدة فكرة + مثال، واربط بـ firstly / moreover / however.<br>3) Conclusion: لخّص رأيك بكلمات تانية (In conclusion...).<br>✅ قبل ما تسلّم: راجع الـ spelling والزمن والـ punctuation. الدرجات بتضيع على أخطاء بسيطة.', c: ['نصيحة للإنجليزي', 'الأزمنة'] },
    { id: 'eng', k: ['انجليزي', 'english', 'انجليزى', 'vocab', 'كلمات', 'مفردات', 'قواعد انجليزي', 'grammar'], a: '<b>خطة الإنجليزي:</b><br>• كل يوم 10 كلمات جديدة وراجع بتوع إمبارح (بطاقات المراجعة في التطبيق).<br>• حل نموذج Grammar واحد يومياً وسجّل أخطاءك.<br>• اقرا قطعة واحدة بصوت عالي وحدد الكلمات الصعبة.<br>• قبل الامتحان: راجع أخطاءك قبل أي حاجة جديدة.', c: ['الأزمنة', 'Essay', 'اختبرني في أخطائي'] },
    { id: 'nahw', k: ['نحو', 'اعراب', 'فاعل', 'مبتدا', 'خبر', 'مفعول', 'كان واخواتها', 'ان واخواتها', 'عربي', 'لغه عربيه', 'عربى'], a: '<b>النحو (قواعد سريعة):</b><br>• الفاعل مرفوع، المفعول به منصوب، المضاف إليه مجرور.<br>• المبتدأ والخبر مرفوعين. «كان وأخواتها» ترفع الاسم وتنصب الخبر، «إنّ وأخواتها» تنصب الاسم وترفع الخبر.<br>• علامات الإعراب الفرعية: المثنى بالألف/الياء، جمع المذكر السالم بالواو/الياء، جمع المؤنث السالم بالكسرة في الجر والنصب.<br>💡 اعرب 3 جمل كل يوم بصوت عالي، ده أسرع طريقة تثبّت القاعدة.', c: ['نصيحة للمراجعة', 'أذاكر إيه'] },
    { id: 'physics', k: ['فيزياء', 'فيزيا', 'physics', 'قانون نيوتن', 'سرعه', 'عجله', 'كهرباء', 'قانون اوم', 'شغل وطاقه'], a: '<b>مذاكرة الفيزياء:</b><br>• ابدأ بالقوانين: اكتب قانون وحدته ومعناه (ex: v = d/t، F = m×a، V = I×R، W = F×d).<br>• حل المسائل بخطوات: المعطيات ← المطلوب ← القانون ← التعويض بالوحدات ← الناتج.<br>• راجع الوحدات في كل خطوة (أغلب الغلط من الوحدات).<br>• كل قانون اعمله مسألتين على الأقل قبل ما تنتقل.', c: ['كيمياء', 'رياضيات', 'أذاكر إيه'] },
    { id: 'chem', k: ['كيمياء', 'chemistry', 'معادله', 'عناصر', 'مول', 'حمض', 'قاعده'], a: '<b>مذاكرة الكيمياء:</b><br>• احفظ الجدول الدوري بالمجموعات والخواص، مش العناصر بس.<br>• وازن المعادلات خطوة خطوة (عدد الذرات الأول).<br>• المول: n = الكتلة ÷ الكتلة المولية. اتدرب على 5 مسائل متنوعة.<br>• اعمل ملخص تفاعلات في ورقة واحدة وراجعها كل يومين.', c: ['فيزياء', 'أحياء', 'أذاكر إيه'] },
    { id: 'math', k: ['رياضيات', 'math', 'جبر', 'هندسه', 'تفاضل', 'تكامل', 'معادله', 'حساب مثلثات', 'مسائل'], a: '<b>الرياضيات:</b> مفيش حفظ، فيه تدريب.<br>• كل درس: افهم مثال واحد ثم حل 5 مسائل بنفسك من غير ما تبص على الحل.<br>• اكتب القوانين في كراسة صغيرة وراجعها قبل النوم.<br>• اللي بتغلط فيه، اعمله علامة وارجعله بعد يومين.<br>• متقعدش أكتر من 10 دقايق على مسألة، بص للحل وارجع حلها تاني لوحدك.', c: ['فيزياء', 'نصيحة للمراجعة', 'أذاكر إيه'] },
    { id: 'bio', k: ['احياء', 'biology', 'خليه', 'وراثه', 'جهاز', 'dna'], a: '<b>الأحياء:</b><br>• ارسم الأجهزة والدورات بإيدك بدل ما تقراها (دورة، جهاز، تركيب خلية).<br>• استخدم بطاقات سؤال/جواب للمصطلحات.<br>• اربط كل جهاز بوظيفته: «ده بيعمل إيه؟ وإيه اللي يحصل لو وقف؟»', c: ['كيمياء', 'حفظ', 'أذاكر إيه'] },
    { id: 'hist', k: ['تاريخ', 'جغرافيا', 'history', 'geography', 'دراسات', 'فلسفه', 'علم نفس'], a: '<b>المواد الحفظية (تاريخ/جغرافيا...):</b><br>• قسّم الدرس لخط زمني أو خريطة ذهنية بدل ما تقراه كأنه قصة.<br>• اسأل نفسك: مين؟ إمتى؟ ليه حصل؟ والنتيجة إيه؟<br>• راجع بعد يوم، بعد 3 أيام، بعد أسبوع (التكرار المتباعد).', c: ['حفظ', 'نصيحة للمراجعة'] },
    { id: 'memo', k: ['احفظ', 'حفظ', 'نسيان', 'انسي', 'بنسي', 'ننسي', 'memorize', 'ذاكره', 'تفتكر'], a: '<b>إزاي تحفظ وماتنساش:</b><br>1) Active Recall: اقفل الكتاب واكتب اللي فاكره. ده أقوى من التكرار بالقراءة.<br>2) التكرار المتباعد: راجع بعد يوم، 3 أيام، أسبوع، شهر. (البطاقات في التطبيق بتعملها).<br>3) اشرحها بصوت عالي كأنك بتدرّس حد (Feynman).<br>4) ربط بصور أو قصة قصيرة.<br>5) نوم 7-8 ساعات: المخ بيثبّت المعلومة وانت نايم.', c: ['خطة مراجعة', 'نصيحة للمراجعة', 'بومودورو'] },
    { id: 'pomo', k: ['بومودورو', 'pomodoro', 'تركيز', 'اركز', 'مش عارف اركز', 'شرود', 'موبايل', 'تشتت', 'مشتت'], a: '<b>تركيز أعلى (بومودورو):</b> 25 دقيقة مذاكرة + 5 راحة، وبعد 4 مرات راحة طويلة 20 دقيقة.<br>• الموبايل في أوضة تانية أو وضع الطيران (مجرد وجوده على المكتب بيقلل تركيزك).<br>• ابدأ بالمادة الأصعب وانت نشيط.<br>• في التطبيق: صفحة «التركيز» فيها مؤقت وبيسجّل جلساتك.', c: ['تأجيل المذاكرة', 'أذاكر إيه', 'حفظ'] },
    { id: 'procr', k: ['كسل', 'تاجيل', 'مش قادر ابدا', 'مفيش حماس', 'ابدا ازاي', 'اجبر نفسي', 'تسويف'], a: '<b>مش قادر تبدأ؟</b><br>• قاعدة الـ 5 دقايق: قول لنفسك «هذاكر 5 دقايق بس». الغالب هتكمّل.<br>• قسّم المهمة لحاجة صغيرة جداً (صفحة واحدة، مسألتين).<br>• جهّز المكان قبلها: كتاب وقلم وكوباية مياه.<br>• كافئ نفسك بعد الجلسة بحاجة بسيطة.<br>خطوتك الجاية: ابدأ بجلسة 25 دقيقة دلوقتي.', c: ['بومودورو', 'أذاكر إيه', 'كلمة تشجيع'] },
    { id: 'night', k: ['ليله الامتحان', 'قبل الامتحان', 'بكره امتحان', 'اخر يوم', 'امتحان بكره'], a: '<b>ليلة الامتحان:</b><br>• راجع ملخصاتك وأخطاءك بس، ماتبدأش حاجة جديدة.<br>• جهّز الأدوات (بطاقة، أقلام، مياه) من بدري.<br>• نام 7 ساعات على الأقل. السهر بيضيّع اللي ذاكرته.<br>• الصبح: فطار خفيف، وصّل بدري، وفي الورقة ابدأ بالأسهل واقرا السؤال مرتين.', c: ['قلق الامتحان', 'حفظ'] },
    { id: 'anx', k: ['قلق', 'توتر', 'خايف', 'خوف', 'رهبه', 'ضغط', 'مضغوط', 'مخنوق', 'تعبان', 'زهقت', 'زهق', 'يأس', 'يئست', 'محبط'], a: 'طبيعي تحس كده، ومعناه إنك فارق معاك. جرّب:<br>• تنفّس: شهيق 4 ثواني، حبس 4، زفير 6 (4 مرات).<br>• اكتب 3 حاجات مذاكرتها قدّام عينك. إنجازك أكبر مما تتخيل.<br>• قسّم اللي فاضل لخطوات صغيرة وابدأ بأسهل واحدة.<br>• خد راحة وامشي 10 دقايق.<br>لو الضغط تقيل أوي، اتكلم مع حد قريب منك. مش لازم تشيل لوحدك. 💚', c: ['كلمة تشجيع', 'أذاكر إيه', 'ليلة الامتحان'] },
    { id: 'sleep', k: ['نوم', 'سهر', 'نعسان', 'اصحي', 'منبه', 'ساعات النوم'], a: '<b>النوم والمذاكرة:</b><br>• 7-8 ساعات نوم. المعلومات بتتثبّت وقت النوم.<br>• مذاكرة بعد الفجر أو الصبح بدري لها تركيز عالي.<br>• قبل النوم بساعة: بعيد عن الموبايل، ومراجعة خفيفة (10 دقايق) لأهم ورقة.', c: ['بومودورو', 'أذاكر إيه'] },
    { id: 'notes', k: ['ملخص', 'تلخيص', 'خريطه ذهنيه', 'نوتس', 'اعمل ملخص'], a: '<b>تلخيص فعّال:</b><br>• اقرا الدرس، اقفل الكتاب، واكتب اللي فهمته بكلماتك (صفحة واحدة بالكتير).<br>• استخدم أسئلة بدل جمل: «إيه الفرق بين...؟» وبعدين جاوب عليها في المراجعة.<br>• ألوان قليلة: عنوان، قانون، مثال.', c: ['حفظ', 'بومودورو'] },
    { id: 'schedule', k: ['جدول', 'خطه', 'انظم', 'تنظيم', 'اعمل خطه', 'نظام مذاكره'], a: '<b>جدول مذاكرة واقعي:</b><br>• حدّد ساعاتك اليومية بصراحة (مثلاً 4 ساعات) وقسّمها لجلسات 45-60 دقيقة بينها راحة.<br>• مادة صعبة في أول الجلسات، ومادة خفيفة في الآخر.<br>• كل أسبوع يوم راحة أو نص يوم للمراجعة.<br>• تقدر تخلّي التطبيق يعملها: صفحة «تنظيم المذاكرة» ← خطة سريعة.', c: ['مهامي النهاردة', 'التراكم', 'أذاكر إيه'], act: 'planner' },
    { id: 'review', k: ['مراجعه', 'اراجع', 'مراجعه نهائيه', 'ازاي اراجع', 'نصيحه للمراجعه', 'خطه مراجعه'], a: '<b>مراجعة ذكية:</b><br>• اعمل الدور الأول: كل الملخصات بسرعة، حدّد النقاط الضعيفة.<br>• الدور التاني: ركّز على الأخطاء وحل نماذج امتحانات سابقة بوقت حقيقي.<br>• قبل الامتحان بيومين: ورقة واحدة لكل مادة وفيها القوانين والأخطاء المتكررة.', c: ['اختبرني في أخطائي', 'ليلة الامتحان', 'حفظ'], act: 'review' },
    { id: 'tip', k: ['نصيحه', 'tip', 'معلومه', 'فايده'], a: null, c: ['نصيحة', 'أذاكر إيه', 'مستواي'] },
    { id: 'motiv', k: ['تشجيع', 'حماس', 'شجعني', 'همه', 'حفزني', 'دافع', 'ملل', 'كلمه تشجيع'], a: null, c: ['أذاكر إيه', 'مستواي', 'بومودورو'] },
    { id: 'who', k: ['انت مين', 'مين انت', 'ايه اللي تعمله', 'تعمل ايه', 'مساعده', 'help', 'ايه اللي تقدر', 'تعرف ايه'], a: 'أنا المدرّس الذكي، بشتغل <b>مجاناً على جهازك</b> ومن غير إنترنت لأي خدمة مدفوعة. أقدر:<br>• أقولك تذاكر إيه دلوقتي من بياناتك (مهام، تراكم، أخطاء).<br>• أحلل مستواك ونقاطك وسلسلتك 🔥.<br>• أشرح طرق مذاكرة ومواد (إنجليزي، عربي، فيزياء، كيمياء، رياضيات، أحياء...).<br>• أحسب العد التنازلي للامتحان والنسبة المئوية والمسائل الحسابية البسيطة.', c: ['أذاكر إيه', 'مستواي', 'كام يوم على الامتحان', 'نصيحة'] },
    { id: 'thanks', k: ['شكرا', 'تسلم', 'ميرسي', 'thanks', 'thx', 'جزاك'], a: 'العفو! بالتوفيق 💪 قولي لو عايز تحدد خطوتك الجاية.', c: ['أذاكر إيه', 'مستواي'] },
    { id: 'hi', k: ['اهلا', 'ازيك', 'السلام', 'هاي', 'صباح', 'مساء', 'hello', 'hi', 'مرحبا', 'هلا', 'يا مدرس'], a: null, c: ['أذاكر إيه', 'مستواي', 'كام يوم على الامتحان', 'نصيحة'] }
  ];
  var MOTIVE = ['كل صفحة بتذاكرها النهاردة بتفرق يوم الامتحان. كمّل.', 'مش لازم تكون مثالي، لازم تكون مستمر. خطوة صغيرة النهاردة أحسن من خطة كبيرة مبتبدأش.', 'اللي بيتعب دلوقتي هيبتسم بعدين. ابدأ بجلسة 25 دقيقة.', 'التعب مؤقت، والنتيجة بتفضل. انت أقوى مما بتتخيل.'];
  var TIPS = ['نصيحة: اقفل الكتاب بعد كل صفحة واكتب اللي فاكره. ده أقوى من إعادة القراءة.', 'نصيحة: راجع أخطاءك قبل أي حاجة جديدة، هي أسرع طريقة لرفع الدرجة.', 'نصيحة: ابدأ بأصعب مادة وانت نشيط، وخلّي الخفيفة للآخر.', 'نصيحة: جلسات 25 دقيقة تركيز + 5 راحة بتخلّيك تذاكر أكتر من غير ما تتعب.', 'نصيحة: نام كفاية، المعلومات بتتثبّت وقت النوم.'];
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  /* ---------- الأسئلة المرتبطة ببياناتك ---------- */
  function ansNext(s) {
    var parts = [], chips = [];
    if (s.todayItems.length) {
      var it = s.todayItems.slice(0, 3).map(function (x) { return '• ' + esc(x.name || x.title || x) + (x.duration ? ' (' + x.duration + ' د)' : ''); }).join('<br>');
      parts.push('<b>النهاردة (' + s.todayName + ') في خطتك:</b><br>' + it);
      chips.push('افتح الخطة');
    }
    if (s.openTasks.length) {
      parts.push('عندك <b>' + s.openTasks.length + '</b> مهمة مفتوحة' + (s.openTasks[0] && (s.openTasks[0].title || s.openTasks[0].name) ? '، أولهم: «' + esc(s.openTasks[0].title || s.openTasks[0].name) + '»' : '') + '.');
    }
    if (s.mistCount) { parts.push('عندك <b>' + s.mistCount + '</b> غلطة في بنك الأخطاء. 10 دقايق فيهم النهاردة أحسن من ساعة حاجة جديدة.'); chips.push('اختبرني في أخطائي'); }
    if (s.subjBacklog.length) {
      var b = s.subjBacklog[0];
      parts.push('أكبر تراكم عندك في <b>' + esc(b.name) + '</b>: ' + b.left + ' درس. ابدأ بدرسين منها.'); chips.push('التراكم');
    }
    if (s.daysToExam !== null && s.daysToExam >= 0) parts.push('فاضل <b>' + s.daysToExam + '</b> يوم على امتحانك.');
    if (s.streak > 0) parts.push('سلسلتك 🔥 <b>' + s.streak + '</b> يوم، حافظ عليها بجلسة النهاردة.');
    if (!parts.length) parts.push('لسه مفيش بيانات كفاية. ابدأ بـ «خطة سريعة» في صفحة تنظيم المذاكرة، أو حل امتحان، وأنا هتابعك.'), chips.push('نصيحة', 'اعمل جدول');
    chips.push('بومودورو');
    return { a: parts.join('<br><br>'), c: chips };
  }
  function ansLevel(s) {
    var l = [];
    l.push('⭐ نقاطك: <b>' + s.points + '</b> (الأسبوع ده: ' + s.weekPoints + ')');
    l.push('🔥 السلسلة: <b>' + s.streak + '</b> يوم' + (s.best > s.streak ? ' (أفضل سلسلة ليك ' + s.best + ')' : ''));
    l.push('📝 امتحانات اتسلّمت: <b>' + s.exams + '</b> (الأسبوع ده: ' + s.weekExams + ')');
    if (s.focusSessions) l.push('⏱ تركيز: ' + s.focusSessions + ' جلسة، ' + s.focusMin + ' دقيقة');
    var verdict;
    if (s.exams === 0) verdict = 'لسه مسلّمتش امتحان. أول امتحان هيدّيني فكرة عن نقاط ضعفك.';
    else if (s.weekExams >= 3 || s.streak >= 5) verdict = 'مستواك في النشاط ممتاز 👏 كمّل بنفس الإيقاع.';
    else if (s.weekExams === 0) verdict = 'الأسبوع ده لسه مفيش امتحانات. حل امتحان واحد النهاردة.';
    else verdict = 'ماشي كويس. زوّد امتحان أو اتنين الأسبوع ده.';
    return { a: l.join('<br>') + '<br><br>' + verdict, c: ['أذاكر إيه', 'الأخطاء', 'التراكم'] };
  }
  function ansBacklog(s) {
    if (!s.backlogLeft) return { a: 'مفيش تراكم متسجّل عندك. حلو! لو عندك دروس متأخرة، ضيفها من صفحة «التراكم».', c: ['أذاكر إيه', 'اعمل جدول'], act: 'backlog' };
    var t = s.target, txt = 'متبقي عليك <b>' + s.backlogLeft + '</b> درس متراكم.';
    if (t && t.perDay) txt += '<br>خطتك: ' + t.perDay + ' درس في اليوم' + (t.days ? ' لمدة ' + t.days + ' يوم' : '') + '.';
    if (s.subjBacklog.length) txt += '<br>' + s.subjBacklog.slice(0, 3).map(function (x) { return '• ' + esc(x.name) + ': ' + x.left; }).join('<br>');
    return { a: txt, c: ['أذاكر إيه', 'افتح التراكم'], act: 'backlog' };
  }
  function ansMist(s) {
    if (!s.mistCount) return { a: 'بنك أخطائك فاضي حالياً. كل ما تحل امتحان بتتسجّل الأخطاء تلقائياً وتقدر تراجعها.', c: ['أذاكر إيه', 'نصيحة'], act: 'review' };
    return { a: 'عندك <b>' + s.mistCount + '</b> غلطة محفوظة. راجعها بالبطاقات (Flashcards) 10 دقايق يومياً، وهتلاقي الدرجة بتتحسن بسرعة.', c: ['افتح الأخطاء', 'أذاكر إيه'], act: 'review' };
  }
  function ansExam(s) {
    if (s.daysToExam === null) return { a: 'لسه ما حدّدتش تاريخ امتحانك. ادخل ⚙️ الإعدادات واكتب التاريخ وأنا أحسبلك العد التنازلي.', c: ['افتح الإعدادات', 'أذاكر إيه'], act: 'settings' };
    if (s.daysToExam < 0) return { a: 'تاريخ امتحانك عدّى. حدّث التاريخ من الإعدادات لو عندك امتحان جديد.', c: ['افتح الإعدادات'], act: 'settings' };
    var per = s.backlogLeft && s.daysToExam ? Math.ceil(s.backlogLeft / s.daysToExam) : 0;
    var t = 'فاضل <b>' + s.daysToExam + '</b> يوم على امتحانك (' + esc(s.examDate) + ').';
    if (per) t += '<br>عشان تخلّص تراكمك، محتاج حوالي <b>' + per + '</b> درس يومياً.';
    if (s.daysToExam <= 7) t += '<br>الأسبوع الأخير: مراجعة وأخطاء ونماذج، من غير مواد جديدة.';
    return { a: t, c: ['أذاكر إيه', 'خطة مراجعة', 'ليلة الامتحان'] };
  }
  function ansStreak(s) {
    return { a: '🔥 سلسلتك الحالية <b>' + s.streak + '</b> يوم' + (s.best ? '، وأفضل سلسلة ' + s.best : '') + '.<br>تفضل السلسلة لو ذاكرت أو سلمت امتحان النهاردة. كل يوم بيزوّد بونص النقاط.', c: ['مستواي', 'أذاكر إيه'] };
  }
  function ansPoints(s) {
    return { a: '⭐ معاك <b>' + s.points + '</b> نقطة.<br>تكسب أكتر من: تسليم امتحان (10 + بونص)، التحدي اليومي (لحد 35)، تصليح الأخطاء (+2 لكل غلطة)، والسلسلة اليومية.', c: ['مستواي', 'أذاكر إيه'] };
  }
  function ansToday(s) {
    if (!s.todayItems.length) return { a: 'مفيش مهام في خطتك النهاردة (' + s.todayName + '). تقدر تعمل خطة سريعة من صفحة «تنظيم المذاكرة»، أو ابدأ بجلسة مراجعة.', c: ['اعمل جدول', 'أذاكر إيه'], act: 'planner' };
    return { a: '<b>مهامك النهاردة:</b><br>' + s.todayItems.map(function (x, i) { return (i + 1) + '. ' + esc(x.name || x.title || x) + (x.duration ? ' - ' + x.duration + ' دقيقة' : ''); }).join('<br>'), c: ['افتح الخطة', 'بومودورو', 'أذاكر إيه'], act: 'planner' };
  }
  function ansSubjects(s) {
    if (!s.subjects.length) return { a: 'لسه مضفتش مواد. من «تنظيم المذاكرة» اعمل خطة سريعة وأضيف المادة وعدد دروسها.', c: ['اعمل جدول'] };
    return { a: '<b>موادك:</b><br>' + s.subjects.map(function (x) { var left = Math.max(0, num(x.backlog) - num(x.backlogDone)); return '• ' + esc(x.name) + (left ? ' - متبقي ' + left + ' درس' : ' - خلصت التراكم ✅'); }).join('<br>'), c: ['أذاكر إيه', 'التراكم'] };
  }
  function ansCalc(q) {
    var m = q.match(/(-?\d+(?:\.\d+)?)\s*([+\-*/x×÷])\s*(-?\d+(?:\.\d+)?)/);
    if (m && /[0-9]/.test(q)) {
      var a = parseFloat(m[1]), b = parseFloat(m[3]), o = m[2], r;
      if (o === '+') r = a + b; else if (o === '-') r = a - b; else if (o === '/' || o === '÷') r = b === 0 ? null : a / b; else r = a * b;
      if (r === null) return { a: 'مينفعش القسمة على صفر 🙂', c: ['أذاكر إيه'] };
      return { a: 'الناتج: <b>' + (Math.round(r * 10000) / 10000) + '</b>', c: ['أذاكر إيه', 'نصيحة'] };
    }
    var p = q.match(/(\d+(?:\.\d+)?)\s*(?:من|\/)\s*(\d+(?:\.\d+)?)/);
    if (p && /(نسبه|نسبتي|مئويه|كام في الميه|%|درجتي|جبت)/.test(q)) {
      var pc = parseFloat(p[2]) ? parseFloat(p[1]) / parseFloat(p[2]) * 100 : 0;
      return { a: 'نسبتك: <b>' + (Math.round(pc * 100) / 100) + '%</b>' + (pc >= 90 ? ' 🔥 ممتاز' : pc >= 75 ? ' 👍 جيد جداً' : pc >= 50 ? ' - ممكن تتحسن بمراجعة الأخطاء' : ' - محتاج خطة مراجعة جادة'), c: ['خطة مراجعة', 'أذاكر إيه'] };
    }
    return null;
  }

  /* ---------- محرك الفهم ---------- */
  var DATA_INTENTS = [
    { id: 'next', k: ['اذاكر ايه', 'اذاكر', 'ابدا بايه', 'ابدا ازاي', 'هعمل ايه', 'اعمل ايه', 'ايه اللي', 'اولويه', 'دلوقتي', 'ابدا بمين', 'توصيه', 'نصيحه ليا', 'ذاكر', 'what should'], f: ansNext },
    { id: 'level', k: ['مستواي', 'مستوايا', 'تقييم', 'تقدمي', 'انا ماشي ازاي', 'ماشي كويس', 'حلل', 'نتيجتي', 'احصائيات', 'احصاءات'], f: ansLevel },
    { id: 'backlog', k: ['تراكم', 'متراكم', 'متاخر', 'دروس متاخره', 'backlog'], f: ansBacklog },
    { id: 'mist', k: ['اخطائي', 'اخطاء', 'غلطاتي', 'غلط', 'بنك الاخطاء'], f: ansMist },
    { id: 'exam', k: ['كام يوم', 'فاضل', 'موعد الامتحان', 'عد تنازلي', 'امتي الامتحان', 'تاريخ الامتحان'], f: ansExam },
    { id: 'streak', k: ['سلسله', 'streak', 'ستريك'], f: ansStreak },
    { id: 'points', k: ['نقاطي', 'نقط', 'نقاط', 'بونص', 'points'], f: ansPoints },
    { id: 'today', k: ['النهارده', 'مهامي', 'جدول النهارده', 'خطه النهارده', 'مهام اليوم', 'مهمه'], f: ansToday },
    { id: 'subjects', k: ['موادي', 'مواد', 'مادتي'], f: ansSubjects }
  ];
  var CHIP_ACTIONS = { 'افتح الخطة': 'planner', 'افتح التراكم': 'backlog', 'افتح الأخطاء': 'review', 'افتح الإعدادات': 'settings', 'اختبرني في أخطائي': 'review' };

  var ctx = { last: null, subj: null, count: 0 };

  function score(qn, keys) {
    var sc = 0;
    keys.forEach(function (k) {
      var kn = norm(k);
      if (!kn) return;
      if (kn.indexOf(' ') > -1 || /[a-z]/.test(kn)) { if (qn.indexOf(kn) > -1) sc += 4 + kn.length / 10; }
      else {
        var words = qn.split(' ');
        for (var i = 0; i < words.length; i++) {
          var w = words[i].replace(/^(وال|بال|لل|ال|و|ب|ل|ف)/, '');
          if (words[i] === kn || w === kn || (kn.length >= 3 && (words[i].indexOf(kn) === 0 || w.indexOf(kn) === 0))) { sc += 2 + kn.length / 10; break; }
        }
      }
    });
    return sc;
  }

  function answer(q) {
    var s = snapshot(), qn = norm(q);
    ctx.count++;
    var calc = ansCalc(qn);
    if (calc) { ctx.last = 'calc'; return calc; }
    var action = CHIP_ACTIONS[q.trim()];
    if (action) { try { go(action); } catch (e) { } return { a: 'فتحتلك الصفحة. ' + pick(TIPS), c: ['أذاكر إيه', 'مستواي'] }; }
    var best = null, bs = 0;
    DATA_INTENTS.forEach(function (it) { var sc = score(qn, it.k); if (sc > bs) { bs = sc; best = { type: 'data', it: it }; } });
    KB.forEach(function (it) { var sc = score(qn, it.k); if (sc > bs) { bs = sc; best = { type: 'kb', it: it }; } });
    var follow = /^(كمان|اكتر|طيب|وبعدين|ليه|يعني|وايه|زياده|اشرح|وضح|ممكن تشرح|تفاصيل|مثال)/.test(qn);
    if (bs < 2 && follow && ctx.last && ctx.last !== 'calc') {
      var prev = KB.filter(function (x) { return x.id === ctx.last; })[0];
      if (prev && prev.a) return { a: 'تمام. ' + pick(TIPS) + '<br><br>تحب نكمل في إيه؟', c: (prev.c || []).slice(0, 3).concat(['أذاكر إيه']) };
      return { a: pick(TIPS), c: ['أذاكر إيه', 'مستواي'] };
    }
    if (!best || bs < 2) {
      ctx.last = null;
      var sug = ['أذاكر إيه', 'مستواي', 'كام يوم على الامتحان', 'الأخطاء', 'إنجليزي', 'فيزياء', 'بومودورو'];
      return { a: 'مفهمتش سؤالك أوي 🤔 جرّب تسألني عن: ' + pick(['مذاكرتك النهاردة', 'مستواك ونقاطك', 'التراكم', 'طريقة مذاكرة مادة معينة', 'التركيز والحفظ']) + '، أو اختار من الاقتراحات.', c: sug };
    }
    ctx.last = best.it.id;
    if (best.type === 'data') { var r = best.it.f(s); if (r.act) { } return r; }
    var it = best.it;
    if (it.id === 'tip') return { a: '💡 ' + pick(TIPS).replace('نصيحة: ', ''), c: it.c };
    if (it.id === 'motiv') return { a: '💚 ' + pick(MOTIVE) + (s.streak ? '<br>سلسلتك 🔥 ' + s.streak + ' يوم، اللي بيكمّل بيوصل.' : ''), c: it.c };
    if (it.id === 'hi') { var n = firstName(s); return { a: 'أهلاً' + (n ? ' يا ' + esc(n) : '') + ' 👋 أنا مدرّسك الذكي. اسألني أو اختار من الاقتراحات.', c: it.c }; }
    var rep = { a: it.a, c: it.c };
    if (ctx.count % 4 === 0) rep.a += '<br><br>' + pick(TIPS);
    return rep;
  }

  /* ---------- ربط بالمدرّس الحالي (#t2): fallback أذكى + تبويب "أكتر" ---------- */
  var EXTRA_CHIPS = ['مستواي', 'كام يوم على الامتحان', 'فيزياء', 'كيمياء', 'رياضيات', 'أحياء', 'جملة شرط', 'Passive Voice', 'كتابة Essay', 'النحو', 'تاريخ وجغرافيا', 'بومودورو', 'ملخص ذكي', 'كلمة تشجيع', 'نصيحة'];
  var ACT_LABEL = { planner: '📅 افتح الخطة', backlog: '📚 افتح التراكم', review: '🔁 افتح المراجعة', settings: '⚙️ الإعدادات' };
  function lastQuestion(row) {
    var p = row.previousElementSibling;
    while (p && !p.classList.contains('me')) p = p.previousElementSibling;
    return p ? p.textContent.trim() : '';
  }
  function upgradeRow(row) {
    if (row.getAttribute('data-t3')) return;
    var b = row.querySelector('.t2-b'); if (!b) return;
    if (b.textContent.indexOf('مش متأكد إني فهمت') === -1) return;
    row.setAttribute('data-t3', '1');
    var q = lastQuestion(row); if (!q) return;
    var r; try { r = answer(q); } catch (e) { return; }
    if (!r || r.a.indexOf('مفهمتش سؤالك') > -1) return;
    var html = r.a;
    if (r.act && ACT_LABEL[r.act]) html += '<br><button class="t2-act" data-go="' + r.act + '">' + ACT_LABEL[r.act] + '</button>';
    if (r.c && r.c.length) html += '<div class="t2-fu">' + r.c.slice(0, 4).map(function (t) { return '<button data-q="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div>';
    b.innerHTML = html;
    var lg = $('t2log'); if (lg) lg.scrollTop = lg.scrollHeight;
  }
  function scan() {
    var lg = $('t2log'); if (!lg) return;
    var rows = lg.querySelectorAll('.t2-row:not(.me)');
    if (rows.length) upgradeRow(rows[rows.length - 1]);
  }
  function addMoreTab() {
    var cats = $('t2cats'); if (!cats || $('t3more')) return;
    var b = document.createElement('button'); b.id = 't3more'; b.type = 'button'; b.textContent = '✨ أكتر';
    cats.appendChild(b);
    b.addEventListener('click', function (e) {
      e.stopImmediatePropagation(); e.preventDefault();
      cats.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      var ch = $('t2chips'); if (!ch) return;
      ch.innerHTML = '';
      EXTRA_CHIPS.forEach(function (t) {
        var c = document.createElement('button'); c.type = 'button'; c.textContent = t;
        c.addEventListener('click', function (ev) { ev.stopImmediatePropagation(); if (typeof tutor2Ask === 'function') tutor2Ask(t); else { var i = $('t2inp'); if (i) { i.value = t; var s = $('t2send'); s && s.click(); } } });
        ch.appendChild(c);
      });
    });
    cats.addEventListener('click', function (e) { if (e.target !== b && e.target.tagName === 'BUTTON') b.classList.remove('on'); }, true);
  }
  function init() {
    var lg = $('t2log'); if (!lg) return false;
    addMoreTab();
    new MutationObserver(function () { setTimeout(scan, 30); }).observe(lg, { childList: true, subtree: true, characterData: true });
    var inp = $('t2inp'); if (inp && !inp.getAttribute('data-t3')) { inp.setAttribute('data-t3', '1'); }
    return true;
  }
  window.tutor3Build = BUILD; window.tutor3Answer = answer;
  var tries = 0, iv = setInterval(function () { if (init() || ++tries > 60) clearInterval(iv); }, 500);
})();
