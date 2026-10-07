/** The attribution each weather source's licence asks for, shown beside its data.
 *  NEA (data.gov.sg): Singapore Open Data Licence v1.0, a notice naming the dataset with a link to the licence.
 *  Open-Meteo: CC BY 4.0, a "Weather data by Open-Meteo.com" link next to where its data appears.
 *  Voracity (src/pokemon/WeatherCredit.tsx) and the README use the same wording. */
export const OPEN_DATA_LICENCE = 'https://data.gov.sg/open-data-licence';

const day = (at: number) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Singapore', day: 'numeric', month: 'short', year: 'numeric' }).format(at);

export default function WeatherCredit({ source, dataset, at, className }: {
  source: 'NEA' | 'Open-Meteo' | 'none'; dataset: string; at?: number; className?: string;
}) {
  if (source === 'Open-Meteo') return <p className={className} data-weather-credit="open-meteo">
    <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Weather data by Open-Meteo.com</a>
    {' '}(<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>)
  </p>;
  if (source !== 'NEA') return null;
  return <p className={className} data-weather-credit="nea">
    Contains information from NEA's {dataset}{at ? ` accessed on ${day(at)}` : ''} from data.gov.sg, made available under the
    {' '}<a href={OPEN_DATA_LICENCE} target="_blank" rel="noopener noreferrer">Singapore Open Data Licence v1.0</a>.
  </p>;
}
