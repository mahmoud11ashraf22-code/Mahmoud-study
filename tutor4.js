/* المدرّس الذكي 4 - كويز ذكي (مراجعة متباعدة للأخطاء) + تقرير أسبوعي. مجاني وعلى الجهاز */
(function () {
  'use strict';
  var BUILD = 3;
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
  var QX2 = [["كيمياء", "عدد التأكسد للأكسجين في معظم مركباته:", ["-2", "+2", "0"], 0, "الأكسجين غالبًا -2 (ما عدا فوق الأكاسيد)."], ["كيمياء", "الحمض القوي من التالي:", ["HCl", "CH3COOH", "H2CO3"], 0, "HCl يتأين كليًا فهو قوي."], ["كيمياء", "الكتلة المولية لـ H2O (H=1, O=16):", ["18", "16", "20"], 0, "2×1 + 16 = 18 g/mol."], ["كيمياء", "العنصر الأكثر سالبية كهربية:", ["الفلور", "الأكسجين", "الصوديوم"], 0, "الفلور أعلى سالبية كهربية في الجدول."], ["كيمياء", "التفاعل الذي يمتص حرارة يسمى:", ["ماص للحرارة", "طارد للحرارة", "تعادل"], 0, "ماص للحرارة: ΔH موجبة."], ["كيمياء", "الغازات النبيلة تتميز بأن مستواها الأخير:", ["مكتمل", "نصف ممتلئ", "فارغ"], 0, "مستواها الأخير مكتمل فهي خاملة."], ["كيمياء", "المحلول الذي pH له = 3 يكون:", ["حمضي", "قاعدي", "متعادل"], 0, "أقل من 7 = حمضي."], ["رياضيات", "قيمة log₁₀ 1000:", ["3", "2", "10"], 0, "10³ = 1000 فـ log = 3."], ["رياضيات", "حل المعادلة x² = 49:", ["x = ±7", "x = 7 فقط", "x = 24.5"], 0, "الجذر التربيعي موجب وسالب."], ["رياضيات", "مشتقة e^x:", ["e^x", "x e^(x-1)", "1"], 0, "e^x تساوي نفسها."], ["رياضيات", "تكامل cos x dx:", ["sin x + c", "−sin x + c", "cos x + c"], 0, "مشتقة sin x هي cos x."], ["رياضيات", "ميل الخط المار بـ (0,0) و (2,6):", ["3", "2", "6"], 0, "(6−0)/(2−0) = 3."], ["رياضيات", "عدد الطرق لترتيب 3 أشخاص في صف:", ["6", "3", "9"], 0, "3! = 6."], ["رياضيات", "قيمة cos 60°:", ["1/2", "√3/2", "0"], 0, "cos 60° = 0.5."], ["أحياء", "الهرمون المسؤول عن خفض سكر الدم:", ["الإنسولين", "الجلوكاجون", "الأدرينالين"], 0, "الإنسولين يخفض السكر."], ["أحياء", "الجزء الذي يتحكم في الخلية وفيه DNA:", ["النواة", "الفجوة", "الجدار"], 0, "النواة مركز التحكم."], ["أحياء", "نواتج التنفس الخلوي الهوائي:", ["CO2 + H2O + طاقة", "O2 + سكر", "ماء فقط"], 0, "يستهلك O2 والجلوكوز وينتج CO2 وماء وATP."], ["أحياء", "الخلايا المسؤولة عن نقل الأكسجين في الدم:", ["كرات الدم الحمراء", "الصفائح", "البيضاء"], 0, "الهيموجلوبين في الحمراء."], ["أحياء", "الجين هو جزء من:", ["DNA", "ATP", "البروتين الدهني"], 0, "الجين تتابع من DNA يحمل صفة."], ["فيزياء", "وحدة الجهد الكهربي:", ["الفولت", "الأمبير", "الأوم"], 0, "الجهد بالفولت."], ["فيزياء", "سرعة الضوء تقريبًا:", ["3×10⁸ m/s", "3×10⁶ m/s", "340 m/s"], 0, "c ≈ 3×10⁸ m/s."], ["فيزياء", "الشغل = :", ["القوة × الإزاحة", " القوة ÷ الإزاحة", "الكتلة × السرعة"], 0, "W = F × d بالجول."], ["فيزياء", "عند زيادة السرعة للضعف تصبح الطاقة الحركية:", ["4 أمثال", "ضعف", "نصف"], 0, "KE تتناسب مع v²."], ["فيزياء", "مقاومتان 6 و 3 أوم على التوازي، المقاومة الكلية:", ["2", "9", "4.5"], 0, "(6×3)/(6+3) = 2 أوم."], ["إنجليزي", "He suggested ___ to the cinema.", ["going", "to go", "go"], 0, "suggest + V-ing."], ["إنجليزي", "She is interested ___ music.", ["in", "on", "at"], 0, "interested in."], ["إنجليزي", "By next year, I ___ my studies.", ["will have finished", "finish", "finished"], 0, "Future perfect: will have + V3."], ["إنجليزي", "The man ___ lives next door is a doctor.", ["who", "which", "whose"], 0, "who للعاقل كفاعل."], ["إنجليزي", "I wish I ___ more time.", ["had", "have", "will have"], 0, "wish + past للتمني في الحاضر."], ["إنجليزي", "You ___ smoke here. It is forbidden.", ["mustn't", "don't have to", "needn't"], 0, "mustn't = ممنوع."], ["إنجليزي", "Choose the synonym of \"huge\":", ["enormous", "tiny", "narrow"], 0, "huge = enormous (ضخم)."], ["إنجليزي", "He is the ___ student in the class.", ["most intelligent", "more intelligent", "intelligenter"], 0, "صفة طويلة: the most + adj."], ["عربي", "ما إعراب «الطالبُ» في «نجح الطالبُ»؟", ["فاعل مرفوع", "مفعول به", "مبتدأ"], 0, "الاسم بعد الفعل اللازم فاعل مرفوع."], ["عربي", "المثنى يُرفع بـ:", ["الألف", "الواو", "الضمة"], 0, "المثنى يرفع بالألف."], ["عربي", "«كأن» من أخوات:", ["إن", "كان", "ظن"], 0, "إن وأخواتها: إن، أن، كأن، لكن، ليت، لعل."], ["عربي", "مرادف كلمة «يشجع»:", ["يحفّز", "يمنع", "يهمل"], 0, "يشجع = يحفّز."], ["عربي", "الجملة «ما أجمل السماء!» أسلوبها:", ["تعجب", "استفهام", "نهي"], 0, "ما أفعله: تعجب."], ["عربي", "همزة «سأل» تكتب على:", ["ألف", "واو", "ياء"], 0, "همزة ساكنة بعد فتح تكتب على ألف."], ["شبكات", "المنفذ الافتراضي لبروتوكول HTTPS:", ["443", "80", "21"], 0, "HTTPS على المنفذ 443 وHTTP على 80."], ["شبكات", "كلمة المرور القوية تحتوي على:", ["حروف وأرقام ورموز وطول كافٍ", "اسمك فقط", "تاريخ ميلادك"], 0, "التنوع والطول يصعبان التخمين."], ["شبكات", "هجوم التصيد (Phishing) يعتمد على:", ["خداع المستخدم برسالة أو رابط مزيف", "كسر التشفير مباشرة", "قطع الكهرباء"], 0, "ينتحل جهة موثوقة ليسرق البيانات."], ["شبكات", "أفضل حماية ضد فقد البيانات:", ["نسخ احتياطي منتظم", "حذف الملفات", "عدم استخدام الحاسب"], 0, "النسخ الاحتياطي يمكّن من الاستعادة."]];
  var QX = [["كيمياء", "عدد أفوجادرو يساوي تقريبًا:", ["6.02×10²³", "3×10⁸", "9.8"], 0, "المول الواحد يحتوي 6.02×10²³ جسيم."], ["كيمياء", "الرقم الهيدروجيني (pH) للمحلول المتعادل:", ["0", "7", "14"], 1, "pH = 7 متعادل، أقل حمضي، أكثر قاعدي."], ["كيمياء", "الرابطة بين الصوديوم والكلور في NaCl:", ["أيونية", "تساهمية", "فلزية"], 0, "انتقال إلكترون من فلز إلى لافلز = أيونية."], ["كيمياء", "العدد الذري يمثل عدد:", ["النيوترونات", "البروتونات", "الكتلة"], 1, "العدد الذري = عدد البروتونات."], ["كيمياء", "الغاز الناتج من تفاعل حمض مع فلز نشط:", ["الأكسجين", "الهيدروجين", "ثاني أكسيد الكربون"], 1, "حمض + فلز = ملح + هيدروجين."], ["كيمياء", "عناصر المجموعة الأولى (القلويات) تفقد:", ["إلكترونًا واحدًا", "إلكترونين", "تكتسب إلكترونًا"], 0, "لها إلكترون تكافؤ واحد فتفقده وتكوّن أيونًا موجبًا."], ["كيمياء", "الصيغة العامة للألكينات:", ["CnH2n+2", "CnH2n", "CnH2n-2"], 1, "ألكين فيه رابطة ثنائية: CnH2n."], ["كيمياء", "الحجم المولي للغاز في STP:", ["22.4 لتر", "24 لتر", "11.2 لتر"], 0, "المول من أي غاز = 22.4 لتر في الظروف القياسية."], ["رياضيات", "مشتقة sin x:", ["cos x", "−cos x", "−sin x"], 0, "d/dx sin x = cos x."], ["رياضيات", "تكامل 2x dx:", ["x² + c", "2x² + c", "x + c"], 0, "∫2x dx = x² + c."], ["رياضيات", "حل المعادلة 2x + 6 = 14:", ["x = 4", "x = 10", "x = 8"], 0, "2x = 8 فـ x = 4."], ["رياضيات", "قيمة sin 30°:", ["1/2", "√3/2", "1"], 0, "sin 30° = 0.5."], ["رياضيات", "مجموع زوايا المثلث:", ["90°", "180°", "360°"], 1, "مجموع زوايا أي مثلث = 180°."], ["رياضيات", "المتوسط الحسابي للأعداد 2, 4, 6, 8:", ["5", "4", "6"], 0, "مجموعها 20 ÷ 4 = 5."], ["رياضيات", "نظرية فيثاغورث في مثلث قائم:", ["a²+b²=c²", "a+b=c", "a²−b²=c²"], 0, "مربع الوتر = مجموع مربعي الضلعين."], ["رياضيات", "مشتقة ثابت مثل 5:", ["5", "0", "1"], 1, "مشتقة الثابت = صفر."], ["أحياء", "العضية المسؤولة عن إنتاج الطاقة في الخلية:", ["الميتوكوندريا", "النواة", "الريبوسوم"], 0, "الميتوكوندريا = محطة الطاقة (ATP)."], ["أحياء", "التمثيل الضوئي يحدث في:", ["الميتوكوندريا", "البلاستيدات الخضراء", "الفجوة"], 1, "البلاستيدات الخضراء تحتوي الكلوروفيل."], ["أحياء", "الإنزيمات في الغالب مادتها:", ["بروتينية", "دهنية", "نشوية"], 0, "معظم الإنزيمات بروتينات."], ["أحياء", "عدد الكروموسومات في الخلية الجسدية للإنسان:", ["23", "46", "92"], 1, "46 كروموسوم (23 زوج)."], ["أحياء", "الانقسام الميتوزي ينتج:", ["خليتين متماثلتين", "4 خلايا", "خلية واحدة"], 0, "ميتوزي = خليتان متطابقتان وراثيًا."], ["فيزياء", "عجلة الجاذبية الأرضية تقريبًا:", ["9.8 m/s²", "98 m/s²", "0.98 m/s²"], 0, "g ≈ 9.8 m/s²."], ["فيزياء", "القانون الثاني لنيوتن:", ["F = ma", "F = mv", "F = m/a"], 0, "القوة = الكتلة × العجلة."], ["فيزياء", "الطاقة الحركية تساوي:", ["½mv²", "mgh", "mv"], 0, "KE = ½ m v²."], ["فيزياء", "وحدة الطاقة:", ["الجول", "النيوتن", "الواط"], 0, "الطاقة والشغل بالجول."], ["إنجليزي", "She ___ here since 2019.", ["lives", "has lived", "lived"], 1, "since مع Present Perfect: has lived."], ["إنجليزي", "If I ___ rich, I would travel the world.", ["am", "were", "will be"], 1, "Type 2: If + past (were), would + V1."], ["إنجليزي", "The book ___ by millions of people.", ["has read", "has been read", "is reading"], 1, "Passive: has been + V3."], ["إنجليزي", "He is ___ than his brother.", ["tall", "taller", "tallest"], 1, "than تعني مقارنة: taller."], ["إنجليزي", "She asked me where I ___.", ["live", "lived", "am living"], 1, "Reported speech: ترجع خطوة للماضي (lived)."], ["إنجليزي", "I look forward ___ you.", ["to see", "to seeing", "seeing"], 1, "look forward to + V-ing."], ["إنجليزي", "Neither Ali nor his friends ___ late.", ["was", "were", "is"], 1, "الفعل يتبع الاسم الأقرب (friends): were."], ["إنجليزي", "He stopped ___ because he was tired.", ["to run", "running", "run"], 1, "stop + V-ing = توقف عن الفعل."], ["عربي", "المبتدأ والخبر حكمهما:", ["الرفع", "النصب", "الجر"], 0, "المبتدأ والخبر مرفوعان."], ["عربي", "كان وأخواتها ترفع الاسم وتنصب:", ["الخبر", "المبتدأ", "الفاعل"], 0, "كان ترفع الاسم (اسمها) وتنصب الخبر."], ["عربي", "جمع كلمة «كتاب»:", ["كتب", "كتّاب", "كاتبون"], 0, "جمع تكسير: كتب."], ["عربي", "ضد كلمة «كرم»:", ["بخل", "شجاعة", "صبر"], 0, "ضد الكرم البخل."], ["عربي", "علامة نصب جمع المؤنث السالم:", ["الفتحة", "الكسرة", "الياء"], 1, "ينصب بالكسرة نيابة عن الفتحة."], ["عربي", "المفعول المطلق في «ضربتُ ضربًا»:", ["ضربتُ", "ضربًا", "لا يوجد"], 1, "مصدر منصوب يؤكد الفعل."], ["عام", "أفضل وقت لمراجعة المعلومة بعد أول مرة للتثبيت:", ["بعد يوم تقريبًا", "بعد شهر", "لا حاجة لمراجعتها"], 0, "المراجعة المتباعدة تبدأ بعد يوم ثم تتباعد."], ["عام", "الأفضل في أيام الامتحانات:", ["نوم كافٍ ومراجعة خفيفة", "سهر كامل", "عدم الأكل"], 0, "النوم يثبّت الذاكرة."]];
  var EXP = ["الكمية المتجهة لها مقدار واتجاه، والإزاحة كذلك. الزمن والكتلة والمسافة قياسية.", "السرعة النسبية في نفس الاتجاه = الفرق: 20 − 12 = 8 m/s شرقًا.", "لا توجد قوة أفقية (بإهمال الهواء) فالعجلة الأفقية صفر والسرعة الأفقية ثابتة.", "الجاذبية هي القوة الوحيدة فالعجلة الرأسية = g لأسفل بغض النظر عن السرعة الأفقية.", "عند أعلى نقطة يتوقف الصعود لحظيًا فتصبح المركبة الرأسية صفرًا وتبقى الأفقية.", "المدى = v² sin2θ / g وأكبر قيمة عند sin2θ = 1 أي θ = 45°.", "العزم = القوة × ذراع القوة العمودي، فهو يعتمد على الاثنين معًا.", "العزم = N × m فوحدته N.m (لا تخلطها مع الجول رغم تشابه الأبعاد).", "الاتزان الانتقالي يعني أن محصلة القوى = صفر.", "العزم = F × d = 10 × 0.5 = 5 N.m.", "القدرة = الشغل ÷ الزمن (معدل بذل الشغل) وتقاس بالواط.", "نفس الشغل في زمن أقل = قدرة أكبر لأن القدرة = W/t.", "الكفاءة = الشغل الناتج ÷ الشغل المبذول (غالبًا × 100).", "كمية التحرك p = m × v، وهي كمية متجهة.", "الدفع = F × t = التغير في كمية التحرك (نظرية الدفع).", "في نظام معزول (لا قوى خارجية) كمية التحرك الكلية قبل = بعد، أي ثابتة.", "التصادم المرن تحفظ فيه كمية الحركة والطاقة الحركية معًا. غير المرن تحفظ كمية الحركة فقط.", "العجلة المركزية دائمًا نحو المركز، والسرعة هي المماسية.", "Fc = mv²/r فالقوة تتناسب مع مربع السرعة. السرعة ×2 يعني القوة ×4.", "قانون كبلر الثالث: T² ∝ r³ (مربع الزمن الدوري يتناسب مع مكعب نصف المحور الأكبر).", "well-being تعني الصحة والراحة العامة وتناسب exercise.", "sedentary = قليل الحركة، ويناسب من يجلس طوال اليوم.", "unrealistic expectations = توقعات غير واقعية، عبارة شائعة مع السوشيال ميديا.", "enjoy + V-ing (enjoy drawing). enjoy لا تأتي مع to.", "decide + to + V1 (decided to join).", "engagement = التفاعل والانخراط وهو الأثر الإيجابي للأنشطة الإبداعية.", "cultural identity = الهوية الثقافية.", "نقول written on the walls لأن الكتابة تكون على سطح الشيء.", "located in + مدينة (in Luxor).", "during + فترة زمنية (during the holiday).", "everyone's life = حياة الجميع. الباقي لا يناسب المعنى.", "confidence = الثقة بالنفس، والسوشيال ميديا قد تؤثر عليها.", "يفهمون identity أي هويتهم من خلال المتاحف.", "reduce stress = يقلل التوتر. أما damage وwaste فمعناها غير مناسب.", "negative effect on = تأثير سلبي على (effect اسم، وaffect فعل).", "expressive = معبّر، وهو سبب حب الفنون الإبداعية.", "stay fit = يحافظ على لياقته.", "historical site = موقع تاريخي.", "preserve = يحفظ ويصون، وهو دور المتاحف.", "viral = ينتشر بسرعة ويشاركه الملايين.", "evidence = دليل، فالمؤرخون يستخدمون الوثائق كأدلة.", "جملة شرط Type 1: If + present simple, will + V1. إذن manage.", "Although ... , we enjoyed it جملة ماضية فنستخدم الماضي البسيط.", "الأجهزة الطرفية هي أجهزة المستخدمين النهائية مثل الحاسب المحمول.", "مراحل الاستجابة للحوادث: التحضير، الاكتشاف، الاحتواء، إزالة التهديد، الاستعادة، الدروس المستفادة = 6.", "استعادة الملفات من نسخة احتياطية وإعادة تشغيل الخدمة هي مرحلة الاستعادة.", "الاتصال الآمن في HTTPS يبدأ بمصافحة TLS (TLS Handshake).", "تحليل السبب وتوثيق الحادث وتحسين الضوابط = الدروس المستفادة والتحسين.", "قاعدة البيانات الداخلية لا يجب أن تكون مكشوفة للإنترنت، فيُمنع الوصول الخارجي المباشر لها.", "كتابة الإجراءات وتحديد الأدوار قبل أي حادث هي مرحلة التحضير.", "المفتاح الخاص يبقى مع الخادم فقط. المفتاح العام والشهادة يُرسلان.", "المصافحة: المتصفح يتحقق من الخادم ويتفقان على مفتاح مشترك قبل نقل البيانات.", "جدار الحماية يتحكم في السماح أو المنع عند حدود الشبكة وفق قواعد.", "الترتيب الصحيح: الاحتواء ثم إزالة التهديد ثم الاستعادة.", "الموارد محدودة ولا يمكن معالجة كل المخاطر معًا، فنبدأ بالأخطر.", "كلمة المرور (شيء تعرفه) + رمز SMS (شيء تملكه) = مصادقة بعاملين مختلفين.", "في بداية الاتصال يرسل الخادم الشهادة الرقمية والمفتاح العام.", "ملاحظة نشاط غير معتاد والتأكد من الاختراق هي مرحلة الاكتشاف.", "بعد الاكتشاف تأتي مرحلة الاحتواء لمنع انتشار الضرر.", "VPN تنشئ نفقًا مشفرًا عبر الإنترنت للاتصال الآمن عن بعد.", "مكافحة الفيروسات وتحديث النظام تحمي الأجهزة الطرفية.", "VPN تحمي الاتصال من التنصت على شبكات Wi-Fi العامة.", "حسب مفتاح الإجابة: التنصت هو الخطر الذي تعالجه الـ VPN بالتشفير. أما بطء الإنترنت والإعلانات والبطارية فلا علاقة للـ VPN بها.", "«إن» تنصب الاسم، و«أباك» من الأسماء الخمسة فتنصب بالألف.", "مساجد على صيغة منتهى الجموع (مفاعل) فهي ممنوعة من الصرف.", "الأسماء الخمسة تُجرّ بالياء بشرط أن تكون مفردة ومضافة لغير ياء المتكلم.", "العَلَم هو الاسم الذي يدل على معيّن، وهنا «خالدًا».", "«مسرورًا» تبيّن هيئة الفاعل وقت الفعل، فهي حال منصوبة.", "«رغبةً» تبيّن سبب القراءة فهي مفعول لأجله (لماذا قرأت؟ رغبةً).", "«من» اسم شرط جازم يجزم فعلين: يجتهدْ ينجحْ.", "النعت يأتي بعد المنعوت ويصفه: «كتابًا مفيدًا».", "تشبيه بليغ لأنه حُذفت الأداة ووجه الشبه: العلم (مشبه) نور (مشبه به).", "يضحك مقابل يبكي، والنهار مقابل الليل، فهذا طباق (ذكر الشيء وضده).", "نظيف اليد كناية عن الأمانة والعفة.", "الاستفهام هنا ليس لطلب إجابة بل لتقرير حقيقة (أن العلم أساس التقدم).", "الفكرة الرئيسة تُستخلص من العنوان وتماسك أفكار النص كله.", "نستنتج المعنى من السياق: الجملة والأفكار المحيطة بالكلمة.", "الفقرة الحجاجية الجيدة تعرض رأيًا مدعومًا بأدلة وشواهد.", "الاستشهاد يدعم الفكرة ويقوّي الإقناع.", "عناصر القصة: الشخصيات والأحداث والزمان والمكان.", "تحليل الشخصية يعتمد على أقوالها وأفعالها ودوافعها.", "«الخلق جوهر الفضيلة» يدعو للتمسك بالأخلاق.", "المقال النقدي يحلل العمل ويبدي الرأي مع التعليل.", "arrange + to + V1 (arranged to travel).", "deny + V-ing (denied stealing).", "finish + V-ing (finished doing).", "promise + to + V1.", "would love + to + V1.", "refuse + to + V1.", "avoid + V-ing، والمبني للمجهول: being + V3 (avoid being met).", "admit + V-ing (admitted killing)."];
  var EXAMS = [['physics', 'فيزياء 2027'], ['english2027', 'إنجليزي 2027'], ['november', 'إنجليزي نوفمبر'], ['grammar', 'جرامر'], ['arabic', 'عربي بكالوريا'], ['networks', 'الشبكات']];
  var SUBJ = ['إنجليزي', 'عربي', 'فيزياء', 'كيمياء', 'رياضيات', 'أحياء', 'شبكات', 'عام'];
  var EB = [];
  try { fetch('qbank.json?v=1').then(function (r) { return r.json(); }).then(function (a) { if (Array.isArray(a)) EB = a; }).catch(function () { }); } catch (e) { }

  function allItems() {
    var out = QB.map(function (x) { return { s: x[0], q: x[1], o: x[2], a: x[3], n: x[4], src: '' }; });
    QX2.forEach(function (x) { out.push({ s: x[0], q: x[1], o: x[2], a: x[3], n: x[4], src: '' }); });
    QX.forEach(function (x) { out.push({ s: x[0], q: x[1], o: x[2], a: x[3], n: x[4], src: '' }); });
    EB.forEach(function (x, i) { out.push({ s: x.s, q: x.q, o: x.o, a: x.a, n: EXP[i] || '', src: x.t, e: x.e }); });
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
    h += '<br>' + goalLine();
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
    if (ok) { quiz.ok++; msg = '✅ صح! ' + esc(x.n) + (x.src ? '<br><small>📘 من امتحان: ' + esc(x.src) + '</small>' : ''); }
    else { quiz.wrong.push(x.s); msg = '❌ غلط. الإجابة الصح: <b>' + esc(x.o[x.a]) + '</b><br>💡 ' + esc(x.n) + (x.src ? '<br><small>📘 من امتحان: ' + esc(x.src) + '</small>' : ''); }
    quiz.i++;
    if (quiz.i >= quiz.q.length) return msg + '<br><br>' + finish();
    return msg + '<br><br>' + ask();
  }

  /* ---------- دفتر الأخطاء + ملخص المادة ---------- */
  function notebook() {
    var w = weakStore(), ks = Object.keys(w);
    if (!ks.length) return '📓 دفتر أخطائك فاضي، ممتاز! أي سؤال تغلط فيه هيتسجل هنا مع الإجابة الصح والشرح.' + fu(['كويز ذكي']);
    var h = '📓 <b>دفتر أخطائك (' + ks.length + ')</b><br>';
    ks.slice(0, 8).forEach(function (k, i) { var e = w[k].it; h += '<br><b>' + (i + 1) + '.</b> <span dir="auto">' + esc(e.q) + '</span><br>✅ <b>' + esc(e.o[e.a]) + '</b>' + (e.n ? '<br>💡 ' + esc(e.n) : '') + '<br>'; });
    if (ks.length > 8) h += '<br>... و ' + (ks.length - 8) + ' كمان.';
    return h + fu(['راجع أخطائي في الكويز', 'كويز ذكي']);
  }
  function summary(q) {
    var n = norm(q), subj = null; SUBJ.forEach(function (s) { if (n.indexOf(norm(s)) > -1) subj = s; });
    if (!subj) return 'ملخص أنهي مادة؟' + fu(SUBJ.filter(function (s) { return s !== 'عام'; }).map(function (s) { return 'ملخص ' + s; }));
    var items = allItems().filter(function (x) { return x.s === subj && x.n; }).sort(function () { return Math.random() - 0.5; }).slice(0, 7);
    if (!items.length) return 'مفيش ملخص للمادة دي لسه.' + fu(['كويز ذكي']);
    return '📝 <b>نقاط سريعة في ' + esc(subj) + '</b> (من الأسئلة):<br>' + items.map(function (x) { return '• <span dir="auto">' + esc(x.n) + '</span>'; }).join('<br>') + fu(['اختبرني في ' + subj, 'ملخص ' + subj]);
  }

  /* ---------- هدف اليوم ---------- */
  var GOAL = 10;
  function todayCount() { var lg = jget('t4_log', []), l = lg[lg.length - 1]; return l && l.d === dayStr() ? l.tot : 0; }
  function goalLine() { var c = todayCount(); return c >= GOAL ? '🎖️ هدف النهارده (' + GOAL + ' أسئلة) اتحقق! (' + c + ')' : '🎯 هدف النهارده: ' + c + '/' + GOAL + ' سؤال'; }

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
    h += goalLine() + '<br>';
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
    if (/^(دفتر اخطا|دفتر الاخطا|اخطايي المحفوظه)/.test(n)) return notebook();
    if (/^(ملخص|لخص)/.test(n)) return summary(q);
    if (/^كويز ذكي/.test(n) || QRE.test(n)) return start(q);
    return null;
  }
  function handle(q) {
    var r = route(q); if (r == null) return false;
    addRow(q, true); setTimeout(function () { addRow(r, false); }, 300); return true;
  }
  function would(q) { var n = norm(q); return !!quiz || /^(دفتر اخطا|دفتر الاخطا|اخطايي المحفوظه|ملخص|لخص)/.test(n) || RRE.test(n) || /^كويز ذكي/.test(n) || QRE.test(n); }
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
      var box = document.createElement('div'); box.id = 't4big'; box.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin:6px 12px';
      [['🎯 كويز ذكي', 'كويز ذكي'], ['🔁 راجع أخطائي', 'راجع أخطائي في الكويز'], ['📓 دفتر أخطائي', 'دفتر أخطائي'], ['📝 ملخص', 'ملخص'], ['📊 تقريري', 'تقريري']].forEach(function (p) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = p[0]; b.setAttribute('data-q', p[1]);
        b.style.cssText = 'flex:1 1 30%;padding:10px 4px;font-size:13px;border:0;border-radius:12px;font:inherit;font-weight:800;color:#fff;background:linear-gradient(135deg,#5b6cf0,#3a45b8);cursor:pointer';
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
