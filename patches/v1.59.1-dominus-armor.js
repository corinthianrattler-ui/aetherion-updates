/* Aetherion Reforged v1.59.1 — Dominus Kingslayer armor skin and equipment pieces. */
'use strict';
(()=>{
 const VERSION='1.59.1';
 const done=new WeakSet(), texCache=new WeakMap();
 function icon(kind){
  const common='<rect width="256" height="256" rx="28" fill="#09090a"/><rect x="8" y="8" width="240" height="240" rx="24" fill="none" stroke="#7e5a2a" stroke-width="5"/><g fill="#15171a" stroke="#b18a4b" stroke-width="6" stroke-linejoin="round"><path d="M128 28L146 45 176 58 190 93 181 130 162 155 128 168 94 155 75 130 66 93 80 58 110 45Z"/></g><g stroke="#6d101a" stroke-width="9" fill="none"><path d="M128 35V164"/></g>';
  let glyph='';
  if(kind==='head')glyph='<g fill="#111318" stroke="#c19a58" stroke-width="7"><path d="M83 68L128 37 173 68 167 135 128 161 89 135Z"/><path d="M92 94H164V111H92Z" fill="#030304"/><path d="M104 116H152V143H104Z"/></g>';
  else if(kind==='body')glyph='<g fill="#111318" stroke="#c19a58" stroke-width="7"><path d="M75 62L101 48H155L181 62 171 179 128 205 85 179Z"/><circle cx="128" cy="119" r="35" fill="#4b0b12"/><path d="M128 86l12 20 23 4-17 17 4 23-22-10-22 10 4-23-17-17 23-4z" fill="#861622"/></g>';
  else if(kind==='shoulders')glyph='<g fill="#111318" stroke="#c19a58" stroke-width="7"><path d="M39 104Q58 62 103 68L111 126Q74 142 44 128Z"/><path d="M217 104Q198 62 153 68L145 126Q182 142 212 128Z"/><circle cx="72" cy="99" r="19" fill="#5d0d16"/><circle cx="184" cy="99" r="19" fill="#5d0d16"/></g>';
  else if(kind==='hands')glyph='<g fill="#111318" stroke="#c19a58" stroke-width="6"><path d="M66 77h48l-6 94-27 25-21-34z"/><path d="M142 77h48l6 85-21 34-27-25z"/><path d="M76 101h31M149 101h31" stroke="#78131d"/></g>';
  else if(kind==='waist')glyph='<g fill="#111318" stroke="#c19a58" stroke-width="7"><path d="M47 97H209V127H47Z"/><rect x="109" y="88" width="38" height="48" rx="5"/><path d="M85 127L112 127 104 193 78 172Z" fill="#4f0c14"/><path d="M144 127L171 127 178 172 152 193Z" fill="#4f0c14"/></g>';
  else if(kind==='legs')glyph='<g fill="#111318" stroke="#c19a58" stroke-width="7"><path d="M70 63H119L111 121 103 205H67L75 121Z"/><path d="M137 63H186L181 121 189 205H153L145 121Z"/><path d="M69 126H111M145 126H187" stroke="#7d111c"/></g>';
  else if(kind==='feet')glyph='<g fill="#111318" stroke="#c19a58" stroke-width="7"><path d="M63 82H112L108 165 84 192 39 184 67 153Z"/><path d="M144 82H193L189 153 217 184 172 192 148 165Z"/><path d="M63 119H110M146 119H193" stroke="#7d111c"/></g>';
  const rose='<g transform="translate(128 211)"><circle r="20" fill="#35080d" stroke="#b18a4b" stroke-width="4"/><path d="M0-14C15-22 24-6 13 4C26 10 15 27 1 15C-8 28-25 17-14 4C-27-5-15-23 0-14Z" fill="#7c1320" stroke="#a77e40" stroke-width="3"/></g>';
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">'+common+glyph+rose+'</svg>');
 }
 const art={head:icon('head'),body:icon('body'),shoulders:icon('shoulders'),hands:icon('hands'),waist:icon('waist'),legs:icon('legs'),feet:icon('feet')};
 function setItem(id,kind,name){try{let d=(typeof ITEMS!=='undefined')&&ITEMS[id];if(!d)return;d.img=art[kind];if(name)d.name=name;d.desc=(d.desc||'')+' Dominus blackened-steel issue with crimson rose heraldry and antique-gold trim.'}catch(_){}}
 function installArt(){
  [['v98_royal_m_head','head','Dominus Rose Helm'],['v98_royal_m_body','body','Dominus Rose Cuirass'],['v98_royal_m_shoulders','shoulders','Dominus Rose Pauldrons'],['v98_royal_m_hands','hands','Dominus Rose Gauntlets'],['v98_royal_m_waist','waist','Dominus Rose War Belt'],['v98_royal_m_legs','legs','Dominus Rose Leg Harness'],['v98_royal_m_feet','feet','Dominus Rose Sabatons'],['dominus_lord_helm','head','Dominus Lord Helm'],['dominus_cuirass','body','Dominus Cuirass'],['dominus_pauldrons','shoulders','Dominus Pauldrons'],['dominus_gauntlets','hands','Dominus Gauntlets'],['dominus_belt','waist','Dominus War Belt'],['dominus_legplates','legs','Dominus Leg Harness'],['dominus_boots','feet','Dominus Sabatons']].forEach(x=>setItem(...x));
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
 function apply(viewer){let model=viewer?.model;if(!model||done.has(model))return viewer;done.add(model);try{model.traverse?.(mesh=>{if(!mesh?.isMesh)return;mesh.material=Array.isArray(mesh.material)?mesh.material.map(styleMaterial):styleMaterial(mesh.material)});viewer.render?.()}catch(e){console.warn('[Aetherion Dominus skin]',e)}return viewer}
 installArt();
 try{if(typeof v98Sync==='function'){let base=v98Sync;v98Sync=async function(){let v=await base();return apply(v)};try{v80Sync=v98Sync}catch(_){}}}catch(e){console.warn('[Aetherion Dominus hook]',e)}
 setTimeout(()=>{try{installArt();if(typeof V98_PLAYER!=='undefined'&&V98_PLAYER?.viewer)apply(V98_PLAYER.viewer);else if(typeof v98Schedule==='function')v98Schedule();if(typeof render==='function')render()}catch(_){}},80);
 try{window.AetherionDominusArmor=Object.freeze({version:VERSION,apply})}catch(_){ }
})();
