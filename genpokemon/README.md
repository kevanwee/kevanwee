# genpokemon — Mauville City Pokémon Roam Generator

Generates an animated SVG of Pokémon roaming across a stitched Pokémerald map
(Route 117 ↔ Mauville City ↔ Route 118). Output lands at `readme/pokemon-roam.svg`.

---

## Files

| File | Purpose |
|------|---------|
| `gen_pokemon_roam.py` | Main pipeline — loads tilesets, renders the map, plans routes, emits the SVG |
| `show_nav_grid.py` | Debug helper — renders a colour-coded walkability grid as `debug_tiles/nav_grid.png` + `debug_tiles/nav_grid.svg` |
| `_check_borders.py` | Utility to inspect metatile border values |

---

## Quick start

```bash
# Generate the SVG
python genpokemon/gen_pokemon_roam.py

# Inspect the walkability grid
python genpokemon/show_nav_grid.py
```

> **Data required** — the scripts expect `data/pokeemerald/` at the repo root with:
> - `primary/general/` — primary tileset PNGs + `metatile_attributes.bin`
> - `secondary/mauville/` — secondary tileset PNGs + `metatile_attributes.bin`
> - `map/MauvilleCity/map.bin`, `map/Route117/map.bin`, `map/Route118/map.bin`
>
> Pokémon sprites are loaded from `../theoffice/Pokemon (Shiny)/` relative to the repo root.

---

## Map layout

```
col  0 ──── 19   col 20 ──── 59   col 60 ──── 79
  Route 117          Mauville         Route 118
  (20 cols)          (40 cols)         (20 cols)
                   rows 0 – 19
```

Total grid: **80 × 20 metatiles** (16 px each → 1280 × 320 px at 1×).

---

## Tile blocking

`base_blocked` is built from three sources, in order:

1. **Collision bit** — from the map binary (`entry >> 10 & 3 != 0`)
2. **`layer_type ≥ 1`** — covered/foreground tiles that sit above sprites
3. **`ROOFTOP_META_IDS`** — explicit metatile IDs known to be building surfaces:
   `{256, 257, 258, 272, 273, 274, 304, 426, 427, 428}`

All three are merged into one boolean grid used by the path planner,
per-Pokémon nav grids, and the collision-dodge code.

---

## Manually editing walkable tiles

`show_nav_grid.py` produces `debug_tiles/walkable_edit.png` — a **32 px-per-tile**
flat-colour PNG you can paint in any image editor (Paint, GIMP, Photoshop, etc.).

### Colour key

| Colour | Meaning in editor | Effect when re-run |
|--------|--------------------|---------------------|
| **Bright green** (G dominant) | Walkable | Forces tile walkable, overriding collision/ROOFTOP data |
| **Bright red** (R dominant) | Blocked | Forces tile blocked, overriding computed walkable state |
| **Blue / purple** | No action | Tile left as computed (you can leave these alone) |

### Workflow

```
1. python genpokemon/show_nav_grid.py
   → creates debug_tiles/walkable_edit.png (first run only)

2. Open walkable_edit.png in your image editor
   → each pixel block = one 16 px metatile

3. Paint tiles green (walkable) or red (blocked)
   → use any green-dominant or red-dominant colour, exact shade doesn't matter

4. Save walkable_edit.png

5. python genpokemon/show_nav_grid.py
   → re-reads your paint, prints "N forced walkable, M forced blocked"
   → updates debug_tiles/nav_grid.png and debug_tiles/nav_grid.svg

6. python genpokemon/gen_pokemon_roam.py
   → picks up the same overrides automatically, reruns path planning,
     regenerates readme/pokemon-roam.svg
```

### Reset

```bash
Remove-Item debug_tiles/walkable_edit.png   # PowerShell
rm debug_tiles/walkable_edit.png            # bash / zsh
```

Re-running `show_nav_grid.py` after deletion recreates the file from the computed state.

---

## SVG overlay (`nav_grid.svg`)

`debug_tiles/nav_grid.svg` overlays the grid on `debug_tiles/walkable_map.png`
(the rendered map at low resolution). Open it in a browser to see:

- **Semi-transparent coloured rects** on every blocked tile
- **Grid lines** every tile, dashed cyan every 5 columns
- **Blue dividers** at col 20 (Mauville start) and col 60 (Route 118 start)
- **Row / column labels** (`R0–R19`, `C0, C5 …`)
- **Legend** in the bottom-right corner

---

## Adding / removing Pokémon

Edit the `POKEMON` list near the top of `gen_pokemon_roam.py`. Each entry takes:

```python
PokemonConfig(
    name       = "name",       # must match key in SPRITES dict
    dp         = 28,           # sprite draw-height offset (px) — controls depth sort
    water_mode = "land",       # "land" or "water"
    clearance  = 0,            # extra blocked rows below the sprite for nav inflation
    bounds     = None,         # (col0, row0, col1, row1) to restrict roam area, or None
    n_legs     = 4,            # path segments per route
)
```
