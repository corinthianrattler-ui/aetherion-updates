'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('patches/v1.72.1-character-loader-hotfix.js','utf8');
let scheduled=0;
const sync=async()=>true;
const schedule=()=>{scheduled++;return scheduled};
const context={
 console,window:null,setTimeout(){throw Error('the live v80 hook should connect immediately')},
 v80Sync(){return'legacy-sync'},v80ScheduleSync(){return'legacy-schedule'},
 AetherionCharacterModelsV172:{sync,schedule,playerKind:()=> 'armored'}
};
context.window=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:'v1.72.1-character-loader-hotfix.js'});

assert.equal(context.v80Sync,sync);
assert.equal(context.v80ScheduleSync,schedule);
assert.equal(scheduled,1);
assert.deepEqual(
 JSON.parse(JSON.stringify(context.AetherionCharacterLoaderHotfixV1721.state())),
 {connected:true,lastError:null}
);
console.log('v1.72.1 character loader: live v80 wiring succeeds without historical v97/v98 globals');
