"use client";

import { useEffect, useRef, useState } from "react";

// Substitute animation data from AnimData.xml
const ANIMS: Record<string, { src: string; frameWidth: number; frameHeight: number; rows: number; durations: number[] }> = {
  walk:  { src: "/substitute/Walk-Anim.png",  frameWidth: 24, frameHeight: 40, rows: 8, durations: [6,1,1,3,4,3,1,1,3] },
  idle:  { src: "/substitute/Idle-Anim.png",  frameWidth: 24, frameHeight: 40, rows: 8, durations: [32,8,1,1,3,4,3,1,1] },
  hop:   { src: "/substitute/Hop-Anim.png",   frameWidth: 24, frameHeight: 80, rows: 8, durations: [2,1,2,3,4,4,3,2,1,2] },
  hurt:  { src: "/substitute/Hurt-Anim.png",  frameWidth: 40, frameHeight: 40, rows: 8, durations: [2,8] },
};

type AnimName = keyof typeof ANIMS;

// Directions
const DIR_W = 2;
const DIR_E = 6;
const DIR_S = 0;

const TICK_MS = 16;
const SCALE = 2;

// Sandbox dimensions
const BOX_W = 96;
const BOX_H = 96;

const WALK_SPRITE_W = ANIMS.walk.frameWidth * SCALE;   // 48
const WALK_SPRITE_H = ANIMS.walk.frameHeight * SCALE;  // 80
const HOP_SPRITE_H  = ANIMS.hop.frameHeight * SCALE;   // 160 (taller frame)
const HURT_SPRITE_W = ANIMS.hurt.frameWidth * SCALE;   // 80

const MOVE_SPEED = 18; // px per second

export default function SubstituteSandbox() {
  const [animName, setAnimName] = useState<AnimName>("idle");
  const [frame, setFrame] = useState(0);
  const [dir, setDir] = useState<0 | 2 | 6>(DIR_S);
  const [x, setX] = useState(20); // px position within sandbox

  const animRef = useRef<AnimName>("idle");
  const frameRef = useRef(0);
  const frameElapsedRef = useRef(0);
  const lastTsRef = useRef(0);
  const xRef = useRef(20);
  const velXRef = useRef(0); // -1 or 1 (direction of movement)
  const dirRef = useRef<0 | 2 | 6>(DIR_S);
  const hurtUntilRef = useRef(0);
  const phaseTimerRef = useRef(0); // when to next switch phases
  const rafRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const setAnimWithReset = (next: AnimName) => {
    if (animRef.current === next) return;
    animRef.current = next;
    frameRef.current = 0;
    frameElapsedRef.current = 0;
    setAnimName(next);
    setFrame(0);
  };

  useEffect(() => {
    // Random initial direction
    velXRef.current = Math.random() > 0.5 ? 1 : -1;
    phaseTimerRef.current = performance.now() + 2000 + Math.random() * 2000;

    const tick = (ts: number) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min(ts - lastTsRef.current, 40);
      lastTsRef.current = ts;

      const now = ts;
      const anim = ANIMS[animRef.current];

      // Hurt is a one-shot
      if (animRef.current === "hurt" && now >= hurtUntilRef.current) {
        setAnimWithReset("idle");
        phaseTimerRef.current = now + 1500;
      }

      // Phase transitions (idle ↔ walk ↔ hop)
      if (animRef.current !== "hurt" && now >= phaseTimerRef.current) {
        const phases: AnimName[] = ["idle", "walk", "walk", "hop"];
        const next = phases[Math.floor(Math.random() * phases.length)];
        setAnimWithReset(next);

        if (next === "walk") {
          // Randomly pick a new direction
          const newVel = Math.random() > 0.5 ? 1 : -1;
          velXRef.current = newVel;
          // DIR_W (row 2) = facing right on screen; DIR_E (row 6) = facing left
          const newDir = newVel > 0 ? DIR_W : DIR_E;
          dirRef.current = newDir as 0 | 2 | 6;
          setDir(newDir as 0 | 2 | 6);
        } else {
          dirRef.current = DIR_S;
          setDir(DIR_S);
        }

        phaseTimerRef.current = now + 1500 + Math.random() * 2500;
      }

      // Move X when walking
      if (animRef.current === "walk") {
        const maxX = BOX_W - WALK_SPRITE_W;
        let nx = xRef.current + velXRef.current * MOVE_SPEED * (dt / 1000);

        if (nx <= 0) {
          nx = 0;
          velXRef.current = 1;
          dirRef.current = DIR_W as 0 | 2 | 6; // moving right → face right (DIR_W row)
          setDir(DIR_W);
        } else if (nx >= maxX) {
          nx = maxX;
          velXRef.current = -1;
          dirRef.current = DIR_E as 0 | 2 | 6; // moving left → face left (DIR_E row)
          setDir(DIR_E);
        }

        xRef.current = nx;
        setX(nx);
      }

      // Advance frame
      frameElapsedRef.current += dt;
      let nextFrame = frameRef.current;
      let changed = false;

      while (frameElapsedRef.current >= anim.durations[nextFrame] * TICK_MS) {
        frameElapsedRef.current -= anim.durations[nextFrame] * TICK_MS;

        if (animRef.current === "hurt") {
          if (nextFrame < anim.durations.length - 1) {
            nextFrame += 1;
            changed = true;
          }
          break;
        }

        nextFrame = (nextFrame + 1) % anim.durations.length;
        changed = true;
      }

      if (changed) {
        frameRef.current = nextFrame;
        setFrame(nextFrame);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (animRef.current === "hurt") return;

    const now = performance.now();
    const hurtDur = ANIMS.hurt.durations.reduce((s, d) => s + d * TICK_MS, 0);
    hurtUntilRef.current = now + hurtDur;
    setAnimWithReset("hurt");
    dirRef.current = DIR_S;
    setDir(DIR_S);
    // Force frame to 0 for hurt
    frameRef.current = 0;
    frameElapsedRef.current = 0;
    setFrame(0);
    phaseTimerRef.current = now + hurtDur + 1200;
  };

  const anim = ANIMS[animName];
  const scale = SCALE;
  const row = anim.rows === 1 ? 0 : dir;
  const bgX = -(frame * anim.frameWidth * scale);
  const bgY = -(row * anim.frameHeight * scale);

  // For rendering: walk/idle sprites sit at bottom of box
  const spriteW = anim.frameWidth * scale;
  const spriteH = anim.frameHeight * scale;

  // Y position: sit at bottom of box
  const spriteY = BOX_H - spriteH;

  // X position: use xRef for walk, center for others
  const spriteX =
    animName === "walk"
      ? x
      : (BOX_W - spriteW) / 2;

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="relative flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-cream-200 bg-white transition-colors hover:border-sage-200"
      style={{ width: BOX_W, height: BOX_H }}
      title="Click me!"
      aria-label="Click the substitute!"
    >
      {/* Subtle ground line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px bg-cream-100"
        aria-hidden="true"
      />

      {/* Substitute sprite */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: spriteX,
          top: Math.max(0, spriteY),
          width: spriteW,
          height: spriteH,
          backgroundImage: `url(${anim.src})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${anim.frameWidth * anim.durations.length * scale}px ${anim.frameHeight * anim.rows * scale}px`,
          backgroundPosition: `${bgX}px ${bgY}px`,
          imageRendering: "pixelated",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
