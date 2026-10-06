// Castform's 24-hour forecast: NEA's twenty-four-hour forecast for Singapore's central region, each period
// mapped onto the forest sky's kinds (forest-sky.ts) and drawn over Thunder Meadow, Castform's friend area in
// Red/Blue Rescue Team. The README (build_pmdui.py) and the portfolio share these rules.
import { weatherOf, type Kind, type Phase } from '@/lib/forest-sky';

export const FORECAST_URL = 'https://api-open.data.gov.sg/v2/real-time/api/twenty-four-hr-forecast';
export const FORECAST_CACHE = 'kevanwee.forecast';
const FRESH_FOR = 30 * 60 * 1000;
export const REGION = 'central';

export interface Period { label: string; phase: Phase; kind: Kind; intensity: number; text: string }
export interface Forecast { periods: Period[]; summary: string }

const sgDate = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore' }).format(date); // YYYY-MM-DD
const sgHour = (iso: string) => Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Singapore', hour: '2-digit', hourCycle: 'h23' }).format(new Date(iso)));

/** "Tonight", "Tomorrow morning", "Today afternoon"… in Singapore time. */
export function periodLabel(start: string, now = new Date()): { label: string; phase: Phase } {
  const day = sgDate(new Date(start)), today = sgDate(now), tomorrow = sgDate(new Date(now.getTime() + 864e5));
  const name = day === today ? 'Today' : day === tomorrow ? 'Tomorrow' : new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Singapore', weekday: 'short' }).format(new Date(start));
  const hour = sgHour(start);
  if (hour >= 18 || hour < 6) return { label: day === today ? 'Tonight' : `${name} night`, phase: 'night' };
  return { label: `${name} ${hour < 12 ? 'morning' : 'afternoon'}`, phase: 'day' };
}

type Raw = { data?: { records?: { general?: { temperature?: { low: number; high: number }; relativeHumidity?: { low: number; high: number };
  wind?: { direction: string; speed?: { low: number; high: number } } }; periods?: { timePeriod?: { start: string }; regions?: Record<string, { text?: string }> }[] }[] } };

/** The API's shape → periods for the strip. Anything malformed is skipped rather than shown. */
export function parseForecast(body: unknown, now = new Date()): Forecast | null {
  const record = (body as Raw)?.data?.records?.[0];
  if (!record?.periods?.length) return null;
  const periods = record.periods.slice(0, 4).flatMap(p => {
    const text = p.regions?.[REGION]?.text, start = p.timePeriod?.start;
    if (typeof text !== 'string' || typeof start !== 'string' || Number.isNaN(Date.parse(start))) return [];
    const { label, phase } = periodLabel(start, now);
    let [kind, intensity] = weatherOf(text);
    if (kind === 'sunny' && phase === 'night') kind = 'clear';
    return [{ label, phase, kind, intensity, text }];
  });
  if (!periods.length) return null;
  const g = record.general, parts: string[] = [];
  if (g?.temperature) parts.push(`${g.temperature.low}–${g.temperature.high}°C`);
  if (g?.relativeHumidity) parts.push(`humidity ${g.relativeHumidity.low}–${g.relativeHumidity.high}%`);
  if (g?.wind?.speed) parts.push(`wind ${g.wind.direction} ${g.wind.speed.low}–${g.wind.speed.high} km/h`);
  return { periods, summary: [...parts, 'NEA'].join(' · ') };
}

type Cached = { at: number; body: unknown };
export function readForecast(): Cached | null {
  try {
    const value = JSON.parse(localStorage.getItem(FORECAST_CACHE) || 'null') as Cached | null;
    return value && typeof value.at === 'number' ? value : null;
  } catch { return null; }
}
export const forecastFresh = (cached: Cached | null, now = Date.now()) => !!cached && now - cached.at < FRESH_FOR;

export async function loadForecast(fetcher: typeof fetch = fetch, now = new Date()): Promise<Forecast> {
  const response = await fetcher(FORECAST_URL);
  if (!response.ok) throw new Error(`forecast unavailable (${response.status})`);
  const body = await response.json();
  const forecast = parseForecast(body, now);
  if (!forecast) throw new Error('forecast was malformed');
  try { localStorage.setItem(FORECAST_CACHE, JSON.stringify({ at: now.getTime(), body })); } catch { /* storage blocked */ }
  return forecast;
}

/** Castform's form for each kind of weather (PMD Sprite Collab sheets in public/pmd/castform). */
export const CASTFORM_FORM: Partial<Record<Kind, 'sunny' | 'rainy'>> = { sunny: 'sunny', rain: 'rainy', storm: 'rainy' };
