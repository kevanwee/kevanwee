"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// SVG viewBox: 1280×320 → at 220px height, natural width = 220 × (1280/320) = 880px
const IMG_HEIGHT = 220;
const IMG_WIDTH = 880;

export default function MauvilleBanner() {
  const [expanded, setExpanded] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didZoom = useRef(false);

  const close = useCallback(() => setExpanded(false), []);

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

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
    didZoom.current = false;
    holdTimer.current = setTimeout(() => {
      didZoom.current = true;
      setZoomed(true);
    }, 120);
  };

  const onPointerUp = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setZoomed(false);
  };

  const onClick = () => {
    if (didZoom.current) return;
    setExpanded(true);
  };

  return (
    <>
      <div className="mt-12">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-warm-400">
          Currently roaming · Mauville City
        </p>

        <div
          className="relative overflow-hidden rounded-2xl border border-cream-200 bg-white cursor-pointer group select-none"
          style={{ height: `${IMG_HEIGHT}px` }}
          onClick={onClick}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setExpanded(true)}
          aria-label="Hold to zoom · Click to explore Mauville City"
        >
          {/* Fade left & right */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent" />

          {/* Hover tint */}
          <div className="absolute inset-0 z-20 rounded-2xl bg-black/0 transition-colors duration-200 group-hover:bg-black/[0.03]" />

          {/* Zoom wrapper */}
          <div
            style={{
              transform: zoomed ? "scale(2.5)" : "scale(1)",
              transformOrigin: zoomOrigin,
              transition: "transform 0.2s ease",
              willChange: "transform",
            }}
          >
            {/* Marquee — two copies for seamless loop */}
            <div className="route-marquee-x" style={{ display: "flex", height: `${IMG_HEIGHT}px`, width: `${IMG_WIDTH * 2}px` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/pokemon-roam-mauville.svg"
                alt="Animated Pokémon roaming Mauville City"
                style={{ height: `${IMG_HEIGHT}px`, width: `${IMG_WIDTH}px`, flexShrink: 0, display: "block" }}
                draggable={false}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/pokemon-roam-mauville.svg"
                alt=""
                aria-hidden="true"
                style={{ height: `${IMG_HEIGHT}px`, width: `${IMG_WIDTH}px`, flexShrink: 0, display: "block" }}
                draggable={false}
              />
            </div>
          </div>

          {/* Tooltip */}
          <div className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="whitespace-nowrap rounded-full bg-warm-800/65 px-3 py-1 text-[10px] text-white backdrop-blur-sm">
              Hold to zoom · Click to explore
            </span>
          </div>
        </div>
      </div>

      {/* Expanded modal */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-warm-900/70 p-6 backdrop-blur-sm"
          onClick={close}
          aria-modal="true"
          role="dialog"
          aria-label="Mauville City map"
        >
          <div
            className="relative flex max-w-[90vw] flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-cream-200 bg-white/90 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-warm-400">Mauville City</p>
              <button onClick={close} className="text-warm-300 transition-colors hover:text-warm-700" aria-label="Close">✕</button>
            </div>
            <div className="overflow-x-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/pokemon-roam-mauville.svg"
                alt="Pokémon roaming Mauville City"
                style={{ height: "320px", width: "auto", display: "block" }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
