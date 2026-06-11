// Build a multi-stop driving route URL for Google Maps.
// Each "stop" is a free-text place name; we geocode via OpenStreetMap
// Nominatim (no key, biased to Mangystau by appending region+country).
// The final URL uses Google Maps Directions API URL scheme with waypoints.

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'

async function geocode(name) {
  const q = /mangystau|mangistau|kazakhstan/i.test(name)
    ? name
    : `${name}, Mangystau, Kazakhstan`
  const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=0`
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'IzMangystauBot/1.0 (https://iz-psi.vercel.app)',
      'Accept-Language': 'en,ru,kk',
    },
  })
  if (!res.ok) return null
  const data = await res.json()
  const top = Array.isArray(data) ? data[0] : null
  if (!top) return null
  const lat = Number(top.lat)
  const lon = Number(top.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return { name, lat, lon, display: String(top.display_name || name) }
}

export async function buildMultiStopRoute(origin, stops) {
  const cleanStops = stops
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .slice(0, 9) // Google Maps URL allows up to 9 waypoints + destination
  if (!cleanStops.length) return null

  const geocoded = []
  for (const s of cleanStops) {
    const g = await geocode(s)
    if (g) geocoded.push(g)
  }
  if (!geocoded.length) return null

  const destination = geocoded[geocoded.length - 1]
  const waypoints = geocoded.slice(0, -1)

  const originParam =
    origin && Number.isFinite(origin.lat) && Number.isFinite(origin.lon)
      ? `&origin=${origin.lat},${origin.lon}`
      : ''
  const waypointParam = waypoints.length
    ? `&waypoints=${encodeURIComponent(
        waypoints.map((w) => `${w.lat},${w.lon}`).join('|'),
      )}`
    : ''
  const destParam = `&destination=${destination.lat},${destination.lon}`

  const url = `https://www.google.com/maps/dir/?api=1${originParam}${waypointParam}${destParam}&travelmode=driving`

  return {
    url,
    stops: geocoded.map((g) => ({ name: g.name, display: g.display, lat: g.lat, lon: g.lon })),
  }
}
