'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

let modal='',campOpens=0,persists=0,allowToggle=true,allowCook=true,allowSleep=true,styleText='',guardCalls=0;
const listeners={},elements=new Map(),advances=[],blocks=[];
function media(){return{played:0,paused:0,ended:false,muted:false,controls:true,addEventListener(type,fn){listeners[type]=fn},play(){this.played++;return{catch:fn=>{if(this.played===1)fn();return this}}},pause(){this.paused++},removeAttribute(name){if(name==='controls')this.controls=false},load(){}}}
function openModal(html){modal=html;elements.clear();elements.set('v1735CampVideo',media())}
const document={head:{appendChild(node){styleText=node.textContent}},createElement(){return{style:{},textContent:'',id:''}},getElementById(id){return elements.get(id)||null}};
const sandbox={console,document,openModal,closeModal(){},persist(){persists++},v24OpenCamp(){campOpens++},v19Block(title,text){blocks.push({title,text})},S:{world:{day:2,hour:4,location:'Solaris'},people:[{id:'guard_a',alive:true,location:'Solaris',role:'Lesser Knight'},{id:'guard_b',alive:true,location:'Solaris',role:'Footman'}],v24:{camp:{active:false,placements:[],watchers:[],cookReady:false}}},
 advanceHours(hours,activity){advances.push({hours,activity});sandbox.S.world.hour+=hours},v14ActivePeople(){return[]},v14FoodStock(){return 20},countItem(id){return id==='firewood'?10:0},
 v24CampMap(){return'<button>ESTABLISH / STRIKE CAMP</button>'},
 v24EstablishCamp(){if(!allowToggle||(!this.S.v24.camp.active&&!this.S.v24.camp.placements.some(Boolean)))return;if(!this.S.v24.camp.active)this.S.world.hour+=2;this.S.v24.camp.active=!this.S.v24.camp.active},
 v24CookMeal(){if(allowCook)this.S.world.hour+=2},v24SleepCamp(){if(allowSleep)this.S.world.hour+=8},
 v24AssignWatch(){let eligible=this.S.people.filter(p=>p.alive&&p.location===this.S.world.location&&/Knight|Footman|Captain|Sergeant|Swordsman/.test(`${p.role} ${p.rank}`));if(!eligible.length)return this.v19Block('NO WATCH AVAILABLE','No present fighting retainer can take the watch.');guardCalls++;this.S.v24.camp.watchers=eligible.map(p=>p.id)},v24RemovePlot(i){this.S.v24.camp.placements[i]=null}};
sandbox.v14Now=()=>sandbox.S.world.day*24+sandbox.S.world.hour;sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.runInNewContext(fs.readFileSync('patches/v1.73.5-camp-scenes.js','utf8'),sandbox,{filename:'v1.73.5-camp-scenes.js'});
const api=sandbox.AetherionV1735CampScenes;
assert(api);assert.deepEqual(Object.fromEntries(Object.entries(api.scenes)),{make:'make-camp.mp4',strike:'strike-camp.mp4',food:'camp-food.mp4',sleep:'camp-sleep.mp4',guard:'guard-watch.mp4'});assert.match(sandbox.v24CampMap(),/MAKE CAMP/);

let start=sandbox.v14Now();sandbox.v24EstablishCamp();assert.equal(sandbox.v14Now(),start);assert.equal(api.runtime.plays.make,0,'empty camp plan must not play');
sandbox.S.v24.camp.placements[0]={kind:'military'};start=sandbox.v14Now();sandbox.v24EstablishCamp();assert.equal(sandbox.v14Now()-start,2);assert.equal(api.runtime.plays.make,1);
assert.match(modal,/make-camp\.mp4/);assert.match(modal,/poster="[^"]+make-camp\.webp"/);assert.match(modal,/>SKIP<\/button>/);assert.doesNotMatch(modal,/\scontrols(?:\s|=|>)/);assert.doesNotMatch(modal,/>PLAY<|RETURN TO CAMP/);assert.equal(elements.get('v1735CampVideo').controls,false);
assert.equal(elements.get('v1735CampVideo').played,2,'a blocked sound autoplay must retry muted');assert.equal(elements.get('v1735CampVideo').muted,true);
listeners.ended();assert.equal(campOpens,1);

start=sandbox.v14Now();sandbox.v24EstablishCamp();assert.equal(sandbox.v14Now()-start,1);assert.equal(api.runtime.plays.strike,1);assert.deepEqual(advances,[{hours:1,activity:'camp'}]);

sandbox.v24AssignWatch();assert.equal(guardCalls,0);assert.equal(api.runtime.plays.guard,0);assert.equal(blocks.at(-1).title,'NO ESTABLISHED CAMP');
sandbox.S.v24.camp.active=true;sandbox.v24AssignWatch();assert.equal(guardCalls,0);assert.equal(api.runtime.plays.guard,0);assert.equal(blocks.at(-1).title,'NO WATCH POST');
sandbox.S.v24.camp.placements[1]={kind:'watch'};sandbox.S.people.forEach(p=>p.location='Elsewhere');sandbox.v24AssignWatch();assert.equal(guardCalls,0);assert.equal(api.runtime.plays.guard,0);assert.equal(blocks.at(-1).title,'NO WATCH AVAILABLE');
sandbox.S.people.forEach(p=>p.location='Solaris');sandbox.v24AssignWatch();assert.equal(guardCalls,1);assert.equal(api.runtime.plays.guard,1);assert.match(modal,/guard-watch\.mp4/);assert.match(modal,/guard-watch\.webp/);assert.deepEqual(sandbox.S.v24.camp.watchers,['guard_a','guard_b']);
sandbox.v24RemovePlot(1);assert.equal(sandbox.S.v24.camp.watchers.length,0,'removing the last Watch Post must clear its guard assignment');

sandbox.S.v24.camp.cookReady=true;start=sandbox.v14Now();sandbox.v24CookMeal();assert.equal(sandbox.v14Now()-start,2);assert.equal(api.runtime.plays.food,1);assert.match(modal,/camp-food\.mp4/);
start=sandbox.v14Now();sandbox.v24SleepCamp();assert.equal(sandbox.v14Now()-start,8);assert.equal(api.runtime.plays.sleep,1);assert.match(modal,/camp-sleep\.mp4/);
api.skip();assert.equal(api.runtime.skips,1);assert.equal(campOpens,2);assert.match(styleText,/pointer-events:none/);assert.match(styleText,/webkit-media-controls-start-playback-button/);
console.log('v1.73.5 camp scenes: five exact autoplay routes, muted Android fallback, posters, hidden native overlay, skip-only UI, Watch Post guard gate, and realistic time passed');
