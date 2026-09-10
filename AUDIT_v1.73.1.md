# Aetherion Reforged v1.73.1 Audit

## Scope

This staged web update repairs the repeated cropped-head pictures in the
twenty-person starting knight retinue, improves full-body roster presentation,
and removes two measured sources of repeated work. It targets the verified
v1.72.6 Android build 195 and does not replace the APK or reset saves.

## Root cause

The base game creates one company captain and nineteen lesser knights with the
same generic unit picture. The v1.67 identity layer later replaced that generic
picture with age-banded dynasty headshots. Although v1.73.0 contained four
full-body `Bannerless Knight` portraits, its allegiance gate required an
explicit `bannerless` flag. The starting records did not consistently carry
that flag, and only one picture existed for each matching gender/age band.
An older v1.66 compatibility wrapper also ran its whole-world identity repair
from `v12UpgradeState` during every render. That routine classified the newer
remote occupation portraits as generic and changed them back to dynasty heads.
The v1.67 `v10UpgradeState` and `v14UpgradeState` wrappers added further
whole-population and labor-market scans on the same redraw path.

The visible result was a roster in which many separately named people shared
the same large face crop.

## Portrait repair

- Twelve new 512×768 WebPs were created specifically as full-body, bannerless
  lesser knights: four young men, four older men, two young women, and two older
  women.
- The structured generation briefs required one continuous head-to-boots
  figure, practical worn equipment, no heraldry, no text, and visibly distinct
  faces, builds, hair, armor, weapons, and poses.
- The four compatible full-body `Bannerless Knight` portraits from v1.73.0
  remain in the pool. This produces five choices for each male age band and
  three choices for each female age band.
- A one-time migration marks the unconverted starting retinue as bannerless,
  groups members by stored gender and visual age, and distributes each group
  evenly. The normal twenty-person starting roster receives ten distinct
  full-body identities, with an age-weighted maximum reuse of three.
- New knights and later role changes are handled one person at a time. Ordinary
  rendering performs no portrait repair or world scan.
- Canonical, named, user-supplied, and custom-companion art remains protected.
  Dominus-converted personnel are excluded from bannerless routing.
- Leaving a bannerless knight role releases v1.73.1 art back to the existing
  occupation router, preventing stale knight art on unrelated roles.
- If one new remote file cannot load, its matching v1.73.0 full-body knight is
  tried before the established packaged-image recovery path.

These portraits represent existing military jobs. No duplicate or artificial
job was added: company captain, lesser knight, hiring, wages, mounts, formation
roles, rank changes, combat losses, and Dominus oath conversion already have
persistent mechanics in the game.

## Presentation and performance

- Curated knight thumbnails use `object-fit: contain` in a 2:3 frame, so the
  full figure is visible instead of being cropped into a headshot.
- Roster images use native lazy loading, asynchronous decoding, and low fetch
  priority.
- The v1.67 card renderer previously called identity repair for every person on
  every list redraw. The replacement renderer preserves the same name, role,
  rank, gender, age, life stage, HP, morale, loyalty, order, click behavior, and
  dead-state output without mutating records during rendering.
- Once the current save has completed migration, the old v10, v12, and v14
  schema-upgrade wrappers no longer rerun from their historical render hooks.
  The lightweight v12 path still keeps Lady Alexus with the party. This stops
  the v1.66/v1.67 identity routines from overwriting current curated art and
  avoids hundreds of record visits per redraw.
- The staffed-commerce initializer now uses the owned-shop signature. Unchanged
  shops return their established state immediately; a newly acquired shop still
  runs the full worker-creation path once.
- v1.73.0 previously rechecked settlement residents, labor markets, surgeons,
  rural structures, and recruit settlements whenever `ensureState` ran,
  including daily ticks and services. Those structural checks now run once per
  save version. The conditional Dominus banker remains dynamically created when
  that bank is founded.
- Portrait compatibility selection now evaluates each candidate once instead
  of two or three times.

No character, job, mechanic, item, location, story record, art from earlier
releases, or save data was removed. The cleanup bypasses only redundant repeated
work.

## Verification contract

The release is accepted only when all of the following pass:

- all 12 new WebPs decode, are exactly 512×768, have unique decoded-pixel
  hashes, and match their registry gender/age/role tags;
- all 95 scripts from the extracted full game load before the staged modules;
- a fresh game creates all 20 starting knights with matching full-body art,
  ten unique pictures, no dynasty/unit headshot paths, and bounded reuse;
- a synthetic existing save containing 20 cloned dynasty headshots migrates to
  the same valid distribution;
- female and older/younger routing, custom-art protection, role mutation, and
  save idempotence pass;
- repeated roster renders perform zero identity repairs, and repeated daily
  state checks perform zero additional structural passes;
- the existing v1.73.0 resident, worker, recruit, youth, rural-production,
  banking, portrait-audit, and migration regressions still pass;
- every manifest payload matches its exact byte size and SHA-256 digest;
- the six-module channel remains below the installed updater's 100,000-byte
  limit and verifies and stages through the build-195 safe updater.

## Verification results

All release checks passed on 2026-09-10:

- 12/12 new WebPs decoded at 512x768 with unique decoded-pixel hashes and
  matching gender, visual-age, role, bannerless, and full-body registry tags;
- all 280 staged portrait assets decoded, and the wider v1.73.0 catalog kept
  all 268 files unique;
- the extracted v1.72.6 game loaded all 95 packaged scripts before the staged
  modules and passed fresh-state, cloned-save, migration, role-change, redraw,
  resident, recruit, production, banking, and view assertions;
- the starting twenty-person retinue received ten unique compatible full-body
  portraits, with no dynasty/unit headshot paths and maximum reuse of three;
- normal roster, schedule, render, migration, and unchanged-commerce calls
  performed no additional legacy identity scans or structural setup passes;
- the earlier v1.66, v1.67, v1.68.1, v1.72.4, v1.72.6, v1.72.7, v1.72.8,
  and v1.72.10 regression suites remained green;
- every one of the 454 manifest payload entries matched its byte size and
  SHA-256 digest; and
- the generated six-module channel was 97,601 bytes and staged successfully
  through the build-195 updater, remaining under its 100,000-byte limit.
