# Friend Area expansion — 7 October 2026

The owner approved the first preview for merge, then requested walkable Moonview
stairs, the lab's darker floor corners, two more habitats including Kyogre's,
and plausible homes for later-generation Pokémon. The owner also explicitly
requested discoverable map switching on **both Voracity and the portfolio**.

## Controls

The compact garden has visible previous/next buttons and a named expand button.
Click its scenery or focus the map and press Enter/Space to expand. The expanded
view has a dropdown, previous/next buttons and a focusable map supporting Left
and Right. Arrow navigation wraps around all six choices. Native dropdown keys
are not intercepted. Selection persists per browser; Escape closes the dialog
and returns focus. Existing resident greeting buttons remain independent.

The README remains a script-free SVG. At regeneration it draws one of six maps
and its guests once, then shares those choices between light and dark outputs.

## Habitats and guest policy

All Red/Blue natives remain present. Guests are sampled without replacement when
an area is first visited and are preserved across map changes for that page visit.
An ordinary area has at most eight residents; each legendary area has its native
legendary plus one visitor. This introduces variety without overcrowding the maps.

| Area | Native roster | Additional guest pool | Reasoning |
| --- | --- | --- | --- |
| Mushroom Forest | Existing seven | Foongus, Morelull | Fungal ecology, following Paras/Shroomish |
| Mt. Moonview | Existing six | Elgyem, Beheeyem, Munna, Musharna | Celestial or dream association, following its lunar setting |
| Decrepit Lab | Existing seven | Porygon-Z, Solosis, Duosion, Reuniclus | Porygon evolution / artificial and cellular themes |
| Seafloor Cave | Kyogre | Phione, Manaphy | Marine mythical visitors |
| Volcanic Pit | Groudon | Heatran, Volcanion | Magma or fire/steam visitors |

These are **curated inferences**, not invented original-game assignments.
Porygon-Z is the exception: Rescue Team DX already assigns it to Decrepit Lab.
The catalog records a reason and basis for every guest; the expanded interface
exposes the possible visitors. Type alone is insufficient for a habitat match.

References: [original Friend Areas and DX additions](https://pamtre-berry.neocities.org/articles/friendareas),
[Morelull's forest association](https://www.pokemon.com/uk/pokedex/morelull),
[Heatran's magma association](https://www.pokemon.com/uk/pokedex/heatran),
[Duosion's evolutionary family](https://www.pokemon.com/uk/pokedex/duosion).
Other placements above are thematic design choices rather than sourced habitat claims.

The pinned SpriteCollab revision supplies 36 species: 22 natives and 14 guests.
Explored candidates Amoonguss and Shiinotic have no sheets at that revision and
are not included; do not substitute unrelated sprites. All downloaded XML,
animation hashes and creator credits are retained.

## Movement and fidelity

- Moonview now has connected upper, middle and lower floor polygons with two
  stair connections. Collision samples use the union of zones, allowing feet to
  straddle adjoining polygons. The pond remains an explicit exclusion.
- Decrepit Lab includes the shadowed tiled perimeter and bottom corners. The
  central machine remains excluded: dark shading is not a wall.
- Seafloor Cave has an interior swimming zone with larger clearance. Volcanic
  Pit uses the central stone platform; lava remains out of bounds. Both use wider
  actor separation to accommodate their larger residents.
- Terrain is still hand-traced. Original scenery animation sequences remain
  unverified and backgrounds remain static; approval to merge the first draft
  did not establish that original animation fidelity had been achieved.

## Validation and handover

Both production builds passed, and the browser review completed without page
JavaScript errors. Ten passing unit tests include ten-minute seeded movement runs in all five additional
areas, stair connectivity between every Moonview terrace, accepted dark floor
coordinates, forbidden obstacles, guest variation/caps, and source frame timing.
The browser review script covers both sites, all five new maps, compact/expanded
arrow buttons, keyboard wrapping, scenery click-to-open, stable visit populations,
persistence, focus restoration and mobile bounds. Twelve README SVG variants
validate as self-contained images with all six destinations reachable.

Reproduce using commands in [FRIEND-AREA-DRAFTS.md](friend-area-drafts.md).
The asset importer remains canonical here; mirror its public output and the
three shared renderer/navigation files to the portfolio before validation.

The owner approved these expansion renders for merge and deployment on 7 October 2026.
Preserve all approved controls and mappings. Continue verification of original
environmental frames and foreground occlusion rather than inventing animated
effects or calling the hand-traced zones original game collision data.
