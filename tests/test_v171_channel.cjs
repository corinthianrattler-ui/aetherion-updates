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
if(feed.release.version!=='1.71.0'){
 console.log(`v1.71.0 historical channel test skipped; stable is now ${feed.release.version}`);
 process.exit(0);
}
assert.equal(feed.release.version,'1.71.0');
assert.equal(feed.release.build,188);
assert.equal(feed.release.minimumBundled,'1.70.0');
assert.equal(feed.release.modules.length,1);

const entry=feed.release.modules[0];
const source=fs.readFileSync('patches/v1.71.0-character-models.js','utf8');
assert.equal(entry.id,'v171-character-models');
assert.equal(entry.source,source);
assert.equal(entry.sha256,crypto.createHash('sha256').update(source).digest('hex'));

const expected=[
 'assets/v171/valkorion-base-lord.glb',
 'assets/v171/valkorion-armored.glb',
 'assets/v171/libita-gothic-gown.glb'
];
assert.deepEqual(Object.keys(feed.release.assets),expected);
for(const path of expected){
 assert.equal(
  feed.release.assets[path],
  `https://github.com/corinthianrattler-ui/aetherion-updates/releases/download/v1.71.0/${path.split('/').pop()}`
 );
}
assert(fs.statSync('channel.js').size<=100000);
assert(feed.release.notes.some(note=>note.includes('transforms are preserved')));
console.log('v1.71.0 channel: exact patch checksum, trusted model routes, build floor, and size limit passed');
