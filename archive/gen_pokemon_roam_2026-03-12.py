#!/usr/bin/env python3
"""
Generate readme/pokemon-roam.svg — faithful to theoffice movement model.

Movement model (from characters.ts + renderer.ts + constants.ts):
  TILE_SIZE             = 16 px
  WALK_SPEED_PX_PER_SEC = 48  →  3 tiles/sec  →  0.333s per tile step
  WALK_FRAME_DURATION   = 0.15s  (4 walk frames → full cycle = 0.6s)
  Direction is set PER TILE before interpolation (directionBetween())
  Position interpolated linearly from tile-center to tile-center
  IDLE: face DOWN, slow bob 0.45s per frame
  WANDER_PAUSE: 0.5–4.0 s between legs

Obstacle detection (OfficeCanvas.tsx + ORAS calibrated):
  - Dark outlines, tree canopy, water, red/orange rooftops
  - Blue-grey signs/mailboxes (R~131 G~131 B~139)
"""

import base64, struct, os, math, random, zlib
from collections import deque

# ═══════════════════════════════════════════════════════════════════════
# Asset paths
# ═══════════════════════════════════════════════════════════════════════
OFFICE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "theoffice"))
BG_PATH = os.path.join(OFFICE, "webview-ui", "public", "assets",
                       "themes", "pokemon", "tilesets", "leob-oras", "1 - Littleroot.png")
SPRITES = {
    "diancie":   os.path.join(OFFICE, "Pokemon",       "DIANCIE.png"),
    "ceruledge": os.path.join(OFFICE, "Pokemon Shiny", "CERULEDGE.png"),
    "armarouge": os.path.join(OFFICE, "Pokemon Shiny", "ARMAROUGE.png"),
    "charcadet": os.path.join(OFFICE, "Pokemon Shiny", "CHARCADET.png"),
    "yveltal":   os.path.join(OFFICE, "Pokemon Shiny", "YVELTAL.png"),
    "greninja":  os.path.join(OFFICE, "Pokemon Shiny", "GRENINJA.png"),
    "dragonair": os.path.join(OFFICE, "Pokemon Shiny", "DRAGONAIR.png"),
    "dragonite": os.path.join(OFFICE, "Pokemon Shiny", "DRAGONITE.png"),
    "eevee":     os.path.join(OFFICE, "Pokemon Shiny", "EEVEE.png"),
    "fuecoco":   os.path.join(OFFICE, "Pokemon Shiny", "FUECOCO.png"),
    "latios":    os.path.join(OFFICE, "Pokemon Shiny", "LATIOS.png"),
}

# ═══════════════════════════════════════════════════════════════════════
# theoffice constants (from constants.ts)
# ═══════════════════════════════════════════════════════════════════════
TILE                = 16     # px
WALK_PX_SEC         = 48     # pixels per second
TILE_DUR            = TILE / WALK_PX_SEC   # 0.333s per tile step
WALK_FRAME_DUR      = 0.15   # seconds per walk frame
WALK_FRAMES         = 4
WALK_CYCLE          = WALK_FRAME_DUR * WALK_FRAMES  # 0.6s
WANDER_PAUSE_MIN    = 0.5
WANDER_PAUSE_MAX    = 4.0

# Row from renderer.ts: DOWN=0 LEFT=1 RIGHT=2 UP=3
ROW = {"DOWN": 0, "LEFT": 1, "RIGHT": 2, "UP": 3}

# ═══════════════════════════════════════════════════════════════════════
# PNG decoding (stdlib only)
# ═══════════════════════════════════════════════════════════════════════
def png_dims(d):
    return struct.unpack(">II", d[16:24]) if d[:8] == b"\x89PNG\r\n\x1a\n" else (0, 0)

def png_pixels(data):
    w, h = struct.unpack(">II", data[16:24])
    ch = 4 if data[25] == 6 else 3
    assert data[24] == 8
    idat = bytearray(); i = 8
    while i < len(data):
        L = struct.unpack(">I", data[i:i+4])[0]; ct = data[i+4:i+8]
        if ct == b"IDAT": idat.extend(data[i+8:i+8+L])
        if ct == b"IEND": break
        i += 12 + L
    raw = zlib.decompress(bytes(idat)); stride = w * ch + 1; rows = []
    for y in range(h):
        f = raw[y*stride]; row = list(raw[y*stride+1:y*stride+1+w*ch])
        if f == 1:
            for c in range(ch, len(row)): row[c] = (row[c]+row[c-ch]) & 0xFF
        elif f == 2 and rows:
            p = rows[-1]
            for c in range(len(row)): row[c] = (row[c]+p[c]) & 0xFF
        elif f == 3:
            p = rows[-1] if rows else [0]*len(row)
            for c in range(len(row)):
                a = row[c-ch] if c >= ch else 0; row[c] = (row[c]+(a+p[c])//2) & 0xFF
        elif f == 4:
            p = rows[-1] if rows else [0]*len(row)
            for c in range(len(row)):
                a = row[c-ch] if c >= ch else 0; b2 = p[c]; cc = p[c-ch] if c >= ch else 0
                pa, pb, pc = abs(b2-cc), abs(a-cc), abs(a+b2-2*cc)
                pr = a if pa<=pb and pa<=pc else (b2 if pb<=pc else cc)
                row[c] = (row[c]+pr) & 0xFF
        rgba = []
        for x in range(w):
            b0 = x*ch; rgba += [row[b0], row[b0+1], row[b0+2], row[b0+3] if ch==4 else 255]
        rows.append(rgba)
    return w, h, rows

# ═══════════════════════════════════════════════════════════════════════
# Obstacle detection  (OfficeCanvas.tsx + ORAS calibration)
# ═══════════════════════════════════════════════════════════════════════
def is_obstacle(r, g, b, a=255):
    if a < 128: return False
    lum = 0.299*r + 0.587*g + 0.114*b
    if lum < 65:                                          return True   # dark outlines/shadows
    if g > 60 and r < g*0.35 and lum < 135:               return True   # tree canopy
    if b > r+30 and b > g+15 and lum < 165:               return True   # water
    if r > g*2.5 and r > b*2.5 and lum < 140:             return True   # bright red rooftop
    if r > g*1.35 and r > b*2.0 and lum > 60 and lum < 180: return True # ORAS warm-orange buildings
    # Blue-grey signs/mailboxes (sampled: R:131 G:131 B:139)
    if abs(r-g) < 15 and b > r and b > g and 120 < lum < 145 and b < 160: return True
    return False

def build_grid(w, h, rows):
    S = 4; gc = w // TILE; gr = h // TILE; thr = math.ceil(S*S*0.20)
    grid = []
    for tr in range(gr):
        row_g = []
        for tc in range(gc):
            wall = 0
            for sy in range(S):
                py = min(int(tr*TILE + sy*TILE/S), h-1)
                for sx in range(S):
                    px = min(int(tc*TILE + sx*TILE/S), w-1)
                    rv,gv,bv,av = rows[py][px*4], rows[py][px*4+1], rows[py][px*4+2], rows[py][px*4+3]
                    if is_obstacle(rv,gv,bv,av): wall += 1
            row_g.append(wall >= thr)
        grid.append(row_g)
    return grid, gc, gr

# ═══════════════════════════════════════════════════════════════════════
# BFS
# ═══════════════════════════════════════════════════════════════════════
DIRS4 = [(1,0),(-1,0),(0,1),(0,-1)]

def expand_tiles(tiles, radius, gc, gr):
    """Expand a set of tile positions by the given radius."""
    expanded = set()
    for c, r in tiles:
        for dc in range(-radius, radius + 1):
            for dr in range(-radius, radius + 1):
                nc, nr = c + dc, r + dr
                if 0 <= nc < gc and 0 <= nr < gr:
                    expanded.add((nc, nr))
    return expanded

def bfs(grid, gc, gr, sc, sr, ec, er, avoid=None):
    """BFS pathfinding. If avoid is given, treat those tiles as walls."""
    if grid[sr][sc] or grid[er][ec]: return None
    if avoid and (ec, er) in avoid: return None
    vis = [[False]*gc for _ in range(gr)]
    prev = [[None]*gc for _ in range(gr)]
    vis[sr][sc] = True; q = deque([(sc,sr)])
    while q:
        c,r = q.popleft()
        if c==ec and r==er:
            p = []; n = (ec,er)
            while n: p.append(n); n = prev[n[1]][n[0]]
            return list(reversed(p))
        for dc,dr in DIRS4:
            nc,nr = c+dc,r+dr
            if 0<=nc<gc and 0<=nr<gr and not grid[nr][nc] and not vis[nr][nc]:
                if avoid and (nc, nr) in avoid and not (nc == ec and nr == er):
                    continue
                vis[nr][nc]=True; prev[nr][nc]=(c,r); q.append((nc,nr))
    return None

# ═══════════════════════════════════════════════════════════════════════
# Direction (per tile, matching theoffice directionBetween)
# ═══════════════════════════════════════════════════════════════════════
def tile_dir(fc, fr, tc, tr):
    dc, dr = tc-fc, tr-fr
    if dc > 0: return "RIGHT"
    if dc < 0: return "LEFT"
    if dr > 0: return "DOWN"
    return "UP"

# ═══════════════════════════════════════════════════════════════════════
# Tile picking (free roam, well-separated starts)
# ═══════════════════════════════════════════════════════════════════════
def pick(grid, gc, gr, rng, excl=None, min_dist=3, reserved=None):
    tiles = [(c,r) for r in range(gr) for c in range(gc) if not grid[r][c]]
    if reserved:
        free = [t for t in tiles if t not in reserved]
        if free: tiles = free
    if excl and len(tiles) > 5:
        far = [t for t in tiles if min(abs(t[0]-e[0])+abs(t[1]-e[1]) for e in excl) > min_dist]
        if far: tiles = far
    return rng.choice(tiles)

def pick_reachable_path(grid, gc, gr, rng, cur, reserved, min_leg_dist=6, tries=30):
    """Pick a random reachable destination and return its BFS path."""
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

# ═══════════════════════════════════════════════════════════════════════
# Walk plan builder  — per-tile waypoints (faithful to theoffice)
#
# Each waypoint = one tile step:
#   { x, y, dir, dur=TILE_DUR }
# Legs are separated by pause waypoints:
#   { x, y, dir="DOWN", dur=pause_time, idle=True }
# ═══════════════════════════════════════════════════════════════════════
def tile_xy(c, r):
    return ((c + 0.5) * TILE, (r + 0.5) * TILE)

def plan_total_duration(wps):
    return sum(wp["dur"] for wp in wps) if wps else 0.0

def plan_position_at(wps, t):
    """Interpolate position at time t for a looping waypoint plan."""
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
    """Deterministic per-plan phase offsets to de-sync movement timelines."""
    phases = []
    for i, wps in enumerate(plans):
        total = plan_total_duration(wps)
        if total <= 0:
            phases.append(0.0)
            continue
        frac = ((i + 1) * 0.61803398875) % 1.0
        phases.append(frac * total)
    return phases

def collision_score(pokemon, plans, phases=None, horizon=120.0, step=0.25):
    """Sample animated positions and count close-encounter collisions."""
    if not plans:
        return (10**9, 10**9)

    active = [i for i, wps in enumerate(plans) if wps and plan_total_duration(wps) > 0]
    if len(active) < len(pokemon):
        # Heavily penalize plans with stationary Pokemon.
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
                # Keep separation by sprite footprint with small slack.
                min_sep = (dpi + dpj) * 0.28
                if dist2 < min_sep * min_sep:
                    collisions += 1
                if dist2 < closest:
                    closest = dist2
        t += step
    return (collisions, int(closest))

def build_plan(grid, gc, gr, rng, n_legs, used_starts, reserved=None):
    """Build a walk plan with collision avoidance.

    All walked tiles are reserved (expanded by 1 tile buffer) so later
    Pokemon route around them.  BFS avoids reserved tiles; falls back
    to unreserved BFS if stuck.
    """
    if reserved is None:
        reserved = set()
    wps = []
    start = pick(grid, gc, gr, rng, used_starts if used_starts else None,
                 min_dist=5, reserved=reserved)
    cur = start
    path_tiles = {start}   # every tile this Pokemon visits
    stop_tiles = {start}   # idle/destination tiles

    for leg in range(n_legs):
        path = pick_reachable_path(grid, gc, gr, rng, cur, reserved, min_leg_dist=5, tries=40)
        if not path:
            continue

        dest = path[-1]
        for i in range(len(path)-1):
            fc,fr = path[i]; tc,tr = path[i+1]
            x,y = tile_xy(tc, tr)
            d = tile_dir(fc, fr, tc, tr)
            wps.append({"x": x, "y": y, "dir": d, "dur": TILE_DUR})
            # Reserving every step is too restrictive with 11 Pokemon on this map.
            # Keep a sparse centerline reservation to avoid direct clashes while
            # preserving enough free space for random routes.
            if i % 2 == 0:
                path_tiles.add((tc, tr))
        # Pause between legs (idle, face down)
        pause = rng.uniform(WANDER_PAUSE_MIN, WANDER_PAUSE_MAX)
        lx, ly = tile_xy(dest[0], dest[1])
        wps.append({"x": lx, "y": ly, "dir": "DOWN", "dur": pause, "idle": True})
        stop_tiles.add(dest)
        cur = dest

    # Close loop back to start
    path = bfs(grid, gc, gr, cur[0], cur[1], start[0], start[1], avoid=reserved)
    if path and len(path) > 1:
        for i in range(len(path)-1):
            fc,fr = path[i]; tc,tr = path[i+1]
            x,y = tile_xy(tc, tr)
            d = tile_dir(fc, fr, tc, tr)
            wps.append({"x": x, "y": y, "dir": d, "dur": TILE_DUR})
            if i % 2 == 0:
                path_tiles.add((tc, tr))

    # Reserve centerline path tiles and exact idle stops.
    # With 11 Pokemon on this map, expanding stop buffers starves later routes.
    reserved_tiles = set(path_tiles)
    reserved_tiles |= stop_tiles
    return wps, start, reserved_tiles

# ═══════════════════════════════════════════════════════════════════════
# SVG generation
#
# Faithful to theoffice rendering:
#   - Position: linear interpolation per tile
#   - Direction row: discrete, set BEFORE each tile move
#   - Walk frame: 4 frames at WALK_FRAME_DUR=0.15s (cycle=0.6s)
#   - Idle: frame 0, no walk cycle
# ═══════════════════════════════════════════════════════════════════════
def F(v, d=2):
    return f"{v:.{d}f}".rstrip("0").rstrip(".")

def pokemon_svg(pk, pid, b64img, wps, phase=0.0):
    if not wps: return ""
    dp = pk["dp"]; scale = dp / pk["frame_w"]
    sdisp = int(pk["sheet_w"] * scale); hw = dp // 2
    shiny = pk["is_shiny"]

    # Build parallel timelines: position, direction-row
    # theoffice sets direction BEFORE the move, so direction changes at the START of each step
    pos_vals = []   # "x,y" at each keyTime
    dir_vals = []   # direction row index at each keyTime
    kt = [0.0]      # time accumulator
    t = 0.0

    # First position = last waypoint (loop closure)
    sx, sy = wps[-1]["x"], wps[-1]["y"]
    pos_vals.append(f"{F(sx)},{F(sy)}")
    # First direction = first waypoint's dir (set BEFORE moving)
    dir_vals.append(ROW[wps[0]["dir"]])

    for i, wp in enumerate(wps):
        t += wp["dur"]
        pos_vals.append(f"{F(wp['x'])},{F(wp['y'])}")
        # discrete: value[i] applies from kt[i] to kt[i+1], so at
        # the END of this segment we need the NEXT segment's direction
        nxt = wps[(i + 1) % len(wps)]
        dir_vals.append(ROW[nxt["dir"]])
        kt.append(t)

    total = kt[-1] or 10.0

    # Normalise keyTimes
    kt_str = "; ".join(F(v/total, 5) for v in kt)
    pos_str = "; ".join(pos_vals)
    dir_y_str = "; ".join(f"0,{-r*dp}" for r in dir_vals)

    # Walk-cycle frames (4 frames, 0.6s cycle — matching theoffice)
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

# ═══════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════
def main():
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "readme", "pokemon-roam.svg")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    rng = random.Random(42)

    print("Loading background...")
    with open(BG_PATH, "rb") as f: bg_data = f.read()
    bg_w, bg_h = png_dims(bg_data)
    bg_b64 = base64.b64encode(bg_data).decode()
    print(f"  {bg_w}x{bg_h}")

    print("Decoding pixels & building collision grid...")
    pw, ph, px_rows = png_pixels(bg_data)
    grid, gc, gr = build_grid(pw, ph, px_rows)
    wk = sum(1 for r in range(gr) for c in range(gc) if not grid[r][c])
    print(f"  {gc}x{gr} tiles, {wk} walkable")

    print("Loading sprites...")
    b64 = {}
    for name, path in SPRITES.items():
        with open(path, "rb") as f: d = f.read()
        b64[name] = base64.b64encode(d).decode()
        w, h = png_dims(d); print(f"  {name}: {w}x{h}")

    pokemon = [
        dict(key="diancie",   label="Diancie",   sheet_w=256, frame_w=64,  dp=56, is_shiny=False, n_legs=3),
        dict(key="ceruledge", label="Ceruledge", sheet_w=256, frame_w=64,  dp=56, is_shiny=True,  n_legs=4),
        dict(key="armarouge", label="Armarouge", sheet_w=256, frame_w=64,  dp=56, is_shiny=True,  n_legs=3),
        dict(key="charcadet", label="Charcadet", sheet_w=256, frame_w=64,  dp=44, is_shiny=True,  n_legs=4),
        dict(key="yveltal",   label="Yveltal",   sheet_w=512, frame_w=128, dp=128, is_shiny=True, n_legs=3),
        dict(key="greninja",  label="Greninja",  sheet_w=256, frame_w=64,  dp=56, is_shiny=True,  n_legs=3),
        dict(key="dragonair", label="Dragonair", sheet_w=256, frame_w=64,  dp=56, is_shiny=True,  n_legs=3),
        dict(key="dragonite", label="Dragonite", sheet_w=256, frame_w=64,  dp=56, is_shiny=True,  n_legs=3),
        dict(key="eevee",     label="Eevee",     sheet_w=256, frame_w=64,  dp=44, is_shiny=True,  n_legs=4),
        dict(key="fuecoco",   label="Fuecoco",   sheet_w=256, frame_w=64,  dp=44, is_shiny=True,  n_legs=4),
        dict(key="latios",    label="Latios",    sheet_w=256, frame_w=64,  dp=56, is_shiny=True,  n_legs=3),
    ]

    print("Planning routes...")
    best = None
    for attempt in range(80):
        plans = [None] * len(pokemon)
        step_counts = [0] * len(pokemon)
        used_starts = []
        all_reserved = set()   # tiles reserved by previously-planned Pokemon
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
        # Keep routes from looking stuck in corners.
        # Slightly lower target for giant Yveltal due higher footprint.
        deficits = 0
        for pk, steps in zip(pokemon, step_counts):
            target = 16 if pk["key"] == "yveltal" else 20
            if steps < target:
                deficits += (target - steps)
        # Lower is better for clashes; higher is better for path richness.
        score = (deficits, clash_count, -(nonzero_count), -(min_steps or 0), -total_steps, -closest2)
        if best is None or score < best["score"]:
            best = {
                "score": score,
                "plans": plans,
                "reserved": set(all_reserved),
                "clashes": clash_count,
                "nonzero": nonzero_count,
                "phases": phases,
                "deficits": deficits,
            }
        if deficits == 0 and clash_count == 0 and nonzero_count == len(pokemon):
            break

    plans = best["plans"]
    all_reserved = best["reserved"]
    phases = best["phases"]
    for pk, wps in zip(pokemon, plans):
        walk_s = sum(s["dur"] for s in wps if not s.get("idle"))
        idle_s = sum(s["dur"] for s in wps if s.get("idle"))
        n_steps = sum(1 for s in wps if not s.get("idle"))
        print(f"  {pk['label']}: {n_steps} steps, walk={walk_s:.1f}s idle={idle_s:.1f}s total={walk_s+idle_s:.1f}s")
    print(f"  Reserved {len(all_reserved)}/{wk} walkable tiles")
    print(f"  Collision score: {best['clashes']} (active={best['nonzero']}/{len(pokemon)})")
    print(f"  Route deficits: {best['deficits']}")

    clips = ""
    for i, pk in enumerate(pokemon):
        dp_val = pk["dp"]
        clips += f'    <clipPath id="pk{i}clip"><rect width="{dp_val}" height="{dp_val}"/></clipPath>\n'

    # Sort by t=0 Y so initial render depth matches the visible start frame.
    # (The animation starts at wps[-1], not an average route position.)
    indexed = list(range(len(pokemon)))
    def z_y(i):
        wps = plans[i]
        if not wps: return 0
        return wps[-1]["y"]
    indexed.sort(key=z_y)

    psvgs = "".join(
        pokemon_svg(pokemon[i], i, b64[pokemon[i]["key"]], plans[i], phases[i])
        for i in indexed)

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 {bg_w} {bg_h}" width="{bg_w}" height="{bg_h}">
  <defs>
    <filter id="shiny-glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="0.2 0 0 0 0.4  0 0.4 0 0 0.5  0 0 1.4 0 0.5  0 0 0 2 0" result="glow"/>
      <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
{clips}  </defs>
  <image href="data:image/png;base64,{bg_b64}"
         x="0" y="0" width="{bg_w}" height="{bg_h}" style="image-rendering:pixelated"/>
{psvgs}
</svg>"""

    with open(out, "w", encoding="utf-8") as fh:
        fh.write(svg)
    print(f"\nDone: {os.path.getsize(out):,} bytes -> {os.path.abspath(out)}")

if __name__ == "__main__":
    main()
