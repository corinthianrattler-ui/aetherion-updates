/* Aetherion Reforged safe legacy compatibility channel. */
(()=>{
 const hotfix={
  version:'1.74.4',
  url:'https://raw.githubusercontent.com/corinthianrattler-ui/aetherion-updates/e103ec3098be9f6dd90657a9e085370e319c11f5/changes/1.74.4/aetherion-v1744-hotfix.js',
  sha256:'f2df55f5ab385a161aaccc22b039863f975fee6e549a196af60e46ddf6e865cf'
 };
 if(!window.AetherionV1744Hotfix&&!window.__aetherionV1744CompatRequested&&typeof fetch==='function'){
  window.__aetherionV1744CompatRequested=true;
  (async()=>{
   const response=await fetch(`${hotfix.url}?compat=${Date.now()}`,{cache:'no-store'});
   if(!response.ok)throw Error(`Aetherion ${hotfix.version} compatibility hotfix download failed: HTTP ${response.status}`);
   const source=await response.text();
   if(globalThis.crypto?.subtle&&typeof TextEncoder==='function'){
    const digest=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(source));
    const actual=Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,'0')).join('');
    if(actual!==hotfix.sha256)throw Error(`Aetherion ${hotfix.version} compatibility hotfix checksum rejected.`);
   }
   (0,eval)(`${source}\n//# sourceURL=aetherion-compat-${hotfix.version}.js`);
   window.__aetherionV1744CompatLoaded=hotfix.version;
  })().catch(error=>{
   window.__aetherionV1744CompatRequested=false;
   console.warn('[Aetherion legacy compatibility hotfix]',error);
  });
 }
 const feed={"schema":2,"channel":"stable","release":{"version":"1.74.3","build":198,"minimumBundled":"1.72.6","releasedAt":"2026-09-11T10:10:09Z","requiresApk":true,"apkUrl":"https://github.com/corinthianrattler-ui/aetherion-updates/releases/download/v1.74.3/Aetherion_Reforged_v1.74.3_FULL_GAME_REPAIR.apk","apkSha256":"d055b620e9f434fbba8ce0505d293be3141f072b81543a34340db0ca4996e00f","apkSize":519238034,"notes":["Complete replacement APK; install over the current app without uninstalling so saves remain in place.","Consolidates portrait routing into one cached single-pass system and preserves all valid full-body art.","Preserves Piper voices, story, mechanics, maps, models, films, items, native libraries, and save format."],"modules":[],"assets":{}}};
 window.__aetherionFullApkUrl=feed.release.apkUrl;
 if(!window.__aetherionV175ApkHandoff&&typeof document==='object'&&document?.addEventListener){
  window.__aetherionV175ApkHandoff=true;
  document.addEventListener('click',event=>{
   const control=event.target?.closest?.('button,a');
   if(String(control?.textContent||'').trim().toUpperCase()!=='DOWNLOAD FULL APK')return;
   const url=String(window.__aetherionFullApkUrl||'');
   if(!/^https:\/\/github\.com\/corinthianrattler-ui\/aetherion-updates\/releases\/download\//.test(url))return;
   event.preventDefault?.();event.stopPropagation?.();event.stopImmediatePropagation?.();globalThis.location.href=url;
  },true);
 }
 window.AetherionUpdater?.receiveChannel?.(feed);
})();
