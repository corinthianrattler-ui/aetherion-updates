'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const patch = fs.readFileSync('patches/v1.68.0-curated-npc-portraits.js', 'utf8');
const assetRoot = 'custom/npc-portraits/v168';
const diskAssets = fs.readdirSync(assetRoot).filter(name => name.endsWith('.webp')).sort();
assert.equal(diskAssets.length, 111);

const context = vm.createContext({console, setTimeout, clearTimeout});
vm.runInContext(`
 'use strict';
 const window=globalThis;
 const AETHERION_ASSETS=[];
 const exact={
  valkorion:'assets/characters/valkorion.webp',
  v28_labor_2:'assets/v29/portraits/quartermaster_halric.webp',
  kael_azure_tide:'assets/characters/kael_azure_tide.webp'
 };
 function key(p){return exact[p?.id]||({'Valkorion Dominus':exact.valkorion,'Quartermaster Halric Morn':exact.v28_labor_2,'Kael of the Azure Tide':exact.kael_azure_tide}[p?.name])||null}
 function race(p,c={}){let value=String([c.race,p?.race,p?.species,p?.culture,p?.house,p?.faction,p?.name].filter(Boolean).join(' ')).toLowerCase();if(/dark.?elf|underrealm/.test(value))return'darkelf';if(/elf|vael|greenhall|eternal glades/.test(value))return'elf';if(/dwarf|stonevein|ironspine/.test(value))return'dwarf';if(/orc|grimhorn|ash wastes/.test(value))return'orc';return'human'}
 function spec(p,c={}){let gender=p?.gender==='F'?'F':'M',age=Math.max(0,+p?.age||0),r=race(p,c),visual=r==='dwarf'?age*.43:r==='elf'||r==='darkelf'?age*.24:r==='orc'?age*1.12:age,stage=visual<13?'child':visual<18?'teen':visual<26?'young':'adult',index=stage!=='adult'?1:visual<40?1:visual<50?2:visual<60?3:4;return{path:'assets/dynasty/'+(gender==='F'?'female':'male')+'_'+stage+'_'+index+'.webp'}}
 const AetherionV167Integrity=Object.freeze({
  inferGender(p){return p?.gender==='F'?'F':'M'},raceOf:race,portraitSpec:spec,
  assetTag(value){if(Object.values(exact).includes(value))return{kind:'exact-person-portrait',eligibleForPerson:true};if(/^assets\\/dynasty\\/(female|male)_/.test(value))return{kind:'reusable-person-portrait',eligibleForPerson:true};return null},
  identityPortrait(p,c={}){let hit=key(p);if(hit)return hit;if(c.prisoner)return p?.gender==='F'?'assets/prisoners/bandit_female.webp':'assets/prisoners/bandit_male.webp';return spec(p,c).path},
  repairPerson(p,c={}){let current=String(p?.portrait||p?.img||'');if(/^(custom\\/|user\\/|https?:|data:|blob:)/.test(current))return p;let hit=key(p);if(hit)p.portrait=hit;else if(!/^assets\\/dynasty\\//.test(current))p.portrait=this.identityPortrait(p,c);return p}
 });
 function lwFactionForLocation(loc){return({'Corvinus Keep':'Corvinus Keep','Highwatch Keep':'Highwatch Keep','White Harbor':'White Harbor','Stonevein Halls':'Stonevein Halls','Greenhall':'Eternal Glades','Lorien Ford':'Lorien Ford Underrealm','Ash Wastes':'Ash Wastes Tribal Orcs','Grimhorn':'Grimhorn','Blood Keep Ruins':'Blood Keep Mercenary Legion','Redmont':'Western Marches'}[loc])||'Solaris Royal Crown'}
 let persistCalls=0,renderCalls=0,rendered=[];
 function persist(){persistCalls++}
 function render(){renderCalls++;rendered=S.people.map(p=>p.portrait)}
 function dailyTick(){S.world.day++}
 function migrateState(state){return state}
 function makeStartState(){return JSON.parse(JSON.stringify(S))}
 function mkPerson(name,role,category,extra={}){return Object.assign({id:'made_'+name,name,role,category,gender:'M',age:30,portrait:null},extra)}
 function peopleCards(rows){return rows.map(p=>p.portrait).join('|')}
 function openPerson(){return true}
 function v16PersonPortrait(p){return p.portrait}
 function lwMemberPortrait(member){return spec(member).path}
 function v10LocalFamilyPortrait(member){return spec(member).path}
 const document={head:{appendChild(){}},createElement(){return{id:'',textContent:''}},getElementById(){return null},addEventListener(){}};
 let S={meta:{rngSeed:'v168-test'},world:{day:20,location:'Corvinus Keep',permanentNPCs:{}},player:{id:'valkorion',name:'Valkorion Dominus',gender:'M',age:18,portrait:'assets/units/bannerless_knight.webp'},people:[
  {id:'v28_labor_2',name:'Quartermaster Halric Morn',gender:'M',age:51,role:'Quartermaster',category:'Workers',location:'Southport',portrait:'custom/npc-portraits/v168/00_quartermaster_original_unchanged.webp'},
  {id:'quarter_random',name:'Edwyn Rook',gender:'M',age:46,role:'Field Quartermaster',category:'Workers',location:'Corvinus Keep',portrait:'assets/dynasty/male_adult_2.webp'},
  {id:'driver_a',name:'Oren Bell',gender:'M',age:45,role:'Carriage Driver',category:'Workers',location:'Corvinus Keep',portrait:'assets/dynasty/male_adult_2.webp'},
  {id:'driver_b',name:'Tavin Holt',gender:'M',age:52,role:'Wagon Driver',category:'Workers',location:'Corvinus Keep',portrait:'assets/dynasty/male_adult_3.webp'},
  {id:'driver_c',name:'Merric Pike',gender:'M',age:48,role:'Carriage Driver',category:'Workers',location:'Corvinus Keep',portrait:'assets/dynasty/male_adult_2.webp'},
  {id:'smith_a',name:'Rhea Bell',gender:'F',age:32,role:'Blacksmith',category:'Workers',location:'Corvinus Keep',portrait:'assets/dynasty/female_adult_1.webp'},
  {id:'smith_b',name:'Sabine Bell',gender:'F',age:35,role:'Smith',category:'Workers',location:'Corvinus Keep',portrait:'assets/dynasty/female_adult_1.webp'},
  {id:'raven_knight',name:'Dame Neris Vale',gender:'F',age:33,role:'Lesser Knight',category:'Military',location:'Corvinus Keep',portrait:'assets/dynasty/female_adult_1.webp'},
  {id:'highwatch_knight',name:'Dame Mara Vell',gender:'F',age:47,role:'House Knight',category:'Military',location:'Highwatch Keep',portrait:'assets/dynasty/female_adult_2.webp'},
  {id:'quay_guard',name:'Alys Brine',gender:'F',age:66,role:'Quay Guard',category:'Military',location:'White Harbor',portrait:'assets/dynasty/female_adult_4.webp'},
  {id:'orc_guard',name:'Ruka Ash',gender:'F',age:30,role:'Guard',category:'Military',race:'Orc',location:'Ash Wastes',portrait:'assets/dynasty/female_adult_1.webp'},
  {id:'dwarf_guard',name:'Brynja Stonevein',gender:'F',age:70,role:'Hammer Guard',category:'Military',race:'Dwarf',location:'Stonevein Halls',portrait:'assets/dynasty/female_adult_1.webp'},
  {id:'elf_blade',name:'Elenwe Greenhall',gender:'F',age:130,role:'Bladesinger',category:'Military',race:'Elf',location:'Greenhall',portrait:'assets/dynasty/female_adult_1.webp'},
  {id:'dark_hex',name:'Neris Nocthar',gender:'F',age:180,role:'Hexblade Adept',category:'Military',race:'Dark Elf',location:'Lorien Ford',portrait:'assets/dynasty/female_adult_3.webp'},
  {id:'page_child',name:'Tomas Vale',gender:'M',age:9,role:'Page',category:'Family',location:'Corvinus Keep',portrait:'assets/dynasty/male_child_1.webp'},
  {id:'noble_baby',name:'Lady Alys Vale',gender:'F',age:0,role:'Infant',category:'Family',house:'House Vale',location:'Highwatch Keep',portrait:'assets/dynasty/female_child_1.webp'},
  {id:'kael_azure_tide',name:'Kael of the Azure Tide',gender:'M',age:43,role:'Grandmaster Swordsman',category:'Military',portrait:'assets/units/bannerless_knight.webp'},
  {id:'user_face',name:'Perrin Reed',gender:'M',age:31,role:'Farmer',category:'Workers',portrait:'user/portraits/perrin.webp'}
 ],court:{prisoners:[]},dynasties:[],v15:{settlements:{}},v17:{settlements:{}},v23:{surgeons:[]},v28:{laborPool:[]},v26:{crime:{contacts:[]}},v61:{agents:[],people:{}}};
`, context, {filename:'v168-base-runtime.js'});

vm.runInContext(`(0,eval)(${JSON.stringify(patch)})`, context, {filename:'aetherion-updater-eval.js'});

const api = context.AetherionV168Portraits;
assert.equal(api.version, '1.68.0');
assert.equal(api.policy, 'curated-npc-portraits-v1.68.0');
assert.equal(api.auditRegistry().errors.length, 0);
assert.equal(api.registry.length, 111);
assert.equal(new Set(api.registry.map(row => row.path)).size, 111);
assert.equal(vm.runInContext('AETHERION_ASSETS.length', context), 111);
assert.deepEqual(Array.from(api.registry, row => row.file).sort(), diskAssets);

for (const row of api.registry) {
 assert.equal(row.eligibleForPerson, true);
 assert.equal(row.eligibleForFormation, false);
 assert.equal(row.namedCharacter, false);
 assert.equal(row.reviewed, true);
 assert(['M','F'].includes(row.gender));
 assert(['human','dwarf','elf','darkelf','orc'].includes(row.race));
 assert(row.ageMin <= row.ageMax);
 assert(row.roleTags.length > 0);
 assert(fs.existsSync(path.join(assetRoot, row.file)));
 if (row.number > 0) {
  assert.equal(row.fullBody, true);
  assert.equal(row.visibleLabel, true);
  const stem = row.file.replace(/\.webp$/, '');
  const expectedGender = /_(woman|girl)$/.test(stem) ? 'F' : /_(man|boy)$/.test(stem) ? 'M' : null;
  assert.equal(row.gender, expectedGender, `${row.file}: filename/sex tag mismatch`);
  const expectedBand = /_infant_/.test(stem) ? 'infant' : /^19_toddler_/.test(stem) ? 'toddler' : /_child_/.test(stem) ? 'child' : /_teen_/.test(stem) ? 'teen' : /_young_/.test(stem) ? 'young' : /_adult_/.test(stem) ? 'adult' : /_mature_/.test(stem) ? 'mature' : /_elder_/.test(stem) ? 'elder' : null;
  assert.equal(row.ageBand, expectedBand, `${row.file}: filename/age tag mismatch`);
 }
}
assert.equal(api.byNumber[0].preservedOriginal, true);
assert.equal(api.byNumber[0].visibleLabel, false);
for (let number = 66; number <= 110; number++) {
 assert.equal(api.byNumber[number].kind, 'faction-military');
 assert(api.byNumber[number].factionTags.length > 0);
}
for (const number of [20,21,43,49,103,104]) assert.equal(api.byNumber[number].race, 'dwarf');
for (const number of [22,23,47,50,65,85,86,105,106]) assert.equal(api.byNumber[number].race, 'elf');
for (const number of [87,88,107]) assert.equal(api.byNumber[number].race, 'darkelf');
for (const number of [24,25,46,56,64,89,90,91,92,108]) assert.equal(api.byNumber[number].race, 'orc');
for (const row of api.registry) {
 const visualAge = row.ageMax === 999 ? 65 : (row.ageMin + row.ageMax) / 2;
 const ageFactor = row.race === 'dwarf' ? 0.43 : row.race === 'elf' || row.race === 'darkelf' ? 0.24 : row.race === 'orc' ? 1.12 : 1;
 const declaredPerson = {
  id: `declared_${row.number}`,
  name: 'Declared Test Person',
  gender: row.gender,
  age: visualAge / ageFactor,
  race: row.race,
  role: row.occupation,
  faction: row.factionTags[0] || '',
 };
 assert.equal(api.compatible(declaredPerson, row).ok, true, `${row.file}: declared tags must form a routable identity`);
}

const get = id => vm.runInContext(`S.people.find(p=>p.id===${JSON.stringify(id)})`, context);
assert.equal(get('v28_labor_2').portrait, 'assets/v29/portraits/quartermaster_halric.webp');
assert.equal(api.quartermaster.exactHalricReplaced, false);
assert.equal(api.quartermaster.originalRolePortrait, `${assetRoot}/00_quartermaster_original_unchanged.webp`);
assert.equal(get('quarter_random').portrait, `${assetRoot}/00_quartermaster_original_unchanged.webp`);
assert.equal(get('kael_azure_tide').portrait, 'assets/characters/kael_azure_tide.webp');
assert.equal(get('user_face').portrait, 'user/portraits/perrin.webp');

const drivers = ['driver_a','driver_b','driver_c'].map(id => get(id).portrait);
assert.equal(new Set(drivers).size, 3, 'reusable curated faces must never duplicate within the active state');
assert.equal(drivers.filter(value => value.startsWith(assetRoot)).length, 1, 'the one compatible carriage-driver plate is used once');
assert.equal(get('smith_a').portrait, `${assetRoot}/02_blacksmith_adult_woman.webp`);
assert(!get('smith_b').portrait.startsWith(assetRoot), 'a one-of-one face is not reused for a second smith');
assert.equal(get('raven_knight').portrait, `${assetRoot}/72_raven_knight_adult_woman.webp`);
assert.equal(get('highwatch_knight').portrait, `${assetRoot}/75_highwatch_knight_mature_woman.webp`);
assert.equal(get('quay_guard').portrait, `${assetRoot}/110_quay_guard_elder_woman.webp`);
assert.equal(get('orc_guard').portrait, `${assetRoot}/25_orc_guard_adult_woman.webp`);
assert.equal(get('dwarf_guard').portrait, `${assetRoot}/103_hammer_guard_adult_dwarf_woman.webp`);
assert.equal(get('elf_blade').portrait, `${assetRoot}/105_greenhall_bladesinger_adult_woman.webp`);
assert.equal(get('dark_hex').portrait, `${assetRoot}/107_hexblade_adept_mature_woman.webp`);
assert.equal(get('page_child').portrait, `${assetRoot}/14_page_child_boy.webp`);
assert.equal(get('noble_baby').portrait, `${assetRoot}/18_noble_infant_baby_girl.webp`);

assert.equal(api.compatible({name:'Wrong',gender:'M',age:32,role:'Blacksmith'}, api.byNumber[2]).reason, 'cross-sex');
assert.equal(api.compatible({name:'Wrong',gender:'F',age:70,role:'Blacksmith'}, api.byNumber[2]).reason, 'wrong-age-band');
assert.equal(api.compatible({name:'Wrong',gender:'F',age:32,role:'Blacksmith',race:'Orc'}, api.byNumber[2]).reason, 'wrong-race');
assert.equal(api.compatible({name:'Wrong',gender:'F',age:47,role:'House Knight',location:'White Harbor'}, api.byNumber[75]).reason, 'wrong-faction');
assert.equal(api.compatible({name:'Wrong',gender:'F',age:47,role:'Cook',location:'Highwatch Keep'}, api.byNumber[75]).reason, 'wrong-role');

const beforeRender = vm.runInContext('S.people.map(p=>p.portrait)', context);
vm.runInContext('render()', context);
const afterRender = vm.runInContext('S.people.map(p=>p.portrait)', context);
assert.deepEqual(afterRender, beforeRender, 'render-time integrity passes must not churn stable portrait assignments');
const stateAudit = api.auditState();
assert.equal(stateAudit.wrong.length, 0);
assert.equal(stateAudit.duplicates.length, 0);
assert.equal(stateAudit.missing.length, 0);
assert.equal(vm.runInContext('S.meta.v168PortraitLibrary.installedAssets', context), 111);
assert.equal(vm.runInContext('S.meta.v168PortraitLibrary.newPortraits', context), 110);
assert.equal(vm.runInContext('persistCalls', context), 1);

console.log('v1.68.0 curated portrait registry, routing, uniqueness, and named-art protection passed');
