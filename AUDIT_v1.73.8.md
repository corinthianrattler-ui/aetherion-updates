# Aetherion Reforged v1.73.8 Audit

## Scope

This staged update repairs the return of repeated dynasty headshots in the
military roster and other eligible portrait views. It preserves the verified
v1.72.6 Android build, every gameplay system, and existing saves.

## Root cause

The saved people were generally still assigned the correct v1.73/v1.73.1
full-body URLs. Android failed to load those raw GitHub images, then the older
image-error handler deliberately substituted a gender/age dynasty head. That
substitution happened only in the rendered page, so deleting the packaged head
files would have produced broken image boxes without fixing delivery. A second
edge case allowed a save carrying the old completed-migration marker to skip a
new repair even if its actual stored portrait had become generic.

## Repair

- Full-body portraits display through an encoded jsDelivr URL that does not
  enter the obsolete dynasty-head handler.
- A failed CDN request retries the exact same full-body file through the raw
  GitHub source. If both sources fail, the neutral Dominus rose is used; a
  generic person's head is never impersonated as another character.
- Roster cards, modal content, and direct shop-worker cards use one display
  rule. Stored portrait identity remains canonical, so role, gender, age,
  race, bannerless, mutation, and audit logic still work.
- A new v1.73.8 save marker forces one bounded repair across existing people,
  residents, labor markets, recruits, bonded markets, surgeons, and agents.
- The party's service knights are balanced again before individual generic
  records are repaired. Named, canonical, custom-companion, user, and authored
  portraits remain protected.
- The 2:3 `object-fit: contain` presentation remains active, and the v1.73.7
  sky-clock placement is retained inside the compact stable bundle.

No art or gameplay content was deleted. The only behavior removed is the
incorrect cloned-head fallback for the new full-body catalogs.

## Verification

- A targeted regression recreates the old completed markers plus dynasty-head
  records, confirms migration to distinct full-body paths, and simulates both
  network failure stages without allowing the old handler to run.
- The complete extracted game loads all 95 packaged scripts before v1.73.8 and
  passes fresh-save, marked-old-save, 20-knight diversity, worker, household,
  banking, rural-production, camp-film, Watch Post, seasonal sleep, waiting,
  fatigue, and UI checks.
- All 268 v1.73 and 12 v1.73.1 portrait files remain checksum-managed and
  decode at 512×768.
- The one-module channel verifies through the installed build-195 safe updater
  and remains below its 100,000-byte limit.
