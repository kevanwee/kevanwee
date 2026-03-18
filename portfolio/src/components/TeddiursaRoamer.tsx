"use client";

import { useEffect, useRef, useState } from "react";

const TICK_MS  = 16;
const SCALE    = 1.25; // halved from 2.5
const WALK_SPD = 0.055; // px/ms
const MARGIN   = 8;

const DIR_S = 0;
// PMD SpriteCollab convention: DIR_W row (2) = facing RIGHT on screen,
//                               DIR_E row (6) = facing LEFT on screen.
const DIR_FACE_RIGHT = 2;
const DIR_FACE_LEFT  = 6;

const ANIMS = {
  walk:  { src: "/teddiursa/Walk-Anim.png",  fw: 24, fh: 32, frames: 4, rows: 8, durations: [8, 10, 8, 10] },
  idle:  { src: "/teddiursa/Idle-Anim.png",  fw: 24, fh: 32, frames: 6, rows: 8, durations: [40, 12, 8, 12, 8, 20] },
  sleep: { src: "/teddiursa/Sleep-Anim.png", fw: 24, fh: 32, frames: 2, rows: 1, durations: [30, 35] },
} as const;

type Mode = keyof typeof ANIMS;

interface Visual { x: number; frame: number; dirRow: number; mode: Mode; }

function rand(min: number, max: number) { return min + Math.random() * (max - min); }

function getPanelBounds() {
  const el = document.getElementById("teddiursa-panel");
  if (!el) return { minX: MARGIN, maxX: window.innerWidth * 0.45 };
  const r = el.getBoundingClientRect();
  return { minX: r.left + MARGIN, maxX: r.right - MARGIN };
}

export default function TeddiursaRoamer() {
  const [visual, setVisual] = useState<Visual | null>(null);

  const xRef        = useRef(0);
  const velRef      = useRef(1);
  const targetXRef  = useRef(0);
  const modeRef     = useRef<Mode>("walk");
  const frameRef    = useRef(0);
  const frameElRef  = useRef(0);
  const timerRef    = useRef(0);
  const durationRef = useRef(0);
  const lastTsRef   = useRef(0);
  const rafRef      = useRef(0);

  useEffect(() => {
    const sprW = () => ANIMS.walk.fw * SCALE;

    const pickTarget = (currentX: number): number => {
      const { minX, maxX } = getPanelBounds();
      const mid = (minX + maxX) / 2;
      // Bias to opposite half so Teddiursa traverses the panel
      if (currentX < mid) return rand(mid, maxX - sprW());
      return rand(minX, mid);
    };

    const dirFromVel = (vel: number) => vel > 0 ? DIR_FACE_RIGHT : DIR_FACE_LEFT;

    const { minX } = getPanelBounds();
    const startX = minX + rand(0, 40);
    xRef.current       = startX;
    targetXRef.current = pickTarget(startX);
    velRef.current     = targetXRef.current > startX ? 1 : -1;

    setVisual({ x: startX, frame: 0, dirRow: dirFromVel(velRef.current), mode: "walk" });

    const switchMode = (next: Mode) => {
      modeRef.current    = next;
      frameRef.current   = 0;
      frameElRef.current = 0;
      timerRef.current   = 0;

      if (next === "walk") {
        targetXRef.current = pickTarget(xRef.current);
        velRef.current     = targetXRef.current > xRef.current ? 1 : -1;
        setVisual(v => v && ({ ...v, mode: "walk", frame: 0, dirRow: dirFromVel(velRef.current) }));
      } else if (next === "idle") {
        durationRef.current = rand(2000, 5000);
        setVisual(v => v && ({ ...v, mode: "idle", frame: 0, dirRow: dirFromVel(velRef.current) }));
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
        const { minX, maxX } = getPanelBounds();
        const w = ANIMS.walk.fw * SCALE;
        let x = xRef.current + velRef.current * WALK_SPD * dt;

        // Bounce off panel edges
        if (x <= minX) {
          x = minX;
          velRef.current = 1;
          targetXRef.current = rand((minX + maxX) / 2, maxX - w);
        } else if (x + w >= maxX) {
          x = maxX - w;
          velRef.current = -1;
          targetXRef.current = rand(minX, (minX + maxX) / 2);
        }

        xRef.current = x;
        setVisual({ x, frame: frameRef.current, dirRow: dirFromVel(velRef.current), mode: "walk" });

        if (Math.abs(x - targetXRef.current) < 2) {
          switchMode(Math.random() < 0.3 ? "sleep" : "idle");
        }
      } else {
        timerRef.current += dt;
        setVisual(v => v && ({ ...v, frame: frameRef.current }));

        if (timerRef.current >= durationRef.current) {
          if (m === "idle") {
            switchMode(Math.random() < 0.4 ? "sleep" : "walk");
          } else {
            // Wake up: short idle then walk
            durationRef.current = rand(800, 1600);
            modeRef.current     = "idle";
            frameRef.current    = 0;
            frameElRef.current  = 0;
            timerRef.current    = 0;
            setVisual(v => v && ({ ...v, mode: "idle", frame: 0, dirRow: dirFromVel(velRef.current) }));
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
  const bgX    = -(visual.frame * cfg.fw * SCALE);
  const bgY    = cfg.rows === 1 ? 0 : -(visual.dirRow * cfg.fh * SCALE);

  return (
    <div
      aria-hidden="true"
      style={{
        position:           "fixed",
        bottom:             20,
        left:               visual.x,
        width:              sprW,
        height:             sprH,
        backgroundImage:    `url(${cfg.src})`,
        backgroundRepeat:   "no-repeat",
        backgroundSize:     `${sheetW}px ${sheetH}px`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        imageRendering:     "pixelated",
        pointerEvents:      "none",
        zIndex:             50,
      }}
    />
  );
}
