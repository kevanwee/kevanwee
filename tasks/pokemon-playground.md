# Live Pok?mon maps

## Current authorized scope
- Only Route 111, Mauville and their focused playground change.
- Preserve all 32 Route 111 residents and all 12 Mauville residents, including shiny variants.
- Clicking a preview opens focus mode; closing restores the trigger focus and page scroll.
- Restore the pre-audit mouse, portfolio layout/navigation and document viewer. Keep the earlier Resume/CV feature.
- Authentic Emerald item art with pinned source and palette hashes; preserve existing later-generation Pok?mon sprites.

## Implementation
- Exported the existing map art and complete rosters; generated terrain grids from the existing map data and terrain corrections.
- Seeded simulation with independent destinations, rest, greetings and berries. Land/water habitats and connected terrain restrict routes.
- Swept movement reservations prevent footprint overlaps, head-on swaps and crossing conflicts. Blocked paths replan; expired commands release their destinations.
- Canvas renders the shared session in previews and focus mode. Offscreen previews, covered previews, paused worlds and hidden tabs do not advance.
- Focus mode supports pan, zoom, scene switching, resident selection, greeting, calling and authentic Oran Berries. All residents remain available on mobile.
- Optional browser-local discovery journal and map motion preference. Reduced motion starts maps paused. Neither changes the original page cursor or layout.

## Progressive commits
- `90008ff`: broader UX foundation (subsequently reverted at the user's direction).
- `95708f8`: full map asset export and authentic Emerald items.
- `58b4d34`: restore original layout, navigation, mouse and document viewer.
- `33cfbe2`: isolated map preferences and seeded collision engine.
- Live map UI and local verification complete; deploying the reviewed map-only changes.

## Verification
- `npm run test:world`: both complete rosters across eight seeds per scene, two simulated minutes each, dense opposing calls, greetings, berries, unreachable commands and deterministic replay. More than 16 million reservation checks per run.
- `npm run build`: production compilation and TypeScript.
- Chromium desktop/mobile emulation: 320, 390, 768 and 1440px; pause, both roster counts, scene switching, greeting, berry action, focus containment, Escape and focus restoration.
- Short 320?568 viewport, reduced motion, hidden-tab suspension, discovery/pause persistence, map-load failure and exit.
- axe WCAG A/AA check on the playground: no violations in the tested mobile viewport.
- Physical iOS/Safari testing has not been performed.
