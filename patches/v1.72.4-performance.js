/* Aetherion Reforged v1.72.4 — bounded migration and long-list rendering. */
'use strict';
(()=>{
 const VERSION='1.72.4';
 const processed=typeof WeakSet==='function'?new WeakSet():null;
 const runtime={migrationCalls:0,migrationSkips:0,tradeEnsureSkips:0,tradeWorkerSkips:0,tradeStockSkips:0,tradeShopSkips:0,observerDisconnected:false,wrapped:false,tradeWrapped:false};

 if(window.AetherionPerformanceV174?.version===VERSION)return;

 function remember(state){
  if(state&&typeof state==='object'){
   state.meta??={};state.meta.v174Migrated=VERSION;processed?.add?.(state);
  }
  return state;
 }
 function wrapMigrations(){
  if(runtime.wrapped)return;
  if(typeof migrateState==='function'){
   const fullMigrate=migrateState;
   migrateState=function(state,...args){
    runtime.migrationCalls++;
    if(state&&typeof state==='object'&&(processed?.has?.(state)||state.meta?.v174Migrated===VERSION)){
     processed?.add?.(state);
     runtime.migrationSkips++;
     return state;
    }
    return remember(fullMigrate.call(this,state,...args));
   };
  }
  if(typeof makeStartState==='function'){
   const fullStart=makeStartState;
   makeStartState=function(...args){return remember(fullStart.apply(this,args))};
  }
  runtime.wrapped=true;
 }
 function removeRedundantObserver(){
  try{
   const legacy=window.AetherionV164Integrity?.runtime;
   if(legacy?.observer){legacy.observer.disconnect?.();legacy.observer=null;runtime.observerDisconnected=true}
  }catch(error){console.warn?.('[Aetherion 1.72.4 observer cleanup]',error)}
 }
 function wrapTradeEnsure(){
  if(runtime.tradeWrapped||typeof v69Ensure!=='function')return;
  const seededEnsure=v69Ensure;
  v69Ensure=function(state=typeof S!=='undefined'?S:null,...args){
   if(state&&typeof state==='object'&&state.v69&&state.meta?.v174Migrated===VERSION){
    runtime.tradeEnsureSkips++;
    return state.v69;
   }
   return seededEnsure.call(this,state,...args);
  };
  if(typeof v69Worker==='function'){
   const seededWorker=v69Worker;
   v69Worker=function(key,...args){
    const state=typeof S!=='undefined'?S:null,rows=state?.world?.permanentNPCs?.[state.world?.location];
    if(state?.meta?.v174Migrated===VERSION&&Array.isArray(rows)){
     runtime.tradeWorkerSkips++;
     return rows.find(person=>person?.alive&&person.shopKey===key&&!person.ownedShopId)||null;
    }
    return seededWorker.call(this,key,...args);
   };
  }
  if(typeof v69StockCount==='function'){
   const seededStockCount=v69StockCount;
   v69StockCount=function(key,...args){
    const state=typeof S!=='undefined'?S:null,stock=state?.v70?.shops?.[state.world?.location]?.[key]?.stock;
    if(state?.meta?.v174Migrated===VERSION&&Array.isArray(stock)){
     runtime.tradeStockSkips++;
     return stock.reduce((count,row)=>count+(Number(row?.qty)>0?1:0),0);
    }
    return seededStockCount.call(this,key,...args);
   };
  }
  if(typeof v70Shop==='function'){
   const seededShop=v70Shop;
   v70Shop=function(key,...args){
    const state=typeof S!=='undefined'?S:null,shop=state?.v70?.shops?.[state.world?.location]?.[key];
    if(state?.meta?.v174Migrated===VERSION&&shop){runtime.tradeShopSkips++;return shop}
    return seededShop.call(this,key,...args);
   };
  }
  runtime.tradeWrapped=true;
 }
 function installStyles(){
  if(document.getElementById?.('aetherion-v174-performance-style'))return;
  const style=document.createElement('style');style.id='aetherion-v174-performance-style';style.textContent=`
   .recipeCard,.workerPlate,.dynastyMember,.entityList>.entity{content-visibility:auto;contain-intrinsic-size:auto 150px}
   .recipeCard img,.workerPlate img,.dynastyMember img,.entityList>.entity img{decoding:async}
  `;(document.head||document.documentElement).appendChild(style);
 }

 wrapMigrations();wrapTradeEnsure();removeRedundantObserver();installStyles();
 window.AetherionPerformanceV174=Object.freeze({
  version:VERSION,
  markMigrated:remember,
  state:()=>({...runtime})
 });
})();
