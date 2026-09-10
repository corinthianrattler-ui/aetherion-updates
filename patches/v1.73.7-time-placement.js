/* Aetherion Reforged v1.73.7 — place the sky dial in the clear HUD pocket. */
'use strict';
(()=>{
 const VERSION='1.73.7',STYLE_ID='aetherion-v1737-time-placement';
 if(window.AetherionV1737TimePlacement?.version===VERSION)return;
 function install(){
  if(typeof document!=='object'||document.getElementById?.(STYLE_ID))return;
  const style=document.createElement('style');style.id=STYLE_ID;
  style.textContent='.aethTimeHeader>.aethSkyClock{top:160px!important}';
  (document.head||document.documentElement)?.appendChild(style);
 }
 install();
 window.AetherionV1737TimePlacement=Object.freeze({version:VERSION,styleId:STYLE_ID,install});
})();
