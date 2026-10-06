// Explorer Rank: Pokémon Mystery Dungeon: Explorers of Sky's ladder, with all-time GitHub contributions as the
// points (a rank never drops, as in the game). The README (build_pmdui.py) and the portfolio share these rules.
export const ALL_TIME_URL = 'https://github-contributions-api.jogruber.de/v4/kevanwee?y=all';
export const EXPLORER_CACHE = 'kevanwee.explorer';
const FRESH_FOR = 6 * 60 * 60 * 1000;

/** Rank, points needed, badge (public/pmd/ranks). Super reuses the Diamond badge, as in the game. */
export const RANKS: [string, number, string][] = [
  ['Normal', 0, 'td-Normal'], ['Bronze', 100, 'td-Bronze'], ['Silver', 300, 'td-Silver'], ['Gold', 1600, 'td-Gold'],
  ['Diamond', 3200, 'td-Diamond'], ['Super', 5000, 'td-Diamond'], ['Ultra', 7500, 'td-Ultra'], ['Hyper', 10500, 'td-Hyper'],
  ['Master', 13500, 'td-Master'], ['Master ★', 17000, 'eos-Master-1'], ['Master ★★', 21000, 'eos-Master-2'],
  ['Master ★★★', 25000, 'eos-Master-3'], ['Guildmaster', 100000, 'eos-Guildmaster'],
];

export interface Rank { name: string; badge: string; next: string | null; needed: number | null; progress: number }
export function rankOf(points: number): Rank {
  let i = 0;
  RANKS.forEach(([, need], k) => { if (points >= need) i = k; });
  const [name, need, badge] = RANKS[i];
  if (i + 1 >= RANKS.length) return { name, badge, next: null, needed: null, progress: 1 };
  const [next, nextNeed] = RANKS[i + 1];
  return { name, badge, next, needed: nextNeed, progress: (points - need) / (nextNeed - need) };
}

/** Sum the per-year totals from the public calendar mirror. */
export function allTime(body: unknown): number | null {
  const total = (body as { total?: Record<string, unknown> } | null)?.total;
  if (!total || typeof total !== 'object') return null;
  const values = Object.values(total).map(Number).filter(n => Number.isFinite(n) && n >= 0);
  return values.length ? values.reduce((a, b) => a + b, 0) : null;
}

type Cached = { at: number; points: number };
export function readExplorer(): Cached | null {
  try {
    const value = JSON.parse(localStorage.getItem(EXPLORER_CACHE) || 'null') as Cached | null;
    return value && typeof value.at === 'number' && typeof value.points === 'number' ? value : null;
  } catch { return null; }
}
export const explorerFresh = (cached: Cached | null, now = Date.now()) => !!cached && now - cached.at < FRESH_FOR;

export async function loadPoints(fetcher: typeof fetch = fetch, now = Date.now()): Promise<number> {
  const response = await fetcher(ALL_TIME_URL);
  if (!response.ok) throw new Error(`contributions unavailable (${response.status})`);
  const points = allTime(await response.json());
  if (points === null) throw new Error('contributions were malformed');
  try { localStorage.setItem(EXPLORER_CACHE, JSON.stringify({ at: now, points })); } catch { /* storage blocked */ }
  return points;
}
