/* Aetherion Reforged v1.74.8 — checksum-safe Edwyn portrait repair + approved House Dominus dial placement. */
'use strict';
(() => {
  const VERSION = '1.74.8';
  const STYLE_ID = 'aetherion-v1748-portrait-dial-repair';
  const SPECIAL_PATH = 'custom/npc-portraits/v1746/quartermaster-edwyn-rook-dominus.webp';
  const OLD_PATH = 'custom/npc-portraits/v168/00_quartermaster_original_unchanged.webp';
  const EDWYN_ID = 'v34_field_quartermaster_corvinus';
  const EDWYN_NAMES = new Set(['edwyn rook', 'quartermaster edwyn rook']);
  const KEYS = ['portrait', 'img', 'image', 'portraitPath'];
  const runtime = { scans: 0, edwynRepairs: 0, leakRepairs: 0, coreWrapped: false };

  if (window.AetherionV1748PortraitDial?.version === VERSION) return;

  const text = v => String(v ?? '').trim();
  const norm = v => text(v).toLowerCase().normalize('NFKD').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  const localPath = v => text(v).split(/[?#]/)[0].replace(/^\.\//, '').replace(/^assets\/game\//, '');
  const isSpecialPath = v => [SPECIAL_PATH, OLD_PATH].includes(localPath(v));

  function isEdwyn(person) {
    if (!person || typeof person !== 'object') return false;
    if (text(person.id) === EDWYN_ID) return true;
    return EDWYN_NAMES.has(norm(person.name || person.displayName || person.fullName));
  }

  function assetUrl(path = SPECIAL_PATH) {
    try { return window.AetherionUpdater?.asset?.(path) || path; } catch (_) { return path; }
  }

  function installStyle() {
    if (typeof document !== 'object') return;
    if (/Android/i.test(navigator?.userAgent || '')) document.documentElement.classList.add('aetherion-android-safearea');
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(style);
    }
    style.textContent = `
      html.aetherion-android-safearea .aethTimeHeader{
        box-sizing:border-box!important;
        padding-top:24px!important;
        padding-top:max(env(safe-area-inset-top,0px),24px)!important;
      }
      .aethTimeHeader>.aethSkyClock.dominusBloodDial{
        position:absolute!important;
        right:10px!important;
        top:132px!important;
        margin:0!important;
        z-index:8!important;
      }
      @media(max-width:420px){
        .aethTimeHeader>.aethSkyClock.dominusBloodDial{
          right:7px!important;
          top:154px!important;
          width:80px!important;
          height:80px!important;
          flex-basis:80px!important;
        }
      }
      img[data-aetherion-edwyn-rook="1"]{
        object-fit:contain!important;
        object-position:center center!important;
        background:#070507!important;
      }
    `;
  }

  const originalCore = window.AetherionPortraitCore || null;

  function fallbackPortrait(person) {
    const core = originalCore;
    if (!core || typeof core.select !== 'function') return null;
    try {
      const row = core.select(person, { reason: 'v1748-edwyn-leak-repair' });
      const path = localPath(row?.path || row?.portrait || '');
      return path && !isSpecialPath(path) ? path : null;
    } catch (_) { return null; }
  }

  function setEdwyn(person) {
    if (!isEdwyn(person)) return false;
    let changed = false;
    for (const key of KEYS) {
      if (key !== 'portrait' && !(key in person)) continue;
      try {
        if (person[key] !== SPECIAL_PATH) {
          person[key] = SPECIAL_PATH;
          changed = true;
        }
      } catch (_) {}
    }
    if (changed) runtime.edwynRepairs++;
    return changed;
  }

  function clearLeak(person) {
    if (!person || typeof person !== 'object' || isEdwyn(person)) return false;
    if (!KEYS.some(key => key in person && isSpecialPath(person[key]))) return false;
    const replacement = fallbackPortrait(person);
    let changed = false;
    for (const key of KEYS) {
      if (!(key in person) || !isSpecialPath(person[key])) continue;
      try {
        if (replacement) person[key] = replacement;
        else if (key === 'portrait') person[key] = null;
        else delete person[key];
        changed = true;
      } catch (_) {}
    }
    if (changed) runtime.leakRepairs++;
    return changed;
  }

  function liveState() {
    try { return typeof S === 'undefined' ? (window.S || null) : S; } catch (_) { return window.S || null; }
  }

  function repairState() {
    const root = liveState();
    if (!root || typeof root !== 'object') return 0;
    runtime.scans++;
    const seen = new WeakSet();
    const stack = [root];
    let repaired = 0;
    let visited = 0;
    while (stack.length && visited < 100000) {
      const value = stack.pop();
      if (!value || typeof value !== 'object' || seen.has(value)) continue;
      seen.add(value);
      visited++;
      repaired += (isEdwyn(value) ? setEdwyn(value) : clearLeak(value)) ? 1 : 0;
      if (Array.isArray(value)) {
        for (let i = value.length - 1; i >= 0; i--) if (value[i] && typeof value[i] === 'object') stack.push(value[i]);
      } else {
        for (const child of Object.values(value)) if (child && typeof child === 'object') stack.push(child);
      }
    }
    if (repaired) {
      try { if (typeof persist === 'function') persist(false); else window.persist?.(false); } catch (_) {}
    }
    return repaired;
  }

  function wrapPortraitCore() {
    const base = window.AetherionPortraitCore;
    if (!base || base.__v1748EdwynExact) return false;
    const specialRow = Object.freeze({
      path: SPECIAL_PATH,
      role: 'Field Quartermaster',
      occupation: 'Field Quartermaster',
      label: 'Quartermaster Edwyn Rook',
      gender: 'M',
      fullBody: true,
    });
    const wrapped = Object.freeze({
      ...base,
      __v1748EdwynExact: true,
      needsReplacement(value) {
        if (localPath(value) === SPECIAL_PATH) return false;
        return typeof base.needsReplacement === 'function' ? base.needsReplacement(value) : false;
      },
      select(person, context) {
        if (isEdwyn(person)) return specialRow;
        return typeof base.select === 'function' ? base.select(person, context) : null;
      },
      selectForRole(role, context) {
        return typeof base.selectForRole === 'function' ? base.selectForRole(role, context) : null;
      },
      displayPath(value, ...args) {
        if (localPath(value) === SPECIAL_PATH) return assetUrl(SPECIAL_PATH);
        return typeof base.displayPath === 'function' ? base.displayPath(value, ...args) : value;
      },
      repairOne(person, context) {
        if (isEdwyn(person)) { setEdwyn(person); return person; }
        clearLeak(person);
        return typeof base.repairOne === 'function' ? base.repairOne(person, context) : person;
      },
    });
    window.AetherionPortraitCore = wrapped;
    if (window.AetherionV1742FullBodyIntegrity === base || window.AetherionV1742FullBodyIntegrity?.select) {
      window.AetherionV1742FullBodyIntegrity = wrapped;
    }
    runtime.coreWrapped = true;
    return true;
  }

  function markEdwynImage() {
    if (typeof document !== 'object') return;
    for (const img of document.querySelectorAll('img')) {
      try {
        delete img.dataset.aetherionEdwynRook;
        const card = img.closest?.('.entity,.card,article,li,[data-person-id],[data-id]');
        if (!card) continue;
        const id = text(card.dataset?.personId || card.dataset?.id);
        const name = norm(card.querySelector?.('h4,h3,strong,b')?.textContent || '');
        if (id !== EDWYN_ID && !EDWYN_NAMES.has(name)) continue;
        img.dataset.aetherionEdwynRook = '1';
        const url = assetUrl();
        if (img.src !== url) {
          img.removeAttribute('srcset');
          img.src = url;
        }
      } catch (_) {}
    }
  }

  function run() {
    installStyle();
    wrapPortraitCore();
    repairState();
    markEdwynImage();
    try { if (typeof render === 'function') render(); else window.render?.(); } catch (_) {}
  }

  window.AetherionV1748PortraitDial = Object.freeze({ version: VERSION, specialPortrait: SPECIAL_PATH, edwynId: EDWYN_ID, isEdwyn, repair: run, runtime });
  run();
  document?.addEventListener?.('aetherion:update-ready', () => setTimeout(run, 0));

  try {
    const key = 'aetherion.v1748.cleanPortraitReload';
    if (window.AetherionV1745Hotfix && !sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      setTimeout(() => location.reload(), 80);
    } else if (!window.AetherionV1745Hotfix) {
      setTimeout(() => sessionStorage.removeItem(key), 1500);
    }
  } catch (_) {}
})();
