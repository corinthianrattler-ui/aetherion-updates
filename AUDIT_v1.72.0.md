# Aetherion Reforged v1.72.0 repair audit

Android build 189 repairs the visible v1.71 regressions rather than adding new
gameplay systems.

## Corrected

- Continue now reads, migrates, activates, and renders the selected timeline
  through one guarded path.
- The floating gold Game Updates control is removed. Game Updates remains in
  the Opening Menu and Systems dock.
- Android's blue tap highlight is disabled, with keyboard focus kept visible.
- Three whole-document mutation observers are removed from the bundled route.
- The character viewer no longer runs a permanent 24 FPS idle loop or recomputes
  multi-million-vertex framing bounds after each game redraw.
- Model synchronization is coalesced to one pending frame, and the renderer is
  capped at a 1.25 device-pixel ratio on mobile.
- Valkorion's base/Lord model, Valkorion's complete armor, and Lady Alexus's gown
  model are bundled locally in mobile-ready form.

## Model integrity

All 91 fitted parts remain present: 23 base/Lord parts, 40 complete-armor parts,
and 28 Lady Alexus/gown parts. Their names, hierarchy, scene roots, node transforms,
materials, and textures match the supplied files. Bounded-error simplification
reduces their combined size by 55.9%, from 234,686,708 to 103,423,728 bytes.

## Verification

- JavaScript syntax checks pass for all four v1.72 patches.
- Runtime tests cover Continue interception, menu-only update access, tap styling,
  coalesced model synchronization, mode switching, and viewer disposal.
- GLB tests verify exact hashes, fitted-part contracts, triangle primitives,
  buffer bounds, material/image counts, scene roots, and the 50 MB per-file cap.
- The final APK is CRC-tested, manifest-digest tested, and signed with Android
  APK Signature Scheme v1 and v2 using the established Aetherion repair key.
