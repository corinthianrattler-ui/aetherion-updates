# Aetherion Reforged v1.66.1 — Narrator and Sophia Correction

## Release decision

Version 1.66.1 is ready as a save-safe follow-up overlay. It corrects the inappropriate v1.66 Narrator expansion shown in the Libita hiring screenshot and prevents the same class of error across every future Narrator event. It also adds a separate Sophia Help interface for mechanics. No player property, character, relationship, quest, item, crafted equipment, world event, or prior valid story entry is removed.

A restart is required after the updater installs the patch.

## Root cause

Version 1.66.0 wrapped every short Narrator block with generic paragraphs about wage ceilings, persistent state, witnesses, inventory, consequences, and knowledge rules. Although those paragraphs described intended simulation behavior, they were tutorial copy placed under the **NARRATOR** label. The result was especially conspicuous after Libita signed the company ledger: the story stopped to explain payroll and implementation consistency.

Version 1.66.1 installs after 1.66.0 and hands the older wrapper already-composed multi-paragraph story prose, so the obsolete expansion cannot append itself. The correction applies globally rather than patching only Libita’s line.

## Narrator contract

| Narrator now includes | Narrator now excludes |
|---|---|
| Story events and lore Valkorion encounters | Buttons, menus, tabs, and control directions |
| Immediate scenery, light, weather, temperature as bodily sensation, local sound, and physical surroundings | Payroll policy, wage ceilings, pricing rules, and denomination tutorials |
| Visible posture, speech, movement, injuries, equipment, and other observable reactions | Statistics, progress points, morale/cohesion numbers, and internal state labels |
| Letters, reports, testimony, and rumor explicitly framed as information received by Valkorion | Omniscient certainty about remote events or another person’s private thoughts |
| Physical consequences that remain in the scene | Inventory-screen, validation, state-tracking, and implementation language |

Narration is now first-person-limited where Valkorion acts or perceives. It converts “Valkorion enters…” to “I enter…,” turns surrounding weather into sight, sound, smell, or bodily sensation, and leaves anything beyond immediate evidence uncertain. Quoted speech is preserved rather than having its pronouns rewritten.

The system no longer pads every short event with the same abstract lesson. It selects event-grounded detail for travel, battle and injury, rest and performance, messages, oaths, recruitment, or the current physical environment. Already substantial authored lore remains substantial instead of being buried under generic filler.

## Saved-story repair

The migration scans only affected Narrator entries. It recognizes the exact v1.66 boilerplate and older mechanics phrases, removes those passages, and rebuilds the remaining event as first-person story prose. Unaffected character dialogue and valid narration are left in place.

The screenshot’s saved block changes in substance from:

> Libita signs the ledger. Weekly pay begins… the 3-silver weekly ceiling… the same figure appears wherever inspected…

to a scene in which Libita bends over the open company ledger, Valkorion hears the nib move across the parchment, the ink dries, and the ordinary footsteps and voices of Corvinus Keep continue around the table. Payroll instructions are not retained in the story.

The migration is idempotent: loading the same save again does not repeatedly rewrite or enlarge the repaired entry. A small metadata record notes the version and number of corrected blocks.

## Free actions and commands

The original free-text fallback could tell the player to use Inventory, Party → Order, or another control. Those paths now remain in-world:

- an unspecified meal or drink attempt ends with Valkorion’s hand empty because no physical item was chosen;
- an attack without a present hostile target ends before steel is swung at empty air;
- an unclear action stops at an unfinished gesture;
- an order without a named person, rank, or unit is heard, but no one steps forward to claim it.

The Help button explains how to use the controls when the player wants that information.

## Sophia, Goddess of Wisdom

Sophia is a system-help persona, not an in-world companion and not the Narrator. She appears in a dedicated modal reached from:

- **✦ HELP** in the Story header;
- **✦ SOPHIA · HELP** in the Systems dock.

Her topics cover speaking/acting/commanding, private and group conversation, coin and weekly pay, shops/gifts/crafting, travel and supplies, combat and wounds, and saving/updates. Her text is concise and direct because it exists to explain mechanics.

Sophia has a distinct voice profile: female, measured mature cadence, lighter pitch, clear tone, and the otherwise unused `af_sarah` neural voice in browser builds. Android receives her unique speaker identity with the safe mature-female performance route. The **Hear Sophia** control speaks the selected help entry without adding it to `S.story` or moving the unread-story cursor.

Her portrait reuses the already-packaged temple-priestess scene. No new image, speech model, audio, or other large asset is downloaded.

## Validation

The automated v1.66.1 regression test verifies:

- the exact four-paragraph Libita screenshot text is repaired on load;
- the obsolete v1.66 wrapper cannot re-append its tutorial paragraphs;
- new travel, tavern, hiring, group, free-action, and command narration contains paragraph breaks and no system directions;
- morale/cohesion numbers, deployment language, inventory-tracking language, and room-location implementation text are translated into observable story consequences;
- character dialogue is not rewritten by the Narrator hook;
- Sophia is present in both interfaces, opens all help separately, uses packaged art, receives the intended voice, and never adds a story entry;
- migration is idempotent and persists only the required save-safe correction.

The complete base game plus retained 1.64, 1.65, 1.66, and new 1.66.1 overlays also loaded together in the full-world audit harness without a runtime failure. All earlier wage, shop, Good Wine, Kael, identity, portrait, item-purpose, conversation, and save-size corrections remain active.

## Size and remaining recommendation

This release is a small JavaScript-only overlay and reuses existing assets. Nothing was removed from the game to make room because no large payload was added.

No further blocking correction was found for this issue. A future optional polish pass could give major locations larger hand-authored sensory vocabularies, but that should build on actual play examples rather than reintroducing generic filler. The v1.66.1 behavior is complete without it.
