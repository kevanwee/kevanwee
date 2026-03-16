"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePokemonCursor, type PokemonId } from "@/components/PokemonCursorContext";

type Mode = "walk" | "idle" | "sleep" | "click";

type AnimConfig = {
  src: string;
  frameWidth: number;
  frameHeight: number;
  rows: number;
  durations: number[];
};

type PokemonConfig = {
  walk: AnimConfig;
  idle: AnimConfig;
  sleep: AnimConfig;
  click: AnimConfig;
  scale: number;
  anchorX: number;
  anchorY: number;
};

const TICK_MS = 16;
const SLEEP_AFTER_MS = 2600;
const IDLE_AFTER_MS = 320;

const DIR_S = 0;
const DIR_SW = 1;
const DIR_W = 2;
const DIR_NW = 3;
const DIR_N = 4;
const DIR_NE = 5;
const DIR_E = 6;
const DIR_SE = 7;

const POKEMON_CONFIGS: Record<PokemonId, PokemonConfig> = {
  diancie: {
    walk:  { src: "/diancie/Walk-Anim.png",   frameWidth: 56, frameHeight: 88,  rows: 8, durations: [4,4,4,4,4,4,4,4,4] },
    idle:  { src: "/diancie/Idle-Anim.png",   frameWidth: 64, frameHeight: 88,  rows: 8, durations: [16,12,16,12] },
    sleep: { src: "/diancie/Sleep-Anim.png",  frameWidth: 48, frameHeight: 80,  rows: 1, durations: [14,13,12,16,14,13,12,16] },
    click: { src: "/diancie/Strike-Anim.png", frameWidth: 88, frameHeight: 144, rows: 8, durations: [2,2,6,1,1,2,2,6,1,2,2,2,2,2] },
    scale: 1.15, anchorX: 0.46, anchorY: 0.22,
  },
  ceruledge: {
    walk:  { src: "/ceruledge/Walk-Anim.png",   frameWidth: 32, frameHeight: 56, rows: 8, durations: [10,10,10,10] },
    idle:  { src: "/ceruledge/Idle-Anim.png",   frameWidth: 32, frameHeight: 56, rows: 8, durations: [5,5,5,5,5,5,5,5,5,5,2,3,4,3,2] },
    sleep: { src: "/ceruledge/Sleep-Anim.png",  frameWidth: 24, frameHeight: 48, rows: 1, durations: [30,35] },
    click: { src: "/ceruledge/Attack-Anim.png", frameWidth: 64, frameHeight: 80, rows: 8, durations: [2,2,6,1,1,2,2,2,2,2,2,2,1,2] },
    scale: 2.2, anchorX: 0.46, anchorY: 0.22,
  },
  greninja: {
    walk:  { src: "/greninja/Walk-Anim.png",   frameWidth: 32, frameHeight: 48, rows: 8, durations: [8,10,8,10] },
    idle:  { src: "/greninja/Idle-Anim.png",   frameWidth: 32, frameHeight: 56, rows: 8, durations: [40,12,2,3,6,2,4] },
    sleep: { src: "/greninja/Sleep-Anim.png",  frameWidth: 24, frameHeight: 40, rows: 1, durations: [30,35] },
    click: { src: "/greninja/Attack-Anim.png", frameWidth: 64, frameHeight: 72, rows: 8, durations: [2,2,6,1,2,2,2,2,2,2,1,2] },
    scale: 2.2, anchorX: 0.46, anchorY: 0.22,
  },
  latios: {
    walk:  { src: "/latios/Walk-Anim.png",   frameWidth: 64, frameHeight: 80, rows: 8, durations: [4,4,4,4,4,4,4,4,4,4,4,4] },
    idle:  { src: "/latios/Idle-Anim.png",   frameWidth: 64, frameHeight: 80, rows: 8, durations: [8,8,8,8,8,8] },
    sleep: { src: "/latios/Sleep-Anim.png",  frameWidth: 48, frameHeight: 32, rows: 1, durations: [30,35] },
    click: { src: "/latios/Attack-Anim.png", frameWidth: 80, frameHeight: 80, rows: 8, durations: [2,2,6,1,1,1,2,2,2,2,2] },
    scale: 1.5, anchorX: 0.5, anchorY: 0.3,
  },
  latias: {
    walk:  { src: "/latias/Walk-Anim.png",   frameWidth: 48, frameHeight: 64, rows: 8, durations: [4,4,4,4,4,4,4,4,4,4,4,4,4,4] },
    idle:  { src: "/latias/Idle-Anim.png",   frameWidth: 48, frameHeight: 64, rows: 8, durations: [8,8,8,8,8,8] },
    sleep: { src: "/latias/Sleep-Anim.png",  frameWidth: 40, frameHeight: 32, rows: 1, durations: [30,35] },
    click: { src: "/latias/Attack-Anim.png", frameWidth: 72, frameHeight: 72, rows: 8, durations: [2,2,6,1,1,1,2,2,2,2,2] },
    scale: 1.8, anchorX: 0.5, anchorY: 0.3,
  },
  ironvaliant: {
    walk:  { src: "/ironvaliant/Walk-Anim.png",     frameWidth: 24, frameHeight: 48, rows: 8, durations: [12,12,12,12] },
    idle:  { src: "/ironvaliant/Twirl-Anim.png",    frameWidth: 88, frameHeight: 80, rows: 8, durations: [2,2,2,2,2,2,2,2,2,3,3,3,2,2,2,2] },
    sleep: { src: "/ironvaliant/Sleep-Anim.png",    frameWidth: 32, frameHeight: 32, rows: 1, durations: [60,6,35,6] },
    click: { src: "/ironvaliant/SpAttack-Anim.png", frameWidth: 56, frameHeight: 80, rows: 8, durations: [2,6,2,2,2,2,2,2] },
    scale: 2.2, anchorX: 0.5, anchorY: 0.22,
  },
};

function directionFromDelta(dx: number, dy: number, fallback: number) {
  const mag = Math.hypot(dx, dy);
  if (mag < 0.4) return fallback;

  const oct = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
  switch (oct) {
    case  0: return DIR_W;
    case  1: return DIR_SW;
    case  2: return DIR_S;
    case  3: return DIR_SE;
    case  4:
    case -4: return DIR_E;
    case -3: return DIR_NE;
    case -2: return DIR_N;
    case -1: return DIR_NW;
    default: return fallback;
  }
}

function totalDurationMs(durations: number[]) {
  return durations.reduce((sum, d) => sum + d * TICK_MS, 0);
}

export default function PokemonCursor() {
  const { selectedPokemon } = usePokemonCursor();

  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");
  const [frame, setFrame] = useState(0);
  const [dirRow, setDirRow] = useState(DIR_S);
  const [spritePos, setSpritePos] = useState({ x: 0, y: 0 });
  const [spawning, setSpawning] = useState(false);

  const pokemonRef = useRef<PokemonId>(selectedPokemon);
  const configRef = useRef<PokemonConfig>(POKEMON_CONFIGS[selectedPokemon]);

  const clickLengthMs = useMemo(
    () => totalDurationMs(POKEMON_CONFIGS[selectedPokemon].click.durations),
    [selectedPokemon]
  );

  const modeRef = useRef<Mode>("idle");
  const frameRef = useRef(0);
  const frameElapsedRef = useRef(0);
  const lastTsRef = useRef(0);
  const lastMoveAtRef = useRef(0);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const targetPosRef = useRef({ x: 0, y: 0 });
  const spritePosRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const clickUntilRef = useRef(0);
  const dirRowRef = useRef(DIR_S);
  const readyRef = useRef(false);
  const rafRef = useRef(0);

  // Handle pokemon switching
  useEffect(() => {
    if (pokemonRef.current !== selectedPokemon) {
      pokemonRef.current = selectedPokemon;
      configRef.current = POKEMON_CONFIGS[selectedPokemon];
      // Reset animation state
      modeRef.current = "idle";
      frameRef.current = 0;
      frameElapsedRef.current = 0;
      clickUntilRef.current = 0;
      setMode("idle");
      setFrame(0);
      // Spawn animation
      setSpawning(true);
      const t = setTimeout(() => setSpawning(false), 450);
      return () => clearTimeout(t);
    }
  }, [selectedPokemon]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const root = document.documentElement;
    root.classList.add("pokemon-cursor");

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

    const onMouseMove = (e: MouseEvent) => {
      const nextPos = { x: e.clientX, y: e.clientY };
      const prevPos = lastMouseRef.current;
      const dx = nextPos.x - prevPos.x;
      const dy = nextPos.y - prevPos.y;

      lastMouseRef.current = nextPos;
      targetPosRef.current = nextPos;
      lastMoveAtRef.current = performance.now();

      if (!readyRef.current) {
        readyRef.current = true;
        spritePosRef.current = nextPos;
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

      if (modeRef.current !== "click") setModeWithReset("walk");
    };

    const onMouseDown = () => {
      const cfg = configRef.current;
      const dur = totalDurationMs(cfg.click.durations);
      clickUntilRef.current = performance.now() + dur;
      setModeWithReset("click", true);
    };

    const tick = (ts: number) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min(ts - lastTsRef.current, 40);
      lastTsRef.current = ts;

      const nowMs = performance.now();
      const inactiveFor = nowMs - lastMoveAtRef.current;
      const target = targetPosRef.current;
      const sprite = spritePosRef.current;
      const followAlpha = 1 - Math.exp(-dt / 40);

      const nextSprite = {
        x: sprite.x + (target.x - sprite.x) * followAlpha,
        y: sprite.y + (target.y - sprite.y) * followAlpha,
      };

      if (
        Math.abs(nextSprite.x - sprite.x) > 0.01 ||
        Math.abs(nextSprite.y - sprite.y) > 0.01
      ) {
        spritePosRef.current = nextSprite;
        setSpritePos(nextSprite);
      }

      if (modeRef.current === "click" && nowMs >= clickUntilRef.current) {
        if (inactiveFor >= SLEEP_AFTER_MS) setModeWithReset("sleep");
        else if (inactiveFor >= IDLE_AFTER_MS) setModeWithReset("idle");
        else setModeWithReset("walk");
      } else if (modeRef.current !== "click") {
        if (inactiveFor >= SLEEP_AFTER_MS) setModeWithReset("sleep");
        else if (inactiveFor >= IDLE_AFTER_MS) setModeWithReset("idle");
        else setModeWithReset("walk");
      }

      const cfg = configRef.current;
      const animMap: Record<Mode, AnimConfig> = {
        walk: cfg.walk,
        idle: cfg.idle,
        sleep: cfg.sleep,
        click: cfg.click,
      };
      const current = animMap[modeRef.current];
      frameElapsedRef.current += dt;
      let nextFrame = frameRef.current;
      let changed = false;

      while (frameElapsedRef.current >= current.durations[nextFrame] * TICK_MS) {
        frameElapsedRef.current -= current.durations[nextFrame] * TICK_MS;

        if (modeRef.current === "click") {
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
      root.classList.remove("pokemon-cursor");
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!ready) return null;

  const cfg = POKEMON_CONFIGS[selectedPokemon];
  const animMap: Record<Mode, AnimConfig> = {
    walk: cfg.walk,
    idle: cfg.idle,
    sleep: cfg.sleep,
    click: cfg.click,
  };
  const anim = animMap[mode];
  const scale = cfg.scale;
  const width = anim.frameWidth * scale;
  const height = anim.frameHeight * scale;
  const row = anim.rows === 1 ? 0 : dirRow;
  const bgX = -(frame * anim.frameWidth * scale);
  const bgY = -(row * anim.frameHeight * scale);

  return (
    <div
      aria-hidden="true"
      className={spawning ? "pokemon-spawning" : undefined}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        transform: `translate3d(${spritePos.x - width * cfg.anchorX}px, ${spritePos.y - height * cfg.anchorY}px, 0)`,
        width,
        height,
        pointerEvents: "none",
        zIndex: 80,
        backgroundImage: `url(${anim.src})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${anim.frameWidth * anim.durations.length * scale}px ${anim.frameHeight * anim.rows * scale}px`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        imageRendering: "pixelated",
      }}
    />
  );
}
