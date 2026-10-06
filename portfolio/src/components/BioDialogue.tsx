"use client";

import { useEffect, useRef, useState } from "react";
import { aboutParagraphs } from "@/data";
// Styles: app/globals.css (the Mystery Dungeon dialogue box, and .pmd-bio below it).

const PLAIN_KEY = "portfolio.bio-plain";
const CHARS_PER_TICK = 2;
const TICK_MS = 16;

/** What the game would colour: names, roles and subjects in yellow, places and organisations in blue. */
const EMPHASIS: [string, "name" | "place"][] = [
  ["LegalTech builder", "name"], ["Computing & Law", "name"], ["Singapore Management University", "place"],
  ["Computing Studies (Cybersecurity)", "name"], ["BigLaw", "place"], ["intellectual property and brand protection", "name"],
  ["Singapore's first open quantitative legal database", "name"], ["SMU's Centre for Digital Law", "place"],
  ["DeFi security research", "name"], ["School of Computing & Information Systems", "place"],
  ["legal users, product teams, and AI systems", "name"], ["evaluating AI output", "name"],
];

type Part = [kind: "text" | "name" | "place", text: string];

/** A paragraph cut into plain and highlighted runs. */
function parts(paragraph: string): Part[] {
  const out: Part[] = [];
  let rest = paragraph;
  while (rest) {
    let best: { at: number; phrase: string; kind: "name" | "place" } | null = null;
    for (const [phrase, kind] of EMPHASIS) {
      const at = rest.indexOf(phrase);
      if (at >= 0 && (!best || at < best.at)) best = { at, phrase, kind };
    }
    if (!best) { out.push(["text", rest]); break; }
    if (best.at) out.push(["text", rest.slice(0, best.at)]);
    out.push([best.kind, best.phrase]);
    rest = rest.slice(best.at + best.phrase.length);
  }
  return out;
}

const PAGES = aboutParagraphs.map(parts);

function stillMotion() {
  try { return matchMedia("(prefers-reduced-motion: reduce)").matches; }
  catch { return false; }
}

/** The bio as a Mystery Dungeon dialogue box with shiny Ceruledge's portrait (no speaker name), one paragraph per
 *  page like the game's text box: each types out, then a click or Enter turns to the next (after the last, back to
 *  the first); a click while typing shows the rest of the page. Every page sits in the same grid cell, so the box
 *  is as tall as the longest page and never changes height. Laptop widths only: phones and tablets get the plain
 *  paragraphs. "Plain text" switches to them on a laptop too, remembered in this browser. */
export default function BioDialogue() {
  const [plain, setPlain] = useState(false);
  const [page, setPage] = useState(0);
  // Starts empty: the box types in rather than flashing its text first (the plain paragraphs below
  // the laptop breakpoint, and the box's label, carry the whole bio for crawlers and screen readers).
  const [shown, setShown] = useState(0);
  const [started, setStarted] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const total = PAGES[page].reduce((sum, [, text]) => sum + text.length, 0);
  const done = shown >= total;

  useEffect(() => {
    try { setPlain(localStorage.getItem(PLAIN_KEY) === "true"); } catch { /* storage blocked: dialogue it is */ }
  }, []);

  // Start typing the first time the box comes into view
  useEffect(() => {
    const node = box.current;
    if (plain || started || !node) return;
    if (typeof IntersectionObserver === "undefined") { setStarted(true); return; }
    const seen = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { seen.disconnect(); setStarted(true); } }, { threshold: 0.4 });
    seen.observe(node);
    return () => seen.disconnect();
  }, [plain, started]);

  // Type the current page
  useEffect(() => {
    if (!started) return;
    if (stillMotion()) { setShown(Infinity); return; }
    setShown(0);
    const timer = setInterval(() => setShown(n => {
      if (n + CHARS_PER_TICK >= total) { clearInterval(timer); return Infinity; }
      return n + CHARS_PER_TICK;
    }), TICK_MS);
    return () => clearInterval(timer);
  }, [started, page, total]);

  const advance = () => {
    if (!started) { setStarted(true); return; }
    if (!done) { setShown(Infinity); return; }
    // Clear the box in the same render that turns the page, so the next page never flashes in full
    setShown(stillMotion() ? Infinity : 0);
    setPage(p => (p + 1) % PAGES.length);
  };
  const toggle = () => {
    const next = !plain;
    setPlain(next);
    try { localStorage.setItem(PLAIN_KEY, String(next)); } catch { /* not remembered */ }
  };

  const paragraphs = (
    <div className="space-y-4">
      {aboutParagraphs.map((p, i) => <p key={i} className="text-sm leading-relaxed text-warm-600">{p}</p>)}
    </div>
  );
  return (
    <div className="pmd-bio">
      {plain ? paragraphs : <>
        <div className="lg:hidden">{paragraphs}</div>
        <div className="hidden lg:block">
          <div className="pmd-log" data-done={done || undefined}>
            <div className="pmd-portrait">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/pmd/ceruledge-shiny.png" alt="" width={80} height={80} />
            </div>
            <div ref={box} className="pmd-box" role="button" tabIndex={0}
              aria-label={`About, page ${page + 1} of ${PAGES.length}: ${aboutParagraphs[page]} ${done ? "Next page" : "Show all"}`}
              onClick={advance}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); advance(); } }}>
              <div className="pmd-pages" aria-hidden="true">
                {PAGES.map((runs, i) => {
                  let budget = i === page ? shown : 0;
                  return <p key={i} data-current={i === page || undefined}>
                    {runs.map(([kind, text], j) => {
                      const typed = text.slice(0, Math.max(0, budget)); budget -= text.length;
                      return <span key={j} className={kind === "text" ? undefined : `pmd-${kind}`}>
                        {typed}<span className="pmd-untyped">{text.slice(typed.length)}</span>
                      </span>;
                    })}
                  </p>;
                })}
              </div>
              <span className="pmd-page" aria-hidden="true">{page + 1}/{PAGES.length}</span>
              <span className="pmd-arrow" aria-hidden="true" />
            </div>
          </div>
        </div>
      </>}
      <div className="hidden lg:block">
        <button type="button" className="pmd-bio-toggle" aria-pressed={plain} onClick={toggle}>Plain text</button>
      </div>
    </div>
  );
}
