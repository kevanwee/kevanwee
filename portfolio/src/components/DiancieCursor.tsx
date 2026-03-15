"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Mode = "walk" | "idle" | "sleep" | "strike";

type AnimConfig = {
  src: string;
  frameWidth: number;
  frameHeight: number;
  rows: number;
  durations: number[];
};

const TICK_MS = 16;
const SLEEP_AFTER_MS = 2600;
const IDLE_AFTER_MS = 320;
const SPRITE_SCALE = 1.15;
const CURSOR_ANCHOR_X = 0.5;
const CURSOR_ANCHOR_Y = 0.34;

const DIR_S = 0;
const DIR_SW = 1;
const DIR_W = 2;
const DIR_NW = 3;
const DIR_N = 4;
const DIR_NE = 5;
const DIR_E = 6;
const DIR_SE = 7;

const ANIMS: Record<Mode, AnimConfig> = {
  walk: {
    src: "/diancie/Walk-Anim.png",
    frameWidth: 56,
    frameHeight: 88,
    rows: 8,
    durations: [4, 4, 4, 4, 4, 4, 4, 4, 4],
  },
  idle: {
    src: "/diancie/Idle-Anim.png",
    frameWidth: 64,
    frameHeight: 88,
    rows: 8,
    durations: [16, 12, 16, 12],
  },
  sleep: {
    src: "/diancie/Sleep-Anim.png",
    frameWidth: 48,
    frameHeight: 80,
    rows: 1,
    durations: [14, 13, 12, 16, 14, 13, 12, 16],
  },
  strike: {
    src: "/diancie/Strike-Anim.png",
    frameWidth: 88,
    frameHeight: 144,
    rows: 8,
    durations: [2, 2, 6, 1, 1, 2, 2, 6, 1, 2, 2, 2, 2, 2],
  },
};

function directionFromDelta(dx: number, dy: number, fallback: number) {
  const mag = Math.hypot(dx, dy);
  if (mag < 0.4) return fallback;

  const oct = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
  switch (oct) {
    case 0:
      return DIR_W;
    case 1:
      return DIR_SW;
    case 2:
      return DIR_S;
    case 3:
      return DIR_SE;
    case 4:
    case -4:
      return DIR_E;
    case -3:
      return DIR_NE;
    case -2:
      return DIR_N;
    case -1:
      return DIR_NW;
    default:
      return fallback;
  }
}

function totalDurationMs(durations: number[]) {
  return durations.reduce((sum, d) => sum + d * TICK_MS, 0);
}

export default function DiancieCursor() {
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");
  const [frame, setFrame] = useState(0);
  const [dirRow, setDirRow] = useState(DIR_S);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [spritePos, setSpritePos] = useState({ x: 0, y: 0 });

  const strikeLengthMs = useMemo(
    () => totalDurationMs(ANIMS.strike.durations),
    []
  );

  const modeRef = useRef<Mode>("idle");
  const frameRef = useRef(0);
  const frameElapsedRef = useRef(0);
  const lastTsRef = useRef(0);
  const lastMoveAtRef = useRef(0);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const targetPosRef = useRef({ x: 0, y: 0 });
  const cursorPosRef = useRef({ x: 0, y: 0 });
  const spritePosRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const strikeUntilRef = useRef(0);
  const dirRowRef = useRef(DIR_S);
  const readyRef = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const root = document.documentElement;
    root.classList.add("diancie-cursor");

    const now = performance.now();
    lastMoveAtRef.current = now;

    const setModeWithReset = (next: Mode, force = false) => {
      if (!force && modeRef.current === next) return;
      modeRef.current = next;
      frameRef.current = 0;
      frameElapsedRef.current = 0;
      setFrame(0);
      setMode(next);
    };

    const onMouseMove = (event: MouseEvent) => {
      const nextPos = { x: event.clientX, y: event.clientY };
      const prevPos = lastMouseRef.current;
      const dx = nextPos.x - prevPos.x;
      const dy = nextPos.y - prevPos.y;

      lastMouseRef.current = nextPos;
      targetPosRef.current = nextPos;
      lastMoveAtRef.current = performance.now();
      if (!readyRef.current) {
        readyRef.current = true;
        cursorPosRef.current = nextPos;
        spritePosRef.current = nextPos;
        setCursorPos(nextPos);
        setSpritePos(nextPos);
        setReady(true);
      }

      velocityRef.current = {
        x: velocityRef.current.x * 0.55 + dx * 0.45,
        y: velocityRef.current.y * 0.55 + dy * 0.45,
      };

      const nextDir = directionFromDelta(
        velocityRef.current.x,
        velocityRef.current.y,
        dirRowRef.current
      );
      if (nextDir !== dirRowRef.current) {
        dirRowRef.current = nextDir;
        setDirRow(nextDir);
      }

      if (modeRef.current !== "strike") {
        setModeWithReset("walk");
      }
    };

    const onMouseDown = () => {
      strikeUntilRef.current = performance.now() + strikeLengthMs;
      setModeWithReset("strike", true);
    };

    const tick = (ts: number) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min(ts - lastTsRef.current, 40);
      lastTsRef.current = ts;

      const nowMs = performance.now();
      const inactiveFor = nowMs - lastMoveAtRef.current;
      const target = targetPosRef.current;
      const cursor = cursorPosRef.current;
      const sprite = spritePosRef.current;
      const followAlpha = 1 - Math.exp(-dt / 40);

      if (Math.abs(target.x - cursor.x) > 0.01 || Math.abs(target.y - cursor.y) > 0.01) {
        cursorPosRef.current = target;
        setCursorPos(target);
      }

      const nextSprite = {
        x: sprite.x + (target.x - sprite.x) * followAlpha,
        y: sprite.y + (target.y - sprite.y) * followAlpha,
      };

      if (Math.abs(nextSprite.x - sprite.x) > 0.01 || Math.abs(nextSprite.y - sprite.y) > 0.01) {
        spritePosRef.current = nextSprite;
        setSpritePos(nextSprite);
      }

      if (modeRef.current === "strike" && nowMs >= strikeUntilRef.current) {
        if (inactiveFor >= SLEEP_AFTER_MS) setModeWithReset("sleep");
        else if (inactiveFor >= IDLE_AFTER_MS) setModeWithReset("idle");
        else setModeWithReset("walk");
      } else if (modeRef.current !== "strike") {
        if (inactiveFor >= SLEEP_AFTER_MS) setModeWithReset("sleep");
        else if (inactiveFor >= IDLE_AFTER_MS) setModeWithReset("idle");
        else setModeWithReset("walk");
      }

      const current = ANIMS[modeRef.current];
      frameElapsedRef.current += dt;
      let nextFrame = frameRef.current;
      let changed = false;

      while (frameElapsedRef.current >= current.durations[nextFrame] * TICK_MS) {
        frameElapsedRef.current -= current.durations[nextFrame] * TICK_MS;

        if (modeRef.current === "strike") {
          if (nextFrame < current.durations.length - 1) {
            nextFrame += 1;
            changed = true;
          }
          break;
        }

        nextFrame = (nextFrame + 1) % current.durations.length;
        changed = true;
      }

      if (changed) {
        frameRef.current = nextFrame;
        setFrame(nextFrame);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      readyRef.current = false;
      root.classList.remove("diancie-cursor");
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      cancelAnimationFrame(rafRef.current);
    };
  }, [strikeLengthMs]);

  if (!ready) return null;

  const anim = ANIMS[mode];
  const width = anim.frameWidth * SPRITE_SCALE;
  const height = anim.frameHeight * SPRITE_SCALE;
  const row = mode === "sleep" ? 0 : dirRow;
  const bgX = -(frame * anim.frameWidth * SPRITE_SCALE);
  const bgY = -(row * anim.frameHeight * SPRITE_SCALE);

  return (
    <>
      <svg
        aria-hidden="true"
        width="18"
        height="24"
        viewBox="0 0 18 24"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          transform: `translate3d(${cursorPos.x - 1}px, ${cursorPos.y - 1}px, 0)`,
          pointerEvents: "none",
          zIndex: 79,
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.22))",
        }}
      >
        <path
          d="M2 1L2 20L7 15L10 22L13 20L10 13L17 13Z"
          fill="#FFFFFF"
          stroke="#1F2937"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          transform: `translate3d(${spritePos.x - width * CURSOR_ANCHOR_X}px, ${spritePos.y - height * CURSOR_ANCHOR_Y}px, 0)`,
          width,
          height,
          pointerEvents: "none",
          zIndex: 80,
          backgroundImage: `url(${anim.src})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${anim.frameWidth * anim.durations.length * SPRITE_SCALE}px ${anim.frameHeight * anim.rows * SPRITE_SCALE}px`,
          backgroundPosition: `${bgX}px ${bgY}px`,
          imageRendering: "pixelated",
        }}
      />
    </>
  );
}
