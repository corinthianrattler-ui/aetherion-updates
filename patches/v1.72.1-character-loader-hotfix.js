/* Aetherion Reforged v1.72.1 — connect the supplied models to the live v80 wardrobe. */
'use strict';
(()=>{
 const VERSION='1.72.1';
 const runtime={connected:false,lastError:null};
 if(window.AetherionCharacterLoaderHotfixV1721?.version===VERSION)return;

 function connect(){
  const models=window.AetherionCharacterModelsV172;
  if(typeof models?.sync!=='function'||typeof models?.schedule!=='function'){
   runtime.lastError='The v1.72 character model controller is unavailable.';return false;
  }
  let live=false;
  try{
   // v80 is the viewer present in the shipped APK. Older v97/v98 globals are
   // optional; their absence must not prevent v80 from receiving the loader.
   if(typeof v80Sync==='function'){v80Sync=models.sync;live=true}
   if(typeof v80ScheduleSync==='function'){v80ScheduleSync=models.schedule;live=true}
   if(typeof v97Sync==='function')v97Sync=models.sync;
   if(typeof v98Sync==='function')v98Sync=models.sync;
   if(typeof v98PlayerKind==='function')v98PlayerKind=models.playerKind;
   runtime.connected=live;runtime.lastError=live?null:'The live v80 wardrobe hook was not found.';
   if(live)models.schedule();
  }catch(error){runtime.lastError=String(error?.message||error);runtime.connected=false}
  return runtime.connected;
 }

 window.AetherionCharacterLoaderHotfixV1721=Object.freeze({
  version:VERSION,connect,state:()=>({...runtime})
 });
 if(!connect())setTimeout(connect,0);
})();
