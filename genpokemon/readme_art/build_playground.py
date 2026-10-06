"""The playground: six evenly spaced slots, in the owner's order.

Diancie (Mega), Ceruledge (Soul Unison with Darkrai, Zygarde, Armarouge), Greninja (Mega),
Dragonite (shiny Mega), Iron Valiant (twirl, then its special attack), Yveltal (hovers, then its
special). Mega Evolution: the Key Stone and the Mega Stone light up and beam into the Pokémon, a
sphere of light closes, it whites out, bursts with the Mega symbol, and the Mega form stands until it
reverts. Soul Unison follows Voracity's fusion.css timeline, with the partner gliding in from the left."""
import base64, sys
from pathlib import Path
from pmd import Scene, Sheet, THEMES, species_scale

W, H = 910, 300
GROUND = 234
SLOTS = [76 + i * (W - 152) / 5 for i in range(6)]
FIT_W, FIT_H = 140, 150
F = 1.45
RAINBOW = ["#ff6ad5", "#ffd36a", "#6affb0", "#6ac8ff", "#b36aff"]
data = lambda p: "data:image/png;base64," + base64.b64encode(Path(p).read_bytes()).decode()
SYMBOL = data("mega-symbol.png")
STONES = {n: data(f"stones/{n}-icon.png") for n in ["diancite", "greninjite", "dragoninite"]}


def pct(p):
    return f"{p:.3f}%"


def fit(sheet, row, scale):
    l, t, r, b = sheet.bounds(row)
    return min(scale, FIT_W / (r - l), FIT_H / (b - t))


def opacity(sc, period, points, delay=0.0):
    return sc.keyframes(sc.uid("o"), period, [(pct(p), f"opacity:{o}") for p, o in points], "linear", delay)


def mega_slot(sc, x, base, mega, stone, period, delay, base_scale, mega_scale):
    (bs, ba, br), (ms, ma, mr) = base, mega
    bsheet, msheet = Sheet(bs, ba), Sheet(ms, ma)
    base_scale, mega_scale = fit(bsheet, br, base_scale * F), fit(msheet, mr, mega_scale * F)
    white = sc.silhouette_filter("#ffffff", glow="#e8a93a")
    bf, mf = sc.frames_class(bsheet), sc.frames_class(msheet)
    bl, bt, brr, bb = bsheet.bounds(br)
    ml, mt, mrr, mb = msheet.bounds(mr)
    base_h, mega_h = (bb - bt) * base_scale, (mb - mt) * mega_scale
    cy = GROUND - max(base_h, mega_h) / 2
    radius = min(max(base_h, mega_h, (mrr - ml) * mega_scale) / 2 + 10, 72)
    k = lambda pts: opacity(sc, period, pts, delay)
    out = []
    out.append(f'<g class="{k([(0,1),(35,1),(37,0),(96,0),(98,1),(100,1)])}">{sc.sprite(bsheet, br, x, GROUND, base_scale, frames=bf)}</g>')
    out.append(f'<g class="{k([(0,0),(33,0),(37,1),(48,1),(50,0),(91,0),(93,1),(96,1),(98,0),(100,0)])}">{sc.sprite(bsheet, br, x, GROUND, base_scale, frames=bf, filt=white)}</g>')
    out.append(f'<g class="{k([(0,0),(53,0),(57,1),(87,1),(89,0),(100,0)])}">{sc.sprite(msheet, mr, x, GROUND, mega_scale, frames=mf)}</g>')
    out.append(f'<g class="{k([(0,0),(49,0),(51,1),(55,1),(58,0),(86,0),(89,1),(91,1),(93,0),(100,0)])}">{sc.sprite(msheet, mr, x, GROUND, mega_scale, frames=mf, filt=white)}</g>')
    # Its Mega Stone appears above its head, glows, then sinks into it
    sy = max(30, GROUND - base_h - 24)
    pulse = sc.keyframes(sc.uid("p"), 0.9, [("0%,100%", "transform:scale(1)"), ("50%", "transform:scale(1.2)")], "ease-in-out")
    sink = sc.keyframes(sc.uid("k"), period, [("0%,25%", "transform:translate(0,-6px) scale(1);opacity:0"), ("29%", "transform:translate(0,0) scale(1);opacity:1"),
                                              ("35%", "transform:translate(0,0) scale(1);opacity:1"), ("44%", f"transform:translate(0,{cy - sy:.1f}px) scale(.45);opacity:1"),
                                              ("46%", f"transform:translate(0,{cy - sy:.1f}px) scale(.3);opacity:0"), ("100%", f"transform:translate(0,{cy - sy:.1f}px) scale(.3);opacity:0")], "ease-in", delay)
    out.append(f'<g class="tb {sink}"><g class="tb {pulse}"><circle cx="{x:.1f}" cy="{sy:.1f}" r="12" fill="url(#orb)" opacity=".6"/>'
               f'<image href="{STONES[stone]}" x="{x - 12:.1f}" y="{sy - 12:.1f}" width="24" height="24"/></g></g>')
    # The sphere of light that closes around it
    grow = sc.keyframes(sc.uid("g"), period, [("0%,37%", "transform:scale(.2);opacity:0"), ("40%", "opacity:1"), ("48%", "transform:scale(1);opacity:1"),
                                              ("50%", "transform:scale(1.15);opacity:0"), ("100%", "transform:scale(1.15);opacity:0")], "ease-out", delay)
    out.append(f'<g class="tb {grow}"><g class="tb spin"><circle cx="{x:.1f}" cy="{cy:.1f}" r="{radius:.1f}" fill="#ffffff" fill-opacity=".18" '
               f'stroke="url(#rainbow)" stroke-width="3" stroke-dasharray="10 5"/></g></g>')
    # Break-out: a white ring, sparks, and the Mega symbol over the head
    ring = sc.keyframes(sc.uid("r"), period, [("0%,49.5%", "transform:scale(.5);opacity:0"), ("50%", "transform:scale(.5);opacity:1"),
                                              ("57%", "transform:scale(1.9);opacity:0"), ("100%", "transform:scale(1.9);opacity:0")], "ease-out", delay)
    out.append(f'<g class="tb {ring}"><circle cx="{x:.1f}" cy="{cy:.1f}" r="{radius:.1f}" fill="none" stroke="#ffffff" stroke-width="5"/></g>')
    for i in range(8):
        spark = sc.keyframes(sc.uid("s"), period, [("0%,50%", "transform:rotate(0) translateY(0);opacity:0"), ("51%", f"transform:rotate({i * 45}deg) translateY(-8px);opacity:1"),
                                                   ("60%", f"transform:rotate({i * 45}deg) translateY(-{radius + 14:.0f}px);opacity:0"), ("100%", "opacity:0")], "ease-out", delay)
        out.append(f'<g transform="translate({x:.1f},{cy:.1f})"><g class="{spark}"><circle r="2.5" fill="{RAINBOW[i % 5]}"/></g></g>')
    sym_y = max(26, GROUND - mega_h - 26)
    pop = sc.keyframes(sc.uid("y"), period, [("0%,50%", "transform:scale(.3);opacity:0"), ("53%", "transform:scale(1.15);opacity:1"), ("56%", "transform:scale(1);opacity:1"),
                                             ("64%", "transform:scale(1);opacity:1"), ("68%", "transform:scale(.8);opacity:0"), ("100%", "opacity:0")], "ease-out", delay)
    out.append(f'<g class="tb {pop}"><image href="{SYMBOL}" x="{x - 12:.1f}" y="{sym_y - 18:.1f}" width="24" height="36"/></g>')
    return "".join(out)


def unison(sc, x, period=30.0):
    """Three Soul Unisons in turn. The partner glides in from the left, level with Ceruledge."""
    host = Sheet("ceruledge", "Idle")
    hs = fit(host, 0, 1.15 * F)
    hf = sc.frames_class(host)
    hl, ht, hr, hb = host.bounds(0)
    cy = GROUND - (hb - ht) * hs / 2
    white = sc.silhouette_filter("#ffffff", glow="#6f8cff")
    n = 3

    def win(points, k=None):  # local (0-100) points → global points, for one window or all of them
        out = []
        for kk in (range(n) if k is None else [k]):
            out += [((kk * 100 + p) / n, o) for p, o in points]
        if out[0][0] > 0: out.insert(0, (0, points[0][1]))
        if out[-1][0] < 100: out.append((100, points[-1][1]))
        return out

    def kf(points, k=None, prop="opacity", timing="linear"):
        return sc.keyframes(sc.uid("u"), period, [(pct(p), f"{prop}:{v}") for p, v in win(points, k)], timing)

    out = []
    out.append(f'<g class="{kf([(0,1),(30,1),(31,0),(33,1),(35,0),(37,1),(39,0),(92,0),(95,1),(100,1)])}">{sc.sprite(host, 0, x, GROUND, hs, frames=hf)}</g>')
    out.append(f'<g class="{kf([(0,0),(30,0),(31,1),(33,0),(35,1),(37,0),(39,1),(46,1),(50,0),(100,0)])}">{sc.sprite(host, 0, x, GROUND, hs, frames=hf, filt=white)}</g>')
    partners = [("darkrai", "#e0204a", "ceruledge-darkrai"), ("zygarde", "#37e0b3", "ceruledge-zygarde"), ("armarouge", "#ff8a24", "ceruledge-armarouge")]
    for k, (name, soul, fused_name) in enumerate(partners):
        psheet = Sheet(name, "Idle")
        ps = fit(psheet, 0, (.62 if name == "zygarde" else 1.0) * F)
        aura = sc.silhouette_filter(soul, glow=soul)
        pf = sc.frames_class(psheet)
        # Slides in from the left, facing the front, and merges into Ceruledge through the white-out
        glide = sc.keyframes(sc.uid("gl"), period, [(pct(p), v) for p, v in win([(0, "transform:translateX(-84px)"), (24, "transform:translateX(-84px)"),
                                                                                (36, "transform:translateX(0)"), (100, "transform:translateX(0)")], k)], "ease-in")
        partner = sc.sprite(psheet, 0, x, GROUND, ps, frames=pf)  # facing the front, like Ceruledge
        out.append(f'<g class="{kf([(0,0),(18,0),(23,1),(32,1),(34,0),(100,0)], k)}"><g class="{glide}">{partner}</g></g>')
        out.append(f'<g class="{kf([(0,0),(31,0),(33,1),(35,1),(37,0),(100,0)], k)}"><g class="{glide}">{sc.sprite(psheet, 0, x, GROUND, ps, frames=pf, filt=white)}</g></g>')
        for r, colour, dash, width in [(44, soul, "8 5", 3.5), (32, "#6f8cff", "0", 2.5)]:
            ring = sc.keyframes(sc.uid("ri"), period, [(pct(p), v) for p, v in win([(0, "transform:scale(.2) rotate(0deg);opacity:0"), (36, "transform:scale(.2) rotate(0deg);opacity:0"),
                                                                                    (42, "opacity:1"), (58, "transform:scale(1.4) rotate(200deg);opacity:1"),
                                                                                    (66, "transform:scale(1.8) rotate(300deg);opacity:0"), (100, "transform:scale(1.8) rotate(300deg);opacity:0")], k)], "ease-out")
            out.append(f'<g class="tb {ring}"><circle cx="{x:.1f}" cy="{cy:.1f}" r="{r}" fill="none" stroke="{colour}" stroke-width="{width}" stroke-dasharray="{dash}"/></g>')
        sc.defs.append(f'<linearGradient id="pil{k}" x1="0" x2="1"><stop offset="0" stop-color="{soul}" stop-opacity="0"/><stop offset=".3" stop-color="{soul}"/>'
                       f'<stop offset=".5" stop-color="#fff"/><stop offset=".7" stop-color="#6f8cff"/><stop offset="1" stop-color="#6f8cff" stop-opacity="0"/></linearGradient>')
        pillar = sc.keyframes(sc.uid("pi"), period, [(pct(p), v) for p, v in win([(0, "transform:scaleX(.1);opacity:0"), (40, "transform:scaleX(.1);opacity:0"),
                                                                                   (48, "transform:scaleX(1);opacity:.9"), (56, "transform:scaleX(1.5);opacity:1"),
                                                                                   (62, "transform:scaleX(2);opacity:0"), (100, "transform:scaleX(2);opacity:0")], k)], "ease")
        out.append(f'<g class="tb {pillar}"><rect x="{x - 14:.1f}" y="0" width="28" height="{GROUND + 4}" fill="url(#pil{k})"/></g>')
        # The fused form in its afterglow; Armarouge's fusion swings the sword, then fires the cannon
        fsheet = Sheet(fused_name, "Idle")
        ff = sc.frames_class(fsheet)
        glow = f'<g opacity=".45">{sc.sprite(fsheet, 0, x, GROUND, hs * 1.04, frames=ff, filt=aura)}</g>'
        out.append(f'<g class="{kf([(0,0),(56,0),(58,1),(62,0),(100,0)], k)}">{sc.sprite(fsheet, 0, x, GROUND, hs, frames=ff, filt=white)}</g>')
        if name == "armarouge":
            combo = Sheet(fused_name, "Combo")
            out.append(f'<g class="{kf([(0,0),(60,0),(62,1),(68,1),(68.5,0),(86,0),(86.5,1),(90,1),(93,0),(100,0)], k)}">{glow}{sc.sprite(fsheet, 0, x, GROUND, hs, frames=ff)}</g>')
            out.append(f'<g class="{kf([(0,0),(68,0),(68.5,1),(86,1),(86.5,0),(100,0)], k)}">{sc.sprite(combo, 0, x, GROUND, hs, speed=.8)}</g>')
        else:
            out.append(f'<g class="{kf([(0,0),(60,0),(63,1),(90,1),(93,0),(100,0)], k)}">{glow}{sc.sprite(fsheet, 0, x, GROUND, hs, frames=ff)}</g>')
        out.append(f'<g class="{kf([(0, 0), (54, 0), (57, .9), (66, 0), (100, 0)], k)}"><ellipse cx="{x:.1f}" cy="{cy:.1f}" rx="80" ry="110" fill="url(#flash)"/></g>')
    return "".join(out)


def iron_valiant(sc, x, period=9.0):
    """Twirls, then its special attack, then twirls again."""
    twirl, special = Sheet("ironvaliant", "Twirl"), Sheet("ironvaliant", "SpAttack")
    s = fit(twirl, 0, 1.0 * F)
    a = opacity(sc, period, [(0, 1), (62, 1), (62.5, 0), (84, 0), (84.5, 1), (100, 1)])
    b = opacity(sc, period, [(0, 0), (62, 0), (62.5, 1), (84, 1), (84.5, 0), (100, 0)])
    return f'<g class="{a}">{sc.sprite(twirl, 0, x, GROUND, s)}</g><g class="{b}">{sc.sprite(special, 0, x, GROUND, fit(special, 0, s), speed=.7)}</g>'


def yveltal(sc, x, period=12.0):
    """Hovers on its wingbeat, bobbing, and now and then spreads its special."""
    idle, special = Sheet("yveltal", "Idle"), Sheet("yveltal", "Shoot")
    s = fit(idle, 0, species_scale("yveltal") * F * .8)
    bob = sc.keyframes(sc.uid("b"), 2.2, [("0%,100%", "transform:translateY(0)"), ("50%", "transform:translateY(-6px)")], "ease-in-out")
    a = opacity(sc, period, [(0, 1), (66, 1), (67, 0), (92, 0), (93, 1), (100, 1)])
    b = opacity(sc, period, [(0, 0), (66, 0), (67, 1), (92, 1), (93, 0), (100, 0)])
    shadow = f'<ellipse cx="{x:.1f}" cy="{GROUND + 1}" rx="22" ry="4" fill="#000" opacity=".12"/>'
    return (f'{shadow}<g class="{bob}"><g class="{a}">{sc.sprite(idle, 0, x, GROUND - 18, s)}</g>'
            f'<g class="{b}">{sc.sprite(special, 0, x, GROUND - 6, fit(special, 0, s))}</g></g>')


def render(theme):
    T = THEMES[theme]
    sc = Scene(W, H)
    sc.css.append(".tb{transform-box:fill-box;transform-origin:center}.spin{animation:spin 2.4s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}")
    stops = "".join(f'<stop offset="{i / 4:.2f}" stop-color="{c}"/>' for i, c in enumerate(RAINBOW))
    sc.defs.append(f'<linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1">{stops}</linearGradient>'
                   f'<radialGradient id="orb"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#ffd3f3"/><stop offset="1" stop-color="#b36aff" stop-opacity="0"/></radialGradient>'
                   f'<radialGradient id="flash"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'
                   f'<radialGradient id="dim"><stop offset="0" stop-color="#0b0d1a" stop-opacity=".8"/><stop offset=".6" stop-color="#0b0d1a" stop-opacity=".4"/><stop offset="1" stop-color="#0b0d1a" stop-opacity="0"/></radialGradient>'
                   f'<clipPath id="card"><rect x="1" y="1" width="{W - 2}" height="{H - 2}" rx="13"/></clipPath>')
    body = [f'<line x1="24" y1="{GROUND + 2}" x2="{W - 24}" y2="{GROUND + 2}" stroke="{T["path"]}" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round"/>']
    diancie, ceruledge, greninja, dragonite, valiant, yv = SLOTS
    body.append(mega_slot(sc, diancie, ("diancie", "Idle", 0), ("mega-diancie", "Idle", 0), "diancite", 15.0, 0.0, 1.35, 1.0))
    body.append(unison(sc, ceruledge))
    body.append(mega_slot(sc, greninja, ("greninja", "Idle", 0), ("mega-greninja", "Idle", 0), "greninjite", 15.0, -5.0, 1.15, 1.0))
    body.append(mega_slot(sc, dragonite, ("dragonite", "Idle", 0), ("shiny-mega-dragonite", "Walk", 0), "dragoninite", 15.0, -10.0, 1.0, 1.0))
    body.append(iron_valiant(sc, valiant))
    body.append(yveltal(sc, yv))
    # Dratini and its shiny partner patrol the path along the bottom, a little apart
    body.append(sc.walker("shiny-dratini", 60, W - 60, H - 12, 38, delay=-7, scale=1.4))
    body.append(sc.walker("dratini", 60, W - 60, H - 12, 38, delay=-9.3, scale=1.4))
    sc.body = [f'<rect x=".5" y=".5" width="{W - 1}" height="{H - 1}" rx="14" fill="{T["panel"]}"/>',
               f'<g clip-path="url(#card)">{"".join(body)}</g>',
               f'<rect x=".5" y=".5" width="{W - 1}" height="{H - 1}" rx="14" fill="none" stroke="{T["border"]}"/>']
    return sc.svg("Diancie, Ceruledge, Greninja, Dragonite, Iron Valiant and Yveltal: Mega Evolution and Soul Unison")


if __name__ == "__main__":
    out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
    for theme in THEMES:
        (out / f"playground-{theme}.svg").write_text(render(theme), encoding="utf-8")
        print(theme, (out / f"playground-{theme}.svg").stat().st_size)
