/* Aetherion Reforged v1.67.0 — portrait, identity, age, and roster integrity. */
'use strict';
(()=>{
 const VERSION='1.67.0',POLICY='identity-world-integrity-v1.67.0';
 const runtime={assetsTagged:0,recordsChecked:0,gendersCorrected:0,agesAssigned:0,namesCorrected:0,portraitsCorrected:0,roleArtRemoved:0,displayAssetsRepaired:0,audioFallbacks:0,moraleScaleRepairs:0,agentsNamed:0,footmenNamed:0,familyPortraitsComputed:0,lastAudit:null,lastMigration:null};
 const PORTRAIT_EXT=/\.(?:avif|gif|jpe?g|png|svg|webp)$/i;
 const catalog=Object.create(null),exactByName=Object.create(null),exactById=Object.create(null);
 const maleNames=new Set(),femaleNames=new Set(),exactGenderByName=Object.create(null),exactGenderById=Object.create(null);
 const FOOTMEN=[
  'Arlen Beck','Beren Cade','Corin Dusk','Daveth Ford','Edwyn Gorse','Garen Hale','Harlon Ives','Jory Kestrel','Lucan Moss','Merek North',
  'Orren Reed','Perrin Shaw','Rafe Stone','Sten Tanner','Tomas Venn','Wyll Ward','Alden Brook','Bram Carr','Cedric Fen','Darian Grey',
  'Gerrit Holt','Hadrian Moor','Jorin Pike','Marek Rusk','Owyn Thorn','Roderic Vale','Tavian Vey','Wulfric Wick','Bors Crow','Toric Mallor'
 ];
 const DRIVER_NAMES=['Oren Bell','Tavin Holt','Merric Pike','Davin Cooper','Harlan Reed','Perrin Moor','Eamon Ward','Corwin Ash','Gerrit Vey','Lucan Brook','Edwyn Kest','Merek Stone','Wyll Carr','Aldren Fen','Jorin Vale','Bennet Thorn'];
 const AGENTS=[
  ['Ilyan Crow','M'],['Sabine Grey','F'],['Orren Pike','M'],['Neris Vale','F'],['Tomas Wren','M'],['Elspeth Marr','F'],
  ['Corin Ash','M'],['Mara Vell','F'],['Daveth Rook','M'],['Talia Fen','F'],['Perrin Holt','M'],['Ysra Reed','F'],
  ['Lucan Moor','M'],['Alys Thorn','F'],['Edwyn Kest','M'],['Helena Wick','F'],['Garran Vane','M'],['Celia Brine','F'],
  ['Merek Ward','M'],['Rhea Bell','F'],['Bastian Shaw','M'],['Isolde Carr','F'],['Sten Mallor','M'],['Eveline North','F']
 ];
 const DISPLAY_FALLBACKS={
  'assets/v46/items/widow_comb.webp':'assets/gifts/amber_comb.webp','assets/v46/items/widow_choker.webp':'assets/items/v16/v16_luxury_1_amber_beads.webp','assets/v46/items/silk_shift.webp':'assets/items/v16/v16_dress_1_linen_shirt.webp','assets/v46/items/crimson_gown.webp':'assets/items/v16/v16_dress_1_noble_gown.webp','assets/v46/items/shoulder_veils.webp':'assets/items/v16/v16_cloth_1_silk.webp','assets/v46/items/concealed_gloves.webp':'assets/items/v16/v16_dress_1_leather_gloves.webp','assets/v46/items/dancer_girdle.webp':'assets/items/v16/v16_dress_1_belt.webp','assets/v46/items/split_skirts.webp':'assets/v38/items/thrall_wool_skirt.webp','assets/v46/items/dancing_slippers.webp':'assets/items/v16/v16_dress_1_boots.webp','assets/v46/items/widow_perfume.webp':'assets/items/v16/v16_luxury_1_perfume.webp','assets/v46/items/razor_fan.webp':'assets/v14/relics/veiled_moon_dagger.webp','assets/v46/items/savitas_stiletto.webp':'assets/items/v16/v16_weapon_1_dagger.webp','assets/v46/items/crimson_rebec.webp':'assets/v34/items/night_rose_rebec.webp',
  'assets/v46/rooms/pleasure_salon.webp':'assets/v17/locations/pleasure_house.webp','assets/v46/rooms/lords_chamber.webp':'assets/v29/interiors/noble_solar.webp','assets/v46/rooms/household_quarters.webp':'assets/v50/rooms/barracks.webp','assets/v46/rooms/bathhouse.webp':'assets/v27/scenes/keep_interior.webp','assets/v46/rooms/kitchen.webp':'assets/v50/rooms/kitchen.webp','assets/v46/rooms/private_solar.webp':'assets/v50/rooms/solar.webp','assets/v46/libita_tavern_dance.mp4':'assets/v49/libita_brothel_success.mp4','assets/v46/libita_private_camp_dance.mp4':'assets/v49/libita_camp_success.mp4',
  'assets/v52/pleasure_tavern_01.mp4':'assets/v49/libita_brothel_success.mp4','assets/v52/pleasure_tavern_02.mp4':'assets/v49/libita_brothel_success.mp4','assets/v52/pleasure_tavern_03.mp4':'assets/v49/libita_brothel_success.mp4','assets/v54/camp_pleasure_01.mp4':'assets/v49/libita_camp_success.mp4','assets/v54/camp_pleasure_02.mp4':'assets/v49/libita_camp_success.mp4',
  'assets/v58/maps/corvinus_keep.webp':'assets/v18/maps/corvinus_keep.webp','assets/v58/maps/stonevein_halls.webp':'assets/v18/maps/stonevein_halls.webp','assets/v58/maps/wilderness_route.webp':'assets/v35/maps/aetherion_world_map.webp','assets/v58/maps/frostreach.webp':'assets/v35/maps/aetherion_region_frostreach.webp','assets/v58/maps/eternal_glades.webp':'assets/v35/maps/aetherion_region_eternal_glades.webp','assets/v58/maps/ash_wastes.webp':'assets/v35/maps/aetherion_region_ash_wastes.webp','assets/v58/maps/western_marches.webp':'assets/v35/maps/aetherion_region_western_marches.webp','assets/v58/maps/coastal_port.webp':'assets/v35/waters/white_harbor.webp','assets/v58/maps/solaran_village.webp':'assets/v35/maps/aetherion_region_solara.webp','assets/v58/maps/solaran_city.webp':'assets/v35/maps/aetherion_region_solara.webp',
  'assets/v59/duel/sword_duel.webp':'assets/v30/scenes/battle.webp',
  'assets/v61/intelligence/great_council_exterior.webp':'assets/lore/solara_radiant_court.webp','assets/v61/intelligence/great_council_chamber.webp':'assets/v27/scenes/courtroom.webp','assets/v61/intelligence/intelligence_office.webp':'assets/v29/interiors/archive.webp','assets/v61/intelligence/raven_rookery.webp':'assets/v17/transport/raven.webp','assets/v61/intelligence/maevra_voss.webp':'assets/dynasty/female_adult_2.webp',
  'assets/v62/intelligence/items/raven_feed.webp':'assets/items/v16/v16_horse_1_feed_bag.webp','assets/v62/intelligence/items/message_capsules.webp':'assets/items/pigeon_message.webp','assets/v62/intelligence/items/cipher_sheets.webp':'assets/items/v16/v16_paper_1_ledger.webp','assets/v62/intelligence/items/sealing_wax.webp':'assets/items/wax_seal.webp',
  'assets/v65/ascendant/tower_exterior.webp':'assets/blood_keep_ruins_on_the_storm_coast.jpg','assets/v65/ascendant/summit_circle.webp':'assets/blood_keep_ruins_on_the_storm_coast.jpg','assets/v65/ascendant/thorned_altar.webp':'assets/lore/secractus_chapel.webp','assets/v65/ascendant/dragon_landing.webp':'assets/v30/scenes/bonding.webp','assets/v65/ascendant/civic_temple.webp':'assets/v50/rooms/chapel.webp','assets/v65/ascendant/blood_dragon_companion.webp':'assets/v30/scenes/blood_dragon_portrait.png',
  'assets/v71/items/v41_crimson_pauldrons.webp':'assets/v41/items/royal_pauldrons.webp','assets/v71/items/v41_crimson_boots.webp':'assets/v41/items/royal_boots.webp','assets/v71/items/v41_crimson_mantle.webp':'assets/v41/items/royal_cloak.webp','assets/v71/items/v41_wraith_scale.webp':'assets/v41/valkorion/wraith_2.webp','assets/v71/items/v41_wraith_wings.webp':'assets/v41/valkorion/wraith_3.webp','assets/v71/items/v41_wraith_gauntlets.webp':'assets/v41/valkorion/wraith_4.webp','assets/v71/items/v41_wraith_leggings.webp':'assets/v41/valkorion/wraith_5.webp','assets/v71/items/v41_wraith_boots.webp':'assets/v41/valkorion/wraith_6.webp','assets/v71/items/v43_toxin_reagents.webp':'assets/v43/items/assassin_poison_kit.webp','assets/v71/items/v43_antidote.webp':'assets/items/v16/v16_medicine_1_physic_bag.webp','assets/v71/items/v43_sable_sleep.webp':'assets/v43/items/black_widow_venom.webp','assets/v71/items/v43_ash_ichor.webp':'assets/v43/items/black_widow_venom.webp',
  'assets/v73/valkorion/foundation.webp':'assets/v38/characters/valkorion_base_linen.webp','assets/v73/valkorion/gauntlets.webp':'assets/v38/characters/valkorion_gauntlets_linen.webp','assets/v73/valkorion/arming_doublet.webp':'assets/v38/characters/valkorion_arming_layer.webp','assets/v73/valkorion/boots.webp':'assets/v38/characters/valkorion_boots_trousers.webp','assets/v73/valkorion/legplates.webp':'assets/v38/characters/valkorion_partial_armor.webp','assets/v73/valkorion/cloak.webp':'assets/v38/characters/valkorion_armor_cloak.webp','assets/v73/valkorion/full_armor.webp':'assets/v38/characters/valkorion_armor_cloak.webp','assets/v73/valkorion/full_formal.webp':'assets/v38/characters/valkorion_lord_full.webp','assets/v76/valkorion/wraith.webp':'assets/v44/valkorion/wraith_7.webp','assets/v76/valkorion/crimson.webp':'assets/v44/valkorion/crimson_7.webp','assets/v76/valkorion/royal.webp':'assets/v44/valkorion/royal_7.webp'
 };
 for(const file of ['cuirass','pauldrons','helmet','gorget','sword','bow','dagger','quiver','sword_belt'])DISPLAY_FALLBACKS[`assets/v73/valkorion/${file}.webp`]='assets/v38/characters/valkorion_partial_armor.webp';
 DISPLAY_FALLBACKS['assets/v73/valkorion/signet.webp']='assets/v38/characters/valkorion_lord_full.webp';
 for(const name of ['Ash','Cinder','Gloam','Morrow','Nail','Vesper','Rook','Sable'])DISPLAY_FALLBACKS[`assets/v62/intelligence/ravens/${name.toLowerCase()}.webp`]='assets/v17/transport/raven.webp';
 Object.freeze(DISPLAY_FALLBACKS);

 function clean(value){return String(value??'').trim()}
 function lower(value){return clean(value).toLowerCase().replace(/[’']/g,"'").replace(/\s+/g,' ')}
 function slug(value){return lower(value).replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')}
 function hash(value){if(typeof v15Hash==='function')return v15Hash(String(value))>>>0;if(typeof v10Hash==='function')return v10Hash(String(value))>>>0;let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
 function html(value){return typeof esc==='function'?esc(clean(value)):clean(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
 function js(value){return clean(value).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}
 function labelFromPath(path){let base=clean(path).split('/').pop().replace(/\.[^.]+$/,'').replace(/^v\d+_/,'').replace(/_/g,' ');return base.replace(/\b\w/g,c=>c.toUpperCase())}
 function allAssets(){try{return[...(typeof AETHERION_ASSETS!=='undefined'?AETHERION_ASSETS:[])]}catch(_){return[]}}
 const packagedAssets=new Set(allAssets());
 const EMPTY_PIXEL='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
 const DISPLAY_ASSET_PATTERN=/assets\/[a-z0-9_./-]+\.(?:avif|gif|jpe?g|png|svg|webp|mp4|webm)/gi;
 function resolveDisplayAsset(path){path=clean(path);let next=DISPLAY_FALLBACKS[path];if(next&&(packagedAssets.has(next)||/^data:/i.test(next)))return next;if(/^assets\/v(?:77|78)\/valkorion\/foundation\.png$/i.test(path))return'assets/v38/characters/valkorion_base_linen.webp';if(/^assets\/v(?:75\/valkorion\/overlays|77\/valkorion\/layers|78\/valkorion\/layers)\//i.test(path))return EMPTY_PIXEL;return path}
 function rewriteDisplayAssets(value){return typeof value==='string'?value.replace(DISPLAY_ASSET_PATTERN,path=>resolveDisplayAsset(path)):value}
 function repairDisplayAssets(){let changed=0,repairObject=obj=>{if(!obj||typeof obj!=='object')return;for(const key of Object.keys(obj)){let old=obj[key];if(typeof old!=='string')continue;let next=resolveDisplayAsset(old);if(next!==old){obj[key]=next;changed++}}};
  try{repairObject(V61_ART)}catch(_){}try{repairObject(V62_RAVEN_ART)}catch(_){}try{repairObject(V71_UNIQUE_ART)}catch(_){}
  try{for(const row of V62_SUPPLIES||[]){let next=resolveDisplayAsset(row.img);if(next!==row.img){row.img=next;changed++}}}catch(_){}
  try{for(const item of Object.values(ITEMS||{})){let next=resolveDisplayAsset(item?.img);if(next&&next!==item.img){item.img=next;item.imagePolicy??='packaged-reuse-v1.67.0';changed++}}}catch(_){}
  try{for(const building of Object.values(BUILDINGS||{})){let next=resolveDisplayAsset(building?.img);if(next&&next!==building.img){building.img=next;changed++}}}catch(_){}
  runtime.displayAssetsRepaired+=changed;return changed
 }
 let integrityAudioContext=null;
 function soundContext(){try{if(typeof v60Ctx==='function')return v60Ctx();let C=window.AudioContext||window.webkitAudioContext;if(!C)return null;integrityAudioContext??=new C();if(integrityAudioContext.state==='suspended')integrityAudioContext.resume?.().catch?.(()=>{});return integrityAudioContext}catch(_){return null}}
 function synthesizedEffect(kind='tap',lane=0){let ctx=soundContext();if(!ctx)return false;try{let now=ctx.currentTime,g=ctx.createGain(),o=ctx.createOscillator(),miss=/miss|pain|boing/i.test(kind),draw=/draw/i.test(kind),drum=/drum/i.test(kind);o.type=drum||miss?'sawtooth':draw?'triangle':'square';o.frequency.setValueAtTime(drum?[92,145,210,118,72][lane%5]:draw?165:miss?115:520,now);if(!drum&&!draw)o.frequency.exponentialRampToValueAtTime(miss?72:760,now+.11);g.gain.setValueAtTime(drum?.18:.11,now);g.gain.exponentialRampToValueAtTime(.001,now+(drum?.22:.16));o.connect(g).connect(ctx.destination);o.start(now);o.stop(now+(drum?.24:.18));runtime.audioFallbacks++;return true}catch(_){return false}}
 function synthesizedInstrument(family,lane,hold=false){let active=typeof V33_ACTIVE!=='undefined'?V33_ACTIVE:null;if(!active?.song)return false;let ctx=soundContext();if(!ctx)return false;try{let freq=active.song.frequencies?.[lane]||[146.83,196,246.94,293.66,392][lane]||220,profile={lute:['triangle',.007,.18,.65],harp:['sine',.012,.2,1.45],rebec:['sawtooth',.07,.12,1.25],flute:['sine',.055,.13,1.05],horn:['sawtooth',.085,.11,1.4]}[family]||['triangle',.02,.12,.8],now=ctx.currentTime,g=ctx.createGain(),o=ctx.createOscillator(),h=ctx.createOscillator(),hg=ctx.createGain(),duration=hold?8:profile[3];o.type=profile[0];o.frequency.value=freq;h.type='sine';h.frequency.value=freq*2.01;hg.gain.value=family==='horn'?.18:family==='rebec'?.12:.07;g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(profile[2],now+profile[1]);if(!hold)g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g);h.connect(hg).connect(g);g.connect(ctx.destination);o.start(now);h.start(now);let oscs=[o,h];if(hold){active.instrumentVoices??={};active.instrumentVoices[lane]={ctx,gain:g,oscs}}else oscs.forEach(osc=>osc.stop(now+duration+.05));runtime.audioFallbacks++;return true}catch(_){return false}}
 function installAudioIntegrity(){
  if(typeof v67Prime==='function')v67Prime=function(){return false};
  if(typeof v66PrimeDuelAudio==='function')v66PrimeDuelAudio=function(){return false};
  if(typeof v60DrumHit==='function')v60DrumHit=function(lane){return synthesizedEffect('drum',lane)};
  if(typeof v59Play==='function')v59Play=function(file){return synthesizedEffect(file||'sword')};
  if(typeof v60Harp==='function')v60Harp=function(lane,hold=false){return synthesizedInstrument('harp',lane,hold)};
  if(typeof v60Rebec==='function')v60Rebec=function(lane,hold=false){return synthesizedInstrument('rebec',lane,hold)};
  if(typeof v66Voice==='function')v66Voice=function(family,lane,hold=false){return synthesizedInstrument(family,lane,hold)};
  if(typeof v67SampleNote==='function')v67SampleNote=function(family,lane,hold=false){return synthesizedInstrument(family,lane,hold)};
  if(typeof v52BrothelVideo==='function')v52BrothelVideo=function(){return'assets/v49/libita_brothel_success.mp4'};
  if(typeof v53ChooseScene==='function')v53ChooseScene=function(mode){return mode==='camp'?'assets/v49/libita_camp_success.mp4':'assets/v49/libita_brothel_success.mp4'};
  if(typeof v53PlayClip==='function'){const base=v53PlayClip;v53PlayClip=function(src,...args){return packagedAssets.has(src)||/^(?:https?:|data:|blob:)/i.test(clean(src))?base.call(this,src,...args):synthesizedEffect(/miss|boing/i.test(clean(src))?'miss':'reaction')}}
  if(typeof v33GameMarkup==='function'){const base=v33GameMarkup;v33GameMarkup=function(...args){return String(base.apply(this,args)).replace(/ACOUSTIC SAMPLES/g,'RESPONSIVE INSTRUMENT AUDIO')}}
  if(typeof v33OpenMusicHall==='function'){const base=v33OpenMusicHall;v33OpenMusicHall=function(...args){let out=base.apply(this,args),notice=typeof document!=='undefined'?document.querySelector?.('#modalRoot .v67AcousticNotice'):null;if(notice){let b=notice.querySelector?.('b'),span=notice.querySelector?.('span');if(b)b.textContent='RESPONSIVE INSTRUMENT AUDIO';if(span)span.textContent='Lute, harp, rebec, flute and horn use distinct responsive voices generated offline from each played note.'}return out}}
 }
 function imageAssets(){try{return(typeof AETHERION_ASSETS!=='undefined'?AETHERION_ASSETS:[]).filter(path=>PORTRAIT_EXT.test(path))}catch(_){return[]}}
 function tag(path,values={}){if(!path)return null;let row=Object.freeze({path,label:values.label||labelFromPath(path),kind:values.kind||'illustration',eligibleForPerson:values.eligibleForPerson===true,gender:values.gender||null,ageMin:Number.isFinite(values.ageMin)?values.ageMin:null,ageMax:Number.isFinite(values.ageMax)?values.ageMax:null,subjects:Object.freeze([...(values.subjects||[])]),ids:Object.freeze([...(values.ids||[])]),lineage:values.lineage||null,reviewed:values.reviewed!==false});catalog[path]=row;return row}
 function mergeTag(path,values){let old=catalog[path]||{};return tag(path,{...old,...values,subjects:values.subjects||old.subjects||[],ids:values.ids||old.ids||[]})}
 function inferWorkerDepiction(path){let value=lower(path);if(/female|woman|maid|laundress|midwife|nurse|dancer|fisherwoman|stablewoman/.test(value))return'F';if(/male|\bman\b|serving_man|fisherman|stableman/.test(value))return'M';return null}
 function classifyAssets(){
  for(const path of imageAssets()){
   let value=lower(path),kind='illustration',eligible=false,gender=null,ageMin=null,ageMax=null,lineage=null;
   if(/\/items?\/|\/gear\/|\/weapons?\/|\/armor\//.test(value))kind='item';
   else if(/\/workers\//.test(value)||/\/v34\/people\//.test(value)){kind='occupation-reference';gender=inferWorkerDepiction(path)}
   else if(/bannerless_|\/units?\//.test(value))kind='formation-reference';
   else if(/\/locations?\/|\/scenes?\/|\/rooms?\/|\/districts?\/|\/interiors?\/|\/facilities?\/|\/buildings?\//.test(value))kind='scene';
   else if(/\/transport\//.test(value))kind='transport-or-animal';
   else if(/\/companions\//.test(value))kind='animal-or-companion';
   else if(/\/characters\//.test(value)||/\/portraits\//.test(value))kind='named-or-reference-portrait';
   let m=value.match(/assets\/dynasty\/(female|male)_(child|teen|young|adult)_([1-4])\.webp$/);
   if(m){gender=m[1]==='female'?'F':'M';let index=+m[3];kind='reusable-person-portrait';eligible=true;if(m[2]==='child'){ageMin=0;ageMax=12}else if(m[2]==='teen'){ageMin=13;ageMax=17}else if(m[2]==='young'){ageMin=18;ageMax=25}else{ageMin=[26,40,50,60][index-1];ageMax=[39,49,59,999][index-1]}}
   let prisoner=value.match(/assets\/prisoners\/(bandit_female|bandit_male|mercenary_male|orc_male)\.webp$/);
   if(prisoner){kind='reusable-prisoner-portrait';eligible=true;gender=prisoner[1].includes('female')?'F':'M';ageMin=18;ageMax=75}
   let dom=value.match(/assets\/dominus_dynasty\/(adult_female|adult_male|boy|girl|young_man|young_woman)\.webp$/);
   if(dom){kind='reusable-person-portrait';eligible=true;gender=/female|girl|woman/.test(dom[1])?'F':'M';lineage='Dominus';if(/boy|girl/.test(dom[1])){ageMin=1;ageMax=12}else if(/young/.test(dom[1])){ageMin=13;ageMax=25}else{ageMin=26;ageMax=999}}
   if(/assets\/dominus_dynasty\/(birth|married_chamber|pregnancy)\.webp$/.test(value)){kind='scene';eligible=false}
   tag(path,{kind,eligibleForPerson:eligible,gender,ageMin,ageMax,lineage,reviewed:true});
  }
 }
 function registerExact(path,names,genders,ids=[]){let subjects=Array.isArray(names)?names:[names],sex=Array.isArray(genders)?genders[0]:genders;mergeTag(path,{label:subjects.join(' / '),kind:'exact-person-portrait',eligibleForPerson:true,gender:sex||null,subjects,ids});for(const name of subjects){let k=lower(name);exactByName[k]??=path;if(sex)exactGenderByName[k]=sex}for(const id of ids){exactById[id]??=path;if(sex)exactGenderById[id]=sex}}
 function registerExactAssets(){
  try{for(const[name,path]of Object.entries(CHAR_PORTRAIT)){if(name==='Narrator'){mergeTag(path,{label:'Narrator emblem',kind:'narrator-emblem',eligibleForPerson:false,subjects:['Narrator']});continue}let gender=HQ_VOICE_PROFILE?.[name]?.gender||(/^(Lady|Princess|Queen)\b/.test(name)?'F':'M');registerExact(path,name,gender,name==='Valkorion Dominus'?['valkorion']:[])}}catch(_){}
  const fixed=[
   ['assets/characters/kael_azure_tide.webp','Kael of the Azure Tide','M',['kael_azure_tide']],
   ['assets/characters/lady_alexus_court_v16.png','Lady Alexus Dominus','F',[]],['assets/characters/lady_alexus_dominus_restored.webp','Lady Alexus Dominus','F',[]],
   ['assets/stormbound_valkorion_dominus.jpg','Valkorion Dominus','M',['valkorion']],['assets/valkorion.jpg','Valkorion Dominus','M',['valkorion']],
   ['assets/v38/thrall/nessa_cale_portrait.webp','Nessa Cale','F',['v38_nessa_cale']],['assets/v38/thrall/nessa_cale_companion.webp','Nessa Cale','F',['v38_nessa_cale']],
   ['assets/v43/libita/libita_savitas.jpg','Libita Savitas','F',['libita_savitas','v43_libita_savitas']],
   ['assets/v29/portraits/shipwright_odran.webp','Master Odran Blackwake','M',['v28_labor_0']],
   ['assets/v29/portraits/navigator_yselle.webp','Navigator Yselle Vane','F',['v28_labor_1']],
   ['assets/v29/portraits/quartermaster_halric.webp','Quartermaster Halric Morn','M',['v28_labor_2']],
   ['assets/v29/portraits/foreman_garran.webp','Foreman Garran Pike','M',['v28_labor_3']],
   ['assets/v29/portraits/captain_sabine.webp','Captain Sabine Redwake','F',['v28_labor_4']],
   ['assets/v29/portraits/captain_edric.webp','Captain Edric Voss','M',['v28_labor_5']],
   ['assets/v29/portraits/surgeon_ysabet.webp','Mistress Ysabet Vale','F',['surgeon_ysabet']],
   ['assets/v29/portraits/surgeon_halric.webp','Master Halric Wren','M',['surgeon_halric']],
   ['assets/companions/unique/ser_slaughter.webp','Ser Slaughter','M',[]],['assets/companions/unique/kaela_ironstring.webp','Kaela Ironstring','F',[]],
   ['assets/companions/unique/laughing_traveler.webp','The Laughing Traveler','M',[]],['assets/companions/unique/lady_ashveil.webp','Lady Ashveil','F',[]],
   ['assets/companions/unique/brother_hollow.webp','Brother Hollow','M',[]]
  ];
  for(const row of fixed)registerExact(...row);
  for(const path of imageAssets()){
   let value=lower(path);
   if(/assets\/v38\/characters\/alexus_/.test(value))registerExact(path,'Lady Alexus Dominus','F');
   else if(/assets\/v38\/characters\/valkorion_/.test(value)||/assets\/v(?:40|41|44)\/valkorion\//.test(value))registerExact(path,'Valkorion Dominus','M',['valkorion']);
   else if(/assets\/v38\/thrall\/nessa_cale_(encounter|field|gear|pact)\.webp$/.test(value))mergeTag(path,{label:'Nessa Cale scene',kind:'subject-scene',eligibleForPerson:false,gender:'F',subjects:['Nessa Cale']});
  }
  try{for(const[key,row]of Object.entries(V21_UNIQUE))registerExact(row.img,row.name,row.gender,[`unique_${key}`])}catch(_){}
  mergeTag('assets/v29/portraits/moondancer.webp',{label:'Moondancer',kind:'animal-portrait',eligibleForPerson:false,subjects:['Moondancer']});
 }
 classifyAssets();registerExactAssets();runtime.assetsTagged=Object.keys(catalog).length;

 function addPool(target,getter){try{for(const value of getter()||[]){let name=clean(value).replace(/^(?:Ser|Dame|Master|Mistress|Father|Sister|Brother|Captain|Companion|Navigator|Quartermaster|Foreman)\s+/i,'').split(/\s+/)[0];if(name)target.add(name)}}catch(_){}
 }
 addPool(maleNames,()=>LW_FIRST_M);addPool(femaleNames,()=>LW_FIRST_F);addPool(maleNames,()=>V10_LOCAL_M);addPool(femaleNames,()=>V10_LOCAL_F);addPool(maleNames,()=>V15_MALE);addPool(femaleNames,()=>V15_FEMALE);addPool(maleNames,()=>V17_MALE);addPool(femaleNames,()=>V17_FEMALE);addPool(maleNames,()=>V13_DOMINUS_M);addPool(femaleNames,()=>V13_DOMINUS_F);addPool(maleNames,()=>V11_MANAGER_NAMES);addPool(maleNames,()=>V11_DRIVER_NAMES);addPool(maleNames,()=>NAMES_KNIGHTS);
 for(const name of 'Arlen Beren Corin Daveth Edwyn Garen Garran Gerrit Harlon Hadrian Jory Jorin Lucan Merek Merric Orren Perrin Rafe Sten Tomas Wyll Alden Bram Cedric Darian Marek Owyn Roderic Tavian Wulfric Bors Toric Ilyan Odran Halric Eamon Harlan Bennet Bastian Bran Hugh Orric Othric Caelir'.split(' '))maleNames.add(name);
 for(const name of 'Alys Brina Celia Ellyn Elspeth Eveline Fara Helena Isolde Mara Maelin Neris Nessa Rhea Runa Sabine Talia Tessa Ysabet Yselle Ysra'.split(' '))femaleNames.add(name);
 for(const[name,gender]of AGENTS)exactGenderByName[lower(name)]=gender;
 const fixedIdentity=[
  ['kael_azure_tide','Kael of the Azure Tide','M',43],['v38_nessa_cale','Nessa Cale','F',18],['libita_savitas','Libita Savitas','F',25],['v43_libita_savitas','Libita Savitas','F',25],['v61_maevra_voss','Maevra Voss','F',44],
  ['surgeon_ysabet','Mistress Ysabet Vale','F',58],['surgeon_halric','Master Halric Wren','M',67],
  ['v28_labor_0','Master Odran Blackwake','M',58],['v28_labor_1','Navigator Yselle Vane','F',34],['v28_labor_2','Quartermaster Halric Morn','M',51],['v28_labor_3','Foreman Garran Pike','M',42],['v28_labor_4','Captain Sabine Redwake','F',38],['v28_labor_5','Captain Edric Voss','M',45]
 ];
 const exactAgeById=Object.create(null);
 for(const[id,name,gender,age]of fixedIdentity){exactGenderById[id]=gender;exactGenderByName[lower(name)]=gender;exactAgeById[id]=age}
 try{for(const[name,p]of Object.entries(HQ_VOICE_PROFILE)){if(name!=='Narrator')exactGenderByName[lower(name)]=p.gender}}catch(_){}
 try{for(const n of NAMES_KNIGHTS)exactGenderByName[lower(n)]='M'}catch(_){}
 try{for(const row of Object.values(V21_UNIQUE))exactGenderByName[lower(row.name)]=row.gender}catch(_){}

 function firstName(name){return clean(name).replace(/^(?:Uncle\s+)?(?:High\s+King|High\s+Lord|Lord-Marshal|Crown\s+Prince|Lord\s+Admiral|Warchief|King|Queen|Prince|Princess|Lady|Lord|Ser|Dame|Master|Mistress|Veteran|Pathfinder|Huntsman|Huntress|Hunter|Scholar|Companion|Captain|Navigator|Quartermaster|Foreman|Father|Mother|Brother|Sister|Keeper|Thane)\s+/i,'').split(/\s+/)[0]||''}
 function inferGender(p){
  let id=clean(p?.id),name=lower(p?.name),first=firstName(p?.name);
  if(exactGenderById[id])return exactGenderById[id];if(exactGenderByName[name])return exactGenderByName[name];
  let female=femaleNames.has(first),male=maleNames.has(first);if(female&&!male)return'F';if(male&&!female)return'M';
  if(/^(?:Lady|Queen|Princess|Dame|Mistress|Mother|Sister)\b/i.test(clean(p?.name)))return'F';
  if(/^(?:Lord|King|Prince|Ser|Master|Father|Brother|Warchief|Thane)\b/i.test(clean(p?.name)))return'M';
  let role=lower(`${p?.role||''} ${p?.rank||''} ${p?.relation||''}`);if(/\b(female|woman|maid|laundress|midwife|mother|wife|sister|daughter|girl)\b/.test(role))return'F';if(/\b(male|serving man|father|husband|brother|son|boy)\b/.test(role))return'M';
  if(p?.gender==='F'||p?.gender==='M')return p.gender;if(/^(?:YF|MF|BF)$/.test(clean(p?.voice)))return'F';if(/^(?:YM|MM|BM)$/.test(clean(p?.voice)))return'M';return hash(`${p?.id}|${p?.name}|gender`)%5===0?'F':'M'
 }
 function raceOf(p,context={}){let value=lower(`${context.race||''} ${p?.race||''} ${p?.species||''} ${p?.culture||''} ${p?.house||''} ${p?.faction||''} ${p?.name||''}`);if(/dark\s*elf|nocthar|underrealm/.test(value))return'darkelf';if(/\belf\b|eldarin|\bvael\b|eternal glades/.test(value))return'elf';if(/dwarf|dwarven|stonevein|ironspine/.test(value))return'dwarf';if(/\borc\b|skullhorn|grimhorn/.test(value))return'orc';return'human'}
 function visualAge(p,context={}){let age=Math.max(0,+p?.age||0),race=raceOf(p,context);if(race==='dwarf')return age*.43;if(race==='elf'||race==='darkelf')return age*.24;if(race==='orc')return age*1.12;return age}
 function lifeStage(age,race='human'){let a=+age||0,visual=race==='dwarf'?a*.43:race==='elf'||race==='darkelf'?a*.24:race==='orc'?a*1.12:a;return visual<1?'Infant':visual<6?'Young child':visual<13?'Child':visual<18?'Adolescent':visual<26?'Young adult':visual<60?'Adult':'Elder'}
 function ageRangeFor(p){let role=lower(`${p?.role||''} ${p?.rank||''}`),voice=clean(p?.voice);if(/child|son|daughter/.test(role))return[2,17];if(/grandmaster|surgeon|spymaster|master of whispers/.test(role))return[38,68];if(/company captain|commander|marshal|admiral/.test(role))return[34,58];if(/knight/.test(role))return voice==='MM'?[38,56]:[22,39];if(/footman|soldier|guard|marine|archer|crossbow|man-at-arms/.test(role))return[18,42];if(/courtesan|companion/.test(role))return[19,43];if(/driver|teamster|labor|worker|servant|farmer|sailor|fisher|porter|loader|stevedore/.test(role))return[20,55];return voice==='MM'||voice==='MF'?[38,62]:[20,52]}
 function ensureAge(p){if(!p)return 0;let id=clean(p.id),exact=exactAgeById[id];if(Number.isFinite(exact)&&(!Number.isFinite(+p.age)||+p.age<0)){p.age=exact;runtime.agesAssigned++;return exact}if(Number.isFinite(+p.age)&&+p.age>=0)return+p.age;let[min,max]=ageRangeFor(p),age=min+hash(`${p.id}|${p.name}|age`)%(max-min+1);p.age=age;runtime.agesAssigned++;return age}
 function portraitSpec(p,context={}){let gender=inferGender(p),age=visualAge(p,context),stage,index;if(age<13){stage='child';index=1+hash(`${p?.id}|${p?.name}|child`)%4}else if(age<18){stage='teen';index=1+hash(`${p?.id}|${p?.name}|teen`)%4}else if(age<26){stage='young';index=1+hash(`${p?.id}|${p?.name}|young`)%4}else{stage='adult';index=age<40?1:age<50?2:age<60?3:4}return{gender,age,stage,index,path:`assets/dynasty/${gender==='F'?'female':'male'}_${stage}_${index}.webp`}}
 function exactIdentityArt(p){let id=clean(p?.id),name=lower(p?.name);return exactById[id]||exactByName[name]||null}
 function subjectMatches(p,row){let id=clean(p?.id),name=lower(p?.name);return(row.ids||[]).includes(id)||(row.subjects||[]).some(subject=>lower(subject)===name)}
 function portraitValidity(p,path,context={}){
  path=clean(path);if(!path)return{ok:false,reason:'missing'};let row=catalog[path];
  if(!row){if(/^(?:https?:|data:|blob:|custom\/|user\/)/i.test(path))return{ok:true,reason:'external-custom'};return{ok:false,reason:'unregistered-packaged-path'}}
  if(!row.eligibleForPerson)return{ok:false,reason:/occupation|formation|scene|item|transport/.test(row.kind)?'role-or-scene-art':'not-person-art'};
  let gender=inferGender(p);if(row.gender&&row.gender!==gender)return{ok:false,reason:'cross-sex'};
  if(row.kind==='exact-person-portrait'&&!subjectMatches(p,row))return{ok:false,reason:'wrong-subject'};
  if(row.kind==='reusable-person-portrait'){let spec=portraitSpec(p,context);if(path!==spec.path)return{ok:false,reason:'age-band'}}
  if(row.kind==='reusable-prisoner-portrait'){let value=lower(path),race=raceOf(p,context);if(value.includes('orc')&&race!=='orc')return{ok:false,reason:'wrong-species'};if(!value.includes('orc')&&race==='orc')return{ok:false,reason:'wrong-species'}}
  return{ok:true,reason:'compatible'}
 }
 function identityPortrait(p,context={}){
  let existing=clean(p?.portrait||p?.img),valid=portraitValidity(p,existing,context);if(valid.ok&&catalog[existing]?.kind==='exact-person-portrait')return existing;
  let exact=exactIdentityArt(p);if(exact)return exact;
  if(context.prisoner||p?.sentence||p?.kind&&/bandit|mercenary|orc/.test(lower(p.kind))){let gender=inferGender(p),kind=lower(p?.kind),path=kind.includes('orc')?'assets/prisoners/orc_male.webp':kind.includes('mercenary')?'assets/prisoners/mercenary_male.webp':gender==='F'?'assets/prisoners/bandit_female.webp':'assets/prisoners/bandit_male.webp';if(catalog[path])return path}
  return portraitSpec(p,context).path
 }
 function repairHonorific(p,gender){
  if(!p||exactGenderByName[lower(p.name)])return;let old=clean(p.name),next=old,role=lower(`${p.role||''} ${p.rank||''}`);
  if(/^(Ser|Dame)\s+/i.test(next)&&/knight|banner/.test(role))next=next.replace(/^(Ser|Dame)\s+/i,gender==='F'?'Dame ':'Ser ');
  if(/^(Master|Mistress)\s+/i.test(next))next=next.replace(/^(Master|Mistress)\s+/i,gender==='F'?'Mistress ':'Master ');
  if(/^(Huntsman|Huntress)\s+/i.test(next))next=next.replace(/^(Huntsman|Huntress)\s+/i,gender==='F'?'Huntress ':'Huntsman ');
  if(next!==old){p.name=next;runtime.namesCorrected++}
  if(/^(Ser|Dame)$/i.test(clean(p.title))&&/knight|banner/.test(role))p.title=gender==='F'?'Dame':'Ser';
  else if(/^(Master|Mistress)$/i.test(clean(p.title)))p.title=gender==='F'?'Mistress':'Master';
  else if(/^(Huntsman|Huntress)$/i.test(clean(p.title)))p.title=gender==='F'?'Huntress':'Huntsman'
 }
 function repairPerson(p,context={}){
  if(!p||typeof p!=='object'||!clean(p.name))return p;runtime.recordsChecked++;let oldGender=p.gender,age=ensureAge(p),gender=inferGender(p);p.gender=gender;repairHonorific(p,gender);
  if(oldGender!==gender)runtime.gendersCorrected++;
  if(p.voice&&/^(?:YF|MF|YM|MM)$/.test(p.voice))p.voice=gender==='F'?(age>=38?'MF':'YF'):(age>=38?'MM':'YM');
  if(Object.prototype.hasOwnProperty.call(p,'lifeStage'))p.lifeStage=lifeStage(age,raceOf(p,context));
  let field=context.imageField||'portrait',current=clean(p[field]||(field==='portrait'?p.img:p.portrait)),usedImageFallback=field==='portrait'&&!clean(p.portrait)&&!!clean(p.img),valid=portraitValidity(p,current,context),next=valid.ok?current:identityPortrait(p,context);
  let mayStore=context.storePortrait!==false||!!current||!!exactIdentityArt(p);
  if(mayStore&&next&&current!==next){if(valid.reason==='role-or-scene-art')runtime.roleArtRemoved++;p[field]=next;if(field==='portrait'&&(context.syncImage||usedImageFallback))p.img=next;runtime.portraitsCorrected++}
  return p
 }
 function repairFamily(rows,context={}){for(const member of rows||[])repairPerson(member,{...context,storePortrait:false,family:true});return rows}
 function repairRows(rows,context={}){for(const p of rows||[]){repairPerson(p,context);if(Array.isArray(p.family))repairFamily(p.family,{...context,race:raceOf(p,context)})}return rows}

 function uniqueName(preferred,used,pool){let start=Math.max(0,pool.indexOf(preferred));for(let i=0;i<pool.length;i++){let name=pool[(start+i)%pool.length];if(!used.has(lower(name))){used.add(lower(name));return name}}let n=2,name=preferred;while(used.has(lower(name)))name=`${preferred} ${n++}`;used.add(lower(name));return name}
 function renameReferences(state,oldName,newName){if(!oldName||oldName===newName)return;for(const wagon of state.wagons||[])if(wagon.driver===oldName)wagon.driver=newName;for(const mount of state.mounts||[])if(mount.assigned===oldName)mount.assigned=newName;for(const wound of state.v23?.wounds||[])if(wound.patient===oldName)wound.patient=newName;for(const manager of Object.values(state.trade?.managers||{})){if(manager.name===oldName)manager.name=newName;if(manager.driverName===oldName)manager.driverName=newName}}
 function nameStarterFootmen(state){let people=state?.people||[],used=new Set(people.filter(p=>!/^Footman \d+$/i.test(clean(p.name))).map(p=>lower(p.name)));for(const p of people){let m=clean(p.name).match(/^Footman (\d+)$/i);if(!m)continue;let n=Math.max(1,+m[1]),old=p.name,preferred=FOOTMEN[(n-1)%FOOTMEN.length];p.name=uniqueName(preferred,used,FOOTMEN);p.serviceNumber??=n;renameReferences(state,old,p.name);runtime.footmenNamed++;runtime.namesCorrected++}}
 function localPool(gender){try{return gender==='F'?[...V10_LOCAL_F]:[...V10_LOCAL_M]}catch(_){return gender==='F'?['Alys','Celia','Ellyn','Mara','Rhea','Sabine','Talia','Ysra']:['Aldren','Bennet','Corwin','Davin','Eamon','Gerrit','Harlan','Jorin','Merek','Oren','Perrin','Tavin','Wyll']}}
 function coherentNameWorkers(state){
  if(!state)return state;let people=state.people||[],used=new Set(people.filter(p=>!/^(?:Wagon Driver|Worker) \d+$/i.test(clean(p.name))).map(p=>lower(p.name))),renamed=new Map();
  for(const p of people){if(p.category!=='Workers')continue;let old=clean(p.name),match=old.match(/^(?:Wagon Driver|Worker) (\d+)$/i);if(match){let n=Math.max(1,+match[1]),preferred=/Carriage Driver|Wagon Driver/i.test(clean(p.role))?DRIVER_NAMES[(n-1)%DRIVER_NAMES.length]:DRIVER_NAMES[(n+5)%DRIVER_NAMES.length];p.name=uniqueName(preferred,used,DRIVER_NAMES);renamed.set(old,p.name);runtime.namesCorrected++}
   p.permanent=true;p.age??=24+(people.filter(q=>q.category==='Workers').indexOf(p)*7)%31;p.surname=clean(p.name).split(/\s+/).slice(-1)[0];p.homeLocation??='Corvinus Keep';p.job??=typeof v10WorkerFunction==='function'?v10WorkerFunction(p.role):'Performs a named, persistent duty for the household.';
   let gender=inferGender(p),seed=hash(`${state.meta?.rngSeed||'world'}|${p.id||p.name}|family`);p.gender=gender;p.voice=gender==='F'?(+p.age>=38?'MF':'YF'):(+p.age>=38?'MM':'YM');
   if(!Array.isArray(p.family)){let sg=gender==='F'?'M':'F',pool=localPool(sg),sf=pool[seed%pool.length],surname=p.surname,spouseAge=Math.max(18,(+p.age||30)-((seed>>>12)%7)+3);p.family=[{id:`worker_family_${slug(p.id||p.name)}_spouse`,name:`${sf} ${surname}`,gender:sg,age:spouseAge,relation:'Spouse',alive:true,portraitIndex:(seed>>>7)%4}];for(let c=0;c<seed%3;c++){let cg=((seed>>>c)&1)?'F':'M',names=localPool(cg),first=names[(seed+c*3)%names.length];p.family.push({id:`worker_family_${slug(p.id||p.name)}_child_${c+1}`,name:`${first} ${surname}`,gender:cg,age:Math.max(1,Math.min(20,(+p.age||30)-21-c*3)),relation:'Child',alive:true,portraitIndex:seed%4})}}
   repairPerson(p);repairFamily(p.family)
  }
  for(const wagon of state.wagons||[])if(renamed.has(wagon.driver))wagon.driver=renamed.get(wagon.driver);return state
 }
 function repairAgents(state){let agents=state?.v61?.agents||[],used=new Set((state.people||[]).map(p=>lower(p.name))),seen=new Set();for(let i=0;i<agents.length;i++){let a=agents[i],duplicate=seen.has(lower(a.name))||used.has(lower(a.name)),slot=AGENTS[i%AGENTS.length],old=a.name;if(duplicate||!clean(a.name)){let choices=AGENTS.map(row=>row[0]),name=uniqueName(slot[0],new Set([...used,...seen]),choices);a.name=name;runtime.agentsNamed++;runtime.namesCorrected++;for(const report of state.v61?.reports||[])if(report.agentId===a.id)report.agentName=name}else seen.add(lower(a.name));let identity=AGENTS.find(row=>firstName(a.name)===firstName(row[0]))||slot;a.gender=identity[1];a.role??='Field Agent';a.age??=23+hash(`${a.id}|${a.name}|agent-age`)%30;a.voice=a.gender==='F'?(a.age>=38?'MF':'YF'):(a.age>=38?'MM':'YM');repairPerson(a,{storePortrait:true});seen.add(lower(a.name));used.add(lower(a.name));if(old!==a.name)for(const report of state.v61?.reports||[])if(report.agentId===a.id)report.agentName=a.name}return agents}
 function repairCompanions(state){for(const c of state?.companions||[]){if(c?.img)c.img=resolveDisplayAsset(c.img);if(c?.portrait)c.portrait=resolveDisplayAsset(c.portrait);if(c?.v38Thrall||c?.id==='v38_nessa_cale'){c.name='Nessa Cale';c.gender='F';c.age=18;c.img='assets/v38/thrall/nessa_cale_companion.webp';c.portrait='assets/v38/thrall/nessa_cale_portrait.webp'}else if(c?.kael||c?.id==='kael_azure_tide'){c.name='Kael of the Azure Tide';c.gender='M';c.age??=43;c.img='assets/characters/kael_azure_tide.webp'}else if(c?.v26Thrall){let contact=state.v26?.crime?.contacts?.find(p=>p.name===c.name);if(contact){repairPerson(contact);c.gender=contact.gender;c.age=contact.age;c.img=contact.portrait}}}return state}
 function houseRace(house){return raceOf({house:house?.name,faction:house?.faction})}
 function syncNotables(state){let members=new Map();for(const house of state?.dynasties||[])for(const member of house.members||[])members.set(member.id,{member,house});for(const row of Object.values(state?.v61?.people||{})){let hit=members.get(row.id);if(!hit)continue;row.name=hit.member.name;row.gender=hit.member.gender;row.age=hit.member.age;row.race=houseRace(hit.house);row.portrait=lwMemberPortraitSafe(hit.member,hit.house)}}
 function collectRecords(state){let out=[],seen=new WeakSet(),add=(rows,context={})=>{for(const p of rows||[]){if(!p||typeof p!=='object'||seen.has(p)||!clean(p.name))continue;seen.add(p);out.push({p,context});if(Array.isArray(p.family))add(p.family,{...context,storePortrait:false,family:true})}};add(state?.player?[state.player]:[],{player:true});add(state?.people||[],{});add(state?.court?.prisoners||[],{prisoner:true});for(const house of state?.dynasties||[])add(house.members||[],{dynasty:true,race:houseRace(house),storePortrait:false});for(const rows of Object.values(state?.world?.permanentNPCs||{}))add(rows,{});for(const rows of Object.values(state?.world?.laborMarkets||{}))add(rows,{});for(const town of Object.values(state?.v15?.settlements||{}))add(town?.roster||[],{});for(const town of Object.values(state?.v17?.settlements||{}))add(town?.bonded||[],{});add(state?.v23?.surgeons||[],{});add(state?.v28?.laborPool||[],{});add(state?.v26?.crime?.contacts||[],{});add(state?.v61?.agents||[],{});return out}
 function repairAllRecords(state){if(!state)return state;for(const{p,context}of collectRecords(state))repairPerson(p,context);repairAgents(state);repairCompanions(state);syncNotables(state);return state}
 function repairLegacyMoraleState(state){let changed=0,stress=+state?.v41?.temperatureStress||0,here=clean(state?.world?.location);for(const p of state?.people||[]){let n=+p.morale;if(!Number.isFinite(n)||n<0||n>5)continue;if(p.stationRole==='Garrison training'||stress>4&&p.location===here){p.morale=Math.round(n*20);changed++}}runtime.moraleScaleRepairs+=changed;return changed}
 function repairState(state=typeof S!=='undefined'?S:null){
  if(!state||typeof state!=='object')return state;state.meta??={};let first=state.meta.v167IdentityWorld?.version!==VERSION,before={g:runtime.gendersCorrected,a:runtime.agesAssigned,n:runtime.namesCorrected,p:runtime.portraitsCorrected,r:runtime.roleArtRemoved,m:runtime.moraleScaleRepairs};repairLegacyMoraleState(state);nameStarterFootmen(state);coherentNameWorkers(state);repairAllRecords(state);let audit=auditState(state),delta={genders:runtime.gendersCorrected-before.g,ages:runtime.agesAssigned-before.a,names:runtime.namesCorrected-before.n,portraits:runtime.portraitsCorrected-before.p,roleArt:runtime.roleArtRemoved-before.r,moraleScale:runtime.moraleScaleRepairs-before.m},changed=first||Object.values(delta).some(Boolean);
  if(changed)state.meta.v167IdentityWorld={version:VERSION,policy:POLICY,day:+state.world?.day||0,taggedAssets:runtime.assetsTagged,recordsChecked:audit.records,portraitErrors:audit.invalidPortraits.length,identityErrors:audit.invalidGenders.length,displayAssetsRepaired:runtime.displayAssetsRepaired,savePreserved:true};
  runtime.lastMigration={first,changed,day:+state.world?.day||0,...delta};try{Object.defineProperty(state.meta,'v167Changed',{value:changed,writable:true,configurable:true,enumerable:false})}catch(_){state.meta.v167Changed=changed}return state
 }

 function lwMemberPortraitSafe(member,house=null){let race=house?houseRace(house):raceOf(member),context={dynasty:true,race},existing=clean(member?.portrait),valid=portraitValidity(member,existing,context);if(valid.ok&&catalog[existing]?.kind==='exact-person-portrait')return existing;let exact=exactIdentityArt(member);if(exact)return exact;return identityPortrait(member,context)}
 function genderLabel(p){return inferGender(p)==='F'?'Female':'Male'}
 function moraleLabel(value){let n=Number.isFinite(+value)?+value:0;return`${Math.round(n*10)/10}/100`}
 function stageLabel(p){return lifeStage(+p?.age||0,raceOf(p))}
 function peopleCardsV167(list){return`<div class="entityList">${(list||[]).map(p=>{repairPerson(p);let pic=p.portrait||identityPortrait(p);return`<div class="entity ${p.alive===false?'dead':''}" onclick="openPerson('${js(p.id)}')">${typeof entityImage==='function'?entityImage(pic,p.name):`<img src="${html(pic)}" alt="${html(p.name)}">`}<div><h4>${html(p.name)}</h4><p>${html(p.role)} · Rank: ${html(p.rank||'Civilian')}</p><p>${genderLabel(p)} · age ${Math.round(+p.age||0)} · ${html(stageLabel(p))}</p><p>HP ${Math.round(+p.hp||0)}/${Math.round(+p.maxHp||0)} · Morale ${moraleLabel(p.morale)} · Loyalty ${Math.round(+p.loyalty||0)}</p><p>Order: ${html(p.order)}</p></div></div>`}).join('')}</div>`}
 function repairPersonModal(p){let modal=typeof document==='undefined'?null:document.querySelector?.('#modalRoot .modal');if(!modal||typeof modal.innerHTML!=='string')return;let out=modal.innerHTML,gender=genderLabel(p),age=Math.round(+p.age||0),stage=stageLabel(p),morale=moraleLabel(p.morale);
  out=out.replace(/(<div>Gender<\/div><div>)(?:Female|Male)(<\/div>)/i,`$1${gender}$2`).replace(/(<div>Morale<\/div><div>)[^<]*(<\/div>)/i,`$1${morale}$2`).replace(/(<div>Morale \/ Loyalty<\/div><div>)[^<]*?( · [^<]*<\/div>)/i,`$1${morale}$2`).replace(/Morale (-?\d+(?:\.\d+)?)\/5/g,(_,n)=>`Morale ${moraleLabel(+n)}`);
  if(!/<div>Gender<\/div>/i.test(out))out=out.replace('<div class="kv">',`<div class="kv"><div>Gender</div><div>${gender}</div>`);if(!/<div>Age<\/div>/i.test(out))out=out.replace('<div class="kv">',`<div class="kv"><div>Age</div><div>${age}</div>`);if(!/data-v167-stage/.test(out))out=out.replace('<div class="kv">',`<div class="kv"><div data-v167-stage>Life stage</div><div>${html(stage)}</div>`);modal.innerHTML=out
 }
 function repairModalPortrait(p){let modal=typeof document==='undefined'?null:document.querySelector?.('#modalRoot .modal');if(!modal||typeof modal.innerHTML!=='string')return;repairPerson(p);let picture=p.portrait||identityPortrait(p);modal.innerHTML=modal.innerHTML.replace(/<img\b[^>]*>/gi,tag=>/\bclass=["'][^"']*\bbigPic\b[^"']*["']/i.test(tag)?tag.replace(/\bsrc=(["'])[^"']*\1/i,`src="${html(picture)}"`):tag)}
 function v17PleasureHouseV167(){let town=v15EnsureSettlement(S.world.location),workers=town.roster.filter(p=>p.role==='Courtesan'&&+p.age>=18&&!p.hired);repairRows(workers);for(const p of workers){p.householdName??=typeof v17HouseName==='function'?v17HouseName(p.id):'Independent household'}return`<p>Licensed adult pleasure workers keep their own names, identities, skills, wages, and consent. They may be spoken to or hired as traveling companions; they are never listed in the bonded market.</p>${workers.map(p=>`<div class="entity">${entityImage(p.portrait,p.name)}<div><b>${html(p.name)}</b><p>${genderLabel(p)} · age ${Math.round(p.age)} · ${html(p.householdName)} · hospitality ${(p.skills?.hospitality||0).toFixed(1)}%</p><button onclick="v15OpenCandidate('${js(p.id)}')">SPEAK / CONTRACT</button></div></div>`).join('')||'<p>No worker is accepting a contract tonight.</p>'}<button onclick="v15BrothelVisit()">PRIVATE EVENING</button>`}

 function auditState(state=typeof S!=='undefined'?S:null){
  let invalidPortraits=[],invalidGenders=[],missingAges=[],roleArt=[],missingAssets=[],rows=state?collectRecords(state):[];for(const{p,context}of rows){let gender=inferGender(p);if(p.gender!==gender)invalidGenders.push({id:p.id||null,name:p.name,stored:p.gender,expected:gender});if(!Number.isFinite(+p.age)||+p.age<0)missingAges.push({id:p.id||null,name:p.name});let path=context.storePortrait===false&&!p.portrait?identityPortrait(p,context):clean(p.portrait||p.img),valid=portraitValidity(p,path,context);if(!valid.ok)invalidPortraits.push({id:p.id||null,name:p.name,path,reason:valid.reason});if(valid.reason==='role-or-scene-art')roleArt.push({id:p.id||null,name:p.name,path});if(path&&!catalog[path]&&!/^(?:https?:|data:|blob:)/i.test(path))missingAssets.push({id:p.id||null,name:p.name,path})}
  let result={version:VERSION,policy:POLICY,taggedAssets:Object.keys(catalog).length,records:rows.length,invalidPortraits,invalidGenders,missingAges,roleArt,missingAssets};runtime.lastAudit=result;return result
 }

 function installCoreOverrides(){
  if(typeof entityImage==='function'){const base=entityImage;entityImage=function(src,...args){return base.call(this,resolveDisplayAsset(src),...args)}}
  if(typeof openModal==='function'){const base=openModal;openModal=function(content,...args){return base.call(this,rewriteDisplayAssets(content),...args)}}
  if(typeof pushStory==='function'){const base=pushStory;pushStory=function(...args){if(args.length>3)args[3]=resolveDisplayAsset(args[3]);if(args.length>4)args[4]=resolveDisplayAsset(args[4]);return base.apply(this,args)}}
  if(typeof v58MapArt==='function'){const base=v58MapArt;v58MapArt=function(...args){return resolveDisplayAsset(base.apply(this,args))}}
  if(typeof v48DistrictArt==='function'){const base=v48DistrictArt;v48DistrictArt=function(...args){return resolveDisplayAsset(base.apply(this,args))}}
  if(typeof v76Portrait==='function'){const base=v76Portrait;v76Portrait=function(...args){let result=base.apply(this,args);return result&&typeof result==='object'?{...result,src:resolveDisplayAsset(result.src)}:result}}
  if(typeof v38PdFigure==='function'){const base=v38PdFigure;v38PdFigure=function(...args){return rewriteDisplayAssets(base.apply(this,args))}}
  if(typeof v16PersonPortrait==='function'){const base=v16PersonPortrait;v16PersonPortrait=function(person,...args){if(!person)return base.call(this,person,...args);if(person.name==='Lady Alexus Dominus'||person.name==='Valkorion Dominus'||person.id==='valkorion')return resolveDisplayAsset(base.call(this,person,...args));repairPerson(person);return person.portrait||identityPortrait(person)}}
  if(typeof v16PersonEquipment==='function'){const base=v16PersonEquipment;v16PersonEquipment=function(id,...args){let p=S?.people?.find(row=>row.id===id);if(p)repairPerson(p);let out=base.call(this,id,...args);if(p)repairModalPortrait(p);return out}}
  if(typeof lwPortrait==='function')lwPortrait=function(gender,age,index=0){let p={id:`generic_${gender}_${age}_${index}`,name:`Generated ${gender}`,gender,age};return portraitSpec(p).path};
  if(typeof lwMemberPortrait==='function')lwMemberPortrait=function(member){let house=typeof S!=='undefined'?S?.dynasties?.find(h=>(h.members||[]).includes(member)):null;return lwMemberPortraitSafe(member,house)};
  if(typeof v10LocalFamilyPortrait==='function')v10LocalFamilyPortrait=function(member){runtime.familyPortraitsComputed++;return identityPortrait(member,{family:true,storePortrait:false})};
  if(typeof v10NameWorkers==='function')v10NameWorkers=function(state){return coherentNameWorkers(state)};
  if(typeof v17RepairNames==='function')v17RepairNames=function(state){repairRows(state?.people||[]);for(const town of Object.values(state?.v15?.settlements||{}))repairRows(town?.roster||[]);for(const p of state?.people||[]){p.householdName??=typeof v17HouseName==='function'?v17HouseName(p.familyId||p.id||p.name):`${clean(p.surname||p.name.split(/\s+/).pop())} Household`;p.familyDisplay=p.householdName}return state};
  if(typeof v17PleasureHouse==='function')v17PleasureHouse=v17PleasureHouseV167;
  if(typeof peopleCards==='function')peopleCards=peopleCardsV167;
  if(typeof openPerson==='function'){const base=openPerson;openPerson=function(id,...args){let p=S?.people?.find(row=>row.id===id);if(p)repairPerson(p);let out=base.call(this,id,...args);if(p){repairPerson(p);repairPersonModal(p)}return out}}
 }
 function installFactoryOverrides(){
  if(typeof v10BuildResidents==='function'){const base=v10BuildResidents;v10BuildResidents=function(...args){let rows=base.apply(this,args);return repairRows(rows)}}
  if(typeof v10UpgradeState==='function'){const base=v10UpgradeState;v10UpgradeState=function(state,...args){let out=base.call(this,state,...args);coherentNameWorkers(out);repairRows(out?.people||[]);for(const rows of Object.values(out?.world?.permanentNPCs||{}))repairRows(rows);return out}}
  if(typeof v14UpgradeState==='function'){const base=v14UpgradeState;v14UpgradeState=function(state,...args){let out=base.call(this,state,...args);for(const rows of Object.values(out?.world?.laborMarkets||{}))repairRows(rows);return out}}
  if(typeof v14LaborHere==='function'){const base=v14LaborHere;v14LaborHere=function(...args){return repairRows(base.apply(this,args))}}
  if(typeof v15MakeCandidate==='function'){const base=v15MakeCandidate;v15MakeCandidate=function(...args){return repairPerson(base.apply(this,args))}}
  if(typeof v15EnsureSettlement==='function'){const base=v15EnsureSettlement;v15EnsureSettlement=function(...args){let town=base.apply(this,args);repairRows(town?.roster||[]);return town}}
  if(typeof v15AllTalkTargets==='function'){const base=v15AllTalkTargets;v15AllTalkTargets=function(...args){return repairRows(base.apply(this,args))}}
  if(typeof v17BondedStock==='function'){const base=v17BondedStock;v17BondedStock=function(...args){return repairRows(base.apply(this,args))}}
  if(typeof v17Settlement==='function'){const base=v17Settlement;v17Settlement=function(...args){let town=base.apply(this,args);repairRows(town?.bonded||[]);return town}}
  if(typeof v23BaseState==='function'){const base=v23BaseState;v23BaseState=function(...args){let out=base.apply(this,args);repairRows(out?.surgeons||[]);return out}}
  if(typeof v23Upgrade==='function'){const base=v23Upgrade;v23Upgrade=function(...args){let out=base.apply(this,args);repairRows(S?.v23?.surgeons||[]);return out}}
  if(typeof v28SeedLabor==='function'){const base=v28SeedLabor;v28SeedLabor=function(state,...args){let out=base.call(this,state,...args);repairRows(state?.v28?.laborPool||[]);return out}}
  if(typeof v28Ensure==='function'){const base=v28Ensure;v28Ensure=function(state,...args){let out=base.call(this,state,...args);repairRows((state||S)?.v28?.laborPool||[]);return out}}
  if(typeof v34lLaborCandidate==='function'){const base=v34lLaborCandidate;v34lLaborCandidate=function(...args){return repairPerson(base.apply(this,args))}}
  if(typeof v34lEnsure==='function'){const base=v34lEnsure;v34lEnsure=function(state,...args){let out=base.call(this,state,...args);for(const rows of Object.values((state||S)?.world?.laborMarkets||{}))repairRows(rows);return out}}
  if(typeof v55Worker==='function'){const base=v55Worker;v55Worker=function(...args){return repairPerson(base.apply(this,args))}}
  if(typeof v55Ensure==='function'){const base=v55Ensure;v55Ensure=function(state,...args){let out=base.call(this,state,...args),save=state||S;repairRows(save?.people||[]);for(const rows of Object.values(save?.world?.permanentNPCs||{}))repairRows(rows);return out}}
  if(typeof v61Ensure==='function'){const base=v61Ensure;v61Ensure=function(state,...args){let out=base.call(this,state,...args),save=state||S;repairAgents(save);syncNotables(save);return out}}
  if(typeof v65Ensure==='function'){const base=v65Ensure;v65Ensure=function(state,...args){let out=base.call(this,state,...args),save=state||S;repairCompanions(save);return out}}
  if(typeof v67Ensure==='function'){const base=v67Ensure;v67Ensure=function(state,...args){let out=base.call(this,state,...args),save=state||S;if(save?.v67)save.v67.sampleBank='responsive-synthesis-v1.67.0';return out}}
  if(typeof v26Contacts==='function'){const base=v26Contacts;v26Contacts=function(...args){return repairRows(base.apply(this,args))}}
  if(typeof makePrisoner==='function'){const base=makePrisoner;makePrisoner=function(...args){return repairPerson(base.apply(this,args),{prisoner:true})}}
 }
 function installMutationOverrides(){
  if(typeof hireDriver==='function'){const base=hireDriver;hireDriver=function(...args){let before=new Set((S?.people||[]).map(p=>p.id)),out=base.apply(this,args);coherentNameWorkers(S);repairRows((S?.people||[]).filter(p=>!before.has(p.id)));return out}}
  if(typeof v11HireTradeManager==='function'){const base=v11HireTradeManager;v11HireTradeManager=function(...args){let before=new Set((S?.people||[]).map(p=>p.id)),out=base.apply(this,args),added=(S?.people||[]).filter(p=>!before.has(p.id));repairRows(added);for(const manager of Object.values(S?.trade?.managers||{})){let p=S.people.find(row=>row.id===manager.personId);if(p)manager.portrait=p.portrait}return out}}
  if(typeof v12AddHoldingWorkers==='function'){const base=v12AddHoldingWorkers;v12AddHoldingWorkers=function(...args){let before=new Set((S?.people||[]).map(p=>p.id)),out=base.apply(this,args);repairRows((S?.people||[]).filter(p=>!before.has(p.id)));return out}}
  if(typeof v13BringPlayerSpouse==='function'){const base=v13BringPlayerSpouse;v13BringPlayerSpouse=function(member,...args){let out=base.call(this,member,...args),p=S?.people?.find(row=>row.name===member?.name);if(p)repairPerson(p);return out}}
  if(typeof v15Hire==='function'){const base=v15Hire;v15Hire=function(id,...args){let out=base.call(this,id,...args);repairAllRecords(S);return out}}
  if(typeof v15Convert==='function'){const base=v15Convert;v15Convert=function(id,...args){let out=base.call(this,id,...args),p=S?.people?.find(row=>row.id===id);if(p)repairPerson(p);return out}}
  if(typeof v16Swear==='function'){const base=v16Swear;v16Swear=function(id,...args){let out=base.call(this,id,...args),p=S?.people?.find(row=>row.id===id);if(p)repairPerson(p);return out}}
  if(typeof v17BuyBonded==='function'){const base=v17BuyBonded;v17BuyBonded=function(id,...args){let out=base.call(this,id,...args),p=S?.people?.find(row=>row.id===id);if(p)repairPerson(p,{prisoner:false});return out}}
  if(typeof v21Recruit==='function'){const base=v21Recruit;v21Recruit=function(key,...args){let out=base.call(this,key,...args),id=S?.v21?.uniques?.[key]?.personId,p=S?.people?.find(row=>row.id===id);if(p)repairPerson(p);return out}}
  if(typeof v21IssuePerson==='function'){const base=v21IssuePerson;v21IssuePerson=function(person,...args){let out=base.call(this,person,...args);if(person)repairPerson(person);return out}}
  if(typeof v28Hire==='function'){const base=v28Hire;v28Hire=function(id,...args){let out=base.call(this,id,...args),p=S?.people?.find(row=>row.id===id);if(p)repairPerson(p);return out}}
  if(typeof v28HireGang==='function'){const base=v28HireGang;v28HireGang=function(...args){let before=new Set((S?.people||[]).map(p=>p.id)),out=base.apply(this,args);repairRows((S?.people||[]).filter(p=>!before.has(p.id)));return out}}
  if(typeof v35FHireCrew==='function'){const base=v35FHireCrew;v35FHireCrew=function(...args){let before=new Set((S?.people||[]).map(p=>p.id)),out=base.apply(this,args);repairRows((S?.people||[]).filter(p=>!before.has(p.id)));return out}}
  if(typeof v61RecruitAgent==='function'){const base=v61RecruitAgent;v61RecruitAgent=function(...args){let out=base.apply(this,args);repairAgents(S);return out}}
  if(typeof setFormationRole==='function'){const base=setFormationRole;setFormationRole=function(id,...args){let out=base.call(this,id,...args),p=S?.people?.find(row=>row.id===id);if(p)repairPerson(p);return out}}
  if(typeof setRank==='function'){const base=setRank;setRank=function(id,...args){let out=base.call(this,id,...args),p=S?.people?.find(row=>row.id===id);if(p)repairPerson(p);return out}}
 }
 function installStateHooks(){
  if(typeof makeStartState==='function'){const base=makeStartState;makeStartState=function(...args){return repairState(base.apply(this,args))}}
  if(typeof migrateState==='function'){const base=migrateState;migrateState=function(state,...args){let out=base.call(this,state,...args);return out?repairState(out):out}}
  if(typeof dailyTick==='function'){const base=dailyTick;dailyTick=function(...args){let out=base.apply(this,args);repairAllRecords(S);return out}}
  if(typeof render==='function'){const base=render;render=function(...args){if(typeof S!=='undefined'&&S)repairRows(S.people||[]);return base.apply(this,args)}}
 }
 function installMoraleIntegrity(){
  if(typeof v20RaiseMen==='function'){const base=v20RaiseMen;v20RaiseMen=function(...args){let rows=typeof v20Men==='function'?v20Men():[],before=new Map(rows.map(p=>[p,+p.morale||0])),gain=base.apply(this,args);for(const p of rows)if(before.has(p))p.morale=clamp(before.get(p)+(+gain||0),0,100);return gain}}
  if(typeof v51ResolveDuties==='function'){const base=v51ResolveDuties;v51ResolveDuties=function(...args){let rows=(S?.people||[]).filter(p=>p.stationRole==='Garrison training'),before=new Map(rows.map(p=>[p,{morale:+p.morale||0,days:+p.stationDays||0}])),out=base.apply(this,args);for(const p of rows){let old=before.get(p);if((+p.stationDays||0)>old.days)p.morale=clamp(old.morale+.6,0,100)}return out}}
  if(typeof advanceHours==='function'){const base=advanceHours;advanceHours=function(hours,...args){let here=clean(S?.world?.location),rows=(S?.people||[]).filter(p=>p.alive!==false&&p.location===here),before=new Map(rows.map(p=>[p,+p.morale||0])),out=base.call(this,hours,...args),stress=+S?.v41?.temperatureStress||0;if(stress>4)for(const p of rows){let old=before.get(p),now=+p.morale||0;if(old-now>10&&now<=5){p.morale=clamp(old-Math.max(0,+hours||0)*.2,0,100);runtime.moraleScaleRepairs++}}return out}}
 }
 function installStyles(){if(typeof document==='undefined'||document.getElementById?.('aetherion-v167-style'))return;let style=document.createElement('style');style.id='aetherion-v167-style';style.textContent='.entity [data-v167-identity]{color:#c9b9ad}.v167-identity{color:#c9b9ad;font-size:.92em}.dynastyPortrait,.entity img{object-position:center top}';document.head?.appendChild(style)}
 function installAssetRecovery(){if(typeof document==='undefined'||typeof document.addEventListener!=='function')return;document.addEventListener('error',event=>{let node=event?.target;if(!node||!['IMG','VIDEO','SOURCE'].includes(String(node.tagName||'').toUpperCase()))return;let raw=node.getAttribute?.('src')||node.currentSrc||node.src||'',match=clean(raw).match(/assets\/[^?#]+/),path=match?.[0]||clean(raw),next=resolveDisplayAsset(path);if(!next||next===path||node.dataset?.v167Recovered===next)return;if(node.dataset)node.dataset.v167Recovered=next;node.src=next;let media=String(node.tagName||'').toUpperCase()==='SOURCE'?node.parentElement:node;if(media&&typeof media.load==='function'){media.load();let playback=media.play?.();playback?.catch?.(()=>{})}},true)}
 function start(){repairDisplayAssets();installCoreOverrides();installFactoryOverrides();installMutationOverrides();installStateHooks();installMoraleIntegrity();installAudioIntegrity();installStyles();installAssetRecovery();let changed=false;try{if(typeof S!=='undefined'&&S?.world){repairState(S);if(S.v67)S.v67.sampleBank='responsive-synthesis-v1.67.0';changed=!!S.meta?.v167Changed}}catch(error){console.warn('[Aetherion 1.67.0 identity migration]',error)}if(changed&&typeof persist==='function')try{persist(false)}catch(error){console.warn('[Aetherion 1.67.0 save]',error)}}

 window.AetherionV167Integrity=Object.freeze({version:VERSION,policy:POLICY,runtime,portraitCatalog:Object.freeze(catalog),displayFallbacks:DISPLAY_FALLBACKS,assetTag:path=>catalog[path]||null,resolveDisplayAsset,rewriteDisplayAssets,repairDisplayAssets,synthesizedEffect,synthesizedInstrument,inferGender,raceOf,lifeStage,portraitSpec,portraitValidity,identityPortrait,repairPerson,repairRows,repairState,auditState,moraleLabel,genderLabel});
 start();
})();
