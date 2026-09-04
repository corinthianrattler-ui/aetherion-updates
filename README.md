# Aetherion Reforged Updates

Public update channel for **Aetherion Reforged**.

The Android updater reads `manifest.json` from this repository. Patch scripts and mobile-sized assets may be served directly from the stable branch; very large binary payloads belong in GitHub Releases.

## Current stable patch — 1.62.0

Valkorion's newly supplied Tripo fitted master replaces the malformed v1.61 armor while retaining the existing foundation, Royal Lord set, and weapons:

- 47 authored armor fragments retain their original shared scale and positions
- 12 named equipment groups control helmet, gorget, pauldrons, cuirass, undercoat, gauntlets, belt, trousers, greaves, boots, cloak, and scabbard
- the complete equipped set presents the intact armored master without the old body showing through
- partial outfits keep the foundation underneath the supplied surface fragments, preventing body-shaped gaps
- original black, red, and metal PBR textures remain embedded
- the source armor was optimized for mobile and merged with preserved Royal Lord and weapon meshes into an 11.66 MiB GLB
- unequipped groups remain hidden and saves remain untouched

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
python3 tests/validate_v162_glb.py
node tests/test_v162_patch.cjs
node --check patches/v1.62.0-valkorion-fitted.js
python3 tests/validate_manifest.py
```
