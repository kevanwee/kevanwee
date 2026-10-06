"use client";

import { useEffect, useMemo, useState } from 'react';
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

  let budget = shown;
  const done = shown >= total;
  const mood = lines[0]?.mood ?? 'Normal';
  return <div className="pmd-log" data-done={done || undefined}>
    <div className="pmd-portrait"><img src={`/pmd/diancie-${mood}.png`} alt="" width={80} height={80} /></div>
    <div className="pmd-box" role="button" tabIndex={0} aria-label={`${activity?.speaker ?? 'Diancie'}: ${label}. Replay`}
      onClick={() => setRound(r => r + 1)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRound(r => r + 1); } }}>
      <p className="pmd-speaker">{activity?.speaker ?? 'Diancie'}<span>:</span></p>
      <ul aria-hidden="true">
        {rendered.map((line, i) => <li key={i}>
          {line.parts.map(([kind, text], j) => {
            const visible = text.slice(0, Math.max(0, budget)); budget -= text.length;
            return visible ? <span key={j} className={`pmd-${kind}`}>{visible}</span> : null;
          })}
        </li>)}
      </ul>
      <span className="pmd-arrow" aria-hidden="true" />
    </div>
  </div>;
}
