"""Export Explorers of Sky ground maps with their native animation, from pret/pmd-sky's MAP_BG data.

Decoding uses skytemple-files (open source; needs Python 3.10-3.13):
    py -3.13 -m venv %TEMP%\\stv && %TEMP%\\stv\\Scripts\\pip install skytemple-files
    %TEMP%\\stv\\Scripts\\python scripts/sky_scenery.py d17p11a crystalcrossing public/lost-cave
Writes <id>.png (first frame), an animated strip of only the pixels that change, and <id>-source.json with
pinned source URLs and hashes, in the same layer format as rescue_scenery.py. Artwork remains owned by its
original rights holders; no ROM is used.
"""
import copy, hashlib, json, sys, urllib.request
from pathlib import Path
from PIL import Image, ImageChops
from skytemple_files.common.types.file_types import FileType
from skytemple_files.graphics.bg_list_dat.handler import BgListDatHandler

REV = 'fc85040831b248ecb690a71898010fe837091613'
BASE = f'https://raw.githubusercontent.com/pret/pmd-sky/{REV}/files/'
CACHE = Path(__file__).resolve().parents[1] / 'artifacts/sky-sources'

def fetch(rel):
    path = CACHE / rel.replace('/', '_')
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(urllib.request.urlopen(BASE + rel, timeout=60).read())
    raw = path.read_bytes()
    return raw, dict(url=BASE + rel, sha256=hashlib.sha256(raw).hexdigest())

def export(map_name, area, out):
    out = Path(out); out.mkdir(parents=True, exist_ok=True); sources = []
    def load(handler, rel):
        raw, source = fetch(rel); sources.append(source); return handler.deserialize(raw)
    entry = {e.bma_name.lower(): e for e in load(BgListDatHandler, 'language-specific/US/MAP_BG/bg_list.dat').level}[map_name]
    bpl = load(FileType.BPL, f'MAP_BG/{entry.bpl_name.lower()}.bpl')
    bpc = load(FileType.BPC, f'MAP_BG/{entry.bpc_name.lower()}.bpc')
    bma = load(FileType.BMA, f'MAP_BG/{entry.bma_name.lower()}.bma')
    bpas = [load(FileType.BPA, f'MAP_BG/{n.lower()}.bpa') if n else None for n in entry.bpa_names]
    # Palette animation: every animated palette advances together; the loop is the longest spec.
    specs = [s for s in bpl.animation_specs if s.number_of_frames]
    if specs:
        ticks = specs[0].duration_per_frame
        if any(s.duration_per_frame != ticks for s in specs): raise ValueError('Mixed palette animation speeds need separate layers')
        frames = []
        for step in range(max(s.number_of_frames for s in specs)):
            frame_bpl = copy.deepcopy(bpl); frame_bpl.palettes = bpl.apply_palette_animations(step)
            frames.append(bma.to_pil(bpc, frame_bpl, bpas, False, False, pal_ani=False, single_frame=True)[0].convert('RGBA'))
    else:
        frames = [f.convert('RGBA') for f in bma.to_pil(bpc, bpl, bpas, False, False, single_frame=False)]; ticks = 4
    frames[0].save(out / f'{area}.png', optimize=True)
    layers = []
    if len(frames) > 1:
        mask = Image.new('L', frames[0].size, 0)
        for frame in frames[1:]:
            mask = ImageChops.lighter(mask, ImageChops.difference(frames[0], frame).convert('L').point(lambda v: 255 if v else 0))
        bbox = mask.getbbox()
        if bbox:
            x, y, right, bottom = bbox; w, h = right - x, bottom - y
            strip = Image.new('RGBA', (w * len(frames), h))
            for i, frame in enumerate(frames):
                piece = frame.crop(bbox); piece.putalpha(mask.crop(bbox)); strip.paste(piece, (i * w, 0))
            strip.save(out / f'{area}-animation.png', optimize=True)
            layers.append(dict(src=f'{area}-animation.png', x=x, y=y, w=w, h=h, frames=len(frames), durations=[ticks] * len(frames)))
    result = dict(background=f'{area}.png', size=list(frames[0].size), layers=layers, sourceRevision=REV, map=map_name, sources=sources,
                  sceneryAnimation='Native palette animation at 60 ticks/second, decoded with skytemple-files; only changing pixels are layered.',
                  credit='Pokémon Mystery Dungeon: Explorers of Sky map data via pret/pmd-sky; artwork © Nintendo, Creatures, GAME FREAK, Spike Chunsoft.')
    (out / f'{area}-source.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    return result

if __name__ == '__main__':
    map_name, area, out = sys.argv[1:4]
    r = export(map_name, area, out)
    print(area, r['size'], 'layers', [(l['w'], l['h'], l['frames']) for l in r['layers']])
