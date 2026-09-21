# Portfolio overworld handover

## Current follow-up (2026-09-21, after the expanded roster and egg improvements)
- Preserved the user's new packs, bonded pairs, ledge capacities, random project-tile occupants, grounded Dragonair/Dragonite and docked Yveltal egg. The current Yveltal implementation flies in page whitespace on desktop and perches below 1024px; no replacement of those improvements was made.
- Giratina is now grounded in both the roster and generated sprite metadata. Mega Zeraora gets a 1.35 speed multiplier at spawn and every new walking decision.
- Shared-row walkers can pass each other, eliminating mutual collision waits. Occupied hop landing checks remain. Bonded pairs now spawn 46px apart so each has a separate tap target even with reduced motion.
- Checked every used frame across all 60 sprite variants: none is empty. The shared painter now caches decoded images, keeps the previous complete pose during a pending sheet load and ignores stale completions. Nearby Walk/Idle/Sleep/Hop sheets preload before behavior switches.
- Added `EeveeBase.tsx` between Projects/Skills and Media. Eevee, Vaporeon, Jolteon, Flareon, Umbreon and Sylveon now live there and are excluded from the generic ledge roster.
- `eevee-base.ts` defines the native 480x312 forest clearing, full-body exclusion around the central stone, safe grid routes, directional movement, independent random pauses/naps and click/keyboard greetings. Every movement segment is checked in simulation; waypoint positions snap exactly at corners to prevent tiny diagonal shortcuts through the stone boundary.
- Authentic area: Transform Forest, original rip by Toastypk, TSR asset 5395. The original PNG endpoint returned 403; the public Pamtre Berry archive supplies the matching background and all 32 stone colour poses. The archived stone sheet is JPEG, so it is not lossless original art. Playback uses 120ms per pose; exact in-game timing was not supplied. No synthetic glow/recolour was substituted.
- `public/eevee-base/sources.json` records URLs, hashes, stone alignment (209,177), crop dimensions and limitations. `scripts/export-eevee-base.py` regenerates the atlas from the preserved source. Credits link the archive.
- Verification so far: production build/TypeScript passed; 4,328 original sprite-file hashes passed; simulation checks cover shared-row passing, separate initial pair tap targets, Zeraora pace, grounded Giratina and all six forest residents exploring all four regions for 40 simulated minutes without crossing the stone/roots. All six nap and wake. Delayed-decode tests retain the last pose and reject stale completion; initial sheet decoding also wakes event-only renders to refresh parent metadata.
- `npm run test:eevee-base:browser` passed at 1440/390/320px: six residents, original stone frame cycle, visible roaming, keyboard hearts, no clipping, reduced motion and offscreen pause. Desktop/phone screenshots visually reviewed (`eevee-forest-*.png`, `eevee-base-*.png` in OS temp). The broader browser regression suite is running.
- `npm run test:yveltal:browser` passed the user's current desktop-flight/mobile-perch behavior, whole hatch sequence, reflow, greetings, project tile hopping and zoomed sticky egg placement, with no exceptions or broken assets.

## Earlier checkpoint notes (historical; current scope above supersedes roster/placement details)
- Rowlet walks on Skills; Corviknight has its own footer airspace. Flyers no longer share ground/battle surfaces.
- Fidough/Goomy start on the first and third other-project cards and randomly hop between adjacent cards in that row. Live DOM adjacency, landing reservations and same-card spacing prevent collisions. Hops cancel when responsive cards stack. Hop poses face the landing card.
- Imported Downloads/yveltal with original bytes preserved. Special2 is the dormant cocoon; click/tap plays the full Special0 (27 frames / 4.32s) before directional Walk flight begins. Latest requested perch: centered on the 3D button's top edge. The decorative divider is restored to its original width.
- Latest correction in progress: active Yveltal explores page-anchored whitespace within 210px vertically of his awakening location. The layer is absolute within the page, so he scrolls out of view and pauses offscreen. Text line rectangles and solid components are expanded by the full sprite/hitbox footprint; targets and each movement segment must avoid them. Layout changes relocate him to nearby clear space, or hide him if no safe space remains. Egg stays on the 3D button; hatch/flight remain at document coordinates after awakening. Build and pure collision checks pass; targeted browser checks are running.
- Route 111's label is back to its original 12px map gap. Silvally's walking interval excludes the actual rendered label text plus 40px clearance. On narrow phones the label wraps to leave space for him on the map edge.
- Build/TypeScript, source/hash/simulation checks, the existing full browser regression suite and targeted Yveltal/hopping browser verification passed. The latter caught an offscreen-resize hop cancellation bug, now fixed and covered in both simulation and browser checks.

## Completed scope (2026-09-21, including user corrections)
- Imported all 30 supplied Downloads packs: 13 species and 17 Silvally forms. Existing Ceruledge is reused. Originals remain in Downloads.
- Seven ground residents populate Skills, other-project cards, Media, featured projects and a divider. Four ordinary flying species occupy separate airspaces; Yveltal has independent page-anchored flight. Armarouge and Ceruledge always share one divider.
- **Latest Silvally decision:** walk and rest on the top edge of the Route 111 map, to the right of its closely spaced label. The earlier viewport-corner and left-panel placements were rejected and removed.
- Silvally walks both ways, occasionally looks in other directions, sleeps and wakes. He keeps all 17 forms, random automatic change intervals and click/Enter/Space RearUp/Double transformations. Clicking wakes him. Automatic form changes do not reset his nap deadline.
- All 11 non-battling residents are accessible 44px buttons. Mouse, touch or Enter/Space makes them face the visitor and display the same authentic heart asset used by Teddiursa. Hover/keyboard focus holds the target still. Clicking wakes sleepers.
- Random destinations, speeds, pauses and glances replace repetitive edge-to-edge shuttles. Independent nap timers and varied nap lengths keep residents from sleeping together on a fixed schedule. Flyers land before sleeping and rise afterward. Silvally and residents pause offscreen/behind dialogs/in hidden tabs.
- The battle pair uses randomized approach/ready/attack/retreat/rest phases, variable bout lengths, random initiator and one to four attacks per bout. It no longer repeats a fixed 16-second cycle.
- Flight was visually reviewed frame by frame. Talonflame's Hover sheet spins; several other Hover sheets are rapid actions. Flight now uses the directional Walk wingbeats at species-specific tempos. Altitude moves gradually and is independent of animation resets.
- Visible Walk body-height targets: Rowlet 22px; Goomy 24; Fidough 25; Pawmi 26; Beautifly 30; Flareon/Tyrunt 32; Breloom/Talonflame 36; Noivern 40; Corviknight 42; battle pair 43; Yveltal 54; Silvally 58. Idle/sleep feet anchor to their own alpha bounds; moving/action sheets keep their shared origin.
- Reduced motion freezes autonomous activity, while explicit greetings and instant form changes still work; hearts clear after the interaction. Modals suppress the overlays and suspend their clocks.

## Files and maintenance
- `portfolio/src/lib/pokemon-overworld.ts`: pure wandering, greeting, nap and randomized battle state machines. `stepWanderer` supports direction changes; Silvally's current route uses the horizontal map edge.
- `portfolio/src/components/PokemonOverworld.tsx`: one 30fps imperative renderer, sprite buttons, visibility handling, Silvally form changes, asset preloading. No per-frame React renders.
- `portfolio/src/lib/overworld-sprites.ts`: shared frame painter and sprite metadata types.
- `portfolio/src/components/YveltalRoamer.tsx` and `portfolio/src/lib/yveltal-flight.ts`: dormant/hatching/active renderer and pure random flight controller. Special0 uses the shared PMD origin offset +6, matching the cocoon feet. Avoid substituting Walk's foot offset during the hatch.
- `portfolio/src/components/WorldPreview.tsx`: Route 111 `data-silvally-surface` anchor and `data-silvally-label` text exclusion. Does not change either map's simulation/roster.
- `data-overworld-surface` opts in regular surfaces. `data-overworld-kind` identifies priority habitat groups. Skills/Projects/Media contain the new markers.
- `portfolio/scripts/export-overworld.py`: validates supplied XML/PNGs and builds `src/data/overworld-sprites.json`. Requires Pillow. `python scripts/export-overworld.py` regenerates from repository assets; `--import-downloads` is only for intentional reimport.
- `portfolio/public/overworld/sources.json`: SHA-256 receipts for all 2,625 supplied files. `.gitattributes` preserves original XML bytes across platforms. All source hashes were verified.
- Only nearby resident sheets and current/next Silvally forms load in the browser; the full source archive is not downloaded at runtime. Original unused animations/shadows/offsets are retained for future work. Existing PMD SpriteCollab credits apply.

## Verification
- Latest 3D-button perch correction: production build passed; browser checks at 1440/390/320px confirmed centered top-edge alignment, independent 3D-button activation, modal hiding/restoration, egg click/tap awakening and no browser errors. Desktop/phone screenshots were visually reviewed (`yveltal-3d-*.png` in OS temp).
- `npm run build` from `portfolio/`: production build and TypeScript passed.
- `npm run test:overworld`: all asset hashes and frame metadata; 32 seeds, 100 seconds per seed; priority habitats, species sizing, steady flight selection, random battle phases/durations, all species sleeping/waking, flyer landing, greeting holds, eight Silvally facing directions, offscreen suspension and responsive bounds.
- Additional pure checks cover both jumpers visiting all three cards across 12 seeds, stacked-card adjacency, offscreen mid-hop cancellation, separate flyer habitats and 20,000 Yveltal flight steps across alternating phone/desktop bounds.
- `npm run test:overworld:browser`: automatic change and all 17 forms; all 11 greetings by mouse/keyboard; mobile touch and reduced-motion heart cleanup; 320/390/768/1440px surface/foot alignment and no added document overflow; hidden-tab simulation; reduced motion; actual map modal and restoration; natural Silvally sleep while automatic form changes run; randomized bouts; ground/flyer naps and wake-on-click. No browser exceptions or broken sprite requests.
- `npm run test:yveltal:browser`: real 4.32s awakening through frame 26 at 1440/390/320px; dormant perch alignment, active viewport movement, portrait/landscape resize bounds, scroll persistence, hearts, reduced motion and modal suspension. Route 111 retains its 12px gap with measured text clearance at 320/390/768/1440px. Both Fidough/Goomy visibly hop using the proper directional Hop sheet; phone reflow cancels hops. No browser exceptions or broken sprite requests.
- Long browser behavior checks accelerate RAF timestamps (4x, with the production delta cap still applied), without modifying simulation state. Normal-speed interaction and geometry checks run separately within the same runner.
- Browser runner needs a running production site (`npm run start -- --port 3005`) and Playwright. Set `PLAYWRIGHT_MODULE` to an installed playwright-core module if not locally installed; this session reused `../copycat/frontend/node_modules/playwright-core` via its absolute path. `BASE_URL` defaults to `http://localhost:3005`. No new npm dependency was installed.
- Screenshots live in the OS temporary folder, including `silvally-route111.png`, `silvally-route111-mobile.png`, `skills-pokemon-heart.png` and the browser runner's desktop/responsive captures. Desktop and phone captures were visually reviewed.
- Latest visually reviewed captures: `yveltal-desktop.png`, `yveltal-hatch.png`, `yveltal-flight.png`, `label-phone.png`, `yveltal-dormant-390.png` and `yveltal-active-320.png`. These are diagnostics outside the deployed public directory.
- Existing `npm run test:world` passed in the initial iteration (44 map residents, 16,286,400 reservation checks). Map logic was not changed in this follow-up.
- Known pre-existing issue: Experience Tech/Legal filters overflow a 320px viewport (388px document width), confirmed with overlays removed. This feature adds no document overflow. Physical Safari/iOS testing has not been performed.

## Commit checkpoints / deployment
- `ef3177f`: import packs and initial handover.
- `1972f70`, `e90e635`, `c595072`: first implementation, original XML preservation and verification.
- `b87696e`: extra habitats, interactive residents, corrected flight/sizes, random movement/bouts and naps.
- `573aa1e`: latest requested Route 111 placement and autonomous sleep/form coexistence.
- `3b54fe6`: previous iteration's full browser verification/handover.
- `1922cc1`: Yveltal source import, generated animation metadata, receipts and follow-up handover.
- `83f5a40`: verified Yveltal awakening/viewport flight, grounded Rowlet, separate Corviknight, responsive project-card hops and compact Route 111 label exclusion.
- All checkpoints pushed to origin/main; pushes deploy through Vercel. Final verification/handover is in the following commit.
- Live site: https://kevanwee.vercel.app
- Live deployment smoke check after `83f5a40`: mobile touch awakened Yveltal into active flight; Rowlet reported grounded, Corviknight occupied sky-footer, Route 111 label had a 12px gap, and no browser exceptions occurred.

## Preserve unrelated user work
Never stage the pre-existing `portfolio/src/components/MouseGradient.tsx` change, `.claude/settings.json`, portfolio MP3/companylogos, unrelated untracked `public/icons` files, or `ssh-portfolio/`. Stage explicit task paths only. No unrelated personal files were published.
