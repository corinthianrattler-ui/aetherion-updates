'use strict';
const fs=require('fs'),vm=require('vm'),crypto=require('crypto');
const assert=(value,message)=>{if(!value)throw Error(message)};
const storage=()=>{const values=new Map();return{getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key),clear:()=>values.clear()}};
const nodes=[];
function element(tag){
 const node={tagName:String(tag).toUpperCase(),children:[],dataset:{},style:{},className:'',id:'',textContent:'',parentNode:null,
  append(...items){for(const item of items){if(item&&typeof item==='object'){item.parentNode=this;this.children.push(item)}}return items.at(-1)},
  appendChild(item){return this.append(item)},remove(){this.removed=true},replaceChildren(...items){this.children=[];this.append(...items)},
  addEventListener(){},setAttribute(){},querySelector(){return null},querySelectorAll(){return[]}
 };nodes.push(node);return node;
}
const document={readyState:'loading',baseURI:'file:///android_asset/game/index.html',head:element('head'),body:element('body'),documentElement:element('html'),
 createElement:element,createTextNode:text=>({textContent:String(text)}),getElementById:()=>null,querySelectorAll:()=>[],addEventListener(){}};
const localStorage=storage(),sessionStorage=storage();
const window={document,localStorage,sessionStorage,location:{reload(){}},addEventListener(){},requestAnimationFrame:fn=>setTimeout(fn,0),setTimeout,clearTimeout,confirm:()=>true};
window.window=window;window.globalThis=window;window.TextEncoder=TextEncoder;window.Uint8Array=Uint8Array;window.Uint32Array=Uint32Array;window.DataView=DataView;window.URL=URL;window.crypto=crypto.webcrypto;
const context=vm.createContext({...window,window,globalThis:window,document,localStorage,sessionStorage,location:window.location,MutationObserver:class{observe(){}},TextEncoder,Uint8Array,Uint32Array,DataView,URL,crypto:crypto.webcrypto,setTimeout,clearTimeout,confirm:()=>true,console});
vm.runInContext(fs.readFileSync('patches/v1.69.0-safe-updater.js','utf8'),context,{filename:'v1.69.0-safe-updater.js'});
const api=window.AetherionUpdater,test=api._test;
assert(api.safeUpdaterVersion==='1.69.0','updater API missing');
assert(test.compareVersions('1.70.0','1.69.9')===1,'version ordering failed');
assert(test.compareVersions('1.69.0','1.69.0')===0,'version equality failed');
assert(api.asset('assets/example.webp')==='file:///android_asset/game/assets/example.webp','bundled asset routing failed');
(async()=>{
 const source='window.__safeUpdateApplied=true;';
 const digest=crypto.createHash('sha256').update(source).digest('hex');
 assert(test.fallbackSha256(new TextEncoder().encode(source))===digest,'fallback SHA-256 failed');
 const verified=await test.verifyRelease({version:'1.70.0',minimumBundled:'1.69.0',modules:[{id:'v170',sha256:digest,source}],assets:{},notes:['test']});
 assert(verified.modules[0].source===source,'verified source was not retained');
 let rejected=false;try{await test.verifyRelease({version:'1.70.0',modules:[{id:'bad',sha256:'0'.repeat(64),source}]})}catch(_){rejected=true}
 assert(rejected,'checksum mismatch was accepted');
 rejected=false;try{test.sanitizeRelease({version:'1.70.0',modules:[],assets:{'x':'https://example.com/evil'}})}catch(_){rejected=true}
 assert(rejected,'untrusted asset origin was accepted');
 const active={version:'1.70.0',minimumBundled:'1.69.0',modules:[{id:'v170',sha256:digest,source}],assets:{},notes:[]};
 test.writeState({schema:1,active,previous:null,staged:null});
 localStorage.setItem('aetherion_safe_update_boot_v1',JSON.stringify({status:'loading',version:'1.70.0'}));
 assert(test.recoverFailedBoot()===true,'failed boot was not detected');
 assert(test.readState().active===null,'failed active update was not rolled back');
 assert(!localStorage.getItem('aetherion_safe_update_boot_v1'),'failed boot marker remained');
 console.log('v1.69.0 safe updater: checksum, origin, staging state, and automatic rollback passed');
})().catch(error=>{console.error(error);process.exit(1)});
