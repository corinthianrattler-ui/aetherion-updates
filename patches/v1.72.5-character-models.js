/* Aetherion Reforged v1.72.5 — true per-slot character equipment models. */
'use strict';
(()=>{
 const VERSION='1.72.5';
 const ANDROID_BUILD=194;
 const MODEL_PATH='assets/v109/valkorion_final.glb';
 const MODEL_ROOT='VALKORION_FINAL';
 const ARMOR_ROOT='VALKORION_DOMINUS_ARMOR';
 const ALEXUS_BAKED_MODEL='assets/v172/alexus-gothic-gown.glb';
 const VISUAL_SLOTS=Object.freeze([
  'head','neck','underlayer','body','shoulders','hands','waist','legs','feet','cloak',
  'main','off','ranged','reserve','ammo','jewelry1','jewelry2'
 ]);
 const FOUNDATION=Object.freeze([
  'foundation__head','foundation__torso','foundation__arms','foundation__hands','foundation__legs','foundation__feet'
 ]);
 const GEAR_NODES=Object.freeze([
  'SLOT_HELMET','SLOT_GORGET','SLOT_PAULDRONS','SLOT_CUIRASS','SLOT_UNDERCOAT',
  'SLOT_GAUNTLETS','SLOT_BELT','SLOT_TROUSERS','SLOT_GREAVES','SLOT_BOOTS','SLOT_CLOAK',
  'SLOT_SCABBARD','gear__royal_head','gear__royal_underlayer','gear__royal_body',
  'gear__royal_shoulders','gear__royal_hands','gear__royal_waist','gear__royal_legs',
  'gear__royal_feet','gear__royal_cloak','gear__royal_jewelry','gear__dominus_bow',
  'gear__dominus_kite_shield','gear__dominus_dagger','gear__dominus_sword',
  'gear__dominus_quiver','gear__dominus_thorn_whip','gear__dominus_signet'
 ]);
 const RULES=Object.freeze([
  {key:'armor-head',slots:['head'],items:['dominus_lord_helm','v98_dominus_head'],nodes:['SLOT_HELMET']},
  {key:'armor-neck',slots:['neck'],items:['dominus_gorget'],nodes:['SLOT_GORGET']},
  {key:'armor-underlayer',slots:['underlayer'],items:['dominus_arming_doublet'],nodes:['SLOT_UNDERCOAT']},
  {key:'armor-body',slots:['body'],items:['dominus_cuirass','v98_dominus_body'],nodes:['SLOT_CUIRASS']},
  {key:'armor-shoulders',slots:['shoulders'],items:['dominus_pauldrons','v98_dominus_shoulders'],nodes:['SLOT_PAULDRONS']},
  {key:'armor-hands',slots:['hands'],items:['dominus_gauntlets','v98_dominus_hands'],nodes:['SLOT_GAUNTLETS']},
  {key:'armor-waist',slots:['waist'],items:['dominus_belt','v98_dominus_waist'],nodes:['SLOT_BELT']},
  {key:'armor-legs',slots:['legs'],items:['dominus_legplates','v98_dominus_legs'],nodes:['SLOT_TROUSERS','SLOT_GREAVES']},
  {key:'armor-feet',slots:['feet'],items:['dominus_boots','v98_dominus_feet'],nodes:['SLOT_BOOTS']},
  {key:'armor-cloak',slots:['cloak'],items:['dominus_cloak','v98_dominus_cloak'],nodes:['SLOT_CLOAK']},
  {key:'royal-head',slots:['head'],items:['v98_royal_m_head','v38_valkorion_court_circlet'],nodes:['gear__royal_head']},
  {key:'royal-underlayer',slots:['neck','underlayer'],items:['v38_valkorion_silk_cravat','v98_royal_m_underlayer','v38_valkorion_lord_shirt'],nodes:['gear__royal_underlayer']},
  {key:'royal-body',slots:['body'],items:['v98_royal_m_body','v38_valkorion_formal_overcoat'],nodes:['gear__royal_body']},
  {key:'royal-shoulders',slots:['shoulders'],items:['v98_royal_m_shoulders','v38_valkorion_rose_shouldercape'],nodes:['gear__royal_shoulders']},
  {key:'royal-hands',slots:['hands'],items:['v98_royal_m_hands','v38_valkorion_formal_gloves'],nodes:['gear__royal_hands']},
  {key:'royal-waist',slots:['waist'],items:['v98_royal_m_waist','v38_valkorion_court_swordbelt'],nodes:['gear__royal_waist']},
  {key:'royal-legs',slots:['legs'],items:['v98_royal_m_legs','v38_valkorion_formal_trousers'],nodes:['gear__royal_legs']},
  {key:'royal-feet',slots:['feet'],items:['v98_royal_m_feet','v38_valkorion_lord_boots'],nodes:['gear__royal_feet']},
  {key:'royal-cloak',slots:['cloak'],items:['v98_royal_m_cloak','v38_valkorion_night_rose_cloak'],nodes:['gear__royal_cloak']},
  {key:'main-sword',slots:['main'],items:['dominus_sword'],nodes:['gear__dominus_sword','SLOT_SCABBARD']},
  {key:'off-shield',slots:['off'],items:['dominus_kite_shield'],nodes:['gear__dominus_kite_shield']},
  {key:'off-whip',slots:['off'],items:['dominus_thorn_whip'],nodes:['gear__dominus_thorn_whip']},
  {key:'ranged-bow',slots:['ranged'],items:['dominus_bow'],nodes:['gear__dominus_bow']},
  {key:'reserve-dagger',slots:['reserve'],items:['dominus_dagger'],nodes:['gear__dominus_dagger']},
  {key:'ammo-quiver',slots:['ammo'],items:['dominus_quiver'],nodes:['gear__dominus_quiver']},
  {key:'royal-jewelry',slots:['jewelry1','jewelry2'],items:['v98_royal_m_jewelry'],nodes:['gear__royal_jewelry']},
  {key:'dominus-signet',slots:['jewelry1','jewelry2'],items:['dominus_signet'],nodes:['gear__dominus_signet']}
 ]);
 const MODEL_DEFINITION=Object.freeze({
  id:'valkorion',name:'Valkorion Dominus',model:MODEL_PATH,root:MODEL_ROOT,
  roots:Object.freeze([MODEL_ROOT,ARMOR_ROOT]),foundation:FOUNDATION,gearNodes:GEAR_NODES,
  slots:VISUAL_SLOTS,rules:RULES,complete:true
 });
 const registry=new Map();
 const runtime={
  viewer:null,loading:null,error:null,mounts:0,generation:0,scheduled:false,lastHost:null,
  loaded:0,total:0,url:null,lastMap:null,lastUnsupported:[],renderWrapped:false
 };

 if(window.AetherionCharacterModelsV172?.version===VERSION)return;

 function freezeDefinition(input){
  if(!input||typeof input!=='object')throw Error('A modular model definition is required.');
  const id=String(input.id||'');
  if(!/^[a-z0-9_-]{2,60}$/i.test(id))throw Error('The modular model id is invalid.');
  if(!String(input.model||'').endsWith('.glb'))throw Error(`${id}: a local GLB model is required.`);
  const slots=[...new Set((input.slots||[]).map(String))];
  const missing=VISUAL_SLOTS.filter(slot=>!slots.includes(slot));
  if(input.complete!==true||missing.length)throw Error(`${id}: baked or partial models are rejected; missing independent slots: ${missing.join(', ')||'model not certified complete'}.`);
  const gearNodes=[...new Set((input.gearNodes||[]).map(String))];
  const owned=new Map(),covered=new Set();
  for(const rule of input.rules||[]){
   if(!rule?.key||!Array.isArray(rule.slots)||!Array.isArray(rule.items)||!Array.isArray(rule.nodes))throw Error(`${id}: invalid slot rule.`);
   for(const slot of rule.slots){if(!VISUAL_SLOTS.includes(slot))throw Error(`${id}: unknown equipment slot ${slot}.`);covered.add(slot)}
   for(const node of rule.nodes){
    if(!gearNodes.includes(node))throw Error(`${id}: ${node} is not declared as equipment geometry.`);
    if(owned.has(node))throw Error(`${id}: ${node} is shared by ${owned.get(node)} and ${rule.key}; pieces must be independent.`);
    owned.set(node,rule.key);
   }
  }
  const unowned=gearNodes.filter(node=>!owned.has(node));
  if(unowned.length)throw Error(`${id}: unassigned equipment geometry: ${unowned.join(', ')}.`);
  const uncovered=VISUAL_SLOTS.filter(slot=>!covered.has(slot));
  if(uncovered.length)throw Error(`${id}: no independent mapping for slots: ${uncovered.join(', ')}.`);
  return Object.freeze({...input,slots:Object.freeze(slots),gearNodes:Object.freeze(gearNodes),rules:Object.freeze([...input.rules])});
 }
 function register(input){
  const definition=freezeDefinition(input);
  registry.set(definition.id,definition);return definition;
 }
 register(MODEL_DEFINITION);

 function value(gear,slot){return String(gear?.[slot]||'')}
 function ruleShown(rule,gear){
  return rule.slots.some(slot=>rule.items.includes(value(gear,slot)));
 }
 function visibility(gear={}){
  const map={};
  for(const node of MODEL_DEFINITION.roots)map[node]=true;
  for(const node of FOUNDATION)map[node]=true;
  for(const node of GEAR_NODES)map[node]=false;
  for(const rule of RULES)if(ruleShown(rule,gear))for(const node of rule.nodes)map[node]=true;
  map['foundation__head']=!map.SLOT_HELMET;
  map['foundation__torso']=!(map.SLOT_UNDERCOAT||map.SLOT_CUIRASS||map.gear__royal_body);
  map['foundation__arms']=!(map.SLOT_UNDERCOAT||map.gear__royal_shoulders);
  map['foundation__hands']=!(map.SLOT_GAUNTLETS||map.gear__royal_hands);
  map['foundation__legs']=!map.gear__royal_legs;
  map['foundation__feet']=!(map.SLOT_BOOTS||map.gear__royal_feet);
  return map;
 }
 function unsupported(gear={}){
  return VISUAL_SLOTS.filter(slot=>{
   const id=value(gear,slot);if(!id)return false;
   return !RULES.some(rule=>rule.slots.includes(slot)&&rule.items.includes(id));
  }).map(slot=>({slot,item:value(gear,slot)}));
 }
 function equipment(){return typeof S!=='undefined'?(S?.player?.equipment||{}):{}}
 function mode(state=typeof S!=='undefined'?S:null){
  const gear=state?.player?.equipment||{},shown=RULES.filter(rule=>ruleShown(rule,gear)).map(rule=>rule.key);
  const armor=shown.some(key=>key.startsWith('armor-')),royal=shown.some(key=>key.startsWith('royal-'));
  if(armor&&royal)return'mixed';if(armor)return'armored';if(royal)return'lord';return'foundation';
 }
 function playerKind(){const selected=mode();return selected==='foundation'?'foundation':selected==='lord'?'royal_male':'knight'}
 function bundledContext(){
  const protocol=String(globalThis.location?.protocol||'').toLowerCase();
  const host=String(globalThis.location?.hostname||'').toLowerCase();
  return protocol==='file:'||host==='appassets.androidplatform.net';
 }
 function asset(path){return bundledContext()?path:(window.AetherionUpdater?.asset?.(path)||path)}
 function assetUrl(path){try{return new URL(String(path||''),document.baseURI||globalThis.location?.href).href}catch(_){return String(path||'')}}
 function checkGlb(buffer,path){
  if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<20)throw Error(`The packaged model is empty: ${path}`);
  const view=new DataView(buffer),magic=view.getUint32(0,true),version=view.getUint32(4,true),declared=view.getUint32(8,true);
  if(magic!==0x46546c67||version!==2||declared!==buffer.byteLength)throw Error(`The packaged model is not a complete GLB: ${path}`);
  return buffer;
 }
 function loadModelBytes(path){
  if(typeof XMLHttpRequest!=='function')return Promise.reject(Error('This WebView has no local model reader.'));
  const url=assetUrl(asset(path));runtime.loaded=0;runtime.total=0;runtime.url=url;
  return new Promise((resolve,reject)=>{
   const request=new XMLHttpRequest();let settled=false;
   const fail=message=>{if(settled)return;settled=true;reject(Error(`${message}: ${path}`))};
   request.open('GET',url,true);request.responseType='arraybuffer';request.timeout=120000;
   request.onprogress=event=>{runtime.loaded=Math.max(0,+event.loaded||0);runtime.total=Math.max(0,+event.total||0)};
   request.onerror=()=>fail('Android could not read the packaged model');request.onabort=()=>fail('The packaged model read was interrupted');request.ontimeout=()=>fail('The packaged model took too long to read');
   request.onload=()=>{
    if(settled)return;const status=Number(request.status)||0;
    if(status!==0&&(status<200||status>=300))return fail(`The packaged model returned ${status}`);
    try{const bytes=checkGlb(request.response,path);runtime.loaded=bytes.byteLength;runtime.total=bytes.byteLength;settled=true;resolve(bytes)}catch(error){settled=true;reject(error)}
   };
   try{request.send()}catch(error){fail(String(error?.message||error||'The packaged model could not be opened'))}
  });
 }
 let threeRuntimePromise=null;
 function loadThreeRuntime(){
  if(window.AetherionThree?.createViewer)return Promise.resolve(window.AetherionThree);
  if(threeRuntimePromise)return threeRuntimePromise;
  threeRuntimePromise=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.async=true;script.dataset.aetherionThreeRuntime='true';
   script.src=new URL('aetherion-three.min.js?v=1.57.0',document.baseURI||globalThis.location?.href).href;
   script.onload=()=>window.AetherionThree?.createViewer?resolve(window.AetherionThree):reject(Error('The bundled 3D viewer loaded without its API.'));
   script.onerror=()=>{threeRuntimePromise=null;reject(Error('The bundled 3D viewer could not be read.'))};
   (document.head||document.documentElement).appendChild(script);
  });return threeRuntimePromise;
 }
 function activeModelTab(){return typeof currentTab==='undefined'||currentTab==='equipment'||currentTab==='character'}
 function toolMarkup(){
  const tools=document.createElement('div');tools.className='v80-viewer-tools';tools.dataset.v80Tools='true';tools.setAttribute('aria-hidden','true');
  const hint=document.createElement('span');hint.className='v80-rotate-hint';hint.textContent='Drag to rotate · every equipped piece is independent';
  const reset=document.createElement('button');reset.className='v80-reset-view';reset.type='button';reset.dataset.v80ResetView='true';reset.setAttribute('aria-label','Reset Valkorion to front view');reset.textContent='Front';
  tools.append(hint,reset);return tools;
 }
 function hostNode(){
  const node=document.createElement('div');node.className='v80-valkorion-host';node.dataset.v80Valkorion='true';node.dataset.v175Valkorion='true';node.setAttribute('role','img');node.setAttribute('aria-label','Interactive three-dimensional Valkorion model with independently equipped pieces.');return node;
 }
 function stageOf(node){return node?.closest?.('.v80-stage')||node?.parentElement||null}
 function healthBadge(stage){
  let badge=stage?.querySelector?.('[data-v173-model-health]');if(badge)return badge;
  badge=document.createElement('div');badge.className='v173-model-health v173-model-check';badge.dataset.v173ModelHealth='true';badge.textContent=`BUILD ${ANDROID_BUILD} · MODULAR CHECK`;stage?.appendChild?.(badge);return badge;
 }
 function setHealth(node,status,detail=''){
  const badge=healthBadge(stageOf(node));if(!badge)return;
  badge.classList.remove('v173-model-check','v173-model-loading','v173-model-ready','v173-model-error');badge.classList.add(`v173-model-${status}`);
  badge.textContent=`BUILD ${ANDROID_BUILD} · ${status==='ready'?'17-SLOT READY':status.toUpperCase()}`;badge.title=String(detail||'');badge.setAttribute('aria-label',detail?`${badge.textContent}: ${detail}`:badge.textContent);
 }
 function tagHost(node){if(!node)return null;node.dataset.v175Valkorion='true';healthBadge(stageOf(node));return node}
 function equipmentHost(){
  const panel=document.querySelector?.('.v38-equipment-panel');if(!panel)return null;
  const existing=panel.querySelector?.('[data-v80-valkorion]');if(existing)return tagHost(existing);
  const stage=panel.querySelector?.('.v78-stage,.v40-stage,.v38-doll-frame');if(!stage)return null;
  stage.classList?.add?.('v80-stage','v175-modular-stage');
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
  const existing=panel.querySelector?.('[data-v175-valkorion]');if(existing)return tagHost(existing);
  const image=panel.querySelector?.('.detailGrid .bigPic,.v38-character-grid .v78-valkorion,.v38-character-grid .v38-paperdoll');if(!image)return null;
  const stage=document.createElement('div');stage.className='v80-stage v173-character-stage v175-modular-stage';
  const node=hostNode(),tools=toolMarkup(),fallback=document.createElement('div');fallback.className='v80-fallback v173-character-fallback';
  image.replaceWith?.(stage);fallback.appendChild(image);stage.append(node,tools,fallback);healthBadge(stage);return node;
 }
 function valkorionHost(){
  if(typeof document!=='object'||!document?.querySelector)return null;
  return equipmentHost()||characterHost()||(typeof v98PlayerHost==='function'?tagHost(v98PlayerHost()):null);
 }
 function setStage(node,state){
  const stage=stageOf(node);if(!stage)return;
  stage.classList?.remove?.('v80-3d-ready','v80-3d-loading','v80-2d-fallback','v170-model-error','v171-model-error','v172-model-error','v173-model-error');stage.classList?.add?.(state);
 }
 function named(viewer){return viewer?.getNamedNodes?.().filter?.(node=>node?.name)||[]}
 function validate(viewer){
  if(!viewer?.model)throw Error('The modular Valkorion model did not load.');
  const available=new Set(named(viewer).map(node=>node.name));
  const required=[...MODEL_DEFINITION.roots,...FOUNDATION,...GEAR_NODES],missing=required.filter(node=>!available.has(node));
  if(missing.length)throw Error(`The model is not independently equipped; missing groups: ${missing.slice(0,4).join(', ')}${missing.length>4?'…':''}`);
 }
 function applyVisibility(viewer,gear=equipment()){
  const map=visibility(gear);runtime.lastMap=map;runtime.lastUnsupported=unsupported(gear);
  try{viewer.setNodesVisible?.(map)}catch(error){for(const[name,shown]of Object.entries(map))try{viewer.setNodeVisible?.(name,shown)}catch(_){ }console.warn?.('[Aetherion 1.72.5 slot visibility]',error)}
  viewer.render?.();return map;
 }
 function applyCreator(viewer){
  if(!viewer?.model)return viewer;const creator=typeof S!=='undefined'?S?.v98?.creator:null,model=viewer.model;if(!creator||!model.scale?.set)return viewer;
  model.userData??={};model.userData.v175BaseScale??={x:model.scale.x,y:model.scale.y,z:model.scale.z};
  const base=model.userData.v175BaseScale,frame=Math.max(.90,Math.min(1.10,+creator.frame||1)),height=Math.max(.92,Math.min(1.08,+creator.height||1));
  model.scale.set(base.x*frame,base.y*height,base.z*frame);model.updateMatrixWorld?.(true);return viewer;
 }
 function disposeLegacy(){
  try{if(typeof V80_RUNTIME!=='undefined'&&V80_RUNTIME?.viewer&&V80_RUNTIME.viewer!==runtime.viewer){V80_RUNTIME.viewer.dispose?.();V80_RUNTIME.viewer=null;V80_RUNTIME.canvas=null;V80_RUNTIME.initializing=null}}catch(_){ }
  try{if(typeof V98_PLAYER!=='undefined'&&V98_PLAYER?.viewer&&V98_PLAYER.viewer!==runtime.viewer){V98_PLAYER.viewer.dispose?.();V98_PLAYER.viewer=null;V98_PLAYER.pending=false}}catch(_){ }
 }
 function freshCanvas(node){
  node.replaceChildren();const canvas=document.createElement('canvas');canvas.dataset.v175Valkorion='modular';canvas.setAttribute('aria-label','Valkorion modular equipment model. Drag to rotate.');canvas.style.cssText='display:block;width:100%;height:100%;touch-action:pan-y;background:transparent';node.appendChild(canvas);return canvas;
 }
 async function createViewer(node,generation){
  const api=await loadThreeRuntime();if(!api?.createViewer)throw Error('The bundled 3D viewer is unavailable.');
  const bytes=await loadModelBytes(MODEL_PATH);if(generation!==runtime.generation)throw Error('The equipment view changed while loading.');
  disposeLegacy();const canvas=freshCanvas(node);
  const viewer=await api.createViewer({canvas,container:node,glb:bytes,resourcePath:'',proceduralFallback:false,framingNode:MODEL_ROOT,modelHeight:4.15,maxPixelRatio:1.25,rotationEnabled:true,onWebGLFailure:error=>{runtime.error=String(error?.message||error||'WebGL unavailable')},onError:error=>{runtime.error=String(error?.message||error)}});
  try{if(viewer?.options?.glb===bytes)viewer.options.glb=null}catch(_){ }
  if(generation!==runtime.generation){viewer.dispose?.();throw Error('The equipment view changed while loading.');}
  validate(viewer);viewer.setYaw?.(0);viewer._v175Modular=true;runtime.viewer=viewer;runtime.mounts++;applyVisibility(viewer);applyCreator(viewer);
  try{if(typeof V80_RUNTIME!=='undefined'){V80_RUNTIME.viewer=viewer;V80_RUNTIME.canvas=canvas;V80_RUNTIME.viewerCount=1;V80_RUNTIME.canvasCount=1;V80_RUNTIME.mountCount=(V80_RUNTIME.mountCount||0)+1}}catch(_){ }
  try{if(typeof V98_PLAYER!=='undefined'){V98_PLAYER.viewer=viewer;V98_PLAYER.kind='valkorion_v175_modular';V98_PLAYER.pending=false}}catch(_){ }
  return viewer;
 }
 function showError(node,error){
  runtime.error=String(error?.message||error);if(!node)return;setStage(node,'v173-model-error');setHealth(node,'error',runtime.error);
  try{node.replaceChildren();const box=document.createElement('div');box.className='v171-model-message';const title=document.createElement('b');title.textContent='MODULAR MODEL COULD NOT OPEN';const detail=document.createElement('span');detail.textContent=runtime.error;box.append(title,detail);node.appendChild(box)}catch(_){ }
  console.error?.('[Aetherion 1.72.5 modular model]',error);
 }
 function bindReset(node){
  const button=stageOf(node)?.querySelector?.('[data-v80-reset-view]');if(!button||button.dataset.v175Bound==='true')return;
  button.dataset.v175Bound='true';button.addEventListener?.('click',event=>{event.preventDefault?.();runtime.viewer?.setYaw?.(0)});
 }
 async function sync(){
  if(!activeModelTab())return state();let node=valkorionHost();if(!node){runtime.error='The Valkorion model mount is missing from this screen.';return state()}
  runtime.lastHost=node;setStage(node,'v80-3d-loading');setHealth(node,'loading');
  try{
   let viewer=runtime.viewer;
   if(viewer&&!viewer._v175Modular){try{viewer.dispose?.()}catch(_){ }viewer=null;runtime.viewer=null}
   if(!viewer){if(!runtime.loading){const generation=++runtime.generation;runtime.loading=createViewer(node,generation)}const pending=runtime.loading;try{viewer=await pending}finally{if(runtime.loading===pending)runtime.loading=null}}
   node=valkorionHost()||node;viewer.attach?.(node);applyVisibility(viewer);applyCreator(viewer);viewer.render?.();bindReset(node);
   setStage(node,'v80-3d-ready');runtime.error=null;
   const visibleGear=GEAR_NODES.filter(name=>runtime.lastMap?.[name]).length,unmapped=runtime.lastUnsupported.length;
   setHealth(node,'ready',`${visibleGear} fitted pieces visible${unmapped?` · ${unmapped} equipped item${unmapped===1?'':'s'} use inventory art only`:''}`);
   try{if(typeof V80_RUNTIME!=='undefined'){V80_RUNTIME.mode='3d';V80_RUNTIME.failure=null}}catch(_){ }
   return viewer;
  }catch(error){runtime.viewer=null;runtime.loading=null;showError(valkorionHost()||node,error);return null}
 }
 function schedule(){
  if(runtime.scheduled)return null;runtime.scheduled=true;const run=()=>{runtime.scheduled=false;sync().catch(error=>showError(valkorionHost(),error))};
  return typeof requestAnimationFrame==='function'?requestAnimationFrame(run):setTimeout(run,0);
 }
 function retireBakedSisterModel(){
  if(typeof S==='undefined'||!Array.isArray(S?.people))return;
  const alexus=S.people.find(person=>['party_alexus_dominus','dyn_alexus','alexus'].includes(String(person?.id||''))||String(person?.name||'').trim().toLowerCase()==='lady alexus dominus');if(!alexus)return;
  try{if(alexus.model3d===ALEXUS_BAKED_MODEL)delete alexus.model3d}catch(_){ }
  try{Object.defineProperty(alexus,'model3dPolicy',{value:'2D equipment view retained until every fitted slot has independent geometry',configurable:true,enumerable:false})}catch(_){ }
 }
 function wrapGameRender(){
  if(runtime.renderWrapped)return true;
  try{
   if(typeof render!=='function')return false;if(render.__aetherionCharacterModelsV175){runtime.renderWrapped=true;return true}
   const base=render;const wrapped=function(...args){const out=base.apply(this,args);retireBakedSisterModel();if(activeModelTab())schedule();return out};wrapped.__aetherionCharacterModelsV175=true;render=wrapped;runtime.renderWrapped=true;return true;
  }catch(error){console.warn?.('[Aetherion 1.72.5 render hook]',error);return false}
 }
 function installStyles(){
  if(typeof document!=='object'||document.getElementById?.('aetherion-v175-character-models'))return;
  const css=document.createElement('style');css.id='aetherion-v175-character-models';css.textContent=`
   .v80-stage{position:relative!important;contain:layout paint!important;overflow:hidden!important;isolation:isolate!important}
   .v80-stage .v80-valkorion-host{inset:6px 18px 70px!important;border-radius:10px;background:radial-gradient(circle at 50% 35%,#28161b 0,#090608 62%,#020102 100%)}
   .v80-stage canvas[data-v175-valkorion]{position:static!important;inset:auto!important;max-width:100%!important;max-height:100%!important;filter:drop-shadow(0 14px 24px #000b)}
   .v171-model-message{position:absolute;inset:20% 8%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:18px;border:1px solid #754845;border-radius:12px;background:#0b0709;color:#d9c9c3;text-align:center}.v171-model-message b{color:#dfbd6d}.v171-model-message span{font-size:.78rem}
   .v80-stage.v173-model-error .v80-valkorion-host{display:flex!important;opacity:1!important;visibility:visible!important;pointer-events:none!important}.v80-stage.v173-model-error .v80-fallback{opacity:0!important;visibility:hidden!important}.v80-stage.v173-model-error .v80-viewer-tools{display:none!important}
   .v173-character-stage{box-sizing:border-box;width:100%;height:min(64vh,720px);min-height:430px;border:1px solid #5f3d3e;border-radius:10px;background:radial-gradient(circle at 50% 34%,#28161b 0,#090608 62%,#020102 100%)}.v173-character-stage .v80-valkorion-host{inset:0!important}.v173-character-fallback,.v173-character-fallback img{display:block;width:100%;height:100%}.v173-character-fallback img{object-fit:cover;object-position:center top}
   .v173-model-health{position:absolute;z-index:42;left:9px;bottom:9px;max-width:calc(100% - 18px);padding:5px 8px;border:1px solid #67524a;border-radius:7px;background:#090709e8;color:#c9bbb4;font:700 10px/1.15 ui-monospace,monospace;letter-spacing:.03em;pointer-events:none}.v173-model-health.v173-model-ready{border-color:#526d58;color:#b9d0bd}.v173-model-health.v173-model-error{border-color:#8a4c50;color:#f0b5b8}.v173-model-health.v173-model-loading{color:#dbc789}
   body>canvas[data-v109-valkorion],body>canvas[data-v98-viewer],body>canvas[data-v170-valkorion]{display:none!important}html,body,button,a,input,select,textarea,[role="button"]{-webkit-tap-highlight-color:transparent!important}
   @media(max-width:520px){.v173-character-stage{height:min(62vh,620px);min-height:390px}.v173-model-health{font-size:9px}}
  `;document.head?.appendChild(css);
 }
 function state(){
  const gear=equipment(),map=runtime.lastMap||visibility(gear),visible=Object.keys(map).filter(name=>map[name]);
  return{version:VERSION,androidBuild:ANDROID_BUILD,model:MODEL_PATH,mode:mode(),ready:!!runtime.viewer,error:runtime.error,mounts:runtime.mounts,loaded:runtime.loaded,total:runtime.total,url:runtime.url,slots:[...VISUAL_SLOTS],visible,unsupported:unsupported(gear),alexus:{model:null,legacyModelRejected:ALEXUS_BAKED_MODEL,reason:'The supplied gown is a baked partial outfit, so the working 2D equipment view remains active until a complete modular model exists.'}};
 }

 installStyles();retireBakedSisterModel();wrapGameRender();disposeLegacy();
 try{if(typeof v80Sync==='function')v80Sync=sync;if(typeof v80ScheduleSync==='function')v80ScheduleSync=schedule;if(typeof v97Sync==='function')v97Sync=sync;if(typeof v98Sync==='function')v98Sync=sync;if(typeof v98PlayerKind==='function')v98PlayerKind=playerKind;if(typeof v98ApplyCreator==='function')v98ApplyCreator=applyCreator}catch(error){console.warn?.('[Aetherion 1.72.5 viewer hooks]',error)}
 const start=()=>{try{retireBakedSisterModel();wrapGameRender();if(activeModelTab())schedule()}catch(error){console.warn?.('[Aetherion 1.72.5 start]',error)}};setTimeout(start,0);setTimeout(start,250);setTimeout(start,1000);
 const api=Object.freeze({version:VERSION,androidBuild:ANDROID_BUILD,models:Object.freeze({valkorion:MODEL_PATH,alexus:null}),mode,playerKind,visibility,unsupported,register,get:id=>registry.get(String(id))||null,list:()=>Array.from(registry.keys()),ensureHost:valkorionHost,sync,schedule,state});
 window.AetherionModularModelsV175=api;window.AetherionCharacterModelsV172=api;
})();
