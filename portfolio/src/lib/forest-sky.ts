// The Eevee forest's sky: Singapore's time of day and NEA's 2-hour weather forecast, drawn the way
// Pokémon Mystery Dungeon does (palette shifts for dawn, dusk and night; diagonal rain; lightning;
// drifting fog; cloud shadows). Voracity (src/pokemon/forest-sky.ts) and the GitHub profile README
// (genpokemon/readme_art/sky.py) share these rules and colours, so all three forests show the same sky.
export type Phase = 'dawn' | 'day' | 'dusk' | 'night';
export type Kind = 'clear' | 'sunny' | 'cloudy' | 'rain' | 'storm' | 'fog' | 'windy';
export interface Sky { phase: Phase; kind: Kind; intensity: number; forecast: string; source: 'NEA' | 'Open-Meteo' | 'none'; fetchedAt: number }

export const AREA = 'City'; // NEA forecast area; "City" covers the CBD and SMU
const NEA = 'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast';
const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast?latitude=1.2966&longitude=103.8500&current=weather_code&timezone=Asia%2FSingapore';
export const CACHE_KEY = 'kevanwee.forest-sky';
const FRESH_FOR = 15 * 60 * 1000;

/** Minutes past midnight in Singapore, whatever the device's time zone. */
export function singaporeMinutes(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Singapore', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value ?? 0);
  return get('hour') * 60 + get('minute');
}

/** Dawn 06:30–08:00, day, dusk 17:30–19:30, night (Singapore's sun barely moves through the year). */
export function phaseAt(date = new Date()): Phase {
  const m = singaporeMinutes(date);
  if (m >= 390 && m < 480) return 'dawn';
  if (m >= 480 && m < 1050) return 'day';
  if (m >= 1050 && m < 1170) return 'dusk';
  return 'night';
}

/** NEA forecast text → kind and intensity (1 light – 3 heavy). */
export function weatherOf(forecast: string): [Kind, number] {
  const f = (forecast || '').toLowerCase();
  if (f.includes('thunder')) return ['storm', f.includes('heavy') ? 3 : 2];
  if (['rain', 'shower', 'drizzle'].some(w => f.includes(w)))
    return ['rain', f.includes('heavy') ? 3 : f.includes('light') || f.includes('passing') || f.includes('drizzle') ? 1 : 2];
  if (['haz', 'mist', 'fog'].some(w => f.includes(w))) return ['fog', f.includes('haz') && !f.includes('slightly') ? 2 : 1];
  if (f.includes('wind')) return ['windy', 1];
  if (f.includes('cloud') || f.includes('overcast')) return ['cloudy', f.startsWith('cloudy') ? 2 : 1];
  if (f.includes('warm') || f.includes('sunny')) return ['sunny', 1];
  return ['clear', 0];
}

/** Open-Meteo's WMO weather code → kind and intensity, the fallback when NEA can't be reached. */
export function weatherOfWmo(code: number): [Kind, number] {
  if ([95, 96, 99].includes(code)) return ['storm', 2];
  if ([51, 53, 55, 56, 57, 61, 80].includes(code)) return ['rain', 1];
  if ([63, 81].includes(code)) return ['rain', 2];
  if ([65, 66, 67, 82].includes(code)) return ['rain', 3];
  if ([45, 48].includes(code)) return ['fog', 1];
  if (code === 2 || code === 3) return ['cloudy', code === 2 ? 1 : 2];
  return ['clear', 0];
}

/** Sunshine only shows in daylight. */
export function settle(sky: Sky, date = new Date()): Sky {
  const phase = phaseAt(date);
  return { ...sky, phase, kind: sky.kind === 'sunny' && phase !== 'day' ? 'clear' : sky.kind };
}

export function readCache(): Sky | null {
  try {
    const sky = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') as Sky | null;
    return sky && typeof sky.fetchedAt === 'number' && sky.kind ? sky : null;
  } catch { return null; }
}
const writeCache = (sky: Sky) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(sky)); } catch { /* storage blocked */ } };
export const isFresh = (sky: Sky | null, now = Date.now()) => !!sky && now - sky.fetchedAt < FRESH_FOR;

/** The current sky: NEA first, Open-Meteo if that fails, and a plain clear sky if neither answers. */
export async function loadSky(fetcher: typeof fetch = fetch, date = new Date()): Promise<Sky> {
  const base = { phase: phaseAt(date), fetchedAt: date.getTime() };
  try {
    const response = await fetcher(NEA);
    if (!response.ok) throw new Error(String(response.status));
    const body = await response.json() as { data?: { items?: { forecasts?: { area: string; forecast: string }[] }[] } };
    const forecast = body.data?.items?.[0]?.forecasts?.find(f => f.area === AREA)?.forecast;
    if (!forecast) throw new Error('no forecast for ' + AREA);
    const [kind, intensity] = weatherOf(forecast);
    const sky = settle({ ...base, kind, intensity, forecast, source: 'NEA' }, date);
    writeCache(sky); return sky;
  } catch { /* fall back */ }
  try {
    const response = await fetcher(OPEN_METEO);
    if (!response.ok) throw new Error(String(response.status));
    const code = Number(((await response.json()) as { current?: { weather_code?: number } }).current?.weather_code);
    const [kind, intensity] = weatherOfWmo(code);
    const sky = settle({ ...base, kind, intensity, forecast: `WMO ${code}`, source: 'Open-Meteo' }, date);
    writeCache(sky); return sky;
  } catch {
    return settle({ ...base, kind: 'clear', intensity: 0, forecast: '', source: 'none' }, date);
  }
}

// ---- Drawing: the same colours as sky.py ----
type Tint = [colour: string, opacity: number, blend: string];
export const PHASE_TINT: Record<Phase, Tint[]> = {
  dawn: [['#ffb4a0', .22, 'soft-light'], ['#ffd2b4', .14, 'screen']],
  day: [],
  dusk: [['#ff8a4c', .38, 'multiply'], ['#ffb35c', .24, 'soft-light'], ['#6a3d9a', .08, 'multiply']],
  night: [['#1f2d78', .62, 'multiply'], ['#3a4fb5', .10, 'screen']],
};
export const WEATHER_TINT: Partial<Record<Kind, Tint[]>> = {
  sunny: [['#fff1b0', .18, 'screen']],
  cloudy: [['#9aa3ad', .30, 'multiply']],
  rain: [['#7f8ea3', .34, 'multiply']],
  storm: [['#5d6a80', .46, 'multiply']],
  fog: [['#e8ecef', .30, 'screen']],
};
export const LABELS: Record<Kind, string> = { clear: 'Clear', sunny: 'Sunny', cloudy: 'Cloudy', rain: 'Rain', storm: 'Thunderstorm', fog: 'Fog', windy: 'Windy' };
export const tintsFor = (sky: Pick<Sky, 'phase' | 'kind'>) => [...PHASE_TINT[sky.phase], ...(sky.kind === 'sunny' && sky.phase !== 'day' ? [] : WEATHER_TINT[sky.kind] ?? [])];
/** Rain depths: [opacity, seconds per fall, stroke width]. */
export const rainLayers = (intensity: number): [number, number, number][] =>
  ({ 1: [[.55, .95, 1]], 2: [[.5, .95, 1], [.8, .6, 1.2]], 3: [[.55, .9, 1], [.85, .55, 1.2], [.7, .42, 1.4]] } as Record<number, [number, number, number][]>)[Math.min(3, Math.max(1, intensity))];

/** The rain tile from sky.py, as a CSS background (32 × 48, three diagonal streaks). */
export function rainTile(depth: number, width: number) {
  const lines = [[6 + depth * 7, 2, 2 + depth * 7, 13], [22 - depth * 3, 20, 18 - depth * 3, 31], [30 - depth * 5, 36, 26 - depth * 5, 47]]
    .map(([x1, y1, x2, y2]) => `<line x1='${x1}' y1='${y1}' x2='${x2}' y2='${y2}'/>`).join('');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='48'><g stroke='%23d8ecff' stroke-width='${width}' stroke-linecap='round'>${lines}</g></svg>`;
  return `url("data:image/svg+xml,${svg}")`;
}
