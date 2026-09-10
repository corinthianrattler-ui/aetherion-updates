'use strict';

const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const gameRoot=process.argv[2];
if(!gameRoot){console.log('v1.73.0 full-game runtime skipped (pass an extracted assets/game path)');process.exit(0)}
const index=fs.readFileSync(path.join(gameRoot,'index.html'),'utf8');
const scripts=[...index.matchAll(/<script[^>]+src=["']([^"']+)/g)].map(match=>match[1].split('?')[0]).filter(src=>!src.startsWith('http'));

function storage(){const rows=new Map();return{getItem:key=>rows.has(key)?rows.get(key):null,setItem:(key,value)=>rows.set(key,String(value)),removeItem:key=>rows.delete(key),clear:()=>rows.clear()}}
function element(){return{style:{setProperty(){},removeProperty(){}},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},children:[],append(){},appendChild(){},prepend(){},remove(){},replaceChildren(){},insertAdjacentHTML(){},addEventListener(){},removeEventListener(){},setAttribute(){},getAttribute(){return null},querySelector(){return null},querySelectorAll(){return[]},closest(){return null},getContext(){return null},play(){return Promise.resolve()},pause(){},load(){},focus(){},click(){},innerHTML:'',textContent:'',value:'',checked:false,disabled:false}}
const elements=new Map(),byId=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)};
const document={readyState:'loading',baseURI:'https://appassets.androidplatform.net/assets/game/index.html',head:element(),body:element(),documentElement:element(),createElement:element,createTextNode:value=>({textContent:String(value)}),getElementById:byId,querySelector(){return null},querySelectorAll(){return[]},addEventListener(){},removeEventListener(){}};
const sandbox={console,document,localStorage:storage(),sessionStorage:storage(),navigator:{userAgent:'aetherion-integration-test',vibrate(){}},location:{href:document.baseURI,protocol:'https:',hostname:'appassets.androidplatform.net',reload(){}},performance:{now:()=>0},crypto:crypto.webcrypto,TextEncoder,TextDecoder,URL,Blob,Response,Request,Headers,AbortController,structuredClone,atob:value=>Buffer.from(String(value),'base64').toString('binary'),btoa:value=>Buffer.from(String(value),'binary').toString('base64'),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},requestAnimationFrame:()=>0,cancelAnimationFrame(){},matchMedia:()=>({matches:false,addEventListener(){}}),fetch:async()=>new Response('',{status:404}),Image:class{},Audio:class{play(){return Promise.resolve()}pause(){}},MutationObserver:class{observe(){}disconnect(){}},ResizeObserver:class{observe(){}disconnect(){}},addEventListener(){},removeEventListener(){},confirm:()=>true,speechSynthesis:{getVoices(){return[]},addEventListener(){},cancel(){},speak(){}},SpeechSynthesisUtterance:class{}};
sandbox.window=sandbox;sandbox.globalThis=sandbox;sandbox.self=sandbox;
const context=vm.createContext(sandbox);

for(const relative of scripts){const target=path.join(gameRoot,relative);assert(fs.existsSync(target),`missing packaged script ${relative}`);vm.runInContext(fs.readFileSync(target,'utf8'),context,{filename:relative})}
vm.runInContext(fs.readFileSync('patches/v1.73.0-portrait-data.js','utf8'),context,{filename:'v1.73.0-portrait-data.js'});
vm.runInContext(fs.readFileSync('patches/v1.73.0-living-portraits.js','utf8'),context,{filename:'v1.73.0-living-portraits.js'});

const api=sandbox.AetherionV173LivingPortraits;
assert(api);
assert.equal(api.registry.length,268);
vm.runInContext('S=makeStartState()',context);
const get=source=>vm.runInContext(source,context);
assert.equal(get('S.meta.v173LivingPortraits.version'),'1.73.0');
assert.equal(get('S.meta.v173LivingPortraits.youthAreWorkers'),false);
assert.equal(get('S.meta.v173LivingPortraits.totalCuratedPortraits'),379);

const uncoveredRoles=get(`(()=>{let pools=new Set([...V10_WORKER_ROLES,...V14_JOB_ROLES,...V15_JOBS.map(job=>job.role)]),dedicated=new Set(['Loader','Teamster','Wheelwright','Privateer Captain','Marine Captain','Surgeon','Shopkeeper']);return[...new Set(AetherionV173LivingPortraits.registry.filter(row=>!row.ambientOnly).map(row=>row.role))].filter(role=>{let row=AetherionV173LivingPortraits.registry.find(item=>item.role===role),terms=[row.role,...row.aliases];return!terms.some(term=>pools.has(term))&&!dedicated.has(role)})})()`);
assert.deepEqual(Array.from(uncoveredRoles),[],'every adult catalog role must have a worker, labor, recruit, commerce, maritime, or medicine system');
assert.equal(get("typeof v34lLaborCandidate==='function'&&typeof v28SeedLabor==='function'&&typeof v23BaseState==='function'&&typeof v55Worker==='function'"),true);

const rural=get(`S.world.permanentNPCs.Goldmeadow.filter(p=>['Beekeeper','Goatherd','Poultry Keeper'].includes(p.role)).map(p=>({role:p.role,gender:p.gender,age:p.age,portrait:p.portrait}))`);
assert.equal(rural.length,3);
assert.deepEqual(Array.from(rural,row=>row.role).sort(),['Beekeeper','Goatherd','Poultry Keeper']);
assert(rural.every(row=>row.portrait.includes('/custom/npc-portraits/v173/')));
assert.equal(rural.find(row=>row.role==='Beekeeper').gender,'F');
assert.equal(rural.find(row=>row.role==='Goatherd').gender,'M');
assert.equal(rural.find(row=>row.role==='Poultry Keeper').gender,'F');
assert.equal(get('S.world.permanentNPCs.Solaris.some(p=>p.role==="Banker"&&p.gender==="F"&&p.age>=48&&p.portrait.includes("/custom/npc-portraits/v173/"))'),true);
assert.equal(get('S.world.laborMarkets.Goldmeadow.filter(p=>["Beekeeper","Goatherd","Poultry Keeper"].includes(p.role)).length'),3);
assert.equal(get('S.world.laborMarkets.Goldmeadow.filter(p=>p.role==="Skilled Artisan"&&p.portrait.includes("/custom/npc-portraits/v173/")).length'),1);
const logistics=get('S.world.laborMarkets.Goldmeadow.filter(p=>["Loader","Teamster","Wheelwright"].includes(p.role))');
assert.equal(logistics.length,3);
assert(logistics.every(p=>p.portrait.includes('/custom/npc-portraits/v173/')));
const surgeons=get('S.v23.surgeons.map(p=>({name:p.name,role:p.role,gender:p.gender,age:p.age,portrait:p.portrait}))');
assert(surgeons.every(p=>p.role==='Surgeon'&&/^assets\/v29\/portraits\/surgeon_(?:ysabet|halric)\.webp$/.test(p.portrait)),JSON.stringify(surgeons,null,2));
assert.equal(get('S.v28.laborPool.find(p=>p.name==="Quartermaster Halric Morn").portrait'), 'assets/v29/portraits/quartermaster_halric.webp');
const eligibleShopPortraits=get(`S.world.permanentNPCs.Solaris.filter(p=>p.shopKey&&AetherionV173LivingPortraits.select(p,{location:'Solaris'})).map(p=>{let earlier=AetherionV168Portraits.tag(p.portrait);return{name:p.name,role:p.role,portrait:p.portrait,compatible:p.portrait.includes('/custom/npc-portraits/v173/')||!!(earlier&&AetherionV168Portraits.compatible(p,earlier,{location:'Solaris'}).ok)}})`);
assert.equal(eligibleShopPortraits.length,6);
assert(eligibleShopPortraits.every(p=>p.compatible),JSON.stringify(eligibleShopPortraits,null,2));

const originalRecruitPortraits=get(`(()=>{let found={};for(let i=0;i<160;i++){let p=v15MakeCandidate('Solaris',i);if(['Bannerless Knight','Man-at-Arms','Courtesan'].includes(p.role)&&!found[p.role])found[p.role]=p.portrait}return found})()`);
for(const role of ['Bannerless Knight','Man-at-Arms','Courtesan'])assert(originalRecruitPortraits[role]?.includes('/custom/npc-portraits/v173/'),`${role} retained ${originalRecruitPortraits[role]||'no portrait'}`);
const bondedMarkets=get(`['Stonevein Halls','Grimhorn'].flatMap(location=>(S.v17.settlements[location]?.bonded||[]).map(p=>({location,name:p.name,portrait:p.portrait,race:AetherionV173LivingPortraits.registry.find(row=>row.path===p.portrait)?.race})))`);
assert.equal(bondedMarkets.length,10);
assert(bondedMarkets.every(p=>p.portrait.includes('/custom/npc-portraits/v173/')&&p.race==='human'),JSON.stringify(bondedMarkets,null,2));

get('v15EnsureSettlement("Goldmeadow")');
assert.equal(get('S.v15.settlements.Goldmeadow.roster.filter(p=>p.id.startsWith("v173_")).length'),2);
assert.equal(get('S.v15.settlements.Goldmeadow.roster.filter(p=>p.id.startsWith("v173_")).every(p=>p.portrait.includes("/custom/npc-portraits/v173/"))'),true);

const toddler=get(`(()=>{let p={id:'runtime_toddler',name:'Tomas Test',gender:'M',age:3,relation:'Child'};let portrait=v10LocalFamilyPortrait(p);return{portrait,band:AetherionV173LivingPortraits.registry.find(r=>r.path===portrait)?.ageBand}})()`);
assert(toddler.portrait.includes('/custom/npc-portraits/v173/'));
assert.equal(toddler.band,'toddler');
assert.equal(api.select({name:'Underage Keeper',gender:'F',age:15,role:'Beekeeper'}),null);

const alexus=get('S.people.find(p=>p.name==="Lady Alexus Dominus")');
assert(alexus);
assert(!alexus.portrait.includes('/custom/npc-portraits/v173/'));
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
get('nearbyPeople();v27Schedules();render();migrateState(S)');
assert.equal(api.runtime.recordsChecked,checks,'real packaged redraw, schedule, and migrated-save paths must not rescan people');
assert.equal(api.auditState(get('S')).wrong.length,0);

console.log(`v1.73.0 full-game runtime: ${scripts.length} packaged scripts, fresh save, portraits, residents, recruits, production, views, and migration passed`);
