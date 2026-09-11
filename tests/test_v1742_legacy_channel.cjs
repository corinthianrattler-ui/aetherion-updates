'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

let feed = null;
const document = {addEventListener(){}};
const window = {AetherionUpdater:{receiveChannel(value){feed=value}}};
vm.runInNewContext(fs.readFileSync('channel.js','utf8'),{window,document,globalThis:window,location:{href:'file:///android_asset/game/index.html'}},{filename:'channel.js'});
assert(feed,'channel did not deliver a release');
assert.equal(feed.schema,2);
assert.equal(feed.channel,'stable');
assert.equal(feed.release.version,'1.74.2');
assert.equal(feed.release.build,197);
assert.equal(feed.release.minimumBundled,'1.72.6');
assert.equal(feed.release.requiresApk,true);
assert.deepEqual(Array.from(feed.release.modules),[],'full rebuild must not stack another runtime patch');
assert.deepEqual(Object.keys(feed.release.assets),[],'full rebuild must not stage loose legacy assets');
assert.equal(feed.release.apkSha256,'81d0d1d3fdad0fd06e3a37a25e3d130db336faa673b46188df8cc06de4f945dc');
assert.equal(feed.release.apkSize,519356685);
assert(feed.release.apkUrl.endsWith('/v1.74.2/Aetherion_Reforged_v1.74.2_FULLBODY_BUGFIX_FULL.apk'));
assert(feed.release.notes.some(note=>note.includes('preserves every voice')));
assert(fs.statSync('channel.js').size<=100000);

function storage(){const rows=new Map();return{getItem:key=>rows.has(key)?rows.get(key):null,setItem:(key,value)=>rows.set(key,String(value)),removeItem:key=>rows.delete(key)}}
function element(){return{children:[],dataset:{},style:{},append(...items){this.children.push(...items)},appendChild(item){this.children.push(item)},remove(){},replaceChildren(...items){this.children=[...items]},addEventListener(){},setAttribute(){},querySelector(){return null},querySelectorAll(){return[]}}}
(async()=>{
 const localStorage=storage(),sessionStorage=storage();
 const updaterDocument={readyState:'loading',baseURI:'file:///android_asset/game/index.html',head:element(),body:element(),documentElement:element(),createElement:element,createTextNode:value=>({textContent:String(value)}),getElementById(){return null},querySelectorAll(){return[]},addEventListener(){}};
 const updaterWindow={document:updaterDocument,localStorage,sessionStorage,location:{reload(){}},addEventListener(){},requestAnimationFrame:callback=>setTimeout(callback,0),setTimeout,clearTimeout,confirm:()=>true};
 Object.assign(updaterWindow,{window:updaterWindow,globalThis:updaterWindow,TextEncoder,TextDecoder,Uint8Array,Uint32Array,DataView,URL,crypto:require('node:crypto').webcrypto,atob:value=>Buffer.from(String(value),'base64').toString('binary')});
 const context=vm.createContext({...updaterWindow,window:updaterWindow,globalThis:updaterWindow,document:updaterDocument,localStorage,sessionStorage,location:updaterWindow.location,MutationObserver:class{observe(){}},console});
 vm.runInContext(fs.readFileSync('patches/v1.72.6-safe-updater.js','utf8'),context,{filename:'v1.72.6-safe-updater.js'});
 const verified=await updaterWindow.AetherionUpdater._test.verifyRelease(feed.release);
 assert.equal(verified.version,'1.74.2');
 assert.equal(verified.build,197);
 assert.equal(verified.requiresApk,true);
 console.log('legacy build-195 updater accepts the full-APK v1.74.2 handoff without staging another patch');
})().catch(error=>{console.error(error);process.exitCode=1});
