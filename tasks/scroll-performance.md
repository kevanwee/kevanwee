# Scroll and animation audit — 6 October 2026

Scope: Voracity and the explicitly requested sibling portfolio. Production builds
were profiled with Chromium/Playwright, a fresh synthetic 365-day contribution
calendar, 1440×900 viewport, normal motion and external requests blocked. Each
scenario lasted four seconds after warmup. No account data or cloud writes.

## Findings and changes

1. Both contribution gardens animated an inherited hue variable continuously
   through hundreds of cells, including when offscreen. Keep the same full RGB
   wave, eight-second period, saturation and activity brightness, but advance in
   three-degree steps (15Hz). This cuts colour recalculation while preserving
   the design. No changes to README colours or population.
2. Pause garden and weather CSS animations outside an 80px viewport margin and
   in hidden tabs. Intersection/visibility observers resume the existing nodes;
   no remount, roster redraw, layout placeholder or content-visibility geometry
   change. Reduced-motion/quiet-mode rules still take precedence.
3. Silvally was revealed before geometry reads, then hidden again when offscreen,
   twice per animation tick. Keep it hidden until the final visibility decision.
   This removes avoidable forced layout on both sites without changing placement.
4. Portfolio pointer glow repainted a full-screen radial gradient on every mouse
   event. Move the same bounded gradient with a coalesced animation-frame
   transform inside a clipped overlay. Preserve colour, radius and pointer input.
5. Voracity already uses native smooth section navigation and honours reduced
   motion. Portfolio now honours reduced motion in section navigation and root
   CSS too. Wheel/touch scrolling remains native; no inertia library or input
   interception was added. Smooth anchor scrolling alone would not fix the CPU
   cost found above.

Also inspected resident RAF scheduling/culling, map canvases, cursor updates,
weather blending, sticky positioning, CSS blur, scroll listeners and section
observers. The map/forest loops already have visibility controls; their rosters
and behaviour remain. Existing cursor/experience animations still use React
updates and may merit profiling on a slower device, but were not the dominant
cost in this sample. Modal-only backdrops were not changed speculatively.

## Measurements

Seconds of main-thread task work within each four-second sample:

| Site / scenario | Before | After |
|---|---:|---:|
| Voracity, top (garden offscreen) | 2.327 | 0.489 |
| Voracity, garden visible | 2.382 | 1.018 |
| Voracity, scrolling | 2.361 | 0.849 |
| Portfolio, top | 2.381 | 0.461 |
| Portfolio, garden visible | 2.485 | 1.008 |
| Portfolio, scrolling | 3.049 | 1.029 |

Scrolling style work fell from 1.639s to 0.329s (Voracity), and 1.762s to 0.225s
(portfolio). Layout counts fell 386→43 and 449→220 respectively. A CSS-only
experiment isolated most of the colour benefit before adding visibility changes.
Raw synthetic samples and the profiling script live in the sibling Voracity repository (docs/scroll-performance-samples.json and scripts/profile-scroll.mjs).

This is a short local comparison, not field telemetry or a universal FPS claim.
Frame p95 was already around 16.7ms on this PC, so the user's visible choppiness
was not strongly reproduced here. The observed improvement is CPU headroom and
unnecessary work removed. Random resident behaviour, shared-PC load, GPU/driver,
extensions and real account content can affect results. No JavaScript page errors
occurred in the samples. Authenticated heavy tools/3D modal sessions were not part
of the scroll benchmark.

## Validation and reproduction

Both production builds and deterministic map/roster tests pass. Voracity's 18
affected browser tests pass, including all 13 cursor/roster/order/drag checks,
forest weather and contribution layout. New 390/1440px checks cover pause/resume,
visibility lifecycle, complete date coverage, RGB variation and reduced motion.
The portfolio's new production-browser checks cover the same viewport sizes,
pointer glow and overflow; its existing overworld suite checks placement, forms
and interactions separately.

Build and serve Voracity on 127.0.0.1:5197 (`npm run build`, then
`npm run preview -- --port 5197 --strictPort`). Build and serve portfolio on
127.0.0.1:5198 (`npm run build`, then `npm run start -- -p 5198`). From Voracity run
`node scripts/profile-scroll.mjs sample`; the ignored JSON report is under
artifacts. It uses fresh browser contexts, synthetic cached contributions and
blocks non-local requests. Keep other CPU-heavy work idle for comparisons.

Further device checks: use the actual browser/profile at the owner's usual zoom,
scroll top→forest→tools and back with both wheel and touchpad, then compare with
the 3D modal closed/open. If choppiness persists, record a DevTools performance
trace of that exact interaction; do not mask it by removing residents.

Reference: [Chrome team's animation performance guidance](https://web.dev/articles/animations-guide).
