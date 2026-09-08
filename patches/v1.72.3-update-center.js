/* Aetherion Reforged v1.72.3 — native-aware update center with truthful install status. */
'use strict';
(()=>{
 const VERSION='1.72.3';
 const ANDROID_BUILD=192;
 const CHANNEL_API_URL='https://api.github.com/repos/corinthianrattler-ui/aetherion-updates/contents/channel.js';
 const CHANNEL_DISPLAY_URL=`${CHANNEL_API_URL}?ref=main`;
 const APK_URL='https://github.com/corinthianrattler-ui/aetherion-updates/releases/download/v1.72.3/Aetherion_Reforged_v1.72.3_FULL_REPAIR.apk';
 const NATIVE_SENTINEL='assets/v173/native-build-192.json';
 const runtime={modal:null,busy:false,candidate:null,lastBytes:0,lastTotal:0,native:null,nativeCheck:null};

 if(window.AetherionUpdateCenterV172?.version===VERSION)return;

 function updater(){return window.AetherionUpdater}
 function state(){
  try{return updater()?.state?.()||{bundled:VERSION,current:VERSION,staged:null}}
  catch(_){return{bundled:VERSION,current:VERSION,staged:null}}
 }
 function formatBytes(value){
  const bytes=Math.max(0,Number(value)||0);
  if(bytes<1024)return`${Math.round(bytes)} B`;
  if(bytes<1024*1024)return`${(bytes/1024).toFixed(bytes<10240?1:0)} KB`;
  return`${(bytes/(1024*1024)).toFixed(1)} MB`;
 }
 function text(tag,className,value){
  const node=document.createElement(tag);if(className)node.className=className;
  if(value!==undefined)node.textContent=value;return node;
 }
 function action(host,label,handler,className=''){
  const control=text('button',className,label);control.type='button';control.addEventListener('click',handler);host.appendChild(control);return control;
 }
 function close(){if(runtime.busy)return;runtime.modal?.remove?.();runtime.modal=null}
 function openFullApk(){globalThis.location.href=APK_URL}
 function nativePackage(){
  if(runtime.native)return Promise.resolve(runtime.native);if(runtime.nativeCheck)return runtime.nativeCheck;
  runtime.nativeCheck=new Promise(resolve=>{
   const request=new XMLHttpRequest();request.open('GET',`${NATIVE_SENTINEL}?check=${Date.now()}`,true);request.timeout=6000;
   const finish=value=>{runtime.native=value;runtime.nativeCheck=null;resolve(value)};
   request.onerror=()=>finish({verified:false,version:null,build:0});request.ontimeout=request.onerror;
   request.onload=()=>{
    try{
     const value=JSON.parse(String(request.responseText||''));
     if((Number(request.status)||0)!==200||value?.version!==VERSION||Number(value?.build)!==ANDROID_BUILD)throw Error('wrong native marker');
     finish({verified:true,version:value.version,build:Number(value.build)});
    }catch(_){finish({verified:false,version:null,build:0})}
   };
   try{request.send()}catch(_){finish({verified:false,version:null,build:0})}
  });return runtime.nativeCheck;
 }
 function percent(loaded,total){return total>0?Math.min(100,Math.round(loaded/total*100)):null}
 function paintProgress(ui,loaded,total,label){
  runtime.lastBytes=Math.max(0,Number(loaded)||0);runtime.lastTotal=Math.max(0,Number(total)||0);
  const amount=percent(runtime.lastBytes,runtime.lastTotal);
  ui.bar.style.width=`${amount===null?(runtime.lastBytes?72:8):amount}%`;
  ui.bar.classList.toggle('au-indeterminate',amount===null);
  ui.progressText.textContent=amount===null
   ?`${label} · ${formatBytes(runtime.lastBytes)} received`
   :`${label} · ${amount}% · ${formatBytes(runtime.lastBytes)} / ${formatBytes(runtime.lastTotal)}`;
 }
 function decodeChannel(payload){
  if(!payload||payload.encoding!=='base64'||typeof payload.content!=='string')throw Error('The update server returned an invalid channel file.');
  const helper=updater()?._test?.decodeBase64Utf8;
  if(typeof helper==='function')return helper(payload.content);
  const raw=atob(payload.content.replace(/\s+/g,'')),bytes=new Uint8Array(raw.length);
  for(let index=0;index<raw.length;index++)bytes[index]=raw.charCodeAt(index);
  return typeof TextDecoder==='function'?new TextDecoder().decode(bytes):decodeURIComponent(escape(raw));
 }
 function xhrDownload(url,onProgress){
  return new Promise((resolve,reject)=>{
   const request=new XMLHttpRequest();request.open('GET',url,true);request.timeout=30000;
   try{request.setRequestHeader('Accept','application/vnd.github+json')}catch(_){ }
   request.onprogress=event=>onProgress(event.loaded,event.lengthComputable?event.total:0);
   request.onerror=()=>reject(Error('The update address could not be reached. Check your internet connection.'));
   request.ontimeout=()=>reject(Error('The update download timed out.'));
   request.onload=()=>{
    if(request.status<200||request.status>=300)return reject(Error(`The update server answered with HTTP ${request.status}.`));
    onProgress(request.responseText?.length||0,request.responseText?.length||0);resolve(String(request.responseText||''));
   };
   request.send();
  });
 }
 async function downloadRelease(onProgress){
  const bridge=updater();
  if(!bridge?._test?.verifyRelease)throw Error('The built-in update verifier is unavailable.');
  const url=`${CHANNEL_API_URL}?ref=main&download=${Date.now()}`;
  const body=await xhrDownload(url,onProgress);
  let documentPayload;
  try{documentPayload=JSON.parse(body)}catch(_){throw Error('The downloaded update index was not valid JSON.');}
  const source=decodeChannel(documentPayload);
  if(!source||source.length>100000)throw Error('The downloaded update index was empty or too large.');
  let feed=null;const original=bridge.receiveChannel;
  bridge.receiveChannel=value=>{feed=value;return original?.call?.(bridge,value)};
  try{(0,eval)(`${source}\n//# sourceURL=aetherion-downloaded-channel.js`)}
  finally{bridge.receiveChannel=original}
  if(!feed||feed.schema!==2||!feed.release)throw Error('The downloaded update index has an unsupported format.');
  const release=await bridge._test.verifyRelease(feed.release);
  return{release,wireBytes:body.length,sourceBytes:source.length};
 }
 function stageWebPatch(ui,release){
  try{
   updater().stage(release);runtime.candidate=release;
   paintProgress(ui,runtime.lastBytes||1,runtime.lastTotal||runtime.lastBytes||1,'Web patch staged');
   ui.bar.style.width='100%';ui.bar.classList.remove('au-indeterminate');
   ui.status.textContent=`Web patch ${release.version} is staged. Restart the game to test it. This did not install an Android APK.`;
   ui.actions.replaceChildren();
   action(ui.actions,'RESTART GAME',()=>location.reload(),'au-primary');
   action(ui.actions,'CLOSE',close);
  }catch(error){ui.status.textContent=String(error?.message||error)}
 }
 function copyAddress(control,status,value=CHANNEL_DISPLAY_URL){
  const done=()=>{control.textContent='COPIED';setTimeout(()=>{control.textContent='COPY ADDRESS'},1300)};
  if(navigator.clipboard?.writeText){navigator.clipboard.writeText(value).then(done).catch(()=>fallbackCopy())}
  else fallbackCopy();
  function fallbackCopy(){
   const field=document.createElement('textarea');field.value=value;field.style.position='fixed';field.style.opacity='0';
   document.body.appendChild(field);field.select();try{document.execCommand('copy');done()}catch(_){status.textContent='The address is shown above; press and hold it to copy.'}field.remove();
  }
 }
 function open(){
  if(runtime.modal)return;
  mount();
  const overlay=text('div','aetherion-update-center');
  const card=text('section','auc-card');card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-label','Game Updates');
  const eyebrow=text('div','auc-eyebrow','AETHERION REFORGED');
  const heading=text('h2','', 'Game Updates');
  const installed=state();
  const versions=text('div','auc-version','Checking the installed Android package…');
  const route=text('div','auc-route');
  route.innerHTML='<b>Update path</b><span>1. Tap DOWNLOAD FULL APK.</span><span>2. Watch Android download the APK, then open it.</span><span>3. Approve Update when Android asks. Build 192 identifies itself after installation.</span>';
  const endpoint=text('div','auc-endpoint');
  endpoint.append(text('b','', 'Update address'),text('code','',CHANNEL_DISPLAY_URL));
  const copy=action(endpoint,'COPY ADDRESS',()=>copyAddress(copy,status),'auc-copy');
  const apkEndpoint=text('div','auc-endpoint auc-apk-endpoint');
  apkEndpoint.append(text('b','', 'Full Android 3D build'),text('code','',APK_URL));
  const copyApk=action(apkEndpoint,'COPY ADDRESS',()=>copyAddress(copyApk,status,APK_URL),'auc-copy');
  const status=text('div','auc-status',installed.staged
   ?`Web patch ${installed.staged} is staged. It is not an Android APK installation.`
   :'Ready. CHECK FOR UPDATE downloads only the small signed update index. DOWNLOAD FULL APK downloads the actual game.');
  const progress=text('div','auc-progress');const bar=text('div','auc-progress-bar');progress.appendChild(bar);
  const progressText=text('div','auc-progress-text','Waiting — 0 B received');
  const notes=text('ul','auc-notes');
  const actions=text('div','auc-actions');
  const ui={overlay,card,status,progress,bar,progressText,notes,actions};
  const check=action(actions,'CHECK FOR UPDATE',async()=>{
   if(runtime.busy)return;runtime.busy=true;check.disabled=true;notes.replaceChildren();
   status.textContent='Connecting to the update address…';paintProgress(ui,0,0,'Connecting');
   try{
    const [result,native]=await Promise.all([downloadRelease((loaded,total)=>paintProgress(ui,loaded,total,'Downloading update index')),nativePackage()]);
    const release=result.release;runtime.candidate=release;
    const current=state().current||VERSION;
    for(const line of release.notes||[]){const item=text('li','',line);notes.appendChild(item)}
    paintProgress(ui,result.wireBytes,result.wireBytes,'Downloaded and verified');
    const newer=updater()._test.compareVersions(release.version,current)>0;
    const nativeRequired=!native.verified||release.requiresApk===true||Number(release.build)>native.build;
    if(nativeRequired){
     status.textContent=`FULL ANDROID INSTALL REQUIRED\nThe ${formatBytes(result.wireBytes)} update index was verified, but it cannot contain the game models. Download and install Android build ${release.build||ANDROID_BUILD}.`;
     actions.replaceChildren();
     action(actions,'DOWNLOAD FULL APK',openFullApk,'au-primary');
     const copyRequired=action(actions,'COPY APK ADDRESS',()=>copyAddress(copyRequired,status,release.apkUrl||APK_URL));
     action(actions,'CLOSE',close);
    }else if(newer){
     status.textContent=`Web patch ${release.version} is verified. Staging it will not replace the Android APK.`;
     actions.replaceChildren();
     action(actions,'STAGE VERIFIED WEB PATCH',()=>stageWebPatch(ui,release),'au-primary');
     action(actions,'CLOSE',close);
    }else{
     status.textContent=`Verified. Installed APK ${native.version} / build ${native.build} is current, and all native model files are available.`;
    }
   }catch(error){
    ui.bar.style.width='0%';ui.bar.classList.remove('au-indeterminate');
    status.textContent=`Download failed: ${String(error?.message||error)}`;
    progressText.textContent=`Stopped after ${formatBytes(runtime.lastBytes)} received`;
   }finally{runtime.busy=false;check.disabled=false}
  },'au-primary');
  if(installed.staged){action(actions,'RESTART WEB PATCH',()=>location.reload())}
  action(actions,'DOWNLOAD FULL APK',openFullApk,'au-primary');
  action(actions,'CLOSE',close);
  card.append(eyebrow,heading,versions,route,endpoint,apkEndpoint,status,progress,progressText,notes,actions);
  overlay.appendChild(card);overlay.addEventListener('click',event=>{if(event.target===overlay)close()});
  (document.body||document.documentElement).appendChild(overlay);runtime.modal=overlay;
  nativePackage().then(native=>{
   if(!versions.isConnected)return;
   versions.textContent=native.verified
    ?`INSTALLED APK ${native.version} · NATIVE BUILD ${native.build}`
    :`OLDER APK DETECTED · BUILD ${ANDROID_BUILD} NATIVE FILES ARE NOT INSTALLED`;
   versions.classList.toggle('auc-native-good',native.verified);versions.classList.toggle('auc-native-bad',!native.verified);
  });
 }
 function mount(){
  document.getElementById('aetherion-update-launcher')?.remove?.();
  for(const host of document.querySelectorAll?.('.startBtns,.dockTabs')||[]){
   if(!host.querySelector('[data-aetherion-updates]')){
    const control=text('button','small aetherion-update-button','GAME UPDATES');control.type='button';control.dataset.aetherionUpdates='true';control.dataset.aetherionUpdateCenter='true';host.appendChild(control);
   }
  }
 }
 function styles(){
  if(document.getElementById('aetherion-update-center-style'))return;
  const css=text('style');css.id='aetherion-update-center-style';css.textContent=`
   .aetherion-update-center{position:fixed;z-index:2147483647;inset:0;display:flex;align-items:center;justify-content:center;padding:14px;background:#000e}
   .auc-card{box-sizing:border-box;width:min(620px,100%);max-height:92vh;overflow:auto;padding:20px;border:1px solid #98713f;border-radius:15px;background:linear-gradient(180deg,#171013,#090709);color:#eadeda;box-shadow:0 24px 64px #000;font-family:Georgia,serif}
   .auc-eyebrow{font-size:11px;font-weight:700;letter-spacing:.18em;color:#aa8a56}.auc-card h2{margin:4px 0 3px;color:#e2c477;font-size:27px}.auc-version{margin-bottom:14px;color:#b9a9a4;font:700 12px ui-monospace,monospace}.auc-native-good{color:#afd0b4}.auc-native-bad{color:#efb5b9}
   .auc-route{display:grid;gap:5px;margin:0 0 12px;padding:12px;border:1px solid #57413b;border-radius:10px;background:#100b0d}.auc-route b{color:#e0c680}.auc-route span{font-size:13px;color:#d5c8c3}
   .auc-endpoint{display:grid;grid-template-columns:1fr auto;gap:7px 10px;align-items:center;margin-bottom:12px;padding:12px;border:1px solid #443337;border-radius:10px;background:#080607}.auc-endpoint b{grid-column:1/-1;color:#cbb078}.auc-endpoint code{min-width:0;overflow-wrap:anywhere;color:#bdb2ae;font:11px ui-monospace,monospace}.auc-copy{padding:7px 9px!important;font-size:11px!important}
   .auc-status{min-height:42px;padding:12px;border:1px solid #493537;border-radius:10px;background:#0c090a;white-space:pre-wrap;line-height:1.42;font-size:14px}
   .auc-progress{height:14px;margin-top:12px;overflow:hidden;border:1px solid #60483e;border-radius:999px;background:#050405}.auc-progress-bar{width:0;height:100%;border-radius:inherit;background:linear-gradient(90deg,#80572c,#d3aa55);transition:width .16s ease}.auc-progress-bar.au-indeterminate{animation:auc-pulse .8s alternate infinite}.auc-progress-text{margin-top:6px;color:#baa9a2;font:12px ui-monospace,monospace}
   .auc-notes{margin:12px 0 0;padding-left:20px;line-height:1.4;font-size:13px}.auc-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:15px}.auc-actions button,.auc-endpoint button{border:1px solid #75583c;border-radius:8px;background:#28191b;color:#f1dfd7;padding:10px 12px;font:700 13px Georgia,serif}.auc-actions .au-primary{background:#654225;border-color:#ba8d4d;color:#fff1c5}.auc-actions button:disabled{opacity:.5}
   @keyframes auc-pulse{from{opacity:.55}to{opacity:1}}
   @media(max-width:430px){.auc-card{padding:16px}.auc-endpoint{grid-template-columns:1fr}.auc-copy{justify-self:start}}
  `;(document.head||document.documentElement).appendChild(css);
 }

 document.addEventListener('click',event=>{
  const target=event.target?.closest?.('[data-aetherion-updates]');if(!target)return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();open();
 },true);
 function start(){styles();mount()}
 window.AetherionUpdateCenterV172=Object.freeze({version:VERSION,androidBuild:ANDROID_BUILD,channel:CHANNEL_DISPLAY_URL,apk:APK_URL,open,close,mount,nativePackage,state:()=>({...state(),native:runtime.native,busy:runtime.busy,lastBytes:runtime.lastBytes,lastTotal:runtime.lastTotal})});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
