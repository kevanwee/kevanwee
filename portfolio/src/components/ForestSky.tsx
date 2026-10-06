"use client";
import { useAnimationVisibility } from '@/lib/useAnimationVisibility';

import { useEffect, useState, type CSSProperties } from 'react';
import { isFresh, LABELS, loadSky, rainLayers, rainTile, readCache, settle, tintsFor, type Sky } from '@/lib/forest-sky';

// Styles live in app/globals.css ("The forest's sky").
const motionPreference = () => matchMedia('(prefers-reduced-motion: reduce)');

const CLEAR_DAY: Sky = { phase: 'day', kind: 'clear', intensity: 0, forecast: '', source: 'none', fetchedAt: 0 };
const FIREFLIES = [[.25, .55], [.62, .38], [.78, .7], [.4, .8], [.15, .3], [.55, .62], [.86, .25]];

/** The current sky, refreshed every five minutes while the tab is visible (the phase can change without a fetch). */
export function useForestSky() {
  // Server render and first paint agree on a clear day; the browser's sky arrives straight after.
  const [sky, setSky] = useState<Sky>(CLEAR_DAY);
  useEffect(() => {
    let live = true;
    const cachedSky = readCache(); if (cachedSky) setSky(settle(cachedSky));
    const refresh = () => {
      if (document.hidden) return;
      const cached = readCache();
      if (isFresh(cached)) { setSky(settle(cached!)); return; }
      loadSky().then(next => { if (live) setSky(next); });
    };
    refresh();
    const timer = setInterval(refresh, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', refresh);
    return () => { live = false; clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  return sky;
}

/** Weather and time-of-day layers over the forest, Mystery Dungeon style. Clicks pass through. */
export default function ForestSky({ sky, label = true }: { sky: Sky; label?: boolean }) {
  const animationRef = useAnimationVisibility<HTMLDivElement>();
  const [still, setStill] = useState(false);
  useEffect(() => {
    const motion = motionPreference(), update = () => setStill(motion.matches);
    update(); motion.addEventListener('change', update);
    return () => motion.removeEventListener('change', update);
  }, []);
  const { phase, kind, intensity } = sky;
  const fireflies = (phase === 'night' || phase === 'dusk') && kind !== 'rain' && kind !== 'storm' ? FIREFLIES.slice(0, phase === 'night' ? 7 : 3) : [];
  return <div ref={animationRef} className="forest-sky" data-phase={phase} data-kind={kind} data-still={still || undefined} aria-hidden="true">
    {tintsFor(sky).map(([colour, opacity, blend], i) =>
      <span key={`t${i}`} className="forest-tint" style={{ background: colour, opacity, mixBlendMode: blend as CSSProperties['mixBlendMode'] }} />)}
    {(kind === 'cloudy' || kind === 'rain' || kind === 'storm') && <span className="forest-clouds" style={{ opacity: kind === 'cloudy' ? .16 : .22 }} />}
    {(kind === 'rain' || kind === 'storm') && rainLayers(intensity).map(([opacity, seconds, width], depth) =>
      <span key={`r${depth}`} className="forest-rain" style={{ opacity, backgroundImage: rainTile(depth, width), animationDuration: `${seconds}s` }} />)}
    {kind === 'storm' && <span className="forest-lightning" />}
    {kind === 'fog' && <>
      <span className="forest-fog" style={{ opacity: .42 + .12 * intensity }} />
      <span className="forest-fog back" style={{ opacity: .3 + .1 * intensity }} />
    </>}
    {kind === 'windy' && <span className="forest-wind" />}
    {fireflies.map(([x, y], i) => <span key={`f${i}`} className="forest-firefly"
      style={{ left: `${x * 100}%`, top: `${y * 100}%`, animationDuration: `${9 + i * 1.7}s, ${2.4 + i * .37}s`, animationDelay: `${-i * 1.3}s, ${-i * .4}s` }} />)}
    {label && <span className="forest-sky-label">{LABELS[kind]} · {phase}</span>}
  </div>;
}
