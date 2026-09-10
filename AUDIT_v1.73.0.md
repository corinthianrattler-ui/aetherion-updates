# Aetherion Reforged v1.73.0 — Portrait and Living-World Audit

## Result

Version 1.73.0 is a script-and-art update for the verified v1.72.6 Android
build 195. It does not replace the APK, native shell, 3D models, or save file.
The stable channel remains below the installed updater's 100,000-byte limit and
retains the v1.72.7, v1.72.8, and v1.72.10 repairs.

## Catalog reconciliation

The supplied recruitable catalog and complete worker catalog were compared at
the source-image level. All 42 recruitable source images occur exactly in the
larger collection, so they are installed once rather than duplicated.

The complete catalog contains 73 authored pages:

- 65 four-panel pages, producing 260 individual portraits
- 8 single-portrait pages
- 268 unique output portraits in total

Every output is a decoded 512×768 WebP with its authored role/age/gender label
still visible. The encoded library is 19.08 MiB. Pixel hashes confirm that all
268 images are distinct. Together with the 111-image v1.68 library, the game
now has 379 reviewed curated portrait choices.

`custom/npc-portraits/v173/registry.json` records each portrait's source page,
panel, role, aliases, gender, age band, allowable age range, race, military and
bannerless flags, and ambient-only status.

## Identity routing

Portrait selection is deterministic from the persistent person ID, name, role,
and location. A candidate must match all applicable constraints:

- gender
- visual age band
- race, including distinct orc, elf, dwarf, and dark-elf captives
- occupation or a reviewed equivalent, such as scout/caravan scout or
  dockworker/stevedore
- bannerless allegiance for bannerless-only art

Named and canonical figures, exact unique-character art, custom companions, and
user portraits are protected. Existing generic worker, dynasty, unit, and v1.68
reusable role art may be upgraded when it is incompatible. A compatible v1.68
portrait remains in circulation, so the release adds to the earlier variety
instead of needlessly replacing it.

Bonded-market location is not treated as ancestry. A bonded adult without an
explicit nonhuman identity remains human even when offered in Stonevein Halls or
Grimhorn; explicitly identified orc, elf, dwarf, and dark-elf records still use
their matching art.

Existing saves receive one bounded migration. New NPC factories check only the
new person or returned batch. Redraws, person cards, daily schedules, daily
ticks, and already-migrated saves do not perform whole-world portrait scans.

Portrait URLs use one fixed raw-GitHub root. An image load failure switches that
element to compatible packaged dynasty art, preserving offline play and keeping
person views functional.

## Children and ambient life

The catalog's four teens, four toddlers, and four babies are marked
`ambient-only`. Compatibility rejects adult worker art for them and rejects
youth art for adults. They appear in household records, People Here, and the
daily schedule ledger. Their schedule phases are age appropriate—caregiving,
sleep, play, lessons, and social time—and never describe employment. No youth
record is added to worker registries, labor markets, or recruit halls.

## Occupations and mechanics

Most catalog occupations already had real jobs in the 110-role worker system,
port labor, logistics, shops, medicine, courts, or recruit mechanics. Aliases
therefore reuse those systems rather than creating duplicates.

The actual gaps receive these systems:

- **Banker:** named permanent banker in Solaris; a named Dominus banker appears
  after that bank is founded. Counter business runs 08:00–17:00 and closes each
  seventh day. Deposit, withdrawal, bullion, reserve, mint, and currency logic
  continues through the existing banking system.
- **Beekeeper:** persistent hives and hive health produce honeycomb and beeswax;
  winter and severe weather reduce output.
- **Goatherd:** persistent goat count and herd health produce milk, with bounded
  births and losses over time.
- **Poultry Keeper:** persistent flock count and health produce eggs, with
  bounded chicks and predation.
- **Skilled Artisan:** a hireable craft/engineering/trade specialist connected
  to the existing workshop and retained-labor model.
- **Military contracts:** bannerless archer, crossbowman, sergeant, swordsman,
  footman, and militia recruit enter the persistent recruit hall with distinct
  skills, signing costs, wages, morale, loyalty, and bannerless conversion
  eligibility. Existing Bannerless Knight and Man-at-Arms jobs remain intact.

Rural production advances weekly, reacts to season and current weather, keeps
bounded household stores, moves goods into organized local markets, and applies
small bounded settlement health and prosperity effects. Named rural residents
can sell their available output through the existing physical inventory,
capacity, payment, and elapsed-time rules.

## Verification

The release checks cover:

- 268 decodable, unique, correctly sized WebPs
- exact registry numbering and all 73 source pages
- balanced gender totals and declared age/race counts
- strict adult/youth separation
- named and user-art preservation
- correct occupation, gender, age, race, and bannerless routing
- new resident, labor, and recruit generation
- rural weekly production and settlement effects
- bank hours and transaction gating
- no repeated save-migration or redraw scan
- simultaneous use of both compatible curated portrait libraries
- bonded-market identity routing without location-derived race changes
- exact channel module sources and SHA-256 hashes
- staging through the bundled v1.72.6 safe updater
- manifest sizes, hashes, URLs, Android build identity, and save policy
- all 95 packaged scripts in a real fresh-state and migrated-state VM runtime
- all 2,748 packaged game files, local HTML/CSS references, JavaScript syntax,
  2,305 images, 124 media files, four GLBs, and 3,127 APK entries

The stable `channel.js` embeds five checksum-verified modules, is compatible
with Android build 195, requires no APK download, and remains within the
updater's response and module limits.
