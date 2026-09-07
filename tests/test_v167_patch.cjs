'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const patch = fs.readFileSync('patches/v1.67.0-identity-world-integrity.js', 'utf8');
const testConsole = Object.create(console);
testConsole.warn = () => {};
const context = { console: testConsole };
context.window = context;
vm.createContext(context);

vm.runInContext(`
 const dynasty=[];
 for(const gender of ['female','male']){
  for(const stage of ['child','teen','young'])for(let i=1;i<=4;i++)dynasty.push('assets/dynasty/'+gender+'_'+stage+'_'+i+'.webp');
  for(let i=1;i<=4;i++)dynasty.push('assets/dynasty/'+gender+'_adult_'+i+'.webp');
 }
 const AETHERION_ASSETS=[
  ...dynasty,
  'assets/workers/carriage_driver.webp','assets/workers/knight.webp','assets/v29/scenes/dock_stevedores.webp','assets/units/bannerless_knight.webp',
  'assets/prisoners/bandit_female.webp','assets/prisoners/bandit_male.webp','assets/prisoners/mercenary_male.webp','assets/prisoners/orc_male.webp',
  'assets/characters/valkorion.webp','assets/characters/alexus.webp','assets/characters/kael_azure_tide.webp',
  'assets/v38/thrall/nessa_cale_portrait.webp','assets/v38/thrall/nessa_cale_companion.webp',
  'assets/v43/libita/libita_savitas.jpg','assets/v61/intelligence/maevra_voss.webp',
  'assets/v29/portraits/shipwright_odran.webp','assets/v29/portraits/navigator_yselle.webp','assets/v29/portraits/quartermaster_halric.webp',
  'assets/v29/portraits/foreman_garran.webp','assets/v29/portraits/captain_sabine.webp','assets/v29/portraits/captain_edric.webp',
  'assets/v29/portraits/surgeon_ysabet.webp','assets/v29/portraits/surgeon_halric.webp',
  'assets/companions/unique/ser_slaughter.webp','assets/companions/unique/kaela_ironstring.webp',
  'assets/companions/unique/laughing_traveler.webp','assets/companions/unique/lady_ashveil.webp','assets/companions/unique/brother_hollow.webp',
  'assets/items/wine_skin.webp','assets/locations/corvinus_keep.webp','assets/lore/solara_radiant_court.webp','assets/v27/scenes/courtroom.webp',
  'assets/v29/interiors/archive.webp','assets/v17/transport/raven.webp','assets/v49/libita_brothel_success.mp4','assets/v49/libita_camp_success.mp4',
  'assets/v17/locations/pleasure_house.webp','assets/v29/interiors/noble_solar.webp','assets/v50/rooms/barracks.webp','assets/v27/scenes/keep_interior.webp',
  'assets/v50/rooms/kitchen.webp','assets/v50/rooms/solar.webp','assets/items/pigeon_message.webp','assets/items/wax_seal.webp','assets/items/v16/v16_horse_1_feed_bag.webp','assets/items/v16/v16_paper_1_ledger.webp',
  'assets/v18/maps/corvinus_keep.webp','assets/v18/maps/stonevein_halls.webp','assets/v35/maps/aetherion_world_map.webp','assets/v35/maps/aetherion_region_solara.webp','assets/v35/maps/aetherion_region_frostreach.webp','assets/v35/maps/aetherion_region_eternal_glades.webp','assets/v35/maps/aetherion_region_ash_wastes.webp','assets/v35/maps/aetherion_region_western_marches.webp','assets/v35/waters/white_harbor.webp',
  'assets/v30/scenes/battle.webp','assets/blood_keep_ruins_on_the_storm_coast.jpg','assets/lore/secractus_chapel.webp','assets/v30/scenes/bonding.webp','assets/v50/rooms/chapel.webp','assets/v30/scenes/blood_dragon_portrait.png','assets/v38/characters/valkorion_base_linen.webp'
 ];
 const CHAR_PORTRAIT={
  Narrator:'assets/characters/narrator_rose.webp',
  'Valkorion Dominus':'assets/characters/valkorion.webp',
  'Lady Alexus Dominus':'assets/characters/alexus.webp'
 };
 AETHERION_ASSETS.push(CHAR_PORTRAIT.Narrator);
 const HQ_VOICE_PROFILE={
  Narrator:{gender:'M'},
  'Valkorion Dominus':{gender:'M'},
  'Lady Alexus Dominus':{gender:'F'}
 };
 const LW_FIRST_M=['Aldren','Merric','Oren','Tavin','Roderic'];
 const LW_FIRST_F=['Alys','Nerys','Ysabet','Sabine'];
 const V10_LOCAL_M=['Aldren','Bennet','Corwin','Davin','Eamon','Gerrit','Harlan','Jorin','Merek','Oren','Perrin','Tavin','Wyll'];
 const V10_LOCAL_F=['Alys','Brina','Celia','Ellyn','Fara','Mara','Nessa','Rhea','Sabine','Talia'];
 const V15_MALE=['Alden','Bram','Cedric','Darian','Edwyn','Garrick','Hadrian','Jory','Lucan','Marek','Orrin','Roderic','Tavian','Wulfric'];
 const V15_FEMALE=['Adela','Beatrix','Celia','Elara','Fiona','Helena','Isolde','Mara','Nerys','Rosamund','Sabine','Talia','Yvette'];
 const V17_MALE=['Merric','Oren','Tavin','Edric','Halric'];
 const V17_FEMALE=['Alys','Sabine','Yselle'];
 const V13_DOMINUS_M=['Cassian'];
 const V13_DOMINUS_F=['Aurelia'];
 const V11_MANAGER_NAMES=['Edwyn Kest','Merek Ward'];
 const V11_DRIVER_NAMES=['Harlan Pike','Oren Carr'];
 const NAMES_KNIGHTS=['Ser Roderic Vale','Ser Hadrian Moor'];
 const V21_UNIQUE={
  slaughter:{name:'Ser Slaughter',gender:'M',img:'assets/companions/unique/ser_slaughter.webp'},
  kaela:{name:'Kaela Ironstring',gender:'F',img:'assets/companions/unique/kaela_ironstring.webp'}
 };
 const V61_ART={council:'assets/v61/intelligence/great_council_exterior.webp',chamber:'assets/v61/intelligence/great_council_chamber.webp',office:'assets/v61/intelligence/intelligence_office.webp',rookery:'assets/v61/intelligence/raven_rookery.webp',maevra:'assets/v61/intelligence/maevra_voss.webp'};
 const V62_RAVEN_ART={Ash:'assets/v62/intelligence/ravens/ash.webp',Cinder:'assets/v62/intelligence/ravens/cinder.webp'};
 const V62_SUPPLIES=[{id:'v62_raven_feed',img:'assets/v62/intelligence/items/raven_feed.webp'},{id:'v62_message_capsules',img:'assets/v62/intelligence/items/message_capsules.webp'}];
 const V71_UNIQUE_ART={};
 const ITEMS={v62_raven_feed:{id:'v62_raven_feed',img:'assets/v62/intelligence/items/raven_feed.webp'},v62_message_capsules:{id:'v62_message_capsules',img:'assets/v62/intelligence/items/message_capsules.webp'}};
 const BUILDINGS={pleasure_rooms:{img:'assets/v46/rooms/pleasure_salon.webp'},kitchen:{img:'assets/v46/rooms/kitchen.webp'}};

 let persistCalls=0,renderCalls=0,lastModal='';
 const modal={innerHTML:''};
 const document={
  head:{appendChild(){}},
  createElement(){return{id:'',textContent:''}},
  getElementById(){return null},
  querySelector(selector){return selector==='#modalRoot .modal'?modal:null}
 };
 function esc(value){return String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}
 function clamp(value,min,max){return Math.max(min,Math.min(max,value))}
 function entityImage(src,name){return '<img src="'+src+'" alt="'+name+'">'}
 function v10Hash(value){let h=0;for(const c of String(value))h=(Math.imul(h,31)+c.charCodeAt(0))>>>0;return h}
 function v15Hash(value){return v10Hash(value)}
 function v10WorkerFunction(role){return 'Performs '+role+' work.'}
 function v17HouseName(value){return String(value||'Unknown')+' Household'}
 function deep(value){return JSON.parse(JSON.stringify(value))}
 function persist(){persistCalls++}
 function render(){renderCalls++}
 function dailyTick(){S.world.day++}
 function openModal(content){modal.innerHTML=content;lastModal=content}
 function peopleCards(list){return list.map(p=>p.name+' '+p.morale+'/5').join('|')}
 function openPerson(id){let p=S.people.find(row=>row.id===id);if(!p)return;openModal('<div class="modal"><div class="kv"><div>Gender</div><div>Female</div><div>Age</div><div>'+p.age+'</div><div>Morale / Loyalty</div><div>'+p.morale+'/5 · '+p.loyalty+'</div></div></div>')}
 function v16PersonPortrait(p){return /Knight|Footman/.test(p?.role||'')?'assets/units/bannerless_knight.webp':p?.portrait}
 function v16PersonEquipment(id){let p=S.people.find(row=>row.id===id);if(!p)return;p.portrait='assets/units/bannerless_knight.webp';openModal('<div class="modal"><img class="bigPic" src="'+p.portrait+'"><div class="slotGrid"></div></div>')}
 function lwPortrait(gender,age,index){return 'legacy.webp'}
 function lwMemberPortrait(member){return member.portrait||'legacy.webp'}
 function v10LocalFamilyPortrait(){return 'assets/workers/carriage_driver.webp'}
 function v10NameWorkers(state){for(const p of state.people.filter(p=>p.category==='Workers')){p.gender='F';p.portrait='assets/workers/carriage_driver.webp'}return state}
 function v17RepairNames(state){for(const p of state.people)p.gender=v10Hash(p.role||p.name)%5===0?'F':'M';return state}
 function v17PleasureHouse(){return 'legacy house'}
 function v15Convert(id){let p=S.people.find(row=>row.id===id);if(p)p.portrait='assets/units/bannerless_knight.webp';return true}
 function v16Swear(id){let p=S.people.find(row=>row.id===id);if(p)p.portrait='assets/units/bannerless_knight.webp';return true}
 function v21IssuePerson(p){if(p)p.portrait='assets/units/bannerless_knight.webp';return true}
 function setFormationRole(id){let p=S.people.find(row=>row.id===id);if(p)p.portrait='assets/units/bannerless_knight.webp';render();return true}
 function setRank(id){let p=S.people.find(row=>row.id===id);if(p)p.portrait='assets/units/bannerless_knight.webp';return true}
 function v61RecruitAgent(){S.v61.agents.push({id:'agent_new',name:'Ilyan Crow'});return true}
 function v58MapArt(){return 'assets/v58/maps/corvinus_keep.webp'}
 function v48DistrictArt(){return 'assets/v65/ascendant/tower_exterior.webp'}
 function v38PdFigure(){return '<figure><img src="assets/v78/valkorion/foundation.png"><img src="assets/v78/valkorion/layers/dominus_cuirass.webp"></figure>'}
 function v52BrothelVideo(){return 'assets/v52/pleasure_tavern_02.mp4'}
 function v53ChooseScene(){return 'assets/v54/camp_pleasure_02.mp4'}
 function v53PlayClip(){throw Error('missing clip should not be loaded')}
 function v59Play(){throw Error('missing duel audio should not be loaded')}
 function v60DrumHit(){throw Error('missing drum audio should not be loaded')}
 function v60Harp(){return false}
 function v60Rebec(){return false}
 function v66Voice(){return false}
 function v66PrimeDuelAudio(){throw Error('missing duel bank should not be primed')}
 function v67Prime(){throw Error('missing sample bank should not be primed')}
 function v67SampleNote(){return false}
 function v65Ensure(x=S){x.v65??={};for(const c of x.companions||[])if(c.bloodDragon)c.img='assets/v65/ascendant/blood_dragon_companion.webp';return x.v65}
 function v67Ensure(x=S){x.v67??={sampleBank:'missing-samples'};return x.v67}
 function v20Men(){return S.people.filter(p=>p.category==='Military')}
 function v20RaiseMen(amount){for(const p of v20Men())p.morale=(p.morale||0)<=5?5:Math.min(100,p.morale+amount);return amount}
 function v51ResolveDuties(){for(const p of S.people.filter(p=>p.stationRole==='Garrison training')){p.morale=Math.min(5,(p.morale||3)+.03);p.stationDays=(p.stationDays||0)+1}}
 function advanceHours(hours){for(const p of S.people.filter(p=>p.alive!==false&&p.location===S.world.location))p.morale=Math.min(5,(p.morale||3)-hours*.01)}

 function baseState(){return{
  meta:{rngSeed:'identity-test'},
  world:{day:42,location:'Corvinus Keep',permanentNPCs:{Corvinus:[{id:'resident_1',name:'Alys Bell',gender:'M',age:44,role:'Innkeeper',portrait:'assets/workers/carriage_driver.webp',family:[{id:'family_bad',name:'Oren Bell',gender:'M',age:67,portrait:'assets/dynasty/female_young_1.webp'},{id:'family_dynamic',name:'Celia Bell',gender:'F',age:9}]}]},laborMarkets:{}},
  player:{id:'valkorion',name:'Valkorion Dominus',gender:'M',age:18,portrait:'assets/characters/valkorion.webp'},
  company:{morale:68},
  people:[
   {id:'driver_1',name:'Oren Bell',gender:'M',role:'Carriage Driver',category:'Workers',morale:60,loyalty:55,hp:60,maxHp:60,order:'With Party',portrait:'assets/workers/carriage_driver.webp'},
   {id:'driver_2',name:'Tavin Holt',gender:'M',role:'Carriage Driver',category:'Workers',morale:60,loyalty:55,hp:60,maxHp:60,order:'With Party',portrait:'assets/workers/carriage_driver.webp'},
   {id:'driver_3',name:'Merric Pike',gender:'F',role:'Carriage Driver',category:'Workers',morale:60,loyalty:55,hp:60,maxHp:60,order:'With Party',portrait:'assets/dynasty/female_adult_4.webp'},
   {id:'foot_1',name:'Footman 1',role:'Footman',category:'Military',morale:68,loyalty:50,hp:70,maxHp:70,order:'With Party',portrait:'assets/workers/knight.webp'},
   {id:'wrong_knight',name:'Ser Nerys Marr',title:'Ser',gender:'M',age:23,role:'Bannerless Knight',category:'Military',morale:68,portrait:'assets/dynasty/male_young_1.webp'},
   {id:'party_alexus_dominus',name:'Lady Alexus Dominus',gender:'F',age:61,role:'Exiled Lady',category:'Family',morale:80,loyalty:96,hp:92,maxHp:92,order:'With Party',portrait:'assets/characters/alexus.webp'},
   {id:'img_only',name:'Sabine Grey',gender:'F',age:31,role:'Scout',category:'Military',morale:55,img:'assets/workers/knight.webp'}
  ],
  wagons:[{id:'wagon_1',driver:'Wagon Driver 1'}],mounts:[],court:{prisoners:[{id:'captive_1',name:'Mara Venn',gender:'F',age:29,kind:'bandit',sentence:'Untried',portrait:'assets/prisoners/bandit_male.webp'}]},companions:[{id:'blood_dragon',name:'Blood Dragon',bloodDragon:true,img:'assets/v65/ascendant/blood_dragon_companion.webp'}],
  dynasties:[
   {name:'House Dominus',faction:'House Dominus',members:[{id:'dyn_alexus',name:'Lady Alexus Dominus',gender:'F',age:61,canonical:true,portrait:'assets/characters/alexus.webp'}]},
   {name:'House Vael',faction:'Eternal Glades',members:[{id:'elf_1',name:'Aelion Vael',gender:'M',race:'Elf',age:100,portrait:'assets/dynasty/male_adult_4.webp'}]},
   {name:'House Stonevein',faction:'Stonevein Halls',members:[{id:'dwarf_1',name:'Brynja Stonevein',gender:'F',race:'Dwarf',age:120,portrait:'assets/dynasty/female_young_1.webp'}]},
   {name:'Clan Skullhorn',faction:'Grimhorn',members:[{id:'orc_1',name:'Gorak Skullhorn',gender:'M',race:'Orc',age:60,portrait:'assets/dynasty/male_young_1.webp'}]}
  ],
  v15:{settlements:{Corvinus:{roster:[]}}},v17:{settlements:{Corvinus:{bonded:[]}}},
  v23:{surgeons:[{id:'surgeon_ysabet',name:'Mistress Ysabet Vale',gender:'M',role:'Surgeon',portrait:'assets/workers/knight.webp'},{id:'surgeon_halric',name:'Master Halric Wren',gender:'F',role:'Surgeon',portrait:'assets/workers/knight.webp'}]},
  v28:{laborPool:[{id:'v28_labor_4',name:'Captain Sabine Redwake',gender:'M',age:38,role:'Captain',portrait:'assets/v29/scenes/dock_stevedores.webp'}]},
  v26:{crime:{contacts:[]}},
  v61:{agents:[{id:'agent_1',name:'Ilyan Crow'},{id:'agent_2',name:'Ilyan Crow'},{id:'agent_3',name:''}],reports:[{agentId:'agent_2',agentName:'Ilyan Crow'}],people:{dyn_alexus:{id:'dyn_alexus',name:'Wrong Name',gender:'M',portrait:'assets/workers/knight.webp'}}},
  trade:{managers:{}},story:[]
 }}
 let S=baseState();
 function makeStartState(){return baseState()}
 function migrateState(state){return state}
`, context, { filename: 'v167-base-runtime.js' });

vm.runInContext(`(0,eval)(${JSON.stringify(patch)})`, context, { filename: 'aetherion-updater-eval.js' });

const api = context.AetherionV167Integrity;
assert.equal(api.version, '1.67.0');
assert.equal(api.policy, 'identity-world-integrity-v1.67.0');

const catalog = vm.runInContext(`Object.values(AetherionV167Integrity.portraitCatalog).map(row=>({...row}))`, context);
const imageAssets = vm.runInContext(`AETHERION_ASSETS.filter(path=>/\\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(path))`, context);
assert(imageAssets.every(path=>api.assetTag(path)), 'every packaged image must have a central tag');
assert.equal(new Set(catalog.map(row=>row.path)).size, catalog.length, 'the central catalog cannot contain duplicate paths');
const driverArt = api.assetTag('assets/workers/carriage_driver.webp');
assert.equal(driverArt.kind, 'occupation-reference');
assert.equal(driverArt.eligibleForPerson, false);
const maleChild = api.assetTag('assets/dynasty/male_child_1.webp');
assert.deepEqual({gender:maleChild.gender,ageMin:maleChild.ageMin,ageMax:maleChild.ageMax,eligible:maleChild.eligibleForPerson},{gender:'M',ageMin:0,ageMax:12,eligible:true});
assert.equal(api.assetTag('assets/items/wine_skin.webp').eligibleForPerson, false);
assert.equal(api.assetTag('assets/locations/corvinus_keep.webp').eligibleForPerson, false);
const mediaRepair = vm.runInContext(`({
 council:V61_ART.council,office:V61_ART.office,rookery:V61_ART.rookery,maevra:V61_ART.maevra,
 raven:V62_RAVEN_ART.Ash,feed:V62_SUPPLIES[0].img,capsules:ITEMS.v62_message_capsules.img,
 pleasure:BUILDINGS.pleasure_rooms.img,kitchen:BUILDINGS.kitchen.img,
 rewritten:AetherionV167Integrity.rewriteDisplayAssets('<video src="assets/v46/libita_tavern_dance.mp4"></video>'),
 entity:entityImage('assets/v61/intelligence/maevra_voss.webp','Maevra Voss'),
 map:v58MapArt(),district:v48DistrictArt(),paperDoll:v38PdFigure(),brothel:v52BrothelVideo(),camp:v53ChooseScene('camp'),
 duel:AetherionV167Integrity.resolveDisplayAsset('assets/v59/duel/sword_duel.webp'),
 tower:AetherionV167Integrity.resolveDisplayAsset('assets/v65/ascendant/tower_exterior.webp'),
 prime:v67Prime(),duelPrime:v66PrimeDuelAudio(),missingClip:v53PlayClip('assets/v53/miss_boing_01.mp3'),missingDuel:v59Play('correct_clash.mp3'),missingDrum:v60DrumHit(2)
})`, context);
assert.equal(mediaRepair.council, 'assets/lore/solara_radiant_court.webp');
assert.equal(mediaRepair.office, 'assets/v29/interiors/archive.webp');
assert.equal(mediaRepair.rookery, 'assets/v17/transport/raven.webp');
assert.equal(mediaRepair.maevra, 'assets/dynasty/female_adult_2.webp');
assert.equal(mediaRepair.raven, 'assets/v17/transport/raven.webp');
assert.equal(mediaRepair.feed, 'assets/items/v16/v16_horse_1_feed_bag.webp');
assert.equal(mediaRepair.capsules, 'assets/items/pigeon_message.webp');
assert.equal(mediaRepair.pleasure, 'assets/v17/locations/pleasure_house.webp');
assert.equal(mediaRepair.kitchen, 'assets/v50/rooms/kitchen.webp');
assert.match(mediaRepair.rewritten, /assets\/v49\/libita_brothel_success\.mp4/);
assert.match(mediaRepair.entity, /assets\/dynasty\/female_adult_2\.webp/);
assert.equal(mediaRepair.map, 'assets/v18/maps/corvinus_keep.webp');
assert.equal(mediaRepair.district, 'assets/blood_keep_ruins_on_the_storm_coast.jpg');
assert.match(mediaRepair.paperDoll, /assets\/v38\/characters\/valkorion_base_linen\.webp/);
assert.match(mediaRepair.paperDoll, /data:image\/gif;base64/);
assert.equal(mediaRepair.brothel, 'assets/v49/libita_brothel_success.mp4');
assert.equal(mediaRepair.camp, 'assets/v49/libita_camp_success.mp4');
assert.equal(mediaRepair.duel, 'assets/v30/scenes/battle.webp');
assert.equal(mediaRepair.tower, 'assets/blood_keep_ruins_on_the_storm_coast.jpg');
assert.equal(mediaRepair.prime, false);
assert.equal(mediaRepair.duelPrime, false);
assert.equal(mediaRepair.missingClip, false);
assert.equal(mediaRepair.missingDuel, false);
assert.equal(mediaRepair.missingDrum, false);

const repaired = vm.runInContext(`(() => ({
 people:S.people.map(p=>({id:p.id,name:p.name,title:p.title,gender:p.gender,age:p.age,portrait:p.portrait,img:p.img})),
 resident:S.world.permanentNPCs.Corvinus[0],
 prisoner:S.court.prisoners[0],
 dynasties:S.dynasties,
 surgeons:S.v23.surgeons,
 labor:S.v28.laborPool,
 agents:S.v61.agents,
 reports:S.v61.reports,
 notable:S.v61.people.dyn_alexus,
 meta:S.meta.v167IdentityWorld,
 persistCalls
}))()`, context);

assert.equal(repaired.persistCalls, 1, 'the save repair persists once when the patch starts');
assert.equal(repaired.meta.savePreserved, true);
vm.runInContext(`S.player.portrait='assets/workers/carriage_driver.webp';AetherionV167Integrity.repairPerson(S.player)`, context);
assert.equal(vm.runInContext(`S.player.portrait`, context), 'assets/characters/valkorion.webp', 'Valkorion repairs to the canonical character portrait, never a paper-doll frame');
const merric = repaired.people.find(p=>p.id==='driver_3');
assert.equal(merric.name, 'Merric Pike');
assert.equal(merric.gender, 'M');
assert.match(merric.portrait, /^assets\/dynasty\/male_/);
for(const id of ['driver_1','driver_2','driver_3'])assert(!repaired.people.find(p=>p.id===id).portrait.includes('/workers/'));
const footman = repaired.people.find(p=>p.id==='foot_1');
assert.equal(footman.name, 'Arlen Beck');
assert.equal(footman.gender, 'M');
assert(Number.isInteger(footman.age) && footman.age>=18 && footman.age<=42);
assert.match(footman.portrait, /^assets\/dynasty\/male_/);
const nerys = repaired.people.find(p=>p.id==='wrong_knight');
assert.equal(nerys.name, 'Dame Nerys Marr');
assert.equal(nerys.title, 'Dame');
assert.equal(nerys.gender, 'F');
assert.match(nerys.portrait, /^assets\/dynasty\/female_young_/);
const alexus = repaired.people.find(p=>p.id==='party_alexus_dominus');
assert.equal(alexus.portrait, 'assets/characters/alexus.webp', 'exact named art survives age changes');
const imgOnly = repaired.people.find(p=>p.id==='img_only');
assert.match(imgOnly.portrait, /^assets\/dynasty\/female_/);
assert.equal(imgOnly.img, imgOnly.portrait, 'an img-only person cannot keep stale occupational art');

assert.equal(repaired.resident.gender, 'F');
assert.match(repaired.resident.portrait, /^assets\/dynasty\/female_adult_2/);
assert.match(repaired.resident.family[0].portrait, /^assets\/dynasty\/male_adult_4/);
assert.equal(repaired.resident.family[1].portrait, undefined, 'dynamic family portraits stay computed instead of bloating saves');
assert.match(vm.runInContext(`v10LocalFamilyPortrait(S.world.permanentNPCs.Corvinus[0].family[1])`, context), /^assets\/dynasty\/female_child_/);
assert.match(repaired.prisoner.portrait, /bandit_female/);
assert.equal(repaired.dynasties[0].members[0].portrait, 'assets/characters/alexus.webp');
assert.match(repaired.dynasties[1].members[0].portrait, /^assets\/dynasty\/male_young_/);
assert.match(repaired.dynasties[2].members[0].portrait, /^assets\/dynasty\/female_adult_3/);
assert.match(repaired.dynasties[3].members[0].portrait, /^assets\/dynasty\/male_adult_4/);
assert.equal(repaired.surgeons[0].gender, 'F');
assert.equal(repaired.surgeons[0].portrait, 'assets/v29/portraits/surgeon_ysabet.webp');
assert.equal(repaired.surgeons[1].gender, 'M');
assert.equal(repaired.surgeons[1].portrait, 'assets/v29/portraits/surgeon_halric.webp');
assert.equal(repaired.labor[0].gender, 'F');
assert.equal(repaired.labor[0].portrait, 'assets/v29/portraits/captain_sabine.webp');
assert.equal(new Set(repaired.agents.map(a=>a.name)).size, repaired.agents.length);
assert(repaired.agents.every(a=>['M','F'].includes(a.gender)&&Number.isFinite(a.age)&&/^assets\/dynasty\/(?:male|female)_/.test(a.portrait)));
assert.equal(repaired.reports[0].agentName, repaired.agents.find(a=>a.id==='agent_2').name);
assert.equal(repaired.notable.name, 'Lady Alexus Dominus');
assert.equal(repaired.notable.gender, 'F');
assert.equal(repaired.notable.portrait, 'assets/characters/alexus.webp');
assert.equal(vm.runInContext(`S.companions.find(c=>c.bloodDragon).img`, context), 'assets/v30/scenes/blood_dragon_portrait.png');
assert.equal(vm.runInContext(`v67Ensure(S);S.v67.sampleBank`, context), 'responsive-synthesis-v1.67.0');

const moraleScale = vm.runInContext(`(() => {
 const foot=S.people.find(p=>p.id==='foot_1');foot.morale=3;v20RaiseMen(4);
 const driver=S.people.find(p=>p.id==='driver_3');driver.morale=60;driver.stationRole='Garrison training';driver.stationDays=0;v51ResolveDuties();const trained=driver.morale;
 driver.stationRole=null;driver.location=S.world.location;driver.morale=60;S.v41={temperatureStress:9};advanceHours(2);const cold=driver.morale;driver.morale=60;
 return{lowMoraleGain:foot.morale,trained,cold};
})()`, context);
assert.equal(moraleScale.lowMoraleGain, 7, 'low but valid 0–100 morale must not be trapped on the obsolete five-point scale');
assert.equal(moraleScale.trained, 60.6, 'garrison training must preserve the 0–100 morale scale');
assert.equal(moraleScale.cold, 59.6, 'temperature stress must not collapse personal morale from 60 to 5');

const ui = vm.runInContext(`(() => {
 const card=peopleCards(S.people.filter(p=>p.id==='driver_3'));
 openPerson('driver_3');
 return{card,modal:modal.innerHTML};
})()`, context);
assert.match(ui.card, /Merric Pike/);
assert.match(ui.card, /Male · age/);
assert.match(ui.card, /Morale 60\/100/);
assert.doesNotMatch(ui.card, /60\/5/);
assert.match(ui.modal, /<div>Gender<\/div><div>Male<\/div>/);
assert.match(ui.modal, /<div>Morale \/ Loyalty<\/div><div>60\/100 · 55<\/div>/);

const legacyPortraitPaths = vm.runInContext(`(() => {
 const p=S.people.find(row=>row.id==='wrong_knight'),direct=v16PersonPortrait(p);
 v16PersonEquipment(p.id);const equipmentModal=modal.innerHTML,equipmentState=p.portrait;
 setFormationRole(p.id);const formation=p.portrait;
 setRank(p.id);const ranked=p.portrait;
 v21IssuePerson(p);const issued=p.portrait;
 return{direct,equipmentModal,equipmentState,formation,ranked,issued};
})()`, context);
for(const key of ['direct','equipmentState','formation','ranked','issued'])assert.match(legacyPortraitPaths[key], /^assets\/dynasty\/female_young_/);
assert.match(legacyPortraitPaths.equipmentModal, /class="bigPic" src="assets\/dynasty\/female_young_/);
assert.doesNotMatch(legacyPortraitPaths.equipmentModal, /class="bigPic" src="assets\/units\//);

vm.runInContext(`v15Convert('wrong_knight');v16Swear('wrong_knight')`, context);
assert.match(vm.runInContext(`S.people.find(p=>p.id==='wrong_knight').portrait`, context), /^assets\/dynasty\/female_young_/);

const idempotence = vm.runInContext(`(() => {
 const before=JSON.stringify(S);
 AetherionV167Integrity.repairState(S);
 const after=JSON.stringify(S);
 return{same:before===after,migration:{...AetherionV167Integrity.runtime.lastMigration},audit:AetherionV167Integrity.auditState(S)};
})()`, context);
assert.equal(idempotence.same, true, 'a repaired save must remain byte-stable on a second pass');
assert.equal(idempotence.migration.changed, false);
assert.equal(idempotence.audit.invalidPortraits.length, 0);
assert.equal(idempotence.audit.invalidGenders.length, 0);
assert.equal(idempotence.audit.missingAges.length, 0);
assert.equal(idempotence.audit.roleArt.length, 0);
assert.equal(idempotence.audit.missingAssets.length, 0);

console.log('v1.67.0 portrait, identity, age, roster, and save-integrity patch: all assertions passed');
