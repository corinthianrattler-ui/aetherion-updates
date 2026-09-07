# Aetherion Reforged v1.68.1 — Startup and Redraw Hotfix Audit

## Release result

Version 1.68.1 repairs the startup and gameplay freeze introduced by the v1.68 portrait integration. It preserves every save and portrait asset and changes only the two JavaScript integrity layers that were repeatedly rescanning the world.

Android version code advances from 183 to 184. No game data, save, item, character, portrait, shop, dialogue, or earlier feature is removed.

## Confirmed cause

The base game calls `migrateState` during `render`. The v1.67 identity layer had wrapped both functions, and v1.68 then wrapped `render`, `migrateState`, `peopleCards`, person portrait rendering, and the daily tick again. Several of those wrappers called the whole-state repair function.

Consequently, one visible refresh could traverse the player, retinue, prisoners, dynasties, permanent NPCs, labor markets, settlement residents, bonded people, surgeons, contacts, and agents multiple times. Each record could then run portrait compatibility and identity work. Larger established saves amplified the cost until the interface appeared frozen.

The deterministic stress reproduction used 1,219 active records. Twenty-five cycles containing one render, one people-list build, and one already-migrated save call produced 91,425 v1.68 portrait-record checks before the repair.

## Repair

- `render` is no longer wrapped by either portrait/identity layer.
- `peopleCards` and the ordinary portrait display path no longer repair records while drawing UI.
- `dailyTick` no longer performs a world-wide portrait pass.
- `migrateState` performs identity or portrait migration only when that layer's version marker is absent or outdated.
- The v1.68 migration has a re-entry guard.
- Existing-state migration remains deterministic and assigns each curated face at most once.
- Actual NPC factory functions remain protected. New residents, settlement candidates, bonded adults, frontier labor, blueprint workers, common people, and prisoners are checked when created.
- Opening a specific person may repair only that one record; it never triggers a full-state repair.
- Newly generated records reserve portraits already claimed by the active world, preserving uniqueness without rewriting other people.

## Save and updater behavior

- A save carrying the v1.68.0 marker runs one v1.68.1 migration after the repaired script is installed.
- After that migration, normal redraws and loads only compare a compact version marker.
- Existing portrait assignments remain stable when compatible.
- Exact named-character art and user-selected portraits remain protected.
- The updater replaces the existing v1.67 and v1.68 script paths in place, so the defective copies cannot remain active beside the repair.
- Devices already on v1.68.0 do not redownload the 111-image portrait library because those hashes are unchanged.

## Validation performed

The automated regression suite proves:

- 1,219-record repeated redraw/list/migration stress performs zero v1.68 portrait-record checks after initial migration
- repeated UI work does not reshuffle stable portrait assignments
- a newly created worker still receives a compatible, unused curated portrait
- wrong sex, age, race, role, and faction remain rejected
- duplicate curated faces remain prohibited
- Quartermaster Halric Morn, Kael, Valkorion, user portraits, and other exact art remain protected
- all 111 portrait files decode and have unique bytes
- all v1.60–v1.68 JavaScript regression suites pass
- every active patch passes JavaScript syntax validation
- every manifest size and SHA-256 hash matches the shipped bytes

Commands:

```bash
for test_file in tests/test_v*.cjs; do node "$test_file"; done
for script_file in patches/*.js; do node --check "$script_file"; done
python3 tests/validate_v168_portraits.py
python3 tests/validate_manifest.py
```
