# Aetherion Reforged Updates

Public update channel for **Aetherion Reforged**.

The Android updater reads `manifest.json` from this repository. Patch scripts and assets are served directly from the stable branch so Android can fetch them without a release-page redirect.

## Current stable patch — 1.66.1

Version 1.66.1 is a save-safe immersion correction for the Narrator and the new Sophia Help interface:

- removes the v1.66 mechanics/tutorial paragraphs that were incorrectly appended to short Narrator events
- enforces first-person-limited narration restricted to what Valkorion can see, hear, physically feel, receive in a message, remember, or reasonably infer from visible evidence
- keeps scenery, weather, local sound, physical consequences, observable reactions, story, and lore in narration while filtering UI, payroll, statistic, control, inventory-screen, and tutorial language
- rewrites generic free-action and unidentified-command failures as events Valkorion actually experiences instead of directions to buttons or menus
- migrates already-saved affected Narrator blocks, including the Libita company-ledger/payroll paragraph, without deleting any other story or progress
- adds **Sophia, Goddess of Wisdom** as a separate Help modal available from both the Story header and Systems dock
- gives Sophia her own clear female wisdom voice profile and seven focused help subjects; Sophia playback and help text never enter the story log
- reuses packaged priestess art and adds no image, audio, or model download

The exact correction, boundaries, migration behavior, before/after example, and validation results are recorded in `AUDIT_v1.66.1.md`.

## Living-world foundation retained from 1.66.0

Version 1.66.0 remains active beneath 1.66.1. It caps every ordinary weekly wage at 3 silver; keeps Ysabet at 2s 8c/week and Halric, Libita, and Maevra at 3s/week; uses canonical copper prices; guarantees five 6c Good Wine Skins at the Corvinus Provisioner for Kael; reconciles generated identities and portraits; gives all 1,122 items a gameplay route; repairs missing image references with packaged art; and supports both private and nearby-group conversation. Its original generic Narrator expansion is superseded by 1.66.1. See `AUDIT_v1.66.0.md` for the complete economy and content audit.

## Shop foundation retained from 1.65.0

The 1.65.0 overlay remains active beneath 1.66. It supplies finite regional selections of 14–30 goods per specialist, all 12 court gifts, custom/issued/House gear exclusions, corrected `Seal’s End` records, shop search and paging, delivery to wagons, real study centers, Kael record reconciliation, and compact shop state. Version 1.66 supersedes its old specialist-price calculation with the canonical copper standard. See `AUDIT_v1.65.0.md` for the original cleanup.

## Retinue integrity retained from 1.64.0

The 1.64.0 overlay remains active. It repairs Bannerless identity/model coherence, every formation portrait, all 25 individual service-equipment images, illustrated personal-equipment slots, weight formatting, House Dominus issuance authority, and mobile Wagonwright image sizing. See `AUDIT_v1.64.0.md` for its detailed audit.

## Valkorion model retained from 1.63.3

The two final Tripo masters are delivered as one aligned, modular Valkorion wardrobe without the destructive v1.63.0 simplification:

- the black under-suit human and complete Royal Lord costume share one fitted foundation
- the Dominus armor includes the final chest, separate arming doublet, approved straight helmet and gauntlet pair, fitted back cape, and authored weapons
- all 54 fitted pieces retain their 35 independent foundation/equipment groups
- removing the cuirass reveals the separate gambeson/arming doublet; closed helmets and gauntlets hide only the covered body regions
- all embedded textures and UV seams are retained
- the validated 892,522-vertex, 752,438-triangle model is delivered as one 36.87 MiB raw GitHub asset
- unequipped groups remain hidden and saves remain untouched

The updater downloads the full-detail GLB directly from the stable raw GitHub path, verifies its exact SHA-256 checksum, and installs it at the normal managed asset path. Version 1.63.3 replaces the release-download address that Android could not fetch; the model bytes are unchanged. The smaller malformed v1.63.0 file is no longer active.

## Update model

The game compares the installed SHA-256 hash for each managed file against the current manifest. Only changed files are downloaded. Save data is never part of an update payload.

The Android APK is replaced only when the native Android shell/updater itself changes. Ordinary JavaScript, art, models, audio, video, and game data are delivered as external content patches.

## Stable URLs

Manifest:
`https://raw.githubusercontent.com/corinthianrattler-ui/aetherion-updates/main/manifest.json`

Managed payloads use raw stable-branch URLs under this repository.

## Safety

Every payload entry must include its exact byte size and SHA-256 hash. The updater downloads to a staging area, verifies the hash, then replaces the installed file. Failed verification leaves the previous working file untouched.

Release checks:

```bash
python3 tests/validate_manifest.py
node tests/test_v163_patch.cjs
node tests/test_v164_patch.cjs
node tests/test_v165_patch.cjs
node tests/test_v166_patch.cjs
node tests/test_v1661_patch.cjs
node --check patches/v1.63.0-valkorion-final.js
node --check patches/v1.64.0-world-ui-integrity.js
node --check patches/v1.65.0-world-economy-cleanup.js
node --check patches/v1.66.0-living-world-balance.js
node --check patches/v1.66.1-immersive-narrator-sophia.js
python3 tests/validate_v163_glb.py /path/to/downloaded/valkorion_final.glb
```
