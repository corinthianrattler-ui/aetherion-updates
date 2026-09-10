'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

let modal='',campOpens=0,persists=0,allowToggle=true,allowCook=true,allowSleep=true,styleText='';
const listeners={},elements=new Map(),advances=[];
function media(){return{hidden:false,played:0,paused:0,ended:false,addEventListener(type,fn){listeners[type]=fn},play(){this.played++;return Promise.resolve()},pause(){this.paused++},removeAttribute(){},load(){}}}
function openModal(html){modal=html;elements.clear();elements.set('v1733CampVideo',media());elements.set('v1733CampFallback',{hidden:true})}
const document={head:{appendChild(node){styleText=node.textContent}},createElement(){return{style:{},textContent:'',id:''}},getElementById(id){return elements.get(id)||null}};
const sandbox={console,document,openModal,closeModal(){},persist(){persists++},v24OpenCamp(){campOpens++},V24_CAMP_MAP:'assets/maps/dominus_road_camp_v24.webp',S:{world:{day:2,hour:4},v24:{camp:{active:false}}},
 advanceHours(hours,activity){advances.push({hours,activity});sandbox.S.world.hour+=hours},
 v24CampMap(){return'<button>ESTABLISH / STRIKE CAMP</button>'},
 v24EstablishCamp(){if(!allowToggle)return;if(!this.S.v24.camp.active)this.S.world.hour+=2;this.S.v24.camp.active=!this.S.v24.camp.active},
 v24CookMeal(){if(allowCook)this.S.world.hour+=2},
 v24SleepCamp(){if(allowSleep)this.S.world.hour+=8}};
sandbox.v14Now=()=>sandbox.S.world.day*24+sandbox.S.world.hour;
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.runInNewContext(fs.readFileSync('patches/v1.73.3-camp-scenes.js','utf8'),sandbox,{filename:'v1.73.3-camp-scenes.js'});
const api=sandbox.AetherionV1733CampScenes;
assert(api);
assert.deepEqual(Object.fromEntries(Object.entries(api.scenes)),{make:'make-camp.mp4',strike:'strike-camp.mp4',food:'camp-food.mp4',sleep:'camp-sleep.mp4'});
assert.match(sandbox.v24CampMap(),/MAKE CAMP/);

allowToggle=false;let start=sandbox.v14Now();sandbox.v24EstablishCamp();
assert.equal(sandbox.v14Now(),start);assert.equal(api.runtime.plays.make,0,'blocked Make Camp must not advance time or play a film');
allowToggle=true;start=sandbox.v14Now();sandbox.v24EstablishCamp();
assert.equal(sandbox.v14Now()-start,2);assert.equal(api.runtime.plays.make,1);assert.match(modal,/make-camp\.mp4/);assert.match(sandbox.v24CampMap(),/TAKE DOWN CAMP/);
assert.match(modal,/>SKIP<\/button>/);assert.match(modal,/autoplay/);assert.match(modal,/playsinline/);assert.match(modal,/controlslist="nodownload nofullscreen noremoteplayback"/);assert.doesNotMatch(modal,/\scontrols(?:\s|=|>)/);assert.doesNotMatch(modal,/>PLAY<|RETURN TO CAMP/);
listeners.ended();assert.equal(campOpens,1,'a completed film must return to the interactive camp');

start=sandbox.v14Now();sandbox.v24EstablishCamp();
assert.equal(sandbox.v14Now()-start,1,'taking camp down must consume one realistic hour');assert.equal(api.runtime.plays.strike,1);assert.match(modal,/strike-camp\.mp4/);assert.equal(persists,1,'taking camp down must persist immediately');assert.deepEqual(advances,[{hours:1,activity:'camp'}]);

allowCook=false;start=sandbox.v14Now();sandbox.v24CookMeal();assert.equal(sandbox.v14Now(),start);assert.equal(api.runtime.plays.food,0,'blocked meal must not advance time or play a film');
allowCook=true;start=sandbox.v14Now();sandbox.v24CookMeal();assert.equal(sandbox.v14Now()-start,2);assert.equal(api.runtime.plays.food,1);assert.match(modal,/camp-food\.mp4/);
allowSleep=false;start=sandbox.v14Now();sandbox.v24SleepCamp();assert.equal(sandbox.v14Now(),start);assert.equal(api.runtime.plays.sleep,0,'blocked sleep must not advance time or play a film');
allowSleep=true;start=sandbox.v14Now();sandbox.v24SleepCamp();assert.equal(sandbox.v14Now()-start,8);assert.equal(api.runtime.plays.sleep,1);assert.match(modal,/camp-sleep\.mp4/);

listeners.error();assert.equal(api.runtime.errors,1);assert.equal(elements.get('v1733CampVideo').hidden,true);assert.equal(elements.get('v1733CampFallback').hidden,false);
api.skip();assert.equal(api.runtime.skips,1);assert.equal(campOpens,2);
assert.match(styleText,/pointer-events:none/);assert.match(styleText,/\.v1733CampSkip/);
console.log('v1.73.3 camp scenes: control-free autoplay, skip-only UI, exact routing, realistic time, fallback, and return passed');
