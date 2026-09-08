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
assert.equal(feed.release.version,'1.72.1');
assert.equal(feed.release.build,190);
assert.equal(feed.release.minimumBundled,'1.72.0');
assert.equal(feed.release.modules.length,1);

const modules=[
 ['v1721-character-loader-hotfix','patches/v1.72.1-character-loader-hotfix.js']
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
assert(feed.release.notes.some(note=>note.includes('live v80 wardrobe hook')));
console.log('v1.72.1 channel: exact hotfix checksum, trusted model routes, build floor, and size limit passed');
