'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('patches/v1.72.10-alexus-original-body-map.js', 'utf8');
const equipmentRepair = fs.readFileSync('patches/v1.72.8-alexus-equipment-repair.js', 'utf8');
const items = {
  head:'alexus_rose_circlet',neck:'alexus_bloodstone_collar',underlayer:'alexus_silk_shift',
  body:'alexus_dominus_gown',shoulders:'alexus_fur_mantlet',hands:'alexus_lady_gloves',
  waist:'alexus_gilded_girdle',legs:'alexus_riding_underskirt',feet:'alexus_court_boots',
  cloak:'alexus_night_cloak',main:'alexus_ebony_cane',off:'alexus_folding_fan',
  ranged:'alexus_hunting_crossbow',reserve:'alexus_rose_dagger',ammo:'alexus_bolt_case',
  jewelry1:'alexus_twin_signet',jewelry2:'alexus_moonstone_brooch'
};
const wardrobeSlots=['head','neck','underlayer','body','shoulders','hands','waist','legs','feet','cloak','jewelry1','jewelry2'];
const person={id:'party_alexus_dominus',name:'Lady Alexus Dominus',gear:{...items}};
const S={people:[person]};
const nodeNames=[
 'BODY_tripo_part_81','BODY_tripo_part_46','GOWN_tripo_part_4','BODY_tripo_part_10','BODY_tripo_part_74','GOWN_tripo_part_19','BODY_tripo_part_28','BODY_tripo_part_39',
 'GOWN_tripo_part_17','BODY_tripo_part_25','BODY_tripo_part_9','GOWN_tripo_part_7','BODY_tripo_part_12','BODY_tripo_part_49','BODY_tripo_part_15','BODY_tripo_part_0',
 'BODY_tripo_part_50','BODY_tripo_part_13','BODY_tripo_part_56','BODY_tripo_part_72','BODY_tripo_part_86','GOWN_tripo_part_5','GOWN_tripo_part_10','BODY_tripo_part_75',
 'BODY_tripo_part_2','GOWN_tripo_part_18','BODY_tripo_part_17','BODY_tripo_part_37'
];
function tree(name){return{name,visible:true,parent:null,traverse(callback){callback(this)}}}
const model={children:[],remove(node){const i=this.children.indexOf(node);if(i>=0)this.children.splice(i,1);node.parent=null}};
const nodes=new Map(nodeNames.map(name=>[name,[tree(name)]]));
for(const list of nodes.values()){list[0].parent=model;model.children.push(list[0])}
const fake=tree('ALEXUS_FOUNDATION_TORSO');fake.userData={aetherionFoundation:true};fake.parent=model;model.children.push(fake);nodes.set(fake.name,[fake]);
let lastMap=null,renders=0;
const viewer={model,namedNodes:nodes,setNodesVisible(map){lastMap={...map};for(const[name,shown]of Object.entries(map))for(const node of nodes.get(name)||[])node.visible=!!shown},setNodeVisible(name,shown){for(const node of nodes.get(name)||[])node.visible=!!shown},render(){renders++}};
const oldFoundation=['BODY_tripo_part_10','BODY_tripo_part_74','BODY_tripo_part_39','BODY_tripo_part_25','BODY_tripo_part_9','BODY_tripo_part_12','BODY_tripo_part_49','BODY_tripo_part_0'];
const oldFitted={body:['BODY_tripo_part_2'],underlayer:['BODY_tripo_part_28'],hands:['BODY_tripo_part_81','BODY_tripo_part_46'],legs:['GOWN_tripo_part_10']};
function oldVisibility(gear){const map={ROOT:true};for(const name of nodeNames)map[name]=oldFoundation.includes(name);for(const[slot,names]of Object.entries(oldFitted))for(const name of names)map[name]=gear[slot]===items[slot];return map}
const oldApi=Object.freeze({
 version:'1.72.6',alexusItems:items,alexusFoundation:oldFoundation,alexusFitted:oldFitted,alexusCardOnly:['main','off','ranged','reserve','ammo'],alexusVisibility:oldVisibility,
 runtime:{lastMap:null},async syncAlexus(){viewer.setNodesVisible(oldVisibility(person.gear));return viewer}
});
let screenCalls=0,equipmentCalls=0;
function v16PersonEquipment(){screenCalls++;return true}
function v16EquipPerson(id,slot,item){equipmentCalls++;person.gear[slot]=item||null;return true}
const badge={textContent:''},note={textContent:''};
const slotNodes=wardrobeSlots.map(slot=>({dataset:{v176Slot:slot,v176Geometry:'model-fitted'},querySelector(){return{textContent:''}}}));
const document={querySelector(selector){if(selector==='[data-v176-alexus-status]')return badge;if(selector==='.v176-alexus-note')return note;if(selector==='[data-v176-alexus-host]')return null;return null},querySelectorAll(selector){return selector==='[data-v176-slot]'?slotNodes:[]}};
const context={console,S,document,AetherionGameplayRepairV176:oldApi,v16PersonEquipment,v16EquipPerson,requestAnimationFrame(callback){setTimeout(callback,0);return 1},setTimeout};
context.window=context;context.globalThis=context;
vm.createContext(context);
vm.runInContext(equipmentRepair,context,{filename:'v1.72.8-alexus-equipment-repair.js'});
vm.runInContext(source,context,{filename:'v1.72.10-alexus-original-body-map.js'});

(async()=>{
 const api=context.AetherionAlexusOriginalBodyMapV1710;
 assert(api,'repair API did not install');
 assert.equal(api.body.length,12);assert.equal(Object.keys(api.fitted).length,9);assert.equal(api.allNodes.length,28);assert.equal(new Set(api.allNodes).size,28);
 assert.deepEqual([...api.allNodes].sort(),[...nodeNames].sort(),'all 28 authored meshes must be classified exactly once');
 assert(api.body.includes('BODY_tripo_part_28'),'original upper-chest skin must be permanent');
 assert(api.body.includes('BODY_tripo_part_2'),'original torso must be permanent');
 assert(api.body.includes('BODY_tripo_part_81')&&api.body.includes('BODY_tripo_part_46'),'original hands must be permanent');
 assert.deepEqual(Array.from(api.fitted.body),['GOWN_tripo_part_10'],'the actual full dress must follow the gown/body slot');
 assert(!api.allNodes.includes('ALEXUS_FOUNDATION_TORSO'),'the fabricated v1.72.9 clone must not be part of the model map');

 // Exhaust every state of the 12 non-weapon wardrobe slots. Anatomy remains
 // intact in all 4,096 combinations and only an exact fitted item reveals its mesh.
 for(let bits=0;bits<(1<<wardrobeSlots.length);bits++){
  const gear={};for(let i=0;i<wardrobeSlots.length;i++)gear[wardrobeSlots[i]]=(bits&(1<<i))?items[wardrobeSlots[i]]:null;
  const map=api.visibility(gear);
  for(const name of api.body)assert.equal(map[name],true,`${name} disappeared in wardrobe state ${bits}`);
  for(const[slot,names]of Object.entries(api.fitted))for(const name of names)assert.equal(map[name],gear[slot]===items[slot],`${name} followed the wrong slot in state ${bits}`);
 }

 person.gear={...items,body:null,underlayer:null,hands:null};
 await api.sync(person.id);
 assert.equal(lastMap.BODY_tripo_part_28,true,'upper chest must remain after gown and shift are removed');
 assert.equal(lastMap.BODY_tripo_part_2,true,'torso must remain after gown and shift are removed');
 assert.equal(lastMap.BODY_tripo_part_81,true,'hand must remain after gloves are removed');
 assert.equal(lastMap.GOWN_tripo_part_10,false,'the dress must disappear with the gown slot');
 assert.equal(lastMap.BODY_tripo_part_13,false,'the separate underlayer must disappear with its slot');
 assert.equal(nodes.has('ALEXUS_FOUNDATION_TORSO'),false,'legacy fabricated torso must be removed');
 assert.equal(model.children.includes(fake),false,'legacy fabricated torso must be detached from the scene');
 assert.equal(context.AetherionGameplayRepairV176.alexusVisibility,api.visibility,'v1.72.8 must receive the corrected map through the shared API');
 assert.equal(context.AetherionAlexusEquipmentRepairV178.fittedVisible(person),7,'v1.72.8 must count the corrected nine-group map instead of its stale v1.72.6 groups');
 assert.match(note.textContent,/complete head, chest, torso, arms, hands and legs always remain/);
 assert.match(badge.textContent,/ORIGINAL MODEL PIECES VISIBLE/);

 context.v16EquipPerson(person.id,'body',items.body);
 await new Promise(resolve=>setTimeout(resolve,10));
 assert.equal(lastMap.GOWN_tripo_part_10,true,'re-equipping the gown must restore the real dress');
 assert.equal(lastMap.BODY_tripo_part_2,true,'re-equipping the gown must not replace the original torso');
 assert(screenCalls===0&&equipmentCalls===1&&renders>0);
 console.log('v1.72.10 Alexus body map: original 28-node source restored, fake torso removed, and all 4,096 wardrobe states preserve complete anatomy');
})().catch(error=>{console.error(error);process.exitCode=1});
