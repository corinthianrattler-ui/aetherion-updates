'use strict';
(()=>{
 const VERSION='1.73.2',ROOT='https://raw.githubusercontent.com/corinthianrattler-ui/aetherion-updates/main/custom/camp-scenes/v1732/';
 if(window.AetherionV1732CampScenes?.version===VERSION)return;
 const scenes=Object.freeze({
  make:{file:'make-camp.mp4',title:'Making Camp'},
  strike:{file:'strike-camp.mp4',title:'Taking Down Camp'},
  food:{file:'camp-food.mp4',title:'Company Meal'},
  sleep:{file:'camp-sleep.mp4',title:'Night in Camp'}
 });
 const runtime={active:null,plays:{make:0,strike:0,food:0,sleep:0},errors:0};
 const clock=()=>typeof v14Now==='function'?v14Now():((+S?.world?.day||0)*24+(+S?.world?.hour||0));
 function returnToCamp(){let video=document.getElementById?.('v1732CampVideo');try{video?.pause?.();video?.removeAttribute?.('src');video?.load?.()}catch(_){ }runtime.active=null;if(typeof closeModal==='function')closeModal();if(typeof v24OpenCamp==='function')v24OpenCamp()}
 function play(){let video=document.getElementById?.('v1732CampVideo'),gate=document.getElementById?.('v1732CampPlay');if(gate)gate.hidden=true;let attempt=video?.play?.();attempt?.catch?.(()=>{if(gate)gate.hidden=false})}
 function failed(){runtime.errors++;let video=document.getElementById?.('v1732CampVideo'),fallback=document.getElementById?.('v1732CampFallback');if(video)video.hidden=true;if(fallback)fallback.hidden=false}
 function show(key){let scene=scenes[key];if(!scene||typeof openModal!=='function')return false;runtime.active=key;runtime.plays[key]++;let poster=typeof V24_CAMP_MAP==='string'?V24_CAMP_MAP:'';openModal(`<div class="modalHeader"><h2>${scene.title}</h2><button onclick="AetherionV1732CampScenes.returnToCamp()">✕</button></div><div class="v1732CampScene"><video id="v1732CampVideo" src="${ROOT+scene.file}" ${poster?`poster="${poster}"`:''} autoplay controls playsinline webkit-playsinline preload="auto"></video><div id="v1732CampFallback" class="v1732CampFallback" ${poster?`style="background-image:url('${poster}')"`:''} hidden><b>Action complete.</b><span>Film unavailable.</span></div></div><div class="modalActions"><button id="v1732CampPlay" class="primary" onclick="AetherionV1732CampScenes.play()" hidden>PLAY</button><button onclick="AetherionV1732CampScenes.returnToCamp()">RETURN TO CAMP</button></div>`);let video=document.getElementById?.('v1732CampVideo');video?.addEventListener?.('ended',returnToCamp,{once:true});video?.addEventListener?.('error',failed,{once:true});play();return true}
 function tagged(name,wrapper){let base=globalThis[name];if(typeof base!=='function'||base.__v1732CampScene)return false;let next=wrapper(base);next.__v1732CampScene=true;globalThis[name]=next;return true}
 function install(){
  tagged('v24CampMap',base=>function(...args){let out=String(base.apply(this,args)),active=!!S?.v24?.camp?.active;return out.replace('ESTABLISH / STRIKE CAMP',active?'TAKE DOWN CAMP':'MAKE CAMP')});
  tagged('v24EstablishCamp',base=>function(...args){let before=!!S?.v24?.camp?.active,out=base.apply(this,args),after=!!S?.v24?.camp?.active;if(before!==after){if(!after&&typeof persist==='function')persist(false);show(after?'make':'strike')}return out});
  for(const[name,key]of[['v24CookMeal','food'],['v24SleepCamp','sleep']])tagged(name,base=>function(...args){let before=clock(),out=base.apply(this,args);if(clock()>before)show(key);return out});
  if(typeof document==='object'&&!document.getElementById?.('aetherion-v1732-camp-scenes')){let style=document.createElement('style');style.id='aetherion-v1732-camp-scenes';style.textContent='.v1732CampScene video{display:block;width:100%;max-height:56vh;aspect-ratio:3/2;object-fit:cover}.v1732CampFallback{min-height:220px;background-size:cover;display:flex;flex-direction:column;justify-content:end;padding:18px}.v1732CampFallback[hidden]{display:none}';document.head?.appendChild(style)}
 }
 install();
 window.AetherionV1732CampScenes=Object.freeze({version:VERSION,root:ROOT,scenes,runtime,show,play,returnToCamp,install});
})();
