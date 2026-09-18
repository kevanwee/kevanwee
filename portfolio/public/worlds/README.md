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
root. Requires Pillow and the existing terrain data in `data/`; omit `--items`
for an offline map-only export. Navigation includes map collision/elevation,
water behavior, covered tiles and the project's manually corrected terrain cells.
Runtime footprints further restrict movement. Posters are static loading and
failure fallbacks. No Pokémon is removed on smaller screens.

The shared in-memory world survives opening, closing and switching maps within a
visit. Only discovery and the map pause preference use optional local storage;
positions reset on a page reload. All paths use cardinal movement and reserve
their swept footprints before advancing. Land residents avoid shallow-water
art as well as deep water. Rendered depth is sorted by feet position.

Run `npm run test:world` inside `portfolio/` for deterministic collision, terrain,
roster, crossing and interaction tests. Focus-mode controls have keyboard
alternatives: resident selection, greeting, berry offering and calling to the
camera centre. Arrow keys pan while the canvas has focus. Wheel/drag handling is
limited to the focused map. The base portfolio retains its original controls.
