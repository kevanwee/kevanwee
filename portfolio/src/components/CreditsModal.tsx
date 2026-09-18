"use client";

import Modal from "@/components/Modal";



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



  return (
    <Modal onClose={onClose} label="Credits">
      <div
        className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-cream-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cream-200 px-6 py-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-warm-700">
              Credits
            </p>
            <p className="mt-0.5 text-xs text-warm-600">
              Assets &amp; resources used in this site
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-warm-600 transition-colors hover:text-warm-700"
            aria-label="Close" style={{ minWidth: 44, minHeight: 44 }}
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-warm-600">
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
              <p className="mt-0.5 text-xs text-warm-600">{credit.description}</p>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="border-t border-cream-200 px-6 py-4">
          <p className="text-[11px] leading-relaxed text-warm-600">
            All Pokémon characters and assets remain the intellectual property of their respective owners.
          </p>
        </div>
      </div>
    </Modal>
  );
}
