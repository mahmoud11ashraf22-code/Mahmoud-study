/* MAHMOUD STUDY - focus timer fix: timestamp based, survives background throttling and reload */
(function(){
  'use strict';
  var KEY='ms_focus_timer_v1';
  if(typeof toggleTimer!=='function'||typeof updateClock!=='function')return;
  var origToggle=toggleTimer, origReset=typeof resetTimer==='function'?resetTimer:null;
  var endAt=0, tick=null;

  function save(){
    try{
      if(!endAt){localStorage.removeItem(KEY);return;}
      localStorage.setItem(KEY,JSON.stringify({endAt:endAt,initial:timerInitial,isBreak:!!timerIsBreak,
        tid:focusTargetId||'',meta:focusTargetMeta||null}));
    }catch(e){}
  }
  function clearSaved(){endAt=0;try{localStorage.removeItem(KEY);}catch(e){}}

  // start/pause wrapper: captures the page's own 1s tick so we can replay missed seconds
  window.toggleTimer=function(){
    if(timerRunning){origToggle();clearSaved();return;}
    var real=window.setInterval;
    window.setInterval=function(f,d){ if(d===1000)tick=f; return real.apply(window,arguments); };
    try{origToggle();}finally{window.setInterval=real;}
    if(timerRunning){endAt=Date.now()+timerSeconds*1000;save();}
  };
  if(origReset)window.resetTimer=function(){origReset();clearSaved();};

  // catch up: if real time passed more than the page counted (tab was throttled), replay it
  function sync(){
    if(!endAt)return;
    if(!timerRunning){clearSaved();return;}
    if(!tick)return;
    var rem=Math.ceil((endAt-Date.now())/1000);
    if(rem<0)rem=0;
    if(rem<timerSeconds-1){ timerSeconds=rem+1; tick(); }   // tick() does one decrement and the normal end-of-session logic
    if(!timerRunning)clearSaved();
  }
  setInterval(sync,1000);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)sync();});
  window.addEventListener('focus',sync);
  window.addEventListener('pageshow',sync);

  // restore after reload / closed tab
  function restore(){
    var s=null;
    try{s=JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){}
    if(!s||!s.endAt||timerRunning)return;
    var rem=Math.ceil((s.endAt-Date.now())/1000);
    if(rem<-6*3600){clearSaved();return;}   // stale, ignore
    timerInitial=s.initial||timerInitial;
    timerIsBreak=!!s.isBreak;
    focusTargetId=s.tid||'';
    focusTargetMeta=s.meta||null;
    timerSeconds=rem>0?rem:1;
    updateClock();
    window.toggleTimer();
    endAt=s.endAt;save();
    if(rem<=0)sync();   // ended while away: finish now (counts the session, shows the end alert)
  }
  if(document.readyState==='complete')setTimeout(restore,800);
  else window.addEventListener('load',function(){setTimeout(restore,1200);});
})();
