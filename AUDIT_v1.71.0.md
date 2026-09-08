# Aetherion Reforged 1.71.0 character-model audit

## Live mapping

Version 1.71.0 replaces the single v1.70 wardrobe model with the user's three
approved fitted exports:

- **Valkorion base body:** the ten `HUMAN_PART_*` nodes from
  `assets/v171/valkorion-base-lord.glb`.
- **Valkorion Lord's royal armor:** all 23 aligned body, royal-costume, and
  gothic-jewelry nodes from that same GLB.
- **Valkorion complete armor:** all 40 assembled body/armor, helmet, cape, and
  weapon nodes from `assets/v171/valkorion-armored.glb`.
- **Libita Savitas:** all 28 aligned body and gown nodes from
  `assets/v171/libita-gothic-gown.glb`, mounted only when Libita's person or
  equipment modal is opened.

The player wardrobe derives its mode from the existing equipment state. Base
and Lord mode share one loaded GLB and switch named-node visibility without
moving any mesh. Entering or leaving complete armor disposes the previous
viewer before loading the other fitted source. Existing saves are not rewritten.

## Eggshell/seam protection

Direct CPU previews were made from the exact release bytes before integration.
Each source rendered as one aligned figure. The base visibility subset rendered
as a complete clothed body rather than disconnected shells.

The complete-armored source exceeded the 100 MB upload ceiling by 5,754,764
bytes. Its body, armor, helmet, cape, materials, textures, UVs, named nodes, and
authored transforms were left untouched. Re-export removed container overhead;
the only simplification was a 0.99 modifier on the six weapon meshes. Total
triangles changed from 2,865,875 to 2,860,055 (0.203%), while all 40 fitted part
names and the scene `ROOT` were preserved. The final armored GLB is 99,848,008
bytes.

## Runtime behavior

`patches/v1.71.0-character-models.js`:

- supersedes the v1.70 viewer without leaving its WebGL canvas alive;
- resolves all three paths through the safe updater's trusted asset map;
- validates `ROOT` and the expected 23, 40, or 28 fitted parts before showing a
  viewer;
- starts each newly supplied model on its authored front and retains drag/touch
  rotation plus the existing front-reset control;
- keeps the two-dimensional portrait and wardrobe usable if WebGL or a remote
  model fails;
- gives Libita a bounded, on-demand 3D card rather than scanning or loading 3D
  models during ordinary people-list redraws.

## Validation

- `tests/validate_v171_models.py` checks GLB 2.0 headers, exact bytes and hashes,
  scene hierarchy, unique part names, mode-specific node counts, triangle
  counts, materials, image counts, missing normal-map bindings, absence of skins
  and animations, and the strict sub-100,000,000-byte limit.
- `tests/test_v171_character_models.cjs` exercises base/Lord reuse, complete-
  armor replacement, visibility maps, front angles, viewer disposal, Libita's
  modal mount, and the non-persistent model hint on her saved person record.
- `tests/test_v171_channel.cjs` verifies the inline patch checksum and all three
  trusted raw-GitHub asset routes.
- All retained JavaScript, portrait, tournament, updater, and manifest
  regression tests pass unchanged unless explicitly version-advanced for this
  release.

## Android build 188 update access

The full v1.71 APK carries the three character GLBs locally and replaces the
menu-dependent updater entry with a permanent update launcher. The gold
**Game Updates** button remains fixed above the Systems bar; matching controls
remain available from the Opening Menu and Systems dock. Its update screen
shows the exact GitHub Contents endpoint, live received bytes and percentage,
verification, installation, and restart status.

`tests/test_v171_update_center.cjs` verifies every route and visible transfer
state. The finished APK is ZIP/CRC checked, retains aligned uncompressed native
libraries and resources, and is signed using both JAR signing and APK Signature
Scheme v2. Independent whole-file verification reports `v2 verified`.
