"use client";

import { useEffect, useCallback, useState } from "react";

interface Props {
  onClose: () => void;
}

const CREDITS = [
  {
    category: "Transform Forest",
    name: "Toastypk / The Spriters Resource · Pamtre Berry archive",
    href: "https://pamtre-berry.neocities.org/articles/friendareas",
    description: "PMD forest background and the original 32 stone colour frames",
  },
  {
    category: "Pokémon Sprites",
    name: "PMD SpriteCollab contributors · CC BY-NC 4.0",
    href: "https://sprites.pmdcollab.org/",
    description: "Sprite sheets and portraits; each artist is credited on its sprite page. Some are cropped, recoloured or combined (fusions, Mega forms)",
  },
  {
    category: "Sprite licence",
    name: "Creative Commons BY-NC 4.0",
    href: "https://creativecommons.org/licenses/by-nc/4.0/",
    description: "The licence PMD SpriteCollab artists release their sprites under (non-commercial, with credit)",
  },
  {
    category: "Mystery Dungeon UI",
    name: "Mystery Dungeon Wiki",
    href: "https://mysterydungeon.fandom.com/",
    description: "Thunder Meadow (Red/Blue Rescue Team) and the Explorer Rank badges (Explorers of Time/Darkness and Sky), game assets",
  },
  {
    category: "Item sprites",
    name: "PokeAPI sprites · WikiDex",
    href: "https://github.com/PokeAPI/sprites",
    description: "Poké Balls, Key Stone and DNA Splicers (PokeAPI); Mega Stones (WikiDex), game assets",
  },
  {
    category: "Mega symbol",
    name: "PixelTheCollector",
    href: null,
    description: "Pixel-art Mega Evolution symbol, animated for the cursor forms",
  },
  {
    category: "Weather",
    name: "NEA via data.gov.sg · Singapore Open Data Licence v1.0",
    href: "https://data.gov.sg/open-data-licence",
    description: "Contains information from NEA's 2-hour and 24-hour weather forecasts, accessed from data.gov.sg under the Singapore Open Data Licence v1.0",
  },
  {
    category: "Weather fallback",
    name: "Open-Meteo.com · CC BY 4.0",
    href: "https://open-meteo.com/",
    description: "Weather data by Open-Meteo.com, used when NEA cannot be reached",
  },
  {
    category: "Pixel font",
    name: "Pixelify Sans · SIL Open Font License",
    href: "https://fonts.google.com/specimen/Pixelify+Sans",
    description: "Mystery Dungeon cards and dialogue box",
  },
  {
    category: "Pokémon IP",
    name: "Nintendo / Creatures / GAME FREAK / The Pokémon Company",
    href: null,
    description: "Pokémon characters, sprites, maps and music are © their owners",
  },
  {
    category: "Music",
    name: "Pokémon Ruby & Sapphire OST",
    href: null,
    description: "Littleroot Town — used for ambient background music",
  },
  {
    category: "Framework",
    name: "Next.js",
    href: "https://nextjs.org",
    description: "React framework powering this site",
  },
];

export default function CreditsModal({ onClose }: Props) {
  const [visible, setVisible] = useState(false);

  const handleKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    // Tiny delay so the transition is visible on mount
    const t = setTimeout(() => setVisible(true), 16);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
      clearTimeout(t);
    };
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-warm-900/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Credits"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-2xl"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(12px)",
          transition: "opacity 300ms ease, transform 300ms ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cream-200 px-6 py-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-warm-700">
              Credits
            </p>
            <p className="mt-0.5 text-xs text-warm-300">
              Assets &amp; resources used in this site
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-warm-300 transition-colors hover:text-warm-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Credit entries */}
        <div data-lenis-prevent className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto px-6 py-5">
          {CREDITS.map((credit) => (
            <div
              key={credit.category}
              className="border-l-2 border-cream-100 pl-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-warm-300">
                {credit.category}
              </p>
              {credit.href ? (
                <a
                  href={credit.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 block text-sm text-sage-600 hover:underline underline-offset-2 transition-colors duration-200"
                >
                  {credit.name}
                </a>
              ) : (
                <p className="mt-0.5 text-sm text-warm-700">{credit.name}</p>
              )}
              <p className="mt-0.5 text-xs text-warm-400">{credit.description}</p>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="border-t border-cream-200 px-6 py-4">
          <p className="text-[11px] leading-relaxed text-warm-300">
            A non-commercial fan project, not affiliated with or endorsed by Nintendo, Creatures, GAME FREAK or The Pokémon Company. All Pokémon characters and assets remain the intellectual property of their respective owners.
          </p>
        </div>
      </div>
    </div>
  );
}
