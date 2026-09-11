/* Aetherion Reforged v1.74.0 — thin launcher for the signed maintenance updater. */
'use strict';
(()=>{
 const VERSION='1.74.0';
 const ANDROID_BUILD=196;
 if(window.AetherionUpdateCenterV174?.version===VERSION)return;

 function updater(){return window.AetherionUpdater}
 function open(){return updater()?.open?.()}
 function close(){return updater()?.close?.()}
 function makeButton(){
  const control=document.createElement('button');
  control.type='button';
  control.className='small aetherion-update-button';
  control.dataset.aetherionUpdates='true';
  control.dataset.aetherionUpdateCenter='true';
  control.textContent='GAME UPDATES';
  return control;
 }
 function mount(){
  document.getElementById('aetherion-update-launcher')?.remove?.();
  for(const host of document.querySelectorAll?.('.startBtns,.dockTabs')||[]){
   if(!host.querySelector('[data-aetherion-updates]'))host.appendChild(makeButton());
  }
 }
 document.addEventListener('click',event=>{
  const target=event.target?.closest?.('[data-aetherion-updates]');
  if(!target)return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  open();
 },true);
 const api=Object.freeze({version:VERSION,androidBuild:ANDROID_BUILD,open,close,mount,state:()=>updater()?.state?.()});
 window.AetherionUpdateCenterV174=api;
 window.AetherionUpdateCenterV172=api;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
