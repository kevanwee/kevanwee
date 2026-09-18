"use client";

import { useSyncExternalStore } from "react";

// Map-only preferences: never alter the portfolio's cursor, layout or animation CSS.
const initial = { paused: true, modalCount: 0, portfolioDialogOpen: false };
let state = initial;
const listeners = new Set<() => void>();
let disconnect: (() => void) | undefined;
function publish(patch: Partial<typeof state>) {
  state = { ...state, ...patch }; listeners.forEach(notify => notify());
}
function subscribe(notify: () => void) {
  listeners.add(notify);
  if (listeners.size === 1) {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let saved = false;
    try { saved = localStorage.getItem("pokemon-world-motion-v1") === "paused"; } catch { /* Optional. */ }
    publish({ paused: media.matches || saved });
    const update = () => { if (media.matches) publish({ paused: true }); };
    media.addEventListener("change", update);
    const covered = () => {
      const portfolioDialogOpen = !!document.querySelector('[role="dialog"]');
      if (portfolioDialogOpen !== state.portfolioDialogOpen) publish({ portfolioDialogOpen });
    };
    const observer = new MutationObserver(covered);
    observer.observe(document.body, { childList: true, subtree: true }); covered();
    disconnect = () => { media.removeEventListener("change", update); observer.disconnect(); };
  }
  return () => { listeners.delete(notify); if (!listeners.size) disconnect?.(); };
}
const setPaused = (paused: boolean) => {
  publish({ paused });
  try { localStorage.setItem("pokemon-world-motion-v1", paused ? "paused" : "playing"); } catch { /* Optional. */ }
};
const setModalCount = (update: (count: number) => number) => publish({ modalCount: update(state.modalCount) });
export function useWorldPreferences() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => initial);
  return { ...snapshot, setPaused, setModalCount };
}
