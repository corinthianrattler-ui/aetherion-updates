# Aetherion Reforged Updates

Public update channel for **Aetherion Reforged**.

The Android updater reads `manifest.json` from this repository. Patch scripts and assets are served directly from the stable branch so Android can fetch them without a release-page redirect.

## Current stable patch — 1.65.0

Version 1.65.0 is a save-safe world economy, shop, and recruitment cleanup:

- guarantees Good Wine Skin at the Corvinus Provisioner, displays it first with an exact 20-silver price, and links Kael's panel directly to the filtered shelf
- repairs the specialist-shop denomination bug that charged and paid ten times the displayed price
- replaces identical 632-item settlement catalogs with finite regional selections of 14–30 goods per specialist while keeping every ordinary classified item available somewhere
- puts all 12 existing court gifts into the Books, Maps & Gifts economy, with the complete selection in Solaris and restored Blood Keep
- excludes issued kit, custom gear, House heirlooms, unique companion equipment, relics, and owner-bound property from ordinary buying and selling
- corrects the ghost `Seals End` key to the real `Seal’s End` location and reconciles affected market, shop, and NPC records
- restores shop search, paging, mobile controls, live stock counts, and delivery to every accessible container, including wagons
- replaces nonexistent book-capital names with eight real licensed study centers and shows exact book prices
- makes Kael recruitment idempotent, reconciles existing duplicates, and restores a missing person or companion record when the save says he was recruited
- removes redundant generated shop rows and purge arrays, reducing audited v70 save state from about 861 KB to about 194 KB without touching player-owned items or progress

The full findings, policy, migration boundaries, and measurements are recorded in `AUDIT_v1.65.0.md`.

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
node --check patches/v1.63.0-valkorion-final.js
node --check patches/v1.64.0-world-ui-integrity.js
node --check patches/v1.65.0-world-economy-cleanup.js
python3 tests/validate_v163_glb.py /path/to/downloaded/valkorion_final.glb
```
