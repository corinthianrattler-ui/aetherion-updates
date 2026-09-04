/* Aetherion Reforged v1.59.2 — restore real Dominus equipment art; keep Kingslayer Dominus material pass. */
'use strict';
(()=>{
 const VERSION='1.59.2';
 const done=new WeakSet(), texCache=new WeakMap();
 const ART=Object.freeze({
  head:'assets/items/dominus_lord_helm.webp',
  neck:'assets/items/dominus_gorget.webp',
  underlayer:'assets/items/dominus_arming_doublet.webp',
  body:'assets/items/dominus_cuirass.webp',
  shoulders:'assets/items/dominus_pauldrons.webp',
  hands:'assets/items/dominus_gauntlets.webp',
  waist:'assets/items/dominus_belt.webp',
  legs:'assets/items/dominus_legplates.webp',
  feet:'assets/items/dominus_boots.webp',
  cloak:'assets/items/dominus_cloak.webp',
  main:'assets/items/dominus_sword.webp',
  reserve:'assets/items/dominus_dagger.webp',
  ranged:'assets/items/dominus_bow.webp',
  ammo:'assets/items/dominus_quiver.webp',
  off:'assets/items/dominus_kite_shield.webp',
  jewelry:'assets/items/dominus_signet.webp'
 });
 const LEGACY=Object.freeze({
  dominus_lord_helm:'head',dominus_gorget:'neck',dominus_arming_doublet:'underlayer',dominus_cuirass:'body',
  dominus_pauldrons:'shoulders',dominus_gauntlets:'hands',dominus_belt:'waist',dominus_legplates:'legs',
  dominus_boots:'feet',dominus_cloak:'cloak',dominus_sword:'main',dominus_dagger:'reserve',dominus_bow:'ranged',
  dominus_quiver:'ammo',dominus_kite_shield:'off',dominus_signet:'jewelry'
 });
 const ROYAL=Object.freeze({
  v98_royal_m_head:'head',v98_royal_m_underlayer:'underlayer',v98_royal_m_body:'body',v98_royal_m_shoulders:'shoulders',
  v98_royal_m_hands:'hands',v98_royal_m_waist:'waist',v98_royal_m_legs:'legs',v98_royal_m_feet:'feet',
  v98_royal_m_cloak:'cloak',v98_royal_m_jewelry:'jewelry'
 });
 function repairArt(){
  try{
   if(typeof ITEMS==='undefined')return;
   for(const[id,k]of Object.entries(LEGACY)){let d=ITEMS[id];if(d&&ART[k])d.img=ART[k]}
   for(const[id,k]of Object.entries(ROYAL)){let d=ITEMS[id];if(d&&ART[k])d.img=ART[k]}
   // House Dominus v98 armor cards should also use the actual Dominus armor photos, never concept/placeholder panels.
   if(typeof v98HouseItem==='function')for(const k of ['head','body','shoulders','hands','legs','feet']){let d=ITEMS[v98HouseItem('dominus',k)];if(d&&ART[k])d.img=ART[k]}
  }catch(e){console.warn('[Aetherion 1.59.2 art repair]',e)}
 }
 function recolor(img){
  if(!img||!img.width||!img.height)return null;if(texCache.has(img))return texCache.get(img);
  let c=document.createElement('canvas');c.width=img.width;c.height=img.height;let x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0);let q=x.getImageData(0,0,c.width,c.height),d=q.data;
  for(let i=0;i<d.length;i+=4){let r=d[i],g=d[i+1],b=d[i+2],a=d[i+3];if(a<8)continue;let lum=.2126*r+.7152*g+.0722*b;let red=r>48&&r>g*1.22&&r>b*1.16;let gold=r>62&&g>38&&r>b*1.20&&g>b*1.08&&r>=g*.92&&!red;
   if(red){let v=Math.max(22,Math.min(168,(lum-15)*1.08));d[i]=Math.min(225,v*1.08+34);d[i+1]=Math.min(70,v*.18+7);d[i+2]=Math.min(78,v*.22+9)}
   else if(gold){let v=Math.max(45,Math.min(190,lum*1.08));d[i]=Math.min(240,v*1.12+20);d[i+1]=Math.min(205,v*.79+10);d[i+2]=Math.min(92,v*.29+4)}
   else {let v=Math.max(3,Math.min(110,lum*.64+3));d[i]=v*.80;d[i+1]=v*.83;d[i+2]=v*.91}
  }
  x.putImageData(q,0,0);texCache.set(img,c);return c;
 }
 function styleMaterial(mat){if(!mat)return mat;let m=mat.clone?mat.clone():mat;try{if(m.map?.clone)m.map=m.map.clone();if(m.map?.image){let c=recolor(m.map.image);if(c){m.map.image=c;m.map.needsUpdate=true}}m.color?.setRGB?.(1,1,1);if('metalness'in m)m.metalness=Math.max(.62,+m.metalness||0);if('roughness'in m)m.roughness=.44;m.needsUpdate=true}catch(_){}return m}
 function apply(viewer){let model=viewer?.model;if(!model||done.has(model))return viewer;done.add(model);try{model.traverse?.(mesh=>{if(!mesh?.isMesh)return;mesh.material=Array.isArray(mesh.material)?mesh.material.map(styleMaterial):styleMaterial(mesh.material)});viewer.render?.()}catch(e){console.warn('[Aetherion 1.59.2 Dominus skin]',e)}return viewer}
 repairArt();
 try{if(typeof v98Sync==='function'){let base=v98Sync;v98Sync=async function(){let v=await base();repairArt();return apply(v)};try{v80Sync=v98Sync}catch(_){}}}catch(e){console.warn('[Aetherion 1.59.2 hook]',e)}
 setTimeout(()=>{try{repairArt();if(typeof V98_PLAYER!=='undefined'&&V98_PLAYER?.viewer)apply(V98_PLAYER.viewer);else if(typeof v98Schedule==='function')v98Schedule();if(typeof render==='function')render()}catch(_){}},80);
 try{window.AetherionDominusArmor=Object.freeze({version:VERSION,apply,repairArt})}catch(_){ }
})();
