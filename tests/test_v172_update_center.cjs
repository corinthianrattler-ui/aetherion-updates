const assert=require('assert');
const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const updater=fs.readFileSync(path.join(root,'patches/v1.72.0-safe-updater.js'),'utf8');
const center=fs.readFileSync(path.join(root,'patches/v1.72.0-update-center.js'),'utf8');

assert.match(updater,/const VERSION='1\.72\.0'/);
assert.match(updater,/const BUNDLED_VERSION='1\.72\.0'/);
assert.match(updater,/const ANDROID_BUILD=189/);
assert.doesNotMatch(updater,/new MutationObserver/);
assert.doesNotMatch(center,/function launcher/);
assert.doesNotMatch(center,/position:fixed!important;z-index:2147483640/);
assert.match(center,/Opening Menu → GAME UPDATES/);
assert.match(center,/Systems → GAME UPDATES/);
assert.match(center,/CHANNEL_DISPLAY_URL/);
assert.match(center,/XMLHttpRequest/);
assert.match(center,/request\.onprogress/);
assert.match(center,/CHECK & DOWNLOAD/);
assert.match(center,/INSTALL DOWNLOADED UPDATE/);
assert.match(center,/RESTART GAME/);
assert.match(center,/formatBytes\(runtime\.lastBytes\)/);
assert.doesNotMatch(center,/new MutationObserver/);
assert.doesNotMatch(center,/save data/i);

console.log('v1.72.0 menu update center and no-observer performance checks passed');
