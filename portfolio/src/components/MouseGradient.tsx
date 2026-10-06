"use client";

import { useEffect, useRef } from "react";

export default function MouseGradient() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame = 0, x = 0, y = 0;
    const handleMouseMove = (e: MouseEvent) => {
      x = e.clientX; y = e.clientY;
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0;
        el.style.transform = `translate3d(${x - 600}px, ${y - 600}px, 0)`;
        el.style.opacity = '1';
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener("mousemove", handleMouseMove); };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div ref={ref} style={{ position:'absolute', width:1200, height:1200, opacity:0,
        background:'radial-gradient(600px at center, rgba(132,169,140,0.07), transparent 80%)',
        willChange:'transform' }} />
    </div>
  );
}
