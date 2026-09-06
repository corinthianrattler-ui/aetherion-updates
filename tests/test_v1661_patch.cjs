'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const patch = fs.readFileSync('patches/v1.66.1-immersive-narrator-sophia.js', 'utf8');
const testConsole = Object.create(console);
testConsole.warn = () => {};
const context = { console: testConsole };
context.window = context;
vm.createContext(context);

vm.runInContext(`
 const AETHERION_ASSETS=['assets/v26/scenes/temple_priestess.webp'];
 const ASSET={rose:'assets/characters/narrator_rose_gold.webp'};
 let persistCalls=0,lastModal='',lastSpoken=null,voiceQueue=[];
 let S={
  meta:{},
  world:{day:45,hour:10,location:'Corvinus Keep',region:'Solara',weather:{condition:'Clouded',temp:24}},
  people:[{id:'libita',name:'Libita Savitas',alive:true,location:'Corvinus Keep',voice:'YF',portrait:'libita.webp'}],
  story:[{
   id:'bad_saved',speaker:'Narrator',
   text:'Libita Savitas signs the company ledger in Corvinus Keep. Weekly pay begins with the next payroll; no invented advance changes hands.\\n\\nThe terms are spoken aloud and entered under the 3-silver weekly ceiling; pay begins only for service actually rendered, and the same figure now appears wherever the person is inspected.\\n\\nPeople nearby understand the moment through their own duties and risks. A guard watches for danger, a worker measures labor and material, and a companion hears what the choice says about trust; no reaction is declared certain until that person speaks or acts.\\n\\nThe account remains grounded in what Valkorion can presently witness. Coin, time, carried stores, injuries, loyalties, and unfinished orders continue from this moment; anything unknown stays unknown until a person, place, document, or report reveals it.'
  }]
 };
 const document={
  head:{appendChild(){}},
  createElement(){return{id:'',textContent:''}},
  getElementById(){return null}
 };
 function esc(value){return String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}
 function entityImage(src,name,cls=''){return '<img class="'+cls+'" src="'+src+'" alt="'+name+'">'}
 function persist(){persistCalls++}
 function openModal(html){lastModal=html}
 function closeModal(){lastModal=''}
 function log(){}
 function render(){}
 function systemDock(){return '<aside class="dock"><div class="dockTabs"><button>STORY</button></div></aside>'}
 function storyTab(){return '<section><button class="small" onclick="locationActions()">LOCATION ACTIONS</button></section>'}
 function voiceProfileForSpeaker(name){return name==='Narrator'?{gender:'M',voice:'am_onyx',label:'Mature narrator',sid:-1,performance:'narrator'}:{gender:'M',voice:'am_michael',label:'Adult male',sid:1,performance:'male_adult'}}
 function speakerPortrait(name){return name==='Narrator'?ASSET.rose:null}
 function stopSpeech(){voiceQueue=[];lastSpoken=null}
 function pumpSpeech(){lastSpoken=voiceQueue[0]||null}
 function makeStartState(){return JSON.parse(JSON.stringify(S))}
 function migrateState(save){return save}

 // Reproduce the bad v1.66 wrapper beneath the follow-up patch. It expands
 // any short Narrator line unless the newer wrapper hands it multi-paragraph prose.
 function pushStory(speaker,text,voice=null,portrait=null){
  if(speaker==='Narrator'&&String(text).length<320&&!String(text).includes('\\n\\n')){
   text+='\\n\\nThe terms are spoken aloud and entered under the 3-silver weekly ceiling; pay begins only for service actually rendered.\\n\\nPeople nearby understand the moment through their own duties and risks.\\n\\nThe account remains grounded in what Valkorion can presently witness.';
  }
  S.story.push({id:'story_'+S.story.length,speaker,text,voice,portrait});
  return true;
 }
 function resolveFreeAction(){pushStory('Narrator','The action is attempted against the current scene. If it requires a specific system, the corresponding control must validate world state changes.')}
 function resolveFreeCommand(){pushStory('Narrator','The company hears the order, but no specific subordinate was identified. Use Party → Order to assign persistent duties.')}
`, context, { filename: 'v1661-base-runtime.js' });

vm.runInContext(`(0,eval)(${JSON.stringify(patch)})`, context, { filename: 'aetherion-updater-eval.js' });

const api = context.AetherionV1661Immersion;
assert.equal(api.version, '1.66.1');
assert.equal(api.policy, 'valkorion-limited-narration-v1.66.1');
assert.equal(api.sophia, 'Sophia, Goddess of Wisdom');
assert.equal(api.sophiaArt, 'assets/v26/scenes/temple_priestess.webp');
assert(vm.runInContext('AETHERION_ASSETS.includes(AetherionV1661Immersion.sophiaArt)', context));

const migrated = vm.runInContext(`(() => ({
 text:S.story[0].text,
 meta:S.meta.v1661Narrator,
 persistCalls
}))()`, context);
assert.equal(migrated.meta.version, '1.66.1');
assert.equal(migrated.meta.perspective, 'first-person limited; Valkorion knowledge only');
assert.equal(migrated.meta.sophiaHelp, true);
assert.equal(migrated.meta.cleanedStoryBlocks, 1);
assert.equal(migrated.persistCalls, 1);
assert.match(migrated.text, /Libita Savitas bends over the open company ledger/);
assert.match(migrated.text, /I hear the nib scratch/);
assert.match(migrated.text, /\n\n/);
assert.doesNotMatch(migrated.text, /weekly pay|payroll|silver ceiling|same figure|People nearby understand|account remains grounded|invented advance/i);

const beforeIdempotent = migrated.text;
vm.runInContext('AetherionV1661Immersion.repairState(S)', context);
assert.equal(vm.runInContext('S.story[0].text', context), beforeIdempotent);
assert.equal(vm.runInContext('S.meta.v1661Narrator.cleanedStoryBlocks', context), 1);

const narrated = vm.runInContext(`(() => {
 S.story=[];
 pushStory('Narrator','Valkorion enters a tavern at Corvinus Keep. Smoke, wet wool, food, spilled drink and low conversation occupy the room.');
 pushStory('Narrator','The company departs.');
 pushStory('Libita Savitas','“I am ready.”','YF','libita.webp');
 return S.story;
})()`, context);
assert.equal(narrated.length, 3);
assert.match(narrated[0].text, /^I enter a tavern/);
assert.match(narrated[0].text, /\n\n/);
assert.match(narrated[0].text, /smell|voices|warmth|chill/i);
assert.match(narrated[1].text, /\n\n/);
assert.match(narrated[1].text, /I mark the journey/);
assert.doesNotMatch(narrated[0].text+narrated[1].text, /system|button|menu|weekly pay|silver ceiling|same figure|world state/i);
assert.equal(narrated[2].text, '“I am ready.”');

const group = api.immersiveNarration('Valkorion addresses everyone close enough to hear him at Corvinus Keep. Libita Savitas, Master Bram Holt, and Ser Roderic Vale answer first because their duties bear on the matter.\n\nNo private confidence is assumed here.');
assert.match(group, /^I raise my voice/);
assert.match(group, /no private exchange/i);
assert.doesNotMatch(group, /No private confidence is assumed|speaker selector|system/i);

const mechanicRewrites = [
 api.immersiveNarration('Libita takes the floor. Morale rises 5; cohesion rises 2.'),
 api.immersiveNarration('Silverwing joins the traveling companion roster. Deployment is enabled, feeding remains physical, injury is possible and the companion will now strike inside real battle rounds.'),
 api.immersiveNarration('Valkorion enters the gate chamber. The ledger now treats it as his precise location inside Corvinus Keep; people elsewhere in the keep cannot automatically witness what happens here.')
];
for(const text of mechanicRewrites){
 assert.match(text, /\n\n/);
 assert.doesNotMatch(text, /Morale rises|cohesion rises|Deployment is enabled|battle rounds|ledger now treats|automatically witness|system|button|menu/i);
}

const freeform = vm.runInContext(`(() => {
 S.story=[];
 resolveFreeAction('drink the wine');
 resolveFreeAction('attack the enemy');
 resolveFreeCommand('Advance now');
 return S.story.map(row=>row.text);
})()`, context);
assert.equal(freeform.length, 3);
assert.match(freeform[0], /cup, skin, loaf, or ration|nothing has yet passed my lips/i);
assert.match(freeform[1], /no hostile body|no hostile target/i);
assert.match(freeform[2], /I give the order/);
assert(freeform.every(text => text.includes('\n\n')));
assert.doesNotMatch(freeform.join(' '), /Inventory|Party\s*→|corresponding control|world state|button|menu|system/i);

const ui = vm.runInContext(`(() => {
 S.story=[];
 let dock=systemDock(),story=storyTab(),before=S.story.length,help=sophiaHelp('money'),after=S.story.length;
 return{dock,story,help,lastModal,before,after};
})()`, context);
assert.match(ui.dock, /SOPHIA · HELP/);
assert.match(ui.story, /sophiaStoryHelp/);
assert.match(ui.help, /System Goddess of Wisdom · Help only/);
assert.match(ui.help, /Coin and Weekly Pay/);
assert.match(ui.help, /rare master surgeons/i);
assert.match(ui.lastModal, /Her guidance is never inserted into the Narrator/);
assert.equal(ui.before, ui.after, 'opening Sophia help must not add a story entry');

const voice = vm.runInContext(`(() => {
 let narrator=voiceProfileForSpeaker('Narrator'),sophia=voiceProfileForSpeaker('Sophia, Goddess of Wisdom');
 let before=S.story.length,played=sophiaSpeak('items'),after=S.story.length;
 return{narrator,sophia,played,lastSpoken,before,after,portrait:speakerPortrait('Sophia, Goddess of Wisdom')};
})()`, context);
assert.equal(voice.sophia.gender, 'F');
assert.equal(voice.sophia.voice, 'af_sarah');
assert.equal(voice.sophia.performance, 'female_mature');
assert.match(voice.sophia.label, /Sophia/);
assert.notEqual(voice.sophia.voice, voice.narrator.voice);
assert.equal(voice.lastSpoken.speaker, 'Sophia, Goddess of Wisdom');
assert.match(voice.lastSpoken.text, /Corvinus Provisioner begins with Good Wine for Kael/);
assert.equal(voice.before, voice.after, 'Sophia voice playback must stay outside the story');
assert.equal(voice.portrait, 'assets/v26/scenes/temple_priestess.webp');

console.log('v1.66.1 immersive Narrator and Sophia Help patch: all assertions passed');
