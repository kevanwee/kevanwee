"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const BASE = "https://raw.githubusercontent.com/kevanwee/pmdsvgworld/main/assets/sprites";

// PMD direction rows: S=0 SW=1 W=2 NW=3 N=4 NE=5 E=6 SE=7
const DIR_EAST = 6;
const DIR_WEST = 2;
const NUM_DIR  = 8;

const DIANCIE = {
  walk:   { src: `${BASE}/0719/0001/Walk-Anim.png`,   fw: 56, fh: 88,  frames: 9,  ms: 110 },
  attack: { src: `${BASE}/0719/0001/Attack-Anim.png`, fw: 80, fh: 104, frames: 14, ms: 90  },
  strike: { src: `${BASE}/0719/0001/Strike-Anim.png`, fw: 88, fh: 144, frames: 14, ms: 90  },
  sleep:  { src: `${BASE}/0719/0001/Sleep-Anim.png`,  fw: 48, fh: 80,  frames: 8,  ms: 200 },
};

const CERULEDGE = {
  walk:   { src: `${BASE}/0937/0000/0001/Walk-Anim.png`,   fw: 32, fh: 56, frames: 4,  ms: 110 },
  attack: { src: `${BASE}/0937/0000/0001/Attack-Anim.png`, fw: 64, fh: 80, frames: 14, ms: 90  },
  strike: { src: `${BASE}/0937/0000/0001/Strike-Anim.png`, fw: 72, fh: 88, frames: 9,  ms: 90  },
  sleep:  { src: `${BASE}/0937/0000/0001/Sleep-Anim.png`,  fw: 24, fh: 48, frames: 2,  ms: 400 },
};

type AnimKey = keyof typeof DIANCIE;
type ScenePhase = "roam" | "spar" | "sleep";

function isNight() {
  const h = new Date().getHours();
  return h >= 21 || h < 7;
}

interface SpriteVisual {
  x: number;
  frame: number;
  dirRow: number;
  anim: AnimKey;
}

interface SpriteRef {
  x: number;
  vx: number; // velocity px/ms
}

const SCALE = 2;
const WALK_SPEED = 0.035; // px/ms
const SPAR_DURATION = 3000; // ms
const SPAR_GAP = 40; // px gap triggering spar
const MARGIN = 20;

function spriteW(anim: AnimKey, cfg: typeof DIANCIE) {
  return cfg[anim].fw * SCALE;
}

export default function PokemonWalker() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCw(el.clientWidth));
    ro.observe(el);
    setCw(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const night = isNight();
  const phase = useRef<ScenePhase>(night ? "sleep" : "roam");
  const sparTimer = useRef(0);
  const lastTs = useRef(0);
  const rafId = useRef(0);

  // physics refs (no re-render on change)
  const dRef = useRef<SpriteRef>({ x: MARGIN, vx: WALK_SPEED });
  const cRef = useRef<SpriteRef>({ x: 0, vx: -WALK_SPEED });

  // visual state (causes re-renders at frame-tick rate)
  const initAnim: AnimKey = night ? "sleep" : "walk";
  const [dVisual, setDVisual] = useState<SpriteVisual>({ x: MARGIN, frame: 0, dirRow: DIR_EAST, anim: initAnim });
  const [cVisual, setCVisual] = useState<SpriteVisual>({ x: 0,      frame: 0, dirRow: DIR_WEST, anim: initAnim });

  const dFrameTs = useRef(0);
  const cFrameTs = useRef(0);
  const dFrame = useRef(0);
  const cFrame = useRef(0);

  const dLastX = useRef(0);
  const cLastX = useRef(0);

  const tick = useCallback((ts: number) => {
    if (!lastTs.current) lastTs.current = ts;
    const dt = Math.min(ts - lastTs.current, 50);
    lastTs.current = ts;

    if (!containerRef.current) {
      rafId.current = requestAnimationFrame(tick);
      return;
    }

    const width = containerRef.current.clientWidth;
    const dw = spriteW("walk", DIANCIE);
    const cw = spriteW("walk", CERULEDGE);

    const d = dRef.current;
    const c = cRef.current;
    const p = phase.current;

    // advance sprite frames
    const advanceFrame = (
      ref: React.MutableRefObject<number>,
      tsRef: React.MutableRefObject<number>,
      anim: AnimKey,
      cfg: typeof DIANCIE
    ) => {
      if (ts - tsRef.current >= cfg[anim].ms) {
        tsRef.current = ts;
        ref.current = (ref.current + 1) % cfg[anim].frames;
        return true;
      }
      return false;
    };

    let dChanged = false, cChanged = false;

    if (p === "sleep") {
      dChanged = advanceFrame(dFrame, dFrameTs, "sleep", DIANCIE);
      cChanged = advanceFrame(cFrame, cFrameTs, "sleep", CERULEDGE);
      if (dChanged) setDVisual(v => ({ ...v, frame: dFrame.current, anim: "sleep", dirRow: DIR_EAST }));
      if (cChanged) setCVisual(v => ({ ...v, frame: cFrame.current, anim: "sleep", dirRow: DIR_EAST }));
      rafId.current = requestAnimationFrame(tick);
      return;
    }

    if (p === "spar") {
      sparTimer.current += dt;
      // alternate between attack and strike every 14/9 frames
      const dAnim: AnimKey = (Math.floor(sparTimer.current / 1200) % 2 === 0) ? "attack" : "strike";
      const cAnim: AnimKey = (Math.floor(sparTimer.current / 1100) % 2 === 0) ? "strike" : "attack";

      dChanged = advanceFrame(dFrame, dFrameTs, dAnim, DIANCIE);
      cChanged = advanceFrame(cFrame, cFrameTs, cAnim, CERULEDGE);

      if (dChanged) setDVisual(v => ({ ...v, frame: dFrame.current, anim: dAnim, dirRow: DIR_EAST }));
      if (cChanged) setCVisual(v => ({ ...v, frame: cFrame.current, anim: cAnim, dirRow: DIR_WEST }));

      if (sparTimer.current >= SPAR_DURATION) {
        phase.current = "roam";
        sparTimer.current = 0;
        // send them apart
        d.vx = -WALK_SPEED;
        c.vx = WALK_SPEED;
        dFrame.current = 0;
        cFrame.current = 0;
      }
      rafId.current = requestAnimationFrame(tick);
      return;
    }

    // ROAM — move both
    d.x += d.vx * dt;
    c.x += c.vx * dt;

    // bounce
    if (d.x <= MARGIN) { d.x = MARGIN; d.vx = WALK_SPEED; }
    if (d.x + dw >= width - MARGIN) { d.x = width - MARGIN - dw; d.vx = -WALK_SPEED; }
    if (c.x <= MARGIN) { c.x = MARGIN; c.vx = WALK_SPEED; }
    if (c.x + cw >= width - MARGIN) { c.x = width - MARGIN - cw; c.vx = -WALK_SPEED; }

    // proximity check — trigger spar
    const gap = Math.abs((d.x + dw / 2) - (c.x + cw / 2));
    if (gap < SPAR_GAP + dw / 2 + cw / 2) {
      phase.current = "spar";
      sparTimer.current = 0;
      dFrame.current = 0;
      cFrame.current = 0;
      // snap facing
      const dOnLeft = d.x < c.x;
      setDVisual(v => ({ ...v, x: d.x, frame: 0, anim: "attack", dirRow: dOnLeft ? DIR_EAST : DIR_WEST }));
      setCVisual(v => ({ ...v, x: c.x, frame: 0, anim: "strike", dirRow: dOnLeft ? DIR_WEST : DIR_EAST }));
      rafId.current = requestAnimationFrame(tick);
      return;
    }

    dChanged = advanceFrame(dFrame, dFrameTs, "walk", DIANCIE);
    cChanged = advanceFrame(cFrame, cFrameTs, "walk", CERULEDGE);

    if (dChanged || Math.abs(d.x - dLastX.current) > 0.5) {
      dLastX.current = d.x;
      setDVisual({ x: d.x, frame: dFrame.current, anim: "walk", dirRow: d.vx > 0 ? DIR_EAST : DIR_WEST });
    }
    if (cChanged || Math.abs(c.x - cLastX.current) > 0.5) {
      cLastX.current = c.x;
      setCVisual({ x: c.x, frame: cFrame.current, anim: "walk", dirRow: c.vx > 0 ? DIR_EAST : DIR_WEST });
    }

    rafId.current = requestAnimationFrame(tick);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cw === 0) return;
    // init ceruledge on far right
    const cw2 = spriteW("walk", CERULEDGE);
    cRef.current.x = cw - MARGIN - cw2;
    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [cw, tick]);

  function renderSprite(visual: SpriteVisual, cfg: typeof DIANCIE) {
    const animCfg = cfg[visual.anim];
    const displayW = animCfg.fw * SCALE;
    const displayH = animCfg.fh * SCALE;
    const totalW = animCfg.fw * animCfg.frames * SCALE;
    const totalH = animCfg.fh * NUM_DIR * SCALE;
    const bgX = -(visual.frame * animCfg.fw * SCALE);
    const bgY = -(visual.dirRow * animCfg.fh * SCALE);

    return (
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: visual.x,
          width: displayW,
          height: displayH,
          backgroundImage: `url(${animCfg.src})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${totalW}px ${totalH}px`,
          backgroundPosition: `${bgX}px ${bgY}px`,
          imageRendering: "pixelated",
        }}
      />
    );
  }

  const maxH = Math.max(
    DIANCIE.attack.fh * SCALE,
    CERULEDGE.attack.fh * SCALE
  );

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", height: maxH, overflow: "visible" }}
      aria-hidden="true"
    >
      {cw > 0 && (
        <>
          {renderSprite(dVisual, DIANCIE)}
          {renderSprite(cVisual, CERULEDGE)}
        </>
      )}
    </div>
  );
}
