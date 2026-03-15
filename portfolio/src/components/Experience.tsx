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

export default function ExperienceSection() {
  const [activeId, setActiveId] = useState(experiences[0].id);
  const active = experiences.find((e) => e.id === activeId) ?? experiences[0];

  return (
    <section
      id="experience"
      className="scroll-mt-20 border-t border-cream-200 px-6 py-24 md:px-10"
      aria-label="Work Experience"
    >
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-12 font-serif text-3xl font-bold text-warm-900">
          Experience
        </h2>

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
                  className={`relative shrink-0 whitespace-nowrap px-4 py-3 text-left text-xs transition-all duration-150 sm:w-44 sm:-ml-0.5 ${
                    isActive
                      ? "border-b-2 border-sage-500 font-semibold text-sage-700 sm:border-b-0 sm:border-l-2 sm:border-sage-500 sm:bg-sage-50 sm:text-sage-700"
                      : "font-medium text-warm-400 hover:bg-cream-100 hover:text-warm-700"
                  }`}
                >
                  {TAB_LABELS[exp.id] ?? exp.company.split(" ")[0]}
                </button>
              );
            })}
          </div>

          {/* Panel */}
          <div className="flex-1 px-0 pt-6 sm:pl-8 sm:pt-0">
            <ExperiencePanel exp={active} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ExperiencePanel({ exp }: { exp: Experience }) {
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
        {exp.bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-warm-500">
            <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-sage-400" />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}
