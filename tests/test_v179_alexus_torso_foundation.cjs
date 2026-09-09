'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('patches/v1.72.9-alexus-torso-foundation.js', 'utf8');
const person = { id: 'party_alexus_dominus', name: 'Lady Alexus Dominus', gear: { body: null } };
const S = { people: [person] };
function material(name = 'gown') {
  return {
    name, map: { id: 'gown-texture' }, normalMap: { id: 'normal' }, metalnessMap: { id: 'metal' }, roughnessMap: { id: 'rough' },
    metalness: .4, roughness: .3, vertexColors: true, transparent: true, opacity: .8, depthWrite: false, needsUpdate: false,
    color: { value: null, setHex(value) { this.value = value; } }, emissive: { value: null, setHex(value) { this.value = value; } },
    clone() { const copy = material(this.name); Object.assign(copy, this); copy.color = { ...this.color, setHex: this.color.setHex }; copy.emissive = { ...this.emissive, setHex: this.emissive.setHex }; return copy; },
  };
}
const parent = { children: [], add(node) { node.parent = this; this.children.push(node); } };
const sourceNode = {
  name: 'BODY_tripo_part_2', visible: false, material: material(), parent,
  clone() {
    return {
      name: this.name, visible: this.visible, material: this.material, userData: {}, parent: null,
      traverse(callback) { callback(this); },
    };
  },
};
const namedNodes = new Map([['BODY_tripo_part_2', [sourceNode]]]);
let renderCount = 0;
const viewer = { model: parent, namedNodes, render() { renderCount++; }, setNodesVisible(map) { sourceNode.visible = !!map.BODY_tripo_part_2; } };
const AetherionGameplayRepairV176 = {
  runtime: { lastMap: null },
  alexusVisibility(gear) { return { BODY_tripo_part_2: gear.body === 'alexus_dominus_gown' }; },
  async syncAlexus() { return viewer; },
};
const AetherionAlexusEquipmentRepairV178 = { async syncExact() { viewer.setNodesVisible(AetherionGameplayRepairV176.alexusVisibility(person.gear)); return viewer; } };
let screenCalls = 0, equipmentCalls = 0;
function v16PersonEquipment() { screenCalls++; return true; }
function v16EquipPerson(id, slot, iid) { equipmentCalls++; person.gear[slot] = iid || null; v16PersonEquipment(id); return true; }
const document = { querySelector() { return null; } };
const context = {
  console, S, document, AetherionGameplayRepairV176, AetherionAlexusEquipmentRepairV178,
  v16PersonEquipment, v16EquipPerson, requestAnimationFrame(callback) { setTimeout(callback, 0); return 1; }, setTimeout,
};
context.window = context; context.globalThis = context;
vm.createContext(context); vm.runInContext(source, context, { filename: 'v1.72.9-alexus-torso-foundation.js' });

(async () => {
  const api = context.AetherionAlexusTorsoFoundationV179;
  await api.sync(person.id);
  const foundation = namedNodes.get('ALEXUS_FOUNDATION_TORSO')?.[0];
  assert(foundation, 'the missing torso foundation was not created');
  assert.equal(parent.children.length, 1);
  assert.equal(foundation.visible, true, 'the foundation must show while the gown slot is empty');
  assert.equal(sourceNode.visible, false, 'the actual gown must stay hidden while unequipped');
  assert.notEqual(foundation.material, sourceNode.material, 'foundation styling must not mutate the authored gown material');
  assert.equal(foundation.material.map, null, 'the gown texture must be stripped from the torso foundation');
  assert.equal(foundation.material.normalMap, null);
  assert.equal(foundation.material.color.value, 0x24171d);
  assert.equal(foundation.material.metalness, 0);
  assert.equal(foundation.material.roughness, .94);
  assert.equal(foundation.material.vertexColors, false);
  assert.equal(foundation.material.transparent, false);
  assert.equal(foundation.material.opacity, 1);

  await api.sync(person.id);
  assert.equal(parent.children.length, 1, 'reopening the screen must reuse one foundation, not duplicate it');
  context.v16EquipPerson(person.id, 'body', 'alexus_dominus_gown');
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(sourceNode.visible, true, 'equipping the gown must restore its authored torso mesh');
  assert.equal(foundation.visible, false, 'the foundation must hide underneath an equipped gown');
  context.v16EquipPerson(person.id, 'body', '');
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(sourceNode.visible, false);
  assert.equal(foundation.visible, true, 'removing the gown again must reveal a complete base torso');
  assert(screenCalls >= 2 && equipmentCalls === 2);
  assert(renderCount > 0);
  console.log('v1.72.9 Alexus torso: plain-linen foundation fills the body hole, gown remains independent, and repeated screen/equipment sync creates no duplicates');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
