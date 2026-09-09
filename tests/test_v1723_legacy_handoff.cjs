'use strict';
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const vm=require('node:vm');

function storage(){
 const rows=new Map();
 return{getItem:key=>rows.has(key)?rows.get(key):null,setItem:(key,value)=>rows.set(key,String(value)),removeItem:key=>rows.delete(key)};
}
function element(tag){
 return{tagName:String(tag).toUpperCase(),children:[],dataset:{},style:{},classList:{add(){},remove(){},toggle(){}},
  append(...items){this.children.push(...items)},appendChild(item){this.children.push(item);return item},replaceChildren(...items){this.children=[...items]},
  addEventListener(){},setAttribute(){},querySelector(){return null},querySelectorAll(){return[]},remove(){this.removed=true}};
}

const localStorage=storage(),sessionStorage=storage(),listeners={};
const document={
 readyState:'loading',baseURI:'https://appassets.androidplatform.net/assets/game/index.html',
 head:element('head'),body:element('body'),documentElement:element('html'),
 createElement:element,createTextNode:value=>({textContent:String(value)}),getElementById(){return null},querySelectorAll(){return[]},
 addEventListener(type,handler){listeners[type]=handler}
};
const location={protocol:'https:',hostname:'appassets.androidplatform.net',href:document.baseURI,reload(){}};
const window={document,localStorage,sessionStorage,location,addEventListener(){},requestAnimationFrame:fn=>setTimeout(fn,0),confirm:()=>true};
Object.assign(window,{window,globalThis:window,TextEncoder,TextDecoder,Uint8Array,Uint32Array,DataView,URL,crypto:crypto.webcrypto,atob:value=>Buffer.from(String(value),'base64').toString('binary')});
const context=vm.createContext({...window,window,globalThis:window,document,localStorage,sessionStorage,location,setTimeout,clearTimeout,console});

vm.runInContext(fs.readFileSync('patches/v1.72.2-safe-updater.js','utf8'),context,{filename:'v1.72.2-safe-updater.js'});
const oldUpdater=window.AetherionUpdater;
assert.equal(oldUpdater.safeUpdaterVersion,'1.72.2');
let delivered=null;
const receive=oldUpdater.receiveChannel;
oldUpdater.receiveChannel=feed=>{delivered=feed;receive(feed)};
vm.runInContext(fs.readFileSync('channel.js','utf8'),context,{filename:'channel.js'});
assert(delivered,'build 191 did not receive the build 193 channel');

(async()=>{
 const verified=await oldUpdater._test.verifyRelease(delivered.release);
 assert.equal(verified.version,'1.72.4');
 assert.equal(verified.build,193);
 assert.equal(verified.modules.length,1);
 assert.equal(verified.modules[0].id,'v174-native-install-path');
 const staged=oldUpdater.stage(verified);
 assert.equal(staged.version,'1.72.4');
 assert.equal(oldUpdater._test.readState().staged.version,'1.72.4');

 vm.runInContext(staged.modules[0].source,context,{filename:'v1.72.4-update-center-staged.js'});
 assert.equal(window.AetherionUpdateCenterV172.version,'1.72.4');
 assert.equal(window.AetherionUpdateCenterV172.androidBuild,193);
 assert.match(window.AetherionUpdateCenterV172.apk,/releases\/download\/v1\.72\.4\/Aetherion_Reforged_v1\.72\.4_FULL_REPAIR\.apk$/);
 assert.equal(typeof window.AetherionUpdateCenterV172.nativePackage,'function');
 console.log('v1.72.4 legacy handoff: build 191 verifies, stages, and activates the real build-193 APK path');
})().catch(error=>{console.error(error);process.exitCode=1});
