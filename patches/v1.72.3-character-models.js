/* Aetherion Reforged v1.72.3 — verified native model mount and health display. */
'use strict';
(()=>{
 const VERSION='1.72.3';
 const ANDROID_BUILD=192;
 const ROOT='ROOT';
 const MODELS=Object.freeze({
  base:'assets/v172/valkorion-base-lord.glb',
  lord:'assets/v172/valkorion-base-lord.glb',
  armored:'assets/v172/valkorion-armored.glb',
  alexus:'assets/v172/alexus-gothic-gown.glb'
 });
 const LABELS=Object.freeze({base:'Base body',lord:"Lord's royal armor",armored:'Complete armor'});
 const HUMAN_PREFIX='HUMAN_PART_';
 const ALEXUS_IDS=new Set(['party_alexus_dominus','dyn_alexus','alexus']);
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
  valkorion:{viewer:null,loading:null,loadingSource:null,source:null,mode:null,error:null,mounts:0,generation:0,lastHost:null,scheduled:false,loaded:0,total:0,url:null},
  alexus:{viewer:null,loading:null,error:null,mounts:0,generation:0,lastHost:null,scheduled:false,loaded:0,total:0,url:null},
  wrapped:false,renderWrapped:false
 };

 if(window.AetherionCharacterModelsV172?.version===VERSION)return;

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
  return state?.v98?.playerMode==='royal_male'?'lord':'base';
 }
 function playerKind(){return{base:'foundation',lord:'royal_male',armored:'knight'}[mode()]}
 function bundledContext(){
  const protocol=String(globalThis.location?.protocol||'').toLowerCase();
  const host=String(globalThis.location?.hostname||'').toLowerCase();
  return protocol==='file:'||host==='appassets.androidplatform.net';
 }
 function asset(path){
  // Android's packaged files must stay local. A previously downloaded asset
  // map must never redirect a 20–42 MB character model over the network.
  return bundledContext()?path:(window.AetherionUpdater?.asset?.(path)||path);
 }
 function assetUrl(path){
  try{return new URL(String(path||''),document.baseURI||globalThis.location?.href).href}
  catch(_){return String(path||'')}
 }
 function checkGlb(buffer,path){
  if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<20)throw Error(`The packaged model is empty: ${path}`);
  const view=new DataView(buffer),magic=view.getUint32(0,true),version=view.getUint32(4,true),declared=view.getUint32(8,true);
  if(magic!==0x46546c67||version!==2||declared!==buffer.byteLength)throw Error(`The packaged model is not a complete GLB: ${path}`);
  return buffer;
 }
 function loadModelBytes(path,target){
  if(typeof XMLHttpRequest!=='function')return Promise.reject(Error('This WebView has no local model reader.'));
  const url=assetUrl(asset(path)),record=runtime[target];record.loaded=0;record.total=0;record.url=url;
  return new Promise((resolve,reject)=>{
   const request=new XMLHttpRequest();let settled=false;
   const fail=message=>{if(settled)return;settled=true;reject(Error(`${message}: ${path}`))};
   request.open('GET',url,true);request.responseType='arraybuffer';request.timeout=120000;
   request.onprogress=event=>{record.loaded=Math.max(0,+event.loaded||0);record.total=Math.max(0,+event.total||0)};
   request.onerror=()=>fail('Android could not read the packaged model');
   request.onabort=()=>fail('The packaged model read was interrupted');
   request.ontimeout=()=>fail('The packaged model took too long to read');
   request.onload=()=>{
    if(settled)return;
    const status=Number(request.status)||0;
    if(status!==0&&(status<200||status>=300)){fail(`The packaged model returned ${status}`);return}
    try{const bytes=checkGlb(request.response,path);record.loaded=bytes.byteLength;record.total=bytes.byteLength;settled=true;resolve(bytes)}
    catch(error){settled=true;reject(error)}
   };
   try{request.send()}catch(error){fail(String(error?.message||error||'The packaged model could not be opened'))}
  });
 }
 function activeModelTab(){
  return typeof currentTab==='undefined'||currentTab==='equipment'||currentTab==='character';
 }
 function toolMarkup(){
  const tools=document.createElement('div');tools.className='v80-viewer-tools';tools.dataset.v80Tools='true';tools.setAttribute('aria-hidden','true');
  const hint=document.createElement('span');hint.className='v80-rotate-hint';hint.textContent='Drag to rotate · swipe page to scroll';
  const reset=document.createElement('button');reset.className='v80-reset-view';reset.type='button';reset.dataset.v80ResetView='true';reset.setAttribute('aria-label','Reset Valkorion to front view');reset.textContent='Front';
  tools.append(hint,reset);return tools;
 }
 function hostNode(){
  const node=document.createElement('div');node.className='v80-valkorion-host';node.dataset.v80Valkorion='true';node.dataset.v173Valkorion='true';node.setAttribute('role','img');node.setAttribute('aria-label','Interactive three-dimensional Valkorion model. Drag horizontally to rotate.');return node;
 }
 function healthBadge(stage){
  let badge=stage?.querySelector?.('[data-v173-model-health]');if(badge)return badge;
  badge=document.createElement('div');badge.className='v173-model-health v173-model-check';badge.dataset.v173ModelHealth='true';badge.textContent=`BUILD ${ANDROID_BUILD} · 3D CHECK`;
  stage?.appendChild?.(badge);return badge;
 }
 function setHealth(node,status,detail=''){
  const stage=stageOf(node),badge=healthBadge(stage);if(!badge)return;
  badge.classList.remove('v173-model-check','v173-model-loading','v173-model-ready','v173-model-error');
  badge.classList.add(`v173-model-${status}`);badge.textContent=`BUILD ${ANDROID_BUILD} · 3D ${status.toUpperCase()}`;
  badge.title=String(detail||'');badge.setAttribute('aria-label',detail?`${badge.textContent}: ${detail}`:badge.textContent);
 }
 function tagHost(node){
  if(!node)return null;node.dataset.v173Valkorion='true';healthBadge(stageOf(node));return node;
 }
 function equipmentHost(){
  const panel=document.querySelector?.('.v38-equipment-panel');if(!panel)return null;
  const existing=panel.querySelector?.('[data-v80-valkorion]');if(existing)return tagHost(existing);
  const stage=panel.querySelector?.('.v78-stage,.v40-stage,.v38-doll-frame');if(!stage)return null;
  stage.classList?.add?.('v80-stage','v173-repaired-stage');
  const fallback=stage.querySelector?.('.v78-canvas,.v41-layers,.v40-model,.v38-doll-figure');fallback?.classList?.add?.('v80-fallback');
  const node=hostNode(),tools=toolMarkup();stage.insertBefore?.(tools,stage.firstChild);stage.insertBefore?.(node,stage.firstChild);return tagHost(node);
 }
 function characterPanel(){
  const direct=document.querySelector?.('.v38-character-panel');if(direct)return direct;
  const panels=Array.from(document.querySelectorAll?.('main.main .panel,.main .panel')||[]);
  return panels.find(panel=>String(panel.querySelector?.('h2')?.textContent||'').trim()==='Valkorion Dominus')||null;
 }
 function characterHost(){
  const panel=characterPanel();if(!panel)return null;
  const existing=panel.querySelector?.('[data-v173-valkorion]');if(existing)return tagHost(existing);
  const image=panel.querySelector?.('.detailGrid .bigPic,.v38-character-grid .v78-valkorion,.v38-character-grid .v38-paperdoll');if(!image)return null;
  const stage=document.createElement('div');stage.className='v80-stage v173-character-stage';stage.dataset.v80Mode='eligible';
  const node=hostNode(),tools=toolMarkup(),fallback=document.createElement('div');fallback.className='v80-fallback v173-character-fallback';
  image.replaceWith?.(stage);fallback.appendChild(image);stage.append(node,tools,fallback);healthBadge(stage);return node;
 }
 function valkorionHost(){
  if(typeof document!=='object'||!document?.querySelector)return null;
  return equipmentHost()||characterHost()||(typeof v98PlayerHost==='function'?tagHost(v98PlayerHost()):null);
 }
 function stageOf(node){return node?.closest?.('.v80-stage')||node?.parentElement||null}
 function setStage(node,state){
  const stage=stageOf(node);if(!stage)return;
  stage.classList?.remove?.(
   'v80-3d-ready','v80-3d-loading','v80-2d-fallback','v170-model-error','v171-model-error','v172-model-error','v173-model-error'
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
  else canvas.dataset.v172Alexus='gothic-gown';
  canvas.setAttribute('aria-label',`${person} 3D model. Drag to rotate; swipe the page to scroll.`);
  canvas.style.cssText='display:block;width:100%;height:100%;touch-action:pan-y;background:transparent';
  node.appendChild(canvas);return canvas;
 }
 function validate(viewer,selected){
  if(!viewer?.model)throw Error(`${LABELS[selected]||'Character'} model did not load.`);
  if(viewer.hasNode?.(ROOT)===false)throw Error('The fitted model ROOT is missing.');
  const count=namedPartCount(viewer),minimum=selected==='armored'?40:selected==='alexus'?28:23;
  if(count&&count<minimum)throw Error(`Only ${count}/${minimum} fitted model parts loaded.`);
 }
 function applyBaseOrLord(viewer,selected){
  if(selected==='armored')return null;
  const map={};
  for(const node of named(viewer))map[node.name]=node.name===ROOT||selected==='lord'||node.name.startsWith(HUMAN_PREFIX);
  try{viewer.setNodesVisible?.(map)}catch(error){
   for(const[name,shown]of Object.entries(map))try{viewer.setNodeVisible?.(name,shown)}catch(_){ }
   console.warn?.('[Aetherion 1.72.3 Valkorion visibility]',error);
  }
  return map;
 }
 function applyCreator(viewer){
  if(!viewer?.model)return viewer;
  const creator=typeof S!=='undefined'?S?.v98?.creator:null,model=viewer.model;
  if(!creator||!model.scale?.set)return viewer;
  model.userData??={};model.userData.v171BaseScale??={x:model.scale.x,y:model.scale.y,z:model.scale.z};
  const base=model.userData.v171BaseScale,frame=Math.max(.90,Math.min(1.10,+creator.frame||1));
  const height=Math.max(.92,Math.min(1.08,+creator.height||1));
  model.scale.set(base.x*frame,base.y*height,base.z*frame);model.updateMatrixWorld?.(true);return viewer;
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
  // The Three.js URL loader uses fetch(), which Android WebView rejects for
  // file:///android_asset. Read the local GLB with XHR and parse its bytes.
  const bytes=await loadModelBytes(source,'valkorion');
  if(generation!==runtime.valkorion.generation)throw staleError('A newer wardrobe model was selected.');
  disposeLegacy();const canvas=freshCanvas(node,selected);
  const viewer=await api.createViewer({
   canvas,container:node,glb:bytes,resourcePath:'',proceduralFallback:false,framingNode:ROOT,
   modelHeight:4.2,maxPixelRatio:1.25,rotationEnabled:true,
   onWebGLFailure:error=>{runtime.valkorion.error=String(error?.message||error||'WebGL unavailable')},
   onError:error=>{runtime.valkorion.error=String(error?.message||error)}
  });
  // Three keeps its constructor options. Release the large source buffer after
  // GLTFLoader has built GPU resources so mobile memory does not stay doubled.
  try{if(viewer?.options?.glb===bytes)viewer.options.glb=null}catch(_){ }
  if(generation!==runtime.valkorion.generation){viewer.dispose?.();throw staleError('A newer wardrobe model was selected.');}
  validate(viewer,selected);viewer.setYaw?.(frontYaw(selected));viewer._v171Source=source;
  runtime.valkorion.viewer=viewer;runtime.valkorion.source=source;runtime.valkorion.mounts++;
  applyBaseOrLord(viewer,selected);applyCreator(viewer);viewer.render?.();
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
  runtime.valkorion.error=String(error?.message||error);if(!node)return;setStage(node,'v173-model-error');setHealth(node,'error',runtime.valkorion.error);
  try{
   node.replaceChildren();const box=document.createElement('div');box.className='v171-model-message';
   const title=document.createElement('b');title.textContent='3D ARMOR COULD NOT OPEN';
   const detail=document.createElement('span');detail.textContent=runtime.valkorion.error;
   const retry=document.createElement('span');retry.textContent='Close and reopen Equipment to retry.';
   box.append?.(title,detail,retry);
   node.appendChild(box);
  }catch(_){ }
  console.error?.('[Aetherion 1.72.3 Valkorion]',error);
 }
 async function syncValkorion(){
  if(!activeModelTab())return state();
  let node=valkorionHost();if(!node){runtime.valkorion.error='The Valkorion 3D mount is missing from this screen.';return state()}runtime.valkorion.lastHost=node;setStage(node,'v80-3d-loading');setHealth(node,'loading');
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
   viewer.attach?.(node);applyBaseOrLord(viewer,active);applyCreator(viewer);viewer.render?.();
   bindValkorionReset(node);setStage(node,'v80-3d-ready');runtime.valkorion.error=null;setHealth(node,'ready',`${namedPartCount(viewer)} fitted parts · ${LABELS[active]}`);
   try{if(typeof V80_RUNTIME!=='undefined'){V80_RUNTIME.mode='3d';V80_RUNTIME.failure=null}}catch(_){ }
   return viewer;
  }catch(error){if(error?.code==='AETHERION_STALE_MODEL'){scheduleValkorion();return runtime.valkorion.viewer}showValkorionError(valkorionHost()||node,error);return null}
 }
 function scheduleValkorion(){
  if(runtime.valkorion.scheduled)return null;runtime.valkorion.scheduled=true;
  const run=()=>{runtime.valkorion.scheduled=false;syncValkorion().catch(error=>showValkorionError(valkorionHost(),error))};
  return typeof requestAnimationFrame==='function'?requestAnimationFrame(run):setTimeout(run,0);
 }

 function normalize(value){return String(value||'').trim().toLowerCase()}
 function alexusPerson(id){
  const rows=typeof S!=='undefined'&&Array.isArray(S?.people)?S.people:[];
  return rows.find(person=>String(person?.id||'')===String(id||''))
   ||rows.find(person=>ALEXUS_IDS.has(String(person?.id||''))||normalize(person?.name)==='lady alexus dominus')
   ||null;
 }
 function isAlexus(id){
  const person=alexusPerson(id);return !!person||ALEXUS_IDS.has(String(id||''))||normalize(id)==='lady alexus dominus';
 }
 function tagAlexusModel(){
  const person=alexusPerson('party_alexus_dominus');if(!person)return;
  try{Object.defineProperty(person,'model3d',{value:MODELS.alexus,writable:true,configurable:true,enumerable:false})}
  catch(_){try{person.model3d=MODELS.alexus}catch(_){ }}
 }
 function disposeAlexus(){
  runtime.alexus.generation++;
  try{runtime.alexus.viewer?.dispose?.()}catch(_){ }
  runtime.alexus.viewer=null;runtime.alexus.loading=null;runtime.alexus.lastHost=null;
 }
 function modal(){return typeof document==='object'?document.querySelector?.('#modalRoot .modal'):null}
 function ensureAlexusCard(root){
  let card=root?.querySelector?.('[data-v172-alexus-model]');if(card)return card;
  card=document.createElement('section');card.className='v172-alexus-card';card.dataset.v172AlexusModel='true';
  card.innerHTML='<div class="v172-alexus-title"><div><b>Lady Alexus Dominus</b><span>Twin sister · gothic ball gown · fitted 3D model</span></div><button type="button" data-v172-alexus-front>Front</button></div><div class="v172-alexus-stage"><div class="v172-alexus-host"></div></div>';
  const header=root?.querySelector?.('.modalHeader');if(header?.after)header.after(card);else root?.prepend?.(card);
  const reset=card.querySelector?.('[data-v172-alexus-front]');reset?.addEventListener?.('click',event=>{
   event.preventDefault?.();runtime.alexus.viewer?.setYaw?.(Math.PI/2);
  });
  return card;
 }
 async function mountAlexus(){
  const root=modal();if(!root)return null;
  const description=String(root.textContent||root.innerHTML||'');if(!/Lady Alexus Dominus/i.test(description))return null;
  const card=ensureAlexusCard(root),host=card?.querySelector?.('.v172-alexus-host');if(!host)return null;
  runtime.alexus.lastHost=host;card.classList?.remove?.('v172-alexus-ready','v172-alexus-error');card.classList?.add?.('v172-alexus-loading');
  try{
   let viewer=runtime.alexus.viewer;
   if(!viewer){
    if(!runtime.alexus.loading){
     const generation=++runtime.alexus.generation;
     runtime.alexus.loading=(async()=>{
      // Keep mobile GPU memory bounded: retain only one large character viewer.
      disposeValkorion();
      const api=window.AetherionThree;
      if(!api?.createViewer)throw Error('The bundled 3D viewer is unavailable.');
      const bytes=await loadModelBytes(MODELS.alexus,'alexus');
      if(generation!==runtime.alexus.generation)throw staleError('Alexus model view was closed.');
      const canvas=freshCanvas(host,'alexus','Lady Alexus Dominus');
      const next=await api.createViewer({
       canvas,container:host,glb:bytes,resourcePath:'',proceduralFallback:false,framingNode:ROOT,
       modelHeight:4.15,maxPixelRatio:1.25,rotationEnabled:true,
       onWebGLFailure:error=>{runtime.alexus.error=String(error?.message||error||'WebGL unavailable')},
       onError:error=>{runtime.alexus.error=String(error?.message||error)}
      });
      try{if(next?.options?.glb===bytes)next.options.glb=null}catch(_){ }
      if(generation!==runtime.alexus.generation){next.dispose?.();throw staleError('Alexus model view was closed.');}
      validate(next,'alexus');next.setYaw?.(Math.PI/2);next._v172Alexus=true;runtime.alexus.viewer=next;runtime.alexus.mounts++;next.render?.();return next;
     })();
    }
    const pending=runtime.alexus.loading;
    try{viewer=await pending}finally{if(runtime.alexus.loading===pending)runtime.alexus.loading=null}
   }
   viewer.attach?.(host);viewer.render?.();
   card.classList?.remove?.('v172-alexus-loading','v172-alexus-error');card.classList?.add?.('v172-alexus-ready');runtime.alexus.error=null;return viewer;
  }catch(error){
   if(error?.code==='AETHERION_STALE_MODEL')return null;
   runtime.alexus.error=String(error?.message||error);card.classList?.remove?.('v172-alexus-loading');card.classList?.add?.('v172-alexus-error');
   const host=card?.querySelector?.('.v172-alexus-host');if(host)host.textContent='3D MODEL COULD NOT OPEN — close and reopen Alexus to retry.';
   console.error?.('[Aetherion 1.72.3 Alexus]',error);return null;
  }
 }
 function scheduleAlexus(){
  if(runtime.alexus.scheduled)return null;runtime.alexus.scheduled=true;
  const run=()=>{runtime.alexus.scheduled=false;mountAlexus().catch(error=>console.error?.('[Aetherion 1.72.3 Alexus mount]',error))};
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else setTimeout(run,0);
 }
 function wrapPersonViews(){
  if(runtime.wrapped)return;runtime.wrapped=true;
  try{
   if(typeof openPerson==='function'){
    const base=openPerson;openPerson=function(id,...args){const target=isAlexus(id),out=base.call(this,id,...args);if(target){tagAlexusModel();scheduleAlexus()}return out};
   }
  }catch(error){console.warn?.('[Aetherion 1.72.3 Alexus profile hook]',error)}
  try{
   if(typeof v16PersonEquipment==='function'){
    const base=v16PersonEquipment;v16PersonEquipment=function(id,...args){const target=isAlexus(id),out=base.call(this,id,...args);if(target){tagAlexusModel();scheduleAlexus()}return out};
   }
  }catch(error){console.warn?.('[Aetherion 1.72.3 Alexus equipment hook]',error)}
  try{
   if(typeof closeModal==='function'){
    const base=closeModal;closeModal=function(...args){
     const hadAlexus=!!runtime.alexus.viewer||!!runtime.alexus.loading;if(hadAlexus)disposeAlexus();
     const out=base.apply(this,args);if(hadAlexus&&activeModelTab())setTimeout(scheduleValkorion,0);return out;
    };
   }
  }catch(error){console.warn?.('[Aetherion 1.72.3 Alexus close hook]',error)}
 }
 function wrapGameRender(){
  if(runtime.renderWrapped)return true;
  try{
   if(typeof render!=='function')return false;
   if(render.__aetherionCharacterModelsV1723){runtime.renderWrapped=true;return true}
   const base=render;
   const wrapped=function(...args){
    const out=base.apply(this,args);
    if(activeModelTab())scheduleValkorion();
    return out;
   };
   wrapped.__aetherionCharacterModelsV1723=true;render=wrapped;runtime.renderWrapped=true;return true;
  }catch(error){console.warn?.('[Aetherion 1.72.3 render hook]',error);return false}
 }
 function installStyles(){
  if(typeof document!=='object'||document.getElementById?.('aetherion-v173-character-models'))return;
  const css=document.createElement('style');css.id='aetherion-v173-character-models';css.textContent=`
   .v80-stage{position:relative!important;contain:layout paint!important;overflow:hidden!important;isolation:isolate!important}
   .v80-stage .v80-valkorion-host{inset:6px 18px 70px!important;border-radius:10px;background:radial-gradient(circle at 50% 35%,#28161b 0,#090608 62%,#020102 100%)}
   .v80-stage canvas[data-v171-valkorion]{position:static!important;inset:auto!important;max-width:100%!important;max-height:100%!important;filter:drop-shadow(0 14px 24px #000b)}
   .v171-model-message{position:absolute;inset:20% 8%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:18px;border:1px solid #754845;border-radius:12px;background:#0b0709;color:#d9c9c3;text-align:center}
   .v171-model-message b{color:#dfbd6d}.v171-model-message span{font-size:.78rem}
   .v80-stage.v173-model-error .v80-valkorion-host{display:flex!important;opacity:1!important;visibility:visible!important;pointer-events:none!important}
   .v80-stage.v173-model-error .v80-fallback{opacity:0!important;visibility:hidden!important}
   .v80-stage.v173-model-error .v80-viewer-tools{display:none!important}
   .v173-character-stage{box-sizing:border-box;width:100%;height:min(64vh,720px);min-height:430px;border:1px solid #5f3d3e;border-radius:10px;background:radial-gradient(circle at 50% 34%,#28161b 0,#090608 62%,#020102 100%)}
   .v173-character-stage .v80-valkorion-host{inset:0!important}
   .v173-character-fallback,.v173-character-fallback img{display:block;width:100%;height:100%}.v173-character-fallback img{object-fit:cover;object-position:center top}
   .v173-model-health{position:absolute;z-index:42;left:9px;bottom:9px;max-width:calc(100% - 18px);padding:5px 8px;border:1px solid #67524a;border-radius:7px;background:#090709e8;color:#c9bbb4;font:700 10px/1.15 ui-monospace,monospace;letter-spacing:.03em;pointer-events:none}
   .v173-model-health.v173-model-ready{border-color:#526d58;color:#b9d0bd}.v173-model-health.v173-model-error{border-color:#8a4c50;color:#f0b5b8}.v173-model-health.v173-model-loading{color:#dbc789}
   .v172-alexus-card{margin:10px 0 16px;padding:10px;border:1px solid #70413e;border-radius:12px;background:#080507;overflow:hidden}
   .v172-alexus-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;color:#ead9d1}.v172-alexus-title div{display:flex;flex-direction:column;gap:2px}.v172-alexus-title b{color:#dfbd6d}.v172-alexus-title span{font-size:.72rem;color:#ad9893}.v172-alexus-title button{width:auto;padding:7px 12px}
   .v172-alexus-stage{height:min(62vh,560px);min-height:390px;border-radius:9px;overflow:hidden;background:radial-gradient(circle at 50% 32%,#28151e 0,#090609 62%,#020102 100%)}
   .v172-alexus-host,.v172-alexus-host canvas{display:block;width:100%;height:100%}.v172-alexus-host canvas{touch-action:pan-y;filter:drop-shadow(0 14px 24px #000b)}
   .v172-alexus-error .v172-alexus-host{display:flex;align-items:center;justify-content:center;padding:24px;color:#d9c9c3;text-align:center}
   body>canvas[data-v109-valkorion],body>canvas[data-v98-viewer],body>canvas[data-v170-valkorion]{display:none!important}
   html,body,button,a,input,select,textarea,[role="button"]{-webkit-tap-highlight-color:transparent!important}
   @media(max-width:520px){.v173-character-stage{height:min(62vh,620px);min-height:390px}.v173-model-health{font-size:9px}}
  `;document.head?.appendChild(css);
 }
 function state(){
  const selected=runtime.valkorion.mode||mode(),visible=named(runtime.valkorion.viewer).filter(node=>node.visible).map(node=>node.name);
  return{version:VERSION,androidBuild:ANDROID_BUILD,screen:typeof currentTab==='undefined'?null:currentTab,valkorion:{mode:selected,label:LABELS[selected],model:MODELS[selected],ready:!!runtime.valkorion.viewer,error:runtime.valkorion.error,parts:namedPartCount(runtime.valkorion.viewer),visible,mounts:runtime.valkorion.mounts,loaded:runtime.valkorion.loaded,total:runtime.valkorion.total,url:runtime.valkorion.url},alexus:{id:'party_alexus_dominus',name:'Lady Alexus Dominus',model:MODELS.alexus,ready:!!runtime.alexus.viewer,error:runtime.alexus.error,parts:namedPartCount(runtime.alexus.viewer),mounts:runtime.alexus.mounts,loaded:runtime.alexus.loaded,total:runtime.alexus.total,url:runtime.alexus.url}};
 }

 installStyles();tagAlexusModel();wrapPersonViews();wrapGameRender();disposeLegacy();
 try{
  // v80 is the viewer actually bundled in this APK. Wire it first. The older
  // v97/v98 globals only exist in some historical builds and must never abort
  // the live v80 hook when they are absent.
  if(typeof v80Sync==='function')v80Sync=syncValkorion;
  if(typeof v80ScheduleSync==='function')v80ScheduleSync=scheduleValkorion;
  if(typeof v97Sync==='function')v97Sync=syncValkorion;
  if(typeof v98Sync==='function')v98Sync=syncValkorion;
  if(typeof v98PlayerKind==='function')v98PlayerKind=playerKind;
  if(typeof v98ApplyCreator==='function')v98ApplyCreator=applyCreator;
 }catch(error){console.warn?.('[Aetherion 1.72.3 viewer hooks]',error)}
 const start=()=>{try{tagAlexusModel();wrapGameRender();if(activeModelTab())scheduleValkorion()}catch(error){console.warn?.('[Aetherion 1.72.3 start]',error)}};
 setTimeout(start,0);setTimeout(start,250);setTimeout(start,1000);
 window.AetherionCharacterModelsV172=Object.freeze({version:VERSION,androidBuild:ANDROID_BUILD,models:MODELS,labels:LABELS,mode,playerKind,ensureHost:valkorionHost,sync:syncValkorion,schedule:scheduleValkorion,mountAlexus,state});
})();
