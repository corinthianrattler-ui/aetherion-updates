'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

let installed=null;
const document={
 head:{appendChild(node){installed=node}},
 documentElement:{appendChild(node){installed=node}},
 createElement(){return{id:'',textContent:''}},
 getElementById(){return null}
};
const sandbox={window:null,document};sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.runInNewContext(fs.readFileSync('patches/v1.73.7-time-placement.js','utf8'),sandbox,{filename:'v1.73.7-time-placement.js'});
assert.equal(sandbox.AetherionV1737TimePlacement.version,'1.73.7');
assert.equal(installed.id,'aetherion-v1737-time-placement');
assert.match(installed.textContent,/\.aethTimeHeader>\.aethSkyClock\{top:160px!important\}/);
assert.doesNotMatch(installed.textContent,/width|height|right/,'placement repair must not resize or otherwise restyle the dial');
console.log('v1.73.7 sky dial: moved into the clear lower-right HUD pocket without resizing or covering the settlement chip');
