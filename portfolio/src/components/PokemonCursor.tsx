"use client";

import { useEffect, useRef, useState } from "react";
import armarougeCombo from "./fusion-armarouge-combo.json";
import { usePokemonCursor, type FusionId, type PokemonId } from "./PokemonCursorContext";

type Mode = "walk" | "idle" | "sleep" | "click";

export type AnimConfig = {
  src: string;
  frameWidth: number;
  frameHeight: number;
  rows: number;
  durations: number[];
  /** Transparent padding added around the base frame (a fusion's extra hair, say); the anchor ignores it. */
  padX?: number;
  padTop?: number;
  /** Logical base height when a sheet also adds bottom padding. */
  baseFrameHeight?: number;
};

export type PokemonConfig = {
  walk: AnimConfig;
  idle: AnimConfig;
  sleep: AnimConfig;
  click: AnimConfig;
  scale: number;
  anchorX: number;
  anchorY: number;
};

const TICK_MS = 16;
/** How long the pointer must rest before the cursor Pokémon dozes off (owner: 2.6 s was far too quick). */
const SLEEP_AFTER_MS = 8000;
const IDLE_AFTER_MS = 320;

const DIR_S = 0;
const DIR_SW = 1;
const DIR_W = 2;
const DIR_NW = 3;
const DIR_N = 4;
const DIR_NE = 5;
const DIR_E = 6;
const DIR_SE = 7;

export const POKEMON_CONFIGS: Record<PokemonId, PokemonConfig> = {
  // Base Diancie (from the owner's diancie.zip); its Mega form (the long-standing cursor) is in MEGA_CONFIGS.
  diancie: {
    walk:  { src: "/diancie-base/Walk-Anim.png",   frameWidth: 32, frameHeight: 56, rows: 8, durations: [8,8,10,8,10] },
    idle:  { src: "/diancie-base/Idle-Anim.png",   frameWidth: 24, frameHeight: 56, rows: 8, durations: [12,12,12,12,8,8,8,8] },
    sleep: { src: "/diancie-base/Sleep-Anim.png",  frameWidth: 24, frameHeight: 56, rows: 1, durations: [16,12,16,16,12,16] },
    click: { src: "/diancie-base/Attack-Anim.png", frameWidth: 64, frameHeight: 80, rows: 8, durations: [2,4,1,1,1,2,2,2,2,2] },
    scale: 1.3, anchorX: 0.46, anchorY: 0.22,
  },
  ceruledge: {
    walk:  { src: "/ceruledge/Walk-Anim.png",   frameWidth: 32, frameHeight: 56, rows: 8, durations: [10,10,10,10] },
    idle:  { src: "/ceruledge/Idle-Anim.png",   frameWidth: 32, frameHeight: 56, rows: 8, durations: [5,5,5,5,5,5,5,5,5,5,2,3,4,3,2] },
    sleep: { src: "/ceruledge/Sleep-Anim.png",  frameWidth: 24, frameHeight: 48, rows: 1, durations: [30,35] },
    click: { src: "/ceruledge/Attack-Anim.png", frameWidth: 64, frameHeight: 80, rows: 8, durations: [2,2,6,1,1,2,2,2,2,2,2,2,1,2] },
    scale: 1.3, anchorX: 0.46, anchorY: 0.22,
  },
  greninja: {
    walk:  { src: "/greninja/Walk-Anim.png",   frameWidth: 32, frameHeight: 48, rows: 8, durations: [8,10,8,10] },
    idle:  { src: "/greninja/Idle-Anim.png",   frameWidth: 32, frameHeight: 56, rows: 8, durations: [40,12,2,3,6,2,4] },
    sleep: { src: "/greninja/Sleep-Anim.png",  frameWidth: 24, frameHeight: 40, rows: 1, durations: [30,35] },
    click: { src: "/greninja/Attack-Anim.png", frameWidth: 64, frameHeight: 72, rows: 8, durations: [2,2,6,1,2,2,2,2,2,2,1,2] },
    scale: 1.3, anchorX: 0.46, anchorY: 0.22,
  },
  latios: {
    walk:  { src: "/latios/Walk-Anim.png",   frameWidth: 64, frameHeight: 80, rows: 8, durations: [4,4,4,4,4,4,4,4,4,4,4,4] },
    idle:  { src: "/latios/Idle-Anim.png",   frameWidth: 64, frameHeight: 80, rows: 8, durations: [8,8,8,8,8,8] },
    sleep: { src: "/latios/Sleep-Anim.png",  frameWidth: 48, frameHeight: 32, rows: 1, durations: [30,35] },
    click: { src: "/latios/Attack-Anim.png", frameWidth: 80, frameHeight: 80, rows: 8, durations: [2,2,6,1,1,1,2,2,2,2,2] },
    // 80px fH × 1.25 = 100px
    scale: 1.25, anchorX: 0.5, anchorY: 0.3,
  },
  latias: {
    walk:  { src: "/latias/Walk-Anim.png",   frameWidth: 48, frameHeight: 64, rows: 8, durations: [4,4,4,4,4,4,4,4,4,4,4,4,4,4] },
    idle:  { src: "/latias/Idle-Anim.png",   frameWidth: 48, frameHeight: 64, rows: 8, durations: [8,8,8,8,8,8] },
    sleep: { src: "/latias/Sleep-Anim.png",  frameWidth: 40, frameHeight: 32, rows: 1, durations: [30,35] },
    click: { src: "/latias/Attack-Anim.png", frameWidth: 72, frameHeight: 72, rows: 8, durations: [2,2,6,1,1,1,2,2,2,2,2] },
    // 64px fH × 1.5 = 96px
    scale: 1.5, anchorX: 0.5, anchorY: 0.3,
  },
  // Shiny Dragonite (the green resident sheets); its shiny Mega form is in MEGA_CONFIGS.
  dragonite: {
    walk:  { src: "/overworld/dragonite/Walk-Anim.png",   frameWidth: 40, frameHeight: 56, rows: 8, durations: [8,12,8,12] },
    idle:  { src: "/overworld/dragonite/Idle-Anim.png",   frameWidth: 40, frameHeight: 64, rows: 8, durations: [40,2,2,3,3,2,2] },
    sleep: { src: "/overworld/dragonite/Sleep-Anim.png",  frameWidth: 32, frameHeight: 40, rows: 1, durations: [30,35] },
    click: { src: "/overworld/dragonite/Attack-Anim.png", frameWidth: 72, frameHeight: 80, rows: 8, durations: [2,4,1,1,1,2,2,2,2,2,2,2,2] },
    scale: 1.3, anchorX: 0.46, anchorY: 0.22,
  },
  ironvaliant: {
    walk:  { src: "/ironvaliant/Walk-Anim.png",     frameWidth: 24, frameHeight: 48, rows: 8, durations: [12,12,12,12] },
    idle:  { src: "/ironvaliant/Twirl-Anim.png",    frameWidth: 88, frameHeight: 80, rows: 8, durations: [2,2,2,2,2,2,2,2,2,3,3,3,2,2,2,2] },
    sleep: { src: "/ironvaliant/Sleep-Anim.png",    frameWidth: 32, frameHeight: 32, rows: 1, durations: [60,6,35,6] },
    click: { src: "/ironvaliant/SpAttack-Anim.png", frameWidth: 56, frameHeight: 80, rows: 8, durations: [2,6,2,2,2,2,2,2] },
    scale: 1.3, anchorX: 0.5, anchorY: 0.22,
  },
};

/** Soul Unison forms: Ceruledge's frames and timing, built by scripts/build-fusion.py. */
const fused = (folder: string, padX = 0, padTop = 0): PokemonConfig => {
  const base = POKEMON_CONFIGS.ceruledge;
  const swap = (anim: AnimConfig) => ({ ...anim, src: anim.src.replace("/ceruledge/", `/fusion/${folder}/`),
    frameWidth: anim.frameWidth + 2 * padX, frameHeight: anim.frameHeight + padTop, padX, padTop });
  return { ...base, walk: swap(base.walk), idle: swap(base.idle), sleep: swap(base.sleep), click: swap(base.click) };
};
/** Mega Evolutions (F): Mega Diancie (default), shiny Mega Latias/Latios from the owner's archives, Mega
 *  Greninja and shiny Mega Dragonite from the owner's sheets. */
export const MEGA_CONFIGS: Partial<Record<PokemonId, PokemonConfig>> = {
  // Mega Diancie: the long-standing Diancie cursor, its default form.
  diancie: {
    walk:  { src: "/diancie/Walk-Anim.png",   frameWidth: 56, frameHeight: 88,  rows: 8, durations: [4,4,4,4,4,4,4,4,4] },
    idle:  { src: "/diancie/Idle-Anim.png",   frameWidth: 64, frameHeight: 88,  rows: 8, durations: [16,12,16,12] },
    sleep: { src: "/diancie/Sleep-Anim.png",  frameWidth: 48, frameHeight: 80,  rows: 1, durations: [14,13,12,16,14,13,12,16] },
    click: { src: "/diancie/Strike-Anim.png", frameWidth: 88, frameHeight: 144, rows: 8, durations: [2,2,6,1,1,2,2,6,1,2,2,2,2,2] },
    scale: 1.15, anchorX: 0.46, anchorY: 0.22,
  },
  // Shiny Mega Dragonite (Dratini blues, purple fins); attack from build-mega-dragonite-attack.py.
  dragonite: {
    walk:  { src: "/overworld/shiny-mega-dragonite/Walk-Anim.png",   frameWidth: 104, frameHeight: 84, rows: 8, durations: [8,12,8,12] },
    idle:  { src: "/overworld/shiny-mega-dragonite/Idle-Anim.png",   frameWidth: 104, frameHeight: 84, rows: 8, durations: [60] },
    sleep: { src: "/overworld/shiny-mega-dragonite/Sleep-Anim.png",  frameWidth: 104, frameHeight: 84, rows: 1, durations: [60] },
    click: { src: "/overworld/shiny-mega-dragonite/Attack-Anim.png", frameWidth: 104, frameHeight: 84, rows: 8, durations: [3,3,6,8,3,3] },
    // Anchored like base Dragonite (pointer 28 px above the feet, same offset from the body's
    // centre), not by the frame: the tall ear wings made the old anchor sit too high.
    scale: 1.15, anchorX: 0.483, anchorY: 0.542,
  },
  greninja: {
    walk:  { src: "/overworld/mega-greninja/Walk-Anim.png",   frameWidth: 88, frameHeight: 80, rows: 8, durations: [6,6,6,6] },
    idle:  { src: "/overworld/mega-greninja/Idle-Anim.png",   frameWidth: 88, frameHeight: 80, rows: 1, durations: [10,8,10,8] },
    sleep: { src: "/overworld/mega-greninja/Sleep-Anim.png",  frameWidth: 88, frameHeight: 80, rows: 1, durations: [60] },
    click: { src: "/overworld/mega-greninja/Attack-Anim.png", frameWidth: 88, frameHeight: 80, rows: 8, durations: [3,4,10,4] },
    scale: 1.2, anchorX: 0.5, anchorY: 0.3,
  },
  latias: {
    walk:  { src: "/mega/latias/Walk-Anim.png",   frameWidth: 72, frameHeight: 72, rows: 8, durations: [4,4,4,4,4,4,4,4,4,4,4,4] },
    idle:  { src: "/mega/latias/Idle-Anim.png",   frameWidth: 72, frameHeight: 72, rows: 8, durations: [8,8,8,8,8,8] },
    sleep: { src: "/mega/latias/Sleep-Anim.png",  frameWidth: 64, frameHeight: 32, rows: 1, durations: [30,35] },
    click: { src: "/mega/latias/Attack-Anim.png", frameWidth: 88, frameHeight: 80, rows: 8, durations: [2,2,6,1,1,1,2,2,2,2,2] },
    scale: 1.5, anchorX: 0.5, anchorY: 0.3,
  },
  latios: {
    walk:  { src: "/mega/latios/Walk-Anim.png",   frameWidth: 80, frameHeight: 80, rows: 8, durations: [4,4,4,4,4,4,4,4,4,4,4,4] },
    idle:  { src: "/mega/latios/Idle-Anim.png",   frameWidth: 80, frameHeight: 80, rows: 8, durations: [8,8,8,8,8,8] },
    sleep: { src: "/mega/latios/Sleep-Anim.png",  frameWidth: 72, frameHeight: 32, rows: 1, durations: [30,35] },
    click: { src: "/mega/latios/Attack-Anim.png", frameWidth: 96, frameHeight: 88, rows: 8, durations: [2,2,6,1,1,1,2,2,2,2,2] },
    scale: 1.25, anchorX: 0.5, anchorY: 0.3,
  },
};

export const FUSION_CONFIGS: Record<FusionId, PokemonConfig> = {
  armarouge: { ...fused("ceruledge-armarouge"), click: armarougeCombo },
  // Darkrai's shadow arms and hair overhang Ceruledge's frame: 8px either side and on top
  // (build-fusion-darkrai.py).
  darkrai: fused("ceruledge-darkrai", 8, 8),
  // Shiny Zygarde (Complete Forme): build-fusion-zygarde.py.
  zygarde: fused("ceruledge-zygarde", 6),
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
  const { selectedPokemon, fusion, fusing, mega } = usePokemonCursor();
  const configFor = (pokemon: PokemonId, partner: FusionId | null, isMega = mega) =>
    partner ? FUSION_CONFIGS[partner] : (isMega && MEGA_CONFIGS[pokemon]) || POKEMON_CONFIGS[pokemon];

  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");
  const [frame, setFrame] = useState(0);
  const [dirRow, setDirRow] = useState(DIR_S);
  const [spritePos, setSpritePos] = useState({ x: 0, y: 0 });
  const [spawning, setSpawning] = useState(false);

  const pokemonRef = useRef<PokemonId>(selectedPokemon);
  const configRef = useRef<PokemonConfig>(configFor(selectedPokemon, fusion));
  // Fusion changes can change frame count and duration (slash + cannon), so reset playback.
  useEffect(() => {
    configRef.current = configFor(selectedPokemon, fusion);
    modeRef.current = "idle";
    frameRef.current = 0;
    frameElapsedRef.current = 0;
    clickRemainingMsRef.current = 0;
    setMode("idle");
    setFrame(0);
  }, [selectedPokemon, fusion, mega]);

  const modeRef = useRef<Mode>("idle");
  const frameRef = useRef(0);
  const frameElapsedRef = useRef(0);
  const lastTsRef = useRef(0);
  const lastMoveAtRef = useRef(0);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const targetPosRef = useRef({ x: 0, y: 0 });
  const spritePosRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const clickRemainingMsRef = useRef(0);
  const dirRowRef = useRef(DIR_S);
  const readyRef = useRef(false);
  const rafRef = useRef(0);

  // Handle pokemon switching
  useEffect(() => {
    if (pokemonRef.current !== selectedPokemon) {
      pokemonRef.current = selectedPokemon;
      configRef.current = configFor(selectedPokemon, fusion);
      // Reset animation state
      modeRef.current = "idle";
      frameRef.current = 0;
      frameElapsedRef.current = 0;
      clickRemainingMsRef.current = 0;
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
      if (modeRef.current !== "click" && nextDir !== dirRowRef.current) {
        dirRowRef.current = nextDir;
        setDirRow(nextDir);
      }

      if (modeRef.current !== "click") setModeWithReset("walk");
    };

    const onMouseDown = () => {
      const cfg = configRef.current;
      const dur = totalDurationMs(cfg.click.durations);
      clickRemainingMsRef.current = dur;
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

      // Use the same elapsed time as frame playback, so slow frames cannot cut off the cannon.
      if (modeRef.current === "click") clickRemainingMsRef.current -= dt;
      if (modeRef.current === "click" && clickRemainingMsRef.current <= 0) {
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
          else break;
          continue;
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

  const cfg = configFor(selectedPokemon, fusion);
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
  // The anchor sits on the base frame, so padding (fusions) never shifts the sprite.
  const padX = anim.padX ?? 0, padTop = anim.padTop ?? 0;
  const anchorX = ((anim.frameWidth - 2 * padX) * cfg.anchorX + padX) * scale;
  const anchorY = ((anim.baseFrameHeight ?? anim.frameHeight - padTop) * cfg.anchorY + padTop) * scale;
  const bgX = -(frame * anim.frameWidth * scale);
  const bgY = -(row * anim.frameHeight * scale);

  return (
    <div
      aria-hidden="true"
      data-pokemon-cursor={selectedPokemon}
      data-fusion={fusion ?? undefined}
      data-mega={mega || undefined}
      data-mode={mode}
      data-frame={frame}
      className={[spawning && "pokemon-spawning", fusion && "pokemon-fused"].filter(Boolean).join(" ") || undefined}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        transform: `translate3d(${spritePos.x - anchorX}px, ${spritePos.y - anchorY}px, 0)`,
        width,
        height,
        pointerEvents: "none",
        zIndex: 80,
        backgroundImage: `url(${anim.src})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${anim.frameWidth * anim.durations.length * scale}px ${anim.frameHeight * anim.rows * scale}px`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        imageRendering: "pixelated",
        visibility: fusing ? "hidden" : undefined,
      }}
    />
  );
}
