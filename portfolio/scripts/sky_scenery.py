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
    render = lambda pals: bma.to_pil(bpc, pals, bpas, False, False, pal_ani=False, single_frame=True)[0].convert('RGBA')
    def with_palettes(palettes):
        frame_bpl = copy.deepcopy(bpl); frame_bpl.palettes = palettes; return frame_bpl
    def strip_layer(frames, durations, suffix):
        """Layer only the pixels that change, cropped to their bounds, one frame per native step."""
        mask = Image.new('L', frames[0].size, 0)
        for frame in frames[1:]:
            mask = ImageChops.lighter(mask, ImageChops.difference(frames[0], frame).convert('L').point(lambda v: 255 if v else 0))
        bbox = mask.getbbox()
        if not bbox: return None
        x, y, right, bottom = bbox; w, h = right - x, bottom - y
        strip = Image.new('RGBA', (w * len(frames), h))
        for i, frame in enumerate(frames):
            piece = frame.crop(bbox); piece.putalpha(mask.crop(bbox)); strip.paste(piece, (i * w, 0))
        src = f'{area}-animation{suffix}.png'; strip.save(out / src, optimize=True)
        return dict(src=src, x=x, y=y, w=w, h=h, frames=len(frames), durations=durations)
    layers = []
    base_palettes = bpl.apply_palette_animations(0) if bpl.has_palette_animation else bpl.palettes
    background = render(with_palettes(base_palettes))
    # Palette animation: each animated palette cycles at its own native speed, so each gets its own layer.
    for index, spec in enumerate(bpl.animation_specs or []):
        if not spec.number_of_frames: continue
        frames = []
        for step in range(spec.number_of_frames):
            palettes = [list(p) for p in base_palettes]; palettes[index] = bpl.apply_palette_animations(step)[index]
            frames.append(render(with_palettes(palettes)))
        layer = strip_layer(frames, [spec.duration_per_frame] * spec.number_of_frames, f'-p{index}')
        if layer: layers.append(layer)
    # Tile animation (BPA): the decoder steps every animated tile set together; use their native frame timing.
    if any(bpas):
        durations = {f.duration_per_frame for b in bpas if b for f in b.frame_info}
        if len(durations) != 1: raise ValueError('Tile animations with mixed speeds need separate layers')
        tile_frames = [f.convert('RGBA') for f in bma.to_pil(bpc, with_palettes(base_palettes), bpas, False, False, pal_ani=False, single_frame=False)]
        if len(tile_frames) > 1:
            layer = strip_layer(tile_frames, [durations.pop()] * len(tile_frames), '-tiles')
            if layer: layers.append(layer)
    background.save(out / f'{area}.png', optimize=True)
    frames = [background]
    result = dict(background=f'{area}.png', size=list(frames[0].size), layers=layers, sourceRevision=REV, map=map_name, sources=sources,
                  sceneryAnimation='Native palette (one layer per palette) and tile animation at 60 ticks/second, decoded with skytemple-files; only changing pixels are layered.',
                  credit='Pokémon Mystery Dungeon: Explorers of Sky map data via pret/pmd-sky; artwork © Nintendo, Creatures, GAME FREAK, Spike Chunsoft.')
    (out / f'{area}-source.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    return result

if __name__ == '__main__':
    map_name, area, out = sys.argv[1:4]
    r = export(map_name, area, out)
    print(area, r['size'], 'layers', [(l['w'], l['h'], l['frames']) for l in r['layers']])
