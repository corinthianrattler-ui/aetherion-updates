'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const patch=fs.readFileSync('patches/v1.65.0-world-economy-cleanup.js','utf8');
const context={console};
context.window=context;
vm.createContext(context);

vm.runInContext(`
 const LOC={
  'Corvinus Keep':{type:'keep'},Solaris:{type:'keep'},Southport:{type:'town'},'White Harbor':{type:'town'},
  Winterhold:{type:'keep'},'Stonevein Halls':{type:'keep'},Greenhall:{type:'keep'},'Lorien Ford':{type:'town'},
  Smallford:{type:'village'},'Seal’s End':{type:'village'},'Caer Dunlain':{type:'ruin'},'Blood Keep Ruins':{type:'ruin'}
 };
 const REGION_BY_LOC={'Corvinus Keep':'Solara',Solaris:'Solara',Southport:'Solara','White Harbor':'Solara',Winterhold:'Frostreach','Stonevein Halls':'Ironspine',Greenhall:'Eternal Glades','Lorien Ford':'Eternal Glades',Smallford:'Solara','Seal’s End':'Frostreach'};
 const V49_URBAN=['Corvinus Keep','Solaris','Southport','White Harbor','Winterhold','Stonevein Halls','Greenhall','Lorien Ford','Smallford','Seals End','Caer Dunlain'];
 const V23_CAPITALS=new Set(['Solaris','Frostreach','Stonehall']);
 const V23_BOOKS={swordsmanship:['book_tideblade','The Measured Edge'],medicine:['book_physick','Common Physick'],trade:['book_trade','Honest Fraud']};
 const V23_KAEL_GEAR={head:'kael_tide_helm',main:'kael_lightdrinker'};
 const V21_UNIQUE_GEAR={wanderer:{head:'wanderer_unique_helm'}};
 const V24_ALEXUS_GEAR={body:'alexus_dominus_gown'};
 const V35M_GEAR={saddle:'moondancer_pearl_saddle'};
 const V38_NESSA_GEAR={cloak:'v38_nessa_wool_cloak'};
 const V41_GEAR=[['v41_royal_helm']];
 const V46_LIBITA_GEAR=[['v46_crimson_gown']];
 const V46_LIBITA_TOOLS=[['v46_razor_fan']];
 const V11_REGION_GOODS={Solara:['wine','grain'],Frostreach:['wool'],Ironspine:['iron_ingot'],'Eternal Glades':['herbs']};
 const V51_MERCHANTS={
  books:{name:'Bookseller & Scribe'},apothecary:{name:'Apothecary'},smith:{name:'Smithy & Armorer'},
  clothier:{name:'Clothier & Household Shop'},provisioner:{name:'Provisioner'},outfitter:{name:'Road Outfitter'}
 };
 const ITEMS={};
 function define(id,name,cat,value=10,extra={}){ITEMS[id]={id,name,cat,weight:1,value,quality:'Common',stack:true,img:'assets/'+id+'.webp',desc:name+' description',...extra}}
 define('wine_skin','Good Wine Skin','food',20,{img:'wrong-wine.webp'});define('wine','Wine Bottle','drink',8);define('water','Fresh Water','drink',1);define('bread','Bread Loaf','food',2);define('hard_biscuit','Hard Biscuit','food',1);define('salted_meat','Salted Meat','food',4);define('grain','Grain Sack','material',18);
 define('map_case','Map Case','document',35);define('parchment','Parchment','document',2);define('wax_seal','Sealing Wax','document',2);
 define('bandage','Bandage','medical',4);define('herbs','Herbs','medical',6);define('clean_linen','Clean Linen','medicine',12);define('healing_salve','Healing Salve','medical',16);
 define('dagger','Dagger','weapon',28);define('arrow','Arrow','ammo',1);define('bolt','Bolt','ammo',2);define('iron_ingot','Iron Ingot','material',22);
 define('linen_shirt','Linen Shirt','clothing',8);define('cloth','Cloth Bolt','material',25);define('boots','Leather Boots','clothing',24);define('cloak','Wool Cloak','clothing',28);define('wool','Wool Bale','material',16);
 define('bedroll','Bedroll','camp',9);define('rope','Rope Coil','material',18);define('lantern','Lantern','camp',14);define('repair_kit','Repair Kit','tool',70);
 for(const [skill,[id,name]] of Object.entries(V23_BOOKS))define(id,name,'book',110,{quality:'Fine',stack:false});
 const giftIds=['wooden_practice_sword','cloth_doll','carved_toy_horse','painted_toy_knight','black_rose_bouquet','embroidered_court_gloves','amber_rose_comb','silver_thorn_hairpin','moonstone_locket','illuminated_prayer_book','spice_casket','jeweled_rose_brooch'];
 for(const id of giftIds)define(id,id.replaceAll('_',' '),'gift',12,{quality:'Fine'});
 define('svc_bascinet','Bannerless Bascinet','armor',50,{quality:'Issued'});define('foot_spear','Foot Service Spear','weapon',30,{quality:'Issued'});define('dominus_sword','Dominus Sword','weapon',780,{quality:'Masterwork'});define('kael_tide_helm','Kael Helm','armor',900,{quality:'Relic'});define('kael_lightdrinker','Lightdrinker','weapon',900,{quality:'Relic'});define('wanderer_unique_helm','Wanderer Helm','armor',500,{quality:'Issued'});define('alexus_dominus_gown','Alexus Gown','clothing',300,{quality:'Noble'});define('moondancer_pearl_saddle','Pearl Saddle','animal',640,{quality:'Heirloom',notForSale:true});define('v38_nessa_wool_cloak','Nessa Cloak','clothing',7,{quality:'Personal'});define('v41_royal_helm','Royal Helm','armor',620,{restricted:true,bloodKeepOnly:true});define('v46_crimson_gown','Crimson Gown','clothing',360,{restricted:true,uniqueOwner:'Libita Savitas'});define('v46_razor_fan','Razor Fan','weapon',310,{restricted:true,uniqueOwner:'Libita Savitas'});define('v62_cipher_sheets','Cipher Sheets','document',4);
 for(const key of Object.keys(V51_MERCHANTS))for(let i=0;i<54;i++){let cat={books:'book',apothecary:'medical',smith:'weapon',clothier:'clothing',provisioner:'food',outfitter:'camp'}[key];define('ordinary_'+key+'_'+i,key+' ordinary '+String(i).padStart(2,'0'),cat,5+i,{shopKey:key})}

 let uidCount=0,wallet=100000,persistCalls=0,renderCalls=0,openedShop=null,lastBlock=null,tradeDestination='Wagon I';
 const inputs=Object.create(null),styles=[];
 const document={
  head:{appendChild(node){styles.push(node.textContent)}},
  getElementById(id){return inputs[id]||null},
  createElement(){return{id:'',textContent:''}}
 };
 function uid(prefix='id'){return prefix+'_'+(++uidCount)}
 function deep(value){return JSON.parse(JSON.stringify(value))}
 function clamp(value,min,max){return Math.max(min,Math.min(max,value))}
 function v10Hash(value){let out=0;for(const c of String(value))out=(Math.imul(out,31)+c.charCodeAt(0))>>>0;return out}
 function v31Money(copper){copper=Math.round(copper);let g=Math.floor(copper/1000),s=Math.floor(copper%1000/10),c=copper%10,out=[];if(g)out.push(g+'g');if(s||g)out.push(s+'s');if(c||!out.length)out.push(c+'c');return out.join(' ')}
 let v11Money=v31Money;
 function mkStack(itemId,qty=1,condition=100,extra={}){return{iid:uid('stack'),itemId,qty,condition,equipped:false,...extra}}
 function mkPerson(name,role,category,extra={}){return{id:uid('person'),name,role,category,alive:true,hp:80,maxHp:80,skills:{},...extra}}
 function baseState(){
  const locations=V49_URBAN.filter(loc=>loc!=='Seals End'&&LOC[loc]);
  const allRows=Object.values(ITEMS).map(d=>({itemId:d.id,qty:5,condition:95,price:d.value,purgedNoise:'remove me'}));
  const shops={};for(const loc of locations)shops[loc]=Object.fromEntries(Object.keys(V51_MERCHANTS).map(key=>[key,{key,location:loc,cashCopper:999999,stock:deep(allRows),purgedProtected:Array(200).fill('old')}]))
  shops['Seals End']=Object.fromEntries(Object.keys(V51_MERCHANTS).map(key=>[key,{key,location:'Seals End',cashCopper:50000,stock:deep(allRows)}]));
  return{meta:{},world:{day:1,hour:12,location:'Corvinus Keep',permanentNPCs:{'Seals End':[{id:'ghost_vendor',location:'Seals End'}],'Seal’s End':[]},settlements:{}},events:{},holdings:{},people:[
   mkPerson('Kael of the Azure Tide','Grandmaster Swordsman','Military',{id:'kael_azure_tide',hp:120,loyalty:60,customCompanion:'kael'}),
   mkPerson('Kael of the Azure Tide','Grandmaster Swordsman','Military',{id:'kael_azure_tide',hp:148,loyalty:75,customCompanion:'kael'})
  ],companions:[{name:'Kael of the Azure Tide',kael:true,hp:120,alive:true},{name:'Kael of the Azure Tide',kael:true,hp:148,alive:true}],containers:{'Carried Inventory':{name:'Carried Inventory',type:'personal',capacityKg:500,capacitySlots:100,items:[mkStack('svc_bascinet',1)]},'Wagon I':{name:'Wagon I',type:'wagon',capacityKg:3000,capacitySlots:100,items:[]}},wagons:[{name:'Wagon I',alive:true}],mounts:[],money:{},market:{'Corvinus Keep':[{itemId:'svc_bascinet',qty:4,price:50}],Solaris:[],Smallford:[],'Seals End':[{itemId:'wine_skin',qty:2,price:20},{itemId:'foot_spear',qty:1,price:30}]},v23:{seeded:true,study:{},kael:{met:true,recruited:true,offered:true,drunkHours:2,trainingDay:-99,gifts:1}},v70:{version:'1.50.2',shops,assignments:{},shopHistory:Array(260).fill({day:1}),sortHistory:Array(180).fill({day:1}),studied:{},lastRestockDay:1},v66:{shopVisits:Array(220).fill({location:'Seals End'})},v69:{counterHistory:Array(140).fill({location:'Seals End'}),activeCounter:null},v32:{quarantinedMarket:Array(70).fill({bad:true})}};
 }
 let S=baseState(),initialV70Bytes=JSON.stringify(S.v70).length;
 function itemDef(id){return ITEMS[id]}
 function itemContainers(){return Object.values(S.containers).filter(c=>containerAccessible(c.name))}
 function containerAccessible(name){return!!S.containers[name]}
 function containerWeight(c){return(c.items||[]).reduce((n,st)=>n+(ITEMS[st.itemId]?.weight||0)*st.qty,0)}
 function containerSlots(c){return(c.items||[]).length}
 function canAdd(c,st){return containerWeight(c)+(ITEMS[st.itemId]?.weight||0)*st.qty<=c.capacityKg&&containerSlots(c)+(c.items.some(x=>x.itemId===st.itemId&&ITEMS[st.itemId]?.stack)?0:1)<=c.capacitySlots}
 function countItem(id){return itemContainers().reduce((n,c)=>n+c.items.filter(st=>st.itemId===id&&!st.equipped).reduce((m,st)=>m+st.qty,0),0)}
 function addItem(name,id,qty=1,condition=100,extra={}){let c=S.containers[name],st=mkStack(id,qty,condition,extra);if(!c||!canAdd(c,st))return false;let old=c.items.find(x=>x.itemId===id&&ITEMS[id].stack&&x.condition===condition&&!x.equipped);if(old)old.qty+=qty;else c.items.push(st);return true}
 function removeItem(id,qty){let remain=qty;for(const c of itemContainers())for(let i=c.items.length-1;i>=0&&remain;i--){let st=c.items[i];if(st.itemId!==id||st.equipped)continue;let take=Math.min(remain,st.qty);st.qty-=take;remain-=take;if(st.qty<=0)c.items.splice(i,1)}return qty-remain}
 function moneyCopper(){return wallet}function payCopper(c){if(wallet<c)return false;wallet-=c;return true}function earnCopper(c){wallet+=c;return c}
 function v11DestinationOptions(){return Object.keys(S.containers).filter(containerAccessible)}function v11ResolveDestination(){return tradeDestination}function v11SetTradeDestination(value){tradeDestination=value}
 function v11PubliclyTradable(d){return!!d&&!d.restricted&&d.value>0&&d.quality!=='Heirloom'}
 function v11QuoteMarket(loc,row){return{total:Math.max(1,ITEMS[row.itemId].valueCopper||ITEMS[row.itemId].value*10)}}
 function v34TMarketGroup(d){return d?.cat||'Other'}
 function v70CargoClass(d){return d?.cargoClass||d?.cat||'Goods'}
 function v70OwnedRows(key){let map=new Map();for(const c of itemContainers())for(const st of c.items){let d=ITEMS[st.itemId];if(!st.equipped&&v70LegacyShop(d)===key)map.set(st.itemId,(map.get(st.itemId)||0)+st.qty)}return[...map].map(([id,qty])=>({id,qty}))}
 function v70Protected(){return false}function v70LegacyShop(d){return d?.shopKey||null}function v70SanitizeShop(shop){return shop}function v70ShopSeed(){return null}function v70Ensure(){return S.v70}function v70Shop(){return null}function v70Destination(){return''}function v70Select(){return''}function v70BuyPanel(){return''}function v70SellPanel(){return''}function v70Buy(){return false}function v70Sell(){return false}
 function v69StockCount(){return 0}function v69Directory(){return'licensed shops'}function v69OpenCounter(key){openedShop=key;return true}
 function v66GroupCandidates(){return[]}function v66SeedAllCommerce(){}
 function v51SeedBooks(){}
 function v21BlankGear(){return{head:null,main:null}}
 function v23BaseState(){return{seeded:true,study:{},kael:{met:false,recruited:false,offered:true,drunkHours:0,trainingDay:-99,gifts:0}}}
 function v23Upgrade(){S.v23??=v23BaseState();S.v23.kael??=v23BaseState().kael}
 function v23Consume(id){return removeItem(id,1)===1}
 function v23RecruitKael(){if(!v23Consume('wine_skin'))return false;let p=mkPerson('Kael of the Azure Tide','Grandmaster Swordsman','Military',{id:'kael_azure_tide',hp:148,maxHp:148,customCompanion:'kael',portrait:'assets/characters/kael_azure_tide.webp'});S.people.push(p);S.companions.push({name:p.name,kael:true,hp:p.hp,alive:true});S.v23.kael.recruited=true;S.v23.kael.gifts++;render()}
 function v23KaelTab(){return'old Kael'}function v23BooksTab(){return'old books'}function v23Skill(){return 20}function v23Rank(){return'Novice'}function v23ReadBook(){}function v23BuyBook(){}
 function v49Current(){return'Bookseller'}function v36SettlementMap(){}function entityImage(src,name,cls){return'<img class="'+cls+'" src="'+src+'" alt="'+name+'">'}
 function v19Block(title,text){lastBlock={title,text};return false}function toast(){}function render(){renderCalls++}function persist(){persistCalls++}
 function dailyTick(){S.world.day++}
 function makeStartState(){let state=baseState();state.people=[];state.companions=[];state.v23=v23BaseState();state.v70={version:'1.50.2',shops:{},assignments:{},shopHistory:[],sortHistory:[],studied:{},lastRestockDay:-1};return state}
 function migrateState(state){return state}
 `,context,{filename:'v165-base-runtime.js'});

vm.runInContext(`(0,eval)(${JSON.stringify(patch)})`,context,{filename:'aetherion-updater-eval.js'});

const api=context.AetherionV165Cleanup;
assert.equal(api.version,'1.65.0');
assert.equal(api.policy,'balanced-regional-v1.65.0');

const result=vm.runInContext(`(()=>{
 const locations=[...V49_URBAN],centers=[...V23_CAPITALS],allShops=Object.entries(S.v70.shops),sizes=allShops.flatMap(([,shops])=>Object.values(shops).map(shop=>shop.stock.length)),signatures=allShops.map(([loc,shops])=>Object.values(shops).flatMap(shop=>shop.stock.map(row=>row.itemId)).sort().join('|'));
 const stocked=new Set(allShops.flatMap(([,shops])=>Object.values(shops).flatMap(shop=>shop.stock.map(row=>row.itemId))));
 return{locations,centers,sizes,uniqueSignatures:new Set(signatures).size,stocked:[...stocked],state:S,initialV70Bytes,currentV70Bytes:JSON.stringify(S.v70).length,persistCalls,styles:styles.join('\\n')};
})()`,context);

assert(!result.locations.includes('Seals End'));
assert(result.locations.includes('Seal’s End'));
assert.deepEqual(Array.from(result.centers),['Solaris','Corvinus Keep','Southport','White Harbor','Winterhold','Stonevein Halls','Greenhall','Lorien Ford']);
assert(Math.min(...result.sizes)>=14);
assert(Math.max(...result.sizes)<=30);
assert(result.uniqueSignatures>3,'regional shop catalogs must differ');
assert(result.currentV70Bytes<result.initialV70Bytes*.45,'the oversized duplicated shop save data must be compacted');
assert.equal(result.persistCalls,1,'the installed save migration must persist once');
assert.match(result.styles,/v165-featured/);

const state=result.state;
assert.equal(state.v70.version,'1.65.0');
assert.equal(state.meta.v165WorldCleanup.version,'1.65.0');
assert.equal(state.people.filter(p=>p.id==='kael_azure_tide').length,1);
assert.equal(state.companions.filter(c=>c.kael).length,1);
assert(!state.market['Seals End']);
assert(state.market['Seal’s End']);
assert(!state.market['Corvinus Keep'].some(row=>row.itemId==='svc_bascinet'));
assert.equal(state.containers['Carried Inventory'].items.filter(row=>row.itemId==='svc_bascinet').length,1,'player-owned issued gear must never be removed');
assert.equal(state.v70.shopHistory.length,200);
assert.equal(state.v70.sortHistory.length,120);
assert.equal(state.v32.quarantinedMarket.length,20);
assert.equal(state.v66.shopVisits.length,160);
assert.equal(state.v69.counterHistory.length,100);

const wine=vm.runInContext('ITEMS.wine_skin',context);
assert.equal(wine.cat,'drink');
assert.equal(wine.shopKey,'provisioner');
assert.equal(wine.img,'assets/items/v25/medical/wine_skin.webp');
assert.equal(api.shopForItem(wine),'provisioner');
for(const id of api.giftIds)assert.equal(vm.runInContext(`v70LegacyShop(ITEMS[${JSON.stringify(id)}])`,context),'books');
for(const id of ['svc_bascinet','foot_spear','dominus_sword','kael_tide_helm','alexus_dominus_gown','v41_royal_helm','v46_crimson_gown','v62_cipher_sheets']){
 assert.equal(api.shopForItem(vm.runInContext(`ITEMS[${JSON.stringify(id)}]`,context)),null,`${id} must not enter an ordinary shop`);
 assert(!result.stocked.includes(id),`${id} leaked into shop stock`);
}
for(const id of api.giftIds)assert(result.stocked.includes(id),`${id} must be purchasable somewhere`);
const missingOrdinary=vm.runInContext(`Object.values(ITEMS).filter(d=>AetherionV165Cleanup.shopForItem(d)&&!new Set(Object.values(S.v70.shops).flatMap(shops=>Object.values(shops).flatMap(shop=>shop.stock.map(row=>row.itemId)))).has(d.id)).map(d=>d.id)`,context);
assert.deepEqual(Array.from(missingOrdinary),[],'every ordinary classified item must be stocked somewhere in the world');

const priceUi=vm.runInContext(`(()=>{let shop=S.v70.shops['Corvinus Keep'].provisioner,row=shop.stock.find(r=>r.itemId==='wine_skin'),panel=v70BuyPanel('provisioner'),select=v70Select();return{qty:row.qty,copper:AetherionV165Cleanup.rowCopper(row),panel,select}})()`,context);
assert(priceUi.qty>=5);
assert.equal(priceUi.copper,200);
assert.match(priceUi.panel,/Good Wine Skin/);
assert.match(priceUi.panel,/20s/);
assert(priceUi.panel.indexOf('Good Wine Skin')<priceUi.panel.indexOf('</article>'),'wine must be the first visible provisioner card');
assert.match(priceUi.panel,/Search this shop/);
assert.match(priceUi.select,/Wagon I/,'wagons must be valid purchase destinations');

const purchase=vm.runInContext(`(()=>{inputs.v70Dest={value:'Wagon I'};inputs.v70q_wine_skin={value:'1'};let beforeMoney=wallet,beforeQty=S.v70.shops['Corvinus Keep'].provisioner.stock.find(r=>r.itemId==='wine_skin').qty,result=v70Buy('provisioner','wine_skin'),afterQty=S.v70.shops['Corvinus Keep'].provisioner.stock.find(r=>r.itemId==='wine_skin').qty;return{result,charged:beforeMoney-wallet,used:beforeQty-afterQty,received:countItem('wine_skin')}})()`,context);
assert.equal(purchase.result,true);
assert.equal(purchase.charged,200,'20 silver must charge 200 copper, not 2,000');
assert.equal(purchase.used,1);
assert.equal(purchase.received,1);

const sale=vm.runInContext(`(()=>{inputs.v70s_wine_skin={value:'1'};let beforeMoney=wallet,beforeOwned=countItem('wine_skin'),result=v70Sell('provisioner','wine_skin');return{result,paid:wallet-beforeMoney,beforeOwned,afterOwned:countItem('wine_skin')}})()`,context);
assert.equal(sale.result,true);
assert.equal(sale.paid,110,'a 55% offer on a 20-silver item must pay 110 copper');
assert.equal(sale.beforeOwned-sale.afterOwned,1);

const protectedSale=vm.runInContext(`(()=>{inputs.v70s_svc_bascinet={value:'1'};let beforeMoney=wallet,beforeOwned=countItem('svc_bascinet'),result=v70Sell('smith','svc_bascinet');return{result,paid:wallet-beforeMoney,beforeOwned,afterOwned:countItem('svc_bascinet')}})()`,context);
assert.notEqual(protectedSale.result,true);
assert.equal(protectedSale.paid,0);
assert.equal(protectedSale.afterOwned,protectedSale.beforeOwned,'issued gear must stay owned when an ordinary shop refuses it');

const recruit=vm.runInContext(`(()=>{S=makeStartState();S.v23.kael.met=true;addItem('Carried Inventory','wine_skin',2,100);let before=countItem('wine_skin');v23RecruitKael();let one={people:S.people.filter(p=>p.id==='kael_azure_tide').length,companions:S.companions.filter(c=>c.kael).length,wine:countItem('wine_skin')};v23RecruitKael();let two={people:S.people.filter(p=>p.id==='kael_azure_tide').length,companions:S.companions.filter(c=>c.kael).length,wine:countItem('wine_skin')};return{before,one,two}})()`,context);
assert.equal(recruit.before,2);
assert.equal(JSON.stringify(recruit.one),JSON.stringify({people:1,companions:1,wine:1}));
assert.equal(JSON.stringify(recruit.two),JSON.stringify({people:1,companions:1,wine:1}),'repeated recruitment must neither duplicate Kael nor consume another gift');

const recovery=vm.runInContext(`(()=>{S=makeStartState();S.v23.kael.recruited=true;S.people=[];S.companions=[];AetherionV165Cleanup.repairKael(S);return{people:S.people.filter(p=>p.id==='kael_azure_tide').length,companions:S.companions.filter(c=>c.kael).length}})()`,context);
assert.equal(JSON.stringify(recovery),JSON.stringify({people:1,companions:1}));

const daily=vm.runInContext(`(()=>{S=makeStartState();let row=S.v70.shops['Corvinus Keep'].provisioner.stock.find(r=>r.itemId==='wine_skin');row.qty=0;S.v70.lastEssentialRestockDay=-1;dailyTick();return S.v70.shops['Corvinus Keep'].provisioner.stock.find(r=>r.itemId==='wine_skin').qty})()`,context);
assert.equal(daily,1,'Good Wine Skin must recover by at least one bottle on a new day');

const ruinTrade=vm.runInContext(`(()=>{S=makeStartState();S.world.location='Caer Dunlain';openedShop=null;let directory=v69Directory(),opened=v69OpenCounter('provisioner');return{directory,opened,openedShop,hasSavedShop:!!S.v70.shops['Caer Dunlain']}})()`,context);
assert.match(ruinTrade.directory,/no permanent six-shop merchant row/i);
assert.equal(ruinTrade.opened,false);
assert.equal(ruinTrade.openedShop,null);
assert.equal(ruinTrade.hasSavedShop,false);

const restoredBloodKeep=vm.runInContext(`(()=>{S=makeStartState();S.events.bloodKeepClaimed=true;AetherionV165Cleanup.ensureShops(S);let books=S.v70.shops['Blood Keep Ruins']?.books?.stock||[];return{hasShop:!!S.v70.shops['Blood Keep Ruins'],giftIds:books.filter(row=>AetherionV165Cleanup.giftIds.includes(row.itemId)).map(row=>row.itemId)}})()`,context);
assert.equal(restoredBloodKeep.hasShop,true,'the reclaimed Blood Keep must regain permanent merchants');
assert.deepEqual(Array.from(new Set(restoredBloodKeep.giftIds)).sort(),Array.from(api.giftIds).sort(),'the reclaimed Blood Keep bookseller must carry the complete gift range');

vm.runInContext(`S=makeStartState();v165ShopSearch('wine skin','provisioner','buy')`,context);
const filtered=vm.runInContext(`v70BuyPanel('provisioner')`,context);
assert.match(filtered,/Good Wine Skin/);
assert.doesNotMatch(filtered,/ordinary 01/);

console.log('v1.65.0 world economy cleanup patch: all assertions passed');
