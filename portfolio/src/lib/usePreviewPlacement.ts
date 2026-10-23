import { useLayoutEffect, type RefObject } from "react";

/** Keeps a portalled hover preview beside its anchor card: above or below, whichever has room, clamped to the
 *  viewport. Geometry updates only on layout/scroll changes; the preview dismisses once its card leaves view. */
export function usePreviewPlacement(panel: RefObject<HTMLElement | null>, anchor: HTMLElement, id: string, onDismiss: () => void) {
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
  }, [panel, anchor, id, onDismiss]);
}
