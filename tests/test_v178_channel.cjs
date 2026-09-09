'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const vm = require('node:vm');

let feed = null;
const document = { addEventListener() {} };
const window = { AetherionUpdater: { receiveChannel(value) { feed = value; } } };
vm.runInNewContext(fs.readFileSync('channel.js', 'utf8'), { window, document, globalThis: window, location: { href: 'file:///android_asset/game/index.html' } }, { filename: 'channel.js' });

assert(feed, 'channel did not deliver a release');
assert.equal(feed.schema, 2);
assert.equal(feed.channel, 'stable');
assert.equal(feed.release.version, '1.72.8');
assert.equal(feed.release.build, 195);
assert.equal(feed.release.minimumBundled, '1.72.6');
assert.equal(feed.release.requiresApk, false);
assert.deepEqual(Object.keys(feed.release.assets), []);
assert.deepEqual(Array.from(feed.release.modules, module => module.id), ['v177-scroll-repair', 'v178-alexus-equipment-repair']);
for (const [module, path] of [
  [feed.release.modules[0], 'patches/v1.72.7-scroll-repair.js'],
  [feed.release.modules[1], 'patches/v1.72.8-alexus-equipment-repair.js'],
]) {
  const source = fs.readFileSync(path, 'utf8');
  assert.equal(module.source, source);
  assert.equal(module.sha256, crypto.createHash('sha256').update(source).digest('hex'));
}
assert(feed.release.notes.some(note => note.includes('re-equipping all 17')));
assert(feed.release.notes.some(note => note.includes('v1.72.7 vertical scrolling')));
assert(fs.statSync('channel.js').size <= 100000);

function storage() { const rows = new Map(); return { getItem: key => rows.has(key) ? rows.get(key) : null, setItem: (key, value) => rows.set(key, String(value)), removeItem: key => rows.delete(key) }; }
function element() { return { children: [], dataset: {}, style: {}, append(...items) { this.children.push(...items); }, appendChild(item) { this.children.push(item); }, remove() {}, replaceChildren(...items) { this.children = [...items]; }, addEventListener() {}, setAttribute() {}, querySelector() { return null; }, querySelectorAll() { return []; } }; }

(async () => {
  const localStorage = storage(), sessionStorage = storage();
  const updaterDocument = { readyState: 'loading', baseURI: 'file:///android_asset/game/index.html', head: element(), body: element(), documentElement: element(), createElement: element, createTextNode: value => ({ textContent: String(value) }), getElementById() { return null; }, querySelectorAll() { return []; }, addEventListener() {} };
  const updaterWindow = { document: updaterDocument, localStorage, sessionStorage, location: { reload() {} }, addEventListener() {}, requestAnimationFrame: callback => setTimeout(callback, 0), setTimeout, clearTimeout, confirm: () => true };
  Object.assign(updaterWindow, { window: updaterWindow, globalThis: updaterWindow, TextEncoder, TextDecoder, Uint8Array, Uint32Array, DataView, URL, crypto: crypto.webcrypto, atob: value => Buffer.from(String(value), 'base64').toString('binary') });
  const context = vm.createContext({ ...updaterWindow, window: updaterWindow, globalThis: updaterWindow, document: updaterDocument, localStorage, sessionStorage, location: updaterWindow.location, MutationObserver: class { observe() {} }, console });
  vm.runInContext(fs.readFileSync('patches/v1.72.6-safe-updater.js', 'utf8'), context, { filename: 'v1.72.6-safe-updater.js' });
  const verified = await updaterWindow.AetherionUpdater._test.verifyRelease(feed.release);
  assert.equal(verified.version, '1.72.8');
  assert.equal(verified.build, 195);
  const staged = updaterWindow.AetherionUpdater.stage(verified);
  assert.equal(staged.version, '1.72.8');
  assert.equal(updaterWindow.AetherionUpdater.state().staged, '1.72.8');
  console.log('v1.72.8 channel: scroll plus Alexus state repair sources verify and stage through the v1.72.6 updater');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
