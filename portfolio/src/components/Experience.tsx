"use client";

import { useState } from "react";
import { experiences, Experience } from "@/data";

export default function ExperienceSection() {
  const [activeId, setActiveId] = useState(experiences[0].id);

  const active = experiences.find((e) => e.id === activeId) ?? experiences[0];

  return (
    <section
      id="experience"
      className="mb-24 scroll-mt-16 lg:mb-36 lg:scroll-mt-24"
      aria-label="Work Experience"
    >
      <div className="section-heading lg:hidden">Experience</div>

      <div className="flex flex-col gap-1 sm:flex-row">
        {/* Tab list */}
        <div
          role="tablist"
          aria-label="Experience tabs"
          className="flex shrink-0 flex-row overflow-x-auto border-b border-slate-800 sm:flex-col sm:overflow-x-visible sm:border-b-0 sm:border-l sm:border-slate-800"
        >
          {experiences.map((exp) => (
            <button
              key={exp.id}
              role="tab"
              aria-selected={exp.id === activeId}
              aria-controls={`panel-${exp.id}`}
              onClick={() => setActiveId(exp.id)}
              className={`relative whitespace-nowrap px-4 py-3 text-left text-xs font-medium transition-all duration-200 sm:w-40 ${
                exp.id === activeId
                  ? "text-indigo-400 sm:border-l-2 sm:border-indigo-400 sm:-ml-px sm:border-b-0 border-b-2 border-indigo-400"
                  : "text-slate-500 hover:bg-slate-900/50 hover:text-slate-300"
              }`}
            >
              {exp.company}
            </button>
          ))}
        </div>

        {/* Tab panel */}
        <div
          id={`panel-${active.id}`}
          role="tabpanel"
          className="ml-0 pt-6 sm:ml-6 sm:pt-1"
        >
          <ExperienceDetail exp={active} />
        </div>
      </div>
    </section>
  );
}

function ExperienceDetail({ exp }: { exp: Experience }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-slate-200">
        {exp.role}{" "}
        <a
          href={exp.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          @ {exp.company}
        </a>
      </h3>
      <div className="mt-1 mb-4 flex flex-wrap items-center gap-3">
        <p className="font-mono text-xs text-slate-500">{exp.period}</p>
        <span className="inline-block rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-500">
          {exp.type}
        </span>
      </div>
      <ul className="space-y-2">
        {exp.bullets.map((bullet, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
            <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-indigo-500" />
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  );
}
