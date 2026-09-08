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
assert.equal(feed.release.version,'1.72.0');
assert.equal(feed.release.build,189);
assert.equal(feed.release.minimumBundled,'1.70.0');
assert.equal(feed.release.modules.length,3);

const modules=[
 ['v172-character-models','patches/v1.72.0-character-models.js'],
 ['v172-update-center','patches/v1.72.0-update-center.js'],
 ['v172-runtime-repair','patches/v1.72.0-runtime-repair.js']
];
for(let index=0;index<modules.length;index++){
 const [id,path]=modules[index],entry=feed.release.modules[index],source=fs.readFileSync(path,'utf8');
 assert.equal(entry.id,id);assert.equal(entry.source,source);
 assert.equal(entry.sha256,crypto.createHash('sha256').update(source).digest('hex'));
}

const expected=[
 'assets/v172/valkorion-base-lord.glb',
 'assets/v172/valkorion-armored.glb',
 'assets/v172/alexus-gothic-gown.glb'
];
assert.deepEqual(Object.keys(feed.release.assets),expected);
for(const path of expected){
 assert.equal(
  feed.release.assets[path],
  `https://github.com/corinthianrattler-ui/aetherion-updates/releases/download/v1.72.0/${path.split('/').pop()}`
 );
}
assert(fs.statSync('channel.js').size<=100000);
assert(feed.release.notes.some(note=>note.includes('mobile-ready geometry')));
console.log('v1.72.0 channel: exact patch checksums, trusted model routes, build floor, and size limit passed');
