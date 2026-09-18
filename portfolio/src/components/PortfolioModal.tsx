"use client";

import Modal from "@/components/Modal";

import { useEffect, useState } from "react";

interface Props {
  onClose: () => void;
  url: string;
}

export default function PortfolioModal({ onClose, url }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const controls = (
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
  );

  return (
    <Modal onClose={onClose} label="3D Portfolio Preview">
      {isMobile ? (
        /* ── Phone frame ── */
        <div
          className="relative flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Phone shell */}
          <div className="relative rounded-[2.5rem] bg-warm-800 p-3 shadow-2xl ring-1 ring-warm-700"
            style={{ width: "min(88vw, 360px)" }}>
            {/* Dynamic island */}
            <div className="mx-auto mb-2 flex h-5 w-20 items-center justify-center rounded-full bg-warm-900">
              <div className="h-1.5 w-1.5 rounded-full bg-warm-700" />
            </div>
            {/* Screen */}
            <div className="overflow-hidden rounded-3xl bg-black"
              style={{ aspectRatio: "9/19.5", maxHeight: "72vh" }}>
              <iframe
            tabIndex={-1}
                src={url}
                className="h-full w-full border-0"
                title="3D Portfolio"
                allow="autoplay; fullscreen"
                loading="lazy"
              />
            </div>
            {/* Home bar */}
            <div className="mt-2 flex justify-center">
              <div className="h-1 w-24 rounded-full bg-warm-600" />
            </div>
          </div>
          {controls}
        </div>
      ) : (
        /* ── Laptop frame ── */
        <div
          className="relative w-full max-w-[90vw] xl:max-w-5xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Lid / screen bezel */}
          <div className="rounded-t-2xl bg-warm-800 px-6 pt-5 pb-0 shadow-2xl">
            {/* Camera dot */}
            <div className="mx-auto mb-3 h-1.5 w-1.5 rounded-full bg-warm-600" />
            {/* Screen area */}
            <div className="overflow-hidden rounded-t-lg bg-black" style={{ height: "clamp(280px, 60vh, 620px)" }}>
              <iframe
            tabIndex={-1}
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

          {controls}
        </div>
      )}
    </Modal>
  );
}
