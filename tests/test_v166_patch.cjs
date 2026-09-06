'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const patch = fs.readFileSync('patches/v1.66.0-living-world-balance.js', 'utf8');
const testConsole = Object.create(console);
testConsole.warn = () => {};
const context = { console: testConsole };
context.window = context;
vm.createContext(context);

vm.runInContext(`
 const V15_MALE=['Roderic','Bram','Edric','Halric','Orren'];
 const V15_FEMALE=['Nerys','Beatrix','Ysabet','Sabine','Alys'];
 const V10_LOCAL_M=['Marek','Tomas'];
 const V10_LOCAL_F=['Ellyn','Mara'];
 const ASSET={rose:'assets/rose.webp',valkorion:'assets/valkorion.webp'};
 const V61_ART={maevra:'assets/v61/intelligence/maevra_voss.webp'};
 const V51_MERCHANTS={provisioner:{name:'Corvinus Provisioner'}};
 const AETHERION_ASSETS=[
  'assets/items/trade_chest.webp','assets/items/smith_hammer.webp','assets/items/v25/medical/wine_skin.webp','assets/items/v25/medical/surgeon_kit.webp','assets/items/v25/medical/suture_kit.webp','assets/items/v25/medical/clean_linen.webp','assets/items/v25/medical/willow_tincture.webp','assets/items/v16/v16_medicine_1_yarrow_salve.webp','assets/items/v16/v16_medicine_1_fever_tonic.webp','assets/items/v16/v16_weapon_1_arming_sword.webp','assets/items/v16/v16_luxury_1_fine_book.webp','assets/items/v16/v16_luxury_1_spiced_wine.webp'
 ];
 const ITEMS={
  wine_skin:{id:'wine_skin',name:'Good Wine Skin',cat:'drink',value:20,shopKey:'provisioner',img:'assets/items/unique/wine_skin.webp',desc:'A sound wine suitable for the table or as a gift.'},
  practice_sword:{id:'practice_sword',name:'Practice Sword',cat:'weapon',value:8,slot:'main',desc:'A blunt training weapon.'},
  field_herb:{id:'field_herb',name:'Field Herb',cat:'material',value:2,desc:'A gathered medicinal herb.'},
  healing_draught:{id:'healing_draught',name:'Healing Draught',cat:'medical',value:12,use:'heal',desc:'A measured restorative draught.'},
  v70_field_manual:{id:'v70_field_manual',name:'Field Manual',cat:'book',value:16,desc:'Practical notes for a traveling household.'},
  v70_cleaning_roll:{id:'v70_cleaning_roll',name:'Cleaning Roll',cat:'tool',value:5,desc:'Cloth and oil for daily maintenance.'},
  sealed_relic:{id:'sealed_relic',name:'Sealed Relic',cat:'relic',value:500,restricted:true,acquisition:'Recovered only through its authored ruin encounter.',desc:'A warded relic.'},
  surgeon_kit:{id:'surgeon_kit',name:"Master Surgeon's Field Kit",cat:'medical',value:80,desc:'A fitted case of surgical instruments.'},
  arrow_forceps:{id:'arrow_forceps',name:'Long Arrow Forceps',cat:'medical',value:25,desc:'Long-jawed forceps.'},
  arrow_spoon:{id:'arrow_spoon',name:'Arrow Spoon',cat:'medical',value:22,desc:'A spoon for arrow extraction.'},
  suture_kit:{id:'suture_kit',name:'Suture Kit',cat:'medical',value:18,desc:'Needles and boiled thread.'},
  clean_linen:{id:'clean_linen',name:'Clean Linen',cat:'medical',value:8,desc:'Washed wound linen.'},
  honey_salve:{id:'honey_salve',name:'Honey Salve',cat:'medical',value:7,desc:'A wound salve.'},
  willow_tincture:{id:'willow_tincture',name:'Willow Tincture',cat:'medical',value:6,desc:'A pain tincture.'},
  poppy_milk:{id:'poppy_milk',name:'Poppy Milk',cat:'medical',value:10,desc:'A measured sedative.'},
  strong_wine:{id:'strong_wine',name:'Strong Wine',cat:'drink',value:9,desc:'Strong wine for cleaning and drinking.'}
 };
 const RECIPES={draught:{name:'Brew Healing Draught',needs:{field_herb:2},out:['healing_draught',1]}};
 let uidCounter=0,wallet=100000,lastCharge=0,persistCalls=0,renderCalls=0,lastModal='',notices=[],studied=[],used=[],logs=[];
 const inputs={};
 const document={
  head:{appendChild(){}},
  createElement(){return{id:'',textContent:''}},
  getElementById(id){return inputs[id]||null},
  querySelector(){return null},
  querySelectorAll(){return[]}
 };
 function deep(value){return JSON.parse(JSON.stringify(value))}
 function esc(value){return String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}
 function v10Hash(value){let out=0;for(const char of String(value))out=(Math.imul(out,31)+char.charCodeAt(0))>>>0;return out}
 function v15Hash(value){return v10Hash(value)}
 function v31Money(copper){copper=Math.round(copper);let s=Math.floor(copper/10),c=copper%10;return[s?s+'s':'',c?c+'c':''].filter(Boolean).join(' ')||'0c'}
 function itemDef(id){return ITEMS[id]}
 function itemUseLabel(use){return use==='heal'?'Drink to restore health':use}
 function entityImage(src,name,cls=''){return '<img class="'+cls+'" src="'+src+'" alt="'+name+'">'}
 function itemImage(d,cls=''){return entityImage(d?.img||'assets/item.webp',d?.name||'item',cls)}
 function countItem(id){return Object.values(S.containers||{}).reduce((sum,c)=>sum+(c.items||[]).filter(st=>st.itemId===id).reduce((n,st)=>n+(+st.qty||0),0),0)}
 function mkPerson(name,role,category,extra={}){return{id:'person_'+(++uidCounter),name,role,category,alive:true,skills:{},...extra}}
 function pushStory(speaker,text,voice=null,portrait=null){S.story.push({speaker,text,voice,portrait});return true}
 function log(type,text){logs.push({type,text})}
 function persist(){persistCalls++}
 function render(){renderCalls++}
 function toast(text){notices.push(text)}
 function openModal(html){lastModal=html}
 function closeModal(){}
 function showNotice(title,text){notices.push(title+': '+text)}
 function advanceHours(hours){S.world.hour+=hours;while(S.world.hour>=24){S.world.hour-=24;S.world.day++}}
 function payCopper(copper){lastCharge=copper;if(wallet<copper)return false;wallet-=copper;return true}
 function moneyCopper(){return wallet}
 function earnCopper(copper){wallet+=copper;return copper}
 function allAccessibleContainers(){return['Bag']}
 function mkStack(itemId,qty=1,condition=100){return{iid:'stack_'+(++uidCounter),itemId,qty,condition}}
 function canAdd(){return true}
 function addItem(name,itemId,qty=1,condition=100){S.containers[name].items.push(mkStack(itemId,qty,condition));return true}
 function removeItem(itemId,qty=1){let left=qty;for(const c of Object.values(S.containers||{}))for(let i=(c.items||[]).length-1;i>=0&&left>0;i--){let st=c.items[i];if(st.itemId!==itemId)continue;let take=Math.min(left,st.qty);st.qty-=take;left-=take;if(st.qty<=0)c.items.splice(i,1)}return qty-left}
 function v11DestinationOptions(){return['Bag']}
 function v11ResolveDestination(){return'Bag'}
 function containerWeight(){return 0}
 function containerSlots(c){return(c.items||[]).length}
 function v19Block(title,text){notices.push(title+': '+text);return false}
 function v23Rank(skill){return skill>=90?'Grandmaster':skill>=80?'Master':'Adept'}
 function v23OpenSurgery(){}
 function v23AutoTreat(){}
 function v61Office(){return true}
 function v61Rookery(){return true}
 function v61Network(){return true}

 function baseSurgeons(){return{
  wounds:[],
  surgeons:[
   {id:'surgeon_ysabet',name:'Mistress Ysabet Vale',gender:'F',age:58,location:'Solaris',skill:86,wage:48,hired:false,portrait:'assets/medical/surgeon_kit.webp'},
   {id:'surgeon_halric',name:'Master Halric Wren',gender:'M',age:67,location:'Southport',skill:91,wage:55,hired:false,portrait:'assets/medical/surgeon_kit.webp'}
  ]
 }}
 function wrongPeople(){return[
  {id:'v15_knight_nerys',name:'Ser Nerys Marr',title:'Ser',gender:'M',age:31,role:'Bannerless Knight',skills:{martial:82},wage:34,wageCopper:340,portrait:'assets/workers/knight.webp',alive:true,location:'Corvinus Keep'},
  {id:'v15_knight_roderic',name:'Dame Roderic Vale',title:'Dame',gender:'F',age:38,role:'Bannerless Knight',skills:{martial:89},wage:34,wageCopper:340,portrait:'assets/workers/knight.webp',alive:true,location:'Corvinus Keep'},
  {id:'v15_healer_bram',name:'Mistress Bram Holt',title:'Mistress',gender:'F',age:45,role:'Healer',skills:{medicine:77},wage:14,wageCopper:140,portrait:'assets/workers/healer.webp',alive:true,location:'Corvinus Keep'},
  {id:'v15_smith_beatrix',name:'Master Beatrix Vey',title:'Master',gender:'M',age:29,role:'Master Blacksmith',skills:{smithing:93},wage:18,wageCopper:180,portrait:'assets/workers/smith.webp',alive:true,location:'Corvinus Keep'},
  {id:'v43_libita_savitas',name:'Libita Savitas',gender:'F',age:25,role:'Companion Operative',skills:{espionage:92},wage:5,wageCopper:50,portrait:'assets/v43/libita/libita_savitas.jpg',alive:true,location:'Corvinus Keep'},
  {id:'v61_maevra_voss',name:'Maevra Voss',gender:'F',age:44,role:'Spymaster',rank:'Master of Whispers',skills:{spying:9.4},wage:12,wageCopper:120,portrait:'assets/v61/intelligence/maevra_voss.webp',alive:true,location:'Blood Keep Ruins'},
  {id:'captain',name:'Edric Marr',gender:'M',age:42,role:'Company Captain',skills:{command:92},wage:45,wageCopper:450,portrait:'assets/characters/captain.webp',alive:true,location:'Corvinus Keep'},
  {id:'family',name:'Alys Marr',gender:'F',age:33,role:'Family Steward',family:true,wage:8,wageCopper:80,portrait:'assets/characters/alys.webp',alive:true,location:'Corvinus Keep'},
  {id:'owned_factor',name:'Orren Vale',gender:'M',age:40,role:'Shop Factor',skills:{trade:8},wage:6,wageCopper:60,portrait:'assets/v50/jobs/owned_shop.webp',alive:true,location:'Corvinus Keep',ownedShopId:'shop_1',shopKey:'owned'}
 ]}
 function baseState(){let people=wrongPeople();return{
  meta:{},world:{day:45,hour:10,location:'Corvinus Keep',weather:{condition:'Clouded'},laborMarkets:{},permanentNPCs:{}},company:{morale:68},people,story:[],holdings:{'Blood Keep Ruins':{staff:{}}},containers:{Bag:{items:[]}},market:{'Corvinus Keep':[{itemId:'wine_skin',qty:2,price:20,condition:90}]},
  v15:{settlements:{'Corvinus Keep':{roster:people.slice(0,4)}},conversation:{targetId:null,lastSpeakerId:null,exchanges:Array.from({length:70},(_,i)=>({speaker:'Old '+i,text:'old'})),archives:Array.from({length:150},(_,i)=>({day:i}))}},
  v23:baseSurgeons(),v28:{laborPool:[]},v27:{shops:[{id:'shop_1',workerId:'owned_factor',weeklyWage:6,cash:100}]},
  v43:{libita:{intel:Array(180).fill({}),missions:Array(170).fill({})}},v46:{},v70:{shops:{'Corvinus Keep':{provisioner:{key:'provisioner',location:'Corvinus Keep',cashCopper:1000,stock:[{itemId:'wine_skin',qty:5,condition:93,price:20}]}}},shopHistory:[]},
  v55:{lastPayrollMonth:0,workerHistory:Array(300).fill({})},
  v61:{spymaster:{recruited:true,personId:'v61_maevra_voss',inventory:{ravenFeed:0,messageCapsules:0,cipherSheets:0,sealWax:0}},officeBuilt:true,rookeryBuilt:true,ravens:[],agents:[],history:Array(260).fill({}),reports:Array.from({length:270},(_,i)=>({status:i<4?'In Flight':'Delivered'}))},
  v45:{config:{enabled:false,maxTokens:160},memories:{}},trade:{managers:{}}
 }}
 let S=baseState();
 function makeStartState(){return baseState()}
 function migrateState(state){return state}
 function dailyTick(){S.world.day++}
 function v15AllTalkTargets(){return S.people.filter(p=>p.alive&&p.location===S.world.location)}
 function v15Candidate(id){return S.v15.settlements['Corvinus Keep'].roster.find(p=>p.id===id)||null}
 function v15SetTarget(id){let p=S.people.find(x=>x.id===id)||v15Candidate(id);if(!p)return;S.v15.conversation.targetId=id;S.v15.conversation.lastSpeakerId=id}
 function v15Target(){let c=S.v15.conversation,id=c.targetId||c.lastSpeakerId;return S.people.find(x=>x.id===id)||v15Candidate(id)||null}
 function v15ChooseSpeaker(){return false}
 function v15Response(p){pushStory(p.name,'old response')}
 function npcReactionToSpeech(text){let p=v15Target();if(p)v15Response(p,text)}
 function inputDock(){return '<footer><div class="conversationTarget"><button>old</button></div><div class="inputArea"><textarea id="playerInput"></textarea></div></footer>'}
 function submitPlayer(mode){let text=inputs.playerInput?.value?.trim();if(mode==='speak'&&text){pushStory('Valkorion Dominus',text);npcReactionToSpeech(text)}return true}
 function v45Ensure(state=S){state.v45??={};state.v45.config??={};state.v45.config.maxTokens=Math.min(160,Math.max(80,+state.v45.config.maxTokens||160));return state}
 function v45Prompt(){return[{role:'system',content:'Usually answer in 1–3 substantial conversational paragraphs.'},{role:'user',content:'question'}]}
 function v45GenerateReply(){return Promise.reject(new Error('test provider unavailable'))}
 function v31WageCopper(p){return p.wageCopper||0}
 function v31SetWage(p){return p.wageCopper||0}
 function v31ApplyWages(){return S}
 function v12UpgradeState(state){for(const p of state.people||[]){if(p.role==='Company Captain')p.wage=12;else if(p.role==='Footman')p.wage=2}return state}
 function v30WageFor(p){return p.wage||0}
 function v30Wages(){return S}
 function v15MakeCandidate(){return{id:'v15_future',name:'Ser Nerys Vey',title:'Ser',gender:'M',age:24,role:'Bannerless Knight',skills:{martial:80},wage:34,wageCopper:340,portrait:'assets/workers/knight.webp',alive:true,location:'Corvinus Keep'}}
 function v15EnsureSettlement(){return S.v15.settlements['Corvinus Keep']}
 function v15Hire(id){let p=v15Candidate(id);if(p&&!S.people.includes(p))S.people.push(p);if(id==='v43_libita_savitas'){let q=S.people.find(p=>p.id===id);if(q){q.wage=5;q.wageCopper=50;pushStory(q.name,'“Five silver each week. I will work.”')}}}
 function v23BaseState(){return baseSurgeons()}
 function v23Upgrade(){S.v23??=baseSurgeons();return S.v23}
 function v23MedicineTab(){return 'old medicine'}
 function v23HireSurgeon(){return false}
 function v43ApplyIdentity(p){p.wage=5;p.wageCopper=50;return p}
 function v43Ensure(state=S){let p=state.people.find(p=>p.id==='v43_libita_savitas');if(p){p.wage=5;p.wageCopper=50}return state.v43}
 function v43Panel(){return true}
 function v46Ensure(state=S){let p=state.people.find(p=>p.id==='v43_libita_savitas');if(p){p.wage=5;p.wageCopper=50}return state.v46}
 function v55Worker(){return S.people.find(p=>p.id==='owned_factor')}
 function v55OwnedWorker(){return S.people.find(p=>p.id==='owned_factor')}
 function v55Ensure(){return S.v55}
 function v55Payroll(){return false}
 function v16DoBuy(i){let m=S.market[S.world.location][i],cost=m.price*100;payCopper(cost);m.qty--;return true}
 function v61Ensure(){return S.v61}
 function v61ActiveSpymaster(){return S.people.find(p=>p.id===S.v61.spymaster.personId&&p.alive)||null}
 function v61HireSpymaster(){return false}
 function v61Build(){return false}
 function v61TrainRavens(){return false}
 function v61Restock(){return false}
 function v61RecruitAgent(){return false}
 function v70Shop(key){return S.v70.shops[S.world.location]?.[key]||null}
 function v70OwnedRows(key){let rows=[];for(const d of Object.values(ITEMS)){if(d.shopKey!==key)continue;let qty=countItem(d.id);if(qty)rows.push({id:d.id,qty})}return rows}
 function v70CargoClass(d){return d.cargoClass||d.cat}
 function v70BuyPanel(){return'old buy panel'}
 function v70SellPanel(){return'old sell panel'}
 function v70Buy(){return false}
 function v70Sell(){return false}
 function itemInfoRows(d){return '<div>Base value</div><div>'+d.value+' silver</div>'}
 function codexSection(k){let el=document.getElementById('codexView');if(el)el.innerHTML=k==='items'?'<div>old item prices</div>':'<div>other section</div>'}
 function findStack(iid){let map={book_iid:'v70_field_manual',tool_iid:'v70_cleaning_roll'};return map[iid]?{st:{itemId:map[iid]}}:null}
 function useItem(){return 'base use'}
 function v70Study(id){studied.push(id);return 'studied'}
 function v70Use(id){used.push(id);return 'used'}
 function nearbyPeople(){return true}
`, context, { filename: 'v166-base-runtime.js' });

vm.runInContext(`(0,eval)(${JSON.stringify(patch)})`, context, { filename: 'aetherion-updater-eval.js' });

const api = context.AetherionV166LivingWorld;
assert.equal(api.version, '1.66.0');
assert.equal(api.policy, 'living-world-v1.66.0');
assert.equal(api.maxWeeklyCopper, 30);

const repaired = vm.runInContext(`(() => ({
 meta:S.meta,
 people:S.people.map(p=>({id:p.id,name:p.name,title:p.title,gender:p.gender,wage:p.wage,wageCopper:p.wageCopper,portrait:p.portrait})),
 surgeons:S.v23.surgeons,
 shop:S.v27.shops[0],
 pricePolicy:S.v70.pricePolicy,
 lengths:{exchanges:S.v15.conversation.exchanges.length,archives:S.v15.conversation.archives.length,workerHistory:S.v55.workerHistory.length,intel:S.v43.libita.intel.length,missions:S.v43.libita.missions.length,history:S.v61.history.length,reports:S.v61.reports.length},
  items:Object.values(ITEMS).map(d=>({id:d.id,use:d.use,routes:d.gameplayRoutes,purpose:d.gameplayPurpose,img:d.img,imagePolicy:d.imagePolicy})),
 persistCalls
}))()`, context);

assert.equal(repaired.meta.v166LivingWorld.version, '1.66.0');
assert.equal(repaired.meta.v166LivingWorld.savePreserved, true);
assert.equal(repaired.pricePolicy, 'copper-value-v1.66.0');
assert.equal(repaired.persistCalls, 1, 'the save-safe migration persists once');
assert.equal(Math.max(...repaired.people.map(p => p.wageCopper)), 30);
assert.equal(repaired.people.find(p => p.id === 'family').wageCopper, 0);
assert.equal(repaired.people.find(p => p.id === 'v43_libita_savitas').wageCopper, 30);
assert.equal(repaired.people.find(p => p.id === 'v61_maevra_voss').wageCopper, 30);
assert.equal(repaired.people.find(p => p.id === 'owned_factor').wageCopper, 12);
assert.equal(repaired.shop.weeklyWage, 1.2);

const rerenderedWages = vm.runInContext(`(() => {
 v12UpgradeState(S);
 return S.people.filter(p=>p.id==='captain'||p.id==='v15_knight_nerys').map(p=>({id:p.id,wage:p.wage,wageCopper:p.wageCopper}));
})()`, context);
assert(rerenderedWages.every(row => row.wageCopper <= 30 && row.wage === row.wageCopper / 10), 'the recurring world upgrader must not restore legacy silver wages');

for (const [id, name, gender, portraitPart] of [
 ['v15_knight_nerys','Dame Nerys Marr','F','female_adult_'],
 ['v15_knight_roderic','Ser Roderic Vale','M','male_adult_'],
 ['v15_healer_bram','Master Bram Holt','M','male_adult_'],
 ['v15_smith_beatrix','Mistress Beatrix Vey','F','female_adult_']
]) {
 const row = repaired.people.find(p => p.id === id);
 assert.equal(row.name, name);
 assert.equal(row.gender, gender);
 assert.match(row.portrait, new RegExp(portraitPart));
}
assert.equal(repaired.surgeons[0].wageCopper, 28);
assert.equal(repaired.surgeons[1].wageCopper, 30);
assert.equal(repaired.surgeons[0].portrait, 'assets/v29/portraits/surgeon_ysabet.webp');
assert.equal(repaired.surgeons[1].portrait, 'assets/v29/portraits/surgeon_halric.webp');
assert.equal(JSON.stringify(repaired.lengths), JSON.stringify({ exchanges:40, archives:120, workerHistory:240, intel:120, missions:120, history:200, reports:250 }));

for (const item of repaired.items) {
 assert(Array.isArray(item.routes) && item.routes.length, item.id + ' needs a gameplay route');
 assert(item.purpose, item.id + ' needs a visible gameplay purpose');
 assert(vm.runInContext('AETHERION_ASSETS', context).includes(item.img), item.id + ' needs a packaged image');
}
assert.equal(repaired.items.find(d => d.id === 'wine_skin').img, 'assets/items/v25/medical/wine_skin.webp');
assert.equal(repaired.items.find(d => d.id === 'wine_skin').imagePolicy, 'packaged-reuse-v1.66.0');
assert.equal(repaired.items.find(d => d.id === 'wine_skin').use, 'drink');
assert(repaired.items.find(d => d.id === 'wine_skin').routes.some(route => route.startsWith('Direct use:')));
assert(api.runtime.itemImagesRepaired > 0);
assert.match(repaired.items.find(d => d.id === 'field_herb').routes.join(' '), /Craft input/);
assert.match(repaired.items.find(d => d.id === 'healing_draught').routes.join(' '), /Craft output/);
assert.equal(repaired.items.find(d => d.id === 'v70_field_manual').use, 'v166_study');
assert.equal(repaired.items.find(d => d.id === 'v70_cleaning_roll').use, 'v166_use');

const itemActions = vm.runInContext(`(() => {
 inputs.codexView={innerHTML:''};
 codexSection('items');
 return{
 study:useItem('book_iid'),
 use:useItem('tool_iid'),
 studied:[...studied],
 used:[...used],
 info:itemInfoRows(ITEMS.field_herb),
 codex:inputs.codexView.innerHTML
 };
})()`, context);
assert.equal(itemActions.study, 'studied');
assert.equal(itemActions.use, 'used');
assert.deepEqual(Array.from(itemActions.studied), ['v70_field_manual']);
assert.deepEqual(Array.from(itemActions.used), ['v70_cleaning_roll']);
assert.match(itemActions.info, /Gameplay routes/);
assert.match(itemActions.info, /Base value<\/div><div>2c/);
assert.doesNotMatch(itemActions.info, /2 silver/);
assert.match(itemActions.codex, /Good Wine Skin[\s\S]*?6c/);
assert.doesNotMatch(itemActions.codex, /20s/);

const specialistTrade = vm.runInContext(`(() => {
 S.world.location='Corvinus Keep';wallet=100000;lastCharge=0;inputs.v70Dest={value:'Bag'};inputs.v70q_wine_skin={value:'1'};inputs.v70s_wine_skin={value:'1'};
 let row=S.v70.shops['Corvinus Keep'].provisioner.stock[0],before=row.qty,panel=v70BuyPanel('provisioner'),bought=v70Buy('provisioner','wine_skin'),buyCharge=lastCharge,afterBuy=row.qty,walletBeforeSale=wallet,sold=v70Sell('provisioner','wine_skin');
 return{panel,bought,buyCharge,afterBuy:before-afterBuy,sold,saleCredit:wallet-walletBeforeSale,stockRestored:row.qty===before,owned:countItem('wine_skin')};
})()`, context);
assert.match(specialistTrade.panel, /6c/);
assert.equal(JSON.stringify({...specialistTrade,panel:undefined}), JSON.stringify({bought:true,buyCharge:6,afterBuy:1,sold:true,saleCredit:3,stockRestored:true,owned:0,panel:undefined}));

const future = vm.runInContext('v15MakeCandidate()', context);
assert.equal(future.name, 'Dame Nerys Vey');
assert.equal(future.gender, 'F');
assert(future.wageCopper <= 30);
assert.match(future.portrait, /female_young_/);

const group = vm.runInContext(`(() => {
 S.world.location='Corvinus Keep';
 S.story=[];
 v166SetGroup();
 let dock=inputDock();
 v166GroupDiscuss('What do you think of our supplies and the road ahead?');
 return{mode:S.v15.conversation.mode,dock,story:S.story,runtime:AetherionV166LivingWorld.runtime.groupTurns};
})()`, context);
assert.equal(group.mode, 'group');
assert.match(group.dock, /Speaking to everyone nearby/);
assert.equal(group.runtime, 1);
assert(group.story.some(row => row.speaker === 'Narrator'));
assert(new Set(group.story.filter(row => row.speaker !== 'Narrator').map(row => row.speaker)).size >= 3, 'a group exchange must include several distinct nearby people');
assert(group.story.filter(row => row.speaker !== 'Narrator').every(row => row.text.length > 180), 'group answers should be substantive');

const privateTalk = vm.runInContext(`(() => {
 S.story=[];
 v166SetPrivate('v15_healer_bram');
 npcReactionToSpeech('What do you need to treat a wounded man?');
 return{mode:S.v15.conversation.mode,target:S.v15.conversation.targetId,story:S.story};
})()`, context);
assert.equal(privateTalk.mode, 'private');
assert.equal(privateTalk.target, 'v15_healer_bram');
assert.equal(privateTalk.story.at(-1).speaker, 'Master Bram Holt');
assert.match(privateTalk.story.at(-1).text, /clean water|washed linen|instruments/i);
assert(privateTalk.story.at(-1).text.length > 180);

const language = vm.runInContext(`(() => {
 let state=v45Ensure(S),prompt=v45Prompt({name:'Master Bram Holt'},'question');
 S.story=[];
 pushStory('Narrator','The company departs.');
 pushStory('Libita Savitas','“Five silver each week. I will work.”');
 return{tokens:state.v45.config.maxTokens,prompt:prompt[0].content,narrator:S.story[0].text,libita:S.story[1].text};
})()`, context);
assert.equal(language.tokens, 220);
assert.match(language.prompt, /grounded medieval language/);
assert.match(language.prompt, /2–4 substantial conversational paragraphs/);
assert(language.narrator.length > 190);
assert.match(language.narrator, /\n\n/);
assert.doesNotMatch(language.libita, /Five silver/);
assert.match(language.libita, /Three silver/);

const medical = vm.runInContext(`(() => {
 S.world.location='Solaris';S.story=[];
 let html=v23MedicineTab();
 let before=S.people.filter(p=>p.id==='surgeon_ysabet').length;
 v23HireSurgeon('surgeon_ysabet');
 let hired=S.people.find(p=>p.id==='surgeon_ysabet');
 return{html,before,hired,story:S.story};
})()`, context);
assert.match(medical.html, /2s 8c\/week/);
assert.match(medical.html, /3s\/week/);
assert.equal(medical.before, 0);
assert.equal(medical.hired.wageCopper, 28);
assert.match(medical.story.at(-1).text, /clean linen/);

const intelligenceCosts = vm.runInContext(`(() => {
 const result={};
 S.world.location='Blood Keep Ruins';S.holdings['Blood Keep Ruins']={staff:{}};
 S.v61={spymaster:{recruited:false,personId:null,inventory:{ravenFeed:0,messageCapsules:0,cipherSheets:0,sealWax:0}},officeBuilt:false,rookeryBuilt:false,ravens:[],agents:[],history:[],reports:[]};
 v61Build('office');result.office=lastCharge;
 v61Build('rookery');result.rookery=lastCharge;
 v61HireSpymaster();result.spymaster=lastCharge;result.wage=S.people.find(p=>p.id==='v61_maevra_voss').wageCopper;
 v61TrainRavens();result.ravens=lastCharge;
 v61Restock();result.restock=lastCharge;
 v61RecruitAgent();result.agent=lastCharge;
 return result;
})()`, context);
assert.equal(JSON.stringify(intelligenceCosts), JSON.stringify({ office:2200, rookery:1400, spymaster:1800, wage:30, ravens:240, restock:180, agent:450 }));

const legacyPurchase = vm.runInContext(`(() => {
 S.world.location='Corvinus Keep';S.containers.Bag.items=[];inputs.v16Qty={value:'1'};lastCharge=0;
 let before=S.market['Corvinus Keep'][0].qty,result=v16DoBuy(0);
 return{result,charge:lastCharge,stockUsed:before-S.market['Corvinus Keep'][0].qty,received:S.containers.Bag.items.filter(row=>row.itemId==='wine_skin').length};
})()`, context);
assert.equal(JSON.stringify(legacyPurchase), JSON.stringify({ result:true, charge:6, stockUsed:1, received:1 }), 'the legacy market must use the canonical copper value');

vm.runInContext(`(() => {
 let libita=S.people.find(p=>p.id==='v43_libita_savitas');
 libita.wage=5;libita.wageCopper=50;
 v15Hire('v43_libita_savitas');
})()`, context);
assert.equal(vm.runInContext("S.people.find(p=>p.id==='v43_libita_savitas').wageCopper", context), 30, 'late Libita hire code must not restore the old five-silver wage');

vm.runInContext(`v45GenerateReply(S.people.find(p=>p.id==='v15_healer_bram'),'What does the wounded man need?')`, context).then(reply => {
 assert.match(reply, /clean water|washed linen|instruments/i);
 assert.equal(api.runtime.awarenessFallbacks, 1);
 assert(vm.runInContext(`notices.some(text => /grounded character reply/.test(text))`, context));
 console.log('v1.66.0 living-world balance patch: all assertions passed');
}).catch(error => {
 console.error(error);
 process.exitCode = 1;
});
