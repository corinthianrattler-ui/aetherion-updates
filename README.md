# Aetherion Reforged Updates

Public update channel for **Aetherion Reforged**.

The Android updater reads `manifest.json` from this repository. Patch scripts and mobile-sized assets may be served directly from the stable branch; very large binary payloads belong in GitHub Releases.

## Current stable patch — 1.61.0

Valkorion's supplied body and equipment have been rebuilt as one modular GLB:

- intact foundation body preserved at its authored proportions and coordinate system
- 6 shared-coordinate body visibility regions, including separate hands for clean gauntlet swaps
- 27 independently switchable equipment pieces across the Dominus armor and Royal Lord sets
- sword, dagger, bow, quiver, kite shield, thorn whip, necklace, and signet
- strict slot state: a mesh appears only while its matching item is equipped
- covered foundation regions hide without creating a second body or stretching body parts
- one shared transform for the Royal coat body, shoulders, and lower sleeves
- authored two-boot meshes retained without mirroring or duplicate feet

The optimized release model is 10.80 MiB with mobile-sized textures. The source-to-slot conversion is reproducible with `tools/build_valkorion_modular_glb.py`; Python dependencies are pinned in `tools/requirements-valkorion.txt`. Existing saves remain untouched.

## Update model

The game compares the installed SHA-256 hash for each managed file against the current manifest. Only changed files are downloaded. Save data is never part of an update payload.

The Android APK is replaced only when the native Android shell/updater itself changes. Ordinary JavaScript, art, models, audio, video, and game data are delivered as external content patches.

## Stable URLs

Manifest:
`https://raw.githubusercontent.com/corinthianrattler-ui/aetherion-updates/main/manifest.json`

Release assets will use GitHub Releases under this repository.

## Safety

Every payload entry must include its exact byte size and SHA-256 hash. The updater downloads to a staging area, verifies the hash, then replaces the installed file. Failed verification leaves the previous working file untouched.

Release checks:

```bash
python3 tests/validate_v161_glb.py
node tests/test_v161_patch.cjs
node --check patches/v1.61.0-valkorion-modular.js
python3 tests/validate_manifest.py
```
