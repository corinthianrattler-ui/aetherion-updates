'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('patches/v1.72.6-gameplay-repair.js','utf8');
const foundation=['BODY_tripo_part_10','BODY_tripo_part_74','BODY_tripo_part_39','BODY_tripo_part_25','BODY_tripo_part_9','BODY_tripo_part_12','BODY_tripo_part_49','BODY_tripo_part_0'];
const fitted=['GOWN_tripo_part_19','GOWN_tripo_part_18','BODY_tripo_part_37','BODY_tripo_part_28','BODY_tripo_part_2','BODY_tripo_part_13','BODY_tripo_part_72','BODY_tripo_part_86','BODY_tripo_part_81','BODY_tripo_part_46','BODY_tripo_part_50','BODY_tripo_part_17','GOWN_tripo_part_10','GOWN_tripo_part_4','GOWN_tripo_part_5','GOWN_tripo_part_17','GOWN_tripo_part_7','BODY_tripo_part_15','BODY_tripo_part_56','BODY_tripo_part_75'];
const nodes=[{name:'ROOT'},...foundation.map(name=>({name})),...fitted.map(name=>({name}))];
function classList(){const values=new Set();return{values,add:(...names)=>names.forEach(name=>values.add(name)),remove:(...names)=>names.forEach(name=>values.delete(name))}}
const badge={textContent:'',title:''};
const stage={classList:classList(),querySelector(selector){return selector==='[data-v176-alexus-status]'?badge:null}};
const host={children:[],replaceChildren(...nodes){this.children=nodes},appendChild(node){this.children.push(node)},closest(){return stage}};
const appended=[];
const document={baseURI:'https://appassets.androidplatform.net/assets/game/index.html',head:{appendChild(node){appended.push(node)}},documentElement:{appendChild(){}},getElementById(){return null},querySelector(selector){return selector==='[data-v176-alexus-host]'?host:null},createElement(tag){if(tag==='canvas')return{dataset:{},style:{cssText:''},setAttribute(){}};return{id:'',dataset:{},style:{},textContent:'',appendChild(){},setAttribute(){}}}};
function glb(){const size=128,bytes=new ArrayBuffer(size),view=new DataView(bytes);view.setUint32(0,0x46546c67,true);view.setUint32(4,2,true);view.setUint32(8,size,true);return bytes}
let requested='',created=0,lastMap=null;
class XMLHttpRequest{open(method,url){requested=url}send(){this.status=0;this.response=glb();this.onload()}}
const viewer={_v176Alexus:false,options:null,model:{},yaw:null,getNamedNodes(){return nodes},setNodesVisible(map){lastMap=map},setYaw(value){this.yaw=value},attach(node){this.host=node},render(){},dispose(){}};
const gear={head:'alexus_rose_circlet',body:'alexus_dominus_gown'};
const S={people:[{id:'party_alexus_dominus',name:'Lady Alexus Dominus',gear}],containers:{'Carried Inventory':{items:[],capacityKg:50,capacitySlots:10}},wagons:[],world:{location:'Corvinus Keep'}};
const context={console,window:null,globalThis:null,document,location:{protocol:'https:',hostname:'appassets.androidplatform.net',href:document.baseURI},URL,ArrayBuffer,DataView,XMLHttpRequest,S,ITEMS:{},setTimeout(){return 1},requestAnimationFrame(){return 1},v16PersonEquipment(){},closeModal(){},v70BuyPanel(){return''},v70Select(){},v70Buy(){},v16DoBuy(){},v34lBestDestination(){},v34lExecuteRequisition(){},AetherionThree:{async createViewer(options){created++;viewer.options=options;return viewer}}};
context.window=context;context.globalThis=context;vm.createContext(context);vm.runInContext(source,context,{filename:'v1.72.6-gameplay-repair.js'});
(async()=>{
 const api=context.AetherionGameplayRepairV176,current=await api.syncAlexus();assert.equal(current,viewer);assert.equal(created,1);assert.equal(requested,'https://appassets.androidplatform.net/assets/game/assets/v172/alexus-gothic-gown.glb');assert.equal(viewer.options.glb,null);assert.equal(viewer.options.framingNode,'ROOT');assert.equal(viewer.options.maxPixelRatio,1.25);assert.equal(viewer.yaw,Math.PI/2);assert.equal(lastMap.GOWN_tripo_part_19,true);assert.equal(lastMap.BODY_tripo_part_2,true);assert.equal(lastMap.GOWN_tripo_part_18,false);assert(stage.classList.values.has('v176-model-ready'));assert.equal(badge.textContent,'12 FITTED SLOTS READY');
 delete gear.head;await api.syncAlexus();assert.equal(created,1,'equipment changes must reuse the same viewer');assert.equal(lastMap.GOWN_tripo_part_19,false);assert.equal(lastMap.BODY_tripo_part_2,true);console.log('v1.72.6 Alexus mount: local GLB, 28-node validation, viewer reuse, and per-slot visibility passed');
})().catch(error=>{console.error(error);process.exitCode=1});
