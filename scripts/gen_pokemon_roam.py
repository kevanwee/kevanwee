#!/usr/bin/env python3
"""Generate readme/pokemon-roam.svg with animated roaming Pokemon."""
import urllib.request, base64, struct, os

BASE = "https://raw.githubusercontent.com/kevanwee/theoffice/main"

sprite_urls = {
    "diancie":   BASE + "/Pokemon/DIANCIE.png",
    "ceruledge": BASE + "/Pokemon%20Shiny/CERULEDGE.png",
    "armarouge": BASE + "/Pokemon%20Shiny/ARMAROUGE.png",
    "charcadet": BASE + "/Pokemon%20Shiny/CHARCADET.png",
    "yveltal":   BASE + "/Pokemon%20Shiny/YVELTAL.png",
}

print("Downloading Pokemon sprites from kevanwee/theoffice...")
b64 = {}
for name, url in sprite_urls.items():
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        data = r.read()
    b64[name] = base64.b64encode(data).decode()
    print(f"  {name}: {len(data)} bytes")

# ---------------------------------------------------------------------------
# Pokemon movement configs
# ---------------------------------------------------------------------------
pokemon = [
    dict(
        key="diancie", label="Diancie",
        sheet_w=256, frame_w=64, display=64,
        row=0, is_shiny=False,
        dur="20s",
        values="30,155; 700,143; 700,143; 160,158; 520,148; 30,155",
        keyTimes="0; 0.28; 0.33; 0.62; 0.88; 1",
        bob_dur="0.45s",
    ),
    dict(
        key="ceruledge", label="Shiny Ceruledge",
        sheet_w=256, frame_w=64, display=64,
        row=0, is_shiny=True,
        dur="24s",
        values="660,145; 60,135; 60,135; 460,150; 660,145",
        keyTimes="0; 0.32; 0.40; 0.85; 1",
        bob_dur="0.38s",
    ),
    dict(
        key="armarouge", label="Shiny Armarouge",
        sheet_w=256, frame_w=64, display=64,
        row=0, is_shiny=True,
        dur="17s",
        values="280,157; 620,145; 380,160; 160,150; 280,157",
        keyTimes="0; 0.35; 0.60; 0.82; 1",
        bob_dur="0.42s",
    ),
    dict(
        key="charcadet", label="Shiny Charcadet",
        sheet_w=256, frame_w=64, display=48,
        row=0, is_shiny=True,
        dur="11s",
        values="420,162; 530,158; 310,165; 420,162",
        keyTimes="0; 0.30; 0.70; 1",
        bob_dur="0.30s",
    ),
    dict(
        key="yveltal", label="Shiny Yveltal",
        sheet_w=512, frame_w=128, display=88,
        row=0, is_shiny=True,
        dur="26s",
        values="60,120; 700,108; 700,108; 360,115; 60,120",
        keyTimes="0; 0.30; 0.40; 0.76; 1",
        bob_dur="0.70s",
    ),
]


def ks(n):
    return "; ".join(["0.4 0 0.6 1"] * n)


def make_pokemon_el(p):
    key   = p["key"]
    fw    = p["frame_w"]
    sw    = p["sheet_w"]
    dp    = p["display"]
    row   = p["row"]
    shiny = p["is_shiny"]

    scale         = dp / fw
    sheet_display = int(sw * scale)
    row_offset    = int(row * dp)   # = row * fw * scale
    half_dp       = dp // 2

    n_gaps    = len(p["values"].split(";")) - 1
    frame_xs  = "; ".join(f"{-i*dp},0" for i in range(4))
    sf        = ' filter="url(#shiny-glow)"' if shiny else ""
    sparkle   = (
        '\n        <animate attributeName="opacity"'
        ' values="0.82;1;0.85;1;0.82" dur="3.2s" repeatCount="indefinite"/>'
        if shiny else ""
    )

    return f"""
  <!-- {p["label"]} -->
  <g>
    <animateTransform attributeName="transform" type="translate"
      values="{p["values"]}"
      keyTimes="{p["keyTimes"]}"
      dur="{p["dur"]}" repeatCount="indefinite"
      calcMode="spline" keySplines="{ks(n_gaps)}"/>
    <animateTransform attributeName="transform" type="translate"
      values="0,0; 0,-3; 0,0"
      dur="{p["bob_dur"]}" repeatCount="indefinite"
      additive="sum" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"/>
    <g transform="translate(-{half_dp},-{dp})" clip-path="url(#clip{dp})"{sf}>
      <image href="data:image/png;base64,{b64[key]}"
             width="{sheet_display}" height="{sheet_display}"
             x="0" y="-{row_offset}"
             style="image-rendering:pixelated">
        <animateTransform attributeName="transform" type="translate"
          values="{frame_xs}"
          keyTimes="0; 0.333; 0.667; 1"
          dur="0.56s" repeatCount="indefinite" calcMode="discrete"/>{sparkle}
      </image>
    </g>
  </g>"""


pokemon_svgs = "\n".join(make_pokemon_el(p) for p in pokemon)

clip_sizes = sorted({p["display"] for p in pokemon})
clip_defs  = "\n".join(
    f'    <clipPath id="clip{s}"><rect width="{s}" height="{s}"/></clipPath>'
    for s in clip_sizes
)

svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200" width="800" height="200">
  <defs>
    <linearGradient id="sky-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#4A8DD4"/>
      <stop offset="55%"  stop-color="#87CEEB"/>
      <stop offset="100%" stop-color="#B8E4C0"/>
    </linearGradient>
    <linearGradient id="grass-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#7EC850"/>
      <stop offset="100%" stop-color="#4A9A26"/>
    </linearGradient>
    <filter id="shiny-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="0.3 0 0 0 0.5
                0 0.5 0 0 0.5
                0 0 1.5 0 0.4
                0 0 0 2 0" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
{clip_defs}
  </defs>

  <!-- Sky -->
  <rect width="800" height="140" fill="url(#sky-g)"/>

  <!-- Clouds -->
  <g opacity="0.90">
    <ellipse cx="120" cy="40" rx="60" ry="20" fill="white"/>
    <ellipse cx="84"  cy="52" rx="38" ry="14" fill="white"/>
    <ellipse cx="158" cy="51" rx="42" ry="14" fill="white"/>
    <ellipse cx="505" cy="33" rx="54" ry="18" fill="white"/>
    <ellipse cx="468" cy="44" rx="34" ry="13" fill="white"/>
    <ellipse cx="545" cy="43" rx="37" ry="13" fill="white"/>
    <ellipse cx="720" cy="56" rx="44" ry="16" fill="white"/>
    <ellipse cx="752" cy="65" rx="28" ry="11" fill="white"/>
  </g>

  <!-- Distant mountains -->
  <polygon points="0,118 75,74 155,118"    fill="#8AB5C8" opacity="0.45"/>
  <polygon points="85,118 190,64 300,118"  fill="#7AAABB" opacity="0.45"/>
  <polygon points="545,118 645,70 750,118" fill="#8AB5C8" opacity="0.45"/>
  <polygon points="675,118 758,76 840,118" fill="#7AAABB" opacity="0.40"/>

  <!-- Grass -->
  <rect y="136" width="800" height="64" fill="url(#grass-g)"/>
  <rect y="134" width="800" height="5"  fill="#8ACD55" opacity="0.75"/>

  <!-- Grass tufts -->
  <g fill="#54A628">
    <rect x="42"  y="132" width="3" height="7"/>
    <rect x="46"  y="130" width="3" height="9"/>
    <rect x="238" y="132" width="3" height="7"/>
    <rect x="242" y="130" width="3" height="9"/>
    <rect x="463" y="132" width="3" height="7"/>
    <rect x="467" y="130" width="3" height="9"/>
    <rect x="668" y="131" width="3" height="7"/>
    <rect x="672" y="129" width="3" height="9"/>
  </g>

  <!-- Flowers -->
  <circle cx="138" cy="134" r="2.5" fill="#FFD700"/>
  <circle cx="342" cy="133" r="2"   fill="#FF88CC"/>
  <circle cx="558" cy="134" r="2.5" fill="white"/>
  <circle cx="712" cy="133" r="2"   fill="#FFD700"/>
{pokemon_svgs}
</svg>
"""

out_dir = os.path.join(os.path.dirname(__file__), "..", "readme")
out_path = os.path.join(out_dir, "pokemon-roam.svg")
os.makedirs(out_dir, exist_ok=True)
with open(out_path, "w", encoding="utf-8") as f:
    f.write(svg)

print(f"\nWritten {len(svg):,} bytes → {os.path.abspath(out_path)}")
