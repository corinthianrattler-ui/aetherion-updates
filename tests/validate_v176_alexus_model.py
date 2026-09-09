#!/usr/bin/env python3
import hashlib
import json
import struct
from pathlib import Path

MODEL = Path('/workspace/scratch/30a50c2c1adb/v175-game-tree/assets/game/assets/v172/alexus-gothic-gown.glb')
EXPECTED_HASH = '6a5dbb1b0de94e327a5e853292989e747fb20931c9cd7dea34992f0181e00988'
FOUNDATION = {
    'BODY_tripo_part_10','BODY_tripo_part_74','BODY_tripo_part_39','BODY_tripo_part_25',
    'BODY_tripo_part_9','BODY_tripo_part_12','BODY_tripo_part_49','BODY_tripo_part_0',
}
FITTED = {
    'GOWN_tripo_part_19','GOWN_tripo_part_18','BODY_tripo_part_37','BODY_tripo_part_28',
    'BODY_tripo_part_2','BODY_tripo_part_13','BODY_tripo_part_72','BODY_tripo_part_86',
    'BODY_tripo_part_81','BODY_tripo_part_46','BODY_tripo_part_50','BODY_tripo_part_17',
    'GOWN_tripo_part_10','GOWN_tripo_part_4','GOWN_tripo_part_5','GOWN_tripo_part_17',
    'GOWN_tripo_part_7','BODY_tripo_part_15','BODY_tripo_part_56','BODY_tripo_part_75',
}

data = MODEL.read_bytes()
assert hashlib.sha256(data).hexdigest() == EXPECTED_HASH
assert struct.unpack_from('<III', data, 0) == (0x46546C67, 2, len(data))
offset = 12
document = None
while offset < len(data):
    length, kind = struct.unpack_from('<II', data, offset)
    offset += 8
    chunk = data[offset:offset + length]
    offset += length
    if kind == 0x4E4F534A:
        document = json.loads(chunk.rstrip(b'\x00 ').decode('utf-8'))
assert document is not None
names = {node.get('name') for node in document.get('nodes', []) if node.get('name')}
assert 'ROOT' in names
assert FOUNDATION.isdisjoint(FITTED)
assert len(FOUNDATION | FITTED) == 28
assert names - {'ROOT'} == FOUNDATION | FITTED
assert len(document.get('meshes', [])) == 28
print('v1.72.6 Alexus GLB: original 30,457,220-byte asset intact; all 28 mesh nodes uniquely classified')
