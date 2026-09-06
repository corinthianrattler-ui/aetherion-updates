/* Aetherion Reforged v1.65.0 — coherent regional shops, exact prices, and Kael recruitment repair. */
'use strict';
(()=>{
 const VERSION='1.65.0',POLICY='balanced-regional-v1.65.0',PAGE_SIZE=12;
 const TRUE_STUDY_CENTERS=Object.freeze(['Solaris','Corvinus Keep','Southport','White Harbor','Winterhold','Stonevein Halls','Greenhall','Lorien Ford']);
 const GIFT_IDS=Object.freeze([
  'wooden_practice_sword','cloth_doll','carved_toy_horse','painted_toy_knight',
  'black_rose_bouquet','embroidered_court_gloves','amber_rose_comb','silver_thorn_hairpin',
  'moonstone_locket','illuminated_prayer_book','spice_casket','jeweled_rose_brooch'
 ]);
 const ISSUED_IDS=Object.freeze([
  'svc_bascinet','svc_mail_standard','svc_arming_coat','svc_mail_hauberk','svc_spaulders','svc_gauntlets',
  'svc_sword_belt','svc_mail_chausses','svc_riding_boots','svc_wool_cloak','svc_arming_sword',
  'svc_kite_shield','svc_mercy_dagger','svc_signet_blank','foot_kettle','foot_gambeson','foot_mail',
  'foot_gloves','foot_belt','foot_hose','foot_boots','foot_cloak','foot_spear','foot_round','foot_dagger'
 ]);
 const ESSENTIALS=Object.freeze({
  books:['map_case','parchment','wax_seal'],
  apothecary:['bandage','herbs','clean_linen','healing_salve'],
  smith:['dagger','arrow','bolt','iron_ingot'],
  clothier:['linen_shirt','cloth','boots','cloak'],
  provisioner:['water','bread','hard_biscuit','salted_meat'],
  outfitter:['bedroll','rope','lantern','repair_kit']
 });
 const HUBS=new Set(['Solaris','Corvinus Keep','Southport','White Harbor']);
 const runtime={search:Object.create(null),page:Object.create(null),catalog:new Map(),pool:new Map(),repairedPeople:0,removedShopRows:0,removedMarketRows:0,removedGhostLocations:0,lastMigration:null};
 const authoredGear=new Set(ISSUED_IDS);

 function clean(value){return String(value??'').trim()}
 function lower(value){return clean(value).toLowerCase().replace(/[’']/g,"'").replace(/\s+/g,' ')}
 function html(value){return typeof esc==='function'?esc(clean(value)):clean(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
 function js(value){return clean(value).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}
 function bounded(value,min,max){value=Number.isFinite(+value)?+value:min;return Math.max(min,Math.min(max,value))}
 function hash(value){
  if(typeof v10Hash==='function')return Math.abs(v10Hash(String(value)))>>>0;
  let out=2166136261;for(const char of String(value)){out^=char.charCodeAt(0);out=Math.imul(out,16777619)}return out>>>0;
 }
 function money(copper){if(typeof v31Money==='function')return v31Money(copper);if(typeof v11Money==='function')return v11Money(copper);return`${Math.round(copper)}c`}
 function item(id){return typeof ITEMS!=='undefined'&&ITEMS?ITEMS[id]||null:null}
 function keys(){return typeof V51_MERCHANTS!=='undefined'&&V51_MERCHANTS?Object.keys(V51_MERCHANTS):['books','apothecary','smith','clothier','provisioner','outfitter']}
 function validLocation(name){return typeof LOC==='undefined'||!LOC?!!name:!!LOC[name]}
 function bookIds(){return typeof V23_BOOKS!=='undefined'&&V23_BOOKS?Object.values(V23_BOOKS).map(row=>row?.[0]).filter(Boolean):[]}
 function isRestoredBloodKeep(state){return!!(state?.events?.bloodKeepClaimed||state?.holdings?.['Blood Keep Ruins']||state?.holdings?.['Blood Keep'])}

 function collectGear(value){
  if(!value)return;
  if(typeof value==='string'){if(item(value))authoredGear.add(value);return}
  if(Array.isArray(value)){for(const row of value){if(Array.isArray(row)&&typeof row[0]==='string'&&item(row[0]))authoredGear.add(row[0]);else collectGear(row)}return}
  if(typeof value==='object')for(const child of Object.values(value))collectGear(child);
 }
 function collectAuthoredGear(){
  try{if(typeof V21_UNIQUE_GEAR!=='undefined')collectGear(V21_UNIQUE_GEAR)}catch(_){}
  try{if(typeof V23_KAEL_GEAR!=='undefined')collectGear(V23_KAEL_GEAR)}catch(_){}
  try{if(typeof V24_ALEXUS_GEAR!=='undefined')collectGear(V24_ALEXUS_GEAR)}catch(_){}
  try{if(typeof V35M_GEAR!=='undefined')collectGear(V35M_GEAR)}catch(_){}
  try{if(typeof V38_NESSA_GEAR!=='undefined')collectGear(V38_NESSA_GEAR)}catch(_){}
  try{if(typeof V41_GEAR!=='undefined')collectGear(V41_GEAR)}catch(_){}
  try{if(typeof V46_LIBITA_GEAR!=='undefined')collectGear(V46_LIBITA_GEAR)}catch(_){}
  try{if(typeof V46_LIBITA_TOOLS!=='undefined')collectGear(V46_LIBITA_TOOLS)}catch(_){}
 }
 function looksAuthored(d){
  if(!d)return false;
  const id=lower(d.id),quality=lower(d.quality),text=lower(`${d.name||''} ${d.purpose||''} ${d.desc||''} ${d.acquisition||''} ${d.tradeUse||''}`);
  return authoredGear.has(d.id)||d.shopAllowed===false||d.notForSale===true||!!d.uniqueOwner||!!d.bloodKeepOnly||
   /^(dominus_|alexus_|kael_|svc_|foot_|v41_|v43_|v46_|v62_)/.test(id)||/(^|_)dominus(_|$)/.test(id)||
   /heirloom|unique|legendary|relic|issued|personal|quest|sacred/.test(quality)||
   /belongs to (its|the) bearer|owned uniquely by|personal property|singular house|unique quest relic|crafted only at|cannot be bought, sold|never an ordinary market/.test(text);
 }
 function isCraftOnly(d){return!!d&&(looksAuthored(d)||['craft-only','commission-only','issued-only','owner-bound','house-heirloom','special-acquisition'].includes(clean(d.marketPolicy)))}
 function isOrdinaryExcluded(d){
  if(!d||!d.id||d.restricted||(+d.value||0)<=0||isCraftOnly(d))return true;
  const cat=lower(d.cat),id=lower(d.id),text=lower(`${d.name||''} ${d.quality||''}`);
  return /currency|coin|bullion|contraband|corpse|remains/.test(cat)||/human_flesh|human_meat|fallen_dead|prisoner|slave/.test(id)||/royal regalia|quest item/.test(text);
 }
 function markPolicies(){
  if(typeof ITEMS==='undefined'||!ITEMS)return;
  collectAuthoredGear();
  const wine=ITEMS.wine_skin;
  if(wine)Object.assign(wine,{cat:'drink',glyph:'◉',shopKey:'provisioner',cargoClass:'Provisions',shopAllowed:true,marketPolicy:'ordinary',giftFor:'kael_azure_tide',img:'assets/items/v25/medical/wine_skin.webp',purpose:'A sewn skin of decent table wine. It may be consumed or given to Kael of the Azure Tide as his preferred personal gift.',desc:'A sewn skin of decent table wine. It may be consumed or given to Kael of the Azure Tide as his preferred personal gift.',tradeClass:'provisions',tradeUse:'Sold by provisioners as an ordinary drink and used as Kael’s preferred gift.'});
  for(const id of GIFT_IDS){const d=item(id);if(d)Object.assign(d,{shopKey:'books',shopAllowed:true,marketPolicy:'ordinary',cargoClass:'Luxury & Trade',tradeClass:'court gift'})}
  for(const d of Object.values(ITEMS)){
   if(!d||d.marketPolicy==='ordinary'||!looksAuthored(d))continue;
   d.shopAllowed=false;
   if(d.bloodKeepOnly)d.marketPolicy='craft-only';
   else if(/^svc_|^foot_/.test(d.id)){d.marketPolicy='issued-only';d.acquisition='Crafted or commissioned through the retinue armory, then issued to its recorded bearer; never stocked by an ordinary shop.'}
   else if(d.uniqueOwner)d.marketPolicy='owner-bound';
   else if(/dominus/i.test(d.id)||/House Dominus/i.test(d.name||''))d.marketPolicy='house-heirloom';
   else d.marketPolicy='special-acquisition';
   d.tradeClass='restricted';d.tradeUse=d.acquisition||'Obtained only through its authored crafting, commissioning, issuance, quest, or companion path.';
  }
  runtime.pool.clear();runtime.catalog.clear();
 }
 function merchantExists(key){return keys().includes(key)}
 function shopForItem(d){
  if(isOrdinaryExcluded(d))return null;
  if(d.shopKey&&merchantExists(d.shopKey))return d.shopKey;
  const cat=lower(d.cat),text=lower(`${d.id||''} ${d.name||''} ${d.desc||''} ${d.purpose||''} ${d.tradeClass||''}`);
  if(/book|document|record|map|paper|gift|jewelry|luxury/.test(cat)||/ledger|parchment|vellum|quill|wax seal|prayer book/.test(text))return'books';
  if(/medical|medicine|alchemy|herb/.test(cat)||/salve|poultice|tincture|draught|antidote|suture|bandage/.test(text))return'apothecary';
  if(/weapon|armor|armour|shield|ammo|ammunition|military/.test(cat))return'smith';
  if(/metal|ore|fuel/.test(cat)||(/material/.test(cat)&&/iron|steel|ore|charcoal|nail|ring|buckle|chain|rivet/.test(text)))return'smith';
  if(/clothing|textile|household/.test(cat)||/cloth|thread|needle|dye|blanket|pillow|linen|wool|silk|tailor|soap|broom/.test(text))return'clothier';
  if(/food|drink|provision|spice|trade good|produce/.test(cat))return'provisioner';
  if(/camp|container|wagon|transport|animal|mount|tack|instrument|music|ship.?part|maritime|tool|material|workshop/.test(cat)||/bedroll|tent|rope|pulley|cargo net|saddle|bridle|wheel|axle|lantern|travel cage|chest|crate/.test(text))return'outfitter';
  return null;
 }
 function normalizeWorldDefinitions(){
  try{if(typeof V49_URBAN!=='undefined'&&Array.isArray(V49_URBAN)){let values=[],seen=new Set();for(let loc of V49_URBAN){if(loc==='Seals End')loc='Seal’s End';if(!validLocation(loc)||seen.has(loc))continue;seen.add(loc);values.push(loc)}V49_URBAN.splice(0,V49_URBAN.length,...values)}}catch(_){}
  try{if(typeof V23_CAPITALS!=='undefined'&&V23_CAPITALS?.clear){V23_CAPITALS.clear();for(const loc of TRUE_STUDY_CENTERS)if(validLocation(loc))V23_CAPITALS.add(loc)}}catch(_){}
  runtime.catalog.clear();
 }
 function shopLocations(state){
  let source=[];try{source=typeof V49_URBAN!=='undefined'&&Array.isArray(V49_URBAN)?V49_URBAN:[]}catch(_){}
  const out=[],seen=new Set();for(let loc of source){if(loc==='Seals End')loc='Seal’s End';if(!validLocation(loc)||seen.has(loc))continue;let type=typeof LOC!=='undefined'?LOC[loc]?.type:null;if(type==='ruin'&&!state?.holdings?.[loc])continue;seen.add(loc);out.push(loc)}
  if(isRestoredBloodKeep(state)&&validLocation('Blood Keep Ruins')&&!seen.has('Blood Keep Ruins'))out.push('Blood Keep Ruins');
  if(!out.length&&state?.world?.location&&validLocation(state.world.location))out.push(state.world.location);
  return out;
 }
 function commerceHere(state){return!!state?.world?.location&&shopLocations(state).includes(state.world.location)}
 function noShopDirectory(){return`<section class="panel"><h2>${html(S?.world?.location||'This site')} — Local Trade</h2><p>This road, ruin, or small site has no permanent six-shop merchant row. Travel to a recorded village, town, keep, port, or restored Blood Keep for specialist stock.</p>${typeof v36SettlementMap==='function'?`<button onclick="v36SettlementMap('${js(S.world.location)}')">VIEW LOCAL MAP</button>`:''}</section>`}
 function shopLimit(loc){let type=typeof LOC!=='undefined'?LOC[loc]?.type:'town';return HUBS.has(loc)?30:type==='keep'?26:type==='village'?14:type==='ruin'?24:20}
 function poolFor(key){
  if(runtime.pool.has(key))return runtime.pool.get(key);
  const pool=typeof ITEMS==='undefined'?[]:Object.values(ITEMS).filter(d=>shopForItem(d)===key).sort((a,b)=>hash(`pool|${key}|${a.id}`)-hash(`pool|${key}|${b.id}`)||a.id.localeCompare(b.id));
  runtime.pool.set(key,pool);return pool;
 }
 function regionScore(loc,d){
  let score=hash(`${loc}|${d.id}`)%1000000,region='';try{region=REGION_BY_LOC[loc]||''}catch(_){}
  try{if(typeof V11_REGION_GOODS!=='undefined'&&V11_REGION_GOODS?.[region]?.includes(d.id))score-=2000000}catch(_){}
  const text=lower(`${d.id} ${d.name}`);
  const words={Solara:/grain|wine|linen|court|honey/,Frostreach:/fish|fur|wool|winter|hide/,Ironspine:/iron|steel|stone|mail|forge/,'Eternal Glades':/herb|wood|bow|honey|fruit/,'Ash Wastes':/hide|leather|axe|spear|salt/,'Western Marches':/wood|stone|ore|rope|pitch/}[region];
  if(words?.test(text))score-=900000;if(/Harbor|Southport|Quay|Bay|Seal’s End/.test(loc)&&/fish|salt|rope|pitch|sail|naval|barrel/.test(text))score-=800000;return score;
 }
 function catalogIds(loc,key,state){
  const locations=shopLocations(state),cacheKey=`${locations.join('|')}::${isRestoredBloodKeep(state)}::${loc}::${key}`;
  if(runtime.catalog.has(cacheKey))return runtime.catalog.get(cacheKey).slice();
  const pool=poolFor(key),manuals=new Set(bookIds()),gifts=new Set(GIFT_IDS),ordinary=pool.filter(d=>!manuals.has(d.id)&&!gifts.has(d.id)),ordered=ordinary.slice().sort((a,b)=>hash(`distribution|${key}|${a.id}`)-hash(`distribution|${key}|${b.id}`)||a.id.localeCompare(b.id)),index=Math.max(0,locations.indexOf(loc)),assigned=ordered.filter((d,i)=>i%Math.max(1,locations.length)===index),result=[],seen=new Set();
  const add=id=>{const d=item(id);if(d&&shopForItem(d)===key&&!seen.has(id)){seen.add(id);result.push(id)}};
  if(key==='provisioner'&&loc==='Corvinus Keep'){add('wine_skin');add('wine')}
  if(key==='books'){
   if(loc==='Solaris'||loc==='Blood Keep Ruins'&&isRestoredBloodKeep(state))for(const id of GIFT_IDS)add(id);
   else{let count=typeof LOC!=='undefined'&&LOC[loc]?.type==='village'?1:3;for(const id of GIFT_IDS.slice().sort((a,b)=>hash(`${loc}|gift|${a}`)-hash(`${loc}|gift|${b}`)).slice(0,count))add(id)}
   if(TRUE_STUDY_CENTERS.includes(loc))for(const id of bookIds())add(id);
  }
  for(const d of assigned)add(d.id);
  for(const id of ESSENTIALS[key]||[])add(id);
  for(const d of pool.slice().sort((a,b)=>regionScore(loc,a)-regionScore(loc,b)||a.id.localeCompare(b.id))){if(manuals.has(d.id)&&!TRUE_STUDY_CENTERS.includes(loc))continue;add(d.id)}
  const final=result.slice(0,shopLimit(loc));runtime.catalog.set(cacheKey,final);return final.slice();
 }
 function seedRow(loc,key,id){let d=item(id),n=hash(`v165|${loc}|${key}|${id}`);return{itemId:id,qty:id==='wine_skin'&&loc==='Corvinus Keep'?5:1+n%6,condition:86+n%15,price:Math.max(1,Math.round((+d?.value||5)*(.9+(n%21)/100)))}}
 function sanitizeShop(shop,key,loc,state,options={}){
  shop=shop&&typeof shop==='object'?shop:{};loc=loc||shop.location||state?.world?.location||'Corvinus Keep';
  const desired=catalogIds(loc,key,state),limit=shopLimit(loc),byId=new Map(),old=Array.isArray(shop.stock)?shop.stock:[],buybacks=[];
  for(const raw of old){
   const d=item(raw?.itemId);if(!d||shopForItem(d)!==key)continue;
   let row=byId.get(d.id);if(!row){row={itemId:d.id,qty:Math.max(0,Math.floor(+raw.qty||0)),condition:Math.round(bounded(raw.condition,20,100)),price:Math.max(1,Math.round(+raw.price||+d.value||5))};if(raw.localBuyback){row.localBuyback=true;row.lastSoldDay=+raw.lastSoldDay||0}byId.set(d.id,row)}else row.qty=Math.max(row.qty,Math.max(0,Math.floor(+raw.qty||0)));
  }
  for(const row of byId.values())if(row.localBuyback&&row.qty>0&&!desired.includes(row.itemId))buybacks.push(row.itemId);
  buybacks.sort((a,b)=>(byId.get(b).lastSoldDay||0)-(byId.get(a).lastSoldDay||0)||a.localeCompare(b));
  const keepDesired=desired.slice(0,Math.max(0,limit-Math.min(2,buybacks.length))),selected=[...keepDesired,...buybacks.slice(0,2)],stock=[];
  for(const id of selected){let row=byId.get(id)||seedRow(loc,key,id);if(options.forceWine&&loc==='Corvinus Keep'&&key==='provisioner'&&id==='wine_skin'){row.qty=Math.max(5,+row.qty||0);row.condition=Math.max(92,+row.condition||0);row.price=Math.max(1,+item(id)?.value||20)}stock.push(row)}
  const priorIds=new Set(old.map(row=>row?.itemId).filter(Boolean)),nextIds=new Set(stock.map(row=>row.itemId));let removed=0;for(const id of priorIds)if(!nextIds.has(id))removed++;
  runtime.removedShopRows+=removed;shop.stock=stock;shop.key=key;shop.location=loc;shop.cashCopper=Math.round(bounded(shop.cashCopper,6000,60000));shop.lastRestockDay=Number.isFinite(+shop.lastRestockDay)?+shop.lastRestockDay:Math.floor(state?.world?.day||0);shop.catalogPolicy=POLICY;shop.purgedCount=Math.max(0,+shop.purgedCount||0)+removed;delete shop.purgedProtected;return shop;
 }
 function shopSeed(state,loc,key,options={}){
  if(!state||!merchantExists(key)||!validLocation(loc))return null;state.v70??={version:VERSION,shops:{},assignments:{},shopHistory:[],sortHistory:[],studied:{},lastRestockDay:-1};state.v70.shops??={};state.v70.shops[loc]??={};
  let shop=state.v70.shops[loc][key];if(!shop){let worker=(state.world?.permanentNPCs?.[loc]||[]).find(p=>p?.alive&&p.shopKey===key&&!p.ownedShopId)||null;shop={key,location:loc,cashCopper:18000+shopLimit(loc)*425,stock:[],workerId:worker?.id||null,lastRestockDay:Math.floor(state.world?.day||0)}}
  return state.v70.shops[loc][key]=sanitizeShop(shop,key,loc,state,options);
 }
 function mergeShopLocation(state,from,to){
  const shops=state?.v70?.shops;if(!shops?.[from])return false;shops[to]??={};for(const[key,source]of Object.entries(shops[from])){if(!shops[to][key])shops[to][key]=source;else{shops[to][key].cashCopper=Math.max(+shops[to][key].cashCopper||0,+source.cashCopper||0);shops[to][key].lastRestockDay=Math.max(+shops[to][key].lastRestockDay||0,+source.lastRestockDay||0)}}delete shops[from];runtime.removedGhostLocations++;return true;
 }
 function mergeRows(target,source){
  const out=Array.isArray(target)?target:[],seen=new Map(out.filter(row=>row?.itemId).map(row=>[row.itemId,row]));for(const row of Array.isArray(source)?source:[]){if(!row?.itemId)continue;let old=seen.get(row.itemId);if(old)old.qty=Math.max(+old.qty||0,+row.qty||0);else{out.push(row);seen.set(row.itemId,row)}}return out;
 }
 function renameWorldLocation(state){
  let changed=false;if(!state||typeof state!=='object')return changed;
  if(state.world?.location==='Seals End'){state.world.location='Seal’s End';changed=true}
  const maps=[state.market,state.world?.permanentNPCs,state.world?.settlements,state.v15?.settlements,state.v17?.settlements,state.v70?.shops];
  if(state.market?.['Seals End']){state.market['Seal’s End']=mergeRows(state.market['Seal’s End'],state.market['Seals End']);delete state.market['Seals End'];changed=true;runtime.removedGhostLocations++}
  if(state.world?.permanentNPCs?.['Seals End']){let rows=state.world.permanentNPCs['Seal’s End']||[],ids=new Set(rows.map(p=>p?.id));for(const p of state.world.permanentNPCs['Seals End'])if(!ids.has(p?.id)){if(p)p.location='Seal’s End';rows.push(p);ids.add(p?.id)}state.world.permanentNPCs['Seal’s End']=rows;delete state.world.permanentNPCs['Seals End'];changed=true;runtime.removedGhostLocations++}
  mergeShopLocation(state,'Seals End','Seal’s End');
  for(const map of maps.slice(2,5))if(map?.['Seals End']){if(!map['Seal’s End'])map['Seal’s End']=map['Seals End'];delete map['Seals End'];changed=true;runtime.removedGhostLocations++}
  const visit=value=>{if(!value||typeof value!=='object')return;for(const[k,v]of Object.entries(value)){if(v==='Seals End'){value[k]='Seal’s End';changed=true}else if(v&&typeof v==='object')visit(v)}};
  for(const value of [state.people,state.companions,state.wagons,state.mounts,state.v66?.shopVisits,state.v69?.counterHistory,state.v70?.shopHistory,state.v69?.activeCounter,state.v51?.merchant,state.v36?.settlementPositions])visit(value);
  return changed;
 }
 function ensureMarketRow(state,loc,id,qty=1){
  const d=item(id);if(!d||isOrdinaryExcluded(d))return null;state.market??={};state.market[loc]??=[];let row=state.market[loc].find(r=>r?.itemId===id);if(!row){let n=hash(`market|${loc}|${id}`);row={itemId:id,qty:Math.max(0,qty),price:Math.max(1,+d.value||5),targetQty:Math.max(2,qty),condition:86+n%15,flowRemainder:0,boughtByPlayer:0,soldByPlayer:0};state.market[loc].push(row)}return row;
 }
 function repairLegacyMarkets(state,first=false){
  if(!state||typeof state!=='object')return 0;renameWorldLocation(state);state.market??={};let removed=0,manuals=new Set(bookIds());
  for(const[loc,raw]of Object.entries(state.market)){
   if(!Array.isArray(raw)){state.market[loc]=[];removed++;continue}
   const cleanRows=[],seen=new Map();for(const row of raw){let d=item(row?.itemId);if(!d||isOrdinaryExcluded(d)||(manuals.has(d.id)&&!TRUE_STUDY_CENTERS.includes(loc))){removed++;continue}let prior=seen.get(d.id);if(prior){prior.qty=Math.max(+prior.qty||0,+row.qty||0);removed++;continue}row.qty=Math.max(0,Math.floor(+row.qty||0));row.price=Math.max(1,Math.round(+row.price||+d.value||5));seen.set(d.id,row);cleanRows.push(row)}state.market[loc]=cleanRows;
  }
  for(const loc of TRUE_STUDY_CENTERS)if(validLocation(loc))for(const id of bookIds()){let row=ensureMarketRow(state,loc,id,1);if(first&&row)row.qty=Math.max(1,+row.qty||0)}
  for(const loc of ['Solaris',...(isRestoredBloodKeep(state)?['Blood Keep Ruins']:[])])for(const id of GIFT_IDS){let row=ensureMarketRow(state,loc,id,2);if(first&&row)row.qty=Math.max(2,+row.qty||0)}
  let wine=ensureMarketRow(state,'Corvinus Keep','wine_skin',5);if(first&&wine){wine.qty=Math.max(5,+wine.qty||0);wine.price=Math.max(1,+item('wine_skin')?.value||20);wine.condition=Math.max(92,+wine.condition||0)}
  if(Array.isArray(state.v32?.quarantinedMarket)&&state.v32.quarantinedMarket.length>20)state.v32.quarantinedMarket=state.v32.quarantinedMarket.slice(-20);
  state.meta??={};state.meta.v165LegacyClean=VERSION;runtime.removedMarketRows+=removed;return removed;
 }
 function ensureShops(state,options={}){
  if(!state||typeof state!=='object')return null;state.v70??={};const defaults={version:VERSION,shops:{},assignments:{},shopHistory:[],sortHistory:[],studied:{},lastRestockDay:-1};for(const[k,v]of Object.entries(defaults))if(state.v70[k]===undefined)state.v70[k]=Array.isArray(v)?[]:typeof v==='object'?{}:v;
  state.v70.shops??={};mergeShopLocation(state,'Seals End','Seal’s End');const locations=shopLocations(state),signature=locations.join('|'),complete=state.v70.catalogPolicy===POLICY&&state.v70.catalogLocations===signature&&locations.every(loc=>keys().every(key=>state.v70.shops?.[loc]?.[key]));
  if(complete&&!options.forceWine){state.v70.version=VERSION;return state.v70}
  const allowed=new Set(locations);for(const loc of Object.keys(state.v70.shops))if(!allowed.has(loc)){delete state.v70.shops[loc];runtime.removedGhostLocations++}
  if(state.v69?.activeCounter&&!allowed.has(state.v69.activeCounter.location)){state.v69.activeCounter=null;if(state.v51)state.v51.merchant=null}
  for(const loc of allowed)for(const key of keys())shopSeed(state,loc,key,{forceWine:!!options.forceWine});
  state.v70.shopHistory=Array.isArray(state.v70.shopHistory)?state.v70.shopHistory.slice(-200):[];state.v70.sortHistory=Array.isArray(state.v70.sortHistory)?state.v70.sortHistory.slice(-120):[];state.v70.version=VERSION;state.v70.catalogPolicy=POLICY;state.v70.catalogLocations=signature;return state.v70;
 }
 function kaelCandidates(state){return(state?.people||[]).filter(p=>p&&(p.id==='kael_azure_tide'||p.customCompanion==='kael'||p.name==='Kael of the Azure Tide'))}
 function makeKael(state){
  let gear={};try{if(typeof v21BlankGear==='function')gear=v21BlankGear()}catch(_){}try{if(typeof V23_KAEL_GEAR!=='undefined')gear={...gear,...V23_KAEL_GEAR}}catch(_){}
  const extra={id:'kael_azure_tide',gender:'M',age:43,hp:148,maxHp:148,rank:'Unique Companion',wage:0,morale:82,loyalty:62,skills:{martial:10,swordsmanship:10,insight:7},voice:'MM',portrait:'assets/characters/kael_azure_tide.webp',location:state?.world?.location||'Corvinus Keep',order:'With Party',permanent:true,customCompanion:'kael',gear,fullSet:'Kael of the Azure Tide — Salt-Stained Panoply',issuedKit:'unique_kael',attack:30,armor:45,intoxicated:true};
  if(typeof mkPerson==='function')try{return mkPerson('Kael of the Azure Tide','Grandmaster Swordsman','Military',extra)}catch(_){}
  return{name:'Kael of the Azure Tide',role:'Grandmaster Swordsman',category:'Military',alive:true,...extra};
 }
 function mergeKaelPerson(keep,other){
  for(const key of ['hp','maxHp','morale','loyalty','attack','armor'])keep[key]=Math.max(+keep[key]||0,+other[key]||0);for(const[k,v]of Object.entries(other.skills||{}))keep.skills={...(keep.skills||{}),[k]:Math.max(+keep.skills?.[k]||0,+v||0)};keep.gear={...(other.gear||{}),...(keep.gear||{})};for(const[k,v]of Object.entries(other))if(keep[k]===undefined||keep[k]===null||keep[k]==='')keep[k]=v;
 }
 function repairKael(state){
  if(!state||typeof state!=='object')return null;let candidates=kaelCandidates(state),existingState=state.v23?.kael,recruited=!!existingState?.recruited||candidates.length>0||(state.companions||[]).some(c=>c?.kael||c?.name==='Kael of the Azure Tide');if(!recruited&&!existingState)return null;
  state.v23??={};state.v23.kael??={met:false,recruited:false,offered:true,drunkHours:0,trainingDay:-99,gifts:0};let k=state.v23.kael,person=candidates.find(p=>p.id==='kael_azure_tide'&&p.alive!==false)||candidates.find(p=>p.id==='kael_azure_tide')||candidates.find(p=>p.alive!==false)||candidates[0];
  if(recruited&&!person){person=makeKael(state);state.people??=[];state.people.push(person);runtime.repairedPeople++}
  if(person){for(const other of candidates)if(other!==person)mergeKaelPerson(person,other);state.people=(state.people||[]).filter(p=>!candidates.includes(p)||p===person);person.id='kael_azure_tide';person.name='Kael of the Azure Tide';person.customCompanion='kael';person.permanent=true;k.met=true;k.recruited=true;if(candidates.length>1)runtime.repairedPeople+=candidates.length-1}
  state.companions??=[];let companions=state.companions.filter(c=>c&&(c.kael||c.name==='Kael of the Azure Tide')),companion=companions.find(c=>c.kael&&c.alive!==false)||companions[0];if(person&&!companion){companion={name:person.name,species:'Human Companion',hp:person.hp,maxHp:person.maxHp,attack:person.intoxicated?26:30,soberAttack:30,armor:person.armor,loyalty:person.loyalty,alive:person.alive!==false,deployed:true,kael:true,img:person.portrait};state.companions.push(companion);runtime.repairedPeople++}
  if(companion&&person){for(const other of companions)if(other!==companion){for(const key of ['hp','maxHp','attack','soberAttack','armor','loyalty'])companion[key]=Math.max(+companion[key]||0,+other[key]||0)}state.companions=state.companions.filter(c=>!companions.includes(c)||c===companion);Object.assign(companion,{name:person.name,kael:true,img:person.portrait,alive:person.alive!==false});if(companions.length>1)runtime.repairedPeople+=companions.length-1}
  k.gifts=Math.max(0,+k.gifts||0);k.drunkHours=Math.max(0,+k.drunkHours||0);k.trainingDay=Number.isFinite(+k.trainingDay)?+k.trainingDay:-99;return person;
 }
 function compactHistories(state){
  if(Array.isArray(state?.v66?.shopVisits)&&state.v66.shopVisits.length>160)state.v66.shopVisits=state.v66.shopVisits.slice(-160);if(Array.isArray(state?.v69?.counterHistory)&&state.v69.counterHistory.length>100)state.v69.counterHistory=state.v69.counterHistory.slice(-100);
 }
 function repairState(state){
  if(!state||typeof state!=='object')return state;state.meta??={};const first=state.meta.v165WorldCleanup?.version!==VERSION;if(first){renameWorldLocation(state);repairLegacyMarkets(state,true)}ensureShops(state,{forceWine:first});repairKael(state);compactHistories(state);
  if(first)state.meta.v165WorldCleanup={version:VERSION,day:+state.world?.day||0,policy:POLICY,savePreserved:true};runtime.lastMigration={first,day:+state.world?.day||0,shopRowsRemoved:runtime.removedShopRows,marketRowsRemoved:runtime.removedMarketRows,ghostLocationsRemoved:runtime.removedGhostLocations};
  try{Object.defineProperty(state.meta,'v165Changed',{value:first,writable:true,configurable:true,enumerable:false})}catch(_){state.meta.v165Changed=first}return state;
 }
 function rowCopper(row){return Math.max(1,Math.round(Number.isFinite(+row?.priceCopper)?+row.priceCopper:(+row?.price||1)*10))}
 function destinationNames(){return typeof v11DestinationOptions==='function'?v11DestinationOptions().filter(name=>typeof S!=='undefined'&&S?.containers?.[name]):[]}
 function destination(){let names=destinationNames(),selected=typeof document!=='undefined'?document.getElementById?.('v70Dest')?.value:null,fallback=typeof v11ResolveDestination==='function'?v11ResolveDestination():names[0];return names.includes(selected)?selected:names.includes(fallback)?fallback:names[0]}
 function capacityText(name){let c=typeof S!=='undefined'?S?.containers?.[name]:null;if(!c)return'';try{return`${containerWeight(c).toFixed(1)}/${c.capacityKg} kg · ${containerSlots(c)}/${c.capacitySlots} slots`}catch(_){return`${c.capacityKg||0} kg`}}
 function selectHtml(){let names=destinationNames(),selected=typeof v11ResolveDestination==='function'?v11ResolveDestination():names[0];return`<label class="v165-destination">Pack purchases into <select id="v70Dest" onchange="if(typeof v11SetTradeDestination==='function')v11SetTradeDestination(this.value)">${names.map(name=>`<option value="${html(name)}" ${name===selected?'selected':''}>${html(name)} · ${html(capacityText(name))}</option>`).join('')}</select></label>`}
 function runtimeKey(key,view){let loc=typeof S!=='undefined'?S?.world?.location||'world':'world';return`${loc}|${key}|${view}`}
 function searchValue(key,view){return runtime.search[runtimeKey(key,view)]||''}
 function searchInput(key,value,view='buy'){runtime.search[runtimeKey(key,view)]=lower(value);runtime.page[runtimeKey(key,view)]=0;if(typeof render==='function')render()}
 function setPage(key,page,view='buy'){runtime.page[runtimeKey(key,view)]=Math.max(0,Math.floor(+page||0));if(typeof render==='function')render()}
 function pager(key,view,total){let id=runtimeKey(key,view),pages=Math.max(1,Math.ceil(total/PAGE_SIZE)),page=bounded(runtime.page[id]||0,0,pages-1);runtime.page[id]=page;if(pages<=1)return`<div class="marketCount">${total} matching entr${total===1?'y':'ies'}</div>`;return`<div class="marketCount v165-pager"><span>Showing ${page*PAGE_SIZE+1}–${Math.min(total,(page+1)*PAGE_SIZE)} of ${total}</span><span><button ${page<=0?'disabled':''} onclick="v165ShopPage('${key}',${page-1},'${view}')">← PREVIOUS</button><b>Page ${page+1} / ${pages}</b><button ${page>=pages-1?'disabled':''} onclick="v165ShopPage('${key}',${page+1},'${view}')">NEXT →</button></span></div>`}
 function searchable(d){return lower(`${d?.id||''} ${d?.name||''} ${d?.purpose||''} ${d?.desc||''} ${d?.cargoClass||''} ${d?.tradeClass||''}`)}
 function buyPanel(key){
  let shop=shopSeed(S,S.world.location,key),query=searchValue(key,'buy');
  let all=(shop?.stock||[]).filter(row=>row.qty>0&&(!query||searchable(item(row.itemId)).includes(query))).sort((a,b)=>a.itemId==='wine_skin'?-1:b.itemId==='wine_skin'?1:clean(item(a.itemId)?.name).localeCompare(clean(item(b.itemId)?.name)));
  let id=runtimeKey(key,'buy'),pages=Math.max(1,Math.ceil(all.length/PAGE_SIZE)),page=bounded(runtime.page[id]||0,0,pages-1);runtime.page[id]=page;let rows=all.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),controls=`<div class="v165-shop-controls"><input class="actionInput" value="${html(query)}" placeholder="Search this shop…" onchange="v165ShopSearch(this.value,'${key}','buy')"><span>${shop?.stock?.length||0} curated goods · regional finite stock</span></div>`;
  return selectHtml()+controls+pager(key,'buy',all.length)+`<div class="v70-stock">${rows.map(row=>{let d=item(row.itemId),featured=d?.id==='wine_skin';return`<article class="v70-row ${featured?'v165-featured':''}"><img src="${html(d?.img||'')}" alt="${html(d?.name)}"><div><h3>${html(d?.name)}</h3><p>${html(d?.purpose||d?.desc)}</p><div class="v70-cargo-tags"><span>${html(typeof v70CargoClass==='function'?v70CargoClass(d):d?.cargoClass||d?.cat)}</span><span>${+d?.weight||0} kg</span><span>${row.qty} in shop</span><span>${row.condition}% condition</span>${featured?'<span>KAEL’S PREFERRED GIFT</span>':''}</div></div><div class="v70-price"><b>${html(money(rowCopper(row)))}</b><input id="v70q_${html(d.id)}" type="number" min="1" max="${row.qty}" value="1"><button class="primary" onclick="v70Buy('${key}','${js(d.id)}')">BUY</button></div></article>`}).join('')||'<div class="detailNotice">No stocked goods match this search. Clear the search or wait for local restocking.</div>'}</div>${pager(key,'buy',all.length)}`;
 }
 function sellPanel(key){
  let query=searchValue(key,'sell'),all=(typeof v70OwnedRows==='function'?v70OwnedRows(key):[]).filter(row=>!query||searchable(item(row.id)).includes(query)).sort((a,b)=>clean(item(a.id)?.name).localeCompare(clean(item(b.id)?.name))),id=runtimeKey(key,'sell'),pages=Math.max(1,Math.ceil(all.length/PAGE_SIZE)),page=bounded(runtime.page[id]||0,0,pages-1);runtime.page[id]=page;let rows=all.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),controls=`<div class="v165-shop-controls"><input class="actionInput" value="${html(query)}" placeholder="Search goods to sell…" onchange="v165ShopSearch(this.value,'${key}','sell')"><span>Ordinary goods only · personal and issued gear excluded</span></div>`;
  return controls+pager(key,'sell',all.length)+`<div class="v70-stock">${rows.map(row=>{let d=item(row.id),offer=Math.max(1,Math.round((+d.value||2)*.55))*10;return`<article class="v70-row"><img src="${html(d.img||'')}" alt="${html(d.name)}"><div><h3>${html(d.name)}</h3><p>${html(d.purpose||d.desc)}</p><div class="v70-cargo-tags"><span>Owned ${row.qty}</span><span>${html(typeof v70CargoClass==='function'?v70CargoClass(d):d.cargoClass||d.cat)}</span></div></div><div class="v70-price"><b>${html(money(offer))} offered</b><input id="v70s_${html(d.id)}" type="number" min="1" max="${row.qty}" value="1"><button onclick="v70Sell('${key}','${js(d.id)}')">SELL</button></div></article>`}).join('')||'<div class="detailNotice">You carry no ordinary goods this specialist is licensed to buy.</div>'}</div>${pager(key,'sell',all.length)}`;
 }
 function buy(key,id){
  let shop=shopSeed(S,S.world.location,key),row=shop?.stock?.find(r=>r.itemId===id),d=item(id);if(!row||row.qty<1||shopForItem(d)!==key)return typeof toast==='function'?toast('That item is not on this shop’s shelf.'):false;let input=document.getElementById?.('v70q_'+id),qty=Math.floor(bounded(parseInt(input?.value||1),1,row.qty)),cost=rowCopper(row)*qty,dest=destination();if(typeof moneyCopper==='function'&&moneyCopper()<cost)return toast('Insufficient physical coin.');if(!dest||!S.containers?.[dest])return toast('Choose an accessible container for this purchase.');let stack=typeof mkStack==='function'?mkStack(id,qty,row.condition):{itemId:id,qty,condition:row.condition};if(typeof canAdd==='function'&&!canAdd(S.containers[dest],stack))return toast('The selected container cannot hold this purchase.');if(typeof payCopper==='function'&&!payCopper(cost))return toast('Insufficient accessible physical coin.');let added=typeof addItem==='function'?addItem(dest,id,qty,row.condition,{acquiredAt:`${V51_MERCHANTS[key]?.name||'Shop'}, ${S.world.location}`}):false;if(!added){if(typeof earnCopper==='function')earnCopper(cost);return toast('The purchase could not be packed; your coin was returned.')}row.qty-=qty;shop.cashCopper+=cost;S.v70.shopHistory.push({day:S.world.day,action:'buy',key,id,qty,cost,dest,location:S.world.location});S.v70.shopHistory=S.v70.shopHistory.slice(-200);if(typeof persist==='function')persist(false);if(typeof render==='function')render();return true;
 }
 function sell(key,id){
  let d=item(id),shop=shopSeed(S,S.world.location,key);if(shopForItem(d)!==key)return typeof toast==='function'?toast(`${V51_MERCHANTS[key]?.name||'This shop'} does not buy that class of goods.`):false;let owned=typeof countItem==='function'?countItem(id):0,input=document.getElementById?.('v70s_'+id),qty=Math.floor(bounded(parseInt(input?.value||1),1,Math.max(1,owned))),pay=Math.max(1,Math.round((+d.value||2)*.55))*10*qty;if(!owned||owned<qty)return toast('Those goods are not accessible.');if(shop.cashCopper<pay)return toast('The proprietor’s cashbox cannot cover that purchase.');if(typeof removeItem!=='function'||removeItem(id,qty)!==qty)return toast('The goods could not be removed from storage.');if(typeof earnCopper==='function')earnCopper(pay);shop.cashCopper-=pay;let row=shop.stock.find(r=>r.itemId===id);if(row)row.qty+=qty;else shop.stock.push({itemId:id,qty,condition:85,price:Math.max(1,+d.value||2),localBuyback:true,lastSoldDay:+S.world.day||0});sanitizeShop(shop,key,S.world.location,S);S.v70.shopHistory.push({day:S.world.day,action:'sell',key,id,qty,cost:pay,location:S.world.location});S.v70.shopHistory=S.v70.shopHistory.slice(-200);if(typeof persist==='function')persist(false);if(typeof render==='function')render();return true;
 }
 function seedLegacyCommerce(state){
  if(!state?.market)return;if(state.meta?.v165LegacyClean!==VERSION)repairLegacyMarkets(state,false);for(const loc of shopLocations(state)){state.market[loc]??=[];for(const key of keys()){let count=state.market[loc].filter(row=>shopForItem(item(row?.itemId))===key).length;if(count>=6)continue;for(const id of catalogIds(loc,key,state)){if(count>=6)break;if(state.market[loc].some(row=>row?.itemId===id))continue;ensureMarketRow(state,loc,id,1+hash(`legacy|${loc}|${id}`)%5);count++}}}
 }
 function seedLicensedBooks(state){if(!state)return;for(const loc of TRUE_STUDY_CENTERS)if(validLocation(loc))for(const id of bookIds())ensureMarketRow(state,loc,id,1)}
 function booksTab(){
  if(typeof v23Upgrade==='function')v23Upgrade();repairLegacyMarkets(S,false);let loc=S.world.location,inside=typeof v49Current!=='function'||v49Current()==='Bookseller',licensed=TRUE_STUDY_CENTERS.includes(loc),manuals=bookIds();if(!inside)return`<section class="panel"><h2>Bookseller & Study</h2><p>Enter the settlement’s Bookseller building to inspect its physical stock. Owned books remain yours and may be studied from inventory.</p><button onclick="v36SettlementMap('${js(loc)}')">OPEN SETTLEMENT MAP</button></section>`;
  if(!licensed){let owned=manuals.filter(id=>typeof countItem==='function'&&countItem(id)>0);return`<section class="panel"><h2>Booksellers & Study</h2><p>Local scribes sell ordinary records and gifts, but scarce practical masterworks are licensed through the realm’s study centers.</p><p class="muted">Study centers: ${TRUE_STUDY_CENTERS.map(html).join(', ')}</p>${owned.map(id=>{let skill=Object.entries(V23_BOOKS).find(([,row])=>row[0]===id)?.[0];return`<button onclick="v23ReadBook('${js(skill)}','${js(id)}')">STUDY OWNED ${html(item(id)?.name)}</button>`}).join('')}</section>`}
  let stock=S.market[loc]||[];return`<section class="panel"><h2>${html(loc)} Licensed Bookseller</h2><p>Prices below use the realm’s exact 10-copper silver standard. Books teach principles; practice is still required for mastery.</p><div class="grid2">${Object.entries(V23_BOOKS).map(([skill,[id,name]])=>{let row=stock.find(r=>r.itemId===id),owned=countItem(id),cost=row&&row.qty>0?(typeof v11QuoteMarket==='function'?v11QuoteMarket(loc,row,1,'buy').total:Math.max(1,+item(id)?.valueCopper||(+item(id)?.value||1)*10)):0;return`<div class="card"><b>${html(name)}</b><div>${html(skill)}: ${typeof v23Rank==='function'?v23Rank(v23Skill(skill)):v23Skill(skill)+'%'}</div><div>Stock ${row?.qty||0} · ${cost?html(money(cost)):'sold out'} · owned ${owned}</div>${row?.qty?`<button onclick="v23BuyBook('${js(id)}')">BUY</button>`:''}${owned?`<button onclick="v23ReadBook('${js(skill)}','${js(id)}')">STUDY 8 HOURS</button>`:''}</div>`}).join('')}</div></section>`;
 }
 function kaelWineInfo(){let shop=shopSeed(S,'Corvinus Keep','provisioner'),row=shop?.stock?.find(r=>r.itemId==='wine_skin');return{owned:typeof countItem==='function'?countItem('wine_skin'):0,stock:+row?.qty||0,price:row?rowCopper(row):0}}
 function openKaelWineShop(){if(S.world.location!=='Corvinus Keep')return typeof v19Block==='function'?v19Block('PROVISIONER IS IN CORVINUS',"Kael and the provisioner carrying his preferred Good Wine Skin are at Corvinus Keep."):false;runtime.search[runtimeKey('provisioner','buy')]='wine skin';runtime.page[runtimeKey('provisioner','buy')]=0;return typeof v69OpenCounter==='function'?v69OpenCounter('provisioner'):false}
 function kaelTab(){
  if(typeof v23Upgrade==='function')v23Upgrade();let person=repairKael(S),k=S.v23.kael,wine=kaelWineInfo(),here=S.world.location==='Corvinus Keep';return`<section class="panel"><h2>Kael of the Azure Tide</h2><div class="detailGrid">${typeof entityImage==='function'?entityImage('assets/characters/kael_azure_tide.webp','Kael of the Azure Tide','bigPic'):''}<div><h3>Grandmaster Swordsman · “The Drunkard Blade”</h3><p>Found near Corvinus Keep’s lower gate after crossing out of the Ash Wastes. Drink dulled the man, not the hands.</p><div>State: ${k.recruited?'Sworn companion':k.met?'Waiting on terms':'Rumored near the lower gate'}</div><div>Wine gifts: ${k.gifts} · intoxication: ${k.drunkHours>0?`${k.drunkHours}h — combat −12%`:'sober enough'}</div>${!k.met?'<button onclick="v23MeetKael()">FIND HIM AT THE LOWER GATE</button>':!k.recruited?'<button onclick="v23RecruitKael()">OFFER WINE & A PLACE</button>':'<button onclick="v23GiftKael()">GIFT WINE SKIN</button><button onclick="v23TrainKael()">TRAIN SWORDSMANSHIP</button>'}</div></div><div class="card v165-wine-card"><img src="${html(item('wine_skin')?.img||'')}" alt="Good Wine Skin"><div><b>Good Wine Skin</b><p>Owned and accessible: ${wine.owned} · Corvinus Provisioner stock: ${wine.stock} · ${wine.price?html(money(wine.price)):'sold out'}</p><button class="primary" ${here?'':'disabled'} onclick="v165OpenKaelWineShop()">${here?'OPEN CORVINUS PROVISIONER':'TRAVEL TO CORVINUS KEEP'}</button></div></div><h3>Unique Panoply</h3>${typeof entityImage==='function'?entityImage('assets/items/kael_gear_sheet.webp','Kael equipment','bigPic'):''}</section>`;
 }
 function installStyles(){if(typeof document==='undefined'||document.getElementById?.('aetherion-v165-world-style'))return;let style=document.createElement('style');style.id='aetherion-v165-world-style';style.textContent=`
  .v165-shop-controls{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:10px 0}.v165-shop-controls .actionInput{flex:1 1 260px}.v165-destination{display:grid;gap:6px;margin:8px 0}.v165-pager{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.v165-pager>span:last-child{display:flex;gap:7px;align-items:center}.v165-featured{border-color:#b89349!important;box-shadow:0 0 0 1px rgba(184,147,73,.35)}.v165-wine-card{display:grid;grid-template-columns:96px minmax(0,1fr);gap:12px;align-items:center}.v165-wine-card img{width:96px;height:96px;object-fit:cover;border-radius:8px}
  @media(max-width:640px){.v165-pager,.v165-pager>span:last-child{align-items:stretch}.v165-pager>span:last-child{width:100%;display:grid;grid-template-columns:1fr auto 1fr}.v165-wine-card{grid-template-columns:72px minmax(0,1fr)}.v165-wine-card img{width:72px;height:72px}}
 `;document.head?.appendChild(style)}
 function installHooks(){
  try{
   if(typeof v11PubliclyTradable==='function'){const base=v11PubliclyTradable;v11PubliclyTradable=function(d){return base(d)&&!isOrdinaryExcluded(d)}}
   if(typeof v70Protected==='function')v70Protected=isOrdinaryExcluded;
   if(typeof v70LegacyShop==='function')v70LegacyShop=shopForItem;
   if(typeof v70SanitizeShop==='function')v70SanitizeShop=function(shop,key){return sanitizeShop(shop,key,shop?.location,typeof S!=='undefined'?S:null)};
   if(typeof v70ShopSeed==='function')v70ShopSeed=function(state,loc,key){return shopSeed(state,loc,key)};
   if(typeof v70Ensure==='function')v70Ensure=function(state=typeof S!=='undefined'?S:null){return ensureShops(state)};
   if(typeof v70Shop==='function')v70Shop=function(key){return commerceHere(S)?shopSeed(S,S.world.location,key):null};
   if(typeof v70Destination==='function')v70Destination=destination;
   if(typeof v70Select==='function')v70Select=selectHtml;
   if(typeof v70BuyPanel==='function')v70BuyPanel=buyPanel;
   if(typeof v70SellPanel==='function')v70SellPanel=sellPanel;
   if(typeof v70Buy==='function')v70Buy=buy;
   if(typeof v70Sell==='function')v70Sell=sell;
   if(typeof v69StockCount==='function')v69StockCount=function(key){let shop=typeof S!=='undefined'&&S&&commerceHere(S)?shopSeed(S,S.world.location,key):null;return shop?.stock?.filter(row=>row.qty>0).length||0};
   if(typeof v69Directory==='function'){const base=v69Directory;v69Directory=function(...args){return commerceHere(S)?base.apply(this,args):noShopDirectory()}}
   if(typeof v69OpenCounter==='function'){const base=v69OpenCounter;v69OpenCounter=function(key,...args){if(!commerceHere(S))return typeof v19Block==='function'?v19Block('NO PERMANENT SHOP ROW','This site has no licensed specialist counter. Travel to a recorded settlement or restored keep.'):false;return base.call(this,key,...args)}}
   if(typeof v66GroupCandidates==='function')v66GroupCandidates=function(group){return typeof ITEMS==='undefined'?[]:Object.values(ITEMS).filter(d=>!isOrdinaryExcluded(d)&&(typeof v34TMarketGroup!=='function'||v34TMarketGroup(d)===group))};
   if(typeof v66SeedAllCommerce==='function')v66SeedAllCommerce=function(state=typeof S!=='undefined'?S:null){return seedLegacyCommerce(state)};
   if(typeof v51SeedBooks==='function')v51SeedBooks=function(state=typeof S!=='undefined'?S:null){return seedLicensedBooks(state)};
   if(typeof v23BooksTab==='function')v23BooksTab=booksTab;
   if(typeof v23KaelTab==='function')v23KaelTab=kaelTab;
   if(typeof v23RecruitKael==='function'){
    const base=v23RecruitKael;v23RecruitKael=function(){if(typeof v23Upgrade==='function')v23Upgrade();let person=repairKael(S),k=S.v23?.kael;if(person||k?.recruited){if(typeof toast==='function')toast('Kael is already a sworn companion.');if(typeof render==='function')render();return true}if(S.world.location!=='Corvinus Keep')return typeof v19Block==='function'?v19Block('WRONG LOCATION','Kael is waiting at Corvinus Keep’s lower gate.'):false;if(!k?.met)return typeof v19Block==='function'?v19Block('YOU HAVE NOT MET','Find Kael at the lower gate before offering him terms.'):false;if(typeof countItem==='function'&&countItem('wine_skin')<1)return typeof v19Block==='function'?v19Block('HE REFUSES','Buy a Good Wine Skin from the Corvinus Provisioner and bring it to him.'):false;let result=base();repairKael(S);if(typeof persist==='function')persist(false);return result===false?false:true};
   }
   if(typeof dailyTick==='function'){const base=dailyTick;dailyTick=function(...args){let result=base.apply(this,args);try{ensureShops(S);let day=Math.floor(+S.world?.day||0);if(S.v70.lastEssentialRestockDay!==day){let row=shopSeed(S,'Corvinus Keep','provisioner')?.stock?.find(r=>r.itemId==='wine_skin');if(row&&row.qty<5){row.qty++;row.condition=Math.max(90,+row.condition||0)}S.v70.lastEssentialRestockDay=day}}catch(error){console.warn('[Aetherion 1.65.0 restock]',error)}return result}}
   if(typeof makeStartState==='function'){const base=makeStartState;makeStartState=function(...args){return repairState(base.apply(this,args))}}
   if(typeof migrateState==='function'){const base=migrateState;migrateState=function(state,...args){let result=base.call(this,state,...args);return result?repairState(result):result}}
  }catch(error){console.warn('[Aetherion 1.65.0 hooks]',error)}
 }
 function start(){normalizeWorldDefinitions();markPolicies();installHooks();installStyles();let changed=false;try{if(typeof S!=='undefined'&&S?.world){repairState(S);changed=!!S.meta?.v165Changed}}catch(error){console.warn('[Aetherion 1.65.0 migration]',error)}if(changed&&typeof persist==='function')try{persist(false)}catch(error){console.warn('[Aetherion 1.65.0 save]',error)}}

 window.v165ShopSearch=(value,key,view='buy')=>searchInput(key,value,view);
 window.v165ShopPage=(key,page,view='buy')=>setPage(key,page,view);
 window.v165OpenKaelWineShop=openKaelWineShop;
 window.AetherionV165Cleanup=Object.freeze({version:VERSION,policy:POLICY,studyCenters:TRUE_STUDY_CENTERS,giftIds:GIFT_IDS,issuedIds:ISSUED_IDS,runtime,isCraftOnly,isOrdinaryExcluded,shopForItem,shopLocations,shopLimit,catalogIds,rowCopper,repairLegacyMarkets,ensureShops,repairKael,repairState,buyPanel,sellPanel,kaelTab});
 start();
})();
