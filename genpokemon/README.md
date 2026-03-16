# genpokemon — Pokémon Roam SVG Generator

Generates animated SVGs of Pokémon roaming across authentic Pokémerald maps.
There are currently **two scenes**, each with its own script and walkable-edit file.

| Scene | Script | Walkable-edit file | Output |
|-------|--------|--------------------|--------|
| **Mauville City** (horizontal, 80×20) | `gen_pokemon_roam_mauville.py` | `debug_tiles/walkable_edit_mauville.png` | `readme/pokemon-roam-mauville.svg` |
| **Route 111** (vertical, 40×140) | `gen_pokemon_roam.py` | `debug_tiles/walkable_edit_rt111.png` | `readme/pokemon-roam-rt111.svg` |

---

## Files

| File | Purpose |
|------|---------|
| `gen_pokemon_roam.py` | Route 111 pipeline — loads tilesets, renders map, plans routes, emits SVG |
| `gen_pokemon_roam_mauville.py` | Mauville City pipeline — same structure, different map/pokemon |
| `show_nav_grid.py` | Debug helper — renders a colour-coded walkability grid as `debug_tiles/nav_grid.png` + `debug_tiles/nav_grid.svg` |
| `_check_borders.py` | Utility to inspect metatile border values |

---

## Quick start

```bash
# Generate the Route 111 SVG
python genpokemon/gen_pokemon_roam.py

# Generate the Mauville City SVG
python genpokemon/gen_pokemon_roam_mauville.py

# Inspect the walkability grid (Mauville)
python genpokemon/show_nav_grid.py
```

> **Data required** — the scripts expect `data/pokeemerald/` at the repo root with:
> - `primary/general/` — primary tileset PNGs + `metatile_attributes.bin`
> - `secondary/mauville/` — secondary tileset PNGs + `metatile_attributes.bin`
> - `map/Route111/map.bin`, `map/MauvilleCity/map.bin`, `map/Route117/map.bin`, `map/Route118/map.bin`
>
> Pokémon sprites are loaded from `../theoffice/Pokemon/` and `../theoffice/Pokemon Shiny/` relative to the repo root.
> All sprites must be **256×256 px** (or **512×512** for oversized mon like Yveltal/Kyogre), with 4 walk frames of equal width per row.

---

## Map layouts

### Route 111 (`gen_pokemon_roam.py`)

```
col  0 ──── 39
  Route 111
  (40 cols)
  rows 0 – 139   ← vertical map, water area in middle rows
```

Total grid: **40 × 140 metatiles** (16 px each × scale 2 → 640 × 2240 px SVG).

### Mauville City (`gen_pokemon_roam_mauville.py`)

```
col  0 ──── 19   col 20 ──── 59   col 60 ──── 79
  Route 117          Mauville         Route 118
  (20 cols)          (40 cols)         (20 cols)
                   rows 0 – 19
```

Total grid: **80 × 20 metatiles** (16 px each × scale 2 → 1280 × 320 px SVG).

---

## SVG layer order

Sprites are rendered **above all terrain** so they never disappear behind walls or trees.
The layer stack from bottom to top is:

```
base map (animation step 0)
animation overlays (SMIL-driven, steps 1-7)
roof-cap overlay  (walkable covered tiles, e.g. open-air roof edges)
foreground layer  (collision-blocked covered tiles — walls, building tops, trees)
Pokémon sprites   ← always on top
```

This is enforced by the order of elements in the SVG `<svg>` tag inside each script.

---

## Tile blocking

`base_blocked` is built from these sources, in order:

1. **Collision bit** — from the map binary (`entry >> 10 & 3 != 0`)
2. **`layer_type ≥ 1`** — covered/foreground tiles that sit above sprites
3. **`ROOFTOP_META_IDS`** — explicit metatile IDs for known building surfaces (Mauville only):
   `{256, 257, 258, 272, 273, 274, 304, 426, 427, 428}`

All are merged into one boolean grid used by the path planner and per-Pokémon nav grids.

The `walkable_edit` PNG (see below) is the final override layer applied on top.

---

## Walkable-edit system

Each scene has its own **walkable-edit PNG** in `debug_tiles/`:

| Scene | File |
|-------|------|
| Route 111 | `debug_tiles/walkable_edit_rt111.png` |
| Mauville | `debug_tiles/walkable_edit_mauville.png` |

These are **32 px-per-tile** flat-colour PNGs you can paint in any image editor (Paint, GIMP, Photoshop, etc.). The generator reads the centre pixel of each tile cell.

### Colour key

| Colour | Meaning in editor | Effect when re-run |
|--------|--------------------|---------------------|
| **Bright green** (`G > max(R,B) × 1.25` and `G > 100`) | Force walkable | Overrides collision/ROOFTOP data → tile becomes walkable |
| **Bright red** (`R > max(G,B) × 1.25` and `R > 100`) | Force blocked | Overrides computed walkable state → tile becomes blocked |
| **Anything else** (blue, purple, grey…) | No override | Tile left as computed — safe to leave untouched |

The green override also applies to **water-mode** Pokémon nav grids (e.g. painting water tiles green lets Kyogre roam there).

### Workflow — Route 111

```
1. Open debug_tiles/walkable_edit_rt111.png (32 px per tile = 1280×4480 px)
   Each pixel block = one 16 px metatile on the map

2. Paint tiles green (force walkable) or red (force blocked)
   Exact colour doesn't matter as long as it satisfies the threshold above

3. Save the file

4. python genpokemon/gen_pokemon_roam.py
   → reads overrides, prints "+N forced walkable, +M forced blocked"
   → replans all routes deterministically (seed=42)
   → regenerates readme/pokemon-roam-rt111.svg
```

### Workflow — Mauville City

```
1. Open debug_tiles/walkable_edit_mauville.png (32 px per tile = 2560×640 px)

2. Paint & save (same colour rules as above)

3. python genpokemon/gen_pokemon_roam_mauville.py
   → regenerates readme/pokemon-roam-mauville.svg
```

### Reset

```powershell
# PowerShell
Remove-Item debug_tiles/walkable_edit_rt111.png
Remove-Item debug_tiles/walkable_edit_mauville.png
```

The generator recreates a blank edit file on next run if none exists.

> **Note:** The seed is fixed (`random.Random(42)`), so the same walkable-edit file always produces identical routes. Change the seed constant in the script to get a different layout.

---

## SVG debug overlay (`nav_grid.svg`)

`debug_tiles/nav_grid.svg` overlays the Mauville grid on `debug_tiles/walkable_map.png`.
Open it in a browser to see blocked tiles, grid lines, zone dividers, and labels.

---

## Adding a new Pokémon

### 1. Add the sprite path to `SPRITES`

```python
# In gen_pokemon_roam.py (RT111) or gen_pokemon_roam_mauville.py (Mauville)
SPRITES = {
    ...
    "goodra": OFFICE / "Pokemon Shiny" / "GOODRA.png",   # shiny variant
    "appletun": OFFICE / "Pokemon" / "APPLETUN.png",     # normal variant
}
```

Sprite requirements:
- **256×256 px** PNG with 4 walk frames per direction, 4 directions (DOWN, LEFT, RIGHT, UP top-to-bottom)
- Oversized mon (Yveltal, Kyogre): **512×512**, use `sheet_w=512, frame_w=128, dp=48`

### 2. Add an entry to the pokemon list

```python
dict(
    key        = "goodra",   # must match SPRITES key
    sheet_w    = 256,        # total sprite sheet width in px
    frame_w    = 64,         # width of one frame  (sheet_w / 4)
    dp         = 32,         # draw-height offset (px) — bigger = taller sprite
    n_legs     = 5,          # BFS path segments per route loop
    water_mode = "land",     # "land" or "water"
    clearance  = 0,          # nav-grid inflation radius (leave 0 for land pokemon)
    bounds     = (0, 70, 40, 100),  # (col0, row0, col1, row1) zone constraint, or None
    is_shiny   = True,
    label      = "Goodra ✨",
),
```

> **`dp` guide:** `22` small/cute mon · `24–28` average mon · `32` large mon · `48` oversized (Yveltal/Kyogre)

> **`bounds` zones for RT111 (40 cols × 140 rows):**
> | Zone | Rows | Notes |
> |------|------|-------|
> | 0 | 0–35 | Rocky canyon top |
> | 1 | 36–70 | Mid canyon |
> | 2 | 70–100 | River / water area |
> | 3 | 100–120 | Wide open stretch |
> | 4 | 120–140 | Bottom path |

### 3. Regen

```bash
python genpokemon/gen_pokemon_roam.py
```

The terminal output shows steps, collision score, and active/deficit counts.
A **collision score of 0** is ideal; scores up to ~100 are visually fine.

---

## Creating a new scene

1. **Copy one of the existing scripts** as a starting template, e.g.:
   ```
   cp genpokemon/gen_pokemon_roam.py genpokemon/gen_pokemon_roam_route110.py
   ```

2. **Update the map constants** near the top:
   ```python
   MAP_W = 40          # map width in metatiles
   MAP_H = 100         # map height in metatiles
   ```

3. **Point the map loader** to the correct `map.bin`:
   ```python
   new_map = load_map_data(DATA_DIR / "map" / "Route110" / "map.bin", MAP_W, MAP_H)
   ```
   Make sure the binary data exists under `data/pokeemerald/map/<MapName>/map.bin`.

4. **Create a new walkable-edit file** — on first run the script will create one automatically.
   Or copy an existing one and repaint it for the new map dimensions.
   The file is read from:
   ```python
   Path(__file__).resolve().parent.parent / 'debug_tiles' / 'walkable_edit_<scenename>.png'
   ```
   Update that path constant in the new script accordingly.

5. **Update the output path**:
   ```python
   out = ROOT_DIR / "readme" / "pokemon-roam-<scenename>.svg"
   ```

6. **Choose a secondary tileset** — Route 111 reuses the `mauville` secondary tileset.
   If your map uses a different secondary, update `DATA_DIR / "secondary" / "<tileset>" / ...`
   and add the palette files to `data/pokeemerald/secondary/<tileset>/palettes/`.

7. **Design your pokemon list** — use `bounds` to constrain pokemon to sub-zones so the map
   isn't overcrowded. A 40×140 map comfortably fits 30+ pokemon across 5 zones.

8. **Reference the new SVG in the README** as:
   ```markdown
   ![pokemon roaming](./readme/pokemon-roam-<scenename>.svg)
   ```

---

## `PokemonConfig` quick reference

Each entry in the pokemon list is a plain `dict` with these keys:

| Key | Type | Description |
|-----|------|-------------|
| `key` | str | Must match a key in `SPRITES` |
| `sheet_w` | int | Total sprite sheet width (px) — `256` or `512` |
| `frame_w` | int | Width of one walk frame (`sheet_w // 4`) |
| `dp` | int | Draw-height offset — controls sprite size and depth sort |
| `n_legs` | int | BFS path segments per loop (more = longer route) |
| `water_mode` | str | `"land"` or `"water"` |
| `clearance` | int | Nav-grid inflation radius — keep `0` for land pokemon |
| `bounds` | tuple\|None | `(col0, row0, col1, row1)` zone constraint, or `None` for full map |
| `is_shiny` | bool | Adds sparkle/glow effect to the SVG sprite |
| `label` | str | Debug label printed in terminal output |
