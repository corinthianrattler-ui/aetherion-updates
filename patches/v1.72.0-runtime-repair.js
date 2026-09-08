/* Aetherion Reforged v1.72.0 — startup, controls, and mobile render repair. */
'use strict';
(()=>{
 const VERSION='1.72.0';
 const TIMELINE_KEY='aetherion_exiled_v03_autosave';
 const runtime={wrapped:false,mountPending:false,openingShown:false,resuming:false,lastError:null};

 if(window.AetherionRuntimeRepairV172?.version===VERSION)return;

 function removeFloatingUpdate(){
  document.getElementById?.('aetherion-update-launcher')?.remove?.();
 }
 function mountUpdatePaths(){
  removeFloatingUpdate();
  window.AetherionUpdateCenterV172?.mount?.();
 }
 function scheduleMount(){
  if(runtime.mountPending)return;
  runtime.mountPending=true;
  const run=()=>{runtime.mountPending=false;mountUpdatePaths()};
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else setTimeout(run,0);
 }
 function showResumeError(error){
  runtime.lastError=String(error?.message||error||'The timeline could not open.');
  try{
   if(typeof showNotice==='function')showNotice('CONTINUE COULD NOT OPEN',runtime.lastError);
   else if(typeof toast==='function')toast(`Continue could not open: ${runtime.lastError}`);
  }catch(_){ }
 }
 function continueTimeline(){
  if(runtime.resuming)return false;
  runtime.resuming=true;runtime.lastError=null;
  try{
   const raw=localStorage.getItem(TIMELINE_KEY);
   if(!raw)throw Error('No timeline was found.');
   const parsed=JSON.parse(raw);
   const next=typeof migrateState==='function'?migrateState(parsed):parsed;
   if(!next||typeof next!=='object')throw Error('The timeline data was empty.');
   next.awakened=true;
   S=next;
   if(typeof currentTab!=='undefined')currentTab='story';
   try{if(typeof closeModal==='function')closeModal()}catch(_){ }
   if(typeof render!=='function')throw Error('The game screen is unavailable.');
   render();
   scheduleMount();
   return true;
  }catch(error){showResumeError(error);return false}
  finally{runtime.resuming=false}
 }
 function wrapRenderers(){
  if(runtime.wrapped)return;runtime.wrapped=true;
  if(typeof render==='function'){
   const baseRender=render;
   render=function(...args){const out=baseRender.apply(this,args);scheduleMount();return out};
  }
  if(typeof renderStart==='function'){
   const baseStart=renderStart;
   renderStart=function(...args){const out=baseStart.apply(this,args);scheduleMount();return out};
  }
  continueGame=continueTimeline;
 }
 function showOpeningMenu(){
  if(runtime.openingShown)return true;
  if(!document.getElementById?.('app')||typeof renderStart!=='function')return false;
  if(localStorage.getItem(TIMELINE_KEY)){
   try{if(typeof flushPersist==='function')flushPersist()}catch(_){ }
   try{if(typeof stopSpeech==='function')stopSpeech()}catch(_){ }
   try{if(typeof stopMusic==='function')stopMusic()}catch(_){ }
   renderStart();
  }
  runtime.openingShown=true;scheduleMount();return true;
 }
 function installStyles(){
  if(document.getElementById?.('aetherion-v172-runtime-style'))return;
  const style=document.createElement('style');style.id='aetherion-v172-runtime-style';style.textContent=`
   html,body,button,a,input,select,textarea,[role="button"]{-webkit-tap-highlight-color:transparent!important}
   button:focus:not(:focus-visible),a:focus:not(:focus-visible),[role="button"]:focus:not(:focus-visible){outline:none!important}
   button:focus-visible,a:focus-visible,[role="button"]:focus-visible{outline:2px solid #c6a45a!important;outline-offset:2px!important}
   #aetherion-update-launcher{display:none!important;pointer-events:none!important}
  `;
  (document.head||document.documentElement).appendChild(style);
 }
 function handleContinue(event){
  const control=event.target?.closest?.('.startBtns button');
  if(!control||String(control.textContent||'').trim().toUpperCase()!=='CONTINUE')return;
  event.preventDefault?.();event.stopPropagation?.();event.stopImmediatePropagation?.();continueTimeline();
 }
 function start(){
  installStyles();removeFloatingUpdate();wrapRenderers();
  document.addEventListener('click',handleContinue,true);
  if(!showOpeningMenu())setTimeout(showOpeningMenu,0);
  scheduleMount();
 }

 window.AetherionRuntimeRepairV172=Object.freeze({
  version:VERSION,continue:continueTimeline,showOpeningMenu,mount:mountUpdatePaths,
  state:()=>({...runtime})
 });
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
