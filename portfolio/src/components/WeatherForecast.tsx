"use client";

import { useEffect, useState } from 'react';
import ForestSky from '@/components/ForestSky';
import PmdSprite, { type PmdAnim } from '@/components/PmdSprite';
import castform from '@/data/castform.json';
import { CASTFORM_FORM, forecastFresh, loadForecast, MEADOW_VIEWS, parseForecast, readForecast, type Forecast } from '@/lib/forecast';
// Styles: app/globals.css (Mystery Dungeon UI cards).

const FORMS = castform as Record<'normal' | 'sunny' | 'rainy', PmdAnim>;
const MEADOW = { w: 456, h: 335 };

/** Castform's 24-hour forecast for Singapore: one window per period onto Thunder Meadow (Castform's friend area),
 *  Castform in the matching form, and the period's weather drawn with the forest's sky. */
export default function WeatherForecast() {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  useEffect(() => {
    let live = true;
    const cached = readForecast(); if (cached) setForecast(parseForecast(cached.body));
    if (!forecastFresh(readForecast())) loadForecast().then(f => { if (live) setForecast(f); }, () => { /* keep the cached forecast */ });
    return () => { live = false; };
  }, []);
  return <div className="pmd-card pmd-forecast" data-state={forecast ? 'ready' : 'loading'}>
    <div className="pmd-forecast-head">
      <p className="pmd-speaker">Castform<span>: here's the weather for Singapore</span></p>
      {forecast && <p className="pmd-note">{forecast.summary}</p>}
    </div>
    {forecast ? <ol className="pmd-periods">
      {forecast.periods.map((period, i) => {
        const [vx, vy, vw, vh] = MEADOW_VIEWS[i % MEADOW_VIEWS.length];
        const view = {
          backgroundSize: `${MEADOW.w / vw * 100}% auto`,
          backgroundPosition: `${vx / (MEADOW.w - vw) * 100}% ${vy / (MEADOW.h - vh) * 100}%`,
          aspectRatio: `${vw} / ${vh}`,
        };
        return <li key={i} className="pmd-period" data-kind={period.kind} data-phase={period.phase}>
          <div className="pmd-window" style={view}>
            <span className="pmd-castform" style={{ animationDelay: `${-i * .5}s` }}>
              <PmdSprite anim={FORMS[CASTFORM_FORM[period.kind] ?? 'normal']} size={30} />
            </span>
            <ForestSky sky={{ phase: period.phase, kind: period.kind, intensity: period.intensity, forecast: period.text, source: 'NEA', fetchedAt: 0 }} label={false} />
            <span className="pmd-period-label">{period.label}</span>
          </div>
          <p className="pmd-period-text">{period.text}</p>
        </li>;
      })}
    </ol> : <p className="pmd-note">Asking Castform…</p>}
  </div>;
}
