/* Aetherion Reforged safe update channel. This file carries verified staged patch source. */
(()=>{
 const feed={
  schema:2,
  channel:'stable',
  release:{
   version:'1.70.0',
   build:187,
   minimumBundled:'1.70.0',
   releasedAt:'2026-09-07T12:09:14Z',
   notes:[
    'The finished 40-piece assembled Valkorion kit replaces the old simplified and exploded model files.',
    'Jousting, armored dueling, and archery are playable at the Corvinus Keep Tournament Grounds with their approved heraldic scenes.',
    'Game Updates remains on the opening screen and in the live Systems dock. Existing saves and rollback protections remain unchanged.'
   ],
   modules:[],
   assets:{}
  }
 };
 window.AetherionUpdater?.receiveChannel?.(feed);
})();
