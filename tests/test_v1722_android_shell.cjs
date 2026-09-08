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

console.log('v1.72.2 Android shell: secure HTTPS-style asset routing and external APK downloads passed');
