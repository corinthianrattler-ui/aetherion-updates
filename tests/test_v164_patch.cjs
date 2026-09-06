'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const patch=fs.readFileSync('patches/v1.64.0-world-ui-integrity.js','utf8');
const serviceIds=[
 'svc_bascinet','svc_mail_standard','svc_arming_coat','svc_mail_hauberk','svc_spaulders','svc_gauntlets',
 'svc_sword_belt','svc_mail_chausses','svc_riding_boots','svc_wool_cloak','svc_arming_sword',
 'svc_kite_shield','svc_mercy_dagger','svc_signet_blank'
];
const footIds=['foot_kettle','foot_gambeson','foot_mail','foot_gloves','foot_belt','foot_hose','foot_boots','foot_cloak','foot_spear','foot_round','foot_dagger'];
const expectedItemArt={};
for(const id of serviceIds)expectedItemArt[id]=`assets/items/v25/service/${id}.webp`;
for(const id of footIds)expectedItemArt[id]=`assets/items/v25/foot/${id}.webp`;

const context={console,setTimeout:()=>{},requestAnimationFrame:()=>{}};
context.window=context;
vm.createContext(context);
vm.runInContext(`
 let opened='',baseEquipmentCalls=0,persistCalls=0;
 const guardedCalls=[];
 const ITEMS={};
 for(const id of ${JSON.stringify([...serviceIds,...footIds])})ITEMS[id]={id,name:id.replaceAll('_',' '),img:'assets/bannerless_knight.jpg',weight:id==='svc_arming_coat'?1.0499999999999998:2,armor:id==='svc_arming_coat'?3:0,attack:0};
 let S={world:{day:1},meta:{},people:[
  {id:'ser',name:'Ser Tomas Vey',role:'Bannerless Knight',rank:'Lesser Knight',gender:'F',voice:'YF',bannerless:true,portrait:'wrong.jpg',gear:{underlayer:'svc_arming_coat',head:'svc_bascinet'}},
  {id:'dame',name:'Dame Ellyn Vey',role:'Bannerless Knight',rank:'Lesser Knight',gender:'F',voice:'YF',bannerless:true,portrait:'wrong.jpg',gear:{}},
  {id:'archer',name:'Ser Edric Pike',role:'Bannerless Archer',gender:'M',voice:'YM',bannerless:true,portrait:'wrong.jpg',gear:{}},
  {id:'crossbow',name:'Ser Lucan Reed',role:'Bannerless Crossbowman',gender:'M',voice:'YM',bannerless:true,portrait:'wrong.jpg',gear:{}},
  {id:'foot',name:'Bram Holt',role:'Footman',gender:'F',voice:'YM',issuedKit:'foot_service',portrait:'wrong.jpg',gear:{head:'foot_kettle'}},
  {id:'other',name:'Lady Alexus Dominus',role:'Exiled Lady',gender:'F',voice:'YF',portrait:'alexus.jpg',gear:{}}
 ],v15:{settlements:{Corvinus:{roster:[]}}}};
 function esc(v){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;')}
 function itemDef(id){return ITEMS[id]||{id,name:id}}
 function itemImage(d,cls){return '<img class="'+cls+'" src="'+d.img+'" alt="'+d.name+'">'}
 function entityImage(src,name,cls=''){return '<img class="'+cls+'" src="'+src+'" alt="'+name+'">'}
 function openModal(html){opened=html}
 function openPerson(){} function v16ChoosePersonItem(){} function v24OpenPersonGear(){}
 function persist(){persistCalls++}
 function toast(){}
 function v17GenderForRole(role){return /Knight/.test(role)?'F':'M'}
 function v17RepairNames(state){for(const p of state.people)p.gender=v17GenderForRole(p.role,p.id);return state}
 function v16Portrait(){return'fallback-role.jpg'}
 function v15Portrait(){return'fallback-old.jpg'}
 function v16PersonPortrait(p){return p.portrait}
 function v16PersonEquipment(){baseEquipmentCalls++}
 function v15Hire(){return true}
 function v21IssuePerson(){return true}
 function setFormationRole(id,role){let p=S.people.find(x=>x.id===id);if(p)p.role=role}
 function setRank(id,rank){let p=S.people.find(x=>x.id===id);if(p){p.rank=rank;if(rank==='Captain')p.role='Company Captain'}}
 function v16Swear(id,kit){let p=S.people.find(x=>x.id===id);if(p){p.bannerless=false;p.issuedKit='dominus_'+kit;p.role=kit==='archer'?'Dominus Archer':'Dominus House Knight';p.portrait='wrong-oath.jpg'}}
 function makeStartState(){return{world:{},meta:{},people:[{id:'fresh',name:'Ser Wulfric Mere',role:'Bannerless Sergeant',voice:'YM',bannerless:true,gear:{}}]}}
 function migrateState(state){return state}
 function render(){return'base render'}
 function v34lConvoyLogistics(){return'base wagons'}
 function v98IssueHouseArmor(house){guardedCalls.push(house);return house}
 const styles=[];
 const document={
  body:null,
  head:{appendChild(node){styles.push(node.textContent)}},
  getElementById(){return null},
  querySelectorAll(){return[]},
  addEventListener(){},
  createElement(tag){return{tagName:String(tag).toUpperCase(),dataset:{},style:{},classList:{add(){}},setAttribute(){},querySelector(){return null},querySelectorAll(){return[]}}}
 };
 `,context,{filename:'aetherion-v98-test-runtime.js'});

// Run exactly as the Android updater does: indirect eval beside lexical classic-script globals.
vm.runInContext(`(0,eval)(${JSON.stringify(patch)})`,context,{filename:'aetherion-updater-eval.js'});
const api=context.AetherionV164Integrity;
assert.equal(api.version,'1.64.0');

const state=vm.runInContext('S',context);
const items=vm.runInContext('ITEMS',context);
const person=id=>state.people.find(p=>p.id===id);

assert.equal(person('ser').gender,'M','Ser must not be assigned a female model');
assert.equal(person('ser').voice,'YM','generic voice must agree with repaired identity');
assert.equal(person('ser').portrait,'assets/bannerless_knight.jpg');
assert.equal(person('dame').gender,'F','a legitimate Dame must remain female');
assert.equal(person('dame').portrait,'assets/bannerless_knight.jpg');
assert.equal(person('archer').portrait,'assets/bannerless_archer.jpg');
assert.equal(person('crossbow').portrait,'assets/bannerless_crossbowman.jpg');
assert.equal(person('foot').gender,'M','starting foot-service voice must defeat the old random gender overwrite');
assert.equal(person('foot').portrait,'assets/bannerless_swordsman.jpg');
assert.equal(api.roleArt('Company Captain'),'assets/bannerless_knight.jpg');

assert.deepEqual(Object.keys(api.itemArt).sort(),[...serviceIds,...footIds].sort());
for(const[id,path]of Object.entries(expectedItemArt))assert.equal(items[id].img,path,`${id} must use its own item image`);
assert.equal(items.svc_arming_coat.weight,1.05);
assert.equal(api.formatNumber(1.0499999999999998),'1.05');
assert.equal(api.formatNumber(3),'3');

vm.runInContext("v16PersonEquipment('ser')",context);
const equipmentHtml=vm.runInContext('opened',context);
assert.match(equipmentHtml,/assets\/items\/v25\/service\/svc_bascinet\.webp/);
assert.match(equipmentHtml,/assets\/items\/v25\/service\/svc_arming_coat\.webp/);
assert.match(equipmentHtml,/1\.05 kg/);
assert.doesNotMatch(equipmentHtml,/1\.0499999999999998/);
vm.runInContext("v16PersonEquipment('other')",context);
assert.equal(vm.runInContext('baseEquipmentCalls',context),1,'specialized non-retainer screens must remain intact');

vm.runInContext("setFormationRole('ser','Bannerless Crossbowman')",context);
assert.equal(person('ser').portrait,'assets/bannerless_crossbowman.jpg','formation reassignment must refresh portrait');
vm.runInContext("setRank('ser','Captain')",context);
assert.equal(person('ser').portrait,'assets/bannerless_knight.jpg','rank reassignment must refresh portrait');
vm.runInContext("v16Swear('ser','archer')",context);
assert.equal(person('ser').portrait,'assets/units/v16/archer.webp','oath conversion must refresh Dominus portrait');
person('ser').bannerless=true;person('ser').issuedKit='bannerless_knight_service';person('ser').role='Bannerless Knight';
vm.runInContext('v17RepairNames(S)',context);
assert.equal(person('ser').name,'Ser Tomas Vey','name repair must preserve the existing retainer identity');
assert.equal(person('ser').gender,'M');
assert.equal(person('dame').name,'Dame Ellyn Vey');
assert.equal(person('dame').gender,'F');

const fresh=vm.runInContext('makeStartState()',context);
assert.equal(fresh.people[0].gender,'M');
assert.equal(fresh.people[0].portrait,'assets/bannerless_sergeant.jpg');
assert.equal(fresh.meta.v164Integrity,'1.64.0');

assert.equal(api.foreignHouse('House Dominus'),null);
assert.equal(api.foreignHouse('White Harbor'),'white_harbor');
assert.equal(vm.runInContext("v98IssueHouseArmor('white_harbor')",context),false);
assert.deepEqual(Array.from(vm.runInContext('[...guardedCalls]',context)),[]);
assert.equal(vm.runInContext("v98IssueHouseArmor('dominus')",context),'dominus');
assert.deepEqual(Array.from(vm.runInContext('[...guardedCalls]',context)),['dominus']);

function button(text){return{textContent:text,dataset:{},style:{},disabled:false,hidden:false}}
const dominus=button('House Dominus'),white=button('White Harbor'),solaris=button('Solaris Royal Crown');
const nextHeading={tagName:'H3',textContent:'Weapon Loadout',nextElementSibling:null};
const buttonGrid={tagName:'DIV',nextElementSibling:nextHeading,matches:()=>false,querySelectorAll:()=>[dominus,white,solaris]};
const heading={tagName:'H3',textContent:'Issue Complete House Armor',nextElementSibling:buttonGrid,insertAdjacentElement(){},parentElement:{querySelector:()=>null}};
const root={querySelectorAll:selector=>selector==='h1,h2,h3,h4,h5,h6'?[heading]:[]};
assert.equal(api.sanitizeHouseIssue(root),2);
assert.equal(heading.textContent,'Issue House Dominus Armor');
assert.equal(dominus.hidden,false);
assert.equal(white.hidden,true);assert.equal(white.disabled,true);assert.equal(white.style.display,'none');
assert.equal(solaris.hidden,true);

const wagonImage={classList:{added:[],add(value){this.added.push(value)}}};
const wagonGrid={tagName:'DIV',nextElementSibling:null,classList:{added:[],add(value){this.added.push(value)}},querySelectorAll:()=>[wagonImage]};
const wagonHeading={tagName:'H3',textContent:'Wagonwright Classes',nextElementSibling:wagonGrid};
const wagonRoot={querySelectorAll:selector=>selector==='h1,h2,h3,h4'?[wagonHeading]:[]};
assert.equal(api.constrainWagons(wagonRoot),1);
assert.deepEqual(wagonGrid.classList.added,['v164-wagon-classes']);
assert.deepEqual(wagonImage.classList.added,['v164-wagon-class-image']);
const styles=vm.runInContext('styles.join("\\n")',context);
assert.match(styles,/v164-wagon-classes/);assert.match(styles,/max-height:168px/);assert.match(styles,/@media\(max-width:720px\)/);

assert.equal(vm.runInContext('persistCalls',context),1,'the one-time save migration must be persisted once');
assert.equal(state.meta.v164Integrity,'1.64.0');
console.log('v1.64.0 world/UI integrity patch: all assertions passed');
