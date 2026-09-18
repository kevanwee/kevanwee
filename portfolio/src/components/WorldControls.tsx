"use client";

import { usePokemonCursor } from "@/components/PokemonCursorContext";

export default function WorldControls() {
  const { paused, setPaused, companions, setCompanions } = usePokemonCursor();
  return <div className="mt-3 flex flex-wrap gap-2" aria-label="Pokémon preferences">
    <button className="world-control" aria-pressed={paused} onClick={() => setPaused(!paused)}
      title="Pause or resume all Pokémon and map animations">
      {paused ? "Resume motion" : "Pause motion"}
    </button>
    <button className="world-control" aria-pressed={companions} onClick={() => setCompanions(!companions)}>
      Companion: {companions ? "on" : "off"}
    </button>
  </div>;
}
