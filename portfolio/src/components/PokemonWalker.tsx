"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const BASE = "https://raw.githubusercontent.com/kevanwee/pmdsvgworld/main/assets/sprites";

// PMD SpriteCollab direction rows: S=0 SW=1 W=2 NW=3 N=4 NE=5 E=6 SE=7
const DIR_E = 6;
const DIR_W = 2;
const DIR_S = 0; // sleep uses south-facing
const NUM_DIR = 8;
const SCALE = 3;

const DIANCIE = {
  walk:   { src: `${BASE}/0719/0001/Walk-Anim.png`,   fw: 56, fh: 88,  frames: 9,  ms: 110 },
  attack: { src: `${BASE}/0719/0001/Attack-Anim.png`, fw: 80, fh: 104, frames: 14, ms: 85  },
  strike: { src: `${BASE}/0719/0001/Strike-Anim.png`, fw: 88, fh: 144, frames: 14, ms: 85  },
  sleep:  { src: `${BASE}/0719/0001/Sleep-Anim.png`,  fw: 48, fh: 80,  frames: 8,  ms: 220 },
} as const;

const CERULEDGE = {
  walk:   { src: `${BASE}/0937/0000/0001/Walk-Anim.png`,   fw: 32, fh: 56, frames: 4,  ms: 110 },
  attack: { src: `${BASE}/0937/0000/0001/Attack-Anim.png`, fw: 64, fh: 80, frames: 14, ms: 85  },
  strike: { src: `${BASE}/0937/0000/0001/Strike-Anim.png`, fw: 72, fh: 88, frames: 9,  ms: 85  },
  sleep:  { src: `${BASE}/0937/0000/0001/Sleep-Anim.png`,  fw: 24, fh: 48, frames: 2,  ms: 400 },
} as const;

type AnimKey = keyof typeof DIANCIE;
type Phase = "roam" | "spar" | "cooldown" | "sleep";
type AnyCfg = Record<AnimKey, { src: string; fw: number; fh: number; frames: number; ms: number }>;

function isNight() {
  const h = new Date().getHours();
  return h >= 21 || h < 7;
}

interface Visual { x: number; frame: number; dirRow: number; anim: AnimKey; }
interface Body  { x: number; vx: number; }

const WALK_SPD      = 0.04; // px/ms
const SPAR_DURATION = 3200; // ms
const SPAR_EDGE_GAP = 8;    // px between sprite edges to trigger spar
const COOLDOWN_MS   = 1800;
const MARGIN        = 8;

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

  const night = isNight();
  const phase    = useRef<Phase>(night ? "sleep" : "roam");
  const sparMs   = useRef(0);
  const lastTs   = useRef(0);
  const rafId    = useRef(0);
  const dBody    = useRef<Body>({ x: MARGIN, vx: WALK_SPD });
  const cBody    = useRef<Body>({ x: 0,      vx: -WALK_SPD });

  const dFTs = useRef(0); const dFr = useRef(0); const dLastX = useRef(0);
  const cFTs = useRef(0); const cFr = useRef(0); const cLastX = useRef(0);

  const initAnim: AnimKey = night ? "sleep" : "walk";
  const [dV, setDV] = useState<Visual>({ x: MARGIN, frame: 0, dirRow: DIR_E, anim: initAnim });
  const [cV, setCV] = useState<Visual>({ x: 0,      frame: 0, dirRow: DIR_W, anim: initAnim });

  const dwWalk = DIANCIE.walk.fw * SCALE;
  const cwWalk = CERULEDGE.walk.fw * SCALE;

  const advFrame = useCallback((
    fr: React.MutableRefObject<number>,
    ts: number,
    fts: React.MutableRefObject<number>,
    anim: AnimKey,
    cfg: AnyCfg
  ) => {
    if (ts - fts.current >= cfg[anim].ms) {
      fts.current = ts;
      fr.current = (fr.current + 1) % cfg[anim].frames;
      return true;
    }
    return false;
  }, []);

  const tick = useCallback((ts: number) => {
    if (!lastTs.current) lastTs.current = ts;
    const dt = Math.min(ts - lastTs.current, 50);
    lastTs.current = ts;

    const d = dBody.current;
    const c = cBody.current;
    const p = phase.current;
    const w = containerRef.current?.clientWidth ?? 0;

    /* ── SLEEP ── */
    if (p === "sleep") {
      if (advFrame(dFr, ts, dFTs, "sleep", DIANCIE))
        setDV(v => ({ ...v, frame: dFr.current, anim: "sleep", dirRow: DIR_S }));
      if (advFrame(cFr, ts, cFTs, "sleep", CERULEDGE))
        setCV(v => ({ ...v, frame: cFr.current, anim: "sleep", dirRow: DIR_S }));
      rafId.current = requestAnimationFrame(tick);
      return;
    }

    /* ── COOLDOWN — walk apart ── */
    if (p === "cooldown") {
      sparMs.current += dt;
      d.x += d.vx * dt;
      c.x += c.vx * dt;
      // clamp to bounds
      d.x = Math.max(MARGIN, Math.min(d.x, w - MARGIN - dwWalk));
      c.x = Math.max(MARGIN, Math.min(c.x, w - MARGIN - cwWalk));

      const dChanged = advFrame(dFr, ts, dFTs, "walk", DIANCIE);
      const cChanged = advFrame(cFr, ts, cFTs, "walk", CERULEDGE);
      if (dChanged || Math.abs(d.x - dLastX.current) > 0.5) {
        dLastX.current = d.x;
        setDV({ x: d.x, frame: dFr.current, anim: "walk", dirRow: d.vx > 0 ? DIR_E : DIR_W });
      }
      if (cChanged || Math.abs(c.x - cLastX.current) > 0.5) {
        cLastX.current = c.x;
        setCV({ x: c.x, frame: cFr.current, anim: "walk", dirRow: c.vx > 0 ? DIR_E : DIR_W });
      }
      if (sparMs.current >= COOLDOWN_MS) {
        phase.current = "roam";
        sparMs.current = 0;
      }
      rafId.current = requestAnimationFrame(tick);
      return;
    }

    /* ── SPAR ── */
    if (p === "spar") {
      sparMs.current += dt;
      // Alternate attack→strike on a timer, offset between the two
      const dAnim: AnimKey = (Math.floor(sparMs.current / 1300) % 2 === 0) ? "attack" : "strike";
      const cAnim: AnimKey = (Math.floor(sparMs.current / 1100) % 2 === 0) ? "strike" : "attack";

      if (advFrame(dFr, ts, dFTs, dAnim, DIANCIE))
        setDV(v => ({ ...v, frame: dFr.current, anim: dAnim }));
      if (advFrame(cFr, ts, cFTs, cAnim, CERULEDGE))
        setCV(v => ({ ...v, frame: cFr.current, anim: cAnim }));

      if (sparMs.current >= SPAR_DURATION) {
        // Enter cooldown — send them apart
        phase.current = "cooldown";
        sparMs.current = 0;
        d.vx = d.x < c.x ? -WALK_SPD : WALK_SPD;
        c.vx = d.x < c.x ?  WALK_SPD : -WALK_SPD;
        dFr.current = 0; cFr.current = 0;
      }
      rafId.current = requestAnimationFrame(tick);
      return;
    }

    /* ── ROAM ── */
    d.x += d.vx * dt;
    c.x += c.vx * dt;

    // wall bounce
    if (d.x <= MARGIN)              { d.x = MARGIN;              d.vx = WALK_SPD;  }
    if (d.x + dwWalk >= w - MARGIN) { d.x = w - MARGIN - dwWalk; d.vx = -WALK_SPD; }
    if (c.x <= MARGIN)              { c.x = MARGIN;              c.vx = WALK_SPD;  }
    if (c.x + cwWalk >= w - MARGIN) { c.x = w - MARGIN - cwWalk; c.vx = -WALK_SPD; }

    // Edge-to-edge proximity — trigger spar when sprite edges nearly touch
    const dRight = d.x + dwWalk;
    const cLeft  = c.x;
    const dLeft  = d.x;
    const cRight = c.x + cwWalk;
    const edgeGap = d.x < c.x
      ? cLeft  - dRight   // ceruledge is to the right
      : dLeft  - cRight;  // diancie is to the right

    if (edgeGap <= SPAR_EDGE_GAP && edgeGap >= -dwWalk) {
      phase.current = "spar";
      sparMs.current = 0;

      // Snap them together — fighting positions
      const dOnLeft = d.x <= c.x;
      const fightCenterX = (d.x + dwWalk / 2 + c.x + cwWalk / 2) / 2;
      const dAttackW = DIANCIE.attack.fw * SCALE;
      const cStrikeW = CERULEDGE.strike.fw * SCALE;

      if (dOnLeft) {
        d.x = fightCenterX - dAttackW - 2;
        c.x = fightCenterX + 2;
      } else {
        c.x = fightCenterX - cStrikeW - 2;
        d.x = fightCenterX + 2;
      }

      dFr.current = 0; cFr.current = 0;
      setDV({ x: d.x, frame: 0, anim: "attack", dirRow: dOnLeft ? DIR_E : DIR_W });
      setCV({ x: c.x, frame: 0, anim: "strike", dirRow: dOnLeft ? DIR_W : DIR_E });
      rafId.current = requestAnimationFrame(tick);
      return;
    }

    const dCh = advFrame(dFr, ts, dFTs, "walk", DIANCIE);
    const cCh = advFrame(cFr, ts, cFTs, "walk", CERULEDGE);
    if (dCh || Math.abs(d.x - dLastX.current) > 0.5) {
      dLastX.current = d.x;
      setDV({ x: d.x, frame: dFr.current, anim: "walk", dirRow: d.vx > 0 ? DIR_E : DIR_W });
    }
    if (cCh || Math.abs(c.x - cLastX.current) > 0.5) {
      cLastX.current = c.x;
      setCV({ x: c.x, frame: cFr.current, anim: "walk", dirRow: c.vx > 0 ? DIR_E : DIR_W });
    }

    rafId.current = requestAnimationFrame(tick);
  }, [advFrame, dwWalk, cwWalk]);

  useEffect(() => {
    if (width === 0) return;
    cBody.current.x = width - MARGIN - cwWalk;
    dBody.current.x = MARGIN;
    dBody.current.vx =  WALK_SPD;
    cBody.current.vx = -WALK_SPD;
    lastTs.current = 0;
    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [width, tick, cwWalk]);

  function renderSprite(v: Visual, cfg: AnyCfg) {
    const a = cfg[v.anim];
    const dw = a.fw * SCALE;
    const dh = a.fh * SCALE;
    const bgX = -(v.frame * a.fw * SCALE);
    const bgY = -(v.dirRow * a.fh * SCALE);
    return (
      <div
        key={v.anim + v.dirRow}
        style={{
          position: "absolute",
          bottom: 0,
          left: v.x,
          width: dw,
          height: dh,
          backgroundImage: `url(${a.src})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${a.fw * a.frames * SCALE}px ${a.fh * NUM_DIR * SCALE}px`,
          backgroundPosition: `${bgX}px ${bgY}px`,
          imageRendering: "pixelated",
        }}
      />
    );
  }

  const maxH = Math.max(DIANCIE.attack.fh, CERULEDGE.attack.fh) * SCALE;

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", height: maxH, overflow: "visible" }}
      aria-hidden="true"
    >
      {width > 0 && (
        <>
          {renderSprite(dV, DIANCIE)}
          {renderSprite(cV, CERULEDGE)}
        </>
      )}
    </div>
  );
}
