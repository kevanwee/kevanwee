"""A+: more of the README drawn as self-contained SVGs: a header plate, nav chips, section
signboards, note cards and contact chips. Links stay real: each chip is its own linked image."""
import random, sys
from pathlib import Path
from pmd import Scene, Sheet, THEMES, species_scale, tint
from build_cards import width, wrap, resident, esc
import cast

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "out")


def plate(theme, title, lines, who, W=910, lane=50, title_size=26, italic_last=False, hue=None):
    """A card with a serif title and centred lines; residents stand on its top edge."""
    T = tint(theme, hue)
    wrapped = [l for line in lines for l in (wrap(line, 13.5, W - 80, lines=3) if line else [""])]
    body_h = (52 if title else 18) + len(wrapped) * 21 + 18
    H = lane + body_h
    sc = Scene(W, H)
    sc.body.append(f'<rect x=".5" y="{lane + .5}" width="{W - 1}" height="{body_h - 1}" rx="12" fill="{T["panel"]}" stroke="{T["border"]}"/>')
    y = lane + 18
    if title:
        y += 24
        sc.body.append(f'<text class="serif" x="{W / 2}" y="{y}" text-anchor="middle" font-size="{title_size}" fill="{T["ink"]}">{esc(title)}</text>')
        y += 10
    for i, line in enumerate(wrapped):
        y += 21
        style = ' font-style="italic"' if italic_last and i == len(wrapped) - 1 else ""
        sc.body.append(f'<text x="{W / 2}" y="{y}" text-anchor="middle" font-size="13.5"{style} fill="{T["muted"]}">{esc(line)}</text>')
    for species, mode, x0, x1 in who:
        sc.body.append(resident(sc, species, mode, x0, x1, lane + 1, 26))
    return sc.svg(title or " ".join(lines))


def sign(theme, text, who, W=460, hue=None):
    """A section signboard: serif title on a small board, one resident on top."""
    T, lane, bh = tint(theme, hue), 46, 58
    sc = Scene(W, lane + bh)
    sc.body.append(f'<rect x=".5" y="{lane + .5}" width="{W - 1}" height="{bh - 1}" rx="12" fill="{T["panel"]}" stroke="{T["border"]}"/>'
                   f'<text class="serif" x="{W / 2}" y="{lane + 37}" text-anchor="middle" font-size="22" fill="{T["accent"]}">{esc(text)}</text>')
    for species, mode, x0, x1 in who:
        sc.body.append(resident(sc, species, mode, x0, x1, lane + 1, 18))
    return sc.svg(text)


def chip(theme, label, species, H=38, hue=None):
    """A pill: a small idle Pokémon, then the label."""
    T = tint(theme, hue)
    sheet = Sheet(species, "Idle")
    l, t, r, b = sheet.bounds(0)
    s = 26 / (b - t)
    icon_w = (r - l) * s
    W = round(14 + icon_w + 8 + width(label, 13.5) + 16)
    sc = Scene(W, H)
    sc.body.append(f'<rect x=".5" y=".5" width="{W - 1}" height="{H - 1}" rx="{H / 2}" fill="{T["panel"]}" stroke="{T["border"]}"/>')
    sc.body.append(sc.sprite(sheet, 0, 14 + icon_w / 2, H - 6, s))
    sc.body.append(f'<text x="{14 + icon_w + 8:.0f}" y="{H / 2 + 5}" font-size="13.5" fill="{T["accent"]}">{esc(label)}</text>')
    return sc.svg(label)


NAV = [("cooking", "cooking", "fuecoco"), ("cuisines", "cuisines", "teddiursa"), ("recipes", "recipes", "froakie"), ("contacts", "contacts", "jirachi")]
CONTACTS = [("email", "kevan.wee.2023@scis.smu.edu.sg", cast.CHIPS["email"], "mailto:kevan.wee.2023@scis.smu.edu.sg"),
            ("linkedin", "linkedin", cast.CHIPS["linkedin"], "https://www.linkedin.com/in/kevanwee/"),
            ("instagram", "instagram", cast.CHIPS["instagram"], "https://www.instagram.com/kwjw30/"),
            ("art-instagram", "art · instagram", cast.CHIPS["art-instagram"], "https://www.instagram.com/van.fullofkebabs/"),
            ("tiktok", "art · tiktok", cast.CHIPS["tiktok"], "https://www.tiktok.com/@seofon30")]
SIGNS = {"cooking": ("what's cooking?", [("fuecoco", "walk", 60, 400)]),
         "cuisines": ("what cuisines do you specialise in?", [("teddiursa", "walk", 60, 400)]),
         "recipes": ("what recipes have you come up with?", [("froakie", "walk", 60, 400)]),
         "contacts": ("contacts!", [("jirachi", "idle", 380, 0)])}

if __name__ == "__main__":
    for theme in THEMES:
        w = lambda name, svg: (OUT / f"{name}-{theme}.svg").write_text(svg, encoding="utf-8")
        w("header", plate(theme, "welcome to the rat den", ["computing & law major · aspiring legal technologist · ex cartographer · intelligence practitioner · failing artist · coffee addict"],
                          [(cast.HEADER[0][0], cast.HEADER[0][1], 80, 830), (cast.HEADER[1][0], cast.HEADER[1][1], 120, 0), ("mega-diancie", "idle", 820, 0)]))
        for key, label, species in NAV:
            w(f"nav-{key}", chip(theme, label, species, hue=species))
        for key, label, species, _ in CONTACTS:
            w(f"contact-{key}", chip(theme, label, species, hue="jirachi"))
        for key, (text, who) in SIGNS.items():
            w(f"sign-{key}", sign(theme, text, who, hue=who[0][0]))
        w("note-cooking", plate(theme, "", ["probably some nissin laksa and a cup of instant coffee...", "",
                                             "a wise rat once said \"anyone can cook\" — i build everything and anything!"],
                                [(cast.NOTES["cooking"][0][0], "walk", 80, 830), (cast.NOTES["cooking"][1][0], "idle", 760, 0)], title_size=0, hue="fuecoco"))
        w("note-cuisines", plate(theme, "", ["as someone studying both computing and law, i suffer from every conceivable \"jack of all trades\" stereotype,",
                                              "but i primarily specialise in legaltech product management and digital transformation.", "",
                                              "(think video game where you refuse to pick a class and unlock skills in every tree)"],
                                 [(cast.NOTES["cuisines"][0][0], "walk", 80, 830), (cast.NOTES["cuisines"][1][0], "idle", 160, 0)], italic_last=True, hue="teddiursa"))
        w("note-contacts", plate(theme, "", ["want to talk about anything across tech, law and art?", "", "feel free to reach out!"],
                                 [(cast.NOTES["contacts"][0][0], "walk", 80, 830), (cast.NOTES["contacts"][1][0], "walk", 80, 830)], hue="jirachi"))
    print("ok")
