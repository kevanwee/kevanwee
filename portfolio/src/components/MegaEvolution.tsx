"use client";

import type { CSSProperties } from "react";
import type { PokemonId } from "./PokemonCursorContext";
import { MEGA_CONFIGS, POKEMON_CONFIGS, type PokemonConfig } from "./PokemonCursor";
import SPRITE_CENTRES from "./sprite-centres.json";
import "./mega.css";

/** Matches mega.css: when the new form takes over, and when the sequence ends. */
export const MEGA_TIMING = {
  evolve: { reveal: 1500, end: 2300 },
  revert: { reveal: 450, end: 1000 },
};

export type MegaSequence = { kind: "evolve" | "revert"; pokemon: PokemonId; x: number; y: number };

/** Each Mega Stone (Legends Z-A item sprites via WikiDex). No Greninjite sprite was found: the Key Stone stands in. */
export const MEGA_STONES: Partial<Record<PokemonId | "dragonite", string>> = {
  diancie: "/mega/stones/diancite.png",
  latias: "/mega/stones/latiasite.png",
  latios: "/mega/stones/latiosite.png",
  greninja: "/mega/stones/key-stone.png",
  dragonite: "/mega/stones/dragoninite.png",
};

/** The first idle frame (facing the viewer), placed so its anchor sits on the pointer like the cursor. */
function Form({ config, className, at }: { config: PokemonConfig; className: string; at: { left: number; top: number } }) {
  const { idle, scale, anchorX, anchorY } = config;
  const style: CSSProperties = {
    ...at,
    width: idle.frameWidth * scale, height: idle.frameHeight * scale,
    backgroundImage: `url(${idle.src})`, backgroundSize: `${idle.frameWidth * idle.durations.length * scale}px ${idle.frameHeight * idle.rows * scale}px`,
    translate: `${-idle.frameWidth * anchorX * scale}px ${-idle.frameHeight * anchorY * scale}px`,
    transformOrigin: `${idle.frameWidth * anchorX * scale}px ${idle.frameHeight * anchorY * scale}px`,
  };
  return <span className={`mega-actor ${className}`} style={style} />;
}

/**
 * Mega Evolution, drawn in CSS around the Mega Stone and Mega symbol sprites: rainbow light streams in, the Pokémon becomes
 * a white silhouette inside a rainbow orb, a helix emblem flares, the orb shatters, and the Mega form
 * stands in the afterglow. Reverting folds the Mega form back into a small orb that pops.
 */
export default function MegaEvolution({ kind, pokemon, x, y }: MegaSequence) {
  const base = POKEMON_CONFIGS[pokemon], mega = MEGA_CONFIGS[pokemon]!;
  const from = kind === "evolve" ? base : mega, to = kind === "evolve" ? mega : base;
  // Centre everything on the Pokémon itself: the visible pixels of each form's first idle frame
  // (sprite-centres.json, built in Voracity; PMD frames carry empty space, mostly below), midway
  // between the two forms.
  const size = Math.max(from.idle.frameWidth, from.idle.frameHeight) * from.scale;
  const visible = (config: PokemonConfig) => {
    const [cx, cy] = (SPRITE_CENTRES as Record<string, number[]>)[config.idle.src] ?? [config.idle.frameWidth / 2, config.idle.frameHeight / 2];
    return { left: x + (cx - config.anchorX * config.idle.frameWidth) * config.scale, top: y + (cy - config.anchorY * config.idle.frameHeight) * config.scale };
  };
  const a = visible(from), b = visible(to);
  const centre = { left: (a.left + b.left) / 2, top: (a.top + b.top) / 2 };
  const at = { left: x, top: y };
  return <div className={`mega-evolution ${kind}`} aria-hidden="true" style={{ ["--orb" as string]: `${Math.max(72, size * 0.85)}px` }}>
    <span className="mega-dim" />
    {kind === "evolve" && MEGA_STONES[pokemon] && <img className="mega-stone" src={MEGA_STONES[pokemon]} alt="" style={{
      left: centre.left, top: centre.top - Math.max(64, size * 0.7),
      ["--drop" as string]: `${Math.max(64, size * 0.7)}px`,
    }} />}
    {Array.from({ length: 10 }, (_, i) => <span key={`s${i}`} className="mega-stream" style={{ ...centre, ["--i" as string]: i }} />)}
    <span className="mega-orb" style={centre} />
    {/* The Mega Evolution symbol (PixelTheCollector's pixel art), animated as a rising flame
        (scripts/build-mega-symbol.py): 12 frames of 12 x 18 px, played as a sprite strip. */}
    <span className="mega-emblem" style={centre} />
    <Form config={from} className="from" at={at} />
    <Form config={to} className="to" at={at} />
    {Array.from({ length: 8 }, (_, i) => <span key={`c${i}`} className="mega-shard" style={{ ...centre, ["--i" as string]: i }} />)}
    <span className="mega-flash" />
  </div>;
}
