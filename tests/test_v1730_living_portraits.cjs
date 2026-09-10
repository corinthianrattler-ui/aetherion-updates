'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const dataPatch = fs.readFileSync('patches/v1.73.0-portrait-data.js', 'utf8');
const livingPatch = fs.readFileSync('patches/v1.73.0-living-portraits.js', 'utf8');
const context = vm.createContext({console, setTimeout, clearTimeout});

vm.runInContext(`
 'use strict';
 const window=globalThis;
 const ITEMS={};
 function item(id,name,cat,weight,value,desc,extra={}){ITEMS[id]={id,name,cat,weight,value,desc,img:extra.img,stack:true,use:extra.use}}
 const V10_WORKER_ROLES=['Blacksmith','Male Farmer'];
 const V10_ROLE_GENDER={Blacksmith:'M'};
 const V14_JOB_ROLES=['Carpenter'];
 const V14_JOB_WAGES={Carpenter:6};
 const V15_JOBS=[{role:'Bannerless Knight',title:'Ser',gender:'M',skills:['martial'],cost:88,wage:34,military:true,bannerless:true},{role:'Man-at-Arms',title:'Veteran',skills:['martial'],cost:24,wage:15,military:true,bannerless:true}];
 const LOC={Greenville:{type:'village'},Solaris:{type:'town'},'Blood Keep Ruins':{type:'ruin'},Stonebridge:{type:'town'}};
 const V10_LOCAL_M=['Alden','Bram','Cedric'],V10_LOCAL_F=['Adela','Beatrix','Celia'],V10_LOCAL_S=['Ash','Bell','Vale'];
 const V15_MALE=V10_LOCAL_M,V15_FEMALE=V10_LOCAL_F,V15_SURNAMES=V10_LOCAL_S;
 function v15Hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
 function v15TownNames(loc){return Array.from({length:28},(_,i)=>({g:i%2?'F':'M',name:(i%2?V15_FEMALE:V15_MALE)[i%3]+' '+V15_SURNAMES[(i+1)%3]}))}
 function v14Trait(){return 'steady'}
 function v10WorkerFunction(role){return 'Base work for '+role}
 function v10WorkerArt(role){return 'assets/workers/'+role.toLowerCase().replaceAll(' ','_')+'.jpg'}
 function v10ResidentRoles(loc){return LOC[loc]?.type==='village'?['Male Farmer']:['Blacksmith']}
 function v10BuildResidents(loc){return v10ResidentRoles(loc).map((role,i)=>({id:'resident_'+loc.replaceAll(' ','_')+'_'+i,name:(V10_ROLE_GENDER[role]==='F'?'Adela':'Alden')+' Bell',surname:'Bell',gender:V10_ROLE_GENDER[role]||'M',age:31,role,job:v10WorkerFunction(role),location:loc,alive:true,permanent:true,portrait:'assets/workers/'+role.toLowerCase().replaceAll(' ','_')+'.jpg',family:[{id:'family_'+loc+'_'+i,name:'Tomas Bell',gender:'M',age:3,relation:'Child',alive:true,portraitIndex:0}]}))}
 function mkPerson(name,role,category,extra={}){return Object.assign({id:'made_'+name,name,role,category,gender:'M',age:30,portrait:null},extra)}
 function v15MakeCandidate(loc,i){return mkPerson('Candidate '+i,'Man-at-Arms','Military',{id:'candidate_'+i,bannerless:true,location:loc})}
 function v15EnsureSettlement(loc){S.v15.settlements[loc]??={location:loc,roster:[]};return S.v15.settlements[loc]}
 function v34lLaborCandidate(){return mkPerson('Loader One','Loader','Workers')}
 function v55Worker(){return mkPerson('Factor One','Shopkeeper','Workers')}
 function v17BondedStock(){return[]}
 function makePrisoner(){return mkPerson('Prisoner One','Captured Orc Gladiator','Prisoner',{race:'orc'})}
 function v10LocalFamilyPortrait(p){return 'assets/dynasty/'+(p.gender==='F'?'female':'male')+'_child_1.webp'}
 function lwMemberPortrait(p){return v10LocalFamilyPortrait(p)}
 function v10ResidentService(){serviceBaseCalls++}
 function v27Schedules(){scheduleBaseCalls++}
 function nearbyPeople(){nearbyBaseCalls++}
 function v27Banking(){bankViews++}
 function v27Deposit(){bankActions++}
 function v27Withdraw(){bankActions++}
 function v27MintSolaris(){bankActions++}
 function v27ReserveDominus(){bankActions++}
 function v27MintImperiums(){bankActions++}
 function v27FoundBank(){S.v27.banks.dominus.founded=true}
 function dailyTick(){S.world.day++}
 function makeStartState(){return JSON.parse(JSON.stringify(S))}
 function migrateState(x){return x}
 function persist(){persistCalls++}
 function log(kind,text){logs.push([kind,text])}
 function toast(text){toasts.push(text)}
 function v26Block(text){toasts.push(text)}
 function payCopper(){return true}
 function allAccessibleContainers(){return['Carried Inventory']}
 function mkStack(id,qty){return{itemId:id,qty}}
 function canAdd(){return true}
 function addItem(name,id,qty){inventory[id]=(inventory[id]||0)+qty;return true}
 function advanceHours(h){S.world.hour=(S.world.hour+h)%24}
 function closeModal(){}
 function render(){}
 function openModal(html){lastModal=html}
 function esc(v){return String(v)}
 function entityImage(path,name){return '<img src="'+path+'" alt="'+name+'">'}
 function peopleCards(rows){return rows.map(p=>p.name).join(',')}
 function shortText(v){return String(v)}
 let serviceBaseCalls=0,scheduleBaseCalls=0,nearbyBaseCalls=0,bankViews=0,bankActions=0,persistCalls=0,lastModal='',logs=[],toasts=[],inventory={};
 let imageErrorHandler=null;
 const document={head:{appendChild(){}},createElement(){return{id:'',textContent:''}},getElementById(){return null},addEventListener(type,handler){if(type==='error')imageErrorHandler=handler},querySelector(){return null}};
 const legacyCook='custom/npc-portraits/v168/legacy_cook.webp';
 const AetherionV168Portraits={registry:Array.from({length:111}),genderOf:p=>p?.gender==='F'?'F':'M',raceOf(p,context={}){let s=String(p?.race||p?.species||context.location||'human').toLowerCase();return s.includes('dark')?'darkelf':s.includes('dwarf')||s.includes('stonevein')?'dwarf':s.includes('orc')||s.includes('grimhorn')?'orc':s.includes('elf')?'elf':'human'},visualAge:p=>+p.age||0,tag:path=>path===legacyCook?{path,gender:'F',role:'Cook'}:null,compatible:(p,row)=>({ok:row?.path===legacyCook&&p?.gender==='F'&&p?.role==='Cook'}),select(){return null}};
 let S={meta:{rngSeed:'v173-test'},world:{day:14,hour:10,location:'Greenville',weather:{condition:'Clear'},permanentNPCs:{Greenville:v10BuildResidents('Greenville'),Solaris:v10BuildResidents('Solaris'),'Blood Keep Ruins':v10BuildResidents('Blood Keep Ruins')},laborMarkets:{Greenville:[],Solaris:[]},settlements:{Greenville:{health:60,prosperity:55},Solaris:{health:70,prosperity:70}}},market:{Greenville:[],Solaris:[]},people:[
  {id:'smith',name:'Rhea Bell',gender:'F',age:31,role:'Blacksmith',category:'Workers',location:'Greenville',portrait:'assets/workers/blacksmith.jpg'},
  {id:'archer',name:'Oren Reed',gender:'M',age:29,role:'Bannerless Archer',category:'Military',bannerless:true,location:'Greenville',portrait:'assets/units/archer.webp'},
  {id:'alexus',name:'Lady Alexus Dominus',gender:'F',age:18,role:'Exiled Lady',canonical:true,portrait:'assets/characters/alexus.webp'},
  {id:'custom',name:'Mara Custom',gender:'F',age:30,role:'Cook',portrait:'user/portraits/mara.webp'},
  {id:'legacy',name:'Celia Ash',gender:'F',age:32,role:'Cook',portrait:legacyCook},
  {id:'away',name:'Bram Faraway',gender:'M',age:34,role:'Cook',location:'Stonebridge',portrait:'assets/workers/cook.jpg'}
 ],court:{prisoners:[]},v15:{settlements:{Greenville:{location:'Greenville',roster:[]}}},v17:{settlements:{}},v23:{surgeons:[]},v28:{laborPool:[]},v61:{agents:[],people:{}},v27:{banks:{solaris:{name:'Solaris Crown Bank',location:'Solaris',balance:0},dominus:{name:'Dominus Reserve Bank',location:'Blood Keep Ruins',founded:false,balance:0}}},containers:{'Carried Inventory':{items:[]}}};
`, context, {filename:'v1730-test-runtime.js'});

vm.runInContext(`(0,eval)(${JSON.stringify(dataPatch)});(0,eval)(${JSON.stringify(livingPatch)})`, context, {filename:'v1730-updater-eval.js'});

const api = context.AetherionV173LivingPortraits;
assert(api);
assert.equal(api.version, '1.73.0');
assert.equal(api.registry.length, 268);
assert.equal(new Set(api.registry.map(row => row.path)).size, 268);
assert(api.registry.every(row => row.path.startsWith('https://raw.githubusercontent.com/corinthianrattler-ui/aetherion-updates/main/custom/npc-portraits/v173/')));
assert.equal(api.registry.filter(row => row.ambientOnly).length, 12);
assert(api.registry.some(row => row.role==='Peasant Laborer'&&row.aliases.includes('Farm Laborer')));

const get = expression => vm.runInContext(expression, context);
for (const id of ['honeycomb','beeswax','goat_milk','eggs']) assert(get(`!!ITEMS[${JSON.stringify(id)}]`));
for (const role of ['Banker','Beekeeper','Goatherd','Poultry Keeper','Skilled Artisan','Bannerless Archer','Bannerless Crossbowman','Bannerless Sergeant','Bannerless Swordsman','Footman','Militia Recruit']) assert(get(`V10_WORKER_ROLES.includes(${JSON.stringify(role)})`), role);
for (const role of ['Banker','Beekeeper','Goatherd','Poultry Keeper','Skilled Artisan','Bannerless Archer','Bannerless Crossbowman','Bannerless Sergeant','Bannerless Swordsman','Footman','Militia Recruit']) assert(get(`v10WorkerArt(${JSON.stringify(role)}).includes('/custom/npc-portraits/v173/')`), role+' registry art');
assert.equal(get('V15_JOBS.filter(j=>j.role.startsWith("Bannerless")||j.role==="Footman"||j.role==="Militia Recruit").length'), 7);

assert.equal(get('S.world.permanentNPCs.Greenville.some(p=>p.role==="Beekeeper"&&p.gender==="F"&&p.age>=22&&p.age<=39)'), true);
assert.equal(get('S.world.permanentNPCs.Greenville.some(p=>p.role==="Goatherd"&&p.gender==="M"&&p.age>=40)'), true);
assert.equal(get('S.world.permanentNPCs.Greenville.some(p=>p.role==="Poultry Keeper"&&p.gender==="F"&&p.age>=40)'), true);
assert.equal(get('S.world.permanentNPCs.Solaris.some(p=>p.role==="Banker"&&p.gender==="F"&&p.age>=48)'), true);
assert.equal(get('S.world.laborMarkets.Greenville.filter(p=>["Beekeeper","Goatherd","Poultry Keeper"].includes(p.role)).length'), 3);
assert.equal(get('S.world.laborMarkets.Greenville.filter(p=>p.role==="Skilled Artisan"&&p.portrait.includes("/custom/npc-portraits/v173/")).length'), 1);
assert.equal(get('S.v15.settlements.Greenville.roster.filter(p=>p.id.startsWith("v173_")).length'), 2);

const smith = get('S.people.find(p=>p.id==="smith")');
const archer = get('S.people.find(p=>p.id==="archer")');
assert(smith.portrait.includes('/custom/npc-portraits/v173/'));
assert(archer.portrait.includes('/custom/npc-portraits/v173/'));
assert.equal(api.compatible(smith, api.registry.find(row => row.path === smith.portrait)).ok, true);
assert.equal(api.compatible(archer, api.registry.find(row => row.path === archer.portrait)).ok, true);
assert.equal(get('S.people.find(p=>p.id==="alexus").portrait'), 'assets/characters/alexus.webp');
assert.equal(get('S.people.find(p=>p.id==="custom").portrait'), 'user/portraits/mara.webp');
assert.equal(get('S.people.find(p=>p.id==="legacy").portrait'), 'custom/npc-portraits/v168/legacy_cook.webp');
assert.equal(api.select({id:'alias',name:'Adela Field',gender:'F',age:31,role:'Farm Laborer'}).role, 'Peasant Laborer');
assert.equal(api.select({id:'bonded',name:'Anya Blackwater',gender:'F',age:25,role:'Farm Laborer'},{location:'Grimhorn',bonded:true}).race, 'human');
assert.equal(api.select({id:'bonded-dwarf-market',name:'Aegon Rookwood',gender:'M',age:29,role:'Farm Laborer'},{location:'Stonevein Halls',bonded:true}).race, 'human');

for (const [age,gender,band] of [[0,'M','baby'],[3,'F','toddler'],[15,'M','teen']]) {
 const person = {id:`youth-${age}`,name:'Household Youth',gender,age,role:band==='teen'?'Teen Boy':'Child',relation:'Child'};
 const row = api.select(person,{ambient:true});
 assert(row, `${band} portrait missing`);
 assert.equal(row.ageBand, band);
 assert.equal(row.gender, gender);
 assert.equal(row.ambientOnly, true);
}
const teen = {name:'Young Worker',gender:'F',age:15,role:'Beekeeper'};
assert.equal(api.compatible(teen, api.registry.find(row => row.role==='Beekeeper')).ok, false);
assert.equal(api.select(teen), null, 'a teen must never receive an adult worker portrait');
const swornKnight = {name:'Sworn Knight',gender:'M',age:28,role:'Knight',bannerless:false};
assert.equal(api.compatible(swornKnight, api.registry.find(row => row.role==='Bannerless Knight'&&row.gender==='M'&&row.ageBand==='young')).reason, 'wrong-allegiance');

const childPortrait = get("v10LocalFamilyPortrait({id:'child',name:'Tomas Bell',gender:'M',age:3,relation:'Child'})");
assert(childPortrait.includes('/custom/npc-portraits/v173/'));
assert.equal(api.registry.find(row => row.path===childPortrait).ageBand, 'toddler');

const recovered = get(`(()=>{let stopped=false,node={tagName:'IMG',dataset:{},src:S.people.find(p=>p.id==='archer').portrait,onerror(){throw Error('inline fallback ran')}};imageErrorHandler({target:node,preventDefault(){},stopImmediatePropagation(){stopped=true}});return{src:node.src,onerror:node.onerror,stopped,marked:node.dataset.v173Recovered}})()`);
assert.match(recovered.src, /^assets\/dynasty\/male_young_1\.webp$/);
assert.equal(recovered.onerror, null);
assert.equal(recovered.stopped, true);
assert.equal(recovered.marked, '1');

const checksBefore = api.runtime.recordsChecked;
get('for(let i=0;i<12;i++){migrateState(S);scheduleForProbe=AetherionV173LivingPortraits.scheduleFor({age:3},10)}');
assert.equal(api.runtime.recordsChecked, checksBefore, 'already-migrated saves and schedule reads must not rescan the world');
assert.equal(api.scheduleFor({age:32,relation:'Spouse',household:true},10).phase, 'household duties');
get('v27Schedules()');
assert.equal(get('scheduleBaseCalls'), 1, 'the enhanced schedule must preserve the original schedule ledger update');
assert.equal(get('lastModal.includes("Bram Faraway")'), false, 'the local schedule must exclude people stationed elsewhere');
get('nearbyPeople()');
assert.equal(get('nearbyBaseCalls'), 1, 'the household section must extend, not replace, the original People Here view');

get('S.v173.lastWeek=Math.floor(S.world.day/7)-1;AetherionV173LivingPortraits.worldTick(S)');
assert(get('S.v173.rural.Greenville.lastYield'));
assert(get('S.market.Greenville.some(row=>["honeycomb","beeswax","goat_milk","eggs"].includes(row.itemId))'));
assert(get('S.world.settlements.Greenville.prosperity>55'));

get('S.world.location="Solaris";S.world.hour=10;S.world.day=15');
assert.equal(api.bankOpen('solaris'), true);
get('v27Deposit("solaris")');
assert.equal(get('bankActions'), 1);
get('S.world.hour=20;v27Deposit("solaris")');
assert.equal(get('bankActions'), 1, 'closed bank counter must not execute a transaction');
assert(get('toasts.some(text=>text.includes("08:00"))'));

const audit = api.auditState();
assert.equal(audit.wrong.length, 0);
assert.equal(audit.eligibleUnassigned.length, 0);
assert.equal(audit.youthWorkers, 0);
assert.equal(get('S.meta.v173LivingPortraits.newPortraits'), 268);
assert.equal(get('S.meta.v173LivingPortraits.totalCuratedPortraits'), 379);
assert.equal(get('S.meta.v173LivingPortraits.youthAreWorkers'), false);
assert.equal(get('persistCalls'), 1);

console.log('v1.73.0 portrait routing, named-art protection, ambient youth, new jobs, production, schedules, banking hours, and redraw safety passed');
