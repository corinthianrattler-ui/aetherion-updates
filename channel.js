/* Aetherion Reforged safe update channel. This file carries verified staged patch source. */
(()=>{
 const feed={
  schema:2,
  channel:'stable',
  release:{
   version:'1.69.2',
   build:186,
   minimumBundled:'1.69.2',
   releasedAt:'2026-09-07T10:29:43Z',
   notes:[
    'Android can reach the stable update channel through a MIME-safe GitHub response.',
    'The opening menu and Game Updates control are bundled and remain reachable with an autosave.',
    'Existing saves, timelines, and staged-update rollback protections remain unchanged.'
   ],
   modules:[],
   assets:{}
  }
 };
 window.AetherionUpdater?.receiveChannel?.(feed);
})();
