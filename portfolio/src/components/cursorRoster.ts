import type { PokemonId } from "./PokemonCursorContext";

/**
 * Every cursor Pokémon, with its Poké Ball and PMD portraits (base, and Mega where it has one).
 * The row shows up to six, in the owner's order.
 */
export const CURSOR_ROSTER: Record<PokemonId, { ball: string; label: string; icon: string; megaIcon?: string }> = {
  diancie:     { ball: "/pokeballs/cherish-ball.png", label: "Diancie",      icon: "/icons/forms/diancie-base.png", megaIcon: "/icons/diancie.png" },
  ceruledge:   { ball: "/pokeballs/quick-ball.png",   label: "Ceruledge",    icon: "/icons/ceruledge.png" },
  greninja:    { ball: "/pokeballs/luxury-ball.png",  label: "Greninja",     icon: "/icons/greninja.png",  megaIcon: "/icons/forms/greninja-mega.png" },
  latios:      { ball: "/pokeballs/beast-ball.png",   label: "Latios",       icon: "/icons/latios.png",    megaIcon: "/icons/forms/latios-mega.png" },
  latias:      { ball: "/pokeballs/fast-ball.png",    label: "Latias",       icon: "/icons/latias.png",    megaIcon: "/icons/forms/latias-mega.png" },
  dragonite:   { ball: "/pokeballs/dive-ball.png",    label: "Dragonite",    icon: "/icons/dragonite.png", megaIcon: "/icons/forms/dragonite-mega.png" },
  ironvaliant: { ball: "/pokeballs/premier-ball.png", label: "Iron Valiant", icon: "/icons/ironvaliant.png" },
};
/** Ceruledge's Soul Unison partners, as portraits for the fused badge. */
export const FUSION_ICONS: Record<string, string> = {
  armarouge: "/icons/forms/armarouge.png",
  darkrai: "/icons/forms/darkrai.png",
  zygarde: "/icons/forms/zygarde.png",
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
