'use strict';

const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const vm=require('node:vm');

function storage(seed={}){
 const rows=new Map(Object.entries(seed));
 return{getItem:key=>rows.has(key)?rows.get(key):null,setItem:(key,value)=>rows.set(key,String(value)),removeItem:key=>rows.delete(key),clear:()=>rows.clear(),has:key=>rows.has(key)};
}
const localStorage=storage({
 aetherion_safe_update_state_v1:'old patch source',
 aetherion_safe_update_boot_v1:'old boot marker',
 aetherion_safe_update_notice_v1:'old notice',
 aetherion_exiled_v03_autosave:'KEEP THIS SAVE'
});
const sessionStorage=storage({aetherion_safe_update_force_safe_v1:'1'});
let readyListener=null;
const document={
 readyState:'loading',head:{appendChild(){}},body:{appendChild(){}},
 createElement(){return{style:{},querySelector(){return{style:{},onclick:null,disabled:false,textContent:''}},remove(){}}},
 addEventListener(type,listener){if(type==='DOMContentLoaded')readyListener=listener},
 dispatchEvent(){}
};
const sandbox={console,window:null,globalThis:null,document,localStorage,sessionStorage,crypto:crypto.webcrypto,TextEncoder,TextDecoder,URL,Blob,CustomEvent:class{},atob:value=>Buffer.from(String(value),'base64').toString('binary'),setTimeout(){},clearTimeout(){}};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.runInNewContext(fs.readFileSync('patches/v1.74.2-safe-updater.js','utf8'),sandbox,{filename:'v1.74.2-safe-updater.js'});

const api=sandbox.AetherionUpdater;
assert(api,'updater API missing');
assert.equal(api.safeUpdaterVersion,'1.74.2');
assert.equal(api.bundledVersion,'1.74.2');
assert.equal(api.androidBuild,197);
assert.equal(api._test.appId,'aetherion-reforged');
assert.equal(api._test.database,'aetherion-reforged-updates');
assert.equal(api._test.compareVersions('1.74.3','1.74.2'),1);
assert.equal(api._test.safeAssetPath('assets/portraits/test.webp'),true);
assert.equal(api._test.safeAssetPath('custom/camp/test.mp4'),true);
assert.equal(api._test.safeAssetPath('../save.json'),false);
assert.equal(api._test.safeAssetPath('patches/core.js'),false);
assert.equal(typeof readyListener,'function');

assert.equal(localStorage.getItem('aetherion_safe_update_state_v1'),null);
assert.equal(localStorage.getItem('aetherion_safe_update_boot_v1'),null);
assert.equal(localStorage.getItem('aetherion_safe_update_notice_v1'),null);
assert.equal(sessionStorage.getItem('aetherion_safe_update_force_safe_v1'),null);
assert.equal(localStorage.getItem('aetherion_exiled_v03_autosave'),'KEEP THIS SAVE');

const release={version:'1.74.3'};
const valid={schema:2,appId:'aetherion-reforged',version:'1.74.3',files:[{
 id:'portrait-a',type:'asset',path:'assets/game/custom/portraits/a.webp',mime:'image/webp',url:'https://example.test/a.webp',sha256:'a'.repeat(64)
}],deletePaths:['assets/game/assets/obsolete.webp']};
api._test.validateManifest(valid,release);
assert.equal(valid.files[0].path,'custom/portraits/a.webp');
assert.deepEqual(Array.from(valid.deletePaths),['assets/obsolete.webp']);
assert.throws(()=>api._test.validateManifest({schema:2,appId:'aetherion-reforged',version:'1.74.3',files:[],deletePaths:['game.js']},release),/Unsafe/);
assert.throws(()=>api._test.validateManifest({schema:2,appId:'aetherion-reforged',version:'1.74.3',files:[],deletePaths:['..\/save.json']},release),/Unsafe/);

console.log('v1.74.2 updater: signed-channel identity, safe add/replace/delete boundaries, exact legacy-cache cleanup, and save preservation passed');
