# Editable project demo videos

Three Brag stories, rendered locally using Hyperframes 0.8.186. See [the story and provenance notes](../../docs/project-demo-videos.md).

## Prepare

Install Brag, Hyperframes, FFmpeg/FFprobe, and GSAP. Then, from the repository root:

```sh
python portfolio/demos/prepare.py --brag-skill /path/to/brag --gsap /path/to/gsap.min.js
```

The helper copies required assets into the ignored per-composition `assets/` folders. Music/SFX are taken from your Brag installation; raw bundled tracks are not redistributed here. Font licences are retained alongside the fonts.

Open a composition directory, for example `portfolio/demos/lq-plugins`, and run:

```sh
npx hyperframes@0.8.186 check --json
npx hyperframes@0.8.186 preview --background
npx hyperframes@0.8.186 render --quality delivery --workers 1 --output brag.mp4
```

The public portfolio files include the chosen poster as frame zero. If re-rendering, select a settled frame (`lq-plugins`: 14.7s; `bart`: 15s; `sal-citation`: 17.9s), extract the JPG, and replace only the first video's frame using the Brag delivery instructions before copying the MP4/JPG into `portfolio/public/previews/`.

## Verification

- `verification-browser.json`: actual hover playback, dimensions, duration, Escape, mobile/reduced-motion posters, touch behaviour and loaded/advancing native Pokemon sprites.
- `render-verification.json`: delivered stream codecs, dimensions, duration and frame count.
- Each composition's `verification.json`: zero errors/warnings in Hyperframes lint, runtime, layout, motion, contrast and craft checks.
- `lq-plugins/evidence/`: actual helper outputs for fictional inputs, including a blocked scope-difference case. Semantic assessments are explicitly supplied demonstration judgments, not independent lawyer verification.

Run the portfolio browser check with a local server at `BASE_URL` and Playwright installed (or its module path in `PLAYWRIGHT_MODULE`): `node portfolio/scripts/test-project-demo-previews.cjs`.
