'use strict';
(()=>{
 const VERSION='1.73.4',ROOT='https://raw.githubusercontent.com/corinthianrattler-ui/aetherion-updates/main/custom/camp-scenes/v1732/';
 if(window.AetherionV1734CampScenes?.version===VERSION)return;
 const scenes=Object.freeze({make:'make-camp.mp4',strike:'strike-camp.mp4',food:'camp-food.mp4',sleep:'camp-sleep.mp4'}),runtime={active:null,plays:{make:0,strike:0,food:0,sleep:0},errors:0,skips:0};
 const camp=()=>S?.v24?.camp,clock=()=>typeof v14Now==='function'?v14Now():((+S?.world?.day||0)*24+(+S?.world?.hour||0)),hasPost=()=>!!camp()?.placements?.some(p=>p?.kind==='watch');
 function back(){let active=runtime.active,video=document.getElementById?.('v1734CampVideo');runtime.active=null;try{video?.pause?.();video?.removeAttribute?.('src');video?.load?.()}catch(_){ }if(!active)return;if(typeof closeModal==='function')closeModal();if(typeof v24OpenCamp==='function')v24OpenCamp()}
 function skip(){if(runtime.active){runtime.skips++;back()}}
 function play(){let video=document.getElementById?.('v1734CampVideo');if(!video)return;video.controls=false;let go=()=>video.play?.()?.catch?.(()=>{video.muted=true;video.play?.()?.catch?.(()=>{runtime.errors++;back()})});video.addEventListener?.('canplay',go,{once:true});go()}
 function show(key){let file=scenes[key];if(!file||typeof openModal!=='function')return false;runtime.active=key;runtime.plays[key]++;openModal(`<div class="v1734CampScene"><video id="v1734CampVideo" src="${ROOT+file}" poster="${ROOT+file.replace('.mp4','.webp')}" autoplay playsinline webkit-playsinline preload="auto" controlslist="nodownload nofullscreen noremoteplayback" disablepictureinpicture disableremoteplayback></video><button class="v1734CampSkip" onclick="AetherionV1734CampScenes.skip()">SKIP</button></div>`);let video=document.getElementById?.('v1734CampVideo');video?.addEventListener?.('ended',back,{once:true});video?.addEventListener?.('error',()=>{runtime.errors++;back()},{once:true});play();return true}
 function tagged(name,wrap){let base=globalThis[name];if(typeof base!=='function'||base.__v1734===VERSION)return;let next=wrap(base);next.__v1734=VERSION;globalThis[name]=next}
 function block(title,text){return typeof v19Block==='function'?v19Block(title,text):toast(text)}
 function install(){
  tagged('v24CampMap',base=>function(...args){return String(base.apply(this,args)).replace('ESTABLISH / STRIKE CAMP',camp()?.active?'TAKE DOWN CAMP':'MAKE CAMP')});
  tagged('v24EstablishCamp',base=>function(...args){let before=!!camp()?.active,start=clock(),out=base.apply(this,args),after=!!camp()?.active;if(before!==after){if(before&&clock()===start&&typeof advanceHours==='function')advanceHours(1,'camp');if(!after&&typeof persist==='function')persist(false);show(after?'make':'strike')}return out});
  for(const[name,key]of[['v24CookMeal','food'],['v24SleepCamp','sleep']])tagged(name,base=>function(...args){let before=clock(),out=base.apply(this,args);if(clock()>before)show(key);return out});
  tagged('v24AssignWatch',base=>function(...args){let c=camp();if(!c?.active)return block('NO ESTABLISHED CAMP','Establish the camp before assigning its guard watch.');if(!hasPost())return block('NO WATCH POST','Place a Watch Post before assigning guards.');return base.apply(this,args)});
  tagged('v24RemovePlot',base=>function(i,...args){let c=camp();if(c?.placements?.[i]?.kind==='watch'&&c.placements.filter(p=>p?.kind==='watch').length===1)c.watchers=[];return base.call(this,i,...args)});
  let c=camp();if(c?.watchers?.length&&!hasPost())c.watchers=[]
  if(typeof document==='object'&&!document.getElementById?.('aetherion-v1734-camp-scenes')){let style=document.createElement('style');style.id='aetherion-v1734-camp-scenes';style.textContent='.v1734CampScene{position:relative;overflow:hidden}.v1734CampScene video{display:block;width:100%;pointer-events:none}.v1734CampScene video::-webkit-media-controls,.v1734CampScene video::-webkit-media-controls-start-playback-button{display:none!important}.v1734CampSkip{position:absolute!important;right:8px;top:8px;z-index:2;width:auto!important;min-width:0!important;margin:0;padding:6px 9px;font-size:12px}';document.head?.appendChild(style)}
 }
 install();
 window.AetherionV1734CampScenes=Object.freeze({version:VERSION,scenes,runtime,skip});
})();
