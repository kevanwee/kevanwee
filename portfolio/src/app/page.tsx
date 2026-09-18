"use client";

import { useState, useEffect, useCallback, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import MediaAppearances from "@/components/MediaAppearances";
import Contact from "@/components/Contact";
import LeftPanel from "@/components/LeftPanel";
import MouseGradient from "@/components/MouseGradient";
import PokemonCursor from "@/components/PokemonCursor";
import TeddiursaRoamer from "@/components/TeddiursaRoamer";
import { PokemonCursorProvider } from "@/components/PokemonCursorContext";
import { personal } from "@/data";

const PortfolioModal = dynamic(() => import("@/components/PortfolioModal"), {
  ssr: false,
});

const SECTIONS = ["about", "experience", "projects", "media", "contact"] as const;

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("about");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: document.documentElement.dataset.motion === "paused" ? "auto" : "smooth" });
  }, []);

  return (
    <PokemonCursorProvider>
    <div
      className="min-h-screen bg-cream-50 selection:bg-sage-200 selection:text-sage-900"
      style={{ "--viewport-offset": "clamp(4rem, 12vh, 9rem)" } as CSSProperties}
    >
      <MouseGradient />
      <PokemonCursor />
      <TeddiursaRoamer />

      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-4">Skip to content</a>
      <nav className="sticky top-0 z-30 flex gap-1 overflow-x-auto border-b border-cream-200 bg-cream-50/95 px-3 py-2 backdrop-blur-sm lg:hidden" aria-label="Page sections">
        {SECTIONS.map(id => <a key={id} href={`#${id}`} aria-current={activeSection === id ? "location" : undefined}
          className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-xs font-semibold capitalize ${activeSection === id ? "bg-sage-100 text-sage-700" : "text-warm-700"}`}>{id}</a>)}
      </nav>
      <div className="relative z-10 mx-auto max-w-screen-xl px-6 pt-[var(--viewport-offset)] md:px-12 lg:px-24">
        <div className="lg:flex lg:gap-16 xl:gap-20">
          <div id="teddiursa-panel" className="pb-8 lg:w-[45%]">
            <LeftPanel
              activeSection={activeSection}
              onNavClick={scrollToSection}
              onOpenModal={() => setShowModal(true)}
            />
          </div>

          <main id="main-content" className="min-w-0 lg:w-[55%] lg:pb-24">
            <About />
            <Experience />
            <Projects />
            <MediaAppearances />
            <Contact />
          </main>
        </div>
      </div>

      {showModal && (
        <PortfolioModal url={personal.funPortfolio} onClose={() => setShowModal(false)} />
      )}
    </div>
    </PokemonCursorProvider>
  );
}
