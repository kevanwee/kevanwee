"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_LINEUP, cleanLineup } from "./cursorRoster";

export type PokemonId =
  | "diancie"
  | "ceruledge"
  | "greninja"
  | "latios"
  | "latias"
  | "dragonite"
  | "ironvaliant";

/** Soul Unison partners: Ceruledge (the cursor) fuses with one of these (F opens the wheel). */
export type FusionId = "armarouge" | "darkrai" | "zygarde";
export const FUSION_HOST: PokemonId = "ceruledge";
const FUSIONS: FusionId[] = ["armarouge", "darkrai", "zygarde"];
const FUSION_KEY = "portfolio.cursor.fusion";
/** Cursors that Mega Evolve (and revert) with F. Remembered per Pokémon in this browser. */
export const MEGA_CAPABLE: PokemonId[] = ["diancie", "greninja", "latias", "latios", "dragonite"];
const MEGA_KEY = "portfolio.cursor.mega";
/** Diancie starts in its Mega form; the others start in base form. */
const MEGA_DEFAULT: PokemonId[] = ["diancie"];
const LINEUP_KEY = "portfolio.cursor.lineup";

interface PokemonCursorContextType {
  selectedPokemon: PokemonId;
  setSelectedPokemon: (p: PokemonId) => void;
  /** The partner Ceruledge is fused with, if any. Remembered in this browser. */
  fusion: FusionId | null;
  setFusion: (f: FusionId | null) => void;
  /** True while a transformation plays; the cursor sprite hides so the sequence can show it. */
  fusing: boolean;
  setFusing: (f: boolean) => void;
  /** Whether the selected cursor is Mega Evolved (Greninja, Latias, Latios). */
  mega: boolean;
  /** Mega Evolve or revert a Pokémon (the selected one unless named: handlers registered once must name it). */
  setMega: (on: boolean, pokemon?: PokemonId) => void;
  /** The Poké Ball row: up to six cursor Pokémon, in order (Make it yours). Remembered in this browser. */
  lineup: PokemonId[];
  setLineup: (lineup: PokemonId[]) => void;
}

const PokemonCursorContext = createContext<PokemonCursorContextType>({
  selectedPokemon: "diancie",
  setSelectedPokemon: () => {},
  fusion: null,
  setFusion: () => {},
  fusing: false,
  setFusing: () => {},
  mega: false,
  setMega: () => {},
  lineup: [],
  setLineup: () => {},
});

export function PokemonCursorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // The page is server-rendered with the defaults; saved choices load once mounted (no hydration mismatch).
  const [lineup, setLineupState] = useState<PokemonId[]>(DEFAULT_LINEUP);
  const [selectedPokemon, selectPokemon] = useState<PokemonId>(DEFAULT_LINEUP[0]);
  const [fusion, fuse] = useState<FusionId | null>(null);
  const [fusing, setFusing] = useState(false);
  const [megas, setMegas] = useState<PokemonId[]>(MEGA_DEFAULT);
  useEffect(() => {
    try {
      const savedLineup = cleanLineup(JSON.parse(localStorage.getItem(LINEUP_KEY) || 'null'));
      setLineupState(savedLineup);
      const saved = localStorage.getItem('portfolio.cursor') as PokemonId | null;
      selectPokemon(saved && savedLineup.includes(saved) ? saved : savedLineup[0]);
      const savedFusion = localStorage.getItem(FUSION_KEY);
      if (FUSIONS.includes(savedFusion as FusionId)) fuse(savedFusion as FusionId);
      const rawMega = localStorage.getItem(MEGA_KEY);
      if (rawMega !== null) { const parsed = JSON.parse(rawMega); if (Array.isArray(parsed)) setMegas(parsed.filter((p: PokemonId) => MEGA_CAPABLE.includes(p))); }
    } catch { /* Defaults for this visit. */ }
  }, []);
  // Each Pokémon keeps its own form: switching away and back finds it as it was left.
  const setMega = (on: boolean, pokemon: PokemonId = selectedPokemon) => setMegas(current => {
    const next = on ? [...new Set([...current, pokemon])] : current.filter(p => p !== pokemon);
    try { localStorage.setItem(MEGA_KEY, JSON.stringify(next)); } catch { /* Mega for this visit only. */ }
    return next;
  });
  const setFusion = (next: FusionId | null) => {
    fuse(next);
    try { if (next) localStorage.setItem(FUSION_KEY, next); else localStorage.removeItem(FUSION_KEY); } catch { /* Fused for this visit only. */ }
  };
  // Switching to another Pokémon ends the fusion; it belongs to Ceruledge.
  const setSelectedPokemon = (pokemon: PokemonId) => { selectPokemon(pokemon); if (pokemon !== FUSION_HOST) setFusion(null); try { localStorage.setItem('portfolio.cursor',pokemon); } catch { /* Selection still works for this visit. */ } };

  // A cursor taken out of the row hands over to the first one left in it.
  const setLineup = (next: PokemonId[]) => {
    const clean = cleanLineup(next);
    setLineupState(clean);
    try { localStorage.setItem(LINEUP_KEY, JSON.stringify(clean)); } catch { /* This visit only. */ }
    if (!clean.includes(selectedPokemon)) setSelectedPokemon(clean[0]);
  };

  return (
    <PokemonCursorContext.Provider value={{ selectedPokemon, setSelectedPokemon, fusion: selectedPokemon === FUSION_HOST ? fusion : null, setFusion, fusing, setFusing,
      mega: MEGA_CAPABLE.includes(selectedPokemon) && megas.includes(selectedPokemon), setMega, lineup, setLineup }}>
      {children}
    </PokemonCursorContext.Provider>
  );
}

export function usePokemonCursor() {
  return useContext(PokemonCursorContext);
}
