# Friend Areas — review draft, 7 October 2026

The owner requested selectable PMD Friend Areas in both websites and a random
area in the existing README garden. Review the renders before merging either
branch. No deployment or merge is part of this draft delivery.

## Implemented

- Existing Eevee garden remains the default. Click its scenery or use Explore
  Friend Areas to open the native dialog. Its selector changes the collapsed
  garden too; the choice persists in this browser. Escape and close restore focus.
- Mushroom Forest: Paras, Parasect, Seedot, Nuzleaf, Shiftry, Shroomish, Breloom.
- Mt. Moonview: Clefairy, Clefable, Cleffa, Lunatone, Solrock, Jirachi.
- Decrepit Lab: Abra, Kadabra, Alakazam, Mr. Mime, Ditto, Porygon, Porygon2.
- All native residents are shown; each new area's population and positions survive
  area changes during the page visit. Existing Transform Forest keeps its curated
  roster, including Sylveon; it is not relabelled as a Red/Blue native roster.
- SpriteCollab Idle/Walk/Sleep assets for all 20 species are downloaded. Web drafts
  use Idle and Walk; README uses Idle at safe seats. Source duration arrays drive
  animation. Web movement is capped at 30fps, elapsed time at 64ms, and pauses when
  hidden, offscreen, covered, or under reduced motion / Voracity quiet mode.
- README regeneration chooses among the existing forest and the three additions
  once, sharing that choice across themes. It replaces the existing scene rather
  than adding another card. No viewer-dependent randomization or external SVG calls.

## Fidelity limits — resolve before production approval

The three new backgrounds are game-derived PNGs from
[Pamtre Berry](https://pamtre-berry.neocities.org/articles/friendareas), whose author
describes occasionally rebuilding scenery layers from ripped assets. They are not
independently verified untouched ROM images. The credited rippers are Toastypk
and MYSTERY_DUNGEON. Exact URLs and SHA-256 digests are in the catalog.

Sprites come from [PMDCollab/SpriteCollab](https://github.com/PMDCollab/SpriteCollab)
at revision `6cec0a7f7ed48390a2d22d9e11fd96079e6f406e`. Each species retains
AnimData.xml and credits.txt; catalog entries include hashes and alias resolution.

**Environmental animation frames and timing remain unverified.** New backgrounds
are held still, with no invented moon glints, lab scans, pulses or weather tints.
Transform Forest retains its existing stone and shared sky. Before merge, obtain
and verify the new areas' original scenery frame sequences, especially the lab's
dome, screens and tanks; document any area that is intentionally left static.

**Collision boundaries are conservative hand-traced foot zones, not original game
collision meshes.** The log and machine are excluded. Moonview uses three separate
terrace zones; residents cannot cross the pond or jump between elevations. Review
the green/red overlay against gameplay, then refine connected routes where verified.
These zones include 6px foot clearance; they do not reconstruct foreground layers
or guarantee whole-sprite occlusion against every scenery pixel.

Roster references: [Mushroom Forest](https://bulbapedia.bulbagarden.net/wiki/Mushroom_Forest),
[Mt. Moonview](https://bulbapedia.bulbagarden.net/wiki/Mt._Moonview),
[Decrepit Lab](https://bulbapedia.bulbagarden.net/wiki/Decrepit_Lab).

## Reproduce / handover

1. `python scripts/fetch-friend-areas.py` explicitly refreshes pinned assets.
   Builds do not download from third parties. Requires Pillow.
2. `node scripts/friend-area-layouts.mjs` exports safe initial seats for README.
3. Keep `public/friend-areas` and the three `FriendArea*` / `friend-areas.ts`
   source files byte-identical to the portfolio copies (components directory).
4. `npx vitest run tests/friend-areas.unit.test.ts`: ten-minute seeded simulation
   per area, collision shortcuts and nonuniform animation timing.
5. `npm run dev -- --port 5187`; portfolio `npm run dev -- --port 3187`.
   `/friend-areas-preview.html` provides the contact sheet and collision toggle.
6. `python scripts/preview-friend-area-readme.py` generates sample-data README
   variants and checks all eight SVGs are valid and self-contained.
7. `node scripts/review-friend-areas.cjs` checks real dialogs on both sites and
   saves desktop/mobile screenshots under ignored `artifacts/friend-areas`.
   Its README screenshot uses the sample SVGs generated in step 6.

Validation on the rebased draft: both production builds passed; five focused
unit tests passed; real desktop/mobile dialogs, persistence, Escape and focus
restoration passed on both apps, with no page JavaScript errors. README generation
validated eight self-contained SVGs and all four possible random destinations.

Next agent prompt: “Continue the Friend Area draft branches in Voracity and
kevanwee. Read FRIEND-AREA-DRAFTS.md. Preserve the approved default garden and all
existing account/security behaviour. Verify original scenery animation frames and
collision routes, inspect the draft renders with the owner, then prepare the
approved implementation. Do not merge/deploy before the requested visual review.”
