'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');

const root='android/v1722/smali/com/dominus/aetherionreforgey';
const activity=fs.readFileSync(`${root}/MainActivity.smali`,'utf8');
const client=fs.readFileSync(`${root}/AetherionAssetClient.smali`,'utf8');

assert.match(activity,/new-instance v0, Lcom\/dominus\/aetherionreforgey\/AetherionAssetClient;/);
assert.match(activity,/https:\/\/appassets\.androidplatform\.net\/assets\/game\/index\.html/);
assert.doesNotMatch(activity,/file:\/\/\/android_asset\/game\/index\.html/);
assert.match(activity,/invoke-virtual \{p1, v1\}, Landroid\/webkit\/WebSettings;->setAllowFileAccess\(Z\)V/);

assert.match(client,/shouldInterceptRequest\(Landroid\/webkit\/WebView;Landroid\/webkit\/WebResourceRequest;/);
assert.match(client,/Landroid\/content\/res\/AssetManager;->open\(Ljava\/lang\/String;I\)Ljava\/io\/InputStream;/);
assert.match(client,/model\/gltf-binary/);
assert.match(client,/application\/javascript/);
assert.match(client,/https:\/\/appassets\.androidplatform\.net\/assets\//);
assert.match(client,/shouldOverrideUrlLoading/);
assert.match(client,/android\.intent\.action\.VIEW/);
assert.doesNotMatch(client,/setAllowFileAccessFromFileURLs|setAllowUniversalAccessFromFileURLs/);

// The conditions matter: the old implementation used if-ltz here, replaced a
// real query/fragment index with -1, and consequently sent names such as
// style.css?v=1.16.2 to AssetManager. Merely checking for indexOf() did not
// exercise that control flow and allowed the broken APK to pass.
assert.match(client,/indexOf\(Ljava\/lang\/String;\)I\s+\n\s*move-result v2\s+\n\s*if-gez v2, :after_query/);
assert.match(client,/indexOf\(Ljava\/lang\/String;\)I\s+\n\s*move-result v3\s+\n\s*if-gez v3, :after_fragment/);
assert.doesNotMatch(client,/if-ltz v2, :after_query|if-ltz v3, :after_fragment/);

// Repeated launches must be allowed to reuse parsed scripts, styles, and
// decoded local assets. LOAD_DEFAULT is -1; clearing WebView cache on every
// onCreate was a measurable startup penalty.
assert.match(activity,/const\/4 v2, -0x1\s+\n\s*invoke-virtual \{p1, v2\}, Landroid\/webkit\/WebSettings;->setCacheMode\(I\)V/);
assert.doesNotMatch(activity,/->clearCache\(Z\)V/);

console.log('Android shell: query-safe local routing, retained cache, and external APK downloads passed');
