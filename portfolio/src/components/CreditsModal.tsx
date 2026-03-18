"use client";

import { useEffect, useCallback, useState } from "react";

interface Props {
  onClose: () => void;
}

const CREDITS = [
  {
    category: "Pokémon Sprites",
    name: "PMD SpriteCollab",
    href: "https://sprites.pmdcollab.org/",
    description: "Pixel art sprite sheets for all Pokémon characters",
  },
  {
    category: "Pokémon IP",
    name: "The Pokémon Company / Nintendo",
    href: null,
    description: "All Pokémon characters are © The Pokémon Company International",
  },
  {
    category: "Music",
    name: "Pokémon Mystery Dungeon OST",
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
        <div className="flex flex-col gap-3 px-6 py-5">
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
            All Pokémon characters and assets remain the intellectual property of their respective owners.
          </p>
        </div>
      </div>
    </div>
  );
}
