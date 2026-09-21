# Portfolio overworld handover

## New follow-up in progress
- Ground Rowlet and move Corviknight to a separate, uncrowded airspace.
- Put Fidough/Goomy on the first three other-project cards; add adjacent same-row hopping with responsive cancellation when cards stack.
- Import Downloads/yveltal. Reviewed Special2 (dormant cocoon), Special0 (27-frame / 4.32s hatch sequence) and directional Walk wingbeats.
- Add a dormant left-panel divider perch; clicking awakens Yveltal, then he can roam the viewport with smooth random destinations, resize clamps and phone-specific scale. Keep modal/visibility/reduced-motion handling.
- Existing completion notes below describe the previous iteration until this follow-up is verified.

## Completed scope (2026-09-21, including user corrections)
- Imported all 29 supplied Downloads packs: 12 species and 17 Silvally forms. Existing Ceruledge is reused. No further sprite downloads were needed; originals remain in Downloads.
- Six ground residents populate random surfaces, guaranteeing a resident on Skills, an other-project card, a Media card and a featured project, plus available dividers/cards. Five flying species occupy section airspaces. Armarouge and Ceruledge always share one divider.
- **Latest Silvally decision:** walk and rest on the top edge of the Route 111 map, like the other surface residents. The earlier viewport-corner and left-panel placements were rejected and removed. The original LeftPanel layout is restored. Route 111's heading has clearance for his sprite above the box.
- Silvally walks both ways, occasionally looks in other directions, sleeps and wakes. He keeps all 17 forms, random automatic change intervals and click/Enter/Space RearUp/Double transformations. Clicking wakes him. Automatic form changes do not reset his nap deadline.
- All 11 non-battling residents are accessible 44px buttons. Mouse, touch or Enter/Space makes them face the visitor and display the same authentic heart asset used by Teddiursa. Hover/keyboard focus holds the target still. Clicking wakes sleepers.
- Random destinations, speeds, pauses and glances replace repetitive edge-to-edge shuttles. Independent nap timers and varied nap lengths keep residents from sleeping together on a fixed schedule. Flyers land before sleeping and rise afterward. Silvally and residents pause offscreen/behind dialogs/in hidden tabs.
- The battle pair uses randomized approach/ready/attack/retreat/rest phases, variable bout lengths, random initiator and one to four attacks per bout. It no longer repeats a fixed 16-second cycle.
- Flight was visually reviewed frame by frame. Talonflame's Hover sheet spins; several other Hover sheets are rapid actions. Flight now uses the directional Walk wingbeats at species-specific tempos. Altitude moves gradually and is independent of animation resets.
- Visible Walk body-height targets: Rowlet 22px; Goomy 24; Fidough 25; Pawmi 26; Beautifly 30; Flareon/Tyrunt 32; Breloom/Talonflame 36; Noivern 40; Corviknight 42; battle pair 43; Silvally 58. Idle/sleep feet anchor to their own alpha bounds; moving/action sheets keep their shared origin.
- Reduced motion freezes autonomous activity, while explicit greetings and instant form changes still work; hearts clear after the interaction. Modals suppress the overlays and suspend their clocks.

## Files and maintenance
- `portfolio/src/lib/pokemon-overworld.ts`: pure wandering, greeting, nap and randomized battle state machines. `stepWanderer` supports direction changes; Silvally's current route uses the horizontal map edge.
- `portfolio/src/components/PokemonOverworld.tsx`: one 30fps imperative renderer, sprite buttons, visibility handling, Silvally form changes, asset preloading. No per-frame React renders.
- `portfolio/src/components/WorldPreview.tsx`: Route 111 `data-silvally-surface` anchor and heading clearance. Does not change either map's simulation/roster.
- `data-overworld-surface` opts in regular surfaces. `data-overworld-kind` identifies priority habitat groups. Skills/Projects/Media contain the new markers.
- `portfolio/scripts/export-overworld.py`: validates supplied XML/PNGs and builds `src/data/overworld-sprites.json`. Requires Pillow. `python scripts/export-overworld.py` regenerates from repository assets; `--import-downloads` is only for intentional reimport.
- `portfolio/public/overworld/sources.json`: SHA-256 receipts for all 2,582 supplied files (~14.3 MiB). `.gitattributes` preserves original XML bytes across platforms. All source hashes and committed XML blob hashes were verified.
- Only nearby resident sheets and current/next Silvally forms load in the browser; the full source archive is not downloaded at runtime. Original unused animations/shadows/offsets are retained for future work. Existing PMD SpriteCollab credits apply.

## Verification
- `npm run build` from `portfolio/`: production build and TypeScript passed.
- `npm run test:overworld`: all asset hashes and frame metadata; 32 seeds, 100 seconds per seed; priority habitats, species sizing, steady flight selection, random battle phases/durations, all species sleeping/waking, flyer landing, greeting holds, eight Silvally facing directions, offscreen suspension and responsive bounds.
- `npm run test:overworld:browser`: automatic change and all 17 forms; all 11 greetings by mouse/keyboard; mobile touch and reduced-motion heart cleanup; 320/390/768/1440px surface/foot alignment and no added document overflow; hidden-tab simulation; reduced motion; actual map modal and restoration; natural Silvally sleep while automatic form changes run; randomized bouts; ground/flyer naps and wake-on-click. No browser exceptions or broken sprite requests.
- Long browser behavior checks accelerate RAF timestamps (4x, with the production delta cap still applied), without modifying simulation state. Normal-speed interaction and geometry checks run separately within the same runner.
- Browser runner needs a running production site (`npm run start -- --port 3005`) and Playwright. Set `PLAYWRIGHT_MODULE` to an installed playwright-core module if not locally installed; this session reused `../copycat/frontend/node_modules/playwright-core` via its absolute path. `BASE_URL` defaults to `http://localhost:3005`. No new npm dependency was installed.
- Screenshots live in the OS temporary folder, including `silvally-route111.png`, `silvally-route111-mobile.png`, `skills-pokemon-heart.png` and the browser runner's desktop/responsive captures. Desktop and phone captures were visually reviewed.
- Existing `npm run test:world` passed in the initial iteration (44 map residents, 16,286,400 reservation checks). Map logic was not changed in this follow-up.
- Known pre-existing issue: Experience Tech/Legal filters overflow a 320px viewport (388px document width), confirmed with overlays removed. This feature adds no document overflow. Physical Safari/iOS testing has not been performed.

## Commit checkpoints / deployment
- `ef3177f`: import packs and initial handover.
- `1972f70`, `e90e635`, `c595072`: first implementation, original XML preservation and verification.
- `b87696e`: extra habitats, interactive residents, corrected flight/sizes, random movement/bouts and naps.
- `573aa1e`: latest requested Route 111 placement and autonomous sleep/form coexistence.
- All checkpoints pushed to origin/main; pushes deploy through Vercel. Final verification/handover is in the following commit.
- Live site: https://kevanwee.vercel.app

## Preserve unrelated user work
Never stage the pre-existing `portfolio/src/components/MouseGradient.tsx` change, `.claude/settings.json`, portfolio MP3/companylogos, unrelated untracked `public/icons` files, or `ssh-portfolio/`. Stage explicit task paths only. No unrelated personal files were published.
