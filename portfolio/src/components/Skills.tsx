"use client";

import { useState } from "react";

type Tab = "tech" | "legal" | "others";

const TECH_SKILLS = [
  {
    category: "Languages",
    skills: ["Python", "TypeScript", "Java", "PHP", "MySQL"],
  },
  {
    category: "Frameworks & Libraries",
    skills: ["Next.js", "FastAPI", "Office.js", "pandas", "SetFit", "BeautifulSoup4", "ChromaDB", "python-docx", "openpyxl"],
  },
  {
    category: "Infrastructure & Tools",
    skills: ["AWS", "Linux", "Docker / CI-CD", "WAMP", "JIRA", "Atlassian Suite", "GDB", "RelativityOne"],
  },
  {
    category: "AI / ML",
    skills: ["NLP", "RAG", "PostgresML"],
  },
  {
    category: "Security",
    skills: ["Web3 / DeFi Security", "ZTNA"],
  },
  {
    category: "Geospatial",
    skills: ["ArcGIS", "ArcMap"],
  },
];

const LEGAL_SKILLS = [
  {
    category: "Areas of Interest",
    skills: ["Contract Law", "Intellectual Property", "Data Privacy (PDPA)", "Corporate / M&A", "Litigation", "Criminal Law", "Tort Law", "Family Law"],
  },
  {
    category: "Specialties",
    skills: ["eDiscovery", "CLM", "Platform Liability", "GenAI Regulation", "Cross-jurisdictional Analysis", "Legal NLP", "SOPA Claims", "Deputyship"],
  },
  {
    category: "Certifications",
    skills: ["RelativityOne Certified Professional"],
  },
];

const OTHER_SKILLS = [
  {
    category: "Geospatial Intelligence",
    skills: ["Cartography", "Stereophotogrammetry", "GIS Operations"],
  },
  {
    category: "Leadership & Operations",
    skills: ["Cross-agency Stakeholder Coordination", "Team Leadership"],
  },
  {
    category: "Research",
    skills: ["Legal Research", "Literature Review", "Systematic Review"],
  },
];

const TABS: { id: Tab; label: string }[] = [
  { id: "tech", label: "Tech" },
  { id: "legal", label: "Legal" },
  { id: "others", label: "Others" },
];

function tabStyles(tab: Tab, active: boolean) {
  if (!active) {
    return "rounded-full border border-cream-200 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-warm-300 transition-all duration-200 hover:border-warm-200 hover:text-warm-500";
  }
  if (tab === "tech") {
    return "rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-200 border-blue-200 bg-blue-50 text-blue-800";
  }
  if (tab === "legal") {
    return "rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-200 border-pink-200 bg-pink-50 text-pink-800";
  }
  return "rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-200 border-sage-200 bg-sage-50 text-sage-700";
}

function pillStyles(tab: Tab) {
  if (tab === "tech") {
    return "rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs text-blue-800";
  }
  if (tab === "legal") {
    return "rounded-full border border-pink-100 bg-pink-50 px-2.5 py-0.5 text-xs text-pink-800";
  }
  return "rounded-full border border-sage-100 bg-sage-50 px-2.5 py-0.5 text-xs text-sage-700";
}

export default function Skills() {
  const [activeTab, setActiveTab] = useState<Tab>("tech");

  const groups =
    activeTab === "tech"
      ? TECH_SKILLS
      : activeTab === "legal"
      ? LEGAL_SKILLS
      : OTHER_SKILLS;

  return (
    <div className="mt-16">
      <p className="mb-6 text-xs font-bold uppercase tracking-widest text-warm-400">
        Skills
      </p>

      <div className="rounded-2xl border border-cream-200 bg-white p-6">
        {/* Tab bar */}
        <div className="mb-6 flex items-center gap-2">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={tabStyles(id, activeTab === id)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Skill groups */}
        <div className="flex flex-col gap-5">
          {groups.map(({ category, skills }) => (
            <div key={category}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-warm-300">
                {category}
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <li key={skill} className={pillStyles(activeTab)}>
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
