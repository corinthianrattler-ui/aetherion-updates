/* Aetherion Reforged v1.69.1 — always-reachable opening menu and updater access. */
'use strict';
(()=>{
 const VERSION='1.69.1';
 const SAVE_KEY='aetherion_exiled_v03_autosave';
 const existing=window.AetherionStartAccess||{};
 if(existing.version===VERSION)return;
 let openingShown=false;

 function makeButton(label){
  const control=document.createElement('button');
  control.type='button';
  control.className='small aetherion-update-button';
  control.dataset.aetherionUpdates='true';
  control.textContent=label;
  control.addEventListener('click',()=>window.AetherionUpdater?.open?.());
  return control;
 }
 function ensureButtons(){
  document.querySelectorAll?.('.startBtns').forEach(host=>{
   if(!host.querySelector('[data-aetherion-updates]'))host.appendChild(makeButton('GAME UPDATES'));
  });
  document.querySelectorAll?.('.dockTabs').forEach(host=>{
   if(!host.querySelector('[data-aetherion-updates]'))host.appendChild(makeButton('GAME UPDATES'));
  });
 }
 function showOpeningMenu(){
  if(openingShown)return true;
  const app=document.getElementById('app');
  if(!app||typeof renderStart!=='function')return false;
  if(!localStorage.getItem(SAVE_KEY)){
   openingShown=true;
   ensureButtons();
   return true;
  }
  try{if(typeof flushPersist==='function')flushPersist()}catch(_){ }
  try{if(typeof stopSpeech==='function')stopSpeech()}catch(_){ }
  try{if(typeof stopMusic==='function')stopMusic()}catch(_){ }
  renderStart();
  openingShown=true;
  ensureButtons();
  return true;
 }
 function mount(){
  ensureButtons();
  if(!showOpeningMenu())setTimeout(showOpeningMenu,0);
 }

 const observer=typeof MutationObserver==='function'?new MutationObserver(ensureButtons):null;
 observer?.observe(document.documentElement,{childList:true,subtree:true});
 Object.assign(existing,{version:VERSION,show:showOpeningMenu,mount,ensureButtons});
 window.AetherionStartAccess=existing;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
