# Aetherion Reforged 1.72.3 full-game audit

## Result

Android build 192 is a real, update-compatible APK. It corrects the update path,
mounts the supplied character models on the live game screens, repairs every
invalid packaged file found by the scan, and makes native/model state visible
inside the app.

## Confirmed causes of “nothing changed”

1. The 1.72.2 stable channel downloaded only a small JavaScript update-center
   module and no assets. The old update center then labeled that staged web
   patch “installed and ready,” even though it could not replace the Android
   package, native WebView shell, or bundled GLBs.
2. The app did not prove which native APK was installed. A staged update-center
   script could display version 1.72.2 while running over an older Android
   package, leaving the flat portrait fallback onscreen.
3. The Character screen itself retained the historical flat portrait. The 3D
   controller was restricted to Equipment. Build 192 creates and verifies a 3D
   host on both Character and Equipment without a page-wide observer.
4. Two legacy WebP angle frames were zero-byte files:
   `assets/v41/valkorion/wraith_0.webp` and
   `assets/v44/valkorion/wraith_3.webp`. Both are now valid images.
5. The title menu could cover an opening film without clearing its internal
   active flag. Continue loaded the timeline but the guarded renderer then
   discarded the render call. Build 192 cancels that timer/video state before
   showing the title menu or continuing.

## Update behavior in build 192

- A bundled native sentinel proves that version 1.72.3 / build 192 is actually
  installed. A staged JavaScript module cannot forge the file on an older APK.
- Game Updates says `OLDER APK DETECTED` when the sentinel is missing.
- `CHECK FOR UPDATE` downloads and verifies only the small update index and says
  so. It never calls that an APK installation.
- A release marked `requiresApk`, or with a higher Android build number, cannot
  be staged as a web patch.
- The exact build-191 updater was tested against the 1.72.3 channel: it verifies
  and stages the bounded handoff module, which replaces the old fixed 1.72.2
  link with the real build-192 APK path after restart.
- `DOWNLOAD FULL APK` opens the real Android package. Android's own installer
  then asks the user to approve the update.
- The wardrobe shows `BUILD 192 · 3D READY` only after the GLB has been read,
  parsed, validated, and mounted. Loading and error states are distinct.

## Full packaged-game scan

| Check | Result |
| --- | ---: |
| Game files | 2,733 passed |
| Uncompressed game bytes | 404,503,940 |
| HTML/CSS local references | 149 resolved |
| JavaScript syntax | 117 files passed |
| Raster image decode | 2,305 files passed |
| JSON parse | 3 files passed |
| Audio/video probe | 124 files passed |
| Zero-byte files | 0 |
| Case-colliding paths | 0 |
| APK archive entries | 3,112 unique, CRC passed |

## Character model verification

| Packaged GLB | Nodes | Meshes | Materials | Bytes | SHA-256 |
| --- | ---: | ---: | ---: | ---: | --- |
| `valkorion-base-lord.glb` | 24 | 23 | 23 | 15,208,480 | `ce3dfbb8e002f4f4a311d29d72120d7bd1541b28c77df80fd2a03a676794ddfc` |
| `valkorion-armored.glb` | 41 | 40 | 40 | 30,056,648 | `8f3b4b538c16434f919037eb880c301ae50b15bb35ad8856b8bba203655d9e21` |
| `alexus-gothic-gown.glb` | 29 | 28 | 28 | 30,457,220 | `6a5dbb1b0de94e327a5e853292989e747fb20931c9cd7dea34992f0181e00988` |

All GLB headers, declared lengths, JSON/BIN chunks, buffer views, model roots,
and required fitted-part counts passed. No mesh simplification was introduced.
The files retain shape-preserving `KHR_mesh_quantization`; all three stay below
the 50 MB Tripo/mobile target.

The complete packaged page was then executed with its actual script order and
actual GLB bytes. The live DOM test passed these states:

- Equipment / complete armor: 40 fitted parts, canvas mounted, 3D ready.
- Character / complete armor: 40 fitted parts, canvas mounted, 3D ready.
- Base body: 23-part source, 10 human/body parts visible.
- Lord's royal set: all 23 aligned parts visible.
- Native package check: build 192 sentinel verified.
- Continue: stored timeline opened the live game shell and retired the blocked
  opening-film state.

Lady Alexus uses the same validated 28-part gown model and releases the larger
Valkorion viewer before mounting, keeping mobile GPU use bounded. Model source
buffers are released after parsing, pixel ratio is capped at 1.25, and no
continuous mutation observer or idle render loop was added.

## Controls and startup

- Continue retires the hidden opening-film guard, parses, migrates, activates,
  and renders the stored timeline through one guarded path; a real error is
  displayed when opening fails.
- The obsolete floating gold update control remains removed.
- Game Updates remains inside the opening menu and Systems dock.
- Android tap highlighting is transparent; pressed buttons do not flash blue.
- The opening menu identifies `v1.72.3 · Android build 192 · Native 3D models`.

## APK identity and signing

| Field | Verified value |
| --- | --- |
| Package | `com.dominus.aetherionreforged` |
| Version | `1.72.3` |
| Android version code | `192` |
| APK bytes | `479,161,471` |
| APK SHA-256 | `411878ce5ac4f4c73ef62a75de085bd3af1847b5e29479ab88ac7a48f841bb0a` |
| Signing certificate SHA-256 | `CA:80:42:F4:75:8D:9A:05:6E:B0:74:8E:DF:AA:D0:CF:D8:A4:36:EA:7D:35:90:7C:28:B3:2C:3F:3A:FD:5E:B8` |
| Signature verification | v1 CMS/entry digests passed; v2 whole-file RSA digest passed |

The certificate exactly matches build 191, so Android can install build 192 as
an update over that app rather than as an unrelated application.

## Physical-device boundary

The package, native route, DOM mounting, and model bytes are verified here. A
container cannot emulate the exact GPU/WebView driver on the user's phone.
Build 192 therefore exposes that last device-specific result directly: the
wardrobe shows `3D READY` after a successful GPU mount or `3D ERROR` with the
actual reason. It no longer hides either case behind a flat portrait.
