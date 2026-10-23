"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ProjectVideo } from "@/data";
import { usePreviewPlacement } from "@/lib/usePreviewPlacement";

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The muted launch video beside a hovered project card. The video loads only once the preview opens;
 *  under reduced motion the poster stands in for it. */
function Panel({ title, video, anchor, onDismiss }: { title: string; video: ProjectVideo; anchor: HTMLElement; onDismiss: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  usePreviewPlacement(panel, anchor, id, onDismiss);
  return <div ref={panel} id={id} role="tooltip" className="media-preview project-preview" data-side="top">
    <div className="project-preview-figure">
      {reducedMotion()
        ? <img src={video.poster} alt={`${title} launch video still`} decoding="async" />
        : <video src={video.src} poster={video.poster} autoPlay muted loop playsInline preload="auto" aria-label={`${title} launch video`} />}
    </div>
    <p className="project-preview-caption"><span>{title}</span><span>launch video · made with /brag</span></p>
  </div>;
}

/** Hover and keyboard-focus handlers for cards with a preview, plus the portalled panel to render. */
export function useProjectPreview() {
  const [open, setOpen] = useState<{ title: string; video: ProjectVideo; anchor: HTMLElement } | null>(null);
  const timer = useRef(0);
  const hide = useCallback(() => { clearTimeout(timer.current); setOpen(null); }, []);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") hide(); };
    document.addEventListener("keydown", escape);
    return () => { clearTimeout(timer.current); document.removeEventListener("keydown", escape); };
  }, [hide]);
  const bind = (title: string, video: ProjectVideo | undefined) => video ? {
    onPointerEnter: (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType === "touch") return;
      const anchor = event.currentTarget;
      clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setOpen({ title, video, anchor }), 240);
    },
    onPointerLeave: hide,
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      if ((event.target as HTMLElement).matches(":focus-visible")) setOpen({ title, video, anchor: event.currentTarget });
    },
    onBlur: (event: React.FocusEvent<HTMLElement>) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) hide(); },
    onPointerDown: hide,
  } : {};
  const panel = open && createPortal(<Panel key={open.title} {...open} onDismiss={hide} />, document.body);
  return { bind, panel };
}
