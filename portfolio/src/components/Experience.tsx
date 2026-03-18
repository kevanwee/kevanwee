"use client";

import React, { useEffect, useRef, useState } from "react";
import { experiences, Experience } from "@/data";

const typeStyle: Record<string, string> = {
  "Part-time":      "text-sage-600 bg-sage-50 ring-sage-100",
  "Internship":     "text-warm-600 bg-warm-50 ring-warm-200",
  "Freelance":      "text-amber-700 bg-amber-50 ring-amber-100",
  "Pro Bono":       "text-amber-700 bg-amber-50 ring-amber-100",
  "Full-time (NS)": "text-warm-600 bg-warm-50 ring-warm-200",
};

const TAB_LABELS: Record<string, string> = {
  "smu-scis": "SMU SCIS",
  "osborne":  "Osborne Clarke",
  "pwc":      "PwC",
  "imda":     "IMDA",
  "smu-law":  "SMU YPHSOL",
  "cjc":      "The State Courts",
  "rnt":      "Rajah & Tann",
  "tito":     "Tito Isaac",
  "dis":      "DIS SAF",
};

const FILTER_TOKENS = {
  tech: {
    active:      "#93C5FD",
    activeBg:    "#DBEAFE",
    activeText:  "#1E40AF",
    highlightBg: "rgba(147, 197, 253, 0.3)",
  },
  legal: {
    active:      "#F9A8D4",
    activeBg:    "#FCE7F3",
    activeText:  "#9D174D",
    highlightBg: "rgba(249, 168, 212, 0.3)",
  },
} as const;

type FilterKey = "tech" | "legal";

// ---------------------------------------------------------------------------
// SpriteAnim — renders one direction of a PMD sprite-sheet on a <canvas>
// ---------------------------------------------------------------------------

interface SpriteAnimProps {
  src: string;
  frameWidth: number;
  frameHeight: number;
  row: number;        // sprite-sheet row (direction); DIR_S = 0
  durations: number[]; // per-frame duration in ticks (1 tick ≈ 16 ms)
  scale: number;
}

function SpriteAnim({ src, frameWidth, frameHeight, row, durations, scale }: SpriteAnimProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef    = useRef<HTMLImageElement | null>(null);
  const stateRef  = useRef({ frame: 0, tick: 0, loaded: false });

  const W = Math.round(frameWidth  * scale);
  const H = Math.round(frameHeight * scale);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      stateRef.current.loaded = true;
    };
    img.src = src;

    const TICK_MS = 16;
    let lastTime = 0;
    let raf: number;

    function draw() {
      const canvas = canvasRef.current;
      if (!canvas || !imgRef.current) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = false;
      const { frame } = stateRef.current;
      ctx.drawImage(
        imgRef.current,
        frame * frameWidth,
        row   * frameHeight,
        frameWidth,
        frameHeight,
        0, 0, W, H,
      );
    }

    function tick(now: number) {
      raf = requestAnimationFrame(tick);
      if (now - lastTime < TICK_MS) return;
      lastTime = now;
      const s = stateRef.current;
      if (!s.loaded) return;
      s.tick++;
      if (s.tick >= durations[s.frame]) {
        s.tick = 0;
        s.frame = (s.frame + 1) % durations.length;
      }
      draw();
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{ imageRendering: "pixelated" }}
      aria-hidden="true"
    />
  );
}

// Froakie Idle  — 24×40 px/frame, 7 frames, DIR_S = row 0
const FROAKIE_IDLE: Omit<SpriteAnimProps, "scale"> = {
  src: "/froakie/Idle-Anim.png",
  frameWidth:  24,
  frameHeight: 40,
  row:         0,
  durations:   [38, 2, 2, 5, 3, 3, 2],
};

// Fuecoco Idle  — 24×32 px/frame, 4 frames, DIR_S = row 0
const FUECOCO_IDLE: Omit<SpriteAnimProps, "scale"> = {
  src: "/fuecoco/Idle-Anim.png",
  frameWidth:  24,
  frameHeight: 32,
  row:         0,
  durations:   [60, 6, 6, 6],
};

// ---------------------------------------------------------------------------
// ExperienceSection
// ---------------------------------------------------------------------------

export default function ExperienceSection() {
  const [activeId, setActiveId] = useState(experiences[0].id);
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());

  const active = experiences.find((e) => e.id === activeId) ?? experiences[0];

  const toggleFilter = (f: FilterKey) =>
    setActiveFilters((prev) => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });

  return (
    <section
      id="experience"
      className="mb-24 scroll-mt-24 border-t border-cream-200 pt-24 lg:mb-36"
      aria-label="Work Experience"
    >
      <div>
        {/* Heading row — title left, filter buttons right */}
        <div className="mb-12 flex items-end justify-between gap-4">
          <h2 className="font-serif text-3xl font-bold text-warm-900">
            Experience
          </h2>

          <div className="flex shrink-0 items-end gap-3">
            {(["tech", "legal"] as FilterKey[]).map((key) => {
              const isActive = key === "tech"
                ? activeFilters.has("tech")
                : activeFilters.has("legal");
              const tokens  = FILTER_TOKENS[key];
              const sprite  = key === "tech" ? FROAKIE_IDLE : FUECOCO_IDLE;
              const label   = key === "tech" ? "Tech" : "Legal";

              return (
                <button
                  key={key}
                  aria-pressed={isActive}
                  onClick={() => toggleFilter(key)}
                  className="flex flex-col items-center gap-1 rounded-xl px-3 pb-2 pt-3 text-xs font-medium transition-all duration-200 ease-in-out"
                  style={
                    isActive
                      ? {
                          backgroundColor: tokens.activeBg,
                          color:           tokens.activeText,
                          border:          `2px solid ${tokens.active}`,
                        }
                      : {
                          backgroundColor: "transparent",
                          color:           "#a8a29e",
                          border:          "2px solid #e7e5e4",
                        }
                  }
                >
                  <SpriteAnim {...sprite} scale={2.5} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-0 sm:flex-row">
          {/* Tab list */}
          <div
            role="tablist"
            className="flex shrink-0 flex-row overflow-x-auto border-b border-cream-200 sm:flex-col sm:overflow-x-visible sm:border-b-0 sm:border-l-2 sm:border-cream-200"
            style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          >
            {experiences.map((exp) => {
              const isActive = exp.id === activeId;
              return (
                <button
                  key={exp.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveId(exp.id)}
                  className={`relative shrink-0 whitespace-nowrap px-4 py-3 text-left text-xs transition-all duration-200 ease-in-out sm:w-44 sm:-ml-0.5 ${
                    isActive
                      ? "border-b-2 border-sage-500 font-semibold text-sage-700 sm:border-b-0 sm:border-l-2 sm:border-sage-500 sm:bg-sage-50 sm:text-sage-700"
                      : "font-medium text-warm-400 hover:bg-cream-100 hover:text-warm-700"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {exp.logo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={exp.logo}
                        alt=""
                        aria-hidden="true"
                        className="h-4 w-auto flex-shrink-0 rounded object-cover"
                      />
                    )}
                    {TAB_LABELS[exp.id] ?? exp.company.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Panel */}
          <div className="flex-1 px-0 pt-6 sm:pl-8 sm:pt-0">
            <ExperiencePanel exp={active} activeFilters={activeFilters} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// ExperiencePanel
// ---------------------------------------------------------------------------

interface ExperiencePanelProps {
  exp: Experience;
  activeFilters: Set<FilterKey>;
}

function ExperiencePanel({ exp, activeFilters }: ExperiencePanelProps) {
  const filtersActive = activeFilters.size > 0;

  return (
    <div>
      {/* Company + period */}
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
        <a
          href={exp.url !== "#" ? exp.url : undefined}
          target={exp.url !== "#" ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="text-sm font-semibold text-warm-900 hover:text-sage-600 transition-colors"
        >
          {exp.company}
        </a>
        <span className="font-mono text-xs text-warm-400 sm:flex-shrink-0">
          {exp.period}
        </span>
      </div>

      {/* Role + badge */}
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <span className="text-sm italic text-warm-600">
          {exp.role}
          {exp.subtitle ? ` · ${exp.subtitle}` : ""}
        </span>
        <span
          className={`inline-block rounded-sm px-2 py-0.5 text-xs ring-1 ${
            typeStyle[exp.type] ?? "text-warm-500 bg-warm-50 ring-warm-200"
          }`}
        >
          {exp.type}
        </span>
      </div>

      {/* Bullets */}
      <ul className="mt-4 space-y-2.5">
        {exp.bullets.map((b, i) => {
          const tags           = exp.bulletTags?.[i] ?? [];
          const highlightStyle = getBulletHighlight(tags, activeFilters);
          const isDimmed       =
            filtersActive &&
            tags.length > 0 &&
            !tags.some((t) => activeFilters.has(t));

          return (
            <li
              key={i}
              className="flex items-start gap-3 text-sm leading-relaxed text-warm-500 transition-opacity duration-200"
              style={{ opacity: isDimmed ? 0.4 : 1 }}
            >
              <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-sage-400" />
              {highlightStyle ? (
                <span
                  style={{
                    background:   highlightStyle,
                    borderRadius: "4px",
                    padding:      "2px 6px",
                  }}
                >
                  {b}
                </span>
              ) : (
                b
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Highlight resolver
// ---------------------------------------------------------------------------

function getBulletHighlight(
  tags: ("tech" | "legal")[],
  activeFilters: Set<FilterKey>,
): string | null {
  if (activeFilters.size === 0 || tags.length === 0) return null;

  const hasTech  = tags.includes("tech");
  const hasLegal = tags.includes("legal");
  const techOn   = activeFilters.has("tech");
  const legalOn  = activeFilters.has("legal");

  if (hasTech && hasLegal && techOn && legalOn) {
    return "linear-gradient(to right, rgba(147,197,253,0.3), rgba(249,168,212,0.3))";
  }
  if (hasTech && techOn && !hasLegal)  return FILTER_TOKENS.tech.highlightBg;
  if (hasLegal && legalOn && !hasTech) return FILTER_TOKENS.legal.highlightBg;

  if (hasTech && hasLegal) {
    if (techOn)  return FILTER_TOKENS.tech.highlightBg;
    if (legalOn) return FILTER_TOKENS.legal.highlightBg;
  }

  return null;
}
