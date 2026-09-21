"""Extract the archived Transform Forest rock frames; preserve source receipts.

python scripts/export-eevee-base.py
Source PNG/JPEG files are checked in, so regeneration does not need the network.
"""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / 'public' / 'eevee-base'
sheet = Image.open(ROOT / 'rock-source.jpg')
assert sheet.size == (221, 321)
atlas = Image.new('RGB', (54 * 32, 39))
for frame in range(32):
    x, y = 1 + frame % 4 * 55, 1 + frame // 4 * 40
    atlas.paste(sheet.crop((x, y, x + 54, y + 39)), (frame * 54, 0))
atlas.save(ROOT / 'stone-frames.png', optimize=True)
sources = {
    'area': 'Transform Forest, Pokemon Mystery Dungeon: Red/Blue Rescue Team',
    'originalRipper': 'Toastypk',
    'originalListing': 'https://www.spriters-resource.com/game_boy_advance/pokemonmysterydungeonredrescueteam/asset/5395/',
    'mirrorPage': 'https://pamtre-berry.neocities.org/articles/friendareas',
    'backgroundUrl': 'https://pamtre-berry.neocities.org/images/friend-areas/og/evolutionforest.png',
    'rockFramesUrl': 'https://pamtre-berry.neocities.org/images/misc/transformforestrock.jpg',
    'notes': 'Original PNG download returned 403. Public mirror preserves the background and all 32 original rock colour poses; its rock sheet is JPEG, so these are not lossless original pixels. Crops exclude the white grid. No generated glow or recolouring. Playback uses 120ms per pose; original game timing was not supplied.',
    'rock': {'x': 209, 'y': 177, 'width': 54, 'height': 39, 'frames': 32, 'frameMs': 120},
    'sha256': {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
               for name in ['background.png', 'rock-source.jpg', 'stone-frames.png']},
}
(ROOT / 'sources.json').write_text(json.dumps(sources, indent=2) + '\n', encoding='utf-8')
print('Exported 32 archived stone poses, with source hashes.')
