'use strict';

(() => {
  const VERSION = '1.74.4';
  const STYLE_ID = 'aetherion-v1744-hud-quartermaster-hotfix';
  const SPECIAL_PATH = 'custom/npc-portraits/v168/00_quartermaster_original_unchanged.webp';
  const TARGET = 'edwyn rook';
  const runtime = { stateRepairs: 0, domRepairs: 0, scans: 0 };

  if (window.AetherionV1744Hotfix?.version === VERSION) return;

  const norm = value => String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const isEdwyn = person => {
    const name = norm(person?.name || person?.displayName || person?.fullName);
    return name === TARGET || name === `quartermaster ${TARGET}` || name.endsWith(` ${TARGET}`);
  };

  const assetUrl = () => {
    try { return window.AetherionUpdater?.asset?.(SPECIAL_PATH) || SPECIAL_PATH; }
    catch (_) { return SPECIAL_PATH; }
  };

  function installStyle() {
    if (typeof document !== 'object') return;
    if (/Android/i.test(navigator?.userAgent || '')) {
      document.documentElement.classList.add('aetherion-android-safearea');
    }
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      html.aetherion-android-safearea .aethTimeHeader{
        box-sizing:border-box!important;
        padding-top:24px!important;
        padding-top:max(env(safe-area-inset-top, 0px), 24px)!important;
      }
      .aethTimeHeader>.aethSkyClock.dominusBloodDial{
        position:absolute!important;
        right:10px!important;
        top:54px!important;
        margin:0!important;
      }
      @media(max-width:420px){
        .aethTimeHeader>.aethSkyClock.dominusBloodDial{
          right:7px!important;
          top:55px!important;
          width:80px!important;
          height:80px!important;
          flex-basis:80px!important;
        }
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function forcePortrait(person) {
    if (!person || typeof person !== 'object' || !isEdwyn(person)) return false;
    let changed = false;
    for (const key of ['portrait', 'img', 'image', 'portraitPath']) {
      if (key !== 'portrait' && !(key in person)) continue;
      try {
        if (person[key] !== SPECIAL_PATH) {
          person[key] = SPECIAL_PATH;
          changed = true;
        }
      } catch (_) {}
    }
    if (changed) runtime.stateRepairs++;
    return changed;
  }

  function repairLiveState() {
    const root = window.S;
    if (!root || typeof root !== 'object') return 0;
    runtime.scans++;
    let repaired = 0;
    let visitedCount = 0;
    const seen = new WeakSet();
    const stack = [root];
    while (stack.length && visitedCount < 75000) {
      const value = stack.pop();
      if (!value || typeof value !== 'object' || seen.has(value)) continue;
      seen.add(value);
      visitedCount++;
      if (forcePortrait(value)) repaired++;
      if (Array.isArray(value)) {
        for (let i = value.length - 1; i >= 0; i--) {
          const child = value[i];
          if (child && typeof child === 'object') stack.push(child);
        }
      } else {
        for (const child of Object.values(value)) {
          if (child && typeof child === 'object') stack.push(child);
        }
      }
    }
    if (repaired && typeof window.persist === 'function') {
      try { window.persist(false); } catch (_) {}
    }
    return repaired;
  }

  function installPortraitCoreOverride() {
    const base = window.AetherionPortraitCore;
    if (!base || base.__v1744Edwyn) return false;
    const specialRow = Object.freeze({
      path: SPECIAL_PATH,
      role: 'Field Quartermaster',
      occupation: 'Field Quartermaster',
      label: 'Quartermaster Edwyn Rook',
      gender: 'M',
      fullBody: false,
    });
    const wrapped = Object.freeze({
      ...base,
      __v1744Edwyn: true,
      needsReplacement(value) {
        const raw = String(value ?? '').split(/[?#]/)[0].replace(/^\.\//, '');
        if (raw === SPECIAL_PATH) return false;
        return typeof base.needsReplacement === 'function' ? base.needsReplacement(value) : false;
      },
      select(person, context) {
        if (isEdwyn(person)) return specialRow;
        return typeof base.select === 'function' ? base.select(person, context) : null;
      },
      selectForRole(role, context) {
        if (norm(role).includes('edwyn rook')) return specialRow;
        return typeof base.selectForRole === 'function' ? base.selectForRole(role, context) : null;
      },
      displayPath(value, ...args) {
        const raw = String(value ?? '').split(/[?#]/)[0].replace(/^\.\//, '');
        if (raw === SPECIAL_PATH) return assetUrl();
        return typeof base.displayPath === 'function' ? base.displayPath(value, ...args) : value;
      },
      repairOne(person, context) {
        if (isEdwyn(person)) {
          forcePortrait(person);
          return person;
        }
        return typeof base.repairOne === 'function' ? base.repairOne(person, context) : person;
      },
    });
    window.AetherionPortraitCore = wrapped;
    window.AetherionV1742FullBodyIntegrity = wrapped;
    return true;
  }

  function repairRenderedPortraits() {
    if (typeof document !== 'object') return 0;
    const url = assetUrl();
    let repaired = 0;
    for (const img of document.querySelectorAll('img')) {
      let node = img;
      let matched = false;
      for (let depth = 0; depth < 6 && node?.parentElement; depth++) {
        node = node.parentElement;
        const text = norm(node.textContent);
        if (text.length > 700) continue;
        if (text.includes(TARGET)) {
          matched = true;
          break;
        }
      }
      if (!matched) continue;
      try {
        if (img.src !== url) {
          img.removeAttribute('srcset');
          img.src = url;
          repaired++;
        }
      } catch (_) {}
    }
    runtime.domRepairs += repaired;
    return repaired;
  }

  let scheduled = false;
  function scheduleRepair() {
    if (scheduled) return;
    scheduled = true;
    const run = () => {
      scheduled = false;
      installStyle();
      installPortraitCoreOverride();
      repairLiveState();
      repairRenderedPortraits();
    };
    (window.requestAnimationFrame || (fn => setTimeout(fn, 0)))(run);
  }

  function installObserver() {
    if (typeof MutationObserver !== 'function' || !document?.documentElement) return;
    const observer = new MutationObserver(scheduleRepair);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.AetherionV1744Hotfix = Object.freeze({
    version: VERSION,
    specialPortrait: SPECIAL_PATH,
    repair: scheduleRepair,
    runtime,
  });

  installStyle();
  installPortraitCoreOverride();
  repairLiveState();
  repairRenderedPortraits();
  installObserver();
  document?.addEventListener?.('aetherion:update-ready', scheduleRepair);
  setTimeout(scheduleRepair, 50);
})();
