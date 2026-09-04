# Aetherion Reforged Updates

Public update channel for **Aetherion Reforged**.

The Android updater reads `manifest.json` from this repository. Patch scripts and mobile-sized assets may be served directly from the stable branch; very large binary payloads belong in GitHub Releases.

## Current stable patch — 1.60.0

Valkorion now uses one fitted modular GLB built from the five supplied source models:

- 5 foundation-body regions and 27 independently switchable equipment pieces
- complete Dominus armor and Royal Lord clothing sets
- sword, dagger, bow, quiver, kite shield, thorn whip, necklace, and signet
- strict slot state: an equipment mesh is visible only while its matching item is equipped
- corrected right-hand sword, left-hand shield/whip, left-hip dagger, back bow/quiver, and mirrored armor-boot pair
- preserved character-creator height/frame scaling and save data

The optimized release model is 10.53 MiB. It keeps the fitted positions and triangles intact while using mobile-sized 768 px textures and standard normalized glTF normal/UV packing. Its source-to-slot conversion is reproducible with `tools/build_valkorion_modular_glb.py`; Python dependencies are pinned in `tools/requirements-valkorion.txt`.

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
python3 tests/validate_v160_glb.py
python3 tests/validate_manifest.py
node tests/test_v160_patch.cjs
node --check patches/v1.60.0-valkorion-modular.js
```
