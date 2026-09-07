'use strict';
const fs=require('fs'),vm=require('vm'),crypto=require('crypto');
const assert=(value,message)=>{if(!value)throw Error(message)};
const values=new Map([['aetherion_exiled_v03_autosave','preserved-save']]);
const localStorage={getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
const listeners=new Map();
function host(className){
 return{className,children:[],querySelector(selector){return selector==='[data-aetherion-updates]'?this.children.find(child=>child.dataset?.aetherionUpdates)||null:null},appendChild(child){this.children.push(child);return child}};
}
const start=host('startBtns'),dock=host('dockTabs'),app={};
const document={readyState:'complete',documentElement:{},getElementById:id=>id==='app'?app:null,
 querySelectorAll:selector=>selector==='.startBtns'?[start]:selector==='.dockTabs'?[dock]:[],
 createElement:()=>({dataset:{},addEventListener(type,handler){listeners.set(type,handler)}}),addEventListener(){}};
let starts=0,opens=0,stops=0;
const window={document,localStorage,AetherionUpdater:{open(){opens++}},AetherionStartAccess:null};
const context=vm.createContext({window,document,localStorage,renderStart(){starts++},flushPersist(){},stopSpeech(){stops++},stopMusic(){stops++},MutationObserver:class{constructor(handler){this.handler=handler}observe(){}},setTimeout:fn=>fn(),console});
const source=fs.readFileSync('patches/v1.69.1-start-menu-access.js','utf8');
vm.runInContext(source,context,{filename:'v1.69.1-start-menu-access.js'});
assert(starts===1,'saved startup did not open the title menu exactly once');
assert(values.get('aetherion_exiled_v03_autosave')==='preserved-save','autosave was changed');
assert(start.children.length===1,'opening menu update button missing');
assert(dock.children.length===1,'Systems dock update button missing');
listeners.get('click')();
assert(opens===1,'update button did not open the updater');
assert(stops===2,'background voice and music were not stopped for the title menu');
vm.runInContext(source,context,{filename:'v1.69.1-start-menu-access-again.js'});
assert(starts===1&&start.children.length===1&&dock.children.length===1,'patch was not idempotent');
let feed=null;
const channelWindow={AetherionUpdater:{receiveChannel(value){feed=value}}};
vm.runInNewContext(fs.readFileSync('channel.js','utf8'),{window:channelWindow},{filename:'channel.js'});
assert(feed?.release?.version==='1.69.1','stable channel version was not updated');
assert(feed.release.minimumBundled==='1.69.0','patch no longer supports the installed recovery APK');
assert(feed.release.modules[0].source===source,'stable channel source differs from the tested patch');
assert(crypto.createHash('sha256').update(source).digest('hex')===feed.release.modules[0].sha256,'stable channel checksum differs from the patch');
console.log('v1.69.1 start access: title gate, save preservation, updater buttons, and idempotence passed');
