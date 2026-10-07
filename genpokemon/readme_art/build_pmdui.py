"""Two Mystery Dungeon UI cards, in the dialogue box's navy frame:

* Explorer Rank: Explorers of Sky's rank ladder, points = all-time GitHub contributions (a rank never
  drops, as in the game). Rank badges: Explorers of Time/Darkness and Sky (via Mystery Dungeon Wiki).
* Weather forecast: NEA's 24-hour forecast for Singapore's central region, one window per period onto
  Thunder Meadow (Castform's friend area in Red/Blue Rescue Team) with Castform in the matching form and a
  shiny Castform keeping it company in the same form (PMD Sprite Collab), and the forecast's weather drawn with
  the forest's sky effects (sky.py).

Voracity and the portfolio share these rules (explorer.ts, forecast in forest-sky.ts).

    python build_pmdui.py all-contributions.json forecast.json ../../readme/art
    all-contributions.json: https://github-contributions-api.jogruber.de/v4/kevanwee?y=all
    forecast.json:          https://api-open.data.gov.sg/v2/real-time/api/twenty-four-hr-forecast
"""
import base64, datetime as dt, html, json, sys
from pathlib import Path
from pmd import Scene, Sheet, PUBLIC
from build_cards import width
import sky as skies

HERE = Path(__file__).parent
# Castform's home: Thunder Meadow, its friend area in Pokémon Mystery Dungeon: Red/Blue Rescue Team (456 x 335).
# Crops stay below the meadow's own storm clouds, so the forecast's weather is drawn on top.
MEADOW = HERE / "areas/thunder-meadow.png"
MEADOW_VIEWS = [(118, 150, 220, 92), (40, 196, 220, 92), (196, 182, 220, 92), (90, 122, 220, 92)]  # one crop per period
pix_width = lambda text, size: width(text, size) * 1.28  # Pixelify Sans runs wider than the Arial metrics
FONT = base64.b64encode((HERE / "fonts/PixelifySans.woff2").read_bytes()).decode()
NAVY, EDGE, INNER = "#0e1736", "#a9bce4", "#34477c"
INK, GOLD, CYAN, GREEN, FAINT = "#f8f8f8", "#f8e058", "#68d0f8", "#90f090", "#8f9ac2"

# Explorers of Sky: (rank, points needed, badge). Super reuses the Diamond badge, as in the game.
RANKS = [("Normal", 0, "td-Normal"), ("Bronze", 100, "td-Bronze"), ("Silver", 300, "td-Silver"), ("Gold", 1600, "td-Gold"),
         ("Diamond", 3200, "td-Diamond"), ("Super", 5000, "td-Diamond"), ("Ultra", 7500, "td-Ultra"), ("Hyper", 10500, "td-Hyper"),
         ("Master", 13500, "td-Master"), ("Master ★", 17000, "eos-Master-1"), ("Master ★★", 21000, "eos-Master-2"),
         ("Master ★★★", 25000, "eos-Master-3"), ("Guildmaster", 100000, "eos-Guildmaster")]
TEAM = [("charcadet", "Charcadet"), ("fuecoco", "Fuecoco")]  # a Mystery Dungeon pair: the leader, then the partner


def rank_of(points):
    """(rank, badge, next rank or None, points needed for it or None, progress 0-1)."""
    i = max(k for k, (_, need, _) in enumerate(RANKS) if points >= need)
    name, need, badge = RANKS[i]
    if i + 1 >= len(RANKS): return name, badge, None, None, 1.0
    nxt, nxt_need, _ = RANKS[i + 1]
    return name, badge, nxt, nxt_need, (points - need) / (nxt_need - need)


def png(path):
    return "data:image/png;base64," + base64.b64encode(Path(path).read_bytes()).decode()


def frame(sc, w, h):
    sc.body.append(f'<rect x="1" y="1" width="{w - 2}" height="{h - 2}" rx="10" fill="{NAVY}" stroke="{EDGE}" stroke-width="2"/>'
                   f'<rect x="5" y="5" width="{w - 10}" height="{h - 10}" rx="7" fill="none" stroke="{INNER}"/>')


def svg(sc, label):
    css = (f"@font-face{{font-family:Pix;src:url(data:font/woff2;base64,{FONT}) format('woff2');font-weight:400 700}}"
           "text{font-family:Pix,'Courier New',monospace;letter-spacing:.3px}")
    return sc.svg(label, extra_css=css).replace('<style>text{font-family:-apple-system,"Segoe UI",Helvetica,Arial,sans-serif}', "<style>", 1)


def render_rank(points):
    W, H = 910, 132
    sc = Scene(W, H)
    frame(sc, W, H)
    name, badge, nxt, need, progress = rank_of(points)
    # The badge, enlarged with crisp pixels, with a slow glint
    sc.css.append(".glint{animation:glint 4s ease-in-out infinite}@keyframes glint{0%,70%,100%{opacity:0}80%{opacity:.55}}")
    sc.body.append(f'<image href="{png(HERE / "ranks" / (badge + ".png"))}" x="22" y="18" width="96" height="96"/>'
                   f'<circle class="glint" cx="70" cy="66" r="40" fill="#ffffff" opacity="0" style="mix-blend-mode:soft-light"/>')
    x = 138
    sc.body.append(f'<text x="{x}" y="34" font-size="13" fill="{GOLD}" font-weight="600">Explorer Rank</text>'
                   f'<text x="{x}" y="64" font-size="26" fill="{INK}">{html.escape(name)} Rank</text>'
                   f'<text x="{x}" y="84" font-size="13" fill="{FAINT}"><tspan fill="{GREEN}">{points:,}</tspan> points · all-time contributions</text>')
    # Progress to the next rank
    bar_w = 400
    sc.body.append(f'<rect x="{x}" y="96" width="{bar_w}" height="12" rx="3" fill="#060b1d" stroke="{INNER}"/>')
    sc.css.append(f".fill{{animation:fill 1.6s ease-out both}}@keyframes fill{{from{{width:0}}}}")
    sc.body.append(f'<rect class="fill" x="{x + 2}" y="98" width="{max(4, (bar_w - 4) * progress):.0f}" height="8" rx="2" fill="{GOLD}"/>')
    to_go = f"{need - points:,} to {nxt} Rank" if nxt else "Top rank reached"
    sc.body.append(f'<text x="{x + bar_w}" y="122" text-anchor="end" font-size="11" fill="{FAINT}">{html.escape(to_go)}</text>')
    # The team: a blank name, and its members standing on a line
    tx = 610
    sc.body.append(f'<text x="{tx}" y="34" font-size="13" fill="{GOLD}" font-weight="600">Team</text>'
                   f'<line x1="{tx + 44}" y1="36" x2="{W - 26}" y2="36" stroke="{INNER}" stroke-dasharray="3 3"/>')
    for i, (species, label) in enumerate(TEAM):
        sheet = Sheet(species, "Idle")
        l, t, r, b = sheet.bounds(0)
        s = min(2.5, 60 / (b - t))
        cx = tx + 70 + i * 130
        sc.body.append(sc.sprite(sheet, 0, cx, 110, s))
        sc.body.append(f'<text x="{cx}" y="126" text-anchor="middle" font-size="11" fill="{FAINT}">{label}</text>')
    sc.body.append(f'<line x1="{tx}" y1="111" x2="{W - 26}" y2="111" stroke="{INNER}" stroke-dasharray="2 4"/>')
    return svg(sc, f"Explorer Rank: {name} Rank, {points:,} points. {to_go}.")


def period_label(start, end, now):
    s, e = dt.datetime.fromisoformat(start), dt.datetime.fromisoformat(end)
    day = "Today" if s.date() == now.date() else "Tomorrow" if s.date() == now.date() + dt.timedelta(days=1) else s.strftime("%a")
    if s.hour >= 18 or s.hour < 6: return ("Tonight" if s.date() == now.date() else f"{day} night"), "night"
    if s.hour < 12: return f"{day} morning", "day"
    return f"{day} afternoon", "day"


CASTFORM = {"sunny": "castform-sunny", "rain": "castform-rainy", "storm": "castform-rainy"}
PAIR = [("", -24, 0), ("shiny-", 24, .35)]  # Castform, then its shiny companion: sheet prefix, x offset, bob lag (s)


def render_forecast(record, now, region="central"):
    W, H = 910, 196
    sc = Scene(W, H)
    frame(sc, W, H)
    sc.body.append(f'<text x="22" y="32" font-size="15" fill="{GOLD}" font-weight="600">Castform<tspan fill="{INK}" font-weight="400">: here\'s the weather for Singapore</tspan></text>')
    sc.defs.append(f'<image id="meadow" href="{png(MEADOW)}" width="456" height="335" style="image-rendering:pixelated"/>')
    periods = record["periods"][:4]
    gap, x0, top, cell_h = 12, 22, 44, 116
    cell_w = (W - 2 * x0 - gap * (len(periods) - 1)) / len(periods)
    for i, p in enumerate(periods):
        text = p["regions"][region]["text"]
        kind, intensity = skies.weather_of(text)
        label, phase = period_label(p["timePeriod"]["start"], p["timePeriod"]["end"], now)
        if kind == "sunny" and phase == "night": kind = "clear"
        x = x0 + i * (cell_w + gap)
        cid = f"cell{i}"
        sc.defs.append(f'<clipPath id="{cid}"><rect x="{x:.1f}" y="{top}" width="{cell_w:.1f}" height="{cell_h}" rx="7"/></clipPath>')
        vx, vy, vw, vh = MEADOW_VIEWS[i % len(MEADOW_VIEWS)]
        window = [f'<svg x="{x:.1f}" y="{top}" width="{cell_w:.1f}" height="{cell_h}" viewBox="{vx} {vy} {vw} {vh}" preserveAspectRatio="xMidYMid slice">'
                  f'<use href="#meadow"/></svg>']
        for prefix, dx, lag in PAIR:
            sheet = Sheet(prefix + CASTFORM.get(kind, "castform"), "Idle")
            l, t, r, b = sheet.bounds(0)
            bob = sc.keyframes(sc.uid("cb"), 2.4, [("0%,100%", "transform:translateY(0)"), ("50%", "transform:translateY(-4px)")], "ease-in-out", -i * .5 - lag)
            cx = x + cell_w / 2 + dx
            window.append(f'<ellipse cx="{cx:.1f}" cy="{top + cell_h - 14}" rx="14" ry="4" fill="#000" opacity=".25"/>'
                          f'<g class="{bob}">{sc.sprite(sheet, 0, cx, top + cell_h - 22, min(2.4, 62 / (b - t)))}</g>')
        window.append(skies.overlay(sc, x, top, cell_w, cell_h, kind, intensity, phase))
        sc.body.append(f'<g clip-path="url(#{cid})">{"".join(window)}</g>'
                       f'<rect x="{x:.1f}" y="{top}" width="{cell_w:.1f}" height="{cell_h}" rx="7" fill="none" stroke="{INNER}"/>')
        sc.body.append(f'<rect x="{x + 6:.1f}" y="{top + 6}" width="{pix_width(label, 11) + 14:.0f}" height="17" rx="8.5" fill="#0b0f1a" opacity=".6"/>'
                       f'<text x="{x + 13:.1f}" y="{top + 18}" font-size="11" fill="{INK}">{html.escape(label)}</text>')
        sc.body.append(f'<text x="{x + cell_w / 2:.1f}" y="{top + cell_h + 16}" text-anchor="middle" font-size="12" fill="{CYAN}">{html.escape(text)}</text>')
    g = record["general"]
    t, h, wd = g["temperature"], g["relativeHumidity"], g["wind"]
    foot = f'{t["low"]}–{t["high"]}°C  ·  humidity {h["low"]}–{h["high"]}%  ·  wind {wd["direction"]} {wd["speed"]["low"]}–{wd["speed"]["high"]} km/h  ·  NEA'
    sc.body.append(f'<text x="{W - 22}" y="32" text-anchor="end" font-size="11" fill="{FAINT}">{html.escape(foot)}</text>')
    return svg(sc, "Weather forecast for Singapore: " + "; ".join(p["regions"][region]["text"] for p in periods))


def all_time(body):
    return sum(int(v) for v in body.get("total", {}).values())


if __name__ == "__main__":
    contributions = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    record = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))["data"]["records"][0]
    out = Path(sys.argv[3]); out.mkdir(parents=True, exist_ok=True)
    now = dt.datetime.now(skies.SGT)
    points = all_time(contributions)
    (out / "explorer-rank.svg").write_text(render_rank(points), encoding="utf-8")
    (out / "forecast.svg").write_text(render_forecast(record, now), encoding="utf-8")
    print("rank:", rank_of(points)[0], points, "| forecast:", [p["regions"]["central"]["text"] for p in record["periods"]])
