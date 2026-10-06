"use client";

import { useEffect, useRef, useState } from 'react';
import ForestSky from '@/components/ForestSky';
import PmdSprite, { type PmdAnim } from '@/components/PmdSprite';
import castform from '@/data/castform.json';
import { CASTFORM_FORM, forecastFresh, loadForecast, parseForecast, readForecast, type Forecast } from '@/lib/forecast';
import { facing, MEADOW, pickTarget, START, VIEW, type Point } from '@/lib/meadow';
// Styles: app/globals.css (Mystery Dungeon UI cards).

const motionPreference = () => matchMedia('(prefers-reduced-motion: reduce)');

type Form = 'normal' | 'sunny' | 'rainy';
const FORMS = castform as Record<Form, { idle: PmdAnim; walk: PmdAnim }>;
const SPEED = 22; // meadow pixels a second
const at = (p: Point) => ({ left: `${(p.x - VIEW.x) / VIEW.w * 100}%`, top: `${(p.y - VIEW.y) / VIEW.h * 100}%` });

/** Castform wandering Thunder Meadow: it walks in straight lines to random spots on the grass, around the tree
 *  in the middle (never onto it), and rests a moment at each. It stands still under reduced motion. */
function RoamingCastform({ form }: { form: Form }) {
  const node = useRef<HTMLSpanElement>(null);
  const [pose, setPose] = useState({ walking: false, row: 0 });
  useEffect(() => {
    const motion = motionPreference();
    let pos = { ...START }, target: Point | null = null, restUntil = 0, last = 0, raf = 0, row = 0, walking = false;
    const place = () => Object.assign(node.current?.style ?? {}, at(pos));
    const show = (w: boolean, r: number) => { if (w !== walking || r !== row) { walking = w; row = r; setPose({ walking: w, row: r }); } };
    const tick = (now: number) => {
      const dt = last ? Math.min(.1, (now - last) / 1000) : 0;
      last = now;
      if (!target && now >= restUntil) target = pickTarget(pos);
      if (target) {
        const dx = target.x - pos.x, dy = target.y - pos.y, dist = Math.hypot(dx, dy), step = SPEED * dt;
        if (dist <= step) { pos = target; target = null; restUntil = now + 1200 + Math.random() * 2600; show(false, row); }
        else { pos = { x: pos.x + dx / dist * step, y: pos.y + dy / dist * step }; show(true, facing(dx, dy)); }
        place();
      }
      raf = requestAnimationFrame(tick);
    };
    const run = () => {
      cancelAnimationFrame(raf); last = 0;
      if (motion.matches || document.hidden) {
        if (motion.matches) { pos = { ...START }; target = null; place(); show(false, 0); }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    place(); run();
    document.addEventListener('visibilitychange', run);
    motion.addEventListener('change', run);
    return () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', run); motion.removeEventListener('change', run); };
  }, []);
  const anim = pose.walking ? FORMS[form].walk : FORMS[form].idle;
  return <span ref={node} className="pmd-castform" data-walking={pose.walking || undefined} style={at(START)}>
    <PmdSprite anim={anim} size={30} row={pose.row} />
  </span>;
}

/** Castform's 24-hour forecast for Singapore, one period at a time (the arrows step through them): a window onto
 *  Thunder Meadow, Castform's friend area, with Castform in the period's form and the period's weather over it. */
export default function WeatherForecast() {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    let live = true;
    const cached = readForecast(); if (cached) setForecast(parseForecast(cached.body));
    if (!forecastFresh(readForecast())) loadForecast().then(f => { if (live) setForecast(f); }, () => { /* keep the cached forecast */ });
    return () => { live = false; };
  }, []);
  const periods = forecast?.periods ?? [];
  const shown = Math.min(index, Math.max(0, periods.length - 1));
  const period = periods[shown];
  const step = (by: number) => setIndex(Math.max(0, Math.min(periods.length - 1, shown + by)));
  const view = {
    backgroundSize: `${MEADOW.w / VIEW.w * 100}% auto`,
    backgroundPosition: `${VIEW.x / (MEADOW.w - VIEW.w) * 100}% ${VIEW.y / (MEADOW.h - VIEW.h) * 100}%`,
    aspectRatio: `${VIEW.w} / ${VIEW.h}`,
  };
  return <div className="pmd-card pmd-forecast" data-state={forecast ? 'ready' : 'loading'}>
    <div className="pmd-forecast-head">
      <p className="pmd-speaker">Castform<span>: here's the weather for Singapore</span></p>
      {forecast && <p className="pmd-note">{forecast.summary}</p>}
    </div>
    {period ? <div className="pmd-period" data-kind={period.kind} data-phase={period.phase}
      onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); step(e.key === 'ArrowLeft' ? -1 : 1); } }}>
      <div className="pmd-period-nav">
        <button type="button" className="pmd-step" aria-label="Earlier period" disabled={shown === 0} onClick={() => step(-1)}>
          <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M7 1 2 5l5 4z" /></svg>
        </button>
        <p className="pmd-period-label" aria-live="polite">{period.label}<span className="pmd-period-count"> · {shown + 1}/{periods.length}</span></p>
        <button type="button" className="pmd-step" aria-label="Later period" disabled={shown === periods.length - 1} onClick={() => step(1)}>
          <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M3 1l5 4-5 4z" /></svg>
        </button>
      </div>
      <div className="pmd-window" style={view}>
        <RoamingCastform form={CASTFORM_FORM[period.kind] ?? 'normal'} />
        <ForestSky sky={{ phase: period.phase, kind: period.kind, intensity: period.intensity, forecast: period.text, source: 'NEA', fetchedAt: 0 }} label={false} />
      </div>
      <p className="pmd-period-text">{period.text}</p>
    </div> : <p className="pmd-note">Asking Castform…</p>}
  </div>;
}
