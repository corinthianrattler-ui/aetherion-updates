'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('patches/v1.72.6-gameplay-repair.js','utf8');
const itemDefs={
 wine_skin:{id:'wine_skin',name:'Good Wine Skin',cat:'drink',weight:1.1,value:1,shopKey:'provisioner'},
 sword:{id:'sword',name:'Road Sword',cat:'weapon',weight:2.5,value:12,shopKey:'smith'},
 stone:{id:'stone',name:'Cut Stone',cat:'material',weight:20,value:2,shopKey:'outfitter'}
};
const specs=[
 {name:'Dominus Road Provision Crate',parentId:'wagon1',group:'provision'},
 {name:'Dominus Armory Chest',parentId:'wagon2',group:'armory'},
 {name:'Dominus Fodder & Provision Crate',parentId:'wagon2',group:'provision'},
 {name:'Dominus Repair Tool Chest',parentId:'wagon3',group:'tools'},
 {name:'Dominus Materials Crate',parentId:'wagon3',group:'materials'}
];
function box(name,capacityKg=100,capacitySlots=10){return{name,type:'movable_box',capacityKg,capacitySlots,items:[]}}
const containers={
 'Carried Inventory':box('Carried Inventory',80,20),
 'Wagon I':{name:'Wagon I',type:'wagon',capacityKg:3200,capacitySlots:48,items:[],nestedContainers:['Dominus Road Provision Crate']},
 'Wagon II':{name:'Wagon II',type:'wagon',capacityKg:3200,capacitySlots:48,items:[],nestedContainers:['Dominus Armory Chest','Dominus Fodder & Provision Crate']},
 'Wagon III':{name:'Wagon III',type:'wagon',capacityKg:3200,capacitySlots:48,items:[],nestedContainers:['Dominus Repair Tool Chest','Dominus Materials Crate']},
 'Dominus Road Provision Crate':box('Dominus Road Provision Crate'),
 'Dominus Armory Chest':box('Dominus Armory Chest'),
 'Dominus Fodder & Provision Crate':box('Dominus Fodder & Provision Crate'),
 'Dominus Repair Tool Chest':box('Dominus Repair Tool Chest'),
 'Dominus Materials Crate':box('Dominus Materials Crate')
};
const alexusGear={
 head:'alexus_rose_circlet',neck:'alexus_bloodstone_collar',underlayer:'alexus_silk_shift',body:'alexus_dominus_gown',shoulders:'alexus_fur_mantlet',hands:'alexus_lady_gloves',waist:'alexus_gilded_girdle',legs:'alexus_riding_underskirt',feet:'alexus_court_boots',cloak:'alexus_night_cloak',main:'alexus_ebony_cane',off:'alexus_folding_fan',ranged:'alexus_hunting_crossbow',reserve:'alexus_rose_dagger',ammo:'alexus_bolt_case',jewelry1:'alexus_twin_signet',jewelry2:'alexus_moonstone_brooch'
};
const alexus={id:'party_alexus_dominus',name:'Lady Alexus Dominus',mountId:'moondancer',portrait:'alexus.webp',gear:{...alexusGear}};
const S={
 world:{location:'Corvinus Keep',day:18},people:[alexus],containers,wagons:[{id:'wagon1',name:'Wagon I'},{id:'wagon2',name:'Wagon II'},{id:'wagon3',name:'Wagon III'}],
 market:{'Corvinus Keep':[{itemId:'wine_skin',qty:5,condition:93}]},v34:{requisitions:[]},v70:{assignments:{},shopHistory:[]}
};
let modalMarkup='',toastMessage='',coins=500,renders=0,persisted=0,advanced=0;
const shops={provisioner:{cashCopper:0,stock:[{itemId:'wine_skin',qty:5,condition:93}]}};
const inputs={v70q_wine_skin:{value:'2'},v16Qty:{value:'2'}};
const appended=[];
const document={
 baseURI:'https://appassets.androidplatform.net/assets/game/index.html',
 head:{appendChild(node){appended.push(node)}},documentElement:{appendChild(node){appended.push(node)}},
 getElementById(id){return inputs[id]||null},querySelector(){return null},
 createElement(tag){return{tagName:tag,id:'',dataset:{},style:{},textContent:'',appendChild(){},setAttribute(){}}}
};
function weight(stack){return(itemDefs[stack.itemId]?.weight||0)*(+stack.qty||0)}
function containerWeight(container){return(container.items||[]).reduce((sum,stack)=>sum+weight(stack),0)}
function canAdd(container,stack){return !!container&&containerWeight(container)+weight(stack)<=container.capacityKg&&((container.items||[]).some(row=>row.itemId===stack.itemId)||(container.items||[]).length<container.capacitySlots)}
function addItem(name,itemId,qty,condition,meta={}){const container=S.containers[name],stack={itemId,qty,condition,...meta};if(!canAdd(container,stack))return false;const existing=container.items.find(row=>row.itemId===itemId&&row.condition===condition);if(existing)existing.qty+=qty;else container.items.push(stack);return true}
function v34lHostLoad(name){const host=S.containers[name],nested=host.nestedContainers||[];return{weight:containerWeight(host)+nested.reduce((sum,key)=>sum+containerWeight(S.containers[key]),0),maxKg:host.capacityKg,slots:nested.length,maxSlots:host.capacitySlots}}
const context={
 console,window:null,globalThis:null,document,S,ITEMS:itemDefs,V34L_STARTER_CRATES:specs,V16_SLOT_LABELS:Object.keys(alexusGear).map(slot=>[slot,slot]),
 location:{protocol:'https:',hostname:'appassets.androidplatform.net',href:document.baseURI},URL,ArrayBuffer,DataView,Math,Set,Map,
 setTimeout(){return 1},requestAnimationFrame(){return 1},
 esc:value=>String(value),itemDef:id=>itemDefs[id]||{id,name:id,weight:.5},itemImage:def=>`<img src="${def.id}.webp">`,
 v38PdAlexusState(){return{src:'alexus.webp',label:'Complete Night-Rose traveling wardrobe'}},v38PdEnsure(){},
 v16PersonEquipment(){return'base'},openModal(html){modalMarkup=html},closeModal(){modalMarkup=''},openPerson(){},v24OpenPersonGear(){},v16ChoosePersonItem(){},
 v70BuyPanel(){return'<label class="v165-destination">Pack purchases into <select id="v70Dest"><option>Wagon III</option></select></label><div>stock</div>'},v70Select(){return''},
 v70Buy(){},v70Shop:key=>shops[key],v70LegacyShop:def=>def.shopKey,v70CargoClass(def){if(def.cat==='drink')return'Provisions';if(def.cat==='weapon')return'Arms & Armor';if(def.cat==='material')return'Materials';return'Luxury & Trade'},
 v16DoBuy(){},v34lBestDestination(){},v34lExecuteRequisition(){},v34lEnsure(){},v34lQuartermaster(){return{name:'Quartermaster Edwyn Rook'}},v34lMarketAvailable(){return true},
 v11MarketEntry(loc,id){return S.market[loc].find(row=>row.itemId===id)},v11QuoteMarket(loc,row,qty){return{total:6*qty,average:6}},v11RecordTrade(){},
 containerAccessible(){return true},canAdd,mkStack:(itemId,qty,condition)=>({itemId,qty,condition,equipped:false}),stackWeight:weight,v34lHostLoad,
 moneyCopper(){return coins},payCopper(cost){if(coins<cost)return false;coins-=cost;return true},earnCopper(value){coins+=value},addItem,
 money:value=>`${value}c`,v31Money:value=>`${value}c`,toast(message){toastMessage=message;return false},log(){},persist(){persisted++},render(){renders++},advanceHours(hours){advanced+=hours},v26Block(message){toastMessage=message}
};
context.AetherionV166LivingWorld={fairItemCopper:()=>6,shopRowCopper:()=>6};context.window=context;context.globalThis=context;
vm.createContext(context);vm.runInContext(source,context,{filename:'v1.72.6-gameplay-repair.js'});

const api=context.AetherionGameplayRepairV176;
assert.equal(api.version,'1.72.6');assert.equal(api.androidBuild,195);assert.equal(api.alexusModel,'assets/v172/alexus-gothic-gown.glb');
const allNodes=[...api.alexusFoundation,...Object.values(api.alexusFitted).flat()];
assert.equal(allNodes.length,28);assert.equal(new Set(allNodes).size,28,'every supplied Alexus mesh island must belong to exactly one group');
assert.deepEqual(Array.from(api.alexusCardOnly),['main','off','ranged','reserve','ammo']);
let visibility=api.alexusVisibility(alexus.gear);assert(allNodes.every(name=>visibility[name]===true),'the complete authored wardrobe should show all supplied mesh islands');
delete alexus.gear.head;visibility=api.alexusVisibility(alexus.gear);assert.equal(visibility.GOWN_tripo_part_19,false);assert.equal(visibility.GOWN_tripo_part_18,true,'removing the circlet must not remove the collar');alexus.gear.head=alexusGear.head;
assert.equal(api.alexusUnsupported(alexus.gear).filter(row=>api.alexusCardOnly.includes(row.slot)).length,5,'five absent weapon geometries must be reported honestly');
context.v16PersonEquipment(alexus.id);assert.match(modalMarkup,/data-v176-alexus-host/);assert.doesNotMatch(modalMarkup,/v38-doll-rail/);assert.equal((modalMarkup.match(/data-v176-slot=/g)||[]).length,17);assert.equal((modalMarkup.match(/data-v176-geometry="model-fitted"/g)||[]).length,12);assert.equal(alexus.model3dFitted,api.alexusModel);

const panel=context.v70BuyPanel('provisioner');assert.match(panel,/Valkorion’s Carried Inventory/);assert.match(panel,/id="v70Dest" hidden/);assert.doesNotMatch(panel,/Pack purchases into/);
const wagonBefore=JSON.stringify(S.containers['Wagon III']);assert.equal(context.v70Buy('provisioner','wine_skin'),true);assert.equal(S.containers['Carried Inventory'].items[0].qty,2);assert.equal(JSON.stringify(S.containers['Wagon III']),wagonBefore);assert.equal(api.runtime.lastDestination,'Carried Inventory');assert.match(toastMessage,/Carried Inventory/);

S.containers['Carried Inventory'].items=[];inputs.v16Qty.value='2';assert.equal(context.v16DoBuy(0),true);assert.equal(S.containers['Carried Inventory'].items[0].qty,2);assert.equal(S.market['Corvinus Keep'][0].qty,3);

assert.equal(api.globalCargoGroup('wine_skin'),'provision');assert.equal(api.globalCargoGroup('sword'),'armory');assert.equal(api.quartermasterDestination('wine_skin',1,93),'Dominus Road Provision Crate');assert.equal(api.quartermasterDestination('wine_skin',1,93,'Wagon III'),'Dominus Road Provision Crate','an old bare-wagon selection must resolve to the correct fitted crate');assert.equal(api.quartermasterDestination('sword',1,100),'Dominus Armory Chest');assert.equal(api.quartermasterDestination('stone',1,100),'Dominus Materials Crate');
S.containers['Dominus Road Provision Crate'].capacityKg=0;assert.equal(api.quartermasterDestination('wine_skin',1,93),'Dominus Fodder & Provision Crate','a full primary crate must fall through to the next compatible wagon crate');

S.v34.requisitions=[{itemId:'wine_skin',qty:1,destination:'Wagon III',status:'Open',location:'Corvinus Keep'}];const fodderBefore=S.containers['Dominus Fodder & Provision Crate'].items.length;assert.equal(context.v34lExecuteRequisition(0),true);assert.equal(S.v34.requisitions[0].destination,'Dominus Fodder & Provision Crate');assert.equal(S.v34.requisitions[0].status,'Filled');assert.equal(S.containers['Dominus Fodder & Provision Crate'].items.length,fodderBefore+1);assert(advanced>0);

assert(appended.some(node=>node.id==='aetherion-v176-gameplay-repair'));const css=appended.find(node=>node.id==='aetherion-v176-gameplay-repair').textContent;assert.match(css,/@media \(orientation:portrait\)/);assert.match(css,/overflow-x:hidden!important/);assert.match(css,/grid-template-columns:minmax\(0,1fr\)!important/);assert(persisted>=2&&renders>=2);
console.log('v1.72.6 gameplay repair: Alexus 12-piece model map, portrait containment, personal trade, and fitted-crate fallback passed');
