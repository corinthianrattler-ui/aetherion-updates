#!/usr/bin/env python3
"""Build the complete v1.74.3 game-repair payload from the signed v1.74.2 APK."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import shutil
import zipfile


ROOT = Path(__file__).resolve().parents[1]
VERSION = "1.74.3"
BUILD = 198
PACKAGE = "com.dominus.aetherionreforgey"
APK_NAME = "Aetherion_Reforged_v1.74.3_FULL_GAME_REPAIR.apk"

# These files are superseded implementation layers, not authored game content.
RETIRED_RUNTIME_FILES = (
    "patches/v1.66.0-living-world-balance.js",
    "patches/v1.67.0-identity-world-integrity.js",
    "patches/v1.68.0-curated-npc-portraits.js",
    "patches/v1.74.0-stable-bundle.js",
    "patches/v1.74.2-safe-updater.js",
    "patches/v1.74.2-update-center.js",
    "systems-v81-fullbody-integrity.js",
    "assets/v1742/native-build-197.json",
)
RETIRED_PORTRAIT_FILES = (
    "assets/prisoners/bandit_female.webp",
    "assets/prisoners/bandit_male.webp",
    "assets/prisoners/mercenary_male.webp",
    "assets/prisoners/orc_male.webp",
    "assets/v28/scenes/dock_foreman.webp",
    "assets/v28/scenes/marine_captain.webp",
    "assets/v28/scenes/master_shipwright.webp",
    "assets/v28/scenes/navigator.webp",
    "assets/v28/scenes/privateer_captain.webp",
    "assets/v28/scenes/quartermaster.webp",
    "assets/v26/scenes/blood_thrall.webp",
    "assets/v26/scenes/street_informant.webp",
    "assets/v26/scenes/watch_captain.webp",
)
EXCLUDED_FILES = (*RETIRED_RUNTIME_FILES, *RETIRED_PORTRAIT_FILES)

SYSTEM_SOURCES = {
    "systems-v81-scroll.js": ROOT / "patches" / "v1.72.7-scroll-repair.js",
    "systems-v81-alexus-equipment.js": ROOT / "patches" / "v1.72.8-alexus-equipment-repair.js",
    "systems-v81-alexus-body-map.js": ROOT / "patches" / "v1.72.10-alexus-original-body-map.js",
    "systems-v81-portrait-data.js": ROOT / "patches" / "v1.73.0-portrait-data.js",
    "systems-v81-portrait-catalog.js": ROOT / "full-build" / VERSION / "game" / "systems-v81-portrait-catalog.js",
    "systems-v81-living-world.js": ROOT / "full-build" / VERSION / "game" / "systems-v81-living-world.js",
    "systems-v81-knight-roster.js": ROOT / "full-build" / VERSION / "game" / "systems-v81-knight-roster.js",
    "systems-v81-time-cycle.js": ROOT / "patches" / "v1.73.6-time-cycle.js",
    "systems-v81-portrait-core.js": ROOT / "full-build" / VERSION / "game" / "systems-v81-portrait-core.js",
}
REPAIRED_BASE_GAME_FILES = (
    "data.js",
    "systems-v10.js",
    "systems-v16.js",
    "systems-v23.js",
    "systems-v26.js",
    "systems-v28.js",
    "systems-v31.js",
    "systems-v34-frontier.js",
    "systems-v35-fishing.js",
    "systems-v51-physical-commerce.js",
    "systems-v55-blueprint-commerce.js",
)
NEW_GAME_FILES = (
    "systems-v81-safe-updater.js",
    "systems-v81-update-center.js",
    "systems-v81-economy-dialogue.js",
    "systems-v81-identity-integrity.js",
    *SYSTEM_SOURCES.keys(),
    "assets/v1743/native-build-198.json",
)


def exact_replace(source: str, old: str, new: str, label: str) -> str:
    if source.count(old) != 1:
        raise ValueError(f"expected exactly one {label} marker, found {source.count(old)}")
    return source.replace(old, new)


def counted_replace(source: str, old: str, new: str, expected: int, label: str) -> str:
    if source.count(old) != expected:
        raise ValueError(f"expected exactly {expected} {label} markers, found {source.count(old)}")
    return source.replace(old, new)


def replace_between(source: str, start: str, end: str, replacement: str, label: str) -> str:
    if source.count(start) != 1 or source.count(end) != 1:
        raise ValueError(f"expected one bounded {label} section")
    before, tail = source.split(start, 1)
    _, after = tail.split(end, 1)
    return before + replacement + end + after


def patch_index(source: str) -> str:
    source = exact_replace(
        source,
        '<script src="patches/v1.74.2-safe-updater.js?v=1.74.2"></script>',
        '<script src="systems-v81-safe-updater.js?v=1.74.3"></script>',
        "safe updater",
    )
    source = exact_replace(
        source,
        '<script src="patches/v1.74.2-update-center.js?v=1.74.2"></script>',
        '<script src="systems-v81-update-center.js?v=1.74.3"></script>',
        "update center",
    )
    source = exact_replace(
        source,
        '<script src="patches/v1.66.0-living-world-balance.js?v=1.68.1"></script>',
        '<script src="systems-v81-economy-dialogue.js?v=1.74.3"></script>',
        "legacy economy and dialogue runtime",
    )
    source = exact_replace(
        source,
        '<script src="patches/v1.67.0-identity-world-integrity.js?v=1.68.1"></script>',
        '<script src="systems-v81-identity-integrity.js?v=1.74.3"></script>',
        "legacy identity runtime",
    )
    source = exact_replace(
        source,
        '<script src="patches/v1.68.0-curated-npc-portraits.js?v=1.68.1"></script>',
        '<!-- Portrait assignment is provided by the consolidated v1.74.3 game systems below. -->',
        "legacy portrait runtime",
    )
    ordered = "\n".join(
        f'<script src="{name}?v={VERSION}"></script>'
        for name in SYSTEM_SOURCES
        if name != "systems-v81-portrait-core.js"
    )
    source = exact_replace(
        source,
        '<script src="patches/v1.74.0-stable-bundle.js?v=1.74.0"></script>',
        '<!-- v1.74.3: consolidated local game systems; no downloaded runtime overlay. -->\n' + ordered,
        "legacy stable bundle",
    )
    source = exact_replace(
        source,
        '<script src="systems-v81-fullbody-integrity.js?v=1.74.2"></script>',
        f'<script src="systems-v81-portrait-core.js?v={VERSION}"></script>',
        "legacy full-body runtime",
    )
    source = source.replace(
        '<!-- v1.74.2: House Dominus sky dial and authoritative full-body portrait integrity. -->',
        '<!-- House Dominus sky dial and consolidated portrait core. -->',
    )
    source = source.replace('<title>AETHERION REFORGED v1.72.6</title>', f'<title>AETHERION REFORGED v{VERSION}</title>')
    return source


def patch_manifest(source: bytes) -> bytes:
    old_version = "1.74.2".encode("utf-16le")
    new_version = VERSION.encode("utf-16le")
    old_code = b"\x08\x00\x00\x10" + (197).to_bytes(4, "little")
    new_code = b"\x08\x00\x00\x10" + BUILD.to_bytes(4, "little")
    if source.count(old_version) != 1 or source.count(old_code) != 1:
        raise ValueError("Android manifest does not contain the expected v1.74.2/build-197 markers")
    result = source.replace(old_version, new_version).replace(old_code, new_code)
    if PACKAGE.encode("utf-16le") not in result:
        raise ValueError("Android package identity changed or is missing")
    return result


def patch_asset_manifest(source: str, excluded: set[str]) -> str:
    prefix, encoded = source.split("=", 1)
    assets = json.loads(encoded.strip().removesuffix(";"))
    kept = [path for path in assets if path not in excluded]
    for path in NEW_GAME_FILES:
        if path not in kept:
            kept.append(path)
    return prefix + "=" + json.dumps(kept, indent=2, ensure_ascii=False) + ";\n"


def safe_updater_source() -> str:
    source = (ROOT / "patches" / "v1.74.2-safe-updater.js").read_text("utf-8")
    source = exact_replace(source, 't="1.74.2"', 't="1.74.3"', "bundled updater version")
    source = exact_replace(source, "androidBuild:197", "androidBuild:198", "updater Android build")
    return source


def update_center_source() -> str:
    source = (ROOT / "patches" / "v1.74.2-update-center.js").read_text("utf-8")
    replacements = (
        ("Aetherion Reforged v1.74.2", "Aetherion Reforged v1.74.3"),
        ("const VERSION = '1.74.2';", "const VERSION = '1.74.3';"),
        ("const ANDROID_BUILD = 197;", "const ANDROID_BUILD = 198;"),
        (
            "releases/download/v1.74.2/Aetherion_Reforged_v1.74.2_FULLBODY_BUGFIX_FULL.apk",
            f"releases/download/v{VERSION}/{APK_NAME}",
        ),
        (
            "This is the complete replacement APK; its obsolete head/bust portrait files were removed during the build.",
            "This is the complete repaired APK; the redundant portrait startup layers are absent from this build.",
        ),
    )
    for old, new in replacements:
        source = exact_replace(source, old, new, old)
    source = counted_replace(
        source,
        "aetherion-v1742-update-center-style",
        "aetherion-v1743-update-center-style",
        2,
        "update-center style",
    )
    return source


def economy_dialogue_source() -> str:
    source = (ROOT / "patches" / "v1.66.0-living-world-balance.js").read_text("utf-8")
    source = exact_replace(
        source,
        "/* Aetherion Reforged v1.66.0 — fair pay, coherent identities, useful items, and living conversation. */",
        "/* Aetherion Reforged v1.74.3 — consolidated economy, dialogue, identity, and compact-state system. */",
        "economy header",
    )
    source = exact_replace(
        source,
        "const VERSION='1.66.0',MAX_WEEKLY_COPPER=30,CONVERSATION_LIMIT=60;",
        "const VERSION='1.74.3',MAX_WEEKLY_COPPER=30,CONVERSATION_LIMIT=60;",
        "economy runtime version",
    )
    source = exact_replace(
        source,
        "const POLICY='living-world-v1.66.0';",
        "const POLICY='living-world-consolidated-v1.74.3';",
        "economy runtime policy",
    )
    source = exact_replace(
        source,
        "surgeon_ysabet:{wageCopper:28,portrait:'assets/v29/portraits/surgeon_ysabet.webp'}",
        "surgeon_ysabet:{wageCopper:28,portrait:'custom/npc-portraits/v173/184_surgeon_of.webp'}",
        "Ysabet portrait",
    )
    source = exact_replace(
        source,
        "surgeon_halric:{wageCopper:30,portrait:'assets/v29/portraits/surgeon_halric.webp'}",
        "surgeon_halric:{wageCopper:30,portrait:'custom/npc-portraits/v173/183_surgeon_om.webp'}",
        "Halric portrait",
    )
    source = exact_replace(
        source,
        "function nameSets(){let male=[],female=[];try{male.push(...V15_MALE)}catch(_){}try{female.push(...V15_FEMALE)}catch(_){}try{male.push(...V10_LOCAL_M)}catch(_){}try{female.push(...V10_LOCAL_F)}catch(_){}return{male:new Set(male),female:new Set(female)}}",
        "let cachedNameSets=null;function nameSets(){if(cachedNameSets)return cachedNameSets;let male=[],female=[];try{male.push(...V15_MALE)}catch(_){}try{female.push(...V15_FEMALE)}catch(_){}try{male.push(...V10_LOCAL_M)}catch(_){}try{female.push(...V10_LOCAL_F)}catch(_){}cachedNameSets={male:new Set(male),female:new Set(female)};return cachedNameSets}",
        "identity name cache",
    )
    source = exact_replace(
        source,
        "function identityPortrait(p){let gender=p?.gender==='F'?'female':'male',stage=portraitStage(p?.age),index=1+hash(`${p?.id||p?.name}|portrait|${gender}|${stage}`)%4;return`assets/dynasty/${gender}_${stage}_${index}.webp`}",
        "function identityPortrait(p,context={}){let current=clean(p?.portrait||p?.img),core=window.AetherionPortraitCore;if(core?.select){if(current&&!core.needsReplacement(current))return current;return core.select(p,context)?.path||core.displayPath(current)}let gender=p?.gender==='F'?'female':'male',stage=portraitStage(p?.age),index=1+hash(`${p?.id||p?.name}|portrait|${gender}|${stage}`)%4;return`assets/dynasty/${gender}_${stage}_${index}.webp`}",
        "economy portrait delegation",
    )
    source = replace_between(
        source,
        " function repairIdentity(p){",
        " function repairIdentities",
        """ function repairIdentity(p){
  if(!p||!clean(p.name))return p;let oldGender=p.gender,oldName=p.name,oldTitle=p.title,gender=inferredGender(p),generated=/^v15_/.test(clean(p.id));
  if(generated){let title=desiredTitle(p,gender),prefix=/^(Ser|Dame|Master|Mistress|Veteran|Pathfinder|Huntsman|Huntress|Hunter|Scholar|Companion)\\s+/i;if(title&&prefix.test(p.name))p.name=p.name.replace(prefix,title+' ');p.title=title||p.title}
  p.gender=gender;if(p.voice&&/^(YF|MF|YV|YM|MM)$/.test(p.voice))p.voice=gender==='F'?(+p.age>=38?'MF':'YF'):(+p.age>=38?'MM':'YM');
  if(oldGender!==p.gender||oldName!==p.name||oldTitle!==p.title)runtime.identitiesRepaired++;
  return p
 }
""",
        "economy identity repair",
    )
    source = replace_between(
        source,
        " function installStateHooks(){",
        " function installStyles",
        """ function installStateHooks(){
  if(typeof makeStartState==='function'){const base=makeStartState;makeStartState=function(...args){return repairState(base.apply(this,args))}}
  if(typeof migrateState==='function'){const base=migrateState;migrateState=function(state,...args){let out=base.call(this,state,...args);return out&&out.meta?.v166LivingWorld?.version!==VERSION?repairState(out):out}}
  if(typeof dailyTick==='function'){const base=dailyTick;dailyTick=function(...args){let out=base.apply(this,args);repairWages(S);compactState(S);return out}}
 }
""",
        "economy state hooks",
    )
    return source


def identity_integrity_source() -> str:
    source = (ROOT / "patches" / "v1.67.0-identity-world-integrity.js").read_text("utf-8")
    source = exact_replace(
        source,
        "/* Aetherion Reforged v1.67.0 — portrait, identity, age, and roster integrity. */",
        "/* Aetherion Reforged v1.74.3 — consolidated identity, age, roster, display, and audio integrity. */",
        "identity header",
    )
    source = exact_replace(
        source,
        "const VERSION='1.67.0',POLICY='identity-world-integrity-v1.67.0';",
        "const VERSION='1.74.3',POLICY='identity-world-consolidated-v1.74.3';",
        "identity runtime version",
    )
    source = exact_replace(
        source,
        "'assets/v61/intelligence/maevra_voss.webp':'assets/dynasty/female_adult_2.webp'",
        "'assets/v61/intelligence/maevra_voss.webp':'custom/npc-portraits/v173/108_scribe_of.webp'",
        "Maevra display fallback",
    )
    source = exact_replace(
        source,
        "function identityPortrait(p,context={}){\n  let existing=clean(p?.portrait||p?.img),valid=portraitValidity(p,existing,context);if(valid.ok&&catalog[existing]?.kind==='exact-person-portrait')return existing;\n  let exact=exactIdentityArt(p);if(exact)return exact;\n  if(context.prisoner||p?.sentence||p?.kind&&/bandit|mercenary|orc/.test(lower(p.kind))){let gender=inferGender(p),kind=lower(p?.kind),path=kind.includes('orc')?'assets/prisoners/orc_male.webp':kind.includes('mercenary')?'assets/prisoners/mercenary_male.webp':gender==='F'?'assets/prisoners/bandit_female.webp':'assets/prisoners/bandit_male.webp';if(catalog[path])return path}\n  return portraitSpec(p,context).path\n }",
        "function identityPortrait(p,context={}){\n  let existing=clean(p?.portrait||p?.img),core=window.AetherionPortraitCore;if(core?.select){if(existing&&!core.needsReplacement(existing))return existing;return core.select(p,context)?.path||core.displayPath(existing)}\n  let valid=portraitValidity(p,existing,context);if(valid.ok&&catalog[existing]?.kind==='exact-person-portrait')return existing;let exact=exactIdentityArt(p);if(exact)return exact;\n  if(context.prisoner||p?.sentence||p?.kind&&/bandit|mercenary|orc/.test(lower(p.kind))){let gender=inferGender(p),kind=lower(p?.kind),path=kind.includes('orc')?'assets/prisoners/orc_male.webp':kind.includes('mercenary')?'assets/prisoners/mercenary_male.webp':gender==='F'?'assets/prisoners/bandit_female.webp':'assets/prisoners/bandit_male.webp';if(catalog[path])return path}\n  return portraitSpec(p,context).path\n }",
        "identity portrait delegation",
    )
    source = replace_between(
        source,
        " function repairPerson(p,context={}){",
        " function repairFamily",
        """ function repairPerson(p,context={}){
  if(!p||typeof p!=='object'||!clean(p.name))return p;runtime.recordsChecked++;let oldGender=p.gender,age=ensureAge(p),gender=inferGender(p);p.gender=gender;repairHonorific(p,gender);
  if(oldGender!==gender)runtime.gendersCorrected++;
  if(p.voice&&/^(?:YF|MF|YM|MM)$/.test(p.voice))p.voice=gender==='F'?(age>=38?'MF':'YF'):(age>=38?'MM':'YM');
  if(Object.prototype.hasOwnProperty.call(p,'lifeStage'))p.lifeStage=lifeStage(age,raceOf(p,context));
  return p
 }
""",
        "identity person repair",
    )
    source = exact_replace(
        source,
        "c.portrait='assets/v38/thrall/nessa_cale_portrait.webp'",
        "c.portrait='assets/v38/thrall/nessa_cale_encounter.webp'",
        "Nessa portrait",
    )
    identity_portraits = {
        "assets/v29/portraits/shipwright_odran.webp": "custom/npc-portraits/v173/135_shipwright_om.webp",
        "assets/v29/portraits/navigator_yselle.webp": "custom/npc-portraits/v173/138_navigator_yf.webp",
        "assets/v29/portraits/quartermaster_halric.webp": "custom/npc-portraits/v173/111_quartermaster_om.webp",
        "assets/v29/portraits/foreman_garran.webp": "custom/npc-portraits/v173/143_dock_foreman_om.webp",
        "assets/v29/portraits/captain_sabine.webp": "custom/npc-portraits/v173/154_privateer_captain_yf.webp",
        "assets/v29/portraits/captain_edric.webp": "custom/npc-portraits/v173/159_marine_captain_om.webp",
        "assets/v29/portraits/surgeon_ysabet.webp": "custom/npc-portraits/v173/184_surgeon_of.webp",
        "assets/v29/portraits/surgeon_halric.webp": "custom/npc-portraits/v173/183_surgeon_om.webp",
        "assets/v38/thrall/nessa_cale_portrait.webp": "assets/v38/thrall/nessa_cale_encounter.webp",
        "assets/prisoners/bandit_female.webp": "custom/npc-portraits/v168/81_northern_horse_raider_adult_woman.webp",
        "assets/prisoners/bandit_male.webp": "custom/npc-portraits/v168/82_northern_horse_raider_elder_man.webp",
        "assets/prisoners/mercenary_male.webp": "custom/npc-portraits/v168/94_mercenary_heavy_knight_elder_man.webp",
        "assets/prisoners/orc_male.webp": "custom/npc-portraits/v168/90_orc_raider_adult_man.webp",
    }
    for old, new in identity_portraits.items():
        source = source.replace(old, new)
    source = replace_between(
        source,
        " function syncNotables(state){",
        " function collectRecords",
        """ function syncNotables(state){let members=new Map();for(const house of state?.dynasties||[])for(const member of house.members||[])members.set(member.id,{member,house});for(const row of Object.values(state?.v61?.people||{})){let hit=members.get(row.id);if(!hit)continue;row.name=hit.member.name;row.gender=hit.member.gender;row.age=hit.member.age;row.race=houseRace(hit.house);let core=window.AetherionPortraitCore,current=clean(row.portrait);if(!current||core?.needsReplacement(current))row.portrait=identityPortrait(row,{dynasty:true,race:row.race})}}
""",
        "notable identity sync",
    )
    source = replace_between(
        source,
        " function auditState(state=typeof S!=='undefined'?S:null){",
        " function installCoreOverrides",
        """ function auditState(state=typeof S!=='undefined'?S:null){
  let invalidGenders=[],missingAges=[],rows=state?collectRecords(state):[];for(const{p}of rows){let gender=inferGender(p);if(p.gender!==gender)invalidGenders.push({id:p.id||null,name:p.name,stored:p.gender,expected:gender});if(!Number.isFinite(+p.age)||+p.age<0)missingAges.push({id:p.id||null,name:p.name})}
  let result={version:VERSION,policy:POLICY,taggedAssets:Object.keys(catalog).length,records:rows.length,invalidPortraits:[],invalidGenders,missingAges,roleArt:[],missingAssets:[],portraitAuthority:'AetherionPortraitCore'};runtime.lastAudit=result;return result
 }

""",
        "identity audit",
    )
    return source


def repaired_base_game_sources(base_game: Path) -> dict[str, str]:
    sources = {name: (base_game / name).read_text("utf-8") for name in REPAIRED_BASE_GAME_FILES}
    sources["data.js"] = exact_replace(
        sources["data.js"],
        "assets/workers/wagon_driver.jpg",
        "custom/npc-portraits/v173/213_wagon_driver_ym.webp",
        "base wagon-driver art",
    )
    justice_art = {
        "'assets/prisoners/bandit_male.webp'": "'custom/npc-portraits/v168/82_northern_horse_raider_elder_man.webp'",
        "'assets/prisoners/bandit_female.webp'": "'custom/npc-portraits/v168/81_northern_horse_raider_adult_woman.webp'",
        "'assets/prisoners/mercenary_male.webp'": "'custom/npc-portraits/v168/94_mercenary_heavy_knight_elder_man.webp'",
        "'assets/prisoners/orc_male.webp'": "'custom/npc-portraits/v168/90_orc_raider_adult_man.webp'",
    }
    for old, new in justice_art.items():
        sources["data.js"] = exact_replace(sources["data.js"], old, new, old)
    sources["systems-v10.js"] = exact_replace(
        sources["systems-v10.js"],
        "assets/workers/wagon_driver.jpg",
        "custom/npc-portraits/v173/213_wagon_driver_ym.webp",
        "v10 wagon-driver art",
    )
    role_art = {
        "'Blacksmith':'assets/workers/blacksmith.jpg'": "'Blacksmith':'custom/npc-portraits/v173/073_blacksmith_ym.webp'",
        "'Master Blacksmith':'assets/workers/blacksmith.jpg'": "'Master Blacksmith':'custom/npc-portraits/v173/075_blacksmith_om.webp'",
        "'Armorer':'assets/workers/armorer.jpg'": "'Armorer':'custom/npc-portraits/v173/089_armorer_om.webp'",
        "'Weaponsmith':'assets/workers/weaponsmith.jpg'": "'Weaponsmith':'custom/npc-portraits/v173/090_weaponsmith_yf.webp'",
        "'Carpenter':'assets/workers/carpenter.jpg'": "'Carpenter':'custom/npc-portraits/v173/077_carpenter_ym.webp'",
        "'Healer':'assets/workers/healer.jpg'": "'Healer':'custom/npc-portraits/v173/178_healer_yf.webp'",
        "'Steward':'assets/workers/steward.jpg'": "'Steward':'custom/npc-portraits/v173/029_steward_ym.webp'",
        "'Caravan Scout':'assets/workers/forester.jpg'": "'Caravan Scout':'custom/npc-portraits/v173/069_caravan_scout_ym.webp'",
        "'Hunter':'assets/workers/bounty_hunter.jpg'": "'Hunter':'custom/npc-portraits/v173/013_hunter_ym.webp'",
        "'Courtesan':'assets/workers/dancer.jpg'": "'Courtesan':'custom/npc-portraits/v173/118_courtesan_yf.webp'",
    }
    for old, new in role_art.items():
        sources["systems-v16.js"] = exact_replace(sources["systems-v16.js"], old, new, old)
    v28_portraits = {
        "['Master Odran Blackwake','Master Shipwright','M',58,95,'master_shipwright']": "['Master Odran Blackwake','Master Shipwright','M',58,95,'master_shipwright','custom/npc-portraits/v173/135_shipwright_om.webp']",
        "['Navigator Yselle Vane','Navigator','F',34,91,'navigator']": "['Navigator Yselle Vane','Navigator','F',34,91,'navigator','custom/npc-portraits/v173/138_navigator_yf.webp']",
        "['Quartermaster Halric Morn','Quartermaster','M',51,88,'quartermaster']": "['Quartermaster Halric Morn','Quartermaster','M',51,88,'quartermaster','custom/npc-portraits/v173/111_quartermaster_om.webp']",
        "['Foreman Garran Pike','Dock Foreman','M',42,86,'dock_foreman']": "['Foreman Garran Pike','Dock Foreman','M',42,86,'dock_foreman','custom/npc-portraits/v173/143_dock_foreman_om.webp']",
        "['Captain Sabine Redwake','Privateer Captain','F',38,90,'privateer_captain']": "['Captain Sabine Redwake','Privateer Captain','F',38,90,'privateer_captain','custom/npc-portraits/v173/154_privateer_captain_yf.webp']",
        "['Captain Edric Voss','Marine Captain','M',45,89,'marine_captain']": "['Captain Edric Voss','Marine Captain','M',45,89,'marine_captain','custom/npc-portraits/v173/159_marine_captain_om.webp']",
    }
    for old, new in v28_portraits.items():
        sources["systems-v28.js"] = exact_replace(sources["systems-v28.js"], old, new, old)
    sources["systems-v28.js"] = exact_replace(
        sources["systems-v28.js"],
        "portrait:`${V28A}scenes/${a[5]}.webp`",
        "portrait:a[6]",
        "v28 officer portrait source",
    )
    sources["systems-v28.js"] = exact_replace(
        sources["systems-v28.js"],
        "portrait:`${V28A}scenes/dock_stevedores.webp`",
        "portrait:null",
        "v28 stevedore person portrait",
    )
    sources["systems-v31.js"] = exact_replace(
        sources["systems-v31.js"],
        "portrait:`${V28A}scenes/dock_stevedores.webp`",
        "portrait:null",
        "v31 stevedore person portrait",
    )
    sources["systems-v23.js"] = exact_replace(
        sources["systems-v23.js"],
        "portrait:'assets/medical/surgeon_kit.webp'},{id:'surgeon_halric'",
        "portrait:'custom/npc-portraits/v173/184_surgeon_of.webp'},{id:'surgeon_halric'",
        "Ysabet surgeon portrait",
    )
    sources["systems-v23.js"] = exact_replace(
        sources["systems-v23.js"],
        "portrait:'assets/medical/surgeon_kit.webp'}],study:",
        "portrait:'custom/npc-portraits/v173/183_surgeon_om.webp'}],study:",
        "Halric surgeon portrait",
    )
    sources["systems-v26.js"] = exact_replace(
        sources["systems-v26.js"],
        "let names=['Mara Vell','Orren Pike','Sabine Crow','Tomas Wren'];v.crime.contacts=names.map((n,i)=>({id:'contact_'+i,name:n,gender:i%2?'M':'F',role:['Fence','Cutpurse','Informer','Smuggler'][i],trust:10+rnd(0,25),portrait:`${V26A}scenes/${i%2?'watch_captain':'street_informant'}.webp`,dominated:false}))",
        "let names=['Mara Vell','Orren Pike','Sabine Crow','Tomas Wren'],portraits=['custom/npc-portraits/v168/42_market_trader_elder_woman.webp','custom/npc-portraits/v173/069_caravan_scout_ym.webp','custom/npc-portraits/v173/206_bounty_hunter_yf.webp','custom/npc-portraits/v173/127_sailor_om.webp'];v.crime.contacts=names.map((n,i)=>({id:'contact_'+i,name:n,gender:i%2?'M':'F',role:['Fence','Cutpurse','Informer','Smuggler'][i],trust:10+rnd(0,25),portrait:portraits[i],dominated:false}))",
        "underworld contact portraits",
    )
    sources["systems-v26.js"] = exact_replace(
        sources["systems-v26.js"],
        "img:`${V26A}scenes/blood_thrall.webp`",
        "img:p.portrait",
        "blood-thrall companion portrait",
    )
    sources["systems-v35-fishing.js"] = exact_replace(
        sources["systems-v35-fishing.js"],
        "portrait:`${V35F_A}scenes/fishing_port.webp`",
        "portrait:null",
        "fishing-crew person portrait",
    )
    sources["systems-v34-frontier.js"] = exact_replace(
        sources["systems-v34-frontier.js"],
        "'assets/v29/portraits/stablemaster.webp'",
        "'assets/v50/rooms/stables.webp'",
        "frontier stable art",
    )
    sources["systems-v51-physical-commerce.js"] = exact_replace(
        sources["systems-v51-physical-commerce.js"],
        "'assets/workers/tailor.jpg'",
        "'assets/v50/districts/shop_row.webp'",
        "clothier scene art",
    )
    sources["systems-v55-blueprint-commerce.js"] = exact_replace(
        sources["systems-v55-blueprint-commerce.js"],
        "portrait:owned?'assets/v50/jobs/owned_shop.webp':V51_MERCHANTS[key]?.art||'assets/v50/districts/shop_row.webp'",
        "portrait:null",
        "shop-worker person portrait",
    )
    return sources


def copy(source: Path, destination: Path) -> None:
    if not source.is_file():
        raise FileNotFoundError(source)
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-apk", type=Path, required=True)
    parser.add_argument("--base-game", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--exclusions", type=Path, required=True)
    args = parser.parse_args()

    base_game = args.base_game.resolve()
    missing = [path for path in EXCLUDED_FILES if not (base_game / path).is_file()]
    if missing:
        raise FileNotFoundError(f"expected v1.74.2 runtime files are missing: {missing}")

    payload = args.output.resolve()
    if payload.exists():
        shutil.rmtree(payload)
    game = payload / "assets" / "game"
    game.mkdir(parents=True)

    args.exclusions.parent.mkdir(parents=True, exist_ok=True)
    args.exclusions.write_text(
        "".join(f"assets/game/{path}\n" for path in sorted(EXCLUDED_FILES)),
        "utf-8",
    )

    with zipfile.ZipFile(args.base_apk) as archive:
        manifest = archive.read("AndroidManifest.xml")
    (payload / "AndroidManifest.xml").write_bytes(patch_manifest(manifest))
    (game / "index.html").write_text(patch_index((base_game / "index.html").read_text("utf-8")), "utf-8")
    (game / "asset-manifest.js").write_text(
        patch_asset_manifest(
            (base_game / "asset-manifest.js").read_text("utf-8"),
            set(EXCLUDED_FILES),
        ),
        "utf-8",
    )
    (game / "systems-v81-safe-updater.js").write_text(safe_updater_source(), "utf-8")
    (game / "systems-v81-update-center.js").write_text(update_center_source(), "utf-8")
    (game / "systems-v81-economy-dialogue.js").write_text(economy_dialogue_source(), "utf-8")
    (game / "systems-v81-identity-integrity.js").write_text(identity_integrity_source(), "utf-8")
    for name, source in repaired_base_game_sources(base_game).items():
        (game / name).write_text(source, "utf-8")
    for name, source in SYSTEM_SOURCES.items():
        copy(source, game / name)

    marker = {
        "version": VERSION,
        "build": BUILD,
        "package": PACKAGE,
        "maintenance": "complete-game-performance-and-integrity-repair",
        "baseVersion": "1.74.2",
        "saveFormatChanged": False,
        "gameplayContentRemoved": False,
        "retiredRedundantRuntimeFiles": len(RETIRED_RUNTIME_FILES),
        "retiredUnwantedHeadOrBustPortraits": len(RETIRED_PORTRAIT_FILES),
        "repairedUnderlyingGameFiles": len(REPAIRED_BASE_GAME_FILES),
        "portraitMigration": "indexed-single-pass",
        "voiceSystem": "preserved-byte-for-byte",
    }
    marker_path = game / "assets" / "v1743" / "native-build-198.json"
    marker_path.parent.mkdir(parents=True, exist_ok=True)
    marker_path.write_text(json.dumps(marker, indent=2) + "\n", "utf-8")
    print(f"payload={payload}")
    print(f"retired_runtime_files={len(RETIRED_RUNTIME_FILES)}")
    print(f"retired_head_or_bust_portraits={len(RETIRED_PORTRAIT_FILES)}")
    print(f"new_game_files={len(NEW_GAME_FILES)}")


if __name__ == "__main__":
    main()
