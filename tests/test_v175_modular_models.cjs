'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('patches/v1.72.5-character-models.js','utf8');
const foundation=['foundation__head','foundation__torso','foundation__arms','foundation__hands','foundation__legs','foundation__feet'];
const gearNodes=[
 'SLOT_HELMET','SLOT_GORGET','SLOT_PAULDRONS','SLOT_CUIRASS','SLOT_UNDERCOAT','SLOT_GAUNTLETS','SLOT_BELT',
 'SLOT_TROUSERS','SLOT_GREAVES','SLOT_BOOTS','SLOT_CLOAK','SLOT_SCABBARD','gear__royal_head','gear__royal_underlayer',
 'gear__royal_body','gear__royal_shoulders','gear__royal_hands','gear__royal_waist','gear__royal_legs','gear__royal_feet',
 'gear__royal_cloak','gear__royal_jewelry','gear__dominus_bow','gear__dominus_kite_shield','gear__dominus_dagger',
 'gear__dominus_sword','gear__dominus_quiver','gear__dominus_thorn_whip','gear__dominus_signet'
];
function classes(){const values=new Set();return{values,add:(...names)=>names.forEach(name=>values.add(name)),remove:(...names)=>names.forEach(name=>values.delete(name))}}
const resetButton={dataset:{},addEventListener(type,handler){this.handler=handler}};
const stage={classList:classes(),querySelector:selector=>selector==='[data-v80-reset-view]'?resetButton:null};
const host={dataset:{v80Valkorion:'true'},children:[],replaceChildren(...nodes){this.children=nodes},appendChild(node){this.children.push(node)},closest:()=>stage};
const panel={querySelector(selector){return selector==='[data-v80-valkorion]'?host:null}};
const document={
 baseURI:'https://appassets.androidplatform.net/assets/game/index.html',head:{appendChild(){}},documentElement:{appendChild(){}},
 getElementById(){return null},querySelector(selector){return selector==='.v38-equipment-panel'?panel:null},querySelectorAll(){return[]},
 createElement(tag){
  if(tag==='canvas')return{dataset:{},style:{cssText:''},setAttribute(){}};
  return{id:'',className:'',textContent:'',dataset:{},style:{},classList:classes(),append(){},appendChild(){},setAttribute(){},addEventListener(){}};
 }
};
const nodes=[
 {name:'VALKORION_FINAL',visible:true},{name:'VALKORION_DOMINUS_ARMOR',visible:true},
 ...foundation.map(name=>({name,visible:true})),...gearNodes.map(name=>({name,visible:true})),
 ...Array.from({length:54},(_,index)=>({name:`part__${index}`,visible:true}))
];
let createCount=0,disposed=0,requests=[],fail=false;
const viewer={
 options:null,canvas:null,_v175Modular:false,model:{scale:{x:1,y:1,z:1,set(x,y,z){this.x=x;this.y=y;this.z=z}},userData:{},updateMatrixWorld(){}},yaw:null,
 getNamedNodes(){return nodes},setNodesVisible(map){for(const node of nodes)if(Object.hasOwn(map,node.name))node.visible=map[node.name]},
 setNodeVisible(name,shown){const node=nodes.find(row=>row.name===name);if(node)node.visible=shown},setYaw(yaw){this.yaw=yaw},attach(next){this.host=next},render(){},dispose(){disposed++}
};
function glbBytes(){const size=96,bytes=new ArrayBuffer(size),view=new DataView(bytes);view.setUint32(0,0x46546c67,true);view.setUint32(4,2,true);view.setUint32(8,size,true);return bytes}
class XMLHttpRequest{
 open(method,url){this.method=method;this.url=url;requests.push(this)}
 send(){if(fail){this.status=404;this.onload?.();return}this.status=0;this.response=glbBytes();this.onprogress?.({loaded:96,total:96});this.onload?.()}
}
const S={player:{equipment:{}},v98:{creator:{height:1,frame:1}},people:[{id:'party_alexus_dominus',name:'Lady Alexus Dominus',model3d:'assets/v172/alexus-gothic-gown.glb',gear:{body:'alexus_dominus_gown'}}]};
const V80_RUNTIME={viewer:{dispose(){disposed++}},canvas:{},initializing:{},mountCount:0};
const context={
 console,window:null,document,S,V80_RUNTIME,currentTab:'equipment',URL,Math,ArrayBuffer,DataView,XMLHttpRequest,
 location:{protocol:'https:',hostname:'appassets.androidplatform.net',href:'https://appassets.androidplatform.net/assets/game/index.html'},
 setTimeout(){return 1},requestAnimationFrame(){return 1},render(){},v80Sync(){},v80ScheduleSync(){},
 AetherionUpdater:{asset:path=>`https://wrong.example/${path}`},
 AetherionThree:{async createViewer(options){createCount++;viewer.options=options;viewer.canvas=options.canvas;return viewer}}
};
context.window=context;vm.createContext(context);vm.runInContext(source,context,{filename:'v1.72.5-character-models.js'});

(async()=>{
 const api=context.AetherionModularModelsV175;
 assert.equal(api.version,'1.72.5');assert.equal(api.androidBuild,194);
 assert.equal(api.models.valkorion,'assets/v109/valkorion_final.glb');assert.equal(api.models.alexus,null);
 assert.equal(S.people[0].model3d,undefined,'the incomplete baked sister model must not masquerade as modular');
 assert.equal(api.list().join(','),'valkorion');assert.equal(api.get('valkorion').complete,true);
 assert.throws(()=>api.register({id:'baked_sister',model:'sister.glb',complete:false,slots:[],gearNodes:[],rules:[]}),/baked or partial models are rejected/);

 let current=await api.sync();assert.equal(current,viewer);assert.equal(createCount,1);
 assert.equal(requests[0].url,'https://appassets.androidplatform.net/assets/game/assets/v109/valkorion_final.glb','Android must load the bundled fitted model, never a remote redirect');
 assert.equal(viewer.options.glb,null,'large source bytes must be released after parsing');
 assert.equal(viewer.options.framingNode,'VALKORION_FINAL');assert.equal(viewer.options.maxPixelRatio,1.25);assert.equal(viewer.yaw,0);
 for(const name of foundation)assert.equal(nodes.find(node=>node.name===name).visible,true,`${name} should begin visible`);
 for(const name of gearNodes)assert.equal(nodes.find(node=>node.name===name).visible,false,`${name} should begin hidden`);

 S.player.equipment={head:'dominus_lord_helm'};await api.sync();
 assert.equal(createCount,1,'equipping one piece must reuse the same model');
 assert.equal(api.visibility(S.player.equipment).SLOT_HELMET,true);assert.equal(api.visibility(S.player.equipment)['foundation__head'],false);
 assert.equal(api.visibility(S.player.equipment).SLOT_CUIRASS,false,'a helmet must not equip the cuirass');

 S.player.equipment={head:'dominus_lord_helm',body:'dominus_cuirass',legs:'v38_valkorion_formal_trousers',feet:'v38_valkorion_lord_boots',main:'dominus_sword',off:'dominus_thorn_whip'};
 await api.sync();let map=api.visibility(S.player.equipment);
 assert.equal(createCount,1,'mixed armor and court clothes must not swap whole-body models');
 assert.equal(api.mode(),'mixed');
 for(const name of ['SLOT_HELMET','SLOT_CUIRASS','gear__royal_legs','gear__royal_feet','gear__dominus_sword','SLOT_SCABBARD','gear__dominus_thorn_whip'])assert.equal(map[name],true,`${name} should match its equipped item`);
 for(const name of ['SLOT_PAULDRONS','SLOT_GAUNTLETS','gear__dominus_kite_shield','gear__dominus_bow'])assert.equal(map[name],false,`${name} must stay unequipped`);

 delete S.player.equipment.head;await api.sync();map=api.visibility(S.player.equipment);
 assert.equal(map.SLOT_HELMET,false,'removing the helmet must hide only the helmet');assert.equal(map.SLOT_CUIRASS,true,'removing the helmet must retain the cuirass');assert.equal(map.gear__royal_legs,true);

 S.player.equipment.body='v98_solaris_body';await api.sync();
 assert.deepEqual(JSON.parse(JSON.stringify(api.unsupported(S.player.equipment))).find(row=>row.slot==='body'),{slot:'body',item:'v98_solaris_body'},'unfitted foreign armor must be reported instead of showing false Dominus heraldry');
 assert.equal(api.visibility(S.player.equipment).SLOT_CUIRASS,false);

 const before=api.state().mounts;fail=true;runtimeDispose();assert.equal(await api.sync(),null);assert(stage.classList.values.has('v173-model-error'));fail=false;assert(await api.sync());assert.equal(api.state().mounts,before+1);
 assert(disposed>=2,'legacy and failed viewers must be released');
 console.log('v1.72.5 modular models: 17-slot contract, equip/remove/mix behavior, local GLB load, honest sister fallback, and retry passed');
})().catch(error=>{console.error(error);process.exitCode=1});

function runtimeDispose(){viewer._v175Modular=false;context.V80_RUNTIME.viewer=viewer}
