// Recent activity for the Mystery Dungeon dialogue box. The GitHub profile README's workflow builds it
// every two hours (genpokemon/readme_art/build_log.py → readme/art/activity.json): pushes, merges and
// new repos, with private repos named only when allowlisted (Voracity). The portfolio reads the same
// file, so all three logs show the same lines.
export const ACTIVITY_URL = 'https://raw.githubusercontent.com/kevanwee/kevanwee/main/readme/art/activity.json';
export const ACTIVITY_CACHE = 'kevanwee.activity';
const FRESH_FOR = 10 * 60 * 1000;

export type PartKind = 'text' | 'name' | 'place' | 'number';
export interface ActivityLine { mood: string; when: string; parts: [PartKind, string][] }
export interface Activity { generatedAt: string; speaker: string; lines: ActivityLine[] }
const MOODS = new Set(['Normal', 'Happy', 'Joyous', 'Inspired']);

/** Keep only well-formed lines: the file is data from another repository. */
export function parseActivity(body: unknown): Activity | null {
  const raw = body as Partial<Activity> | null;
  if (!raw || !Array.isArray(raw.lines)) return null;
  const lines = raw.lines.flatMap(line => {
    if (!line || typeof line.when !== 'string' || !Array.isArray(line.parts)) return [];
    const parts = line.parts.filter((p): p is [PartKind, string] =>
      Array.isArray(p) && ['text', 'name', 'place', 'number'].includes(p[0]) && typeof p[1] === 'string');
    return parts.length ? [{ mood: MOODS.has(line.mood) ? line.mood : 'Normal', when: line.when, parts }] : [];
  });
  return { generatedAt: String(raw.generatedAt ?? ''), speaker: typeof raw.speaker === 'string' ? raw.speaker : 'Diancie', lines: lines.slice(0, 4) };
}

/** "just now", "3h ago", "yesterday", "4 days ago" (calendar days in Singapore). */
export function ago(when: string, now = new Date()) {
  const then = new Date(when), hours = Math.floor((now.getTime() - then.getTime()) / 3600e3);
  const day = (d: Date) => new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Singapore' })).setHours(0, 0, 0, 0);
  const days = Math.round((day(now) - day(then)) / 864e5);
  if (hours < 1) return 'just now';
  if (days === 0) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

type Cached = { at: number; activity: Activity };
export function readActivity(): Cached | null {
  try {
    const value = JSON.parse(localStorage.getItem(ACTIVITY_CACHE) || 'null') as Cached | null;
    return value && typeof value.at === 'number' && value.activity ? value : null;
  } catch { return null; }
}
export const activityFresh = (cached: Cached | null, now = Date.now()) => !!cached && now - cached.at < FRESH_FOR;

export async function loadActivity(fetcher: typeof fetch = fetch, now = Date.now()): Promise<Activity> {
  const response = await fetcher(ACTIVITY_URL, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`activity unavailable (${response.status})`);
  const activity = parseActivity(await response.json());
  if (!activity) throw new Error('activity was malformed');
  try { localStorage.setItem(ACTIVITY_CACHE, JSON.stringify({ at: now, activity })); } catch { /* storage blocked */ }
  return activity;
}
