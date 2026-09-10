/* Aetherion Reforged v1.73.8 — resilient full-body portraits and save repair. */
'use strict';
(()=>{
 const V='1.73.8',L=window.AetherionV173LivingPortraits,K=window.AetherionV1731KnightDiversity;
 if(window.AetherionV1738PortraitResilience?.version===V)return;
 if(!L?.registry?.length||!K?.registry?.length)return console.warn('[Aetherion 1.73.8] portrait systems unavailable');
 const CDN='https://cdn.jsdelivr.net/gh/corinthianrattler-ui/aetherion-updates@main/',RAW='https://raw.githubusercontent.com/corinthianrattler-ui/aetherion-updates/main/';
 const text=v=>String(v??'').trim(),pic=p=>text(p?.portrait||p?.img),head=p=>!p||/assets\/(?:dynasty|units|workers|v34\/people)\/|assets\/bannerless_[a-z_]+\.jpg$/i.test(p);
 function state(){try{return typeof S==='undefined'?null:S}catch(_){return null}}
 function rel(v){let s=text(v);try{s=decodeURIComponent(s)}catch(_){}let m=s.match(/custom\/npc-portraits\/(v1731?)\/([^?#"']+\.webp)/i);return m&&`custom/npc-portraits/${m[1]}/${m[2]}`}
 function show(v){let r=rel(v);return r?CDN+encodeURIComponent(r):v}
 function html(v){return typeof v==='string'?v.replace(/(?:https:\/\/raw\.githubusercontent\.com\/corinthianrattler-ui\/aetherion-updates\/main\/)?custom\/npc-portraits\/(v1731?)\/([a-z0-9_.-]+\.webp)/gi,(_,v,f)=>show(`custom/npc-portraits/${v}/${f}`)):v}
 function rows(s){let out=[],seen=new WeakSet(),add=(a,c={})=>{for(const p of a||[])if(p&&typeof p==='object'&&!seen.has(p))seen.add(p),out.push([p,c])};add(s?.people);add(s?.court?.prisoners,{prisoner:true});for(const[l,a]of Object.entries(s?.world?.permanentNPCs||{}))add(a,{location:l});for(const[l,a]of Object.entries(s?.world?.laborMarkets||{}))add(a,{location:l});for(const[l,t]of Object.entries(s?.v15?.settlements||{}))add(t?.roster,{location:l});for(const[l,t]of Object.entries(s?.v17?.settlements||{}))add(t?.bonded,{location:l,bonded:true});add(s?.v23?.surgeons);add(s?.v28?.laborPool);add(s?.v61?.agents);add(Object.values(s?.v61?.people||{}));return out}
 function one(p,c={}){let before=pic(p),row=K.registry.find(r=>r.path===before);if(K.serviceKnight?.(p)){if(!row||!K.compatible?.(p,row))K.assignOne(p)}else if(head(before)&&L.select?.(p,c))L.repairPerson?.(p,c);return pic(p)!==before}
 function repair(s=state()){if(!s?.world)return s;s.meta??={};if(s.meta.v1738PortraitResilience?.version===V)return s;let list=rows(s),before=list.map(([p])=>pic(p));K.balance?.(s.people||[]);for(const[p,c]of list)one(p,c);s.meta.v1738PortraitResilience={version:V,repaired:list.reduce((n,[p],i)=>n+(pic(p)!==before[i]),0),headFallback:false,contentRemoved:0,savePreserved:true};return s}
 function wrap(name,fn){let base=globalThis[name];if(typeof base!=='function'||base.__v1738)return;let next=fn(base);next.__v1738=V;globalThis[name]=next}
 wrap('entityImage',base=>function(src,...a){return html(base.call(this,show(src),...a))});
 wrap('openModal',base=>function(markup,...a){return base.call(this,html(markup),...a)});
 wrap('peopleCards',base=>function(list,...a){for(const p of list||[])one(p);return html(base.call(this,list,...a))});
 wrap('v55WorkerCard',base=>function(...a){return html(base.apply(this,a))});
 wrap('makeStartState',base=>function(...a){return repair(base.apply(this,a))});
 wrap('migrateState',base=>function(s,...a){return repair(base.call(this,s,...a))});
 if(typeof document?.addEventListener==='function')document.addEventListener('error',e=>{let n=e.target,src=n?.getAttribute?.('src')||n?.src||'';if(String(n?.tagName).toUpperCase()!=='IMG'||!/%2fnpc-portraits%2fv1731?%2f/i.test(src))return;e.preventDefault?.();e.stopImmediatePropagation?.();let r=rel(src),retry=+(n.dataset?.v1738Retry||0);if(r&&!retry){n.dataset.v1738Retry='1';n.src=RAW+encodeURIComponent(r)}else{n.dataset.v1738Retry='2';n.onerror=null;n.src=ASSET.rose}},true);
 if(typeof document==='object'&&!document.getElementById?.('aetherion-v1738-portraits')){let s=document.createElement('style');s.id='aetherion-v1738-portraits';s.textContent='.aethTimeHeader>.aethSkyClock{top:160px!important}img[src*="custom%2Fnpc-portraits%2Fv173"]{object-fit:contain!important;object-position:center!important;background:#080608}.entityList>.entity img[src*="custom%2Fnpc-portraits%2Fv173"]{width:76px!important;height:114px!important}';(document.head||document.documentElement)?.appendChild(s)}
 try{let s=state();if(s?.world&&s.meta?.v1738PortraitResilience?.version!==V){repair(s);if(typeof persist==='function')persist(false)}}catch(e){console.warn('[Aetherion 1.73.8 portrait migration]',e)}
 window.AetherionV1738PortraitResilience=Object.freeze({version:V,display:show,repairState:repair});
})();
