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
