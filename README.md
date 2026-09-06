# Aetherion Reforged Updates

Public update channel for **Aetherion Reforged**.

The Android updater reads `manifest.json` from this repository. Patch scripts and mobile-sized assets may be served directly from the stable branch; very large binary payloads belong in GitHub Releases.

## Current stable patch — 1.63.1 rollback

The active manifest removes the over-compressed v1.63.0 Valkorion release and restores the last working Dominus presentation. Devices that installed v1.63.0 receive this rollback as v1.63.1 so the updater treats it as a newer patch.

The v1.63.0 files remain in repository history for diagnosis only and are not part of the active payload set. The replacement will retain the high-detail fitted model and use a delivery method that does not require destructive mesh simplification. Save data remains untouched.


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
python3 tests/validate_manifest.py
node --check patches/v1.59.2-dominus-art-fix.js
```
