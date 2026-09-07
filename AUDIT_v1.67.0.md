# Aetherion Reforged v1.67.0 — Identity and Whole-World Integrity Update

## Release decision

Version 1.67.0 is a save-safe correction for portrait identity, age presentation, roster naming, obsolete morale scaling, and missing legacy media. It also re-runs the retained economy, shop, item-purpose, conversation, narration, and world-state checks from versions 1.64–1.66.1.

No companion, relative, prisoner, retainer, item, crafted object, holding, quest, relationship, inventory stack, or valid story entry is removed. A restart is required after installation so every wrapper is applied in the intended order.

## What caused Merric Pike’s mismatch

`Merric` is a masculine name in Aetherion’s authored name lists. The pictured old woman was not meant to be Merric Pike.

Two later systems had broken the original identity:

1. the worker generator correctly named the third starting carriage driver **Merric Pike**;
2. a later name-repair routine re-rolled sex from a role hash instead of respecting the chosen name;
3. the generic portrait routine then selected a reusable face without enforcing sex and visual-age compatibility;
4. several conversion and oath paths could replace an individual face with occupational or formation art again.

Version 1.67.0 makes name, sex, age, race, and portrait one coherent identity record. Merric remains male and receives a male face in the correct visual-age band. The same rule is applied to generated residents, candidates, workers, agents, prisoners, relatives, and dynasty members rather than special-casing only the screenshot.

## Central portrait catalog

Every packaged image is now classified before it can be used as a person portrait.

| Classification | Intended use | Person portrait eligible |
|---|---|---:|
| Exact named portrait | One authored named character | Yes, only for that identity |
| Reusable person portrait | Generated people in a tagged sex/age band | Yes |
| Reusable prisoner portrait | Compatible generated prisoners | Yes |
| Occupational reference | A trade, duty, or workplace | No |
| Formation reference | A military unit or group | No |
| Scene, location, room, item, transport, or animal | Its labeled world purpose | No |
| Narrator emblem | Story-log speaker emblem | No |

The audit tagged all **1,966 packaged images**. It found **202 exact named portrait assets**, **38 reusable person portraits**, and **115 occupational reference images**. There are no untagged packaged images and no catalog entries pointing outside the package.

All reusable human portraits were visually reviewed and assigned to explicit bands: child 0–12, teen 13–17, young adult 18–25, adult 26–39, mature adult 40–49, older adult 50–59, and elder 60+. Dwarf, elf, and orc presentation uses race-adjusted visual aging, so chronological age is not treated as identical human appearance.

Exact art always wins for a named character. A character such as Lady Alexus, Kael, Nessa, Libita, a named surgeon, or a named port specialist does not lose authored art merely because age advances.

## Roster and save migration

The migration repairs existing saves and hardens every known path that can create or mutate a person:

- the twenty starting knights and thirty starting footmen receive stable individual ages and faces;
- numbered footmen receive deterministic male names instead of permanent `Footman 1` placeholders;
- carriage drivers retain coherent names, sex, age, household, and portrait data;
- settlement candidates, bonded records, labor markets, resident families, surgeons, port labor, crime contacts, intelligence agents, companions, prisoners, and dynasties are repaired;
- duplicate intelligence-agent names are replaced and their report bylines are updated;
- `Ser`/`Dame`, `Master`/`Mistress`, known first names, voice type, and portrait sex agree;
- conversion, swearing, hiring, recruitment, daily updates, save migration, and new-game creation can no longer restore formation or job art as an individual face;
- nested family portraits remain computed instead of storing thousands of redundant paths in the save.

The migration is deterministic and idempotent. Re-running it on an already repaired save produces the same serialized state. It records only a small version/audit marker in metadata.

## People interface and morale scale

The party list now shows sex, age, life stage, HP, **morale out of 100**, loyalty, role, rank, and order. Person detail screens no longer hard-code `Female`, and the obsolete `/5` label is replaced everywhere the active person modal can produce it.

The deeper scan found three legacy morale writers that still used the abandoned 0–5 scale:

- cold/heat stress could collapse a present retainer from 60 morale to 5;
- garrison training could do the same to stationed personnel;
- recreation could trap a genuinely low-morale soldier on the five-point scale.

All three paths now preserve the 0–100 scale. Existing clearly identifiable collapsed garrison or temperature-stress records are repaired on load.

## Missing media repaired

The asset audit also found older systems referring to media families that had never been included in the package. These were active defects, not harmless unused strings.

- illustrated settlement maps now resolve to the shipped Corvinus, Stonevein, regional, coastal, and world maps;
- Ascendant Tower, summit, altar, civic temple, dragon landing, and Blood Dragon views reuse appropriate shipped Blood Keep, chapel, and dragon art;
- the sword-duel screen uses shipped battle art;
- Libita’s later pleasure-scene selectors resolve to the two shipped success videos;
- missing duel and drum samples use lightweight offline synthesized effects;
- lute, harp, rebec, flute, and horn use distinct responsive synthesized voices instead of attempting to load a nonexistent 25-file sample bank;
- the older two-dimensional Valkorion fallback no longer requests missing layer files if WebGL is unavailable; the current v1.63 final 3D model remains primary and unchanged;
- previously found council, intelligence-office, rookery, raven, supply, household-room, item, and obsolete Valkorion references remain routed to valid shipped media.

The final runtime check exercised **119 active legacy display paths** and **93 explicit fallback routes**. It found zero unresolved active paths and zero fallback targets missing from the package. No new large image, video, audio, or model asset is added.

## Retained economy and shop balance

The full-world regression confirms the earlier balance changes still hold:

- **2,185** instantiated people/candidate records were inspected;
- **1,619** wage-bearing records were checked;
- the maximum ordinary weekly wage is **30 copper = 3 silver**;
- Mistress Ysabet Vale costs **2 silver 8 copper/week**;
- Master Halric Wren, Libita Savitas, and Maevra Voss cost **3 silver/week**;
- no signing advance is invented for ordinary weekly service;
- the Corvinus Provisioner begins with **five Good Wine Skins** at **6 copper each**;
- Good Wine is the first relevant provision card, can be bought into accessible storage, and is both drinkable and Kael’s preferred gift;
- Kael recruitment remains duplicate-safe and consumes only the intended one wine;
- ordinary specialist shops carry finite local goods while custom-fitted, House-issued, unique, bearer-bound, and heirloom gear remains craft/event only.

The purchase regression charged exactly 6 copper, removed one unit from shop stock, and placed one wine skin in the selected accessible container.

## Items, systems, narration, and conversation

The integrated audit checked **1,122 items**, **210 recipes**, and **60 world locations**. Fourteen generic `location` fields were also reviewed manually: nine correctly identify the wagon carrying a nested crate, two identify members of the Exile Retinue, and three identify body regions on wound records. They are valid domain labels, not broken world destinations.

- every item has a description/purpose and at least one gameplay route;
- every recipe input/output resolves to a real item;
- every item image resolves to packaged art;
- no protected custom or issued gear appears on ordinary shelves;
- no active person IDs or living names are duplicated;
- private conversation remains available;
- nearby group conversation produces multiple local speakers and a story response;
- natural dialogue fallback remains role-, relationship-, location-, and memory-aware;
- Narrator output remains first-person limited to Valkorion’s perception and contains no Help, payroll, menu, or tutorial prose;
- Sophia remains the separate system-help voice and does not write into the story log.

## Final validation results

The final integrated audit recorded:

| Check | Result |
|---|---:|
| Instantiated identity records in final seeded run | 3,375 |
| Invalid portrait assignments | 0 |
| Name/sex/title conflicts | 0 |
| Missing ages | 0 |
| Occupational/formation art used as a face | 0 |
| Missing person portrait files | 0 |
| Missing item image files | 0 |
| Unresolved active legacy media | 0 |
| Wages above 3 silver/week | 0 |
| Items without purpose/routes | 0 |
| Duplicate active IDs/names | 0 |

Automated tests additionally cover Merric Pike, named specialists, exact-character art, child/teen/adult/elder selection, non-human visual aging, stored-save repair, generated relatives, new hires, conversions, intelligence agents, Blood Dragon art, map/tower/video fallbacks, synthesized audio routing, 0–100 morale behavior, person-card rendering, and byte-stable repeated migration.

## Size and recommendation

This is a JavaScript-only overlay. It reuses media already present in the APK and adds no large download, so nothing useful was removed merely to save room.

No blocking defect remains in the audited systems. A future art expansion could replace the reused Ascendant Tower, intelligence, raven, and duel illustrations with unique commissioned images. That would be visual enrichment rather than a correctness fix; v1.67.0 deliberately uses coherent packaged fallbacks now instead of leaving blank screens while waiting for new art.
