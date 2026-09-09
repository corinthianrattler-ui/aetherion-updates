# Aetherion Reforged 1.72.4 repair verification

## Result

Android build 193 repairs the native loader defect that made build 192 unable
to resolve versioned packaged files. The final APK was tested as an archive and
as an extracted runtime; source-only checks were not treated as proof.

## Native startup repair

- `AetherionAssetClient.openAsset` now retains a found `?` or `#` index and
  strips the suffix before calling `AssetManager.open`.
- All 135 local startup references in the final index resolve to packaged APK
  entries. The broken build resolved only the one reference without a query.
- DEX SHA-1 and Adler-32 headers were rebuilt and verified after the native
  bytecode repair.
- WebView uses `LOAD_DEFAULT` and no longer calls `clearCache(true)` at every
  launch.
- APK Signature Scheme v1 entry digests and the v2 whole-file signature pass.

## Runtime and performance

| Check | Broken build 192 | Build 193 |
| --- | ---: | ---: |
| Eager startup JavaScript | about 9.71 MB | 2.47 MB |
| One already-current state migration | about 2.5 s | 0.16 ms |
| Continue harness | 4.16 s | 0.221 s |
| Trade screen render | 3.83 s | 0.173 s |
| Startup script failures | 0 when loader bypassed | 0 |

The 6.64 MB WebLLM bundle remains packaged but loads only when offline
awareness is requested. The 602 KB Three.js viewer remains packaged but loads
only when a character-model screen needs it. The redundant full-document
observer is disconnected, current Trade views read the already-built local
merchant roster instead of rebuilding all world workers, and long recipe,
worker, dynasty, and entity lists use browser rendering containment.

Fresh-world construction still takes roughly 6.6–7.1 seconds in the container
harness because the complete world is created through every historical system.
It is not falsely reported as instantaneous.

## Whole-game sweep

| Check | Result |
| --- | ---: |
| Game files | 2,739 passed |
| Uncompressed game bytes | 404,586,209 |
| JavaScript files | 122 syntax passed |
| Raster images | 2,305 decoded |
| JSON files | 4 parsed |
| Audio/video files | 124 probed |
| APK entries | 3,118 unique, CRC passed |
| Major tabs rendered | 36/36 |
| Missing visible handlers | 0 |
| Duplicate rendered IDs | 0 |

The initial render sweep covers Story, Character, Equipment, Inventory, Party,
Army, Holdings, Build, Craft, Trade, Map, Relations, Politics, Codex, Logs,
Save, Settings, Tournaments, Intelligence, Duel, Frontier, Logistics, Maritime,
Realms, Skills, Activities, Medicine, Books, Kael, Workforce, News, Dynasty,
Bloodcraft, Faith, Quests, and Dragon. It does not pretend that every possible
late-game outcome was physically played.

## Character models

| Packaged model | Parts | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Valkorion base/Lord | 23 | 15,208,480 | `ce3dfbb8e002f4f4a311d29d72120d7bd1541b28c77df80fd2a03a676794ddfc` |
| Valkorion complete armor | 40 | 30,056,648 | `8f3b4b538c16434f919037eb880c301ae50b15bb35ad8856b8bba203655d9e21` |
| Lady Alexus gothic gown | 28 | 30,457,220 | `6a5dbb1b0de94e327a5e853292989e747fb20931c9cd7dea34992f0181e00988` |

Model headers, buffer ranges, indices, embedded images, fitted-part counts, and
double-sided materials pass. The integration harness switches base, Lord, and
armor states and mounts Lady Alexus. Actual phone GPU/WebView behavior remains
the physical-device boundary, so the live screen reports `BUILD 193 · 3D
READY` or exposes the real loading error instead of silently presenting the
flat portrait as success.

## APK identity

| Field | Value |
| --- | --- |
| Package | `com.dominus.aetherionreforgey` |
| Version | `1.72.4` |
| Android version code | `193` |
| APK bytes | `479,189,462` |
| APK SHA-256 | `da5a55da228dcabf15bb00935881b983ef948ba665abe0db6f2d65d5adcbeee1` |
| Signing certificate SHA-256 | `ca8042f4758d9a056eb0748edfaad0cfd8a436ea7d35907c28b32c3f3afd5eb8` |
