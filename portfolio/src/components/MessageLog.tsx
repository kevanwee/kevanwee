"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { activityFresh, ago, loadActivity, readActivity, type Activity, type ActivityLine } from '@/lib/activity';
// Styles: app/globals.css (the Mystery Dungeon dialogue box).

const TYPE_MS = 28;
const QUIET_LINE: ActivityLine = { mood: 'Normal', when: '', parts: [['text', "It's quiet in the dungeon today..."]] };

function stillMotion() {
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  catch { return false; }
}

/** Recent activity as a Mystery Dungeon dialogue box: Diancie's portrait, then each line typed out in turn.
 *  Click or press Enter on the box to replay it, as you'd press A in the game. */
export default function MessageLog() {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [shown, setShown] = useState(0);
  const [round, setRound] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLUListElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let live = true;
    const refresh = () => {
      if (document.hidden || activityFresh(readActivity())) return;
      loadActivity().then(next => { if (live) setActivity(next); }, () => { /* keep what we have */ });
    };
    const cached = readActivity(); if (cached) setActivity(cached.activity);
    refresh();
    document.addEventListener('visibilitychange', refresh);
    return () => { live = false; document.removeEventListener('visibilitychange', refresh); };
  }, []);

  const lines = activity?.lines.length ? activity.lines : [QUIET_LINE];
  const rendered = useMemo(() => lines.map(line => ({
    ...line, parts: [...line.parts, ...(line.when ? [['faint', `  · ${ago(line.when)}`] as [string, string]] : [])] as [string, string][],
  })), [lines]);
  const total = rendered.reduce((sum, line) => sum + line.parts.reduce((s, [, t]) => s + t.length, 0), 0);
  const label = rendered.map(line => line.parts.map(([, t]) => t).join('')).join('. ');

  useEffect(() => {
    if (stillMotion()) { setShown(total); return; }
    setShown(0);
    const timer = setInterval(() => setShown(n => { if (n >= total) { clearInterval(timer); return n; } return n + 1; }), TYPE_MS);
    return () => clearInterval(timer);
  }, [total, round, label]);

  // The box keeps one height: as the text types past the bottom it slides up, like the game's text box.
  // It moves by transform, never by scrolling: a scroll event would close Telegram's message preview.
  const overflow = () => Math.max(0, (content.current?.offsetHeight ?? 0) - (viewport.current?.clientHeight ?? 0));
  useEffect(() => { setOffset(shown === 0 ? 0 : overflow()); }, [shown]);
  // Once done, the wheel (or ↑/↓ while focused) reads back through earlier lines; at either end the page scrolls as usual.
  useEffect(() => {
    const box = viewport.current;
    if (!box) return;
    const wheel = (event: WheelEvent) => setOffset(current => {
      const next = Math.min(overflow(), Math.max(0, current + event.deltaY));
      if (next !== current) event.preventDefault();
      return next;
    });
    box.addEventListener('wheel', wheel, { passive: false });
    return () => box.removeEventListener('wheel', wheel);
  }, []);

  let budget = shown;
  const done = shown >= total;
  const mood = lines[0]?.mood ?? 'Normal';
  return <div className="pmd-log" data-done={done || undefined}>
    <div className="pmd-portrait"><img src={`/pmd/diancie-${mood}.png`} alt="" width={80} height={80} /></div>
    <div className="pmd-box" role="button" tabIndex={0} aria-label={`${activity?.speaker ?? 'Diancie'}: ${label}. Replay`}
      onClick={() => setRound(r => r + 1)} onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRound(r => r + 1); }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); setOffset(o => Math.min(overflow(), Math.max(0, o + (e.key === 'ArrowDown' ? 20 : -20)))); }
      }}>
      <p className="pmd-speaker">{activity?.speaker ?? 'Diancie'}<span>:</span></p>
      <div ref={viewport} className="pmd-lines">
      <ul ref={content} aria-hidden="true" style={{ transform: `translateY(${-offset}px)` }}>
        {rendered.map((line, i) => <li key={i}>
          {line.parts.map(([kind, text], j) => {
            const visible = text.slice(0, Math.max(0, budget)); budget -= text.length;
            return visible ? <span key={j} className={`pmd-${kind}`}>{visible}</span> : null;
          })}
        </li>)}
      </ul>
      </div>
      <span className="pmd-arrow" aria-hidden="true" />
    </div>
  </div>;
}
