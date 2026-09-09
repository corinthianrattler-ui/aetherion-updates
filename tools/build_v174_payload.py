#!/usr/bin/env python3
"""Build the archive-overlay payload for Android build 193."""

from __future__ import annotations

import argparse
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from tools.patch_android_dex import patch as patch_dex


VERSION = "1.72.4"
BUILD = 193
PATCH_STEMS = ("safe-updater", "character-models", "update-center", "runtime-repair")


def replace_once(source: str, old: str, new: str, label: str = "text") -> str:
    count = source.count(old)
    if count != 1:
        raise ValueError(f"expected one {label} occurrence of {old!r}, found {count}")
    return source.replace(old, new)


def copy(source: Path, destination: Path) -> None:
    if not source.is_file():
        raise FileNotFoundError(source)
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)


def transform_patch(stem: str) -> str:
    source = (ROOT / "patches" / f"v1.72.3-{stem}.js").read_text(encoding="utf-8")
    source = source.replace("1.72.3", VERSION)
    source = replace_once(source, "const ANDROID_BUILD=192;", f"const ANDROID_BUILD={BUILD};", f"{stem} build")
    if stem == "update-center":
        source = replace_once(
            source,
            "assets/v173/native-build-192.json",
            "assets/v174/native-build-193.json",
            "native sentinel",
        )
        source = source.replace("Build 192 identifies itself", "Build 193 identifies itself")
    if stem == "character-models":
        loader = """ let threeRuntimePromise=null;
 function loadThreeRuntime(){
  if(window.AetherionThree?.createViewer)return Promise.resolve(window.AetherionThree);
  if(threeRuntimePromise)return threeRuntimePromise;
  threeRuntimePromise=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.async=true;script.dataset.aetherionThreeRuntime='true';
   script.src=new URL('aetherion-three.min.js?v=1.57.0',document.baseURI||globalThis.location?.href).href;
   script.onload=()=>window.AetherionThree?.createViewer?resolve(window.AetherionThree):reject(Error('The bundled 3D viewer loaded without its API.'));
   script.onerror=()=>{threeRuntimePromise=null;reject(Error('The bundled 3D viewer could not be read.'))};
   (document.head||document.documentElement).appendChild(script);
  });return threeRuntimePromise;
 }

"""
        source = replace_once(
            source,
            " function value(gear,slot){return String(gear?.[slot]||'')}",
            loader + " function value(gear,slot){return String(gear?.[slot]||'')}",
            "Three.js loader insertion",
        )
        source = replace_once(
            source,
            "const api=window.AetherionThree;if(!api?.createViewer)",
            "const api=await loadThreeRuntime();if(!api?.createViewer)",
            "Valkorion viewer loader",
        )
        source = replace_once(
            source,
            "const api=window.AetherionThree;\n      if(!api?.createViewer)",
            "const api=await loadThreeRuntime();\n      if(!api?.createViewer)",
            "Alexus viewer loader",
        )
    return source


def transform_awareness(game: Path) -> str:
    source = (game / "systems-v45-awareness.js").read_text(encoding="utf-8")
    marker = "async function v45LoadModel(userRequested=true){"
    loader = """let v174WebLlmRuntime=null;
function v174LoadWebLlm(){
 if(window.AetherionWebLLM?.CreateMLCEngine)return Promise.resolve(window.AetherionWebLLM);
 if(v174WebLlmRuntime)return v174WebLlmRuntime;
 v174WebLlmRuntime=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.async=true;script.dataset.aetherionWebllmRuntime='true';
  script.src=new URL('vendor/webllm/webllm.bundle.js?v=1.30.6',document.baseURI||globalThis.location?.href).href;
  script.onload=()=>window.AetherionWebLLM?.CreateMLCEngine?resolve(window.AetherionWebLLM):reject(Error('The bundled awareness runtime loaded without its API.'));
  script.onerror=()=>{v174WebLlmRuntime=null;reject(Error('The bundled awareness runtime could not be read.'))};
  (document.head||document.documentElement).appendChild(script);
 });return v174WebLlmRuntime;
}
"""
    source = replace_once(source, marker, loader + marker, "awareness loader insertion")
    source = replace_once(
        source,
        "let mod=window.AetherionWebLLM;if(!mod?.CreateMLCEngine)throw Error('The bundled classic AI runtime was not available.');",
        "let mod=await v174LoadWebLlm();",
        "awareness engine lookup",
    )
    source = replace_once(
        source,
        "let mod=window.AetherionWebLLM;if(!mod?.deleteModelAllInfoInCache)throw Error('Model storage controls are unavailable.');",
        "let mod=await v174LoadWebLlm();if(!mod?.deleteModelAllInfoInCache)throw Error('Model storage controls are unavailable.');",
        "awareness storage lookup",
    )
    return source


def patch_manifest(source: Path, destination: Path) -> None:
    body = source.read_bytes()
    old_name, new_name = "1.72.3".encode("utf-16le"), VERSION.encode("utf-16le")
    if body.count(old_name) != 1:
        raise ValueError("AndroidManifest.xml does not contain exactly one 1.72.3 version name")
    old_code, new_code = (192).to_bytes(4, "little"), BUILD.to_bytes(4, "little")
    if body.count(old_code) != 1:
        raise ValueError("AndroidManifest.xml does not contain exactly one build 192 value")
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(body.replace(old_name, new_name).replace(old_code, new_code))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--game-root", type=Path, required=True)
    parser.add_argument("--android-manifest", type=Path, required=True)
    parser.add_argument("--classes-dex", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    game, payload_game = args.game_root, args.output / "assets" / "game"

    index = (game / "index.html").read_text(encoding="utf-8")
    index = index.replace("1.72.3", VERSION)
    index = replace_once(
        index,
        '<script src="vendor/webllm/webllm.bundle.js?v=1.30.6"></script>',
        '<!-- v1.72.4: the optional offline-awareness runtime loads only when requested. -->',
        "eager WebLLM script",
    )
    index = replace_once(
        index,
        '<script src="aetherion-three.min.js?v=1.57.0"></script>',
        '<!-- v1.72.4: the 3D viewer runtime loads only on a character-model screen. -->',
        "eager Three.js script",
    )
    index = replace_once(
        index,
        '<script src="patches/v1.72.4-runtime-repair.js?v=1.72.4"></script>',
        '<script src="patches/v1.72.4-runtime-repair.js?v=1.72.4"></script>\n'
        '<script src="patches/v1.72.4-performance.js?v=1.72.4"></script>',
        "performance patch insertion",
    )
    payload_game.mkdir(parents=True, exist_ok=True)
    (payload_game / "index.html").write_text(index, encoding="utf-8")

    for stem in PATCH_STEMS:
        destination = payload_game / "patches" / f"v1.72.4-{stem}.js"
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(transform_patch(stem), encoding="utf-8")
    copy(ROOT / "patches/v1.72.4-performance.js", payload_game / "patches/v1.72.4-performance.js")
    (payload_game / "systems-v45-awareness.js").write_text(transform_awareness(game), encoding="utf-8")
    copy(ROOT / "assets/v174/native-build-193.json", payload_game / "assets/v174/native-build-193.json")

    patch_manifest(args.android_manifest, args.output / "AndroidManifest.xml")
    patch_dex(args.classes_dex, args.output / "classes.dex")
    print(f"payload={args.output}")
    print(f"native_version={VERSION}")
    print(f"native_build={BUILD}")
    print("native_asset_loader=query-safe")
    print("eager_webllm=removed")
    print("eager_three=removed")


if __name__ == "__main__":
    main()
