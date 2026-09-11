/* Aetherion Reforged safe update channel. */
(()=>{
 const feed={"schema":2,"channel":"stable","release":{"version":"1.74.0","build":196,"minimumBundled":"1.72.6","releasedAt":"2026-09-11T02:48:49Z","requiresApk":true,"apkUrl":"https://github.com/corinthianrattler-ui/aetherion-updates/releases/download/v1.74.0/Aetherion_Reforged_v1.74.0_CLEAN_MAINTENANCE_FULL.apk","apkSha256":"08791fdc068bcfa6a1809961dc01954c3f1d614cf5a684f4b33fd2308be0d3c7","apkSize":543684738,"notes":["Complete maintenance rebuild; preserves voices, content, mechanics and saves.","Repairs full-body portrait routing and removes only verified technical debris."],"modules":[],"assets":{}}};
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
