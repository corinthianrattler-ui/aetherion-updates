# Aetherion v1.72 mobile character models

These are the supplied fitted v1.71 character models with bounded-error,
border-locked geometry optimization for Android WebView. Node names, scene roots,
node transforms, materials, textures, and the base/Lord visibility contract are
unchanged.

| Model | Fitted parts | Triangles | Bytes | SHA-256 |
| --- | ---: | ---: | ---: | --- |
| `valkorion-base-lord.glb` | 23 | 538,410 | 21,148,428 | `c15bee80cec479f90b7a53d5fb08fb12099f7750c3847335ba14a5bd064acd72` |
| `valkorion-armored.glb` | 40 | 989,421 | 42,261,516 | `5e203593a2289b6f74d191630cad5cbe3c760065f2980c057a9dacabe87479fe` |
| `alexus-gothic-gown.glb` | 28 | 845,122 | 40,013,784 | `12ba557524188ccb30b11bec2e5b84a6053b1796727999aef57ea211ee946399` |

Together they are 103,423,728 bytes, down from 234,686,708 bytes. Each file is
below 50 MB for the intended mobile and Tripo upload path, and none requires a
non-core glTF decoder extension.
