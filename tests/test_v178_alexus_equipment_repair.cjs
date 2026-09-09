'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('patches/v1.72.8-alexus-equipment-repair.js', 'utf8');
const alexusItems = {
  head: 'alexus_rose_circlet', neck: 'alexus_bloodstone_collar', underlayer: 'alexus_silk_shift',
  body: 'alexus_dominus_gown', shoulders: 'alexus_fur_mantlet', hands: 'alexus_lady_gloves',
  waist: 'alexus_gilded_girdle', legs: 'alexus_riding_underskirt', feet: 'alexus_court_boots',
  cloak: 'alexus_night_cloak', main: 'alexus_ebony_cane', off: 'alexus_folding_fan',
  ranged: 'alexus_hunting_crossbow', reserve: 'alexus_rose_dagger', ammo: 'alexus_bolt_case',
  jewelry1: 'alexus_twin_signet', jewelry2: 'alexus_moonstone_brooch',
};
const fullGear = { ...alexusItems };
const person = { id: 'party_alexus_dominus', name: 'Lady Alexus Dominus', gear: { ...fullGear } };
const S = {
  world: { day: 1 },
  v24: { version: '1.10.1', issued: true },
  people: [person],
  containers: {
    'Carried Inventory': {
      items: [
        { itemId: alexusItems.body, qty: 1 },
        { itemId: alexusItems.underlayer, qty: 2 },
      ],
    },
  },
};

let migrations = 0;
function v24Upgrade(state) {
  migrations++;
  state.v24 ||= { version: '1.10.1', issued: true };
  const target = state.people.find(row => row.name === 'Lady Alexus Dominus');
  if (target) target.gear = { ...fullGear };
  return state;
}
function migrateState(state) { return v24Upgrade(state); }
let modalOpens = 0;
function v16PersonEquipment() { modalOpens++; return true; }
function addItem(container, itemId) { S.containers[container].items.push({ itemId, qty: 1 }); return true; }
function render() { migrateState(S); }
function v16EquipPerson(id, slot, iid) {
  const target = S.people.find(row => row.id === id);
  if (target.gear[slot]) addItem('Carried Inventory', target.gear[slot], 1);
  target.gear[slot] = iid || null;
  v16PersonEquipment(id);
  render();
  return true;
}

const badge = { textContent: '' };
const document = { querySelector(selector) { return selector === '[data-v176-alexus-status]' ? badge : null; } };
let appliedMap = null;
const viewer = { setNodesVisible(map) { appliedMap = map; }, render() {} };
const AetherionGameplayRepairV176 = {
  alexusItems,
  alexusFitted: { body: ['body_mesh'], underlayer: ['shift_mesh'], shoulders: ['mantlet_mesh'], cloak: ['cloak_mesh'] },
  alexusVisibility(gear) {
    return {
      body_mesh: gear.body === alexusItems.body,
      shift_mesh: gear.underlayer === alexusItems.underlayer,
      mantlet_mesh: gear.shoulders === alexusItems.shoulders,
      cloak_mesh: gear.cloak === alexusItems.cloak,
    };
  },
  runtime: { lastMap: null },
  async syncAlexus() { return viewer; },
};
let persisted = 0;
const context = {
  console, document, S, v24Upgrade, migrateState, v16PersonEquipment, v16EquipPerson,
  persist() { persisted++; },
  AetherionGameplayRepairV176,
  requestAnimationFrame(callback) { setTimeout(callback, 0); return 1; },
  setTimeout,
};
context.window = context;
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: 'v1.72.8-alexus-equipment-repair.js' });

(async () => {
  const api = context.AetherionAlexusEquipmentRepairV178;
  assert(api, 'repair API was not installed');
  assert.equal(person.gear.body, null, 'the gown returned to inventory by the broken redraw must remain unequipped');
  assert.equal(person.gear.underlayer, null, 'the shift returned to inventory by the broken redraw must remain unequipped');
  assert.equal(S.containers['Carried Inventory'].items.filter(row => row.itemId === alexusItems.underlayer).reduce((n, row) => n + row.qty, 0), 1, 'impossible duplicate unique pieces must collapse to one inventory item');
  assert.deepEqual([...api.runtime.recoveredSlots].sort(), ['body', 'underlayer']);

  context.v24Upgrade(S);
  assert.equal(person.gear.body, null, 'legacy v24 migration must not restore an empty gown slot');
  assert.equal(person.gear.underlayer, null, 'legacy v24 migration must not restore an empty shift slot');
  assert.equal(person.gear.cloak, alexusItems.cloak, 'unchanged fitted slots must remain equipped');

  context.v16EquipPerson(person.id, 'shoulders', '');
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(person.gear.shoulders, null, 'LEAVE EMPTY must survive the actual equipment → redraw/migration sequence');
  assert.equal(appliedMap.body_mesh, false);
  assert.equal(appliedMap.shift_mesh, false);
  assert.equal(appliedMap.mantlet_mesh, false, 'the exact unequipped mesh must be hidden');
  assert.equal(appliedMap.cloak_mesh, true, 'unrelated equipped meshes must stay visible');
  assert.match(badge.textContent, /^1 \/ 4 FITTED PIECES VISIBLE$/);
  assert(migrations >= 2, 'the test must exercise the legacy redraw migration');
  assert(modalOpens >= 1, 'the test must exercise the real equipment-screen return path');
  assert(persisted >= 1, 'recovered state must be persisted');

  const freshPerson = { id: person.id, name: person.name, gear: {} };
  const fresh = { world: { day: 1 }, people: [freshPerson], containers: { 'Carried Inventory': { items: [] } } };
  context.v24Upgrade(fresh);
  assert.equal(freshPerson.gear.body, alexusItems.body, 'a genuinely fresh game must still receive Alexus’s starting wardrobe once');
  console.log('v1.72.8 Alexus equipment: reset artifacts recovered, unique copies deduplicated, LEAVE EMPTY survives redraw migration, and exact meshes update');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
