"use client";

import { useState, useEffect, useCallback, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import MediaAppearances from "@/components/MediaAppearances";
import Contact from "@/components/Contact";
import LeftPanel from "@/components/LeftPanel";
import PokemonCursor from "@/components/PokemonCursor";
import { PokemonCursorProvider } from "@/components/PokemonCursorContext";
import { personal } from "@/data";

const PortfolioModal = dynamic(() => import("@/components/PortfolioModal"), {
  ssr: false,
});

const SECTIONS = ["about", "experience", "projects", "media", "contact"] as const;

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeSection, setActiveSection] = useState<string>("about");

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

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
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <PokemonCursorProvider>
    <div
      className="min-h-screen bg-cream-50 selection:bg-sage-200 selection:text-sage-900"
      style={{ "--viewport-offset": "clamp(4rem, 12vh, 9rem)" } as CSSProperties}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-all duration-500"
        aria-hidden="true"
        style={{
          background: `radial-gradient(600px at ${mousePos.x}px ${mousePos.y}px, rgba(132,169,140,0.07), transparent 80%)`,
        }}
      />
      <PokemonCursor />

      <div className="relative z-10 mx-auto max-w-screen-xl px-6 pt-[var(--viewport-offset)] md:px-12 lg:px-24">
        <div className="lg:flex lg:gap-16 xl:gap-20">
          <div className="pb-8 lg:w-[45%]">
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
