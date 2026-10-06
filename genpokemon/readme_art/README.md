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
| `regrow.py` | Every two hours: the garden with its sky, the message log and the open card spots (see `.github/workflows/readme-garden.yml`) |

`pmd.py` is the shared library: sprite sheets cropped to the rows used, frame timing from PMD durations, walkers, eight-direction roamers and Silvally's form changes. `cast.py` says which Pokémon stands where (each appears once), and `data.py` holds the project list and skill trees.

## Sprites

- `sprites/`: the owner's picks from [PMD Sprite Collab](https://sprites.pmdcollab.org/), fetched by `fetch_sprites.py` (`sprites/extra.json` records frame sizes and durations).
- `assets/voracity/`: the subset of Voracity's sprites the daily regrow needs.
- A full rebuild needs a Voracity checkout: `VORACITY_SRC=/path/to/voracity`.
- `stones/`: Mega Stone icons via PokeAPI. `mega-symbol.png`: the Mega Evolution symbol by pixelthecollector.
- `portraits/`: Diancie's PMD portraits (PMD Sprite Collab). `fonts/`: Pixelify Sans (SIL Open Font License, `fonts/OFL.txt`).

## Private activity in the message log

With a `LOG_TOKEN` repository secret (a read-only token of kevanwee's), the log reads the signed-in feed, which includes
private work. It names only the private repos in `PRIVATE_SHOWN` (build_log.py), and only repo names and PR numbers.
Without the secret it uses public activity.

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
