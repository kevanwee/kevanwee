"use client";

import { useEffect } from "react";
import Lenis from "lenis";

const MODAL = 'dialog[open], [role="dialog"][aria-modal="true"]';

/** Smooth (eased) wheel scrolling for the page, via Lenis (ported from Voracity's useSmoothScroll). Off under
 *  reduced motion; touch scrolling is always native. The window still does the scrolling, so anchors, the nav's
 *  scrollIntoView and scroll listeners behave as before.
 *  - A wheel event something else already handled (Diancie's dialogue box reading back its lines) is left alone.
 *  - Inner scroll areas and modals scroll natively; nothing is smoothed while a dialog is open.
 *  - Lenis's stylesheet is not used: it disables pointer events on every iframe while smoothing. */
export default function SmoothScroll() {
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;
    const sync = () => {
      if (motion.matches) { lenis?.destroy(); lenis = null; return; }
      if (lenis) return;
      lenis = new Lenis({
        autoRaf: true,
        lerp: 0.12,
        smoothWheel: true,
        syncTouch: false,
        allowNestedScroll: true,
        prevent: node => !!node.closest(`${MODAL}, [data-lenis-prevent]`),
        virtualScroll: ({ event }) => !event.defaultPrevented && !document.querySelector(MODAL),
      });
    };
    sync();
    motion.addEventListener("change", sync);
    return () => { motion.removeEventListener("change", sync); lenis?.destroy(); lenis = null; };
  }, []);
  return null;
}
