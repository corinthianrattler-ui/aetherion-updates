# Aetherion Reforged 1.64.0 — World/UI Integrity Audit

This audit covers the reported Bannerless retinue, individual equipment, House armor issuance, convoy wagon presentation, and the adjacent save-migration paths that can reintroduce those failures.

## Confirmed defects and repairs

| Area | Severity | Root cause | Repair in 1.64.0 |
|---|---:|---|---|
| Bannerless identity/model mismatch | High | The v17 migration recalculated and overwrote every saved person's gender. Military roles were deliberately assigned female one time in seven without respecting an existing `Ser`/`Dame` title, recorded gender, or voice. A saved Ser could therefore select a female presentation model. | Preserve recorded identities; resolve explicit titles first (`Ser`/`Sir` → male, `Dame`/`Lady` → female); synchronize generic voice and any existing model/presentation gender fields. Legitimate Dames remain female. |
| Bannerless role portraits | High | The role-art table only covered Knight and Man-at-Arms. Archer, Crossbowman, Sergeant, and Swordsman were missing. | Add exact portrait mapping for every Bannerless formation role plus the starting Captain, Lesser Knight, and Footman roles. |
| Man-at-Arms portrait | High | Code referenced nonexistent `ASSET.unit_manatarms`; the actual asset key is `ASSET.unit_maa`. The fallback commonly showed the swordsman instead. | Bypass the broken alias and map directly to `assets/bannerless_man_at_arms.jpg`. |
| Portrait after role/rank change | Medium | Formation and rank setters changed text fields but left the old portrait cached on the person. | Repair the person and recompute role art after formation reassignment, rank changes, hiring, equipment issuance, and Dominus oath conversion. |
| Bannerless gear thumbnails | High | All 14 knight-service items were initially created with the full Bannerless Knight portrait; all 11 foot-service items used the full Swordsman portrait. | Assign the existing unique item art to every bascinet, standard, arming coat, hauberk, spaulder, gauntlet, belt, chausses, boot, cloak, sword, shield, dagger, seal, and foot-service component. |
| Missing pictures in personal equipment | High | An older text-only equipment renderer remained reachable after later UI layers, so a retainer's slots could show names without their item images. | Give Bannerless/service retainers one definitive slot renderer with the correct image, slot label, item name, weight, armor, and attack. A DOM repair also fills images in any later slot renderer that omits them. |
| Raw equipment weight | Medium | Derived weights such as `3 × 0.35` were printed directly, exposing binary floating-point values such as `1.0499999999999998 kg`. | Normalize item definitions and format visible weights to at most two decimal places (`1.05 kg`). |
| Foreign House armor controls | Critical rules error | The v98 wardrobe exposed armor-issuance buttons for every faction even though Valkorion rules only House Dominus. NPC/loot definitions and player authority were mixed in one interface. | Keep foreign armor data available to NPC and world systems, but remove foreign issuance controls from Valkorion's UI, label the section “Issue House Dominus Armor,” and guard v98 House-issue actions against foreign factions. |
| Wagonwright image overflow | High mobile UI | Wagon class art was inserted as a bare full-resolution image inside a card. It had no sizing class, so mobile used the image's natural height. | Scope all Wagonwright class art to a responsive cropped preview with a hard 168 px desktop / 132 px mobile maximum height. Existing convoy summary thumbnails are untouched. |
| Mobile equipment readability | Medium | Slot cards were not guaranteed to reserve space for thumbnails and could become cramped or omit art. | Add responsive two-column image/text slot cards, collapsing to one column on narrow phones. |
| Save repair persistence | Medium | A visual repair performed only during rendering can return after reload if the corrupted person record remains in the save. | Run an idempotent state migration, mark `meta.v164Integrity`, and persist once when the installed save is repaired. No inventory, currency, quest, relationship, or Valkorion model data is removed. |

## Asset verification

- The packaged asset manifest lists 2,004 files, and all 2,004 are present in the inspected APK.
- All six Bannerless role portraits are present.
- All 14 knight-service and 11 foot-service item images are present.
- The defects are incorrect data mapping and rendering, not missing image files.

## Behavior intentionally preserved

- Foreign House equipment definitions remain available for NPC armies, loot, trade, and world simulation; only unauthorized player issuance is blocked.
- Female knights with an explicit `Dame` identity remain female.
- Lady Alexus, Libita, unique companions, and their specialized wardrobe screens continue through their existing renderers.
- The v1.63.3 full-detail Valkorion GLB and its 54 fitted parts are unchanged.
- Player saves and physical inventory ownership remain intact.

## Regression coverage

The 1.64.0 automated test exercises:

1. corrupt `Ser` gender/model repair and valid `Dame` preservation;
2. all Bannerless role portraits;
3. all 25 service/foot item-art mappings;
4. illustrated personal-equipment output and formatted weight;
5. portrait refresh after formation reassignment;
6. fresh-state and migrated-state repair;
7. foreign House-issuance blocking while House Dominus remains allowed;
8. House-button removal and explanatory UI copy;
9. responsive wagon image constraints;
10. indirect updater evaluation beside classic-script lexical globals.

The entire pre-existing update test suite and the unchanged v1.63 Valkorion GLB validator are also run before publication.
