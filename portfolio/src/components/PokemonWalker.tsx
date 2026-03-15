"use client";

import { useEffect, useRef, useState } from "react";

/* ── Sprite configs ─────────────────────────────────────────────────
   PMD direction rows: 0=S 1=SW 2=W 3=NW 4=N 5=NE 6=E 7=SE
   East (right-facing) = row 6, West (left-facing) = row 2
 ───────────────────────────────────────────────────────────────────── */
const BASE =
  "https://raw.githubusercontent.com/kevanwee/pmdsvgworld/main/assets/sprites";

const CONFIGS = {
  diancie: {
    src: `${BASE}/0719/0001/Strike-Anim.png`,
    frameW: 88,
    frameH: 144,
    frames: 14,
    scale: 2,
    dirRow: 6, // faces east (right)
    fps: 120,  // ms per frame
    label: "Mega Diancie",
  },
  ceruledge: {
    src: `${BASE}/0937/0000/0001/Strike-Anim.png`,
    frameW: 72,
    frameH: 88,
    frames: 9,
    scale: 2,
    dirRow: 2, // faces west (left)
    fps: 120,
    label: "Shiny Ceruledge",
  },
} as const;

type SpriteKey = keyof typeof CONFIGS;

const NUM_DIRECTIONS = 8;

/* ── Single battler ─────────────────────────────────────────────────── */
interface BattlerProps {
  spriteKey: SpriteKey;
  /** offset from respective edge in px (diancie from left, ceruledge from right) */
  edgeOffset: number;
  /** stagger starting frame */
  frameOffset?: number;
}

function Battler({ spriteKey, edgeOffset, frameOffset = 0 }: BattlerProps) {
  const cfg = CONFIGS[spriteKey];
  const displayW = cfg.frameW * cfg.scale;
  const displayH = cfg.frameH * cfg.scale;
  const totalSheetW = cfg.frameW * cfg.frames * cfg.scale;
  const totalSheetH = cfg.frameH * NUM_DIRECTIONS * cfg.scale;

  const [frameIdx, setFrameIdx] = useState(frameOffset % cfg.frames);

  useEffect(() => {
    const id = setInterval(() => {
      setFrameIdx((f) => (f + 1) % cfg.frames);
    }, cfg.fps);
    return () => clearInterval(id);
  }, [cfg.frames, cfg.fps]);

  const bgX = -(frameIdx * cfg.frameW * cfg.scale);
  const bgY = -(cfg.dirRow * cfg.frameH * cfg.scale);

  const posStyle =
    spriteKey === "diancie"
      ? { left: edgeOffset }
      : { right: edgeOffset };

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        ...posStyle,
        width: displayW,
        height: displayH,
        backgroundImage: `url(${cfg.src})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${totalSheetW}px ${totalSheetH}px`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        imageRendering: "pixelated",
      }}
      title={cfg.label}
    />
  );
}

/* ── Battle stage ───────────────────────────────────────────────────── */
export default function PokemonWalker() {
  const maxH = Math.max(
    CONFIGS.diancie.frameH * CONFIGS.diancie.scale,
    CONFIGS.ceruledge.frameH * CONFIGS.ceruledge.scale
  );

  /* VS label fades in once */
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.4 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ position: "relative", width: "100%", height: maxH, overflow: "visible" }}
      aria-hidden="true"
    >
      <Battler spriteKey="diancie" edgeOffset={32} frameOffset={0} />
      <Battler spriteKey="ceruledge" edgeOffset={32} frameOffset={5} />

      {/* VS badge */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 16,
          transform: `translateX(-50%) scale(${visible ? 1 : 0.6})`,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
          fontFamily: "serif",
          fontStyle: "italic",
          fontWeight: 700,
          fontSize: 13,
          color: "#a5968a",
          letterSpacing: "0.1em",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        ✦ vs ✦
      </div>
    </div>
  );
}
