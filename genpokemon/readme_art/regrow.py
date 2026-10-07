"""Daily regrow (run by .github/workflows/readme-garden.yml): the contribution garden and the
fresh-off-the-stove card from today's contribution calendar and repository list, the sky over the
forest (Singapore time and NEA's forecast, sky.py), the message log of recent activity (build_log.py),
and a fresh random Pokémon on every open spot in cast.py. Uses only the
bundled sprites in assets/ and sprites/, so it runs without a Voracity checkout.

    python regrow.py contributions.json repos.json ../../readme/art [events.json]
"""
import datetime as dt, json, sys
from pathlib import Path
import build_cards
import build_log
import cast
import gen_contribution_garden as garden
from pmd import THEMES
import sky as skies
import friend_areas

contrib, repos_file, out = sys.argv[1:4]
data = json.loads(Path(contrib).read_text(encoding="utf-8"))
repos = [r for r in json.loads(Path(repos_file).read_text(encoding="utf-8")) if not r["isPrivate"] and not r["isFork"] and r["name"] != "kevanwee"]
repos.sort(key=lambda r: r["pushedAt"], reverse=True)
out = Path(out)
sky = skies.fetch()
print("sky:", sky)
friend_area = friend_areas.choose()  # One draw shared by light and dark.
friend_guests = friend_areas.choose_guests(friend_area)  # Same visitors in both themes.
print("Friend Area:", friend_area)
for theme in THEMES:
    (out / f"contribution-garden-{theme}.svg").write_text(garden.render(data, theme, sky, friend_area, friend_guests), encoding="utf-8")
    (out / f"stove-{theme}.svg").write_text(build_cards.stove_card(theme, repos, dt.date.today()), encoding="utf-8")
# Re-roll the open spots
open_spots = {slug for slug, who in cast.CARDS.items() if who == cast.RANDOM}
cast.fill_open_spots()
for group in json.loads(Path("projects.json").read_text(encoding="utf-8")):
    for p in group["items"]:
        if p["slug"] not in open_spots: continue
        species, mode = cast.CARDS[p["slug"]]
        lang = build_cards.LANGS.get(p["repo"].lower(), (None, 0))[0] if p.get("repo") else None
        for theme in THEMES:
            (out / f'card-{p["slug"]}-{theme}.svg').write_text(build_cards.card(theme, p["title"], p["desc"], p.get("label", "github"), lang, p.get("tags", []), (species, mode), group["mascot"]), encoding="utf-8")
if len(sys.argv) > 4:  # the message log
    events = json.loads(Path(sys.argv[4]).read_text(encoding="utf-8"))
    now_utc = dt.datetime.now(dt.timezone.utc)
    lines = build_log.lines_from(events, now_utc)
    (out / "message-log.svg").write_text(build_log.render(lines), encoding="utf-8")
    (out / "activity.json").write_text(json.dumps(build_log.activity(lines, now_utc), indent=1), encoding="utf-8")
print("regrown", data["total"]["lastYear"], "contributions,", len(repos), "repositories")
