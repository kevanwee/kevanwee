# Native Friend Area scenery ? 11 October 2026

Eleven areas are available: Transform Forest, Mushroom Forest, Mt. Moonview,
Decrepit Lab, Seafloor Cave, Volcanic Pit, Thunder Meadow, Rainbow Peak,
Legendary Island, Healing Forest and Waterfall Lake.

`rescue_scenery.py` decodes original Red Rescue Team BPC tiles/chunks, BMA XOR/RLE
map rows, and BPL RGB555 palettes and palette animation. It uses the pinned
[pret/pmd-red revision](https://github.com/pret/pmd-red/tree/013475aa04f5be3191e5527c186d9bfceae7cae0).
The format and playback references are `src/ground_bg.c`,
`src/bg_palette_buffer.c`, and `src/map_files_table.c` at that revision.
No ROM, paid service, invented magma overlay, or guessed stone timing is needed.

Nine maps contain palette animation. Mushroom Forest and Rainbow Peak contain
neither BPL palette animation nor BPA tile animation and remain static.
All selected map entries have null BPA slots. The importer explicitly rejects
BPA tile data rather than silently dropping an unsupported animation.
Transform Forest uses lossless 32-frame stone animation at six ticks per frame
(100 ms at the renderer's 60 Hz timebase), replacing the JPEG-derived 120 ms strip.
Each animated palette bank becomes a transparent cropped PNG strip, preserving
independent source periods and masks. Base images use native frame zero.
Per-map `*-source.json` files record original paths, revision and SHA-256 hashes.
This establishes provenance, not a new licence for the original game artwork.

Movement zones are conservatively authored; they are not extracted game
collision maps. Existing resident slots and PC choices are preserved. Waterfall
Lake's water is the swimming surface; its island is excluded. New habitat
memberships come from the same revision's `data/monster/monster_data.json`.
Thunder Meadow displays eight of its eleven native species to keep the panel
legible: Mareep, Flaaffy, Ampharos, Electrike, Manectric, Plusle, Minun, Castform.
Existing curated guests remain a per-visit selection.

The websites advance scenery only while visible and active. Reduced motion,
quiet mode, hidden tabs and covering dialogs pause it. Native sprites retain
their independent timing. The README SVG embeds the same palette strips and
uses discrete CSS keyframes with native durations; reduced motion disables them.

Validation: decoder fixtures cover XOR map rows, tile flips, palette banks,
transparent compositing, exact native durations, and rejection of BPA data.
Website unit tests simulate ten-minute visits in every area; browser checks
cover all eleven choices, changing magma pixels away from actors, reduced motion,
visit rosters, selection persistence and mobile bounds. Production builds pass.
Run `python scripts/test_rescue_scenery.py`, the cross-site native-scenery browser check
and the normal build/tests. Asset regeneration is explicit with
`python scripts/fetch-friend-areas.py`, with the committed safe-seat layouts;
production builds do not fetch game assets.

## Expansion, 12 October 2026

All 57 Red Rescue Team Friend Areas are now on the site, plus 16 Explorers of Sky
areas (Crystal Crossing and 15 from the map atlas shortlist): 73 choices with
Transform Forest. The original eleven keep their scenery, zones, natives and
order; they only gained visitors.

- `scripts/rescue_maps.py` decodes any Rescue Team ground map. It adds BPA tile
  animation (slots after the static tiles; slots 0-1 animate, d+1 ticks per
  frame), two-layer maps (layer 0 on top) and the BMA collision layer (per row,
  `cmd<0x80` gives cmd+1 open tiles, otherwise cmd-127 solid, XORed with the row
  above). New areas walk on the largest open collision region; Explorers maps use
  skytemple's `bma.collision`, and six maps without one use authored zones.
- `scripts/friend_area_data.py` holds descriptions, the Explorers rosters and
  visitors: 656 later-generation species placed by family, habitat and type, each
  in one area. Up to eight natives stay on a map; the rest rotate in with visitors.
- `python scripts/fetch-friend-areas.py --expand` adds anything missing (needs the
  skytemple venv only for new Explorers maps). 45 visitors have no PMD sprite on
  SpriteCollab yet and are skipped until one exists.
- `npm run test:friend-areas` checks assets and three ten-minute visits per area.
