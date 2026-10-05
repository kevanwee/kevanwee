# Cursor forms: Soul Unison, Mega Evolution and the cursor line-up

Ported from Voracity (kevanwee/voracity, `src/pokemon/`) at the owner's request (6 October 2026) so
the portfolio cursor matches Voracity's. Keep the two copies in step; Voracity's guide
(`docs/AGENT-GUIDE.md`) is the fuller reference.

## Behaviour
- **F** with the Ceruledge cursor opens the Soul Unison wheel (Armarouge, Darkrai, shiny Zygarde);
  F with Diancie, Greninja, Latios, Latias or Dragonite Mega Evolves or reverts. Diancie starts Mega.
- Switching to a cursor with forms shows a 4 s "Press F …" hint, bottom left.
- **Edit** after the Poké Balls: choose up to six of the seven cursors and their order. Dragonite
  (Dive Ball) replaced Latias in the default row.
- Choices persist in this browser: `portfolio.cursor`, `portfolio.cursor.fusion`,
  `portfolio.cursor.mega`, `portfolio.cursor.lineup`. The page server-renders the defaults and
  loads saved choices after mount (no hydration mismatch).
- Reduced motion swaps forms without the sequences.
- The Poké Ball hover portrait shows the current form: the Mega portrait with the Mega symbol in the
  top-right corner, or, for a fused Ceruledge, the partner's small portrait with the DNA Splicers.
- Mega Dragonite is anchored like base Dragonite (by the feet), so clicking lines up.

## Files
`src/components/`: `PokemonCursor.tsx`, `PokemonCursorContext.tsx`, `FusionWheel.tsx`,
`MegaEvolution.tsx`, `CursorLineupPicker.tsx`, `cursorRoster.ts`, `fusion-armarouge-combo.json`,
`fusion.css`, `mega.css`; `src/lib/motion.ts`; mounted in `src/app/page.tsx`.

## Asset provenance (all copied from Voracity, where builders and hashes live)
- `public/fusion/` — fusion sheets generated from PMD SpriteCollab sheets (Ceruledge, Armarouge)
  and the owner's darkrai.zip / zygarde.zip (`scripts/build-fusion*.py` in Voracity).
- `public/mega/latias|latios/` — shiny Mega Latias/Latios from the owner's archives, unchanged.
- `public/mega/stones/` — Mega Stone item sprites: Latiasite, Latiosite, Diancite, Dragoninite are
  Pokémon Legends: Z-A item sprites hosted by WikiDex (images.wikidexcdn.net); `key-stone.png`
  (standing in for Greninjite, which was not openly available) is from the PokeAPI sprites repo.
- `public/mega/mega-symbol-source.png` — Mega Evolution symbol pixel art by PixelTheCollector,
  supplied by the owner; `mega-symbol-flame.png` animates it (Voracity `scripts/build-mega-symbol.py`).
- `public/overworld/mega-greninja/`, `shiny-mega-dragonite/` — from the owner's composite sheets
  (Voracity `scripts/import-mega-sheets.py` and the attack builders).
- `public/diancie-base/` — base Diancie from the owner's diancie.zip.
- `public/pokeballs/dive-ball.png` — PokeAPI item sprite, like the other balls.
- `public/icons/dragonite.png` — shiny Dragonite portrait from PMD SpriteCollab, like the others.
- `public/icons/forms/` — PMD SpriteCollab portraits: base Diancie (0719), Mega Diancie (0719/0001),
  shiny Mega Latias (0380/0001/0001), Latios (0381/0001/0001), Greninja (0658/0002/0001), Dragonite
  (0149/0001/0001); partners Armarouge (0936), Darkrai (0491), shiny Complete Zygarde
  (0718/0002/0001). `dna-splicers.png` is the PokeAPI item sprite; `mega-badge.png` is the Mega
  symbol at native size.
Pokémon, items and the Mega symbol are © The Pokémon Company / Nintendo.
