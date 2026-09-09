/* Aetherion Reforged v1.72.9 — give Alexus a persistent torso foundation. */
'use strict';
(()=>{
 const VERSION='1.72.9';
 const ALEXUS_ID='party_alexus_dominus';
 const BODY_ITEM='alexus_dominus_gown';
 const SOURCE_NODE='BODY_tripo_part_2';
 const FOUNDATION_NODE='ALEXUS_FOUNDATION_TORSO';
 const runtime={viewer:null,node:null,installs:0,lastVisible:null,lastError:null,screenWrapped:false,equipmentWrapped:false};

 if(window.AetherionAlexusTorsoFoundationV179?.version===VERSION)return;

 function text(value){return String(value??'')}
 function alexus(id=ALEXUS_ID){
  const people=typeof S!=='undefined'&&Array.isArray(S?.people)?S.people:[];
  return people.find(person=>text(person?.id)===text(id))
   ||people.find(person=>text(person?.name).trim().toLowerCase()==='lady alexus dominus')
   ||null;
 }
 function isAlexus(id){return text(id)===ALEXUS_ID||text(id)==='dyn_alexus'||text(id)==='alexus'||text(id).trim().toLowerCase()==='lady alexus dominus'||!!alexus(id)}
 function plainLinenMaterial(material){
  if(!material?.clone)return material;
  const copy=material.clone();
  for(const key of ['map','alphaMap','aoMap','bumpMap','displacementMap','emissiveMap','lightMap','metalnessMap','normalMap','roughnessMap'])if(key in copy)copy[key]=null;
  copy.name='Alexus dark-linen torso foundation';copy.color?.setHex?.(0x24171d);copy.emissive?.setHex?.(0x000000);
  if('metalness'in copy)copy.metalness=0;if('roughness'in copy)copy.roughness=.94;if('vertexColors'in copy)copy.vertexColors=false;
  if('transparent'in copy)copy.transparent=false;if('opacity'in copy)copy.opacity=1;if('depthWrite'in copy)copy.depthWrite=true;copy.needsUpdate=true;return copy;
 }
 function setTreeVisible(node,visible){
  if(!node)return false;node.visible=!!visible;node.traverse?.(part=>{part.visible=!!visible});return true;
 }
 function installFoundation(viewer){
  if(!viewer?.model||!viewer?.namedNodes?.get)throw Error('Alexus’s loaded model does not expose its fitted mesh registry.');
  const existing=viewer.namedNodes.get(FOUNDATION_NODE)?.[0];
  if(existing){runtime.viewer=viewer;runtime.node=existing;return existing}
  const source=viewer.namedNodes.get(SOURCE_NODE)?.[0];
  if(!source?.clone)throw Error('Alexus’s supplied torso surface is missing.');
  const clone=source.clone(true);let partIndex=0;
  clone.traverse?.(part=>{
   part.name=part===clone?FOUNDATION_NODE:`${FOUNDATION_NODE}_${++partIndex}`;
   if(Array.isArray(part.material))part.material=part.material.map(plainLinenMaterial);
   else if(part.material)part.material=plainLinenMaterial(part.material);
   if('castShadow'in part)part.castShadow=true;if('receiveShadow'in part)part.receiveShadow=true;
  });
  clone.name=FOUNDATION_NODE;clone.userData={...(clone.userData||{}),aetherionFoundation:true,sourceNode:SOURCE_NODE};
  const parent=source.parent||viewer.model;if(!parent?.add)throw Error('Alexus’s torso foundation has no valid model parent.');
  parent.add(clone);viewer.namedNodes.set(FOUNDATION_NODE,[clone]);runtime.viewer=viewer;runtime.node=clone;runtime.installs++;return clone;
 }
 function foundationVisible(person=alexus()){return text(person?.gear?.body)!==BODY_ITEM}
 function applyFoundation(viewer,person=alexus()){
  const node=installFoundation(viewer),visible=foundationVisible(person);setTreeVisible(node,visible);runtime.lastVisible=visible;viewer.render?.();return visible;
 }
 async function sync(id=ALEXUS_ID){
  const person=alexus(id),v178=window.AetherionAlexusEquipmentRepairV178,v176=window.AetherionGameplayRepairV176;
  if(!person||!v176?.syncAlexus)return null;
  const viewer=await(v178?.syncExact?v178.syncExact(person.id):v176.syncAlexus());if(!viewer)return null;
  if(!v178?.syncExact&&v176.alexusVisibility){const map=v176.alexusVisibility(person.gear||{});v176.runtime.lastMap=map;viewer.setNodesVisible?.(map)}
  try{applyFoundation(viewer,person);runtime.lastError=null}catch(error){runtime.lastError=text(error?.message||error);console.error?.('[Aetherion 1.72.9 Alexus torso foundation]',error)}
  return viewer;
 }
 function schedule(id=ALEXUS_ID){
  const run=()=>sync(id).catch(error=>{runtime.lastError=text(error?.message||error);console.error?.('[Aetherion 1.72.9 Alexus torso sync]',error)});
  return typeof requestAnimationFrame==='function'?requestAnimationFrame(run):setTimeout(run,0);
 }
 function installHooks(){
  if(!runtime.screenWrapped&&typeof v16PersonEquipment==='function'){
   if(v16PersonEquipment.__aetherionAlexusTorsoFoundationV179)runtime.screenWrapped=true;
   else{const base=v16PersonEquipment;const wrapped=function(id,...args){const out=base.call(this,id,...args);if(isAlexus(id))schedule(id);return out};wrapped.__aetherionAlexusTorsoFoundationV179=true;v16PersonEquipment=wrapped;runtime.screenWrapped=true}
  }
  if(!runtime.equipmentWrapped&&typeof v16EquipPerson==='function'){
   if(v16EquipPerson.__aetherionAlexusTorsoFoundationV179)runtime.equipmentWrapped=true;
   else{const base=v16EquipPerson;const wrapped=function(id,slot,iid,...args){const out=base.call(this,id,slot,iid,...args);if(isAlexus(id))schedule(id);return out};wrapped.__aetherionAlexusTorsoFoundationV179=true;v16EquipPerson=wrapped;runtime.equipmentWrapped=true}
  }
 }

 installHooks();setTimeout(()=>{installHooks();if(typeof document==='object'&&document.querySelector?.('[data-v176-alexus-host]'))schedule()},0);
 window.AetherionAlexusTorsoFoundationV179=Object.freeze({version:VERSION,bodyItem:BODY_ITEM,sourceNode:SOURCE_NODE,foundationNode:FOUNDATION_NODE,alexus,plainLinenMaterial,installFoundation,foundationVisible,applyFoundation,sync,schedule,installHooks,runtime});
})();
