'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const updaterSource=fs.readFileSync('patches/v1.72.3-safe-updater.js','utf8');
const centerSource=fs.readFileSync('patches/v1.72.3-update-center.js','utf8');

function updaterContext(){
 const storage=new Map();
 const document={
  readyState:'loading',baseURI:'https://appassets.androidplatform.net/assets/game/index.html',
  head:{appendChild(){}},documentElement:{appendChild(){}},
  getElementById(){return null},querySelectorAll(){return[]},addEventListener(){},createElement(){return{style:{},dataset:{},append(){},appendChild(){},addEventListener(){},setAttribute(){},querySelector(){return null},remove(){}}}
 };
 const context={
  window:null,document,console,URL,TextEncoder,Uint8Array,DataView,ArrayBuffer,
  localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)},
  sessionStorage:{getItem(){return null},setItem(){},removeItem(){}},
  setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(){return 1},confirm(){return true},location:{reload(){}},addEventListener(){},atob:value=>Buffer.from(value,'base64').toString('binary')
 };
 context.window=context;vm.createContext(context);vm.runInContext(updaterSource,context,{filename:'v1.72.3-safe-updater.js'});return context;
}

{
 const context=updaterContext(),api=context.AetherionUpdater;
 assert.equal(api.safeUpdaterVersion,'1.72.3');
 assert.equal(api.androidBuild,192);
 const release=api._test.sanitizeRelease({
  version:'1.72.4',build:193,minimumBundled:'1.72.0',requiresApk:true,
  apkUrl:'https://github.com/corinthianrattler-ui/aetherion-updates/releases/download/v1.72.4/Aetherion.apk',
  apkSha256:'a'.repeat(64),apkSize:500000000,
  modules:[{id:'notice',sha256:'b'.repeat(64),source:'void 0'}],assets:{},notes:[]
 });
 assert.equal(release.requiresApk,true);
 assert.equal(release.apkSize,500000000);
 assert.throws(()=>api.stage(release),/full APK.*cannot install models/i);
}

async function probeNative(response){
 class XMLHttpRequest{
  open(method,url){this.method=method;this.url=url}
  send(){Object.assign(this,response);this.onload?.()}
 }
 const listeners={};
 const document={readyState:'loading',addEventListener(type,handler){listeners[type]=handler},getElementById(){return null},querySelectorAll(){return[]}};
 const context={window:null,document,console,XMLHttpRequest,setTimeout(){return 1},Date,JSON,Promise,URL,location:{href:''}};
 context.window=context;vm.createContext(context);vm.runInContext(centerSource,context,{filename:'v1.72.3-update-center.js'});
 return context.AetherionUpdateCenterV172.nativePackage();
}

(async()=>{
 const valid=await probeNative({status:200,responseText:JSON.stringify({version:'1.72.3',build:192})});
 assert.deepEqual({...valid},{verified:true,version:'1.72.3',build:192});
 const missing=await probeNative({status:404,responseText:''});
 assert.equal(missing.verified,false);
 assert.doesNotMatch(centerSource,/INSTALL DOWNLOADED UPDATE|installed and ready/i);
 assert.match(centerSource,/FULL ANDROID INSTALL REQUIRED/);
 assert.match(centerSource,/DOWNLOAD FULL APK/);
 assert.match(centerSource,/native-build-192\.json/);
 console.log('v1.72.3 native update path: sentinel detection and no false APK-install claim passed');
})().catch(error=>{console.error(error);process.exitCode=1});
