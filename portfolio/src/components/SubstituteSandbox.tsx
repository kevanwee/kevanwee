"use client";

import { useEffect, useRef, useState } from "react";

const TICK_MS = 16;
const SCALE = 2;
const WALK_SPD = 0.04; // px/ms
const MARGIN = 8;

const DIR_S = 0;
const DIR_FACE_RIGHT = 2; // row 2 = sprite faces right on screen
const DIR_FACE_LEFT = 6;  // row 6 = sprite faces left on screen

const ANIMS = {
  walk: { src: "/substitute/Walk-Anim.png", fw: 24, fh: 40, frames: 9, rows: 8, durations: [6,1,1,3,4,3,1,1,3] },
  idle: { src: "/substitute/Idle-Anim.png", fw: 24, fh: 40, frames: 9, rows: 8, durations: [32,8,1,1,3,4,3,1,1] },
  hurt: { src: "/substitute/Hurt-Anim.png", fw: 40, fh: 40, frames: 2,  rows: 8, durations: [2,8] },
} as const;

type Mode = keyof typeof ANIMS;

interface Visual { x: number; frame: number; dirRow: number; mode: Mode; }

function rand(min: number, max: number) { return min + Math.random() * (max - min); }
function dirFromVel(v: number) { return v > 0 ? DIR_FACE_RIGHT : DIR_FACE_LEFT; }

interface Props { className?: string; }

export default function SubstituteSandbox({ className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boxWRef = useRef(96);
  const boxHRef = useRef(96);
  const [boxH, setBoxH] = useState(96);
  const [visual, setVisual] = useState<Visual>({ x: 20, frame: 0, dirRow: DIR_S, mode: "idle" });

  // All animation state in refs so the loop never has stale closures
  const modeRef    = useRef<Mode>("idle");
  const frameRef   = useRef(0);
  const frameElRef = useRef(0);
  const lastTsRef  = useRef(0);
  const xRef       = useRef(20);
  const velRef     = useRef(1);
  const targetXRef = useRef(60);
  const timerRef   = useRef(0);
  const durRef     = useRef(0);
  const hurtRef    = useRef(0); // timestamp when hurt ends
  const rafRef     = useRef(0);

  // Track actual container size for sprite bounds and Y grounding
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const w = Math.round(e.contentRect.width)  || 96;
        const h = Math.round(e.contentRect.height) || 96;
        boxWRef.current = w;
        boxHRef.current = h;
        setBoxH(h);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const SPRITE_W = ANIMS.walk.fw * SCALE; // 48px

    const maxX = () => Math.max(MARGIN, boxWRef.current - SPRITE_W - MARGIN);

    // Bias target toward the opposite half so it traverses the full box
    const pickTarget = (cx: number) => {
      const mx = maxX();
      const mid = (MARGIN + mx) / 2;
      return cx < mid ? rand(mid, mx) : rand(MARGIN, mid);
    };

    const switchMode = (next: Mode) => {
      modeRef.current    = next;
      frameRef.current   = 0;
      frameElRef.current = 0;
      timerRef.current   = 0;

      if (next === "walk") {
        targetXRef.current = pickTarget(xRef.current);
        velRef.current     = targetXRef.current > xRef.current ? 1 : -1;
        setVisual({ x: xRef.current, frame: 0, dirRow: dirFromVel(velRef.current), mode: "walk" });
      } else {
        // idle — stay at current position, keep last facing direction
        durRef.current = rand(1800, 4500);
        setVisual({ x: xRef.current, frame: 0, dirRow: dirFromVel(velRef.current), mode: "idle" });
      }
    };

    // Initialise
    const startX = rand(MARGIN, Math.max(MARGIN + 1, boxWRef.current * 0.6));
    xRef.current       = startX;
    targetXRef.current = pickTarget(startX);
    velRef.current     = targetXRef.current > startX ? 1 : -1;
    modeRef.current    = "walk";
    setVisual({ x: startX, frame: 0, dirRow: dirFromVel(velRef.current), mode: "walk" });

    const tick = (ts: number) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min(ts - lastTsRef.current, 40);
      lastTsRef.current = ts;

      const m   = modeRef.current;
      const cfg = ANIMS[m];

      // Advance animation frame
      frameElRef.current += dt;
      while (frameElRef.current >= cfg.durations[frameRef.current] * TICK_MS) {
        frameElRef.current -= cfg.durations[frameRef.current] * TICK_MS;
        frameRef.current    = (frameRef.current + 1) % cfg.frames;
      }

      if (m === "hurt") {
        if (ts >= hurtRef.current) switchMode("idle");
        setVisual(v => ({ ...v, frame: frameRef.current }));
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (m === "walk") {
        const mx = maxX();
        let nx = xRef.current + velRef.current * WALK_SPD * dt;

        if (nx <= MARGIN) {
          nx = MARGIN;
          velRef.current     = 1;
          targetXRef.current = pickTarget(nx);
        } else if (nx >= mx) {
          nx = mx;
          velRef.current     = -1;
          targetXRef.current = pickTarget(nx);
        }

        xRef.current = nx;
        setVisual({ x: nx, frame: frameRef.current, dirRow: dirFromVel(velRef.current), mode: "walk" });

        if (Math.abs(nx - targetXRef.current) < 2) switchMode("idle");
      } else {
        // idle
        timerRef.current += dt;
        setVisual(v => ({ ...v, frame: frameRef.current }));
        if (timerRef.current >= durRef.current) switchMode("walk");
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleClick = () => {
    if (modeRef.current === "hurt") return;
    const now    = performance.now();
    const hurtMs = ANIMS.hurt.durations.reduce((s, d) => s + d * TICK_MS, 0);
    hurtRef.current    = now + hurtMs;
    modeRef.current    = "hurt";
    frameRef.current   = 0;
    frameElRef.current = 0;
    setVisual({ x: xRef.current, frame: 0, dirRow: DIR_S, mode: "hurt" });
  };

  const cfg    = ANIMS[visual.mode];
  const sprW   = Math.round(cfg.fw * SCALE);
  const sprH   = Math.round(cfg.fh * SCALE);
  const sheetW = cfg.fw * cfg.frames * SCALE;
  const sheetH = cfg.fh * cfg.rows   * SCALE;
  const bgX    = -(visual.frame * cfg.fw   * SCALE);
  const bgY    = -(visual.dirRow * cfg.fh * SCALE);
  const spriteY = Math.max(0, boxH - sprH);

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={`relative cursor-pointer overflow-hidden rounded-2xl border border-cream-200 bg-white transition-colors hover:border-sage-200 ${className}`}
      title="Click me!"
      aria-label="Click the substitute!"
    >
      <div className="absolute bottom-0 left-0 right-0 h-px bg-cream-100" aria-hidden="true" />
      <div
        aria-hidden="true"
        style={{
          position:           "absolute",
          left:               visual.x,
          top:                spriteY,
          width:              sprW,
          height:             sprH,
          backgroundImage:    `url(${cfg.src})`,
          backgroundRepeat:   "no-repeat",
          backgroundSize:     `${sheetW}px ${sheetH}px`,
          backgroundPosition: `${bgX}px ${bgY}px`,
          imageRendering:     "pixelated",
          pointerEvents:      "none",
        }}
      />
    </div>
  );
}
