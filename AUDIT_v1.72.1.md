# Aetherion Reforged v1.72.1 armor-loader audit

Android build 190 corrects the loader failure visible after installing v1.72.0:
the gold update overlay was gone, but the Wardrobe Trunk still showed the flat
white-clothes portrait instead of the supplied 3D armor.

## Root cause

The model patch attempted to replace optional historical `v98` viewer hooks
before replacing the live `v80` hooks used by the shipped APK. Because the patch
runs in strict mode, the first absent `v98` identifier raised a `ReferenceError`.
The surrounding compatibility block then exited before `v80Sync` and
`v80ScheduleSync` could be connected. The verified GLBs were present and valid,
but no live wardrobe render ever requested them.

## Correction

- Connect `v80Sync` and `v80ScheduleSync` first.
- Treat all historical `v97` and `v98` hooks as optional, independently guarded
  compatibility paths.
- Ship a narrow staged hotfix that reconnects the already-loaded v1.72 model
  controller without replacing model files.
- Bundle the corrected full model patch in Android build 190, followed by the
  same idempotent connection hotfix as a defensive check.

## Model boundary

The three v1.72 GLBs are byte-for-byte unchanged. The fix does not simplify,
split, reassemble, or reposition any mesh. Valkorion retains all 23 base/Lord
parts and all 40 complete-armor parts; Lady Alexus retains all 28 fitted parts.

## Regression coverage

- The model-controller test exposes only the real `v80` globals and verifies
  that both live functions are replaced before a model is synchronized.
- The staged-hotfix test contains no `v97` or `v98` globals and verifies an
  immediate successful connection and scheduled wardrobe refresh.
- Full-build tests retain base/Lord/armor selection, Lady Alexus mounting,
  mobile viewer disposal, Continue, menu-only updates, and tap-style checks.
- The final APK is checked for ZIP integrity, exact bundled model hashes,
  Android version 1.72.1/build 190, and the established signing certificate.
