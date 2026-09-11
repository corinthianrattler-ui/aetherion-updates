# Aetherion Reforged v1.74.0 maintenance audit

## Release identity

- Android package: `com.dominus.aetherionreforgey`
- Version name/code: `1.74.0` / `196`
- APK bytes: `543684738`
- APK SHA-256: `08791fdc068bcfa6a1809961dc01954c3f1d614cf5a684f4b33fd2308be0d3c7`
- Signing-certificate SHA-256: `5e68318c3e12c9f5915976a25bbfd5039a2f7e651682b65744b2747b618c3e77`
- Verified base: v1.72.6, `499039030` bytes,
  SHA-256 `2fd692cb05cb163e5bde55abfae8789c3131e15e956831921abe07f905f2c645`

The binary Android manifest differs from v1.72.6 only at version name and
version code. The package ID, native code, permissions, resources, and signing
identity are unchanged.

## Preservation boundary

Every v1.72.6 archive entry is present with the same uncompressed size and CRC,
except:

- `AndroidManifest.xml` and `assets/game/index.html`, which carry the new build
  identity/startup graph;
- 31 historical patch files that the startup document does not reference; and
- four obsolete native-build marker JSON files replaced by the build-196 marker.

This comparison covers the full offline Piper/LibriTTS model and eSpeak data,
`libonnxruntime.so`, `libsherpa-onnx-jni.so`, every 3D model, map, sound, film,
story/system script, and existing art asset. None changed. Native shared
libraries retain 4096-byte APK alignment.

## Portrait and time correction

- 268 living-world portraits and 12 purpose-built bannerless-knight portraits
  are packaged locally at 512×768.
- The old living-portrait error handler that converted failed full-body art to
  dynasty headshots is not installed.
- Existing saves are scanned once under the v1.74.0 migration marker. Roster
  redraw does not run a whole-world repair pass.
- Generic service knights are balanced across compatible full-body gender/age
  entries. Named/custom art remains protected.
- A failed new portrait retries a full-body local/update route and ultimately
  shows the neutral Dominus rose, never a cloned person.
- The sky dial uses a normal flex item in the topbar. The obsolete absolute
  `top:160px` override is absent.
- Seasonal sleep-to-dawn, explicit waiting, moon phases, wakefulness, camp
  action time, five supplied films, and Watch Post guard requirements passed
  the packaged runtime test.

## Updater cleanup model

Build 196 replaces the local-storage source bundle with a signed, cumulative
schema-2 channel:

- content-addressed blobs deduplicate unchanged payloads;
- manifests can add/replace assets, add extensions, retire payload IDs, and
  tombstone safe `assets/` or `custom/` paths;
- only active plus one previous release are retained;
- orphan and superseded downloaded blobs are garbage-collected at boot, check,
  install, and manual cleanup;
- the three exact legacy updater state keys and one session key are removed;
- the autosave key and all game saves are outside the update database and never
  accepted as deletion targets.

APK-baked files can only be physically removed in a full APK like this one.
Small GitHub updates can retire routing and delete their own downloaded data;
the next full maintenance APK can then omit those proven-dead baked files.

## Tests passed

- full 96-script packaged-game boot and fresh state
- marked clone-head save migration and portrait diversity audit
- no portrait repair scans during roster redraw, schedule, render, or unchanged
  commerce setup
- 268/268 catalog portraits decoded and unique
- 12/12 generated knights decoded and tag-matched
- five distinct H.264/AAC films and five matching WebP posters
- updater signature, safe-path, add/replace/delete, rollback, deduplication,
  legacy cleanup, and garbage-collection tests
- cumulative update-builder inheritance, retirement, deletion, and signature
- APK CRC, v1/v2 signature, identical signer, native alignment, all startup
  references, exact base-content preservation, and exact GitHub reconstruction

The release delta reconstructs the APK byte-for-byte from the verified v1.72.6
GitHub release. Delta bytes: `45629755`; delta SHA-256:
`48f926e1cc59f1f1488256ef8f40f71516e0e1969eb2f7a5f82842f7fe11d181`.
