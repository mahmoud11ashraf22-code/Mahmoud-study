/* MAHMOUD STUDY v3 - additive enhancements (never touches core logic) */
(function(){
'use strict';
var $=function(id){return document.getElementById(id)};
function txt(id,d){var e=$(id);return e&&e.textContent.trim()?e.textContent.trim():d}
var QUOTES=[
 'خطوة صغيرة كل يوم أحسن من حماس ليلة واحدة.',
 'ذاكر النهارده عشان تشكر نفسك بكرة.',
 'التراكم بيخلص درس ورا درس، ابدأ بأسهل واحد.',
 'مش لازم تكون مثالي، لازم تكون مستمر.',
 'ربع ساعة تركيز أحسن من ساعتين تشتت.',
 'اللي بيتعب دلوقتي هيرتاح في النتيجة.',
 'غلطتك في التمرين مكسب، مش في الامتحان.',
 'ركز في اللي تحت إيدك، والباقي هيمشي.',
 'النوم الكويس نص المذاكرة.',
 'كل سؤال بتحله بيقربك من الدرجة اللي نفسك فيها.',
 'ابدأ دلوقتي، حتى لو بخمس دقايق.',
 'الانضباط أقوى من الموهبة.'
];
function greet(){var h=new Date().getHours();return h<5?'سهران ليه؟ 🌙':h<12?'صباح الخير ☀️':h<17?'يومك سعيد 👋':h<21?'مساء النور 🌆':'مساء الخير 🌙'}
function nm(){var e=$('studentName');var v=e&&e.value&&e.value.trim();return v?v.split(' ')[0]:'يا بطل'}

function buildCC(){
  var home=$('home');if(!home)return;
  var cc=$('v3cc');
  if(!cc){
    cc=document.createElement('div');cc.id='v3cc';
    cc.innerHTML='<div class="v3-cc"><div class="v3-hi" id="v3hi"></div><div class="v3-name" id="v3nm"></div>'+
      '<div class="v3-pills"><div class="v3-pill"><b id="v3p">0</b><span>نقطة</span></div><div class="v3-pill"><b id="v3s">0</b><span>يوم متواصل 🔥</span></div><div class="v3-pill"><b id="v3d">—</b><span>يوم للامتحان</span></div><div class="v3-pill"><b id="v3t">0</b><span>مهمة مفتوحة</span></div></div>'+
      '<div class="v3-cta"><button onclick="go(\'exams\')">📝 ابدأ امتحان</button><button class="alt" onclick="go(\'focus\')">⏱ جلسة تركيز</button></div></div>'+
      '<button class="v3-install" id="v3inst">📲 ثبّت المنصة على موبايلك</button>'+
      '<div class="v3-tiles">'+
      T('arena','🏆','المنافسات','اكسب نقط')+T('tutor','🧑‍🏫','المدرّس','ذاكر إيه')+T('summaries','📚','الملخصات','PDF')+
      T('backlog','🚑','الإنقاذ','التراكم')+T('review','🎯','أخطائي','راجعها')+T('guide','📖','الدليل','اتعلم')+'</div>'+
      '<div class="v3-quote" id="v3q"></div>';
    var hero=home.querySelector('.hero');
    if(hero&&hero.parentNode===home)home.insertBefore(cc,hero);else home.insertBefore(cc,home.firstChild);
    var q=QUOTES[Math.floor(Date.now()/864e5)%QUOTES.length];
    $('v3q').innerHTML='💡 '+q+'<small>فكرة اليوم</small>';
    $('v3inst').onclick=installApp;
    if(window.__v3ip)$('v3inst').classList.add('show');
  }
  $('v3hi').textContent=greet();$('v3nm').textContent='أهلاً '+nm()+' 👋';
  $('v3p').textContent=txt('totalPoints','0');$('v3s').textContent=txt('studyStreak','0');
  $('v3d').textContent=txt('daysLeft','—');$('v3t').textContent=txt('tasksStat','0');
}
function T(p,i,t,s){return '<button class="v3-tile" onclick="go(\''+p+'\')"><i>'+i+'</i><b>'+t+'</b><small>'+s+'</small></button>'}

function buildSearch(){
  var ex=$('exams');if(!ex||$('v3srch'))return;
  var sub=ex.querySelector('.sub');if(!sub)return;
  var w=document.createElement('div');w.id='v3srch';
  w.innerHTML='<div class="v3-search"><input id="v3q2" type="search" placeholder="دوّر على امتحان: فيزياء، نحو، تاريخ..." autocomplete="off"></div><div class="v3-count" id="v3cnt"></div>';
  sub.parentNode.insertBefore(w,sub.nextSibling);
  var inp=$('v3q2');
  function cards(){return Array.prototype.filter.call(ex.children,function(c){return c.classList&&c.classList.contains('card')&&/1f6b43/.test(c.getAttribute('style')||'')})}
  function run(){
    var q=inp.value.trim().toLowerCase(),n=0,all=cards();
    all.forEach(function(c){var ok=!q||c.textContent.toLowerCase().indexOf(q)>-1;c.style.display=ok?'':'none';if(ok)n++});
    $('v3cnt').textContent=q?('النتيجة: '+n+' من '+all.length+' امتحان'):(all.length+' امتحان جاهز بالإجابات');
  }
  inp.addEventListener('input',run);run();
}

var inst=null;
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();inst=e;window.__v3ip=1;var b=$('v3inst');if(b)b.classList.add('show')});
window.addEventListener('appinstalled',function(){var b=$('v3inst');if(b)b.classList.remove('show')});
function installApp(){if(!inst)return;inst.prompt();inst=null;var b=$('v3inst');if(b)b.classList.remove('show')}

function chrome(){
  if($('v3top'))return;
  var t=document.createElement('button');t.id='v3top';t.className='v3-top';t.setAttribute('aria-label','لفوق');t.textContent='↑';
  t.onclick=function(){window.scrollTo({top:0,behavior:'smooth'})};document.body.appendChild(t);
  var o=document.createElement('div');o.id='v3off';o.className='v3-off';o.textContent='⚠️ مفيش إنترنت، بعض الخواص مش هتشتغل لحد ما يرجع';document.body.appendChild(o);
  function net(){o.classList.toggle('show',!navigator.onLine)}
  window.addEventListener('online',net);window.addEventListener('offline',net);net();
  var tick=false;window.addEventListener('scroll',function(){if(tick)return;tick=true;requestAnimationFrame(function(){t.classList.toggle('show',window.scrollY>700);tick=false})},{passive:true});
  var m=document.querySelector('meta[name=theme-color]');if(m)m.content='#0a0b1e';
}

function boot(){try{chrome();buildCC();buildSearch()}catch(e){console.warn('v3',e)}}
var _go=window.go;
if(typeof _go==='function'){window.go=function(id){var r=_go.apply(this,arguments);setTimeout(boot,60);return r}}
boot();
setInterval(function(){var h=$('home');if(h&&h.classList.contains('active')&&!document.hidden)boot()},1500);
document.addEventListener('visibilitychange',function(){if(!document.hidden)boot()});
})();
