"use client";

import { useEffect, useCallback } from "react";

interface Props {
  onClose: () => void;
  url: string;
}

export default function PortfolioModal({ onClose, url }: Props) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-warm-900/70 backdrop-blur-sm p-2 sm:p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="3D Portfolio Preview"
    >
      {/* Laptop shell — stop clicks propagating */}
      <div
        className="relative w-full max-w-[90vw] xl:max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lid / screen bezel */}
        <div className="rounded-t-2xl bg-warm-800 px-6 pt-5 pb-0 shadow-2xl">
          {/* Camera dot */}
          <div className="mx-auto mb-3 h-1.5 w-1.5 rounded-full bg-warm-600" />
          {/* Screen area */}
          <div className="overflow-hidden rounded-t-lg bg-black" style={{ aspectRatio: "16/10", maxHeight: "70vh" }}>
            <iframe
              src={url}
              className="h-full w-full border-0"
              title="3D Portfolio"
              allow="autoplay; fullscreen"
              loading="lazy"
            />
          </div>
        </div>

        {/* Laptop base */}
        <div className="rounded-b-xl bg-warm-700 px-10 py-3 shadow-lg">
          <div className="mx-auto h-1 w-24 rounded-full bg-warm-600" />
        </div>

        {/* Hinge line */}
        <div className="absolute left-0 right-0 top-full h-0.5 bg-warm-900/40" />

        {/* Controls row */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="rounded-sm border border-cream-200/20 px-3 py-1.5 text-xs text-cream-200 transition-all duration-200 hover:bg-cream-200/10 hover:scale-[1.03] active:scale-[0.97]"
          >
            ✕ Close
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm border border-cream-200/20 px-3 py-1.5 text-xs text-cream-200 transition-all duration-200 hover:bg-cream-200/10 hover:scale-[1.03] active:scale-[0.97]"
          >
            Open in new tab ↗
          </a>
        </div>
      </div>
    </div>
  );
}
