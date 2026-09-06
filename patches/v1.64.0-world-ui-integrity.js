/* Aetherion Reforged v1.64.0 — retinue identity, equipment art, house authority, and mobile logistics repair. */
'use strict';
(()=>{
 const VERSION='1.64.0';
 const BANNERLESS_ART=Object.freeze({
  'Bannerless Knight':'assets/bannerless_knight.jpg',
  'Lesser Knight':'assets/bannerless_knight.jpg',
  'Company Captain':'assets/bannerless_knight.jpg',
  'Knight-Commander':'assets/bannerless_knight.jpg',
  'Bannerless Man-at-Arms':'assets/bannerless_man_at_arms.jpg',
  'Bannerless Archer':'assets/bannerless_archer.jpg',
  'Bannerless Crossbowman':'assets/bannerless_crossbowman.jpg',
  'Bannerless Sergeant':'assets/bannerless_sergeant.jpg',
  'Bannerless Swordsman':'assets/bannerless_swordsman.jpg',
  'Footman':'assets/bannerless_swordsman.jpg'
 });
 const DOMINUS_ART=Object.freeze({
  'Dominus House Knight':'assets/units/v16/house_knight.webp',
  'Dominus Banner Knight':'assets/units/v16/banner_knight.webp',
  'Dominus Man-at-Arms':'assets/units/v16/manatarms.webp',
  'Dominus Archer':'assets/units/v16/archer.webp',
  'Dominus Crossbowman':'assets/units/v16/crossbow.webp'
 });
 const ITEM_ART=Object.freeze({
  svc_bascinet:'assets/items/v25/service/svc_bascinet.webp',
  svc_mail_standard:'assets/items/v25/service/svc_mail_standard.webp',
  svc_arming_coat:'assets/items/v25/service/svc_arming_coat.webp',
  svc_mail_hauberk:'assets/items/v25/service/svc_mail_hauberk.webp',
  svc_spaulders:'assets/items/v25/service/svc_spaulders.webp',
  svc_gauntlets:'assets/items/v25/service/svc_gauntlets.webp',
  svc_sword_belt:'assets/items/v25/service/svc_sword_belt.webp',
  svc_mail_chausses:'assets/items/v25/service/svc_mail_chausses.webp',
  svc_riding_boots:'assets/items/v25/service/svc_riding_boots.webp',
  svc_wool_cloak:'assets/items/v25/service/svc_wool_cloak.webp',
  svc_arming_sword:'assets/items/v25/service/svc_arming_sword.webp',
  svc_kite_shield:'assets/items/v25/service/svc_kite_shield.webp',
  svc_mercy_dagger:'assets/items/v25/service/svc_mercy_dagger.webp',
  svc_signet_blank:'assets/items/v25/service/svc_signet_blank.webp',
  foot_kettle:'assets/items/v25/foot/foot_kettle.webp',
  foot_gambeson:'assets/items/v25/foot/foot_gambeson.webp',
  foot_mail:'assets/items/v25/foot/foot_mail.webp',
  foot_gloves:'assets/items/v25/foot/foot_gloves.webp',
  foot_belt:'assets/items/v25/foot/foot_belt.webp',
  foot_hose:'assets/items/v25/foot/foot_hose.webp',
  foot_boots:'assets/items/v25/foot/foot_boots.webp',
  foot_cloak:'assets/items/v25/foot/foot_cloak.webp',
  foot_spear:'assets/items/v25/foot/foot_spear.webp',
  foot_round:'assets/items/v25/foot/foot_round.webp',
  foot_dagger:'assets/items/v25/foot/foot_dagger.webp'
 });
 const SLOT_LABELS=Object.freeze([
  ['head','Head'],['neck','Neck'],['underlayer','Underlayer'],['body','Body'],
  ['shoulders','Shoulders'],['hands','Hands'],['waist','Waist'],['legs','Legs'],
  ['feet','Feet'],['cloak','Cloak'],['main','Main Hand'],['off','Off Hand'],
  ['ranged','Ranged'],['reserve','Reserve'],['ammo','Ammunition'],
  ['jewelry1','Jewelry I'],['jewelry2','Jewelry II']
 ]);
 const HOUSE_LABELS=Object.freeze({
  dominus:'House Dominus',white_harbor:'White Harbor',highwatch:'Highwatch Keep',
  grimhorn:'Grimhorn / Ash Wastes',stonevein:'Stonevein Halls',corvinus:'Corvinus Keep',
  eternal_glades:'Eternal Glades / Greenhall',solaris:'Solaris Royal Crown',
  lorien:'Lorien Ford Underrealm',winterhold:'Winterhold / Frostreach'
 });
 const FOREIGN_HOUSES=Object.freeze(Object.entries(HOUSE_LABELS).filter(([key])=>key!=='dominus'));
 const runtime={repairedPeople:0,repairedItems:0,blockedHouseActions:0,observer:null};

 function clean(value){return String(value??'').trim()}
 function lower(value){return clean(value).toLowerCase().replace(/[’']/g,"'").replace(/\s+/g,' ')}
 function titleGender(person){
  const value=lower(`${person?.title||''} ${person?.name||''}`);
  if(/(^|\s)(dame|lady|queen|princess|mistress|madam)\b/.test(value))return'F';
  if(/(^|\s)(ser|sir|lord|king|prince|master)\b/.test(value))return'M';
  return null;
 }
 function voiceGender(voice){
  const value=clean(voice).toUpperCase();
  if(['YF','F','AF','BF','MF'].includes(value))return'F';
  if(['YM','M','MM','AM','BM'].includes(value))return'M';
  return null;
 }
 function recordedGender(person){
  const value=clean(person?.gender).toUpperCase();
  if(value==='F'||value==='FEMALE'||value==='WOMAN')return'F';
  if(value==='M'||value==='MALE'||value==='MAN')return'M';
  return null;
 }
 function inferredGender(person){
  const title=titleGender(person),recorded=recordedGender(person),voice=voiceGender(person?.voice);
  if(title)return title;
  if(isServiceRetainer(person)&&voice)return voice;
  return recorded||voice||'M';
 }
 function isBannerless(person){
  if(!person)return false;
  return person.bannerless===true||/\bBannerless\b/i.test(`${person.role||''} ${person.rank||''} ${person.fullSet||''}`)||clean(person.issuedKit)==='bannerless_knight_service';
 }
 function isServiceRetainer(person){
  return isBannerless(person)||clean(person?.issuedKit)==='foot_service'||/\bExile Retinue Foot Service Kit\b/i.test(person?.fullSet||'');
 }
 function roleArt(role){
  const exact=BANNERLESS_ART[clean(role)]||DOMINUS_ART[clean(role)];
  if(exact)return exact;
  const value=clean(role);
  if(/Bannerless.*Crossbow/i.test(value))return BANNERLESS_ART['Bannerless Crossbowman'];
  if(/Bannerless.*Archer/i.test(value))return BANNERLESS_ART['Bannerless Archer'];
  if(/Bannerless.*Sergeant/i.test(value))return BANNERLESS_ART['Bannerless Sergeant'];
  if(/Bannerless.*Man-at-Arms/i.test(value))return BANNERLESS_ART['Bannerless Man-at-Arms'];
  if(/Bannerless.*Swordsman/i.test(value))return BANNERLESS_ART['Bannerless Swordsman'];
  if(/Bannerless.*Knight/i.test(value))return BANNERLESS_ART['Bannerless Knight'];
  return null;
 }
 function writePresentationGender(person,gender){
  for(const key of ['sex','modelGender','presentationGender','bodyGender','avatarGender']){
   if(!(key in person))continue;
   const before=person[key],word=/^(male|female|man|woman)$/i.test(clean(before));
   person[key]=word?(gender==='F'?'female':'male'):gender;
  }
 }
 function repairPerson(person){
  if(!person||typeof person!=='object')return false;
  let changed=false,gender=inferredGender(person);
  if(person.gender!==gender){person.gender=gender;changed=true}
  for(const key of ['sex','modelGender','presentationGender','bodyGender','avatarGender']){
   if(!(key in person))continue;
   const before=person[key];writePresentationGender(person,gender);if(person[key]!==before)changed=true;
  }
  const currentVoice=voiceGender(person.voice);
  if(currentVoice&&currentVoice!==gender){person.voice=gender==='F'?'YF':((+person.age||30)<36?'YM':'MM');changed=true}
  const art=roleArt(person.role);
  if(art&&(isServiceRetainer(person)||BANNERLESS_ART[clean(person.role)]||DOMINUS_ART[clean(person.role)])&&person.portrait!==art){person.portrait=art;changed=true}
  if(changed)runtime.repairedPeople++;
  return changed;
 }
 function allPeople(state){
  const out=[],seen=new Set();
  const add=person=>{if(person&&typeof person==='object'&&!seen.has(person)){seen.add(person);out.push(person)}};
  for(const person of state?.people||[])add(person);
  for(const settlement of Object.values(state?.v15?.settlements||{}))for(const person of settlement?.roster||[])add(person);
  for(const settlement of Object.values(state?.v17?.settlements||{}))for(const person of settlement?.roster||[])add(person);
  return out;
 }
 function repairItems(){
  if(typeof ITEMS==='undefined'||!ITEMS)return 0;
  let changed=0;
  for(const[id,art]of Object.entries(ITEM_ART)){
   const item=ITEMS[id];if(!item)continue;
   if(item.img!==art){item.img=art;changed++}
  }
  for(const item of Object.values(ITEMS)){
   if(!item||!Number.isFinite(+item.weight))continue;
   const rounded=+(+item.weight).toFixed(3);
   if(item.weight!==rounded){item.weight=rounded;changed++}
  }
  runtime.repairedItems+=changed;return changed;
 }
 function repairState(state){
  if(!state||typeof state!=='object')return state;
  let changed=false;
  for(const person of allPeople(state))if(repairPerson(person))changed=true;
  state.meta??={};
  if(state.meta.v164Integrity!==VERSION){state.meta.v164Integrity=VERSION;changed=true}
  try{Object.defineProperty(state.meta,'v164Changed',{value:changed,writable:true,configurable:true,enumerable:false})}catch(_){state.meta.v164Changed=changed}
  return state;
 }
 function formatNumber(value,digits=2){
  const number=+value;if(!Number.isFinite(number))return clean(value);
  return number.toFixed(digits).replace(/0+$/,'').replace(/\.$/,'');
 }
 function itemArt(item){return item&&(ITEM_ART[item.id]||item.img)||''}
 function safeHtml(value){return typeof esc==='function'?esc(clean(value)):clean(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
 function safeJs(value){return clean(value).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}
 function slots(){return typeof V16_SLOT_LABELS!=='undefined'&&Array.isArray(V16_SLOT_LABELS)?V16_SLOT_LABELS:SLOT_LABELS}
 function equipmentStats(item){
  if(!item)return'';const bits=[];
  if(Number.isFinite(+item.weight))bits.push(`${formatNumber(item.weight)} kg`);
  if(+item.armor)bits.push(`ARM ${formatNumber(item.armor)}`);
  if(+item.attack)bits.push(`ATK ${formatNumber(item.attack)}`);
  return bits.join(' · ');
 }
 function equipmentHtml(person){
  const portrait=roleArt(person.role)||person.portrait||(typeof v16PersonPortrait==='function'?v16PersonPortrait(person):'');
  const picture=typeof entityImage==='function'?entityImage(portrait,person.name,'bigPic'):`<img class="bigPic" src="${safeHtml(portrait)}" alt="${safeHtml(person.name)}">`;
  const cards=slots().map(([slot,label])=>{
   const id=person.gear?.[slot],item=id&&typeof itemDef==='function'?itemDef(id):(typeof ITEMS!=='undefined'?ITEMS[id]:null),art=itemArt(item),stats=equipmentStats(item);
   const image=item&&art?(typeof itemImage==='function'?itemImage({...item,img:art},'slotPic'):`<img class="slotPic" src="${safeHtml(art)}" alt="${safeHtml(item.name)}">`):'';
   return`<div class="slot v164-gear-slot ${id?'':'empty'}" onclick="v164OpenPersonGear('${safeJs(person.id)}','${safeJs(slot)}')">${image}<b>${safeHtml(label)}</b><div>${item?safeHtml(item.name):'Empty'}</div>${item?`<small>${safeHtml(stats||'Recorded equipment')}</small>`:''}</div>`;
  }).join('');
  return`<div class="modalHeader"><div><h2>${safeHtml(person.name)} — Equipment</h2><div class="muted">${safeHtml(person.role)} · ${person.fullSet?`issued ${safeHtml(person.fullSet)}`:'personal equipment ledger'}${person.mountId?' · mounted':''}</div></div><button onclick="openPerson('${safeJs(person.id)}')">Back</button></div><div class="v164-person-gear"><div>${picture}</div><div class="slotGrid">${cards}</div></div><p>Each occupied slot shows the exact physical item assigned to this retainer. Empty slots remain empty; equipment is not duplicated into company inventory.</p>`;
 }
 function openPersonGear(personId,slot){
  const person=typeof S!=='undefined'?S?.people?.find(candidate=>candidate.id===personId):null;
  if(!person)return;
  const id=person.gear?.[slot];
  if(id&&typeof v24OpenPersonGear==='function')return v24OpenPersonGear(personId,slot);
  if(typeof v16ChoosePersonItem==='function')return v16ChoosePersonItem(personId,slot);
 }
 function renderServiceEquipment(id){
  const person=typeof S!=='undefined'?S?.people?.find(candidate=>candidate.id===id):null;
  if(!person||!isServiceRetainer(person))return false;
  repairPerson(person);repairItems();
  if(typeof openModal==='function')openModal(equipmentHtml(person));
  return true;
 }
 function foreignHouse(value){
  const text=lower(value).replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  for(const[key,label]of FOREIGN_HOUSES){
   const normalized=key.replace(/^_+|_+$/g,'');
   if(text===normalized||text.includes(normalized)||lower(value).includes(lower(label)))return key;
  }
  return null;
 }
 function isHeading(element){return /^H[1-6]$/.test(element?.tagName||'')}
 function buttonsUntilNextHeading(heading){
  const buttons=[];let node=heading?.nextElementSibling;
  while(node&&!isHeading(node)){
   if(node.matches?.('button'))buttons.push(node);
   for(const button of node.querySelectorAll?.('button')||[])buttons.push(button);
   node=node.nextElementSibling;
  }
  return buttons;
 }
 function sanitizeHouseIssue(root=document){
  if(!root?.querySelectorAll)return 0;let hidden=0;
  for(const heading of root.querySelectorAll('h1,h2,h3,h4,h5,h6')){
   if(!/Issue Complete House Armor/i.test(heading.textContent||''))continue;
   heading.textContent='Issue House Dominus Armor';
   const buttons=buttonsUntilNextHeading(heading);
   for(const button of buttons){
    const key=foreignHouse(button.textContent||'');if(!key)continue;
    button.dataset.v164ForeignHouse=key;button.disabled=true;button.hidden=true;button.style.display='none';hidden++;
   }
   const host=heading.parentElement;
   if(host&&!host.querySelector?.('[data-v164-house-note]')){
    const note=document.createElement('p');note.dataset.v164HouseNote='true';note.className='muted v164-house-note';note.textContent='Valkorion controls House Dominus only. Foreign armories remain under their own rulers.';
    heading.insertAdjacentElement?.('afterend',note);
   }
  }
  return hidden;
 }
 function constrainWagons(root=document){
  if(!root?.querySelectorAll)return 0;let count=0;
  for(const heading of root.querySelectorAll('h1,h2,h3,h4')){
   if(!/Wagonwright Classes/i.test(heading.textContent||''))continue;
   let node=heading.nextElementSibling;
   while(node&&!isHeading(node)){
    node.classList?.add('v164-wagon-classes');
    for(const image of node.querySelectorAll?.('img')||[]){image.classList.add('v164-wagon-class-image');count++}
    node=node.nextElementSibling;
   }
  }
  return count;
 }
 function findItemFromElement(element){
  if(typeof ITEMS==='undefined'||!ITEMS)return null;
  const id=element?.dataset?.itemId;if(id&&ITEMS[id])return ITEMS[id];
  const text=lower(element?.textContent||'');let winner=null,length=0;
  for(const item of Object.values(ITEMS)){
   const name=lower(item?.name);if(!name||name.length<=length||!text.includes(name))continue;
   winner=item;length=name.length;
  }
  return winner;
 }
 function enhanceEquipment(root=document){
  if(!root?.querySelectorAll)return 0;let count=0;
  for(const slot of root.querySelectorAll('.slot')){
   const item=findItemFromElement(slot),art=itemArt(item);if(!item||!art)continue;
   let image=slot.querySelector?.('img');
   if(!image){image=document.createElement('img');slot.prepend?.(image)}
   if(image.getAttribute?.('src')!==art)image.src=art;
   image.alt=item.name||'Equipment';image.classList?.add('slotPic','v164-slot-pic');
   if(!image.classList)image.className='slotPic v164-slot-pic';
   slot.classList?.add('v164-gear-slot');count++;
  }
  return count;
 }
 function formatWeights(root=document){
  if(!root||typeof document==='undefined'||!document.createTreeWalker||typeof NodeFilter==='undefined')return 0;
  let count=0,walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),node;
  while((node=walker.nextNode())){
   const before=node.nodeValue,after=before?.replace(/(-?\d+\.\d{4,})\s*kg\b/g,(_,number)=>`${formatNumber(number)} kg`);
   if(before!==after){node.nodeValue=after;count++}
  }
  return count;
 }
 function enhance(root=document){
  try{sanitizeHouseIssue(root);constrainWagons(root);enhanceEquipment(root);formatWeights(root)}catch(error){console.warn('[Aetherion 1.64.0 UI repair]',error)}
 }
 function blockForeignHouseClick(event){
  const button=event.target?.closest?.('button');if(!button)return;
  const key=button.dataset?.v164ForeignHouse;if(!key)return;
  event.preventDefault?.();event.stopImmediatePropagation?.();runtime.blockedHouseActions++;
  if(typeof toast==='function')toast('Valkorion may issue House Dominus armor only.');
 }
 function guardHouseFunctions(){
  if(typeof window==='undefined')return 0;let wrapped=0;
  for(const name of Object.getOwnPropertyNames(window)){
   if(!/^v98/i.test(name)||!/(issue|grant).*(house|armor)|(house|armor).*(issue|grant)/i.test(name))continue;
   const original=window[name];if(typeof original!=='function'||original.__v164HouseGuard)continue;
   const guarded=function(...args){
    const key=args.map(foreignHouse).find(Boolean);
    if(key){runtime.blockedHouseActions++;if(typeof toast==='function')toast('That armory belongs to another ruler. House Dominus equipment is the only set you may issue.');return false}
    return original.apply(this,args);
   };
   Object.defineProperty(guarded,'__v164HouseGuard',{value:true});window[name]=guarded;wrapped++;
  }
  return wrapped;
 }
 function installStyle(){
  if(typeof document==='undefined'||document.getElementById?.('aetherion-v164-integrity-style'))return;
  const style=document.createElement('style');style.id='aetherion-v164-integrity-style';style.textContent=`
   .v164-wagon-classes .card>img,.v164-wagon-classes .card picture>img,.v164-wagon-class-image{display:block!important;width:100%!important;height:clamp(118px,24vw,168px)!important;max-height:168px!important;object-fit:cover!important;object-position:center!important;margin:0 0 .7rem!important;border-radius:10px}
   .v164-person-gear{display:grid;grid-template-columns:minmax(190px,.75fr) minmax(0,1.25fr);gap:16px;align-items:start}.v164-person-gear .bigPic{width:100%;max-height:620px;object-fit:cover}.v164-gear-slot{display:grid!important;grid-template-columns:64px minmax(0,1fr)!important;grid-template-rows:auto auto auto;column-gap:10px;align-items:center;min-height:78px}.v164-gear-slot>.slotPic,.v164-slot-pic{grid-row:1/4;width:64px!important;height:64px!important;object-fit:cover!important;border-radius:8px}.v164-gear-slot>b,.v164-gear-slot>div,.v164-gear-slot>small{grid-column:2}.v164-house-note{margin:.35rem 0 .8rem;color:#c6a876}
   @media(max-width:720px){.v164-wagon-classes .card>img,.v164-wagon-classes .card picture>img,.v164-wagon-class-image{height:132px!important;max-height:132px!important}.v164-person-gear{grid-template-columns:1fr}.v164-person-gear>.slotGrid{grid-template-columns:1fr 1fr}.v164-gear-slot{grid-template-columns:52px minmax(0,1fr)!important;min-height:68px;padding:8px}.v164-gear-slot>.slotPic,.v164-slot-pic{width:52px!important;height:52px!important}}
   @media(max-width:430px){.v164-person-gear>.slotGrid{grid-template-columns:1fr}}
  `;document.head?.appendChild(style);
 }
 function wrapRuntime(){
  try{
   if(typeof v17GenderForRole==='function'){
    const base=v17GenderForRole;v17GenderForRole=function(role,seed){const titled=titleGender({name:seed});return titled||base(role,seed)};
   }
   if(typeof v17RepairNames==='function'){
    const base=v17RepairNames;v17RepairNames=function(state){
     const protectedNames=new Map(allPeople(state).filter(person=>recordedGender(person)||isServiceRetainer(person)||titleGender(person)).map(person=>[person,{name:person.name,title:person.title,gender:recordedGender(person),voice:person.voice}]));
     const result=base(state);
     for(const[person,snapshot]of protectedNames){person.name=snapshot.name;if(snapshot.title!==undefined)person.title=snapshot.title;if(snapshot.gender)person.gender=snapshot.gender;if(snapshot.voice!==undefined)person.voice=snapshot.voice}
     repairState(state);return result;
    };
   }
   if(typeof v16Portrait==='function'){
    const base=v16Portrait;v16Portrait=function(role,gender){return roleArt(role)||base(role,gender)};
   }
   if(typeof v15Portrait==='function'){
    const base=v15Portrait;v15Portrait=function(role,gender){return roleArt(role)||base(role,gender)};
   }
   if(typeof v16PersonPortrait==='function'){
    const base=v16PersonPortrait;v16PersonPortrait=function(person){return isServiceRetainer(person)?(roleArt(person.role)||person.portrait||base(person)):base(person)};
   }
   if(typeof v16PersonEquipment==='function'){
    const base=v16PersonEquipment;v16PersonEquipment=function(id){if(renderServiceEquipment(id))return;return base(id)};
   }
   if(typeof v15Hire==='function'){
    const base=v15Hire;v15Hire=function(...args){const result=base.apply(this,args);try{if(typeof S!=='undefined')repairState(S)}catch(_){}return result};
   }
   if(typeof v21IssuePerson==='function'){
    const base=v21IssuePerson;v21IssuePerson=function(person,...args){const result=base.call(this,person,...args);repairPerson(person);repairItems();return result};
   }
   if(typeof setFormationRole==='function'){
    const base=setFormationRole;setFormationRole=function(id,role){const result=base(id,role);try{const person=typeof S!=='undefined'?S?.people?.find(candidate=>candidate.id===id):null;if(person){person.portrait=roleArt(role)||person.portrait;repairPerson(person)}}catch(_){}return result};
   }
   if(typeof setRank==='function'){
    const base=setRank;setRank=function(id,...args){const result=base.call(this,id,...args);try{const person=typeof S!=='undefined'?S?.people?.find(candidate=>candidate.id===id):null;if(person)repairPerson(person)}catch(_){}return result};
   }
   if(typeof v16Swear==='function'){
    const base=v16Swear;v16Swear=function(id,...args){const result=base.call(this,id,...args);try{const person=typeof S!=='undefined'?S?.people?.find(candidate=>candidate.id===id):null;if(person)repairPerson(person)}catch(_){}return result};
   }
   if(typeof makeStartState==='function'){
    const base=makeStartState;makeStartState=function(...args){return repairState(base.apply(this,args))};
   }
   if(typeof migrateState==='function'){
    const base=migrateState;migrateState=function(state,...args){const result=base.call(this,state,...args);return result?repairState(result):result};
   }
   if(typeof openModal==='function'){
    const base=openModal;openModal=function(...args){const result=base.apply(this,args);enhance(document);guardHouseFunctions();return result};
   }
   if(typeof render==='function'){
    const base=render;render=function(...args){const result=base.apply(this,args);enhance(document);guardHouseFunctions();return result};
   }
   if(typeof v34lConvoyLogistics==='function'){
    const base=v34lConvoyLogistics;v34lConvoyLogistics=function(...args){const result=base.apply(this,args);enhance(document);return result};
   }
  }catch(error){console.warn('[Aetherion 1.64.0 runtime hooks]',error)}
 }
 function start(){
  repairItems();let changed=false;
  try{if(typeof S!=='undefined'&&S?.world){repairState(S);changed=!!S.meta?.v164Changed}}catch(error){console.warn('[Aetherion 1.64.0 state repair]',error)}
  installStyle();wrapRuntime();guardHouseFunctions();enhance(document);
  if(typeof document!=='undefined'){
   document.addEventListener?.('click',blockForeignHouseClick,true);
   if(typeof MutationObserver!=='undefined'&&document.body){runtime.observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes||[])if(node?.nodeType===1)enhance(node);guardHouseFunctions()});runtime.observer.observe(document.body,{childList:true,subtree:true})}
  }
  if(changed&&typeof persist==='function')try{persist(false)}catch(error){console.warn('[Aetherion 1.64.0 save]',error)}
 }

 window.v164OpenPersonGear=openPersonGear;
 window.AetherionV164Integrity=Object.freeze({version:VERSION,bannerlessArt:BANNERLESS_ART,itemArt:ITEM_ART,houseLabels:HOUSE_LABELS,roleArt,inferredGender,isBannerless,isServiceRetainer,repairPerson,repairItems,repairState,formatNumber,equipmentHtml,foreignHouse,sanitizeHouseIssue,constrainWagons,enhanceEquipment,guardHouseFunctions,runtime});
 start();
})();
