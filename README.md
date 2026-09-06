# Aetherion Reforged Updates

Public update channel for **Aetherion Reforged**.

The Android updater reads `manifest.json` from this repository. Patch scripts and assets are served directly from the stable branch so Android can fetch them without a release-page redirect.

## Current stable patch — 1.66.0

Version 1.66.0 is a save-safe living-world balance and consistency pass:

- caps every ordinary weekly wage at 3 silver and applies a role/skill ladder from 4 copper labor through 30 copper realm-class specialists
- fixes recurring code that restored 12–55 silver wages after migration; Ysabet is now 2s 8c/week and Halric, Libita, and Maevra are 3s/week
- corrects specialist shops to use canonical copper values at the shelf, checkout, resale, item detail, codex, and legacy market
- guarantees five Good Wine Skins at the Corvinus Provisioner, puts wine first, prices it at 6c, makes it drinkable, and retains duplicate-safe Kael recruitment
- reconciles generated names, `Ser`/`Dame`, `Master`/`Mistress`, gender, voice, age, and portrait art across every generated settlement roster
- repairs all missing person and item image references using packaged art, adding no image download
- gives all 1,122 items an explicit visible use, equipment, craft, maintenance, study, commerce, gift, or authored-acquisition route and wires 101 previously unreachable item actions
- preserves private generated conversation, adds public nearby-group conversation with several relevant speakers, and provides a grounded fallback if an awareness provider fails
- replaces canned pseudo-archaic speech with natural medieval dialogue and expands terse narrator events into detailed, consequence-aware accounts
- bounds conversation, worker, mission, and intelligence histories so richer writing does not grow saves indefinitely

The full findings, before/after measurements, wage and price tables, migration boundaries, and remaining recommendation are recorded in `AUDIT_v1.66.0.md`.

## Shop foundation retained from 1.65.0

The 1.65.0 overlay remains active beneath 1.66. It supplies finite regional selections of 14–30 goods per specialist, all 12 court gifts, custom/issued/House gear exclusions, corrected `Seal’s End` records, shop search and paging, delivery to wagons, real study centers, Kael record reconciliation, and compact shop state. Version 1.66 supersedes its old specialist-price calculation with the canonical copper standard. See `AUDIT_v1.65.0.md` for the original cleanup.

## Retinue integrity retained from 1.64.0

The 1.64.0 overlay remains active. It repairs Bannerless identity/model coherence, every formation portrait, all 25 individual service-equipment images, illustrated personal-equipment slots, weight formatting, House Dominus issuance authority, and mobile Wagonwright image sizing. See `AUDIT_v1.64.0.md` for its detailed audit.

## Valkorion model retained from 1.63.3

The two final Tripo masters are delivered as one aligned, modular Valkorion wardrobe without the destructive v1.63.0 simplification:

- the black under-suit human and complete Royal Lord costume share one fitted foundation
- the Dominus armor includes the final chest, separate arming doublet, approved straight helmet and gauntlet pair, fitted back cape, and authored weapons
- all 54 fitted pieces retain their 35 independent foundation/equipment groups
- removing the cuirass reveals the separate gambeson/arming doublet; closed helmets and gauntlets hide only the covered body regions
- all embedded textures and UV seams are retained
- the validated 892,522-vertex, 752,438-triangle model is delivered as one 36.87 MiB raw GitHub asset
- unequipped groups remain hidden and saves remain untouched

The updater downloads the full-detail GLB directly from the stable raw GitHub path, verifies its exact SHA-256 checksum, and installs it at the normal managed asset path. Version 1.63.3 replaces the release-download address that Android could not fetch; the model bytes are unchanged. The smaller malformed v1.63.0 file is no longer active.

## Update model

The game compares the installed SHA-256 hash for each managed file against the current manifest. Only changed files are downloaded. Save data is never part of an update payload.

The Android APK is replaced only when the native Android shell/updater itself changes. Ordinary JavaScript, art, models, audio, video, and game data are delivered as external content patches.

## Stable URLs

Manifest:
`https://raw.githubusercontent.com/corinthianrattler-ui/aetherion-updates/main/manifest.json`

Managed payloads use raw stable-branch URLs under this repository.

## Safety

Every payload entry must include its exact byte size and SHA-256 hash. The updater downloads to a staging area, verifies the hash, then replaces the installed file. Failed verification leaves the previous working file untouched.

Release checks:

```bash
python3 tests/validate_manifest.py
node tests/test_v163_patch.cjs
node tests/test_v164_patch.cjs
node tests/test_v165_patch.cjs
node tests/test_v166_patch.cjs
node --check patches/v1.63.0-valkorion-final.js
node --check patches/v1.64.0-world-ui-integrity.js
node --check patches/v1.65.0-world-economy-cleanup.js
node --check patches/v1.66.0-living-world-balance.js
python3 tests/validate_v163_glb.py /path/to/downloaded/valkorion_final.glb
```
