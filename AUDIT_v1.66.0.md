# Aetherion Reforged v1.66.0 — Living World Balance Audit

## Release decision

Version 1.66.0 is ready as a save-safe overlay. It corrects the wage, pricing, identity, portrait, item-purpose, dialogue, and narration defects found in the complete loaded game. It does not delete player property, quests, relationships, companions, crafted equipment, or progress. A restart is required after the updater installs the patch.

The audit loaded the full game and the retained 1.64 and 1.65 overlays, generated every settlement roster, migrated both fresh and seeded saves, and exercised active shop, hiring, payroll, item-use, conversation, and recruitment paths.

| Audited surface | Loaded count |
|---|---:|
| World locations | 60 |
| Person/employment records | 2,185 |
| Wage-bearing records | 1,619 after reconciliation |
| Item definitions | 1,122 |
| Crafting recipes | 210 |
| Licensed specialist-shop locations | 19 |
| Specialist stock rows | 2,628 |

## Findings and results

| Check | Before 1.66 | After 1.66 |
|---|---:|---:|
| Wage records above 3s/week | 1,065 | 0 |
| Highest weekly wage | 55s | 3s |
| Name/title/gender conflicts | 146 | 0 |
| Exact portraits assigned across genders | 26 people | 0 |
| Person portrait references absent from the packaged manifest | 119 | 0 |
| Item image references absent from the packaged manifest | 191 | 0 |
| Items without an explicit gameplay route | 1,122 | 0 |
| Items with only a generic fallback route | Not previously classified | 0 |
| Duplicate person IDs | 0 | 0 |
| Duplicate living names | 0 | 0 |
| Broken recipe item references | 0 | 0 |
| Custom/craft-only rows in ordinary shops | 0 | 0 |
| Issued service gear in ordinary shops | 0 | 0 |
| Ordinary classified goods unavailable anywhere | 0 | 0 |

The recurring render upgrader was also found to restore legacy 12s, 7s, and 2s values after migration. Version 1.66 wraps that path, so repaired wages remain repaired after loading, rendering, hiring, settlement generation, payroll, and later subsystem upgrades.

## Weekly pay policy

The game now uses one copper-standard wage function everywhere. One silver is ten copper; no weekly wage may exceed 30 copper, or 3 silver.

| Work tier | Typical weekly pay |
|---|---:|
| Laborers, servants, porters, farm and stable work | 4–6c |
| Guards, foot soldiers, archers, marines, and sergeants | 5–9c |
| Healers, scouts, scribes, foremen, navigators, and factors | 8–12c |
| Household and bannerless knights | 14c |
| Proven master craftspeople | 14–16c |
| Captains | 20c |
| Grandmasters and rare elite specialists | 24–30c |
| Realm-wide ceiling | 30c / 3s |

Specific corrections include:

- Mistress Ysabet Vale: **48s → 2s 8c/week**.
- Master Halric Wren: **55s → 3s/week**.
- Libita Savitas: **5s → 3s/week**, including late household and hiring code that previously restored the old value.
- Maevra Voss: **12s → 3s/week**.
- Family, bonded, independent, or holding-funded roles remain outside ordinary traveling-company payroll where their systems require it.
- Routine hires have no invented signing advance. Dismissal settles one correctly calculated current week.

The two surgeons now use dedicated, gender-correct portrait references and their surgery panel, hire operation, person record, story text, and payroll all show the same rate.

## Shop and currency repair

The specialist-shop code was treating canonical copper values as silver and multiplying them by ten again. The price shown at checkout could therefore be wildly out of scale with meals, wages, and the rest of the world. Version 1.66 makes the canonical item copper value authoritative for buying, selling, the item detail view, the codex, the legacy market, and Kael’s recruitment panel.

| Item | Old specialist price | Corrected price |
|---|---:|---:|
| Hard Biscuit | 10c | 1c |
| Bread Loaf | 20c | 2c |
| Good Wine Skin | 20s | 6c |
| Clean Bandage | 3s | 2c |
| Rope Coil | 13s | 4c |
| Leather Boots | 18s | 1s 3c |
| Arming Sword | 31s | 1s 9c |
| Gambeson | 32s | 2s 4c |
| Mail Hauberk | 113s | 3s 1c |

Across all 2,628 specialist rows, the old distribution was 1s minimum, 19s median, 76s at the 90th percentile, and 1,998s maximum. The corrected distribution is 1c minimum, 8c median, 2s 1c at the 90th percentile, and 170s 1c maximum. The expensive tail now consists of physical greatship sections, anchors, specialized wagons, and vessel deeds—not bread, wine, rope, or medicine.

Large intelligence expenses remain one-time, itemized capital or operational costs rather than weekly wages:

| Intelligence expense | Corrected one-time cost |
|---|---:|
| Secure office construction | 220s |
| Raven rookery construction | 140s |
| Spymaster appointment, covers, papers, and opening field reserve | 180s |
| Six trained ravens and initial stores | 24s |
| Office consumable restock | 18s |
| One field agent’s papers, clothes, travel, and operating advance | 45s |

These paths previously contained additional tenfold denomination errors. Eighty active money-moving functions were inspected after the repair; remaining multiplication by ten is intentional conversion from explicitly silver-denominated loot or services into copper, while percentage and random-roll arithmetic is unrelated to currency.

## Good Wine and Kael

- The Corvinus Provisioner begins with five Good Wine Skins.
- Wine is the first visible card on that shelf and is marked as Kael’s preferred gift.
- The shelf, item detail, codex, recruitment panel, and checkout all show **6c**.
- A purchase test charged exactly 6c, reduced stock by one, and delivered one physical Wine Skin to accessible storage, including wagon-capable destinations.
- Good Wine is also drinkable, so it remains useful after Kael joins.
- Kael recruitment consumes one accessible Wine Skin, creates exactly one person record and one companion record, and safely repairs partial or duplicate recruitment state. Repeating the operation does not duplicate Kael or consume another gift.

The retained shop model still gives each specialist a finite regional selection of 14–30 goods. Every ordinary classified item is stocked somewhere, all 12 court gifts remain obtainable, and custom, issued, House-bound, unique, restricted, and craft-only gear remains in its authored acquisition or crafting system.

## Every item has a purpose

All 1,122 item definitions now expose one or more specific gameplay routes in the item detail view. Route counts overlap because an item can serve several systems.

| Gameplay route | Items |
|---|---:|
| Direct physical use | 687 |
| Equipment | 278 |
| Craft output | 210 |
| Craft input | 24 |
| Maintenance | 129 |
| Study | 48 |
| Commerce | 854 |
| Authored acquisition | 246 |
| Relationship gift | 1 |

One hundred and one later-added books, medicines, provisions, tools, camp goods, containers, animal goods, and clothing items that had descriptive data but no reachable ordinary action are now wired into the existing study/use systems. Consumables are consumed, durable goods lose condition through use, books record study time, and equipment/crafting/authored items point to their real controlling system.

No item was removed. The problem was missing routing, not unnecessary content.

The 191 broken item image references were repaired by mapping them to 96 already packaged, semantically appropriate images. This adds no art download and no save data. It is intentionally size-conscious; unique bespoke art for every repaired item would be a separate future art-pack decision.

## People, portraits, and lore consistency

- Generated first names, gender fields, honorifics, voices, and portraits are reconciled together.
- `Ser`/`Dame`, `Master`/`Mistress`, and `Huntsman`/`Huntress` now follow the person rather than an independently selected job title.
- Generic job and scene pictures are replaced with deterministic gender- and age-appropriate dynasty portraits for generated people.
- Named characters with dedicated art retain their authored portraits.
- Future settlement candidates pass through the same repair path, so the issue does not return when a new roster is generated.

The post-migration audit found no unresolved name/title/gender mismatch, no exact portrait reused across genders, and no missing person portrait reference.

## Conversation and narration

Private conversation is retained. When generated awareness is enabled, the existing private offline/online character-response path remains active. When it is disabled, the scripted path now answers according to the person’s role, current order, temperament, location, weather, knowledge limits, and the subject being discussed. If an enabled model or online provider fails, the game now reports the fallback and supplies that grounded scripted answer instead of leaving the conversation unanswered.

The new **Address Everyone Present** mode:

- records a public rather than private exchange;
- includes up to 60 actually nearby people as listeners;
- selects the 3–4 people whose duties are most relevant to answer first;
- gives each responder a distinct, substantive role-grounded answer;
- stores public-memory facts for aware characters; and
- allows an immediate return to private speech from the same selector.

Generated private dialogue is prompted to use grounded medieval language spoken by real people: no forced `thee/thou`, `forsooth`, `prithee`, stage directions, fake omniscience, or invented lore. Honest short answers remain possible; developed answers use 2–4 paragraphs and a practical next step. The local generation allowance now ranges from 220 to 320 tokens instead of being forced down to 160.

Short narrator lines now expand into four grounded paragraphs, up to 1,200 characters, covering the immediate event, physical context, witnesses, and persistent consequences. Already detailed authored narration is left intact. The audited short departure sample expanded to 757 characters in four paragraphs.

Conversation exchanges, archives, worker history, intelligence reports, and Libita’s mission/intelligence logs are bounded so longer writing cannot grow a save forever.

## Save and size behavior

- Existing saves migrate in place and persist once.
- Owned items, quantities, conditions, equipment, money, relationships, companions, quests, and story progress are not reset.
- The price policy is stored as one marker, not thousands of copied prices.
- Audited complete serialized state remained about **1.49 MB**; the specialist-shop portion remained **194,442 bytes**.
- No new images, models, audio, or video are shipped in this update.

## Regression coverage

The release tests cover:

- wage caps and role tiers;
- recurring render/migration wage resets;
- surgeon displays, portraits, and hiring;
- Libita and Maevra late-system resets;
- specialist and legacy shop price display, purchase, sale, stock, delivery, and refund behavior;
- item-detail and codex price consistency;
- item image and gameplay-route coverage;
- book/use action wiring;
- name/title/gender/portrait generation;
- private and group conversation;
- dialogue prompt and narrator expansion;
- bounded histories;
- intelligence construction and operating costs;
- Kael’s gift and duplicate-safe recruitment;
- every retained 1.60–1.65 patch; and
- all four retained Valkorion GLB validators.

## Remaining recommendation

There is no known functional blocker in the audited paths. The best next check is a short real-device visual pass through the medical panel, several mixed-gender hiring rosters, the provisioner, the item codex, and one crowded group conversation. The only optional content follow-up is bespoke art for the 191 repaired item references; the current packaged reuse is functional, coherent, and substantially smaller.
