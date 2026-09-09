# Aetherion Reforged v1.72.10 — Alexus Original-Body Repair

## Defect

The v1.72.6 visibility table treated Alexus's authored torso
`BODY_tripo_part_2`, upper chest `BODY_tripo_part_28`, and bare hands as
removable clothing. It also assigned `GOWN_tripo_part_10`, the actual complete
dress, to the legs slot. Version 1.72.9 attempted to cover the exposed hole with
a recoloured clone of the lower torso, leaving the upper chest absent.

## Repair

- The original textured body is permanent; no body mesh is cloned, recoloured,
  or replaced.
- All 28 packaged mesh nodes are classified once and only once.
- The complete dress follows `alexus_dominus_gown` in the body slot.
- The v1.72.9 fabricated torso module is absent from the 1.72.10 channel.
- The existing 1.72.7 scroll and 1.72.8 equipment-state repairs remain bundled.
- The model asset stays byte-for-byte unchanged, so this remains a small web
  patch for Android build 195.

## Source proof

The later original user upload and the packaged mobile model expose the same 28
named meshes:

| Source | Bytes | SHA-256 |
| --- | ---: | --- |
| Original Tripo GLB | 97,544,908 | `5941aa40b5c08b2e71b04a39665a11129d5960312361d513fa3f76d34b0df2f9` |
| Packaged mobile GLB | 30,457,220 | `6a5dbb1b0de94e327a5e853292989e747fb20931c9cd7dea34992f0181e00988` |

`BODY_tripo_part_28`, `BODY_tripo_part_2`, and `GOWN_tripo_part_10` exist in
both files. The defect was the JavaScript visibility map, not absent geometry.

## Gates passed

- Original-versus-packaged 28-node source comparison
- Exhaustive 4,096-state check across all 12 non-weapon wardrobe slots
- Real sequence: unequip → redraw migration → viewer sync → reopen
- v1.72.6 Alexus viewer and gameplay regression suites
- v1.72.7 vertical-scroll regression suite
- v1.72.8 empty-slot and unique-item recovery regression suite
- v1.72.6 updater checksum and staging validation
- JavaScript syntax scan for every patch and the generated channel
- Python compilation and clean-diff validation

The generated `channel.js` is 22,429 bytes, below the installed updater's
100,000-byte channel limit, and contains no remote asset mapping.
