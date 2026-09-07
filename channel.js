/* Aetherion Reforged safe update channel. This file carries verified staged patch source. */
(()=>{
 const feed={
  schema:2,
  channel:'stable',
  release:{
   version:'1.69.0',
   build:185,
   minimumBundled:'1.69.0',
   releasedAt:'2026-09-07T00:00:00Z',
   notes:[
    'Adds an in-game Game Updates screen on both the opening screen and Systems dock.',
    'Stages and verifies complete patch source before activation; checking never changes the running game.',
    'Automatically rolls back an update that cannot finish starting.',
    'Adds Safe Start once and a permanent return-to-built-in-version control without deleting game saves.'
   ],
   modules:[],
   assets:{}
  }
 };
 window.AetherionUpdater?.receiveChannel?.(feed);
})();
