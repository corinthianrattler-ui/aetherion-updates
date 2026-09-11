/* Aetherion Reforged v1.74.3 — local full-body knight roster and bounded rendering. */
'use strict';
(()=>{
 const VERSION='1.74.3',POLICY='full-body-knight-diversity-local-v1.74.3';
 if(window.AetherionV1731KnightDiversity?.version===VERSION)return;
 const ROOT='custom/npc-portraits/v1731/';
 const SPECS=[
  ['001_bannerless_knight_young_man.webp','M','young'],['002_bannerless_knight_young_man.webp','M','young'],
  ['003_bannerless_knight_young_man.webp','M','young'],['004_bannerless_knight_young_man.webp','M','young'],
  ['005_bannerless_knight_older_man.webp','M','older'],['006_bannerless_knight_older_man.webp','M','older'],
  ['007_bannerless_knight_older_man.webp','M','older'],['008_bannerless_knight_older_man.webp','M','older'],
  ['009_bannerless_knight_young_woman.webp','F','young'],['010_bannerless_knight_young_woman.webp','F','young'],
  ['011_bannerless_knight_older_woman.webp','F','older'],['012_bannerless_knight_older_woman.webp','F','older']
 ];
 const living=window.AetherionV173LivingPortraits,identity=window.AetherionV168Portraits,integrity=window.AetherionV167Integrity;
 const generated=SPECS.map((row,index)=>Object.freeze({id:`v1731_${String(index+1).padStart(3,'0')}`,number:index+1,file:row[0],path:ROOT+row[0],role:'Bannerless Knight',aliases:Object.freeze(['Lesser Knight','Company Captain','Knight']),gender:row[1],ageBand:row[2],race:'human',bannerless:true,military:true,fullBody:true,generated:true}));
 const inherited=(living?.registry||[]).filter(row=>String(row.role).toLowerCase()==='bannerless knight').map(row=>Object.freeze({...row,fullBody:true,generated:false}));
 const registry=Object.freeze([...inherited,...generated]),byPath=new Map(registry.map(row=>[row.path,row]));
 const runtime={migrations:0,assigned:0,preserved:0,protected:0,renderCalls:0,renderRepairs:0,recoveryAttempts:0,mutationChecks:0,legacyUpgradeSkips:0,commerceEnsureSkips:0,lastAudit:null};
 const clean=value=>String(value??'').trim(),norm=value=>clean(value).toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const hash=value=>{let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
 const html=value=>typeof esc==='function'?esc(clean(value)):clean(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const js=value=>clean(value).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
 function liveState(){try{return typeof S!=='undefined'?S:null}catch(_){return null}}
 function currentPath(p){return clean(p?.portrait||p?.img)}
 function genderOf(p){return identity?.genderOf?.(p)||(p?.gender==='F'?'F':'M')}
 function visualAge(p){return identity?.visualAge?.(p)||Math.max(0,+p?.age||0)}
 function ageBandOf(p){return visualAge(p)<40?'young':'older'}
 function human(p){let race=identity?.raceOf?.(p)||norm(p?.race||p?.species||'human');return !race||race==='human'}
 function serviceKnight(p){
  if(!p||!human(p)||p.bannerless===false||p.dominusConverted||/dominus/.test(norm(p.faction)))return false;
  let role=norm(p.role);return role==='lesser knight'||role==='company captain'||role==='bannerless knight';
 }
 function authored(p,path){
  if(p?.canonical||p?.uniqueKey||p?.customCompanion||p?.v38Thrall)return true;
  if(byPath.has(path)||/custom\/npc-portraits\/(?:v168|v173)\//i.test(path)||/assets\/(?:dynasty|units)\//i.test(path)||/assets\/bannerless_knight\.jpg$/i.test(path))return false;
  return /^(?:data:|blob:|user\/|custom\/|https?:)/i.test(path);
 }
 function poolFor(p){let gender=genderOf(p),band=ageBandOf(p);return registry.filter(row=>row.gender===gender&&row.ageBand===band)}
 function compatible(p,row){return !!(p&&row&&serviceKnight(p)&&genderOf(p)===row.gender&&ageBandOf(p)===row.ageBand&&row.fullBody)}
 function setPortrait(p,path){let before=currentPath(p);if(!p||!path||before===path)return false;p.portrait=path;if(Object.prototype.hasOwnProperty.call(p,'img'))p.img=path;return true}
 function markService(p){if(serviceKnight(p)&&p.bannerless==null)p.bannerless=true;return p}
 function assignOne(p){
  if(!p||typeof p!=='object')return p;markService(p);if(!serviceKnight(p))return p;
  let path=currentPath(p);if(authored(p,path)){runtime.protected++;return p}
  let current=byPath.get(path),pool=poolFor(p);if(current&&compatible(p,current)){p.portraitRole='Bannerless Knight';p.v1731KnightPortrait=VERSION;runtime.preserved++;return p}
  if(!pool.length)return p;let row=pool[hash(`${p.id||''}|${p.name||''}|${p.role||''}`)%pool.length];
  if(setPortrait(p,row.path))runtime.assigned++;else runtime.preserved++;p.portraitRole='Bannerless Knight';p.v1731KnightPortrait=VERSION;return p;
 }
 function balance(rows){
  for(const p of rows)markService(p);
  let candidates=rows.filter(serviceKnight).filter(p=>{if(authored(p,currentPath(p))){runtime.protected++;return false}return true});
  for(const key of ['M:young','M:older','F:young','F:older']){
   let [gender,band]=key.split(':'),people=candidates.filter(p=>genderOf(p)===gender&&ageBandOf(p)===band).sort((a,b)=>clean(a.id||a.name).localeCompare(clean(b.id||b.name))),pool=registry.filter(row=>row.gender===gender&&row.ageBand===band);
   if(!pool.length)continue;let start=hash(`aetherion|${key}|${people.length}`)%pool.length;
   for(let i=0;i<people.length;i++){let p=people[i],row=pool[(start+i)%pool.length];if(setPortrait(p,row.path))runtime.assigned++;else runtime.preserved++;p.portraitRole='Bannerless Knight';p.v1731KnightPortrait=VERSION}
  }
  return rows;
 }
 function collect(state){let out=[],seen=new WeakSet(),add=rows=>{for(const p of rows||[])if(p&&typeof p==='object'&&!seen.has(p)){seen.add(p);out.push(p)}};add(state?.people);add(state?.court?.prisoners);for(const rows of Object.values(state?.world?.permanentNPCs||{}))add(rows);for(const rows of Object.values(state?.world?.laborMarkets||{}))add(rows);for(const town of Object.values(state?.v15?.settlements||{}))add(town?.roster);for(const town of Object.values(state?.v17?.settlements||{}))add(town?.bonded);add(state?.v23?.surgeons);add(state?.v28?.laborPool);return out}
 function stats(rows){let counts=new Map();for(const p of rows.filter(serviceKnight)){let path=currentPath(p);if(byPath.has(path))counts.set(path,(counts.get(path)||0)+1)}return{roster:rows.filter(serviceKnight).length,unique:counts.size,maxReuse:Math.max(0,...counts.values())}}
 function shopSignature(state){return(state?.v27?.shops||[]).map(shop=>`${shop.id||''}@${shop.location||''}`).sort().join('|')}
 function repairState(state=liveState()){
  if(!state?.world)return state;state.meta??={};living?.ensureState?.(state);if(state.meta.v1731KnightDiversity?.version===VERSION)return state;
  balance(state.people||[]);let party=new Set(state.people||[]);for(const p of collect(state))if(!party.has(p))assignOne(p);
  let result=stats(state.people||[]);state.meta.v1731KnightDiversity={version:VERSION,policy:POLICY,newFullBodyPortraits:generated.length,totalKnightPortraits:registry.length,savePreserved:true,contentRemoved:0,redrawWorldScans:false,shopSignature:shopSignature(state),...result};runtime.migrations++;return state;
 }
 function clearKnightArt(p){if(p?.v1731KnightPortrait&&byPath.has(currentPath(p))){p.portrait=null;if(Object.prototype.hasOwnProperty.call(p,'img'))p.img=null;delete p.v1731KnightPortrait;delete p.portraitRole;living?.repairPerson?.(p)}}
 function afterMutation(p){runtime.mutationChecks++;if(serviceKnight(p))assignOne(p);else clearKnightArt(p);return p}
 function installFactories(){for(const name of ['mkPerson','v15MakeCandidate']){let base=globalThis[name];if(typeof base==='function')globalThis[name]=function(...args){return assignOne(base.apply(this,args))}}}
 function installUpgradeGuards(){
  if(typeof v10UpgradeState==='function'){let base=v10UpgradeState;v10UpgradeState=function(state,...args){if(state?.meta?.v1731KnightDiversity?.version===VERSION){runtime.legacyUpgradeSkips++;return state}return base.call(this,state,...args)}}
  if(typeof v12UpgradeState==='function'){let base=v12UpgradeState;v12UpgradeState=function(state,...args){if(state?.meta?.v1731KnightDiversity?.version===VERSION){let alexus=state.people?.find(p=>p.name==='Lady Alexus Dominus');if(alexus?.order==='With Party'&&!state.player?.soloTravel)alexus.location=state.world?.location;runtime.legacyUpgradeSkips++;return state}return base.call(this,state,...args)}}
  if(typeof v14UpgradeState==='function'){let base=v14UpgradeState;v14UpgradeState=function(state,...args){if(state?.meta?.v1731KnightDiversity?.version===VERSION){runtime.legacyUpgradeSkips++;return state}return base.call(this,state,...args)}}
  if(typeof v55Ensure==='function'){let base=v55Ensure;v55Ensure=function(state=liveState(),...args){let marker=state?.meta?.v1731KnightDiversity,signature=shopSignature(state);if(marker?.version===VERSION&&state?.v55&&marker.shopSignature===signature){runtime.commerceEnsureSkips++;return state.v55}let out=base.call(this,state,...args);if(marker?.version===VERSION)marker.shopSignature=shopSignature(state);return out}}
 }
 function installMutations(){
  if(typeof setRank==='function'){let base=setRank;setRank=function(id,...args){let out=base.call(this,id,...args),p=liveState()?.people?.find(row=>row.id===id);if(p)afterMutation(p);return out}}
  if(typeof setFormationRole==='function'){let base=setFormationRole;setFormationRole=function(id,...args){let out=base.call(this,id,...args),p=liveState()?.people?.find(row=>row.id===id);if(p)afterMutation(p);return out}}
  if(typeof v15Convert==='function'){let base=v15Convert;v15Convert=function(id,...args){let out=base.call(this,id,...args),p=liveState()?.people?.find(row=>row.id===id);if(p)afterMutation(p);return out}}
  if(typeof v16Swear==='function'){let base=v16Swear;v16Swear=function(id,...args){let out=base.call(this,id,...args),p=liveState()?.people?.find(row=>row.id===id);if(p)afterMutation(p);return out}}
  if(typeof v15Hire==='function'){let base=v15Hire;v15Hire=function(id,...args){let out=base.call(this,id,...args),p=liveState()?.people?.find(row=>row.id===id);if(p)afterMutation(p);return out}}
 }
 function imageTag(pic,name){let tag=typeof entityImage==='function'?entityImage(pic,name,'v1731-person-card'):`<img class="v1731-person-card" src="${html(pic)}" alt="${html(name)}" loading="lazy">`;if(!/\bdecoding=/.test(tag))tag=tag.replace(/\sloading="lazy"/,' loading="lazy" decoding="async" fetchpriority="low"');return tag}
 function stageOf(p){return integrity?.lifeStage?.(+p?.age||0,identity?.raceOf?.(p))||(+p?.age<18?'Young':'Adult')}
 function genderLabel(p){return integrity?.genderLabel?.(p)||(genderOf(p)==='F'?'Female':'Male')}
 function moraleLabel(value){return integrity?.moraleLabel?.(value)||`${Math.round(+value||0)}/100`}
 function fastPeopleCards(list){runtime.renderCalls++;return`<div class="entityList">${(list||[]).map(p=>{let pic=currentPath(p)||(typeof ASSET==='object'?ASSET.rose:'');return`<div class="entity ${p.alive===false?'dead':''}" onclick="openPerson('${js(p.id)}')">${imageTag(pic,p.name)}<div><h4>${html(p.name)}</h4><p>${html(p.role)} · Rank: ${html(p.rank||'Civilian')}</p><p>${genderLabel(p)} · age ${Math.round(+p.age||0)} · ${html(stageOf(p))}</p><p>HP ${Math.round(+p.hp||0)}/${Math.round(+p.maxHp||0)} · Morale ${moraleLabel(p.morale)} · Loyalty ${Math.round(+p.loyalty||0)}</p><p>Order: ${html(p.order)}</p></div></div>`}).join('')}</div>`}
 function installViews(){if(typeof peopleCards==='function')peopleCards=fastPeopleCards}
 function installStateHooks(){if(typeof makeStartState==='function'){let base=makeStartState;makeStartState=function(...args){return repairState(base.apply(this,args))}}if(typeof migrateState==='function'){let base=migrateState;migrateState=function(state,...args){let out=base.call(this,state,...args);return out?.meta?.v1731KnightDiversity?.version===VERSION?out:repairState(out)}}}
 function installStyles(){if(typeof document==='undefined'||document.getElementById?.('aetherion-v1731-knights'))return;let style=document.createElement('style');style.id='aetherion-v1731-knights';style.textContent='.entityList>.entity{grid-template-columns:76px minmax(0,1fr);align-items:start;content-visibility:auto;contain-intrinsic-size:auto 132px}.entityList>.entity img[src*="custom/npc-portraits/"]{width:76px!important;height:114px!important;object-fit:contain!important;object-position:center!important;background:#080608}';document.head?.appendChild(style)}
 function installRecovery(){if(typeof document==='undefined'||typeof document.addEventListener!=='function')return;document.addEventListener('error',event=>{let node=event?.target,raw=node?.getAttribute?.('src')||node?.src||'';if(String(node?.tagName||'').toUpperCase()!=='IMG'||!raw.includes('/custom/npc-portraits/v1731/')||node.dataset?.v1731Recovered)return;if(node.dataset)node.dataset.v1731Recovered='1';let row=[...byPath.values()].find(item=>raw.endsWith('/'+item.file)),fallback=inherited.find(item=>item.gender===row?.gender&&item.ageBand===row?.ageBand);if(!fallback)return;runtime.recoveryAttempts++;event.preventDefault?.();event.stopImmediatePropagation?.();node.onerror=null;node.src=fallback.path},true)}
 function auditState(state=liveState()){
  let rows=(state?.people||[]).filter(serviceKnight),wrong=[],headshots=[],protectedRows=[];for(const p of rows){let path=currentPath(p),row=byPath.get(path);if(authored(p,path)){protectedRows.push({id:p.id,name:p.name,path});continue}if(!row||!compatible(p,row))wrong.push({id:p.id,name:p.name,gender:genderOf(p),age:p.age,path,reason:row?'mismatch':'not-full-body-knight-art'});if(/assets\/(?:dynasty|units)\//i.test(path))headshots.push({id:p.id,name:p.name,path})}let result={version:VERSION,newPortraits:generated.length,pool:registry.length,...stats(state?.people||[]),wrong,headshots,protected:protectedRows};runtime.lastAudit=result;return result;
 }
 installUpgradeGuards();installMutations();installViews();installStyles();installRecovery();
 try{let state=liveState();if(state?.world&&state.meta?.v1731KnightDiversity?.version!==VERSION){repairState(state);if(typeof persist==='function')persist(false)}}catch(error){console.warn('[Aetherion 1.73.1 knight migration]',error)}
 window.AetherionV1731KnightDiversity=Object.freeze({version:VERSION,policy:POLICY,registry,generated,runtime,compatible,serviceKnight,assignOne,balance,repairState,auditState});
})();
