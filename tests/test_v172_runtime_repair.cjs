'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('patches/v1.72.0-runtime-repair.js','utf8');
const saved=JSON.stringify({awakened:false,marker:'timeline'});
const localStorage={getItem:key=>key==='aetherion_exiled_v03_autosave'?saved:null};
const listeners={};
const frames=[];
let renderCalls=0,startCalls=0,mountCalls=0,removeCalls=0,migrateCalls=0;
let installedStyle=null;
const launcher={remove(){removeCalls++}};
const document={
 readyState:'complete',documentElement:{},head:{appendChild(node){installedStyle=node}},
 getElementById(id){if(id==='app')return{};if(id==='aetherion-update-launcher')return launcher;return null},
 createElement(tag){return{tagName:tag,id:'',textContent:'',style:{},appendChild(){}}},
 addEventListener(type,handler){listeners[type]=handler}
};
const context={
 window:null,document,localStorage,console,
 S:{awakened:true,marker:'old'},currentTab:'equipment',
 migrateState(value){migrateCalls++;return{...value,migrated:true}},
 render(){renderCalls++},renderStart(){startCalls++},continueGame(){throw Error('old continue ran')},
 flushPersist(){},stopSpeech(){},stopMusic(){},closeModal(){},
 requestAnimationFrame(fn){frames.push(fn);return frames.length},setTimeout(fn){frames.push(fn);return frames.length},
 AetherionUpdateCenterV172:{mount(){mountCalls++}}
};
context.window=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:'v1.72.0-runtime-repair.js'});

assert.equal(context.AetherionRuntimeRepairV172.version,'1.72.0');
assert.equal(startCalls,1,'an existing timeline must open at the title menu');
assert.equal(typeof context.continueGame,'function');
assert.match(installedStyle.textContent,/-webkit-tap-highlight-color:transparent/);
assert.match(installedStyle.textContent,/#aetherion-update-launcher\{display:none/);
assert.doesNotMatch(source,/new MutationObserver/);

let prevented=0,stopped=0;
const button={textContent:'CONTINUE'};
listeners.click({
 target:{closest(selector){return selector==='.startBtns button'?button:null}},
 preventDefault(){prevented++},stopPropagation(){stopped++},stopImmediatePropagation(){stopped++}
});
assert.equal(prevented,1);
assert.equal(stopped,2);
assert.equal(migrateCalls,1);
assert.equal(context.S.marker,'timeline');
assert.equal(context.S.migrated,true);
assert.equal(context.S.awakened,true,'Continue must activate an older timeline missing its awakened flag');
assert.equal(context.currentTab,'story');
assert.equal(renderCalls,1,'Continue must render the game exactly once');

while(frames.length)frames.shift()();
assert(mountCalls>=1,'menu update paths were not mounted after rendering');
assert(removeCalls>=1,'the obsolete floating update control was not removed');
console.log('v1.72.0 runtime repair: Continue, menu paths, tap color, and scheduled mounting passed');
