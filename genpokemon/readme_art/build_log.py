"""The message log: recent public GitHub activity as a Pokémon Mystery Dungeon dialogue box, with
Diancie's portrait (PMD Sprite Collab, 40×40 at 2×) and each line typed out in turn.

    python build_log.py events.json ../../readme/art
    events.json: public activity (users/kevanwee/events/public) merged with each allowlisted private repo's
                 own feed (repos/kevanwee/voracity/events, read with LOG_TOKEN); see the workflow.

The box is the game's own dark UI, so one SVG serves both themes.
"""
import base64, datetime as dt, html, json, sys
from pathlib import Path
from build_cards import width

HERE = Path(__file__).parent
USER, NAME = "kevanwee", "Kevan"
SKIP = {"kevanwee/kevanwee"}  # the profile repo itself: its README commits would drown the rest
# Private repos the log may name (with LOG_TOKEN the feed includes private work). Names and PR numbers
# only, never titles or commit messages; every other private repo stays out.
PRIVATE_SHOWN = {"kevanwee/voracity"}
W, H = 910, 196
BOX = dict(x=118, y=14, w=W - 132, h=H - 28)
LINE_SIZE, LINE_GAP, FIRST_LINE = 15, 27, 66
COLOURS = {"text": "#f8f8f8", "name": "#f8e058", "place": "#68d0f8", "number": "#90f090", "faint": "#8f9ac2"}
FONT = base64.b64encode((HERE / "fonts/PixelifySans.woff2").read_bytes()).decode()
TYPE_MS, HOLD_S = 34, 7.0


def ago(when, now):
    days = (now.date() - when.date()).days
    hours = int((now - when).total_seconds() // 3600)
    if hours < 1: return "just now"
    if days == 0: return f"{hours}h ago"
    if days == 1: return "yesterday"
    return f"{days} days ago"


def short(repo):
    owner, name = repo.split("/")
    return name if owner == USER else repo


def lines_from(events, now, limit=4):
    """Newest first; pushes to one repo on one day become one line."""
    out, seen_push, merged = [], {}, set()
    for e in events:
        if e["type"] == "PullRequestEvent" and e["payload"].get("action") == "merged":
            merged.add((e["repo"]["name"], e["payload"].get("number")))
    for e in events:
        repo = e["repo"]["name"]
        if repo in SKIP or (e.get("public") is False and repo not in PRIVATE_SHOWN): continue
        if e.get("actor", {}).get("login", USER) != USER: continue  # repo feeds include bots and others
        when = dt.datetime.fromisoformat(e["created_at"].replace("Z", "+00:00"))
        p, kind = e.get("payload", {}), e["type"]
        if kind == "PushEvent":
            key = (repo, when.date())
            if key in seen_push: seen_push[key]["n"] += 1; continue
            item = {"mood": "Happy", "when": when, "n": 1, "parts": [("name", NAME), ("text", " pushed new work to "), ("place", short(repo)), ("text", "!")]}
            seen_push[key] = item; out.append(item); continue
        if kind == "PullRequestEvent":
            number, action = p.get("number"), p.get("action")
            if action == "merged":
                out.append({"mood": "Joyous", "when": when, "parts": [("name", NAME), ("text", "'s pull request "), ("number", f"#{number}"), ("text", " was merged into "), ("place", short(repo)), ("text", "!")]})
            elif action == "opened" and (repo, number) not in merged:
                out.append({"mood": "Normal", "when": when, "parts": [("name", NAME), ("text", " opened pull request "), ("number", f"#{number}"), ("text", " on "), ("place", short(repo)), ("text", ".")]})
            continue
        if kind == "CreateEvent" and p.get("ref_type") == "repository":
            out.append({"mood": "Inspired", "when": when, "parts": [("text", "A new dungeon appeared: "), ("place", short(repo)), ("text", "!")]})
        elif kind == "ReleaseEvent":
            out.append({"mood": "Joyous", "when": when, "parts": [("place", short(repo)), ("text", " "), ("number", p.get("release", {}).get("tag_name", "")), ("text", " was released!")]})
        elif kind == "WatchEvent":
            out.append({"mood": "Normal", "when": when, "parts": [("name", NAME), ("text", " starred "), ("place", short(repo)), ("text", ".")]})
        elif kind == "ForkEvent":
            out.append({"mood": "Normal", "when": when, "parts": [("name", NAME), ("text", " forked "), ("place", short(repo)), ("text", ".")]})
    out.sort(key=lambda i: i["when"], reverse=True)
    for item in out:
        if item.get("n", 1) > 1:
            item["parts"] = item["parts"][:-1] + [("text", " ("), ("number", f"×{item['n']}"), ("text", ")")]
        item["parts"].append(("faint", f"  · {ago(item['when'], now)}"))
    return out[:limit]


def activity(lines, now):
    """The same lines for Voracity's and the portfolio's dialogue boxes (readme/art/activity.json):
    coloured parts without the trailing "· 2h ago", which each site works out from `when`."""
    return {"generatedAt": now.isoformat(timespec="seconds"), "speaker": "Diancie",
            "lines": [{"mood": l["mood"], "when": l["when"].isoformat(timespec="seconds"),
                       "parts": [[k, t] for k, t in l["parts"] if k != "faint"]} for l in lines]}


def render(lines):
    css = [f"@font-face{{font-family:Pix;src:url(data:font/woff2;base64,{FONT}) format('woff2');font-weight:400 700}}",
           "text{font-family:Pix,'Courier New',monospace;letter-spacing:.3px}", "image{image-rendering:pixelated}"]
    mood = lines[0]["mood"] if lines else "Normal"
    portrait = base64.b64encode((HERE / f"portraits/diancie-{mood}.png").read_bytes()).decode()
    navy, edge, inner = "#0e1736", "#a9bce4", "#34477c"
    b = BOX
    parts = [
        # Portrait frame
        f'<rect x="12" y="{b["y"]}" width="94" height="94" rx="8" fill="{navy}" stroke="{edge}" stroke-width="2"/>',
        f'<rect x="16" y="{b["y"] + 4}" width="86" height="86" rx="5" fill="none" stroke="{inner}"/>',
        f'<image href="data:image/png;base64,{portrait}" x="19" y="{b["y"] + 7}" width="80" height="80"/>',
        # Dialogue box (the typing covers stay inside it)
        f'<clipPath id="inside"><rect x="{b["x"] + 6}" y="{b["y"] + 6}" width="{b["w"] - 12}" height="{b["h"] - 12}"/></clipPath>',
        f'<rect x="{b["x"]}" y="{b["y"]}" width="{b["w"]}" height="{b["h"]}" rx="10" fill="{navy}" stroke="{edge}" stroke-width="2"/>',
        f'<rect x="{b["x"] + 4}" y="{b["y"] + 4}" width="{b["w"] - 8}" height="{b["h"] - 8}" rx="7" fill="none" stroke="{inner}"/>',
        f'<text x="{b["x"] + 22}" y="{b["y"] + 30}" font-size="16" font-weight="600" fill="{COLOURS["name"]}">Diancie</text>',
        f'<text x="{b["x"] + 22 + width("Diancie", 16) + 4:.0f}" y="{b["y"] + 30}" font-size="16" fill="{COLOURS["text"]}">:</text>',
    ]
    if not lines:
        lines = [{"parts": [("text", "It's quiet in the dungeon today...")]}]
    # Typewriter: a navy cover slides off each line, one character at a time, then the loop holds and restarts
    t, timings = 0.6, []
    for line in lines:
        chars = sum(len(s) for _, s in line["parts"])
        timings.append((t, chars * TYPE_MS / 1000, chars)); t += chars * TYPE_MS / 1000 + .35
    period = round(t + HOLD_S, 2)
    for i, (line, (start, dur, chars)) in enumerate(zip(lines, timings)):
        y = b["y"] + FIRST_LINE - 10 + i * LINE_GAP
        spans = "".join(f'<tspan fill="{COLOURS[k]}">{html.escape(s)}</tspan>' for k, s in line["parts"])
        text_w = sum(width(s, LINE_SIZE) * 1.08 for _, s in line["parts"]) + 8
        parts.append(f'<text x="{b["x"] + 22}" y="{y}" font-size="{LINE_SIZE}" xml:space="preserve">'
                     f'<tspan fill="#000" dx="1" dy="1" opacity="0">.</tspan>{spans}</text>')
        p0, p1 = start / period * 100, (start + dur) / period * 100
        name = f"ty{i}"
        css.append(f".{name}{{animation:{name} {period}s infinite both}}"
                   f"@keyframes {name}{{0%,{p0:.2f}%{{transform:translateX(0);animation-timing-function:steps({chars},end)}}"
                   f"{p1:.2f}%,98%{{transform:translateX({text_w:.0f}px)}}99%,100%{{transform:translateX(0)}}}}")
        parts.append(f'<g clip-path="url(#inside)"><rect class="{name}" x="{b["x"] + 18}" y="{y - LINE_SIZE}" width="{text_w + 12:.0f}" height="{LINE_SIZE + 9}" fill="{navy}"/></g>')
    # The continue arrow, blinking once the text is out
    p_done = (t - .2) / period * 100
    css.append(f".arrow{{animation:arrow {period}s infinite}}@keyframes arrow{{0%,{p_done:.2f}%{{opacity:0}}"
               + "".join(f"{p_done + k * (98 - p_done) / 8:.2f}%{{opacity:{1 if k % 2 == 0 else .15}}}" for k in range(1, 8)) + "98%,100%{opacity:0}}")
    ax, ay = b["x"] + b["w"] - 30, b["y"] + b["h"] - 22
    parts.append(f'<path class="arrow" d="M{ax} {ay} l12 0 l-6 8 z" fill="{COLOURS["text"]}"/>')
    css.append("@media (prefers-reduced-motion:reduce){*{animation:none!important}[class^=ty]{transform:translateX(2000px)}}")
    label = " / ".join("".join(s for _, s in l["parts"]) for l in lines)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-label="{html.escape(label)}">'
            f'<style>{"".join(css)}</style>{"".join(parts)}</svg>')


if __name__ == "__main__":
    events = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
    lines = lines_from(events, dt.datetime.now(dt.timezone.utc))
    for l in lines: print("".join(s for _, s in l["parts"]))
    (out / "message-log.svg").write_text(render(lines), encoding="utf-8")
    (out / "activity.json").write_text(json.dumps(activity(lines, dt.datetime.now(dt.timezone.utc)), indent=1), encoding="utf-8")
