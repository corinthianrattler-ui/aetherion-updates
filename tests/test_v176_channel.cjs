'use strict';
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const vm=require('node:vm');

let feed=null,capture=null;
const location={href:'https://appassets.androidplatform.net/assets/game/index.html'};
const document={addEventListener(type,handler,useCapture){if(type==='click'&&useCapture)capture=handler}};
const window={AetherionUpdater:{receiveChannel(value){feed=value}},location};
vm.runInNewContext(fs.readFileSync('channel.js','utf8'),{window,document,location,globalThis:window},{filename:'channel.js'});
assert(feed,'channel did not deliver a release');
assert.equal(feed.schema,2);assert.equal(feed.channel,'stable');assert.equal(feed.release.version,'1.72.6');
assert.equal(feed.release.build,194,'the staged gameplay patch must remain installable by Android build 194');
assert.equal(feed.release.minimumBundled,'1.72.5');assert.equal(feed.release.requiresApk,false);assert.deepEqual(Object.keys(feed.release.assets),[]);
assert.equal(feed.release.modules.length,1);const patchModule=feed.release.modules[0];assert.equal(patchModule.id,'v176-gameplay-repair');assert.equal(patchModule.sha256,crypto.createHash('sha256').update(patchModule.source).digest('hex'));assert.equal(patchModule.source,fs.readFileSync('patches/v1.72.6-gameplay-repair.js','utf8'));assert.match(patchModule.source,/const VERSION='1\.72\.6'/);assert.match(patchModule.source,/quartermasterDestination/);assert.match(patchModule.source,/@media \(orientation:portrait\)/);
const manifest=JSON.parse(fs.readFileSync('manifest.json','utf8'));assert.equal(manifest.latest.game_version,'1.72.6');assert.equal(manifest.latest.android_version_code,195);assert.equal(manifest.android_apk.version,'1.72.6');assert.equal(manifest.android_apk.version_code,195);assert.equal(feed.release.apkUrl,manifest.android_apk.url);assert.equal(feed.release.apkSha256,manifest.android_apk.sha256);assert.equal(feed.release.apkSize,manifest.android_apk.size);assert.match(feed.release.apkUrl,/v1\.72\.6\/Aetherion_Reforged_v1\.72\.6_GAMEPLAY_REPAIR_FULL\.apk$/);assert(fs.statSync('channel.js').size<=100000);
assert(feed.release.notes.some(note=>note.includes('Carried Inventory')));assert(feed.release.notes.some(note=>note.includes('28 mesh sections')));assert(feed.release.notes.some(note=>note.includes('inside v1.72.5')));
assert.equal(typeof capture,'function');let prevented=0,stopped=0;capture({target:{closest(){return{textContent:'DOWNLOAD FULL APK'}}},preventDefault(){prevented++},stopPropagation(){stopped++},stopImmediatePropagation(){stopped++}});assert.equal(location.href,feed.release.apkUrl);assert.equal(prevented,1);assert.equal(stopped,2);

function storage(){const rows=new Map();return{getItem:key=>rows.has(key)?rows.get(key):null,setItem:(key,value)=>rows.set(key,String(value)),removeItem:key=>rows.delete(key)}}
function element(){return{children:[],dataset:{},style:{},append(...items){this.children.push(...items)},appendChild(item){this.children.push(item)},remove(){},replaceChildren(...items){this.children=[...items]},addEventListener(){},setAttribute(){},querySelector(){return null},querySelectorAll(){return[]}}}
const localStorage=storage(),sessionStorage=storage(),doc={readyState:'loading',baseURI:'file:///android_asset/game/index.html',head:element(),body:element(),documentElement:element(),createElement:element,createTextNode:value=>({textContent:String(value)}),getElementById(){return null},querySelectorAll(){return[]},addEventListener(){}};
const updaterWindow={document:doc,localStorage,sessionStorage,location:{reload(){}},addEventListener(){},requestAnimationFrame:callback=>setTimeout(callback,0),setTimeout,clearTimeout,confirm:()=>true};Object.assign(updaterWindow,{window:updaterWindow,globalThis:updaterWindow,TextEncoder,TextDecoder,Uint8Array,Uint32Array,DataView,URL,crypto:crypto.webcrypto,atob:value=>Buffer.from(String(value),'base64').toString('binary')});
const context=vm.createContext({...updaterWindow,window:updaterWindow,globalThis:updaterWindow,document:doc,localStorage,sessionStorage,location:updaterWindow.location,MutationObserver:class{observe(){}},console});
vm.runInContext(fs.readFileSync('patches/v1.72.5-safe-updater.js','utf8'),context,{filename:'v1.72.5-safe-updater.js'});
(async()=>{const verified=await updaterWindow.AetherionUpdater._test.verifyRelease(feed.release);assert.equal(verified.version,'1.72.6');assert.equal(verified.build,194);const staged=updaterWindow.AetherionUpdater.stage(verified);assert.equal(staged.version,'1.72.6');assert.equal(updaterWindow.AetherionUpdater.state().staged,'1.72.6');console.log('v1.72.6 channel: build-194 in-game staging, build-195 full APK metadata, exact source hash, and APK handoff passed')})().catch(error=>{console.error(error);process.exitCode=1});
