"""The forest's sky: time of day in Singapore and the weather from NEA's 2-hour forecast, drawn in
Pokémon Mystery Dungeon's manner (palette shifts for dawn, dusk and night; diagonal rain streaks;
lightning; drifting fog; cloud shadows). Voracity and the portfolio mirror these rules in
src/pokemon/forest-sky.ts, so all three forests show the same sky.

    python sky.py            # prints the current sky as JSON
"""
import datetime as dt, json, re, urllib.request
from zoneinfo import ZoneInfo

SGT = ZoneInfo("Asia/Singapore")
AREA = "City"  # NEA forecast area (Singapore's 47 areas); "City" covers the CBD and SMU
NEA = "https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast"
OPEN_METEO = "https://api.open-meteo.com/v1/forecast?latitude=1.2966&longitude=103.8500&current=weather_code&timezone=Asia%2FSingapore"


def phase_at(now):
    """Dawn 06:30–08:00, day, dusk 17:30–19:30, night (Singapore's sun barely moves through the year)."""
    m = now.hour * 60 + now.minute
    if 390 <= m < 480: return "dawn"
    if 480 <= m < 1050: return "day"
    if 1050 <= m < 1170: return "dusk"
    return "night"


def weather_of(forecast):
    """NEA forecast text → (kind, intensity). Kinds: clear, sunny, cloudy, rain, storm, fog, windy."""
    f = (forecast or "").lower()
    if "thunder" in f: return "storm", 3 if "heavy" in f else 2
    if any(w in f for w in ("rain", "shower", "drizzle")):
        return "rain", 3 if "heavy" in f else 1 if ("light" in f or "passing" in f or "drizzle" in f) else 2
    if any(w in f for w in ("haz", "mist", "fog")): return "fog", 2 if "haz" in f and "slightly" not in f else 1
    if "wind" in f: return "windy", 1
    if "cloud" in f or "overcast" in f: return "cloudy", 2 if f.startswith("cloudy") else 1
    if "warm" in f or "sunny" in f: return "sunny", 1
    return "clear", 0


def weather_of_wmo(code):
    """Open-Meteo's WMO code → (kind, intensity), the fallback when NEA is unreachable."""
    if code in (95, 96, 99): return "storm", 2
    if code in (51, 53, 55, 56, 57, 61, 80): return "rain", 1
    if code in (63, 81): return "rain", 2
    if code in (65, 66, 67, 82): return "rain", 3
    if code in (45, 48): return "fog", 1
    if code in (2, 3): return "cloudy", 1 if code == 2 else 2
    return "clear", 0


def fetch(area=AREA, now=None):
    now = now or dt.datetime.now(SGT)
    sky = {"phase": phase_at(now), "at": now.isoformat(timespec="minutes"), "area": area}
    try:
        req = urllib.request.Request(NEA, headers={"User-Agent": "kevanwee-readme"})
        item = json.load(urllib.request.urlopen(req, timeout=20))["data"]["items"][0]
        forecast = next(f["forecast"] for f in item["forecasts"] if f["area"] == area)
        sky.update(source="NEA", forecast=forecast)
        sky["kind"], sky["intensity"] = weather_of(forecast)
    except Exception:
        code = json.load(urllib.request.urlopen(OPEN_METEO, timeout=20))["current"]["weather_code"]
        sky.update(source="Open-Meteo", forecast=f"WMO {code}")
        sky["kind"], sky["intensity"] = weather_of_wmo(code)
    if sky["kind"] == "sunny" and sky["phase"] == "night": sky["kind"] = "clear"
    return sky


# ---- Drawing (SVG). Colours are shared with forest-sky.ts ----
PHASE_TINT = {  # (colour, opacity, blend)
    "dawn": [("#ffb4a0", .22, "soft-light"), ("#ffd2b4", .14, "screen")],
    "dusk": [("#ff8a4c", .38, "multiply"), ("#ffb35c", .24, "soft-light"), ("#6a3d9a", .08, "multiply")],
    "night": [("#1f2d78", .62, "multiply"), ("#3a4fb5", .10, "screen")],
}
WEATHER_TINT = {
    "sunny": [("#fff1b0", .18, "screen")],
    "cloudy": [("#9aa3ad", .30, "multiply")],
    "rain": [("#7f8ea3", .34, "multiply")],
    "storm": [("#5d6a80", .46, "multiply")],
    "fog": [("#e8ecef", .30, "screen")],
}
LABELS = {"clear": "Clear", "sunny": "Sunny", "cloudy": "Cloudy", "rain": "Rain", "storm": "Thunderstorm", "fog": "Fog", "windy": "Windy"}


def overlay(sc, x, y, w, h, kind, intensity, phase):
    """Weather and time-of-day layers over the area (x, y, w, h). Uses the scene's defs and CSS."""
    out = []
    tints = PHASE_TINT.get(phase, []) + WEATHER_TINT.get(kind, [])
    if kind == "sunny" and phase != "day": tints = PHASE_TINT.get(phase, [])
    for colour, alpha, blend in tints:
        out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{colour}" opacity="{alpha}" style="mix-blend-mode:{blend}"/>')

    if kind in ("cloudy", "rain", "storm"):  # cloud shadows drifting across
        sc.defs.append('<filter id="cloudblur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>')
        drift = sc.keyframes(sc.uid("cd"), 46, [("0%", "transform:translateX(0)"), ("100%", f"transform:translateX({w}px)")])
        blobs = "".join(f'<ellipse cx="{x + bx - w}" cy="{y + by}" rx="{rx}" ry="{ry}"/><ellipse cx="{x + bx}" cy="{y + by}" rx="{rx}" ry="{ry}"/>'
                        for bx, by, rx, ry in [(40, 50, 60, 26), (170, 120, 70, 30), (90, 190, 55, 22), (240, 40, 40, 18)])
        out.append(f'<g class="{drift}" fill="#1c2430" opacity="{.16 if kind == "cloudy" else .22}" filter="url(#cloudblur)" style="mix-blend-mode:multiply">{blobs}</g>')

    if kind in ("rain", "storm"):  # diagonal streaks, two or three depths
        layers = {1: [(.55, .95, 1)], 2: [(.5, .95, 1), (.8, .6, 1.2)], 3: [(.55, .9, 1), (.85, .55, 1.2), (.7, .42, 1.4)]}[min(3, max(1, intensity))]
        for i, (alpha, secs, width) in enumerate(layers):
            pid = sc.uid("rain")
            sc.defs.append(f'<pattern id="{pid}" width="32" height="48" patternUnits="userSpaceOnUse">'
                           f'<g stroke="#d8ecff" stroke-width="{width}" stroke-linecap="round">'
                           f'<line x1="{6 + i * 7}" y1="2" x2="{2 + i * 7}" y2="13"/><line x1="{22 - i * 3}" y1="20" x2="{18 - i * 3}" y2="31"/>'
                           f'<line x1="{30 - i * 5}" y1="36" x2="{26 - i * 5}" y2="47"/></g></pattern>')
            fall = sc.keyframes(sc.uid("rf"), secs, [("0%", "transform:translate(0,0)"), ("100%", "transform:translate(-32px,96px)")])
            out.append(f'<g class="{fall}" opacity="{alpha}"><rect x="{x}" y="{y - 96}" width="{w + 32}" height="{h + 96}" fill="url(#{pid})"/></g>')

    if kind == "storm":  # lightning: two quick flashes every few seconds
        flash = sc.keyframes(sc.uid("lt"), 7.5, [("0%,58%", "opacity:0"), ("59%", "opacity:.75"), ("60.5%", "opacity:0"), ("62%", "opacity:.45"), ("63.5%,100%", "opacity:0")], "linear")
        out.append(f'<rect class="{flash}" x="{x}" y="{y}" width="{w}" height="{h}" fill="#f4f7ff"/>')

    if kind == "fog":  # two slow, opposite drifts of soft mist
        sc.defs.append('<filter id="mist" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="7"/></filter>')
        for k, (secs, alpha, ys) in enumerate([(60, .42 + .12 * intensity, (40, 120, 200)), (38, .30 + .1 * intensity, (80, 160, 230))]):
            sign = 1 if k == 0 else -1
            drift = sc.keyframes(sc.uid("fg"), secs, [("0%", "transform:translateX(0)"), ("100%", f"transform:translateX({sign * w}px)")])
            band = "".join(f'<ellipse cx="{x + cx0 + off}" cy="{y + cy0}" rx="70" ry="16"/>' for off in (-w, 0, w) for cx0, cy0 in zip((40, 150, 250), ys))
            out.append(f'<g class="{drift}" fill="#f2f5f7" opacity="{alpha}" filter="url(#mist)">{band}</g>')

    if kind == "windy":  # quick horizontal streaks
        pid = sc.uid("wind")
        sc.defs.append(f'<pattern id="{pid}" width="90" height="40" patternUnits="userSpaceOnUse"><g stroke="#ffffff" stroke-linecap="round" stroke-width="1.2" opacity=".6">'
                       '<line x1="4" y1="8" x2="26" y2="8"/><line x1="48" y1="27" x2="62" y2="27"/></g></pattern>')
        blow = sc.keyframes(sc.uid("wd"), .7, [("0%", "transform:translateX(0)"), ("100%", "transform:translateX(-90px)")])
        out.append(f'<g class="{blow}"><rect x="{x}" y="{y}" width="{w + 90}" height="{h}" fill="url(#{pid})"/></g>')

    if phase in ("night", "dusk") and kind not in ("rain", "storm"):  # fireflies over the clearing
        sc.defs.append('<filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="1.6"/></filter>')
        for i, (fxp, fyp) in enumerate([(.25, .55), (.62, .38), (.78, .7), (.4, .8), (.15, .3), (.55, .62), (.86, .25)][: 7 if phase == "night" else 3]):
            path = sc.keyframes(sc.uid("ff"), 9 + i * 1.7, [("0%,100%", "transform:translate(0,0)"), ("33%", f"transform:translate({8 + i}px,-{6 + i % 3 * 3}px)"),
                                                            ("66%", f"transform:translate(-{6 + i % 4 * 2}px,{4 + i % 2 * 5}px)")], "ease-in-out", -i * 1.3)
            blink = sc.keyframes(sc.uid("fb"), 2.4 + i * .37, [("0%,100%", "opacity:.15"), ("50%", "opacity:1")], "ease-in-out", -i * .4)
            out.append(f'<g class="{path}"><g class="{blink}"><circle cx="{x + w * fxp:.1f}" cy="{y + h * fyp:.1f}" r="2.4" fill="#fff6a0" filter="url(#glow)"/>'
                       f'<circle cx="{x + w * fxp:.1f}" cy="{y + h * fyp:.1f}" r="1" fill="#ffffe0"/></g></g>')
    return "".join(out)


def label(kind, phase):
    """Short caption, e.g. 'Rain · night'."""
    return f"{LABELS[kind]} · {phase}"


if __name__ == "__main__":
    print(json.dumps(fetch(), indent=1))
