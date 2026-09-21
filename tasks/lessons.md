# Lessons Learned

## Portfolio overworld corrections (2026-09-21)
- Inspect animation contact sheets before assigning behavior: PMD Hover can be a spin/action, not sustained flight. Use visually verified directional wingbeats and keep altitude independent of animation frame resets.
- Match apparent body sizes to species; a small Rowlet must not have the same target height as Corviknight. Compare ground and airborne silhouettes together.
- Silvally must roam freely in the left panel, showing different facing angles, rather than being pinned to a single perch or viewport corner. All non-battling residents need accessible click/touch/keyboard reactions like Teddiursa.
- Include Skills, other project cards and Media appearances as habitats. Randomize destinations, rests, glances and battle bouts; a random starting offset does not make a fixed repeating cycle feel alive.
- Occasional naps are part of the requested behavior. Use authentic Sleep sheets, varied timing and wake-on-click; flyers must land before sleeping.

## Playground scope

Map refinements: keep previews free of persistent white text bars; do not add resident-count slogans or pause controls. Use authentic Gen III reaction sprites, place berries on reachable tiles offset from every Pokémon, and clamp zoom to cover the map viewport. Terrain overrides must not turn cliff faces, walls or roofs into paths; verify sprite occlusion against elevation and structure depth.

Preserve the complete existing map rosters (32 Route 111, 12 Mauville) when changing renderers; optimize culling and scheduling rather than removing residents. Keep the original portfolio mouse behavior; restrict new pointer handling to focused maps. Newly introduced Pokémon item art must use authentic game assets with recorded provenance, not approximations or generated art.

## Lesson 1: Normalize sprite scales by target rendered height, not arbitrary values

**Rule:** When assigning a `scale` to pokemon sprites for the cursor, always compute it so that all pokemon produce a consistent rendered walk-frame height (≈ 96–101px, matching Diancie as the reference).

**Formula:** `scale = TARGET_HEIGHT / sprite.walk.frameHeight`

**Why:** Sprites from the PMD sprite project have wildly different base pixel dimensions (e.g. Ceruledge walk fH=56px vs Latios walk fH=80px). Picking an arbitrary scale like `2.2` for small sprites and `1.5` for large ones without checking the rendered output produces cursors that are visually 20–30% larger than the reference pokemon.

**How to apply:** Whenever adding a new pokemon cursor config, verify: `frameHeight × scale ≈ 100px` for the walk animation before committing.
# Scope correction: live maps only
- The user rejected the mouse, navigation, page layout and document viewer changes. Restore the pre-audit portfolio, including its original mouse behavior. Keep the previously requested Resume/CV feature. Restrict this task's UI changes to Route 111, Mauville and their focused playground.
