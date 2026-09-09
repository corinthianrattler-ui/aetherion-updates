/* Aetherion Reforged v1.72.5 — native-aware bundled updater baseline. */
'use strict';
(()=>{
 const VERSION='1.72.5';
 const BUNDLED_VERSION='1.72.5';
 const ANDROID_BUILD=194;
 const CHANNEL_API_URL='https://api.github.com/repos/corinthianrattler-ui/aetherion-updates/contents/channel.js';
 const CHANNEL_FALLBACK_URL='https://cdn.jsdelivr.net/gh/corinthianrattler-ui/aetherion-updates@main/channel.js';
 const CHANNEL_CALLBACK='AetherionChannelDocument';
 const STATE_KEY='aetherion_safe_update_state_v1';
 const BOOT_KEY='aetherion_safe_update_boot_v1';
 const NOTICE_KEY='aetherion_safe_update_notice_v1';
 const FORCE_SAFE_KEY='aetherion_safe_update_force_safe_v1';
 const MAX_TOTAL_SOURCE_BYTES=1500000;
 const MAX_MODULE_SOURCE_BYTES=500000;
 const MAX_CHANNEL_SOURCE_BYTES=100000;
 const CHECK_INTERVAL=24*60*60*1000;
 const RAW_PREFIX='https://raw.githubusercontent.com/corinthianrattler-ui/aetherion-updates/';
 const RELEASE_PREFIX='https://github.com/corinthianrattler-ui/aetherion-updates/releases/download/';

 const existing=window.AetherionUpdater||{};
 if(existing.safeUpdaterVersion===VERSION)return;
 const previousAsset=typeof existing.asset==='function'
  ?existing.asset.bind(existing)
  :path=>new URL(String(path||''),document.baseURI).href;
 const runtime={
  activeLoaded:null,assets:Object.create(null),candidate:null,checking:null,
  modal:null,grace:null,safeSession:false,lastError:null
 };

 function versionParts(value){
  const match=String(value||'').trim().match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
  return match?match.slice(1).map(Number):null;
 }
 function compareVersions(left,right){
  const a=versionParts(left),b=versionParts(right);
  if(!a||!b)return 0;
  for(let index=0;index<3;index++)if(a[index]!==b[index])return a[index]>b[index]?1:-1;
  return 0;
 }
 function byteLength(value){
  try{return new TextEncoder().encode(String(value)).length}catch(_){return unescape(encodeURIComponent(String(value))).length}
 }
 function utf8(value){
  if(typeof TextEncoder==='function')return new TextEncoder().encode(String(value));
  const raw=unescape(encodeURIComponent(String(value))),out=new Uint8Array(raw.length);
  for(let index=0;index<raw.length;index++)out[index]=raw.charCodeAt(index);
  return out;
 }
 function fallbackSha256(bytes){
  const constants=[
   0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
   0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
   0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
   0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
   0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
   0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
   0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
   0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];
  const paddedLength=Math.ceil((bytes.length+9)/64)*64,buffer=new Uint8Array(paddedLength);
  buffer.set(bytes);buffer[bytes.length]=0x80;
  const bitLength=bytes.length*8,view=new DataView(buffer.buffer);
  view.setUint32(paddedLength-8,Math.floor(bitLength/0x100000000),false);
  view.setUint32(paddedLength-4,bitLength>>>0,false);
  const hash=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
  const words=new Uint32Array(64),rotate=(value,count)=>(value>>>count)|(value<<(32-count));
  for(let offset=0;offset<paddedLength;offset+=64){
   for(let index=0;index<16;index++)words[index]=view.getUint32(offset+index*4,false);
   for(let index=16;index<64;index++){
    const x=words[index-15],y=words[index-2];
    const s0=rotate(x,7)^rotate(x,18)^(x>>>3),s1=rotate(y,17)^rotate(y,19)^(y>>>10);
    words[index]=(words[index-16]+s0+words[index-7]+s1)>>>0;
   }
   let[a,b,c,d,e,f,g,h]=hash;
   for(let index=0;index<64;index++){
    const s1=rotate(e,6)^rotate(e,11)^rotate(e,25),choice=(e&f)^(~e&g);
    const t1=(h+s1+choice+constants[index]+words[index])>>>0;
    const s0=rotate(a,2)^rotate(a,13)^rotate(a,22),majority=(a&b)^(a&c)^(b&c);
    const t2=(s0+majority)>>>0;
    h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
   }
   hash[0]=(hash[0]+a)>>>0;hash[1]=(hash[1]+b)>>>0;hash[2]=(hash[2]+c)>>>0;hash[3]=(hash[3]+d)>>>0;
   hash[4]=(hash[4]+e)>>>0;hash[5]=(hash[5]+f)>>>0;hash[6]=(hash[6]+g)>>>0;hash[7]=(hash[7]+h)>>>0;
  }
  return Array.from(hash,value=>value.toString(16).padStart(8,'0')).join('');
 }
 async function sha256(value){
  const bytes=utf8(value);
  try{
   if(globalThis.crypto?.subtle){
    const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
    return Array.from(new Uint8Array(digest),part=>part.toString(16).padStart(2,'0')).join('');
   }
  }catch(_){ }
  return fallbackSha256(bytes);
 }
 function emptyState(){return{schema:1,active:null,previous:null,staged:null,lastCheckAt:0,lastSeenVersion:BUNDLED_VERSION}}
 function readState(){
  try{
   const value=JSON.parse(localStorage.getItem(STATE_KEY)||'null');
   if(!value||value.schema!==1)return emptyState();
   return{...emptyState(),...value};
  }catch(_){return emptyState()}
 }
 function writeState(state){
  try{localStorage.setItem(STATE_KEY,JSON.stringify({...emptyState(),...state,schema:1}));return true}
  catch(error){runtime.lastError=String(error?.message||error);return false}
 }
 function readBoot(){try{return JSON.parse(localStorage.getItem(BOOT_KEY)||'null')}catch(_){return null}}
 function writeNotice(message){try{localStorage.setItem(NOTICE_KEY,String(message||''))}catch(_){ }}
 function takeNotice(){try{const value=localStorage.getItem(NOTICE_KEY)||'';localStorage.removeItem(NOTICE_KEY);return value}catch(_){return''}}
 function normalizePath(path){
  const value=String(path||'').replace(/^\.\//,'');
  if(!value||value.startsWith('/')||value.includes('..')||value.includes('\\'))return'';
  return value;
 }
 function allowedRemote(url){return typeof url==='string'&&(url.startsWith(RAW_PREFIX)||url.startsWith(RELEASE_PREFIX))}
 function sanitizeRelease(input,{sources=true}={}){
  if(!input||typeof input!=='object'||!versionParts(input.version))throw Error('The update version is invalid.');
  if(input.minimumBundled&&(!versionParts(input.minimumBundled)||compareVersions(input.minimumBundled,BUNDLED_VERSION)>0))throw Error('This update requires a newer full APK.');
  const modules=Array.isArray(input.modules)?input.modules:[];
  let total=0;
  const cleanedModules=modules.map((module,index)=>{
   if(!module||typeof module!=='object')throw Error(`Update module ${index+1} is invalid.`);
   const id=String(module.id||'');
   if(!/^[a-z0-9._-]{1,80}$/i.test(id))throw Error(`Update module ${index+1} has an invalid name.`);
   const digest=String(module.sha256||'').toLowerCase();
   if(!/^[a-f0-9]{64}$/.test(digest))throw Error(`Update module ${id} has no valid checksum.`);
   const source=String(module.source??'');
   const size=byteLength(source);total+=size;
   if(!source||size>MAX_MODULE_SOURCE_BYTES)throw Error(`Update module ${id} is too large.`);
   return{id,sha256:digest,source:sources?source:''};
  });
  if(total>MAX_TOTAL_SOURCE_BYTES)throw Error('This update is too large for safe patch storage and requires a full APK.');
  const assets={};
  if(input.assets&&typeof input.assets==='object')for(const[path,url]of Object.entries(input.assets)){
   const key=normalizePath(path);if(!key||!allowedRemote(url))throw Error('The update contains an unsafe asset address.');assets[key]=url;
  }
  const notes=(Array.isArray(input.notes)?input.notes:[]).slice(0,20).map(note=>String(note).slice(0,500));
  const build=Math.max(0,Math.floor(Number(input.build)||0)),requiresApk=input.requiresApk===true||build>ANDROID_BUILD;
  const apkUrl=String(input.apkUrl||'');
  const apkSha256=String(input.apkSha256||'').toLowerCase();
  const apkSize=Math.max(0,Math.floor(Number(input.apkSize)||0));
  if(apkUrl&&(!allowedRemote(apkUrl)||!/\.apk(?:[?#]|$)/i.test(apkUrl)))throw Error('The update contains an unsafe Android download address.');
  if(apkSha256&&!/^[a-f0-9]{64}$/.test(apkSha256))throw Error('The Android update checksum is invalid.');
  return{version:String(input.version),build,minimumBundled:String(input.minimumBundled||BUNDLED_VERSION),modules:cleanedModules,assets,notes,releasedAt:String(input.releasedAt||''),requiresApk,apkUrl,apkSha256,apkSize};
 }
 async function verifyRelease(input){
  const release=sanitizeRelease(input);
  for(const module of release.modules){
   const actual=await sha256(module.source);
   if(actual!==module.sha256)throw Error(`Checksum failed for ${module.id}. Nothing was installed.`);
  }
  return release;
 }
 function currentVersion(){
  if(runtime.activeLoaded)return runtime.activeLoaded;
  const active=readState().active;
  return active&&compareVersions(active.version,BUNDLED_VERSION)>0?active.version:BUNDLED_VERSION;
 }
 function asset(path){
  const key=normalizePath(path);
  if(key&&runtime.assets[key])return runtime.assets[key];
  return previousAsset(path);
 }
 function receiveChannel(feed){
  runtime.lastFeed=feed;
  if(runtime.checking?.resolve)runtime.checking.resolve(feed);
 }
 function decodeBase64Utf8(value){
  const raw=atob(String(value||'').replace(/\s+/g,'')),bytes=new Uint8Array(raw.length);
  for(let index=0;index<raw.length;index++)bytes[index]=raw.charCodeAt(index);
  if(typeof TextDecoder==='function')return new TextDecoder().decode(bytes);
  let encoded='';for(const byte of bytes)encoded+=`%${byte.toString(16).padStart(2,'0')}`;
  return decodeURIComponent(encoded);
 }
 function consumeChannelDocument(payload){
  const status=Number(payload?.meta?.status||0),data=payload?.data;
  if(status!==200||!data||data.encoding!=='base64'||typeof data.content!=='string')throw Error('The update channel response was invalid.');
  const source=decodeBase64Utf8(data.content);
  if(!source||byteLength(source)>MAX_CHANNEL_SOURCE_BYTES)throw Error('The update channel response was too large.');
  (0,eval)(`${source}\n//# sourceURL=aetherion-stable-channel.js`);
  return source;
 }
 function loadChannel(){
  if(runtime.checking)return runtime.checking.promise;
  let resolve,reject,finished=false,script=null,timeout=null,fallbackStarted=false;
  const promise=new Promise((yes,no)=>{resolve=yes;reject=no});
  runtime.checking={promise,resolve:feed=>{if(finished)return;finished=true;cleanup();resolve(feed)},reject:error=>{if(finished)return;finished=true;cleanup();reject(error)}};
  function cleanup(){clearTimeout(timeout);script?.remove?.();try{delete window[CHANNEL_CALLBACK]}catch(_){window[CHANNEL_CALLBACK]=undefined}runtime.checking=null}
  function appendScript(src,isFallback){
   script?.remove?.();script=document.createElement('script');script.async=true;script.src=src;
   script.onerror=()=>{if(finished)return;if(isFallback)runtime.checking?.reject(Error('The update channel could not be reached.'));else useFallback()};
   script.onload=()=>setTimeout(()=>{if(finished)return;if(isFallback)runtime.checking?.reject(Error('The update channel response was incomplete.'));else useFallback()},100);
   (document.head||document.documentElement).appendChild(script);
  }
  function useFallback(){
   if(finished||fallbackStarted)return;fallbackStarted=true;
   appendScript(`${CHANNEL_FALLBACK_URL}?check=${Date.now()}`,true);
  }
  window[CHANNEL_CALLBACK]=payload=>{
   if(finished||fallbackStarted)return;
   try{consumeChannelDocument(payload)}catch(error){runtime.lastError=String(error?.message||error);useFallback()}
  };
  timeout=setTimeout(()=>runtime.checking?.reject(Error('The update channel did not answer.')),20000);
  appendScript(`${CHANNEL_API_URL}?ref=main&callback=${encodeURIComponent(CHANNEL_CALLBACK)}&check=${Date.now()}`,false);
  return promise;
 }
 async function checkForUpdates(){
  const feed=await loadChannel();
  if(!feed||feed.schema!==2||!feed.release)throw Error('The update channel format is not supported.');
  const release=await verifyRelease(feed.release),state=readState();
  state.lastCheckAt=Date.now();state.lastSeenVersion=release.version;writeState(state);
  runtime.candidate=release;refreshButtons();return release;
 }
 function stage(release=runtime.candidate){
  if(!release)throw Error('Check for an update first.');
  if(release.requiresApk||Number(release.build)>ANDROID_BUILD)throw Error(`Android build ${release.build||'newer'} requires the full APK. A web patch cannot install models or native app files.`);
  if(compareVersions(release.version,currentVersion())<=0)throw Error('This version is already installed.');
  const state=readState();state.staged=sanitizeRelease(release);state.lastSeenVersion=release.version;
  if(!writeState(state))throw Error('The update could not be staged because device storage is full.');
  return state.staged;
 }
 function rollback(reason='Downloaded updates were disabled. The built-in game will start instead.'){
  const state=readState();state.active=null;state.previous=null;state.staged=null;writeState(state);
  try{localStorage.removeItem(BOOT_KEY)}catch(_){ }
  writeNotice(reason);return true;
 }
 function recoverFailedBoot(){
  const marker=readBoot(),state=readState();
  if(!marker||marker.status!=='loading'||!marker.version||state.active?.version!==marker.version)return false;
  const failed=state.active.version;state.active=state.previous||null;state.previous=null;state.staged=null;writeState(state);
  try{localStorage.removeItem(BOOT_KEY)}catch(_){ }
  writeNotice(`Update ${failed} did not finish starting and was rolled back automatically.`);return true;
 }
 function promoteStaged(){
  const state=readState();if(!state.staged)return state;
  state.previous=state.active||null;state.active=state.staged;state.staged=null;writeState(state);return state;
 }
 function executeRelease(release){
  runtime.assets={...release.assets};
  for(const module of release.modules){
   const source=`${module.source}\n//# sourceURL=aetherion-update-${module.id}.js`;
   (0,eval)(source);
  }
 }
 function frame(){return new Promise(resolve=>(window.requestAnimationFrame||setTimeout)(resolve))}
 function delay(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
 function removeGrace(){runtime.grace?.remove?.();runtime.grace=null}
 function safeGrace(release,firstBoot){
  return new Promise(resolve=>{
   const bar=document.createElement('div');bar.id='aetherion-update-grace';
   const text=document.createElement('span');text.textContent=firstBoot?`Update ${release.version} is ready to start.`:`Starting update ${release.version}…`;
   const safe=document.createElement('button');safe.type='button';safe.textContent='SAFE START';
   bar.append(text,safe);(document.body||document.documentElement).appendChild(bar);runtime.grace=bar;
   let done=false;const finish=value=>{if(done)return;done=true;clearTimeout(timer);removeGrace();resolve(value)};
   safe.addEventListener('click',()=>{runtime.safeSession=true;try{sessionStorage.setItem(FORCE_SAFE_KEY,'1')}catch(_){ }finish(false)});
   const timer=setTimeout(()=>finish(true),firstBoot?2200:1300);
  });
 }
 async function bootActive(){
  mountInterface();
  recoverFailedBoot();
  const forced=(()=>{try{const value=sessionStorage.getItem(FORCE_SAFE_KEY)==='1';sessionStorage.removeItem(FORCE_SAFE_KEY);return value}catch(_){return false}})();
  const before=readState(),firstBoot=!!before.staged,state=promoteStaged(),release=state.active;
  if(forced){runtime.safeSession=true;runtime.assets=Object.create(null);refreshButtons();return}
  if(!release||compareVersions(release.version,BUNDLED_VERSION)<=0){runtime.activeLoaded=BUNDLED_VERSION;refreshButtons();scheduleAutomaticCheck();return}
  if(!await safeGrace(release,firstBoot)){refreshButtons();return}
  try{
   localStorage.setItem(BOOT_KEY,JSON.stringify({status:'loading',version:release.version,startedAt:Date.now()}));
   executeRelease(release);await frame();await frame();await delay(2600);
   if(!document.body||!document.getElementById('app'))throw Error('The game interface did not remain available.');
   runtime.activeLoaded=release.version;localStorage.removeItem(BOOT_KEY);runtime.lastError=null;refreshButtons();scheduleAutomaticCheck();
  }catch(error){
   runtime.lastError=String(error?.message||error);rollback(`Update ${release.version} failed to start and was rolled back: ${runtime.lastError}`);
   try{sessionStorage.setItem(FORCE_SAFE_KEY,'1')}catch(_){ }
   location.reload();
  }
 }
 function injectStyles(){
  if(document.getElementById('aetherion-safe-updater-style'))return;
  const style=document.createElement('style');style.id='aetherion-safe-updater-style';style.textContent=`
   #aetherion-update-grace{position:fixed;z-index:2147483646;left:10px;right:10px;top:calc(env(safe-area-inset-top,0px) + 8px);display:flex;gap:10px;align-items:center;justify-content:space-between;padding:10px 12px;border:1px solid #735b33;border-radius:10px;background:rgba(18,12,14,.97);color:#ead39a;box-shadow:0 8px 28px #000;font:600 14px Georgia,serif}
   #aetherion-update-grace button,.aetherion-update-button{border:1px solid #806446!important;background:#241719!important;color:#f0d9a6!important;border-radius:7px!important;padding:8px 11px!important}
   #aetherion-update-modal{position:fixed;z-index:2147483645;inset:0;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.82)}
   #aetherion-update-modal .au-card{width:min(560px,100%);max-height:86vh;overflow:auto;border:1px solid #705338;border-radius:14px;background:#110c0e;color:#eadfda;box-shadow:0 18px 55px #000;padding:20px;font-family:Georgia,serif}
   #aetherion-update-modal h2{margin:0 0 6px;color:#d8b86b;letter-spacing:.04em}#aetherion-update-modal .au-version{color:#c8b9b1;margin-bottom:14px}
   #aetherion-update-modal .au-status{border:1px solid #3f3032;border-radius:9px;background:#0b0809;padding:12px;white-space:pre-wrap;line-height:1.45}
   #aetherion-update-modal .au-notes{margin:12px 0;padding-left:21px;line-height:1.45}#aetherion-update-modal .au-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:15px}
   #aetherion-update-modal button{border:1px solid #76583e;border-radius:8px;background:#251719;color:#f0ded7;padding:10px 13px;font:600 14px Georgia,serif}#aetherion-update-modal button.au-primary{background:#533322;border-color:#a4804e;color:#fff0c8}#aetherion-update-modal button.au-danger{border-color:#85474c;color:#ffd9dc}#aetherion-update-modal button:disabled{opacity:.5}
   .aetherion-update-badge{display:inline-block;min-width:7px;height:7px;margin-left:6px;border-radius:50%;background:#cf994b;vertical-align:middle}
  `;document.head.appendChild(style);
 }
 function button(label='GAME UPDATES'){
  const control=document.createElement('button');control.type='button';control.className='small aetherion-update-button';control.dataset.aetherionUpdates='true';
  control.append(document.createTextNode(label));control.addEventListener('click',open);return control;
 }
 function refreshButtons(){
  const available=runtime.candidate&&compareVersions(runtime.candidate.version,currentVersion())>0;
  document.querySelectorAll?.('[data-aetherion-updates]').forEach(control=>{
   const badge=control.querySelector?.('.aetherion-update-badge');
   if(!available)badge?.remove?.();
   else if(!badge){const next=document.createElement('span');next.className='aetherion-update-badge';next.setAttribute('aria-label','Update available');control.appendChild(next)}
  });
 }
 function mountButtons(){
  document.querySelectorAll?.('.dockTabs').forEach(host=>{if(!host.querySelector('[data-aetherion-updates]'))host.appendChild(button())});
  document.querySelectorAll?.('.startBtns').forEach(host=>{if(!host.querySelector('[data-aetherion-updates]'))host.appendChild(button('GAME UPDATES'))});
  refreshButtons();
 }
 function mountInterface(){
  injectStyles();mountButtons();
 }
 function addAction(host,label,handler,className=''){
  const control=document.createElement('button');control.type='button';control.textContent=label;control.className=className;control.addEventListener('click',handler);host.appendChild(control);return control;
 }
 function close(){runtime.modal?.remove?.();runtime.modal=null}
 function open(){
  close();mountInterface();
  const state=readState(),overlay=document.createElement('div');overlay.id='aetherion-update-modal';
  const card=document.createElement('section');card.className='au-card';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-label','Game Updates');
  const heading=document.createElement('h2');heading.textContent='Game Updates';
  const version=document.createElement('div');version.className='au-version';version.textContent=`Installed APK ${BUNDLED_VERSION} · Native build ${ANDROID_BUILD} · Running ${runtime.safeSession?'Safe Start':currentVersion()}`;
  const status=document.createElement('div');status.className='au-status';
  const notice=takeNotice();status.textContent=notice||(
   state.staged?`Update ${state.staged.version} is staged and will be tested after restart.`:
   runtime.safeSession?'Downloaded patches are skipped for this session. The built-in game is running.':
   state.active&&compareVersions(state.active.version,BUNDLED_VERSION)>0?`Update ${state.active.version} is installed. Automatic rollback remains armed during startup.`:
   'The built-in game is active. Check the stable channel whenever you want; updates never activate until they are fully staged.'
  );
  const notes=document.createElement('ul');notes.className='au-notes';
  const actions=document.createElement('div');actions.className='au-actions';
  const check=addAction(actions,'CHECK NOW',async()=>{
   check.disabled=true;status.textContent='Checking the stable update channel…';notes.replaceChildren();
   try{
    const release=await checkForUpdates(),newer=compareVersions(release.version,currentVersion())>0,nativeRequired=release.requiresApk||Number(release.build)>ANDROID_BUILD;
    status.textContent=newer&&nativeRequired?`Android build ${release.build} is required. This cannot be installed as a web patch; use DOWNLOAD FULL APK.`:newer?`Web patch ${release.version} is verified and ready to stage.`:`You are current. Version ${currentVersion()} / build ${ANDROID_BUILD} is the latest stable release.`;
    for(const line of release.notes){const item=document.createElement('li');item.textContent=line;notes.appendChild(item)}
    if(newer&&nativeRequired&&release.apkUrl)addAction(actions,'DOWNLOAD FULL APK',()=>{globalThis.location.href=release.apkUrl},'au-primary');
    if(newer&&!nativeRequired)addAction(actions,`STAGE WEB PATCH ${release.version}`,()=>{
     try{stage(release);status.textContent=`Update ${release.version} is stored safely. Restart to test it; a failed startup will roll back automatically.`;addAction(actions,'RESTART & APPLY',()=>location.reload(),'au-primary')}
     catch(error){status.textContent=String(error?.message||error)}
    },'au-primary');
   }catch(error){status.textContent=String(error?.message||error)}finally{check.disabled=false}
  },'au-primary');
  if(state.staged)addAction(actions,'RESTART & APPLY',()=>location.reload(),'au-primary');
  if(state.active||state.staged)addAction(actions,'USE BUILT-IN VERSION',()=>{
   if(!confirm('Disable downloaded updates and return to the built-in game? Your game saves will not be deleted.'))return;
   rollback();try{sessionStorage.setItem(FORCE_SAFE_KEY,'1')}catch(_){ }location.reload();
  },'au-danger');
  addAction(actions,'SAFE START ONCE',()=>{try{sessionStorage.setItem(FORCE_SAFE_KEY,'1')}catch(_){ }location.reload()});
  addAction(actions,'CLOSE',close);
  card.append(heading,version,status,notes,actions);overlay.appendChild(card);overlay.addEventListener('click',event=>{if(event.target===overlay)close()});
  (document.body||document.documentElement).appendChild(overlay);runtime.modal=overlay;
 }
 function scheduleAutomaticCheck(){
  const state=readState();if(Date.now()-(Number(state.lastCheckAt)||0)<CHECK_INTERVAL)return;
  setTimeout(()=>checkForUpdates().catch(()=>{}),5000);
 }

 Object.assign(existing,{
  safeUpdaterVersion:VERSION,bundledVersion:BUNDLED_VERSION,androidBuild:ANDROID_BUILD,
  asset,open,close,check:checkForUpdates,receiveChannel,stage,rollback,safeStart(){try{sessionStorage.setItem(FORCE_SAFE_KEY,'1')}catch(_){ }location.reload()},
  state(){const stored=readState();return{version:VERSION,bundled:BUNDLED_VERSION,current:currentVersion(),androidBuild:ANDROID_BUILD,safeSession:runtime.safeSession,active:stored.active?.version||null,previous:stored.previous?.version||null,staged:stored.staged?.version||null,lastError:runtime.lastError}},
  _test:Object.freeze({compareVersions,sha256,fallbackSha256,decodeBase64Utf8,consumeChannelDocument,sanitizeRelease,verifyRelease,readState,writeState,recoverFailedBoot,promoteStaged,currentVersion})
 });
 window.AetherionUpdater=existing;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountInterface,{once:true});else mountInterface();
 if(document.readyState==='complete')setTimeout(bootActive,0);else window.addEventListener('load',()=>setTimeout(bootActive,0),{once:true});
})();
