/* MS-BRIDGE: يربط صفحات الامتحانات المستقلة بحساب الطالب في المنصة (نفس الدومين) */
(function(){
var U=null;try{U=JSON.parse(localStorage.getItem('ms_user')||'null')}catch(_){}
var NAMES={'physics-2027':'فيزياء','physics2-2027':'فيزياء','english-2027':'إنجليزي','networks-2027':'شبكات وأمن معلومات','math-2027':'رياضيات','history-2027':'تاريخ','nahw-2027':'نحو'};
var page=(location.pathname.split('/').pop()||'').replace('.html','');
function fill(){
  var el=document.getElementById('student')||document.getElementById('studentName');
  if(el&&U&&U.name&&!el.value.trim()){el.value=U.name}
}
fill();document.addEventListener('DOMContentLoaded',fill);
var sent=false,timer=null;
var SEL='#totalScore,#score,#totalScoreDisplay,.total-score,#results .score';
var RX=/(\d+(?:\.\d+)?)\s*(?:\/|من)\s*(\d+(?:\.\d+)?)/;
function scan(){
  if(sent)return;
  var els=document.querySelectorAll(SEL);
  for(var i=0;i<els.length;i++){
    var m=RX.exec(els[i].textContent||'');
    if(m){var e=parseFloat(m[1]),t=parseFloat(m[2]);if(t>0&&e<=t){send(e,t);return}}
  }
}
function send(e,t){
  sent=true;
  if(!U||!U.uid)return;
  try{
    var q=JSON.parse(localStorage.getItem('ms_pending_exams')||'[]');
    q.push({id:'EXT_'+Date.now(),page:page,title:(document.title||page).replace(/\s*-\s*MAHMOUD STUDY\s*$/,''),subject:NAMES[page]||'عام',earned:e,total:t,uid:U.uid,name:U.name||'',ts:new Date().toISOString()});
    localStorage.setItem('ms_pending_exams',JSON.stringify(q));
  }catch(_){}
}
new MutationObserver(function(){clearTimeout(timer);timer=setTimeout(scan,900)}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
})();

/* RESUME:START exam pause/resume (answers + remaining time saved on this device) */
(function(){
var U=null;try{U=JSON.parse(localStorage.getItem('ms_user')||'null')}catch(_){}
var pg=(location.pathname.split('/').pop()||'').replace('.html','');
var KEY='ms_resume_'+pg+'_'+((U&&U.uid)||'anon');
var paused=true,init=null,restored=false;
function getT(){try{if(typeof remaining!=='undefined')return remaining}catch(e){}try{if(typeof timeLeft!=='undefined')return timeLeft}catch(e){}return null}
function setT(v){try{if(typeof remaining!=='undefined'){remaining=v;return}}catch(e){}try{if(typeof timeLeft!=='undefined'){timeLeft=v}}catch(e){}}
function flag(n){try{return !!eval('typeof '+n+"!=='undefined'&&"+n)}catch(e){return false}}
function isDone(){
  if(flag('finished')||flag('ended')||flag('submitted')||flag('examSubmitted'))return true;
  var r=document.getElementById('results');if(r&&!r.classList.contains('hidden')&&r.innerHTML.trim().length>20)return true;
  return false;
}
function snap(){
  var r={},x={},n=0;
  document.querySelectorAll('input[type=radio]:checked').forEach(function(e){if(e.name){r[e.name]=e.value;n++}});
  document.querySelectorAll('textarea,input[type=text]').forEach(function(e){if(e.id&&e.value&&e.value.trim()){x[e.id]=e.value;if(e.tagName==='TEXTAREA')n++}});
  return {n:n,r:r,x:x};
}
function save(){
  if(paused||restored===null)return;
  if(isDone()){try{localStorage.removeItem(KEY)}catch(e){}return}
  var s=snap();if(!s.n)return;
  try{localStorage.setItem(KEY,JSON.stringify({t:Date.now(),rem:getT(),r:s.r,x:s.x}))}catch(e){}
}
function fmt(sec){var m=Math.floor(sec/60),s=sec%60;return m+':'+String(s).padStart(2,'0')}
function restore(d){
  Object.keys(d.r||{}).forEach(function(n){var el=document.querySelector('input[type=radio][name="'+n.replace(/"/g,'\\"')+'"][value="'+String(d.r[n]).replace(/"/g,'\\"')+'"]');if(el&&!el.checked)el.click()});
  Object.keys(d.x||{}).forEach(function(i){var el=document.getElementById(i);if(el&&!el.value){el.value=d.x[i];try{el.dispatchEvent(new Event('input',{bubbles:true}))}catch(e){}}});
  if(typeof d.rem==='number'&&d.rem>0)setT(d.rem);
}
function ask(d){
  var o=document.createElement('div');o.id='msResume';
  o.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:inherit;direction:rtl';
  var t=(typeof d.rem==='number'&&d.rem>0)?'<p style="margin:6px 0">الوقت المتبقي: <b>'+fmt(d.rem)+'</b></p>':'';
  o.innerHTML='<div style="background:#fff;color:#111;border-radius:16px;padding:22px;max-width:320px;text-align:center;box-shadow:0 10px 40px #0008"><div style="font-size:38px">⏸️</div><h3 style="margin:6px 0">عندك امتحان لسه مخلصتوش</h3><p style="margin:6px 0;color:#444">إجاباتك اتحفظت. تكمل من حيث وقفت؟</p>'+t+'<button id="msRes1" style="display:block;width:100%;margin:12px 0 8px;padding:12px;border:0;border-radius:10px;background:#16a34a;color:#fff;font-size:16px;font-weight:700;cursor:pointer">▶ أكمل الامتحان</button><button id="msRes2" style="display:block;width:100%;padding:10px;border:1px solid #bbb;border-radius:10px;background:#fff;color:#333;cursor:pointer">ابدأ من جديد</button></div>';
  document.body.appendChild(o);
  document.getElementById('msRes1').onclick=function(){restore(d);o.remove();paused=false};
  document.getElementById('msRes2').onclick=function(){try{localStorage.removeItem(KEY)}catch(e){}if(typeof init==='number')setT(init);o.remove();paused=false};
}
function boot(){
  var tries=0,iv=setInterval(function(){
    tries++;
    var ready=document.querySelector('input[type=radio],textarea');
    if(!ready&&tries<50)return;
    clearInterval(iv);
    init=getT();
    var d=null;try{d=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
    if(d&&Date.now()-d.t<48*3600e3&&!isDone()&&(Object.keys(d.r||{}).length||Object.keys(d.x||{}).length))ask(d);else paused=false;
  },300);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
setInterval(save,4000);
document.addEventListener('change',function(){setTimeout(save,50)},true);
document.addEventListener('input',function(){clearTimeout(save._t);save._t=setTimeout(save,800)},true);
document.addEventListener('visibilitychange',function(){if(document.hidden)save()});
window.addEventListener('pagehide',save);
})();
/* RESUME:END */
