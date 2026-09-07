# Aetherion Reforged 1.69.0 — Safe Updater Audit

## Outcome

Version 1.69.0 moves update recovery into the game UI. The opening screen and Systems dock both expose **Game Updates**. A channel check does not modify the running game. Complete JavaScript patch source is received, size-limited, SHA-256 verified, and staged locally before the player chooses to restart and activate it.

## Failure containment

- A staged release never replaces the APK's bundled 1.69.0 baseline.
- Before downloaded modules execute, the updater writes a boot-in-progress marker.
- The marker is cleared only after module execution, two animation frames, and a responsive health delay.
- If the process is closed or stalls before that point, the next launch detects the uncleared marker and restores the previous release automatically.
- **Safe Start once** skips all downloaded modules for one launch.
- **Use built-in version** removes downloaded release slots while leaving game saves untouched.
- Every downloaded release retains the previous release descriptor as a rollback slot.

## Transport and integrity

The Android shell intentionally keeps universal `file://` network access disabled. The stable `channel.js` therefore delivers patch source as data through an ordinary HTTPS script include. The bundled updater accepts only schema 2, semantic versions, bounded module identifiers and source sizes, exact SHA-256 hashes, and asset URLs under the project's raw GitHub or release namespaces. Large updates that exceed safe local patch storage must ship as a newly signed APK.

## Validation

- JavaScript syntax check passes for updater and channel.
- Automated regression verifies version comparison, SHA-256 acceptance and rejection, remote-asset origin rejection, boot-marker detection, and automatic rollback.
- Existing v1.60–v1.68 patch suites and manifest hash validation continue to pass.
