/* Aetherion Reforged v1.74.3 — authoritative indexed portrait core. */
'use strict';

(() => {
  const VERSION = '1.74.3';
  const POLICY = 'replace-known-head-and-placeholder-art;preserve-existing-full-body-art';
  const LIVING = window.AetherionV173LivingPortraits;
  const CURATED = window.AetherionV168Portraits;
  const KNIGHTS = window.AetherionV1731KnightDiversity;
  const runtime = {
    scans: 0,
    recordsChecked: 0,
    repaired: 0,
    factoryRepairs: 0,
    displayFallbacks: 0,
    lastMigration: null,
    lastAudit: null,
  };

  if (window.AetherionPortraitCore?.version === VERSION) return;
  if (!LIVING?.registry?.length || !CURATED?.registry?.length) {
    console.error('[Aetherion 1.74.3] packaged full-body portrait catalogs are unavailable');
    return;
  }

  const text = value => String(value ?? '').trim();
  const norm = value => text(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const hash = value => {
    let result = 2166136261;
    for (const char of String(value)) {
      result ^= char.charCodeAt(0);
      result = Math.imul(result, 16777619);
    }
    return result >>> 0;
  };
  const phrase = (body, term) => {
    const haystack = ` ${norm(body)} `;
    const needle = ` ${norm(term)} `;
    return needle !== '  ' && haystack.includes(needle);
  };
  const normalizedPhrase = (body, term) => !!term && ` ${body} `.includes(` ${term} `);
  function liveState() {
    try { return typeof S === 'undefined' ? null : S; } catch (_) { return null; }
  }
  function localPath(value) {
    let path = text(value);
    try { path = decodeURIComponent(path); } catch (_) {}
    const match = path.match(/(?:^|\/)((?:assets|custom)\/[a-z0-9_./-]+\.(?:webp|png|jpe?g|gif|svg))(?:[?#].*)?$/i);
    return match ? match[1] : path.replace(/^\.\//, '').split(/[?#]/)[0];
  }

  const REMOVED_PERSON_FILES = new Set([
    'assets/v29/portraits/blacksmith.webp',
    'assets/v29/portraits/bookseller.webp',
    'assets/v29/portraits/captain_edric.webp',
    'assets/v29/portraits/captain_sabine.webp',
    'assets/v29/portraits/carpenter.webp',
    'assets/v29/portraits/fence.webp',
    'assets/v29/portraits/foreman_garran.webp',
    'assets/v29/portraits/moneychanger.webp',
    'assets/v29/portraits/navigator_yselle.webp',
    'assets/v29/portraits/quartermaster_halric.webp',
    'assets/v29/portraits/shipwright_odran.webp',
    'assets/v29/portraits/stablemaster.webp',
    'assets/v29/portraits/surgeon_halric.webp',
    'assets/v29/portraits/surgeon_ysabet.webp',
    'assets/v29/portraits/tavernkeeper.webp',
    'assets/v34/people/market_loader.webp',
    'assets/v34/people/market_teamster.webp',
    'assets/v34/people/market_wheelwright.webp',
    'assets/v34/people/quartermaster_corvinus.webp',
    'assets/prisoners/bandit_female.webp',
    'assets/prisoners/bandit_male.webp',
    'assets/prisoners/mercenary_male.webp',
    'assets/prisoners/orc_male.webp',
    'assets/v28/scenes/dock_foreman.webp',
    'assets/v28/scenes/marine_captain.webp',
    'assets/v28/scenes/master_shipwright.webp',
    'assets/v28/scenes/navigator.webp',
    'assets/v28/scenes/privateer_captain.webp',
    'assets/v28/scenes/quartermaster.webp',
    'assets/v26/scenes/blood_thrall.webp',
    'assets/v26/scenes/street_informant.webp',
    'assets/v26/scenes/watch_captain.webp',
    'custom/npc-portraits/v168/00_quartermaster_original_unchanged.webp',
    'assets/v38/thrall/nessa_cale_portrait.webp',
  ]);
  function removedHeadPath(value) {
    const path = localPath(value);
    return /^assets\/(?:workers|dynasty)\//i.test(path) || REMOVED_PERSON_FILES.has(path);
  }
  function placeholderPath(value) {
    const path = localPath(value);
    return /^(?:assets\/medical\/surgeon_kit\.webp|assets\/v28\/scenes\/dock_stevedores\.webp|assets\/v35\/scenes\/fishing_port\.webp|assets\/v26\/scenes\/(?:bookseller_shop|blacksmith_forge)\.webp|assets\/v17\/locations\/apothecary\.webp|assets\/v50\/(?:rooms\/stores|jobs\/owned_shop|districts\/shop_row)\.webp)$/i.test(path);
  }
  const needsReplacement = value => removedHeadPath(value) || placeholderPath(value);

  const AGE_RANGES = Object.freeze({
    baby: [0, 1], infant: [0, 1], toddler: [2, 5], child: [6, 12], teen: [13, 17],
    young: [18, 39], adult: [26, 39], mature: [40, 59], older: [40, 999], elder: [60, 999],
  });
  const ROLE_GROUPS = [
    ['male farmer', 'female farmer', 'farmer', 'farmhand', 'field hand', 'farm overseer', 'peasant laborer', 'farm laborer', 'agricultural laborer', 'orchard worker'],
    ['shepherd', 'goatherd', 'cattle herder', 'swineherd', 'poultry keeper'],
    ['miller', 'baker', 'brewer', 'butcher', 'cook', 'kitchen hand', 'traveling food vendor'],
    ['innkeeper', 'tavern keeper', 'serving man', 'serving woman', 'cellar keeper'],
    ['chamberlain', 'steward', 'castellan', 'seneschal', 'clerk', 'scribe', 'bailiff', 'tax collector'],
    ['courier', 'messenger', 'carriage driver', 'wagon driver', 'coachman', 'teamster', 'carriage master'],
    ['town guard', 'militia man', 'militia recruit', 'footman', 'soldier', 'guard', 'man at arms', 'bannerless man at arms'],
    ['stableman', 'stablewoman', 'stable hand', 'farrier', 'horse breeder', 'horse trader'],
    ['forester', 'woodcutter', 'hunter', 'bounty hunter', 'caravan scout', 'scout'],
    ['gravedigger', 'undertaker', 'groundskeeper', 'peasant laborer'],
    ['fishmonger', 'fisherman', 'fisherwoman', 'fisher', 'sailor', 'boatman', 'ferryman'],
    ['blacksmith', 'master blacksmith', 'master smith', 'weaponsmith', 'armorer', 'forge laborer'],
    ['carpenter', 'wheelwright', 'shipwright', 'master shipwright', 'skilled artisan'],
    ['mason', 'stonecutter', 'quarry worker', 'miner', 'mine laborer', 'ore sorter'],
    ['tailor', 'weaver', 'master clothier', 'leatherworker', 'rope maker', 'sail maker', 'skilled artisan'],
    ['market trader', 'traveling merchant', 'peddler', 'shopkeeper', 'provisioner', 'road outfitter', 'moneychanger', 'banker'],
    ['warehouse keeper', 'storehouse laborer', 'cargo master', 'loader', 'porter', 'dock laborer', 'dockworker', 'stevedore'],
    ['dockmaster', 'dock foreman', 'harbor pilot', 'navigator', 'quartermaster', 'field quartermaster'],
    ['healer', 'apothecary', 'midwife', 'nurse', 'surgeon', 'barber surgeon'],
    ['priest', 'shrine keeper', 'cleric', 'chaplain'],
    ['bard', 'minstrel', 'actor', 'dancer', 'jester', 'pit announcer'],
    ['arena keeper', 'arena trainer', 'gladiator', 'male gladiator', 'female gladiator'],
    ['privateer captain', 'marine captain', 'company captain', 'captain', 'sergeant'],
    ['bandit', 'raider', 'mercenary', 'bounty hunter', 'prisoner', 'captive', 'fence', 'cutpurse', 'informer', 'smuggler', 'thief', 'criminal', 'outlaw'],
    ['charcoal burner', 'salt worker', 'lumber handler', 'storehouse laborer', 'peasant laborer'],
  ].map(group => new Set(group.map(norm)));
  const IGNORED_ROLE_TOKENS = new Set(['master', 'skilled', 'adult', 'young', 'older', 'male', 'female', 'worker', 'keeper']);
  const KNIGHT_TERMS = /knight|cataphract|lancer|cavalier/;
  const REMOVED_ASSET_COUNT = 176;

  function rowPath(row) { return localPath(row?.path); }
  function rowTerms(row) { return row?.__terms || [row?.role, row?.occupation, row?.label, ...(row?.aliases || []), ...(row?.roleTags || [])].map(norm).filter(Boolean); }
  function rangeFor(row) {
    if (row?.__range) return row.__range;
    if (Number.isFinite(+row?.ageMin) && Number.isFinite(+row?.ageMax)) return [+row.ageMin, +row.ageMax];
    return AGE_RANGES[norm(row?.ageBand)] || [18, 999];
  }
  function rowRace(row) { return row?.__race || norm(row?.race || 'human') || 'human'; }
  function rowGender(row) { return row?.__gender || (row?.gender === 'F' ? 'F' : 'M'); }
  function fullBodyRow(row) {
    const path = rowPath(row);
    return !!path && !removedHeadPath(path) && row?.fullBody !== false;
  }
  function groupsForNormalized(joined) {
    const body = ` ${norm(joined)} `;
    const found = new Set();
    ROLE_GROUPS.forEach((group, index) => {
      if ([...group].some(term => body.includes(` ${term} `) || ` ${term} `.includes(body))) found.add(index);
    });
    return found;
  }
  const allRows = [];
  const seenPaths = new Set();
  for (const row of [...LIVING.registry, ...CURATED.registry, ...(KNIGHTS?.registry || [])]) {
    const path = rowPath(row);
    if (!fullBodyRow(row) || seenPaths.has(path)) continue;
    seenPaths.add(path);
    const terms = [...new Set([row?.role, row?.occupation, row?.label, ...(row?.aliases || []), ...(row?.roleTags || [])].map(norm).filter(Boolean))];
    const range = rangeFor(row);
    const roleBody = terms.join(' ');
    allRows.push({...row, path, __terms: terms, __termSet: new Set(terms), __groups: groupsForNormalized(roleBody), __tokens: new Set(roleBody.split(' ').filter(token => token.length > 3 && !IGNORED_ROLE_TOKENS.has(token))), __range: range, __race: norm(row?.race || 'human') || 'human', __gender: row?.gender === 'F' ? 'F' : 'M', __minor: range[1] < 18, __knight: KNIGHT_TERMS.test(roleBody)});
  }
  const rowByPath = new Map(allRows.map(row => [row.path, row]));
  const candidateBuckets = new Map();
  const fallbackBuckets = new Map();
  const exactRoleRows = new Map();
  const selectionPools = new Map();
  for (const row of allRows) {
    const key = `${row.__gender}|${row.__race}|${row.__minor ? 'minor' : 'adult'}`;
    const fallbackKey = `${row.__gender}|${row.__minor ? 'minor' : 'adult'}`;
    if (!candidateBuckets.has(key)) candidateBuckets.set(key, []);
    if (!fallbackBuckets.has(fallbackKey)) fallbackBuckets.set(fallbackKey, []);
    candidateBuckets.get(key).push(row);
    fallbackBuckets.get(fallbackKey).push(row);
    for (const term of row.__terms) {
      if (!exactRoleRows.has(term)) exactRoleRows.set(term, []);
      exactRoleRows.get(term).push(row);
    }
  }

  function genderOf(person) {
    try { return CURATED.genderOf?.(person) === 'F' ? 'F' : 'M'; }
    catch (_) { return person?.gender === 'F' ? 'F' : 'M'; }
  }
  function raceOf(person, context = {}) {
    if (norm(person?.kind) === 'orc') return 'orc';
    try { return norm(CURATED.raceOf?.(person, context) || 'human') || 'human'; }
    catch (_) { return norm(person?.race || 'human') || 'human'; }
  }
  function ageOf(person, context = {}) {
    try {
      const visual = +CURATED.visualAge?.(person, context);
      if (Number.isFinite(visual)) return Math.max(0, visual);
    } catch (_) {}
    const age = +person?.age;
    return Number.isFinite(age) ? Math.max(0, age) : 30;
  }
  function roleText(person) {
    return norm([person?.role, person?.rank, person?.title, person?.kind, person?.species, person?.portraitRole, person?.category, person?.job, person?.order].filter(Boolean).join(' '));
  }
  function featuresFor(person, context = {}) {
    const role = norm(person?.role || person?.rank || person?.title || person?.kind);
    const body = roleText(person);
    const age = ageOf(person, context);
    return {gender: genderOf(person), race: raceOf(person, context), age, minor: age < 18, serviceKnight: !!KNIGHTS?.serviceKnight?.(person), role, body, groups: groupsForNormalized(`${role} ${body}`), tokens: new Set(body.split(' ').filter(token => token.length > 3 && !IGNORED_ROLE_TOKENS.has(token)))};
  }
  function roleScore(features, row) {
    if (features.role && row.__termSet.has(features.role)) return 3200;
    if (row.__terms.some(term => normalizedPhrase(features.body, term) || (features.role && normalizedPhrase(term, features.role)))) return 2850;
    if ([...features.groups].some(group => row.__groups.has(group))) return 2050;
    const overlap = [...row.__tokens].filter(token => features.tokens.has(token)).length;
    return overlap ? 700 + overlap * 120 : 0;
  }
  function ageScore(age, row) {
    const [minimum, maximum] = rangeFor(row);
    const distance = age < minimum ? minimum - age : age > maximum ? age - maximum : 0;
    return Math.max(250, 5000 - distance * 300);
  }
  function select(person, context = {}) {
    const features = featuresFor(person, context);
    const signature = `${features.gender}|${features.race}|${Math.round(features.age)}|${features.role}|${features.body}|${features.serviceKnight ? 'knight' : 'civilian'}`;
    let pool = selectionPools.get(signature);
    if (!pool) {
      let candidates = candidateBuckets.get(`${features.gender}|${features.race}|${features.minor ? 'minor' : 'adult'}`) || [];
      if (!candidates.length) candidates = fallbackBuckets.get(`${features.gender}|${features.minor ? 'minor' : 'adult'}`) || [];
      let bestScore = -1;
      pool = [];
      for (const row of candidates) {
        if (!features.serviceKnight && row.__knight && !KNIGHT_TERMS.test(features.body)) continue;
        const score = ageScore(features.age, row) + roleScore(features, row);
        if (score > bestScore) { bestScore = score; pool = [row]; }
        else if (score === bestScore) pool.push(row);
      }
      selectionPools.set(signature, pool);
    }
    if (!pool.length) return null;
    const key = `${person?.id || ''}|${person?.name || ''}|${person?.role || ''}|${person?.location || context.location || ''}`;
    return pool[hash(key) % pool.length] || null;
  }
  function selectForRole(role, descriptor = {}) {
    const target = norm(role);
    const exact = exactRoleRows.get(target) || [];
    if (exact.length) return exact[hash(`registry|${target}`) % exact.length];
    return select({id: `registry_${target}`, name: role, role, gender: descriptor.gender || 'M', age: descriptor.age ?? 30, race: descriptor.race || 'human'}, descriptor);
  }

  const SPECIAL_REPLACEMENTS = Object.freeze({
    'assets/v38/thrall/nessa_cale_portrait.webp': 'assets/v38/thrall/nessa_cale_encounter.webp',
    'assets/prisoners/bandit_female.webp': 'custom/npc-portraits/v168/81_northern_horse_raider_adult_woman.webp',
    'assets/prisoners/bandit_male.webp': 'custom/npc-portraits/v168/82_northern_horse_raider_elder_man.webp',
    'assets/prisoners/mercenary_male.webp': 'custom/npc-portraits/v168/94_mercenary_heavy_knight_elder_man.webp',
    'assets/prisoners/orc_male.webp': 'custom/npc-portraits/v168/90_orc_raider_adult_man.webp',
    'assets/v28/scenes/master_shipwright.webp': 'custom/npc-portraits/v173/135_shipwright_om.webp',
    'assets/v28/scenes/navigator.webp': 'custom/npc-portraits/v173/138_navigator_yf.webp',
    'assets/v28/scenes/quartermaster.webp': 'custom/npc-portraits/v173/111_quartermaster_om.webp',
    'assets/v28/scenes/dock_foreman.webp': 'custom/npc-portraits/v173/143_dock_foreman_om.webp',
    'assets/v28/scenes/privateer_captain.webp': 'custom/npc-portraits/v173/154_privateer_captain_yf.webp',
    'assets/v28/scenes/marine_captain.webp': 'custom/npc-portraits/v173/159_marine_captain_om.webp',
    'assets/v26/scenes/street_informant.webp': 'custom/npc-portraits/v173/070_caravan_scout_yf.webp',
    'assets/v26/scenes/watch_captain.webp': 'custom/npc-portraits/v173/069_caravan_scout_ym.webp',
    'assets/v26/scenes/blood_thrall.webp': 'custom/npc-portraits/v173/069_caravan_scout_ym.webp',
  });
  const STATIC_PEOPLE = Object.freeze({
    'assets/v29/portraits/blacksmith.webp': ['Blacksmith', 'M', 38],
    'assets/v29/portraits/bookseller.webp': ['Bookseller-Scribe', 'M', 42],
    'assets/v29/portraits/captain_edric.webp': ['Marine Captain', 'M', 45],
    'assets/v29/portraits/captain_sabine.webp': ['Privateer Captain', 'F', 38],
    'assets/v29/portraits/carpenter.webp': ['Carpenter', 'M', 35],
    'assets/v29/portraits/fence.webp': ['Market Trader', 'M', 39],
    'assets/v29/portraits/foreman_garran.webp': ['Dock Foreman', 'M', 42],
    'assets/v29/portraits/moneychanger.webp': ['Moneychanger', 'F', 34],
    'assets/v29/portraits/navigator_yselle.webp': ['Navigator', 'F', 34],
    'assets/v29/portraits/quartermaster_halric.webp': ['Quartermaster', 'M', 51],
    'assets/v29/portraits/shipwright_odran.webp': ['Master Shipwright', 'M', 58],
    'assets/v29/portraits/stablemaster.webp': ['Stableman', 'M', 44],
    'assets/v29/portraits/surgeon_halric.webp': ['Surgeon', 'M', 67],
    'assets/v29/portraits/surgeon_ysabet.webp': ['Surgeon', 'F', 58],
    'assets/v29/portraits/tavernkeeper.webp': ['Tavern Keeper', 'M', 42],
    'assets/v34/people/market_loader.webp': ['Loader', 'M', 32],
    'assets/v34/people/market_teamster.webp': ['Teamster', 'M', 36],
    'assets/v34/people/market_wheelwright.webp': ['Wheelwright', 'M', 44],
    'assets/v34/people/quartermaster_corvinus.webp': ['Quartermaster', 'M', 46],
    'assets/prisoners/bandit_female.webp': ['Bandit', 'F', 32],
    'assets/prisoners/bandit_male.webp': ['Bandit', 'M', 42],
    'assets/prisoners/mercenary_male.webp': ['Mercenary', 'M', 50],
    'assets/prisoners/orc_male.webp': ['Orc Raider', 'M', 34],
    'assets/v28/scenes/master_shipwright.webp': ['Master Shipwright', 'M', 58],
    'assets/v28/scenes/navigator.webp': ['Navigator', 'F', 34],
    'assets/v28/scenes/quartermaster.webp': ['Quartermaster', 'M', 51],
    'assets/v28/scenes/dock_foreman.webp': ['Dock Foreman', 'M', 42],
    'assets/v28/scenes/privateer_captain.webp': ['Privateer Captain', 'F', 38],
    'assets/v28/scenes/marine_captain.webp': ['Marine Captain', 'M', 45],
    'custom/npc-portraits/v168/00_quartermaster_original_unchanged.webp': ['Quartermaster', 'M', 50],
  });
  function legacyDescriptor(value) {
    const path = localPath(value);
    if (STATIC_PEOPLE[path]) {
      const [role, gender, age] = STATIC_PEOPLE[path];
      return {id: `legacy_${path}`, name: role, role, gender, age, race: 'human'};
    }
    let match = path.match(/^assets\/workers\/([^/]+)\.jpg$/i);
    if (match) {
      const role = match[1].replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
      return {id: `legacy_${path}`, name: role, role, gender: 'M', age: 30, race: 'human'};
    }
    match = path.match(/^assets\/dynasty\/(female|male)_(child|teen|young|adult)_([1-4])\.webp$/i);
    if (match) {
      const age = {child: 9, teen: 15, young: 23, adult: 46}[match[2].toLowerCase()];
      return {id: `legacy_${path}`, name: 'Household Member', role: match[2].toLowerCase() === 'child' ? 'Child' : 'Household Member', gender: match[1].toLowerCase() === 'female' ? 'F' : 'M', age, race: 'human'};
    }
    return null;
  }
  function displayPath(value) {
    if (!removedHeadPath(value)) return value;
    const path = localPath(value);
    if (SPECIAL_REPLACEMENTS[path]) return SPECIAL_REPLACEMENTS[path];
    const descriptor = legacyDescriptor(path) || {id: `fallback_${path}`, name: 'Resident', role: 'Peasant Laborer', gender: 'M', age: 30, race: 'human'};
    const next = select(descriptor, {}) || selectForRole(descriptor.role, descriptor);
    if (next?.path) {
      runtime.displayFallbacks++;
      return next.path;
    }
    return 'custom/npc-portraits/v173/009_peasant_laborer_ym.webp';
  }
  function replaceLegacyHtml(markup) {
    return typeof markup !== 'string' ? markup : markup.replace(/(?:assets\/(?:workers|dynasty)\/[a-z0-9_.\/-]+|assets\/prisoners\/[a-z0-9_.\/-]+|assets\/v26\/scenes\/(?:blood_thrall|street_informant|watch_captain)\.webp|assets\/v28\/scenes\/(?:master_shipwright|navigator|quartermaster|dock_foreman|privateer_captain|marine_captain)\.webp|assets\/v29\/portraits\/[a-z0-9_.\/-]+|assets\/v34\/people\/[a-z0-9_.\/-]+|assets\/v38\/thrall\/nessa_cale_portrait\.webp|custom\/npc-portraits\/v168\/00_quartermaster_original_unchanged\.webp)/gi, match => displayPath(match));
  }
  function setPortrait(person, path) {
    if (!person || !path) return false;
    let changed = false;
    if (Object.prototype.hasOwnProperty.call(person, 'portrait') || (!person.img && !person.art)) {
      if (person.portrait !== path) { person.portrait = path; changed = true; }
    }
    if (Object.prototype.hasOwnProperty.call(person, 'img') && person.img !== path) { person.img = path; changed = true; }
    if (Object.prototype.hasOwnProperty.call(person, 'art') && person.art !== path) { person.art = path; changed = true; }
    return changed;
  }
  function pictureOf(person) { return text(person?.portrait || person?.img || person?.art); }
  function repairOne(person, context = {}, factory = false) {
    if (!person || typeof person !== 'object') return person;
    runtime.recordsChecked++;
    const before = pictureOf(person);
    if (before && !needsReplacement(before)) return person;
    if (SPECIAL_REPLACEMENTS[localPath(before)]) {
      if (setPortrait(person, SPECIAL_REPLACEMENTS[localPath(before)])) runtime.repaired++;
      return person;
    }
    if (KNIGHTS?.serviceKnight?.(person)) KNIGHTS.assignOne?.(person);
    const current = pictureOf(person);
    if (!current || needsReplacement(current)) {
      const next = select(person, context);
      if (next?.path && setPortrait(person, next.path)) runtime.repaired++;
    }
    if (factory && pictureOf(person) !== before) runtime.factoryRepairs++;
    return person;
  }
  function generatedPortraitIsCompatible(person, context = {}) {
    const row = rowByPath.get(localPath(pictureOf(person)));
    if (!row) return true;
    const age = ageOf(person, context);
    const [minimum, maximum] = rangeFor(row);
    return rowGender(row) === genderOf(person)
      && rowRace(row) === raceOf(person, context)
      && (maximum < 18) === (age < 18)
      && age >= minimum
      && age <= maximum;
  }
  function repairGenerated(person, context = {}) {
    if (!person || typeof person !== 'object') return person;
    const before = pictureOf(person);
    if (needsReplacement(before)) return repairOne(person, context, true);
    if (before && generatedPortraitIsCompatible(person, context)) return person;
    const next = select(person, context);
    if (next?.path && setPortrait(person, next.path)) {
      runtime.repaired++;
      runtime.factoryRepairs++;
    }
    return person;
  }
  function repairRows(rows, context = {}, factory = false) {
    for (const person of rows || []) repairOne(person, context, factory);
    return rows;
  }
  function collect(state) {
    const rows = [];
    const seen = new WeakSet();
    function visit(value, context = {}) {
      if (!value || typeof value !== 'object' || seen.has(value)) return;
      seen.add(value);
      const picture = pictureOf(value);
      const missingPersonPicture = !picture && value.name && value.role;
      if ((needsReplacement(picture) || missingPersonPicture) && (value.name || value.role || value.gender || Number.isFinite(+value.age))) rows.push([value, context]);
      if (Array.isArray(value)) {
        for (const child of value) visit(child, context);
        return;
      }
      for (const [key, child] of Object.entries(value)) {
        if (!child || typeof child !== 'object') continue;
        visit(child, key === 'family' ? {...context, family: true} : context);
      }
    }
    visit(state);
    return rows;
  }
  function repairState(state = liveState(), force = false) {
    if (!state?.world) return state;
    state.meta ??= {};
    LIVING?.repairState?.(state);
    KNIGHTS?.repairState?.(state);
    if (!force && state.meta.v1743PortraitCore?.version === VERSION) return state;
    const started = Date.now();
    const rows = collect(state);
    const before = runtime.repaired;
    for (const [person, context] of rows) repairOne(person, context);
    const repaired = runtime.repaired - before;
    state.meta.v1743PortraitCore = {
      version: VERSION,
      policy: POLICY,
      checked: rows.length,
      repaired,
      savePreserved: true,
      gameContentRemoved: false,
      obsoletePortraitAssetsRemoved: REMOVED_ASSET_COUNT,
      elapsedMs: Date.now() - started,
    };
    state.meta.v1742FullBodyIntegrity = {...state.meta.v1743PortraitCore, supersededBy: 'v1743PortraitCore'};
    runtime.scans++;
    runtime.lastMigration = {...state.meta.v1743PortraitCore};
    return state;
  }
  function auditState(state = liveState()) {
    const failures = collect(state || {}).map(([person]) => ({
      id: person.id || null,
      name: person.name || null,
      role: person.role || person.rank || null,
      path: pictureOf(person),
    }));
    const result = {version: VERSION, catalog: allRows.length, headOrPlaceholderReferences: failures, ok: failures.length === 0};
    runtime.lastAudit = result;
    return result;
  }
  function wrap(name, maker) {
    const prior = globalThis[name];
    if (typeof prior !== 'function' || prior.__aetherionPortraitCore === VERSION) return;
    const next = maker(prior);
    next.__aetherionPortraitCore = VERSION;
    globalThis[name] = next;
  }
  function wrapResult(name, context = {}) {
    wrap(name, prior => function (...args) {
      const result = prior.apply(this, args);
      if (Array.isArray(result)) repairRows(result, context, true);
      else repairOne(result, context, true);
      return result;
    });
  }
  function wrapGeneratedResult(name, context = {}) {
    wrap(name, prior => function (...args) {
      const result = prior.apply(this, args);
      if (Array.isArray(result)) for (const person of result) repairGenerated(person, context);
      else repairGenerated(result, context);
      return result;
    });
  }
  function wrapHtml(name) {
    wrap(name, prior => function (...args) { return replaceLegacyHtml(prior.apply(this, args)); });
  }

  wrap('makeStartState', prior => function (...args) { return repairState(prior.apply(this, args)); });
  wrap('migrateState', prior => function (state, ...args) { return repairState(prior.call(this, state, ...args)); });
  wrapGeneratedResult('mkPerson');
  wrapGeneratedResult('v10BuildResidents');
  wrapResult('v15MakeCandidate');
  wrapResult('v17BondedStock', {bonded: true});
  wrapResult('v34lLaborCandidate');
  wrapResult('v55Worker');
  wrapResult('v26Contacts');
  wrapResult('makePrisoner', {prisoner: true});
  wrap('v14LaborMarkets', prior => function (state, ...args) {
    const before = new Set(Object.keys(state?.world?.laborMarkets || {}));
    const result = prior.call(this, state, ...args);
    for (const [location, rows] of Object.entries(state?.world?.laborMarkets || {})) {
      if (!before.has(location)) for (const person of rows || []) repairGenerated(person, {location});
    }
    return result;
  });
  wrap('v23BaseState', prior => function (...args) {
    const result = prior.apply(this, args);
    repairRows(result?.surgeons, {}, true);
    return result;
  });
  wrap('v28SeedLabor', prior => function (state, ...args) {
    const result = prior.call(this, state, ...args);
    repairRows((state || liveState())?.v28?.laborPool, {}, true);
    return result;
  });
  wrap('v16Portrait', prior => function (role, gender, ...args) {
    const result = prior.call(this, role, gender, ...args);
    const next = select({id: `v16_${norm(role)}_${gender}`, name: role, role, gender: gender === 'F' ? 'F' : 'M', age: 30}, {});
    return next?.path || (needsReplacement(result) ? displayPath(result) : result);
  });
  if (typeof v10WorkerArt === 'function') {
    const workerArt = function (role) {
      return selectForRole(role, {})?.path || 'custom/npc-portraits/v173/009_peasant_laborer_ym.webp';
    };
    workerArt.__aetherionPortraitCore = VERSION;
    globalThis.v10WorkerArt = workerArt;
  }
  wrap('v15Portrait', prior => function (role, gender, ...args) {
    const result = prior.call(this, role, gender, ...args);
    return needsReplacement(result) ? select({id: `v15_${norm(role)}_${gender}`, name: role, role, gender, age: 30}, {})?.path || displayPath(result) : result;
  });
  if (typeof lwPortrait === 'function') {
    globalThis.lwPortrait = function (gender, age, index = 0) {
      return select({id: `dynasty_${gender}_${age}_${index}`, name: 'Household Member', role: +age < 18 ? 'Child' : 'Household Member', gender, age}, {family: true})?.path || (gender === 'F' ? 'custom/npc-portraits/v173/010_peasant_laborer_yf.webp' : 'custom/npc-portraits/v173/009_peasant_laborer_ym.webp');
    };
    globalThis.lwPortrait.__aetherionPortraitCore = VERSION;
  }
  wrap('lwMemberPortrait', prior => function (member, ...args) {
    const current = prior.call(this, member, ...args);
    if (!needsReplacement(current)) return current;
    return select(member, {dynasty: true, family: true})?.path || displayPath(current);
  });
  wrap('v10LocalFamilyPortrait', prior => function (member, ...args) {
    const current = prior.call(this, member, ...args);
    if (!needsReplacement(current)) return current;
    return select(member, {family: true})?.path || displayPath(current);
  });
  wrap('entityImage', prior => function (source, ...args) { return replaceLegacyHtml(prior.call(this, displayPath(source), ...args)); });
  wrap('openModal', prior => function (markup, ...args) { return prior.call(this, replaceLegacyHtml(markup), ...args); });
  for (const name of ['peopleCards', 'v55WorkerCard', 'tabContent', 'codexSection', 'storyTab', 'characterTab']) wrapHtml(name);

  if (typeof document === 'object' && !document.getElementById?.('aetherion-portrait-core')) {
    const style = document.createElement('style');
    style.id = 'aetherion-portrait-core';
    style.textContent = `
      .entityList>.entity:has(>img[src*="custom/npc-portraits/"]){grid-template-columns:76px minmax(0,1fr);align-items:start}
      .entityList>.entity>img[src*="custom/npc-portraits/"]{width:76px!important;height:114px!important;object-fit:contain!important;object-position:center!important;background:#080608;flex:0 0 76px!important}
      .workerPlate .workerPortrait[src*="custom/npc-portraits/"]{width:108px!important;height:100%!important;min-height:150px!important;object-fit:contain!important;object-position:center!important;background:#080608}
      .bigPic[src*="custom/npc-portraits/"],.dynastyPortrait[src*="custom/npc-portraits/"],.managerPortrait[src*="custom/npc-portraits/"]{object-fit:contain!important;object-position:center!important;background:#080608}
      .speakerPic[src*="custom/npc-portraits/"]{object-fit:cover!important;object-position:50% 18%!important}
      @media(max-width:600px){.workerPlate .workerPortrait[src*="custom/npc-portraits/"]{width:92px!important}.entityList>.entity:has(>img[src*="custom/npc-portraits/"]){grid-template-columns:72px minmax(0,1fr)}.entityList>.entity>img[src*="custom/npc-portraits/"]{width:72px!important;height:108px!important}}
    `;
    (document.head || document.documentElement)?.appendChild(style);
  }
  if (typeof document?.addEventListener === 'function') {
    document.addEventListener('error', event => {
      const node = event.target;
      const source = node?.getAttribute?.('src') || node?.src || '';
      if (String(node?.tagName).toUpperCase() !== 'IMG' || !removedHeadPath(source)) return;
      event.preventDefault?.();
      event.stopImmediatePropagation?.();
      node.onerror = null;
      node.src = displayPath(source);
    }, true);
  }

  const publicApi = Object.freeze({
    version: VERSION,
    policy: POLICY,
    registry: Object.freeze(allRows),
    removedPersonFiles: Object.freeze([...REMOVED_PERSON_FILES]),
    needsReplacement,
    select,
    selectForRole,
    displayPath,
    repairOne,
    repairGenerated,
    repairRows,
    repairState,
    auditState,
    runtime,
  });
  window.AetherionPortraitCore = publicApi;
  window.AetherionV1742FullBodyIntegrity = publicApi;

  try {
    const state = liveState();
    if (state?.world && state.meta?.v1743PortraitCore?.version !== VERSION) {
      repairState(state);
      if (typeof persist === 'function') persist(false);
    }
  } catch (error) {
    console.warn('[Aetherion 1.74.3 portrait migration]', error);
  }
})();
