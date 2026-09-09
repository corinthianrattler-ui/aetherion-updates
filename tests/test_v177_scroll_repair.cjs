'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('patches/v1.72.7-scroll-repair.js','utf8');
const appended=[];
const scrollingElement={clientHeight:800,scrollHeight:2400};
const document={
 scrollingElement,
 documentElement:scrollingElement,
 body:{classList:{contains(){return false}}},
 head:{appendChild(node){appended.push(node)}},
 getElementById(id){return appended.find(node=>node.id===id)||null},
 createElement(tag){return{tagName:tag,id:'',textContent:''}}
};
const context={window:null,globalThis:null,document,getComputedStyle(target){return{overflowY:target===scrollingElement?'auto':'visible'}}};
context.window=context;context.globalThis=context;
vm.createContext(context);vm.runInContext(source,context,{filename:'v1.72.7-scroll-repair.js'});

const api=context.AetherionScrollRepairV177;
assert.equal(api.version,'1.72.7');
assert.equal(appended.length,1);api.install();assert.equal(appended.length,1,'style installation must be idempotent');
const css=appended[0].textContent;
assert.match(css,/html\{[^}]*overflow-y:auto!important/);
assert.match(css,/html\{[^}]*overscroll-behavior-y:auto!important/);
assert.match(css,/body:not\(\.v37-atlas-open\):not\(\.v37-map-atlas-open\)\{[^}]*overflow-y:visible!important/);
assert.match(css,/#app,\.shell\{[^}]*height:auto!important[^}]*overflow-y:visible!important/);
assert.match(css,/\.body,\.body\.dockCollapsed\{[^}]*min-height:auto!important[^}]*overflow:visible!important/);
assert.match(css,/\.main,\.storyInner,\.storyBlocks\{[^}]*touch-action:pan-y!important/);
assert.match(css,/\.storyPanel\{[^}]*overflow-y:visible!important/);
assert.match(css,/grid-template-rows:auto auto auto!important/);
assert.match(css,/\.body,\.body\.dockCollapsed\{display:grid!important;grid-template-columns:minmax\(0,1fr\)!important/);
assert.match(css,/body\.v37-atlas-open,body\.v37-map-atlas-open\{overflow:hidden!important/,'full-screen atlases must retain their intentional lock');
assert.doesNotMatch(css,/\.dock\{[^}]*position:/,'the repair must not change the working Systems dock position');
assert.deepEqual({...api.audit()},{version:'1.72.7',rootOverflowY:'auto',bodyOverflowY:'visible',clientHeight:800,scrollHeight:2400,canScroll:true});
console.log('v1.72.7 scrolling: document, story, and main content scroll vertically; horizontal containment, modal scrolling, and atlas locks remain intact');
