"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { usePokemonCursor, type PokemonId } from "@/components/PokemonCursorContext";

const POKEBALLS: {
  ball: string;
  pokemon: PokemonId;
  label: string;
  icon: string;
}[] = [
  { ball: "/pokeballs/cherish-ball.png",  pokemon: "diancie",    label: "Diancie",      icon: "/icons/diancie.png" },
  { ball: "/pokeballs/quick-ball.png",    pokemon: "ceruledge",  label: "Ceruledge",    icon: "/icons/ceruledge.png" },
  { ball: "/pokeballs/luxury-ball.png",   pokemon: "greninja",   label: "Greninja",     icon: "/icons/greninja.png" },
  { ball: "/pokeballs/beast-ball.png",    pokemon: "latios",     label: "Latios",       icon: "/icons/latios.png" },
  { ball: "/pokeballs/fast-ball.png",     pokemon: "latias",     label: "Latias",       icon: "/icons/latias.png" },
  { ball: "/pokeballs/premier-ball.png",  pokemon: "ironvaliant",label: "Iron Valiant", icon: "/icons/ironvaliant.png" },
];

export default function PokeballRow() {
  const { selectedPokemon, setSelectedPokemon } = usePokemonCursor();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [shakingIdx, setShakingIdx] = useState<number | null>(null);
  const [flashIdx, setFlashIdx] = useState<number | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = (idx: number, pokemon: PokemonId) => {
    if (shakingIdx === idx) return;

    // Shake animation
    setShakingIdx(idx);
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);

    // Flash mid-shake, then switch pokemon
    setTimeout(() => {
      setFlashIdx(idx);
      setTimeout(() => setFlashIdx(null), 150);
    }, 200);

    setTimeout(() => {
      setSelectedPokemon(pokemon);
      setShakingIdx(null);
    }, 420);

    shakeTimerRef.current = setTimeout(() => setShakingIdx(null), 500);
  };

  return (
    <div className="flex items-center gap-2">
      {POKEBALLS.map(({ ball, pokemon, label, icon }, idx) => {
        const isSelected = selectedPokemon === pokemon;
        const isHovered = hoveredIdx === idx;
        const isShaking = shakingIdx === idx;
        const isFlashing = flashIdx === idx;

        return (
          <div key={pokemon} className="relative flex flex-col items-center">
            {/* Pokemon icon tooltip */}
            <div
              className="pointer-events-none absolute flex flex-col items-center"
              style={{
                bottom: "calc(100% + 8px)",
                left: "50%",
                transform: "translateX(-50%)",
                opacity: isHovered ? 1 : 0,
                transition: "opacity 0.15s ease",
                zIndex: 10,
              }}
            >
              <div className="flex flex-col items-center gap-0.5 rounded-xl border border-cream-200 bg-white px-2 py-1.5 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={icon}
                  alt={label}
                  width={40}
                  height={40}
                  style={{ imageRendering: "pixelated", width: 40, height: 40, objectFit: "contain" }}
                />
                <span className="whitespace-nowrap text-[9px] font-semibold uppercase tracking-wider text-warm-400">
                  {label}
                </span>
              </div>
              {/* Tooltip arrow */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: "5px solid #e8e1d8",
                }}
              />
            </div>

            {/* Pokeball button */}
            <button
              onClick={() => handleClick(idx, pokemon)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              aria-label={`Switch to ${label}`}
              title={label}
              className="relative flex items-center justify-center transition-transform duration-100"
              style={{
                outline: "none",
                background: "none",
                border: "none",
                padding: 2,
              }}
            >
              {/* Flash overlay */}
              {isFlashing && (
                <div
                  className="pokeball-flash pointer-events-none absolute inset-0 rounded-full"
                  aria-hidden="true"
                />
              )}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ball}
                alt={label}
                width={28}
                height={28}
                style={{
                  imageRendering: "pixelated",
                  width: 28,
                  height: 28,
                  display: "block",
                  animation: isShaking ? "pokeball-shake 0.42s ease-in-out" : undefined,
                  filter: isSelected
                    ? "drop-shadow(0 0 4px rgba(132,169,140,0.8))"
                    : isHovered
                    ? "drop-shadow(0 0 3px rgba(132,169,140,0.5))"
                    : "none",
                  transform: isSelected ? "scale(1.15)" : "scale(1)",
                  transition: "transform 0.15s ease, filter 0.15s ease",
                }}
                draggable={false}
              />

              {/* Selected indicator dot */}
              {isSelected && (
                <span
                  className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-sage-400"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
