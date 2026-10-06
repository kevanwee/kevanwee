"use client";

import { useEffect, useRef, useState } from "react";
import { aboutParagraphs } from "@/data";
// Styles: app/globals.css (the Mystery Dungeon dialogue box, and .pmd-bio below it).

const PLAIN_KEY = "portfolio.bio-plain";
const CHARS_PER_TICK = 2;
const TICK_MS = 16;
const TOTAL = aboutParagraphs.reduce((sum, p) => sum + p.length, 0);

function stillMotion() {
  try { return matchMedia("(prefers-reduced-motion: reduce)").matches; }
  catch { return false; }
}

/** The bio as a Mystery Dungeon dialogue box with shiny Ceruledge's portrait (no speaker name). It types out once
 *  when it comes into view; a click or Enter shows the rest at once. The whole text is always in the page (the
 *  untyped part is transparent), so the box never changes height and screen readers get all of it.
 *  "Plain text" switches to ordinary paragraphs, remembered in this browser. Below laptop width (1024px) the box
 *  would be a tall narrow column, so phones and tablets always show the plain paragraphs. */
export default function BioDialogue() {
  const [plain, setPlain] = useState(false);
  const [shown, setShown] = useState(TOTAL);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { setPlain(localStorage.getItem(PLAIN_KEY) === "true"); } catch { /* storage blocked: dialogue it is */ }
  }, []);

  useEffect(() => {
    const node = box.current;
    if (plain || !node || stillMotion() || typeof IntersectionObserver === "undefined") return;
    setShown(0);
    let timer: ReturnType<typeof setInterval> | undefined;
    const seen = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || timer) return;
      seen.disconnect();
      timer = setInterval(() => setShown(n => {
        if (n + CHARS_PER_TICK >= TOTAL) { clearInterval(timer); return TOTAL; }
        return n + CHARS_PER_TICK;
      }), TICK_MS);
    }, { threshold: 0.1 });
    seen.observe(node);
    return () => { seen.disconnect(); clearInterval(timer); };
  }, [plain]);

  const toggle = () => {
    const next = !plain;
    setPlain(next);
    try { localStorage.setItem(PLAIN_KEY, String(next)); } catch { /* not remembered */ }
  };

  let budget = shown;
  const done = shown >= TOTAL;
  const paragraphs = (
    <div className="space-y-4">
      {aboutParagraphs.map((p, i) => <p key={i} className="text-sm leading-relaxed text-warm-600">{p}</p>)}
    </div>
  );
  // The dialogue box is for laptop widths; phones always get the plain paragraphs (and no flag)
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
          <div ref={box} className="pmd-box" tabIndex={0}
            onClick={() => setShown(TOTAL)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setShown(TOTAL); } }}>
            {aboutParagraphs.map((p, i) => {
              const typed = p.slice(0, Math.max(0, budget)); budget -= p.length;
              return <p key={i}>{typed}<span className="pmd-untyped">{p.slice(typed.length)}</span></p>;
            })}
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
