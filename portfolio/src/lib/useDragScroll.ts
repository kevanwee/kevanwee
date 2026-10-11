"use client";

import { useEffect, type RefObject } from "react";

/** Mouse/pen drag for a native horizontal scroller (touch and trackpads already scroll it natively).
 *  A flick glides with friction; the click that ends a drag never reaches the item under the pointer.
 *  Under reduced motion there is no glide. Keys, wheel input or a "dragscroll:stop" event on the frame end a glide,
 *  so programmatic scrolling (centring a selection) is never overridden. */
export function useDragScroll(frame: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = frame.current;
    if (!root) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let drag: { id: number; x: number; start: number; moved: boolean; t: number; lastX: number } | null = null;
    let velocity = 0, raf = 0, last = 0;

    function glide(now: number) {
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      root!.scrollLeft += velocity * dt;
      velocity *= Math.pow(0.94, dt / 16);
      raf = Math.abs(velocity) > 0.02 ? requestAnimationFrame(glide) : 0;
    }
    const stop = () => { cancelAnimationFrame(raf); raf = 0; velocity = 0; };
    function down(event: PointerEvent) {
      if (event.button !== 0 || event.pointerType === "touch") return;
      stop();
      drag = { id: event.pointerId, x: event.clientX, start: root!.scrollLeft, moved: false, t: event.timeStamp, lastX: event.clientX };
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
      root!.scrollLeft = drag.start - dx;
      const dt = Math.max(1, event.timeStamp - drag.t);
      velocity = 0.8 * velocity + 0.2 * (-(event.clientX - drag.lastX) / dt);
      drag.t = event.timeStamp; drag.lastX = event.clientX;
    }
    const block = (event: Event) => { event.preventDefault(); event.stopPropagation(); };
    function up(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.id) return;
      const moved = drag.moved;
      drag = null;
      root!.classList.remove("is-dragging");
      if (root!.hasPointerCapture(event.pointerId)) root!.releasePointerCapture(event.pointerId);
      if (!moved) return;
      // The click that ends a drag must not select the item under the pointer.
      root!.addEventListener("click", block, { capture: true, once: true });
      setTimeout(() => root!.removeEventListener("click", block, { capture: true }), 0);
      if (event.type === "pointercancel" || motion.matches) velocity = 0;
      else if (Math.abs(velocity) > 0.02) { last = 0; raf = requestAnimationFrame(glide); }
    }
    root.addEventListener("pointerdown", down);
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerup", up);
    root.addEventListener("pointercancel", up);
    root.addEventListener("wheel", stop, { passive: true });
    root.addEventListener("keydown", stop);
    root.addEventListener("dragscroll:stop", stop);
    return () => {
      stop();
      root.removeEventListener("pointerdown", down);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerup", up);
      root.removeEventListener("pointercancel", up);
      root.removeEventListener("wheel", stop);
      root.removeEventListener("keydown", stop);
      root.removeEventListener("dragscroll:stop", stop);
    };
  }, [frame]);
}
