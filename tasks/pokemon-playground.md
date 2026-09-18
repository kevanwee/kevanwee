# Live Pok?mon maps

## Current authorized scope
- Follow-up: double movement; offset reachable berries; correct cliff/roof depth; use authentic game reactions and animated short idles; remove count slogan, pause controls and white preview bar; constrain zoom to map bounds.
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
- Optional browser-local discovery journal. Reduced motion freezes previews; explicitly opening the playground starts its interactive scene. Hidden tabs remain suspended. The original page cursor and layout stay intact.

## Progressive commits
- `90008ff`: broader UX foundation (subsequently reverted at the user's direction).
- `95708f8`: full map asset export and authentic Emerald items.
- `58b4d34`: restore original layout, navigation, mouse and document viewer.
- `33cfbe2`: isolated map preferences and seeded collision engine.
- `7339c8e`: live map previews and focused playground, verified on the deployed site at 390 and 1440px.
- Follow-up: prevent clicks before hydration; ten consecutive fresh-load openings passed.

## Verification
- `npm run test:world`: both complete rosters across eight seeds per scene, two simulated minutes each, dense opposing calls, greetings, berries, unreachable commands and deterministic replay. More than 16 million reservation checks per run.
- `npm run build`: production compilation and TypeScript.
- Chromium desktop/mobile emulation: 320, 390, 768 and 1440px; pause, both roster counts, scene switching, greeting, berry action, focus containment, Escape and focus restoration.
- Short 320?568 viewport, reduced motion, hidden-tab suspension, discovery/pause persistence, map-load failure and exit.
- axe WCAG A/AA check on the playground: no violations in the tested mobile viewport.
- Verified that the original portfolio UI files match pre-audit commit `1f260a6` (apart from the two map banners and map-only CSS).
- Physical iOS/Safari testing has not been performed.

## Follow-up verification
- `c6f9dfe`: speed, offset berries, animated shorter idles, simplified controls, unobstructed previews and bounded zoom.
- Terrain checks forbid walkable solid structures and incompatible height transitions. All 44 residents still move across all tested seeds.
- Rendering regression covers a tall sprite in front of a cliff cap and behind the same structure.
- Browser checks at 320/390/1440px: no white bar/count slogan/pause button; both complete rosters; greetings/berries; repeated zoom-out stays inside both map dimensions; Escape works; no playground axe A/AA violations.
