/* Aetherion Reforged v1.72.8 — preserve Alexus equipment through redraw migration. */
'use strict';
(()=>{
 const VERSION='1.72.8';
 const ALEXUS_ID='party_alexus_dominus';
 const FALLBACK_ITEMS=Object.freeze({
  head:'alexus_rose_circlet',neck:'alexus_bloodstone_collar',underlayer:'alexus_silk_shift',
  body:'alexus_dominus_gown',shoulders:'alexus_fur_mantlet',hands:'alexus_lady_gloves',
  waist:'alexus_gilded_girdle',legs:'alexus_riding_underskirt',feet:'alexus_court_boots',
  cloak:'alexus_night_cloak',main:'alexus_ebony_cane',off:'alexus_folding_fan',
  ranged:'alexus_hunting_crossbow',reserve:'alexus_rose_dagger',ammo:'alexus_bolt_case',
  jewelry1:'alexus_twin_signet',jewelry2:'alexus_moonstone_brooch'
 });
 const runtime={upgradeWrapped:false,equipmentWrapped:false,screenWrapped:false,recoveredSlots:[],removedDuplicates:0,lastVisible:0,lastPersonId:null};

 if(window.AetherionAlexusEquipmentRepairV178?.version===VERSION)return;

 function text(value){return String(value??'')}
 function items(){return window.AetherionGameplayRepairV176?.alexusItems||FALLBACK_ITEMS}
 function alexus(state=typeof S==='undefined'?null:S,id=ALEXUS_ID){
  const people=Array.isArray(state?.people)?state.people:[];
  return people.find(person=>text(person?.id)===text(id))
   ||people.find(person=>text(person?.name).trim().toLowerCase()==='lady alexus dominus')
   ||null;
 }
 function isAlexus(id){return text(id)===ALEXUS_ID||text(id)==='dyn_alexus'||text(id)==='alexus'||text(id).trim().toLowerCase()==='lady alexus dominus'||!!alexus(undefined,id)}
 function inventoryRows(state,itemId){
  const rows=[];
  for(const[name,container]of Object.entries(state?.containers||{})){
   if(!Array.isArray(container?.items))continue;
   for(const stack of container.items)if(text(stack?.itemId)===itemId)rows.push({name,container,stack});
  }
  return rows;
 }
 function units(stack){return Math.max(1,Math.floor(Number(stack?.qty)||1))}
 function keepOneInventoryCopy(rows){
  let kept=false,removed=0;
  for(const row of rows){
   const index=row.container.items.indexOf(row.stack);if(index<0)continue;
   const count=units(row.stack);
   if(!kept){kept=true;if(count!==1){removed+=count-1;row.stack.qty=1}}
   else{removed+=count;row.container.items.splice(index,1)}
  }
  return removed;
 }
 function repairResetArtifacts(state=typeof S==='undefined'?null:S){
  const person=alexus(state),gear=person?.gear;
  const report={changed:false,recoveredSlots:[],removedDuplicates:0};
  if(!gear||typeof gear!=='object')return report;
  for(const[slot,itemId]of Object.entries(items())){
   const rows=inventoryRows(state,itemId),count=rows.reduce((sum,row)=>sum+units(row.stack),0);
   // A unique Alexus item cannot validly be both worn and in a container.
   // That impossible state is the exact signature left by v24Upgrade after
   // LEAVE EMPTY returned the item to inventory and migration re-equipped it.
   if(text(gear[slot])===itemId&&count>0){gear[slot]=null;report.changed=true;report.recoveredSlots.push(slot)}
   const removed=keepOneInventoryCopy(rows);if(removed){report.changed=true;report.removedDuplicates+=removed}
  }
  if(report.recoveredSlots.length){
   runtime.recoveredSlots=[...new Set([...runtime.recoveredSlots,...report.recoveredSlots])];
  }
  runtime.removedDuplicates+=report.removedDuplicates;
  return report;
 }
 function snapshotGear(state){
  if(!state?.v24)return null;
  const person=alexus(state);return person?.gear&&typeof person.gear==='object'?{id:person.id,gear:{...person.gear}}:null;
 }
 function restoreGear(state,snapshot){
  if(!snapshot)return null;const person=alexus(state,snapshot.id);if(!person)return null;
  person.gear={...snapshot.gear};return person;
 }
 function installUpgradeGuard(){
  if(runtime.upgradeWrapped||typeof v24Upgrade!=='function')return false;
  if(v24Upgrade.__aetherionAlexusEquipmentRepairV178){runtime.upgradeWrapped=true;return true}
  const base=v24Upgrade;
  const guarded=function(state=typeof S==='undefined'?null:S,...args){
   const saved=snapshotGear(state),result=base.call(this,state,...args);
   restoreGear(result,saved);repairResetArtifacts(result);return result;
  };
  guarded.__aetherionAlexusEquipmentRepairV178=true;
  v24Upgrade=guarded;runtime.upgradeWrapped=true;return true;
 }
 function fittedVisible(person){
  const api=window.AetherionGameplayRepairV176,fitted=api?.alexusFitted||{},expected=items();
  return Object.keys(fitted).filter(slot=>text(person?.gear?.[slot])===text(expected[slot])).length;
 }
 function updateBadge(person){
  const badge=document.querySelector?.('[data-v176-alexus-status]');if(!badge)return;
  const total=Object.keys(window.AetherionGameplayRepairV176?.alexusFitted||{}).length||12,visible=fittedVisible(person);
  runtime.lastVisible=visible;badge.textContent=`${visible} / ${total} FITTED PIECES VISIBLE`;
 }
 async function syncExact(id=ALEXUS_ID){
  const person=alexus(undefined,id),api=window.AetherionGameplayRepairV176;if(!person||!api?.syncAlexus)return null;
  runtime.lastPersonId=person.id;const viewer=await api.syncAlexus();if(!viewer)return null;
  const map=api.alexusVisibility(person.gear||{});api.runtime.lastMap=map;
  viewer.setNodesVisible?.(map);viewer.render?.();updateBadge(person);return viewer;
 }
 function scheduleExact(id=ALEXUS_ID){
  const run=()=>syncExact(id).catch(error=>console.error?.('[Aetherion 1.72.8 Alexus equipment sync]',error));
  return typeof requestAnimationFrame==='function'?requestAnimationFrame(run):setTimeout(run,0);
 }
 function installScreenHook(){
  if(runtime.screenWrapped||typeof v16PersonEquipment!=='function')return false;
  if(v16PersonEquipment.__aetherionAlexusEquipmentRepairV178){runtime.screenWrapped=true;return true}
  const base=v16PersonEquipment;
  const wrapped=function(id,...args){const out=base.call(this,id,...args);if(isAlexus(id))scheduleExact(id);return out};
  wrapped.__aetherionAlexusEquipmentRepairV178=true;v16PersonEquipment=wrapped;runtime.screenWrapped=true;return true;
 }
 function installEquipmentHook(){
  if(runtime.equipmentWrapped||typeof v16EquipPerson!=='function')return false;
  if(v16EquipPerson.__aetherionAlexusEquipmentRepairV178){runtime.equipmentWrapped=true;return true}
  const base=v16EquipPerson;
  const wrapped=function(id,slot,iid,...args){
   const out=base.call(this,id,slot,iid,...args);if(isAlexus(id)){repairResetArtifacts();scheduleExact(id)}return out;
  };
  wrapped.__aetherionAlexusEquipmentRepairV178=true;v16EquipPerson=wrapped;runtime.equipmentWrapped=true;return true;
 }
 function install(){
  installUpgradeGuard();installScreenHook();installEquipmentHook();
  const report=repairResetArtifacts();
  if(report.changed&&typeof persist==='function')try{persist(false)}catch(_){ }
  return report;
 }

 const first=install();
 setTimeout(()=>{const report=install();if((first.changed||report.changed)&&typeof persist==='function')try{persist(false)}catch(_){ }},0);
 window.AetherionAlexusEquipmentRepairV178=Object.freeze({version:VERSION,items:FALLBACK_ITEMS,alexus,repairResetArtifacts,snapshotGear,restoreGear,fittedVisible,syncExact,scheduleExact,install,runtime});
})();
