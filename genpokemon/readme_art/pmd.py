"""PMD sprite sheets → self-contained animated SVG pieces (CSS inside the SVG, no scripts).

GitHub shows README SVGs as images, so everything is embedded: each sheet is cropped to the
rows actually used and inlined once per SVG as a <defs> image, then referenced with <use>.
Frame cycling uses step-end keyframes at each frame's cumulative PMD duration (1 tick = 1/60 s).
"""
import base64, html, io, json, os
from pathlib import Path
from PIL import Image

# Voracity's sprites: a checkout via VORACITY_SRC (full rebuild), or the bundled subset (daily regrow)
HERE = Path(__file__).parent
SRC = Path(os.environ.get("VORACITY_SRC", HERE / "assets/voracity"))
PUBLIC = SRC / "public"
META = json.loads((SRC / "src/pokemon/overworld-sprites.json").read_text(encoding="utf-8"))
TICK = 1 / 60

# Sheets not in overworld-sprites.json: (src, frame w, frame h, durations)
EXTRA = {
    ("ceruledge", "Idle"): ("ceruledge/Idle-Anim.png", 32, 56, [5,5,5,5,5,5,5,5,5,5,2,3,4,3,2]),
    ("ceruledge", "Walk"): ("ceruledge/Walk-Anim.png", 32, 56, [10,10,10,10]),
    ("greninja", "Idle"): ("greninja/Idle-Anim.png", 32, 56, [40,12,2,3,6,2,4]),
    ("greninja", "Walk"): ("greninja/Walk-Anim.png", 32, 48, [8,10,8,10]),
    ("darkrai", "Idle"): ("fusion/partners/darkrai/Idle-Anim.png", 40, 80, [8] * 7),
    ("zygarde", "Idle"): ("fusion/partners/zygarde/Idle-Anim.png", 88, 112, [8] * 8),
    ("ceruledge-darkrai", "Idle"): ("fusion/ceruledge-darkrai/Idle-Anim.png", 48, 64, [5,5,5,5,5,5,5,5,5,5,2,3,4,3,2]),
    ("ceruledge-zygarde", "Idle"): ("fusion/ceruledge-zygarde/Idle-Anim.png", 44, 56, [5,5,5,5,5,5,5,5,5,5,2,3,4,3,2]),
    ("ceruledge-armarouge", "Idle"): ("fusion/ceruledge-armarouge/Idle-Anim.png", 32, 56, [5,5,5,5,5,5,5,5,5,5,2,3,4,3,2]),
    ("diancie", "Idle"): ("diancie-tab/Idle-Anim.png", 24, 56, [12, 12, 12, 12, 8, 8, 8, 8]),
    ("mega-diancie", "Idle"): ("diancie/Idle-Anim.png", 64, 88, [16, 12, 16, 12]),
    ("mega-diancie", "Walk"): ("diancie/Walk-Anim.png", 56, 88, [4] * 9),
    ("jirachi", "Idle"): ("jirachi/Idle-Anim.png", 40, 48, [12, 8, 12, 8]),
    ("ironvaliant", "Twirl"): ("ironvaliant/Twirl-Anim.png", 88, 80, [2,2,2,2,2,2,2,2,2,3,3,3,2,2,2,2]),
    ("ironvaliant", "SpAttack"): ("ironvaliant/SpAttack-Anim.png", 56, 80, [2,6,2,2,2,2,2,2]),
    ("ceruledge-armarouge", "Combo"): ("fusion/ceruledge-armarouge/Combo-Anim.png", 80, 96, None),
}
# The owner's picks from SpriteCollab (fetch_sprites.py), with absolute paths
PICKS = json.loads((HERE / "sprites/extra.json").read_text(encoding="utf-8"))
_combo = SRC / "src/pokemon/fusion-armarouge-combo.json"
COMBO = json.loads(_combo.read_text(encoding="utf-8")) if _combo.exists() else {"durations": []}


def species_scale(species):
    return META.get(species, {}).get("scale", 1.0)


class Sheet:
    def __init__(self, species, anim):
        if species in PICKS and anim in PICKS[species]:
            a = PICKS[species][anim]
            src, w, h, durations = str(HERE / a["src"]), a["w"], a["h"], a["durations"]
        elif (species, anim) in EXTRA:
            src, w, h, durations = EXTRA[(species, anim)]
            durations = durations or COMBO["durations"]
        else:
            a = META[species]["animations"][anim]
            src, w, h, durations = a["src"].lstrip("/"), a["w"], a["h"], a["durations"]
        self.image = Image.open(PUBLIC / src).convert("RGBA")
        self.w, self.h, self.durations = w, h, durations
        self.cols, self.rows = self.image.width // w, self.image.height // h
        self.key = f"{species}-{anim}".replace("/", "-")

    def row(self, r):
        return min(r, self.rows - 1)

    def bounds(self, r):
        """Union of the visible pixels across the row's frames, in frame coordinates."""
        r = self.row(r)
        strip = self.image.crop((0, r * self.h, self.cols * self.w, (r + 1) * self.h))
        boxes = []
        for c in range(len(self.durations)):
            b = strip.crop((c * self.w, 0, (c + 1) * self.w, self.h)).getbbox()
            if b: boxes.append(b)
        if not boxes: return (0, 0, self.w, self.h)
        return (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))

    def strip_png(self, r):
        r = self.row(r)
        strip = self.image.crop((0, r * self.h, len(self.durations) * self.w, (r + 1) * self.h))
        out = io.BytesIO(); strip.save(out, "PNG", optimize=True)
        return "data:image/png;base64," + base64.b64encode(out.getvalue()).decode()


class Scene:
    """Collects defs, CSS and elements for one SVG."""
    def __init__(self, width, height):
        self.w, self.h = width, height
        self.defs, self.css, self.body, self.images, self.n = [], [], [], {}, 0

    def uid(self, prefix="a"):
        self.n += 1
        return f"{prefix}{self.n}"

    def strip(self, sheet, r):
        key = (sheet.key, sheet.row(r))
        if key not in self.images:
            iid = f"im{len(self.images)}"
            self.defs.append(f'<image id="{iid}" href="{sheet.strip_png(r)}" width="{len(sheet.durations) * sheet.w}" height="{sheet.h}"/>')
            self.images[key] = iid
        return self.images[key]

    def frames_class(self, sheet, speed=1.0):
        name = self.uid("f")
        total = sum(sheet.durations)
        stops, acc = [], 0
        for i, d in enumerate(sheet.durations):
            stops.append(f"{acc / total * 100:.3f}%{{transform:translateX(-{i * sheet.w}px)}}"); acc += d
        self.css.append(f".{name}{{animation:{name} {total * TICK / speed:.3f}s step-end infinite}}"
                        f"@keyframes {name}{{{''.join(stops)}100%{{transform:translateX(-{(len(sheet.durations) - 1) * sheet.w}px)}}}}")
        return name

    def sprite(self, sheet, r, feet_x, feet_y, scale=1.0, speed=1.0, extra_class="", filt=None, frames=None):
        """A sprite cycling its frames, feet (bottom-centre of visible pixels) at (feet_x, feet_y).
        Returns the element markup; the caller wraps it in animated groups as needed."""
        l, t, rr, b = sheet.bounds(r)
        iid = self.strip(sheet, r)
        fc = frames or self.frames_class(sheet, speed)
        tx, ty = feet_x - (l + rr) / 2 * scale, feet_y - b * scale
        f = f' filter="url(#{filt})"' if filt else ""
        return (f'<g class="{extra_class}" transform="translate({tx:.1f},{ty:.1f}) scale({scale:g})"{f}>'
                f'<svg width="{sheet.w}" height="{sheet.h}" overflow="hidden"><g class="{fc}"><use href="#{iid}"/></g></svg></g>')

    def keyframes(self, name, period, stops, timing="linear", delay=0.0, iteration="infinite"):
        self.css.append(f".{name}{{animation:{name} {period}s {timing} {delay}s {iteration} both}}"
                        f"@keyframes {name}{{{''.join(f'{k}{{{v}}}' for k, v in stops)}}}")
        return name

    def silhouette_filter(self, colour="#ffffff", glow=None):
        fid = self.uid("sil")
        glow_part = (f'<feGaussianBlur in="w" stdDeviation="2.2" result="b"/><feFlood flood-color="{glow}"/>'
                     f'<feComposite in2="b" operator="in" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="g"/><feMergeNode in="w"/></feMerge>') if glow else ""
        r, g, b = (int(colour[i:i + 2], 16) / 255 for i in (1, 3, 5))
        self.defs.append(f'<filter id="{fid}" x="-50%" y="-50%" width="200%" height="200%">'
                         f'<feColorMatrix type="matrix" values="0 0 0 0 {r:.3f} 0 0 0 0 {g:.3f} 0 0 0 0 {b:.3f} 0 0 0 1 0" result="w"/>{glow_part}</filter>')
        return fid

    def walker(self, species, x0, x1, y, period, delay=0.0, scale=None, speed=1.0, bob=False):
        """Walks right from x0 to x1, turns, walks back (rows 2 and 6). Feet on y."""
        sheet = Sheet(species, "Walk")
        s = scale if scale is not None else 1.0
        move = self.keyframes(self.uid("m"), period, [("0%", "transform:translateX(0)"), ("50%", f"transform:translateX({x1 - x0:.1f}px)"), ("100%", "transform:translateX(0)")], delay=delay)
        first, back = (2, 6) if x1 >= x0 else (6, 2)
        right = self.sprite(sheet, first, x0, y, s, speed)
        left = self.sprite(sheet, back, x0, y, s, speed)
        show_r = self.keyframes(self.uid("v"), period, [("0%", "opacity:1"), ("50%", "opacity:0"), ("100%", "opacity:1")], "step-end", delay)
        show_l = self.keyframes(self.uid("v"), period, [("0%", "opacity:0"), ("50%", "opacity:1"), ("100%", "opacity:0")], "step-end", delay)
        flyer = ""
        if bob:
            flyer = self.keyframes(self.uid("b"), 1.6, [("0%,100%", "transform:translateY(0)"), ("50%", "transform:translateY(-4px)")], "ease-in-out")
        return f'<g class="{move}"><g class="{flyer}"><g class="{show_r}">{right}</g><g class="{show_l}">{left}</g></g></g>'

    def svg(self, label, extra_css=""):
        reduce = "@media (prefers-reduced-motion:reduce){*{animation:none!important}}"
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" width="{self.w}" height="{self.h}" role="img" aria-label="{html.escape(label)}">'
                f'<style>text{{font-family:-apple-system,"Segoe UI",Helvetica,Arial,sans-serif}}.serif{{font-family:Georgia,"Times New Roman",serif}}image{{image-rendering:pixelated}}{"".join(self.css)}{extra_css}{reduce}</style>'
                f'<defs>{"".join(self.defs)}</defs>{"".join(self.body)}</svg>')


THEMES = {
    "light": dict(panel="#fcfcf7", border="#e2e5d9", ink="#3f4a39", muted="#7d8771", faint="#a0a591", accent="#3a6b59",
                  path="#d9dece", soft="#edf1e5", cells=["#ebeee4", "#cfe0c3", "#9fc9ad", "#5f9a7c", "#3a6b59"]),
    "dark": dict(panel="#232323", border="#3a3a3a", ink="#e6e6e6", muted="#b8b8b8", faint="#8f8f8f", accent="#9fc9ad",
                 path="#3a3a3a", soft="#2e3a33", cells=["#323232", "#2e4a3d", "#3d6e57", "#63a184", "#9fc9ad"]),
}


ROW_FOR_OCTANT = {0: 2, 1: 1, 2: 0, 3: 7, 4: 6, 5: 5, 6: 4, 7: 3}  # PMD rows: 0 down, 2 right, 4 up, 6 left


def facing(dx, dy):
    import math
    return ROW_FOR_OCTANT[round(math.degrees(math.atan2(dy, dx)) / 45) % 8]


def roamer(sc, species, points, speed=14.0, pauses=None, delay=0.0, scale=1.0):
    """Walks a closed loop of waypoints in eight directions, idling (facing its last direction) at
    each one. Returns markup; positions are in the scene's coordinates (feet)."""
    import math
    walk, idle = Sheet(species, "Walk"), Sheet(species, "Idle")
    n = len(points)
    pauses = pauses or [2.0] * n
    # Timeline: idle at point i for pauses[i], then walk to point i+1
    events, t = [], 0.0
    for i in range(n):
        a, b = points[i], points[(i + 1) % n]
        dist = math.hypot(b[0] - a[0], b[1] - a[1])
        row = facing(b[0] - a[0], b[1] - a[1])
        events.append(("idle", i, t, t + pauses[i], prev_row if i else None)); t += pauses[i]
        events.append(("walk", i, t, t + dist / speed, row)); t += dist / speed
        prev_row = row
    period = t
    first_row = events[-1][4]
    events[0] = ("idle", 0, events[0][2], events[0][3], first_row)
    x0, y0 = points[0]
    move = []
    for kind, i, start, end, row in events:
        a = points[i] if kind == "idle" else points[i]
        b = points[i] if kind == "idle" else points[(i + 1) % n]
        move.append((start / period * 100, f"transform:translate({a[0] - x0:.1f}px,{a[1] - y0:.1f}px)"))
        move.append((end / period * 100, f"transform:translate({b[0] - x0:.1f}px,{b[1] - y0:.1f}px)"))
    mv = sc.keyframes(sc.uid("rm"), round(period, 2), [(f"{p:.3f}%", v) for p, v in move], "linear", delay)
    # One element per (animation, row); each is visible only during its own spans
    spans = {}
    for kind, i, start, end, row in events:
        spans.setdefault((kind, row), []).append((start / period * 100, end / period * 100))
    layers = []
    wf, idf = sc.frames_class(walk), sc.frames_class(idle)
    for (kind, row), ranges in spans.items():
        stops = [("0%", "opacity:0")]
        for s, e in ranges:
            stops += [(f"{s:.3f}%", "opacity:1"), (f"{e:.3f}%", "opacity:0")]
        stops.append(("100%", "opacity:" + ("1" if ranges[-1][1] >= 99.999 else "0")))
        vis = sc.keyframes(sc.uid("rv"), round(period, 2), stops, "step-end", delay)
        sheet, fc = (walk, wf) if kind == "walk" else (idle, idf)
        layers.append(f'<g class="{vis}">{sc.sprite(sheet, row, x0, y0, scale, frames=fc)}</g>')
    return f'<g class="{mv}">{"".join(layers)}</g>'


SILVALLY_COLOURS = {"bug": "#94aa35", "dark": "#6c5871", "dragon": "#7860bc", "electric": "#dcb83e", "fairy": "#d08aaf", "fighting": "#ba7551",
                    "fire": "#d78848", "flying": "#91aad0", "ghost": "#8c73b2", "grass": "#78a65b", "ground": "#ba9b62", "ice": "#91c9d1",
                    "poison": "#ab78b3", "psychic": "#d57c99", "rock": "#a79664", "steel": "#98a7b1", "water": "#6b9dc6"}


def silvally(sc, forms, x0, x1, y, speed=32.0, scale=1.0, delay=0.0):
    """Walks the edge; at each end it rears up (or does its Double pose) and changes type, its
    new colour flashing behind it, as in Voracity. One leg per form, alternating direction,
    so an even number of forms closes the loop."""
    import math
    legs, t, events = len(forms), 0.0, []
    walk_time = abs(x1 - x0) / speed
    for i, form in enumerate(forms):
        right = i % 2 == 0
        events.append(("walk", form, 2 if right else 6, t, t + walk_time, (x0, x1) if right else (x1, x0))); t += walk_time
        anim = "RearUp" if i % 2 == 0 else "Double"
        sheet = Sheet(f"silvally-{form}", anim)
        dur = sum(sheet.durations) * TICK * 1.6
        end_x = x1 if right else x0
        nxt = forms[(i + 1) % legs]
        events.append(("change", (form, nxt, anim), 2 if right else 6, t, t + dur, (end_x, end_x))); t += dur
    period = round(t, 2)
    move = []
    for kind, _, _, start, end, (a, b) in events:
        move += [(start / t * 100, f"transform:translateX({a - x0:.1f}px)"), (end / t * 100, f"transform:translateX({b - x0:.1f}px)")]
    mv = sc.keyframes(sc.uid("sv"), period, [(f"{p:.3f}%", v) for p, v in move], "linear", delay)
    layers = []

    def window(start, end):
        return sc.keyframes(sc.uid("sw"), period, [("0%", "opacity:0"), (f"{start / t * 100:.3f}%", "opacity:1"), (f"{end / t * 100:.3f}%", "opacity:0"), ("100%", "opacity:0")], "step-end", delay)

    for kind, what, row, start, end, _ in events:
        if kind == "walk":
            layers.append(f'<g class="{window(start, end)}">{sc.sprite(Sheet(f"silvally-{what}", "Walk"), row, x0, y, scale)}</g>')
        else:
            old, new, anim = what
            mid = (start + end) / 2
            layers.append(f'<g class="{window(start, mid)}">{sc.sprite(Sheet(f"silvally-{old}", anim), row, x0, y, scale)}</g>')
            layers.append(f'<g class="{window(mid, end)}">{sc.sprite(Sheet(f"silvally-{new}", anim), row, x0, y, scale)}</g>')
            colour = SILVALLY_COLOURS[new]
            flash = sc.keyframes(sc.uid("sf"), period, [("0%", "opacity:0;transform:scale(.4)"), (f"{(mid - .25) / t * 100:.3f}%", "opacity:0;transform:scale(.4)"),
                                                        (f"{mid / t * 100:.3f}%", "opacity:.9;transform:scale(1)"), (f"{(mid + .6) / t * 100:.3f}%", "opacity:0;transform:scale(1.6)"),
                                                        ("100%", "opacity:0;transform:scale(1.6)")], "ease-out", delay)
            layers.append(f'<g style="transform-box:fill-box;transform-origin:center" class="{flash}"><circle cx="{x0}" cy="{y - 18}" r="16" fill="{colour}"/></g>')
    # flashes sit behind the sprites
    flashes = [l for l in layers if "<circle" in l]
    sprites = [l for l in layers if "<circle" not in l]
    return f'<g class="{mv}">{"".join(flashes)}{"".join(sprites)}</g>'


# Each section takes its Pokémon's colour (the tab mascots). Teddiursa's sections keep Voracity's
# original green, like its My Space tab, as does everything else.
HUES = {
    "fuecoco": {"light": dict(accent="#c4553f", soft="#fbe9e4", border="#f0d3cb", panel="#fdf8f6"),
                "dark": dict(accent="#f0917c", soft="#3a2a26", border="#4a3631", panel="#262220")},
    "froakie": {"light": dict(accent="#3f78b5", soft="#e3eef9", border="#cddff0", panel="#f7fafd"),
                "dark": dict(accent="#8cb8e6", soft="#243142", border="#33445a", panel="#20242a")},
    "jirachi": {"light": dict(accent="#a98a1f", soft="#f7f0d2", border="#ece0ae", panel="#fdfbf2"),
                "dark": dict(accent="#e3c95a", soft="#37331f", border="#4a4428", panel="#25241f")},
    "diancie": {"light": dict(accent="#c0517f", soft="#f9e4ee", border="#efcfdc", panel="#fdf7fa"),
                "dark": dict(accent="#f09cc0", soft="#3a2630", border="#4b3340", panel="#262124")},
}


def _mix(a, b, t):
    pa, pb = [int(a[i:i + 2], 16) for i in (1, 3, 5)], [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(x + (y - x) * t):02x}" for x, y in zip(pa, pb))


def tint(theme, hue=None):
    """THEMES[theme], recoloured to a Pokémon's hue (panel, border, accent, level squares)."""
    T = dict(THEMES[theme])
    if hue in HUES:
        T.update(HUES[hue][theme])
        T["path"] = T["border"]
        T["cells"] = [T["soft"]] + [_mix(T["soft"], T["accent"], t) for t in (.3, .55, .8, 1)]
    return T
