# Portfolio overworld handover

## Request / scope (2026-09-21)
- Import the 29 named Pokemon sprite folders from the user's Downloads (12 species, 17 Silvally forms).
- Random residents walk/rest on portfolio card tops and section dividers; flyers travel freely above surfaces.
- Silvally stays at the top, periodically changes form and responds to clicks with RearUp/Double.
- Armarouge and existing Ceruledge share a surface and a coordinated sparring sequence.
- Preserve the existing cursor, maps, content and layout. Commit/push progress to main as explicitly requested.

## Plan / checkpoints
1. Copy original sprite packs, retain XML/offset/shadow data, generate validated runtime metadata. Commit/push assets and this handover.
2. Add a shared, viewport-culled overworld renderer and a keyboard/touch accessible Silvally. Commit/push implementation after build.
3. Exercise desktop/mobile, reduced motion, resizing, form changes and battle progression. Update this handover and commit/push verification/fixes.

## Current status
- Inspected .claude/CLAUDE.md and tasks/lessons.md. Live site is portfolio/ (Next.js).
- Found all requested Downloads folders; all include AnimData.xml. Existing Ceruledge is portfolio/public/ceruledge/.
- Asset checkpoint `ef3177f` committed/pushed to origin/main: all 2,582 supplied files (~14.3 MiB), original metadata/shadows/offsets, per-file SHA-256 receipts in public/overworld/sources.json. Originals remain in Downloads.
- Generator: python portfolio/scripts/export-overworld.py (Pillow). Manifest: src/data/overworld-sprites.json; 30 variants including existing Ceruledge, XML timing, directional alpha bounds, foot anchors and normalized visible heights.
- Implemented src/lib/pokemon-overworld.ts (random distribution, movement/rest, shared battle clock) and components/PokemonOverworld.tsx (30fps imperative sprite layer, culling, hidden-tab/modal suspension, reduced motion, Silvally interaction).
- Explicit surface attributes on four section dividers and featured project cards; About is an airspace only. Silvally is pinned at the viewport top-right; forms are shuffled without repeats until the bag is exhausted, every 18–26 seconds or click/Enter/Space. RearUp/Double transitions are preloaded.
- COMPLETE: implementation checkpoint `1972f70` and original-XML byte preservation `e90e635` committed and pushed to origin/main. Live deployment verified at https://kevanwee.vercel.app (13 residents plus Silvally; clicking Silvally changed ghost to ice during the live smoke check).
- Full local Chromium verification passed: all 17 forms, automatic transitions, Enter/Space, mobile touch, complete battle progression, every surface at 320/390/768/1440px, feet alignment, no added horizontal overflow, simulated hidden-document suspension, reduced motion, map dialog suppression and restoration. No browser exceptions or failed sprite requests.
- Test-driven fix: battle center/gap now remain inside their surface when resizing down to a 320px viewport.
- The pre-existing Experience Tech/Legal filter row overflows a 320px viewport (388px document width). Confirmed by measuring with the overworld overlays hidden. Not changed, to preserve the original layout. Physical Safari/iOS testing has not been performed.

## Behavior / maintenance
- Six ground species occupy randomly shuffled, distinct card/divider surfaces on each page load. One spare ground surface can remain empty. Five flyers use the four section gaps and About airspace. Movement/rest timing and initial positions vary per visit.
- Armarouge/Ceruledge always share one randomly chosen divider; their 16-second shared clock coordinates approach, Shoot/Attack and Hurt responses, retreat and rest. Offscreen groups pause, so each sequence resumes when viewed.
- One imperative 30fps loop updates sprites without per-frame React renders. Sheet requests are limited to nearby residents and current/next Silvally forms. The 14.3 MiB archive is not downloaded in full by the browser.
- Reduced motion renders still residents and disables automatic form changes. Explicit Silvally activation changes form immediately. Keyboard focus pauses automatic changes. Modals hide the overlays and suspend their clocks.
- Surface opt-in is data-overworld-surface, plus data-overworld-kind="divider" for battle/airspace candidates. Keep surfaces at least 240px wide for a battle pair.
- Frame durations come directly from AnimData.xml (16ms ticks). Metadata uses alpha bounds to size visible bodies, with a consistent sprite-sheet origin to preserve foot placement during different animations.
- Full original packs (including currently unused animations, shadows and offsets) remain available for future work. public/overworld/.gitattributes preserves original XML line endings; committed XML blobs were checked against the recorded source hashes.

## Workspace boundaries
Pre-existing changes must not be staged: portfolio/src/components/MouseGradient.tsx; .claude/settings.json; portfolio MP3/companylogos; unrelated untracked public/icons files; ssh-portfolio/.
Stage explicit paths only. Pushing main triggers Vercel. Keep Downloads originals as a backup.

## Verification / resume commands
- Read this file and git log/status first. Requested implementation is complete; preserve the unrelated user work listed above.
- From portfolio/: npm run build — passed production compilation, TypeScript and static generation.
- npm run test:overworld — passed 2,582 source hashes, 30 variants, all 13 residents over 32 seeds and 100 simulated seconds per seed, responsive bounds, offscreen freezing and every battle phase.
- npm run test:world — passed the original 44 map residents and 16,286,400 reservation checks. Original map logic was not changed.
- npm run start -- --port 3005, then npm run test:overworld:browser. Requires Playwright, or set PLAYWRIGHT_MODULE to an installed playwright-core module. This session reused ../copycat/frontend/node_modules/playwright-core (absolute path in the environment variable), with its existing Chromium installation. No new dependency was installed.
- Browser runner accepts BASE_URL (default http://localhost:3005); screenshots are written to the OS temporary folder as overworld-desktop-top.png, overworld-battle.png and overworld-projects-{width}.png. Screenshots were visually inspected.
- python scripts/export-overworld.py regenerates the manifest from repository assets; add --import-downloads only when intentionally reimporting the original folders. Requires Pillow. Downloads originals were preserved.
