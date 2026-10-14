"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { legalQuantsProfile, mediaAppearances, type MediaAppearance } from "@/data";
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

/** Portalled outside the strip's clipping mask. Geometry updates only on layout/scroll changes. */
function MediaPreview({ item, anchor, id, onEnter, onLeave, onDismiss }: {
  item: MediaAppearance; anchor: HTMLElement; id: string;
  onEnter: () => void; onLeave: () => void; onDismiss: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    let raf = 0;
    const place = () => {
      raf = 0;
      const el = panel.current;
      if (!el || !anchor.isConnected) { onDismiss(); return; }
      const card = anchor.getBoundingClientRect(), gap = 12, edge = 16, clearance = 72;
      if (card.bottom <= clearance || card.top >= innerHeight || card.right <= 0 || card.left >= innerWidth) { onDismiss(); return; }
      const above = Math.max(0, card.top - gap - clearance), under = Math.max(0, innerHeight - edge - card.bottom - gap);
      el.dataset.compact = String(Math.max(above, under) < 280);
      el.style.maxHeight = `${Math.max(above, under)}px`;
      const h = el.offsetHeight;
      const below = h > above && (h <= under || under > above);
      const left = Math.max(edge, Math.min(card.left + card.width / 2 - el.offsetWidth / 2, innerWidth - edge - el.offsetWidth));
      el.style.left = `${left}px`;
      el.style.top = `${below ? card.bottom + gap : card.top - gap - h}px`;
      el.style.setProperty('--origin-x', `${card.left + card.width / 2 - left}px`);
      el.dataset.side = below ? 'bottom' : 'top';
      el.style.visibility = 'visible';
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(place); };
    const observer = new ResizeObserver(schedule);
    observer.observe(panel.current!); observer.observe(anchor); observer.observe(document.documentElement);
    const previousDescription = anchor.getAttribute('aria-describedby');
    anchor.setAttribute('aria-describedby', id);
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    place();
    return () => {
      cancelAnimationFrame(raf); observer.disconnect();
      window.removeEventListener('scroll', schedule, true); window.removeEventListener('resize', schedule);
      if (previousDescription) anchor.setAttribute('aria-describedby', previousDescription); else anchor.removeAttribute('aria-describedby');
    };
  }, [anchor, id, onDismiss]);
  return <div ref={panel} id={id} role="tooltip" className={`media-preview${item.image ? ' has-image' : ''}${item.type === 'Profile' ? ' is-profile' : ''}`} data-side="top"
    data-lenis-prevent onPointerEnter={onEnter} onPointerLeave={onLeave}>
    {item.image && <div className="media-preview-figure"><img src={item.image.src} alt={item.image.alt} decoding="async"
      style={{ objectPosition: item.image.position ?? 'center', objectFit: item.image.fit ?? 'cover' }} /></div>}
    <div className="media-preview-body">
      <p className="media-preview-source">
        <span className="media-preview-brand">{item.logo && <img src={item.logo.src} alt={item.logo.alt} width={20} height={20} />}{item.outlet}</span>
        <span>{item.type}{item.date && ` · ${item.date}`}</span>
      </p>
      <p className="media-preview-title font-serif">{item.title}</p>
      {item.description && <p className="media-preview-excerpt">{item.description}</p>}
      <p className="media-preview-footer"><span>{host(item.url)}</span><ExternalIcon className="h-3 w-3" /></p>
    </div>
  </div>;
}

export default function MediaAppearances() {
  const frame = useRef<HTMLDivElement>(null), track = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<{ index: number; anchor: HTMLElement } | null>(null);
  useDragMarquee(frame, track, mediaAppearances.length * 9, !!preview);
  const previewId = useId();
  const openTimer = useRef(0), closeTimer = useRef(0), closedAt = useRef(0), inPreview = useRef(false);
  const current = useRef(preview); current.current = preview;
  const hide = useCallback(() => {
    clearTimeout(openTimer.current); clearTimeout(closeTimer.current);
    if (current.current) closedAt.current = performance.now();
    inPreview.current = false; setPreview(null);
  }, []);
  const leave = useCallback(() => {
    clearTimeout(openTimer.current); clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(hide, 180);
  }, [hide]);
  const show = (index: number, anchor: HTMLElement, delay?: number) => {
    clearTimeout(openTimer.current); clearTimeout(closeTimer.current);
    inPreview.current = false;
    const wait = delay ?? (current.current || performance.now() - closedAt.current < 400 ? 60 : 240);
    openTimer.current = window.setTimeout(() => setPreview({ index, anchor }), wait);
  };
  const hold = () => { inPreview.current = true; clearTimeout(closeTimer.current); };
  const leavePanel = () => { inPreview.current = false; leave(); };
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') hide(); };
    const visibility = () => { if (document.hidden) hide(); };
    document.addEventListener('keydown', escape); document.addEventListener('visibilitychange', visibility);
    return () => {
      clearTimeout(openTimer.current); clearTimeout(closeTimer.current);
      document.removeEventListener('keydown', escape); document.removeEventListener('visibilitychange', visibility);
    };
  }, [hide]);

  if (mediaAppearances.length === 0) return null;
  const active = preview && (preview.index === mediaAppearances.length ? legalQuantsProfile : mediaAppearances[preview.index]);

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
                      onPointerEnter={(event) => {
                        if (event.pointerType === "touch" || frame.current?.classList.contains("is-dragging")) return;
                        show(i, event.currentTarget);
                      }}
                      onPointerLeave={leave}
                      onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) show(i, event.currentTarget, 0); }}
                      onBlur={() => { if (!inPreview.current) leave(); }}
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
            href={legalQuantsProfile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-warm-600 transition-colors"
            onPointerEnter={(event) => { if (event.pointerType !== "touch") show(mediaAppearances.length, event.currentTarget); }}
            onPointerLeave={leave}
            onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) show(mediaAppearances.length, event.currentTarget, 0); }}
            onBlur={() => { if (!inPreview.current) leave(); }}
            onPointerDown={hide}
          >
            LegalQuants
          </a>
          .
        </p>
      </div>

      {active && createPortal(<MediaPreview key={preview.index} id={previewId} item={active} anchor={preview.anchor} onEnter={hold} onLeave={leavePanel} onDismiss={hide} />, document.body)}
    </section>
  );
}
