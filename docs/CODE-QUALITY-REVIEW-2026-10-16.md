# Code-quality review: 16 October 2026

Ran [Fallow](https://github.com/fallow-rs/fallow) 3.33.1 at the repository root, then at `portfolio/` with installed dependencies and explicit script roots. The root has no npm installation, so the final portfolio scope is the reliable JS/TS app report. Python generators and historical HTML need separate review. Work is local on `refactor/fallow-cleanup`; no deployment was triggered.

## Removed verified redundancies

Eight components had no consumers reachable from active routes: `ClientWidgets`, `DiancieCursor`, `Hero`, `IcaCanvas`, `IcaFloat`, `Nav`, `PokemonWalker`, `PortfolioModal`. Source search found only references within the removed families. Fallow traced the old cursor as unreachable with no direct references. The current `PokemonCursor`, `LeftPanel`, overworld, dialogs and routes remain in use.

The removed Ica viewer exclusively imported `@react-three/fiber`, `@react-three/drei` and `three`. Those dependencies and `@types/three` were removed; npm removed 56 packages. This deletes 1,111 source lines and the old cursor's duplicated implementation. These files were already unreachable, so this is maintenance/install cleanup rather than a measured page-speed improvement. Historical root pages/styles and artwork were retained.

The [C4 component diagram](../ARCHITECTURE.md) now identifies the maintained implementations. The pure movement engines already run unchanged in browser components and Node checks; they provide runtime isomorphism without additional classes. No inheritance hierarchy was introduced where functions over explicit state already express the model clearly.

## Remaining work

1. `npm run lint` is broken: it invokes `next lint`, and the installed CLI treats `lint` as a nonexistent directory. Fallow also flags ESLint and its Next configuration as unused. Install/configure a working ESLint CLI path and address its actual results; the build is not a substitute for lint.
2. Reduce large coordination surfaces in tested increments: `stepOverworld` cyclomatic 91, overworld `draw` 71, PC component 40, terminal `run` 30. Separate canvas layers/commands where responsibilities actually differ. No performance claim follows from a lower score alone.
3. Consider shared drag/pointer and modal lifecycle helpers after pinning focus return, Escape, pointer capture, touch and reduced motion. Similar shapes are not sufficient evidence for a common base class.
4. Review exports against the custom test loaders. Several tests read and transpile source in memory, which is invisible to import-graph analysis; do not delete simulation exports merely because the graph lacks their consumer.

Final configured portfolio report: 58 graph/dependency findings (53 exports, 3 types, 2 development dependencies), 12 clone groups, 262 duplicate lines (2.15%) and 160 complexity findings. No unused files or import cycles were reported. No boundary policies or rule packs were configured, so layering is not enforced by these counts. Coverage figures are estimates, not measured runtime coverage. Initial repository-root totals use a different scope/configuration and must not be presented as a comparable defect delta.

## Validation and reproduction

Production build passed. World checks passed 16,286,400 movement reservations, overworld/forest checks passed, terminal checks passed, and the Vercel-ignore test passed. The lint failure above remains explicit. All architecture diagrams rendered in Chromium; whitespace checks passed. No visual layout changed and no production browser inspection is claimed.

From `portfolio/`:

```powershell
npx --yes fallow@3.33.1 --format json --no-cache
npx --yes fallow@3.33.1 architecture --format json
npm run build
npm run test:world
npm run test:overworld
npm run test:terminal
npm run test:vercel-ignore
```

`.fallowrc.json` declares manual Node tools as entry points and excludes artifacts. No hooks, paid features, telemetry or deployment settings were enabled.

## User-facing preservation check

Follow-up verification on 16 October against the local production build passed:

- Action styling, equal Resume/SSH geometry and no horizontal overflow at 1440, 390 and 320px.
- The 24-viewport responsive matrix: sticky/scaled desktop, reachable controls, phone touch targets, unchanged roster, larger fonts and dialogs.
- All five section links under desktop/mobile and normal/reduced motion.
- Pokemon PC boxes, icon scale, forest/Friend Area places, saved choices after reload, expanded maps, cursor alias and mobile.

Commands: `test:design:browser`, `test:responsive:browser`, `test:navigation:browser`, `test:pokemon-pc:browser`, with `BASE_URL` pointing to the local production server. Active JSX, CSS, routes, page data and artwork were not edited by this cleanup. No user-facing regression was found in these checks.

## PR integration validation

Prepared from current main `a655b125`, retaining subsequent generated README updates. A fresh dependency install and production build passed. Fallow diff audit passed. The active portfolio source did not differ from the earlier validated baseline before applying this cleanup.
