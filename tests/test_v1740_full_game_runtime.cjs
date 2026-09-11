'use strict';

const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const gameRoot=process.argv[2];
if(!gameRoot){console.log('v1.73.8 full-game runtime skipped (pass an extracted assets/game path)');process.exit(0)}
const index=fs.readFileSync(path.join(gameRoot,'index.html'),'utf8');
const worldSource=fs.readFileSync(path.join(gameRoot,'patches/v1.74.0-stable-bundle.js'),'utf8');
const scripts=[...index.matchAll(/<script[^>]+src=["']([^"']+)/g)].map(match=>match[1].split('?')[0]).filter(src=>!src.startsWith('http'));

function storage(){const rows=new Map();return{getItem:key=>rows.has(key)?rows.get(key):null,setItem:(key,value)=>rows.set(key,String(value)),removeItem:key=>rows.delete(key),clear:()=>rows.clear()}}
function element(){return{style:{setProperty(){},removeProperty(){}},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},children:[],append(){},appendChild(){},prepend(){},remove(){},replaceChildren(){},insertAdjacentHTML(){},addEventListener(){},removeEventListener(){},setAttribute(){},getAttribute(){return null},querySelector(){return null},querySelectorAll(){return[]},closest(){return null},getContext(){return null},play(){return Promise.resolve()},pause(){},load(){},focus(){},click(){},innerHTML:'',textContent:'',value:'',checked:false,disabled:false}}
let randomSeed=0x1733cafe;const testMath=Object.create(Math);testMath.random=()=>{randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0;return randomSeed/4294967296};
const elements=new Map(),byId=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)};
const document={readyState:'loading',baseURI:'https://appassets.androidplatform.net/assets/game/index.html',head:element(),body:element(),documentElement:element(),createElement:element,createTextNode:value=>({textContent:String(value)}),getElementById:byId,querySelector(){return null},querySelectorAll(){return[]},addEventListener(){},removeEventListener(){}};
const sandbox={console,Math:testMath,document,localStorage:storage(),sessionStorage:storage(),navigator:{userAgent:'aetherion-integration-test',vibrate(){}},location:{href:document.baseURI,protocol:'https:',hostname:'appassets.androidplatform.net',reload(){}},performance:{now:()=>0},crypto:crypto.webcrypto,TextEncoder,TextDecoder,URL,Blob,Response,Request,Headers,AbortController,structuredClone,atob:value=>Buffer.from(String(value),'base64').toString('binary'),btoa:value=>Buffer.from(String(value),'binary').toString('base64'),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},requestAnimationFrame:()=>0,cancelAnimationFrame(){},matchMedia:()=>({matches:false,addEventListener(){}}),fetch:async()=>new Response('',{status:404}),Image:class{},Audio:class{play(){return Promise.resolve()}pause(){}},MutationObserver:class{observe(){}disconnect(){}},ResizeObserver:class{observe(){}disconnect(){}},addEventListener(){},removeEventListener(){},confirm:()=>true,speechSynthesis:{getVoices(){return[]},addEventListener(){},cancel(){},speak(){}},SpeechSynthesisUtterance:class{}};
sandbox.window=sandbox;sandbox.globalThis=sandbox;sandbox.self=sandbox;
const context=vm.createContext(sandbox);

for(const relative of scripts){const target=path.join(gameRoot,relative);assert(fs.existsSync(target),`missing packaged script ${relative}`);vm.runInContext(fs.readFileSync(target,'utf8'),context,{filename:relative})}

const api=sandbox.AetherionV173LivingPortraits;
const knightApi=sandbox.AetherionV1731KnightDiversity;
const timeApi=sandbox.AetherionV1736Time;
assert(api);
assert(knightApi);
assert(timeApi);
const resilienceApi=sandbox.AetherionV1738PortraitResilience;
assert.equal(resilienceApi?.version,'1.74.0');
assert.equal(api.registry.length,268);
assert.equal(knightApi.registry.length,16);
assert.equal(knightApi.generated.length,12);
assert.deepEqual(Object.fromEntries(Object.entries(timeApi.scenes)),{make:'make-camp.mp4',strike:'strike-camp.mp4',food:'camp-food.mp4',sleep:'camp-sleep.mp4',guard:'guard-watch.mp4'});
vm.runInContext('S=makeStartState()',context);
const get=source=>vm.runInContext(source,context);
assert.equal(get('S.meta.v173LivingPortraits.version'),'1.73.0');
assert.equal(get('S.meta.v173LivingPortraits.youthAreWorkers'),false);
assert.equal(get('S.meta.v173LivingPortraits.totalCuratedPortraits'),379);
assert.equal(get('S.meta.v1731KnightDiversity.version'),'1.73.1');
assert.equal(get('S.meta.v1731KnightDiversity.contentRemoved'),0);
assert.equal(get('S.meta.v1731KnightDiversity.redrawWorldScans'),false);
assert.equal(get('S.meta.v1738PortraitResilience.version'),'1.74.0');
assert.equal(get('S.meta.v1738PortraitResilience.headFallback'),false);
assert.equal(get('S.meta.v1738PortraitResilience.contentRemoved'),0);
const shell=get('mainShell()');
assert.match(shell,/aethTimeHeader/);
assert.match(shell,/aethSkyClock/);
assert.match(shell,/aethBloodMoon/);
assert.doesNotMatch(shell,/Kingdom Come/i);
assert.match(worldSource,/aethTimeHeader>.aethSkyClock\{position:relative!important;order:1;flex:0 0 82px/);
assert.doesNotMatch(worldSource,/aethTimeHeader>.aethSkyClock\{[^}]*position:absolute/);
assert.doesNotMatch(worldSource,/aethSkyClock\{top:160px/);
assert.match(get('storyTab()'),/SLEEP UNTIL DAWN/);
assert.match(get('characterTab()'),/SLEEP UNTIL DAWN/);
const knights=get(`S.people.filter(p=>p.role==='Lesser Knight'||p.role==='Company Captain').map(p=>({id:p.id,name:p.name,gender:p.gender,age:p.age,bannerless:p.bannerless,portrait:p.portrait}))`);
assert.equal(knights.length,20);
assert(knights.every(p=>p.gender==='M'&&p.bannerless===true));
assert(knights.every(p=>/custom\/npc-portraits\/v173(?:1)?\//.test(p.portrait)));
assert(knights.every(p=>!p.portrait.includes('/assets/dynasty/')&&!p.portrait.includes('/assets/units/')));
const knightAudit=knightApi.auditState(get('S'));
assert.equal(knightAudit.wrong.length,0,JSON.stringify(knightAudit.wrong,null,2));
assert.equal(knightAudit.headshots.length,0,JSON.stringify(knightAudit.headshots,null,2));
assert.equal(knightAudit.roster,20);
assert.equal(knightAudit.unique,10);
assert(knightAudit.maxReuse<=3,JSON.stringify(knightAudit,null,2));
assert.equal(get(`S.people.filter(p=>p.role==='Lesser Knight'||p.role==='Company Captain').every(p=>{let row=AetherionV1731KnightDiversity.registry.find(r=>r.path===p.portrait);return row&&row.gender===p.gender&&row.ageBand===(AetherionV168Portraits.visualAge(p)<40?'young':'older')})`),true);

const woman=get(`(()=>{let p={id:'future_woman_knight',name:'Ser Alys Test',gender:'F',age:31,role:'Lesser Knight',rank:'Lesser Knight',alive:true,portrait:'assets/dynasty/female_adult_1.webp'};AetherionV1731KnightDiversity.assignOne(p);let row=AetherionV1731KnightDiversity.registry.find(r=>r.path===p.portrait);return{p,row}})()`);
assert.equal(woman.row.gender,'F');
assert.equal(woman.row.ageBand,'young');
const authoredKnight=get(`(()=>{let p={id:'custom_knight',name:'Custom Knight',gender:'F',age:44,role:'Lesser Knight',alive:true,customCompanion:true,portrait:'user/portraits/custom-knight.webp'};AetherionV1731KnightDiversity.assignOne(p);return p})()`);
assert.equal(authoredKnight.portrait,'user/portraits/custom-knight.webp');
const stableKnightPaths=get(`S.people.filter(p=>p.role==='Lesser Knight'||p.role==='Company Captain').map(p=>p.portrait)`);
get('AetherionV1731KnightDiversity.repairState(S)');
assert.deepEqual(Array.from(get(`S.people.filter(p=>p.role==='Lesser Knight'||p.role==='Company Captain').map(p=>p.portrait)`)),Array.from(stableKnightPaths),'current-version migration must be idempotent');
const mutationId=get(`S.people.find(p=>p.role==='Lesser Knight').id`);
get(`setFormationRole('${mutationId}','Footman')`);
assert.equal(get(`S.people.find(p=>p.id==='${mutationId}').role`),'Footman');
assert.equal(get(`AetherionV1731KnightDiversity.registry.some(r=>r.path===S.people.find(p=>p.id==='${mutationId}').portrait)`),false,'leaving the role must release knight-only art');
get(`setFormationRole('${mutationId}','Lesser Knight')`);
assert.equal(get(`AetherionV1731KnightDiversity.registry.some(r=>r.path===S.people.find(p=>p.id==='${mutationId}').portrait)`),true,'returning to the role must assign compatible knight art');

const identityChecksBefore=get('AetherionV167Integrity.runtime.recordsChecked');
const knightCards=get(`peopleCards(S.people.filter(p=>p.role==='Lesser Knight'||p.role==='Company Captain'))`);
assert.equal(get('AetherionV167Integrity.runtime.recordsChecked'),identityChecksBefore,'roster rendering must not repair every person again');
assert(knightCards.includes('loading="lazy" decoding="async" fetchpriority="low"'));
assert(!knightCards.includes('cdn.jsdelivr.net'));
assert(knightCards.includes('custom/npc-portraits/v173'));
assert(!knightCards.includes('raw.githubusercontent.com'));
assert(knightCards.includes('Ser Owyn Carr')&&knightCards.includes('Morale')&&knightCards.includes('Order:'));
assert.equal(knightApi.runtime.renderRepairs,0);
const structurePasses=api.runtime.structuralPasses;
get('AetherionV173LivingPortraits.ensureState(S);AetherionV173LivingPortraits.ensureState(S);AetherionV173LivingPortraits.worldTick(S)');
assert.equal(api.runtime.structuralPasses,structurePasses,'settlement and labor structure setup must remain one-time');

const repairedCloneSave=get(`(()=>{let people=S.people.filter(p=>p.role==='Lesser Knight'||p.role==='Company Captain').map(p=>({...p,portrait:'assets/dynasty/male_adult_1.webp'})),save={world:{day:0,permanentNPCs:{},laborMarkets:{}},meta:{},people,v173:{version:'1.73.0',lastWeek:0,rural:{},structures:'1.73.1-bounded'}};AetherionV1731KnightDiversity.repairState(save);return AetherionV1731KnightDiversity.auditState(save)})()`);
assert.equal(repairedCloneSave.wrong.length,0);
assert.equal(repairedCloneSave.headshots.length,0);
assert.equal(repairedCloneSave.unique,10);
assert(repairedCloneSave.maxReuse<=3);
const alreadyMarkedClone=get(`(()=>{let save=structuredClone(S);save.meta.v1738PortraitResilience={version:'1.73.8',headFallback:false};save.meta.v173LivingPortraits={version:'1.73.0'};save.meta.v1731KnightDiversity={version:'1.73.1'};for(const p of save.people)if(p.role==='Lesser Knight'||p.role==='Company Captain')p.portrait='assets/dynasty/male_adult_1.webp';save=migrateState(save);return{marker:save.meta.v1738PortraitResilience,audit:AetherionV1731KnightDiversity.auditState(save),cards:peopleCards(save.people)}})()`);
assert.equal(alreadyMarkedClone.marker.version,'1.74.0');
assert.equal(alreadyMarkedClone.marker.headFallback,false);
assert.equal(alreadyMarkedClone.audit.wrong.length,0);
assert.equal(alreadyMarkedClone.audit.headshots.length,0);
assert.equal(alreadyMarkedClone.audit.unique,10);
assert(alreadyMarkedClone.cards.includes('custom/npc-portraits/v173'));
assert(!alreadyMarkedClone.cards.includes('assets/dynasty'));

const uncoveredRoles=get(`(()=>{let pools=new Set([...V10_WORKER_ROLES,...V14_JOB_ROLES,...V15_JOBS.map(job=>job.role)]),dedicated=new Set(['Loader','Teamster','Wheelwright','Privateer Captain','Marine Captain','Surgeon','Shopkeeper']);return[...new Set(AetherionV173LivingPortraits.registry.filter(row=>!row.ambientOnly).map(row=>row.role))].filter(role=>{let row=AetherionV173LivingPortraits.registry.find(item=>item.role===role),terms=[row.role,...row.aliases];return!terms.some(term=>pools.has(term))&&!dedicated.has(role)})})()`);
assert.deepEqual(Array.from(uncoveredRoles),[],'every adult catalog role must have a worker, labor, recruit, commerce, maritime, or medicine system');
assert.equal(get("typeof v34lLaborCandidate==='function'&&typeof v28SeedLabor==='function'&&typeof v23BaseState==='function'&&typeof v55Worker==='function'"),true);

const rural=get(`S.world.permanentNPCs.Goldmeadow.filter(p=>['Beekeeper','Goatherd','Poultry Keeper'].includes(p.role)).map(p=>({role:p.role,gender:p.gender,age:p.age,portrait:p.portrait}))`);
assert.equal(rural.length,3);
assert.deepEqual(Array.from(rural,row=>row.role).sort(),['Beekeeper','Goatherd','Poultry Keeper']);
assert(rural.every(row=>row.portrait.includes('custom/npc-portraits/v173/')));
assert.equal(rural.find(row=>row.role==='Beekeeper').gender,'F');
assert.equal(rural.find(row=>row.role==='Goatherd').gender,'M');
assert.equal(rural.find(row=>row.role==='Poultry Keeper').gender,'F');
assert.equal(get('S.world.permanentNPCs.Solaris.some(p=>p.role==="Banker"&&p.gender==="F"&&p.age>=48&&p.portrait.includes("custom/npc-portraits/v173/"))'),true);
assert.equal(get('S.world.laborMarkets.Goldmeadow.filter(p=>["Beekeeper","Goatherd","Poultry Keeper"].includes(p.role)).length'),3);
assert.equal(get('S.world.laborMarkets.Goldmeadow.filter(p=>p.role==="Skilled Artisan"&&p.portrait.includes("custom/npc-portraits/v173/")).length'),1);
const logistics=get('S.world.laborMarkets.Goldmeadow.filter(p=>["Loader","Teamster","Wheelwright"].includes(p.role))');
assert.equal(logistics.length,3);
assert(logistics.every(p=>p.portrait.includes('custom/npc-portraits/v173/')));
const surgeons=get('S.v23.surgeons.map(p=>({name:p.name,role:p.role,gender:p.gender,age:p.age,portrait:p.portrait}))');
assert(surgeons.every(p=>p.role==='Surgeon'&&/^assets\/v29\/portraits\/surgeon_(?:ysabet|halric)\.webp$/.test(p.portrait)),JSON.stringify(surgeons,null,2));
assert.equal(get('S.v28.laborPool.find(p=>p.name==="Quartermaster Halric Morn").portrait'), 'assets/v29/portraits/quartermaster_halric.webp');
const eligibleShopPortraits=get(`S.world.permanentNPCs.Solaris.filter(p=>p.shopKey&&AetherionV173LivingPortraits.select(p,{location:'Solaris'})).map(p=>{let earlier=AetherionV168Portraits.tag(p.portrait);return{name:p.name,role:p.role,portrait:p.portrait,compatible:p.portrait.includes('custom/npc-portraits/v173/')||!!(earlier&&AetherionV168Portraits.compatible(p,earlier,{location:'Solaris'}).ok)}})`);
assert.equal(eligibleShopPortraits.length,6);
assert(eligibleShopPortraits.every(p=>p.compatible),JSON.stringify(eligibleShopPortraits,null,2));

const originalRecruitPortraits=get(`(()=>{let found={};for(let i=0;i<160;i++){let p=v15MakeCandidate('Solaris',i);if(['Bannerless Knight','Man-at-Arms','Courtesan'].includes(p.role)&&!found[p.role])found[p.role]=p.portrait}return found})()`);
for(const role of ['Bannerless Knight','Man-at-Arms','Courtesan'])assert(originalRecruitPortraits[role]?.includes('custom/npc-portraits/v173/'),`${role} retained ${originalRecruitPortraits[role]||'no portrait'}`);
const bondedMarkets=get(`['Stonevein Halls','Grimhorn'].flatMap(location=>(S.v17.settlements[location]?.bonded||[]).map(p=>({location,name:p.name,portrait:p.portrait,race:AetherionV173LivingPortraits.registry.find(row=>row.path===p.portrait)?.race})))`);
assert.equal(bondedMarkets.length,10);
assert(bondedMarkets.every(p=>p.portrait.includes('custom/npc-portraits/v173/')&&p.race==='human'),JSON.stringify(bondedMarkets,null,2));

get('v15EnsureSettlement("Goldmeadow")');
assert.equal(get('S.v15.settlements.Goldmeadow.roster.filter(p=>p.id.startsWith("v173_")).length'),2);
assert.equal(get('S.v15.settlements.Goldmeadow.roster.filter(p=>p.id.startsWith("v173_")).every(p=>p.portrait.includes("custom/npc-portraits/v173/"))'),true);

const toddler=get(`(()=>{let p={id:'runtime_toddler',name:'Tomas Test',gender:'M',age:3,relation:'Child'};let portrait=v10LocalFamilyPortrait(p);return{portrait,band:AetherionV173LivingPortraits.registry.find(r=>r.path===portrait)?.ageBand}})()`);
assert(toddler.portrait.includes('custom/npc-portraits/v173/'));
assert.equal(toddler.band,'toddler');
assert.equal(api.select({name:'Underage Keeper',gender:'F',age:15,role:'Beekeeper'}),null);

const alexus=get('S.people.find(p=>p.name==="Lady Alexus Dominus")');
assert(alexus);
assert(!alexus.portrait.includes('custom/npc-portraits/v173/'));
const audit=api.auditState(get('S'));
assert.equal(audit.wrong.length,0,JSON.stringify(audit.wrong.slice(0,12),null,2));
assert.equal(audit.eligibleUnassigned.length,0,JSON.stringify(audit.eligibleUnassigned.slice(0,12),null,2));
assert.equal(audit.youthWorkers,0);
const earlierAudit=get('AetherionV168Portraits.auditState(S)');
assert(earlierAudit.assigned>0,'the earlier curated library must remain in circulation');
assert.equal(earlierAudit.wrong.length,0,JSON.stringify(earlierAudit.wrong.slice(0,12),null,2));
assert(audit.assigned>0,'the new portrait library must be in circulation');

get('S.world.day=7;S.v173.lastWeek=0;AetherionV173LivingPortraits.worldTick(S)');
assert.equal(get('S.v173.rural.Goldmeadow.lastYield.week'),1);
assert.equal(get('S.market.Goldmeadow.some(row=>["honeycomb","beeswax","goat_milk","eggs"].includes(row.itemId))'),true);

get('S.world.location="Solaris";S.world.hour=10;S.world.day=8');
assert.equal(api.bankOpen('solaris'),true);
get('S.world.hour=20');
assert.equal(api.bankOpen('solaris'),false);

get('S.world.location="Goldmeadow";S.world.hour=11');
const checks=api.runtime.recordsChecked;
const legacyChecks=get('AetherionV167Integrity.runtime.recordsChecked');
const curatedBefore=get(`JSON.stringify({knights:S.people.filter(p=>p.role==='Lesser Knight'||p.role==='Company Captain').map(p=>p.portrait),rural:S.world.permanentNPCs.Goldmeadow.filter(p=>['Beekeeper','Goatherd','Poultry Keeper'].includes(p.role)).map(p=>p.portrait),labor:S.world.laborMarkets.Goldmeadow.map(p=>p.portrait)})`);
get('nearbyPeople();v27Schedules();render();migrateState(S)');
assert.equal(api.runtime.recordsChecked,checks,'real packaged redraw, schedule, and migrated-save paths must not rescan people');
assert.equal(get('AetherionV167Integrity.runtime.recordsChecked'),legacyChecks,'legacy identity migration must not rescan or overwrite the current world during redraw');
assert.equal(get(`JSON.stringify({knights:S.people.filter(p=>p.role==='Lesser Knight'||p.role==='Company Captain').map(p=>p.portrait),rural:S.world.permanentNPCs.Goldmeadow.filter(p=>['Beekeeper','Goatherd','Poultry Keeper'].includes(p.role)).map(p=>p.portrait),labor:S.world.laborMarkets.Goldmeadow.map(p=>p.portrait)})`),curatedBefore,'redraw must not restore dynasty headshots');
const commerceChecks=get('AetherionV167Integrity.runtime.recordsChecked');
get('v55Ensure(S);v55Ensure(S)');
assert.equal(get('AetherionV167Integrity.runtime.recordsChecked'),commerceChecks,'unchanged shop setup must not rescan all people');
assert(knightApi.runtime.legacyUpgradeSkips>=3);
assert(knightApi.runtime.commerceEnsureSkips>=2);
assert.equal(api.auditState(get('S')).wrong.length,0);

get(`S.v24.camp.active=false;S.v24.camp.placements[0]={kind:'military',name:'Ten-Man Tent',item:'military_ten_man_tent',capacity:10};S.v24.camp.cookReady=true`);
assert.match(get('v24CampMap()'),/MAKE CAMP/);
assert.match(get('v24CampMap()'),/SLEEP UNTIL DAWN/);
assert.match(get('v24CampMap()'),/WAIT \/ PASS TIME/);
let campClock=get('v14Now()');get('v24EstablishCamp()');assert.equal(get('v14Now()')-campClock,2);assert.equal(timeApi.runtime.plays.make,1);let campScene=get('document.getElementById("modalRoot").innerHTML');assert.match(campScene,/make-camp\.mp4/);assert.match(campScene,/poster="[^"]+make-camp\.webp"/);assert.match(campScene,/>SKIP<\/button>/);assert.doesNotMatch(campScene,/\scontrols(?:\s|=|>)/);assert.doesNotMatch(campScene,/>PLAY<|RETURN TO CAMP/);assert.match(get('v24CampMap()'),/TAKE DOWN CAMP/);
get('v24AssignWatch()');assert.equal(get('S.v24.camp.watchers.length'),0,'guard assignment must fail without a physical Watch Post');assert.equal(timeApi.runtime.plays.guard,0,'blocked guard assignment must not play a film');
get(`(()=>{let guard=S.people.find(p=>p.alive&&/Knight|Footman|Captain|Sergeant|Swordsman/.test(String(p.role)+' '+String(p.rank)));guard.location=S.world.location;S.v24.camp.placements[1]={kind:'watch',name:'Watch Post',item:'camp_watch_kit',capacity:0};v24AssignWatch()})()`);assert(get('S.v24.camp.watchers.length')>0,'an established camp with a Watch Post must accept eligible guards');assert.equal(timeApi.runtime.plays.guard,1);assert.match(get('document.getElementById("modalRoot").innerHTML'),/guard-watch\.mp4/);assert.match(get('document.getElementById("modalRoot").innerHTML'),/guard-watch\.webp/);
get('v24RemovePlot(1)');assert.equal(get('S.v24.camp.watchers.length'),0,'removing the final Watch Post must clear its guards');
campClock=get('v14Now()');get('v24EstablishCamp()');assert.equal(get('v14Now()')-campClock,1);assert.equal(timeApi.runtime.plays.strike,1);assert.match(get('document.getElementById("modalRoot").innerHTML'),/strike-camp\.mp4/);
get(`S.v24.camp.active=true;S.v24.camp.cookReady=true;v24Add('Carried Inventory','salted_meat',100);v24Add('Carried Inventory','firewood',20)`);
campClock=get('v14Now()');get('v24CookMeal()');assert.equal(get('v14Now()')-campClock,2);assert.equal(timeApi.runtime.plays.food,1);assert.match(get('document.getElementById("modalRoot").innerHTML'),/camp-food\.mp4/);
const skyBeforeSleep=get('AetherionV1736Time.celestial()');
const sleepSpan=(skyBeforeSleep.dawn-skyBeforeSleep.hour+24)%24||24;
campClock=get('v14Now()');get('v24SleepCamp()');assert(Math.abs((get('v14Now()')-campClock)-sleepSpan)<1e-8);assert(Math.abs(get('S.world.hour')-skyBeforeSleep.dawn)<1e-8);assert.equal(timeApi.runtime.plays.sleep,1);assert.match(get('document.getElementById("modalRoot").innerHTML'),/camp-sleep\.mp4/);
const awakeBeforeWait=get('AetherionV1736Time.state().awakeHours'),energyBeforeWait=get('S.player.energy');
get('AetherionV1736Time.wait(1)');assert.equal(get('AetherionV1736Time.state().awakeHours'),awakeBeforeWait+1);assert(get('S.player.energy')<=energyBeforeWait);

console.log(`v1.74.0 current-game runtime: ${scripts.length} packaged scripts, marked-clone save repair, local full-body delivery, corrected sky-dial placement, seasonal sleep-to-dawn, moon phases, waiting, wakefulness, five camp films, Watch Post gate, diversity, residents, recruits, production, views, and migration passed`);
