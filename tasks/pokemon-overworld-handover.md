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
- Implementing asset import and metadata generation.

## Workspace boundaries
Pre-existing changes must not be staged: portfolio/src/components/MouseGradient.tsx; .claude/settings.json; portfolio MP3/companylogos; unrelated untracked public/icons files; ssh-portfolio/.
Stage explicit paths only. Pushing main triggers Vercel. Keep Downloads originals as a backup.

## Resume / verification
- Read this file and git log/status first. Do not restart imported assets unnecessarily.
- npm run build in portfolio/; focused overworld simulation/asset/browser checks will be added as needed.
- Original map logic is separate and is not changed by this work.
