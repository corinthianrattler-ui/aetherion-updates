# Aetherion Reforged Updates

Public update channel for **Aetherion Reforged**.

The Android updater reads `manifest.json` from this repository. Patch scripts and mobile-sized assets may be served directly from the stable branch; very large binary payloads belong in GitHub Releases.

## Current stable patch — 1.63.0

The two final Tripo masters are now one aligned, modular Valkorion wardrobe:

- the new black under-suit human and complete Royal Lord costume share one fitted foundation
- the Dominus armor uses the final chest, separate arming doublet, approved straight helmet and gauntlet pair, fitted back cape, and authored weapons
- 12 named equipment groups control helmet, gorget, pauldrons, cuirass, undercoat, gauntlets, belt, trousers, greaves, boots, cloak, and scabbard
- removing the cuirass reveals the separate gambeson/arming doublet; closed helmets and gauntlets hide only the covered body regions
- the duplicate kit reference body and rejected old single gauntlet are excluded
- all original embedded textures and UV seams are retained through seam-safe optimization
- 4.15 million supplied triangles were reduced to 397,747 triangles and 234,998 vertices in a 10.99 MiB self-contained GLB
- unequipped groups remain hidden and saves remain untouched

The release model is built in two stages so texture seams are never reconstructed by nearest-neighbor UV transfer:

```bash
python3 tools/build_valkorion_final_glb.py \
  --foundation /path/to/Valkorion_Human_And_Royal_Costume.glb.glb \
  --kit /path/to/Valkorion_Complete_Kit_Clean.glb.glb \
  --legacy assets/v108/valkorion_modular.glb \
  --output /tmp/valkorion_full.glb \
  --full-geometry

gltfpack -i /tmp/valkorion_full.glb \
  -o assets/v109/valkorion_final.glb \
  -si 0.09 -se 0.05 -sa -kn -km -ke -vp 16 -vt 16

python3 tools/finalize_valkorion_glb.py assets/v109/valkorion_final.glb \
  --restore-source /tmp/valkorion_full.glb \
  --target-ratio 0.09
```

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
python3 tests/validate_v163_glb.py
node tests/test_v163_patch.cjs
node --check patches/v1.63.0-valkorion-final.js
python3 tests/validate_manifest.py
```
