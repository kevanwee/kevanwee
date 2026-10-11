"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import type { Experience } from "@/data";
import { useDragScroll } from "@/lib/useDragScroll";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "May 2025 – Aug 2025" → months since year 0 of the start, for ordering. */
function startOf(period: string) {
  const [month, year] = period.split("–")[0].trim().split(" ");
  return Number(year) * 12 + Math.max(0, MONTHS.indexOf(month));
}

/** The timeline's grey mark for a logo (built by scripts/build-timeline-logos.mjs). */
const mark = (logo: string) => logo.replace("/logos/", "/logos/timeline/").replace(/\.\w+$/, ".png");
/** Logos that already spell the name: the mark stands alone (the name stays for screen readers). */
const WORDMARKS = new Set(["/logos/pwc.jpg"]);

interface Props {
  experiences: Experience[];
  activeId: string;
  label: (exp: Experience) => string;
  onSelect: (id: string) => void;
}

/** A second way through Experience: every role along a draggable line, oldest to newest, with greyed logos.
 *  It shares the selection with the tabs: choosing either updates the other and the panel. */
export default function ExperienceTimeline({ experiences, activeId, label, onSelect }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useDragScroll(frame);
  const ordered = [...experiences].sort((a, b) => startOf(a.period) - startOf(b.period));

  // Keep the selected stop centred, whichever control chose it (instantly on first paint and when the width changes).
  useEffect(() => {
    const root = frame.current;
    if (!root) return;
    const centre = (smooth: boolean) => {
      const stop = root.querySelector<HTMLElement>(`[data-timeline-id="${CSS.escape(activeId)}"]`);
      if (!stop) return;
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      root.dispatchEvent(new Event("dragscroll:stop"));
      root.scrollTo({ left: stop.offsetLeft - (root.clientWidth - stop.offsetWidth) / 2, behavior: smooth && !reduced ? "smooth" : "auto" });
    };
    centre(!first.current);
    first.current = false;
    let width = root.clientWidth;
    const resize = new ResizeObserver(() => { if (root.clientWidth !== width) { width = root.clientWidth; centre(false); } });
    resize.observe(root);
    return () => resize.disconnect();
  }, [activeId]);

  function keys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const i = ordered.findIndex((e) => e.id === activeId);
    const next = event.key === "Home" ? 0 : event.key === "End" ? ordered.length - 1 : Math.min(ordered.length - 1, Math.max(0, i + (event.key === "ArrowLeft" ? -1 : 1)));
    onSelect(ordered[next].id);
    frame.current?.querySelector<HTMLElement>(`[data-timeline-id="${CSS.escape(ordered[next].id)}"]`)?.focus({ preventScroll: true });
  }

  return (
    <div ref={frame} className="experience-timeline" role="group" aria-label="Experience timeline, oldest to newest. Drag or use the arrow keys." onKeyDown={keys}>
      <ol className="experience-timeline-track">
        {ordered.map((exp) => {
          const active = exp.id === activeId;
          return (
            <li key={exp.id}>
              <button
                type="button"
                data-timeline-id={exp.id}
                aria-pressed={active}
                tabIndex={active ? 0 : -1}
                onClick={() => onSelect(exp.id)}
                className="experience-timeline-stop"
                title={`${exp.company} · ${exp.period}`}
              >
                <span className="experience-timeline-name">
                  {exp.logo
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={mark(exp.logo)} alt="" aria-hidden="true" draggable={false} />
                    : <span className="experience-timeline-blank" aria-hidden="true">?</span>}
                  {exp.logo && WORDMARKS.has(exp.logo) ? <span className="sr-only">{label(exp)}</span> : label(exp)}
                </span>
                <span className="experience-timeline-dot" aria-hidden="true" />
                <span className="experience-timeline-date">{exp.period.split("–")[0].trim()}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
