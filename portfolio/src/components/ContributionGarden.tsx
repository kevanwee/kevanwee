"use client";

import { useEffect, useMemo, useState, type PointerEvent } from 'react';
import { isFresh, isoDate, loadContributions, monthLabels, PROFILE_LOGIN, readCache, rgbHue, stats, toWeeks, type Calendar, type Day } from '@/lib/contributions';
// Styles: app/globals.css (Contributions).

const number = new Intl.NumberFormat('en');
const plural = (count: number, word: string) => `${number.format(count)} ${word}${count === 1 ? '' : 's'}`;
const longDate = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
export const describeDay = (day: Day) => `${day.count ? plural(day.count, 'contribution') : 'No contributions'} on ${longDate(day.date)}`;

/** A blank year in the same shape, so the panel doesn't jump when the data arrives. */
function blankYear(): Day[] {
  const today = new Date(), days: Day[] = [];
  for (let i = 364; i >= 0; i--) days.push({ date: isoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)), count: 0, level: 0 });
  return days;
}

/** GitHub's contribution year, as two half-year beds under the Eevee forest (side by side when there's room). */
export default function ContributionGarden() {
  // A blank year on the server and first paint; the cached or fetched year arrives in the browser.
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [failed, setFailed] = useState(false);
  const [hover, setHover] = useState<Day | null>(null);

  useEffect(() => {
    let live = true;
    const refresh = () => {
      if (document.hidden || isFresh(readCache())) return;
      loadContributions().then(next => { if (live) { setCalendar(next); setFailed(false); } }, () => { if (live) setFailed(true); });
    };
    const cached = readCache(); if (cached) setCalendar(cached);
    refresh();
    document.addEventListener('visibilitychange', refresh);
    return () => { live = false; document.removeEventListener('visibilitychange', refresh); };
  }, []);

  const days = useMemo(() => calendar?.days.length ? calendar.days : blankYear(), [calendar]);
  const { bands, width, byDate, summary } = useMemo(() => {
    const weeks = toWeeks(days), split = Math.ceil(weeks.length / 2);
    return { bands: [weeks.slice(0, split), weeks.slice(split)], width: split, byDate: new Map(days.map(day => [day.date, day])), summary: stats(days) };
  }, [days]);
  const login = calendar?.login || PROFILE_LOGIN, today = isoDate(new Date());
  const caption = hover ? describeDay(hover)
    : calendar ? `${plural(calendar.total, 'contribution')} in the last year`
    : failed ? "GitHub can't be reached right now." : 'Loading contributions…';

  const point = (event: PointerEvent<HTMLElement>) => {
    const date = (event.target as HTMLElement).dataset?.date;
    setHover(date ? byDate.get(date) ?? null : null);
  };

  return <div className="contributions" data-state={calendar ? 'ready' : failed ? 'failed' : 'loading'}>
    <div className="panel-heading contributions-heading">
      <div><h3>Contributions</h3></div>
      <a href={`https://github.com/${login}`} target="_blank" rel="noreferrer" aria-label={`${login} on GitHub`}>{login} <span aria-hidden="true">↗</span></a>
    </div>
    <p className="contributions-caption">{caption}</p>
    <div className="contributions-beds" role="img" style={{ ['--weeks' as string]: width }}
      aria-label={calendar ? `${plural(calendar.total, 'contribution')} in the last year; ${summary.streak}-day current streak` : caption}
      onPointerOver={point} onPointerLeave={() => setHover(null)}>
      {bands.map((weeks, band) => <div className="contributions-bed" key={band}>
        <div className="contributions-months" aria-hidden="true">
          {monthLabels(weeks, band < bands.length - 1).map(({ column, label }) => <span key={column} style={{ gridColumn: `${column + 1} / span 3` }}>{label}</span>)}
        </div>
        <div className="contributions-grid" aria-hidden="true">
          {weeks.map((week, column) => <span className="contributions-week" key={column} style={{ ['--column' as string]: column + band * width }}>
            {week.map((day, row) => day
              ? <span key={day.date} className="contributions-cell" data-level={day.level} data-date={day.date} data-today={day.date === today || undefined} title={describeDay(day)}
                  style={{ ['--h' as string]: rgbHue(column + band * width, row, width * 2) }} />
              : <span key={`pad-${row}`} className="contributions-cell" data-empty="" />)}
          </span>)}
        </div>
      </div>)}
    </div>
    <div className="contributions-foot">
      <span>
        {calendar && summary.streak > 0 && <span>{summary.streak}-day streak</span>}
        {calendar && summary.best && <span title={describeDay(summary.best)}>Best day {number.format(summary.best.count)}</span>}
      </span>
      <span className="contributions-legend" aria-hidden="true">
        Less{([0, 1, 2, 3, 4] as const).map(level => <span key={level} className="contributions-cell" data-level={level} style={{ ['--h' as string]: rgbHue(40 + level * 3, 3) }} />)}More
      </span>
    </div>
  </div>;
}
