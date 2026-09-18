# Pokémon playground implementation

## Agreed behavior
- Preserve all 32 Route 111 residents and all 12 Mauville residents, including existing shiny variants.
- Normal mouse, touch, and keyboard portfolio navigation. Keep the native pointer.
- Clicking a map opens a focused playground; closing restores page position. Preview and focus share scene state.
- Authentic Emerald / Generation III assets for new berries and balls, with pinned provenance. Existing later-generation Pokémon remain.
- Optional local discovery journal; no account or required game progress.

## Reviewable stages
1. Interaction foundation: shared native dialogs, contrast, responsive navigation, keyboard semantics, motion/companion preferences, opt-in music, summon positioning.
2. Reproducible map export and authentic item assets; preserve roster and terrain restrictions.
3. Live simulation: stable footprints, swept reservations, yielding/replanning, personalities, interactions, seeded tests.
4. Canvas previews and focus mode: pan/zoom, inspect, call, berries, greetings, journal, scene switching and pause.
5. Build, keyboard/mobile/browser verification, performance checks, documentation, progressive commits and pushes.

## Verification contract
- No overlaps or terrain escapes in seeded simulations, including blocked paths, crossings, rest and berries.
- Full rosters on every device; cull rendering, never residents.
- Paused, hidden, covered and reduced-motion scenes do not advance. Resume never jumps or resets.
- Focus stays in dialogs; Escape restores focus and scroll. Capture touch gestures only in focused maps.
- No horizontal page overflow at 320px. Normal portfolio links and native pointer work.
- Resume/CV downloads remain intact. Stage no unrelated files.

## Progress
- Plan recorded; implementation in progress.
