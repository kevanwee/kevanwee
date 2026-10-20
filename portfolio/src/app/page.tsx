"use client";

import { useState, useEffect, useCallback, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import About from "@/components/About";
import LegalEngineering from "@/components/LegalEngineering";
import { portfolioSections } from "@/data";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import MediaAppearances from "@/components/MediaAppearances";
import Contact from "@/components/Contact";
import LeftPanel from "@/components/LeftPanel";
import EeveeBase from "@/components/FriendAreas";
import MouseGradient from "@/components/MouseGradient";
import SmoothScroll from "@/components/SmoothScroll";
import PokemonCursor from "@/components/PokemonCursor";
import TeddiursaRoamer from "@/components/TeddiursaRoamer";
import FusionWheel from "@/components/FusionWheel";
import PokemonPcHost from "@/components/PokemonPcHost";
import { PokemonCursorProvider } from "@/components/PokemonCursorContext";

const PokemonOverworld = dynamic(() => import("@/components/PokemonOverworld"), { ssr: false });

const SECTIONS = portfolioSections.map(section => section.id);

export default function Home() {
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
    const section = document.getElementById(id);
    if (!section) return;
    const heading = section.querySelector("[data-section-scroll-target], h2");
    // Section boxes include the decorative divider, resident ledge and top
    // padding. Navigation lands on the visible heading or an explicitly marked content card.
    const target = heading && heading.getClientRects().length ? heading : section;
    window.scrollTo({ top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - 24),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? "instant" : "smooth" });
  }, []);

  return (
    <PokemonCursorProvider>
    <PokemonPcHost />
    <div
      className="portfolio-home relative min-h-screen bg-cream-50 selection:bg-sage-200 selection:text-sage-900"
      style={{ "--viewport-offset": "clamp(4rem, 12vh, 9rem)" } as CSSProperties}
    >
      <SmoothScroll />
      <MouseGradient />
      <PokemonCursor />
      <FusionWheel />
      <TeddiursaRoamer />
      <PokemonOverworld />

      <div className="portfolio-shell relative z-10 mx-auto max-w-screen-xl px-6 pt-[var(--viewport-offset)] md:px-12 lg:px-24">
        <div className="lg:flex lg:gap-16 xl:gap-20">
          <div id="teddiursa-panel" className="pb-8 lg:w-[45%]">
            <LeftPanel
              activeSection={activeSection}
              onNavClick={scrollToSection}
            />
          </div>

          <main className="lg:w-[55%] lg:pb-24">
            <About />
            <Experience />
            <LegalEngineering />
            <Projects />
            {/* The section above owns a full section gap, which it earns because the next section opens
                with a rule. This has no rule, so it pulls up to the panel's own 64px rhythm. */}
            <div className="-mt-8 mb-24 grid gap-4 lg:-mt-20 lg:mb-36">
              <EeveeBase />
            </div>
            <MediaAppearances />
            <Contact />
          </main>
        </div>
      </div>

    </div>
    </PokemonCursorProvider>
  );
}
