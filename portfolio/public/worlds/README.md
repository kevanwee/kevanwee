# Portfolio world assets

The 32 Route 111 and 12 Mauville residents, shiny variants, sprite sheets and map
art are extracted without redrawing from the existing checked-in SVG scenes.
Existing character art is credited to PMD SpriteCollab; it includes later generations.

New item icons are authentic Pokémon Emerald artwork preserved in
[pret/pokeemerald](https://github.com/pret/pokeemerald/tree/5eff78649e7170a877b961ef0b3da13b81a16038/graphics/items).
The exporter applies the game's indexed palettes (Premier Ball uses Luxury Ball's
palette) and transparent index 0. `items/sources.json` records pinned source URLs
and SHA-256 hashes. This is a preservation repository, not an official Nintendo host.
Artwork remains the property of its respective owners.

Regenerate with `python portfolio/scripts/export_worlds.py --items` from the repo
root. Add `--reactions` to fetch the original 16×16 exclamation and heart field
effects used in Emerald's `trainer_see.c`. Their indexed palette colors and
transparent index 0 are preserved; hashes are in `reactions/sources.json`.
Requires Pillow and the existing terrain data in `data/`; omit the asset flags
for an offline map-only export. Navigation includes map collision/elevation,
water behavior, covered tiles and the project's manually corrected terrain cells.
Runtime footprints further restrict movement. Posters are static loading and
failure fallbacks. No Pokémon is removed on smaller screens.

The shared in-memory world survives opening, closing and switching maps within a
visit. Only discovery uses optional local storage;
positions reset on a page reload. All paths use cardinal movement and reserve
their swept footprints before advancing. Land residents avoid shallow-water
art as well as deep water. Movement runs at 28–48 map pixels/second, twice the
original range. Short rests keep the sprite's existing walk/flap cycle alive.
Berry targets must be reachable and clear of every resident's reserved footprint.

Terrain collision cannot be cleared by green debug overrides on roofs/structures.
`elevation` retains the game's tile heights (0/15 allow transitions/multiple levels).
The renderer completes the terrain first, then orders opaque foreground spans
with resident feet. This prevents a cliff/roof cap north of a resident from
erasing its upper body. Walkable floor art is never an occlusion mask.

Previews respect reduced motion. Opening the playground explicitly starts the
interactive scene; it still stops when the browser tab is hidden. Zoom covers
both viewport axes, so panning and zooming cannot reveal blank map margins.

Run `npm run test:world` inside `portfolio/` for deterministic collision, terrain,
roster, crossing and interaction tests. Focus-mode controls have keyboard
alternatives: resident selection, greeting, berry offering and calling to the
camera centre. Arrow keys pan while the canvas has focus. Wheel/drag handling is
limited to the focused map. The base portfolio retains its original controls.
