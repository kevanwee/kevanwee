# Responsive portfolio panel — 12 October 2026

The owner rejected the further composition studies and requested a responsive
review of the existing design, particularly lower left-panel buttons cut off in
short windows. Keep the existing section order, content and Pokémon identity.

## Reproduced problem

At 1024×600, 1280×720 and 1440×500, the panel remained sticky while its descendants
extended below the viewport. Scrolling could not reveal the lower controls. A
viewport-based max-height restricted the box without restricting its contents;
height-only CSS zoom rules also shrank the text and 44px targets.

## Behavior

- Remove panel zoom and max-height constraints. Contents retain intrinsic height.
- On desktop windows up to 900px high, arrange the name on one line and wrap the
  section index horizontally; reduce gaps while preserving content and target sizes.
- Scale outer top spacing between 24–80px on desktop and 20–48px on smaller layouts.
- Pin the desktop panel only when its measured height, top offset and 24px bottom
  clearance fit the available viewport. Otherwise, use normal document scrolling.
- A ResizeObserver, font readiness, window resize and visual-viewport resize keep
  the decision current after wrapping, font changes and viewport changes. The
  default before measurement is normal flow. There is no nested scrolling region.
- Navigation, primary actions and footer controls retain at least 44px height.

The existing `left-panel-zoom` class remains as a compatibility selector for
resident geometry and tests; it no longer applies zoom.

## Validation

`npm run test:responsive:browser` covers 24 CSS viewport sizes from 320px phones,
phone landscapes and tablets through short desktop windows and 2560×1440. It
checks actual focus-driven reachability of every lower control, sticky fit,
target heights, page overflow, roster preservation and font-driven remeasurement.
It also opens Resume/CV and navigates to Projects. A 720×450 viewport represents
the reduced CSS layout space of a 1440×900 window at 200% browser zoom; it is not
a claim of physical-device testing.

The design regression checks sample complete Yveltal awakening at 1440px, 390px
and 320px. The existing Yveltal suite continues to check flight, perching, reflow
and stable sticky scrolling; its old assertion requiring CSS zoom is replaced by
the full-size fitting-panel contract. Production build and desktop/phone captures
complete the review. Real-device Safari and Android were not available here.
