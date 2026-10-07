# Diancie freshness and deployment review — 8 October 2026

The owner reported new work in other repositories missing from the dialogue.
At investigation time, `activity.json` was last generated at 10:11 UTC, almost
six hours before the report, while GitHub's public event API already contained
the newer events. A manual regeneration picked them up; the renderer was not
restricted to the portfolio/Voracity. The display keeps the four newest lines.

Profile PR #49 separates activity from the two-hour garden regeneration:

- `diancie-activity.yml` targets every five minutes, plus profile pushes, manual
  dispatch and an optional `refresh-activity` repository-dispatch event.
- Both websites revalidate every 30 seconds while visible and on focus/return.
  They adopt another tab's fresh cache and update ages without replaying text.
- Public activity and permitted private feeds are combined; private names/PR
  numbers remain hidden except the existing Voracity allowlist. No new secrets.
- Collection failure preserves the existing feed. Identical output skips a
  commit; README-only commits are excluded by the existing Vercel ignore rule.
- Workflows share a concurrency group. The garden no longer writes dialogue.

GitHub scheduling, event feeds and image caching remain external latency limits.
Cross-repository pushes need a scoped write credential to dispatch immediately;
the existing read-only `LOG_TOKEN` is not suitable. The endpoint is ready but
cross-repository dispatch callers are not installed. See
`genpokemon/readme_art/README.md` for refresh commands and the boundary.

Live review also found the contribution placeholder used `new Date()` during
server rendering and hydration, so a prebuilt page or a timezone boundary could
produce different grid cells. It now starts with a date-free, fixed-size skeleton
and derives browser dates after mounting. `test-contribution-hydration.cjs`
verifies the fix with client dates on either side of the server date.

Validation includes generator ordering/privacy/no-op tests, website cadence,
cross-tab cache adoption and age-only refresh tests, and production builds.
