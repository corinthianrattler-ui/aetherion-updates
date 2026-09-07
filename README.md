# Aetherion Reforged Updates

Public update channel for **Aetherion Reforged**.

The Android updater reads `manifest.json` from this repository. Patch scripts and assets are served directly from the stable branch so Android can fetch them without a release-page redirect.

## Current stable patch — 1.69.0

Version 1.69.0 adds a recoverable update path directly to the game:

- adds **Game Updates** to both the opening screen and Systems dock
- checks without changing the running game, then stores and SHA-256 verifies complete patch source before activation
- activates a staged release only after the player chooses to restart
- keeps the APK's built-in version and the previous downloaded release as rollback paths
- automatically rolls back an update that cannot complete its startup health check
- provides **Safe Start once** and **Use built-in version** without touching game saves
- retains Android's safer universal-file-access restriction; the stable channel carries bounded patch source as data instead
- requires a newly signed APK for unusually large code or asset releases that cannot fit safely in local patch storage

The updater architecture, trust boundary, and recovery behavior are recorded in `AUDIT_v1.69.0.md`.

## Portrait startup hotfix retained from 1.68.1

Version 1.68.1 repairs the startup and gameplay freeze introduced by the portrait integration:

- removes whole-world portrait and identity scans from ordinary redraws, people lists, portrait views, daily ticks, and already-migrated save loads
- changes both v1.67 and v1.68 migration hooks to run once per version instead of once per render
- keeps identity checks at actual NPC creation points, so new people still receive compatible, unused art without taxing unrelated screens
- adds a 1,219-record stress regression: 25 render, list, and migration cycles now perform zero portrait-record checks instead of 91,425
- preserves existing saves, names, identities, exact character art, custom portraits, assignments, and all 111 curated portrait files
- updates only the two affected JavaScript payloads; the 19.91 MiB art library is not downloaded again on an already-current installation

The cause, repair boundary, and validation evidence are recorded in `AUDIT_v1.68.1.md`.

## Curated portrait foundation retained from 1.68.0

Version 1.68.0 installs the save-safe curated NPC portrait library:

- adds 110 new lore-matched full-body character plates and retains the unchanged original Quartermaster role portrait: 111 unique WebP assets, 19.91 MiB total
- gives every asset explicit sex, visual-age, race, occupation, faction, mounted-status, person-use, and visible-label metadata
- routes portraits only when the individual and art agree; a wrong job, faction, sex, age band, or species is rejected rather than forced into the UI
- distinguishes humans, dwarves, elves, dark elves, ordinary Ash Wastes orcs, and the heavier Grimhorn beast-orcs
- maps Solara/Solaris, Corvinus, Highwatch, White Harbor, Frostreach, Winterhold, Eternal Glades, Greenhall, Lorien Ford Underrealm, Ash Wastes, Grimhorn, Blood Keep, Redmont, House Dominus, and Stonevein art to their own people and locations
- assigns each curated face at most once in the active world, then uses an identity-safe packaged fallback instead of cloning the same person across a roster
- protects all exact named-character portraits; Quartermaster Halric Morn continues using `assets/v29/portraits/quartermaster_halric.webp`, while the retained square Quartermaster art is correctly classified for unnamed Quartermasters
- preserves user-selected portraits and saved progress, recomputes age-dependent family art without bloating saves, and includes a missing-image fallback
- retains every shop, Good Wine Skin, 3-silver wage ceiling, item-purpose, dialogue, Narrator, Sophia Help, and world-integrity repair from 1.65–1.67

The complete routing matrix and validation results are recorded in `AUDIT_v1.68.0.md`.

## Identity foundation retained from 1.67.0

Version 1.67.0 remains active beneath 1.68.1. It classifies all 1,966 APK-packaged images; repairs generated names, sex, age, titles, voices, morale scale, and legacy display references; preserves authored named faces; and prevents formation, occupation-reference, scene, item, animal, and transport art from being treated as an individual face. Version 1.68 extends that policy with the new, explicitly tagged person-eligible library. See `AUDIT_v1.67.0.md` for the underlying whole-world audit.

## Narrator and Help foundation retained from 1.66.1

Version 1.66.1 remains active beneath 1.67.0 as the immersion correction for the Narrator and Sophia Help interface:

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
node tests/test_v167_patch.cjs
node tests/test_v168_patch.cjs
node tests/test_v169_updater.cjs
python3 tests/validate_v168_portraits.py
node --check patches/v1.63.0-valkorion-final.js
node --check patches/v1.64.0-world-ui-integrity.js
node --check patches/v1.65.0-world-economy-cleanup.js
node --check patches/v1.66.0-living-world-balance.js
node --check patches/v1.66.1-immersive-narrator-sophia.js
node --check patches/v1.67.0-identity-world-integrity.js
node --check patches/v1.68.0-curated-npc-portraits.js
node --check patches/v1.69.0-safe-updater.js
node --check channel.js
python3 tests/validate_v163_glb.py /path/to/downloaded/valkorion_final.glb
```
