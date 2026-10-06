"""Voracity's tab mascots as small animated SVG icons for README section headings.
Idle row 0 (facing the viewer), cropped to the frame bounds, per-frame durations kept."""
import base64, json, struct, sys
from pathlib import Path
from pmd import SRC, META
EXTRA = {"jirachi": SRC / "src/pokemon/jirachi-tabs.json", "diancie-tab": SRC / "src/pokemon/diancie-tabs.json"}
HEIGHT = 26  # fixed icon height; feet sit on the bottom edge (the text baseline)
from PIL import Image
import io
out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
for name in ["teddiursa", "fuecoco", "froakie", "jirachi", "diancie-tab"]:
    anim = (json.loads(EXTRA[name].read_text()) if name in EXTRA else META[name]["animations"])["Idle"]
    png = (SRC / "public" / anim["src"].lstrip("/")).read_bytes()
    sw, sh = struct.unpack(">II", png[16:24])
    n = len(anim["durations"])
    im = Image.open(io.BytesIO(png)).convert("RGBA")
    boxes = [im.crop((c * anim["w"], 0, (c + 1) * anim["w"], anim["h"])).getbbox() for c in range(n)]
    boxes = [b for b in boxes if b]
    l, t, r, b = min(x[0] for x in boxes), min(x[1] for x in boxes), max(x[2] for x in boxes), max(x[3] for x in boxes)
    w, h = r - l, b - t
    SCALE = HEIGHT / h
    total = sum(anim["durations"])
    stops, acc = [], 0
    for i, d in enumerate(anim["durations"]):
        stops.append(f"{acc / total * 100:.3f}%{{transform:translateX(-{i * anim['w']}px)}}"); acc += d
    css = (f"image{{image-rendering:pixelated}}.f{{animation:f {total * 16 / 1000:.2f}s step-end infinite}}"
           f"@keyframes f{{{''.join(stops)}100%{{transform:translateX(-{(n - 1) * anim['w']}px)}}}}"
           "@media (prefers-reduced-motion:reduce){.f{animation:none}}")
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{round(w * SCALE)}" height="{HEIGHT}" viewBox="{l} {t} {w} {h}">'
           f'<style>{css}</style><g class="f"><image href="data:image/png;base64,{base64.b64encode(png).decode()}" '
           f'width="{sw}" height="{sh}"/></g></svg>')
    (out / f"mascot-{name.replace('-tab', '')}.svg").write_text(svg, encoding="utf-8")
    print(name, round(w * SCALE), HEIGHT, len(svg))
