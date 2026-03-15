"use client";

import dynamic from "next/dynamic";

const PokemonWalker = dynamic(() => import("@/components/PokemonWalker"), { ssr: false });

export function PokemonWalkerClient() {
  return <PokemonWalker />;
}
