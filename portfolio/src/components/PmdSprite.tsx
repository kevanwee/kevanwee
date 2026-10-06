"use client";

import { useEffect, useRef } from 'react';

const motionPreference = () => matchMedia('(prefers-reduced-motion: reduce)');

/** A PMD sheet's animation: frame size, rows (facings), per-frame durations in ticks, visible bounds per row. */
export interface PmdAnim { src: string; w: number; h: number; rows: number; durations: number[]; bounds: number[][] }

/** One PMD animation, cropped to its visible pixels and scaled so its larger side is `size` px.
 *  Steps through its frames at the game's timing; holds the first frame under reduced motion. */
export default function PmdSprite({ anim, size, row = 0, className }: { anim: PmdAnim; size: number; row?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [left, top, right, bottom] = anim.bounds[Math.min(row, anim.bounds.length - 1)] ?? anim.bounds[0];
  const scale = size / Math.max(right - left, bottom - top);
  const y = Math.min(row, anim.rows - 1) * anim.h;
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const motion = motionPreference();
    let frame = 0, timer: ReturnType<typeof setTimeout>;
    const draw = () => {
      clearTimeout(timer);
      node.style.backgroundPosition = `${-(frame * anim.w + left) * scale}px ${-(y + top) * scale}px`;
      if (!motion.matches && !document.hidden)
        timer = setTimeout(() => { frame = (frame + 1) % anim.durations.length; draw(); }, anim.durations[frame] * 16);
    };
    draw();
    document.addEventListener('visibilitychange', draw);
    motion.addEventListener('change', draw);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', draw); motion.removeEventListener('change', draw); };
  }, [anim, left, top, scale, y]);
  return <span ref={ref} className={className} aria-hidden="true" style={{
    display: 'block', width: (right - left) * scale, height: (bottom - top) * scale, imageRendering: 'pixelated',
    backgroundImage: `url(${anim.src})`, backgroundRepeat: 'no-repeat',
    backgroundSize: `${anim.w * anim.durations.length * scale}px ${anim.h * anim.rows * scale}px`,
    backgroundPosition: `${-left * scale}px ${-(y + top) * scale}px`,
  }} />;
}
