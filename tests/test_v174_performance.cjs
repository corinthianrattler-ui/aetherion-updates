'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('patches/v1.72.4-performance.js','utf8');
let fullCalls=0,commerceCalls=0,observerDisconnects=0;
const head={appendChild(node){this.last=node}};
const context={
 window:null,console,WeakSet,
 S:{world:{location:'Corvinus Keep',permanentNPCs:{'Corvinus Keep':[]}},meta:{v174Migrated:'1.72.4'},v69:{activeCounter:null},v70:{shops:{'Corvinus Keep':{smith:{stock:[{qty:2},{qty:0},{qty:1}]}}}}},
 migrateState(state){fullCalls++;state.migrated=(state.migrated||0)+1;return state},
 makeStartState(){fullCalls++;return{fresh:true,v69:{activeCounter:null}}},
 v69Ensure(state){commerceCalls++;state.v69??={activeCounter:null};return state.v69},
 v69Worker(){commerceCalls++;return null},
 v69StockCount(){commerceCalls++;return 99},
 v70Shop(){commerceCalls++;return null},
 document:{head,documentElement:head,getElementById(){return null},createElement(){return{style:{},textContent:'',id:''}}},
 AetherionV164Integrity:{runtime:{observer:{disconnect(){observerDisconnects++}}}}
};
context.window=context;vm.createContext(context);vm.runInContext(source,context,{filename:'v1.72.4-performance.js'});

const saved={value:1};
assert.equal(context.migrateState(saved),saved);
assert.equal(context.migrateState(saved),saved);
assert.equal(saved.migrated,1);
const fresh=context.makeStartState();
assert.equal(context.migrateState(fresh),fresh);
const reloaded=JSON.parse(JSON.stringify(fresh));
assert.equal(context.migrateState(reloaded),reloaded);
context.v69Ensure(reloaded);
assert.equal(commerceCalls,0,'a fully migrated state should not reseed all commerce during Trade rendering');
const legacy={v69:{activeCounter:null}};context.v69Ensure(legacy);
assert.equal(commerceCalls,1,'an unmarked state must retain the full commerce repair path');
assert.equal(context.v69StockCount('smith'),2,'current shop stock should be counted without catalog reconstruction');
assert.equal(context.v70Shop('smith'),context.S.v70.shops['Corvinus Keep'].smith,'current shop should be returned without catalog reconstruction');
assert.equal(context.v69Worker('smith'),null,'current worker lookup should use the populated location roster');
assert.equal(commerceCalls,1,'current Trade rendering should not rebuild verified commerce data');
assert.equal(fullCalls,2,'freshly built state should not be migrated a second time during render');
assert.equal(observerDisconnects,1);
assert.equal(context.AetherionV164Integrity.runtime.observer,null);
assert.equal(context.AetherionPerformanceV174.state().migrationSkips,3);
assert.equal(context.AetherionPerformanceV174.state().tradeEnsureSkips,1);
assert.equal(context.AetherionPerformanceV174.state().tradeWorkerSkips,1);
assert.equal(context.AetherionPerformanceV174.state().tradeStockSkips,1);
assert.equal(context.AetherionPerformanceV174.state().tradeShopSkips,1);
assert.match(head.last.textContent,/content-visibility:auto/);
console.log('v1.72.4 performance: repeat migrations and redundant page observer removed');
