'use strict';

(() => {
  const VERSION = '1.74.1';
  const ASSET_PATH = 'custom/ui/dominus-time/dominus-blood-dial-base.webp';
  const STYLE_ID = 'aetherion-v1741-dominus-blood-dial';
  const runtime = { installs: 0, replacements: 0, lastTime: null };

  if (window.AetherionDominusDial?.version === VERSION) return;

  const esc = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

  function system() {
    return window.AetherionV1736Time || null;
  }

  function celestial() {
    const live = system()?.celestial?.();
    if (live) return live;
    const hour = ((Number(window.S?.world?.hour) || 0) % 24 + 24) % 24;
    const orbit = (hour - 18) * Math.PI / 12;
    return {
      hour,
      time: `${String(Math.floor(hour)).padStart(2, '0')}:00`,
      day: hour >= 6 && hour < 18,
      dawn: 6,
      dusk: 18,
      season: 'Summer',
      moon: { index: 0, name: 'New Blood Moon', illumination: 0 },
      sun: { x: 50 + 33 * Math.cos(orbit), y: 50 + 28 * Math.sin(orbit) },
      blood: { x: 50 - 33 * Math.cos(orbit), y: 50 - 28 * Math.sin(orbit) },
      awake: 0,
    };
  }

  function assetUrl() {
    return window.AetherionUpdater?.asset?.(ASSET_PATH) || ASSET_PATH;
  }

  function clockTime(value) {
    const total = Math.round((((Number(value) || 0) % 24 + 24) % 24) * 60) % 1440;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  function dialMarkup(interactive = true) {
    const sky = celestial();
    const phase = Math.max(0, Math.min(7, Math.round(Number(sky.moon?.index) || 0)));
    const sunX = 50 + (Number(sky.sun?.x ?? 50) - 50) * 0.82;
    const sunY = 50 + (Number(sky.sun?.y ?? 50) - 50) * 0.78;
    const moonX = 50 + (Number(sky.blood?.x ?? 50) - 50) * 0.82;
    const moonY = 50 + (Number(sky.blood?.y ?? 50) - 50) * 0.78;
    const angle = (Number(sky.hour) || 0) * 15 - 180;
    const label = `${sky.time}. ${sky.day ? 'Daylight' : 'Night'}. ${sky.moon?.name || 'Blood moon'}, ${Math.round(Number(sky.moon?.illumination) || 0)}% illuminated.`;
    const tag = interactive ? 'button' : 'div';
    const attrs = interactive
      ? `type="button" onclick="AetherionDominusDial.open()" aria-label="${esc(label)}" title="${esc(label)}"`
      : `role="img" aria-label="${esc(label)}"`;
    runtime.lastTime = sky.time;
    const modalClass = interactive ? '' : ' aethTimeModalDial';
    return `<${tag} class="aethSkyClock dominusBloodDial${modalClass} ${sky.day ? 'day' : 'night'}" ${attrs} style="--dominus-hand:${angle.toFixed(2)}deg;--dominus-sun-x:${sunX.toFixed(2)}%;--dominus-sun-y:${sunY.toFixed(2)}%;--dominus-moon-x:${moonX.toFixed(2)}%;--dominus-moon-y:${moonY.toFixed(2)}%;--dominus-sun-opacity:${sunY > 50 ? '.22' : '1'};--dominus-moon-opacity:${moonY > 50 ? '.22' : '1'}"><img class="dominusDialBase" src="${esc(assetUrl())}" alt=""><span class="dominusDialSun" aria-hidden="true"></span><span class="dominusDialMoon phase${phase}" aria-hidden="true"></span><span class="dominusDialHand" aria-hidden="true"></span><span class="dominusDialPin" aria-hidden="true"></span><span class="dominusDialTime">${esc(sky.time)}</span></${tag}>`;
  }

  function open() {
    const sky = celestial();
    const date = typeof window.lwDateLabel === 'function'
      ? window.lwDateLabel()
      : `Exile Day ${Math.floor(Number(window.S?.world?.day) || 0)}`;
    const visibility = Number(sky.moon?.illumination) >= 70
      ? 'Bright'
      : Number(sky.moon?.illumination) >= 35 ? 'Broken' : 'Dark';
    if (typeof window.openModal !== 'function') return false;
    window.openModal(`<div class="modalHeader"><div><h2>Aetherion Sky Dial</h2><div class="muted">${esc(date)}</div></div><button onclick="closeModal()">✕</button></div><div class="aethTimeModal dominusTimeModal">${dialMarkup(false)}<div class="kv"><div>Current time</div><div>${esc(sky.time)}</div><div>Sunrise</div><div>${clockTime(sky.dawn)}</div><div>Sunset</div><div>${clockTime(sky.dusk)}</div><div>Moon</div><div>${esc(sky.moon?.name || 'Blood moon')} · ${Math.round(Number(sky.moon?.illumination) || 0)}%</div><div>Night visibility</div><div>${visibility}</div><div>Awake</div><div>${Math.round(Number(sky.awake) || 0)} hours</div><div>Energy</div><div>${Math.round(Number(window.S?.player?.energy) || 0)}%</div></div></div><p class="muted">Waiting passes hunger, thirst, fatigue, schedules and world events. It does not count as sleep.</p><div class="modalActions"><button onclick="AetherionV1736Time.wait(1)">WAIT 1 HOUR</button><button onclick="AetherionV1736Time.wait(3)">WAIT 3 HOURS</button><button onclick="AetherionV1736Time.waitTo('dusk')">WAIT UNTIL DUSK</button><button onclick="AetherionV1736Time.waitTo('dawn')">WAIT UNTIL DAWN</button><button class="primary" onclick="AetherionV1736Time.sleepToDawn()">SLEEP UNTIL DAWN</button></div>`);
    return true;
  }

  function replaceClock(markup) {
    const source = String(markup ?? '');
    if (!source.includes('aethSkyClock')) return source;
    const next = source.replace(/<button class="aethSkyClock\b[\s\S]*?<\/button>/, dialMarkup(true));
    if (next !== source) runtime.replacements++;
    return next;
  }

  function installShell() {
    const prior = window.mainShell;
    if (typeof prior !== 'function') return false;
    if (prior.__aetherionDominusDial === VERSION) return true;
    const wrapped = function (...args) {
      return replaceClock(prior.apply(this, args));
    };
    wrapped.__aetherionDominusDial = VERSION;
    window.mainShell = wrapped;
    runtime.installs++;
    return true;
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .aethTimeHeader>.aethSkyClock.dominusBloodDial{position:relative!important;isolation:isolate;overflow:visible!important;display:block!important;flex:0 0 88px!important;width:88px!important;height:88px!important;margin:1px 0 1px auto!important;padding:0!important;border:0!important;border-radius:50%!important;background:#000!important;box-shadow:none!important;filter:drop-shadow(0 3px 5px #000);-webkit-tap-highlight-color:transparent}
      .dominusBloodDial>*{pointer-events:none}
      .dominusDialBase{position:absolute;z-index:1;inset:0;width:100%;height:100%;display:block;object-fit:contain}
      .dominusDialSun,.dominusDialMoon{position:absolute;z-index:3;left:var(--dominus-sun-x);top:var(--dominus-sun-y);width:10%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;opacity:var(--dominus-sun-opacity);transition:left .25s linear,top .25s linear,opacity .25s linear}
      .dominusDialSun{background:radial-gradient(circle at 38% 35%,#fff0a4 0 14%,#e3ad3e 28% 62%,#8c4e12 76%);border:1px solid #f3d57d;box-shadow:0 0 4px #e6ad42}
      .dominusDialSun:before,.dominusDialSun:after{content:"";position:absolute;left:50%;top:50%;width:150%;height:1px;background:#dfb65f;transform:translate(-50%,-50%);box-shadow:0 0 2px #000}
      .dominusDialSun:after{transform:translate(-50%,-50%) rotate(90deg)}
      .dominusDialMoon{left:var(--dominus-moon-x);top:var(--dominus-moon-y);opacity:var(--dominus-moon-opacity);background:radial-gradient(circle at 38% 34%,#ff7182,#971d36 58%,#370913 100%);border:1px solid #e4bd68;box-shadow:0 0 4px #8d1833}
      .dominusDialMoon:after{content:"";position:absolute;inset:-3%;border-radius:50%;background:#100a0e;transform:translateX(0)}
      .dominusDialMoon.phase0:after{inset:8%;background:#0b080b}
      .dominusDialMoon.phase1:after{transform:translateX(-28%)}
      .dominusDialMoon.phase2:after{transform:translateX(-52%);border-radius:0 50% 50% 0}
      .dominusDialMoon.phase3:after{transform:translateX(-78%)}
      .dominusDialMoon.phase4:after{display:none}
      .dominusDialMoon.phase5:after{transform:translateX(78%)}
      .dominusDialMoon.phase6:after{transform:translateX(52%);border-radius:50% 0 0 50%}
      .dominusDialMoon.phase7:after{transform:translateX(28%)}
      .dominusDialHand{position:absolute;z-index:4;left:50%;top:50%;width:1.7%;height:27%;transform:translate(-50%,-100%) rotate(var(--dominus-hand));transform-origin:50% 100%;border-radius:999px;background:linear-gradient(90deg,#6c3912,#ffe18d 46% 58%,#724015);box-shadow:0 0 1px #000}
      .dominusDialHand:before{content:"";position:absolute;left:50%;top:-13%;width:310%;aspect-ratio:1;transform:translateX(-50%) rotate(45deg);background:linear-gradient(135deg,#ff5b71,#690817 62%);border:1px solid #e0b95f}
      .dominusDialPin{position:absolute;z-index:5;left:50%;top:50%;width:6.5%;aspect-ratio:1;transform:translate(-50%,-50%) rotate(45deg);border:1px solid #e5c46c;background:radial-gradient(circle,#d72944,#510713 68%);box-shadow:0 0 3px #000}
      .dominusDialTime{position:absolute;z-index:6;left:50%;top:76.3%;width:34%;transform:translate(-50%,-50%);color:#f6dfaa;font:700 8px/1 Georgia,serif;text-align:center;letter-spacing:.03em;text-shadow:0 1px 2px #000;font-variant-numeric:tabular-nums}
      .aethTimeModalDial.dominusBloodDial{position:relative!important;isolation:isolate;overflow:visible!important;display:block!important;width:190px!important;height:190px!important;margin:auto!important;padding:0!important;border:0!important;border-radius:50%!important;background:#000!important;box-shadow:none!important;filter:drop-shadow(0 7px 10px #000)}
      .aethTimeModalDial.dominusBloodDial .dominusDialTime{font-size:17px}
      .dominusTimeModal{grid-template-columns:minmax(170px,210px) 1fr}
      @media(max-width:420px){.aethTimeHeader>.aethSkyClock.dominusBloodDial{flex-basis:80px!important;width:80px!important;height:80px!important}.aethTimeModalDial.dominusBloodDial{width:165px!important;height:165px!important}.aethTimeModalDial.dominusBloodDial .dominusDialTime{font-size:14px}.dominusTimeModal{grid-template-columns:1fr}}
      @media(prefers-reduced-motion:reduce){.dominusDialSun,.dominusDialMoon{transition:none}}
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function refresh() {
    const current = document.querySelector?.('.aethTimeHeader>.aethSkyClock');
    if (current && !current.classList.contains('dominusBloodDial')) {
      current.outerHTML = dialMarkup(true);
      runtime.replacements++;
    }
  }

  window.AetherionDominusDial = Object.freeze({
    version: VERSION,
    assetPath: ASSET_PATH,
    celestial,
    markup: dialMarkup,
    open,
    refresh,
    runtime,
  });

  installStyle();
  installShell();
  refresh();
  if (typeof window.render === 'function') {
    try { window.render(); } catch (error) { console.warn('[Aetherion 1.74.1 dial refresh]', error); }
  }
})();
