'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const gameRoot = process.argv[2];
assert(gameRoot, 'pass the extracted assets/game directory');

function storage(seed = {}) {
  const rows = new Map(Object.entries(seed));
  return {
    getItem: key => rows.has(key) ? rows.get(key) : null,
    setItem: (key, value) => rows.set(key, String(value)),
    removeItem: key => rows.delete(key),
    clear: () => rows.clear(),
  };
}

function element(tag = 'div') {
  return {
    tagName: String(tag).toUpperCase(), children: [], dataset: {}, style: {}, className: '', textContent: '', innerHTML: '',
    append(...items) { this.children.push(...items); }, appendChild(item) { this.children.push(item); },
    prepend(item) { this.children.unshift(item); }, remove() {}, replaceChildren(...items) { this.children = [...items]; },
    addEventListener() {}, setAttribute() {}, querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; },
  };
}

const localStorage = storage({
  aetherion_safe_update_state_v1: 'obsolete runtime marker',
  aetherion_safe_update_boot_v1: 'obsolete boot marker',
  aetherion_safe_update_notice_v1: 'obsolete notice',
  aetherion_exiled_v03_autosave: 'PRESERVE THIS SAVE',
});
const sessionStorage = storage({aetherion_safe_update_force_safe_v1: '1'});
const listeners = new Map();
const document = {
  readyState: 'loading', head: element('head'), body: element('body'), documentElement: element('html'),
  createElement: element, getElementById() { return null; }, querySelectorAll() { return []; },
  addEventListener(type, listener) { listeners.set(type, listener); }, dispatchEvent() {},
};
const location = {href: 'https://appassets.androidplatform.net/assets/game/index.html', reload() {}};
const sandbox = {
  console, document, localStorage, sessionStorage, location, crypto: crypto.webcrypto, TextEncoder, TextDecoder,
  URL, Blob, Response, CustomEvent: class {}, atob: value => Buffer.from(String(value), 'base64').toString('binary'),
  setTimeout() {}, clearTimeout() {}, fetch: async () => { throw Error('unexpected fetch'); },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
const context = vm.createContext(sandbox);

const updaterSource = fs.readFileSync(path.join(gameRoot, 'systems-v81-safe-updater.js'), 'utf8');
vm.runInContext(updaterSource, context, {filename: 'systems-v81-safe-updater.js'});
const updater = sandbox.AetherionUpdater;
assert(updater, 'updater API missing');
assert.equal(updater.safeUpdaterVersion, '1.74.3');
assert.equal(updater.bundledVersion, '1.74.3');
assert.equal(updater.androidBuild, 198);
assert.equal(updater._test.compareVersions('1.74.4', '1.74.3'), 1);
assert.equal(updater._test.safeAssetPath('custom/portraits/test.webp'), true);
assert.equal(updater._test.safeAssetPath('assets/portraits/test.webp'), true);
assert.equal(updater._test.safeAssetPath('game.js'), false);
assert.equal(updater._test.safeAssetPath('../save.json'), false);
assert.equal(localStorage.getItem('aetherion_safe_update_state_v1'), null);
assert.equal(localStorage.getItem('aetherion_safe_update_boot_v1'), null);
assert.equal(localStorage.getItem('aetherion_safe_update_notice_v1'), null);
assert.equal(sessionStorage.getItem('aetherion_safe_update_force_safe_v1'), null);
assert.equal(localStorage.getItem('aetherion_exiled_v03_autosave'), 'PRESERVE THIS SAVE');

const webRelease = {version: '1.74.4'};
const safeManifest = {
  schema: 2, appId: 'aetherion-reforged', version: '1.74.4', files: [{
    id: 'portrait-a', type: 'asset', path: 'assets/game/custom/portraits/a.webp', mime: 'image/webp',
    url: 'https://example.test/a.webp', sha256: 'a'.repeat(64),
  }], deletePaths: ['assets/game/assets/obsolete-download.webp'],
};
updater._test.validateManifest(safeManifest, webRelease);
assert.equal(safeManifest.files[0].path, 'custom/portraits/a.webp');
assert.deepEqual(Array.from(safeManifest.deletePaths), ['assets/obsolete-download.webp']);
assert.throws(() => updater._test.validateManifest({schema: 2, appId: 'aetherion-reforged', version: '1.74.4', files: [], deletePaths: ['game.js']}, webRelease), /Unsafe/);
assert.throws(() => updater._test.validateManifest({schema: 2, appId: 'aetherion-reforged', version: '1.74.4', files: [], deletePaths: ['..\/save.json']}, webRelease), /Unsafe/);

const apkRelease = {
  version: '1.74.4', build: 199,
  apkUrl: 'https://github.com/corinthianrattler-ui/aetherion-updates/releases/download/v1.74.4/Aetherion_Reforged_v1.74.4.apk',
  apkSha256: 'b'.repeat(64), apkSize: 500000000, notes: ['Complete APK'],
};
const channel = {schema: 1, appId: 'aetherion-reforged', channel: 'stable', release: apkRelease};
const publishedChannel = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'android/channel.json'), 'utf8'));
sandbox.fetch = async () => new Response(JSON.stringify(channel), {status: 200});
const centerSource = fs.readFileSync(path.join(gameRoot, 'systems-v81-update-center.js'), 'utf8');
vm.runInContext(centerSource, context, {filename: 'systems-v81-update-center.js'});

(async () => {
  const center = sandbox.AetherionUpdateCenterV174;
  assert(center, 'update-center API missing');
  assert.equal(center.version, '1.74.3');
  assert.equal(center.androidBuild, 198);
  const published = center.validateChannel(publishedChannel);
  assert.equal(published.version, '1.74.3');
  assert.equal(published.build, 198);
  assert.equal(published.apkSize, 519238034);
  assert.equal(published.apkSha256, 'd055b620e9f434fbba8ce0505d293be3141f072b81543a34340db0ca4996e00f');
  assert.equal(published.apkUrl, center.apk);
  assert.equal(center.validateChannel(channel).build, 199);
  assert.throws(() => center.validateChannel({...channel, release: {...apkRelease, apkUrl: 'https://evil.example/game.apk'}}), /not trusted/);
  assert.throws(() => center.validateChannel({...channel, release: {...apkRelease, apkSize: 1024}}), /size is invalid/);
  const checked = await center.checkAndroid();
  assert.equal(checked.apkUrl, apkRelease.apkUrl);
  const before = location.href;
  center.startDownload(checked);
  assert.notEqual(location.href, before);
  assert.equal(location.href, apkRelease.apkUrl);
  assert.match(centerSource, /A full APK install can replace code and physically remove obsolete packaged files/);
  assert.match(centerSource, /downloaded web update can only add or override downloaded files/);
  assert.match(centerSource, /Do not uninstall/);
  assert.doesNotMatch(centerSource, /downloaded web update can physically remove/i);
  console.log('v1.74.3 update system: full-APK handoff, trusted release boundary, downloaded-file limits, legacy-marker cleanup, and save preservation passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
