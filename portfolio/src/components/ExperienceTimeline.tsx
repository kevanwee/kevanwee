"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { Experience } from "@/data";
import { useDragScroll } from "@/lib/useDragScroll";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Months since year 0: "May 2025" → 24304. */
const monthOf = (text: string) => { const [m, y] = text.trim().split(" "); return Number(y) * 12 + Math.max(0, MONTHS.indexOf(m)); };
const thisMonth = () => { const d = new Date(); return d.getFullYear() * 12 + d.getMonth(); };
/** "6 mos", "1 yr", "2 yrs 4 mos": inclusive of both end months. */
function duration(months: number) {
  const y = Math.floor(months / 12), m = months % 12;
  const part = (n: number, one: string, many: string) => (n ? `${n} ${n === 1 ? one : many}` : "");
  return [part(y, "yr", "yrs"), part(m, "mo", "mos")].filter(Boolean).join(" ");
}

/** The timeline's grey mark for a logo (built by scripts/build-timeline-logos.mjs). */
const mark = (logo: string) => logo.replace("/logos/", "/logos/timeline/").replace(/\.\w+$/, ".png");
/** Logos that already spell the name: the mark stands alone (the name stays for screen readers). */
const WORDMARKS = new Set(["/logos/pwc.jpg"]);

const PX_PER_MONTH = 22, LANE = 50, PAD = 32, GAP = 12;

interface Props {
  experiences: Experience[];
  activeId: string;
  label: (exp: Experience) => string;
  onSelect: (id: string) => void;
}

/** A second way through Experience: every role as a bar along a time axis, stacked into lanes where they overlap.
 *  Bar length is the role's duration. It shares the selection with the tabs: choosing either updates the other and
 *  the panel, and the chosen bar is centred. */
export default function ExperienceTimeline({ experiences, activeId, label, onSelect }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useDragScroll(frame);
  // "Present" ends at the visitor's current month. The static render uses the latest month in the data,
  // so server and client agree until the page has mounted.
  const latest = Math.max(...experiences.flatMap((e) => e.period.split("–").map((p) => (/present/i.test(p) ? 0 : monthOf(p)))));
  const [now, setNow] = useState(latest);
  useEffect(() => setNow(Math.max(latest, thisMonth())), [latest]);

  const roles = experiences.map((exp) => {
    const [from, to] = exp.period.split("–");
    const start = monthOf(from), end = /present/i.test(to ?? "") ? now : monthOf(to ?? from);
    const months = Math.max(1, end - start + 1), name = label(exp), wordmark = !!exp.logo && WORDMARKS.has(exp.logo);
    // The label may be wider than a short bar; lanes are packed by whichever is wider, so labels never collide.
    const labelWidth = (exp.logo ? 30 : 26) + (wordmark ? 0 : name.length * 7.4) + duration(months).length * 6.2 + 14;
    return { exp, start, end, months, name, wordmark, width: months * PX_PER_MONTH, span: Math.max(months * PX_PER_MONTH, labelWidth) };
  }).sort((a, b) => a.start - b.start || b.months - a.months);
  const origin = Math.floor(Math.min(...roles.map((r) => r.start)) / 12) * 12;
  const x = (month: number) => PAD + (month - origin) * PX_PER_MONTH;
  const laneEnds: number[] = [];
  const placed = roles.map((role) => {
    const left = x(role.start);
    let lane = laneEnds.findIndex((end) => end + GAP <= left);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = left + role.span;
    return { ...role, left, lane };
  });
  const lanes = laneEnds.length, width = x(now + 1) + PAD + 40;
  const years = Array.from({ length: Math.floor(now / 12) - origin / 12 + 1 }, (_, i) => origin / 12 + i);

  // Keep the selected bar centred, whichever control chose it (instantly on first paint and when the width changes).
  useEffect(() => {
    const root = frame.current;
    if (!root) return;
    const centre = (smooth: boolean) => {
      const bar = root.querySelector<HTMLElement>(`[data-timeline-id="${CSS.escape(activeId)}"]`);
      if (!bar) return;
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      root.dispatchEvent(new Event("dragscroll:stop"));
      root.scrollTo({ left: bar.offsetLeft - (root.clientWidth - bar.offsetWidth) / 2, behavior: smooth && !reduced ? "smooth" : "auto" });
    };
    centre(!first.current);
    first.current = false;
    let size = root.clientWidth;
    const resize = new ResizeObserver(() => { if (root.clientWidth !== size) { size = root.clientWidth; centre(false); } });
    resize.observe(root);
    return () => resize.disconnect();
  }, [activeId, now]);

  function keys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const i = placed.findIndex((r) => r.exp.id === activeId);
    const next = event.key === "Home" ? 0 : event.key === "End" ? placed.length - 1 : Math.min(placed.length - 1, Math.max(0, i + (event.key === "ArrowLeft" ? -1 : 1)));
    onSelect(placed[next].exp.id);
    frame.current?.querySelector<HTMLElement>(`[data-timeline-id="${CSS.escape(placed[next].exp.id)}"]`)?.focus({ preventScroll: true });
  }

  return (
    <div ref={frame} className="experience-timeline" role="group" aria-label="Experience timeline, oldest to newest. Drag or use the arrow keys." onKeyDown={keys}>
      <div className="experience-timeline-canvas" style={{ width, height: 30 + lanes * LANE + 8 } as CSSProperties}>
        {years.map((year) => (
          <span key={year} className="experience-timeline-year" style={{ left: x(year * 12) }} aria-hidden="true">{year}</span>
        ))}
        <span className="experience-timeline-now" style={{ left: x(now + 1) }} aria-hidden="true">Now</span>
        <ol>
          {placed.map(({ exp, left, lane, width: barWidth, months, name, wordmark, start }) => {
            const active = exp.id === activeId;
            return (
              <li key={exp.id}>
                <button
                  type="button"
                  data-timeline-id={exp.id}
                  data-start={start}
                  aria-pressed={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => onSelect(exp.id)}
                  className="experience-timeline-stop"
                  style={{ left, top: 30 + lane * LANE, width: barWidth }}
                  title={`${exp.company} · ${exp.period} · ${duration(months)}`}
                >
                  <span className="experience-timeline-name">
                    {exp.logo
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={mark(exp.logo)} alt="" aria-hidden="true" draggable={false} />
                      : <span className="experience-timeline-blank" aria-hidden="true">?</span>}
                    {wordmark ? <span className="sr-only">{name}</span> : name}
                    <span className="experience-timeline-duration">{duration(months)}</span>
                  </span>
                  <span className="experience-timeline-bar" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
