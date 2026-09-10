'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

let modal='',campOpens=0,persists=0,allowToggle=true,allowCook=true,allowSleep=true;
const listeners={},elements=new Map();
function media(){return{hidden:false,played:0,paused:0,addEventListener(type,fn){listeners[type]=fn},play(){this.played++;return Promise.resolve()},pause(){this.paused++},removeAttribute(){},load(){}}}
function openModal(html){modal=html;elements.clear();elements.set('v1732CampVideo',media());elements.set('v1732CampFallback',{hidden:true});elements.set('v1732CampPlay',{hidden:true})}
const document={head:{appendChild(){}},createElement(){return{style:{},textContent:'',id:''}},getElementById(id){return elements.get(id)||null}};
const sandbox={console,document,openModal,closeModal(){},persist(){persists++},v24OpenCamp(){campOpens++},V24_CAMP_MAP:'assets/maps/dominus_road_camp_v24.webp',S:{world:{day:2,hour:4},v24:{camp:{active:false}}},
 v24CampMap(){return'<button>ESTABLISH / STRIKE CAMP</button>'},
 v24EstablishCamp(){if(allowToggle)this.S.v24.camp.active=!this.S.v24.camp.active},
 v24CookMeal(){if(allowCook)this.S.world.hour+=2},
 v24SleepCamp(){if(allowSleep)this.S.world.hour+=8}};
sandbox.v14Now=()=>sandbox.S.world.day*24+sandbox.S.world.hour;
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.runInNewContext(fs.readFileSync('patches/v1.73.2-camp-scenes.js','utf8'),sandbox,{filename:'v1.73.2-camp-scenes.js'});
const api=sandbox.AetherionV1732CampScenes;
assert(api);
assert.deepEqual(Object.fromEntries(Object.entries(api.scenes).map(([key,row])=>[key,row.file])),{make:'make-camp.mp4',strike:'strike-camp.mp4',food:'camp-food.mp4',sleep:'camp-sleep.mp4'});
assert.match(sandbox.v24CampMap(),/MAKE CAMP/);

allowToggle=false;sandbox.v24EstablishCamp();
assert.equal(api.runtime.plays.make,0,'blocked Make Camp must not play a film');
allowToggle=true;sandbox.v24EstablishCamp();
assert.equal(api.runtime.plays.make,1);assert.match(modal,/make-camp\.mp4/);assert.match(sandbox.v24CampMap(),/TAKE DOWN CAMP/);
sandbox.v24EstablishCamp();
assert.equal(api.runtime.plays.strike,1);assert.match(modal,/strike-camp\.mp4/);assert.equal(persists,1,'taking camp down must persist immediately');

allowCook=false;sandbox.v24CookMeal();assert.equal(api.runtime.plays.food,0,'blocked meal must not play a film');
allowCook=true;sandbox.v24CookMeal();assert.equal(api.runtime.plays.food,1);assert.match(modal,/camp-food\.mp4/);
allowSleep=false;sandbox.v24SleepCamp();assert.equal(api.runtime.plays.sleep,0,'blocked sleep must not play a film');
allowSleep=true;sandbox.v24SleepCamp();assert.equal(api.runtime.plays.sleep,1);assert.match(modal,/camp-sleep\.mp4/);

listeners.error();assert.equal(api.runtime.errors,1);assert.equal(elements.get('v1732CampVideo').hidden,true);assert.equal(elements.get('v1732CampFallback').hidden,false);
api.returnToCamp();assert.equal(campOpens,1);
assert(modal.includes('playsinline')&&modal.includes('controls')&&modal.includes('autoplay'));
console.log('v1.73.2 camp scenes: four distinct films, exact action routing, blocked-action guard, fallback, and return passed');
