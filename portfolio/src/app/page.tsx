"use client";

import { useState, useEffect, useCallback, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import MediaAppearances from "@/components/MediaAppearances";
import Contact from "@/components/Contact";
import LeftPanel from "@/components/LeftPanel";
import EeveeBase from "@/components/EeveeBase";
import MouseGradient from "@/components/MouseGradient";
import PokemonCursor from "@/components/PokemonCursor";
import TeddiursaRoamer from "@/components/TeddiursaRoamer";
import FusionWheel from "@/components/FusionWheel";
import { PokemonCursorProvider } from "@/components/PokemonCursorContext";
import { personal } from "@/data";

const PortfolioModal = dynamic(() => import("@/components/PortfolioModal"), {
  ssr: false,
});
const PokemonOverworld = dynamic(() => import("@/components/PokemonOverworld"), { ssr: false });
const YveltalRoamer = dynamic(() => import("@/components/YveltalRoamer"), { ssr: false });

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
    document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? "instant" : "smooth" });
  }, []);

  return (
    <PokemonCursorProvider>
    <div
      className="relative min-h-screen bg-cream-50 selection:bg-sage-200 selection:text-sage-900"
      style={{ "--viewport-offset": "clamp(4rem, 12vh, 9rem)" } as CSSProperties}
    >
      <MouseGradient />
      <PokemonCursor />
      <FusionWheel />
      <TeddiursaRoamer />
      <PokemonOverworld />
      <YveltalRoamer />

      <div className="relative z-10 mx-auto max-w-screen-xl px-6 pt-[var(--viewport-offset)] md:px-12 lg:px-24">
        <div className="lg:flex lg:gap-16 xl:gap-20">
          <div id="teddiursa-panel" className="pb-8 lg:w-[45%]">
            <LeftPanel
              activeSection={activeSection}
              onNavClick={scrollToSection}
              onOpenModal={() => setShowModal(true)}
            />
          </div>

          <main className="lg:w-[55%] lg:pb-24">
            <About />
            <Experience />
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

      {showModal && (
        <PortfolioModal url={personal.funPortfolio} onClose={() => setShowModal(false)} />
      )}
    </div>
    </PokemonCursorProvider>
  );
}
