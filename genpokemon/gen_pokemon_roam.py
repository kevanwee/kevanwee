#!/usr/bin/env python3
"""
gen_pokemon_roam.py - pokeemerald Mauville City map with roaming pokemon.

Renders the map from authentic pokeemerald tileset/map data:
  - Primary general tileset + secondary Mauville tileset
  - Binary metatile composition with proper palette mapping
  - Collision grid from map.bin collision bits
  - Top-layer metatiles (buildings/trees) drawn above pokemon for depth
  - Animated water & flower tiles with SMIL overlay cycling
  - Border-padded map for extra roaming space
"""

import base64, struct, os, math, random, zlib
from collections import deque
from pathlib import Path

# ===================================================================
# Paths
# ===================================================================
SCRIPT_DIR = Path(__file__).resolve().parent
ROOT_DIR = SCRIPT_DIR.parent
DATA_DIR = ROOT_DIR / "data" / "pokeemerald"
OFFICE = ROOT_DIR.parent / "theoffice"

SPRITES = {
    "diancie":   OFFICE / "Pokemon"       / "DIANCIE.png",
    "carbink":   OFFICE / "Pokemon Shiny" / "CARBINK.png",
    "ceruledge": OFFICE / "Pokemon Shiny" / "CERULEDGE.png",
    "armarouge": OFFICE / "Pokemon Shiny" / "ARMAROUGE.png",
    "charcadet": OFFICE / "Pokemon Shiny" / "CHARCADET.png",
    "yveltal":   OFFICE / "Pokemon Shiny" / "YVELTAL.png",
    "greninja":  OFFICE / "Pokemon Shiny" / "GRENINJA.png",
    "froakie":   OFFICE / "Pokemon Shiny" / "FROAKIE.png",
    "skarmory":  OFFICE / "Pokemon Shiny" / "SKARMORY.png",
    "gardevoir": OFFICE / "Pokemon Shiny" / "GARDEVOIR.png",
    "dragonair": OFFICE / "Pokemon Shiny" / "DRAGONAIR.png",
    "dragonite": OFFICE / "Pokemon Shiny" / "DRAGONITE.png",
    "eevee":     OFFICE / "Pokemon Shiny" / "EEVEE.png",
    "gengar":    OFFICE / "Pokemon Shiny" / "GENGAR.png",
    "charizard": OFFICE / "Pokemon Shiny" / "CHARIZARD.png",
    "fidough":   OFFICE / "Pokemon Shiny" / "FIDOUGH.png",
    "fuecoco":   OFFICE / "Pokemon Shiny" / "FUECOCO.png",
    "latios":    OFFICE / "Pokemon Shiny" / "LATIOS.png",
    "latias":    OFFICE / "Pokemon Shiny" / "LATIAS.png",
    "appletun":  OFFICE / "Pokemon"       / "APPLETUN.png",
    "blaziken":  OFFICE / "Pokemon Shiny" / "BLAZIKEN.png",
    "sceptile":  OFFICE / "Pokemon Shiny" / "SCEPTILE.png",
    "flareon":   OFFICE / "Pokemon"       / "FLAREON.png",
    "umbreon":   OFFICE / "Pokemon Shiny" / "UMBREON.png",
    "sylveon":   OFFICE / "Pokemon Shiny" / "SYLVEON.png",
    "glaceon":   OFFICE / "Pokemon Shiny" / "GLACEON.png",
    "blastoise": OFFICE / "Pokemon Shiny" / "BLASTOISE.png",
    "squirtle":  OFFICE / "Pokemon Shiny" / "SQUIRTLE.png",
    "garchomp":  OFFICE / "Pokemon Shiny" / "GARCHOMP.png",
    "mewtwo":    OFFICE / "Pokemon Shiny" / "MEWTWO.png",
    "goodra":    OFFICE / "Pokemon Shiny" / "GOODRA.png",
    "kyogre":    OFFICE / "Pokemon Shiny" / "KYOGRE.png",
}

# ===================================================================
# Map config - Route 111 (vertical, river area)
# ===================================================================
MAUV_W, MAUV_H = 40, 20            # Mauville City dimensions (unused)
RT117_W, RT117_H = 60, 20          # Route 117 (unused)
RT118_W, RT118_H = 80, 20          # Route 118 (unused)
RT110_W, RT110_H = 40, 100         # Route 110 (unused)
RT111_W, RT111_H = 40, 140         # Route 111 (active scene)
SLICE_LR = 20                      # Unused (kept for reference)
SLICE_TB = 0                       # Unused
MAP_W = RT111_W                         # 40
MAP_H = RT111_H                         # 140
META = 16
TILE = META
SCALE = 2

# ===================================================================
# Movement constants
# ===================================================================
WALK_PX_SEC      = 48
TILE_DUR         = TILE / WALK_PX_SEC
WALK_FRAME_DUR   = 0.15
WALK_FRAMES      = 4
WALK_CYCLE       = WALK_FRAME_DUR * WALK_FRAMES
WANDER_PAUSE_MIN = 0.8
WANDER_PAUSE_MAX = 2.6
TURN_PAUSE_MIN   = 0.08
TURN_PAUSE_MAX   = 0.18
LOOK_PAUSE_MIN   = 0.16
LOOK_PAUSE_MAX   = 0.42
LOOK_CHANCE      = 0.55
COLLISION_BODY_RATIO = 0.34
ROW = {"DOWN": 0, "LEFT": 1, "RIGHT": 2, "UP": 3}
DIRS4 = [(1,0),(-1,0),(0,1),(0,-1)]
CARDINAL_DIRS = ("DOWN", "LEFT", "RIGHT", "UP")

# ===================================================================
# Tile animation definitions (from pokeemerald tileset_anims.c)
# ===================================================================
ANIM_DEFS = {
    "flower": {
        "tile_start": 508, "tile_count": 4,
        "frame_cycle": [0, 1, 0, 2],
        "frame_dir": "flower",
    },
    "water": {
        "tile_start": 432, "tile_count": 30,
        "frame_cycle": [0, 1, 2, 3, 4, 5, 6, 7],
        "frame_dir": "water",
    },
    "land_water_edge": {
        "tile_start": 480, "tile_count": 10,
        "frame_cycle": [0, 1, 2, 3],
        "frame_dir": "land_water_edge",
    },
}
ANIM_TOTAL_STEPS = 8
ANIM_STEP_DUR = 0.35
ANIM_TOTAL_DUR = ANIM_TOTAL_STEPS * ANIM_STEP_DUR

# Primary animated water tile ranges from pokeemerald tileset anims.
WATER_TILE_RANGES = [(432, 462), (480, 490)]

# ===================================================================
# PNG decoder - handles 4-bit indexed (ct=3) and 8-bit RGBA (ct=6)
# ===================================================================
def png_dims(d):
    return struct.unpack(">II", d[16:24]) if d[:8] == b"\x89PNG\r\n\x1a\n" else (0, 0)

def _png_chunks(data):
    i = 8
    while i < len(data):
        L = struct.unpack(">I", data[i:i+4])[0]
        ct = data[i+4:i+8]
        yield ct, data[i+8:i+8+L]
        if ct == b"IEND":
            break
        i += 12 + L

def _png_unfilter(raw, w, bpp, h):
    stride = w + 1
    prev = [0] * w
    rows = []
    for y in range(h):
        off = y * stride
        f = raw[off]
        cur = list(raw[off+1:off+1+w])
        if f == 1:
            for x in range(bpp, len(cur)):
                cur[x] = (cur[x] + cur[x-bpp]) & 0xFF
        elif f == 2:
            for x in range(len(cur)):
                cur[x] = (cur[x] + prev[x]) & 0xFF
        elif f == 3:
            for x in range(len(cur)):
                a = cur[x-bpp] if x >= bpp else 0
                cur[x] = (cur[x] + (a + prev[x]) // 2) & 0xFF
        elif f == 4:
            for x in range(len(cur)):
                a = cur[x-bpp] if x >= bpp else 0
                b = prev[x]
                c = prev[x-bpp] if x >= bpp else 0
                pa, pb, pc = abs(b-c), abs(a-c), abs(a+b-2*c)
                pr = a if pa <= pb and pa <= pc else (b if pb <= pc else c)
                cur[x] = (cur[x] + pr) & 0xFF
        prev = cur[:]
        rows.append(cur)
    return rows

def png_indexed(data):
    """Parse indexed PNG -> (width, height, palette, trns, index_rows)."""
    w, h = struct.unpack(">II", data[16:24])
    bd = data[24]
    palette = []
    trns = None
    idat = bytearray()
    for ctype, payload in _png_chunks(data):
        if ctype == b"PLTE":
            for j in range(0, len(payload), 3):
                palette.append((payload[j], payload[j+1], payload[j+2]))
        elif ctype == b"tRNS":
            trns = list(payload)
        elif ctype == b"IDAT":
            idat.extend(payload)
    raw = zlib.decompress(bytes(idat))
    if bd == 4:
        raw_w = (w + 1) // 2
        rows = _png_unfilter(raw, raw_w, 1, h)
        idx_rows = []
        for row in rows:
            indices = []
            for b in row:
                indices.append((b >> 4) & 0xF)
                indices.append(b & 0xF)
            idx_rows.append(indices[:w])
    elif bd == 8:
        rows = _png_unfilter(raw, w, 1, h)
        idx_rows = rows
    else:
        raise ValueError(f"Unsupported bit depth {bd}")
    return w, h, palette, trns, idx_rows

def png_rgba(data):
    """Parse RGBA/RGB PNG -> (width, height, rgba_rows)."""
    w, h = struct.unpack(">II", data[16:24])
    ch = 4 if data[25] == 6 else 3
    idat = bytearray()
    for ctype, payload in _png_chunks(data):
        if ctype == b"IDAT":
            idat.extend(payload)
    raw = zlib.decompress(bytes(idat))
    rows = _png_unfilter(raw, w * ch, ch, h)
    rgba_rows = []
    for row in rows:
        rgba = []
        for x in range(w):
            b0 = x * ch
            rgba += [row[b0], row[b0+1], row[b0+2], row[b0+3] if ch == 4 else 255]
        rgba_rows.append(rgba)
    return w, h, rgba_rows

# ===================================================================
# PNG encoder
# ===================================================================
def _png_chunk(ctype, payload):
    c = ctype + payload
    return struct.pack(">I", len(payload)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

def encode_png(width, height, rows):
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = _png_chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        raw.extend(bytes(rows[y][:width*4]))
    idat = _png_chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    iend = _png_chunk(b"IEND", b"")
    return sig + ihdr + idat + iend

# ===================================================================
# Palette loader (JASC-PAL format)
# ===================================================================
def parse_jasc_pal(path):
    with open(path, "r") as f:
        lines = f.read().strip().split("\n")
    count = int(lines[2])
    colors = []
    for i in range(3, 3 + count):
        parts = lines[i].split()
        colors.append((int(parts[0]), int(parts[1]), int(parts[2])))
    return colors

def load_palettes():
    """Load combined 13-palette set: 0-5 from primary, 6-12 from secondary."""
    pri_dir = DATA_DIR / "primary" / "general" / "palettes"
    sec_dir = DATA_DIR / "secondary" / "mauville" / "palettes"
    pals = [None] * 13
    for i in range(6):
        p = pri_dir / f"{i:02d}.pal"
        pals[i] = parse_jasc_pal(p) if p.exists() else [(0,0,0)] * 16
    for i in range(6, 13):
        p = sec_dir / f"{i:02d}.pal"
        pals[i] = parse_jasc_pal(p) if p.exists() else [(0,0,0)] * 16
    return pals

# ===================================================================
# Binary data parsers
# ===================================================================
def load_metatiles(path):
    data = path.read_bytes()
    count = len(data) // 16
    metas = []
    for i in range(count):
        refs = list(struct.unpack_from("<8H", data, i * 16))
        metas.append(refs)
    return metas

def load_attributes(path):
    data = path.read_bytes()
    count = len(data) // 2
    return list(struct.unpack_from(f"<{count}H", data))

def load_map_data(path, w, h):
    data = path.read_bytes()
    count = w * h
    return list(struct.unpack_from(f"<{count}H", data))

def lookup_metatile(meta_id, metatiles_pri, metatiles_sec, attrs_pri, attrs_sec):
    if meta_id < 512:
        if meta_id >= len(metatiles_pri):
            return None, 0
        refs = metatiles_pri[meta_id]
        attr = attrs_pri[meta_id] if meta_id < len(attrs_pri) else 0
        return refs, attr
    sec_id = meta_id - 512
    if sec_id >= len(metatiles_sec):
        return None, 0
    refs = metatiles_sec[sec_id]
    attr = attrs_sec[sec_id] if sec_id < len(attrs_sec) else 0
    return refs, attr

def tile_is_water(tile_num):
    for lo, hi in WATER_TILE_RANGES:
        if lo <= tile_num < hi:
            return True
    return False

def build_terrain_masks(map_data, map_w, map_h, metatiles_pri, metatiles_sec, attrs_pri, attrs_sec):
    water = [[False] * map_w for _ in range(map_h)]
    covered = [[False] * map_w for _ in range(map_h)]
    for my in range(map_h):
        for mx in range(map_w):
            entry = map_data[my * map_w + mx]
            meta_id = entry & 0x3FF
            refs, attr = lookup_metatile(meta_id, metatiles_pri, metatiles_sec, attrs_pri, attrs_sec)
            if refs is None:
                continue
            layer_type = (attr >> 12) & 0x3
            covered[my][mx] = (layer_type >= 1)
            for ref in refs:
                t = ref & 0x3FF
                if tile_is_water(t):
                    water[my][mx] = True
                    break
    return water, covered

def inflate_blocked(grid, radius):
    if radius <= 0:
        return [row[:] for row in grid]
    gr = len(grid)
    gc = len(grid[0]) if gr else 0
    out = [row[:] for row in grid]
    for r in range(gr):
        for c in range(gc):
            if not grid[r][c]:
                continue
            for dr in range(-radius, radius + 1):
                for dc in range(-radius, radius + 1):
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < gr and 0 <= nc < gc:
                        out[nr][nc] = True
    return out

def build_nav_grid(base_blocked, water_mask, covered_mask, water_mode="land", clearance=0, sprite_height=0):
    gr = len(base_blocked)
    gc = len(base_blocked[0]) if gr else 0
    if water_mode == "water":
        # Water roamers should be able to traverse water even when water tiles are
        # collision-blocked for regular movement.
        nav = [[True] * gc for _ in range(gr)]
        for r in range(gr):
            for c in range(gc):
                if water_mask[r][c]:
                    nav[r][c] = False
        # Keep water sprites away from land edges so they don't clip into ground.
        if clearance > 0:
            nav = inflate_blocked(nav, clearance)
        return nav

    nav = [row[:] for row in base_blocked]
    # Inflate COVERED (layer_type>=1) tiles DOWNWARD so tall sprites don't
    # walk under building eaves / tree canopies that overhang them.
    # Using covered_mask only (not all blocked tiles) so solid wall tiles don't
    # create excessive clearance below them.
    # Formula: sprite extends (dp - 8) px above tile top -> ceil((dp-8)/16) rows.
    rows_below = max(0, (sprite_height + 7) // META) if sprite_height > 0 else 0
    if rows_below > 0:
        for r in range(gr):
            for c in range(gc):
                if covered_mask[r][c]:
                    for dr in range(1, rows_below + 1):
                        nr = r + dr
                        if 0 <= nr < gr:
                            nav[nr][c] = True
    for r in range(gr):
        for c in range(gc):
            if water_mask[r][c]:
                nav[r][c] = True
    if clearance > 0:
        nav = inflate_blocked(nav, clearance)
    return nav

# ===================================================================
# Tile extraction from indexed PNG tile sheets
# ===================================================================
def extract_tiles(idx_rows, img_w, ts=8):
    tiles_per_row = img_w // ts
    sheet_h = len(idx_rows)
    tiles = []
    for ty in range(0, sheet_h, ts):
        for tx_idx in range(tiles_per_row):
            tx = tx_idx * ts
            tile = []
            for py in range(ts):
                y = ty + py
                row = []
                for px in range(ts):
                    x = tx + px
                    row.append(idx_rows[y][x] if y < sheet_h and x < img_w else 0)
                tile.append(row)
            tiles.append(tile)
    return tiles

# ===================================================================
# Map renderer
# ===================================================================
def render_map(map_data, map_w, map_h, metatiles_pri, metatiles_sec,
               attrs_pri, attrs_sec, tiles_pri, tiles_sec, palettes,
               only_top_split=False, tile_overrides=None):
    """Render map to RGBA pixel buffer.
    only_top_split=False: bottom layer + top layer of non-foreground metatiles.
    only_top_split=True: top layer of collision-blocked metatiles (drawn above sprites).
    tile_overrides: dict mapping tile_id -> tile_data for animation frames.
    """
    img_w, img_h = map_w * META, map_h * META
    pixels = [bytearray(img_w * 4) for _ in range(img_h)]

    for my in range(map_h):
        for mx in range(map_w):
            entry = map_data[my * map_w + mx]
            meta_id = entry & 0x3FF

            meta_refs, attr = lookup_metatile(meta_id, metatiles_pri, metatiles_sec, attrs_pri, attrs_sec)
            if meta_refs is None:
                continue

            layer_type = (attr >> 12) & 0x3
            is_split = (layer_type >= 1)
            collision = (entry >> 10) & 3
            # Foreground: only COVERED/SPLIT (layer_type>=1) AND collision-blocked
            # metatiles have their top layer rendered above sprites.
            # This matches pokeemerald's layer_type semantics:
            #   0 = NORMAL  -> both layers behind sprites always
            #   1 = COVERED -> top layer above sprites when player is on/north of tile
            #   2 = SPLIT   -> top layer always above sprites
            is_foreground = is_split and (collision != 0)

            if only_top_split:
                if not is_foreground:
                    continue
                layers = [1]
            else:
                layers = [0]
                if not is_foreground:
                    layers.append(1)

            for layer in layers:
                base = layer * 4
                for slot in range(4):
                    ref = meta_refs[base + slot]
                    tile_num = ref & 0x3FF
                    xflip = bool(ref & 0x400)
                    yflip = bool(ref & 0x800)
                    pal_num = (ref >> 12) & 0xF

                    pal = palettes[pal_num] if pal_num < len(palettes) and palettes[pal_num] else [(0,0,0)] * 16

                    if tile_overrides and tile_num in tile_overrides:
                        td = tile_overrides[tile_num]
                    elif tile_num < 512:
                        td = tiles_pri[tile_num] if tile_num < len(tiles_pri) else [[0]*8]*8
                    else:
                        sn = tile_num - 512
                        td = tiles_sec[sn] if sn < len(tiles_sec) else [[0]*8]*8

                    sx = mx * META + (slot % 2) * 8
                    sy = my * META + (slot // 2) * 8

                    for py in range(8):
                        ry = 7 - py if yflip else py
                        for px in range(8):
                            rx = 7 - px if xflip else px
                            idx = td[ry][rx]
                            if idx == 0:
                                continue
                            r, g, b = pal[idx] if idx < len(pal) else (0, 0, 0)
                            off = (sx + px) * 4
                            pixels[sy + py][off]   = r
                            pixels[sy + py][off+1] = g
                            pixels[sy + py][off+2] = b
                            pixels[sy + py][off+3] = 255
    return img_w, img_h, pixels

def render_roof_caps(map_data, map_w, map_h, metatiles_pri, metatiles_sec,
                     attrs_pri, attrs_sec, tiles_pri, tiles_sec, palettes,
                     tile_overrides=None):
    """Render split top-layer tiles with collision=0 as roof-cap overlay.
    Excludes animated water/flower tiles to avoid water and flower artifacts.
    """
    img_w, img_h = map_w * META, map_h * META
    pixels = [bytearray(img_w * 4) for _ in range(img_h)]
    flower_tile_min = ANIM_DEFS["flower"]["tile_start"]
    flower_tile_max = flower_tile_min + ANIM_DEFS["flower"]["tile_count"]

    for my in range(map_h):
        for mx in range(map_w):
            entry = map_data[my * map_w + mx]
            meta_id = entry & 0x3FF
            refs, attr = lookup_metatile(meta_id, metatiles_pri, metatiles_sec, attrs_pri, attrs_sec)
            if refs is None:
                continue

            layer_type = (attr >> 12) & 0x3
            collision = (entry >> 10) & 3
            if layer_type < 1 or collision != 0:
                continue

            top_refs = refs[4:8]
            skip = False
            for ref in top_refs:
                tile_num = ref & 0x3FF
                if tile_is_water(tile_num) or (flower_tile_min <= tile_num < flower_tile_max):
                    skip = True
                    break
            if skip:
                continue

            for slot in range(4):
                ref = top_refs[slot]
                tile_num = ref & 0x3FF
                xflip = bool(ref & 0x400)
                yflip = bool(ref & 0x800)
                pal_num = (ref >> 12) & 0xF

                pal = palettes[pal_num] if pal_num < len(palettes) and palettes[pal_num] else [(0,0,0)] * 16

                if tile_overrides and tile_num in tile_overrides:
                    td = tile_overrides[tile_num]
                elif tile_num < 512:
                    td = tiles_pri[tile_num] if tile_num < len(tiles_pri) else [[0]*8]*8
                else:
                    sn = tile_num - 512
                    td = tiles_sec[sn] if sn < len(tiles_sec) else [[0]*8]*8

                sx = mx * META + (slot % 2) * 8
                sy = my * META + (slot // 2) * 8
                for py in range(8):
                    ry = 7 - py if yflip else py
                    for px in range(8):
                        rx = 7 - px if xflip else px
                        idx = td[ry][rx]
                        if idx == 0:
                            continue
                        r, g, b = pal[idx] if idx < len(pal) else (0, 0, 0)
                        off = (sx + px) * 4
                        pixels[sy + py][off]   = r
                        pixels[sy + py][off+1] = g
                        pixels[sy + py][off+2] = b
                        pixels[sy + py][off+3] = 255
    return img_w, img_h, pixels

# ===================================================================
# Collision grid from map.bin
# ===================================================================
def build_collision_grid(map_data, map_w, map_h):
    grid = []
    for my in range(map_h):
        row = []
        for mx in range(map_w):
            entry = map_data[my * map_w + mx]
            collision = (entry >> 10) & 3
            row.append(collision != 0)
        grid.append(row)
    return grid

# ===================================================================
# BFS pathfinding
# ===================================================================
def bfs(grid, gc, gr, sc, sr, ec, er, avoid=None):
    if grid[sr][sc] or grid[er][ec]:
        return None
    if avoid and (ec, er) in avoid:
        return None
    vis = [[False]*gc for _ in range(gr)]
    prev = [[None]*gc for _ in range(gr)]
    vis[sr][sc] = True
    q = deque([(sc, sr)])
    while q:
        c, r = q.popleft()
        if c == ec and r == er:
            p = []
            n = (ec, er)
            while n:
                p.append(n)
                n = prev[n[1]][n[0]]
            return list(reversed(p))
        for dc, dr in DIRS4:
            nc, nr = c + dc, r + dr
            if 0 <= nc < gc and 0 <= nr < gr and not grid[nr][nc] and not vis[nr][nc]:
                if avoid and (nc, nr) in avoid and not (nc == ec and nr == er):
                    continue
                vis[nr][nc] = True
                prev[nr][nc] = (c, r)
                q.append((nc, nr))
    return None

# ===================================================================
# Movement helpers
# ===================================================================
def tile_dir(fc, fr, tc, tr):
    dc, dr = tc - fc, tr - fr
    if dc > 0: return "RIGHT"
    if dc < 0: return "LEFT"
    if dr > 0: return "DOWN"
    return "UP"

def tile_xy(c, r):
    return ((c + 0.5) * TILE, (r + 0.5) * TILE)

def append_idle_with_look(wps, x, y, facing, pause, rng):
    facing = facing if facing in ROW else "DOWN"
    pause = max(0.08, pause)
    if pause >= 1.0 and rng.random() < LOOK_CHANCE:
        look = rng.choice([d for d in CARDINAL_DIRS if d != facing])
        look_dur = min(rng.uniform(LOOK_PAUSE_MIN, LOOK_PAUSE_MAX), pause * 0.45)
        base_dur = max(0.08, pause - look_dur)
        wps.append({"x": x, "y": y, "dir": facing, "dur": base_dur, "idle": True})
        wps.append({"x": x, "y": y, "dir": look, "dur": look_dur, "idle": True})
    else:
        wps.append({"x": x, "y": y, "dir": facing, "dur": pause, "idle": True})

def plan_total_duration(wps):
    return sum(wp["dur"] for wp in wps) if wps else 0.0

def plan_position_at(wps, t):
    if not wps:
        return (0.0, 0.0)
    total = plan_total_duration(wps)
    if total <= 0:
        return (wps[-1]["x"], wps[-1]["y"])
    tt = t % total
    prev_x, prev_y = wps[-1]["x"], wps[-1]["y"]
    acc = 0.0
    for wp in wps:
        dur = wp["dur"]
        if dur <= 0:
            prev_x, prev_y = wp["x"], wp["y"]
            continue
        if acc + dur >= tt:
            a = (tt - acc) / dur
            x = prev_x + (wp["x"] - prev_x) * a
            y = prev_y + (wp["y"] - prev_y) * a
            return (x, y)
        acc += dur
        prev_x, prev_y = wp["x"], wp["y"]
    return (wps[-1]["x"], wps[-1]["y"])

def build_phase_offsets(plans):
    phases = []
    for i, wps in enumerate(plans):
        total = plan_total_duration(wps)
        if total <= 0:
            phases.append(0.0)
            continue
        frac = ((i + 1) * 0.61803398875) % 1.0
        phases.append(frac * total)
    return phases

def optimize_phase_offsets(pokemon, plans, rng, tries=50, horizon=60.0, step=2.0):
    phases = build_phase_offsets(plans)
    best_collisions, best_closest = collision_score(pokemon, plans, phases, horizon=horizon, step=step)
    active = [i for i, wps in enumerate(plans) if wps and plan_total_duration(wps) > 0]
    if not active:
        return phases
    candidate_fracs = (0.5,)
    for _ in range(tries):
        pid = rng.choice(active)
        total = plan_total_duration(plans[pid])
        if total <= 0:
            continue
        old_phase = phases[pid]
        best_phase = old_phase
        trial_phases = [rng.random() * total] + [((old_phase + total * frac) % total) for frac in candidate_fracs]
        for candidate in trial_phases:
            phases[pid] = candidate
            col, close = collision_score(pokemon, plans, phases, horizon=horizon, step=step)
            if col < best_collisions or (col == best_collisions and close > best_closest):
                best_collisions, best_closest = col, close
                best_phase = candidate
        phases[pid] = best_phase
        if best_collisions == 0 and best_closest > TILE * TILE:
            break
    return phases

# ===================================================================
# Tile picking
# ===================================================================
def pick(grid, gc, gr, rng, excl=None, min_dist=3, reserved=None, bounds=None):
    x0, y0, x1, y1 = (0, 0, gc, gr) if bounds is None else bounds
    tiles = [(c, r) for r in range(y0, y1) for c in range(x0, x1) if not grid[r][c]]
    if not tiles:
        return None
    if reserved:
        free = [t for t in tiles if t not in reserved]
        if free:
            tiles = free
    if excl and len(tiles) > 5:
        far = [t for t in tiles if min(abs(t[0]-e[0]) + abs(t[1]-e[1]) for e in excl) > min_dist]
        if far:
            tiles = far
    return rng.choice(tiles)

def pick_reachable_path(grid, gc, gr, rng, cur, reserved, min_leg_dist=10, tries=30, bounds=None):
    x0, y0, x1, y1 = (0, 0, gc, gr) if bounds is None else bounds
    tiles = [(c, r) for r in range(y0, y1) for c in range(x0, x1)
             if not grid[r][c] and (c, r) not in reserved]
    if not tiles:
        return None
    far = [t for t in tiles if abs(t[0] - cur[0]) + abs(t[1] - cur[1]) >= min_leg_dist]
    if far:
        tiles = far
    for _ in range(tries):
        dest = rng.choice(tiles)
        path = bfs(grid, gc, gr, cur[0], cur[1], dest[0], dest[1], avoid=reserved)
        if path and len(path) > 1:
            return path
    return None

# ===================================================================
# Walk plan builder
# ===================================================================
def collision_score(pokemon, plans, phases=None, horizon=120.0, step=0.25):
    if not plans:
        return (10**9, 10**9)
    active = [i for i, wps in enumerate(plans) if wps and plan_total_duration(wps) > 0]
    if len(active) < 2:
        return (0, 10**9)
    if horizon is None:
        horizon = min(180.0, max(60.0, max(plan_total_duration(plans[i]) for i in active)))
    collisions = 0
    closest = float("inf")
    if phases is None:
        phases = [0.0] * len(plans)
    t = 0.0
    while t <= horizon:
        pos = {i: plan_position_at(plans[i], t + phases[i]) for i in active}
        for ai in range(len(active)):
            i = active[ai]
            xi, yi = pos[i]
            dpi = pokemon[i]["dp"]
            for aj in range(ai + 1, len(active)):
                j = active[aj]
                xj, yj = pos[j]
                dpj = pokemon[j]["dp"]
                dx = xi - xj
                dy = yi - yj
                dist2 = dx*dx + dy*dy
                min_sep = (dpi + dpj) * COLLISION_BODY_RATIO
                if dist2 < min_sep * min_sep:
                    collisions += 1
                    # Heavily penalize near-exact overlap so search avoids "stacking".
                    if dist2 < (min_sep * 0.65) ** 2:
                        collisions += 1
                if dist2 < closest:
                    closest = dist2
        t += step
    if closest == float("inf"):
        closest = 10**9
    return (collisions, int(closest))

def build_plan(grid, gc, gr, rng, n_legs, used_starts, reserved=None, bounds=None):
    if reserved is None:
        reserved = set()
    wps = []
    start = pick(grid, gc, gr, rng, used_starts if used_starts else None,
                 min_dist=6, reserved=reserved, bounds=bounds)
    if start is None:
        return [], None, set()
    cur = start
    stop_tiles = {start}
    reserved_path_tiles = {start}
    last_dir = "DOWN"

    for leg in range(n_legs):
        path = pick_reachable_path(grid, gc, gr, rng, cur, reserved,
                       min_leg_dist=12, tries=40, bounds=bounds)
        if not path:
            continue
        dest = path[-1]
        for i in range(len(path) - 1):
            fc, fr = path[i]
            tc, tr = path[i+1]
            x, y = tile_xy(tc, tr)
            d = tile_dir(fc, fr, tc, tr)
            if wps and d != last_dir:
                tx, ty = tile_xy(fc, fr)
                wps.append({
                    "x": tx, "y": ty, "dir": d,
                    "dur": rng.uniform(TURN_PAUSE_MIN, TURN_PAUSE_MAX), "idle": True
                })
            wps.append({"x": x, "y": y, "dir": d, "dur": TILE_DUR})
            reserved_path_tiles.add((tc, tr))
            last_dir = d
        pause = rng.uniform(WANDER_PAUSE_MIN, WANDER_PAUSE_MAX)
        lx, ly = tile_xy(dest[0], dest[1])
        append_idle_with_look(wps, lx, ly, last_dir, pause, rng)
        stop_tiles.add(dest)
        cur = dest

    path = bfs(grid, gc, gr, cur[0], cur[1], start[0], start[1], avoid=reserved)
    if path and len(path) > 1:
        for i in range(len(path) - 1):
            fc, fr = path[i]
            tc, tr = path[i+1]
            x, y = tile_xy(tc, tr)
            d = tile_dir(fc, fr, tc, tr)
            if wps and d != last_dir:
                tx, ty = tile_xy(fc, fr)
                wps.append({
                    "x": tx, "y": ty, "dir": d,
                    "dur": rng.uniform(TURN_PAUSE_MIN, TURN_PAUSE_MAX), "idle": True
                })
            wps.append({"x": x, "y": y, "dir": d, "dur": TILE_DUR})
            reserved_path_tiles.add((tc, tr))
            last_dir = d

    return wps, start, stop_tiles | reserved_path_tiles

def apply_collision_dodges(pokemon, plans, phases, blocked, gc, gr, rounds=12):
    """Insert sidestep dodges at idle waypoints near collision events."""
    for _ in range(rounds):
        active = [i for i, wps in enumerate(plans) if wps and plan_total_duration(wps) > 0]
        max_dur = max((plan_total_duration(plans[i]) for i in active), default=0)
        if max_dur <= 0:
            break
        first = None
        t = 0.0
        while t <= max_dur and first is None:
            pos = {i: plan_position_at(plans[i], t + phases[i]) for i in active}
            for ai in range(len(active)):
                i = active[ai]
                xi, yi = pos[i]
                for aj in range(ai + 1, len(active)):
                    j = active[aj]
                    xj, yj = pos[j]
                    sep = (pokemon[i]["dp"] + pokemon[j]["dp"]) * COLLISION_BODY_RATIO
                    if (xi - xj) ** 2 + (yi - yj) ** 2 < sep * sep:
                        first = (t, i, j)
                        break
                if first:
                    break
            t += 0.25
        if not first:
            break
        t_col, pi, pj = first
        vi = pi if plan_total_duration(plans[pi]) <= plan_total_duration(plans[pj]) else pj
        oi = pj if vi == pi else pi
        wps = plans[vi]
        total = plan_total_duration(wps)
        t_plan = (t_col + phases[vi]) % total
        acc, best_wi, best_d = 0.0, None, 1e9
        for wi, wp in enumerate(wps):
            if wp.get("idle"):
                d = min(abs(acc - t_plan), total - abs(acc - t_plan))
                if d < best_d:
                    best_d, best_wi = d, wi
            acc += wp["dur"]
        if best_wi is None:
            phases[vi] = (phases[vi] + total * 0.2) % total
            continue
        iwp = wps[best_wi]
        cx, cr = int(iwp["x"] / TILE), int(iwp["y"] / TILE)
        ox, oy = plan_position_at(plans[oi], t_col + phases[oi])
        move_opts = []
        for dc, dr in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
            nc, nr = cx + dc, cr + dr
            if 0 <= nc < gc and 0 <= nr < gr and not blocked[nr][nc]:
                nx, ny = (nc + 0.5) * TILE, (nr + 0.5) * TILE
                sep2 = (nx - ox) ** 2 + (ny - oy) ** 2
                move_opts.append((sep2, nc, nr, nx, ny))
        move_opts.sort(key=lambda v: v[0], reverse=True)
        dodged = False
        for _, nc, nr, nx, ny in move_opts:
            h = max(0.25, min(0.8, iwp["dur"] * 0.45))
            wps[best_wi:best_wi + 1] = [
                {"x": iwp["x"], "y": iwp["y"], "dir": "DOWN", "dur": h, "idle": True},
                {"x": nx, "y": ny, "dir": tile_dir(cx, cr, nc, nr), "dur": TILE_DUR},
                {"x": nx, "y": ny, "dir": "DOWN", "dur": 0.35, "idle": True},
                {"x": iwp["x"], "y": iwp["y"], "dir": tile_dir(nc, nr, cx, cr), "dur": TILE_DUR},
                {"x": iwp["x"], "y": iwp["y"], "dir": "DOWN", "dur": h, "idle": True},
            ]
            dodged = True
            break
        if not dodged:
            wps[best_wi]["dur"] += 0.9

# ===================================================================
# SVG generation
# ===================================================================
def F(v, d=2):
    return f"{v:.{d}f}".rstrip("0").rstrip(".")

def pokemon_svg(pk, pid, b64img, wps, phase=0.0):
    if not wps:
        return ""
    dp = pk["dp"]
    scale = dp / pk["frame_w"]
    sdisp = int(pk["sheet_w"] * scale)
    hw = dp // 2
    shiny = pk["is_shiny"]

    pos_vals = []
    dir_vals = []
    kt = [0.0]
    t = 0.0
    sx, sy = wps[-1]["x"], wps[-1]["y"]
    pos_vals.append(f"{F(sx)},{F(sy)}")
    dir_vals.append(ROW[wps[0]["dir"]])

    for i, wp in enumerate(wps):
        t += wp["dur"]
        pos_vals.append(f"{F(wp['x'])},{F(wp['y'])}")
        nxt = wps[(i + 1) % len(wps)]
        dir_vals.append(ROW[nxt["dir"]])
        kt.append(t)

    total = kt[-1] or 10.0
    kt_str = "; ".join(F(v/total, 5) for v in kt)
    pos_str = "; ".join(pos_vals)
    dir_y_str = "; ".join(f"0,{-r*dp}" for r in dir_vals)
    frame_vals = "; ".join(f"{-i*dp},0" for i in range(WALK_FRAMES))
    frame_kts = "; ".join(F(i/WALK_FRAMES, 3) for i in range(WALK_FRAMES))

    glow = ' filter="url(#shiny-glow)"' if shiny else ""
    cid = f"pk{pid}clip"
    sparkle = ""
    if shiny:
        sparkle = (f'\n    <animate attributeName="opacity"'
                   f' values="0.88;1;0.88" dur="{2.0+pid*0.3:.1f}s" repeatCount="indefinite"/>')

    phase_str = F(phase)
    return f"""
  <!-- {pk["label"]} -->
  <g>{sparkle}
    <animateTransform attributeName="transform" type="translate"
      values="{pos_str}" keyTimes="{kt_str}"
            dur="{F(total)}s" begin="-{phase_str}s" repeatCount="indefinite" calcMode="linear"/>
    <animateTransform attributeName="transform" type="translate"
      values="0,0; 0,-2; 0,0" dur="0.6s" repeatCount="indefinite"
      additive="sum" calcMode="spline" keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"/>
    <g transform="translate(-{hw},-{dp})" clip-path="url(#{cid})"{glow}>
      <g>
        <animateTransform attributeName="transform" type="translate"
          values="{dir_y_str}" keyTimes="{kt_str}"
                    dur="{F(total)}s" begin="-{phase_str}s" repeatCount="indefinite" calcMode="discrete"/>
        <g>
          <animateTransform attributeName="transform" type="translate"
            values="{frame_vals}" keyTimes="{frame_kts}"
            dur="{F(WALK_CYCLE)}s" repeatCount="indefinite" calcMode="discrete"/>
          <image href="data:image/png;base64,{b64img}"
                 width="{sdisp}" height="{sdisp}" style="image-rendering:pixelated"/>
        </g>
      </g>
    </g>
  </g>"""

# ===================================================================
# Main
# ===================================================================
def main():
    out = ROOT_DIR / "readme" / "pokemon-roam-rt111.svg"
    out.parent.mkdir(parents=True, exist_ok=True)
    rng = random.Random(42)

    # -- Load tileset data --
    print("Loading tilesets...")
    pri_tiles_data = (DATA_DIR / "primary" / "general" / "tiles.png").read_bytes()
    sec_tiles_data = (DATA_DIR / "secondary" / "mauville" / "tiles.png").read_bytes()
    pw, ph, _, _, pri_idx = png_indexed(pri_tiles_data)
    sw, sh, _, _, sec_idx = png_indexed(sec_tiles_data)
    print(f"  Primary tiles: {pw}x{ph}")
    print(f"  Secondary tiles: {sw}x{sh}")

    tiles_pri = extract_tiles(pri_idx, pw)
    tiles_sec = extract_tiles(sec_idx, sw)
    print(f"  Extracted: {len(tiles_pri)} primary, {len(tiles_sec)} secondary tiles")

    # -- Load palettes --
    print("Loading palettes...")
    palettes = load_palettes()

    # -- Load metatile definitions --
    print("Loading metatiles...")
    metatiles_pri = load_metatiles(DATA_DIR / "primary" / "general" / "metatiles.bin")
    metatiles_sec = load_metatiles(DATA_DIR / "secondary" / "mauville" / "metatiles.bin")
    attrs_pri = load_attributes(DATA_DIR / "primary" / "general" / "metatile_attributes.bin")
    attrs_sec = load_attributes(DATA_DIR / "secondary" / "mauville" / "metatile_attributes.bin")
    print(f"  {len(metatiles_pri)} primary, {len(metatiles_sec)} secondary metatiles")

    # -- Load map data -- Route 111 (single vertical map) --
    print("Loading map data...")
    rt111_map = load_map_data(DATA_DIR / "map" / "Route111" / "map.bin", RT111_W, RT111_H)
    print(f"  Route111: {RT111_W}x{RT111_H}")
    ext_map = list(rt111_map)
    print(f"  Map: {MAP_W}x{MAP_H} = {len(ext_map)} entries")

    # Patch rock-in-water tiles with plain deep water (meta 368).
    WATER_ENTRY = 0x1170   # meta=368 (tiles 454,455 water, top layer transparent)
    patched = 0
    for y in range(MAP_H):
        for x in range(MAP_W):
            idx = y * MAP_W + x
            entry = ext_map[idx]
            mid = entry & 0x3FF
            coll = (entry >> 10) & 3
            if coll == 0:
                continue
            refs, attr = lookup_metatile(mid, metatiles_pri, metatiles_sec, attrs_pri, attrs_sec)
            if refs is None:
                continue
            if any(tile_is_water(r & 0x3FF) for r in refs):
                ext_map[idx] = WATER_ENTRY
                patched += 1
    print(f"  Patched {patched} rock-in-water tiles")

    # -- Load animation frames --
    print("Loading animation frames...")
    anim_dir = DATA_DIR / "primary" / "general" / "anim"
    anim_frames = {}
    for aname, adef in ANIM_DEFS.items():
        frames = {}
        fdir = anim_dir / adef["frame_dir"]
        unique_frames = sorted(set(adef["frame_cycle"]))
        for fi in unique_frames:
            fpath = fdir / f"{fi}.png"
            if not fpath.exists():
                print(f"  WARNING: {fpath} not found")
                continue
            fw, fh, _, _, fidx = png_indexed(fpath.read_bytes())
            ftiles = extract_tiles(fidx, fw)
            frames[fi] = ftiles
            print(f"  {aname} frame {fi}: {fw}x{fh} -> {len(ftiles)} tiles")
        anim_frames[aname] = frames

    def build_overrides(step):
        overrides = {}
        for aname, adef in ANIM_DEFS.items():
            cycle = adef["frame_cycle"]
            fidx = cycle[step % len(cycle)]
            if fidx not in anim_frames.get(aname, {}):
                continue
            ftiles = anim_frames[aname][fidx]
            for i, td in enumerate(ftiles):
                overrides[adef["tile_start"] + i] = td
        return overrides

    # -- Render base map (animation step 0) --
    print("Rendering base map (step 0)...")
    base_overrides = build_overrides(0)
    bg_w, bg_h, bg_pixels = render_map(
        ext_map, MAP_W, MAP_H, metatiles_pri, metatiles_sec,
        attrs_pri, attrs_sec, tiles_pri, tiles_sec, palettes,
        only_top_split=False, tile_overrides=base_overrides)
    bg_png = encode_png(bg_w, bg_h, bg_pixels)
    bg_b64 = base64.b64encode(bg_png).decode()
    print(f"  {bg_w}x{bg_h}, PNG={len(bg_png):,} bytes")

    # -- Build roof-cap overlay for walkable covered tiles (layer_type>=1, collision==0) --
    # These tiles have their top layer above sprites per game logic, but aren't
    # in the foreground (which requires collision!=0).  Excludes water/flower.
    print("Rendering roof-cap overlay...")
    rc_w, rc_h, rc_pixels = render_roof_caps(
        ext_map, MAP_W, MAP_H, metatiles_pri, metatiles_sec,
        attrs_pri, attrs_sec, tiles_pri, tiles_sec, palettes,
        tile_overrides=base_overrides)
    roof_cap_has_content = any(rc_pixels[y][x*4+3] > 0
                               for y in range(rc_h) for x in range(rc_w))
    if roof_cap_has_content:
        rc_png = encode_png(rc_w, rc_h, rc_pixels)
        roof_cap_b64 = base64.b64encode(rc_png).decode()
        print(f"  Roof-cap: PNG={len(rc_png):,} bytes")
    else:
        roof_cap_b64 = None
        print("  Roof-cap: no content")

    # -- Render animation overlay frames (steps 1-7) --
    print("Rendering animation overlays...")
    overlay_b64s = []
    for step in range(1, ANIM_TOTAL_STEPS):
        step_overrides = build_overrides(step)
        _, _, step_pixels = render_map(
            ext_map, MAP_W, MAP_H, metatiles_pri, metatiles_sec,
            attrs_pri, attrs_sec, tiles_pri, tiles_sec, palettes,
            only_top_split=False, tile_overrides=step_overrides)
        # Diff overlay: only changed pixels
        ov_pixels = [bytearray(bg_w * 4) for _ in range(bg_h)]
        has_diff = False
        for y in range(bg_h):
            for x in range(bg_w):
                off = x * 4
                if (step_pixels[y][off]   != bg_pixels[y][off] or
                    step_pixels[y][off+1] != bg_pixels[y][off+1] or
                    step_pixels[y][off+2] != bg_pixels[y][off+2] or
                    step_pixels[y][off+3] != bg_pixels[y][off+3]):
                    ov_pixels[y][off]   = step_pixels[y][off]
                    ov_pixels[y][off+1] = step_pixels[y][off+1]
                    ov_pixels[y][off+2] = step_pixels[y][off+2]
                    ov_pixels[y][off+3] = step_pixels[y][off+3]
                    has_diff = True
        if has_diff:
            ov_png = encode_png(bg_w, bg_h, ov_pixels)
            overlay_b64s.append(base64.b64encode(ov_png).decode())
            print(f"  Step {step}: overlay {len(ov_png):,} bytes")
        else:
            overlay_b64s.append(None)
            print(f"  Step {step}: no changes")

    # -- Render foreground layer --
    print("Rendering foreground layer...")
    fg_w, fg_h, fg_pixels = render_map(
        ext_map, MAP_W, MAP_H, metatiles_pri, metatiles_sec,
        attrs_pri, attrs_sec, tiles_pri, tiles_sec, palettes,
        only_top_split=True, tile_overrides=base_overrides)
    fg_png = encode_png(fg_w, fg_h, fg_pixels)
    fg_b64 = base64.b64encode(fg_png).decode()
    fg_has_content = any(fg_pixels[y][x*4+3] > 0
                         for y in range(fg_h) for x in range(fg_w))
    print(f"  {fg_w}x{fg_h}, PNG={len(fg_png):,} bytes, has_content={fg_has_content}")

    # -- Build collision grid --
    print("Building collision grid...")
    raw_collision = build_collision_grid(ext_map, MAP_W, MAP_H)
    water_mask, covered_mask = build_terrain_masks(
        ext_map, MAP_W, MAP_H, metatiles_pri, metatiles_sec, attrs_pri, attrs_sec)
    gc, gr = MAP_W, MAP_H
    # Covered/split tiles are foreground roof/canopy space and should be non-walkable.
    base_blocked = [[raw_collision[r][c] or covered_mask[r][c] for c in range(gc)] for r in range(gr)]

    # Route 111 has no building facades; ROOFTOP_META_IDS is empty.
    ROOFTOP_META_IDS = set()
    for r in range(gr):
        for c in range(gc):
            mid = ext_map[r * gc + c] & 0x3FF
            if mid in ROOFTOP_META_IDS:
                base_blocked[r][c] = True

    # Apply manual overrides from walkable_edit.png if present.
    # Green-dominant pixel  → force walkable; red/orange-dominant → force blocked.
    # Sets are also applied to water-mode pokemon nav grids (for Kyogre-style routing).
    _water_force_walkable = set()
    _water_force_blocked  = set()
    _edit_png = Path(__file__).resolve().parent.parent / 'debug_tiles' / 'walkable_edit_rt111.png'
    if _edit_png.exists():
        def _decode_rgb(path):
            d = path.read_bytes()
            if d[:8] != b'\x89PNG\r\n\x1a\n': return None
            w, h = struct.unpack_from('>II', d, 16)
            ct = d[25]; ch = 3 if ct == 2 else (4 if ct == 6 else None)
            if d[24] != 8 or ch is None: return None
            idat_parts = []
            pos = 8
            while pos + 12 <= len(d):
                length = struct.unpack_from('>I', d, pos)[0]
                if d[pos+4:pos+8] == b'IDAT':
                    idat_parts.append(d[pos+8:pos+8+length])
                elif d[pos+4:pos+8] == b'IEND':
                    break
                pos += 12 + length
            raw = bytearray(zlib.decompress(b''.join(idat_parts))); s = w * ch
            rows = []; prev = bytearray(s); idx = 0
            for _ in range(h):
                ft = raw[idx]; idx += 1
                sl = bytearray(raw[idx:idx+s]); idx += s
                if ft == 1:
                    for i in range(ch, s): sl[i] = (sl[i]+sl[i-ch])&255
                elif ft == 2:
                    for i in range(s): sl[i] = (sl[i]+prev[i])&255
                elif ft == 3:
                    for i in range(s): sl[i] = (sl[i]+(( sl[i-ch] if i>=ch else 0)+prev[i])//2)&255
                elif ft == 4:
                    for i in range(s):
                        a=sl[i-ch] if i>=ch else 0; b=prev[i]; c2=prev[i-ch] if i>=ch else 0
                        pa,pb,pc=abs(b-c2),abs(a-c2),abs(a+b-2*c2)
                        pr=a if pa<=pb and pa<=pc else(b if pb<=pc else c2)
                        sl[i]=(sl[i]+pr)&255
                prev=sl; rows.append([(sl[i*ch],sl[i*ch+1],sl[i*ch+2]) for i in range(w)])
            return rows
        _rows = _decode_rgb(_edit_png)
        EDIT_CELL = 32
        if _rows:
            ph, pw = len(_rows), len(_rows[0]) if _rows else 0
            _n_w = _n_b = 0
            for _r in range(gr):
                for _c in range(gc):
                    cy = _r * EDIT_CELL + EDIT_CELL // 2
                    cx = _c * EDIT_CELL + EDIT_CELL // 2
                    if cy < ph and cx < pw:
                        pr, pg, pb2 = _rows[cy][cx]
                        if   pg > max(pr, pb2) * 1.25 and pg > 100:
                            if base_blocked[_r][_c]: _n_w += 1
                            base_blocked[_r][_c] = False
                            _water_force_walkable.add((_r, _c))
                        elif pr > max(pg, pb2) * 1.25 and pr > 100:
                            if not base_blocked[_r][_c]: _n_b += 1
                            base_blocked[_r][_c] = True
                            _water_force_blocked.add((_r, _c))
            print(f"  walkable_edit.png: +{_n_w} forced walkable, +{_n_b} forced blocked")

    wk = sum(1 for r in range(gr) for c in range(gc) if not base_blocked[r][c])
    print(f"  {gc}x{gr} tiles, {wk} walkable / {gc*gr} total")

    # -- Load pokemon sprites --
    print("Loading sprites...")
    b64 = {}
    for name, path in SPRITES.items():
        d = Path(path).read_bytes()
        b64[name] = base64.b64encode(d).decode()
        w, h = png_dims(d)
        print(f"  {name}: {w}x{h}")

    pokemon = [
        # Zone 0 (rows 0-35): Carbink+Diancie, Charcadet+Armarouge+Ceruledge
        dict(key="carbink",   label="Carbink",   sheet_w=256, frame_w=64,  dp=22, is_shiny=True,  n_legs=6, water_mode="land",  bounds=(0,  0,  40,  36)),
        dict(key="diancie",   label="Diancie",   sheet_w=256, frame_w=64,  dp=28, is_shiny=False, n_legs=6, water_mode="land",  bounds=(0,  0,  40,  36)),
        dict(key="charcadet", label="Charcadet",  sheet_w=256, frame_w=64,  dp=22, is_shiny=True,  n_legs=8, water_mode="land",  bounds=(0,  0,  40,  36)),
        dict(key="armarouge", label="Armarouge",  sheet_w=256, frame_w=64,  dp=28, is_shiny=True,  n_legs=6, water_mode="land",  bounds=(0,  0,  40,  36)),
        dict(key="ceruledge", label="Ceruledge",  sheet_w=256, frame_w=64,  dp=28, is_shiny=True,  n_legs=7, water_mode="land",  bounds=(0,  0,  40,  36)),
        # Zone 1 (rows 36-70): Froakie+Greninja, Skarmory, Gardevoir, Yveltal
        dict(key="froakie",   label="Froakie",    sheet_w=256, frame_w=64,  dp=22, is_shiny=True,  n_legs=8, water_mode="land",  bounds=(0, 36,  40,  70)),
        dict(key="greninja",  label="Greninja",   sheet_w=256, frame_w=64,  dp=28, is_shiny=True,  n_legs=6, water_mode="land",  bounds=(0, 36,  40,  70)),
        dict(key="skarmory",  label="Skarmory",   sheet_w=256, frame_w=64,  dp=32, is_shiny=True,  n_legs=5, water_mode="land",  bounds=(0, 36,  40,  70)),
        dict(key="gardevoir", label="Gardevoir",  sheet_w=256, frame_w=64,  dp=28, is_shiny=True,  n_legs=6, water_mode="land",  bounds=(0, 36,  40,  70)),
        dict(key="yveltal",   label="Yveltal",    sheet_w=512, frame_w=128, dp=48, is_shiny=True,  n_legs=4, water_mode="land",  clearance=0, bounds=(0, 36,  40,  70)),
        # Zone 2 (rows 70-100): Dragonair+Dragonite, Gengar, Charizard, Fidough, Goodra
        dict(key="dragonair", label="Dragonair",  sheet_w=256, frame_w=64,  dp=28, is_shiny=True,  n_legs=6, water_mode="land",  bounds=(0, 70,  40, 100)),
        dict(key="dragonite", label="Dragonite",  sheet_w=256, frame_w=64,  dp=28, is_shiny=True,  n_legs=5, water_mode="land",  bounds=(0, 70,  40, 100)),
        dict(key="gengar",    label="Gengar",     sheet_w=256, frame_w=64,  dp=28, is_shiny=True,  n_legs=6, water_mode="land",  bounds=(0, 70,  40, 100)),
        dict(key="charizard", label="Charizard",  sheet_w=256, frame_w=64,  dp=32, is_shiny=True,  n_legs=5, water_mode="land",  bounds=(0, 70,  40, 100)),
        dict(key="fidough",   label="Fidough",    sheet_w=256, frame_w=64,  dp=22, is_shiny=True,  n_legs=7, water_mode="land",  bounds=(0, 70,  40, 100)),
        dict(key="goodra",    label="Goodra",     sheet_w=256, frame_w=64,  dp=32, is_shiny=True,  n_legs=5, water_mode="land",  bounds=(0, 70,  40, 100)),
        # Zone 3 (rows 100-120): Latios+Latias, Fuecoco, Appletun, Blaziken, Sceptile, Garchomp, Mewtwo
        dict(key="latios",    label="Latios",     sheet_w=256, frame_w=64,  dp=28, is_shiny=True,  n_legs=6, water_mode="land",  bounds=(0,100,  40, 120)),
        dict(key="latias",    label="Latias",     sheet_w=256, frame_w=64,  dp=28, is_shiny=True,  n_legs=6, water_mode="land",  bounds=(0,100,  40, 120)),
        dict(key="fuecoco",   label="Fuecoco",    sheet_w=256, frame_w=64,  dp=22, is_shiny=True,  n_legs=8, water_mode="land",  bounds=(0,100,  40, 120)),
        dict(key="appletun",  label="Appletun",   sheet_w=256, frame_w=64,  dp=28, is_shiny=False, n_legs=6, water_mode="land",  bounds=(0,100,  40, 120)),
        dict(key="blaziken",  label="Blaziken",   sheet_w=256, frame_w=64,  dp=32, is_shiny=True,  n_legs=5, water_mode="land",  bounds=(0,100,  40, 120)),
        dict(key="sceptile",  label="Sceptile",   sheet_w=256, frame_w=64,  dp=32, is_shiny=True,  n_legs=5, water_mode="land",  bounds=(0,100,  40, 120)),
        dict(key="garchomp",  label="Garchomp",   sheet_w=256, frame_w=64,  dp=32, is_shiny=True,  n_legs=5, water_mode="land",  bounds=(0,100,  40, 120)),
        dict(key="mewtwo",    label="Mewtwo",     sheet_w=256, frame_w=64,  dp=32, is_shiny=True,  n_legs=4, water_mode="land",  bounds=(0,100,  40, 120)),
        # Zone 4 (rows 120-140): Sylveon+Eevee+Umbreon+Flareon+Glaceon, Blastoise+Squirtle
        dict(key="sylveon",   label="Sylveon",    sheet_w=256, frame_w=64,  dp=24, is_shiny=True,  n_legs=6, water_mode="land",  bounds=(0,120,  40, 140)),
        dict(key="eevee",     label="Eevee",      sheet_w=256, frame_w=64,  dp=22, is_shiny=True,  n_legs=8, water_mode="land",  bounds=(0,120,  40, 140)),
        dict(key="umbreon",   label="Umbreon",    sheet_w=256, frame_w=64,  dp=24, is_shiny=True,  n_legs=6, water_mode="land",  bounds=(0,120,  40, 140)),
        dict(key="flareon",   label="Flareon",    sheet_w=256, frame_w=64,  dp=24, is_shiny=False, n_legs=6, water_mode="land",  bounds=(0,120,  40, 140)),
        dict(key="glaceon",   label="Glaceon",    sheet_w=256, frame_w=64,  dp=24, is_shiny=True,  n_legs=6, water_mode="land",  bounds=(0,120,  40, 140)),
        dict(key="blastoise", label="Blastoise",  sheet_w=256, frame_w=64,  dp=28, is_shiny=True,  n_legs=5, water_mode="land",  bounds=(0,120,  40, 140)),
        dict(key="squirtle",  label="Squirtle",   sheet_w=256, frame_w=64,  dp=22, is_shiny=True,  n_legs=7, water_mode="land",  bounds=(0,120,  40, 140)),
        # Water (full map)
        dict(key="kyogre",    label="Kyogre",     sheet_w=512, frame_w=128, dp=48, is_shiny=True,  n_legs=4, water_mode="water", clearance=0, bounds=None),
    ]

    # -- Plan pokemon routes --
    print("Planning routes...")
    best = None
    for attempt in range(30):
        plans = [None] * len(pokemon)
        step_counts = [0] * len(pokemon)
        used_starts = []
        all_reserved = set()
        total_steps = 0
        min_steps = None
        nonzero_count = 0
        order = list(range(len(pokemon)))
        rng.shuffle(order)

        for pid in order:
            pk = pokemon[pid]
            if pk.get("water_mode") == "water":
                clearance = pk.get("clearance", 2)
                sp_height = 0
            else:
                clearance = pk.get("clearance", 0)
                sp_height = pk["dp"]
            nav_grid = build_nav_grid(base_blocked, water_mask, covered_mask,
                                      pk.get("water_mode", "land"), clearance,
                                      sprite_height=sp_height)
            # Apply walkable_edit overrides to water-mode nav grids too.
            if pk.get("water_mode") == "water":
                for _wr, _wc in _water_force_walkable:
                    nav_grid[_wr][_wc] = False
                for _wr, _wc in _water_force_blocked:
                    nav_grid[_wr][_wc] = True
            bounds = pk.get("bounds")
            leg_candidates = []
            for legs in (pk["n_legs"], max(3, pk["n_legs"] - 2), max(2, pk["n_legs"] // 2)):
                if legs not in leg_candidates:
                    leg_candidates.append(legs)
            bound_candidates = [bounds]
            if bounds is not None:
                bound_candidates.append(None)
            wps, start, reserved = [], None, set()
            for b in bound_candidates:
                for legs in leg_candidates:
                    wps, start, reserved = build_plan(nav_grid, gc, gr, rng, legs,
                                                      used_starts, all_reserved, bounds=b)
                    if wps:
                        break
                if wps:
                    break
            if not wps:
                for legs in leg_candidates:
                    wps, start, reserved = build_plan(nav_grid, gc, gr, rng, legs,
                                                      used_starts, set(), bounds=None)
                    if wps:
                        break
            n_steps = sum(1 for s in wps if not s.get("idle"))
            plans[pid] = wps
            step_counts[pid] = n_steps
            if start is not None:
                used_starts.append(start)
            if reserved:
                all_reserved |= reserved
            total_steps += n_steps
            if n_steps > 0:
                nonzero_count += 1
            min_steps = n_steps if min_steps is None else min(min_steps, n_steps)

        phases = optimize_phase_offsets(pokemon, plans, rng, tries=32, horizon=60.0, step=2.0)
        clash_count, closest2 = collision_score(pokemon, plans, phases, horizon=60.0, step=1.0)
        deficits = 0
        for pk, steps in zip(pokemon, step_counts):
            if pk["key"] == "yveltal":
                target = 30
            elif pk["key"] == "kyogre":
                target = 24
            else:
                target = 40
            if steps < target:
                deficits += (target - steps)
        inactive = len(pokemon) - nonzero_count
        score = (inactive, deficits, clash_count, -(min_steps or 0), -total_steps, -closest2)
        if best is None or score < best["score"]:
            best = {
                "score": score,
                "plans": plans,
                "phases": phases,
                "clashes": clash_count,
                "nonzero": nonzero_count,
                "deficits": deficits,
            }
        if inactive == 0 and deficits == 0 and clash_count == 0:
            break

    plans = best["plans"]
    phases = optimize_phase_offsets(pokemon, plans, rng, tries=70, horizon=80.0, step=0.5)
    apply_collision_dodges(pokemon, plans, phases, base_blocked, gc, gr, rounds=14)
    phases = optimize_phase_offsets(pokemon, plans, rng, tries=60, horizon=80.0, step=0.33)
    strict_clashes, _strict_closest = collision_score(pokemon, plans, phases, horizon=80.0, step=0.25)
    if strict_clashes > 0:
        apply_collision_dodges(pokemon, plans, phases, base_blocked, gc, gr, rounds=18)
        phases = optimize_phase_offsets(pokemon, plans, rng, tries=60, horizon=80.0, step=0.33)
        strict_clashes, _strict_closest = collision_score(pokemon, plans, phases, horizon=80.0, step=0.25)
    for pk, wps in zip(pokemon, plans):
        walk_s = sum(s["dur"] for s in wps if not s.get("idle"))
        idle_s = sum(s["dur"] for s in wps if s.get("idle"))
        n_steps = sum(1 for s in wps if not s.get("idle"))
        print(f"  {pk['label']}: {n_steps} steps, walk={walk_s:.1f}s idle={idle_s:.1f}s")
    active_now = sum(1 for wps in plans if wps and plan_total_duration(wps) > 0)
    print(f"  Collision score: {strict_clashes} (active={active_now}/{len(pokemon)})")
    print(f"  Route deficits: {best['deficits']}")

    # -- Generate SVG --
    print("Generating SVG...")
    disp_w, disp_h = bg_w * SCALE, bg_h * SCALE

    clips = ""
    for i, pk in enumerate(pokemon):
        dp_val = pk["dp"]
        clips += f'    <clipPath id="pk{i}clip"><rect width="{dp_val}" height="{dp_val}"/></clipPath>\n'

    # Sort Pokemon by starting Y so lower-on-screen sprites render later
    indexed = list(range(len(pokemon)))
    indexed.sort(key=lambda i: plans[i][-1]["y"] if plans[i] else 0)

    psvgs = "".join(
        pokemon_svg(pokemon[i], i, b64[pokemon[i]["key"]], plans[i], phases[i])
        for i in indexed)

    # Animation overlay SVG elements
    anim_kt = ";".join(F(i / ANIM_TOTAL_STEPS, 4) for i in range(ANIM_TOTAL_STEPS))
    anim_overlays = ""
    for si, ov_b64 in enumerate(overlay_b64s):
        if ov_b64 is None:
            continue
        step_num = si + 1
        vis_vals = ";".join("visible" if i == step_num else "hidden"
                            for i in range(ANIM_TOTAL_STEPS))
        anim_overlays += f"""
  <g visibility="hidden">
    <animate attributeName="visibility" values="{vis_vals}"
      keyTimes="{anim_kt}" dur="{F(ANIM_TOTAL_DUR)}s"
      calcMode="discrete" repeatCount="indefinite"/>
    <image href="data:image/png;base64,{ov_b64}"
           x="0" y="0" width="{bg_w}" height="{bg_h}" style="image-rendering:pixelated"/>
  </g>"""

    fg_layer = ""
    if fg_has_content:
        fg_layer = f"""
  <!-- Foreground: building roofs, tree canopies (always on top of sprites) -->
  <image href="data:image/png;base64,{fg_b64}"
         x="0" y="0" width="{bg_w}" height="{bg_h}" style="image-rendering:pixelated"/>"""

    roof_cap_layer = ""
    if roof_cap_has_content:
        roof_cap_layer = f"""
  <!-- Roof-cap overlay from full-map.png -->
  <image href="data:image/png;base64,{roof_cap_b64}"
         x="0" y="0" width="{bg_w}" height="{bg_h}" style="image-rendering:pixelated"/>"""

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 {bg_w} {bg_h}" width="{disp_w}" height="{disp_h}">
  <defs>
    <filter id="shiny-glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="0.2 0 0 0 0.4  0 0.4 0 0 0.5  0 0 1.4 0 0.5  0 0 0 2 0" result="glow"/>
      <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
{clips}  </defs>

  <!-- Base map (animation step 0) -->
  <image href="data:image/png;base64,{bg_b64}"
         x="0" y="0" width="{bg_w}" height="{bg_h}" style="image-rendering:pixelated"/>
{anim_overlays}
{roof_cap_layer}
{fg_layer}
  <!-- Pokemon sprites (above all terrain) -->
{psvgs}
</svg>"""

    with open(out, "w", encoding="utf-8") as fh:
        fh.write(svg)
    print(f"\nDone: {os.path.getsize(out):,} bytes -> {out}")

if __name__ == "__main__":
    main()
