"use client";

import React, { useState } from "react";
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

// Design tokens for filter colours — kept here so they're co-located with the
// filter logic rather than scattered as magic strings throughout JSX.
const FILTER_TOKENS = {
  tech: {
    active:        "#F5A623",
    activeBg:      "#FEF3D6",
    activeText:    "#C97D10",
    highlightBg:   "rgba(245, 166, 35, 0.18)",
  },
  legal: {
    active:        "#3DC4A0",
    activeBg:      "#D0F5EC",
    activeText:    "#0E8A6E",
    highlightBg:   "rgba(61, 196, 160, 0.18)",
  },
} as const;

type FilterKey = "tech" | "legal";

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
        <h2 className="mb-12 font-serif text-3xl font-bold text-warm-900">
          Experience
        </h2>

        <div className="flex flex-col gap-0 sm:flex-row">
          {/* Tab list — left column */}
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

          {/* Panel — centre, fills remaining space */}
          <div className="flex-1 px-0 pt-6 sm:pl-8 sm:pt-0">
            {/* Filter bar — horizontal on mobile (above content), vertical on desktop (tucked to right via parent flex) */}
            <div className="flex flex-row gap-2 border-b border-cream-200 pb-3 sm:hidden">
              <FilterBar
                activeFilters={activeFilters}
                onToggle={toggleFilter}
                orientation="horizontal"
              />
            </div>

            <ExperiencePanel exp={active} activeFilters={activeFilters} />
          </div>

          {/* Filter bar — desktop only, right column */}
          <div className="hidden shrink-0 flex-col gap-2 border-l border-cream-200 pl-4 sm:flex">
            <FilterBar
              activeFilters={activeFilters}
              onToggle={toggleFilter}
              orientation="vertical"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FilterBar
// ---------------------------------------------------------------------------

interface FilterBarProps {
  activeFilters: Set<FilterKey>;
  onToggle: (f: FilterKey) => void;
  orientation: "horizontal" | "vertical";
}

function FilterBar({ activeFilters, onToggle, orientation }: FilterBarProps) {
  const filters: { key: FilterKey; label: string; icon: string }[] = [
    { key: "tech",  label: "Tech",  icon: "/icons/latias.png" },
    { key: "legal", label: "Legal", icon: "/icons/latios.png" },
  ];

  return (
    <>
      {filters.map(({ key, label, icon }) => {
        const isActive = activeFilters.has(key);
        const tokens = FILTER_TOKENS[key];

        const activeStyle: React.CSSProperties = isActive
          ? {
              backgroundColor: tokens.activeBg,
              color:            tokens.activeText,
              borderColor:      tokens.active,
            }
          : {};

        return (
          <button
            key={key}
            aria-pressed={isActive}
            onClick={() => onToggle(key)}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ease-in-out ${
              orientation === "vertical" ? "w-full" : ""
            } ${
              isActive
                ? "border-2"
                : "border border-cream-200 text-warm-400 hover:border-cream-300 hover:text-warm-600"
            }`}
            style={activeStyle}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={icon}
              alt=""
              aria-hidden="true"
              className="h-4 w-auto flex-shrink-0 object-contain"
            />
            {label}
          </button>
        );
      })}
    </>
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
          const tags = exp.bulletTags?.[i] ?? [];
          const highlightStyle = getBulletHighlight(tags, activeFilters);
          const isDimmed =
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
// Highlight resolver — returns the background value to apply, or null if none
// ---------------------------------------------------------------------------

function getBulletHighlight(
  tags: ("tech" | "legal")[],
  activeFilters: Set<FilterKey>
): string | null {
  if (activeFilters.size === 0 || tags.length === 0) return null;

  const hasTech  = tags.includes("tech");
  const hasLegal = tags.includes("legal");
  const techOn   = activeFilters.has("tech");
  const legalOn  = activeFilters.has("legal");

  // Both tags AND both filters active → gradient
  if (hasTech && hasLegal && techOn && legalOn) {
    return "linear-gradient(to right, rgba(245,166,35,0.18), rgba(61,196,160,0.18))";
  }

  // Only tech tag matched
  if (hasTech && techOn && !hasLegal) {
    return FILTER_TOKENS.tech.highlightBg;
  }

  // Only legal tag matched
  if (hasLegal && legalOn && !hasTech) {
    return FILTER_TOKENS.legal.highlightBg;
  }

  // Mixed bullet (both tags) but only one filter is on — highlight with that filter's colour
  if (hasTech && hasLegal) {
    if (techOn)  return FILTER_TOKENS.tech.highlightBg;
    if (legalOn) return FILTER_TOKENS.legal.highlightBg;
  }

  return null;
}
