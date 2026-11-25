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
