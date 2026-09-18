"use client";

import { createContext, useContext, useEffect, useState, type Dispatch, type SetStateAction } from "react";

export const POKEMON_IDS = ["diancie", "ceruledge", "greninja", "latios", "latias", "ironvaliant"] as const;
export type PokemonId = typeof POKEMON_IDS[number];
interface Preferences {
  selectedPokemon: PokemonId;
  setSelectedPokemon: (pokemon: PokemonId) => void;
  paused: boolean;
  setPaused: (paused: boolean) => void;
  companions: boolean;
  setCompanions: (enabled: boolean) => void;
  modalCount: number;
  setModalCount: Dispatch<SetStateAction<number>>;
}
const PokemonCursorContext = createContext<Preferences>({
  selectedPokemon: "diancie", setSelectedPokemon: () => {},
  paused: true, setPaused: () => {}, companions: true, setCompanions: () => {},
  modalCount: 0, setModalCount: () => {},
});

export function PokemonCursorProvider({ children }: { children: React.ReactNode }) {
  const [selectedPokemon, select] = useState<PokemonId>("diancie");
  const [paused, pause] = useState(true);
  const [companions, showCompanions] = useState(true);
  const [modalCount, setModalCount] = useState(0);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let saved: Partial<{ selectedPokemon: PokemonId; paused: boolean; companions: boolean }> = {};
    try {
      const value = JSON.parse(localStorage.getItem("pokemon-preferences-v1") || "{}");
      if (value && typeof value === "object") saved = value;
    } catch { /* Storage is optional. */ }
    if (POKEMON_IDS.includes(saved.selectedPokemon!)) select(saved.selectedPokemon!);
    pause(media.matches || saved.paused === true);
    showCompanions(saved.companions !== false);
    const update = () => { if (media.matches) pause(true); };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const persist = (patch: Record<string, unknown>) => {
    try { localStorage.setItem("pokemon-preferences-v1", JSON.stringify({ selectedPokemon, paused, companions, ...patch })); } catch { /* Storage can be denied. */ }
  };
  useEffect(() => {
    document.documentElement.dataset.motion = paused ? "paused" : "playing";
    return () => { delete document.documentElement.dataset.motion; };
  }, [paused]);
  return <PokemonCursorContext.Provider value={{
    selectedPokemon, setSelectedPokemon: pokemon => { select(pokemon); persist({ selectedPokemon: pokemon }); },
    paused, setPaused: value => { pause(value); persist({ paused: value }); },
    companions, setCompanions: value => { showCompanions(value); persist({ companions: value }); },
    modalCount, setModalCount,
  }}>{children}</PokemonCursorContext.Provider>;
}
export function usePokemonCursor() { return useContext(PokemonCursorContext); }
