"use client";

import { useEffect, type RefObject } from "react";

/** A looping strip that drifts on its own and can be dragged, flicked or scrolled sideways.
 *  `track` holds two identical copies of the content; the first copy's width is one loop.
 *  - Drift pauses under the pointer, while focused, off screen and in hidden tabs.
 *  - A drag (mouse, pen or touch) moves the strip and glides on release; it never opens a link.
 *  - Horizontal wheel/trackpad scrolling moves it; vertical scrolling stays with the page.
 *  - Keyboard focus brings the focused item into view.
 *  - Under reduced motion there is no drift: the frame is a normal scroller that a mouse can also drag. */
export function useDragMarquee(frame: RefObject<HTMLElement | null>, track: RefObject<HTMLElement | null>, secondsPerLoop: number) {
  useEffect(() => {
    const root = frame.current, strip = track.current;
    if (!root || !strip) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let loop = 0, offset = 0, velocity = 0, raf = 0, last = 0;
    let hovering = false, focused = false, visible = false, resumeAt = 0;
    let drag: { id: number; x: number; start: number; moved: boolean; t: number; lastX: number } | null = null;

    const measure = () => { loop = (strip.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0; };
    const wrap = (value: number) => (loop ? ((value % loop) + loop) % loop : 0);
    const paint = () => { strip.style.transform = motion.matches ? "" : `translate3d(${-offset}px,0,0)`; };
    const drifting = () => !motion.matches && !hovering && !focused && !drag && !document.hidden && visible;

    function frameStep(now: number) {
      raf = 0;
      const dt = last ? Math.min(64, now - last) : 0;
      last = now;
      if (Math.abs(velocity) > 0.02 && !drag) {
        // A flick glides, losing about 5% of its speed every 16ms.
        offset = wrap(offset + velocity * dt);
        velocity *= Math.pow(0.95, dt / 16);
      } else if (drifting() && now >= resumeAt && loop) {
        velocity = 0;
        offset = wrap(offset + (loop / (secondsPerLoop * 1000)) * dt);
      }
      paint();
      if (!motion.matches && visible && !document.hidden && (drifting() || Math.abs(velocity) > 0.02)) raf = requestAnimationFrame(frameStep);
      else last = 0;
    }
    const wake = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frameStep); } };

    function down(event: PointerEvent) {
      if (event.button !== 0) return;
      // Touch already scrolls a reduced-motion row natively.
      if (motion.matches && event.pointerType === "touch") return;
      drag = { id: event.pointerId, x: event.clientX, start: motion.matches ? root!.scrollLeft : offset, moved: false, t: event.timeStamp, lastX: event.clientX };
      velocity = 0;
    }
    function move(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      if (!drag.moved) {
        if (Math.abs(dx) < 5) return;
        drag.moved = true;
        root!.setPointerCapture(event.pointerId);
        root!.classList.add("is-dragging");
      }
      if (motion.matches) root!.scrollLeft = drag.start - dx;
      else {
        offset = wrap(drag.start - dx);
        const dt = Math.max(1, event.timeStamp - drag.t);
        velocity = 0.8 * velocity + 0.2 * (-(event.clientX - drag.lastX) / dt);
        paint();
      }
      drag.t = event.timeStamp; drag.lastX = event.clientX;
    }
    function up(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.id) return;
      const moved = drag.moved;
      drag = null;
      root!.classList.remove("is-dragging");
      if (root!.hasPointerCapture(event.pointerId)) root!.releasePointerCapture(event.pointerId);
      if (moved) {
        // The click that ends a drag must not open the card under the pointer.
        root!.addEventListener("click", block, { capture: true, once: true });
        setTimeout(() => root!.removeEventListener("click", block, { capture: true }), 0);
        if (event.type === "pointercancel") velocity = 0;
        resumeAt = performance.now() + 1200;
      } else velocity = 0;
      wake();
    }
    const block = (event: Event) => { event.preventDefault(); event.stopPropagation(); };
    function wheel(event: WheelEvent) {
      if (motion.matches || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      velocity = 0;
      offset = wrap(offset + event.deltaX);
      resumeAt = performance.now() + 1200;
      paint(); wake();
    }
    function focusIn(event: FocusEvent) {
      focused = true;
      const item = (event.target as HTMLElement).closest("li");
      if (!item || motion.matches) return;
      // Bring the focused card fully inside the frame.
      const box = root!.getBoundingClientRect(), card = item.getBoundingClientRect(), margin = 24;
      if (card.left < box.left + margin) offset = wrap(offset - (box.left + margin - card.left));
      else if (card.right > box.right - margin) offset = wrap(offset + (card.right - (box.right - margin)));
      velocity = 0; paint();
    }
    const focusOut = (event: FocusEvent) => { if (!root.contains(event.relatedTarget as Node)) { focused = false; wake(); } };
    const enter = (event: PointerEvent) => { if (event.pointerType === "mouse") hovering = true; };
    const leave = () => { hovering = false; wake(); };
    const motionChange = () => { offset = 0; velocity = 0; paint(); wake(); };
    const visibility = () => wake();

    measure(); paint();
    const resize = new ResizeObserver(() => { measure(); offset = wrap(offset); paint(); });
    resize.observe(strip);
    const seen = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake(); });
    seen.observe(root);
    root.addEventListener("pointerdown", down);
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerup", up);
    root.addEventListener("pointercancel", up);
    root.addEventListener("pointerenter", enter);
    root.addEventListener("pointerleave", leave);
    root.addEventListener("wheel", wheel, { passive: false });
    root.addEventListener("focusin", focusIn);
    root.addEventListener("focusout", focusOut);
    motion.addEventListener("change", motionChange);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect(); seen.disconnect();
      root.removeEventListener("pointerdown", down);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerup", up);
      root.removeEventListener("pointercancel", up);
      root.removeEventListener("pointerenter", enter);
      root.removeEventListener("pointerleave", leave);
      root.removeEventListener("wheel", wheel);
      root.removeEventListener("focusin", focusIn);
      root.removeEventListener("focusout", focusOut);
      motion.removeEventListener("change", motionChange);
      document.removeEventListener("visibilitychange", visibility);
      strip.style.transform = "";
    };
  }, [frame, track, secondsPerLoop]);
}
