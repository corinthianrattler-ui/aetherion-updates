#!/usr/bin/env python3
"""Build the v1.73 portrait library from the approved 73-page catalog.

The PDF stores one lossless 1024x1536 page image per page. Grid pages are
cropped at the authored dividers; single-portrait pages are resized intact.
The generated registry is deliberately explicit about age, gender, race, and
whether a portrait may ever represent a worker.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
from pathlib import Path

import fitz
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "custom" / "npc-portraits" / "v173"
DATA_PATCH = ROOT / "patches" / "v1.73.0-portrait-data.js"
REMOTE_ROOT = (
    "https://raw.githubusercontent.com/corinthianrattler-ui/"
    "aetherion-updates/main/custom/npc-portraits/v173/"
)

ADULTS = {
    "YM": ("M", "young", 18, 39),
    "YF": ("F", "young", 18, 39),
    "OM": ("M", "older", 40, 85),
    "OF": ("F", "older", 40, 85),
}

ROLE_ALIASES = {
    "Peasant Laborer": ["Farm Laborer", "Agricultural Laborer", "Laborer"],
    "Male Farmer": ["Farmer", "Farmhand"],
    "Female Farmer": ["Farmer", "Farmhand"],
    "Male Servant": ["Servant", "House Servant"],
    "Female Servant": ["Servant", "House Servant"],
    "Caravan Scout": ["Scout"],
    "Carriage Driver": ["Coachman", "Driver"],
    "Rope Maker": ["Rope/Sail Maker", "Ropemaker"],
    "Sail Maker": ["Rope/Sail Maker", "Sailmaker"],
    "Shopkeeper": ["Shop Factor", "Provisioner", "Road Outfitter", "Bookseller-Scribe"],
    "Fisherman": ["Fisherman/woman", "Fisher"],
    "Fisherwoman": ["Fisherman/woman", "Fisher"],
    "Navigator": ["Harbor Pilot"],
    "Dock Foreman": ["Dockmaster"],
    "Dock Laborer": ["Dockworker", "Stevedore"],
    "Stevedore": ["Dockworker", "Dock Laborer"],
    "Mine Laborer": ["Miner", "Ore Sorter"],
    "Surgeon": ["Barber-Surgeon"],
    "Bannerless Knight": ["Knight"],
    "Bannerless Man-at-Arms": ["Man-at-Arms"],
}


def q(role: str) -> list[tuple[str, str]]:
    """Standard young-male, young-female, older-male, older-female grid."""
    return [(code, role) for code in ("YM", "YF", "OM", "OF")]


# Every entry corresponds to the visible label in the approved catalog.
PAGES: list[list[tuple[str, str] | tuple[str, str, str]]] = [
    [("YM", "Male Farmer"), ("OF", "Female Farmer"), ("OM", "Shepherd"), ("YF", "Cattle Herder")],
    [("YM", "Swineherd"), ("YF", "Field Hand"), ("OM", "Orchard Worker"), ("OF", "Miller")],
    q("Peasant Laborer"),
    q("Hunter"),
    [("YF", "Maid")],
    [("OF", "Maid")],
    [("OM", "Male Servant")],
    [("YM", "Male Servant")],
    [("OM", "Farm Overseer"), ("YF", "Chamberlain"), ("YM", "Kitchen Hand"), ("OF", "Laundress")],
    [("OM", "Groundskeeper"), ("YF", "Enslaved Laborer"), ("YM", "Innkeeper"), ("OF", "Tavern Keeper")],
    q("Steward"),
    q("Cook"),
    [("OM", "Serving Man"), ("YF", "Serving Woman"), ("YM", "Brewer"), ("OF", "Baker")],
    [("YM", "Butcher"), ("OF", "Fishmonger"), ("OM", "Cellar Keeper"), ("YF", "Traveling Food Vendor")],
    [("YM", "Stableman"), ("OF", "Stablewoman"), ("OM", "Horse Breeder"), ("YF", "Horse Trader")],
    q("Farrier"),
    [("OM", "Carriage Master"), ("YF", "Courier"), ("YM", "Ferryman"), ("OF", "Boatman")],
    q("Carriage Driver"),
    q("Teamster"),
    q("Wheelwright"),
    q("Caravan Scout"),
    q("Blacksmith"),
    q("Carpenter"),
    q("Leatherworker"),
    q("Skilled Artisan"),
    [("OM", "Armorer"), ("YF", "Weaponsmith"), ("YM", "Mason"), ("OF", "Stonecutter")],
    [("YM", "Potter"), ("OF", "Tailor"), ("OM", "Weaver"), ("YF", "Rope Maker")],
    [("YM", "Market Trader"), ("OF", "Traveling Merchant"), ("OM", "Peddler"), ("YF", "Shopkeeper")],
    [("OM", "Clerk"), ("YF", "Moneychanger"), ("YM", "Tax Collector"), ("OF", "Banker")],
    q("Scribe"),
    q("Quartermaster"),
    q("Loader"),
    q("Courtesan"),
    q("Fisherman"),
    [("YM", "Warehouse Keeper"), ("OF", "Fisherwoman"), ("OM", "Sailor"), ("YF", "Sail Maker")],
    [("OM", "Cargo Master"), ("YF", "Quarry Worker"), ("YM", "Woodcutter"), ("OF", "Forester")],
    q("Shipwright"),
    q("Navigator"),
    q("Dock Foreman"),
    q("Dock Laborer"),
    q("Stevedore"),
    q("Privateer Captain"),
    q("Marine Captain"),
    q("Marine Captain"),
    [("YM", "Charcoal Burner"), ("OF", "Salt Worker"), ("OM", "Ore Sorter"), ("YF", "Forge Laborer")],
    [("YM", "Lumber Handler"), ("OF", "Storehouse Laborer"), ("OM", "Apothecary"), ("YF", "Midwife")],
    q("Mine Laborer"),
    q("Healer"),
    q("Surgeon"),
    [("OF", "Nurse"), ("YM", "Priest"), ("OM", "Shrine Keeper"), ("YF", "Gravedigger")],
    [("OM", "Undertaker"), ("YF", "Town Crier"), ("YM", "Bard"), ("OF", "Minstrel")],
    [("YF", "Dancer"), ("OM", "Actor"), ("YM", "Jester"), ("OF", "Arena Keeper")],
    [("OM", "Male Gladiator"), ("YF", "Female Gladiator"), ("YM", "Arena Trainer"), ("OF", "Pit Announcer")],
    [("YM", "Captured Orc Gladiator", "orc"), ("YF", "Captured Elf Gladiator", "elf"), ("OM", "Captured Dwarven Gladiator", "dwarf"), ("OF", "Captured Dark Elf Gladiator", "darkelf")],
    [("OM", "Torturer"), ("YF", "Bounty Hunter"), ("YM", "Bailiff"), ("OF", "Executioner")],
    [("YM", "Peasant Laborer"), ("YF", "Female Servant"), ("OM", "Male Servant"), ("OF", "Coachman")],
    [("YM", "Wagon Driver"), ("YF", "Porter"), ("OM", "Dockworker"), ("OF", "Dockmaster")],
    [("YM", "Harbor Pilot"), ("YF", "Miner"), ("OM", "Barber-Surgeon"), ("OF", "Town Guard")],
    [("YM", "Militia Man"), ("YF", "Beekeeper"), ("OM", "Goatherd"), ("OF", "Poultry Keeper")],
    [("TM", "Teen Boy"), ("TF", "Teen Girl"), ("TM", "Teen Boy"), ("TF", "Teen Girl")],
    [("DM", "Toddler Boy"), ("DF", "Toddler Girl"), ("DM", "Toddler Boy"), ("DF", "Toddler Girl")],
    [("BM", "Baby Boy"), ("BF", "Baby Girl"), ("BM", "Baby Boy"), ("BF", "Baby Girl")],
    [("YM", "Bannerless Knight")],
    [("YF", "Bannerless Knight")],
    [("OM", "Bannerless Knight")],
    [("OF", "Bannerless Knight")],
    q("Bannerless Man-at-Arms"),
    q("Bannerless Archer"),
    q("Bannerless Crossbowman"),
    q("Bannerless Sergeant"),
    q("Bannerless Swordsman"),
    q("Footman"),
    q("Militia Recruit"),
]

YOUTH = {
    "TM": ("M", "teen", 13, 17),
    "TF": ("F", "teen", 13, 17),
    "DM": ("M", "toddler", 2, 4),
    "DF": ("F", "toddler", 2, 4),
    "BM": ("M", "baby", 0, 1),
    "BF": ("F", "baby", 0, 1),
}

MILITARY = re.compile(
    r"knight|man-at-arms|archer|crossbowman|sergeant|swordsman|footman|militia|"
    r"gladiator|guard|bounty hunter|privateer captain|marine captain",
    re.I,
)


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")


def extract_page_image(document: fitz.Document, page_index: int) -> Image.Image:
    images = document[page_index].get_images(full=True)
    if len(images) != 1:
        raise ValueError(f"page {page_index + 1}: expected one image, found {len(images)}")
    source = document.extract_image(images[0][0])["image"]
    image = Image.open(io.BytesIO(source)).convert("RGB")
    if image.size != (1024, 1536):
        raise ValueError(f"page {page_index + 1}: unexpected image size {image.size}")
    return image


def panel_images(page: Image.Image, count: int) -> list[Image.Image]:
    if count == 1:
        return [page.resize((512, 768), Image.Resampling.LANCZOS)]
    if count != 4:
        raise ValueError(f"unsupported page layout with {count} portraits")
    boxes = ((0, 0, 510, 766), (514, 0, 1024, 766), (0, 770, 510, 1536), (514, 770, 1024, 1536))
    return [page.crop(box).resize((512, 768), Image.Resampling.LANCZOS) for box in boxes]


def save_webp(image: Image.Image, path: Path) -> None:
    """Encode in memory so a failed codec can never leave a tracked empty file."""
    encoded = io.BytesIO()
    image.save(encoded, "WEBP", quality=83, method=5)
    data = encoded.getvalue()
    if len(data) < 1024 or not data.startswith(b"RIFF") or data[8:12] != b"WEBP":
        raise ValueError(f"WebP encoder produced an invalid payload for {path.name}")
    path.write_bytes(data)


def build(pdf: Path) -> list[dict[str, object]]:
    document = fitz.open(pdf)
    if len(document) != len(PAGES):
        raise ValueError(f"expected {len(PAGES)} pages, found {len(document)}")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for old in OUTPUT.glob("*.webp"):
        old.unlink()

    registry: list[dict[str, object]] = []
    pixel_hashes: set[str] = set()
    number = 0
    for page_number, specs in enumerate(PAGES, start=1):
        page = extract_page_image(document, page_number - 1)
        for panel_number, (spec, portrait) in enumerate(zip(specs, panel_images(page, len(specs))), start=1):
            code, role, *race_override = spec
            race = race_override[0] if race_override else "human"
            gender, age_band, min_age, max_age = (ADULTS | YOUTH)[code]
            ambient_only = code in YOUTH
            number += 1
            filename = f"{number:03d}_{slug(role)}_{code.lower()}.webp"
            pixels = hashlib.sha256(portrait.tobytes()).hexdigest()
            if pixels in pixel_hashes:
                raise ValueError(f"duplicate portrait pixels at page {page_number}, panel {panel_number}")
            pixel_hashes.add(pixels)
            save_webp(portrait, OUTPUT / filename)
            flags: list[str] = []
            if MILITARY.search(role):
                flags.append("military")
            if role.startswith("Bannerless"):
                flags.append("bannerless")
            if role.startswith("Captured"):
                flags.append("captive")
            if ambient_only:
                flags.append("ambient-only")
            registry.append(
                {
                    "id": f"v173-{number:03d}",
                    "file": filename,
                    "label": role,
                    "role": role,
                    "aliases": ROLE_ALIASES.get(role, []),
                    "gender": gender,
                    "ageBand": age_band,
                    "minAge": min_age,
                    "maxAge": max_age,
                    "race": race,
                    "flags": flags,
                    "ambientOnly": ambient_only,
                    "sourcePage": page_number,
                    "sourcePanel": panel_number,
                }
            )
    document.close()
    if len(registry) != 268:
        raise AssertionError(f"expected 268 portraits, generated {len(registry)}")
    return registry


def write_registry(registry: list[dict[str, object]]) -> None:
    (OUTPUT / "registry.json").write_text(
        json.dumps(
            {
                "schema": 1,
                "version": "1.73.0",
                "source": "Aetherion Complete Workers and Bannerless Portraits",
                "remoteRoot": REMOTE_ROOT,
                "portraitCount": len(registry),
                "portraits": registry,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    compact = [
        [
            row["file"],
            row["role"],
            row["gender"],
            row["ageBand"],
            row["race"],
            ",".join(row["flags"]),
            "|".join(row["aliases"]),
        ]
        for row in registry
    ]
    DATA_PATCH.write_text(
        "/* Aetherion Reforged v1.73.0 — generated portrait catalog metadata. */\n"
        "(()=>{\n"
        " const rows="
        + json.dumps(compact, ensure_ascii=False, separators=(",", ":"))
        + ";\n"
        f" window.AetherionV173PortraitData={{version:'1.73.0',root:'{REMOTE_ROOT}',rows}};\n"
        "})();\n",
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    args = parser.parse_args()
    if not args.pdf.is_file():
        raise FileNotFoundError(args.pdf)
    registry = build(args.pdf)
    write_registry(registry)
    total = sum(path.stat().st_size for path in OUTPUT.glob("*.webp"))
    print(f"generated {len(registry)} portraits ({total:,} bytes) and registry metadata")


if __name__ == "__main__":
    main()
