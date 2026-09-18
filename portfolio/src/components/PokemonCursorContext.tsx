"use client";

import { createContext, useContext, useState } from "react";

export type PokemonId =
  | "diancie"
  | "ceruledge"
  | "greninja"
  | "latios"
  | "latias"
  | "ironvaliant";

interface PokemonCursorContextType {
  selectedPokemon: PokemonId;
  setSelectedPokemon: (p: PokemonId) => void;
}

const PokemonCursorContext = createContext<PokemonCursorContextType>({
  selectedPokemon: "diancie",
  setSelectedPokemon: () => {},
});

export function PokemonCursorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonId>("diancie");

  return (
    <PokemonCursorContext.Provider value={{ selectedPokemon, setSelectedPokemon }}>
      {children}
    </PokemonCursorContext.Provider>
  );
}

export function usePokemonCursor() {
  return useContext(PokemonCursorContext);
}
