"use client";

import { useEffect, useRef, useState } from "react";

const TICK_MS  = 16;
const SCALE    = 2.5;
const WALK_SPD = 0.055; // px/ms
const MARGIN   = 24;    // px from viewport edge

const DIR_S = 0;
const DIR_W = 2;
const DIR_E = 6;

const ANIMS = {
  walk:  { src: "/teddiursa/Walk-Anim.png",  fw: 24, fh: 32, frames: 4, rows: 8, durations: [8, 10, 8, 10] },
  idle:  { src: "/teddiursa/Idle-Anim.png",  fw: 24, fh: 32, frames: 6, rows: 8, durations: [40, 12, 8, 12, 8, 20] },
  sleep: { src: "/teddiursa/Sleep-Anim.png", fw: 24, fh: 32, frames: 2, rows: 1, durations: [30, 35] },
} as const;

type Mode = keyof typeof ANIMS;

interface Visual { x: number; frame: number; dirRow: number; mode: Mode; }

function rand(min: number, max: number) { return min + Math.random() * (max - min); }

export default function TeddiursaRoamer() {
  const [visual, setVisual] = useState<Visual | null>(null);

  // All mutable logic state lives in refs so the RAF closure is stable
  const xRef        = useRef(0);
  const velRef      = useRef(1);           // +1 right, -1 left
  const targetXRef  = useRef(0);
  const modeRef     = useRef<Mode>("walk");
  const frameRef    = useRef(0);
  const frameElRef  = useRef(0);
  const timerRef    = useRef(0);           // time spent in idle/sleep (ms)
  const durationRef = useRef(0);           // how long to stay in idle/sleep (ms)
  const lastTsRef   = useRef(0);
  const rafRef      = useRef(0);

  useEffect(() => {
    const vw = () => window.innerWidth;

    const pickTarget = (currentX: number): number => {
      // Bias toward the opposite half so Teddiursa traverses the screen
      const left  = rand(MARGIN, vw() * 0.45);
      const right = rand(vw() * 0.55, vw() - MARGIN - ANIMS.walk.fw * SCALE);
      return currentX < vw() / 2 ? right : left;
    };

    // Initialise position
    const startX = rand(MARGIN, vw() - MARGIN - ANIMS.walk.fw * SCALE);
    xRef.current       = startX;
    targetXRef.current = pickTarget(startX);
    velRef.current     = targetXRef.current > startX ? 1 : -1;

    setVisual({ x: startX, frame: 0, dirRow: velRef.current > 0 ? DIR_E : DIR_W, mode: "walk" });

    const switchMode = (next: Mode) => {
      modeRef.current  = next;
      frameRef.current = 0;
      frameElRef.current = 0;
      timerRef.current = 0;

      if (next === "walk") {
        targetXRef.current = pickTarget(xRef.current);
        velRef.current = targetXRef.current > xRef.current ? 1 : -1;
        setVisual(v => v && ({ ...v, mode: "walk", frame: 0, dirRow: velRef.current > 0 ? DIR_E : DIR_W }));
      } else if (next === "idle") {
        durationRef.current = rand(2000, 5000);
        setVisual(v => v && ({ ...v, mode: "idle", frame: 0, dirRow: velRef.current > 0 ? DIR_E : DIR_W }));
      } else {
        durationRef.current = rand(8000, 20000);
        setVisual(v => v && ({ ...v, mode: "sleep", frame: 0, dirRow: DIR_S }));
      }
    };

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
        frameRef.current = (frameRef.current + 1) % cfg.frames;
      }

      if (m === "walk") {
        const sprW = cfg.fw * SCALE;
        let x = xRef.current + velRef.current * WALK_SPD * dt;

        // Wall bounce — pick new far target
        if (x <= MARGIN) {
          x = MARGIN;
          velRef.current = 1;
          targetXRef.current = rand(vw() * 0.5, vw() - MARGIN - sprW);
        } else if (x + sprW >= vw() - MARGIN) {
          x = vw() - MARGIN - sprW;
          velRef.current = -1;
          targetXRef.current = rand(MARGIN, vw() * 0.5);
        }

        xRef.current = x;
        const dirRow = velRef.current > 0 ? DIR_E : DIR_W;
        setVisual({ x, frame: frameRef.current, dirRow, mode: "walk" });

        // Reached target → idle (70%) or straight to sleep (30%)
        if (Math.abs(x - targetXRef.current) < 2) {
          switchMode(Math.random() < 0.3 ? "sleep" : "idle");
        }
      } else {
        // idle or sleep — count down timer
        timerRef.current += dt;
        setVisual(v => v && ({ ...v, frame: frameRef.current }));

        if (timerRef.current >= durationRef.current) {
          if (m === "idle") {
            switchMode(Math.random() < 0.4 ? "sleep" : "walk");
          } else {
            // After sleep: short idle (wake-up), then walk
            durationRef.current = rand(800, 1600);
            modeRef.current = "idle";
            frameRef.current = 0;
            frameElRef.current = 0;
            timerRef.current = 0;
            setVisual(v => v && ({ ...v, mode: "idle", frame: 0, dirRow: velRef.current > 0 ? DIR_E : DIR_W }));
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  if (!visual) return null;

  const cfg    = ANIMS[visual.mode];
  const sprW   = Math.round(cfg.fw * SCALE);
  const sprH   = Math.round(cfg.fh * SCALE);
  const sheetW = cfg.fw * cfg.frames * SCALE;
  const sheetH = cfg.fh * cfg.rows   * SCALE;
  const bgX    = -(visual.frame  * cfg.fw * SCALE);
  // Sleep has 1 row — force bgY=0 regardless of dirRow
  const bgY    = cfg.rows === 1 ? 0 : -(visual.dirRow * cfg.fh * SCALE);

  return (
    <div
      aria-hidden="true"
      style={{
        position:        "fixed",
        bottom:          20,
        left:            visual.x,
        width:           sprW,
        height:          sprH,
        backgroundImage: `url(${cfg.src})`,
        backgroundRepeat:"no-repeat",
        backgroundSize:  `${sheetW}px ${sheetH}px`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        imageRendering:  "pixelated",
        pointerEvents:   "none",
        zIndex:          50,
        transition:      "none",
      }}
    />
  );
}
