#!/usr/bin/env python3
"""
Generate readme/pokemon-roam.svg
Fixes:
  1. Smooth movement – merge same-direction tile steps, calcMode="linear"
  2. House collision  – new warm-orange/brown rule for ORAS rooftops (r/g > 1.35)
                       16px tiles, 20% obstacle threshold
  3. No inter-Pokemon collision – zone-based wandering, staggered begin offsets
"""

import base64, struct, os, math, random, zlib
from collections import deque

# ---------------------------------------------------------------------------
# Asset paths
# ---------------------------------------------------------------------------
OFFICE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "theoffice"))
BG_LOCAL    = os.path.join(OFFICE_ROOT, "webview-ui", "public", "assets",
                           "themes", "pokemon", "tilesets", "leob-oras", "1 - Littleroot.png")
SPRITE_LOCAL = {
    "diancie":   os.path.join(OFFICE_ROOT, "Pokemon",       "DIANCIE.png"),
    "ceruledge": os.path.join(OFFICE_ROOT, "Pokemon Shiny", "CERULEDGE.png"),
    "armarouge": os.path.join(OFFICE_ROOT, "Pokemon Shiny", "ARMAROUGE.png"),
    "charcadet": os.path.join(OFFICE_ROOT, "Pokemon Shiny", "CHARCADET.png"),
    "yveltal":   os.path.join(OFFICE_ROOT, "Pokemon Shiny", "YVELTAL.png"),
}

def fetch(path):
    with open(path, "rb") as f:
        return f.read()

def png_dims(d):
    if d[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", d[16:24])
    return 0, 0

def png_pixels(data):
    """Decode 8-bit RGB/RGBA PNG → rows of flat RGBA bytes (stdlib only)."""
    w, h      = struct.unpack(">II", data[16:24])
    color_type = data[25]
    assert data[24] == 8, "8-bit only"
    assert color_type in (2, 6)
    ch = 4 if color_type == 6 else 3
    idat = bytearray()
    i = 8
    while i < len(data):
        L  = struct.unpack(">I", data[i:i+4])[0]
        ct = data[i+4:i+8]
        if ct == b"IDAT": idat.extend(data[i+8:i+8+L])
        if ct == b"IEND": break
        i += 12 + L
    raw    = zlib.decompress(bytes(idat))
    stride = w * ch + 1
    rows   = []
    for y in range(h):
        filt = raw[y * stride]
        row  = list(raw[y * stride + 1: y * stride + 1 + w * ch])
        if filt == 1:
            for c in range(ch, len(row)): row[c] = (row[c] + row[c-ch]) & 0xFF
        elif filt == 2:
            if rows:
                p = rows[-1]
                for c in range(len(row)): row[c] = (row[c] + p[c]) & 0xFF
        elif filt == 3:
            p = rows[-1] if rows else [0]*len(row)
            for c in range(len(row)):
                a = row[c-ch] if c >= ch else 0
                row[c] = (row[c] + (a + p[c]) // 2) & 0xFF
        elif filt == 4:
            p = rows[-1] if rows else [0]*len(row)
            for c in range(len(row)):
                a  = row[c-ch] if c >= ch else 0
                b2 = p[c]; cc = p[c-ch] if c >= ch else 0
                pa, pb, pc = abs(b2-cc), abs(a-cc), abs(a+b2-2*cc)
                pr = a if pa <= pb and pa <= pc else (b2 if pb <= pc else cc)
                row[c] = (row[c] + pr) & 0xFF
        rgba = []
        for x in range(w):
            b0 = x * ch
            rgba += [row[b0], row[b0+1], row[b0+2], row[b0+3] if ch == 4 else 255]
        rows.append(rgba)
    return w, h, rows

# ---------------------------------------------------------------------------
# Obstacle detection  (OfficeCanvas.tsx logic + ORAS warm-orange building rule)
# Calibrated against sampled Littleroot pixels:
#   roof peaks:  R:136 G:80  B:8   lum:89   r/g:1.70  r/b:17
#                R:160 G:112 B:40  lum:118  r/g:1.43  r/b:4.0
#                R:184 G:136 B:64  lum:142  r/g:1.35  r/b:2.9
#                R:223 G:149 B:100 lum:166  r/g:1.50  r/b:2.2
# ---------------------------------------------------------------------------
def is_obstacle(r, g, b, a=255):
    if a < 128: return False
    lum = 0.299*r + 0.587*g + 0.114*b
    if lum < 65:                                                    return True  # dark outlines
    if g > 60 and r < g*0.35 and lum < 135:                        return True  # tree canopy
    if b > r+30 and b > g+15 and lum < 165:                        return True  # water
    if r > g*2.5  and r > b*2.5  and lum < 140:                    return True  # bright red roof
    if r > g*1.35 and r > b*2.0  and lum > 60 and lum < 180:       return True  # warm-orange ORAS buildings
    return False

def build_collision_grid(w, h, rows, tile_px=16):
    """4×4 super-sampling, 20% threshold → obstacle tile."""
    S   = 4
    gc  = w // tile_px
    gr  = h // tile_px
    thr = math.ceil(S * S * 0.20)          # >= 4 of 16 samples → wall
    grid = []
    for tr in range(gr):
        row_g = []
        for tc in range(gc):
            wall = 0
            for sy in range(S):
                py = min(int(tr * tile_px + sy * tile_px / S), h-1)
                for sx in range(S):
                    px = min(int(tc * tile_px + sx * tile_px / S), w-1)
                    rv,gv,bv,av = rows[py][px*4], rows[py][px*4+1], rows[py][px*4+2], rows[py][px*4+3]
                    if is_obstacle(rv, gv, bv, av): wall += 1
            row_g.append(wall >= thr)
        grid.append(row_g)
    return grid, gc, gr

# ---------------------------------------------------------------------------
# BFS pathfinding
# ---------------------------------------------------------------------------
def bfs(grid, gcols, grows, sc, sr, ec, er):
    if grid[sr][sc] or grid[er][ec]: return None
    vis  = [[False]*gcols for _ in range(grows)]
    prev = [[None ]*gcols for _ in range(grows)]
    vis[sr][sc] = True
    q = deque([(sc, sr)])
    for dc, dr in [(1,0),(-1,0),(0,1),(0,-1)]:
        pass  # pre-declare dirs below
    dirs4 = [(1,0),(-1,0),(0,1),(0,-1)]
    while q:
        c, r = q.popleft()
        if c == ec and r == er:
            path = []; node = (ec, er)
            while node:
                path.append(node); node = prev[node[1]][node[0]]
            return list(reversed(path))
        for dc, dr in dirs4:
            nc, nr = c+dc, r+dr
            if 0<=nc<gcols and 0<=nr<grows and not grid[nr][nc] and not vis[nr][nc]:
                vis[nr][nc]=True; prev[nr][nc]=(c,r); q.append((nc,nr))
    return None

# ---------------------------------------------------------------------------
# Direction helpers
# ---------------------------------------------------------------------------
def get_dir(fc, fr, tc, tr):
    dc, dr = tc-fc, tr-fr
    if abs(dc) >= abs(dr): return "RIGHT" if dc > 0 else "LEFT"
    return "DOWN" if dr > 0 else "UP"

# Row confirmed from theoffice renderer.ts: DOWN=0 LEFT=1 RIGHT=2 UP=3
ROW = {"DOWN": 0, "LEFT": 1, "RIGHT": 2, "UP": 3}

def merge_path(path):
    """Merge consecutive same-direction tile steps into (from, to, dir) runs."""
    if len(path) < 2: return []
    merged   = []
    seg_from = path[0]
    cur_dir  = get_dir(*path[0], *path[1])
    for i in range(1, len(path)):
        if i < len(path) - 1:
            nxt = get_dir(*path[i], *path[i+1])
            if nxt != cur_dir:
                merged.append((seg_from, path[i], cur_dir))
                seg_from = path[i]; cur_dir = nxt
        else:
            merged.append((seg_from, path[i], cur_dir))
    return merged

# ---------------------------------------------------------------------------
# Zone-based wandering  (prevents inter-Pokemon collision)
# Grid is  ~47 cols × 45 rows  for 759×726 @ 16px tiles
# ---------------------------------------------------------------------------
ZONES = [
    (0,  47,  0, 15),   # Diancie   – top strip
    (0,  23, 15, 30),   # Ceruledge – mid-left
    (24, 47, 15, 30),   # Armarouge – mid-right
    (0,  23, 30, 45),   # Charcadet – bot-left
    (24, 47, 30, 45),   # Yveltal   – bot-right
]

WALK_SPEED  = 2.5           # tiles / second
PAUSE_RANGE = (0.5, 1.5)

def pick_tile(grid, gcols, grows, rng, zone, excl=None):
    c0, c1, r0, r1 = zone
    tiles = [(c, r)
             for r in range(r0, min(r1, grows))
             for c in range(c0, min(c1, gcols))
             if not grid[r][c]]
    if len(tiles) < 3:           # zone empty → use full grid
        tiles = [(c,r) for r in range(grows) for c in range(gcols) if not grid[r][c]]
    if excl and len(tiles) > 5:
        far = [t for t in tiles if min(abs(t[0]-e[0])+abs(t[1]-e[1]) for e in excl) > 3]
        if far: tiles = far
    return rng.choice(tiles)

def build_plan(grid, gcols, grows, tile_px, rng, n_legs, zone):
    step_dur = 1.0 / WALK_SPEED

    def xy(c, r):
        return (c + 0.5) * tile_px, (r + 1.0) * tile_px

    wps   = []
    start = pick_tile(grid, gcols, grows, rng, zone)
    cur   = start

    for _ in range(n_legs):
        dest = pick_tile(grid, gcols, grows, rng, zone, [cur])
        path = bfs(grid, gcols, grows, cur[0], cur[1], dest[0], dest[1])
        if path and len(path) > 1:
            for sf, st, d in merge_path(path):
                n = abs(st[0]-sf[0]) + abs(st[1]-sf[1])
                x, y = xy(*st)
                wps.append({"x": x, "y": y, "dur": n * step_dur, "dir": d})
            wps[-1]["pause"] = rng.uniform(*PAUSE_RANGE)
            cur = dest
        else:
            cur = pick_tile(grid, gcols, grows, rng, zone)

    # close loop
    path = bfs(grid, gcols, grows, cur[0], cur[1], start[0], start[1])
    if path and len(path) > 1:
        for sf, st, d in merge_path(path):
            n = abs(st[0]-sf[0]) + abs(st[1]-sf[1])
            x, y = xy(*st)
            wps.append({"x": x, "y": y, "dur": n * step_dur, "dir": d})
    return wps

# ---------------------------------------------------------------------------
# SVG generation
# ---------------------------------------------------------------------------
def f(v, d=2):
    s = f"{v:.{d}f}"
    return s.rstrip("0").rstrip(".")

def pokemon_svg(pk, pid, b64img, wps, begin_s):
    if not wps: return ""
    dp    = pk["dp"]
    scale = dp / pk["frame_w"]
    sdisp = int(pk["sheet_w"] * scale)
    hw    = dp // 2
    shiny = pk["is_shiny"]

    # Timeline
    pos_v, row_v, kt = [], [], [0.0]
    t = 0.0
    pos_v.append(f'{f(wps[-1]["x"])},{f(wps[-1]["y"])}')
    row_v.append(ROW[wps[0]["dir"]])

    for seg in wps:
        t += seg["dur"]
        pos_v.append(f'{f(seg["x"])},{f(seg["y"])}')
        row_v.append(ROW[seg["dir"]])
        kt.append(t)
        if "pause" in seg:
            t += seg["pause"]
            pos_v.append(f'{f(seg["x"])},{f(seg["y"])}')
            row_v.append(0)          # face down while idle
            kt.append(t)

    dur   = kt[-1] or 10.0
    ktstr = "; ".join(f"{v/dur:.5f}" for v in kt)
    posstr = "; ".join(pos_v)
    rowstr = "; ".join(f"0,{-r*dp}" for r in row_v)
    n_gaps = len(pos_v) - 1
    frvals = "; ".join(f"{-i*dp},0" for i in range(4))
    bob    = f"{0.40 + pid*0.05:.2f}s"
    ba     = f' begin="{begin_s}s"'
    glow   = ' filter="url(#shiny-glow)"' if shiny else ""
    cid    = f"pk{pid}clip"

    sparkle = (f'\n    <animate attributeName="opacity"'
               f' values="0.88;1;0.88" dur="{2.0+pid*0.3:.1f}s" repeatCount="indefinite"/>') if shiny else ""

    return f"""
  <!-- {pk["label"]} zone={pid} begin={begin_s}s -->
  <g>{sparkle}
    <animateTransform attributeName="transform" type="translate"
      values="{posstr}" keyTimes="{ktstr}"
      dur="{f(dur)}s"{ba} repeatCount="indefinite" calcMode="linear"/>
    <animateTransform attributeName="transform" type="translate"
      values="0,0; 0,-2; 0,0" dur="{bob}" repeatCount="indefinite"
      additive="sum" calcMode="spline" keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"/>
    <g transform="translate(-{hw},-{dp})" clip-path="url(#{cid})"{glow}>
      <g>
        <animateTransform attributeName="transform" type="translate"
          values="{rowstr}" keyTimes="{ktstr}"
          dur="{f(dur)}s"{ba} repeatCount="indefinite" calcMode="discrete"/>
        <g>
          <animateTransform attributeName="transform" type="translate"
            values="{frvals}" keyTimes="0; 0.25; 0.5; 0.75"
            dur="0.45s" repeatCount="indefinite" calcMode="discrete"/>
          <image href="data:image/png;base64,{b64img}"
                 width="{sdisp}" height="{sdisp}" style="image-rendering:pixelated"/>
        </g>
      </g>
    </g>
  </g>"""

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "readme", "pokemon-roam.svg")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    rng = random.Random(42)

    print("Loading background...")
    bg_data    = fetch(BG_LOCAL)
    bg_w, bg_h = png_dims(bg_data)
    bg_b64     = base64.b64encode(bg_data).decode()
    print(f"  {bg_w}x{bg_h}")

    print("Decoding pixels...")
    pw, ph, px_rows = png_pixels(bg_data)

    TILE_PX = 16
    grid, gcols, grows = build_collision_grid(pw, ph, px_rows, TILE_PX)
    wk = [(c,r) for r in range(grows) for c in range(gcols) if not grid[r][c]]
    print(f"  {gcols}x{grows} grid, {len(wk)} walkable tiles")

    print("Loading sprites...")
    b64 = {}
    for name, path in SPRITE_LOCAL.items():
        data = fetch(path); b64[name] = base64.b64encode(data).decode()
        w, h = png_dims(data); print(f"  {name}: {w}x{h}")

    pokemon = [
        dict(key="diancie",   label="Diancie",   sheet_w=256, frame_w=64,  dp=56, is_shiny=False, n_legs=7),
        dict(key="ceruledge", label="Ceruledge", sheet_w=256, frame_w=64,  dp=56, is_shiny=True,  n_legs=6),
        dict(key="armarouge", label="Armarouge", sheet_w=256, frame_w=64,  dp=56, is_shiny=True,  n_legs=5),
        dict(key="charcadet", label="Charcadet", sheet_w=256, frame_w=64,  dp=44, is_shiny=True,  n_legs=7),
        dict(key="yveltal",   label="Yveltal",   sheet_w=512, frame_w=128, dp=80, is_shiny=True,  n_legs=4),
    ]

    print("Planning routes (zone-separated)...")
    plans = []
    for pid, pk in enumerate(pokemon):
        zone = ZONES[pid % len(ZONES)]
        wps  = build_plan(grid, gcols, grows, TILE_PX, rng, pk["n_legs"], zone)
        plans.append(wps)
        total = sum(s["dur"]+s.get("pause",0) for s in wps)
        print(f"  {pk['label']} zone{pid}: {len(wps)} segs, {total:.1f}s")

    clip_defs = "".join(
        f'    <clipPath id="pk{i}clip"><rect width="{pk["dp"]}" height="{pk["dp"]}"/></clipPath>\n'
        for i, pk in enumerate(pokemon))

    psvgs = "".join(
        pokemon_svg(pk, pid, b64[pk["key"]], wps, begin_s=0)
        for pid, (pk, wps) in enumerate(zip(pokemon, plans)))

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 {bg_w} {bg_h}" width="{bg_w}" height="{bg_h}">
  <defs>
    <filter id="shiny-glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="0.2 0 0 0 0.4  0 0.4 0 0 0.5  0 0 1.4 0 0.5  0 0 0 2 0"
        result="glow"/>
      <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
{clip_defs}  </defs>
  <image href="data:image/png;base64,{bg_b64}"
         x="0" y="0" width="{bg_w}" height="{bg_h}" style="image-rendering:pixelated"/>
{psvgs}
</svg>"""

    with open(out, "w", encoding="utf-8") as fh:
        fh.write(svg)
    print(f"\nDone: {os.path.getsize(out):,} bytes → {os.path.abspath(out)}")

if __name__ == "__main__":
    main()
