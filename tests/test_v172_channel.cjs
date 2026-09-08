'use strict';
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const vm=require('node:vm');

let feed=null;
const window={AetherionUpdater:{receiveChannel(value){feed=value}}};
vm.runInNewContext(fs.readFileSync('channel.js','utf8'),{window},{filename:'channel.js'});
assert(feed,'channel did not deliver a release');
assert.equal(feed.schema,2);
assert.equal(feed.channel,'stable');
assert.equal(feed.release.version,'1.72.2');
assert.equal(feed.release.build,191);
assert.equal(feed.release.minimumBundled,'1.72.0');
assert.equal(feed.release.modules.length,1);

const modules=[
 ['v1722-full-apk-path','patches/v1.72.2-update-center.js']
];
for(let index=0;index<modules.length;index++){
 const [id,path]=modules[index],entry=feed.release.modules[index],source=fs.readFileSync(path,'utf8');
 assert.equal(entry.id,id);assert.equal(entry.source,source);
 assert.equal(entry.sha256,crypto.createHash('sha256').update(source).digest('hex'));
}

assert.deepEqual(Object.keys(feed.release.assets),[],'the native repair must use APK-local models without a large network stream');
assert(fs.statSync('channel.js').size<=100000);
assert(feed.release.notes.some(note=>note.includes('required full APK')));
assert(feed.release.notes.some(note=>note.includes('DOWNLOAD FULL APK')));
console.log('v1.72.2 channel: exact full-APK handoff, APK-local models, build floor, and size limit passed');
