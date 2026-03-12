#!/usr/bin/env python3
"""
show_nav_grid.py - render the walkable/blocked grid used by gen_pokemon_roam.py
as a PNG (standalone) and as an SVG overlay on top of walkable_map.png.

Outputs:
  debug_tiles/nav_grid.png - standalone colour-coded grid
  debug_tiles/nav_grid.svg - grid overlay on the actual rendered map

Colors:
  green       = walkable
  dark red    = collision-blocked (from map data)
  purple      = covered/layer_type>=1 blocked
  orange      = ROOFTOP_META_IDS blocked
"""

import struct, zlib, html
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT_DIR   = SCRIPT_DIR.parent
DATA_DIR   = ROOT_DIR / "data" / "pokeemerald"

MAUV_W, MAUV_H = 40, 20
RT117_W         = 60
RT118_W         = 80
SLICE_LR        = 20
MAP_W           = SLICE_LR + MAUV_W + SLICE_LR   # 80
MAP_H           = MAUV_H                           # 20
META            = 16

ROOFTOP_META_IDS = {304, 426, 427, 428, 256, 257, 258, 272, 273, 274}

# ── loaders ────────────────────────────────────────────────────────────────────
def load_map(p, w, h):
    d = p.read_bytes()
    return [struct.unpack_from('<H', d, i*2)[0] for i in range(w*h)]

def load_attr(p):
    d = p.read_bytes()
    return [struct.unpack_from('<H', d, i*2)[0] for i in range(len(d)//2)]

def load_meta_refs(p):
    d = p.read_bytes()
    n = len(d) // 16
    return [[struct.unpack_from('<H', d, i*16+j*2)[0] for j in range(8)] for i in range(n)]

# ── simple 8x8 pixel font (digits 0-9 only + colon) ───────────────────────────
FONT = {
    '0': ['11100','10100','10100','10100','11100'],
    '1': ['01100','00100','00100','00100','01110'],
    '2': ['11100','00100','01100','10000','11110'],
    '3': ['11110','00010','00110','00010','11110'],
    '4': ['10010','10010','11110','00010','00010'],
    '5': ['11110','10000','11110','00010','11110'],
    '6': ['11100','10000','11110','10010','11110'],
    '7': ['11110','00010','00100','01000','01000'],
    '8': ['11110','10010','11110','10010','11110'],
    '9': ['11110','10010','11110','00010','11110'],
    ':': ['00000','01100','00000','01100','00000'],
    'R': ['11110','10010','11110','10100','10010'],
    'C': ['01110','10000','10000','10000','01110'],
}

def draw_text(pixels, x, y, text, color, img_w):
    cx = x
    for ch in text:
        glyph = FONT.get(ch)
        if glyph is None:
            cx += 4
            continue
        for gy, row in enumerate(glyph):
            for gx, bit in enumerate(row):
                if bit == '1':
                    px, py = cx + gx, y + gy
                    if 0 <= px < img_w and 0 <= py < len(pixels):
                        off = px * 3
                        pixels[py][off:off+3] = color
        cx += len(glyph[0]) + 1

# ── PNG size reader ────────────────────────────────────────────────────────────
def read_png_size(path):
    """Return (width, height) from a PNG file header, or None if unreadable."""
    try:
        d = Path(path).read_bytes()
        if d[:8] != b'\x89PNG\r\n\x1a\n':
            return None
        w = struct.unpack_from('>I', d, 16)[0]
        h = struct.unpack_from('>I', d, 20)[0]
        return w, h
    except Exception:
        return None

# ── SVG overlay emitter ─────────────────────────────────────────────────────────
def emit_svg(reason, tile_px, out_path, bg_name):
    W = MAP_W * tile_px
    H = MAP_H * tile_px

    # semi-transparent fill colours (r,g,b,opacity)
    FILL = {
        1: ('160,50,50',   '0.50'),   # COLL
        2: ('110,60,160',  '0.50'),   # COVERED
        3: ('210,120,20',  '0.55'),   # ROOFTOP
    }
    LABEL_EVERY = 5   # label every Nth column

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
    ]

    # background map image (same folder as the SVG)
    if bg_name:
        lines.append(f'  <image href="{html.escape(bg_name)}" x="0" y="0" '
                     f'width="{W}" height="{H}" image-rendering="pixelated"/>')

    # blocked tile rects
    lines.append('  <g id="overlay">')
    for r in range(MAP_H):
        for c in range(MAP_W):
            rsn = reason[r][c]
            if rsn == 0:
                continue
            rgb, op = FILL[rsn]
            x, y = c * tile_px, r * tile_px
            lines.append(f'    <rect x="{x}" y="{y}" width="{tile_px}" height="{tile_px}" '
                         f'fill="rgb({rgb})" fill-opacity="{op}"/>')
    lines.append('  </g>')

    # grid lines (every tile)
    lines.append('  <g id="grid" stroke="rgba(0,0,0,0.25)" stroke-width="0.5">')
    for r in range(MAP_H + 1):
        y = r * tile_px
        lines.append(f'    <line x1="0" y1="{y}" x2="{W}" y2="{y}"/>')
    for c in range(MAP_W + 1):
        x = c * tile_px
        lines.append(f'    <line x1="{x}" y1="0" x2="{x}" y2="{H}"/>')
    lines.append('  </g>')

    # region divider lines (Route117 | Mauville | Route118)
    lines.append('  <g id="region-dividers" stroke="rgb(20,20,220)" stroke-width="2">')
    for col in [SLICE_LR, SLICE_LR + MAUV_W]:
        x = col * tile_px
        lines.append(f'    <line x1="{x}" y1="0" x2="{x}" y2="{H}"/>')
    lines.append('  </g>')

    # every-5-column marker lines
    lines.append('  <g id="col-markers" stroke="rgba(80,160,200,0.5)" stroke-width="1" stroke-dasharray="4 2">')
    for c in range(0, MAP_W, LABEL_EVERY):
        x = c * tile_px
        lines.append(f'    <line x1="{x}" y1="0" x2="{x}" y2="{H}"/>')
    lines.append('  </g>')

    # column labels (top edge)
    fs = max(9, tile_px // 3)
    lines.append(f'  <g id="col-labels" font-family="monospace" font-size="{fs}" '
                 f'fill="white" stroke="black" stroke-width="0.4" text-anchor="start">')
    for c in range(0, MAP_W, LABEL_EVERY):
        x = c * tile_px + 2
        lines.append(f'    <text x="{x}" y="{fs + 1}">C{c}</text>')
    lines.append('  </g>')

    # row labels (left edge)
    lines.append(f'  <g id="row-labels" font-family="monospace" font-size="{fs}" '
                 f'fill="white" stroke="black" stroke-width="0.4" text-anchor="start">')
    for r in range(MAP_H):
        y = r * tile_px + tile_px // 2 + fs // 2
        lines.append(f'    <text x="2" y="{y}">R{r}</text>')
    lines.append('  </g>')

    # legend (bottom-right corner)
    legend = [(1,'collision'), (2,'covered layer≥1'), (3,'ROOFTOP IDs')]
    lx0 = W - 160
    ly0 = H - (len(legend) * 18 + 6)
    lines.append(f'  <rect x="{lx0-4}" y="{ly0-4}" width="164" height="{len(legend)*18+12}" '
                 f'fill="rgba(0,0,0,0.55)" rx="3"/>')
    lines.append(f'  <g id="legend" font-family="monospace" font-size="11" fill="white">')
    for i, (rsn, label) in enumerate(legend):
        rgb, _ = FILL[rsn]
        ly = ly0 + i * 18
        lines.append(f'    <rect x="{lx0}" y="{ly}" width="12" height="12" fill="rgb({rgb})"/>')
        lines.append(f'    <text x="{lx0+16}" y="{ly+10}">{html.escape(label)}</text>')
    lines.append('  </g>')

    lines.append('</svg>')
    Path(out_path).write_text('\n'.join(lines), encoding='utf-8')

# ── PNG encoder ────────────────────────────────────────────────────────────────
def encode_png(w, h, pixels):
    raw = b''.join(b'\x00' + bytes(row) for row in pixels)
    comp = zlib.compress(raw, 9)
    def chunk(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t+d)&0xFFFFFFFF)
    return (b'\x89PNG\r\n\x1a\n'
            + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
            + chunk(b'IDAT', comp)
            + chunk(b'IEND', b''))

# ── walkable_edit.png round-trip ───────────────────────────────────────────────
EDIT_CELL = 32   # px per tile in walkable_edit.png — large enough to paint easily

# Pure solid colours used in walkable_edit.png.
# Green-dominant  → walkable override when read back.
# Red-dominant    → blocked override when read back.
# Blue-dominant   → COVERED (no re-classification; user needn't paint these).
EDIT_COLORS = {
    0: (100, 220, 100),   # WALK    – bright green
    1: (210,  55,  55),   # COLL    – bright red
    2: ( 90,  60, 200),   # COVERED – blue-purple  (B dominant → no override)
    3: (220, 130,  30),   # ROOFTOP – orange (R dominant → stays blocked)
}


def decode_png_rgb(path):
    """Decode a 24-bit RGB (or 32-bit RGBA) PNG. Returns list-of-rows of (r,g,b) tuples."""
    try:
        data = Path(path).read_bytes()
    except FileNotFoundError:
        return None
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        return None
    pos = 8
    width = height = 0
    color_type = channels = 0
    idat = []
    while pos + 12 <= len(data):
        length   = struct.unpack_from('>I', data, pos)[0]
        ctype    = data[pos+4:pos+8]
        cdata    = data[pos+8:pos+8+length]
        if ctype == b'IHDR':
            width, height = struct.unpack_from('>II', cdata)
            bit_depth     = cdata[8]
            color_type    = cdata[9]
            if bit_depth != 8 or color_type not in (2, 6):
                return None  # only 8-bit RGB or RGBA
            channels = 3 if color_type == 2 else 4
        elif ctype == b'IDAT':
            idat.append(cdata)
        elif ctype == b'IEND':
            break
        pos += 12 + length
    if not idat:
        return None
    raw    = bytearray(zlib.decompress(b''.join(idat)))
    stride = width * channels
    rows   = []
    prev   = bytearray(stride)
    idx    = 0
    for _ in range(height):
        ft  = raw[idx]; idx += 1
        sl  = bytearray(raw[idx:idx+stride]); idx += stride
        if ft == 1:
            for i in range(channels, stride):
                sl[i] = (sl[i] + sl[i-channels]) & 0xFF
        elif ft == 2:
            for i in range(stride):
                sl[i] = (sl[i] + prev[i]) & 0xFF
        elif ft == 3:
            for i in range(stride):
                a = sl[i-channels] if i >= channels else 0
                sl[i] = (sl[i] + (a + prev[i]) // 2) & 0xFF
        elif ft == 4:
            for i in range(stride):
                a = sl[i-channels] if i >= channels else 0
                b = prev[i]
                c = prev[i-channels] if i >= channels else 0
                pa, pb, pc = abs(b-c), abs(a-c), abs(a+b-2*c)
                pr = a if pa <= pb and pa <= pc else (b if pb <= pc else c)
                sl[i] = (sl[i] + pr) & 0xFF
        prev = sl
        rows.append([(sl[i*channels], sl[i*channels+1], sl[i*channels+2])
                     for i in range(width)])
    return rows


def classify_pixel(r, g, b):
    """Classify one pixel as a walkability override, or None for 'no override'."""
    if g > max(r, b) * 1.25 and g > 100:
        return 0   # green-dominant → walkable
    if r > max(g, b) * 1.25 and r > 100:
        return 1   # red-dominant   → blocked
    return None    # blue/purple/mixed → leave as computed


def read_overrides(path):
    """Sample the center pixel of each tile cell in walkable_edit.png.
    Returns {(tile_row, tile_col): reason} for every tile with a clear color."""
    rows = decode_png_rgb(path)
    if rows is None:
        return {}
    ph = len(rows)
    pw = len(rows[0]) if rows else 0
    overrides = {}
    for tr in range(MAP_H):
        for tc in range(MAP_W):
            cy = tr * EDIT_CELL + EDIT_CELL // 2
            cx = tc * EDIT_CELL + EDIT_CELL // 2
            if cy < ph and cx < pw:
                rsn = classify_pixel(*rows[cy][cx])
                if rsn is not None:
                    overrides[(tr, tc)] = rsn
    return overrides


def write_edit_png(reason_grid):
    """Render a flat EDIT_CELL-px-per-tile PNG suitable for manual editing.
    Returns PNG bytes."""
    w = MAP_W * EDIT_CELL
    h = MAP_H * EDIT_CELL
    rows = []
    for py in range(h):
        tr = py // EDIT_CELL
        row = bytearray()
        for px in range(w):
            row += bytes(EDIT_COLORS[reason_grid[tr][px // EDIT_CELL]])
        rows.append(row)
    return encode_png(w, h, rows)


# ── main ───────────────────────────────────────────────────────────────────────
def main():
    attr_pri = load_attr(DATA_DIR / 'primary'  / 'general'   / 'metatile_attributes.bin')
    attr_sec = load_attr(DATA_DIR / 'secondary' / 'mauville' / 'metatile_attributes.bin')

    mauv  = load_map(DATA_DIR / 'map' / 'MauvilleCity' / 'map.bin', MAUV_W, MAUV_H)
    rt117 = load_map(DATA_DIR / 'map' / 'Route117'     / 'map.bin', RT117_W, MAUV_H)
    rt118 = load_map(DATA_DIR / 'map' / 'Route118'     / 'map.bin', RT118_W, MAUV_H)

    # Stitch map (same logic as gen_pokemon_roam.py)
    ext_map = []
    for dy in range(MAP_H):
        for dx in range(MAP_W):
            if dx < SLICE_LR:
                ext_map.append(rt117[dy * RT117_W + (RT117_W - SLICE_LR + dx)])
            elif dx < SLICE_LR + MAUV_W:
                ext_map.append(mauv[dy * MAUV_W + (dx - SLICE_LR)])
            else:
                ext_map.append(rt118[dy * RT118_W + (dx - SLICE_LR - MAUV_W)])

    def get_attr(mid):
        if mid >= 512:
            sid = mid - 512
            return attr_sec[sid] if sid < len(attr_sec) else 0
        return attr_pri[mid] if mid < len(attr_pri) else 0

    # Build block reason grid
    WALK     = 0
    COLL     = 1   # collision bit set
    COVERED  = 2   # layer_type >= 1
    ROOFTOP  = 3   # ROOFTOP_META_IDS

    reason = [[WALK] * MAP_W for _ in range(MAP_H)]
    for r in range(MAP_H):
        for c in range(MAP_W):
            entry = ext_map[r * MAP_W + c]
            mid   = entry & 0x3FF
            coll  = (entry >> 10) & 3
            attr  = get_attr(mid)
            lt    = (attr >> 12) & 0x3
            if mid in ROOFTOP_META_IDS:
                reason[r][c] = ROOFTOP
            elif coll != 0:
                reason[r][c] = COLL
            elif lt >= 1:
                reason[r][c] = COVERED

    # ── apply paint overrides from walkable_edit.png ───────────────────────────
    edit_png = ROOT_DIR / 'debug_tiles' / 'walkable_edit.png'
    overrides = read_overrides(edit_png)
    n_forced_walk = n_forced_block = 0
    for (tr, tc), rsn in overrides.items():
        old = reason[tr][tc]
        reason[tr][tc] = rsn
        if rsn == WALK and old != WALK:   n_forced_walk  += 1
        elif rsn != WALK and old == WALK: n_forced_block += 1
    if overrides:
        print(f'walkable_edit.png: {len(overrides)} tiles read '
              f'(+{n_forced_walk} forced walkable, +{n_forced_block} forced blocked)')
    # Write the edit PNG if it doesn't exist yet (first-time initialisation).
    # If it already exists we leave it alone so user edits are preserved.
    if not edit_png.exists():
        edit_png.write_bytes(write_edit_png(reason))
        print('Created walkable_edit.png — paint tiles and re-run to apply changes.')
        print('  Green = walkable, Red = blocked. Delete the file to reset.')

    CELL  = 24    # pixels per tile cell
    LABEL = 28    # left margin for row labels
    TOP   = 28    # top margin for col labels

    img_w = LABEL + MAP_W * CELL + 1
    img_h = TOP   + MAP_H * CELL + 1
    pixels = [bytearray(b'\xff' * img_w * 3) for _ in range(img_h)]

    COLOR = {
        WALK:    (180, 230, 180),   # green
        COLL:    (160,  50,  50),   # dark red
        COVERED: (110,  60, 160),   # purple
        ROOFTOP: (210, 120,  20),   # orange
    }

    # Fill cells
    for r in range(MAP_H):
        for c in range(MAP_W):
            col = COLOR[reason[r][c]]
            px0 = LABEL + c * CELL
            py0 = TOP   + r * CELL
            for py in range(1, CELL):
                for px in range(1, CELL):
                    off = (px0 + px) * 3
                    pixels[py0 + py][off:off+3] = col

    # Gridlines
    GRID = (160, 160, 160)
    for r in range(MAP_H + 1):
        y = TOP + r * CELL
        for x in range(LABEL, img_w):
            pixels[y][x*3:x*3+3] = GRID
    for c in range(MAP_W + 1):
        x = LABEL + c * CELL
        for y in range(TOP, img_h):
            pixels[y][x*3:x*3+3] = GRID

    # Column labels (every 5)
    for c in range(0, MAP_W, 5):
        tx = LABEL + c * CELL + 1
        draw_text(pixels, tx, 2, 'C%d' % c, (60, 60, 60), img_w)
        # mark col separator line in cyan every 5
        x = LABEL + c * CELL
        for y in range(TOP, img_h):
            pixels[y][x*3:x*3+3] = (80, 160, 200)

    # Row labels
    for r in range(MAP_H):
        ty = TOP + r * CELL + (CELL - 5) // 2
        draw_text(pixels, 0, ty, 'R%d' % r, (60, 60, 60), img_w)

    # Map region dividers (Route117 | Mauville | Route118)
    DIV = (20, 20, 200)
    for x in [SLICE_LR, SLICE_LR + MAUV_W]:
        px = LABEL + x * CELL
        for y in range(0, img_h):
            pixels[y][px*3:px*3+3] = DIV

    # Legend
    legend = [(COLOR[WALK],'walkable'), (COLOR[COLL],'collision'),
              (COLOR[COVERED],'covered (layer>=1)'), (COLOR[ROOFTOP],'ROOFTOP_META_IDS')]
    lx, ly = LABEL, 8
    for col, label in legend:
        for dy in range(6):
            for dx in range(8):
                pixels[ly+dy][(lx+dx)*3:(lx+dx)*3+3] = col
        draw_text(pixels, lx + 10, ly + 1, label, (40,40,40), img_w)
        lx += 10 + len(label) * 5 + 14

    out = ROOT_DIR / 'debug_tiles' / 'nav_grid.png'
    out.parent.mkdir(exist_ok=True)
    out.write_bytes(encode_png(img_w, img_h, pixels))
    print('Saved:', out)

    # ── SVG overlay ────────────────────────────────────────────────────────────
    bg_png = ROOT_DIR / 'debug_tiles' / 'walkable_map.png'
    svg_out = ROOT_DIR / 'debug_tiles' / 'nav_grid.svg'
    SVG_TILE = 32      # px per tile in the SVG — fixed, background PNG is stretched to fit
    if bg_png.exists():
        emit_svg(reason, SVG_TILE, svg_out, 'walkable_map.png')
        print('Saved SVG overlay:', svg_out, f'(tile_px={SVG_TILE}, map {MAP_W*SVG_TILE}x{MAP_H*SVG_TILE}px)')
    else:
        emit_svg(reason, SVG_TILE, svg_out, '')
        print('Saved SVG (no background):', svg_out)

    print('Map is %d x %d tiles.' % (MAP_W, MAP_H))
    print('Stitching: cols 0-%d = Route117, cols %d-%d = Mauville, cols %d-%d = Route118' % (
        SLICE_LR-1, SLICE_LR, SLICE_LR+MAUV_W-1, SLICE_LR+MAUV_W, MAP_W-1))
    print('ROOFTOP_META_IDS:', sorted(ROOFTOP_META_IDS))
    walkable = sum(1 for r in range(MAP_H) for c in range(MAP_W) if reason[r][c] == WALK)
    print('Walkable tiles: %d / %d' % (walkable, MAP_W * MAP_H))
    if overrides:
        print('(overrides active — delete debug_tiles/walkable_edit.png to reset to computed state)')

if __name__ == '__main__':
    main()
