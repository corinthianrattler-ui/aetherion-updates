# Aetherion Reforged v1.72.6 release audit

## Release identity

- Game version: `1.72.6`
- Android version code: `195`
- Full APK: `Aetherion_Reforged_v1.72.6_GAMEPLAY_REPAIR_FULL.apk`
- APK size: `499039030` bytes
- APK SHA-256: `2fd692cb05cb163e5bde55abfae8789c3131e15e956831921abe07f905f2c645`
- Android package: `com.dominus.aetherionreforgey`
- Signing-certificate SHA-256: `5e68318c3e12c9f5915976a25bbfd5039a2f7e651682b65744b2747b618c3e77`

The complete APK is slightly larger than v1.72.5 and retains its packaged game content. It is signed with the same identity as the verified recovery line so Android can install it over the matching build.

## Focused repairs

### Lady Alexus equipment model

The supplied `assets/v172/alexus-gothic-gown.glb` is restored in Lady Alexus's Equipment view. Its 28 mesh nodes are classified exactly once: eight permanent body/foundation nodes and twenty nodes controlled by twelve independent fitted slots.

| Model-backed slot | Mesh nodes |
| --- | ---: |
| Head | 1 |
| Neck | 2 |
| Underlayer | 1 |
| Body | 1 |
| Shoulders | 3 |
| Hands | 2 |
| Waist | 2 |
| Legs | 1 |
| Feet | 2 |
| Cloak | 1 |
| Jewelry 1 | 1 |
| Jewelry 2 | 3 |

The supplied GLB has no separate geometry for main hand, off hand, ranged weapon, reserve weapon, or ammunition. Those five slots remain independently equippable inventory cards and are explicitly marked card-only. No invented geometry or whole-outfit swap is used.

### Portrait-phone layout

The repair constrains the shell, main column, bottom Systems dock, modals, equipment grids, shop cards, selectors, form controls, and notices to the portrait viewport. The Alexus side rail is removed. Horizontal page overflow and the empty right-side canvas are blocked while intentionally scrollable data tables retain local scrolling.

### Purchase routing

- Specialist-shop and ordinary market purchases are delivered only to Valkorion's `Carried Inventory`.
- The misleading ordinary-shop wagon selector is removed.
- Quartermaster requisitions route only to physically attached fitted crates.
- Requisition routing checks item category, explicit cargo assignments, intended starter crate, compatible fallback crates, crate slots, crate mass, and host-wagon mass.
- A bare wagon name is treated as a routing preference, never as loose item storage.
- If no valid destination exists, the purchase is blocked before payment; if delivery fails after payment, the coin is returned.

## Update paths

- Existing v1.72.5 installations can stage the small `v176-gameplay-repair` module through the in-game updater. Its channel build remains `194` intentionally so v1.72.5 accepts it as a web patch.
- The complete recovery/clean-install APK is Android build `195` and is linked separately from the update channel.

## Verification performed

- Focused gameplay routing and portrait CSS test: pass.
- Alexus equipment-mount lifecycle and slot-control test: pass.
- Alexus GLB node/classification validator: pass.
- Real v1.72.5 updater/channel staging harness: pass.
- v1.72.6 safe-updater test: pass.
- Manifest and payload hashes: pass.
- Full APK validator: pass.
- APK ZIP integrity and all local startup references: pass.
- Android v1 and v2 signature verification: pass.
- Native-library page alignment: pass.
- Packaged Alexus and Valkorion model hashes/structure: pass.
- Whole packaged-game scan: 2,748 files, 128 JavaScript files, 2,305 images, 124 media files, and four structurally valid GLBs; pass.

No claim is made that this build was installed on the user's physical phone. Browser automation was unavailable in the build environment, so UI behavior is covered by the game-script harness, static viewport assertions, packaged-file validation, and model lifecycle tests rather than a Chromium screenshot run.
