import type { PokemonId } from "./PokemonCursorContext";

/** Every cursor Pokémon, with its Poké Ball and portrait. The row shows up to six, in the owner's order. */
export const CURSOR_ROSTER: Record<PokemonId, { ball: string; label: string; icon: string }> = {
  diancie:     { ball: "/pokeballs/cherish-ball.png", label: "Diancie",      icon: "/icons/diancie.png" },
  ceruledge:   { ball: "/pokeballs/quick-ball.png",   label: "Ceruledge",    icon: "/icons/ceruledge.png" },
  greninja:    { ball: "/pokeballs/luxury-ball.png",  label: "Greninja",     icon: "/icons/greninja.png" },
  latios:      { ball: "/pokeballs/beast-ball.png",   label: "Latios",       icon: "/icons/latios.png" },
  latias:      { ball: "/pokeballs/fast-ball.png",    label: "Latias",       icon: "/icons/latias.png" },
  dragonite:   { ball: "/pokeballs/dive-ball.png",    label: "Dragonite",    icon: "/icons/dragonite.png" },
  ironvaliant: { ball: "/pokeballs/premier-ball.png", label: "Iron Valiant", icon: "/icons/ironvaliant.png" },
};
export const ALL_CURSORS = Object.keys(CURSOR_ROSTER) as PokemonId[];
/** The default row: Dragonite (in a Dive Ball) took Latias's place. */
export const DEFAULT_LINEUP: PokemonId[] = ["diancie", "ceruledge", "greninja", "latios", "dragonite", "ironvaliant"];
export const LINEUP_MAX = 6;

/** A saved line-up, cleaned: known, unique, at most six, never empty. */
export function cleanLineup(value: unknown): PokemonId[] {
  if (!Array.isArray(value)) return DEFAULT_LINEUP;
  const seen = [...new Set(value.filter((p): p is PokemonId => typeof p === "string" && p in CURSOR_ROSTER))].slice(0, LINEUP_MAX);
  return seen.length ? seen : DEFAULT_LINEUP;
}
