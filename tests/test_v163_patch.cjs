'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const patch=fs.readFileSync('patches/v1.63.0-valkorion-final.js','utf8');
const houses=new Set(['dominus','white_harbor','highwatch','grimhorn','stonevein','corvinus','eternal_glades','solaris','lorien','winterhold']);
const noop=()=>{};
const context={
 console,
 ITEMS:{},
 S:{player:{equipment:{}},v98:{playerMode:'foundation',creator:{height:1,frame:1}}},
 V98_PLAYER:{viewer:null,kind:null,pending:false,error:null},
 document:{
  hidden:false,
  getElementById:()=>null,
  createElement:()=>({dataset:{},style:{},setAttribute:noop,appendChild:noop}),
  head:{appendChild:noop}
 },
 setTimeout:noop,
 requestAnimationFrame:noop,
 render:noop,
 v98Schedule:noop,
 v98PlayerHost:()=>null,
 v98PlayerKind:()=> 'royal_male',
 v98ApplyCreator:noop,
 v98Sync:noop,
 v80Sync:noop,
 v97Sync:noop,
 v80ScheduleSync:noop,
 v97ScheduleSync:noop,
 v98HouseItem:(house,slot)=>`v98_${house}_${slot}`,
 v98HouseFromItem:id=>{let match=String(id).match(/^v98_([a-z_]+)_(head|body|shoulders|hands|legs|feet)$/);return match&&houses.has(match[1])?match[1]:null}
};
context.window=context;
vm.createContext(context);
vm.runInContext(patch,context,{filename:'v1.63.0-valkorion-final.js'});

const api=context.AetherionValkorionV109;
assert.equal(api.version,'1.63.0');
assert.equal(api.model,'assets/v109/valkorion_final.glb');
assert.equal(api.nodes.length,35);
assert.equal(new Set(api.nodes).size,35);

const shownGear=gear=>Object.entries(api.visibility(gear))
 .filter(([name,visible])=>(name.startsWith('gear__')||name.startsWith('SLOT_'))&&visible)
 .map(([name])=>name).sort();
const expectOnly=(gear,nodes)=>assert.deepEqual(shownGear(gear),(Array.isArray(nodes)?nodes:[nodes]).toSorted());

assert.deepEqual(shownGear({}),[],'empty slots must show no equipment');
for(const slot of ['head','torso','arms','hands','legs','feet'])assert.equal(api.visibility({})[`foundation__${slot}`],true);

const exactCases=[
 [{head:'dominus_lord_helm'},'SLOT_HELMET'],
 [{neck:'dominus_gorget'},'SLOT_GORGET'],
 [{underlayer:'dominus_arming_doublet'},'SLOT_UNDERCOAT'],
 [{body:'dominus_cuirass'},'SLOT_CUIRASS'],
 [{shoulders:'dominus_pauldrons'},'SLOT_PAULDRONS'],
 [{hands:'dominus_gauntlets'},'SLOT_GAUNTLETS'],
 [{waist:'dominus_belt'},'SLOT_BELT'],
 [{legs:'dominus_legplates'},['SLOT_TROUSERS','SLOT_GREAVES']],
 [{feet:'dominus_boots'},'SLOT_BOOTS'],
 [{cloak:'dominus_cloak'},'SLOT_CLOAK'],
 [{main:'dominus_sword'},['gear__dominus_sword','SLOT_SCABBARD']],
 [{off:'dominus_kite_shield'},'gear__dominus_kite_shield'],
 [{off:'dominus_thorn_whip'},'gear__dominus_thorn_whip'],
 [{reserve:'dominus_dagger'},'gear__dominus_dagger'],
 [{ranged:'dominus_bow'},'gear__dominus_bow'],
 [{ammo:'dominus_quiver'},'gear__dominus_quiver'],
 [{jewelry1:'v98_royal_m_jewelry'},'gear__royal_jewelry'],
 [{jewelry2:'dominus_signet'},'gear__dominus_signet']
];
for(const[gear,node]of exactCases)expectOnly(gear,node);

const royalCases=[
 ['head','v98_royal_m_head','gear__royal_head'],
 ['underlayer','v98_royal_m_underlayer','gear__royal_underlayer'],
 ['body','v98_royal_m_body','gear__royal_body'],
 ['shoulders','v98_royal_m_shoulders','gear__royal_shoulders'],
 ['hands','v98_royal_m_hands','gear__royal_hands'],
 ['waist','v98_royal_m_waist','gear__royal_waist'],
 ['legs','v98_royal_m_legs','gear__royal_legs'],
 ['feet','v98_royal_m_feet','gear__royal_feet'],
 ['cloak','v98_royal_m_cloak','gear__royal_cloak']
];
for(const[slot,id,node]of royalCases)expectOnly({[slot]:id},node);

const legacyCases=[
 ['head','v38_valkorion_court_circlet','gear__royal_head'],
 ['neck','v38_valkorion_silk_cravat','gear__royal_underlayer'],
 ['underlayer','v38_valkorion_lord_shirt','gear__royal_underlayer'],
 ['body','v38_valkorion_formal_overcoat','gear__royal_body'],
 ['shoulders','v38_valkorion_rose_shouldercape','gear__royal_shoulders'],
 ['hands','v38_valkorion_formal_gloves','gear__royal_hands'],
 ['waist','v38_valkorion_court_swordbelt','gear__royal_waist'],
 ['legs','v38_valkorion_formal_trousers','gear__royal_legs'],
 ['feet','v38_valkorion_lord_boots','gear__royal_feet'],
 ['cloak','v38_valkorion_night_rose_cloak','gear__royal_cloak']
];
for(const[slot,id,node]of legacyCases)expectOnly({[slot]:id},node);

expectOnly({head:'v98_dominus_head'},'SLOT_HELMET');
assert.equal(api.visibility({ranged:'dominus_bow'}).gear__dominus_quiver,false,'bow must not imply an unequipped quiver');
assert.equal(api.visibility({off:'dominus_kite_shield'}).gear__dominus_thorn_whip,false,'off-hand items must remain exclusive');

let visible=api.visibility({head:'dominus_lord_helm'});
assert.equal(visible.foundation__head,false,'closed helmet must hide the foundation head');
visible=api.visibility({hands:'dominus_gauntlets'});
assert.equal(visible.foundation__hands,false,'gauntlets must hide foundation hands');
visible=api.visibility({body:'dominus_cuirass'});
assert.equal(visible.foundation__torso,false,'cuirass must hide foundation torso');
assert.equal(visible.foundation__arms,true,'cuirass must not remove under-suit arms');
visible=api.visibility({underlayer:'dominus_arming_doublet'});
assert.equal(visible.foundation__torso,false,'gambeson replaces the foundation torso');
assert.equal(visible.foundation__arms,false,'gambeson replaces the foundation sleeves');
visible=api.visibility({legs:'dominus_legplates'});
assert.equal(visible.foundation__legs,true,'black under-suit must remain behind partial leg plates');
visible=api.visibility({feet:'dominus_boots'});
assert.equal(visible.foundation__feet,false,'closed boots must hide foundation feet');
visible=api.visibility({body:'v98_royal_m_body',shoulders:'v98_royal_m_shoulders',hands:'v98_royal_m_hands',legs:'v98_royal_m_legs',feet:'v98_royal_m_feet'});
assert.equal(visible.foundation__torso,false);
assert.equal(visible.foundation__arms,false);
assert.equal(visible.foundation__hands,false);
assert.equal(visible.foundation__legs,false);
assert.equal(visible.foundation__feet,false);

// Exercise the Android updater's indirect eval against lexical classic-script globals.
const lexical={console,document:context.document,setTimeout:noop,requestAnimationFrame:noop};
lexical.window=lexical;
vm.createContext(lexical);
vm.runInContext(`
 let S={player:{equipment:{}},v98:{playerMode:'foundation',creator:{height:1,frame:1}}};
 const ITEMS={};
 const V98_PLAYER={viewer:null,kind:null,pending:false,error:null};
 function render(){} function v98Schedule(){} function v98PlayerHost(){return null}
 function v98PlayerKind(){return 'royal_male'} function v98ApplyCreator(){} function v98Sync(){}
 function v80Sync(){} function v97Sync(){} function v80ScheduleSync(){} function v97Schedule(){}
 function v98HouseItem(house,slot){return 'v98_'+house+'_'+slot}
 function v98HouseFromItem(id){let m=String(id).match(/^v98_([a-z_]+)_(head|body|shoulders|hands|legs|feet)$/);return m&&${JSON.stringify([...houses])}.includes(m[1])?m[1]:null}
 `,lexical,{filename:'aetherion-classic-globals.js'});
vm.runInContext(`(0,eval)(${JSON.stringify(patch)})`,lexical,{filename:'aetherion-updater-eval.js'});
assert.equal(lexical.AetherionValkorionV109.version,'1.63.0');
assert.equal(lexical.AetherionValkorionV109.visibility({body:'v98_royal_m_body'}).SLOT_CUIRASS,false);

console.log('v1.63.0 final equipment visibility and body coverage: all assertions passed');
