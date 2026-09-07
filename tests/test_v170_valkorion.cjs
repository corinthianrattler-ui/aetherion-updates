'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('patches/v1.70.0-valkorion-complete.js','utf8');
const classes=new Set();
const classList={add:value=>classes.add(value),remove:(...values)=>values.forEach(value=>classes.delete(value))};
const resetButton={dataset:{},addEventListener(){}};
const stage={classList,querySelector:selector=>selector==='[data-v80-reset-view]'?resetButton:null};
const host={children:[],replaceChildren(...nodes){this.children=nodes},appendChild(node){this.children.push(node)},closest:()=>stage};
const document={
 hidden:false,head:{appendChild(){}},querySelector:selector=>selector.includes('[data-v80-valkorion]')?host:null,
 createElement:tag=>tag==='canvas'?{dataset:{},style:{cssText:''},setAttribute(){}}:{id:'',textContent:'',className:'',innerHTML:''}
};
let disposed=0,createOptions=null,attached=0,fit=0,rendered=0,yaw=null;
const named=Array.from({length:40},(_,index)=>({name:`ASSEMBLED_PART_${index+1}`,visible:true}));
const viewer={
 model:{position:{y:0},rotation:{z:0}},_v170Complete:false,disposed:false,canvas:null,
 hasNode:name=>name==='ROOT',getNamedNodes:()=>[{name:'ROOT',visible:true},...named],
 attach(){attached++},resize(){},fitModel:name=>{assert.equal(name,'ROOT');fit++},render(){rendered++},setYaw(value){yaw=value},resetView(){},dispose(){disposed++}
};
const V80_RUNTIME={viewer:{dispose(){disposed++}},canvas:{},initializing:{},viewerCount:0,canvasCount:0,mountCount:0};
const context={
 console,window:null,document,currentTab:'equipment',V80_RUNTIME,
 v80Sync(){},v80ScheduleSync(){},requestAnimationFrame:()=>1,setTimeout(){},Math,
 AetherionThree:{async createViewer(options){createOptions=options;viewer.canvas=options.canvas;return viewer}}
};
context.window=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:'v1.70.0-valkorion-complete.js'});

(async()=>{
 const api=context.AetherionValkorionV170;
 assert.equal(api.version,'1.70.0');
 assert.equal(api.model,'assets/v170/valkorion-complete-kit.glb');
 assert.equal(api.expectedParts,40);
 await api.sync();
 assert.equal(createOptions.glb,'assets/v170/valkorion-complete-kit.glb');
 assert.equal(createOptions.framingNode,'ROOT');
 assert.equal(createOptions.proceduralFallback,false);
 assert.equal(host.children.length,1);
 assert.equal(host.children[0].dataset.v170Valkorion,'complete');
 assert(classes.has('v80-3d-ready'));
 assert(!classes.has('v80-3d-loading'));
 assert.equal(api.state().ready,true);
 assert.equal(api.state().parts,40);
 assert.equal(yaw,Math.PI,'assembled model did not face the player');
 assert(attached>=1&&fit>=1&&rendered>=1);
 assert(disposed>=1,'legacy viewer was not disposed');
 console.log('v1.70.0 Valkorion: assembled model path, 40-part validation, legacy disposal, and framing passed');
})().catch(error=>{console.error(error);process.exitCode=1});
