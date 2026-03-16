# Lessons Learned

## Lesson 1: Normalize sprite scales by target rendered height, not arbitrary values

**Rule:** When assigning a `scale` to pokemon sprites for the cursor, always compute it so that all pokemon produce a consistent rendered walk-frame height (≈ 96–101px, matching Diancie as the reference).

**Formula:** `scale = TARGET_HEIGHT / sprite.walk.frameHeight`

**Why:** Sprites from the PMD sprite project have wildly different base pixel dimensions (e.g. Ceruledge walk fH=56px vs Latios walk fH=80px). Picking an arbitrary scale like `2.2` for small sprites and `1.5` for large ones without checking the rendered output produces cursors that are visually 20–30% larger than the reference pokemon.

**How to apply:** Whenever adding a new pokemon cursor config, verify: `frameHeight × scale ≈ 100px` for the walk animation before committing.
