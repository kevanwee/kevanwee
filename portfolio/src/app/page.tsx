"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import MediaAppearances from "@/components/MediaAppearances";
import Contact from "@/components/Contact";
import LeftPanel from "@/components/LeftPanel";
import { personal } from "@/data";

const PortfolioModal = dynamic(() => import("@/components/PortfolioModal"), { ssr: false });

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div className="min-h-screen bg-cream-50 selection:bg-sage-200 selection:text-sage-900">
      {/* Subtle sage mouse-follow gradient */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-all duration-500"
        aria-hidden="true"
        style={{
          background: `radial-gradient(600px at ${mousePos.x}px ${mousePos.y}px, rgba(132,169,140,0.07), transparent 80%)`,
        }}
      />

      {/* Mobile nav */}
      <div className="relative z-10 lg:hidden">
        <Nav />
      </div>

      <div className="relative z-10 mx-auto max-w-screen-xl px-6 md:px-12 lg:px-24">
        <div className="lg:flex lg:gap-16 xl:gap-20">

          {/* Left panel */}
          <div className="pt-16 pb-8 lg:pt-0 lg:pb-0 lg:w-[45%]">
            {/* Mobile hero */}
            <div className="lg:hidden">
              <Hero />
            </div>
            {/* Desktop sticky panel */}
            <div className="hidden lg:block">
              <LeftPanel onOpenModal={() => setShowModal(true)} />
            </div>
          </div>

          {/* Right — scrollable sections */}
          <main className="lg:w-[55%] lg:py-24">
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
  );
}
