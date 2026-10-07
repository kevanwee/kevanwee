"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { TerminalSession, titleFor } from "@/components/Terminal";

type State = "closed" | "open" | "minimised";
type Box = { x: number; y: number; w: number; h: number };

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const phone = () => matchMedia("(max-width: 639px)").matches;
const MARGIN = 16;

/** Where a new window opens: beside the button when at least 560px fit there (so the button stays free to
 *  minimise it), otherwise centred; as large as fits up to 820 x 580. */
function initialBox(from?: DOMRect): Box {
  const h = Math.min(580, innerHeight - MARGIN * 3), y = Math.max(MARGIN, Math.round((innerHeight - h) / 2));
  const left = from ? from.right + 24 : 0, room = innerWidth - left - MARGIN;
  if (from && room >= 560) return { x: Math.round(left), y, w: Math.min(820, room), h };
  const w = Math.min(820, innerWidth - MARGIN * 2);
  return { x: Math.round((innerWidth - w) / 2), y, w, h };
}

/** Keeps the title bar and its buttons reachable: the left edge (where close, minimise and maximise sit) never
 *  leaves the screen, at least 160px of the bar stays in view on the right, and it never goes above or below. */
function clamp(box: Box): Box {
  return { ...box, x: Math.min(Math.max(box.x, 0), innerWidth - 160), y: Math.min(Math.max(box.y, 0), innerHeight - 44) };
}

/**
 * The ">_ SSH" button and its terminal window: a window over the page that can be dragged by its title bar,
 * maximised, minimised (it shrinks back into the button and keeps the session) and closed (the next open is a
 * fresh session). Clicking the button while the window is open minimises it, like a taskbar.
 */
export default function SshLauncher({ className }: { className: string }) {
  const [state, setState] = useState<State>("closed");
  const [session, setSession] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [max, setMax] = useState(false);
  const [cwd, setCwd] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const button = useRef<HTMLButtonElement>(null), win = useRef<HTMLElement>(null);
  const shown = useRef(false), drag = useRef<{ dx: number; dy: number } | null>(null), busy = useRef(false);
  useEffect(() => setMounted(true), []);

  // The window grows out of (or back into) the button. A short ease-in shrink that narrows before it drops reads
  // as being pulled into the button.
  const genie = useCallback((into: boolean) => {
    const w = win.current, b = button.current;
    if (!w || !b || reduced()) return Promise.resolve();
    const from = w.getBoundingClientRect(), to = b.getBoundingClientRect();
    const dx = to.left - from.left, dy = to.top - from.top, sx = to.width / from.width, sy = to.height / from.height;
    const frames: Keyframe[] = [
      { transform: "none", opacity: 1, borderRadius: "10px" },
      { transform: `translate(${dx * .35}px, ${dy * .6}px) scale(${Math.max(sx, .45)}, .7)`, opacity: .9, borderRadius: "14px", offset: .55 },
      { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: .15, borderRadius: "999px" },
    ];
    return w.animate(into ? frames : [...frames].reverse().map((f, i) => ({ ...f, offset: [0, .45, 1][i] })), {
      duration: into ? 340 : 300, easing: into ? "cubic-bezier(.55,0,.85,.45)" : "cubic-bezier(.15,.55,.35,1)",
    }).finished.then(() => undefined, () => undefined);
  }, []);

  // Open and restore animate out of the button once the window is laid out
  useLayoutEffect(() => {
    if (state === "open" && !shown.current) {
      shown.current = true;
      void genie(false);
    }
  }, [state, genie]);

  const open = useCallback(() => {
    if (busy.current) return;
    if (state === "closed") { setBox(initialBox(button.current?.getBoundingClientRect())); setMax(false); }
    shown.current = false;
    setState("open");
  }, [state]);

  const minimise = useCallback(async () => {
    if (busy.current || state !== "open") return;
    busy.current = true;
    await genie(true);
    busy.current = false;
    setState("minimised");
    button.current?.focus();
  }, [genie, state]);

  const close = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    if (win.current && !reduced()) await win.current.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.97)" }],
      { duration: 140, easing: "ease-in" }).finished.catch(() => undefined);
    busy.current = false;
    setState("closed");
    setSession(n => n + 1);
    button.current?.focus();
  }, []);

  // Escape inside the window minimises it
  useEffect(() => {
    if (state !== "open") return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && win.current?.contains(document.activeElement)) void minimise(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [state, minimise]);

  // Keep it on screen when the viewport shrinks
  useEffect(() => {
    if (state === "closed") return;
    const fit = () => setBox(b => b && clamp({ ...b, w: Math.min(b.w, innerWidth - MARGIN * 2), h: Math.min(b.h, innerHeight - MARGIN * 2) }));
    addEventListener("resize", fit);
    return () => removeEventListener("resize", fit);
  }, [state]);

  function startDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (max || phone() || !box || (e.target as HTMLElement).closest("button") || e.button !== 0) return;
    drag.current = { dx: e.clientX - box.x, dy: e.clientY - box.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function moveDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current || !box) return;
    setBox(clamp({ ...box, x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy }));
  }
  const endDrag = () => { drag.current = null; };

  const style = box && !max ? { left: box.x, top: box.y, width: box.w, height: box.h } : undefined;

  return <>
    {/* Yveltal's cocoon docks on this button, so the browser keeps him on it. */}
    <span className="relative inline-flex" data-yveltal-nest>
      <button
        ref={button}
        type="button"
        data-yveltal-perch
        data-ssh-launcher
        onClick={() => (state === "open" ? void minimise() : open())}
        className={className}
        aria-label={state === "open" ? "Minimise the SSH terminal" : "Open the SSH terminal"}
        aria-expanded={state === "open"}
        title="Browse this portfolio in a terminal"
      >
        <span className="font-mono text-[12px] leading-none tracking-normal" aria-hidden="true">&gt;_</span>
        SSH
        {state === "minimised" && <span className="ssh-running" aria-hidden="true" />}
      </button>
    </span>
    {mounted && state !== "closed" && createPortal(
      <section
        ref={win}
        className={`term-window term-floating${max ? " term-max" : ""}`}
        style={style}
        role="dialog"
        aria-modal="false"
        aria-labelledby="ssh-title"
        hidden={state === "minimised"}
      >
        <div className="term-bar" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}
          onDoubleClick={e => { if (!(e.target as HTMLElement).closest("button")) setMax(m => !m); }}>
          <span className="term-dots">
            <button type="button" className="term-dot term-close" aria-label="Close" onClick={() => void close()} />
            <button type="button" className="term-dot term-min" aria-label="Minimise" onClick={() => void minimise()} />
            <button type="button" className="term-dot term-max-btn" aria-label={max ? "Restore size" : "Maximise"} onClick={() => setMax(m => !m)} />
          </span>
          <span id="ssh-title" className="term-title">{titleFor(cwd)}</span>
        </div>
        <TerminalSession key={session} onExit={() => void close()} onCwd={setCwd} active={state === "open"} />
      </section>,
      document.body,
    )}
  </>;
}
