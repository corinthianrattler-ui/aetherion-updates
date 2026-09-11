/* Aetherion Reforged v1.74.2 — authoritative full-body portrait integrity. */
'use strict';

(() => {
  const VERSION = '1.74.2';
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

  if (window.AetherionV1742FullBodyIntegrity?.version === VERSION) return;
  if (!LIVING?.registry?.length || !CURATED?.registry?.length) {
    console.error('[Aetherion 1.74.2] packaged full-body portrait catalogs are unavailable');
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
    'custom/npc-portraits/v168/00_quartermaster_original_unchanged.webp',
    'assets/v38/thrall/nessa_cale_portrait.webp',
  ]);
  function removedHeadPath(value) {
    const path = localPath(value);
    return /^assets\/(?:workers|dynasty)\//i.test(path) || REMOVED_PERSON_FILES.has(path);
  }
  function placeholderPath(value) {
    const path = localPath(value);
    return /^(?:assets\/medical\/surgeon_kit\.webp|assets\/v28\/scenes\/dock_stevedores\.webp|assets\/v26\/scenes\/(?:bookseller_shop|blacksmith_forge)\.webp|assets\/v17\/locations\/apothecary\.webp|assets\/v50\/(?:rooms\/stores|jobs\/owned_shop)\.webp)$/i.test(path);
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
    ['charcoal burner', 'salt worker', 'lumber handler', 'storehouse laborer', 'peasant laborer'],
  ].map(group => new Set(group.map(norm)));

  function rowPath(row) { return localPath(row?.path); }
  function rowTerms(row) {
    return [row?.role, row?.occupation, row?.label, ...(row?.aliases || []), ...(row?.roleTags || [])]
      .map(norm)
      .filter(Boolean);
  }
  function rangeFor(row) {
    if (Number.isFinite(+row?.ageMin) && Number.isFinite(+row?.ageMax)) return [+row.ageMin, +row.ageMax];
    return AGE_RANGES[norm(row?.ageBand)] || [18, 999];
  }
  function rowRace(row) { return norm(row?.race || 'human') || 'human'; }
  function rowGender(row) { return row?.gender === 'F' ? 'F' : 'M'; }
  function fullBodyRow(row) {
    const path = rowPath(row);
    return !!path && !removedHeadPath(path) && row?.fullBody !== false;
  }
  const allRows = [];
  const seenPaths = new Set();
  for (const row of [...LIVING.registry, ...CURATED.registry, ...(KNIGHTS?.registry || [])]) {
    const path = rowPath(row);
    if (!fullBodyRow(row) || seenPaths.has(path)) continue;
    seenPaths.add(path);
    allRows.push({...row, path});
  }
  const rowByPath = new Map(allRows.map(row => [row.path, row]));

  function genderOf(person) {
    try { return CURATED.genderOf?.(person) === 'F' ? 'F' : 'M'; }
    catch (_) { return person?.gender === 'F' ? 'F' : 'M'; }
  }
  function raceOf(person, context = {}) {
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
    return norm([person?.role, person?.rank, person?.title, person?.portraitRole, person?.category, person?.job, person?.order].filter(Boolean).join(' '));
  }
  function groupsFor(terms) {
    const joined = Array.isArray(terms) ? terms.join(' ') : text(terms);
    const found = new Set();
    ROLE_GROUPS.forEach((group, index) => {
      if ([...group].some(term => phrase(joined, term) || phrase(term, joined))) found.add(index);
    });
    return found;
  }
  function roleScore(person, row) {
    const role = norm(person?.role || person?.rank || person?.title);
    const body = roleText(person);
    const terms = rowTerms(row);
    if (role && terms.some(term => term === role)) return 3200;
    if (terms.some(term => phrase(body, term) || (role && phrase(term, role)))) return 2850;
    const personGroups = groupsFor([role, body]);
    const rowGroups = groupsFor(terms);
    if ([...personGroups].some(group => rowGroups.has(group))) return 2050;
    const ignored = new Set(['master', 'skilled', 'adult', 'young', 'older', 'male', 'female', 'worker', 'keeper']);
    const tokens = new Set(body.split(' ').filter(token => token.length > 3 && !ignored.has(token)));
    const overlap = terms.flatMap(term => term.split(' ')).filter(token => tokens.has(token)).length;
    return overlap ? 700 + overlap * 120 : 0;
  }
  function ageScore(age, row) {
    const [minimum, maximum] = rangeFor(row);
    const distance = age < minimum ? minimum - age : age > maximum ? age - maximum : 0;
    return Math.max(250, 5000 - distance * 300);
  }
  function select(person, context = {}) {
    const gender = genderOf(person);
    const race = raceOf(person, context);
    const age = ageOf(person, context);
    const minor = age < 18;
    const serviceKnight = !!KNIGHTS?.serviceKnight?.(person);
    const role = roleText(person);
    let candidates = allRows.filter(row => {
      if (rowGender(row) !== gender || rowRace(row) !== race) return false;
      const [minimum, maximum] = rangeFor(row);
      const rowMinor = maximum < 18;
      if (rowMinor !== minor) return false;
      if (!serviceKnight && /knight|cataphract|lancer|cavalier/.test(norm(rowTerms(row).join(' '))) && !/knight|cataphract|lancer|cavalier/.test(role)) return false;
      return true;
    });
    if (!candidates.length) {
      candidates = allRows.filter(row => rowGender(row) === gender && (rangeFor(row)[1] < 18) === minor);
    }
    if (!candidates.length) return null;
    const key = `${person?.id || ''}|${person?.name || ''}|${person?.role || ''}|${person?.location || context.location || ''}`;
    return candidates
      .map(row => ({row, score: ageScore(age, row) + roleScore(person, row), tie: hash(`${key}|${row.path}`)}))
      .sort((a, b) => b.score - a.score || a.tie - b.tie || a.row.path.localeCompare(b.row.path))[0]?.row || null;
  }
  function selectForRole(role, descriptor = {}) {
    const target = norm(role);
    const exact = allRows.filter(row => rowTerms(row).some(term => term === target));
    if (exact.length) return exact[hash(`registry|${target}`) % exact.length];
    return select({id: `registry_${target}`, name: role, role, gender: descriptor.gender || 'M', age: descriptor.age ?? 30, race: descriptor.race || 'human'}, descriptor);
  }

  const SPECIAL_REPLACEMENTS = Object.freeze({
    'assets/v38/thrall/nessa_cale_portrait.webp': 'assets/v38/thrall/nessa_cale_encounter.webp',
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
    return typeof markup !== 'string' ? markup : markup.replace(/(?:assets\/(?:workers|dynasty)\/[a-z0-9_.\/-]+|assets\/v29\/portraits\/[a-z0-9_.\/-]+|assets\/v34\/people\/[a-z0-9_.\/-]+|assets\/v38\/thrall\/nessa_cale_portrait\.webp|custom\/npc-portraits\/v168\/00_quartermaster_original_unchanged\.webp)/gi, match => displayPath(match));
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
    if (!needsReplacement(before)) return person;
    if (SPECIAL_REPLACEMENTS[localPath(before)]) {
      if (setPortrait(person, SPECIAL_REPLACEMENTS[localPath(before)])) runtime.repaired++;
      return person;
    }
    if (KNIGHTS?.serviceKnight?.(person)) KNIGHTS.assignOne?.(person);
    if (needsReplacement(pictureOf(person))) {
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
    if (!before || generatedPortraitIsCompatible(person, context)) return person;
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
      if (picture && needsReplacement(picture) && (value.name || value.role || value.gender || Number.isFinite(+value.age))) rows.push([value, context]);
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
    if (!force && state.meta.v1742FullBodyIntegrity?.version === VERSION) return state;
    const started = Date.now();
    const rows = collect(state);
    const before = runtime.repaired;
    for (const [person, context] of rows) repairOne(person, context);
    const repaired = runtime.repaired - before;
    state.meta.v1742FullBodyIntegrity = {
      version: VERSION,
      policy: POLICY,
      checked: rows.length,
      repaired,
      savePreserved: true,
      gameContentRemoved: false,
      obsoletePortraitAssetsRemoved: REMOVED_PERSON_FILES.size,
      elapsedMs: Date.now() - started,
    };
    runtime.scans++;
    runtime.lastMigration = {...state.meta.v1742FullBodyIntegrity};
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
    if (typeof prior !== 'function' || prior.__aetherionFullBody === VERSION) return;
    const next = maker(prior);
    next.__aetherionFullBody = VERSION;
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
  wrapResult('mkPerson');
  wrapGeneratedResult('v10BuildResidents');
  wrapResult('v15MakeCandidate');
  wrapResult('v17BondedStock', {bonded: true});
  wrapResult('v34lLaborCandidate');
  wrapResult('v55Worker');
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
    if (!needsReplacement(result)) return result;
    return select({id: `v16_${norm(role)}`, name: role, role, gender: gender === 'F' ? 'F' : 'M', age: 30}, {})?.path || displayPath(result);
  });
  if (typeof v10WorkerArt === 'function') {
    const workerArt = function (role) {
      return selectForRole(role, {})?.path || 'custom/npc-portraits/v173/009_peasant_laborer_ym.webp';
    };
    workerArt.__aetherionFullBody = VERSION;
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
    globalThis.lwPortrait.__aetherionFullBody = VERSION;
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

  if (typeof document === 'object' && !document.getElementById?.('aetherion-v1742-fullbody')) {
    const style = document.createElement('style');
    style.id = 'aetherion-v1742-fullbody';
    style.textContent = `
      img[src*="custom/npc-portraits/v168/"],img[src*="custom/npc-portraits/v173/"],img[src*="custom/npc-portraits/v1731/"]{object-fit:contain!important;object-position:center!important;background:#080608}
      .entityList>.entity img[src*="custom/npc-portraits/"],.workerPlate img[src*="custom/npc-portraits/"]{width:76px!important;height:114px!important;flex:0 0 76px!important}
      .bigPic[src*="custom/npc-portraits/"],.dynastyPortrait[src*="custom/npc-portraits/"]{object-fit:contain!important;object-position:center!important}
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

  window.AetherionV1742FullBodyIntegrity = Object.freeze({
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

  try {
    const state = liveState();
    if (state?.world && state.meta?.v1742FullBodyIntegrity?.version !== VERSION) {
      repairState(state);
      if (typeof persist === 'function') persist(false);
    }
  } catch (error) {
    console.warn('[Aetherion 1.74.2 full-body migration]', error);
  }
})();
