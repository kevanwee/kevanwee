"""Daily regrow (run by .github/workflows/readme-garden.yml): the contribution garden and the
fresh-off-the-stove card, from today's contribution calendar and repository list. Uses only the
bundled sprites in assets/ and sprites/, so it runs without a Voracity checkout.

    python regrow.py contributions.json repos.json ../../readme/art
"""
import datetime as dt, json, sys
from pathlib import Path
import build_cards
import gen_contribution_garden as garden
from pmd import THEMES

contrib, repos_file, out = sys.argv[1:4]
data = json.loads(Path(contrib).read_text(encoding="utf-8"))
repos = [r for r in json.loads(Path(repos_file).read_text(encoding="utf-8")) if not r["isPrivate"] and not r["isFork"] and r["name"] != "kevanwee"]
repos.sort(key=lambda r: r["pushedAt"], reverse=True)
out = Path(out)
for theme in THEMES:
    (out / f"contribution-garden-{theme}.svg").write_text(garden.render(data, theme), encoding="utf-8")
    (out / f"stove-{theme}.svg").write_text(build_cards.stove_card(theme, repos, dt.date.today()), encoding="utf-8")
print("regrown", data["total"]["lastYear"], "contributions,", len(repos), "repositories")
