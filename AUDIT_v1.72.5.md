# Aetherion Reforged v1.72.5 — Modular Equipment Audit

Release: `1.72.5`  
Android version code: `194`  
APK: `Aetherion_Reforged_v1.72.5_MODULAR_EQUIPMENT_UPDATE.apk`  
APK size: `499,009,725` bytes  
APK SHA-256: `bf9fd12a105c50dc2325d26e3b58708f9487c17bf957bf878a8875a2cc1f9480`  
Signing-certificate SHA-256: `5e68318c3e12c9f5915976a25bbfd5039a2f7e651682b65744b2747b618c3e77`

## Defect and correction

The v1.72.4 controller treated Valkorion's base/Lord outfit, complete armor,
and Lady Alexus's gown as whole-model choices. Inventory slots changed, but a
single equipped armor or court item could replace the entire displayed model.
That was not modular equipment.

Build 194 restores `assets/v109/valkorion_final.glb`, whose 54 fitted meshes are
already divided into foundation, Dominus armor, royal clothing, weapons,
ammunition, cloak, and jewelry groups. The new controller loads that model once
and changes named-node visibility for each equipped item. It does not swap the
source GLB when one slot changes.

The visual contract covers 17 independent inventory slots:

| Slot | Fitted content |
| --- | --- |
| `head` | Dominus helm or royal headwear |
| `neck` | gorget or royal neck/underlayer detail |
| `underlayer` | arming doublet or royal underlayer |
| `body` | cuirass or royal coat |
| `shoulders` | pauldrons or royal shoulder cape |
| `hands` | gauntlets or royal gloves |
| `waist` | war belt or court sword belt |
| `legs` | leg harness or royal trousers |
| `feet` | sabatons or royal boots |
| `cloak` | Dominus or royal cloak |
| `main` | Dominus sword and scabbard |
| `off` | Dominus shield or thorn whip |
| `ranged` | Dominus bow |
| `reserve` | Dominus dagger |
| `ammo` | Dominus quiver |
| `jewelry1` | royal jewelry or Dominus signet |
| `jewelry2` | royal jewelry or Dominus signet |

The controller permits mixed court-and-armor outfits. Removing one item hides
only the node group owned by that item. An equipped item without matching fitted
geometry stays represented by the existing inventory/paper-doll artwork and is
reported as unsupported; it is not disguised as a Dominus piece.

## Sisters and future character models

Lady Alexus's supplied GLB contains a baked body-and-gown presentation rather
than complete independent geometry for all 17 equipment slots. Presenting that
file as modular would repeat the same defect. Build 194 therefore removes only
the false 3D-model assignment and retains her existing working 2D equipment
view.

The shared `AetherionModularModelsV175.register()` contract is available for
future sisters, companions, and other models. Registration fails if a model:

- omits any of the 17 slots;
- declares itself partial or baked;
- leaves equipment geometry unassigned;
- shares one geometry node between separate equipment rules; or
- maps an unknown inventory slot.

This makes the requirement enforceable, but does not claim that missing fitted
geometry has been created for Alexus or another character.

## Model verification

`assets/v109/valkorion_final.glb` passed structural and fit validation:

- 38,658,288 bytes;
- SHA-256 `7c6006efb6b2966b78c3d65ae10605f63bb9fe2c1fa674b569d8dc52b1dffee5`;
- 91 nodes;
- 54 fitted meshes;
- 35 equipment/foundation groups;
- 52 materials;
- 892,522 vertices and 752,438 triangles; and
- valid GLB 2.0 chunk, buffer, node, mesh, and accessor structure.

Runtime tests cover an empty foundation model, helmet-only equipment, mixed
Dominus/royal equipment, removal of one item without changing other nodes,
weapon/ammunition visibility, unsupported foreign equipment, incomplete-model
rejection, Alexus's honest 2D fallback, one-viewer reuse, and retry after a
simulated first-load failure.

## Android and startup verification

The final APK reports package `com.dominus.aetherionreforgey`, version `1.72.5`,
version code `194`, minimum SDK 26, target SDK 36, and ARM64 support. Android
signature schemes v2 and v3 verify. Its certificate is byte-identical to the
startup-fixed v1.72.4 recovery build, allowing an in-place Android update from
that copy.

The v1.72.4 native startup repair remains present in build 194. The corrected
DEX instruction marker is present and the reversed crash-causing marker is
absent. Manifest, DEX, signing block, and native-library alignment checks pass.

The packaged game scan checked:

- 2,744 game files totaling 443,313,573 bytes;
- 148 local HTML/CSS startup references;
- 125 JavaScript files with clean syntax;
- 2,305 decodable images;
- 124 probeable audio/video files;
- five valid JSON documents;
- four structurally valid GLB models; and
- 3,123 APK entries with valid CRCs and no duplicate paths.

All focused v1.72.5 updater, channel, manifest, modular-model, APK, and historical
game-system regression checks pass. The stable channel requires the full signed
APK for build 194 because the fitted model and native-version marker must exist
inside the installed application before activation.

## Release boundary

This release fixes the broken equipment presentation and preserves the working
startup repair. It does not invent fitted parts that are absent from supplied
models. Alexus and any other incomplete character model remain on the functional
2D equipment view until a complete independently fitted asset is supplied and
passes the shared 17-slot contract.
