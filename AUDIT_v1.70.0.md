# Aetherion Reforged 1.70.0 restoration audit

## Restored artifacts

- `Valkorion_Complete_Kit_Clean.glb.glb` is bundled at `assets/game/assets/v170/valkorion-complete-kit.glb`.
  - 106,006,128 bytes
  - SHA-256 `484976e440f38feb0b7403a0f1be069789399c169c3b1b2647acd45b5f12f0aa`
  - GLB 2.0, one `ROOT` node, 40 assembled mesh children
- `Reforged Jousting Arena Heraldry.png` is bundled as `jousting-arena.png`.
- `Aetherion Duel Arena Heraldry.png` is bundled as `duel-arena.png`.
- `Aetherion archery tournament beneath heraldic banners.png` is bundled as `archery-range.png`.

The separated `Valkorion_Human_And_Royal_Costume` export, the old simplified v1.63 model, `Empty Jousting Lists Before the Pass`, `The Empty Armored Duel Ring`, and `Rain-swept medieval archery grounds` are not active or present in the APK.

## Character integration

`patches/v1.70.0-valkorion-complete.js` replaces all legacy Valkorion viewers with one bounded canvas in the existing Wardrobe Trunk. It validates the assembled hierarchy, fits the `ROOT`, presents the authored front, supports touch/mouse rotation, and resets to the authored front view. Mobile browser QA loaded all 40 parts with one canvas, zero canvases outside the wardrobe stage, and a 390-pixel page width in a 390-pixel viewport.

## Tournament integration

`patches/v1.70.0-tournaments.js` adds the Corvinus Keep Tournament Grounds to the live Systems dock:

- Jousting Lists: read high/center/low shield placement, choose the exposed lane, and time the lance across three scored passes.
- Armored Duel Ring: read the opponent's physical tell and choose the correct response in a first-to-three exchange.
- Archery Butts: compensate for wind and moving sight over six scored arrows.
- Full Tourney: runs all three events and calculates the overall purse, standing, and championship result.

Entries consume game time, energy, and coin. Outcomes persist renown, championships, event records, skill gains, Nobility reputation, HP loss, and wounds through the existing save state.

## Android package verification

- package: `com.dominus.aetherionreforgey`
- version name: `1.70.0`
- version code: `187`
- minimum SDK: `26`
- target SDK: `36`
- signing schemes: APK Signature Scheme v2 and v3
- signing certificate SHA-256: `CA8042F4758D9A056EB0748EDFAAD0CFD8A436EA7D35907C28B32C3F3AFD5EB8`
- APK SHA-256: `b05a5dcf6d88d692b6f0a8682ef0831d850e950340e3144975bee9839f7e4a13`

The package name and signing identity match the previous Android release, so installation upgrades the existing app and preserves its app data.

## Regression checks

- Every legacy `test_v160` through `test_v1692` JavaScript regression passes.
- The 111-image curated portrait library passes its byte, dimension, and metadata audit.
- The stable manifest's 129 payload byte counts and SHA-256 values pass.
- The v1.70 updater transport, Valkorion integration, tournament logic, and exact visual-asset tests pass.
- The signed APK ZIP is structurally valid and every restored file inside it matches the staged source hash.
