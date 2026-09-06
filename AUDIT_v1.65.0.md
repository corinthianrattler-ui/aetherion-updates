# Aetherion Reforged 1.65.0 — World Economy and Recruitment Audit

This release audits the full item-to-shop path, specialist inventories, legacy markets, currency units, settlement keys, purchase destinations, booksellers, court gifts, and Kael of the Azure Tide’s recruitment state. The repair is an overlay migration: it preserves player inventory, equipment, coin, quests, relationships, holdings, and story progress.

## Confirmed defects and repairs

| Area | Severity | Root cause | Repair in 1.65.0 |
|---|---:|---|---|
| Good Wine Skin discovery | Critical progression | `wine_skin` existed and was technically stocked, but it was typed as food, carried a meat glyph, appeared 70th in a 131-row Provisioner list, and the v70 shop had removed search and paging. | Define it as an ordinary drink and Kael gift, guarantee at least five in Corvinus on migration, feature it as the first Provisioner card, restore shop search/paging, and link Kael’s screen directly to the correct shop. |
| Tenfold shop price error | Critical economy | The current realm uses 10 copper per silver, but v70 multiplied every displayed silver price by 100. A displayed 20s wine skin silently cost 2,000 copper. Selling used the same wrong scale. | Convert specialist prices with the canonical 10-copper silver unit. A 20s Good Wine Skin now costs exactly 200 copper, and every buy/sell amount is displayed through the real denomination formatter. |
| Issued/custom gear sold everywhere | Critical world rule | The shop filter did not recognize quality `Issued`, allowing all 25 Bannerless knight and foot-service components into every smithy. Other personal and House items depended on fragile name regular expressions. | Add an explicit acquisition policy. Issued kit, House heirlooms, unique companion gear, fitted personal gear, Blood Keep creations, and system-bound equipment cannot enter or be sold to ordinary shops. Their authored craft, commission, issue, quest, or recruitment paths remain intact. |
| Identical global catalog | High | Every one of 20 shop locations received the complete eligible item catalog: 632 rows per settlement and 12,640 specialist rows per fresh save. | Replace the global catalog with deterministic regional stock. Villages carry up to 14 goods per specialist, towns 20, keeps 26, and major hubs 30. Essentials remain dependable, regional goods receive priority, and every ordinary classified item is available somewhere. |
| Save-state bloat | High | All full catalogs were serialized into every save, along with repeated protected-item purge arrays. The v70 shop state alone occupied about 861 KB. | Curated specialist state now uses 2,628 rows across 19 valid locations and about 194 KB in the real-game audit. Purge arrays become compact counts; histories are safely bounded. No player-owned record is removed. |
| Court gifts missing | High | The 12 completed v13 gifts used category `gift`, which the specialist router did not understand. Eleven never appeared; the cloth doll entered a clothier accidentally because its name contained “cloth.” | Route ordinary gifts to Books, Maps & Gifts. Solaris and restored Blood Keep carry the complete court-gift selection; other settlements carry smaller local selections. Craft recipes remain valid alternatives. |
| Stale study capitals | High | The bookseller gate referenced nonexistent locations (`Frostreach`, `Stonehall`, `Eldarin`, `Nocthar`) while later code seeded rare books broadly in unrelated settlements. | Use eight real licensed study centers: Solaris, Corvinus Keep, Southport, White Harbor, Winterhold, Stonevein Halls, Greenhall, and Lorien Ford. Rare manuals are stocked and priced consistently only at those centers. |
| Ghost settlement | High | `V49_URBAN` used `Seals End`; the world map uses `Seal’s End`. This created an invalid shop, market, and permanent-NPC key. | Correct the source list in place, merge recoverable NPC/market data into `Seal’s End`, update exact saved location references, and remove the ghost specialist shop. |
| Phantom shops at roads and ruins | Medium | The persistent trade directory could open all six specialist counters even where no physical commerce district was registered, creating a shop on demand at a road or unrestored ruin. | Limit specialist counters to the curated settlement list and restored Blood Keep. Other sites now explain that no permanent merchant row exists instead of manufacturing one. |
| Wagon delivery blocked | Medium | v70 deliberately removed wagons from the purchase-destination list even though the physical cargo system supports them. | Allow every accessible physical container, including operational wagons, and show current weight and slot capacity in the destination selector. |
| Kael duplication | Critical save integrity | Recruitment consumed wine and created a new Kael person every time the function was called. A second tap produced two people while only one companion record existed. | Make recruitment location-, meeting-, gift-, and state-safe. Repeated calls consume nothing and retain exactly one person plus one companion. Existing duplicate records are reconciled, and a save marked recruited but missing either record is repaired. |
| Kael acquisition dead end | High | Kael’s panel only said to bring wine and offered no stock, price, owned quantity, or route to the merchant. | Show accessible wine count, live Corvinus stock, exact price, and a direct Provisioner button that opens with “wine skin” already filtered. |
| Shop count mismatch | Medium | Settlement shop cards counted legacy aggregate-market rows while the opened counter used a different v70 inventory. | Count the actual finite stock shown by the specialist counter. |
| Legacy recontamination | High | The v66 compatibility seeder could re-add issued or protected items after a cleanup because its candidate rule excluded only `Heirloom`. | Rebuild compatibility seeding around the same ordinary-market policy and sanitize old market rows once. Custom gear cannot re-enter through aggregate trade. |

## Balanced shop policy

- Ordinary food, drink, medicine, clothing, tools, materials, arms, books, records, maps, travel goods, luxuries, and gifts remain commercially obtainable.
- Shops carry a useful local selection rather than the entire world database.
- Core necessities are prioritized at the matching specialist.
- Regional goods receive deterministic preference, so traveling to a different settlement changes the shelves without rerolling on every render.
- Player-sold ordinary goods may remain temporarily as limited local buyback stock.
- Custom, issued, personal, House, unique, relic, quest, contraband, and owner-bound goods follow their dedicated systems.
- Corvinus always begins this migration with a usable Good Wine Skin supply; after that, purchases are finite and at least one bottle returns per new day until stock reaches five.

## Save and compatibility behavior

- The migration is idempotent and records `meta.v165WorldCleanup`.
- Existing shop cash and valid selected stock quantities are retained within the shop system’s intended cashbox bounds.
- Player containers, equipped stacks, warehouse cargo, wagons, currency, people, quests, court state, and progression are not rebuilt or deleted.
- Only NPC market/shop duplicates, invalid ghost-location records, disallowed merchandise, oversized purge logs, and excess generated catalog rows are removed.
- Older saves missing the wine row receive it even if v23’s original one-time seed flag was already set.
- The compatibility market remains available to older trade and bookseller screens without being allowed to repopulate protected gear.

## Real-game verification

The patch was evaluated after the complete inspected APK script stack and the active 1.64.0 overlay, using the same indirect-evaluation model as the Android updater.

| Check | Before | After 1.65.0 |
|---|---:|---:|
| Specialist rows at Corvinus | 632 | 180 |
| Specialist rows across the world | 12,640 | 2,628 |
| v70 serialized state | ~860,928 bytes | ~194,405 bytes |
| Identical full-catalog locations | 20 | 1 |
| Invalid shop locations | 1 | 0 |
| Issued service items in shops | 25 | 0 |
| Ordinary court gifts commercially available | 1 of 12 | 12 of 12 |
| Ordinary classified items unavailable anywhere | — | 0 |
| Good Wine Skin purchase | displayed 20s / charged 2,000c | displayed 20s / charged 200c |
| Kael records after two recruitment calls | 2 people / 1 companion | 1 person / 1 companion |

The audit also found no missing recipe output or ingredient references. The prior 1.64.0 packaged-asset audit remains valid: all 2,004 files listed by the APK asset manifest are present.

## Regression coverage

The automated v1.65.0 test covers:

1. wine definition, art, routing, guaranteed stock, visible placement, exact buy/resale values, purchase, and daily recovery;
2. every court gift’s commercial route, including the complete range after Blood Keep is reclaimed;
3. issued, unique, personal, House, and Blood Keep gear exclusion from buying and selling without touching an owned issued item;
4. regional catalog size, variation, and complete world coverage for ordinary items;
5. ghost-location migration;
6. specialist and compatibility-market cleanup;
7. wagon purchase destinations and capacity labels;
8. shopless roads/unrestored ruins, restored-holding commerce, search, and mobile paging;
9. duplicate-safe recruitment and missing-record recovery for Kael;
10. history bounds, one-time persistence, save-size reduction, and indirect updater evaluation.
