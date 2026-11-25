/* MAHMOUD STUDY v3 extras: forum polish, admin insights, confetti, haptics (additive only) */
(function(){
'use strict';
var $=function(id){return document.getElementById(id)};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
var COL=['#7c6cff','#22d3ee','#2ee6a6','#ffc857','#ff6b81','#5b8cff','#c084fc','#fb923c'];
function hue(n){var h=0;for(var i=0;i<n.length;i++)h=(h*31+n.charCodeAt(i))>>>0;return COL[h%COL.length]}

/* ---------- forum ---------- */
function decorate(){
  var fp=$('forumPosts');if(!fp)return;
  Array.prototype.forEach.call(fp.querySelectorAll('.chat-message'),function(m){
    if(m.dataset.v3)return;m.dataset.v3='1';
    var b=m.querySelector('.chat-message-head b');var name=b?b.textContent.trim():'ط';
    var av=document.createElement('span');av.className='v3-av';av.textContent=(name[0]||'ط').toUpperCase();av.style.background=hue(name);
    m.insertBefore(av,m.firstChild);
    var body=m.querySelector('.chat-message-body');
    if(body&&/https?:\/\//.test(body.textContent)){
      body.innerHTML=body.innerHTML.replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>');
    }
  });
}
function forumUI(){
  var ta=$('forumBody');if(!ta||ta.dataset.v3)return;ta.dataset.v3='1';
  var bar=document.createElement('div');bar.className='v3-emo';
  ['😀','😂','🔥','👍','💪','🤔','❤️','🙏','📚','✅'].forEach(function(e){var b=document.createElement('button');b.type='button';b.textContent=e;b.onclick=function(){ta.value+=e;ta.focus();cnt()};bar.appendChild(b)});
  var c=document.createElement('span');c.className='v3-cnt';bar.appendChild(c);
  ta.parentNode.parentNode.insertBefore(bar,ta.parentNode);
  function cnt(){c.textContent=ta.value.length+' / 2000';ta.style.height='auto';ta.style.height=Math.min(140,ta.scrollHeight)+'px'}
  ta.addEventListener('input',cnt);cnt();
  var fp=$('forumPosts');
  var j=document.createElement('button');j.className='v3-jump';j.textContent='↓ آخر الرسائل';j.onclick=function(){fp.scrollTop=fp.scrollHeight};fp.parentNode.insertBefore(j,fp.nextSibling);
  fp.addEventListener('scroll',function(){j.classList.toggle('show',fp.scrollHeight-fp.scrollTop-fp.clientHeight>160)},{passive:true});
  new MutationObserver(decorate).observe(fp,{childList:true});
  decorate();
}

/* ---------- admin ---------- */
function T(v){try{if(!v)return 0;if(v.toDate)return v.toDate().getTime();if(v.seconds)return v.seconds*1000;var d=new Date(v).getTime();return isNaN(d)?0:d}catch(_){return 0}}
function adminUI(){
  var a=$('admin');if(!a||$('v3adm'))return;
  var card=document.createElement('div');card.id='v3adm';card.className='card';
  card.innerHTML='<div class="row"><h2>📊 مركز التحكم والإحصائيات</h2><button class="btn small" id="v3admGo">تحديث</button></div><div id="v3admBody" class="smallnote">اضغط تحديث لعرض إحصائيات المنصة الحية.</div>'+
   '<div class="grid" style="margin-top:10px"><button class="btn ghost" id="v3csv">⬇️ تصدير النتائج CSV</button><button class="btn ghost" id="v3cp">🔗 نسخ رابط المنصة</button></div>'+
   '<div class="divider"></div><h3>🧹 تنظيف المنتدى</h3><p class="smallnote">احذف الرسائل الأقدم من عدد أيام تحدده. لا يمكن التراجع.</p>'+
   '<div class="formgrid"><input id="v3days" type="number" min="1" value="14" placeholder="عدد الأيام"><button class="btn danger" id="v3purge">🗑 حذف القديم</button></div>'+
   '<div class="divider"></div><h3>📢 رسائل جاهزة للتعميم</h3><div class="t2-chips" id="v3tpl"></div>';
  var h=a.querySelector('h1');var after=a.querySelector('.sub')||h;after.parentNode.insertBefore(card,after.nextSibling);
  var TPL=['⏰ فاضل أيام على الامتحانات، راجعوا أخطاءكم من «مراجعتي».','🏆 تحدي الأسبوع شغال، حلّوا 3 امتحانات واكسبوا 60 نقطة!','📚 اتضافت ملخصات جديدة في قسم الملخصات.','💬 احترموا بعض في المنتدى، وللمشاكل كلّموا المطور.'];
  var tp=$('v3tpl');TPL.forEach(function(t){var b=document.createElement('button');b.textContent=t.slice(0,28)+'...';b.onclick=function(){var x=$('announcementText');if(x){x.value=t;x.focus();x.scrollIntoView({behavior:'smooth',block:'center'})}};tp.appendChild(b)});
  $('v3cp').onclick=function(){var u=location.origin+location.pathname;(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(function(){toast('اتنسخ الرابط')},function(){prompt('انسخ الرابط',u)})};
  $('v3admGo').onclick=stats;
  $('v3csv').onclick=csv;
  $('v3purge').onclick=purge;
}
async function stats(){
  var b=$('v3admBody');
  try{
    if(typeof adminUnlocked==='undefined'||!adminUnlocked){b.textContent='افتح لوحة الإدارة بحساب الإدارة أولاً.';return}
    b.textContent='جاري التحميل...';
    var r=await Promise.all([adminCall('listVisitors'),adminCall('listSubmissions'),adminCall('listContent')]);
    var vs=r[0].visitors||[],ss=r[1].submissions||[],ct=r[2];
    var now=Date.now(),d1=0,d7=0;vs.forEach(function(v){var t=T(v.lastSeen);if(now-t<864e5)d1++;if(now-t<6048e5)d7++});
    var avg=ss.length?Math.round(ss.reduce(function(a,x){return a+(+x.percent||0)},0)/ss.length):0;
    var by={};ss.forEach(function(x){var k=x.examTitle||x.title||x.examId||'امتحان';by[k]=(by[k]||0)+1});
    var top=Object.keys(by).sort(function(a,b){return by[b]-by[a]}).slice(0,5).map(function(k,i){return (i+1)+') '+esc(k)+' ('+by[k]+')'}).join('<br>')||'—';
    var st={};ss.forEach(function(x){var k=x.studentName||x.name||x.uid||'?';st[k]=(st[k]||0)+1});
    var act=Object.keys(st).sort(function(a,b){return st[b]-st[a]}).slice(0,5).map(function(k,i){return (i+1)+') '+esc(k)+' ('+st[k]+')'}).join('<br>')||'—';
    b.innerHTML='<div class="grid"><div class="stat"><b>'+vs.length+'</b><span>زائر/طالب مسجل</span></div><div class="stat"><b>'+d1+'</b><span>نشط آخر 24 ساعة</span></div><div class="stat"><b>'+d7+'</b><span>نشط آخر 7 أيام</span></div><div class="stat"><b>'+ss.length+'</b><span>تسليم امتحان</span></div><div class="stat"><b>'+avg+'%</b><span>متوسط الدرجات</span></div><div class="stat"><b>'+((ct.posts||[]).length)+'</b><span>رسالة منتدى</span></div></div>'+
      '<p class="smallnote"><b>🔥 أكتر امتحانات تسليماً:</b><br>'+top+'</p><p class="smallnote"><b>🏅 أنشط الطلبة:</b><br>'+act+'</p>';
  }catch(e){b.textContent='تعذر التحميل: '+(e.message||e)}
}
async function csv(){
  try{
    if(typeof adminUnlocked==='undefined'||!adminUnlocked)return toast('افتح لوحة الإدارة أولاً');
    var r=await adminCall('listSubmissions');var ss=r.submissions||[];
    var rows=[['الطالب','الامتحان','النسبة','صح','الإجمالي','الحالة','التاريخ']];
    ss.forEach(function(x){rows.push([x.studentName||x.name||'',x.examTitle||x.title||x.examId||'',x.percent==null?'':x.percent,x.correct==null?'':x.correct,x.total==null?'':x.total,x.status||'',x.createdAtText||''])});
    var t='\ufeff'+rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"'}).join(',')}).join('\n');
    var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'text/csv;charset=utf-8'}));a.download='mahmoud-study-results.csv';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500);toast('اتحمل ملف النتائج ('+ss.length+' صف)');
  }catch(e){toast('تعذر التصدير: '+(e.message||e))}
}
async function purge(){
  try{
    if(typeof adminUnlocked==='undefined'||!adminUnlocked)return toast('افتح لوحة الإدارة أولاً');
    var days=Math.max(1,parseInt($('v3days').value)||14);
    var r=await adminCall('listContent');var cut=Date.now()-days*864e5;
    var old=(r.posts||[]).filter(function(p){var t=T(p.createdAt);return t&&t<cut});
    if(!old.length)return toast('مفيش رسائل أقدم من '+days+' يوم');
    if(!confirm('هتحذف '+old.length+' رسالة أقدم من '+days+' يوم نهائياً. متأكد؟'))return;
    var n=0;for(var i=0;i<old.length;i++){try{await adminCall('deleteContent',{collection:'forumPosts',id:old[i].id});n++}catch(_){}}
    toast('اتحذف '+n+' رسالة');if(typeof loadAdminContent==='function')loadAdminContent();
  }catch(e){toast('تعذر الحذف: '+(e.message||e))}
}

/* ---------- confetti on points gain + haptics ---------- */
var last=null;
function confetti(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var w=document.createElement('div');w.className='v3-conf';
  for(var i=0;i<36;i++){var p=document.createElement('i');p.style.cssText='left:'+(Math.random()*100)+'%;background:'+COL[i%COL.length]+';animation-delay:'+(Math.random()*.4)+'s;transform:rotate('+(Math.random()*360)+'deg)';w.appendChild(p)}
  document.body.appendChild(w);setTimeout(function(){w.remove()},2600);
}
setInterval(function(){
  var e=$('totalPoints');if(!e||document.hidden)return;var v=parseInt(e.textContent)||0;
  if(last!==null&&v>last){confetti();if(typeof toast==='function')toast('🎉 +'+(v-last)+' نقطة!')}
  last=v;
},2000);
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('.tab')&&navigator.vibrate)navigator.vibrate(8)},true);

function tick(){try{forumUI();adminUI()}catch(e){console.warn('v3x',e)}}
setInterval(tick,1500);tick();
})();
