/** The visitor's reduced-motion preference, with live change events (used by the cursor's forms). */
export function motionPreference() {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  return {
    get matches() { return media.matches; },
    addEventListener(_type: string, listener: () => void) { media.addEventListener("change", listener); },
    removeEventListener(_type: string, listener: () => void) { media.removeEventListener("change", listener); },
  };
}
