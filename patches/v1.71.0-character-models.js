/* Aetherion Reforged v1.71.0 — fitted Valkorion modes and Libita's 3D model. */
'use strict';
(()=>{
 const VERSION='1.71.0';
 const ROOT='ROOT';
 const MODELS=Object.freeze({
  base:'assets/v171/valkorion-base-lord.glb',
  lord:'assets/v171/valkorion-base-lord.glb',
  armored:'assets/v171/valkorion-armored.glb',
  libita:'assets/v171/libita-gothic-gown.glb'
 });
 const LABELS=Object.freeze({base:'Base body',lord:"Lord's royal armor",armored:'Complete armor'});
 const HUMAN_PREFIX='HUMAN_PART_';
 const LIBITA_IDS=new Set(['v43_libita_savitas','libita']);
 const ARMOR_IDS=new Set([
  'dominus_lord_helm','dominus_gorget','dominus_arming_doublet','dominus_cuirass',
  'dominus_pauldrons','dominus_gauntlets','dominus_belt','dominus_legplates',
  'dominus_boots','dominus_cloak'
 ]);
 const HOUSE_KEYS=new Set([
  'dominus','white_harbor','highwatch','grimhorn','stonevein','corvinus',
  'eternal_glades','solaris','lorien','winterhold'
 ]);
 const runtime={
  valkorion:{viewer:null,loading:null,loadingSource:null,source:null,mode:null,error:null,mounts:0,generation:0,lastHost:null},
  libita:{viewer:null,loading:null,error:null,mounts:0,generation:0,lastHost:null},
  wrapped:false
 };

 if(window.AetherionCharacterModelsV171?.version===VERSION)return;

 function value(gear,slot){return String(gear?.[slot]||'')}
 function equipmentValues(gear){return Object.values(gear||{}).map(item=>String(item||''))}
 function houseArmor(id){
  const match=String(id||'').match(/^v98_([a-z_]+)_(?:head|body|shoulders|hands|waist|legs|feet|cloak)$/);
  return !!match&&match[1]!=='royal_m'&&HOUSE_KEYS.has(match[1]);
 }
 function armored(gear){
  return equipmentValues(gear).some(id=>ARMOR_IDS.has(id)||houseArmor(id));
 }
 function royal(gear){
  return equipmentValues(gear).some(id=>id.startsWith('v98_royal_m_')||id.startsWith('v38_valkorion_'));
 }
 function mode(state=typeof S!=='undefined'?S:null){
  const gear=state?.player?.equipment||{};
  if(armored(gear))return'armored';
  if(royal(gear))return'lord';
  return state?.v98?.playerMode==='foundation'?'base':'lord';
 }
 function playerKind(){return{base:'foundation',lord:'royal_male',armored:'knight'}[mode()]}
 function asset(path){return window.AetherionUpdater?.asset?.(path)||path}
 function valkorionHost(){
  if(typeof document!=='object'||!document?.querySelector)return null;
  return document.querySelector('.v38-equipment-panel [data-v80-valkorion]')
   ||(typeof v98PlayerHost==='function'?v98PlayerHost():null);
 }
 function stageOf(node){return node?.closest?.('.v80-stage')||node?.parentElement||null}
 function setStage(node,state){
  const stage=stageOf(node);if(!stage)return;
  stage.classList?.remove?.(
   'v80-3d-ready','v80-3d-loading','v80-2d-fallback','v170-model-error','v171-model-error'
  );
  stage.classList?.add?.(state);
 }
 function named(viewer){return viewer?.getNamedNodes?.().filter?.(node=>node?.name)||[]}
 function namedPartCount(viewer){return named(viewer).filter(node=>node.name!==ROOT).length}
 function frontYaw(selected){return selected==='armored'?Math.PI:Math.PI/2}
 function staleError(message){const error=Error(message);error.code='AETHERION_STALE_MODEL';return error}
 function disposeLegacy(){
  const current=runtime.valkorion.viewer;
  try{
   if(typeof V80_RUNTIME!=='undefined'&&V80_RUNTIME?.viewer&&V80_RUNTIME.viewer!==current){
    V80_RUNTIME.viewer.dispose?.();V80_RUNTIME.viewer=null;V80_RUNTIME.canvas=null;V80_RUNTIME.initializing=null;
   }
  }catch(_){ }
  try{
   if(typeof V98_PLAYER!=='undefined'&&V98_PLAYER?.viewer&&V98_PLAYER.viewer!==current){
    V98_PLAYER.viewer.dispose?.();V98_PLAYER.viewer=null;V98_PLAYER.pending=false;
   }
  }catch(_){ }
 }
 function disposeValkorion(){
  runtime.valkorion.generation++;
  const viewer=runtime.valkorion.viewer;
  try{viewer?.dispose?.()}catch(_){ }
  try{if(typeof V80_RUNTIME!=='undefined'&&V80_RUNTIME?.viewer===viewer){V80_RUNTIME.viewer=null;V80_RUNTIME.canvas=null}}catch(_){ }
  try{if(typeof V98_PLAYER!=='undefined'&&V98_PLAYER?.viewer===viewer){V98_PLAYER.viewer=null;V98_PLAYER.kind=null;V98_PLAYER.pending=false}}catch(_){ }
  runtime.valkorion.viewer=null;runtime.valkorion.loading=null;runtime.valkorion.loadingSource=null;runtime.valkorion.source=null;
 }
 function freshCanvas(node,selected,person='Valkorion Dominus'){
  node.replaceChildren();
  const canvas=document.createElement('canvas');
  if(person==='Valkorion Dominus')canvas.dataset.v171Valkorion=selected;
  else canvas.dataset.v171Libita='gothic-gown';
  canvas.setAttribute('aria-label',`${person} 3D model. Drag to rotate; swipe the page to scroll.`);
  canvas.style.cssText='display:block;width:100%;height:100%;touch-action:pan-y;background:transparent';
  node.appendChild(canvas);return canvas;
 }
 function validate(viewer,selected){
  if(!viewer?.model)throw Error(`${LABELS[selected]||'Character'} model did not load.`);
  if(viewer.hasNode?.(ROOT)===false)throw Error('The fitted model ROOT is missing.');
  const count=namedPartCount(viewer),minimum=selected==='armored'?40:selected==='libita'?28:23;
  if(count&&count<minimum)throw Error(`Only ${count}/${minimum} fitted model parts loaded.`);
 }
 function applyBaseOrLord(viewer,selected){
  if(selected==='armored')return null;
  const map={};
  for(const node of named(viewer))map[node.name]=node.name===ROOT||selected==='lord'||node.name.startsWith(HUMAN_PREFIX);
  try{viewer.setNodesVisible?.(map)}catch(error){
   for(const[name,shown]of Object.entries(map))try{viewer.setNodeVisible?.(name,shown)}catch(_){ }
   console.warn?.('[Aetherion 1.71.0 Valkorion visibility]',error);
  }
  viewer.render?.();return map;
 }
 function applyCreator(viewer){
  if(!viewer?.model)return viewer;
  const creator=typeof S!=='undefined'?S?.v98?.creator:null,model=viewer.model;
  if(!creator||!model.scale?.set)return viewer;
  model.userData??={};model.userData.v171BaseScale??={x:model.scale.x,y:model.scale.y,z:model.scale.z};
  const base=model.userData.v171BaseScale,frame=Math.max(.90,Math.min(1.10,+creator.frame||1));
  const height=Math.max(.92,Math.min(1.08,+creator.height||1));
  model.scale.set(base.x*frame,base.y*height,base.z*frame);model.updateMatrixWorld?.(true);viewer.render?.();return viewer;
 }
 function idle(viewer,key){
  const flag=`_v171Idle_${key}`;if(viewer?.[flag]||!viewer?.model)return;viewer[flag]=true;
  const model=viewer.model,base={y:model.position.y,rz:model.rotation.z};let last=0;
  const tick=now=>{
   if(viewer.disposed||!viewer[flag])return;
   if(typeof document==='undefined'||!document.hidden){
    if(now-last>42){last=now;model.position.y=base.y+Math.sin(now*.00115)*.005;model.rotation.z=base.rz+Math.sin(now*.00043)*.003;viewer.render?.()}
   }
   requestAnimationFrame(tick);
  };
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(tick);
 }
 function bindValkorionReset(node){
  const button=stageOf(node)?.querySelector?.('[data-v80-reset-view]');
  if(!button||button.dataset.v171Bound==='true')return;
  button.dataset.v171Bound='true';button.addEventListener?.('click',event=>{
   event.preventDefault?.();runtime.valkorion.viewer?.setYaw?.(frontYaw(runtime.valkorion.mode));
  });
 }
 async function createValkorion(node,selected,source,generation){
  const api=window.AetherionThree;if(!api?.createViewer)throw Error('The bundled 3D viewer is unavailable.');
  disposeLegacy();const canvas=freshCanvas(node,selected);
  const viewer=await api.createViewer({
   canvas,container:node,glb:asset(source),proceduralFallback:false,framingNode:ROOT,
   modelHeight:4.2,maxPixelRatio:1.5,rotationEnabled:true,
   onWebGLFailure:error=>{runtime.valkorion.error=String(error?.message||error||'WebGL unavailable')},
   onError:error=>{runtime.valkorion.error=String(error?.message||error)}
  });
  if(generation!==runtime.valkorion.generation){viewer.dispose?.();throw staleError('A newer wardrobe model was selected.');}
  validate(viewer,selected);viewer.setYaw?.(frontYaw(selected));viewer._v171Source=source;
  runtime.valkorion.viewer=viewer;runtime.valkorion.source=source;runtime.valkorion.mounts++;
  applyBaseOrLord(viewer,selected);applyCreator(viewer);idle(viewer,'valkorion');
  try{
   if(typeof V80_RUNTIME!=='undefined'){
    V80_RUNTIME.viewer=viewer;V80_RUNTIME.canvas=canvas;V80_RUNTIME.viewerCount=1;V80_RUNTIME.canvasCount=1;
    V80_RUNTIME.mountCount=(V80_RUNTIME.mountCount||0)+1;
   }
  }catch(_){ }
  try{if(typeof V98_PLAYER!=='undefined'){V98_PLAYER.viewer=viewer;V98_PLAYER.kind=`v171_${selected}`;V98_PLAYER.pending=false}}catch(_){ }
  return viewer;
 }
 function showValkorionError(node,error){
  runtime.valkorion.error=String(error?.message||error);if(!node)return;setStage(node,'v171-model-error');
  try{
   node.replaceChildren();const box=document.createElement('div');box.className='v171-model-message';
   box.innerHTML='<b>CHARACTER MODEL COULD NOT OPEN</b><span>The wardrobe still works. Reopen Equipment to retry.</span>';
   node.appendChild(box);
  }catch(_){ }
  console.error?.('[Aetherion 1.71.0 Valkorion]',error);
 }
 async function syncValkorion(){
  if(typeof currentTab!=='undefined'&&currentTab!=='equipment')return state();
  let node=valkorionHost();if(!node)return state();runtime.valkorion.lastHost=node;setStage(node,'v80-3d-loading');
  const selected=mode(),source=MODELS[selected];runtime.valkorion.mode=selected;
  try{
   let viewer=runtime.valkorion.viewer;
   if(viewer&&runtime.valkorion.source!==source){disposeValkorion();viewer=null}
   if(!viewer&&runtime.valkorion.loading&&runtime.valkorion.loadingSource!==source){
    runtime.valkorion.generation++;runtime.valkorion.loading=null;runtime.valkorion.loadingSource=null;
   }
   if(!viewer){
    if(!runtime.valkorion.loading){
     const generation=++runtime.valkorion.generation;
     runtime.valkorion.loading=createValkorion(node,selected,source,generation);runtime.valkorion.loadingSource=source;
    }
    const pending=runtime.valkorion.loading;
    try{viewer=await pending}finally{if(runtime.valkorion.loading===pending){runtime.valkorion.loading=null;runtime.valkorion.loadingSource=null}}
   }
   const active=mode();if(MODELS[active]!==source)throw staleError('The wardrobe selection changed while loading.');
   node=valkorionHost()||node;runtime.valkorion.mode=active;
   if(viewer.canvas?.dataset)viewer.canvas.dataset.v171Valkorion=active;
   viewer.attach?.(node);applyBaseOrLord(viewer,active);applyCreator(viewer);viewer.resize?.();viewer.fitModel?.(ROOT);viewer.render?.();
   bindValkorionReset(node);setStage(node,'v80-3d-ready');runtime.valkorion.error=null;
   try{if(typeof V80_RUNTIME!=='undefined'){V80_RUNTIME.mode='3d';V80_RUNTIME.failure=null}}catch(_){ }
   return viewer;
  }catch(error){if(error?.code==='AETHERION_STALE_MODEL'){scheduleValkorion();return runtime.valkorion.viewer}showValkorionError(valkorionHost()||node,error);return null}
 }
 function scheduleValkorion(){
  const run=()=>syncValkorion().catch(error=>showValkorionError(valkorionHost(),error));
  return typeof requestAnimationFrame==='function'?requestAnimationFrame(run):setTimeout(run,0);
 }

 function normalize(value){return String(value||'').trim().toLowerCase()}
 function libitaPerson(id){
  const rows=typeof S!=='undefined'&&Array.isArray(S?.people)?S.people:[];
  return rows.find(person=>String(person?.id||'')===String(id||''))
   ||rows.find(person=>LIBITA_IDS.has(String(person?.id||''))||normalize(person?.name)==='libita savitas')
   ||null;
 }
 function isLibita(id){
  const person=libitaPerson(id);return !!person||LIBITA_IDS.has(String(id||''))||normalize(id)==='libita savitas';
 }
 function tagLibitaModel(){
  const person=libitaPerson('v43_libita_savitas');if(!person)return;
  try{Object.defineProperty(person,'model3d',{value:MODELS.libita,writable:true,configurable:true,enumerable:false})}
  catch(_){try{person.model3d=MODELS.libita}catch(_){ }}
 }
 function disposeLibita(){
  runtime.libita.generation++;
  try{runtime.libita.viewer?.dispose?.()}catch(_){ }
  runtime.libita.viewer=null;runtime.libita.loading=null;runtime.libita.lastHost=null;
 }
 function modal(){return typeof document==='object'?document.querySelector?.('#modalRoot .modal'):null}
 function ensureLibitaCard(root){
  let card=root?.querySelector?.('[data-v171-libita-model]');if(card)return card;
  card=document.createElement('section');card.className='v171-libita-card';card.dataset.v171LibitaModel='true';
  card.innerHTML='<div class="v171-libita-title"><div><b>Libita Savitas</b><span>Gothic ball gown · fitted 3D model</span></div><button type="button" data-v171-libita-front>Front</button></div><div class="v171-libita-stage"><div class="v171-libita-host"></div></div>';
  const header=root?.querySelector?.('.modalHeader');if(header?.after)header.after(card);else root?.prepend?.(card);
  const reset=card.querySelector?.('[data-v171-libita-front]');reset?.addEventListener?.('click',event=>{
   event.preventDefault?.();runtime.libita.viewer?.setYaw?.(Math.PI/2);
  });
  return card;
 }
 async function mountLibita(){
  const root=modal();if(!root)return null;
  const description=String(root.textContent||root.innerHTML||'');if(!/Libita Savitas/i.test(description))return null;
  const card=ensureLibitaCard(root),host=card?.querySelector?.('.v171-libita-host');if(!host)return null;
  runtime.libita.lastHost=host;card.classList?.remove?.('v171-libita-ready','v171-libita-error');card.classList?.add?.('v171-libita-loading');
  try{
   let viewer=runtime.libita.viewer;
   if(!viewer){
    if(!runtime.libita.loading){
     const generation=++runtime.libita.generation;
     runtime.libita.loading=(async()=>{
      // Keep mobile GPU memory bounded: only one of the large character viewers
      // is retained at a time. Equipment recreates Valkorion after this modal closes.
      disposeValkorion();
      const canvas=freshCanvas(host,'libita','Libita Savitas'),api=window.AetherionThree;
      if(!api?.createViewer)throw Error('The bundled 3D viewer is unavailable.');
      const next=await api.createViewer({
       canvas,container:host,glb:asset(MODELS.libita),proceduralFallback:false,framingNode:ROOT,
       modelHeight:4.15,maxPixelRatio:1.5,rotationEnabled:true,
       onWebGLFailure:error=>{runtime.libita.error=String(error?.message||error||'WebGL unavailable')},
       onError:error=>{runtime.libita.error=String(error?.message||error)}
      });
      if(generation!==runtime.libita.generation){next.dispose?.();throw staleError('Libita model view was closed.');}
      validate(next,'libita');next.setYaw?.(Math.PI/2);next._v171Libita=true;runtime.libita.viewer=next;runtime.libita.mounts++;idle(next,'libita');return next;
     })();
    }
    const pending=runtime.libita.loading;
    try{viewer=await pending}finally{if(runtime.libita.loading===pending)runtime.libita.loading=null}
   }
   viewer.attach?.(host);viewer.resize?.();viewer.fitModel?.(ROOT);viewer.render?.();
   card.classList?.remove?.('v171-libita-loading','v171-libita-error');card.classList?.add?.('v171-libita-ready');runtime.libita.error=null;return viewer;
  }catch(error){
   if(error?.code==='AETHERION_STALE_MODEL')return null;
   runtime.libita.error=String(error?.message||error);card.classList?.remove?.('v171-libita-loading');card.classList?.add?.('v171-libita-error');
   const host=card?.querySelector?.('.v171-libita-host');if(host)host.textContent='3D MODEL COULD NOT OPEN — close and reopen Libita to retry.';
   console.error?.('[Aetherion 1.71.0 Libita]',error);return null;
  }
 }
 function scheduleLibita(){
  const run=()=>mountLibita().catch(error=>console.error?.('[Aetherion 1.71.0 Libita mount]',error));
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else setTimeout(run,0);
 }
 function wrapPersonViews(){
  if(runtime.wrapped)return;runtime.wrapped=true;
  try{
   if(typeof openPerson==='function'){
    const base=openPerson;openPerson=function(id,...args){const target=isLibita(id),out=base.call(this,id,...args);if(target)scheduleLibita();return out};
   }
  }catch(error){console.warn?.('[Aetherion 1.71.0 Libita profile hook]',error)}
  try{
   if(typeof v16PersonEquipment==='function'){
    const base=v16PersonEquipment;v16PersonEquipment=function(id,...args){const target=isLibita(id),out=base.call(this,id,...args);if(target)scheduleLibita();return out};
   }
  }catch(error){console.warn?.('[Aetherion 1.71.0 Libita equipment hook]',error)}
  try{
   if(typeof closeModal==='function'){
    const base=closeModal;closeModal=function(...args){
     const hadLibita=!!runtime.libita.viewer||!!runtime.libita.loading;if(hadLibita)disposeLibita();
     const out=base.apply(this,args);if(hadLibita&&typeof currentTab!=='undefined'&&currentTab==='equipment')setTimeout(scheduleValkorion,0);return out;
    };
   }
  }catch(error){console.warn?.('[Aetherion 1.71.0 Libita close hook]',error)}
 }
 function installStyles(){
  if(typeof document!=='object'||document.getElementById?.('aetherion-v171-character-models'))return;
  const css=document.createElement('style');css.id='aetherion-v171-character-models';css.textContent=`
   .v80-stage{position:relative!important;contain:layout paint!important;overflow:hidden!important;isolation:isolate!important}
   .v80-stage .v80-valkorion-host{inset:6px 18px 70px!important;border-radius:10px;background:radial-gradient(circle at 50% 35%,#28161b 0,#090608 62%,#020102 100%)}
   .v80-stage canvas[data-v171-valkorion]{position:static!important;inset:auto!important;max-width:100%!important;max-height:100%!important;filter:drop-shadow(0 14px 24px #000b)}
   .v171-model-message{position:absolute;inset:20% 8%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:18px;border:1px solid #754845;border-radius:12px;background:#0b0709;color:#d9c9c3;text-align:center}
   .v171-model-message b{color:#dfbd6d}.v171-model-message span{font-size:.78rem}.v171-model-error .v80-fallback{opacity:1!important;visibility:visible!important}
   .v171-libita-card{margin:10px 0 16px;padding:10px;border:1px solid #70413e;border-radius:12px;background:#080507;overflow:hidden}
   .v171-libita-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;color:#ead9d1}.v171-libita-title div{display:flex;flex-direction:column;gap:2px}.v171-libita-title b{color:#dfbd6d}.v171-libita-title span{font-size:.72rem;color:#ad9893}.v171-libita-title button{width:auto;padding:7px 12px}
   .v171-libita-stage{height:min(62vh,560px);min-height:390px;border-radius:9px;overflow:hidden;background:radial-gradient(circle at 50% 32%,#28151e 0,#090609 62%,#020102 100%)}
   .v171-libita-host,.v171-libita-host canvas{display:block;width:100%;height:100%}.v171-libita-host canvas{touch-action:pan-y;filter:drop-shadow(0 14px 24px #000b)}
   .v171-libita-error .v171-libita-host{display:flex;align-items:center;justify-content:center;padding:24px;color:#d9c9c3;text-align:center}
   body>canvas[data-v109-valkorion],body>canvas[data-v98-viewer],body>canvas[data-v170-valkorion]{display:none!important}
  `;document.head?.appendChild(css);
 }
 function state(){
  const selected=runtime.valkorion.mode||mode(),visible=named(runtime.valkorion.viewer).filter(node=>node.visible).map(node=>node.name);
  return{version:VERSION,valkorion:{mode:selected,label:LABELS[selected],model:MODELS[selected],ready:!!runtime.valkorion.viewer,error:runtime.valkorion.error,parts:namedPartCount(runtime.valkorion.viewer),visible,mounts:runtime.valkorion.mounts},libita:{id:'v43_libita_savitas',name:'Libita Savitas',model:MODELS.libita,ready:!!runtime.libita.viewer,error:runtime.libita.error,parts:namedPartCount(runtime.libita.viewer),mounts:runtime.libita.mounts}};
 }

 installStyles();tagLibitaModel();wrapPersonViews();disposeLegacy();
 try{
  v98PlayerKind=playerKind;v98ApplyCreator=applyCreator;v98Sync=syncValkorion;v80Sync=syncValkorion;v97Sync=syncValkorion;
  v80ScheduleSync=scheduleValkorion;
 }catch(error){console.warn?.('[Aetherion 1.71.0 viewer hooks]',error)}
 setTimeout(()=>{try{tagLibitaModel();if(typeof render==='function')render();scheduleValkorion()}catch(error){console.warn?.('[Aetherion 1.71.0 start]',error)}},100);
 window.AetherionCharacterModelsV171=Object.freeze({version:VERSION,models:MODELS,labels:LABELS,mode,playerKind,sync:syncValkorion,schedule:scheduleValkorion,mountLibita,state});
})();
