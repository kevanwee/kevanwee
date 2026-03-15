"use client";

import { useEffect, useRef, useState } from "react";

/* ── Sprite definitions ────────────────────────────────────────────── */
const SPRITES = {
  diancie: {
    walk: "https://raw.githubusercontent.com/kevanwee/pmdsvgworld/main/assets/sprites/0719/0001/Walk-Anim.png",
    frameW: 56,
    frameH: 88,
    frames: 4,
    scale: 2,
    label: "Mega Diancie",
  },
  ceruledge: {
    walk: "https://raw.githubusercontent.com/kevanwee/pmdsvgworld/main/assets/sprites/0937/Walk-Anim.png",
    frameW: 32,
    frameH: 56,
    frames: 4,
    scale: 2,
    label: "Shiny Ceruledge",
  },
} as const;

type SpriteKey = keyof typeof SPRITES;

interface WalkerProps {
  spriteKey: SpriteKey;
  containerWidth: number;
  startX?: number;
  speed?: number; // px per second
  /** delay before first walk (ms) */
  delay?: number;
}

function Walker({ spriteKey, containerWidth, startX = 0, speed = 60, delay = 0 }: WalkerProps) {
  const sp = SPRITES[spriteKey];
  const displayW = sp.frameW * sp.scale;
  const displayH = sp.frameH * sp.scale;
  const sheetW = sp.frameW * sp.frames * sp.scale;

  const [x, setX] = useState(startX);
  const [facingRight, setFacingRight] = useState(true);
  const [frame, setFrame] = useState(0);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      startedRef.current = true;
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    let direction = 1; // 1 = right, -1 = left
    let posX = startX;
    let frameIdx = 0;
    const frameInterval = 150; // ms per frame
    let lastFrameTime = 0;

    const tick = (ts: number) => {
      if (!startedRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const dt = lastRef.current ? Math.min(ts - lastRef.current, 50) : 0;
      lastRef.current = ts;

      posX += (speed * dt) / 1000 * direction;

      if (posX + displayW >= containerWidth) {
        posX = containerWidth - displayW;
        direction = -1;
        setFacingRight(false);
      } else if (posX <= 0) {
        posX = 0;
        direction = 1;
        setFacingRight(true);
      }

      if (ts - lastFrameTime >= frameInterval) {
        frameIdx = (frameIdx + 1) % sp.frames;
        lastFrameTime = ts;
        setFrame(frameIdx);
      }

      setX(posX);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerWidth, speed, displayW, delay]);

  const sheetX = -(frame * sp.frameW * sp.scale);
  // Row 0 = south (toward viewer) = walking down; use row 6 = east (right-facing)
  // PMD spritesheet rows: 0=S,1=SE,2=E,3=NE,4=N,5=NW,6=W,7=SW
  // We'll use row 2 (east) when walking right, row 6 (west) when walking left
  const rowIndex = facingRight ? 2 : 6;
  const sheetY = -(rowIndex * sp.frameH * sp.scale);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        bottom: 0,
        width: displayW,
        height: displayH,
        imageRendering: "pixelated",
        overflow: "hidden",
        flexShrink: 0,
      }}
      title={sp.label}
    >
      <div
        style={{
          width: sheetW,
          height: displayH,
          backgroundImage: `url(${sp.walk})`,
          backgroundSize: `${sheetW}px auto`,
          backgroundPosition: `${sheetX}px ${sheetY}px`,
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}

/* ── Container ─────────────────────────────────────────────────────── */
export default function PokemonWalker() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const maxH = Math.max(
    SPRITES.diancie.frameH * SPRITES.diancie.scale,
    SPRITES.ceruledge.frameH * SPRITES.ceruledge.scale
  );

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", height: maxH, overflow: "hidden" }}
      aria-hidden="true"
    >
      {width > 0 && (
        <>
          <Walker
            spriteKey="diancie"
            containerWidth={width}
            startX={Math.floor(width * 0.2)}
            speed={55}
            delay={0}
          />
          <Walker
            spriteKey="ceruledge"
            containerWidth={width}
            startX={Math.floor(width * 0.6)}
            speed={75}
            delay={400}
          />
        </>
      )}
    </div>
  );
}
