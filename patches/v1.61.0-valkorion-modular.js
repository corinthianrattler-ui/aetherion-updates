/* Aetherion Reforged v1.61.0 — intact Valkorion body and fitted modular equipment. */
'use strict';
(()=>{
 const VERSION='1.61.0';
 const MODEL_PATH='assets/v107/valkorion_modular.glb';
 const FOUNDATION=Object.freeze([
  'foundation__head','foundation__torso','foundation__arms','foundation__hands','foundation__legs','foundation__feet'
 ]);
 const GEAR_NODES=Object.freeze([
  'gear__dominus_lord_helm','gear__dominus_gorget','gear__dominus_pauldrons','gear__dominus_cuirass',
  'gear__dominus_arming_doublet','gear__dominus_gauntlets','gear__dominus_belt','gear__dominus_legplates',
  'gear__dominus_boots','gear__dominus_cloak','gear__royal_head','gear__royal_underlayer','gear__royal_body',
  'gear__royal_shoulders','gear__royal_hands','gear__royal_waist','gear__royal_legs','gear__royal_feet',
  'gear__royal_cloak','gear__dominus_bow','gear__dominus_kite_shield','gear__dominus_dagger',
  'gear__dominus_sword','gear__dominus_quiver','gear__dominus_thorn_whip','gear__royal_jewelry',
  'gear__dominus_signet'
 ]);
 const ARMOR=Object.freeze({
  head:['dominus_lord_helm','gear__dominus_lord_helm'],
  neck:['dominus_gorget','gear__dominus_gorget'],
  underlayer:['dominus_arming_doublet','gear__dominus_arming_doublet'],
  body:['dominus_cuirass','gear__dominus_cuirass'],
  shoulders:['dominus_pauldrons','gear__dominus_pauldrons'],
  hands:['dominus_gauntlets','gear__dominus_gauntlets'],
  waist:['dominus_belt','gear__dominus_belt'],
  legs:['dominus_legplates','gear__dominus_legplates'],
  feet:['dominus_boots','gear__dominus_boots'],
  cloak:['dominus_cloak','gear__dominus_cloak']
 });
 const HOUSE_KEYS=new Set(['dominus','white_harbor','highwatch','grimhorn','stonevein','corvinus','eternal_glades','solaris','lorien','winterhold']);
 const ROYAL=Object.freeze({
  head:[new Set(['v98_royal_m_head','v38_valkorion_court_circlet']),'gear__royal_head'],
  underlayer:[new Set(['v98_royal_m_underlayer','v38_valkorion_lord_shirt']),'gear__royal_underlayer'],
  body:[new Set(['v98_royal_m_body','v38_valkorion_formal_overcoat']),'gear__royal_body'],
  shoulders:[new Set(['v98_royal_m_shoulders','v38_valkorion_rose_shouldercape']),'gear__royal_shoulders'],
  hands:[new Set(['v98_royal_m_hands','v38_valkorion_formal_gloves']),'gear__royal_hands'],
  waist:[new Set(['v98_royal_m_waist','v38_valkorion_court_swordbelt']),'gear__royal_waist'],
  legs:[new Set(['v98_royal_m_legs','v38_valkorion_formal_trousers']),'gear__royal_legs'],
  feet:[new Set(['v98_royal_m_feet','v38_valkorion_lord_boots']),'gear__royal_feet'],
  cloak:[new Set(['v98_royal_m_cloak','v38_valkorion_night_rose_cloak']),'gear__royal_cloak']
 });
 const ART=Object.freeze({
  head:'assets/items/dominus_lord_helm.webp',neck:'assets/items/dominus_gorget.webp',
  underlayer:'assets/items/dominus_arming_doublet.webp',body:'assets/items/dominus_cuirass.webp',
  shoulders:'assets/items/dominus_pauldrons.webp',hands:'assets/items/dominus_gauntlets.webp',
  waist:'assets/items/dominus_belt.webp',legs:'assets/items/dominus_legplates.webp',
  feet:'assets/items/dominus_boots.webp',cloak:'assets/items/dominus_cloak.webp',
  main:'assets/items/dominus_sword.webp',reserve:'assets/items/dominus_dagger.webp',
  ranged:'assets/items/dominus_bow.webp',ammo:'assets/items/dominus_quiver.webp',
  off:'assets/items/dominus_kite_shield.webp',whip:'assets/items/dominus_thorn_whip.webp',
  jewelry:'assets/items/dominus_signet.webp'
 });
 const ART_ITEMS=Object.freeze({
  dominus_lord_helm:'head',dominus_gorget:'neck',dominus_arming_doublet:'underlayer',dominus_cuirass:'body',
  dominus_pauldrons:'shoulders',dominus_gauntlets:'hands',dominus_belt:'waist',dominus_legplates:'legs',
  dominus_boots:'feet',dominus_cloak:'cloak',dominus_sword:'main',dominus_dagger:'reserve',
  dominus_bow:'ranged',dominus_quiver:'ammo',dominus_kite_shield:'off',dominus_thorn_whip:'whip',
  dominus_signet:'jewelry',v98_royal_m_head:'head',v98_royal_m_underlayer:'underlayer',
  v98_royal_m_body:'body',v98_royal_m_shoulders:'shoulders',v98_royal_m_hands:'hands',
  v98_royal_m_waist:'waist',v98_royal_m_legs:'legs',v98_royal_m_feet:'feet',
  v98_royal_m_cloak:'cloak',v98_royal_m_jewelry:'jewelry'
 });
 const runtime={loading:null,lastMap:null,lastError:null};

 function value(gear,slot){return String(gear?.[slot]||'')}
 function isHouseArmor(slot,id){
  if(!id||!['head','body','shoulders','hands','legs','feet'].includes(slot))return false;
  try{if(typeof v98HouseFromItem==='function'&&v98HouseFromItem(id))return true}catch(_){}
  const match=id.match(new RegExp(`^v98_([a-z_]+)_${slot}$`));return !!match&&HOUSE_KEYS.has(match[1]);
 }
 function visibility(gear={}){
  const map={};
  for(const node of FOUNDATION)map[node]=true;
  for(const node of GEAR_NODES)map[node]=false;
  for(const[slot,[id,node]]of Object.entries(ARMOR))map[node]=value(gear,slot)===id||isHouseArmor(slot,value(gear,slot));
  for(const[slot,[ids,node]]of Object.entries(ROYAL))map[node]=ids.has(value(gear,slot));
  // The supplied Lord-shirt/cravat detail is one authored mesh. Either real item mounts it.
  map['gear__royal_underlayer'] ||= value(gear,'neck')==='v38_valkorion_silk_cravat';
  map['gear__dominus_sword']=value(gear,'main')==='dominus_sword';
  map['gear__dominus_kite_shield']=value(gear,'off')==='dominus_kite_shield';
  map['gear__dominus_thorn_whip']=value(gear,'off')==='dominus_thorn_whip';
  map['gear__dominus_dagger']=value(gear,'reserve')==='dominus_dagger';
  map['gear__dominus_bow']=value(gear,'ranged')==='dominus_bow';
  map['gear__dominus_quiver']=value(gear,'ammo')==='dominus_quiver';
  const jewelry=[value(gear,'jewelry1'),value(gear,'jewelry2')];
  map['gear__royal_jewelry']=jewelry.includes('v98_royal_m_jewelry');
  map['gear__dominus_signet']=jewelry.includes('dominus_signet');

  // Keep the intact authored foundation visible only where an equipped item
  // does not cover it. The body regions share their original coordinates and
  // normals; this is visibility, never independent stretching or duplication.
  map['foundation__head']=true;
  map['foundation__torso']=!(map['gear__dominus_arming_doublet']||map['gear__dominus_cuirass']||map['gear__royal_body']);
  map['foundation__arms']=!(map['gear__dominus_arming_doublet']||map['gear__royal_shoulders']);
  map['foundation__hands']=!(map['gear__dominus_gauntlets']||map['gear__royal_hands']);
  map['foundation__legs']=!(map['gear__dominus_legplates']||map['gear__royal_legs']);
  map['foundation__feet']=!(map['gear__dominus_boots']||map['gear__royal_feet']);
  return map;
 }
 function playerMode(){
  const gear=S?.player?.equipment||{},values=Object.values(gear).map(String);
  if(values.some(id=>id.startsWith('v98_royal_m_')||id.startsWith('v38_valkorion_')))return'royal_male';
  if(Object.keys(ARMOR).some(slot=>value(gear,slot)===ARMOR[slot][0]||isHouseArmor(slot,value(gear,slot))))return'knight';
  return S?.v98?.playerMode==='foundation'?'foundation':'royal_male';
 }
 function repairArt(){
  try{
   if(typeof ITEMS==='undefined')return;
   for(const[id,kind]of Object.entries(ART_ITEMS)){let item=ITEMS[id];if(item&&ART[kind])item.img=ART[kind]}
   if(typeof v98HouseItem==='function')for(const slot of ['head','body','shoulders','hands','legs','feet']){
    let item=ITEMS[v98HouseItem('dominus',slot)];if(item&&ART[slot])item.img=ART[slot];
   }
  }catch(error){console.warn('[Aetherion 1.61.0 art]',error)}
 }
 function createCanvas(host){
  host.replaceChildren();
  const canvas=document.createElement('canvas');
  canvas.dataset.v98Viewer='true';canvas.dataset.v107Valkorion='true';
  canvas.setAttribute('aria-label','Valkorion fitted modular equipment model');
  canvas.style.cssText='display:block;width:100%;height:100%;touch-action:pan-y;background:transparent;visibility:hidden';
  host.appendChild(canvas);return canvas;
 }
 function applyCreator(viewer){
  if(!viewer?._v107Valkorion||!viewer.model)return viewer;
  const creator=S?.v98?.creator||{height:1,frame:1},model=viewer.model;
  model.userData.v107BaseScale??={x:model.scale.x,y:model.scale.y,z:model.scale.z};
  const base=model.userData.v107BaseScale,frame=Math.max(.90,Math.min(1.10,+creator.frame||1)),height=Math.max(.92,Math.min(1.08,+creator.height||1));
  model.scale.set(base.x*frame,base.y*height,base.z*frame);model.updateMatrixWorld?.(true);viewer.render?.();return viewer;
 }
 function attachIdle(viewer){
  if(!viewer?._v107Valkorion||viewer._v107Idle||!viewer.model)return viewer;
  viewer._v107Idle=true;
  const model=viewer.model,base={x:model.position.x,y:model.position.y,z:model.position.z,rx:model.rotation.x,ry:model.rotation.y,rz:model.rotation.z};
  let last=0;
  function tick(now){
   if(viewer.disposed||!viewer._v107Idle)return;
   if(!document.hidden&&now-last>36){last=now;model.position.y=base.y+Math.sin(now*.00145)*.006;model.position.x=base.x+Math.sin(now*.00037+1.1)*.0035;model.position.z=base.z+Math.sin(now*.00061+.7)*.0015;model.rotation.z=base.rz+Math.sin(now*.00052)*.005;model.rotation.y=base.ry+Math.sin(now*.00031)*.007;model.rotation.x=base.rx+Math.sin(now*.00083+.4)*.0018;viewer.render?.()}
   requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);return viewer;
 }
 function applyVisibility(viewer,gear=S?.player?.equipment||{}){
  const map=visibility(gear);runtime.lastMap=map;
  try{viewer.setNodesVisible?.(map)}catch(error){for(const[name,shown]of Object.entries(map))try{viewer.setNodeVisible?.(name,shown)}catch(_){ }console.warn('[Aetherion 1.61.0 visibility]',error)}
  viewer.render?.();return map;
 }
 async function createViewer(host){
  const api=window.AetherionThree,url=window.AetherionUpdater?.asset?.(MODEL_PATH)||MODEL_PATH;
  if(!api?.createViewer)throw Error('3D runtime unavailable');
  if(url===MODEL_PATH)throw Error('Valkorion modular asset is not registered');
  const canvas=createCanvas(host);
  const viewer=await api.createViewer({canvas,container:host,glb:url,proceduralFallback:false,modelHeight:4.15,maxPixelRatio:1.75,onWebGLFailure:error=>console.error('[Aetherion 1.61.0 WebGL]',error),onError:error=>console.error('[Aetherion 1.61.0 model]',error)});
  viewer._v107Valkorion=true;
  // Three's first fit sees every hidden-capable mesh. Recenter on the authored
  // foundation so removing a shield or bow never leaves Valkorion off-axis.
  if(viewer.model){viewer.model.position.x=0;viewer.model.position.z=0;viewer.model.updateMatrixWorld?.(true)}
  applyVisibility(viewer);applyCreator(viewer);attachIdle(viewer);canvas.style.visibility='visible';return viewer;
 }
 async function sync(){
  V98_PLAYER.pending=false;
  let host=v98PlayerHost();if(!host)return null;
  try{
   let viewer=V98_PLAYER.viewer;
   if(viewer&&!viewer._v107Valkorion){try{viewer.dispose?.()}catch(_){}viewer=null;V98_PLAYER.viewer=null}
   if(!viewer){
    if(!runtime.loading)runtime.loading=createViewer(host);
    const pending=runtime.loading;
    try{viewer=await pending}finally{if(runtime.loading===pending)runtime.loading=null}
    V98_PLAYER.viewer=viewer;V98_PLAYER.kind='valkorion_v107';
   }
   host=v98PlayerHost()||host;viewer.attach?.(host);applyVisibility(viewer);applyCreator(viewer);attachIdle(viewer);
   if(viewer.canvas)viewer.canvas.style.visibility='visible';
   V98_PLAYER.error=null;runtime.lastError=null;return viewer;
  }catch(error){
   const message=String(error?.message||error);V98_PLAYER.error=message;runtime.lastError=message;
   try{host.replaceChildren();let box=document.createElement('div');box.className='v98-view-error';box.textContent='3D MODEL ERROR — '+message;host.appendChild(box)}catch(_){}
   console.error('[Aetherion 1.61.0 player]',error);return null;
  }
 }
 function state(){
  const viewer=V98_PLAYER?.viewer;
  return{version:VERSION,model:MODEL_PATH,viewer:!!viewer,error:runtime.lastError,equipment:{...(S?.player?.equipment||{})},visible:(viewer?.getNamedNodes?.()||[]).filter(node=>node.visible).map(node=>node.name)};
 }

 repairArt();
 try{
  v98PlayerKind=playerMode;v98ApplyCreator=applyCreator;v98Sync=sync;v80Sync=sync;v97Sync=sync;
  v80ScheduleSync=v98Schedule;v97Schedule=v98Schedule;
 }catch(error){console.warn('[Aetherion 1.61.0 hooks]',error)}
 try{V98_PLAYER.viewer?.dispose?.()}catch(_){}
 try{V98_PLAYER.viewer=null;V98_PLAYER.kind=null;V98_PLAYER.pending=false}catch(_){}
 try{
  let style=document.getElementById('aetherion-v107-modular-style');
  if(!style){style=document.createElement('style');style.id='aetherion-v107-modular-style';style.textContent='.v80-stage canvas[data-v107-valkorion]{filter:drop-shadow(0 12px 20px rgba(0,0,0,.38))}.v98-view-note::after{content:" · Valkorion gear is fitted per equipped slot.";color:#c6a876}';document.head.appendChild(style)}
 }catch(_){}
 setTimeout(()=>{try{repairArt();if(typeof render==='function')render();if(typeof v98Schedule==='function')v98Schedule()}catch(error){console.warn('[Aetherion 1.61.0 start]',error)}},80);
 window.AetherionValkorionV107=Object.freeze({version:VERSION,model:MODEL_PATH,nodes:Object.freeze([...FOUNDATION,...GEAR_NODES]),visibility,sync,state,repairArt});
})();
