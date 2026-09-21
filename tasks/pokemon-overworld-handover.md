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
- Production build and TypeScript passed. Initial Chromium desktop screenshots confirm feet on dividers/card tops, flying sprites above the lines, and Silvally at top-right; no browser errors. Full responsive/interaction/regression checks are next.

## Workspace boundaries
Pre-existing changes must not be staged: portfolio/src/components/MouseGradient.tsx; .claude/settings.json; portfolio MP3/companylogos; unrelated untracked public/icons files; ssh-portfolio/.
Stage explicit paths only. Pushing main triggers Vercel. Keep Downloads originals as a backup.

## Resume / verification
- Read this file and git log/status first. Do not restart imported assets unnecessarily.
- npm run build in portfolio/; focused overworld simulation/asset/browser checks will be added as needed.
- Original map logic is separate and is not changed by this work.
