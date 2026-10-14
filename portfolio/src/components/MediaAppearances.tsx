"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { mediaAppearances, type MediaAppearance } from "@/data";
import { useDragMarquee } from "@/lib/useDragMarquee";

const ExternalIcon = ({ className }: { className: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const host = (url: string) => new URL(url).hostname.replace(/^www\./, "");

/** A glass preview of the hovered (or keyboard-focused) card, portalled out of the marquee so its mask and overflow
 *  don't clip it. It sits above the card, or below when the nav would cover it, and follows the card every frame so
 *  page scrolls and sideways wheels never leave it behind. Purely visual: the card itself stays the link. */
function MediaPreview({ item, anchor }: { item: MediaAppearance; anchor: HTMLElement }) {
  const panel = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let raf = 0;
    const place = () => {
      const el = panel.current;
      if (el && anchor.isConnected) {
        const card = anchor.getBoundingClientRect(), gap = 12, edge = 16, navClearance = 72, h = el.offsetHeight;
        const above = card.top - gap - navClearance, under = innerHeight - edge - card.bottom - gap;
        // Above when it fits, else below when that fits, else the roomier side, kept on screen.
        const below = h > above && (h <= under || under > above);
        const top = below ? card.bottom + gap : card.top - gap - h;
        const left = Math.min(Math.max(card.left + card.width / 2 - el.offsetWidth / 2, edge), innerWidth - edge - el.offsetWidth);
        el.style.left = `${left}px`;
        el.style.top = `${Math.min(Math.max(top, navClearance), innerHeight - edge - h)}px`;
        el.style.setProperty("--origin-x", `${card.left + card.width / 2 - left}px`);
        el.dataset.side = below ? "bottom" : "top";
      }
      raf = requestAnimationFrame(place);
    };
    place();
    return () => cancelAnimationFrame(raf);
  }, [anchor]);

  return (
    <div ref={panel} className={item.image ? "media-preview has-image" : "media-preview"} aria-hidden="true" data-side="top">
      {item.image && (
        <div className="media-preview-figure">
          <img src={item.image.src} alt={item.image.alt} decoding="async" style={{ objectPosition: item.image.position ?? "center" }} />
        </div>
      )}
      <div className="media-preview-body">
        <p className="media-preview-eyebrow">
          <span className="media-preview-chip">Preview</span>
          <span>{item.type}</span>
        </p>
        <p className="line-clamp-4 font-serif text-[17px] font-bold leading-snug text-warm-900">{item.title}</p>
        {item.description && <p className="media-preview-excerpt">{item.description}</p>}
        <p className="media-preview-footer">
          <span className="truncate">{item.outlet} · {item.date}</span>
          <span className="flex flex-shrink-0 items-center gap-1 text-sage-600">
            {host(item.url)}
            <ExternalIcon className="h-3 w-3" />
          </span>
        </p>
      </div>
    </div>
  );
}

export default function MediaAppearances() {
  const frame = useRef<HTMLDivElement>(null), track = useRef<HTMLDivElement>(null);
  useDragMarquee(frame, track, mediaAppearances.length * 9);

  const [preview, setPreview] = useState<{ index: number; anchor: HTMLElement } | null>(null);
  const openTimer = useRef(0), closedAt = useRef(0), warmed = useRef(false);

  // Hover intent: wait a beat before the first preview, then hand off quickly while moving card to card.
  const show = (index: number, anchor: HTMLElement, delay?: number) => {
    clearTimeout(openTimer.current);
    const wait = delay ?? (performance.now() - closedAt.current < 400 ? 60 : 260);
    openTimer.current = window.setTimeout(() => setPreview({ index, anchor }), wait);
  };
  const hide = () => {
    clearTimeout(openTimer.current);
    setPreview((open) => {
      if (open) closedAt.current = performance.now();
      return null;
    });
  };

  useEffect(() => () => clearTimeout(openTimer.current), []);
  useEffect(() => {
    if (!preview) return;
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") hide(); };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [preview]);

  // Fetch the preview images once the pointer first reaches the strip, so the first preview opens complete.
  const warm = () => {
    if (warmed.current) return;
    warmed.current = true;
    for (const item of mediaAppearances) if (item.image) new Image().src = item.image.src;
  };

  // The rim light follows the pointer across the glass.
  const tilt = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    const card = event.currentTarget, box = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${event.clientX - box.left}px`);
    card.style.setProperty("--my", `${event.clientY - box.top}px`);
  };

  if (mediaAppearances.length === 0) return null;
  const active = preview && mediaAppearances[preview.index];

  return (
    <section
      id="media"
      data-overworld-surface="media-divider"
      data-overworld-kind="divider"
      className="mb-24 scroll-mt-24 border-t border-cream-200 pt-24 lg:mb-36"
      aria-label="Media & Appearances"
    >
      <div>
        <h2 className="mb-12 font-serif text-3xl font-bold text-warm-900">
          Media & Appearances
        </h2>

        {/* A slow strip of articles: drag, flick or scroll sideways to move it; it pauses under the pointer or
            keyboard focus. Its frame stays put, so it keeps the media card's resident perch; under reduced
            motion it is a plain row you scroll (or drag). */}
        <div
          ref={frame}
          className="media-marquee"
          data-overworld-surface="media-card"
          data-overworld-kind="media-card"
          onPointerEnter={warm}
          onPointerDown={hide}
          onWheel={hide}
        >
          <div ref={track} className="media-marquee-track">
            {[false, true].map((copy) => (
              <ul key={String(copy)} className="media-marquee-list" aria-hidden={copy || undefined}>
                {mediaAppearances.map((item, i) => (
                  <li key={i}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={copy ? -1 : undefined}
                      draggable={false}
                      className="media-card group flex h-full w-[272px] flex-col justify-between gap-3 px-5 py-4"
                      style={item.image ? ({ "--media-wash": `url(${item.image.src})` } as CSSProperties) : undefined}
                      onPointerEnter={(event) => {
                        if (event.pointerType === "touch" || frame.current?.classList.contains("is-dragging")) return;
                        show(i, event.currentTarget);
                      }}
                      onPointerMove={tilt}
                      onPointerLeave={hide}
                      onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) show(i, event.currentTarget, 0); }}
                      onBlur={hide}
                    >
                      <p className="line-clamp-3 text-sm font-medium leading-snug text-warm-800 transition-colors group-hover:text-sage-700">
                        {item.title}
                      </p>
                      <p className="flex items-center justify-between gap-3 text-xs text-sage-600">
                        <span className="truncate">{item.outlet} · {item.date}</span>
                        <ExternalIcon className="h-3.5 w-3.5 flex-shrink-0 text-warm-400 transition-colors group-hover:text-sage-500" />
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        <p className="mt-4 text-xs text-warm-400">
          Also featured on{" "}
          <a
            href="https://www.legalquants.com/lawyers/kevan-wee"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-warm-600 transition-colors"
          >
            LegalQuants
          </a>
          .
        </p>
      </div>

      {active && createPortal(<MediaPreview key={preview.index} item={active} anchor={preview.anchor} />, document.body)}
    </section>
  );
}
