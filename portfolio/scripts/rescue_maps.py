"""Decode any Red Rescue Team ground map: tiles, layers, palette and BPA tile animation, and walk zones from the
native collision layer. Format and playback reference: pret/pmd-red src/ground_bg.c and src/map_files_table.c at
the pinned revision (not a ROM extractor). Artwork remains owned by its original rights holders.
"""
import hashlib, json, re, struct, urllib.request
from pathlib import Path
from PIL import Image
from rescue_scenery import palettes

REV = '013475aa04f5be3191e5527c186d9bfceae7cae0'
REPO = f'https://raw.githubusercontent.com/pret/pmd-red/{REV}/'
BASE = REPO + 'data/map_bg/'

def fetch(cache, url):
    path = Path(cache) / url.rsplit('/', 1)[1]
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(urllib.request.urlopen(url, timeout=60).read())
    return path.read_bytes()

def map_files(cache, key):
    """bpl/bpc/bma/bpa file names for a Friend Area, from src/map_files_table.c."""
    table = fetch(cache, REPO + 'src/map_files_table.c').decode('utf-8')
    m = re.search(r'\[MAP_FILE_ID_FRIEND_AREA_' + key + r'\] = \{\s*\.bplFileName = "(\w+)",\s*\.bpcFileName = "(\w+)",'
                  r'\s*\.bmaFileName = "(\w+)",\s*\.bpaFileNames = \{([^}]*)\}', table)
    return dict(bpl=m[1], bpc=m[2], bma=m[3], bpa=[x.strip().strip('"') for x in m[4].split(',') if 'NULL' not in x])

def nibbles(raw):
    return bytes(v for b in raw for v in (b & 15, b >> 4))

def chunk_rows(bma, pos, wc, hc):
    """BMA layer rows: NRL commands, each row XORed with the previous one."""
    rows, previous = [], [0] * ((wc + 1) // 2 * 2)
    for _ in range(hc):
        row = []
        while len(row) < wc:
            cmd = bma[pos]; pos += 1
            if cmd >= 192:
                for _ in range(cmd - 191):
                    v = int.from_bytes(bma[pos:pos + 3], 'little'); pos += 3; row.extend((v & 4095, v >> 12))
            elif cmd >= 128:
                v = int.from_bytes(bma[pos:pos + 3], 'little'); pos += 3; row.extend((v & 4095, v >> 12) * (cmd - 127))
            else:
                row.extend([0, 0] * (cmd + 1))
        row = [v ^ previous[i] for i, v in enumerate(row)]
        rows.append(row[:wc]); previous = row
    return rows, pos

def bit_rows(bma, pos, w, h):
    """Collision rows: a run of (cmd+1) clear or (cmd-127) solid tiles, each row XORed with the previous one."""
    rows, previous = [], [0] * w
    for _ in range(h):
        row = []
        while len(row) < w:
            cmd = bma[pos]; pos += 1
            row.extend([1] * (cmd - 0x7F) if cmd >= 0x80 else [0] * (cmd + 1))
        row = [a ^ b for a, b in zip(row[:w], previous)]
        rows.append(row); previous = row
    return rows, pos

class GroundMap:
    def __init__(self, bpc, bma, bpas):
        cw, ch, nt, *rest = struct.unpack_from('<8H', bpc)
        self.slots, nc = rest[:4], rest[4]
        self.static = [bytes(64)] + [nibbles(bpc[16 + i * 32:48 + i * 32]) for i in range(nt - 1)]
        off = 16 + (nt - 1) * 32
        self.chunks = [(0,) * (cw * ch)] + [struct.unpack_from('<' + 'H' * (cw * ch), bpc, off + i * cw * ch * 2) for i in range(nc - 1)]
        wt, ht, tw, th, wc, hc, nl, data, collision = struct.unpack_from('<6B3H', bma)
        assert (tw, th) == (cw, ch), 'Unexpected chunk size'
        self.size, self.cw, self.ch = (wt * 8, ht * 8), cw, ch
        pos, self.layers = 12, []
        for _ in range(nl):
            rows, pos = chunk_rows(bma, pos, wc, hc); self.layers.append(rows)
        if data: _, pos = bit_rows(bma, pos, wt, ht)
        self.collision = bit_rows(bma, pos, wt, ht)[0] if collision else None
        # BPA slots follow the static tiles in VRAM; slots 0-1 animate, 2-3 hold their first frame.
        self.slot_start, start = [], nt
        for n in self.slots: self.slot_start.append(start); start += n
        self.anim = [self.bpa(b, self.slots[i]) if b and self.slots[i] else None for i, b in enumerate(bpas)]

    @staticmethod
    def bpa(raw, slot_tiles):
        frames = struct.unpack_from('<h', raw, 2)[0]
        durations = struct.unpack_from(f'<{frames}i', raw, 4); off = 4 + 4 * frames
        tiles = [[nibbles(raw[off + (f * slot_tiles + t) * 32: off + (f * slot_tiles + t + 1) * 32]) for t in range(slot_tiles)] for f in range(frames)]
        # The engine shows a frame while its counter runs from d down past 0: d+1 ticks.
        return tiles, [d + 1 for d in durations]

    def render(self, frames=None, slot=None):
        """Palette-index image; with `slot`, also the mask of pixels drawn from that BPA slot."""
        tiles = list(self.static)
        for i, n in enumerate(self.slots):
            if not n: continue
            anim = self.anim[i] if i < len(self.anim) else None
            tiles += anim[0][(frames or {}).get(i, 0) % len(anim[0])] if anim else [bytes(64)] * n
        img, mask = Image.new('P', self.size), Image.new('L', self.size) if slot is not None else None
        lo = self.slot_start[slot] if slot is not None else 0
        hi = lo + self.slots[slot] if slot is not None else 0
        layered = len(self.layers) > 1
        for rows in reversed(self.layers):  # Layer 0 is drawn on top.
            for cy, row in enumerate(rows):
                for cx, chunk in enumerate(row):
                    for t, entry in enumerate(self.chunks[chunk]):
                        idx = entry & 1023; raw = tiles[idx] if idx < len(tiles) else bytes(64)
                        tile = Image.frombytes('P', (8, 8), raw)
                        opaque = Image.frombytes('L', (8, 8), bytes(255 if v else 0 for v in raw)) if layered else None
                        for flag, flip in ((1024, Image.Transpose.FLIP_LEFT_RIGHT), (2048, Image.Transpose.FLIP_TOP_BOTTOM)):
                            if entry & flag:
                                tile = tile.transpose(flip)
                                if opaque: opaque = opaque.transpose(flip)
                        bank = entry >> 12
                        tile = tile.point([v + bank * 16 if v else 0 for v in range(256)])
                        x, y = cx * self.cw * 8 + t % self.cw * 8, cy * self.ch * 8 + t // self.cw * 8
                        img.paste(tile, (x, y), opaque)
                        if mask is not None: mask.paste(Image.new('L', (8, 8), 255 if lo <= idx < hi else 0), (x, y), opaque)
        return img, mask

def zones_from_grid(solid):
    """The largest open region of a tile collision grid, as rectangles of merged identical row runs (8px tiles)."""
    h, w = len(solid), len(solid[0])
    free = {(x, y) for y in range(1, h - 1) for x in range(1, w - 1) if not solid[y][x]}
    best, seen = set(), set()
    for start in sorted(free):
        if start in seen: continue
        region, stack = set(), [start]
        while stack:
            p = stack.pop()
            if p in seen or p not in free: continue
            seen.add(p); region.add(p); x, y = p
            stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
        if len(region) > len(best): best = region
    runs = {}
    for y in range(h):
        x = 0
        while x < w:
            if (x, y) in best:
                s = x
                while (x, y) in best: x += 1
                runs.setdefault(y, []).append((s, x))
            else: x += 1
    rects, active = [], {}
    for y in range(h + 1):
        current = set(runs.get(y, []))
        for run in [r for r in active if r not in current]: rects.append((run[0], active.pop(run), run[1], y))
        for run in sorted(current): active.setdefault(run, y)
    return [[[x0 * 8, y0 * 8], [x1 * 8, y0 * 8], [x1 * 8, y1 * 8], [x0 * 8, y1 * 8]] for x0, y0, x1, y1 in sorted(rects)]

def strip(frames, mask, out, name, durations):
    """Only the changing pixels, cropped to their bounds, one frame per native step."""
    bbox = mask.getbbox()
    if not bbox: return None
    x, y, right, bottom = bbox; w, h = right - x, bottom - y
    image = Image.new('RGBA', (w * len(frames), h))
    for i, frame in enumerate(frames):
        piece = frame.crop(bbox); piece.putalpha(mask.crop(bbox)); image.paste(piece, (i * w, 0))
    image.save(out / name, optimize=True)
    return dict(src=name, x=x, y=y, w=w, h=h, frames=len(frames), durations=durations)

def export(key, area, out, cache):
    out = Path(out); out.mkdir(parents=True, exist_ok=True); files = map_files(cache, key); sources = []
    def get(name):
        raw = fetch(cache, BASE + name); sources.append(dict(url=BASE + name, sha256=hashlib.sha256(raw).hexdigest())); return raw
    bpl, bpc, bma = get(files['bpl'] + '.bpl'), get(files['bpc'] + '.bpc'), get(files['bma'] + '.bma')
    ground = GroundMap(bpc, bma, [get(b + '.bpa') for b in files['bpa']])
    base, cycles = palettes(bpl)
    for bank, _, frames in cycles: base[bank] = frames[0]  # The native player loads palette frame 0 first.
    def rgba(indices, pals):
        flat = [c for bank in pals for c in bank]
        return Image.frombytes('RGBA', indices.size, bytes(v for i in indices.tobytes() for v in flat[i]))
    indices, _ = ground.render()
    rgba(indices, base).save(out / f'{area}.png', optimize=True)
    layers = []
    for bank, ticks, frames in cycles:
        if len(frames) < 2: continue
        mask = Image.frombytes('L', indices.size, bytes(255 if i // 16 == bank and i % 16 else 0 for i in indices.tobytes()))
        images = []
        for palette in frames:
            pals = base.copy(); pals[bank] = palette; images.append(rgba(indices, pals))
        layer = strip(images, mask, out, f'{area}-palette-{bank}.png', [ticks] * len(frames))
        if layer: layers.append(layer)
    for slot in range(min(2, len(ground.anim))):
        if not ground.anim[slot] or len(ground.anim[slot][0]) < 2: continue
        tiles, durations = ground.anim[slot]
        _, mask = ground.render(slot=slot)
        layer = strip([rgba(ground.render({slot: f})[0], base) for f in range(len(tiles))], mask, out, f'{area}-tiles-{slot}.png', durations)
        if layer: layers.append(layer)
    result = dict(background=f'{area}.png', size=list(indices.size), layers=layers, sourceRevision=REV, sources=sources,
                  sceneryAnimation='Native BPL palette and BPA tile animation at 60 ticks/second; only changing pixels are layered.',
                  zones=zones_from_grid(ground.collision), obstacles=[],
                  collisionStatus='Walk zones from the native BMA collision layer (largest open region).')
    (out / f'{area}-source.json').write_text(json.dumps({k: v for k, v in result.items() if k not in ('zones', 'obstacles')}, indent=2) + '\n', encoding='utf-8')
    return result
