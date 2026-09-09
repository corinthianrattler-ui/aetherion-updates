'use strict';
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const vm=require('node:vm');

let feed=null;
const handoffDocument={addEventListener(){}};
const handoffWindow={AetherionUpdater:{receiveChannel(value){feed=value}}};
vm.runInNewContext(fs.readFileSync('channel.js','utf8'),{window:handoffWindow,document:handoffDocument,globalThis:handoffWindow,location:{href:'file:///android_asset/game/index.html'}},{filename:'channel.js'});
assert(feed,'channel did not deliver a release');
assert.equal(feed.schema,2);assert.equal(feed.channel,'stable');assert.equal(feed.release.version,'1.72.7');
assert.equal(feed.release.build,194,'the scroll-only patch must remain stageable by builds 194 and 195');
assert.equal(feed.release.minimumBundled,'1.72.5');assert.equal(feed.release.requiresApk,false);assert.deepEqual(Object.keys(feed.release.assets),[]);
assert.equal(feed.release.modules.length,1);const patchModule=feed.release.modules[0];assert.equal(patchModule.id,'v177-scroll-repair');
assert.equal(patchModule.source,fs.readFileSync('patches/v1.72.7-scroll-repair.js','utf8'));
assert.equal(patchModule.sha256,crypto.createHash('sha256').update(patchModule.source).digest('hex'));
assert.match(patchModule.source,/const VERSION='1\.72\.7'/);assert.match(patchModule.source,/grid-template-rows:auto auto auto/);
const manifest=JSON.parse(fs.readFileSync('manifest.json','utf8'));
assert.equal(manifest.latest.game_version,'1.72.6','the full APK remains the already-verified build during the phone confirmation pass');
assert.equal(feed.release.apkUrl,manifest.android_apk.url);assert.equal(feed.release.apkSha256,manifest.android_apk.sha256);assert.equal(feed.release.apkSize,manifest.android_apk.size);
assert(feed.release.notes.some(note=>note.includes('vertical touch scrolling')));assert(feed.release.notes.some(note=>note.includes('No art, models, equipment, trade data, saves, or gameplay rules')));
assert(fs.statSync('channel.js').size<=100000);

function storage(){const rows=new Map();return{getItem:key=>rows.has(key)?rows.get(key):null,setItem:(key,value)=>rows.set(key,String(value)),removeItem:key=>rows.delete(key)}}
function element(){return{children:[],dataset:{},style:{},append(...items){this.children.push(...items)},appendChild(item){this.children.push(item)},remove(){},replaceChildren(...items){this.children=[...items]},addEventListener(){},setAttribute(){},querySelector(){return null},querySelectorAll(){return[]}}}
async function stageWith(path,expectedBundled){
 const localStorage=storage(),sessionStorage=storage(),document={readyState:'loading',baseURI:'file:///android_asset/game/index.html',head:element(),body:element(),documentElement:element(),createElement:element,createTextNode:value=>({textContent:String(value)}),getElementById(){return null},querySelectorAll(){return[]},addEventListener(){}};
 const window={document,localStorage,sessionStorage,location:{reload(){}},addEventListener(){},requestAnimationFrame:callback=>setTimeout(callback,0),setTimeout,clearTimeout,confirm:()=>true};
 Object.assign(window,{window,globalThis:window,TextEncoder,TextDecoder,Uint8Array,Uint32Array,DataView,URL,crypto:crypto.webcrypto,atob:value=>Buffer.from(String(value),'base64').toString('binary')});
 const context=vm.createContext({...window,window,globalThis:window,document,localStorage,sessionStorage,location:window.location,MutationObserver:class{observe(){}},console});
 vm.runInContext(fs.readFileSync(path,'utf8'),context,{filename:path});
 assert.equal(window.AetherionUpdater.bundledVersion,expectedBundled);
 const verified=await window.AetherionUpdater._test.verifyRelease(feed.release);assert.equal(verified.version,'1.72.7');assert.equal(verified.build,194);
 const staged=window.AetherionUpdater.stage(verified);assert.equal(staged.version,'1.72.7');assert.equal(window.AetherionUpdater.state().staged,'1.72.7');
}

(async()=>{
 await stageWith('patches/v1.72.5-safe-updater.js','1.72.5');
 await stageWith('patches/v1.72.6-safe-updater.js','1.72.6');
 console.log('v1.72.7 channel: exact scroll-only source stages through both v1.72.5 and v1.72.6 updaters without an APK requirement');
})().catch(error=>{console.error(error);process.exitCode=1});
