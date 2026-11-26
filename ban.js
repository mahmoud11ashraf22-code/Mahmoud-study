/* MAHMOUD STUDY - student ban feature (admin ban panel + login block) */
(function () {
  'use strict';
  var CONTACT = '01558288143';
  var state = { bans: {}, students: [], loaded: false, q: '' };

  function fb() { return self.__cl; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function say(msg) {
    try { if (typeof toast === 'function') return toast(msg); } catch (e) {}
    alert(msg);
  }
  function ready() {
    try { return fb() && fb().apps && fb().apps.length && fb().auth && fb().firestore; } catch (e) { return false; }
  }

  /* ---------- enforcement: block banned students ---------- */
  var banUnsub = null, watchedUid = null;

  function showBanScreen(info) {
    var o = document.getElementById('msBanOverlay');
    if (!o) {
      o = document.createElement('div');
      o.id = 'msBanOverlay';
      o.setAttribute('dir', 'rtl');
      o.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:#0b1410;color:#fff;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-family:inherit';
      document.body.appendChild(o);
    }
    var reason = info && info.reason ? '<p style="margin:10px 0;color:#ffd0d0">السبب: ' + esc(info.reason) + '</p>' : '';
    o.innerHTML = '<div style="max-width:420px;border:1px solid #7a2b2b;background:#1a0f0f;border-radius:18px;padding:26px">' +
      '<div style="font-size:54px">🚫</div>' +
      '<h2 style="margin:10px 0;color:#fff">تم حظر حسابك</h2>' +
      '<p style="line-height:1.8;margin:8px 0">تم إيقاف حسابك من منصة MAHMOUD STUDY ولا يمكنك استخدام التطبيق.</p>' + reason +
      '<p style="line-height:1.8;margin:8px 0;color:#cfd8d3">لو شايف إن ده حصل بالغلط، تواصل مع الإدارة على واتساب:</p>' +
      '<a href="https://wa.me/2' + CONTACT + '" style="display:inline-block;margin-top:8px;padding:12px 22px;border-radius:12px;background:#1fc07f;color:#04150e;font-weight:700;text-decoration:none">' + CONTACT + '</a>' +
      '<div><button id="msBanClose" style="margin-top:16px;background:none;border:0;color:#9fb3a8;text-decoration:underline;font-size:14px;cursor:pointer">إغلاق</button></div></div>';
    o.style.display = 'flex';
    var b = document.getElementById('msBanClose');
    if (b) b.onclick = function () { o.style.display = 'none'; };
  }

  function enforce(info) {
    showBanScreen(info);
    try { fb().auth().signOut(); } catch (e) {}
  }

  function watchUser(u) {
    if (banUnsub) { try { banUnsub(); } catch (e) {} banUnsub = null; }
    watchedUid = null;
    if (!u) return;
    watchedUid = u.uid;
    try {
      banUnsub = fb().firestore().collection('bans').doc(u.uid).onSnapshot(function (snap) {
        if (snap.exists && (snap.data() || {}).banned !== false) enforce(snap.data());
      }, function () { /* offline or rules error: do not block */ });
    } catch (e) {}
  }

  function startEnforcement() {
    var tries = 0;
    (function wait() {
      if (ready()) {
        try { fb().auth().onAuthStateChanged(watchUser); } catch (e) {}
        return;
      }
      if (++tries < 120) setTimeout(wait, 500);
    })();
  }

  /* ---------- admin panel ---------- */
  function isAdminNow() {
    try { return !!adminUnlocked; } catch (e) { return false; }
  }
  function isAdminId(uid) {
    try { return typeof isAdminUid === 'function' && isAdminUid(uid); } catch (e) { return false; }
  }

  function card() {
    var c = document.getElementById('msBanCard');
    if (c) return c;
    var admin = document.getElementById('admin');
    if (!admin) return null;
    c = document.createElement('div');
    c.className = 'card';
    c.id = 'msBanCard';
    c.innerHTML =
      '<div class="row"><h2>🚫 حظر الطلبة</h2><button class="btn ghost small" id="msBanReload">تحميل / تحديث</button></div>' +
      '<p class="smallnote">الطالب المحظور لا يستطيع استخدام التطبيق ويظهر له رسالة حظر عند تسجيل الدخول. تقدر تفك الحظر في أي وقت. القائمة تعرض الطلبة اللي دخلوا المسابقات (لوحة الشرف) ويمكنك حظر أي حساب بالـ UID.</p>' +
      '<div class="row"><span class="muted" id="msBanStatus">لم يتم التحميل</span><span class="tag" id="msBanCount">0 محظور</span></div>' +
      '<div id="msBanList" class="empty"></div>' +
      '<label>بحث عن طالب بالاسم</label><input id="msBanSearch" placeholder="اكتب جزء من الاسم...">' +
      '<div id="msStudentList" class="empty">اضغط تحميل / تحديث لعرض الطلبة.</div>' +
      '<label>حظر بالـ UID (لو الطالب مش ظاهر فوق)</label>' +
      '<input id="msBanUid" placeholder="UID الطالب" dir="ltr"><input id="msBanName" placeholder="اسم الطالب (اختياري)"><input id="msBanReason" placeholder="سبب الحظر (اختياري)">' +
      '<button class="btn full danger" id="msBanManual">حظر هذا الحساب</button>';
    var anchor = document.getElementById('gradingQueue');
    var ref = anchor && anchor.closest ? anchor.closest('.card') : null;
    if (ref && ref.parentNode) ref.parentNode.insertBefore(c, ref); else admin.appendChild(c);
    document.getElementById('msBanReload').onclick = load;
    document.getElementById('msBanManual').onclick = function () {
      var uid = (document.getElementById('msBanUid').value || '').trim();
      if (!uid) return say('اكتب UID الطالب');
      ban(uid, document.getElementById('msBanName').value.trim(), document.getElementById('msBanReason').value.trim());
    };
    document.getElementById('msBanSearch').oninput = function () { state.q = this.value.trim().toLowerCase(); render(); };
    return c;
  }

  function load() {
    if (!isAdminNow()) return say('اللوحة للإدارة فقط');
    var st = document.getElementById('msBanStatus');
    if (st) st.textContent = 'جارٍ التحميل...';
    var db = fb().firestore();
    Promise.all([
      db.collection('bans').get(),
      db.collection('publicScores').limit(500).get()
    ]).then(function (r) {
      state.bans = {};
      r[0].forEach(function (d) { state.bans[d.id] = d.data() || {}; });
      state.students = [];
      r[1].forEach(function (d) {
        var v = d.data() || {};
        state.students.push({ uid: d.id, name: v.name || '(بدون اسم)', points: v.points || 0 });
      });
      state.loaded = true;
      if (st) st.textContent = 'تم التحميل';
      render();
    }).catch(function (e) {
      if (st) st.textContent = 'تعذر التحميل';
      console.warn('ban load', e);
      say('تعذر تحميل القائمة. تأكد إنك داخل بحساب الإدارة.');
    });
  }

  function row(uid, name, extra, banned) {
    return '<div class="row" style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08)">' +
      '<div style="flex:1;min-width:0"><b>' + esc(name) + '</b> <span class="muted" dir="ltr" style="font-size:11px">' + esc(uid.slice(0, 8)) + '…</span>' +
      (extra ? '<div class="muted" style="font-size:12px">' + esc(extra) + '</div>' : '') + '</div>' +
      (banned
        ? '<button class="btn ghost small" data-unban="' + esc(uid) + '">فك الحظر</button>'
        : '<button class="btn danger small" data-ban="' + esc(uid) + '">حظر</button>') + '</div>';
  }

  function render() {
    var bl = document.getElementById('msBanList'), sl = document.getElementById('msStudentList'), cnt = document.getElementById('msBanCount');
    if (!bl || !sl) return;
    var ids = Object.keys(state.bans);
    if (cnt) cnt.textContent = ids.length + ' محظور';
    bl.className = ids.length ? '' : 'empty';
    bl.innerHTML = ids.length
      ? '<h3 style="margin:10px 0 4px">المحظورون حالياً</h3>' + ids.map(function (u) {
        var b = state.bans[u];
        return row(u, b.name || 'حساب محظور', b.reason ? 'السبب: ' + b.reason : '', true);
      }).join('')
      : 'لا يوجد طلبة محظورين.';
    var q = state.q;
    var list = state.students.filter(function (s) { return !state.bans[s.uid] && (!q || s.name.toLowerCase().indexOf(q) >= 0); })
      .sort(function (a, b) { return b.points - a.points; }).slice(0, 80);
    sl.className = list.length ? '' : 'empty';
    sl.innerHTML = list.length
      ? list.map(function (s) { return row(s.uid, s.name, s.points + ' نقطة', false); }).join('')
      : (state.loaded ? 'لا توجد نتائج.' : 'اضغط تحميل / تحديث لعرض الطلبة.');
    var btns = document.getElementById('msBanCard').querySelectorAll('[data-ban],[data-unban]');
    Array.prototype.forEach.call(btns, function (b) {
      b.onclick = function () {
        var u = b.getAttribute('data-ban') || b.getAttribute('data-unban');
        if (b.hasAttribute('data-ban')) {
          var s = state.students.filter(function (x) { return x.uid === u; })[0];
          var reason = prompt('سبب الحظر (اختياري):', '') || '';
          ban(u, s ? s.name : '', reason.trim());
        } else unban(u);
      };
    });
  }

  function ban(uid, name, reason) {
    if (!isAdminNow()) return say('للإدارة فقط');
    if (isAdminId(uid)) return say('لا يمكن حظر حساب إدارة.');
    var me = fb().auth().currentUser;
    if (me && me.uid === uid) return say('لا يمكنك حظر حسابك.');
    if (!confirm('تأكيد حظر ' + (name || uid) + '؟ لن يستطيع دخول التطبيق.')) return;
    var doc = { banned: true, uid: uid, name: name || '', reason: reason || '', bannedAt: fb().firestore.FieldValue.serverTimestamp(), by: me ? me.uid : '' };
    fb().firestore().collection('bans').doc(uid).set(doc).then(function () {
      state.bans[uid] = { name: name, reason: reason };
      say('تم حظر الحساب');
      var u = document.getElementById('msBanUid'); if (u) u.value = '';
      render();
    }).catch(function (e) { console.warn('ban', e); say('فشل الحظر. تأكد إنك داخل بحساب الإدارة.'); });
  }

  function unban(uid) {
    if (!isAdminNow()) return say('للإدارة فقط');
    fb().firestore().collection('bans').doc(uid).delete().then(function () {
      delete state.bans[uid];
      say('تم فك الحظر');
      render();
    }).catch(function (e) { console.warn('unban', e); say('فشل فك الحظر'); });
  }

  function mountAdmin() {
    var tries = 0;
    (function wait() {
      if (document.getElementById('admin') && ready()) { card(); return; }
      if (++tries < 120) setTimeout(wait, 500);
    })();
  }

  function init() { startEnforcement(); mountAdmin(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
