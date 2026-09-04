'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const patch=fs.readFileSync(path.join(__dirname,'..','patches','v1.61.0-valkorion-modular.js'),'utf8');
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
 v97Schedule:noop,
 v98HouseItem:(house,slot)=>`v98_${house}_${slot}`,
 v98HouseFromItem:id=>{let match=String(id).match(/^v98_([a-z_]+)_(head|body|shoulders|hands|legs|feet)$/);return match&&houses.has(match[1])?match[1]:null}
};
context.window=context;
vm.createContext(context);
vm.runInContext(patch,context,{filename:'v1.61.0-valkorion-modular.js'});

const api=context.AetherionValkorionV107;
assert.equal(api.version,'1.61.0');
assert.equal(api.nodes.length,33);
assert.equal(new Set(api.nodes).size,33);

const shownGear=gear=>Object.entries(api.visibility(gear)).filter(([name,visible])=>name.startsWith('gear__')&&visible).map(([name])=>name).sort();
const expectOnly=(gear,node)=>assert.deepEqual(shownGear(gear),[node]);

assert.deepEqual(shownGear({}),[],'empty slots must show no equipment');
for(const slot of ['head','torso','arms','hands','legs','feet'])assert.equal(api.visibility({})[`foundation__${slot}`],true);

const exactCases=[
 [{head:'dominus_lord_helm'},'gear__dominus_lord_helm'],
 [{neck:'dominus_gorget'},'gear__dominus_gorget'],
 [{underlayer:'dominus_arming_doublet'},'gear__dominus_arming_doublet'],
 [{body:'dominus_cuirass'},'gear__dominus_cuirass'],
 [{shoulders:'dominus_pauldrons'},'gear__dominus_pauldrons'],
 [{hands:'dominus_gauntlets'},'gear__dominus_gauntlets'],
 [{waist:'dominus_belt'},'gear__dominus_belt'],
 [{legs:'dominus_legplates'},'gear__dominus_legplates'],
 [{feet:'dominus_boots'},'gear__dominus_boots'],
 [{cloak:'dominus_cloak'},'gear__dominus_cloak'],
 [{main:'dominus_sword'},'gear__dominus_sword'],
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

expectOnly({head:'v98_dominus_head'},'gear__dominus_lord_helm');
assert.equal(api.visibility({head:'v98_royal_m_head'}).gear__dominus_lord_helm,false,'royal IDs must not also mount armor');
assert.equal(api.visibility({ranged:'dominus_bow'}).gear__dominus_quiver,false,'bow must not imply an unequipped quiver');
assert.equal(api.visibility({off:'dominus_kite_shield'}).gear__dominus_thorn_whip,false,'off-hand items must remain exclusive');

// Equipping a fitted piece hides only the intact foundation region it covers.
let visible=api.visibility({body:'dominus_cuirass'});
assert.equal(visible.foundation__torso,false);
assert.equal(visible.foundation__arms,true);
assert.equal(visible.foundation__hands,true);
visible=api.visibility({underlayer:'dominus_arming_doublet',hands:'dominus_gauntlets'});
assert.equal(visible.foundation__torso,false);
assert.equal(visible.foundation__arms,false);
assert.equal(visible.foundation__hands,false);
visible=api.visibility({shoulders:'v98_royal_m_shoulders',legs:'v98_royal_m_legs',feet:'v98_royal_m_feet'});
assert.equal(visible.foundation__head,true);
assert.equal(visible.foundation__torso,true);
assert.equal(visible.foundation__arms,false);
assert.equal(visible.foundation__hands,true);
assert.equal(visible.foundation__legs,false);
assert.equal(visible.foundation__feet,false);

// The Android updater applies patches with indirect global eval after classic
// scripts declared S/V98_PLAYER as lexical bindings. Exercise that exact shape,
// not only the property-backed test context above.
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
assert.equal(lexical.AetherionValkorionV107.version,'1.61.0');
assert.equal(lexical.AetherionValkorionV107.visibility({body:'v98_royal_m_body'}).gear__dominus_cuirass,false);

console.log('v1.61.0 equipment visibility and body coverage: all assertions passed');
