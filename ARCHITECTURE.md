# Architecture

This repository holds three things that share Pokémon artwork and data:

1. **The portfolio website** (`portfolio/`): a Next.js app at <https://kevanwee.vercel.app>.
2. **The GitHub profile README** (`README.md`, `readme/`): self-contained animated SVGs, regrown by
   scheduled GitHub Actions from `genpokemon/readme_art/`.
3. **Map generators** (`genpokemon/`): the Pokémon Emerald roaming SVGs in the README.

The HTML files at the repository root (`index.html`, `about.html`, …) are the earlier static
portfolio. They are kept for reference and are not deployed.

## System context

```mermaid
flowchart TB
    visitor(["👤 Visitor"])
    owner(["👤 Owner"])

    site["<b>Portfolio website</b><br/><i>Next.js on Vercel</i><br/>portfolio/"]
    readme["<b>Profile README</b><br/><i>SVG art in readme/art</i>"]
    actions["<b>GitHub Actions</b><br/>readme-garden (2 h)<br/>diancie-activity (5 min)"]

    gh["<b>GitHub</b><br/>REST API, raw files"]
    contrib["<b>Contributions API</b><br/>jogruber.de"]
    nea["<b>NEA forecasts</b><br/>data.gov.sg"]
    meteo["<b>Open-Meteo</b><br/><i>fallback</i>"]
    voracity["<b>Voracity</b><br/><i>sibling app, same artwork</i>"]

    visitor -->|HTTPS| site
    visitor -->|github.com/kevanwee| readme
    owner -->|push to main| site & actions
    actions -->|commits regrown SVGs<br/>and activity.json| readme
    actions --> contrib & nea & gh
    site -->|activity.json, stars| gh
    site --> contrib & nea
    site -.-> meteo
    voracity -.->|"reads activity.json, mirrors Friend Areas"| readme
```

Nothing runs on a server the owner operates. Vercel builds and serves the site and runs one small
API route. GitHub Actions regrows the README art on a schedule. Live data comes straight from
public APIs in the browser.

## Portfolio website (`portfolio/`)

Next.js 16 (App Router), React 19, TypeScript and Tailwind. Vercel deploys `main` automatically
and skips builds when nothing changed (`vercel.json`); pull requests get preview deployments.

### Routes

| Route | Source | Notes |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | The one-page portfolio |
| `/terminal` | `src/app/terminal/page.tsx` | A shell over the site's data (`lib/terminal-shell.ts`) |
| `/api/legalquants-stars` | `src/app/api/legalquants-stars/route.ts` | GitHub star count, uncached |
| 404 | `src/app/not-found.tsx` | "Looks like we're lost": a random crystal cave with Diancie, three Carbink and a lost shiny Psyduck (`LostCave.tsx`) |
| `robots.txt`, `sitemap.xml`, OG image | `src/app/robots.ts`, `sitemap.ts`, `opengraph-image.tsx` | |

### Page composition

```mermaid
flowchart LR
    page["page.tsx"]
    subgraph overlay["Page-wide layers"]
        cursor["PokemonCursor<br/>FusionWheel"]
        roam["PokemonOverworld<br/>YveltalRoamer<br/>TeddiursaRoamer"]
        pc["PokemonPcHost<br/><i>storage system</i>"]
    end
    subgraph left["LeftPanel"]
        hero["Profile · nav ·<br/>Poké Balls · music ·<br/>résumé · ssh launcher"]
    end
    subgraph main["Main column"]
        about["About"]
        exp["Experience<br/><i>ExperienceTimeline</i>"]
        proj["Projects<br/><i>garden · message log ·<br/>forecast</i>"]
        fa["FriendAreas<br/><i>EeveeBase · FriendAreaScene</i>"]
        media["MediaAppearances"]
        contact["Contact"]
    end
    page --> overlay & left & main
```

- **Pokémon layers.** The cursor companion, roaming overworld (Route 111 and Mauville maps in
  `public/worlds`), Yveltal and Teddiursa sit above the page. `lib/motion.ts` and
  `useAnimationVisibility` pause animation when it's offscreen, in a hidden tab or under reduced motion.
- **Pokémon PC** (`components/pc/`). One storage system: the left bar lists boxes (cursor
  companion, Transform Forest, one per Friend Area, free roaming). Choices persist in
  `localStorage` and apply to matching residents. See `portfolio/docs/POKEMON-PC.md`.
- **Friend Areas** (`FriendAreas.tsx`, `FriendAreaScene.tsx`, `friend-areas.ts`). Transform
  Forest (the Eevee garden) plus 72 areas from `public/friend-areas/catalog.json`.
- **Live data.** `lib/activity.ts` reads the README's `activity.json` for the dialogue box;
  `lib/contributions.ts` reads the contribution calendar; `lib/forecast.ts` reads NEA's
  forecast for Castform and the forest sky (`lib/forest-sky.ts`), with Open-Meteo as fallback.
  Each is cached in `localStorage` and refreshed while the tab is visible.

### Friend Areas pipeline

```mermaid
flowchart LR
    red["pret/pmd-red<br/><i>map_bg, monster_data</i>"]
    sky["pret/pmd-sky<br/><i>MAP_BG</i>"]
    sc["PMD SpriteCollab<br/><i>pinned revision</i>"]
    data["friend_area_data.py<br/><i>descriptions, visitors</i>"]
    rm["rescue_maps.py<br/>rescue_scenery.py"]
    ss["sky_scenery.py<br/><i>skytemple-files</i>"]
    fetch["fetch-friend-areas.py"]
    out["public/friend-areas/<br/>catalog.json, PNG strips,<br/>sprites/"]
    red --> rm --> fetch
    sky --> ss --> fetch
    sc --> fetch
    data --> fetch
    fetch --> out
```

- Scenery is decoded from the pret decompilations at pinned revisions; no ROM is used. Each
  area has a background, one transparent strip per animated palette or tile slot, and a
  `*-source.json` receipt with SHA-256 hashes.
- Walk zones come from the native collision layer for new areas, or are authored (the
  original eleven, and Explorers maps without collision).
- Residents: Rescue Team natives come from `monster_data.json`; Explorers rosters and 656 later-generation visitors are
  curated by family and habitat. A visit shows at most eight residents.
- Builds never fetch third-party assets. Regeneration is explicit:
  `python scripts/fetch-friend-areas.py --expand`. Details are in `docs/NATIVE-FRIEND-AREAS.md`.

### Tests

Node scripts in `portfolio/scripts/` (no test runner):

| Command | Covers |
| --- | --- |
| `npm run test:world`, `test:overworld`, `test:terminal` | World simulation, overworld behaviour, terminal commands |
| `npm run test:friend-areas` | Every area's assets and three ten-minute visits on walkable floor |
| `npm run test:*:browser` | Playwright checks against a running build (`BASE_URL`); set `PLAYWRIGHT_MODULE` if Playwright isn't installed locally |

## Profile README (`README.md`, `readme/`, `genpokemon/readme_art/`)

GitHub shows README SVGs as images, so every animated piece is a self-contained SVG with
embedded sprites and CSS animation, in light and dark variants chosen by `<picture>`.

```mermaid
flowchart LR
    build["build_readme.py<br/><i>drafts more.md</i>"] --> readmemd["README.md<br/><i>edited result</i>"]
    garden["readme-garden.yml<br/><i>every 2 h, on push</i>"] --> regrow["regrow.py<br/>build_pmdui.py"] --> art["readme/art/*.svg"]
    activity["diancie-activity.yml<br/><i>every 5 min</i>"] --> log["build_log.py"] --> art
    log --> json["readme/art/activity.json"]
    json -->|read by| sites["portfolio and Voracity<br/>dialogue boxes"]
```

- `build_readme.py` drafted the layout (`more.md`); `README.md` is the edited result and is edited directly. The SVGs it points to are regenerated, so change their scripts rather than the files in `readme/art/`.
- Both workflows share one concurrency group so their commits never race. They commit as the
  owner's noreply address, so regrows show on the contribution graph.
- `genpokemon/readme_art/README.md` lists each script; `cast.py` keeps each Pokémon to one appearance.

## Map generators (`genpokemon/`)

`gen_pokemon_roam.py` (Route 111) and `gen_pokemon_roam_mauville.py` render Pokémon Emerald
maps from `data/pokeemerald/` tilesets and emit the roaming SVGs in `readme/`. Walkability
edits live in `debug_tiles/`. See `genpokemon/README.md`.

## Shared with Voracity

Voracity is a separate repository and app. The two share some artwork and code, and keep it in step through matching pull requests:

- The Friend Area catalog, scenery and scripts (`public/friend-areas`, `scripts/*friend*`, `rescue_maps.py`, `sky_scenery.py`).
- The forest sky rules (`forest-sky.ts`), the contribution garden palette and the PC behaviour.
- `readme/art/activity.json`, which both dialogue boxes read.

Changes to any of these should land in both repositories.

## Licensing

Original code and content are all rights reserved (`LICENSE`). Third-party material and its terms are listed in `NOTICE.md`; Pokémon artwork remains its owners'.
