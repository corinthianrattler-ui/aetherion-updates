'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const RAW='https://raw.githubusercontent.com/corinthianrattler-ui/aetherion-updates/main/';
const oldErrors=[];
let modal='',style='';
const document={
 head:{appendChild(node){style=node.textContent}},documentElement:{},
 createElement(){return{id:'',textContent:''}},getElementById(){return null},
 addEventListener(type,fn){if(type==='error')oldErrors.push(fn)}
};
// This models the v1.73.0 listener that caused the screenshot's clone heads.
document.addEventListener('error',event=>{let src=event.target.src||'';if(src.includes('/custom/npc-portraits/v173/'))event.target.src='assets/dynasty/male_adult_1.webp'},true);

const knightFiles=['001_bannerless_knight_young_man.webp','002_bannerless_knight_young_man.webp','003_bannerless_knight_young_man.webp'];
const knightRows=knightFiles.map((file,index)=>({file,path:RAW+'custom/npc-portraits/v1731/'+file,gender:'M',ageBand:'young'}));
const livingPath=RAW+'custom/npc-portraits/v173/001_male_farmer_ym.webp';
const sandbox={console,document,ASSET:{rose:'assets/house_dominus_rose_banner.jpg'},MutationObserver:undefined,
 S:{world:{day:4,permanentNPCs:{Goldmeadow:[{id:'farmer',name:'Alden Beck',gender:'M',age:30,role:'Male Farmer',portrait:'assets/dynasty/male_adult_1.webp'}]},laborMarkets:{}},meta:{v173LivingPortraits:{version:'1.73.0'},v1731KnightDiversity:{version:'1.73.1'}},people:[
  {id:'k1',name:'Ser One',gender:'M',age:25,role:'Lesser Knight',portrait:'assets/dynasty/male_young_1.webp'},
  {id:'k2',name:'Ser Two',gender:'M',age:28,role:'Lesser Knight',portrait:'assets/dynasty/male_adult_1.webp'},
  {id:'k3',name:'Ser Three',gender:'M',age:33,role:'Company Captain',portrait:'assets/units/bannerless_knight.webp'},
  {id:'named',name:'Named Hero',gender:'M',age:30,role:'Knight',canonical:true,portrait:'user/hero.webp'}
 ]},
 entityImage(src,alt,cls=''){return`<img class="${cls}" src="${src}" alt="${alt}">`},
 openModal(value){modal=value},
 peopleCards(list){return list.map(p=>sandbox.entityImage(p.portrait,p.name)).join('')},
 v55WorkerCard(p){return`<img src="${p.portrait}" alt="${p.name}">`},
 makeStartState(){return JSON.parse(JSON.stringify(sandbox.S))},migrateState(s){return s},persist(){sandbox.persisted=(sandbox.persisted||0)+1}
};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
sandbox.AetherionV173LivingPortraits={registry:[{path:livingPath}],select(p){return /farmer/i.test(p.role)?{path:livingPath}:null},repairPerson(p){if(/farmer/i.test(p.role))p.portrait=livingPath;return p}};
sandbox.AetherionV1731KnightDiversity={registry:knightRows,serviceKnight:p=>/lesser knight|company captain/i.test(p?.role||''),assignOne(p){let row=knightRows[Number(String(p.id).replace(/\D/g,''))%knightRows.length];p.portrait=row.path;p.bannerless=true;return p},balance(list){list.filter(this.serviceKnight).forEach((p,index)=>{p.portrait=knightRows[index%knightRows.length].path;p.bannerless=true});return list},auditState(s){let rows=s.people.filter(this.serviceKnight);return{wrong:rows.filter(p=>!p.portrait.includes('/v1731/')),headshots:rows.filter(p=>p.portrait.includes('/assets/dynasty/')),unique:new Set(rows.map(p=>p.portrait)).size}}};

vm.runInNewContext(fs.readFileSync('patches/v1.73.8-portrait-resilience.js','utf8'),sandbox,{filename:'v1.73.8-portrait-resilience.js'});
const api=sandbox.AetherionV1738PortraitResilience;
assert.equal(api.version,'1.73.8');
assert.equal(sandbox.S.meta.v1738PortraitResilience.version,'1.73.8');
assert.equal(sandbox.S.meta.v1738PortraitResilience.contentRemoved,0);
assert.equal(sandbox.S.meta.v1738PortraitResilience.headFallback,false);
assert.equal(sandbox.S.people.slice(0,3).every(p=>p.portrait.includes('/custom/npc-portraits/v1731/')),true);
assert.equal(new Set(sandbox.S.people.slice(0,3).map(p=>p.portrait)).size,3);
assert.equal(sandbox.S.world.permanentNPCs.Goldmeadow[0].portrait,livingPath);
assert.equal(sandbox.S.people[3].portrait,'user/hero.webp');
assert(sandbox.persisted>0);

const cards=sandbox.peopleCards(sandbox.S.people.slice(0,3));
assert.match(cards,/cdn\.jsdelivr\.net/);
assert.match(cards,/custom%2Fnpc-portraits%2Fv1731%2F/);
assert.doesNotMatch(cards,/raw\.githubusercontent/);
sandbox.openModal(`<img src="${livingPath}">`);
assert.match(modal,/custom%2Fnpc-portraits%2Fv173%2F001_male_farmer_ym\.webp/);
assert.match(sandbox.v55WorkerCard({name:'Farmer',portrait:livingPath}),/custom%2Fnpc-portraits%2Fv173%2F/);
assert.match(style,/top:160px!important/);
assert.match(style,/height:114px/);

const image={tagName:'IMG',src:api.display(knightRows[0].path),dataset:{},onerror(){},getAttribute(){return this.src}};
function fail(){let stopped=false,event={target:image,preventDefault(){},stopImmediatePropagation(){stopped=true}};for(const fn of oldErrors){fn(event);if(stopped)break}}
fail();
assert.match(image.src,/raw\.githubusercontent\.com/);
assert.match(image.src,/custom%2Fnpc-portraits%2Fv1731%2F/);
assert.doesNotMatch(image.src,/assets\/dynasty/);
fail();
assert.equal(image.src,sandbox.ASSET.rose);
assert.doesNotMatch(image.src,/assets\/dynasty/);

const migrated=sandbox.migrateState({world:{permanentNPCs:{},laborMarkets:{}},meta:{v1731KnightDiversity:{version:'1.73.1'}},people:[{id:'k9',name:'Ser Nine',gender:'M',age:30,role:'Lesser Knight',portrait:'assets/dynasty/male_adult_1.webp'}]});
assert.equal(migrated.meta.v1738PortraitResilience.version,'1.73.8');
assert.match(migrated.people[0].portrait,/custom\/npc-portraits\/v1731/);

console.log('v1.73.8 portraits: old saves repaired, full-body CDN delivery bypasses clone-head recovery, raw retry and rose-only offline fallback passed');
