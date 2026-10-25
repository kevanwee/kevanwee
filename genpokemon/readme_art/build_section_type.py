"""Match README section typography to the project cards, including GitHub light/dark.

Run from readme_art: python build_section_type.py ../../readme/art --update-readme
GitHub removes inline colour styles. Small, intrinsically sized SVG text fragments
retain the palette and wrap as inline images on narrow screens. Their alt text keeps
the original prose accessible; native h2/h3 elements preserve the heading hierarchy.
The daily garden renderer does not overwrite these assets.
"""
import argparse
import html
import json
import math
import re
from pathlib import Path

from build_cards import width
from pmd import tint

ROOT = Path(__file__).resolve().parents[2]
GROUPS = {
    "LegalTech": ("legaltech", "diancie"),
    "Process modelling & Scrum": ("process-scrum", None),
    "Agents & personal systems": ("agents-systems", "froakie"),
    "Other projects": ("other-projects", "jirachi"),
}
NOTES = ("Drafting remains private and links to the public guide. PDPA assessment is now public. "
         "BART is a team case study; LegalBenchmarks.ai is a Steering Committee contribution. "
         "Engineering checks do not certify legal conclusions.")


def contrast(a, b):
    def luminance(color):
        values = [int(color[i:i+2], 16) / 255 for i in (1, 3, 5)]
        values = [c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in values]
        return sum(c * weight for c, weight in zip(values, (.2126, .7152, .0722)))
    x, y = sorted((luminance(a), luminance(b)))
    return (y + .05) / (x + .05)


def ink(theme, hue, heading):
    palette = tint(theme, hue)
    color = palette["accent"] if heading else palette["muted" if theme == "dark" else "ink"]
    background = "#0d1117" if theme == "dark" else "#ffffff"
    while contrast(color, background) < 4.5:
        values = [int(color[i:i+2], 16) for i in (1, 3, 5)]
        values = [round(c * .85) if theme == "light" else round(c + (255-c)*.15) for c in values]
        color = "#" + "".join(f"{c:02x}" for c in values)
    return color


def svg(text, theme, hue, heading=False):
    size, height, baseline = (23, 34, 25) if heading else (13.5, 23, 17)
    family = 'Georgia, "Times New Roman", serif' if heading else 'Arial, Helvetica, sans-serif'
    # width() includes 7% wrapping slack for cards. Inline fragments need their
    # true advance width so that the next fragment does not gain a visible gap.
    measured = math.ceil(width(text, size, "serif" if heading else "sans") / 1.07) + 1
    color = ink(theme, hue, heading)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{measured}" height="{height}" '
            f'viewBox="0 0 {measured} {height}" role="img" aria-label="{html.escape(text, quote=True)}">'
            f'<title>{html.escape(text)}</title><text x="0" y="{baseline}" font-size="{size}" '
            f'fill="{color}" style="font-family:{html.escape(family, quote=True)}">'
            f'{html.escape(text)}</text></svg>\n')


def fragments(text):
    result, current = [], ""
    for word in text.split():
        proposed = (current + " " + word).strip()
        if current and width(proposed, 13.5) > 300:
            result.append(current)
            current = word
        else:
            current = proposed
    if current:
        result.append(current)
    return result


def picture(slug, text):
    return (f'<picture><source media="(prefers-color-scheme: dark)" '
            f'srcset="./readme/art/{slug}-dark.svg" />'
            f'<img src="./readme/art/{slug}-light.svg" alt="{html.escape(text, quote=True)}" /></picture>')


def generate(out, update_readme=False):
    out.mkdir(parents=True, exist_ok=True)
    text = (ROOT / "README.md").read_text(encoding="utf-8")

    def assets(slug, copy, hue, heading=False):
        for theme in ("light", "dark"):
            (out / f"{slug}-{theme}.svg").write_text(svg(copy, theme, hue, heading), encoding="utf-8")
        return picture(slug, copy)

    def replace_section(key, old, new):
        nonlocal text
        start, end = f"<!-- section-type:{key}:start -->", f"<!-- section-type:{key}:end -->"
        replacement = start + "\n" + new + "\n" + end
        if start in text:
            text = re.sub(re.escape(start) + r".*?" + re.escape(end), lambda _: replacement,
                          text, count=1, flags=re.S)
        elif old in text:
            text = text.replace(old, replacement, 1)
        else:
            raise ValueError(f"Cannot locate the existing {key} section; inspect before replacing")

    main = assets("heading-projects", "skills & projects", "froakie", True)
    replace_section("projects", '<h2 align="center">skills &amp; projects</h2>',
                    f'<h2 align="center">{main}</h2>')
    groups = json.loads((Path(__file__).parent / "projects.json").read_text(encoding="utf-8"))
    for group in groups:
        title, description = group["title"], group["description"]
        slug, hue = GROUPS[title]
        heading = assets("heading-" + slug, title, hue, True)
        body = "\n".join(assets(f"copy-{slug}-{i}", fragment, hue)
                         for i, fragment in enumerate(fragments(description), 1))
        old = f'<h3>{html.escape(title)}</h3>\n<p>{html.escape(description)}</p>'
        replace_section(slug, old, f'<h3>{heading}</h3>\n<p>\n{body}\n</p>')
    notes = "\n".join(assets(f"copy-project-notes-{i}", fragment, "froakie")
                       for i, fragment in enumerate(fragments(NOTES), 1))
    replace_section("notes", f"<p>{NOTES}</p>", f"<p>\n{notes}\n</p>")
    if update_readme:
        (ROOT / "README.md").write_text(text, encoding="utf-8", newline="\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("out", type=Path)
    parser.add_argument("--update-readme", action="store_true")
    args = parser.parse_args()
    generate(args.out, args.update_readme)
    print("Rendered themed project headings, descriptions and notes.")
