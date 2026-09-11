/* Aetherion Reforged safe update channel. */
(()=>{
 const feed={"schema":2,"channel":"stable","release":{"version":"1.74.2","build":197,"minimumBundled":"1.72.6","releasedAt":"2026-09-11T06:35:36Z","requiresApk":true,"apkUrl":"https://github.com/corinthianrattler-ui/aetherion-updates/releases/download/v1.74.2/Aetherion_Reforged_v1.74.2_FULLBODY_BUGFIX_FULL.apk","apkSha256":"81d0d1d3fdad0fd06e3a37a25e3d130db336faa673b46188df8cc06de4f945dc","apkSize":519356685,"notes":["Complete replacement APK; preserves every voice, model, map, film, mechanic, story item and save.","Repairs all known head and bust portrait routes, preserves existing full-body art, and physically removes only the obsolete portrait files plus superseded updater markers.","Includes the House Dominus Blood Rose sky dial and truthful full-APK update instructions."],"modules":[],"assets":{}}};
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
