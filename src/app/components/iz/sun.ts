// Real sunset / golden-hour computation (Sunrise equation, NOAA-style).
// No mock data — this is computed live from today's date for the given coords.

const MANGYSTAU = { lat: 43.65, lng: 51.16, tz: 5 }; // Aktau, Mangystau region (UTC+5)

function dayOfYear(date: Date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const diff = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start;
  return Math.floor(diff / 86400000);
}

/** Local clock time (decimal hours) of sunset for the given location/date. */
function sunsetDecimal(lat: number, lng: number, tz: number, date: Date): number | null {
  const rad = Math.PI / 180;
  const N = dayOfYear(date);
  const zenith = 90.833 * rad;
  const lngHour = lng / 15;

  const t = N + (18 - lngHour) / 24; // sunset approximation
  const M = 0.9856 * t - 3.289;
  let L = M + 1.916 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 282.634;
  L = ((L % 360) + 360) % 360;

  let RA = Math.atan(0.91764 * Math.tan(L * rad)) / rad;
  RA = ((RA % 360) + 360) % 360;
  RA += Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90;
  RA /= 15;

  const sinDec = 0.39782 * Math.sin(L * rad);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH = (Math.cos(zenith) - sinDec * Math.sin(lat * rad)) / (cosDec * Math.cos(lat * rad));
  if (cosH > 1 || cosH < -1) return null;

  const H = Math.acos(cosH) / rad / 15;
  const T = H + RA - 0.06571 * t - 6.622;
  let UT = ((T - lngHour) % 24 + 24) % 24;
  return ((UT + tz) % 24 + 24) % 24;
}

function fmt(dec: number): string {
  let h = Math.floor(dec);
  let m = Math.round((dec - h) * 60);
  if (m === 60) { m = 0; h = (h + 1) % 24; }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Today's golden-hour window for Mangystau, computed live. */
export function goldenHour(date = new Date()): { start: string; sunset: string; minutesAway: number } {
  const set = sunsetDecimal(MANGYSTAU.lat, MANGYSTAU.lng, MANGYSTAU.tz, date);
  if (set == null) return { start: "—", sunset: "—", minutesAway: 0 };

  const startDec = (set - 50 / 60 + 24) % 24; // golden hour ~50 min before sunset
  // minutes from "now" (in Mangystau local time) until golden hour starts
  const nowUtc = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const nowLocal = ((nowUtc + MANGYSTAU.tz) % 24 + 24) % 24;
  let minutesAway = Math.round((startDec - nowLocal) * 60);
  if (minutesAway < -120) minutesAway += 24 * 60; // wrap to tomorrow

  return { start: fmt(startDec), sunset: fmt(set), minutesAway };
}
