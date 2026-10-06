// The year of GitHub contributions under the Eevee forest, from the free public mirror of the profile
// calendar (no key, CORS-enabled), cached for an hour. Ported from Voracity's contributions.ts; the pastel
// wave's colours (in globals.css) are shared with Voracity and the README garden.

export const PROFILE_LOGIN = 'kevanwee';
export const CACHE_KEY = 'kevanwee.contributions';
const FRESH_FOR = 60 * 60 * 1000;
const PUBLIC_API = 'https://github-contributions-api.jogruber.de/v4/';

export type Level = 0 | 1 | 2 | 3 | 4;
export interface Day { date: string; count: number; level: Level }
export interface Calendar { login: string; total: number; days: Day[]; fetchedAt: number }

type Raw = Record<string, any>;
const LEVELS: Record<string, Level> = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const toLevel = (value: unknown): Level => { const n = Number(value); return n >= 0 && n <= 4 ? Math.floor(n) as Level : 0; };

/** GraphQL `contributionCalendar` → days, oldest first. */
export function fromGraphQL(calendar: Raw): Pick<Calendar, 'total' | 'days'> {
  const days = ((calendar?.weeks ?? []) as Raw[]).flatMap(week => (week.contributionDays ?? []) as Raw[])
    .filter(day => DATE.test(day.date))
    .map(day => ({ date: day.date as string, count: Math.max(0, Number(day.contributionCount) || 0), level: LEVELS[day.contributionLevel] ?? 0 }));
  return { total: Number(calendar?.totalContributions) || days.reduce((sum, day) => sum + day.count, 0), days };
}

/** Public mirror (`?y=last`) → days, oldest first. It can include days after today; drop them. */
export function fromPublic(body: Raw, today = isoDate(new Date())): Pick<Calendar, 'total' | 'days'> {
  const days = ((body?.contributions ?? []) as Raw[]).filter(day => DATE.test(day.date) && day.date <= today)
    .map(day => ({ date: day.date as string, count: Math.max(0, Number(day.count) || 0), level: toLevel(day.level) }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return { total: Number(body?.total?.lastYear) || days.reduce((sum, day) => sum + day.count, 0), days };
}

export function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
const weekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();

/** Sunday-first week columns, like GitHub's: the first column is padded with nulls above. */
export function toWeeks(days: Day[]): (Day | null)[][] {
  const weeks: (Day | null)[][] = [];
  for (const day of days) {
    const column = weekday(day.date);
    if (!weeks.length || column === 0) weeks.push(Array(weeks.length ? 0 : column).fill(null));
    weeks[weeks.length - 1].push(day);
  }
  return weeks;
}

/** Month labels for a run of weeks, where the month changes. A label that would crowd the
 *  previous one is dropped, unless the previous one is only the band's leading sliver; so is
 *  one in the band's last column when another band follows and labels it anyway. */
export function monthLabels(weeks: (Day | null)[][], followed = false, minGap = 3) {
  const labels: { column: number; label: string }[] = [];
  let previous = '';
  weeks.forEach((week, column) => {
    const first = week.find(Boolean);
    if (!first || first.date.slice(0, 7) === previous || (followed && column === weeks.length - 1)) return;
    previous = first.date.slice(0, 7);
    const label = { column, label: new Date(`${first.date}T00:00:00Z`).toLocaleString('en', { month: 'short', timeZone: 'UTC' }) };
    const last = labels[labels.length - 1];
    if (last && column - last.column < minGap) { if (last.column === 0) labels[labels.length - 1] = label; return; }
    labels.push(label);
  });
  return labels;
}

/** Current streak (today may still be empty) and the busiest day. */
export function stats(days: Day[]) {
  let streak = 0, best: Day | null = null;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) streak++;
    else if (i !== days.length - 1) break;
  }
  for (const day of days) if (!best || day.count > best.count) best = day;
  return { streak, best: best && best.count > 0 ? best : null, active: days.filter(day => day.count > 0).length };
}

export function readCache(): Calendar | null {
  try {
    const value = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') as Calendar | null;
    return value && Array.isArray(value.days) && typeof value.fetchedAt === 'number' ? value : null;
  } catch { return null; }
}
function writeCache(calendar: Calendar) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(calendar)); } catch { /* storage full or blocked */ }
}
export const isFresh = (calendar: Calendar | null, now = Date.now()) => !!calendar && now - calendar.fetchedAt < FRESH_FOR;

export async function loadContributions(fetcher: typeof fetch = fetch, now = Date.now()): Promise<Calendar> {
  const response = await fetcher(`${PUBLIC_API}${PROFILE_LOGIN}?y=last`);
  if (!response.ok) throw new Error(`GitHub contributions unavailable (${response.status})`);
  const calendar = { login: PROFILE_LOGIN, ...fromPublic(await response.json(), isoDate(new Date(now))), fetchedAt: now };
  if (!calendar.days.length) throw new Error('GitHub contributions were empty');
  writeCache(calendar);
  return calendar;
}

