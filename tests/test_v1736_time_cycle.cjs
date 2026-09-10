'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

let modal='',campOpens=0,persists=0,renders=0,guardCalls=0,styleText='';
const listeners={},elements=new Map(),stories=[],blocks=[];
function media(){return{played:0,paused:0,muted:false,controls:true,addEventListener(type,fn){listeners[type]=fn},play(){this.played++;return{catch:fn=>{if(this.played===1)fn();return this}}},pause(){this.paused++},removeAttribute(name){if(name==='controls')this.controls=false},load(){}}}
function openModal(html){modal=html;elements.clear();if(html.includes('v1736CampVideo'))elements.set('v1736CampVideo',media())}
const document={head:{appendChild(node){styleText=node.textContent}},createElement(){return{style:{},textContent:'',id:''}},getElementById(id){return elements.get(id)||null}};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const sandbox={console,document,openModal,closeModal(){},persist(){persists++},render(){renders++},v24OpenCamp(){campOpens++},v19Block(title,text){blocks.push({title,text});return false},toast(){},clamp,
 S:{world:{day:0,hour:22,location:'Solaris'},player:{alive:true,hunger:100,thirst:100,energy:82,fatigue:18,conditions:[],hp:100,maxHp:125},company:{morale:70,cohesion:70},people:[{id:'guard_a',alive:true,location:'Solaris',role:'Lesser Knight',morale:60}],v24:{camp:{active:true,placements:[{kind:'military',capacity:10},{kind:'watch',capacity:0}],watchers:[],cookReady:true}}},
 lwCalendar(){return{season:'Summer'}},lwDateLabel(){return'Spearsday, 18 Harvestwane 873 AE · Summer'},v14Now(){return sandbox.S.world.day*24+sandbox.S.world.hour},v14ActivePeople(){return[]},v24CampCapacity(){return sandbox.S.v24.camp.placements.reduce((n,p)=>n+(p?.capacity||0),0)},v24CampSecurity(){let c=sandbox.S.v24.camp;return c.watchers.length*16+c.placements.filter(p=>p?.kind==='watch').length*12},v14MoraleChange(delta){sandbox.S.company.morale=clamp(sandbox.S.company.morale+delta,0,100)},
 pushStory(speaker,text){stories.push({speaker,text})},log(){},healPlayer(amount){sandbox.S.player.hp=clamp(sandbox.S.player.hp+Math.round(amount),0,sandbox.S.player.maxHp)},damagePlayer(amount){sandbox.S.player.hp=clamp(sandbox.S.player.hp-Math.round(amount),0,sandbox.S.player.maxHp)},
 refreshConditions(){sandbox.S.player.conditions=[]},movementModifier(){return 1},makeStartState(){return JSON.parse(JSON.stringify(sandbox.S))},migrateState(x){return x},
 mainShell(){return'<div class="shell"><header class="topbar"><div class="brand">AETHERION REFORGED</div><span>Solaris</span></header></div>'},storyTab(){return'<button onclick="sleepHours(8)">REST 8H</button>'},characterTab(){return'<button onclick="sleepHours(8)">Rest 8h</button>'},
 advanceHours(hours,activity='time'){sandbox.S.player.energy=clamp(sandbox.S.player.energy-hours*.55,0,100);sandbox.S.world.hour+=hours;while(sandbox.S.world.hour>=24){sandbox.S.world.hour-=24;sandbox.S.world.day++}},
 v24CampMap(){return'<section><div class="campActions"><button>ESTABLISH / STRIKE CAMP</button><button>SLEEP 8 HOURS</button></div><h3>Watch</h3></section>'},
 v24EstablishCamp(){sandbox.S.v24.camp.active=!sandbox.S.v24.camp.active;if(sandbox.S.v24.camp.active)sandbox.advanceHours(2,'camp')},
 v24CookMeal(){sandbox.advanceHours(2,'camp')},v24SleepCamp(){sandbox.advanceHours(8,'rest')},
 v24AssignWatch(){let eligible=sandbox.S.people.filter(p=>p.alive&&p.location===sandbox.S.world.location);if(!eligible.length)return sandbox.v19Block('NO WATCH AVAILABLE','No guard.');guardCalls++;sandbox.S.v24.camp.watchers=eligible.map(p=>p.id)},
 v24RemovePlot(i){sandbox.S.v24.camp.placements[i]=null},battle:null
};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.runInNewContext(fs.readFileSync('patches/v1.73.6-time-cycle.js','utf8'),sandbox,{filename:'v1.73.6-time-cycle.js'});
const api=sandbox.AetherionV1736Time;
assert(api);assert.equal(api.version,'1.73.6');
assert.deepEqual(Object.fromEntries(Object.entries(api.scenes)),{make:'make-camp.mp4',strike:'strike-camp.mp4',food:'camp-food.mp4',sleep:'camp-sleep.mp4',guard:'guard-watch.mp4'});

let sky=api.celestial();
assert.equal(sky.time,'22:00');assert.equal(sky.day,false);assert.equal(sky.dawn,5);assert.equal(sky.dusk,20);assert.equal(sky.moon.name,'Full Blood Moon');
let shell=sandbox.mainShell();assert.match(shell,/aethTimeHeader/);assert.match(shell,/aethSkyClock/);assert.match(shell,/22:00/);assert.doesNotMatch(shell,/Kingdom Come/i);
assert.match(sandbox.storyTab(),/SLEEP UNTIL DAWN/);assert.match(sandbox.characterTab(),/SLEEP UNTIL DAWN/);
assert.match(sandbox.v24CampMap(),/TAKE DOWN CAMP/);assert.match(sandbox.v24CampMap(),/SLEEP UNTIL DAWN/);assert.match(sandbox.v24CampMap(),/WAIT \/ PASS TIME/);

api.open();assert.match(modal,/Aetherion Sky Dial/);assert.match(modal,/Full Blood Moon/);assert.match(modal,/WAIT 1 HOUR/);assert.match(modal,/WAIT UNTIL DUSK/);assert.match(modal,/SLEEP UNTIL DAWN/);

let start=sandbox.v14Now();sandbox.v24SleepCamp();assert.equal(sandbox.v14Now()-start,7,'22:00 summer sleep must end at 05:00 dawn');assert.equal(sandbox.S.world.hour,5);assert.equal(api.state().awakeHours,0);assert.equal(api.runtime.plays.sleep,1);assert.match(modal,/camp-sleep\.mp4/);assert.match(modal,/camp-sleep\.webp/);assert.doesNotMatch(modal,/\scontrols(?:\s|=|>)/);assert.equal(elements.get('v1736CampVideo').controls,false);assert.equal(elements.get('v1736CampVideo').played,2);assert.equal(elements.get('v1736CampVideo').muted,true);
listeners.ended();assert.equal(campOpens,1);

sandbox.S.v24.camp.active=false;sandbox.S.world.hour=12;sandbox.S.player.hunger=100;sandbox.S.player.thirst=100;api.state().awakeHours=7;start=sandbox.v14Now();api.sleepToDawn(false);assert.equal(sandbox.v14Now()-start,17,'midday sleep must continue to next dawn');assert.equal(sandbox.S.world.hour,5);

sandbox.S.world.hour=5;sandbox.S.player.energy=100;sandbox.S.v1736Time.awakeHours=0;sandbox.refreshConditions();let waited=api.wait(20);assert.equal(waited.hours,20);assert.equal(sandbox.S.v1736Time.awakeHours,20);assert(sandbox.S.player.energy<90);assert(sandbox.S.player.conditions.includes('Tired'));
api.wait(8);assert.equal(sandbox.S.v1736Time.awakeHours,28);assert(sandbox.S.player.conditions.includes('Sleep Deprived'));assert.equal(sandbox.movementModifier(),.9);
start=sandbox.S.v1736Time.awakeHours;sandbox.advanceHours(2,'travel');assert.equal(sandbox.S.v1736Time.awakeHours,start+2,'travel remains awake time unless a real Sleep action occurs');
sandbox.battle={ended:false};start=sandbox.v14Now();assert.equal(api.wait(1),false);assert.equal(sandbox.v14Now(),start);assert.equal(blocks.at(-1).title,'TIME CANNOT PASS');sandbox.battle=null;

sandbox.S.v24.camp.active=true;sandbox.S.v24.camp.watchers=[];sandbox.S.v24.camp.placements=[];sandbox.v24AssignWatch();assert.equal(guardCalls,0);assert.equal(blocks.at(-1).title,'NO WATCH POST');sandbox.S.v24.camp.placements.push({kind:'watch',capacity:0});sandbox.v24AssignWatch();assert.equal(guardCalls,1);assert.equal(api.runtime.plays.guard,1);assert.match(modal,/guard-watch\.mp4/);
sandbox.v24RemovePlot(0);assert.equal(sandbox.S.v24.camp.watchers.length,0);
assert.match(styleText,/aethTimeHeader/);assert.match(styleText,/aethBloodMoon/);assert.match(styleText,/webkit-media-controls-start-playback-button/);
assert(persists>0);assert(renders>0);assert(stories.some(row=>/without sleep/i.test(row.text)));
console.log('v1.73.6 time cycle: Aetherion sky dial, seasonal dawn, blood-moon phases, wait controls, sleep-to-dawn, exhaustion, camp gates, and five films passed');
