# Aetherion Reforged 1.72.2 Android audit

## Result

Android build 191 replaces the broken flat wardrobe fallback with the supplied
fitted Valkorion and Lady Alexus GLBs. This is a native APK correction, not a
web-only update.

## Confirmed cause

The previous Android shell opened the game at
`file:///android_asset/game/index.html`. Modern WebView treats `file://` pages
as opaque origins, so the Three.js GLTF loader could not retrieve packaged GLB
bytes through Fetch or XMLHttpRequest. The model controller therefore failed
before creating a WebGL viewer and left the old white-clothes portrait visible.

Build 191 serves only packaged assets below
`https://appassets.androidplatform.net/assets/` through a restricted
`WebViewClient`. Android file and content access remain disabled. The page and
its local GLBs now share an HTTPS-style origin that WebView can read normally.

## Model contents

No mesh simplification was used for build 191. The three runtime models use
shape-preserving `KHR_mesh_quantization`, keep their authored transforms and
materials, and contain every fitted mesh:

| APK asset | Nodes | Meshes | Bytes | SHA-256 |
| --- | ---: | ---: | ---: | --- |
| `valkorion-base-lord.glb` | 24 | 23 | 15,208,480 | `ce3dfbb8e002f4f4a311d29d72120d7bd1541b28c77df80fd2a03a676794ddfc` |
| `valkorion-armored.glb` | 41 | 40 | 30,056,648 | `8f3b4b538c16434f919037eb880c301ae50b15bb35ad8856b8bba203655d9e21` |
| `alexus-gothic-gown.glb` | 29 | 28 | 30,457,220 | `6a5dbb1b0de94e327a5e853292989e747fb20931c9cd7dea34992f0181e00988` |

The bundled loader successfully parses all 91 meshes. Source buffers are
released after parsing, and the controller uses scheduled render hooks rather
than a continuous document observer.

## UI/runtime corrections retained

- Continue reaches the timeline when one exists.
- The floating gold Game Updates control is absent.
- Game Updates remains available inside the opening menu and Systems.
- Android tap highlighting does not turn buttons blue.
- Model-loading failures display a specific error in the wardrobe panel instead
  of silently falling back to a portrait.
- External full-APK links open through the Android browser.

## APK verification

| Field | Verified value |
| --- | --- |
| Package | `com.dominus.aetherionreforged` |
| Version | `1.72.2` |
| Android version code | `191` |
| Minimum Android SDK | `26` |
| APK bytes | `479,054,145` |
| APK SHA-256 | `bf4e05c85180b08f4937a40d032b35fd021c91f658d3d6c34e8fd9ef38422bd3` |
| Signing certificate SHA-256 | `CA:80:42:F4:75:8D:9A:05:6E:B0:74:8E:DF:AA:D0:CF:D8:A4:36:EA:7D:35:90:7C:28:B3:2C:3F:3A:FD:5E:B8` |
| APK signatures | v1 entry/CMS verification passed; v2 RSA whole-file verification passed |

The archive contains unique ZIP entries, exactly three GLBs, exact payload
copies of the native loader and all four 1.72.2 runtime patches, and no obsolete
106 MB Valkorion GLB. The complete curated regression suite passes.
