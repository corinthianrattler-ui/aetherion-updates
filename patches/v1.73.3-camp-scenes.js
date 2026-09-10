'use strict';
(()=>{
 const VERSION='1.73.3',ROOT='https://raw.githubusercontent.com/corinthianrattler-ui/aetherion-updates/main/custom/camp-scenes/v1732/';
 if(window.AetherionV1733CampScenes?.version===VERSION)return;
 const scenes=Object.freeze({make:'make-camp.mp4',strike:'strike-camp.mp4',food:'camp-food.mp4',sleep:'camp-sleep.mp4'}),runtime={active:null,plays:{make:0,strike:0,food:0,sleep:0},errors:0,skips:0};
 const clock=()=>typeof v14Now==='function'?v14Now():((+S?.world?.day||0)*24+(+S?.world?.hour||0));
 function returnToCamp(){let active=runtime.active,video=document.getElementById?.('v1733CampVideo');runtime.active=null;try{video?.pause?.();video?.removeAttribute?.('src');video?.load?.()}catch(_){ }if(!active)return;if(typeof closeModal==='function')closeModal();if(typeof v24OpenCamp==='function')v24OpenCamp()}
 function skip(){if(runtime.active){runtime.skips++;returnToCamp()}}
 function failed(){if(!runtime.active)return;runtime.errors++;let video=document.getElementById?.('v1733CampVideo'),fallback=document.getElementById?.('v1733CampFallback');if(video)video.hidden=true;if(fallback)fallback.hidden=false}
 function play(){document.getElementById?.('v1733CampVideo')?.play?.()?.catch?.(failed)}
 function show(key){let file=scenes[key];if(!file||typeof openModal!=='function')return false;runtime.active=key;runtime.plays[key]++;openModal(`<div class="v1733CampScene"><video id="v1733CampVideo" src="${ROOT+file}" autoplay playsinline webkit-playsinline preload="auto" controlslist="nodownload nofullscreen noremoteplayback" disablepictureinpicture disableremoteplayback oncontextmenu="return false"></video><button class="v1733CampSkip" onclick="AetherionV1733CampScenes.skip()">SKIP</button><div id="v1733CampFallback" class="v1733CampFallback" hidden>Action complete. Film unavailable.</div></div>`);let video=document.getElementById?.('v1733CampVideo');video?.addEventListener?.('ended',returnToCamp,{once:true});video?.addEventListener?.('error',failed,{once:true});play();return true}
 function tagged(name,wrap){let base=globalThis[name];if(typeof base!=='function'||base.__v1733===VERSION)return;let next=wrap(base);next.__v1733=VERSION;globalThis[name]=next}
 function install(){
  tagged('v24CampMap',base=>function(...args){let html=String(base.apply(this,args));return html.replace('ESTABLISH / STRIKE CAMP',S?.v24?.camp?.active?'TAKE DOWN CAMP':'MAKE CAMP')});
  tagged('v24EstablishCamp',base=>function(...args){let before=!!S?.v24?.camp?.active,start=clock(),out=base.apply(this,args),after=!!S?.v24?.camp?.active;if(before!==after){let needed=after?2:1,elapsed=Math.max(0,clock()-start);if(elapsed<needed&&typeof advanceHours==='function')advanceHours(needed-elapsed,'camp');if(!after&&typeof persist==='function')persist(false);show(after?'make':'strike')}return out});
  for(const[name,key]of[['v24CookMeal','food'],['v24SleepCamp','sleep']])tagged(name,base=>function(...args){let before=clock(),out=base.apply(this,args);if(clock()>before)show(key);return out});
  if(typeof document==='object'&&!document.getElementById?.('aetherion-v1733-camp-scenes')){let style=document.createElement('style');style.id='aetherion-v1733-camp-scenes';style.textContent='.v1733CampScene{position:relative;overflow:hidden;background:#050505}.v1733CampScene video{display:block;width:100%;max-height:62vh;pointer-events:none;user-select:none}.v1733CampSkip{position:absolute!important;right:8px!important;top:8px!important;z-index:2!important;width:auto!important;min-width:0!important;margin:0!important;padding:6px 9px!important;font-size:12px!important}.v1733CampFallback{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#080808}.v1733CampFallback[hidden]{display:none}';document.head?.appendChild(style)}
 }
 install();
 window.AetherionV1733CampScenes=Object.freeze({version:VERSION,root:ROOT,scenes,runtime,show,play,skip,returnToCamp,install});
})();
