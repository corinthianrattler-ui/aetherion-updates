# Aetherion Reforged Updates

Public update channel for **Aetherion Reforged**.

The Android updater reads `manifest.json` from this repository. Patch scripts and assets are served directly from the stable branch so Android can fetch them without a release-page redirect.

## Current stable patch — 1.64.0

Version 1.64.0 is a world/UI integrity release for the retinue and logistics screens:

- repairs the saved-gender/model mismatch that could show a named `Ser` with a female body while preserving legitimate `Dame` knights
- assigns the correct unique portrait to Bannerless Knights, Archers, Crossbowmen, Men-at-Arms, Sergeants, Swordsmen, the starting Captain, Lesser Knights, and Footmen
- replaces the reused full-character picture on every service item with 25 exact helmet, mail, clothing, gauntlet, boot, weapon, shield, and accessory images
- restores illustrated personal-equipment slots and formats weights without floating-point garbage
- limits Valkorion's armor-issuance controls to House Dominus while retaining foreign equipment for NPC/world systems
- constrains Wagonwright class pictures to a phone-safe card height
- migrates repaired identities and portraits once without deleting or rebuilding the save

The detailed findings and fixes are recorded in `AUDIT_v1.64.0.md`.

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
node --check patches/v1.63.0-valkorion-final.js
node --check patches/v1.64.0-world-ui-integrity.js
python3 tests/validate_v163_glb.py /path/to/downloaded/valkorion_final.glb
```
