# Aetherion Reforged v1.74.2 Release Audit

## Release identity

- Android version: `1.74.2`
- Android version code: `197`
- Package: `com.dominus.aetherionreforgey`
- APK: `Aetherion_Reforged_v1.74.2_FULLBODY_BUGFIX_FULL.apk`
- Size: `519,356,685` bytes
- SHA-256: `81d0d1d3fdad0fd06e3a37a25e3d130db336faa673b46188df8cc06de4f945dc`
- Signing-certificate SHA-256: `5e68318c3e12c9f5915976a25bbfd5039a2f7e651682b65744b2747b618c3e77`

This APK was rebuilt directly from the verified 543,684,738-byte v1.74.0 full APK. It uses the same Android package and signing certificate, so it installs over the current app without uninstalling or resetting its private save storage.

## Exact physical removal scope

The new APK has 166 fewer base files:

- 110 obsolete `assets/workers/` head/bust portraits
- 32 obsolete `assets/dynasty/` head portraits
- 15 human bust portraits from `assets/v29/portraits/`; the full-body Moondancer animal art remains
- 4 bust portraits from `assets/v34/people/`; the full-body field quartermaster remains
- 1 v168 original head portrait
- 1 Nessa Cale head portrait; her existing full-body encounter art remains and is now used
- 3 superseded technical updater/build-marker files

That is exactly 163 rejected portrait assets and 3 obsolete technical files. No other base entry was removed.

## Preservation proof

Every v1.74.0 entry outside the exact removal list and the three intentionally replaced control files (`AndroidManifest.xml`, `index.html`, and `asset-manifest.js`) was compared by uncompressed size and ZIP CRC. All are unchanged.

The preserved set includes:

- 361 Piper/neural runtime, voice-model, and native inference entries totaling 114,454,289 uncompressed bytes
- every existing 3D model file
- all 18 video files
- all map art
- all story, systems, mechanics, items, locations, music, sound, and existing full-body character art
- the existing save schema and Android application ID

The APK passes ZIP CRC validation, v1 signature-manifest validation, APK Signature Scheme v2 whole-file verification, signing-identity verification, and native-library alignment checks.

## Portrait behavior proof

The full-game runtime test loads every script from the rebuilt APK and creates the complete starting state. It then tests an old save carrying the prior v1.73/v1.74 migration markers and the exact obsolete worker, dynasty, v29, v34, and Nessa paths.

Results:

- 1,634 live portrait-bearing records inspected
- zero obsolete head/bust or scene-placeholder person references remain
- 390 packaged full-body choices are available to the compatibility selector
- replacement selection respects stored gender, adult/minor status, visual age, race where available, and occupation grouping
- every selected path exists inside the APK
- existing full-body paths are left unchanged
- future resident, labor, recruit, bonded-worker, prisoner, maritime, medicine, and commerce factories are wrapped so the removed head paths cannot return

## UI and update behavior

- The House Dominus Blood Rose dial is baked into the APK, with live sun, blood moon, exact time, moon phases, Wait, and Sleep Until Dawn behavior preserved.
- The update screen now states the actual boundary: a full APK install can replace/remove baked files; downloaded web updates can only add/override downloaded files.
- Downloaded-update cleanup and rollback never touch game saves or packaged APK content.
- Future full APK releases are read from `android/channel.json`; Android still requires the player to open the APK and approve its Update prompt.

## Reproducible publication

The repository stores a 1,398,187-byte zstd reconstruction patch with SHA-256 `965463c23744c29cec4401a5d9ef8e0bd54ad3ea73b312019fd9c5e1b4bff009`. GitHub Actions downloads the verified v1.74.0 APK, reconstructs the exact v1.74.2 APK, checks its size and SHA-256, validates the ZIP, verifies the APK signature, and only then publishes the release asset.
