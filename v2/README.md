# Aetherion signed update channel

Android build 196 introduces the schema-2 maintenance updater. A signed release manifest is cumulative and may:

- add an extension;
- add or replace an `assets/` or `custom/` resource;
- retire a downloaded payload or a routed asset path;
- retain one prior release for rollback; and
- garbage-collect downloaded blobs no longer used by the active or rollback release.

Save data is outside this store and is never a valid manifest target. Files physically baked into an APK are only removed by a later full APK maintenance build; a web update can retire their routing without rewriting the installed APK archive.

The public verification key is committed here. The private update-signing key is intentionally not stored in GitHub.
