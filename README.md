# Aetherion Reforged Updates

Public update channel for **Aetherion Reforged**.

The Android staged updater reads `channel.js` from this repository through a MIME-safe GitHub Contents response. `manifest.json` records the exact sizes and SHA-256 hashes of managed payloads.

## Current web update — 1.73.7 (Android build 195)

Version 1.73.7 moves the sky dial into the unused top-right space beside the
lower status rows, where it no longer covers the settlement name or controls.
The dial and all time mechanics are otherwise unchanged.

## Previous web update — 1.73.6 (Android build 195)

Version 1.73.6 adds an original Aetherion time and moon system:

- a compact top-right sky dial shows the exact time with a sun moving around
  the horizon, a blood-red moon, its 28-day phase, and Dominus rose details
- tapping the dial opens exact sunrise, sunset, moon illumination, energy, and
  hours-awake information
- waiting for one hour, three hours, dusk, or dawn advances the living world
  without falsely counting as sleep
- every Sleep action now lasts from the current time until the next seasonal
  dawn, even when sleep begins during the day
- staying awake causes escalating tiredness, sleep deprivation, energy and
  movement penalties, followed by physical collapse damage after two days
- camp shelter, sentries, security, moonlit visibility, morale, and the supplied
  sleep scene remain part of overnight resolution

All earlier portrait, knight, model, scrolling, camp-film, and guard-post repairs
remain in the same checksum-verified update. No replacement APK is required.

## Previous web update — 1.73.5 (Android build 195)

Version 1.73.5 adds the supplied guard-watch scene:

- `guard-watch.mp4` plays only after **Assign Guard Watch** succeeds
- the camp must be established, a physical Watch Post must exist, and an
  eligible fighting retainer must be present
- failed guard assignments play no film
- the scene shares the same first-frame poster, automatic playback, hidden
  native controls, and small **Skip** button as the other camp scenes

All earlier content, saves, camp timing, and Watch Post cleanup remain intact.
No replacement APK is required.

## Previous web update — 1.73.4 (Android build 195)

Version 1.73.4 repairs Android camp playback and guard-post logic:

- every film has a matching first-frame poster instead of a gray play badge
- Android's native media overlay stays hidden; playback retries when ready and
  falls back to muted autoplay only when the WebView blocks sound autoplay
- the video itself remains non-interactive and only the small **Skip** button works
- **Assign Guard Watch** requires an established camp and at least one physical
  Watch Post
- removing the final Watch Post clears its now-invalid guard assignment

The original four clips remain mapped only to Make Camp, Take Down Camp, Cook,
and Sleep.

## Previous web update — 1.73.3 (Android build 195)

Version 1.73.3 makes each camp film a short, automatic in-game scene:

- removes the browser's pause, play, seek, fullscreen, and download controls
- blocks touch and long-press interaction with the video itself
- keeps only a small **Skip** button and returns to the interactive camp when
  the film ends or is skipped
- keeps realistic action time: two hours to make camp, one hour to take it down,
  two hours to cook the company meal, and eight hours to sleep
- blocked actions consume no time and play no film

No content or save progress is removed, and no replacement APK is required.

## Previous web update — 1.73.2 (Android build 195)

Version 1.73.2 connects four supplied camp films to four different successful
camp actions:

- `make-camp.mp4` plays only when the planned camp is successfully established
- `strike-camp.mp4` plays only when an active camp is taken down and packed
- `camp-food.mp4` plays only after a company meal is successfully cooked
- `camp-sleep.mp4` plays only after the company completes eight hours of camp sleep
- the combined camp toggle now reads **Make Camp** or **Take Down Camp** according
  to the actual state
- failed requirements never trigger a film; media failure leaves the completed
  action and save state intact

The four files retain their supplied H.264 video, AAC audio, 672×448 frame, and
approximately six-second runtime. This staged update preserves every earlier
system and requires no replacement APK or save reset.

## Previous web update — 1.73.1 (Android build 195)

Version 1.73.1 fixes the repeated cropped-head knight roster without replacing
the verified v1.72.6 APK or clearing saves:

- adds 12 new 512×768 full-body bannerless knights: young and older men and
  women with distinct faces, builds, hair, armor, weapons, and poses
- repairs the existing twenty mounted retainers once, balancing them across ten
  compatible full-body identities instead of two repeated headshots
- matches stored gender and visual age and keeps a bounded amount of reuse when
  an age group is larger than its portrait pool
- preserves canonical, named, user-supplied, and custom-companion art
- shows curated roster art uncropped at 2:3 and lazily decodes off-screen cards
- removes per-card and legacy whole-world identity repairs from ordinary
  redraws, preventing older code from changing curated art back to headshots
- runs settlement, labor, surgeon, and recruit structure setup once per save
  version instead of repeating the same work during daily ticks and services
- removes no characters, roles, jobs, mechanics, items, locations, story, or
  save progress

The root-cause analysis, image provenance, compatibility rules, and verification
results are recorded in `AUDIT_v1.73.1.md`.

## Previous web update — 1.73.0 (Android build 195)

Version 1.73.0 expands the living population without replacing the verified
v1.72.6 APK or clearing saves:

- adds 268 unique labeled full-body portraits to the existing curated library,
  for 379 reviewed choices in total
- deduplicates the smaller recruitable catalog against the complete catalog
  instead of shipping the same pictures twice
- matches each portrait to occupation, gender, visual age, race, and bannerless
  allegiance while preserving named, canonical, custom, and unique-character art
- keeps compatible portraits from the earlier curated set in circulation, so
  the two libraries add variety instead of replacing one another
- keeps all 12 teen, toddler, and baby portraits strictly in households,
  schedules, and nearby-life views; none can become a worker or recruit
- adds banker, beekeeper, goatherd, poultry keeper, skilled artisan, bannerless
  archer, crossbowman, sergeant, swordsman, footman, and militia recruit roles
- gives the new rural occupations persistent hives, goat herds, poultry flocks,
  seasonal and weather effects, weekly production, local-market stock, household
  sales, and settlement health/prosperity effects
- connects named bankers and posted opening hours to the existing deposit,
  withdrawal, bullion, reserve, mint, and currency systems
- adds household members to People Here and the schedule ledger with age-specific
  daily activity rather than treating children as labor
- migrates each existing save once, then assigns only at NPC creation; ordinary
  redraws, lists, schedules, and daily ticks perform no whole-world portrait scan
- loads portrait art from this fixed GitHub release source and falls back to
  packaged dynasty art when offline, so a failed image cannot break the view
- retains the v1.72.10 Lady Alexus body-map repair, v1.72.8 equipment-state
  repair, and v1.72.7 vertical-scrolling repair in the same staged release

The portrait provenance, role mapping, mechanics, and verification results are
recorded in `AUDIT_v1.73.0.md`.

## Previous web repair — 1.72.10 (Android build 195)

Version 1.72.10 corrects Lady Alexus's model without altering or replacing her
supplied GLB:

- keeps all 12 original anatomy surfaces permanently visible, including the
  authored upper chest, torso, arms, hands, and legs
- maps `GOWN_tripo_part_10`, the actual complete dress, to the gown slot instead
  of the legs slot
- removes the fabricated v1.72.9 torso clone and its recoloured material
- classifies all 28 packaged model nodes exactly once as permanent anatomy or a
  genuine removable wardrobe mesh
- retains the v1.72.8 empty-slot migration fix and v1.72.7 vertical-scrolling
  fix in the same staged release
- has no remote model or art payload; the updater uses the unchanged GLB already
  inside the verified v1.72.6 APK

The source comparison and all 4,096 non-weapon wardrobe-state results are
recorded in `AUDIT_v1.72.10.md`.

## Current full build — 1.72.6 (Android build 195)

Version 1.72.6 is the full gameplay-repair APK. It adds Lady Alexus's packaged
3D viewer, portrait-phone containment, personal purchase routing, fitted wagon
crate fallback, and all content from 1.72.5. Later 1.72.7–1.72.10 corrections
stage over it through Game Updates without replacing the APK or clearing saves.

## Previous full build — 1.72.5 (Android build 194)

Version 1.72.5 is the modular-equipment correction:

- restores the proven fitted Valkorion model and maps its real meshes to 17
  independent equipment slots
- lets helmets, neckwear, underlayers, body armor, shoulders, gloves, belts,
  leg armor, boots, cloaks, weapons, ammunition, and jewelry appear or disappear
  separately
- allows court clothing and Dominus armor to be mixed without replacing the
  entire character model
- hides only the removed item's fitted mesh instead of changing the whole outfit
- refuses to depict unsupported foreign equipment as false Dominus armor
- keeps the existing picture-based equipment view for Lady Alexus because her
  supplied gown is a baked partial model, not a complete independently equipped
  17-slot character
- requires every future sister/companion 3D model to declare complete slot
  ownership and rejects baked, partial, or shared-node registrations
- retains the v1.72.4 startup repair and is signed by that recovery build's
  exact certificate, so Android accepts build 194 directly over build 193

The final APK, slot mapping, known asset boundary, and verification results are
recorded in `AUDIT_v1.72.5.md`.

## Previous full build — 1.72.4 (Android build 193)

Version 1.72.4 repairs the native failure found by the whole-game audit:

- fixes the reversed query/fragment branches in the Android asset client, so
  all 135 startup scripts and styles resolve under the packaged HTTPS origin
- retains WebView cache between launches instead of clearing it and forcing
  every script, stylesheet, image, and model route through cold startup
- reduces eager startup JavaScript from 9.71 MB to 2.47 MB by loading Three.js
  only on a 3D character screen and WebLLM only when offline AI is requested
- marks fully migrated state and stops the 59-layer migration chain from
  running again on every redraw; the Continue harness falls from 4.16 seconds
  to 0.22 seconds
- stops Trade from rebuilding every merchant worker across the world for each
  local shop card; its full-screen harness falls from 3.8 seconds to 0.17 seconds
- keeps Game Updates in the opening menu and Systems dock, without restoring
  the rejected floating gold button or Android's blue touch flash
- preserves the exact supplied Valkorion base/Lord, 40-part complete armor,
  and Lady Alexus 28-part gothic-gown GLBs without geometry changes
- is signed by the existing Aetherion repair certificate and uses Android
  version code 193, so it can install over builds 191 and 192

The final APK and whole-game results are recorded in `AUDIT_v1.72.4.md`.

## Previous full build — 1.72.3 (Android build 192)

Version 1.72.3 is the fully scanned native/model/update repair:

- prevents a small staged web patch from claiming it installed an Android APK
- proves the installed package with a bundled build-192 sentinel
- displays `BUILD 192 · 3D READY` only after the actual GLB is parsed and mounted
- mounts Valkorion's supplied base, Lord, and complete-armor model on both the
  Character and Equipment screens
- keeps Lady Alexus Dominus's supplied 28-part gothic-gown model
- repairs the two zero-byte legacy WebP frames found by the complete asset scan
- clears the hidden opening-film guard so Continue actually opens the live game,
  removes the floating gold updater, and suppresses the Android blue tap flash
- retains all fitted model meshes and shape-preserving quantization, with no new
  simplification or geometry processing
- is signed by the same certificate as build 191, so Android accepts it as an
  update to the existing app

The exhaustive package, runtime, model, and signature results are recorded in
`AUDIT_v1.72.3.md`.

## Previous full build — 1.72.2 (Android build 191)

Version 1.72.2 is the native Android model-loader correction:

- serves packaged game files through the secure
  `https://appassets.androidplatform.net/assets/` origin instead of
  `file:///android_asset/`, so WebView can actually read the bundled GLBs
- keeps Android file access and universal-file access disabled
- loads Valkorion's base body, Lord's royal set, complete 40-piece armor, and
  Lady Alexus's gothic-gown model as verified local binary data
- preserves every fitted mesh and authored transform; mobile optimization uses
  attribute quantization only and does not simplify or fracture model surfaces
- reduces the three runtime models from 103.4 MB to 75.7 MB and releases each
  source buffer after Three.js finishes parsing it
- reconnects the Wardrobe Trunk after every equipment render without a
  full-page observer or continuous idle rendering
- shows an explicit in-panel model error instead of silently hiding failures
  behind the old flat portrait
- adds a full-APK address and download control inside Game Updates; external
  links open in the Android browser

This repair requires the full signed APK because the failed asset route lived
in the native WebView shell. Details are recorded in `AUDIT_v1.72.2.md`.

## Previous full build — 1.72.1 (Android build 190)

Version 1.72.1 is the armor-loader correction:

- connects the supplied character-model controller to the live `v80` Wardrobe
  Trunk viewer actually bundled in the Android app
- prevents missing historical `v97`/`v98` viewer globals from aborting that
  connection before Valkorion's model can load
- replaces the flat white-clothes portrait fallback with Valkorion's base body,
  Lord's royal set, or complete 40-piece armor as his equipment changes
- applies the same corrected model path to Lady Alexus's fitted gothic gown
- reuses the exact verified v1.72 GLB files; no model geometry, fitted parts,
  materials, textures, or transforms were changed
- retains the Continue, menu, touch-color, and mobile-performance repairs from
  1.72.0

The failure and regression coverage are recorded in `AUDIT_v1.72.1.md`.

## Previous full build — 1.72.0 (Android build 189)

Version 1.72.0 is the mobile repair build:

- makes **Continue** reliably migrate and open the existing timeline
- removes the floating gold **Game Updates** control; updates remain reachable
  from the Opening Menu and the Systems dock
- removes Android's blue tap flash while retaining a visible keyboard-focus ring
- loads Valkorion's supplied base, Lord, and complete-armor models and his twin
  sister Lady Alexus Dominus's supplied gothic-gown model from local APK assets
- preserves every fitted node, material, texture, and authored transform while
  reducing the three GLBs from 234.7 MB to 103.4 MB with bounded-error,
  border-locked mobile geometry
- removes three full-document mutation loops, continuous 24 FPS idle model
  rendering, repeated geometry reframing, and duplicate render scheduling
- signs Android build 189 with the established Aetherion repair identity using
  APK Signature Scheme v1 and v2

Exact model structure and checksums are in
[`assets/v172/README.md`](assets/v172/README.md) and `AUDIT_v1.72.0.md`.

## Previous full build — 1.71.0 (Android build 188)

Version 1.71.0 bundles the new fitted character models directly in the full APK:

- uses the supplied royal Valkorion model as two exact modes: the intact
  ten-piece clothed base body and the complete 23-piece Lord's royal set with
  gothic jewelry
- switches to the supplied 40-piece complete kit whenever Valkorion equips
  Dominus or House armor
- adds the supplied 28-piece female-and-gown model to Libita Savitas's person
  and equipment views, loading it only when her modal is opened
- preserves the original model transforms and part names; base/Lord switching
  changes visibility only, so fitted pieces are not exploded or rebuilt
- keeps all body, armor, helmet, and cape geometry untouched; only the six
  weapon meshes received a 1% size pass so the complete kit fits below the
  100 MB Tripo/GitHub ceiling
- retains touch rotation, front reset, bounded canvases, portrait fallbacks,
  rollback protection, tournaments, and every earlier game system
- adds a permanent gold **Game Updates** button above the Systems bar, plus the
  same route in the Opening Menu and live Systems dock
- displays the exact update address and shows connection, received bytes,
  percentage, checksum verification, install, and restart states on screen
- signs Android build 188 with both APK Signature Scheme v1 and the modern v2
  whole-file signature required by current Android versions

Exact model structure, hashes, upload sizes, and seam-protection checks are in
[`assets/v171/README.md`](assets/v171/README.md) and `AUDIT_v1.71.0.md`.

## Previous full APK foundation — 1.70.0

Version 1.70.0 restores the finished character and tournament work to Android build 187:

- replaces the old simplified Valkorion and the exploded wardrobe export with the centered, assembled 40-piece `Valkorion_Complete_Kit_Clean` model
- keeps the model interactive in the Wardrobe Trunk with one bounded WebGL canvas, touch rotation, front reset, and no stray black overlay
- adds persistent, playable **Jousting Lists**, **Armored Duel Ring**, and **Archery Butts** systems at Corvinus Keep
- uses the corrected heraldic jousting, duel, and archery scenes; rejected empty/rain-only scene variants are not bundled
- shares time, energy, coin, wounds, skills, Nobility standing, renown, and championships with the existing save state
- retains all content from the 1.69.2 APK, including the opening-menu and permanent Systems-dock **Game Updates** access
- preserves the existing package name and signing identity so it installs directly over Android build 186 without deleting saves

The finished GLB is bundled in the APK because its 106,006,128-byte source exceeds GitHub's ordinary single-file repository limit. Its exact SHA-256 is recorded in [`assets/v170/README.md`](assets/v170/README.md).

## Update transport retained from 1.69.2

Version 1.69.2 repairs the Android update-channel transport and bundles the startup fix:

- replaces the rejected raw `text/plain` script request with GitHub Contents JSONP, then decodes and evaluates the exact `channel.js` bytes locally
- retains a JavaScript MIME-type CDN fallback if the primary GitHub API request cannot complete
- limits the decoded channel document to 100,000 bytes before execution
- bundles both the safe updater and the title-menu access repair into Android build 186
- preserves the existing signing identity so the APK installs over build 185 without clearing app data

The transport cause, trust boundary, and regression checks are recorded in `AUDIT_v1.69.2.md`.

## Startup access repair retained from 1.69.1

Version 1.69.1 repairs startup access for installations with an autosave:

- every app launch now stops at the opening menu instead of silently consuming the autosave and jumping into the game
- the opening menu keeps **Continue** and **Game Updates** visible without deleting the autosave or any manual timeline
- **Game Updates** is independently restored in the live Systems dock after every UI redraw
- opening the title menu stops background speech and music cleanly; continuing resumes the normal game render

The startup cause, save-preservation boundary, and regression checks are recorded in `AUDIT_v1.69.1.md`.

## Safe updater foundation retained from 1.69.0

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
node tests/test_v1691_start_menu_access.cjs
node tests/test_v1692_updater.cjs
node tests/test_v170_updater.cjs
node tests/test_v170_valkorion.cjs
node tests/test_v170_tournaments.cjs
node tests/test_v171_character_models.cjs
node tests/test_v171_update_center.cjs
python3 tests/validate_v171_models.py
node tests/test_v172_character_models.cjs
node tests/test_v172_channel.cjs
node tests/test_v172_update_center.cjs
node tests/test_v172_runtime_repair.cjs
node tests/test_v1721_character_loader_hotfix.cjs
node tests/test_v1721_character_models.cjs
node tests/test_v1721_update_center.cjs
node tests/test_v1721_runtime_repair.cjs
node tests/test_v1722_android_shell.cjs
node tests/test_v1722_character_models.cjs
node tests/test_v1722_update_center.cjs
node tests/test_v1722_runtime_repair.cjs
python3 tests/validate_v172_models.py
python3 tests/validate_v1722_mobile_models.py /path/to/APK/assets/game/assets/v172
python3 tests/validate_v170_assets.py /path/to/extracted/assets/game
python3 tests/validate_v168_portraits.py
node --check patches/v1.63.0-valkorion-final.js
node --check patches/v1.64.0-world-ui-integrity.js
node --check patches/v1.65.0-world-economy-cleanup.js
node --check patches/v1.66.0-living-world-balance.js
node --check patches/v1.66.1-immersive-narrator-sophia.js
node --check patches/v1.67.0-identity-world-integrity.js
node --check patches/v1.68.0-curated-npc-portraits.js
node --check patches/v1.69.0-safe-updater.js
node --check patches/v1.69.1-start-menu-access.js
node --check patches/v1.69.2-safe-updater.js
node --check patches/v1.70.0-safe-updater.js
node --check patches/v1.70.0-valkorion-complete.js
node --check patches/v1.70.0-tournaments.js
node --check patches/v1.71.0-character-models.js
node --check patches/v1.71.0-safe-updater.js
node --check patches/v1.71.0-update-center.js
node --check patches/v1.72.0-character-models.js
node --check patches/v1.72.0-safe-updater.js
node --check patches/v1.72.0-update-center.js
node --check patches/v1.72.0-runtime-repair.js
node --check patches/v1.72.1-character-loader-hotfix.js
node --check patches/v1.72.1-character-models.js
node --check patches/v1.72.1-safe-updater.js
node --check patches/v1.72.1-update-center.js
node --check patches/v1.72.1-runtime-repair.js
node --check patches/v1.72.2-character-models.js
node --check patches/v1.72.2-safe-updater.js
node --check patches/v1.72.2-update-center.js
node --check patches/v1.72.2-runtime-repair.js
node --check patches/v1.72.3-character-models.js
node --check patches/v1.72.3-safe-updater.js
node --check patches/v1.72.3-update-center.js
node --check patches/v1.72.3-runtime-repair.js
node --check channel.js
python3 tests/validate_v163_glb.py /path/to/downloaded/valkorion_final.glb
```
