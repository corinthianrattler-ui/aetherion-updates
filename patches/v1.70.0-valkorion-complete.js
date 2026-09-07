/* Aetherion Reforged v1.70.0 — finished assembled Valkorion model. */
'use strict';
(()=>{
 const VERSION='1.70.0';
 const MODEL_PATH='assets/v170/valkorion-complete-kit.glb';
 const EXPECTED_ROOT='ROOT';
 const EXPECTED_PARTS=40;
 const runtime={viewer:null,loading:null,error:null,lastHost:null,mounts:0};

 function host(){
  return typeof document==='object'&&document?.querySelector
   ?document.querySelector('.v38-equipment-panel [data-v80-valkorion]')
   :null;
 }
 function stageOf(node){return node?.closest?.('.v80-stage')||node?.parentElement||null}
 function setStage(node,state){
  const stage=stageOf(node);if(!stage)return;
  stage.classList?.remove?.('v80-3d-ready','v80-3d-loading','v80-2d-fallback','v170-model-error');
  stage.classList?.add?.(state);
 }
 function disposeLegacy(){
  try{
   if(typeof V80_RUNTIME!=='undefined'&&V80_RUNTIME?.viewer&&V80_RUNTIME.viewer!==runtime.viewer){
    V80_RUNTIME.viewer.dispose?.();V80_RUNTIME.viewer=null;V80_RUNTIME.canvas=null;V80_RUNTIME.initializing=null;
   }
  }catch(_){ }
  try{
   if(typeof V98_PLAYER!=='undefined'&&V98_PLAYER?.viewer&&V98_PLAYER.viewer!==runtime.viewer){
    V98_PLAYER.viewer.dispose?.();V98_PLAYER.viewer=null;V98_PLAYER.pending=false;
   }
  }catch(_){ }
 }
 function freshCanvas(node){
  node.replaceChildren();
  const canvas=document.createElement('canvas');
  canvas.dataset.v170Valkorion='complete';
  canvas.setAttribute('aria-label','Valkorion Dominus in the finished complete Dominus battle harness. Drag to rotate.');
  canvas.style.cssText='display:block;width:100%;height:100%;touch-action:pan-y;background:transparent';
  node.appendChild(canvas);return canvas;
 }
 function namedCount(viewer){return viewer?.getNamedNodes?.().filter?.(node=>node?.name&&node.name!==EXPECTED_ROOT).length||0}
 function validate(viewer){
  if(!viewer?.model)throw Error('The finished Valkorion model did not load.');
  if(viewer.hasNode?.(EXPECTED_ROOT)===false)throw Error('The assembled Valkorion root is missing.');
  const count=namedCount(viewer);if(count&&count<EXPECTED_PARTS)throw Error(`Only ${count}/${EXPECTED_PARTS} assembled Valkorion parts loaded.`);
 }
 function bindReset(node,viewer){
  const button=stageOf(node)?.querySelector?.('[data-v80-reset-view]');
  if(!button||button.dataset.v170Bound==='true')return;
  button.dataset.v170Bound='true';button.addEventListener?.('click',event=>{event.preventDefault?.();viewer.setYaw?.(Math.PI)});
 }
 function idle(viewer){
  if(viewer._v170Idle||!viewer.model)return;viewer._v170Idle=true;
  const model=viewer.model,base={y:model.position.y,rz:model.rotation.z};let last=0;
  const tick=now=>{
   if(viewer.disposed||!viewer._v170Idle)return;
   if(typeof document==='undefined'||!document.hidden){if(now-last>42){last=now;model.position.y=base.y+Math.sin(now*.00115)*.005;model.rotation.z=base.rz+Math.sin(now*.00043)*.003;viewer.render?.()}}
   requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
 }
 async function create(node){
  const api=window.AetherionThree;if(!api?.createViewer)throw Error('The bundled 3D viewer is unavailable.');
  disposeLegacy();const canvas=freshCanvas(node);
  const viewer=await api.createViewer({
   canvas,container:node,glb:MODEL_PATH,proceduralFallback:false,framingNode:EXPECTED_ROOT,
   modelHeight:4.2,maxPixelRatio:1.65,rotationEnabled:true,
   onWebGLFailure:error=>{runtime.error=String(error?.message||error||'WebGL unavailable')},
   onError:error=>{runtime.error=String(error?.message||error)}
  });
  validate(viewer);viewer.setYaw?.(Math.PI);viewer._v170Complete=true;runtime.viewer=viewer;runtime.mounts++;
  try{if(typeof V80_RUNTIME!=='undefined'){V80_RUNTIME.viewer=viewer;V80_RUNTIME.canvas=canvas;V80_RUNTIME.viewerCount=1;V80_RUNTIME.canvasCount=1;V80_RUNTIME.mountCount=(V80_RUNTIME.mountCount||0)+1}}catch(_){ }
  bindReset(node,viewer);idle(viewer);return viewer;
 }
 function showError(node,error){
  runtime.error=String(error?.message||error);setStage(node,'v170-model-error');
  try{
   node.replaceChildren();const box=document.createElement('div');box.className='v170-model-message';
   box.innerHTML='<b>FINISHED MODEL COULD NOT OPEN</b><span>The wardrobe remains usable. Reopen Equipment to retry.</span>';
   node.appendChild(box);
  }catch(_){ }
  console.error?.('[Aetherion 1.70.0 Valkorion]',error);
 }
 async function sync(){
  if(typeof currentTab!=='undefined'&&currentTab!=='equipment')return state();
  let node=host();if(!node)return state();runtime.lastHost=node;setStage(node,'v80-3d-loading');
  try{
   let viewer=runtime.viewer;
   if(viewer&&!viewer._v170Complete){viewer.dispose?.();runtime.viewer=null;viewer=null}
   if(!viewer){if(!runtime.loading)runtime.loading=create(node).finally(()=>{runtime.loading=null});viewer=await runtime.loading}
   node=host()||node;viewer.attach?.(node);viewer.resize?.();viewer.fitModel?.(EXPECTED_ROOT);viewer.render?.();
   bindReset(node,viewer);setStage(node,'v80-3d-ready');runtime.error=null;
   try{if(typeof V80_RUNTIME!=='undefined'){V80_RUNTIME.mode='3d';V80_RUNTIME.failure=null}}catch(_){ }
  }catch(error){showError(host()||node,error)}
  return state();
 }
 function schedule(){
  const run=()=>sync().catch(error=>showError(host(),error));
  return typeof requestAnimationFrame==='function'?requestAnimationFrame(run):setTimeout(run,0);
 }
 function state(){return{version:VERSION,model:MODEL_PATH,ready:!!runtime.viewer,error:runtime.error,parts:namedCount(runtime.viewer),mounts:runtime.mounts}}

 try{disposeLegacy();v80Sync=sync;v80ScheduleSync=schedule}catch(error){console.warn?.('[Aetherion 1.70.0 viewer hook]',error)}
 const css=document.createElement('style');css.id='aetherion-v170-valkorion-style';css.textContent=`
  .v80-stage{position:relative!important;contain:layout paint!important;overflow:hidden!important;isolation:isolate!important}
  .v80-stage .v80-valkorion-host{inset:6px 18px 70px!important;border-radius:10px;background:radial-gradient(circle at 50% 35%,#251419 0,#090608 62%,#020102 100%)}
  .v80-stage canvas[data-v170-valkorion="complete"]{position:static!important;inset:auto!important;max-width:100%!important;max-height:100%!important;filter:drop-shadow(0 14px 24px #000b)}
  .v170-model-message{position:absolute;inset:20% 8%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:18px;border:1px solid #754845;border-radius:12px;background:#0b0709;color:#d9c9c3;text-align:center}
  .v170-model-message b{color:#dfbd6d}.v170-model-message span{font-size:.78rem}.v170-model-error .v80-fallback{opacity:1!important;visibility:visible!important}
  body>canvas[data-v109-valkorion],body>canvas[data-v98-viewer]{display:none!important}
 `;document.head?.appendChild(css);
 setTimeout(schedule,100);
 window.AetherionValkorionV170=Object.freeze({version:VERSION,model:MODEL_PATH,sync,schedule,state,expectedParts:EXPECTED_PARTS});
})();
