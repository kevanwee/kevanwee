# readme_art — the profile README's Pokémon art

Every animated card on the profile README is a self-contained SVG: sprites are embedded as base64 and the animation is CSS inside the file, because GitHub shows README SVGs as images (no scripts). Each themed piece has a light and a dark file, chosen by `<picture>`.

| Script | Makes |
|---|---|
| `gen_contribution_garden.py` | The contribution garden: the year's contributions (an RGB-keyboard rainbow wave, shared with Voracity and the portfolio) beside Voracity's Eevee forest, with the Eeveelutions roaming |
| `build_playground.py` | Mega Evolution (Diancie, Greninja, Dragonite) and Soul Unison (Ceruledge with Darkrai, Zygarde, Armarouge), with Iron Valiant and Yveltal |
| `build_cards.py` | Project cards, the paths between sections, the skill trees and the fresh-off-the-stove card |
| `build_more.py` | Header plate, nav and contact chips, signboards and note cards |
| `gen_mascots.py` | Heading mascots (Voracity's tab Pokémon) |
| `build_readme.py` | `more.md` → the repository's `README.md` |
| `sky.py` | The sky over the garden's forest: Singapore's time of day and NEA's 2-hour forecast, Mystery Dungeon style. Voracity and the portfolio share the rules (`forest-sky.ts`) |
| `build_log.py` | The message log: recent activity as a Mystery Dungeon dialogue box with Diancie's portrait, typed out line by line. Also writes `readme/art/activity.json`, which Voracity's and the portfolio's dialogue boxes read |
| `build_pmdui.py` | Explorer Rank (Explorers of Sky's ladder, points = all-time contributions; badges from Explorers of Time/Darkness and Sky) and Castform's 24-hour weather forecast for Singapore (NEA), with a shiny Castform beside it in the same form, in Mystery Dungeon's navy UI |
| `regrow.py` | Every two hours: the garden with its sky and the open card spots (see `.github/workflows/readme-garden.yml`) |

`pmd.py` is the shared library: sprite sheets cropped to the rows used, frame timing from PMD durations, walkers, eight-direction roamers and Silvally's form changes. `cast.py` says which Pokémon stands where (each appears once), and `data.py` holds the project list and skill trees.

## Sprites

- `sprites/`: the owner's picks from [PMD Sprite Collab](https://sprites.pmdcollab.org/), fetched by `fetch_sprites.py` (`sprites/extra.json` records frame sizes and durations).
- `assets/voracity/`: the subset of Voracity's sprites the daily regrow needs.
- A full rebuild needs a Voracity checkout: `VORACITY_SRC=/path/to/voracity`.
- `stones/`: Mega Stone icons via PokeAPI. `mega-symbol.png`: the Mega Evolution symbol by pixelthecollector.
- `areas/thunder-meadow.png`: Thunder Meadow, Castform's friend area in Pokémon Mystery Dungeon: Red/Blue Rescue Team (via the Mystery Dungeon Wiki).
- `ranks/`: Explorer Rank badges from Pokémon Mystery Dungeon: Explorers of Time/Darkness and Sky (via the Mystery Dungeon Wiki).
- `portraits/`: Diancie's PMD portraits (PMD Sprite Collab). `fonts/`: Pixelify Sans (SIL Open Font License, `fonts/OFL.txt`).

## Private activity in the message log

Diancie's lightweight `diancie-activity.yml` workflow runs every five minutes,
on profile-repository pushes, on manual dispatch, and on `refresh-activity`
repository-dispatch events. It updates both `message-log.svg` and `activity.json`.
The garden retains its two-hour schedule and no longer overwrites these files.
Both workflows share a concurrency group so their commits cannot race.
The websites revalidate the shared snapshot every 30 seconds while visible,
on focus and on returning to a stale tab; relative ages update without replaying
unchanged dialogue. If another tab refreshed the cache, its data is adopted.
Unchanged rendered text and event lines do not create another commit. Vercel's
existing ignore command skips deployments when only README artwork changes.

Five minutes is a scheduling target, not a latency guarantee: GitHub can delay
Actions, event feeds and README image caching. Cross-repository pushes do not
trigger a profile push workflow. For immediate event-driven refreshes, a caller
must dispatch `refresh-activity` to this repository using a narrowly scoped
credential with the required write permission. The existing `LOG_TOKEN` is
read-only; do not expose it in a browser or broaden/reuse it as a dispatch token.
The dispatch payload is ignored: content still comes from GitHub's trusted feed
and passes the same private-repository redaction.

To request a refresh now:
`gh workflow run diancie-activity.yml --repo kevanwee/kevanwee --ref main`.

With a `LOG_TOKEN` repository secret (a fine-grained, read-only token; give it "All repositories" to cover every
private repo), the workflow adds the activity feed of every private repo the token can read to the public one. The log
keeps only kevanwee's own events (so the bot's regrow commits never appear), never shows titles or commit messages,
names only the private repos in `PRIVATE_SHOWN` (build_log.py, with their PR numbers), and shows every other private
repo unnamed as "a hidden dungeon", without PR numbers. Without the secret it uses public activity.

## Rebuild everything

```bash
cd genpokemon/readme_art
export VORACITY_SRC=/path/to/voracity
curl -s "https://github-contributions-api.jogruber.de/v4/kevanwee?y=last" -o contributions.json
python data.py
python gen_contribution_garden.py contributions.json ../../readme/art
python build_playground.py ../../readme/art
python build_cards.py ../../readme/art
python build_more.py ../../readme/art
python gen_mascots.py ../../readme/art
python build_readme.py && cp more.md ../../README.md
```
