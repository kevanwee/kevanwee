"""README pieces in the garden's style: project cards with a resident on the top edge, divider
paths with walking pairs, the skill-tree card, the fresh-off-the-stove card and heading mascots."""
import datetime as dt, html, itertools, json, random, re, sys
SEEDS = itertools.count()  # every resident gets its own deterministic phase
from pathlib import Path
from PIL import ImageFont
from pmd import Scene, Sheet, THEMES, species_scale, silvally
import cast

def _font(*candidates):
    """Text is measured to wrap it: Windows fonts locally, metric-alikes on the Linux runner."""
    for path in candidates:
        try:
            return ImageFont.truetype(path, 100)
        except OSError:
            continue
    raise OSError(f"none of {candidates}")


LIB = "/usr/share/fonts/truetype/liberation/"
FONTS = {"sans": _font(r"C:\Windows\Fonts\arial.ttf", LIB + "LiberationSans-Regular.ttf"),
         "bold": _font(r"C:\Windows\Fonts\arialbd.ttf", LIB + "LiberationSans-Bold.ttf"),
         "serif": _font(r"C:\Windows\Fonts\georgia.ttf", LIB + "LiberationSerif-Regular.ttf")}
LANGS = {k: v for k, v in json.loads(Path("langs.json").read_text(encoding="utf-8")).items()}
LANG_COLOUR = {"Python": "#3572A5", "TypeScript": "#3178c6", "JavaScript": "#f1e05a", "HTML": "#e34c26", "CSS": "#563d7c", "Solidity": "#AA6746"}
LANE = 58  # room above every card for its resident; sprites are sized to fit inside it
esc = html.escape


def width(text, size, font="sans"):
    return FONTS[font].getlength(text) * size / 100 * 1.07  # a little slack for other system fonts


def wrap(text, size, max_w, lines=2, font="sans"):
    words, out, line = text.split(), [], ""
    for word in words:
        trial = f"{line} {word}".strip()
        if width(trial, size, font) <= max_w: line = trial; continue
        out.append(line); line = word
        if len(out) == lines: break
    else:
        out.append(line)
        return [l for l in out if l]
    last = out[-1]
    while width(last + "…", size, font) > max_w: last = last.rsplit(" ", 1)[0]
    out[-1] = last + "…"
    return out


def fit_scale(species, anim="Walk", room=LANE - 6, row=2):
    sheet = Sheet(species, anim)
    l, t, r, b = sheet.bounds(row)
    return min(species_scale(species) * 1.25, room / (b - t))


def resident(sc, species, mode, x0, x1, feet, period):
    if species == "silvally":  # walks and changes type at each end, like Voracity's
        forms = ["steel", "fire", "water", "grass", "psychic", "dark"]
        return silvally(sc, forms, x0, x1, feet, scale=fit_scale("silvally-steel"), delay=-random.Random("silvally").uniform(0, 20))
    if mode == "walk":
        rng = random.Random(f"{species}-{next(SEEDS)}")
        period = round(period * rng.uniform(.8, 1.3), 2)
        return sc.walker(species, x0, x1, feet, period, delay=-rng.uniform(0, period), scale=fit_scale(species))
    anim, row = ("Sleep", 0) if mode == "sleep" else ("Idle", 0)
    sheet = Sheet(species, anim)
    return sc.sprite(sheet, row, x0, feet, fit_scale(species, anim, row=row))


def card(theme, title, desc, href_label, lang, tags, who):
    """440 × (LANE + 104) project card; the resident stands on the card's top edge."""
    T, W, CH = THEMES[theme], 440, 104
    H = LANE + CH
    sc = Scene(W, H)
    sc.body.append(f'<rect x=".5" y="{LANE + .5}" width="{W - 1}" height="{CH - 1}" rx="11" fill="{T["panel"]}" stroke="{T["border"]}"/>')
    tx = 18
    sc.body.append(f'<text class="serif" x="{tx}" y="{LANE + 30}" font-size="17" fill="{T["accent"]}">{esc(title)}</text>')
    px = tx + width(title, 17, "serif") + 8
    for tag in tags:
        tw = width(tag, 10) + 12
        sc.body.append(f'<rect x="{px:.0f}" y="{LANE + 17}" width="{tw:.0f}" height="17" rx="8.5" fill="{T["soft"]}"/>'
                       f'<text x="{px + 6:.0f}" y="{LANE + 29}" font-size="10" fill="{T["muted"]}">{esc(tag)}</text>')
        px += tw + 6
    for i, line in enumerate(wrap(desc, 12.5, W - 36)):
        sc.body.append(f'<text x="{tx}" y="{LANE + 52 + i * 17}" font-size="12.5" fill="{T["muted"]}">{esc(line)}</text>')
    if lang:
        sc.body.append(f'<circle cx="{tx + 5}" cy="{LANE + 88}" r="5" fill="{LANG_COLOUR.get(lang, T["faint"])}"/>'
                       f'<text x="{tx + 15}" y="{LANE + 92}" font-size="11" fill="{T["faint"]}">{esc(lang)}</text>')
    sc.body.append(f'<text x="{W - 18}" y="{LANE + 92}" text-anchor="end" font-size="11" fill="{T["faint"]}">{esc(href_label)} ↗</text>')
    species, mode = who
    sc.body.append(resident(sc, species, mode, 60 if mode == "walk" else W - 70, W - 60, LANE + 1, 22))
    return sc.svg(f"{title}: {desc}")


def divider(pair, flyer=None):
    """A transparent path strip with a pair walking it; one SVG serves both themes. Each strip
    gets its own pace, starting point and gap, so the pairs never move in step."""
    W, H = 910, 66
    sc = Scene(W, H)
    rng = random.Random("-".join(pair))
    period, start, gap = rng.uniform(32, 50), rng.uniform(0, 50), rng.uniform(1.1, 2.6)
    sc.body.append(f'<line x1="20" y1="{H - 4}" x2="{W - 20}" y2="{H - 4}" stroke="#8b949e" stroke-opacity=".45" stroke-width="2" stroke-dasharray="2 6" stroke-linecap="round"/>')
    lead, follow = pair
    sc.body.append(sc.walker(follow, 40, W - 40, H - 5, round(period, 2), delay=-(start - gap) % period, scale=fit_scale(follow, room=H - 8)))
    sc.body.append(sc.walker(lead, 40, W - 40, H - 5, round(period, 2), delay=-start, scale=fit_scale(lead, room=H - 8)))
    if flyer:
        sc.body.append(sc.walker(flyer, W - 120, 120, 34, round(rng.uniform(22, 34), 2), delay=-rng.uniform(0, 30), scale=min(1.0, fit_scale(flyer, room=30)), bob=True))
    return sc.svg(f"{lead} and {follow} walking the path")


def tree_card(theme, columns):
    """Two skill trees side by side, residents along the top edge."""
    T, W = THEMES[theme], 910
    col_w, label_w, size, gap = 425, 138, 12.5, 18
    blocks = []
    for title, rows in columns:
        laid = [(label, wrap(value, size, col_w - label_w - 36, lines=3)) for label, value in rows]
        blocks.append((title, laid))
    body_h = max(44 + sum(len(v) * 17 + 13 for _, v in laid) for _, laid in blocks) + 14
    H = LANE + body_h
    sc = Scene(W, H)
    sc.body.append(f'<rect x=".5" y="{LANE + .5}" width="{W - 1}" height="{body_h - 1}" rx="12" fill="{T["panel"]}" stroke="{T["border"]}"/>')
    sc.body.append(f'<line x1="{W / 2}" y1="{LANE + 22}" x2="{W / 2}" y2="{H - 22}" stroke="{T["path"]}" stroke-dasharray="2 5"/>')
    for c, (title, laid) in enumerate(blocks):
        x0 = 24 + c * (W / 2)
        sc.body.append(f'<text class="serif" x="{x0}" y="{LANE + 32}" font-size="17" fill="{T["ink"]}">{esc(title)}</text>')
        y = LANE + 58
        for i, (label, lines) in enumerate(laid):
            sc.body.append(f'<rect x="{x0}" y="{y - 9}" width="8" height="8" rx="2" fill="{T["cells"][4 - i % 4]}"/>'
                           f'<text x="{x0 + 16}" y="{y}" font-size="{size}" font-weight="600" fill="{T["ink"]}">{esc(label)}</text>')
            for j, line in enumerate(lines):
                sc.body.append(f'<text x="{x0 + label_w}" y="{y + j * 17}" font-size="{size}" fill="{T["muted"]}">{esc(line)}</text>')
            y += len(lines) * 17 + 13
    (a, am), (b, bm), (c, cm) = cast.TREES
    sc.body.append(resident(sc, a, am, 40, 400, LANE + 1, 26))
    sc.body.append(resident(sc, b, bm, 520, 860, LANE + 1, 30))
    sc.body.append(resident(sc, c, cm, 450, 0, LANE + 1, 0))
    return sc.svg("Skill trees")


def ago(iso, now):
    days = (now - dt.date.fromisoformat(iso[:10])).days
    if days < 1: return "today"
    if days < 2: return "yesterday"
    if days < 14: return f"{days} days ago"
    if days < 60: return f"{days // 7} weeks ago"
    return f"{days // 30} months ago"


def stove_card(theme, repos, now):
    T, W = THEMES[theme], 910
    rows = repos[:4]
    body_h = 48 + len(rows) * 44 + 8
    H = LANE + body_h
    sc = Scene(W, H)
    sc.body.append(f'<rect x=".5" y="{LANE + .5}" width="{W - 1}" height="{body_h - 1}" rx="12" fill="{T["panel"]}" stroke="{T["border"]}"/>')
    sc.body.append(f'<text class="serif" x="24" y="{LANE + 32}" font-size="17" fill="{T["ink"]}">fresh off the stove</text>')
    for i, r in enumerate(rows):
        y = LANE + 48 + i * 44
        if i: sc.body.append(f'<line x1="24" y1="{y}" x2="{W - 24}" y2="{y}" stroke="{T["path"]}"/>')
        sc.body.append(f'<rect x="24" y="{y + 15}" width="8" height="8" rx="2" fill="{T["cells"][4 - i]}"/>')
        sc.body.append(f'<text class="serif" x="42" y="{y + 25}" font-size="15" fill="{T["accent"]}">{esc(r["name"])}</text>')
        dx = 42 + width(r["name"], 15, "serif") + 14
        desc = wrap((r["description"] or "").rstrip(".").lower(), 12.5, W - dx - 150, lines=1)
        if desc: sc.body.append(f'<text x="{dx:.0f}" y="{y + 25}" font-size="12.5" fill="{T["muted"]}">{esc(desc[0])}</text>')
        sc.body.append(f'<text x="{W - 24}" y="{y + 25}" text-anchor="end" font-size="11.5" fill="{T["faint"]}">{ago(r["pushedAt"], now)}</text>')
    (a, am), (b, bm) = cast.STOVE
    sc.body.append(resident(sc, a, am, 260, 860, LANE + 1, 30))
    sc.body.append(resident(sc, b, bm, 80, 0, LANE + 1, 0))
    return sc.svg("Recently pushed repositories")


def mascot(species, anim_species=None, height=26):
    """Heading icon: idle facing the viewer, cropped to its pixels, feet on the bottom edge."""
    sheet = Sheet(anim_species or species, "Idle")
    l, t, r, b = sheet.bounds(0)
    scale = height / (b - t)
    w = round((r - l) * scale) + 2
    sc = Scene(w, height)
    sc.body.append(sc.sprite(sheet, 0, w / 2, height, scale))
    return sc.svg(species)


def write(name, text):
    (OUT / name).write_text(text, encoding="utf-8")


if __name__ == "__main__":
    OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "out"); OUT.mkdir(parents=True, exist_ok=True)
    now = dt.date.today()
    projects = json.loads(Path("projects.json").read_text(encoding="utf-8"))
    for group in projects:
        for p in group["items"]:
            p["who"], p["mode"] = cast.CARDS[p["slug"]]
            lang = LANGS.get(p["repo"].lower(), (None, 0))[0] if p.get("repo") else None
            for theme in THEMES:
                write(f'card-{p["slug"]}-{theme}.svg', card(theme, p["title"], p["desc"], p.get("label", "github"), lang, p.get("tags", []), (p["who"], p["mode"])))
    for name, (pair, flyer) in cast.PATHS.items():
        write(f"path-{name}.svg", divider(pair, flyer))
    trees = json.loads(Path("trees.json").read_text(encoding="utf-8"))
    repos = [r for r in json.loads(Path("repos.json").read_text(encoding="utf-8")) if not r["isPrivate"] and not r["isFork"] and r["name"] != "kevanwee"]
    repos.sort(key=lambda r: r["pushedAt"], reverse=True)
    for theme in THEMES:
        write(f"trees-{theme}.svg", tree_card(theme, trees))
        write(f"stove-{theme}.svg", stove_card(theme, repos, now))
    print("ok", len(list(OUT.glob("*.svg"))))
