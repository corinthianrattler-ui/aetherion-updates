'use strict';
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const vm=require('node:vm');

let feed=null;
const window={AetherionUpdater:{receiveChannel(value){feed=value}}};
vm.runInNewContext(fs.readFileSync('channel.js','utf8'),{window},{filename:'channel.js'});
assert(feed,'channel did not deliver a release');
assert.equal(feed.schema,2);assert.equal(feed.channel,'stable');
assert.equal(feed.release.version,'1.72.4');assert.equal(feed.release.build,193);
assert.equal(feed.release.minimumBundled,'1.72.0');assert.equal(feed.release.requiresApk,true);
assert.equal(feed.release.modules.length,1);assert.deepEqual(Object.keys(feed.release.assets),[]);

const entry=feed.release.modules[0];
assert.equal(entry.id,'v174-native-install-path');
assert.equal(entry.sha256,crypto.createHash('sha256').update(entry.source).digest('hex'));
assert.match(entry.source,/const VERSION='1\.72\.4'/);
assert.match(entry.source,/const ANDROID_BUILD=193/);
assert.match(entry.source,/assets\/v174\/native-build-193\.json/);

const manifest=JSON.parse(fs.readFileSync('manifest.json','utf8'));
assert.equal(feed.release.apkUrl,manifest.android_apk.url);
assert.equal(feed.release.apkSha256,manifest.android_apk.sha256);
assert.equal(feed.release.apkSize,manifest.android_apk.size);
assert.match(feed.release.apkUrl,/v1\.72\.4\/Aetherion_Reforged_v1\.72\.4_FULL_REPAIR\.apk$/);
assert(fs.statSync('channel.js').size<=100000);
assert(feed.release.notes.some(note=>note.includes('required full APK')));
assert(feed.release.notes.some(note=>note.includes('BUILD 193')));
console.log('v1.72.4 channel: native-only requirement, exact handoff module, APK metadata, and size limit passed');
