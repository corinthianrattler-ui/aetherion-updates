'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function element(tag = 'div') {
  return {
    tagName: String(tag).toUpperCase(), children: [], dataset: {}, style: {}, className: '', textContent: '', innerHTML: '',
    append(...items) { this.children.push(...items); }, appendChild(item) { this.children.push(item); }, prepend(item) { this.children.unshift(item); },
    remove() {}, replaceChildren(...items) { this.children = [...items]; }, addEventListener() {}, setAttribute() {},
    querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; },
  };
}
const document = {
  readyState: 'loading', head: element('head'), body: element('body'), documentElement: element('html'),
  createElement: element, getElementById() { return null; }, querySelectorAll() { return []; }, addEventListener() {},
};
const channel = JSON.parse(fs.readFileSync('android/channel.json', 'utf8'));
const location = {href: 'https://appassets.androidplatform.net/assets/game/index.html', reload() {}};
const window = {
  document, location,
  AetherionUpdater: {
    state: async () => ({bundled: '1.74.2', current: '1.74.2', previous: null}),
    check: async () => ({current: '1.74.2', available: null}),
    clean: async () => ({files: 0, bytes: 0}), rollback: async () => null,
  },
};
Object.assign(window, {window, globalThis: window, fetch: async () => new Response(JSON.stringify(channel), {status: 200}), setTimeout, clearTimeout, console});
const context = vm.createContext({window, globalThis: window, document, location, fetch: window.fetch, Response, setTimeout, clearTimeout, console});
vm.runInContext(fs.readFileSync('patches/v1.74.2-update-center.js', 'utf8'), context, {filename: 'v1.74.2-update-center.js'});

(async () => {
  const api = window.AetherionUpdateCenterV174;
  assert(api, 'update center API missing');
  assert.equal(api.version, '1.74.2');
  assert.equal(api.androidBuild, 197);
  const release = api.validateChannel(channel);
  assert.equal(release.version, '1.74.2');
  assert.equal(release.build, 197);
  assert.equal(release.apkSize, 519356685);
  assert.equal(release.apkSha256, '81d0d1d3fdad0fd06e3a37a25e3d130db336faa673b46188df8cc06de4f945dc');
  assert.throws(() => api.validateChannel({...channel, release: {...channel.release, apkUrl: 'https://evil.example/game.apk'}}), /not trusted/);
  assert.throws(() => api.validateChannel({...channel, release: {...channel.release, apkSize: 128}}), /size is invalid/);
  const checked = await api.checkAndroid();
  assert.equal(checked.apkUrl, release.apkUrl);
  const before = location.href;
  api.startDownload(release);
  assert.notEqual(location.href, before);
  assert.equal(location.href, release.apkUrl);
  const state = await api.state();
  assert.equal(state.current, '1.74.2');
  const source = fs.readFileSync('patches/v1.74.2-update-center.js', 'utf8');
  assert.match(source, /only a full APK can replace|A full APK install can replace/);
  assert.match(source, /downloaded web update can only add or override downloaded files/);
  assert.match(source, /Do not uninstall/);
  console.log('v1.74.2 update center: verified full-APK channel, trusted download boundary, truthful cleanup wording, and save-preserving install route passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
