# Lessons Learned

## Portfolio overworld corrections (2026-09-21)
- Shared ledge residents must be able to pass each other. Mutual collision waits can deadlock walkers and bonded followers. Keep landing checks for hops, but do not block ordinary walking past another resident.
- Bonded pairs must start with separate 44px tap targets; spawning both at one position makes one permanently inaccessible in reduced motion. Refresh event-only parent metadata when a sprite sheet finishes decoding.
- Giratina's supplied form is grounded. Mega Zeraora needs a 35% faster travel speed to match its footstep animation; apply the multiplier to every newly chosen walking speed.
- Prevent sprite-sheet transition flicker by keeping the previous complete pose until the next image has decoded. Late image completions must not replace a newer pose. Warm nearby Idle/Walk/Sleep/Hop sheets ahead of behavior changes.
- Eevee joins Vaporeon, Jolteon, Flareon, Umbreon and Sylveon in a dedicated Transform Forest base. Use the archived stone colour frames, record source/quality/timing limits, and define an explicit clearing boundary and obstacle around the stone. Test each movement segment, including waypoint corners.
- Yveltal's dormant egg belongs on top of the SSH button (formerly the 3D button, replaced 7 Oct 2026), centered on its top edge. Keep the egg's hit area above the button so awakening and opening the terminal remain separate actions.
- Rowlet's supplied sheets are walking poses, not flight. Keep Rowlet grounded on a separate surface. Do not stack flyers above a battle pair or occupied ground ledge when assigning habitats.
- Keep the Route 111 label close to its map (original small gap). Reserve the label's measured text footprint when choosing Silvally's walking range instead of lifting the label to create space.
- Fidough/Goomy should share the first project-card row and hop only to adjacent cards with matching top edges. Recompute adjacency on responsive reflow; never leap vertically through stacked mobile cards.
- Responsive hop cancellation must run before offscreen simulation culling. A resize can both stack the cards and move a jumping resident offscreen in the same frame.
- Yveltal awakens from Special2 via Special0, then flies in page-anchored whitespace near the awakening location. Never pin active flight to the viewport or let him cover text/components. Check the full sprite footprint and every path segment, not just destination points. Recheck obstacles after scrolling or responsive reflow.
- Inspect animation contact sheets before assigning behavior: PMD Hover can be a spin/action, not sustained flight. Use visually verified directional wingbeats and keep altitude independent of animation frame resets.
- Match apparent body sizes to species; a small Rowlet must not have the same target height as Corviknight. Compare ground and airborne silhouettes together.
- Latest placement correction: Silvally belongs on a real surface like the other residents, specifically the Route 111 map's top edge. He should wander, turn and rest there, not roam through blank left-panel space or remain pinned to a viewport corner. All non-battling residents need accessible click/touch/keyboard reactions like Teddiursa.
- Include Skills, other project cards and Media appearances as habitats. Randomize destinations, rests, glances and battle bouts; a random starting offset does not make a fixed repeating cycle feel alive.
- Occasional naps are part of the requested behavior. Use authentic Sleep sheets, varied timing and wake-on-click; flyers must land before sleeping.

## Playground scope

Map refinements: keep previews free of persistent white text bars; do not add resident-count slogans or pause controls. Use authentic Gen III reaction sprites, place berries on reachable tiles offset from every Pokémon, and clamp zoom to cover the map viewport. Terrain overrides must not turn cliff faces, walls or roofs into paths; verify sprite occlusion against elevation and structure depth.

Preserve the complete existing map rosters (32 Route 111, 12 Mauville) when changing renderers; optimize culling and scheduling rather than removing residents. Keep the original portfolio mouse behavior; restrict new pointer handling to focused maps. Newly introduced Pokémon item art must use authentic game assets with recorded provenance, not approximations or generated art.

## Lesson 1: Normalize sprite scales by target rendered height, not arbitrary values

**Rule:** When assigning a `scale` to pokemon sprites for the cursor, always compute it so that all pokemon produce a consistent rendered walk-frame height (≈ 96–101px, matching Diancie as the reference).

**Formula:** `scale = TARGET_HEIGHT / sprite.walk.frameHeight`

**Why:** Sprites from the PMD sprite project have wildly different base pixel dimensions (e.g. Ceruledge walk fH=56px vs Latios walk fH=80px). Picking an arbitrary scale like `2.2` for small sprites and `1.5` for large ones without checking the rendered output produces cursors that are visually 20–30% larger than the reference pokemon.

**How to apply:** Whenever adding a new pokemon cursor config, verify: `frameHeight × scale ≈ 100px` for the walk animation before committing.
# Scope correction: live maps only
- The user rejected the mouse, navigation, page layout and document viewer changes. Restore the pre-audit portfolio, including its original mouse behavior. Keep the previously requested Resume/CV feature. Restrict this task's UI changes to Route 111, Mauville and their focused playground.

## Lesson 2: Page-anchored sprites must model ink and neutralise sticky obstacles

**Rule:** For a roamer that holds a document position, (a) build its no-fly map from *inked* geometry, and (b) make that map scroll-invariant before trusting it.

**Why:** Yveltal's first version looked correct to its own tests yet failed both of the user's checks.
- Its obstacles were per-text-node line rectangles plus a short selector list, so every element box's internal whitespace counted as free air. He threaded between the lines of the `h1` and between the Resume/CV and 3D buttons — on a phone he sat inside that button row in 45 of 50 samples. A probe written from the same selector list agrees with the bug; it proves nothing.
- The perch lives in `aside.lg:sticky`. A sticky element's document-space rect moves on every scroll, so its obstacle boxes swept through the habitat and shepherded him down the page (docTop drifted 501→584 over one scroll). A viewport-anchored obstacle inside a document-anchored simulation reads to the user as "he follows my screen".

**How to apply:**
- Obstacle per element = the union of its direct text line rects (not per line — inter-line gaps are not blank space), or its border box when it is replaced/interactive or paints a background, border or shadow.
- For anything under a `sticky`/`fixed` ancestor, extend the box vertically over that ancestor's containing block. The map then stops depending on `scrollY`, which both kills the drag and lets you rebuild only on layout change (~1.1ms for 606 elements) instead of on a timer.
- Verify with a probe that does *not* share the implementation's model — sample `elementsFromPoint` across the sprite body and classify each hit as painted / replaced / inside a glyph rect.
- A whole-document habitat makes any full-bounds grid search (`settleFlight`) quadratic. Search outward in rings from the current position and prefilter obstacles to a window around the sprite.

**Also:** the committed `test:yveltal:browser` was already red before this task, and its Silvally block used `scrollIntoViewIfNeeded`, which can leave the map's top edge above the viewport — Silvally is hidden by design at that point, so the assertion then measured a stale transform. Pin the scroll explicitly. Run the suite before assuming a failure is yours.

## Cursor forms (2026-10-06)
- The owner explicitly asked to port Voracity's cursor forms (Soul Unison, Mega Evolution, cursor line-up) to the portfolio, so the earlier "keep the original cursor" scope does not block them. See `tasks/pokemon-forms.md`; keep it in step with Voracity.
- Client components here are server-rendered first: never read `window` or `localStorage` during render or in state initialisers; start from defaults and load saved choices after mount.


## Scroll audit (6 October 2026)
- The owner explicitly requested scroll/lag fixes on both sites. Preserve the visual design and all residents; reduce measured offscreen/style/layout work. See tasks/scroll-performance.md. Native smooth navigation must honour reduced motion.

## Regrow commits count on the graph (2026-10-06)
- The owner chose to author the README regrow commits as themselves (the account's noreply address) so the
  contribution graph shows the pipeline is alive, accepting about 12 commits a day and the inflated Explorer
  Rank. Don't switch them back to github-actions[bot] without asking. The push stays GITHUB_TOKEN's, so the
  message log still leaves them out.

## Castform's company (2026-10-07)
- A shiny Castform keeps Castform company on the portfolio, the README and Voracity, always in the same weather
  form (PMD SpriteCollab shiny sheets). Form changes already worked: rain/showers/thunder → Rainy, "Fair & Warm"/
  "Sunny" by day → Sunny, the usual "Partly Cloudy"/"Fair"/night → Normal. Change all three surfaces together.

## Attribution (2026-10-07)
- Weather data carries its licence notice beside it: NEA (data.gov.sg) needs the Singapore Open Data Licence notice and
  link; Open-Meteo needs "Weather data by Open-Meteo.com" (CC BY 4.0). SpriteCollab credit names its contributors,
  links CC BY-NC 4.0 and notes modifications. Credits state a non-commercial fan project, unaffiliated with Nintendo /
  The Pokémon Company. Keep the portfolio, the README and Voracity consistent (`WeatherCredit.tsx` in both apps).

## Terminal, Ask and media strip (2026-10-07)
- The terminal is a window over the page (7 Oct 2026): the ">_ SSH" button replaces 3D; the window drags by its title
  bar, maximises, minimises back into the button (keeping the session) and closes (fresh session next time), like
  the reference site. /terminal stays as a full-page version for direct links. The welcome is the owner's KEVAN
  banner (verbatim) and Squirtle from Pokémon Blue's title screen as block text art (owner: "the diancie looks bad").
- /terminal is the portfolio as a pretend SSH session. Its folders are the page's sections and its files are built
  from src/data at render time: never copy portfolio content into it (owner: "read off the current portfolio's
  content so it doesn't need separate updating"). Regenerate the art with scripts/build-terminal-art.py.
- A real SSH server (the untracked Go/Wish draft in ssh-portfolio/) needs a VPS; keep to free hosting unless the
  owner decides otherwise.
- "Ask about me" opens Claude or ChatGPT with a prompt built from `personal`. Media appearances scroll as a strip that
  pauses on hover/focus; its static frame keeps the media-card resident perch; reduced motion shows a scrollable row.
