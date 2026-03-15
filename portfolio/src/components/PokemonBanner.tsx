"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export default function PokemonBanner() {
  const [expanded, setExpanded] = useState(false);

  // Modal zoom state
  const [modalZoomed, setModalZoomed] = useState(false);
  const [modalZoomOrigin, setModalZoomOrigin] = useState("50% 50%");
  const modalHoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    setExpanded(false);
    setModalZoomed(false);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [expanded, close]);

  const onModalPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setModalZoomOrigin(`${x}% ${y}%`);
    e.currentTarget.setPointerCapture(e.pointerId);
    modalHoldTimer.current = setTimeout(() => setModalZoomed(true), 120);
  };

  const onModalPointerUp = () => {
    if (modalHoldTimer.current) clearTimeout(modalHoldTimer.current);
    setModalZoomed(false);
  };

  return (
    <>
      <div className="mb-10">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-warm-400">
          Currently roaming · Route 111
        </p>

        {/* Banner — click to expand */}
        <div
          className="relative overflow-hidden rounded-2xl border border-cream-200 bg-white cursor-pointer group select-none"
          style={{ height: "180px" }}
          onClick={() => setExpanded(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setExpanded(true)}
          aria-label="Click to explore Route 111"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-white to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-white to-transparent" />
          <div className="absolute inset-0 z-20 rounded-2xl bg-black/0 transition-colors duration-200 group-hover:bg-black/[0.03]" />

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pokemon-roam-rt111.svg"
            alt="Animated Pokémon roaming Route 111"
            className="w-full route-scroll"
            style={{ display: "block", height: "auto" }}
            draggable={false}
          />

          <div className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="whitespace-nowrap rounded-full bg-warm-800/65 px-3 py-1 text-[10px] text-white backdrop-blur-sm">
              Click to explore the route
            </span>
          </div>
        </div>
      </div>

      {/* Expanded modal */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-warm-900/70 p-4 backdrop-blur-sm"
          onClick={close}
          aria-modal="true"
          role="dialog"
          aria-label="Route 111 Pokémon map"
        >
          <div
            className="relative flex max-h-[88vh] w-64 flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-cream-200 bg-white/90 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-warm-400">Route 111</p>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-warm-300">Hold to zoom</span>
                <button onClick={close} className="text-warm-300 transition-colors hover:text-warm-700" aria-label="Close">✕</button>
              </div>
            </div>

            {/* Scrollable area with zoom */}
            <div
              className="select-none"
              style={{ overflowY: modalZoomed ? "hidden" : "auto", cursor: modalZoomed ? "zoom-in" : "grab" }}
              onPointerDown={onModalPointerDown}
              onPointerUp={onModalPointerUp}
              onPointerLeave={onModalPointerUp}
            >
              <div
                style={{
                  transform: modalZoomed ? "scale(2.5)" : "scale(1)",
                  transformOrigin: modalZoomOrigin,
                  transition: "transform 0.2s ease",
                  willChange: "transform",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/pokemon-roam-rt111.svg"
                  alt="Pokémon roaming Route 111"
                  className="w-full"
                  style={{ display: "block", height: "auto" }}
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
