"use client";

import { useEffect, useState } from "react";

const links = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const id = href.replace("#", "");
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-cream-50/95 shadow-sm shadow-cream-200/60 backdrop-blur-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4 md:px-10">
        {/* Monogram / name */}
        <a
          href="#"
          onClick={handleClick("#")}
          className="font-serif text-sm font-semibold tracking-wide text-warm-800 hover:text-sage-600 transition-colors duration-200"
        >
          KW
        </a>

        {/* Nav links */}
        <nav aria-label="Primary navigation">
          <ul className="flex items-center gap-6 sm:gap-8">
            {links.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  onClick={handleClick(href)}
                  className="text-xs font-medium uppercase tracking-widest text-warm-500 transition-colors duration-200 hover:text-sage-600"
                >
                  {label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-sm border border-sage-300 px-3 py-1.5 text-xs font-medium uppercase tracking-widest text-sage-600 transition-all duration-200 hover:bg-sage-50 hover:border-sage-400 hover:scale-[1.03] active:scale-[0.97]"
              >
                Résumé
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3 w-3"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
