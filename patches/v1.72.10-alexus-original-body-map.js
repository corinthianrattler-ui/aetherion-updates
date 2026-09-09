/* Aetherion Reforged v1.72.10 — restore Alexus's authored body and wardrobe map. */
'use strict';
(()=>{
 const VERSION='1.72.10';
 const ALEXUS_ID='party_alexus_dominus';
 const ROOT='ROOT';
 const LEGACY_FOUNDATION='ALEXUS_FOUNDATION_TORSO';
 const ITEMS=Object.freeze({
  head:'alexus_rose_circlet',neck:'alexus_bloodstone_collar',underlayer:'alexus_silk_shift',
  body:'alexus_dominus_gown',shoulders:'alexus_fur_mantlet',hands:'alexus_lady_gloves',
  waist:'alexus_gilded_girdle',legs:'alexus_riding_underskirt',feet:'alexus_court_boots',
  cloak:'alexus_night_cloak',main:'alexus_ebony_cane',off:'alexus_folding_fan',
  ranged:'alexus_hunting_crossbow',reserve:'alexus_rose_dagger',ammo:'alexus_bolt_case',
  jewelry1:'alexus_twin_signet',jewelry2:'alexus_moonstone_brooch'
 });
 // These are the original, textured anatomy surfaces in the supplied GLB. They
 // are never equipment and must never disappear when a wardrobe slot is empty.
 const BODY=Object.freeze([
  'BODY_tripo_part_81','BODY_tripo_part_46', // hands
  'BODY_tripo_part_10','BODY_tripo_part_9','BODY_tripo_part_12', // arms
  'BODY_tripo_part_74','BODY_tripo_part_0', // legs
  'BODY_tripo_part_25','BODY_tripo_part_49','BODY_tripo_part_39', // head, face, hair
  'BODY_tripo_part_28','BODY_tripo_part_2' // upper chest and complete torso
 ]);
 // Every remaining authored mesh belongs to exactly one honest visible item.
 // Three named clothing cards (mantlet, gloves, underskirt) have no independent
 // geometry in this GLB: their shapes are baked into the cloak, bare body, or
 // one-piece gown and are therefore not allowed to hide anatomy or another item.
 const FITTED=Object.freeze({
  head:Object.freeze(['GOWN_tripo_part_19']),
  neck:Object.freeze(['GOWN_tripo_part_18','BODY_tripo_part_75']),
  underlayer:Object.freeze(['BODY_tripo_part_13','BODY_tripo_part_15','BODY_tripo_part_17','BODY_tripo_part_37','BODY_tripo_part_72','BODY_tripo_part_86']),
  body:Object.freeze(['GOWN_tripo_part_10']),
  waist:Object.freeze(['BODY_tripo_part_50']),
  feet:Object.freeze(['GOWN_tripo_part_4','GOWN_tripo_part_5']),
  cloak:Object.freeze(['GOWN_tripo_part_17']),
  jewelry1:Object.freeze(['GOWN_tripo_part_7']),
  jewelry2:Object.freeze(['BODY_tripo_part_56'])
 });
 const CARD_ONLY=Object.freeze(['shoulders','hands','legs','main','off','ranged','reserve','ammo']);
 const ALL_NODES=Object.freeze([...BODY,...Object.values(FITTED).flat()]);
 const BODY_SET=new Set(BODY),ALL_SET=new Set(ALL_NODES);
 const runtime={viewer:null,lastMap:null,lastError:null,policyInstalls:0,legacyClonesRemoved:0,scheduled:false,screenWrapped:false,equipmentWrapped:false};

 if(window.AetherionAlexusOriginalBodyMapV1710?.version===VERSION)return;
 const base=window.AetherionGameplayRepairV176;
 if(!base?.syncAlexus)throw Error('Alexus original-body repair requires the v1.72.6 fitted viewer.');

 function text(value){return String(value??'')}
 function alexus(id=ALEXUS_ID){
  const people=typeof S!=='undefined'&&Array.isArray(S?.people)?S.people:[];
  return people.find(person=>text(person?.id)===text(id))
   ||people.find(person=>text(person?.name).trim().toLowerCase()==='lady alexus dominus')
   ||null;
 }
 function isAlexus(id){return text(id)===ALEXUS_ID||text(id)==='dyn_alexus'||text(id)==='alexus'||text(id).trim().toLowerCase()==='lady alexus dominus'||!!alexus(id)}
 function visibility(gear={}){
  const map={[ROOT]:true};
  for(const node of ALL_NODES)map[node]=BODY_SET.has(node);
  for(const[slot,nodes]of Object.entries(FITTED)){
   const shown=text(gear?.[slot])===ITEMS[slot];
   for(const node of nodes)map[node]=shown;
  }
  return map;
 }
 function unsupported(gear={}){
  const rows=[];
  for(const slot of Object.keys(ITEMS)){
   const item=text(gear?.[slot]);if(!item)continue;
   if(CARD_ONLY.includes(slot)||item!==ITEMS[slot])rows.push({slot,item,reason:CARD_ONLY.includes(slot)?'No independent mesh exists in the supplied model':'Replacement item uses its inventory card'});
  }
  return rows;
 }
 function removeLegacyFoundation(viewer){
  const found=viewer?.namedNodes?.get?.(LEGACY_FOUNDATION)||[];let removed=0;
  for(const node of found){
   const parent=node?.parent;
   if(parent?.remove){parent.remove(node);removed++}
   else if(Array.isArray(parent?.children)){const index=parent.children.indexOf(node);if(index>=0){parent.children.splice(index,1);removed++}}
   if(node)node.visible=false;
  }
  viewer?.namedNodes?.delete?.(LEGACY_FOUNDATION);
  runtime.legacyClonesRemoved+=removed;return removed;
 }
 function corrected(input,gear=alexus()?.gear||{}){return{...(input||{}),...visibility(gear)}}
 function installViewerPolicy(viewer){
  if(!viewer)return null;removeLegacyFoundation(viewer);
  if(viewer.__aetherionAlexusOriginalBodyMapV1710)return viewer;
  const setMany=typeof viewer.setNodesVisible==='function'?viewer.setNodesVisible.bind(viewer):null;
  const setOne=typeof viewer.setNodeVisible==='function'?viewer.setNodeVisible.bind(viewer):null;
  if(setMany)viewer.setNodesVisible=function(map){const fixed=corrected(map);runtime.lastMap=fixed;return setMany(fixed)};
  if(setOne)viewer.setNodeVisible=function(name,shown){const fixed=ALL_SET.has(text(name))?visibility()[text(name)]:shown;return setOne(name,fixed)};
  try{Object.defineProperty(viewer,'__aetherionAlexusOriginalBodyMapV1710',{value:true,configurable:true})}catch(_){viewer.__aetherionAlexusOriginalBodyMapV1710=true}
  runtime.viewer=viewer;runtime.policyInstalls++;return viewer;
 }
 function apply(viewer,person=alexus()){
  if(!viewer||!person)return null;installViewerPolicy(viewer);const map=visibility(person.gear||{});runtime.lastMap=map;
  viewer.setNodesVisible?.(map);viewer.render?.();return map;
 }
 function fittedVisible(person=alexus()){
  return Object.keys(FITTED).filter(slot=>text(person?.gear?.[slot])===ITEMS[slot]).length;
 }
 function refreshUi(person=alexus()){
  if(!person||typeof document!=='object')return;
  const badge=document.querySelector?.('[data-v176-alexus-status]');
  if(badge)badge.textContent=`${fittedVisible(person)} / ${Object.keys(FITTED).length} ORIGINAL MODEL PIECES VISIBLE`;
  const note=document.querySelector?.('.v176-alexus-note');
  if(note)note.textContent='Original model map: her complete head, chest, torso, arms, hands and legs always remain. Only genuine separate wardrobe meshes are hidden when their matching item is unequipped.';
  for(const slotNode of document.querySelectorAll?.('[data-v176-slot]')||[]){
   const slot=text(slotNode?.dataset?.v176Slot),mode=CARD_ONLY.includes(slot)?'card-only':'model-fitted';
   if(slotNode?.dataset)slotNode.dataset.v176Geometry=mode;
   const detail=slotNode?.querySelector?.('small');if(detail)detail.textContent=mode==='model-fitted'?'Original model piece':'Independent equipment card';
  }
 }
 async function sync(id=ALEXUS_ID){
  const person=alexus(id);if(!person)return null;
  try{
   const viewer=await base.syncAlexus();if(!viewer)return null;
   apply(viewer,person);refreshUi(person);runtime.lastError=null;return viewer;
  }catch(error){runtime.lastError=text(error?.message||error);console.error?.('[Aetherion 1.72.10 Alexus original body map]',error);return null}
 }
 function schedule(id=ALEXUS_ID){
  if(runtime.scheduled)return null;runtime.scheduled=true;
  const run=()=>{runtime.scheduled=false;sync(id)};
  return typeof requestAnimationFrame==='function'?requestAnimationFrame(run):setTimeout(run,0);
 }
 function installHooks(){
  if(!runtime.screenWrapped&&typeof v16PersonEquipment==='function'){
   if(v16PersonEquipment.__aetherionAlexusOriginalBodyMapV1710)runtime.screenWrapped=true;
   else{const previous=v16PersonEquipment;const wrapped=function(id,...args){const out=previous.call(this,id,...args);if(isAlexus(id))schedule(id);return out};wrapped.__aetherionAlexusOriginalBodyMapV1710=true;v16PersonEquipment=wrapped;runtime.screenWrapped=true}
  }
  if(!runtime.equipmentWrapped&&typeof v16EquipPerson==='function'){
   if(v16EquipPerson.__aetherionAlexusOriginalBodyMapV1710)runtime.equipmentWrapped=true;
   else{const previous=v16EquipPerson;const wrapped=function(id,slot,item,...args){const out=previous.call(this,id,slot,item,...args);if(isAlexus(id))schedule(id);return out};wrapped.__aetherionAlexusOriginalBodyMapV1710=true;v16EquipPerson=wrapped;runtime.equipmentWrapped=true}
  }
 }

 const upgraded=Object.freeze({...base,version:VERSION,alexusFoundation:BODY,alexusFitted:FITTED,alexusCardOnly:CARD_ONLY,alexusItems:ITEMS,alexusVisibility:visibility,alexusUnsupported:unsupported,syncAlexus:sync,scheduleAlexus:schedule,runtime:base.runtime});
 window.AetherionGameplayRepairV176=upgraded;
 const person=alexus();if(person)try{person.model3dPolicy='Original supplied body is permanent; nine genuine wardrobe mesh groups are independently controlled; unsupported cards never hide anatomy.'}catch(_){ }
 installHooks();setTimeout(()=>{installHooks();if(typeof document==='object'&&document.querySelector?.('[data-v176-alexus-host]'))schedule()},0);
 window.AetherionAlexusOriginalBodyMapV1710=Object.freeze({version:VERSION,items:ITEMS,body:BODY,fitted:FITTED,cardOnly:CARD_ONLY,allNodes:ALL_NODES,alexus,visibility,unsupported,removeLegacyFoundation,installViewerPolicy,apply,fittedVisible,refreshUi,sync,schedule,installHooks,runtime});
})();
