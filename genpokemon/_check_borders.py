import struct
from pathlib import Path
root = Path(r"c:\Users\garma\Documents\CNL\side projects\kevanwee\data\pokeemerald\map")
for name in ['MauvilleCity','Route117','Route118','Route110','Route111']:
    data = (root / name / "border.bin").read_bytes()
    entries = struct.unpack_from(f"<{len(data)//2}H", data)
    print(f"{name}: {len(data)} bytes, {len(entries)} entries, metatile IDs: {[e & 0x3FF for e in entries]}")
