"use client";

import dynamic from "next/dynamic";

const PokemonWalker = dynamic(() => import("@/components/PokemonWalker"), { ssr: false });
const IcaFloat = dynamic(() => import("@/components/IcaFloat"), { ssr: false });

export function PokemonWalkerClient() {
  return <PokemonWalker />;
}

export function IcaFloatClient() {
  return <IcaFloat />;
}
