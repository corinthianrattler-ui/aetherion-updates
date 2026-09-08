'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('patches/v1.72.3-character-models.js','utf8');
function classes(){
 const values=new Set();
 return{values,add:(...names)=>names.forEach(name=>values.add(name)),remove:(...names)=>names.forEach(name=>values.delete(name))};
}
const resetButton={dataset:{},addEventListener(type,handler){this.handler=handler}};
const stage={classList:classes(),querySelector:selector=>selector==='[data-v80-reset-view]'?resetButton:null};
const valkorionHost={dataset:{v80Valkorion:'true'},children:[],replaceChildren(...nodes){this.children=nodes},appendChild(node){this.children.push(node)},closest:()=>stage};
const equipmentPanel={querySelector(selector){if(selector==='[data-v80-valkorion]')return valkorionHost;return null}};
const alexusHost={children:[],replaceChildren(...nodes){this.children=nodes},appendChild(node){this.children.push(node)},textContent:''};
const alexusReset={addEventListener(type,handler){this.handler=handler}};
const card={dataset:{},className:'',classList:classes(),innerHTML:'',querySelector(selector){if(selector==='.v172-alexus-host')return alexusHost;if(selector==='[data-v172-alexus-front]')return alexusReset;return null}};
const header={after(node){modal.card=node}};
const modal={textContent:'Lady Alexus Dominus',innerHTML:'<h2>Lady Alexus Dominus</h2>',card:null,querySelector(selector){if(selector==='[data-v172-alexus-model]')return this.card;if(selector==='.modalHeader')return header;return null},prepend(node){this.card=node}};
const document={
 baseURI:'https://appassets.androidplatform.net/assets/game/index.html',
 hidden:false,
 head:{appendChild(){}},
 getElementById(){return null},
 querySelector(selector){if(selector==='.v38-equipment-panel')return equipmentPanel;if(selector==='#modalRoot .modal')return modal;return null},
 querySelectorAll(){return[]},
 createElement(tag){
  if(tag==='canvas')return{dataset:{},style:{cssText:''},setAttribute(){}};
  if(tag==='section')return card;
  return{id:'',className:'',textContent:'',innerHTML:'',dataset:{},style:{},classList:classes(),appendChild(){},setAttribute(){}};
 }
};
const royalNames=[
 ...Array.from({length:10},(_,index)=>`HUMAN_PART_${String(index+1).padStart(2,'0')}`),
 ...Array.from({length:10},(_,index)=>`ROYAL_COSTUME_PART_${String(index+1).padStart(2,'0')}`),
 'Gothic_Necklace','Gothic_Ring','tripo_part_new_0'
];
const armoredNames=[
 ...Array.from({length:27},(_,index)=>`BODY_ARMOR_PART_${index+1}`),
 ...Array.from({length:3},(_,index)=>`HELMET_PART_${index+1}`),
 ...Array.from({length:4},(_,index)=>`CAPE_PART_${index+1}`),
 ...Array.from({length:6},(_,index)=>`WEAPONS_PART_${index+1}`)
];
const alexusNames=[...Array.from({length:21},(_,index)=>`BODY_${index+1}`),...Array.from({length:7},(_,index)=>`GOWN_${index+1}`)];
let disposed=0,createCalls=[],openCalls=0,equipmentCalls=0,closeCalls=0,fitCalls=0;
function viewerFor(options,names){
 const nodes=[{name:'ROOT',visible:true},...names.map(name=>({name,visible:true}))];
 return{
  options,
  canvas:options.canvas,disposed:false,_nodes:nodes,yaw:null,
  model:{position:{y:0},rotation:{z:0},scale:{x:1,y:1,z:1,set(x,y,z){this.x=x;this.y=y;this.z=z}},userData:{},updateMatrixWorld(){}},
  hasNode:name=>name==='ROOT',getNamedNodes(){return nodes},
  setNodesVisible(map){for(const node of nodes)if(Object.hasOwn(map,node.name))node.visible=map[node.name]},
  setNodeVisible(name,shown){const node=nodes.find(row=>row.name===name);if(node)node.visible=shown},
  setYaw(value){this.yaw=value},attach(host){this.host=host},resize(){},fitModel(name){fitCalls++;this.fitted=name},render(){},
  dispose(){this.disposed=true;disposed++}
 };
}
const S={
 player:{equipment:{}},v98:{playerMode:'foundation',creator:{height:1,frame:1}},
 people:[{id:'party_alexus_dominus',name:'Lady Alexus Dominus',portrait:'alexus.webp'}]
};
const V80_RUNTIME={viewer:{dispose(){disposed++}},canvas:{},initializing:{},mountCount:0};
const bufferSources=new WeakMap(),requests=[],failUrls=new Set();
function modelBytes(url){
 const size=url.endsWith('valkorion-armored.glb')?84:url.endsWith('alexus-gothic-gown.glb')?80:76;
 const bytes=new ArrayBuffer(size),view=new DataView(bytes);
 view.setUint32(0,0x46546c67,true);view.setUint32(4,2,true);view.setUint32(8,size,true);
 bufferSources.set(bytes,url);return bytes;
}
class XMLHttpRequest{
 open(method,url,async){this.method=method;this.url=url;this.async=async;requests.push(this)}
 send(){
  if(failUrls.has(this.url)){this.status=404;this.response=null;this.onload?.();return}
  this.status=0;this.response=modelBytes(this.url);
  this.onprogress?.({loaded:this.response.byteLength,total:this.response.byteLength});this.onload?.();
 }
}
const context={
 console,window:null,document,S,V80_RUNTIME,currentTab:'equipment',Math,URL,ArrayBuffer,DataView,XMLHttpRequest,
 location:{protocol:'https:',hostname:'appassets.androidplatform.net',href:'https://appassets.androidplatform.net/assets/game/index.html'},
 render(){},setTimeout(){return 1},requestAnimationFrame(){return 1},
 v80Sync(){},v80ScheduleSync(){},
 openPerson(){openCalls++;return'person-opened'},v16PersonEquipment(){equipmentCalls++;return'equipment-opened'},closeModal(){closeCalls++;return'modal-closed'},
 AetherionUpdater:{asset:path=>`https://raw.githubusercontent.com/corinthianrattler-ui/aetherion-updates/main/${path}`},
 AetherionThree:{async createViewer(options){
  assert(options.glb instanceof ArrayBuffer,'viewer must receive local GLB bytes instead of a file URL');
  const url=bufferSources.get(options.glb)||'';
  createCalls.push({options,glb:options.glb,url});
  if(url.endsWith('valkorion-base-lord.glb'))return viewerFor(options,royalNames);
  if(url.endsWith('valkorion-armored.glb'))return viewerFor(options,armoredNames);
  if(url.endsWith('alexus-gothic-gown.glb'))return viewerFor(options,alexusNames);
  throw Error(`unexpected model ${url}`);
 }}
};
context.window=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:'v1.72.3-character-models.js'});

(async()=>{
 const api=context.AetherionCharacterModelsV172;
 assert.equal(api.version,'1.72.3');
 assert.equal(api.androidBuild,192);
 assert.equal(api.state().androidBuild,192);
 assert.equal(api.mode(),'base');
 assert.equal(api.playerKind(),'foundation');
 assert.equal(context.v80Sync,api.sync,'the bundled v80 sync hook must be replaced when legacy v97/v98 globals are absent');
 assert.equal(context.v80ScheduleSync,api.schedule,'the bundled v80 scheduler must be replaced when legacy v97/v98 globals are absent');
 assert.equal(S.people[0].model3d,'assets/v172/alexus-gothic-gown.glb');
 assert(!Object.keys(S.people[0]).includes('model3d'),'3D asset hint must not bloat saved people records');

 let viewer=await api.sync();
 assert.equal(createCalls.length,1);
 assert(createCalls[0].glb instanceof ArrayBuffer);
 assert.equal(requests[0].url,'https://appassets.androidplatform.net/assets/game/assets/v172/valkorion-base-lord.glb');
 assert.equal(requests[0].responseType,'arraybuffer');
 assert.equal(requests[0].timeout,120000);
 assert.equal(createCalls[0].options.glb,null,'parsed GLB source bytes must be released after model creation');
 assert.equal(createCalls[0].options.proceduralFallback,false);
 assert.equal(createCalls[0].options.framingNode,'ROOT');
 assert.equal(createCalls[0].options.maxPixelRatio,1.25);
 assert.equal(viewer.yaw,Math.PI/2,'base Valkorion must start front-facing');
 assert.equal(api.state().valkorion.parts,23);
 assert.deepEqual(
  viewer.getNamedNodes().filter(node=>node.visible&&node.name!=='ROOT').map(node=>node.name),
  royalNames.filter(name=>name.startsWith('HUMAN_PART_')),
  'base mode must show the intact ten-piece clothed body only'
 );

 S.player.equipment.body='v38_valkorion_formal_overcoat';
 assert.equal(api.mode(),'lord');assert.equal(api.playerKind(),'royal_male');
 const lordViewer=await api.sync();
 assert.equal(lordViewer,viewer,'base and Lord modes must reuse their aligned source');
 assert.equal(createCalls.length,1);
 assert.equal(lordViewer.getNamedNodes().filter(node=>node.visible&&node.name!=='ROOT').length,23);
 assert.equal(lordViewer.canvas.dataset.v171Valkorion,'lord');

 S.player.equipment={body:'dominus_cuirass'};
 assert.equal(api.mode(),'armored');assert.equal(api.playerKind(),'knight');
 viewer=await api.sync();
 assert.equal(createCalls.length,2);
 assert(createCalls[1].glb instanceof ArrayBuffer);
 assert.equal(requests[1].url,'https://appassets.androidplatform.net/assets/game/assets/v172/valkorion-armored.glb');
 assert.equal(viewer.yaw,Math.PI,'complete armor must retain its approved front view');
 assert.equal(api.state().valkorion.parts,40);
 assert(disposed>=2,'legacy and replaced Valkorion viewers must be disposed');

 const alexus=await api.mountAlexus();
 assert(alexus,'Lady Alexus viewer did not mount');
 assert.equal(createCalls.length,3);
 assert(createCalls[2].glb instanceof ArrayBuffer);
 assert.equal(requests[2].url,'https://appassets.androidplatform.net/assets/game/assets/v172/alexus-gothic-gown.glb');
 assert.equal(alexus.yaw,Math.PI/2,'Lady Alexus must start front-facing');
 assert.equal(api.state().alexus.parts,28);
 assert.equal(api.state().valkorion.ready,false,'Lady Alexus must release the large wardrobe viewer on mobile');
 assert.equal(modal.card,card);
 assert(card.classList.values.has('v172-alexus-ready'));

 assert.equal(context.openPerson('party_alexus_dominus'),'person-opened');
 assert.equal(context.v16PersonEquipment('party_alexus_dominus'),'equipment-opened');
 assert.equal(openCalls,1);assert.equal(equipmentCalls,1);
 assert.equal(context.closeModal(),'modal-closed');assert.equal(closeCalls,1);
 assert.equal(api.state().alexus.ready,false,'closing Lady Alexus must release her large viewer');
 assert.equal(fitCalls,0,'a fitted multi-million-vertex model must not be rescanned on every screen render');

 S.player.equipment={};S.v98.playerMode='foundation';
 const baseUrl='https://appassets.androidplatform.net/assets/game/assets/v172/valkorion-base-lord.glb';failUrls.add(baseUrl);
 assert.equal(await api.sync(),null,'a failed packaged asset read must not pretend the 3D viewer is ready');
 assert(stage.classList.values.has('v173-model-error'),'the stage must expose the real model error');
 assert(valkorionHost.children.some(node=>node.className==='v171-model-message'));
 failUrls.delete(baseUrl);
 assert(await api.sync(),'reopening Equipment must retry the packaged model after an error');
 assert(source.includes('.v80-stage.v173-model-error .v80-valkorion-host'),'model failures must be visible instead of hiding behind the portrait');
 console.log('v1.72.3 character models: Android binary reads, local-only paths, render hook, fitted model switching, and visible errors passed');
})().catch(error=>{console.error(error);process.exitCode=1});
