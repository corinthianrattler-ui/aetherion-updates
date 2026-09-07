# Aetherion 1.70.0 visual assets

The three PNG files in this directory are the final tournament scenes bundled in Android build 187.

The finished character model is bundled inside the APK at `assets/game/assets/v170/valkorion-complete-kit.glb`. Its source artifact is `Valkorion_Complete_Kit_Clean.glb.glb`:

- size: `106006128` bytes
- SHA-256: `484976e440f38feb0b7403a0f1be069789399c169c3b1b2647acd45b5f12f0aa`
- structure: one `ROOT` node with 40 assembled mesh children

The GLB is intentionally APK-only because it is larger than GitHub's ordinary 100 MiB single-file repository limit. The old simplified model and the exploded `Valkorion_Human_And_Royal_Costume` export are not loaded by version 1.70.0.
