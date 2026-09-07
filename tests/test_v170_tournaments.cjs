'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('patches/v1.70.0-tournaments.js','utf8');
assert(!/Empty Jousting Lists|Empty Armored Duel Ring|Rain-swept medieval/.test(source),'rejected heraldry asset was referenced');

const notices=[],stories=[],gains=[];
const S={
 meta:{},world:{day:3,hour:8,location:'Corvinus Keep'},player:{alive:true,energy:100,hp:125,maxHp:125,reputation:{Nobility:0},wounds:[]},
 money:{gold:0,silver:10,copper:0},company:{},logs:{system:[]}
};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const rnd=(min,max)=>min+Math.floor(Math.random()*(max-min+1));
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const moneyCopper=()=>S.money.gold*10000+S.money.silver*100+S.money.copper;
const setMoneyCopper=value=>{value=Math.max(0,Math.round(value));S.money.gold=Math.floor(value/10000);value%=10000;S.money.silver=Math.floor(value/100);S.money.copper=value%100};
const payCopper=value=>{const total=moneyCopper();if(total<value)return false;setMoneyCopper(total-value);return true};
const earnCopper=value=>setMoneyCopper(moneyCopper()+value);
const document={head:{appendChild(){}},createElement:()=>({id:'',textContent:''}),getElementById:()=>null};
let currentTab='tournaments',renders=0,persists=0,hours=0;
const context={
 console,window:null,document,S,currentTab,clamp,rnd,esc,payCopper,earnCopper,
 systemDock:()=>'<aside><div class="dockTabs"><button>STORY</button></div><h3>Immediate State</h3></aside>',
 tabContent:()=>'<section>story</section>',migrateState:x=>x,makeStartState:()=>({meta:{},player:{reputation:{}},world:{}}),
 render(){renders++},persist(){persists++},advanceHours(value){hours+=value;S.world.hour+=value},toast:value=>notices.push(value),
 pushStory:(speaker,text)=>stories.push({speaker,text}),v26Ensure:()=>({skills:{Riding:55,Swordsmanship:60,Hunting:50}}),v26Gain:(name,value)=>gains.push({name,value}),
 requestAnimationFrame:()=>1,cancelAnimationFrame(){},performance:{now:()=>1000},setTimeout:fn=>fn()
};
context.window=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:'v1.70.0-tournaments.js'});

const api=context.AetherionTournamentsV170;
assert.equal(api.version,'1.70.0');
assert.deepEqual({...api.assets},{joust:'assets/v170/jousting-arena.png',duel:'assets/v170/duel-arena.png',archery:'assets/v170/archery-range.png'});
assert.match(context.systemDock(),/v170OpenTournamentGrounds/);
assert.match(context.tabContent(),/Tournament Grounds/);
assert.match(api.hub(),/ENTER FULL TOURNEY/);
assert.match(api.hub(),/Jousting Lists/);
assert.match(api.hub(),/Armored Duel Ring/);
assert.match(api.hub(),/Archery Butts/);

assert.equal(api.rules.laneExposure('high'),'low');
assert.equal(api.rules.timingGrade(.04),3);
assert.equal(api.rules.timingGrade(.20),1);
assert.equal(api.rules.timingGrade(.30),0);
assert.equal(api.rules.archeryPoints(.02),10);
assert.equal(api.rules.archeryPoints(.10),7);
assert.equal(api.rules.archeryPoints(.20),4);
assert.equal(api.rules.archeryPoints(.30),1);
assert.equal(api.rules.archeryPoints(.5),0);
assert.equal(api.rules.duelAnswer('thrust','parry'),true);
assert.equal(api.rules.duelAnswer('feint','high_guard'),false);
assert.equal(api.rules.joustResolution('low','high',0.01,80,.5).points,3);
assert.equal(api.rules.joustResolution('high','high',0.4,20,.5).points,0);

const before=moneyCopper();
context.v170StartTournament('duel',false);
assert.equal(moneyCopper(),before-100,'single-event entry fee was not charged');
assert.equal(api.state().ledger.entries,1);
assert.equal(api.state().session.event,'duel');
assert.match(context.tabContent(),/Armored Duel Ring/);
context.v170DuelRespond('high_guard');
assert.equal(api.state().session.game.phase,'resolved');
assert(renders>=2&&persists>=1);

const migrated=context.migrateState({meta:{},player:{reputation:{}},world:{}});
assert.equal(migrated.v170Tournament.version,'1.70.0');
assert.equal(migrated.v170Tournament.wins.archery,0);
assert.equal(context.makeStartState().v170Tournament.version,'1.70.0');
assert.equal(notices.length,0);
assert.equal(hours,0,'starting an event should not consume event time before it resolves');

console.log('v1.70.0 tournaments: access, correct art, rules, persistence, and event startup passed');
