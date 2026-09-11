/* Aetherion Reforged v1.74.2 — truthful full-APK and downloaded-web-update center. */
'use strict';

(() => {
  const VERSION = '1.74.2';
  const ANDROID_BUILD = 197;
  const CHANNEL_URL = 'https://raw.githubusercontent.com/corinthianrattler-ui/aetherion-updates/main/android/channel.json';
  const RELEASE_URL = 'https://github.com/corinthianrattler-ui/aetherion-updates/releases/download/v1.74.2/Aetherion_Reforged_v1.74.2_FULLBODY_BUGFIX_FULL.apk';
  const ALLOWED_RELEASE = /^https:\/\/github\.com\/corinthianrattler-ui\/aetherion-updates\/releases\/download\/[a-z0-9._-]+\/[a-z0-9._-]+\.apk(?:[?#].*)?$/i;
  const runtime = {modal: null, busy: false, lastCheck: null};

  if (window.AetherionUpdateCenterV174?.version === VERSION) return;

  const updater = () => window.AetherionUpdater || null;
  const node = (tag, className = '', value) => {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (value !== undefined) result.textContent = value;
    return result;
  };
  const compare = (left, right) => {
    const a = String(left || '').split('.').map(Number);
    const b = String(right || '').split('.').map(Number);
    for (let index = 0; index < Math.max(a.length, b.length, 3); index++) {
      if ((a[index] || 0) !== (b[index] || 0)) return (a[index] || 0) - (b[index] || 0);
    }
    return 0;
  };
  const formatBytes = value => {
    const bytes = Math.max(0, Number(value) || 0);
    if (bytes < 1024) return `${Math.round(bytes)} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };
  function validateChannel(channel) {
    const release = channel?.release;
    if (channel?.schema !== 1 || channel?.appId !== 'aetherion-reforged' || !release) throw Error('The Android update channel is invalid.');
    if (!/^\d+\.\d+\.\d+$/.test(String(release.version)) || !Number.isInteger(Number(release.build))) throw Error('The Android release version is invalid.');
    if (!ALLOWED_RELEASE.test(String(release.apkUrl || ''))) throw Error('The Android download address is not trusted.');
    if (!/^[a-f0-9]{64}$/i.test(String(release.apkSha256 || ''))) throw Error('The Android APK checksum is invalid.');
    if (!(Number(release.apkSize) > 100000000)) throw Error('The Android APK size is invalid.');
    return release;
  }
  async function checkAndroid() {
    const response = await fetch(`${CHANNEL_URL}?check=${Date.now()}`, {cache: 'no-store'});
    if (!response.ok) throw Error(`Android update check failed: HTTP ${response.status}.`);
    return validateChannel(await response.json());
  }
  async function currentState() {
    try { return await updater()?.state?.() || {bundled: VERSION, current: VERSION, previous: null}; }
    catch (_) { return {bundled: VERSION, current: VERSION, previous: null}; }
  }
  function close() {
    if (runtime.busy) return false;
    runtime.modal?.remove?.();
    runtime.modal = null;
    return true;
  }
  function startDownload(release = null) {
    const url = String(release?.apkUrl || RELEASE_URL);
    if (!ALLOWED_RELEASE.test(url)) throw Error('The Android download address is not trusted.');
    globalThis.location.href = url;
    return url;
  }
  function addButton(host, label, handler, primary = false) {
    const button = node('button', primary ? 'auc-primary' : '', label);
    button.type = 'button';
    button.addEventListener('click', handler);
    host.appendChild(button);
    return button;
  }
  function resetActions(ui) {
    ui.actions.replaceChildren();
    addButton(ui.actions, 'CHECK GITHUB', () => check(ui), true);
    addButton(ui.actions, 'DOWNLOAD CURRENT FULL APK', () => startDownload(), true);
    addButton(ui.actions, 'CLEAN DOWNLOADED WEB UPDATES', async () => {
      try {
        const result = await updater()?.clean?.();
        ui.status.textContent = result?.files
          ? `Removed ${result.files} unused downloaded web-update file(s), ${formatBytes(result.bytes)}. Packaged game files and saves were untouched.`
          : 'No unused downloaded web-update files remain. Packaged game files and saves were untouched.';
      } catch (error) { ui.status.textContent = String(error?.message || error); }
    });
    addButton(ui.actions, 'ROLL BACK DOWNLOADED WEB UPDATE', async () => {
      try { await updater()?.rollback?.(); location.reload(); }
      catch (error) { ui.status.textContent = String(error?.message || error); }
    });
    addButton(ui.actions, 'CLOSE', close);
  }
  async function check(ui) {
    if (runtime.busy) return;
    runtime.busy = true;
    for (const button of ui.actions.querySelectorAll?.('button') || []) button.disabled = true;
    ui.status.textContent = 'Checking the full Android build and signed downloaded-web-update channel…';
    ui.bar.style.width = '38%';
    try {
      const [androidResult, webResult, installed] = await Promise.allSettled([
        checkAndroid(), updater()?.check?.(), currentState(),
      ]);
      if (androidResult.status !== 'fulfilled') throw androidResult.reason;
      const release = androidResult.value;
      const state = installed.status === 'fulfilled' ? installed.value : {current: VERSION};
      const fullAvailable = Number(release.build) > ANDROID_BUILD || compare(release.version, VERSION) > 0;
      const web = webResult.status === 'fulfilled' ? webResult.value : null;
      runtime.lastCheck = {release, state, web};
      ui.bar.style.width = '100%';
      ui.notes.replaceChildren();
      for (const line of release.notes || []) ui.notes.appendChild(node('li', '', line));
      if (fullAvailable) {
        ui.status.textContent = `Full APK ${release.version} (Android build ${release.build}) is available — ${formatBytes(release.apkSize)}. Download it, open it, and approve Android’s Update prompt. Do not uninstall the current app; saves remain in place.`;
        ui.actions.replaceChildren();
        addButton(ui.actions, 'DOWNLOAD FULL APK', () => startDownload(release), true);
        addButton(ui.actions, 'CLOSE', close);
      } else if (web?.available) {
        ui.status.textContent = `Signed downloaded web update ${web.available.version} is available. It can add or override downloaded files, but it cannot physically remove files baked into this APK.`;
        ui.actions.replaceChildren();
        addButton(ui.actions, 'DOWNLOAD WEB UPDATE', async () => {
          try {
            await updater().install(web.available, (label, loaded, total) => {
              ui.status.textContent = label;
              ui.bar.style.width = `${total ? Math.min(100, loaded / total * 100) : 45}%`;
            });
            location.reload();
          } catch (error) { ui.status.textContent = String(error?.message || error); resetActions(ui); }
        }, true);
        addButton(ui.actions, 'CLOSE', close);
      } else {
        ui.status.textContent = `Aetherion ${VERSION} / Android build ${ANDROID_BUILD} is current. This is the complete replacement APK; its obsolete head/bust portrait files were removed during the build.`;
        resetActions(ui);
      }
    } catch (error) {
      ui.bar.style.width = '0%';
      ui.status.textContent = `Update check failed: ${String(error?.message || error)}`;
      resetActions(ui);
    } finally {
      runtime.busy = false;
      for (const button of ui.actions.querySelectorAll?.('button') || []) button.disabled = false;
    }
  }
  async function open() {
    if (runtime.modal) return runtime.modal;
    mount();
    const overlay = node('div', 'aetherion-update-center');
    const card = node('section', 'auc-card');
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    const header = node('header');
    const title = node('div');
    title.append(node('small', '', 'AETHERION REFORGED'), node('h2', '', 'Game Updates'));
    const closeButton = addButton(header, '×', close);
    closeButton.setAttribute('aria-label', 'Close');
    header.prepend(title);
    const state = await currentState();
    const installed = node('div', 'auc-installed', `INSTALLED ${VERSION} · ANDROID BUILD ${ANDROID_BUILD}${state.current && state.current !== VERSION ? ` · WEB ${state.current}` : ''}`);
    const truth = node('div', 'auc-truth');
    truth.innerHTML = '<b>How a real cleanup works</b><span>A full APK install can replace code and physically remove obsolete packaged files.</span><span>A downloaded web update can only add or override downloaded files; its cleanup button cannot alter this APK.</span><span>Android will always ask you to approve the APK update. Install over the current app—do not uninstall—so saves stay in place.</span>';
    const status = node('div', 'auc-status', 'Ready to check GitHub. No game save is ever included in cleanup or rollback.');
    const progress = node('div', 'auc-progress');
    const bar = node('span');
    progress.appendChild(bar);
    const notes = node('ul', 'auc-notes');
    const actions = node('div', 'auc-actions');
    const ui = {overlay, card, status, progress, bar, notes, actions};
    resetActions(ui);
    card.append(header, installed, truth, status, progress, notes, actions);
    overlay.appendChild(card);
    overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
    (document.body || document.documentElement).appendChild(overlay);
    runtime.modal = overlay;
    return overlay;
  }
  function makeButton() {
    const control = node('button', 'small aetherion-update-button', 'GAME UPDATES');
    control.type = 'button';
    control.dataset.aetherionUpdates = 'true';
    return control;
  }
  function mount() {
    document.getElementById('aetherion-update-launcher')?.remove?.();
    for (const host of document.querySelectorAll?.('.startBtns,.dockTabs') || []) {
      if (!host.querySelector?.('[data-aetherion-updates]')) host.appendChild(makeButton());
    }
  }
  function installStyle() {
    if (document.getElementById('aetherion-v1742-update-center-style')) return;
    const style = node('style');
    style.id = 'aetherion-v1742-update-center-style';
    style.textContent = `
      .aetherion-update-center{position:fixed;z-index:2147483647;inset:0;display:grid;place-items:center;padding:14px;background:#000e}
      .auc-card{box-sizing:border-box;width:min(640px,100%);max-height:92vh;overflow:auto;padding:20px;border:1px solid #98713f;border-radius:15px;background:linear-gradient(180deg,#171013,#090709);color:#eadeda;box-shadow:0 24px 64px #000;font-family:Georgia,serif}
      .auc-card header{display:flex;align-items:start;justify-content:space-between}.auc-card h2{margin:3px 0 10px;color:#e2c477}.auc-card small{color:#aa8a56;letter-spacing:.16em}.auc-card button{border:1px solid #75583c;border-radius:8px;background:#28191b;color:#f1dfd7;padding:10px 12px;font:700 13px Georgia,serif}.auc-card .auc-primary{background:#654225;border-color:#ba8d4d;color:#fff1c5}.auc-card button:disabled{opacity:.5}
      .auc-installed{margin-bottom:12px;color:#bda66f;font:700 12px ui-monospace,monospace}.auc-truth{display:grid;gap:7px;padding:13px;border:1px solid #57413b;border-radius:10px;background:#100b0d;line-height:1.35}.auc-truth b{color:#e0c680}.auc-truth span{font-size:13px}.auc-status{margin-top:12px;min-height:44px;padding:12px;border:1px solid #493537;border-radius:10px;background:#0c090a;line-height:1.42}.auc-progress{height:12px;margin-top:12px;overflow:hidden;border:1px solid #60483e;border-radius:99px;background:#050405}.auc-progress span{display:block;width:0;height:100%;background:linear-gradient(90deg,#80572c,#d3aa55);transition:width .2s}.auc-notes{padding-left:22px;line-height:1.4;font-size:13px}.auc-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:14px}
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  document.addEventListener('click', event => {
    const target = event.target?.closest?.('[data-aetherion-updates]');
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    open();
  }, true);
  const api = Object.freeze({version: VERSION, androidBuild: ANDROID_BUILD, channel: CHANNEL_URL, apk: RELEASE_URL, open, close, mount, checkAndroid, validateChannel, startDownload, state: currentState, runtime});
  window.AetherionUpdateCenterV174 = api;
  window.AetherionUpdateCenterV172 = api;
  installStyle();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once: true}); else mount();
})();
