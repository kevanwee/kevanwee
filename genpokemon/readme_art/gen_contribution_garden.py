"""Contribution garden SVG for the GitHub profile README.

Voracity's Eevee forest (left) beside the last year of contributions (right), with an
Eevee and Sylveon pair walking the path under the grid. Self-contained: sprites and the
forest are embedded as base64, animation is CSS inside the SVG (GitHub renders SVGs as
images, so no scripts). Writes a light and a dark variant for <picture>.

    python gen_contribution_garden.py contributions.json out_dir

contributions.json is the public mirror's shape:
    https://github-contributions-api.jogruber.de/v4/kevanwee?y=last
"""
import base64, datetime as dt, json, struct, sys
from pathlib import Path
from pmd import Scene, Sheet, roamer, SRC, PUBLIC, META
import sky as skies

THEMES = {
    "light": dict(panel="#fcfcf7", border="#e2e5d9", ink="#4d5745", muted="#8a987c", faint="#a0a591",
                  path="#d9dece", cells=["#ebeee4", "#cfe0c3", "#9fc9ad", "#5f9a7c", "#3a6b59"], ring="#3a6b59"),
    "dark": dict(panel="#232323", border="#3a3a3a", ink="#e6e6e6", muted="#b8b8b8", faint="#8f8f8f",
                 path="#3a3a3a", cells=["#323232", "#2e4a3d", "#3d6e57", "#63a184", "#9fc9ad"], ring="#9fc9ad"),
}
W, H = 910, 252
FOREST = dict(x=12, y=14, cam=(106, 88, 280, 224))
GRID_X, GRID_Y, PITCH, CELL = 312, 86, 11, 9
LANE_Y = 210  # feet line of the walkers


def b64(path: Path) -> str:
    return "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode()


def png_size(path: Path):
    return struct.unpack(">II", path.read_bytes()[16:24])


def sprite(species, anim):
    a = META[species]["animations"][anim]
    path = PUBLIC / a["src"].lstrip("/")
    sw, sh = png_size(path)
    return dict(href=b64(path), w=a["w"], h=a["h"], cols=sw // a["w"], rows=sh // a["h"],
                bounds=a["bounds"], ticks=sum(a["durations"]))


def frames_css(cls, s, seconds):
    return (f".{cls}{{animation:{cls} {seconds:.2f}s steps({s['cols']}) infinite}}"
            f"@keyframes {cls}{{to{{transform:translateX(-{s['cols'] * s['w']}px)}}}}")


def standing(species, anim, x, y, row=0, speed=1.0):
    """A sprite whose feet sit at (x, y), cycling its frames in place."""
    s = sprite(species, anim)
    row = min(row, s["rows"] - 1)
    l, t, r, b = s["bounds"][row]
    cls = f"{species[:3]}{anim[:2]}"
    css = frames_css(cls, s, s["ticks"] / 60 * 2.2 / speed)
    ox, oy = round(x - (l + r) / 2), round(y - b)
    svg = (f'<svg x="{ox}" y="{oy}" width="{s["w"]}" height="{s["h"]}" overflow="hidden">'
           f'<g transform="translate(0,-{row * s["h"]})"><g class="{cls}">'
           f'<image href="{s["href"]}" width="{s["cols"] * s["w"]}" height="{s["rows"] * s["h"]}"/></g></g></svg>')
    return svg, css


def walker(species, delay, period, x0, x1):
    """Walks right along the lane, turns, walks back. Rows: 2 faces right, 6 faces left."""
    s = sprite(species, "Walk")
    l, t, r, b = s["bounds"][2]
    cls, dist = f"w{species[:3]}", x1 - x0
    css = frames_css(f"{cls}f", s, s["ticks"] / 60 * 1.6)
    css += (f".{cls}{{animation:{cls} {period}s linear {delay}s infinite}}"
            f"@keyframes {cls}{{0%{{transform:translateX(0)}}50%{{transform:translateX({dist}px)}}100%{{transform:translateX(0)}}}}"
            f".{cls}d{{animation:{cls}d {period}s step-end {delay}s infinite}}"
            f"@keyframes {cls}d{{0%{{transform:translateY(-{2 * s['h']}px)}}50%{{transform:translateY(-{6 * s['h']}px)}}100%{{transform:translateY(-{2 * s['h']}px)}}}}")
    svg = (f'<g class="{cls}"><svg x="{round(x0 - (l + r) / 2)}" y="{round(LANE_Y - b)}" width="{s["w"]}" height="{s["h"]}" overflow="hidden">'
           f'<g class="{cls}d"><g class="{cls}f"><image href="{s["href"]}" width="{s["cols"] * s["w"]}" height="{s["rows"] * s["h"]}"/></g></g></svg></g>')
    return svg, css


def weeks_of(days):
    weeks = []
    for d in days:
        col = (dt.date.fromisoformat(d["date"]).weekday() + 1) % 7  # Sunday first
        if not weeks or col == 0:
            weeks.append([None] * (0 if weeks else col))
        weeks[-1].append(d)
    return weeks


def streak(days):
    n = 0
    for i in range(len(days) - 1, -1, -1):
        if days[i]["count"] > 0:
            n += 1
        elif i != len(days) - 1:
            break
    return n


def render(data, theme, sky=None):
    """sky: from sky.fetch() (phase, kind, intensity); None draws a clear day."""
    sc = Scene(0, 0)
    sky = sky or {"phase": "day", "kind": "clear", "intensity": 0}
    night = sky["phase"] == "night"
    T = THEMES[theme]
    today = dt.date.today().isoformat()
    days = [d for d in data["contributions"] if d["date"] <= today]
    weeks, total = weeks_of(days), data["total"]["lastYear"]
    best = max(days, key=lambda d: d["count"])
    css, parts = ["text{font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif}",
                  "image{image-rendering:pixelated}"], []

    # Card
    parts.append(f'<rect x=".5" y=".5" width="{W - 1}" height="{H - 1}" rx="14" fill="{T["panel"]}" stroke="{T["border"]}"/>')

    # Forest, cropped through the same camera as Voracity, with the animated stone
    fx, fy, (cx, cy, cw, ch) = FOREST["x"], FOREST["y"], FOREST["cam"]
    bg = PUBLIC / "eevee-base/background.png"
    bw, bh = png_size(bg)
    stone = PUBLIC / "eevee-base/stone-frames.png"
    parts.append(f'<clipPath id="fc"><rect x="{fx}" y="{fy}" width="{cw}" height="{ch}" rx="11"/></clipPath>')
    forest = [f'<svg x="{fx}" y="{fy}" width="{cw}" height="{ch}" viewBox="{cx} {cy} {cw} {ch}">',
              f'<image href="{b64(bg)}" width="{bw}" height="{bh}"/>',
              f'<svg x="209" y="177" width="54" height="39" overflow="hidden"><g class="stone"><image href="{b64(stone)}" width="{54 * 32}" height="39"/></g></svg>']
    css.append(".stone{animation:stone 3.84s steps(32) infinite}@keyframes stone{to{transform:translateX(-1728px)}}")
    # The forest residents roam the clearing (map coordinates), routed around the stone
    routes = [("vaporeon", [(176, 232), (190, 168), (290, 160), (322, 204), (252, 246)], 11, [2.5, 1.5, 3, 2, 1.5], 0),
              ("jolteon", [(292, 182), (322, 246), (282, 292), (220, 282), (300, 232)], 15, [1.5, 2, 1, 2.5, 1], -6),
              ("flareon", [(182, 252), (204, 292), (158, 284), (150, 220)], 9, [6, 2, 4, 3], -3),
              ("umbreon", [(302, 262), (250, 296), (190, 240), (232, 250), (330, 280)], 12, [2, 3, 1.5, 2, 2.5], -11)]
    for species, points, speed, pauses, delay in routes:
        if night:  # asleep where their walk begins
            forest.append(sc.sprite(Sheet(species, "Sleep"), 0, points[0][0], points[0][1], 1.0))
        else:
            forest.append(roamer(sc, species, points, speed, pauses, delay, 1.0))
    forest.append("</svg>")
    weather = skies.overlay(sc, fx, fy, cw, ch, sky["kind"], sky["intensity"], sky["phase"])
    caption = skies.label(sky["kind"], sky["phase"])
    tag = f'<rect x="{fx + 8}" y="{fy + 8}" width="{len(caption) * 5.6 + 14:.0f}" height="17" rx="8.5" fill="#0b0f1a" opacity=".55"/>'           f'<text x="{fx + 15}" y="{fy + 20}" font-size="9.5" fill="#f4f1e6">{caption}</text>'
    parts.append(f'<g clip-path="url(#fc)">{"".join(forest)}{weather}{tag}</g>')
    parts.append(f'<rect x="{fx}" y="{fy}" width="{cw}" height="{ch}" rx="11" fill="none" stroke="{T["border"]}"/>')

    # Heading
    right = GRID_X + len(weeks) * PITCH - (PITCH - CELL)
    parts.append(f'<text x="{GRID_X}" y="44" font-family="Georgia,serif" font-size="18" fill="{T["ink"]}" style="font-family:Georgia,serif">Contributions</text>')
    parts.append(f'<text x="{right}" y="44" text-anchor="end" font-size="11" fill="{T["muted"]}">'
                 f'<tspan font-weight="600" fill="{T["ink"]}">{total:,}</tspan> in the last year</text>')

    # Months and cells
    previous, last_label = "", -9
    for c, week in enumerate(weeks):
        first = next(d for d in week if d)
        month = first["date"][:7]
        if month != previous:
            previous = month
            if c - last_label >= 3 and c < len(weeks) - 1:
                label = dt.date.fromisoformat(first["date"]).strftime("%b")
                parts.append(f'<text x="{GRID_X + c * PITCH}" y="{GRID_Y - 6}" font-size="9" fill="{T["faint"]}">{label}</text>')
                last_label = c
        for r, d in enumerate(week):
            if not d:
                continue
            x, y = GRID_X + c * PITCH, GRID_Y + r * PITCH
            ring = f' stroke="{T["ring"]}" stroke-width="1.2"' if d["date"] == today else ""
            parts.append(f'<rect class="c" style="animation-delay:{c * 8}ms" x="{x}" y="{y}" width="{CELL}" height="{CELL}" rx="2" fill="{T["cells"][d["level"]]}"{ring}>'
                         f'<title>{d["count"]} on {d["date"]}</title></rect>')
    css.append(".c{animation:sprout .4s ease-out both}@keyframes sprout{from{opacity:0}}")

    # The path, and the pair walking it
    parts.append(f'<line x1="{GRID_X}" y1="{LANE_Y + 1}" x2="{right}" y2="{LANE_Y + 1}" stroke="{T["path"]}" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round"/>')
    for i, (species, delay) in enumerate([("eevee", 0), ("sylveon", -1.6)]):
        if night:  # curled up together on the path
            parts.append(sc.sprite(Sheet(species, "Sleep"), 0, GRID_X + 60 + i * 30, LANE_Y + 1, 1.0))
            continue
        s, c = walker(species, delay, 30, GRID_X + 14, right - 14)
        parts.append(s); css.append(c)

    # Footer: streak, best day, legend
    best_day = dt.date.fromisoformat(best["date"]).strftime("%-d %b") if sys.platform != "win32" else dt.date.fromisoformat(best["date"]).strftime("%#d %b")
    parts.append(f'<text x="{GRID_X}" y="{H - 16}" font-size="10" fill="{T["muted"]}">{streak(days)}-day streak · best day {best["count"]} ({best_day})</text>')
    lx = right - 5 * 11 - 30
    parts.append(f'<text x="{lx - 6}" y="{H - 16}" text-anchor="end" font-size="10" fill="{T["muted"]}">Less</text>')
    for i, colour in enumerate(T["cells"]):
        parts.append(f'<rect x="{lx + i * 11}" y="{H - 24}" width="9" height="9" rx="2" fill="{colour}"/>')
    parts.append(f'<text x="{right}" y="{H - 16}" text-anchor="end" font-size="10" fill="{T["muted"]}">More</text>')

    css.append("@media (prefers-reduced-motion:reduce){*{animation:none!important}}")
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" '
            f'aria-label="{total:,} GitHub contributions in the last year, with Eevee and friends">'
            f'<style>{"".join(css)}{"".join(sc.css)}</style><defs>{"".join(sc.defs)}</defs>{"".join(parts)}</svg>')


if __name__ == "__main__":
    data = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
    for theme in THEMES:
        (out / f"contribution-garden-{theme}.svg").write_text(render(data, theme), encoding="utf-8")
        print(theme, (out / f"contribution-garden-{theme}.svg").stat().st_size, "bytes")
