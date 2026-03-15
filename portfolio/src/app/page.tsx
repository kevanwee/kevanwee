"use client";

import { useEffect, useState, useCallback } from "react";
import LeftPanel from "@/components/LeftPanel";
import About from "@/components/About";
import ExperienceSection from "@/components/Experience";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";

const SECTIONS = ["about", "experience", "projects"] as const;

export default function Home() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeSection, setActiveSection] = useState<string>("about");

  // Mouse-follow gradient
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  // Active section detection via IntersectionObserver
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
    <div className="relative min-h-screen selection:bg-indigo-400/20 selection:text-indigo-200">
      {/* Mouse-follow radial gradient */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition duration-300"
        aria-hidden="true"
        style={{
          background: `radial-gradient(700px at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.07), transparent 80%)`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-screen-xl px-6 md:px-12 lg:px-24">
        <div className="lg:flex lg:gap-12">
          {/* Left panel — sticky on desktop, inline on mobile */}
          <div className="pt-16 pb-8 lg:pt-0 lg:pb-0 lg:w-[45%]">
            <LeftPanel
              activeSection={activeSection}
              onNavClick={scrollToSection}
            />
          </div>

          {/* Right panel — scrollable content */}
          <main className="lg:w-[55%] lg:py-24">
            <About />
            <ExperienceSection />
            <Projects />
            <Contact />
          </main>
        </div>
      </div>
    </div>
  );
}
