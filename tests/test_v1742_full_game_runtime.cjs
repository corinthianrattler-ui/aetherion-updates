'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const gameRoot = process.argv[2];
if (!gameRoot) {
  console.log('v1.74.2 full-game runtime skipped (pass an extracted assets/game path)');
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
  };
}
function element(tag = 'div') {
  return {
    tagName: String(tag).toUpperCase(), id: '', style: {setProperty() {}, removeProperty() {}}, dataset: {},
    classList: {add() {}, remove() {}, toggle() {}, contains() { return false; }},
    children: [], append() {}, appendChild() {}, prepend() {}, remove() {}, replaceChildren() {},
    insertAdjacentHTML() {}, addEventListener() {}, removeEventListener() {}, setAttribute() {},
    getAttribute() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; },
    closest() { return null; }, getContext() { return null; }, play() { return Promise.resolve(); },
    pause() {}, load() {}, focus() {}, click() {}, innerHTML: '', outerHTML: '', textContent: '',
    value: '', checked: false, disabled: false, isConnected: true,
  };
}
let randomSeed = 0x1742cafe;
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
  head: element('head'), body: element('body'), documentElement: element('html'),
  createElement: element, createTextNode: value => ({textContent: String(value)}), getElementById: byId,
  querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {}, removeEventListener() {},
};
const sandbox = {
  console, Math: testMath, document, localStorage: storage(), sessionStorage: storage(),
  navigator: {userAgent: 'aetherion-v1742-full-game-test', vibrate() {}},
  location: {href: document.baseURI, protocol: 'https:', hostname: 'appassets.androidplatform.net', reload() {}},
  performance: {now: () => 0}, crypto: crypto.webcrypto, TextEncoder, TextDecoder,
  URL, Blob, Response, Request, Headers, AbortController, structuredClone,
  atob: value => Buffer.from(String(value), 'base64').toString('binary'),
  btoa: value => Buffer.from(String(value), 'binary').toString('base64'),
  setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  requestAnimationFrame: () => 0, cancelAnimationFrame() {},
  matchMedia: () => ({matches: false, addEventListener() {}}),
  fetch: async () => new Response('', {status: 404}), Image: class {},
  Audio: class { play() { return Promise.resolve(); } pause() {} },
  MutationObserver: class { observe() {} disconnect() {} }, ResizeObserver: class { observe() {} disconnect() {} },
  addEventListener() {}, removeEventListener() {}, confirm: () => true,
  speechSynthesis: {getVoices() { return []; }, addEventListener() {}, cancel() {}, speak() {}},
  SpeechSynthesisUtterance: class {},
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.self = sandbox;
const context = vm.createContext(sandbox);
const get = source => vm.runInContext(source, context);

for (const relative of scripts) {
  const target = path.join(gameRoot, relative);
  assert(fs.existsSync(target), `missing packaged script ${relative}`);
  vm.runInContext(fs.readFileSync(target, 'utf8'), context, {filename: relative});
}

assert.equal(sandbox.AetherionUpdater?.bundledVersion, '1.74.2');
assert.equal(sandbox.AetherionUpdater?.androidBuild, 197);
assert.equal(sandbox.AetherionUpdateCenterV174?.version, '1.74.2');
assert.equal(sandbox.AetherionUpdateCenterV174?.androidBuild, 197);
assert.equal(sandbox.AetherionDominusDial?.version, '1.74.1');
assert.equal(sandbox.AetherionV1742FullBodyIntegrity?.version, '1.74.2');
assert(fs.existsSync(path.join(gameRoot, sandbox.AetherionDominusDial.assetPath)));

get('S=makeStartState()');
const api = sandbox.AetherionV1742FullBodyIntegrity;
const audit = api.auditState(get('S'));
assert.equal(audit.ok, true, JSON.stringify(audit.headOrPlaceholderReferences, null, 2));
assert.equal(audit.headOrPlaceholderReferences.length, 0);
assert.equal(get('S.meta.v1742FullBodyIntegrity.version'), '1.74.2');
assert.equal(get('S.meta.v1742FullBodyIntegrity.savePreserved'), true);
assert.equal(get('S.meta.v1742FullBodyIntegrity.gameContentRemoved'), false);

const banned = /^(?:assets\/(?:workers|dynasty)\/|assets\/v29\/portraits\/(?!moondancer\.webp$)|assets\/v34\/people\/(?:market_loader|market_teamster|market_wheelwright|quartermaster_corvinus)\.webp$|custom\/npc-portraits\/v168\/00_quartermaster_original_unchanged\.webp$|assets\/v38\/thrall\/nessa_cale_portrait\.webp$)/i;
const placeholders = /^(?:assets\/medical\/surgeon_kit\.webp|assets\/v28\/scenes\/dock_stevedores\.webp|assets\/v26\/scenes\/(?:bookseller_shop|blacksmith_forge)\.webp|assets\/v17\/locations\/apothecary\.webp|assets\/v50\/(?:rooms\/stores|jobs\/owned_shop)\.webp)$/i;
const records = get(`(()=>{let rows=[],seen=new WeakSet();function walk(v,route='S'){if(!v||typeof v!=='object'||seen.has(v))return;seen.add(v);let art=v.portrait||v.img||v.art;if(typeof art==='string'&&(v.name||v.role||v.gender||Number.isFinite(+v.age)))rows.push({route,name:v.name||'',role:v.role||'',gender:v.gender||'',age:v.age,path:art});if(Array.isArray(v))v.forEach((x,i)=>walk(x,route+'['+i+']'));else Object.entries(v).forEach(([k,x])=>walk(x,route+'.'+k))}walk(S);return rows})()`);
assert(records.length > 1000);
assert.equal(records.filter(row => banned.test(row.path) || placeholders.test(row.path)).length, 0);
for (const row of records.filter(row => /^(?:assets|custom)\//.test(row.path))) {
  assert(fs.existsSync(path.join(gameRoot, row.path)), `missing portrait ${row.path} at ${row.route}`);
}

const oldSave = get(`(()=>{let save=structuredClone(S);delete save.meta.v1742FullBodyIntegrity;save.meta.v173LivingPortraits={version:'1.73.0'};save.meta.v1731KnightDiversity={version:'1.73.1'};save.meta.v1738PortraitResilience={version:'1.74.0',headFallback:false};let paths=['assets/workers/carpenter.jpg','assets/workers/blacksmith.jpg','assets/workers/skilled_artisan.jpg','assets/workers/skilled_artisan.jpg','assets/workers/healer.jpg'];save.world.laborMarkets['Corvinus Keep'].slice(0,5).forEach((p,i)=>p.portrait=paths[i]);save.v23.surgeons[0].portrait='assets/v29/portraits/surgeon_halric.webp';save.v28.laborPool[0].portrait='assets/v29/portraits/quartermaster_halric.webp';save=migrateState(save);return save})()`);
const oldAudit = api.auditState(oldSave);
assert.equal(oldAudit.ok, true, JSON.stringify(oldAudit.headOrPlaceholderReferences, null, 2));
assert(oldSave.world.laborMarkets['Corvinus Keep'].slice(0, 5).every(person => person.portrait.startsWith('custom/npc-portraits/')));

const preserved = {world: {}, meta: {}, people: [{id: 'authored', name: 'Authored Full Body', role: 'Companion', gender: 'F', age: 28, portrait: 'assets/characters/lady_alexus_dominus.jpg'}]};
api.repairState(preserved, true);
assert.equal(preserved.people[0].portrait, 'assets/characters/lady_alexus_dominus.jpg', 'existing full-body art must remain untouched');
const nessa = {id: 'nessa', name: 'Nessa Cale', role: 'Thrall', gender: 'F', age: 24, portrait: 'assets/v38/thrall/nessa_cale_portrait.webp'};
api.repairOne(nessa);
assert.equal(nessa.portrait, 'assets/v38/thrall/nessa_cale_encounter.webp');
assert.equal(api.displayPath('assets/companions/hunter.webp'), 'assets/companions/hunter.webp', 'existing full-body animal art must remain untouched');
assert.equal(api.displayPath('assets/v26/scenes/blacksmith_forge.webp'), 'assets/v26/scenes/blacksmith_forge.webp', 'shop scene art must remain untouched outside a person record');

const roleSelections = get(`[...V10_WORKER_ROLES].flatMap(role=>['M','F'].flatMap(gender=>[24,52].map(age=>AetherionV1742FullBodyIntegrity.select({id:'test_'+role+'_'+gender+'_'+age,name:'Test',role,gender,age,race:'human'}))))`);
assert(roleSelections.length > 300);
assert(roleSelections.every(Boolean));
assert(roleSelections.every(row => !banned.test(row.path) && row.fullBody !== false));
assert(roleSelections.every(row => fs.existsSync(path.join(gameRoot, row.path))));
for (const [gender, age] of [['M', 0], ['F', 0], ['M', 4], ['F', 4], ['M', 9], ['F', 9], ['M', 15], ['F', 15]]) {
  const selected = api.select({id: `minor_${gender}_${age}`, name: 'Household Child', role: 'Child', gender, age, race: 'human'}, {family: true});
  assert(selected, `no full-body selection for ${gender} age ${age}`);
  assert.equal(selected.gender, gender);
  assert(fs.existsSync(path.join(gameRoot, selected.path)));
}

const workers = get('V10_WORKER_ROLES.map(role=>v10WorkerArt(role))');
assert(workers.every(value => !banned.test(value)));
assert(workers.every(value => fs.existsSync(path.join(gameRoot, value))));
const labor = get(`S.world.laborMarkets['Corvinus Keep']`);
assert(labor.every(person => person.portrait.startsWith('custom/npc-portraits/')));
assert(labor.some(person => person.gender === 'F'));
assert.match(get('mainShell()'), /dominusBloodDial/);
assert.match(get('mainShell()'), /dominus-blood-dial-base\.webp/);
assert.match(fs.readFileSync(path.join(gameRoot, 'systems-v09.js'), 'utf8'), /TEST MYSTICAL NARRATOR/);
assert.match(fs.readFileSync(path.join(gameRoot, 'systems-v09.js'), 'utf8'), /TEST AMERICAN MALE/);
assert.match(fs.readFileSync(path.join(gameRoot, 'systems-v09.js'), 'utf8'), /TEST AMERICAN FEMALE/);

console.log(`v1.74.2 full-game runtime passed: ${records.length} portrait records, ${api.registry.length} full-body choices, old-save migration and House Dominus dial verified`);
