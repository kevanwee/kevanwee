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
    "ceruledge": OFFICE / "Pokemon Shiny" / "CERULEDGE.png",
    "armarouge": OFFICE / "Pokemon Shiny" / "ARMAROUGE.png",
    "charcadet": OFFICE / "Pokemon Shiny" / "CHARCADET.png",
    "yveltal":   OFFICE / "Pokemon Shiny" / "YVELTAL.png",
    "greninja":  OFFICE / "Pokemon Shiny" / "GRENINJA.png",
    "dragonair": OFFICE / "Pokemon Shiny" / "DRAGONAIR.png",
    "dragonite": OFFICE / "Pokemon Shiny" / "DRAGONITE.png",
    "eevee":     OFFICE / "Pokemon Shiny" / "EEVEE.png",
    "fuecoco":   OFFICE / "Pokemon Shiny" / "FUECOCO.png",
    "latios":    OFFICE / "Pokemon Shiny" / "LATIOS.png",
}

# ===================================================================
# Map config - Mauville City with border padding
# ===================================================================
INNER_W, INNER_H = 40, 20          # Original map dimensions
PAD = 5                             # Border padding in metatiles
MAP_W = INNER_W + 2 * PAD          # 50
MAP_H = INNER_H + 2 * PAD          # 30
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
WANDER_PAUSE_MIN = 0.5
WANDER_PAUSE_MAX = 4.0
ROW = {"DOWN": 0, "LEFT": 1, "RIGHT": 2, "UP": 3}
DIRS4 = [(1,0),(-1,0),(0,1),(0,-1)]

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
    only_top_split=False: bottom layer + top layer of non-split metatiles.
    only_top_split=True: ONLY top layer of split metatiles (layer_type==2).
    tile_overrides: dict mapping tile_id -> tile_data for animation frames.
    """
    img_w, img_h = map_w * META, map_h * META
    pixels = [bytearray(img_w * 4) for _ in range(img_h)]

    for my in range(map_h):
        for mx in range(map_w):
            entry = map_data[my * map_w + mx]
            meta_id = entry & 0x3FF

            if meta_id < 512:
                if meta_id >= len(metatiles_pri):
                    continue
                meta_refs = metatiles_pri[meta_id]
                attr = attrs_pri[meta_id] if meta_id < len(attrs_pri) else 0
            else:
                sec_id = meta_id - 512
                if sec_id >= len(metatiles_sec):
                    continue
                meta_refs = metatiles_sec[sec_id]
                attr = attrs_sec[sec_id] if sec_id < len(attrs_sec) else 0

            layer_type = (attr >> 8) & 0xF
            is_split = (layer_type == 2)

            if only_top_split:
                if not is_split:
                    continue
                layers = [1]
            else:
                layers = [0]
                if not is_split:
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

# ===================================================================
# Tile picking
# ===================================================================
def pick(grid, gc, gr, rng, excl=None, min_dist=3, reserved=None):
    tiles = [(c, r) for r in range(gr) for c in range(gc) if not grid[r][c]]
    if reserved:
        free = [t for t in tiles if t not in reserved]
        if free:
            tiles = free
    if excl and len(tiles) > 5:
        far = [t for t in tiles if min(abs(t[0]-e[0]) + abs(t[1]-e[1]) for e in excl) > min_dist]
        if far:
            tiles = far
    return rng.choice(tiles)

def pick_reachable_path(grid, gc, gr, rng, cur, reserved, min_leg_dist=6, tries=30):
    tiles = [(c, r) for r in range(gr) for c in range(gc)
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
    if len(active) < len(pokemon):
        return (10**8, len(pokemon) - len(active))
    collisions = 0
    closest = 10**9
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
                min_sep = (dpi + dpj) * 0.28
                if dist2 < min_sep * min_sep:
                    collisions += 1
                if dist2 < closest:
                    closest = dist2
        t += step
    return (collisions, int(closest))

def build_plan(grid, gc, gr, rng, n_legs, used_starts, reserved=None):
    if reserved is None:
        reserved = set()
    wps = []
    start = pick(grid, gc, gr, rng, used_starts if used_starts else None,
                 min_dist=5, reserved=reserved)
    cur = start
    path_tiles = {start}
    stop_tiles = {start}

    for leg in range(n_legs):
        path = pick_reachable_path(grid, gc, gr, rng, cur, reserved, min_leg_dist=5, tries=40)
        if not path:
            continue
        dest = path[-1]
        for i in range(len(path) - 1):
            fc, fr = path[i]
            tc, tr = path[i+1]
            x, y = tile_xy(tc, tr)
            d = tile_dir(fc, fr, tc, tr)
            wps.append({"x": x, "y": y, "dir": d, "dur": TILE_DUR})
            if i % 2 == 0:
                path_tiles.add((tc, tr))
        pause = rng.uniform(WANDER_PAUSE_MIN, WANDER_PAUSE_MAX)
        lx, ly = tile_xy(dest[0], dest[1])
        wps.append({"x": lx, "y": ly, "dir": "DOWN", "dur": pause, "idle": True})
        stop_tiles.add(dest)
        cur = dest

    path = bfs(grid, gc, gr, cur[0], cur[1], start[0], start[1], avoid=reserved)
    if path and len(path) > 1:
        for i in range(len(path) - 1):
            fc, fr = path[i]
            tc, tr = path[i+1]
            x, y = tile_xy(tc, tr)
            d = tile_dir(fc, fr, tc, tr)
            wps.append({"x": x, "y": y, "dir": d, "dur": TILE_DUR})
            if i % 2 == 0:
                path_tiles.add((tc, tr))

    reserved_tiles = set(path_tiles) | stop_tiles
    return wps, start, reserved_tiles

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
    out = ROOT_DIR / "readme" / "pokemon-roam.svg"
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

    # -- Load inner map data + extend with border --
    print("Loading map data...")
    inner_map = load_map_data(DATA_DIR / "map" / "MauvilleCity" / "map.bin", INNER_W, INNER_H)
    print(f"  Inner: {INNER_W}x{INNER_H} = {len(inner_map)} entries")

    border_data = (DATA_DIR / "map" / "MauvilleCity" / "border.bin").read_bytes()
    border_entries = list(struct.unpack_from("<4H", border_data))
    print(f"  Border pattern: {[hex(e) for e in border_entries]}")

    ext_map = []
    for dy in range(MAP_H):
        for dx in range(MAP_W):
            ix, iy = dx - PAD, dy - PAD
            if 0 <= ix < INNER_W and 0 <= iy < INNER_H:
                ext_map.append(inner_map[iy * INNER_W + ix])
            else:
                bx, by = dx % 2, dy % 2
                ext_map.append(border_entries[by * 2 + bx])
    print(f"  Extended: {MAP_W}x{MAP_H} = {len(ext_map)} entries")

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
    grid = build_collision_grid(ext_map, MAP_W, MAP_H)
    gc, gr = MAP_W, MAP_H
    # Force border cells impassable
    for r in range(gr):
        for c in range(gc):
            if c < PAD or c >= INNER_W + PAD or r < PAD or r >= INNER_H + PAD:
                grid[r][c] = True
    wk = sum(1 for r in range(gr) for c in range(gc) if not grid[r][c])
    print(f"  {gc}x{gr} tiles, {wk} walkable / {gc*gr} total")

    for r in range(gr):
        line = ""
        for c in range(gc):
            line += "#" if grid[r][c] else "."
        print(f"  {line}")

    # -- Load pokemon sprites --
    print("Loading sprites...")
    b64 = {}
    for name, path in SPRITES.items():
        d = Path(path).read_bytes()
        b64[name] = base64.b64encode(d).decode()
        w, h = png_dims(d)
        print(f"  {name}: {w}x{h}")

    pokemon = [
        dict(key="diancie",   label="Diancie",   sheet_w=256, frame_w=64,  dp=28, is_shiny=False, n_legs=3),
        dict(key="ceruledge", label="Ceruledge",  sheet_w=256, frame_w=64,  dp=28, is_shiny=True,  n_legs=4),
        dict(key="armarouge", label="Armarouge",  sheet_w=256, frame_w=64,  dp=28, is_shiny=True,  n_legs=3),
        dict(key="charcadet", label="Charcadet",  sheet_w=256, frame_w=64,  dp=22, is_shiny=True,  n_legs=4),
        dict(key="yveltal",   label="Yveltal",    sheet_w=512, frame_w=128, dp=48, is_shiny=True,  n_legs=3),
        dict(key="greninja",  label="Greninja",   sheet_w=256, frame_w=64,  dp=28, is_shiny=True,  n_legs=3),
        dict(key="dragonair", label="Dragonair",  sheet_w=256, frame_w=64,  dp=28, is_shiny=True,  n_legs=3),
        dict(key="dragonite", label="Dragonite",  sheet_w=256, frame_w=64,  dp=28, is_shiny=True,  n_legs=3),
        dict(key="eevee",     label="Eevee",      sheet_w=256, frame_w=64,  dp=22, is_shiny=True,  n_legs=4),
        dict(key="fuecoco",   label="Fuecoco",    sheet_w=256, frame_w=64,  dp=22, is_shiny=True,  n_legs=4),
        dict(key="latios",    label="Latios",     sheet_w=256, frame_w=64,  dp=28, is_shiny=True,  n_legs=3),
    ]

    # -- Plan pokemon routes --
    print("Planning routes...")
    best = None
    for attempt in range(80):
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
            wps, start, reserved = build_plan(grid, gc, gr, rng, pk["n_legs"],
                                              used_starts, all_reserved)
            n_steps = sum(1 for s in wps if not s.get("idle"))
            plans[pid] = wps
            step_counts[pid] = n_steps
            used_starts.append(start)
            all_reserved |= reserved
            total_steps += n_steps
            if n_steps > 0:
                nonzero_count += 1
            min_steps = n_steps if min_steps is None else min(min_steps, n_steps)

        phases = build_phase_offsets(plans)
        clash_count, closest2 = collision_score(pokemon, plans, phases)
        deficits = 0
        for pk, steps in zip(pokemon, step_counts):
            target = 16 if pk["key"] == "yveltal" else 20
            if steps < target:
                deficits += (target - steps)
        score = (deficits, clash_count, -(nonzero_count), -(min_steps or 0), -total_steps, -closest2)
        if best is None or score < best["score"]:
            best = {
                "score": score,
                "plans": plans,
                "phases": phases,
                "clashes": clash_count,
                "nonzero": nonzero_count,
                "deficits": deficits,
            }
        if deficits == 0 and clash_count == 0 and nonzero_count == len(pokemon):
            break

    plans = best["plans"]
    phases = best["phases"]
    for pk, wps in zip(pokemon, plans):
        walk_s = sum(s["dur"] for s in wps if not s.get("idle"))
        idle_s = sum(s["dur"] for s in wps if s.get("idle"))
        n_steps = sum(1 for s in wps if not s.get("idle"))
        print(f"  {pk['label']}: {n_steps} steps, walk={walk_s:.1f}s idle={idle_s:.1f}s")
    print(f"  Collision score: {best['clashes']} (active={best['nonzero']}/{len(pokemon)})")
    print(f"  Route deficits: {best['deficits']}")

    # -- Generate SVG --
    print("Generating SVG...")
    disp_w, disp_h = bg_w * SCALE, bg_h * SCALE

    clips = ""
    for i, pk in enumerate(pokemon):
        dp_val = pk["dp"]
        clips += f'    <clipPath id="pk{i}clip"><rect width="{dp_val}" height="{dp_val}"/></clipPath>\n'

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
  <!-- Top layer: tree canopies, building roofs -->
  <image href="data:image/png;base64,{fg_b64}"
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
  <!-- Pokemon sprites -->
{psvgs}
{fg_layer}
</svg>"""

    with open(out, "w", encoding="utf-8") as fh:
        fh.write(svg)
    print(f"\nDone: {os.path.getsize(out):,} bytes -> {out}")

if __name__ == "__main__":
    main()
