# Aetherion 1.71.0 character models

These are the fitted Tripo exports selected for the live game:

| Game use | Asset | Parts | Triangles | Bytes | SHA-256 |
|---|---|---:|---:|---:|---|
| Valkorion base body and Lord's royal armor | `valkorion-base-lord.glb` | 23 | 988,007 | 37,293,792 | `963d66d60d4e7b1dcfdeb43f44bc764683ddf2f8a4a4ffe4dbd63a530d186d47` |
| Valkorion complete armor | `valkorion-armored.glb` | 40 | 2,860,055 | 99,848,008 | `de12485beeebd6be86e9354e25a2071a1203fb94a6b8b660fd8c7d01acaecba1` |
| Libita Savitas in the gothic ball gown | `libita-gothic-gown.glb` | 28 | 2,718,772 | 97,544,908 | `5941aa40b5c08b2e71b04a39665a11129d5960312361d513fa3f76d34b0df2f9` |

`valkorion-base-lord.glb` preserves the supplied `HUMAN_PART_*`,
`ROYAL_COSTUME_PART_*`, `Gothic_Necklace`, and `Gothic_Ring` nodes. The game
shows the ten intact `HUMAN_PART_*` nodes for base mode and all 23 fitted nodes
for Lord mode.

The supplied complete-kit source was 105,754,764 bytes, just above the model
upload ceiling. Blender re-export reduced container overhead, and a 0.99
decimation modifier was applied only to the six `WEAPONS_PART_*` meshes. No
body, armor, helmet, or cape mesh was decimated. The result keeps all 40 named
parts, all 40 materials and textures, and the authored fitted transforms while
remaining below 100,000,000 bytes.

All three files are GLB 2.0, have one scene-level `ROOT`, contain no skins or
animations, require no extension decoder, and have no normal-map bindings.
