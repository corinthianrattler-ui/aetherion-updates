# Aetherion Reforged 1.69.2 — Android Update Transport Repair

## Outcome

Android build 186 can check the stable channel from the packaged `file:///android_asset/game/index.html` WebView. The APK also contains the 1.69.1 opening-menu repair, so **Continue** and **Game Updates** are available immediately and do not depend on downloading a first patch.

## Root cause

The 1.69.0 updater inserted the raw GitHub `channel.js` URL as a script element. GitHub serves that URL as `text/plain; charset=utf-8` together with `X-Content-Type-Options: nosniff`. Android WebView therefore refused to execute the response as JavaScript and reported that the update channel could not be reached.

## Repair

- The primary request uses GitHub's Contents API with a fixed JSONP callback. Its response is served as JavaScript and contains the exact repository file bytes as base64.
- The updater validates the HTTP status, encoding field, data shape, and a 100,000-byte decoded-source limit before evaluating the channel document.
- A direct jsDelivr script request is used only if the primary response fails or is incomplete.
- Both transports still feed the existing release sanitizer, module-size limits, trusted-origin rules, and per-module SHA-256 verification before anything can be staged.
- `v1.69.1-start-menu-access.js` is loaded from the APK after the game scripts, while `v1.69.2-safe-updater.js` loads first to provide the updater API.

## Save and installation boundary

- The package name and signing certificate are unchanged from Android build 185.
- Installing build 186 over build 185 does not uninstall the app or clear its WebView storage.
- Neither bundled patch removes, rewrites, or migrates the autosave or manual timelines.
- Staged-update rollback, **Safe Start once**, and **Use built-in version** remain active.

## Validation

- A VM regression decodes a Unicode GitHub JSONP fixture and delivers its stable feed through the live updater callback.
- The same regression forces the primary script to fail and verifies selection and delivery through the JavaScript-safe CDN fallback.
- Invalid GitHub response metadata is rejected.
- Checksum rejection, asset-origin rejection, failed-boot recovery, and rollback tests remain covered.
- The final APK is checked for Android version `1.69.2` / code `186`, exact embedded patch hashes, archive integrity, and the existing signing certificate.
