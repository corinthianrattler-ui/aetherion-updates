/* Aetherion Reforged v1.72.7 — restore page scrolling after portrait containment. */
'use strict';
(()=>{
 const VERSION='1.72.7';
 const STYLE_ID='aetherion-v177-scroll-repair';
 if(window.AetherionScrollRepairV177?.version===VERSION)return;

 function install(){
  if(typeof document!=='object'||document.getElementById?.(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
   html{height:auto!important;min-height:100%!important;max-height:none!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior-x:none!important;overscroll-behavior-y:auto!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch}
   body:not(.v37-atlas-open):not(.v37-map-atlas-open){position:static!important;height:auto!important;min-height:100vh!important;max-height:none!important;overflow-x:hidden!important;overflow-y:visible!important;overscroll-behavior-x:none!important;overscroll-behavior-y:auto!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch}
   #app,.shell{height:auto!important;min-height:100vh!important;max-height:none!important;overflow-x:hidden!important;overflow-y:visible!important;touch-action:pan-y!important}
   .body,.body.dockCollapsed{height:auto!important;min-height:auto!important;max-height:none!important;overflow:visible!important;touch-action:pan-y!important}
   .main,.storyInner,.storyBlocks{height:auto!important;max-height:none!important;overflow-y:visible!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch}
   .storyPanel{height:auto!important;max-height:none!important;overflow-x:hidden!important;overflow-y:visible!important;touch-action:pan-y!important}
   .dock,.modal{touch-action:pan-y!important;-webkit-overflow-scrolling:touch}
   body.v37-atlas-open,body.v37-map-atlas-open{overflow:hidden!important;touch-action:none!important}
   @media (orientation:portrait){
    .shell{grid-template-rows:auto auto auto!important;align-content:start!important}
    .body,.body.dockCollapsed{display:grid!important;grid-template-columns:minmax(0,1fr)!important;align-content:start!important}
    .main{display:block!important;width:100%!important;min-height:auto!important;padding-bottom:calc(64px + env(safe-area-inset-bottom))!important}
   }
  `;
  (document.head||document.documentElement)?.appendChild(style);
 }
 function audit(){
  const root=document.scrollingElement||document.documentElement;
  const body=document.body;
  return Object.freeze({
   version:VERSION,
   rootOverflowY:typeof getComputedStyle==='function'?getComputedStyle(root).overflowY:null,
   bodyOverflowY:body&&typeof getComputedStyle==='function'?getComputedStyle(body).overflowY:null,
   clientHeight:Number(root?.clientHeight)||0,
   scrollHeight:Number(root?.scrollHeight)||0,
   canScroll:(Number(root?.scrollHeight)||0)>(Number(root?.clientHeight)||0)
  });
 }

 install();
 window.AetherionScrollRepairV177=Object.freeze({version:VERSION,styleId:STYLE_ID,install,audit});
})();
