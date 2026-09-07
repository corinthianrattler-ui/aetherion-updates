# Aetherion Reforged v1.68.0 — Curated NPC Portrait Integration Audit

## Release result

Version 1.68.0 installs the complete third NPC art pack into the live Android update channel instead of leaving it as a separate download. The update contains 111 image payloads: 110 new labeled full-body plates plus the unchanged square Quartermaster role portrait. The images total 20,872,616 bytes (19.91 MiB).

No save, person, item, shop, dialogue, lore, or prior patch was removed. Android version code advances from 182 to 183.

## Corrected Quartermaster identity

The earlier pack filename incorrectly called image 00 `quartermaster_halric`. Visual and source review showed that it is the original reusable Quartermaster role portrait, not the exact portrait of Quartermaster Halric Morn.

- The installed role asset is now named `custom/npc-portraits/v168/00_quartermaster_original_unchanged.webp`.
- Its bytes are unchanged: SHA-256 `84a754e8a3c649b70eff77f90cfb694339b515adbc0347b96157eeb1679c8199`.
- It may be assigned only to a compatible unnamed male, visually mature Quartermaster.
- Quartermaster Halric Morn remains locked to his authored named portrait at `assets/v29/portraits/quartermaster_halric.webp`.
- Halric's image is never replaced by the reusable role card.

The same exact-art protection applies to Valkorion, Alexus, Kael, Libita, Nessa, the authored surgeons and port officers, and every registered unique companion.

## Registry totals

| Tag | Count |
|---|---:|
| Total managed images | 111 |
| New full-body, visibly labeled plates | 110 |
| Preserved original role portraits | 1 |
| Female depictions | 61 |
| Male depictions | 50 |
| Human | 83 |
| Dwarf | 6 |
| Elf | 9 |
| Dark elf | 3 |
| Orc | 10 |
| Occupation portraits | 54 |
| Life-stage portraits | 12 |
| Faction military portraits | 45 |
| Mounted individual portraits | 27 |

Every registry row records its exact file, display label, sex, visual-age band, minimum and maximum visual age, race, occupation, role aliases, faction aliases, mounted status, named-character status, person eligibility, formation eligibility, full-body status, visible-label status, and review status.

## Visual-age rules

The selector uses visual age rather than blindly comparing fantasy calendar age. This keeps long-lived ancestries from receiving human elder art too early.

| Art tag | Visual age |
|---|---:|
| Infant | 0–1 |
| Toddler | 2–5 |
| Child | 6–12 |
| Teen | 13–17 |
| Young adult | 18–25 |
| Adult | 26–39 |
| Mature | 40–59 |
| Elder | 60+ |

Dwarf, elf, dark-elf, and orc visual aging uses the same established v1.67 world-identity conversion. A mismatch rejects the portrait.

## Routing matrix

### Civilian, family, and occupation pool

| Numbers | Intended use |
|---|---|
| 00–13 | Quartermaster, carriage driver, blacksmith, farmer, healer, merchant, hunter, carpenter, innkeeper, fisher, town guard, scribe, midwife, and adult courtesan |
| 14–19 | Page, shepherd, potter's apprentice, common infant boy, noble infant girl, and toddler boy |
| 20–25 | Dwarf miner/smith, elf herbalist/scribe, and ordinary-orc teamster/guard |
| 26–42 | Miller, steward, cook, laundress, brewer, baker, butcher, cellar keeper, farrier, courier, ferryman, armorer, mason, leatherworker, tailor, weaver, and market trader |
| 43–59 | Dwarf moneychanger, tax collector, warehouse keeper, orc porter, elf sailor, harbor pilot, dwarf quarry worker, elf apothecary, barber-surgeon, nurse, shrine keeper, gravedigger, bard, orc bounty hunter, bailiff, noblewoman, and house knight |
| 60–65 | Midwife's apprentice, stable hand, errand runner, goatherd, orc infant girl, and elf infant boy |

Child portraits are not exposed to adult romance or adult-work routing. The courtesan portrait is explicitly adult-only. Noble and common infant cards remain socially separated where the label requires it.

### Lore-faction military pool

| Numbers | Faction/location | Roles |
|---|---|---|
| 66–71 | Solara / Solaris Royal Crown | Solaran knights and lancer; Solaris royal knight, Sunshield Guard, and Crown Lancer |
| 72–74 | Corvinus Keep / House Corvinus | Raven knights and Corvinus outrider |
| 75–77, 109 | Highwatch Keep | Highwatch knights, hill scout rider, and watchtower sentinel |
| 78–80, 110 | White Harbor | Harbor knights, coastal scout rider, and quay guard |
| 81–82 | Frostreach Free Lords | Northern horse raiders |
| 83–84 | Winterhold | Winterhold rider and thane |
| 85–86, 105–106 | Eternal Glades / Greenhall | Forest cavalier, forest rider, bladesinger, and spellwarden |
| 87–88, 107 | Lorien Ford Underrealm | Shade Guard, cavern stalker, and hexblade adept |
| 89–90 | Ash Wastes Tribal Orcs | Ordinary-clan boar rider and orc raider |
| 91–92, 108 | Grimhorn | Grimhorn boar knights and Warchief Guard |
| 93–95 | Blood Keep Mercenary Legion | Heavy knights and Free Company rider |
| 96–98 | Redmont / Western Marches | Redmont knights and Rose Guard |
| 99–102 | House Dominus | Rose knights, imperial cataphract, and marine |
| 103–104 | Stonevein Halls / Ironspine | Hammer Guard and Forge Guard |

Faction art requires a matching recorded faction, house, culture, home, or location. A White Harbor card cannot appear on a Highwatch person; a Grimhorn beast-orc cannot be assigned to an ordinary Ash Wastes clan orc; Underrealm art remains dark-elf-only.

## Runtime selection order

1. Preserve an explicit user portrait.
2. Restore and lock exact authored art for named characters.
3. Preserve unique/canonical records even when they do not have a reusable portrait.
4. Require matching sex and race.
5. Require the correct visual-age band.
6. Require the displayed occupation or a reviewed role alias.
7. For faction plates, additionally require matching faction, house, culture, home, or location.
8. Prefer the most specific occupation and faction match.
9. Assign deterministically from the save identity so reloads do not reshuffle people.
10. Reserve a curated path after assignment. The same face cannot be assigned to a second active record.
11. If no unused compatible plate exists, retain or restore the safe v1.67 dynasty/prisoner portrait instead of showing the wrong labeled person.

This runs for existing saves and new games, generated residents, labor candidates, settlement rosters, bonded adults, surgeons, port labor, intelligence agents, prisoners, permanent NPCs, and people created through the common person factory. Dynasty and family portraits remain computed where appropriate to avoid save bloat.

## UI and failure handling

- Full-body plates use `object-fit: contain`, so the figure and upper-left role/faction plaque remain visible in square roster cards and large person views.
- Portrait paths live under the update-managed `custom/npc-portraits/v168/` directory. The v1.67 integrity layer already treats this namespace as person-safe external content, preventing the older classifier from erasing a valid new assignment.
- A failed image load falls back to a sex- and age-compatible packaged dynasty image rather than leaving a broken element.
- The central runtime API exposes registry lookup, compatibility inspection, selection, repair, and audit functions through `AetherionV168Portraits`.

## Save behavior

- Existing people and progress are migrated in place.
- No person is deleted, renamed, duplicated, or recreated by this update.
- Only compatible portrait paths and a compact `meta.v168PortraitLibrary` migration record are added to the save.
- Exact named art and user-selected custom paths are preserved.
- The migration is idempotent: repeated renders and reloads do not churn stable assignments.
- Removed or absent curated art returns to a safe packaged fallback.

## Validation performed

The release checks prove the following:

- all 111 expected numbers, 00 through 110, exist exactly once
- every WebP decodes successfully
- all 111 files have unique image bytes
- the original Quartermaster role portrait retains its exact checksum
- all 110 new plates remain full-resolution full-body assets with valid portrait aspect ratios
- filenames and registry sex/age tags agree
- every lore-faction entry has explicit faction routing
- dwarf, elf, dark-elf, and orc entries have explicit race tags
- wrong sex, age, race, role, and faction are rejected independently
- exact Halric and Kael portraits survive migration
- user portrait paths survive migration
- one-of-one art is not cloned across two people
- render-time integrity passes do not reshuffle portraits
- runtime state audit reports no incompatible, duplicate, or unregistered curated assignments
- every manifest size and SHA-256 hash matches the committed payload bytes
- all v1.63–v1.67 regression suites continue to pass

Commands:

```bash
python3 tests/validate_v168_portraits.py
node tests/test_v168_patch.cjs
node --check patches/v1.68.0-curated-npc-portraits.js
python3 tests/validate_manifest.py
```

## Download behavior

The stable manifest contains 120 managed payloads: the eight retained files from the existing update chain, 111 portrait files, and the v1.68 integration patch. Devices already current on v1.67 download only the new portrait library and v1.68 script because all earlier payload hashes are unchanged. A restart is required after the updater verifies and installs the files.
