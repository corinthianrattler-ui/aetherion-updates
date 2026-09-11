'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const gameRoot = process.argv[2];
if (!gameRoot) {
  console.log('v1.74.3 complete-game runtime skipped (pass an extracted assets/game path)');
  process.exit(0);
}

const index = fs.readFileSync(path.join(gameRoot, 'index.html'), 'utf8');
const scripts = [...index.matchAll(/<script[^>]+src=["']([^"']+)/g)]
  .map(match => match[1].split('?')[0])
  .filter(source => !source.startsWith('http'));

function storage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    clear: () => values.clear(),
    entries: () => [...values.entries()],
  };
}

function element(tag = 'div') {
  return {
    tagName: String(tag).toUpperCase(), id: '', className: '', style: {setProperty() {}, removeProperty() {}},
    dataset: {}, classList: {add() {}, remove() {}, toggle() {}, contains() { return false; }}, children: [],
    append() {}, appendChild() {}, prepend() {}, remove() {}, replaceChildren() {}, insertAdjacentHTML() {},
    addEventListener() {}, removeEventListener() {}, setAttribute() {}, getAttribute() { return null; },
    removeAttribute() {}, querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; },
    getContext() { return null; }, play() { return Promise.resolve(); }, pause() {}, load() {}, focus() {}, click() {},
    select() {}, innerHTML: '', outerHTML: '', textContent: '', value: '', checked: false, disabled: false,
    volume: 1, muted: false, isConnected: true,
  };
}

let randomSeed = 0x1743cafe;
const testMath = Object.create(Math);
testMath.random = () => {
  randomSeed = (Math.imul(randomSeed, 1664525) + 1013904223) >>> 0;
  return randomSeed / 4294967296;
};

const elements = new Map();
const byId = id => {
  if (!elements.has(id)) elements.set(id, element());
  return elements.get(id);
};
const document = {
  readyState: 'loading', baseURI: 'https://appassets.androidplatform.net/assets/game/index.html',
  head: element('head'), body: element('body'), documentElement: element('html'), scrollingElement: element('html'),
  createElement: element, createTextNode: value => ({textContent: String(value)}), getElementById: byId,
  querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {}, removeEventListener() {},
};
const localStorage = storage();
const voiceCalls = [];
const sandbox = {
  console, Math: testMath, document, localStorage, sessionStorage: storage(),
  navigator: {userAgent: 'Android Aetherion v1.74.3 complete-game test', vibrate() {}, deviceMemory: 8},
  location: {href: document.baseURI, protocol: 'https:', hostname: 'appassets.androidplatform.net', reload() {}},
  performance: {now: () => 0}, crypto: crypto.webcrypto, TextEncoder, TextDecoder,
  URL, Blob, Response, Request, Headers, AbortController, structuredClone,
  atob: value => Buffer.from(String(value), 'base64').toString('binary'),
  btoa: value => Buffer.from(String(value), 'binary').toString('base64'),
  setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  requestAnimationFrame: () => 0, cancelAnimationFrame() {},
  matchMedia: () => ({matches: false, addEventListener() {}, removeEventListener() {}}),
  fetch: async () => new Response('', {status: 404}), Image: class {},
  Audio: class { play() { return Promise.resolve(); } pause() {} },
  MutationObserver: class { observe() {} disconnect() {} }, ResizeObserver: class { observe() {} disconnect() {} },
  addEventListener() {}, removeEventListener() {}, confirm: () => true,
  speechSynthesis: {getVoices() { return []; }, addEventListener() {}, cancel() {}, speak() {}},
  SpeechSynthesisUtterance: class {},
  AetherionVoice: {
    speak(...args) { voiceCalls.push(args); }, stop() {}, isReady() { return true; }, castReady() { return true; },
    castState() { return 'Bundled neural cast ready'; }, mediaVolumePercent() { return 80; }, repair() {},
  },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.self = sandbox;
const context = vm.createContext(sandbox);
const get = source => vm.runInContext(source, context);
const inlineHandlers = [];
function collectInlineHandlers(markup, screen) {
  for (const match of String(markup).matchAll(/\b(on(?:click|change|input|submit|keydown|keyup))=(['"])([\s\S]*?)\2/gi)) {
    inlineHandlers.push({screen, event: match[1].toLowerCase(), source: match[3]});
  }
}

const loadStarted = process.hrtime.bigint();
for (const relative of scripts) {
  const target = path.join(gameRoot, relative);
  assert(fs.existsSync(target), `missing packaged script ${relative}`);
  vm.runInContext(fs.readFileSync(target, 'utf8'), context, {filename: relative});
}
const scriptMs = Number(process.hrtime.bigint() - loadStarted) / 1e6;

assert.equal(new Set(scripts).size, scripts.length, 'index must not load a game script twice');
assert.equal(sandbox.AetherionUpdater?.bundledVersion, '1.74.3');
assert.equal(sandbox.AetherionUpdater?.androidBuild, 198);
assert.equal(sandbox.AetherionUpdateCenterV174?.version, '1.74.3');
assert.equal(sandbox.AetherionUpdateCenterV174?.androidBuild, 198);
assert.equal(sandbox.AetherionPortraitCore?.version, '1.74.3');
assert.equal(sandbox.AetherionV173LivingPortraits?.version, '1.74.3');
assert.equal(sandbox.AetherionV1731KnightDiversity?.version, '1.74.3');
assert.equal(sandbox.AetherionV166LivingWorld?.version, '1.74.3');
assert.equal(sandbox.AetherionV167Integrity?.version, '1.74.3');
assert.equal(sandbox.AetherionDominusDial?.version, '1.74.1');
for (const retired of [
  'patches/v1.68.0-curated-npc-portraits.js', 'patches/v1.74.0-stable-bundle.js',
  'patches/v1.74.2-safe-updater.js', 'patches/v1.74.2-update-center.js', 'systems-v81-fullbody-integrity.js',
  'assets/prisoners/bandit_female.webp', 'assets/prisoners/bandit_male.webp',
  'assets/prisoners/mercenary_male.webp', 'assets/prisoners/orc_male.webp',
  'assets/v28/scenes/dock_foreman.webp', 'assets/v28/scenes/marine_captain.webp',
  'assets/v28/scenes/master_shipwright.webp', 'assets/v28/scenes/navigator.webp',
  'assets/v28/scenes/privateer_captain.webp', 'assets/v28/scenes/quartermaster.webp',
  'assets/v26/scenes/blood_thrall.webp', 'assets/v26/scenes/street_informant.webp',
  'assets/v26/scenes/watch_captain.webp',
]) {
  assert(!scripts.includes(retired), `retired startup layer is still loaded: ${retired}`);
  assert(!fs.existsSync(path.join(gameRoot, retired)), `retired startup layer is still packaged: ${retired}`);
}

get('v42DifficultyScreen()');
assert.match(byId('app').innerHTML, /difficulty_oath\.mp4/);
assert.match(byId('app').innerHTML, /data-diff="craven"/);
assert.match(byId('app').innerHTML, /data-diff="blood_emperor"/);
collectInlineHandlers(byId('app').innerHTML, 'difficulty');
get("v42SelectDifficulty('lord')");
assert.equal(get('v21PendingDifficulty'), 'lord');
const beginStarted = process.hrtime.bigint();
get('v21BeginChosen()');
const beginMs = Number(process.hrtime.bigint() - beginStarted) / 1e6;
assert.equal(get('S.awakened'), true);
assert.equal(get('S.v21.difficulty'), 'lord');
assert.equal(get('S.world.location'), 'Corvinus Keep');
assert(get('S.story.length') >= 4);
assert(beginMs < 15000, `difficulty-to-game startup took ${beginMs.toFixed(1)}ms`);
assert.match(byId('app').innerHTML, /AETHERION REFORGED/);
assert.match(byId('app').innerHTML, /dominusBloodDial/);
get('v28Ensure()');

const difficultyTimings = [];
for (const difficulty of ['craven', 'knight', 'lord', 'blood_emperor']) {
  sandbox.__difficulty = difficulty;
  const started = process.hrtime.bigint();
  const state = get('v21PendingDifficulty=__difficulty;makeStartState()');
  const elapsed = Number(process.hrtime.bigint() - started) / 1e6;
  assert.equal(state.v21.difficulty, difficulty);
  assert.equal(state.awakened, false);
  assert(elapsed < 15000, `${difficulty} state creation took ${elapsed.toFixed(1)}ms`);
  difficultyTimings.push([difficulty, elapsed]);
}

const api = sandbox.AetherionPortraitCore;
const banned = /^(?:assets\/(?:workers|dynasty|prisoners)\/|assets\/v26\/scenes\/(?:blood_thrall|street_informant|watch_captain)\.webp$|assets\/v28\/scenes\/(?:dock_foreman|marine_captain|master_shipwright|navigator|privateer_captain|quartermaster)\.webp$|assets\/v29\/portraits\/(?!moondancer\.webp$)|assets\/v34\/people\/(?:market_loader|market_teamster|market_wheelwright|quartermaster_corvinus)\.webp$|custom\/npc-portraits\/v168\/00_quartermaster_original_unchanged\.webp$|assets\/v38\/thrall\/nessa_cale_portrait\.webp$)/i;
const placeholders = /^(?:assets\/medical\/surgeon_kit\.webp|assets\/v28\/scenes\/dock_stevedores\.webp|assets\/v35\/scenes\/fishing_port\.webp|assets\/v26\/scenes\/(?:bookseller_shop|blacksmith_forge)\.webp|assets\/v17\/locations\/apothecary\.webp|assets\/v50\/(?:rooms\/stores|jobs\/owned_shop|districts\/shop_row)\.webp)$/i;
const records = get(`(()=>{let rows=[],missing=[],seen=new WeakSet();function walk(v,route='S'){if(!v||typeof v!=='object'||seen.has(v))return;seen.add(v);let person=!!(v.name||v.role||v.gender||Number.isFinite(+v.age));let art=v.portrait||v.img||v.art||'';if(person){if(art)rows.push({route,name:v.name||'',role:v.role||'',gender:v.gender||'',age:v.age,path:art});else if(v.name&&v.role)missing.push({route,name:v.name,role:v.role});}if(Array.isArray(v))v.forEach((x,i)=>walk(x,route+'['+i+']'));else Object.entries(v).forEach(([k,x])=>walk(x,route+'.'+k))}walk(S);return{rows,missing}})()`);
assert(records.rows.length > 1300, `only ${records.rows.length} portrait-bearing records were found`);
assert.equal(records.rows.filter(row => banned.test(row.path) || placeholders.test(row.path)).length, 0);
const sceneAsPerson = records.rows.filter(row => (row.role || row.gender || Number.isFinite(+row.age)) && /(?:scenes|locations|rooms|districts|items|shops?|forge|stables?|camp|background|maps?|units?|animals?)\//i.test(row.path));
assert.equal(sceneAsPerson.length, 0, `scene/item art is still stored as a person portrait: ${JSON.stringify(sceneAsPerson.slice(0, 30), null, 2)}`);
for (const row of records.rows.filter(row => /^(?:assets|custom)\//.test(row.path))) {
  assert(fs.existsSync(path.join(gameRoot, row.path)), `missing person image ${row.path} at ${row.route}`);
}
const initialAudit = api.auditState(get('S'));
assert.equal(initialAudit.ok, true, JSON.stringify(initialAudit.headOrPlaceholderReferences.slice(0, 30), null, 2));
assert.equal(get('S.meta.v1743PortraitCore.obsoletePortraitAssetsRemoved'), 176);

const clothiers = get(`Object.values(S.world.permanentNPCs).flat().filter(person=>person.role==='Master Clothier').map(person=>({gender:person.gender,portrait:person.portrait}))`);
assert(clothiers.length >= 20);
assert(clothiers.every(person => /^custom\/npc-portraits\//.test(person.portrait)), JSON.stringify(clothiers));
assert(clothiers.every(person => api.registry.find(row => row.path === person.portrait)?.gender === person.gender));

const contacts = get('v26Contacts().map(person=>({gender:person.gender,portrait:person.portrait}))');
assert.equal(contacts.length, 4);
assert.equal(new Set(contacts.map(person => person.portrait)).size, 4);
assert(contacts.every(person => /^custom\/npc-portraits\//.test(person.portrait)));
assert(contacts.every(person => api.registry.find(row => row.path === person.portrait)?.gender === person.gender));

const generatedFisher = get(`mkPerson('Test Fisher','Fisher-Sailor','Workers',{id:'test_fisher',gender:'F',age:31,portrait:'assets/v35/scenes/fishing_port.webp'})`);
assert.match(generatedFisher.portrait, /^custom\/npc-portraits\//);
assert.equal(api.registry.find(row => row.path === generatedFisher.portrait)?.gender, 'F');

const justiceArt = get('[JUSTICE_ART.banditMale,JUSTICE_ART.banditFemale,JUSTICE_ART.mercenaryMale,JUSTICE_ART.orcMale]');
assert.deepEqual([...justiceArt], [
  'custom/npc-portraits/v168/82_northern_horse_raider_elder_man.webp',
  'custom/npc-portraits/v168/81_northern_horse_raider_adult_woman.webp',
  'custom/npc-portraits/v168/94_mercenary_heavy_knight_elder_man.webp',
  'custom/npc-portraits/v168/90_orc_raider_adult_man.webp',
]);
for (const portrait of justiceArt) assert(fs.existsSync(path.join(gameRoot, portrait)), `missing full-body prisoner art ${portrait}`);
const portOfficerArt = get('S.v28.laborPool.map(person=>person.portrait)');
assert.equal(portOfficerArt.length, 6);
assert(portOfficerArt.every(portrait => /^custom\/npc-portraits\/v173\//.test(portrait) && fs.existsSync(path.join(gameRoot, portrait))), JSON.stringify(portOfficerArt));

const generated = {id: 'generated_blank', name: 'Generated Worker', role: 'Carpenter', gender: 'F', age: 28, race: 'human', portrait: null};
api.repairGenerated(generated);
assert.match(generated.portrait, /^custom\/npc-portraits\/v173\//);
assert.equal(api.registry.find(row => row.path === generated.portrait)?.gender, 'F');
const authored = {id: 'authored', name: 'Authored Companion', role: 'Companion', gender: 'F', age: 28, portrait: 'assets/characters/lady_alexus_dominus.jpg'};
api.repairOne(authored);
assert.equal(authored.portrait, 'assets/characters/lady_alexus_dominus.jpg');
const nessa = {id: 'nessa', name: 'Nessa Cale', role: 'Thrall', gender: 'F', age: 18, portrait: 'assets/v38/thrall/nessa_cale_portrait.webp'};
api.repairOne(nessa);
assert.equal(nessa.portrait, 'assets/v38/thrall/nessa_cale_encounter.webp');

const retiredPrisoner = {id: 'old_orc', name: 'Old Orc Captive', role: 'Prisoner', kind: 'orc', gender: 'M', age: 34, portrait: 'assets/prisoners/orc_male.webp'};
api.repairOne(retiredPrisoner, {prisoner: true});
assert.equal(retiredPrisoner.portrait, 'custom/npc-portraits/v168/90_orc_raider_adult_man.webp');
const retiredThrall = {id: 'old_thrall', name: 'Old Blood Thrall', species: 'Blood Thrall', gender: 'M', age: 30, img: 'assets/v26/scenes/blood_thrall.webp'};
api.repairOne(retiredThrall);
assert.equal(retiredThrall.img, 'custom/npc-portraits/v173/069_caravan_scout_ym.webp');

const gameplaySnapshot = get('structuredClone(S)');
sandbox.__gameplaySnapshot = gameplaySnapshot;
const resetGameplay = () => get("S=structuredClone(__gameplaySnapshot);battle=null;currentTab='story'");
let gameplayRoutes = 0;

resetGameplay();
const restResult = get(`(()=>{let before=S.world.day*24+S.world.hour,stories=S.story.length;S.player.hunger=100;S.player.thirst=100;S.player.energy=20;let slept=sleepHours();return{slept,elapsed:S.world.day*24+S.world.hour-before,energy:S.player.energy,stories:S.story.length-stories}})()`);
assert.equal(restResult.elapsed, restResult.slept);
assert(restResult.elapsed > 0 && restResult.elapsed <= 24);
assert(restResult.energy > 20);
assert(restResult.stories >= 1);
gameplayRoutes++;

resetGameplay();
const craftResult = get(`(()=>{let c=S.containers['Carried Inventory'];c.capacityKg=9999;c.capacitySlots=9999;let cloth=countItem('cloth'),bandages=countItem('bandage'),before=S.world.day*24+S.world.hour;addItem('Carried Inventory','cloth',1);craftRecipe('bandage');return{cloth:countItem('cloth')-cloth,bandages:countItem('bandage')-bandages,elapsed:S.world.day*24+S.world.hour-before}})()`);
assert.equal(craftResult.cloth, 0, 'crafting must consume the injected cloth');
assert.equal(craftResult.bandages, 4, 'crafting must create four physical bandages');
assert.equal(craftResult.elapsed, 1);
gameplayRoutes++;

resetGameplay();
const travelResult = get(`(()=>{let origin=S.world.location,road=structuredClone(ROAD[origin][0]),before=S.world.day*24+S.world.hour;road.risk=0;completeTravelRoad(road.to,road,1);return{origin,destination:road.to,location:S.world.location,elapsed:S.world.day*24+S.world.hour-before}})()`);
assert.equal(travelResult.location, travelResult.destination);
assert.equal(travelResult.elapsed, 1);
gameplayRoutes++;

resetGameplay();
const hireResult = get(`(()=>{S.world.location='Southport';v28Ensure();let before=S.people.length;v28Hire('v28_labor_0');let person=S.people.find(row=>row.id==='v28_labor_0');return{added:S.people.length-before,person}})()`);
assert.equal(hireResult.added, 1);
assert.equal(hireResult.person?.portrait, 'custom/npc-portraits/v173/135_shipwright_om.webp');
assert.equal(api.auditState(get('S')).ok, true);
gameplayRoutes++;

resetGameplay();
const gangResult = get(`(()=>{S.world.location='Southport';let before=S.people.length;v28HireGang();return S.people.slice(before).map(person=>({role:person.role,portrait:person.portrait}))})()`);
assert.equal(gangResult.length, 6);
assert(gangResult.every(person => person.role === 'Stevedore' && /^custom\/npc-portraits\//.test(person.portrait)), JSON.stringify(gangResult));
assert.equal(api.auditState(get('S')).ok, true);
gameplayRoutes++;

resetGameplay();
const prisoners = get(`[makePrisoner('bandit'),makePrisoner('mercenary'),makePrisoner('orc')]`);
assert(prisoners.every(person => /^custom\/npc-portraits\//.test(person.portrait) && fs.existsSync(path.join(gameRoot, person.portrait))), JSON.stringify(prisoners));
gameplayRoutes++;

resetGameplay();
const battleResult = get(`(()=>{let stories=S.story.length;trainingDrill();autoAllocateBattle();beginBattle();battleFastForward();let result={ended:battle.ended,round:battle.round,result:battle.result};finishBattle();return{...result,battleClosed:battle===null,stories:S.story.length-stories}})()`);
assert.equal(battleResult.ended, true);
assert(battleResult.round > 0 && battleResult.round <= 30);
assert.match(battleResult.result, /victory/i);
assert.equal(battleResult.battleClosed, true);
assert.equal(battleResult.stories, 1);
gameplayRoutes++;

resetGameplay();
const calendarStress = get(`(()=>{let start=S.world.day;for(let day=0;day<32;day++){S.player.hunger=100;S.player.thirst=100;S.player.energy=100;advanceHours(24,'rest')}return{elapsed:S.world.day-start,day:S.world.day,hour:S.world.hour,people:S.people.length,story:S.story.length}})()`);
assert(calendarStress.elapsed >= 31 && calendarStress.elapsed <= 33, JSON.stringify(calendarStress));
assert(Number.isFinite(calendarStress.day) && Number.isFinite(calendarStress.hour));
assert.equal(api.auditState(get('S')).ok, true);
gameplayRoutes++;

const voiceCount = voiceCalls.length;
get("previewCharacterVoice('Narrator')");
assert.equal(get('voiceBusy'), true, 'narrator preview did not start the voice queue');
process._tickCallback();
assert(voiceCalls.length > voiceCount, 'bundled neural voice bridge was not called by the narrator preview');
gameplayRoutes++;
resetGameplay();

const oldSaveStarted = process.hrtime.bigint();
const oldSave = get(`(()=>{let save=structuredClone(S);delete save.meta.v1743PortraitCore;delete save.meta.v1742FullBodyIntegrity;let old=['assets/workers/carpenter.jpg','assets/dynasty/female_adult_1.webp','assets/v29/portraits/surgeon_halric.webp','assets/v34/people/quartermaster_corvinus.webp'];save.world.laborMarkets['Corvinus Keep'].slice(0,4).forEach((person,index)=>person.portrait=old[index]);save=migrateState(save);return save})()`);
const oldSaveMs = Number(process.hrtime.bigint() - oldSaveStarted) / 1e6;
assert.equal(api.auditState(oldSave).ok, true);
assert(oldSaveMs < 5000, `old-save migration took ${oldSaveMs.toFixed(1)}ms`);

const tabs = [
  'story', 'character', 'equipment', 'inventory', 'party', 'workforce', 'army', 'holdings', 'build', 'craft',
  'trade', 'map', 'relations', 'politics', 'news', 'dynasty', 'codex', 'logs', 'save', 'settings', 'quests',
  'bloodcraft', 'faith', 'skills', 'activities', 'realms', 'logistics', 'maritime', 'frontier', 'medicine',
  'intelligence', 'books', 'duel', 'slaughter', 'traveler', 'ashveil', 'hollow', 'dragon', 'kael', 'kaela',
];
const renderedAssets = new Set();
const tabTimes = [];
for (const tab of tabs) {
  const started = process.hrtime.bigint();
  const html = get(`currentTab=${JSON.stringify(tab)};String(tabContent())`);
  const elapsed = Number(process.hrtime.bigint() - started) / 1e6;
  tabTimes.push([tab, elapsed]);
  assert(html.length > 40, `${tab} returned an empty screen`);
  assert.doesNotMatch(html, />undefined<|>NaN</, `${tab} visibly rendered an invalid value`);
  collectInlineHandlers(html, tab);
  for (const match of html.matchAll(/(?:src|poster)=["']([^"']+)/g)) {
    const value = match[1].split(/[?#]/)[0];
    if (/^(?:assets|custom)\//.test(value)) renderedAssets.add(value);
  }
}
for (const asset of renderedAssets) assert(fs.existsSync(path.join(gameRoot, asset)), `rendered screen references missing asset ${asset}`);
assert(Math.max(...tabTimes.map(([, ms]) => ms)) < 5000, `slow screen: ${JSON.stringify(tabTimes.sort((a, b) => b[1] - a[1]).slice(0, 5))}`);

const builtInCalls = new Set([
  'Array', 'Boolean', 'Date', 'JSON', 'Number', 'Object', 'String', 'confirm', 'decodeURIComponent',
  'encodeURIComponent', 'eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'prompt', 'setInterval',
  'setTimeout',
]);
const missingHandlerGlobals = [];
const checkedHandlerCalls = new Set();
for (const handler of inlineHandlers) {
  const scrubbed = handler.source.replace(/(['"`])(?:\\.|(?!\1)[\s\S])*\1/g, '');
  for (const match of scrubbed.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) {
    const name = match[1];
    if (builtInCalls.has(name) || /^(?:if|for|while|switch|function|return|typeof)$/.test(name)) continue;
    checkedHandlerCalls.add(name);
    if (get(`typeof ${name}`) !== 'function') missingHandlerGlobals.push({...handler, name});
  }
  for (const match of scrubbed.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\.[A-Za-z_$][\w$]*\s*\(/g)) {
    const name = match[1];
    if (builtInCalls.has(name) || name === 'this' || name === 'event') continue;
    checkedHandlerCalls.add(name);
    if (!['object', 'function'].includes(get(`typeof ${name}`))) missingHandlerGlobals.push({...handler, name});
  }
}
assert.equal(missingHandlerGlobals.length, 0, `screen controls reference unavailable code: ${JSON.stringify(missingHandlerGlobals.slice(0, 30), null, 2)}`);

let executedControls = 0;
if (process.env.EXECUTE_INLINE_CONTROLS) {
  const skippedControlCalls = /\b(?:deleteAllSaves|exportSave|importSave|restartGame|v45DeleteOldModel|v45LoadModel|v45OnlineKey)\s*\(/;
  const actionSnapshot = get('structuredClone(S)');
  sandbox.__actionSnapshot = actionSnapshot;
  sandbox.__controlElement = element('button');
  sandbox.__controlElement.value = '1';
  sandbox.__controlElement.checked = true;
  sandbox.__controlElement.closest = () => sandbox.__controlElement;
  sandbox.__controlEvent = {target: sandbox.__controlElement, currentTarget: sandbox.__controlElement, preventDefault() {}, stopPropagation() {}};
  const actionErrors = [];
  const uniqueControls = new Set();
  for (const handler of inlineHandlers) {
    let source = handler.source
      .replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>');
    const key = `${handler.screen}\n${source}`;
    if (uniqueControls.has(key) || skippedControlCalls.test(source)) continue;
    uniqueControls.add(key);
    try {
      sandbox.__controlElement.dataset = {};
      get(`S=structuredClone(__actionSnapshot);currentTab=${JSON.stringify(handler.screen)};(function(event){${source}}).call(__controlElement,__controlEvent)`);
      executedControls++;
    } catch (error) {
      actionErrors.push({screen: handler.screen, source, error: String(error?.stack || error)});
    }
  }
  get('S=structuredClone(__actionSnapshot)');
  assert.equal(actionErrors.length, 0, `visible controls threw during isolated execution: ${JSON.stringify(actionErrors.slice(0, 40), null, 2)}`);
}

const scansBeforeRedraw = api.runtime.scans;
const redrawStarted = process.hrtime.bigint();
for (const tab of tabs) get(`currentTab=${JSON.stringify(tab)};render();migrateState(S)`);
const redrawMs = Number(process.hrtime.bigint() - redrawStarted) / 1e6;
assert.equal(api.runtime.scans, scansBeforeRedraw, 'ordinary rendering restarted the portrait migration');
assert(redrawMs < 15000, `complete repeated screen render took ${redrawMs.toFixed(1)}ms`);

get('aetherionFlushSave()');
const serialized = localStorage.getItem('aetherion_exiled_v03_autosave');
assert(serialized && serialized.length > 100000, 'autosave was not written');
const saveIdentity = get('JSON.stringify({created:S.meta.created,people:S.people.length,story:S.story.length,money:S.money,location:S.world.location,difficulty:S.v21.difficulty})');
get('S=null;continueGame()');
assert.equal(get('JSON.stringify({created:S.meta.created,people:S.people.length,story:S.story.length,money:S.money,location:S.world.location,difficulty:S.v21.difficulty})'), saveIdentity);
const reloadedAudit = api.auditState(get('S'));
assert.equal(reloadedAudit.ok, true, JSON.stringify(reloadedAudit.headOrPlaceholderReferences.slice(0, 30), null, 2));

const settings = get("currentTab='settings';String(tabContent())");
assert.match(settings, /Human American Voices/);
assert.match(settings, /TEST MYSTICAL NARRATOR/);
assert.match(settings, /TEST AMERICAN MALE/);
assert.match(settings, /TEST AMERICAN FEMALE/);
assert.equal(get('HAS_NATIVE_TTS'), true);

const portraitCss = fs.readFileSync(path.join(gameRoot, 'systems-v81-portrait-core.js'), 'utf8');
assert.doesNotMatch(portraitCss, /img\[src\*=["']custom\/npc-portraits[^\n{]*\{object-fit:contain/, 'portrait CSS must not force every image into a generic box');
assert.match(portraitCss, /\.workerPlate \.workerPortrait[^\n]*width:108px/);
assert.match(portraitCss, /\.speakerPic[^\n]*object-fit:cover/);
assert.doesNotMatch(portraitCss, /\.workerPortrait[^\n]*width:76px/);

const maxTab = [...tabTimes].sort((a, b) => b[1] - a[1])[0];
if (process.env.PRINT_MISSING_PERSON_IMAGES) console.log(JSON.stringify(records.missing, null, 2));
if (process.env.PRINT_PORTRAIT_PATHS) console.log(JSON.stringify([...new Set(records.rows.map(row => row.path))].sort(), null, 2));
if (process.env.PRINT_SUSPECT_PERSON_IMAGES) {
  const suspect = records.rows.filter(row => /(?:scenes|locations|rooms|districts|items|shops?|forge|stables?|camp|background|maps?|units?|animals?)\//i.test(row.path));
  console.log(JSON.stringify(suspect, null, 2));
}
if (process.env.PRINT_HANDLER_GLOBALS) console.log(JSON.stringify([...checkedHandlerCalls].sort(), null, 2));
console.log(JSON.stringify({
  version: '1.74.3', scripts: scripts.length, scriptMs: +scriptMs.toFixed(1), difficultyToGameMs: +beginMs.toFixed(1),
  difficultyVariants: Object.fromEntries(difficultyTimings.map(([key, ms]) => [key, +ms.toFixed(1)])),
  oldSaveMs: +oldSaveMs.toFixed(1), screens: tabs.length, renderedAssets: renderedAssets.size,
  inlineControls: inlineHandlers.length, controlGlobals: checkedHandlerCalls.size,
  executedControls, gameplayRoutes,
  repeatedScreenPassMs: +redrawMs.toFixed(1), slowestScreen: [maxTab[0], +maxTab[1].toFixed(1)],
  portraitRecords: records.rows.length, personRecordsWithoutImages: records.missing.length,
}));
