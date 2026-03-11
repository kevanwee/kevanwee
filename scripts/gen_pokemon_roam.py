#!/usr/bin/env python3
"""
Generate readme/pokemon-roam.svg
 - Littleroot Town background (from kevanwee/theoffice)
 - Pixel-colour collision detection (same isObstacle logic as OfficeCanvas.tsx)
 - Proper directional sprite rows  (RPG-Maker XP convention)
   Row 0 = Down, Row 1 = Left, Row 2 = Right, Row 3 = Up
 - Walk-cycle frame animation via SMIL clipPath trick
 - BFS pathfinding that stays on walkable tiles
"""

import urllib.request, base64, struct, os, math, json, random
from collections import deque

# == Local asset paths (from kevanwee/theoffice repo) ==
OFFICE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "theoffice"))
BG_LOCAL = os.path.join(OFFICE_ROOT, "webview-ui", "public", "assets",
                        "themes", "pokemon", "tilesets", "leob-oras",
                        "1 - Littleroot.png")
SPRITE_LOCAL = {
    "diancie":   os.path.join(OFFICE_ROOT, "Pokemon", "DIANCIE.png"),
    "ceruledge": os.path.join(OFFICE_ROOT, "Pokemon Shiny", "CERULEDGE.png"),
    "armarouge": os.path.join(OFFICE_ROOT, "Pokemon Shiny", "ARMAROUGE.png"),
    "charcadet": os.path.join(OFFICE_ROOT, "Pokemon Shiny", "CHARCADET.png"),
    "yveltal":   os.path.join(OFFICE_ROOT, "Pokemon Shiny", "YVELTAL.png"),
}

def fetch(path_or_url):
    if path_or_url.startswith("http"):
        req = urllib.request.Request(path_or_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.read()
    with open(path_or_url, "rb") as f:
        return f.read()

def png_dims(d):
    if d[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", d[16:24])
    return 0, 0

def png_pixels(data):
    """Decode PNG to list-of-rows of RGBA bytes using stdlib zlib only."""
    import zlib
    w, h = struct.unpack(">II", data[16:24])
    bit_depth  = data[24]
    color_type = data[25]   # 2=RGB, 6=RGBA
    assert bit_depth == 8,  "Only 8-bit PNGs supported"
    assert color_type in (2, 6), f"Color type {color_type} not supported"
    channels = 4 if color_type == 6 else 3
    idat = bytearray()
    i = 8
    while i < len(data):
        length = struct.unpack(">I", data[i:i+4])[0]
        ctype  = data[i+4:i+8]
        chunk  = data[i+8:i+8+length]
        if ctype == b"IDAT": idat.extend(chunk)
        if ctype == b"IEND": break
        i += 12 + length
    raw = zlib.decompress(bytes(idat))
    stride = w * channels + 1
    rows = []
    for row_i in range(h):
        filt  = raw[row_i * stride]
        row_b = list(raw[row_i * stride + 1: row_i * stride + 1 + w * channels])
        if filt == 0:
            pass
        elif filt == 1:
            for c in range(channels, len(row_b)):
                row_b[c] = (row_b[c] + row_b[c - channels]) & 0xFF
        elif filt == 2:
            if rows:
                prev = rows[-1]
                for c in range(len(row_b)):
                    row_b[c] = (row_b[c] + prev[c]) & 0xFF
        elif filt == 3:
            prev = rows[-1] if rows else [0] * len(row_b)
            for c in range(len(row_b)):
                a = row_b[c - channels] if c >= channels else 0
                row_b[c] = (row_b[c] + (a + prev[c]) // 2) & 0xFF
        elif filt == 4:
            prev = rows[-1] if rows else [0] * len(row_b)
            for c in range(len(row_b)):
                a = row_b[c - channels] if c >= channels else 0
                b2 = prev[c]
                cc = prev[c - channels] if c >= channels else 0
                pa, pb, pc = abs(b2 - cc), abs(a - cc), abs(a + b2 - 2*cc)
                pr = a if pa <= pb and pa <= pc else (b2 if pb <= pc else cc)
                row_b[c] = (row_b[c] + pr) & 0xFF
        rgba_row = []
        for px in range(w):
            base2 = px * channels
            r2 = row_b[base2]; g2 = row_b[base2+1]; b2 = row_b[base2+2]
            a2 = row_b[base2+3] if channels == 4 else 255
            rgba_row.extend([r2, g2, b2, a2])
        rows.append(rgba_row)
    return w, h, rows

# == theoffice isObstacle logic (OfficeCanvas.tsx) ==
def is_obstacle(r, g, b, a=255):
    if a < 128: return False
    lum = 0.299*r + 0.587*g + 0.114*b
    if lum < 65:                                    return True
    if g > 60 and r < g*0.35 and lum < 135:        return True
    if b > r+30 and b > g+15 and lum < 165:        return True
    if r > g*2.5 and r > b*2.5 and lum < 140:      return True
    return False

def build_collision_grid(w, h, rows, tile_px=16):
    samples   = 4
    cols      = w // tile_px
    rcount    = h // tile_px
    threshold = math.ceil(samples * samples * 0.30)
    grid = []
    for tr in range(rcount):
        row_g = []
        for tc in range(cols):
            wall = 0
            for sy in range(samples):
                py = min(int((tr * tile_px) + (sy * tile_px / samples)), h-1)
                for sx in range(samples):
                    px = min(int((tc * tile_px) + (sx * tile_px / samples)), w-1)
                    rv = rows[py][px*4]; gv = rows[py][px*4+1]
                    bv = rows[py][px*4+2]; av = rows[py][px*4+3]
                    if is_obstacle(rv, gv, bv, av): wall += 1
            row_g.append(wall >= threshold)
        grid.append(row_g)
    return grid, cols, rcount

# == BFS pathfinding ==
def bfs(grid, cols, rows, sc, sr, ec, er):
    if grid[sr][sc] or grid[er][ec]: return None
    vis  = [[False]*cols for _ in range(rows)]
    prev = [[None]*cols for _ in range(rows)]
    vis[sr][sc] = True
    q = deque([(sc, sr)])
    dirs4 = [(1,0),(-1,0),(0,1),(0,-1)]
    while q:
        c, r = q.popleft()
        if c == ec and r == er:
            path = []
            node = (ec, er)
            while node:
                path.append(node)
                node = prev[node[1]][node[0]]
            return list(reversed(path))
        for dc, dr in dirs4:
            nc, nr = c+dc, r+dr
            if 0 <= nc < cols and 0 <= nr < rows and not grid[nr][nc] and not vis[nr][nc]:
                vis[nr][nc] = True
                prev[nr][nc] = (c, r)
                q.append((nc, nr))
    return None

def random_walkable(grid, cols, rows, rng, excluded=None):
    walkable = [(c,r) for r in range(rows) for c in range(cols) if not grid[r][c]]
    if excluded and len(walkable) > 10:
        far = [t for t in walkable if min(abs(t[0]-e[0])+abs(t[1]-e[1]) for e in excluded) > 4]
        if far: walkable = far
    return rng.choice(walkable)

def get_direction(fc, fr, tc, tr):
    dc, dr = tc-fc, tr-fr
    if abs(dc) >= abs(dr):
        return "RIGHT" if dc > 0 else "LEFT"
    return "DOWN" if dr > 0 else "UP"

# Row 0=Down, Row 1=Left, Row 2=Right, Row 3=Up  (confirmed from theoffice renderer.ts)
ROW_IDX = {"DOWN": 0, "LEFT": 1, "RIGHT": 2, "UP": 3}

WALK_SPEED = 1.8   # tiles/second
PAUSE_RANGE = (0.8, 2.2)

def build_loop_plan(grid, g_cols, g_rows, tile_px, bg_x0, bg_y0, bg_scale, rng, n_legs):
    wps  = []
    start = random_walkable(grid, g_cols, g_rows, rng)
    cur   = start
    for _ in range(n_legs):
        dest = random_walkable(grid, g_cols, g_rows, rng, [cur])
        path = bfs(grid, g_cols, g_rows, cur[0], cur[1], dest[0], dest[1])
        if path and len(path) > 1:
            for i in range(len(path)-1):
                fc, fr = path[i]; tc, tr = path[i+1]
                x1 = bg_x0 + (tc + 0.5) * tile_px * bg_scale
                y1 = bg_y0 + (tr + 1.0) * tile_px * bg_scale
                dur = (tile_px * bg_scale) / (WALK_SPEED * tile_px * bg_scale)
                d   = get_direction(fc, fr, tc, tr)
                wps.append({"x": x1, "y": y1, "dur": dur, "dir": d, "walking": True})
            wps[-1]["pause"] = rng.uniform(*PAUSE_RANGE)
            cur = dest
        else:
            cur = random_walkable(grid, g_cols, g_rows, rng)
    # close loop
    path = bfs(grid, g_cols, g_rows, cur[0], cur[1], start[0], start[1])
    if path and len(path) > 1:
        for i in range(len(path)-1):
            fc, fr = path[i]; tc, tr = path[i+1]
            x1 = bg_x0 + (tc + 0.5) * tile_px * bg_scale
            y1 = bg_y0 + (tr + 1.0) * tile_px * bg_scale
            dur = (tile_px * bg_scale) / (WALK_SPEED * tile_px * bg_scale)
            d   = get_direction(fc, fr, tc, tr)
            wps.append({"x": x1, "y": y1, "dur": dur, "dir": d, "walking": True})
    return wps

# == SVG generation ==
def fmt(v, d=3):
    return f"{v:.{d}f}".rstrip("0").rstrip(".")

def ks(n):
    return "; ".join(["0.42 0 0.58 1"] * n)

def pokemon_svg(pk, pid, sprite_b64, wps):
    if not wps: return ""
    dp    = pk["dp"]
    sw    = pk["sheet_w"]
    fw    = pk["frame_w"]
    shiny = pk["is_shiny"]
    scale = dp / fw
    sdisp = int(sw * scale)
    hw    = dp // 2

    # Build position+direction timelines
    pos_vals = []
    row_vals = []
    kt_raw   = [0.0]
    t        = 0.0

    # start = last waypoint position (for loop closure)
    last_x, last_y = wps[-1]["x"], wps[-1]["y"]
    pos_vals.append(f"{fmt(last_x)},{fmt(last_y)}")
    row_vals.append(ROW_IDX[wps[0]["dir"]])

    for seg in wps:
        t += seg["dur"]
        pos_vals.append(f"{fmt(seg['x'])},{fmt(seg['y'])}")
        row_vals.append(ROW_IDX[seg["dir"]])
        kt_raw.append(t)
        if "pause" in seg:
            t += seg["pause"]
            pos_vals.append(f"{fmt(seg['x'])},{fmt(seg['y'])}")
            row_vals.append(ROW_IDX[seg["dir"]])
            kt_raw.append(t)

    dur_s   = kt_raw[-1]
    if dur_s < 1.0: dur_s = 10.0
    kt_norm = "; ".join(f"{fmt(v/dur_s,5)}" for v in kt_raw)
    pos_str = "; ".join(pos_vals)
    n_gaps  = len(pos_vals) - 1
    row_y_vals = "; ".join(f"0,{-r*dp}" for r in row_vals)

    # frame cycle (4 frames, 0.45s each cycle)
    frame_vals = "; ".join(f"{-i*dp},0" for i in range(4))
    frame_kts  = "0; 0.25; 0.5; 0.75"

    bob_dur    = f"{0.38 + pid*0.05:.2f}s"
    glow_attr  = ' filter="url(#shiny-glow)"' if shiny else ""
    clip_id    = f"pk{pid}clip"

    sparkle_el = ""
    if shiny:
        sparkle_el = f"""
    <animate attributeName="opacity"
      values="0.85;1;0.88;1;0.85"
      dur="{2.4+pid*0.25:.2f}s" repeatCount="indefinite"/>"""

    return f"""
  <!-- {pk['label']} -->
  <g>{sparkle_el}
    <animateTransform attributeName="transform" type="translate"
      values="{pos_str}"
      keyTimes="{kt_norm}"
      dur="{fmt(dur_s,2)}s" repeatCount="indefinite"
      calcMode="spline" keySplines="{ks(n_gaps)}"/>
    <animateTransform attributeName="transform" type="translate"
      values="0,0; 0,-3; 0,0"
      dur="{bob_dur}" repeatCount="indefinite"
      additive="sum" calcMode="spline"
      keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"/>
    <g transform="translate(-{hw},-{dp})" clip-path="url(#{clip_id})"{glow_attr}>
      <!-- Direction row (y) ← discrete, follows path keyTimes -->
      <g>
        <animateTransform attributeName="transform" type="translate"
          values="{row_y_vals}"
          keyTimes="{kt_norm}"
          dur="{fmt(dur_s,2)}s" repeatCount="indefinite"
          calcMode="discrete"/>
        <!-- Walk-cycle frame (x) ← fast independent cycle -->
        <g>
          <animateTransform attributeName="transform" type="translate"
            values="{frame_vals}"
            keyTimes="{frame_kts}"
            dur="0.45s" repeatCount="indefinite"
            calcMode="discrete"/>
          <image href="data:image/png;base64,{sprite_b64}"
                 width="{sdisp}" height="{sdisp}"
                 style="image-rendering:pixelated"/>
        </g>
      </g>
    </g>
  </g>"""


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    out_path   = os.path.join(script_dir, "..", "readme", "pokemon-roam.svg")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    rng = random.Random(7)

    # 1. Littleroot Town
    print("Loading Littleroot Town...")
    bg_data = fetch(BG_LOCAL)
    bg_w, bg_h = png_dims(bg_data)
    print(f"  {bg_w}x{bg_h}px")
    bg_b64 = base64.b64encode(bg_data).decode()

    # 2. Decode pixels for collision
    print("Decoding pixels...")
    pw, ph, px_rows = png_pixels(bg_data)

    # 3. Collision grid (tile=32px gives ~23x22 tiles for 759x726)
    TILE_PX = 32
    grid, g_cols, g_rows = build_collision_grid(pw, ph, px_rows, TILE_PX)
    walkable = [(c,r) for r in range(g_rows) for c in range(g_cols) if not grid[r][c]]
    print(f"  Grid: {g_cols}x{g_rows}, walkable={len(walkable)}")

    # 4. SVG dimensions (1x scale = native Littleroot size)
    BG_SCALE = 1.0
    SVG_BG_W = int(bg_w * BG_SCALE)
    SVG_BG_H = int(bg_h * BG_SCALE)
    SVG_W    = SVG_BG_W
    SVG_H    = SVG_BG_H
    bg_x0    = 0
    bg_y0    = 0

    # 5. Sprites
    print("Loading Pokemon sprites...")
    b64 = {}
    for name, path in SPRITE_LOCAL.items():
        data = fetch(path)
        b64[name] = base64.b64encode(data).decode()
        w, h = png_dims(data)
        print(f"  {name}: {w}x{h}")

    # 6. Pokemon defs
    pokemon = [
        dict(key="diancie",   label="Diancie",      sheet_w=256, frame_w=64,  dp=64, is_shiny=False, n_legs=7),
        dict(key="ceruledge", label="Ceruledge",     sheet_w=256, frame_w=64,  dp=64, is_shiny=True,  n_legs=6),
        dict(key="armarouge", label="Armarouge",     sheet_w=256, frame_w=64,  dp=64, is_shiny=True,  n_legs=5),
        dict(key="charcadet", label="Charcadet",     sheet_w=256, frame_w=64,  dp=48, is_shiny=True,  n_legs=8),
        dict(key="yveltal",   label="Yveltal",       sheet_w=512, frame_w=128, dp=96, is_shiny=True,  n_legs=4),
    ]

    # 7. Walk plans
    print("Planning routes via BFS...")
    plans = []
    for pk in pokemon:
        wps = build_loop_plan(grid, g_cols, g_rows, TILE_PX, bg_x0, bg_y0,
                               BG_SCALE, rng, pk["n_legs"])
        plans.append(wps)
        total = sum(s["dur"] + s.get("pause",0) for s in wps)
        print(f"  {pk['label']}: {len(wps)} segs, {total:.1f}s")

    # 8. clipPath defs
    clip_defs = ""
    for i, pk in enumerate(pokemon):
        dp_val = pk["dp"]
        clip_defs += f'    <clipPath id="pk{i}clip"><rect width="{dp_val}" height="{dp_val}"/></clipPath>\n'

    # 9. Pokemon SVG strings
    psvgs = "".join(pokemon_svg(pk, i, b64[pk["key"]], wps)
                    for i, (pk, wps) in enumerate(zip(pokemon, plans)))

    # 10. Final SVG
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 {SVG_W} {SVG_H}"
     width="{SVG_W}" height="{SVG_H}">
  <defs>
    <filter id="shiny-glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="0.2 0 0 0 0.4
                0 0.4 0 0 0.5
                0 0 1.4 0 0.5
                0 0 0 2 0" result="glow"/>
      <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
{clip_defs}  </defs>
  <image href="data:image/png;base64,{bg_b64}"
         x="0" y="0" width="{SVG_BG_W}" height="{SVG_BG_H}"
         style="image-rendering:pixelated"/>
{psvgs}
</svg>
"""

    with open(out_path, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"\nWritten {len(svg):,} bytes -> {os.path.abspath(out_path)}")
    print(f"Canvas: {SVG_W}x{SVG_H}px")


if __name__ == "__main__":
    main()
