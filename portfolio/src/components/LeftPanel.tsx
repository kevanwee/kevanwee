"use client";

import Image from "next/image";
import { useState } from "react";
import { personal } from "@/data";
import MusicPlayer from "@/components/MusicPlayer";
import ResumeModal from "@/components/ResumeModal";
import PokeballRow from "@/components/PokeballRow";

const NAV_ITEMS = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "media", label: "Media" },
  { id: "contact", label: "Contact" },
];

interface LeftPanelProps {
  activeSection: string;
  onNavClick: (id: string) => void;
  onOpenModal: () => void;
}

export default function LeftPanel({ activeSection, onNavClick, onOpenModal }: LeftPanelProps) {
  const [showResume, setShowResume] = useState(false);

  return (
    <>
      <aside className="lg:sticky lg:top-[var(--viewport-offset)] lg:flex lg:max-h-[calc(100vh-var(--viewport-offset))] lg:flex-col lg:justify-between lg:overflow-y-auto lg:pb-[clamp(1rem,_3vh,_6rem)]">
        <div>
          <div>
            <h1 className="font-serif text-[clamp(2.25rem,_5vh,_3.35rem)] font-bold leading-[1.02] tracking-tight text-warm-900 xl:text-[clamp(2.25rem,_5vh,_3.75rem)]">
              <span className="block">{personal.name.split(" ")[0]}</span>
              <span className="inline-flex items-end gap-1">
                <span className="italic text-sage-600">{personal.name.split(" ")[1]}</span>
                <span className="text-warm-200">.</span>
                <Image
                  src="/cloud-chibi.png"
                  alt=""
                  width={82}
                  height={84}
                  className="-ml-1.5 mb-1 h-[84px] w-auto select-none object-contain"
                  unoptimized
                />
              </span>
            </h1>

            <p className="mt-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-warm-500">
              {personal.title}
            </p>
          </div>

          <div className="mt-5">
            <PokeballRow />
          </div>

          <div className="my-[clamp(0.75rem,_2vh,_1.75rem)] h-px w-12 bg-cream-200" />

          <p className="max-w-[238px] text-sm leading-7 text-warm-400">
            {personal.description}
          </p>

          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={() => setShowResume(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-cream-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-warm-400 transition-all duration-200 hover:border-sage-300 hover:text-sage-600"
              title="View resume"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                className="h-3.5 w-3.5" aria-hidden="true">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              CV
            </button>
            <button
              onClick={onOpenModal}
              className="inline-flex items-center gap-1.5 rounded-full border border-cream-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-warm-400 transition-all duration-200 hover:border-sage-300 hover:text-sage-600"
              title="View 3D portfolio"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                className="h-3.5 w-3.5" aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              3D
            </button>
          </div>

          <nav className="mt-[clamp(1.25rem,_3vh,_2.5rem)] hidden lg:block" aria-label="Page sections">
            <ul className="space-y-4">
              {NAV_ITEMS.map(({ id, label }) => {
                const active = activeSection === id;
                return (
                  <li key={id}>
                    <button
                      onClick={() => onNavClick(id)}
                      className={`group flex items-center gap-4 transition-all duration-200 ${
                        active ? "text-warm-900" : "text-warm-300 hover:text-warm-700"
                      }`}
                    >
                      <span
                        className={`block h-px flex-shrink-0 transition-all duration-300 ease-out ${
                          active
                            ? "w-14 bg-sage-500"
                            : "w-6 bg-warm-200 group-hover:w-10 group-hover:bg-warm-400"
                        }`}
                      />
                      <span
                        className={`text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-200 ${
                          active ? "text-warm-900" : ""
                        }`}
                      >
                        {label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={personal.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-warm-300 transition-all duration-200 hover:-translate-y-px hover:bg-cream-100 hover:text-sage-600"
            >
              <LinkedInIcon />
            </a>
            <a
              href={personal.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-warm-300 transition-all duration-200 hover:-translate-y-px hover:bg-cream-100 hover:text-sage-600"
            >
              <GitHubIcon />
            </a>
            <a
              href={personal.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-warm-300 transition-all duration-200 hover:-translate-y-px hover:bg-cream-100 hover:text-sage-600"
            >
              <InstagramIcon />
            </a>
            <a
              href={`mailto:${personal.email}`}
              aria-label="Email"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-warm-300 transition-all duration-200 hover:-translate-y-px hover:bg-cream-100 hover:text-sage-600"
            >
              <EmailIcon />
            </a>

            <MusicPlayer />
          </div>

          <p className="mt-4 text-[11px] text-warm-200">
            © {new Date().getFullYear()} Kevan Wee
          </p>
        </div>
      </aside>

      {showResume && <ResumeModal onClose={() => setShowResume(false)} />}
    </>
  );
}

function LinkedInIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
      className="h-[18px] w-[18px]" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
      className="h-[18px] w-[18px]" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
      className="h-[18px] w-[18px]" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      className="h-[18px] w-[18px]" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
