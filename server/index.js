import express from 'express'
import OpenAI from 'openai'
import { z } from 'zod'
import { pickReferences } from './references.js'

const app = express()
app.use(express.json({ limit: '15mb' }))

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:5173',
    'X-Title': 'IZ Mangystau · Lens',
  },
})

const Tip = z.object({ title: z.string(), detail: z.string() })

const Analysis = z.object({
  sightGuess: z.string(),
  confidence: z.number().min(0).max(1),
  pose: z.array(Tip).min(1).max(4),
  angle: z.array(Tip).min(1).max(4),
  light: z.object({
    bestTime: z.string(),
    tips: z.array(Tip).min(1).max(4),
  }),
  caption: z.string(),
  hashtags: z.array(z.string()).min(4).max(10),
})

const SIGHT_CONTEXT = `
Mangystau region of Kazakhstan. Known sights:
- Bozzhyra: white chalk cliffs and karst pinnacles. Best at golden hour from the cliff edge.
- Sherkala Mountain: yurt-shaped massif near Shetpe. Sunrise from east, full silhouette.
- Valley of Balls (Torysh): spherical sandstone concretions. Low sidelight, foreground ball composition.
- Tuzbair: eroded white cliffs over a salt pan. Reflections after rain, blue hour.
- Kyzylkup: rust/cream striped layered hills. Telephoto compression, top-down ridge views.
- Caspian Sea coast around Aktau.
`

const LANG_NAME = { en: 'English', ru: 'Russian', kk: 'Kazakh' }

app.post('/api/analyze', async (req, res) => {
  try {
    const { imageDataUrl, lang } = req.body
    if (!imageDataUrl) return res.status(400).json({ error: 'missing imageDataUrl' })
    const L = (lang === 'en' || lang === 'ru' || lang === 'kk') ? lang : 'ru'
    const langName = LANG_NAME[L]

    const system = `You are a landscape and travel-reel photography coach for the Mangystau region.
You critique the user's photo and direct a more viral version of the same shot.
Be specific, concrete and kind. Use the photographer's vocabulary (composition, light, lens, pose).

LANGUAGE: Respond entirely in ${langName}. Every "title", "detail", "bestTime", and "caption" string MUST be in ${langName}. Keep "sightGuess" as the proper place name (transliterate if needed). Hashtags stay latin-script.

${SIGHT_CONTEXT}

Respond with ONLY valid JSON, no prose, matching this shape exactly:
{
  "sightGuess": "<best guess at the Mangystau location, or 'Mangystau' if unsure>",
  "confidence": <number 0..1>,
  "pose": [ { "title": "<short>", "detail": "<one concrete instruction>" }, ... 1-4 items ],
  "angle": [ { "title": "<short>", "detail": "<lens, framing, height>" }, ... 1-4 items ],
  "light": {
    "bestTime": "<e.g. 19:10–19:55 or 'first light, ~30 min before sunrise'>",
    "tips": [ { "title": "<short>", "detail": "<direction and quality of light>" }, ... 1-4 items ]
  },
  "caption": "<one short, evocative Instagram caption, lowercase, no hashtags>",
  "hashtags": ["#mangystau", "#kazakhstan", ... 4-10 items including the matched sight]
}`

    const completion = await client.chat.completions.create({
      model: 'google/gemini-2.5-flash-lite',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Critique this photo and direct a more viral version. Reply with the JSON only.' },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ],
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const parsed = Analysis.parse(JSON.parse(raw))
    const references = pickReferences(parsed.sightGuess, L)
    res.json({ ...parsed, references })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err?.message ?? 'analysis failed' })
  }
})

/**
 * OpenStreetMap "amenity/tourism/shop" tags Iz is allowed to ask for.
 * Mapping covers the natural categories a traveler asks about. Anything not
 * in the table falls back to "tourist_attraction".
 */
const OSM_TAGS = {
  cafe: ['amenity', 'cafe'],
  restaurant: ['amenity', 'restaurant'],
  fast_food: ['amenity', 'fast_food'],
  bar: ['amenity', 'bar'],
  fuel: ['amenity', 'fuel'],
  pharmacy: ['amenity', 'pharmacy'],
  atm: ['amenity', 'atm'],
  bank: ['amenity', 'bank'],
  hospital: ['amenity', 'hospital'],
  parking: ['amenity', 'parking'],
  marketplace: ['amenity', 'marketplace'],
  mosque: ['amenity', 'place_of_worship'],
  supermarket: ['shop', 'supermarket'],
  mall: ['shop', 'mall'],
  hotel: ['tourism', 'hotel'],
  viewpoint: ['tourism', 'viewpoint'],
  attraction: ['tourism', 'attraction'],
  museum: ['tourism', 'museum'],
  park: ['leisure', 'park'],
  playground: ['leisure', 'playground'],
  beach: ['natural', 'beach'],
}

// Super-categories: union of several OSM tags for vague queries like
// "what's there to do" / "куда сходить" — returns mixed POIs.
const OSM_UNIONS = {
  things_to_do: [
    ['tourism', 'attraction'],
    ['tourism', 'viewpoint'],
    ['tourism', 'museum'],
    ['leisure', 'park'],
    ['shop', 'mall'],
  ],
  food: [
    ['amenity', 'restaurant'],
    ['amenity', 'cafe'],
    ['amenity', 'fast_food'],
  ],
  shopping: [
    ['shop', 'mall'],
    ['shop', 'supermarket'],
    ['amenity', 'marketplace'],
  ],
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/**
 * Hit the public Overpass endpoint for real OSM POIs around (lat, lon).
 * Tries 5 km first, expands to 20 km if nothing comes back — Mangystau is
 * sparse. Returns at most 8 nearest, sorted by haversine distance.
 */
// Public Overpass returns 406 without a User-Agent. Three mirrors so a single
// node going down doesn't kill the agent.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
]
const OVERPASS_UA = 'iz-mangystau-voice/1.0 (https://iz-psi.vercel.app)'

async function searchOSMPlaces(category, lat, lon) {
  const tags = OSM_UNIONS[category]
    ? OSM_UNIONS[category]
    : [OSM_TAGS[category] || OSM_TAGS.attraction]
  const tryRadius = async (radius) => {
    const parts = tags
      .flatMap(([k, v]) => [
        `node["${k}"="${v}"](around:${radius},${lat},${lon});`,
        `way["${k}"="${v}"](around:${radius},${lat},${lon});`,
      ])
      .join('')
    const q = `[out:json][timeout:15];(${parts});out center 60;`
    let lastErr = null
    for (const ep of OVERPASS_ENDPOINTS) {
      try {
        const r = await fetch(ep, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': OVERPASS_UA,
            Accept: 'application/json',
          },
          body: 'data=' + encodeURIComponent(q),
        })
        if (!r.ok) { lastErr = new Error(`overpass ${r.status}`); continue }
        const ct = r.headers.get('content-type') || ''
        if (!ct.includes('json')) { lastErr = new Error(`overpass non-json (${ct})`); continue }
        const j = await r.json()
        return Array.isArray(j.elements) ? j.elements : []
      } catch (err) { lastErr = err }
    }
    if (lastErr) throw lastErr
    return []
  }
  let elements = []
  try {
    elements = await tryRadius(5000)
    if (elements.length === 0) elements = await tryRadius(20000)
    if (elements.length === 0) elements = await tryRadius(50000)
  } catch (err) {
    console.warn('overpass failed', err?.message)
  }
  const rawItems = elements
    .map((e) => {
      const plat = e.lat ?? e.center?.lat
      const plon = e.lon ?? e.center?.lon
      if (!Number.isFinite(plat) || !Number.isFinite(plon)) return null
      const t = e.tags || {}
      let name =
        t['name:en'] ||
        t.name ||
        t['name:ru'] ||
        t['name:kk'] ||
        t.brand ||
        t.operator ||
        (t.amenity || t.shop || t.tourism || t.leisure || category).replace(/_/g, ' ')
      // Capitalise lowercase OSM-tag fallback ("supermarket" → "Supermarket").
      if (name && name === name.toLowerCase()) {
        name = name.charAt(0).toUpperCase() + name.slice(1)
      }
      return {
        name,
        lat: plat,
        lon: plon,
        addr: [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ') || null,
        distance_km: haversineKm(lat, lon, plat, plon),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.distance_km - b.distance_km)
  // Dedupe: drop entries with the same name within 80 m of each other
  // (Overpass often returns both the node and the building's way for one POI).
  const seen = []
  const items = rawItems
    .filter((p) => {
      const dup = seen.find(
        (s) => s.name.toLowerCase() === p.name.toLowerCase() && haversineKm(s.lat, s.lon, p.lat, p.lon) < 0.08,
      )
      if (dup) return false
      seen.push(p)
      return true
    })
    .slice(0, 6)
    .map((p) => ({
      ...p,
      distance_km: Math.round(p.distance_km * 10) / 10,
      url: `https://www.google.com/maps/dir/?api=1&origin=${lat},${lon}&destination=${p.lat},${p.lon}&travelmode=driving`,
    }))
  return items
}

/**
 * Builds a bbox tight enough to show the user + every found place. Uses the
 * OSM public embed (no key required) — a real interactive map that pans /
 * zooms inside the chat bubble.
 */
function buildOSMEmbed(lat, lon, items) {
  const lats = [lat, ...items.map((p) => p.lat)]
  const lons = [lon, ...items.map((p) => p.lon)]
  const pad = 0.01
  const minLat = Math.min(...lats) - pad
  const maxLat = Math.max(...lats) + pad
  const minLon = Math.min(...lons) - pad
  const maxLon = Math.max(...lons) + pad
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${lat}%2C${lon}`
}

/**
 * Open-Meteo current weather + 2-day forecast for the user's coords.
 * Free, no key. Returns a compact, frontend-renderable object.
 */
const WEATHER_LABEL = {
  0:  { en: 'Clear', ru: 'Ясно', kk: 'Ашық' },
  1:  { en: 'Mostly clear', ru: 'В осн. ясно', kk: 'Негізінен ашық' },
  2:  { en: 'Partly cloudy', ru: 'Облачно с прояснениями', kk: 'Бұлтты' },
  3:  { en: 'Overcast', ru: 'Пасмурно', kk: 'Тұманды' },
  45: { en: 'Fog', ru: 'Туман', kk: 'Тұман' },
  48: { en: 'Icy fog', ru: 'Ледяной туман', kk: 'Мұзды тұман' },
  51: { en: 'Light drizzle', ru: 'Лёгкая морось', kk: 'Жеңіл нөсер' },
  53: { en: 'Drizzle', ru: 'Морось', kk: 'Нөсер' },
  55: { en: 'Heavy drizzle', ru: 'Сильная морось', kk: 'Қатты нөсер' },
  61: { en: 'Light rain', ru: 'Небольшой дождь', kk: 'Жеңіл жаңбыр' },
  63: { en: 'Rain', ru: 'Дождь', kk: 'Жаңбыр' },
  65: { en: 'Heavy rain', ru: 'Сильный дождь', kk: 'Қатты жаңбыр' },
  71: { en: 'Light snow', ru: 'Небольшой снег', kk: 'Жеңіл қар' },
  73: { en: 'Snow', ru: 'Снег', kk: 'Қар' },
  75: { en: 'Heavy snow', ru: 'Сильный снег', kk: 'Қатты қар' },
  80: { en: 'Showers', ru: 'Ливни', kk: 'Нөсер' },
  81: { en: 'Heavy showers', ru: 'Сильные ливни', kk: 'Қатты нөсер' },
  82: { en: 'Violent showers', ru: 'Шквалистые ливни', kk: 'Дауылды нөсер' },
  95: { en: 'Thunderstorm', ru: 'Гроза', kk: 'Найзағай' },
}
function weatherLabel(code, L) {
  const row = WEATHER_LABEL[code] || WEATHER_LABEL[0]
  return row[L] || row.en
}
async function fetchWeather(lat, lon, L) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min,weather_code&forecast_days=2&timezone=auto`
    const r = await fetch(url)
    if (!r.ok) throw new Error(`open-meteo ${r.status}`)
    const j = await r.json()
    const c = j.current || {}
    const d = j.daily || {}
    return {
      kind: 'weather',
      origin: { lat, lon },
      tempC: Math.round(c.temperature_2m ?? 0),
      windKmh: Math.round(c.wind_speed_10m ?? 0),
      code: c.weather_code ?? 0,
      label: weatherLabel(c.weather_code ?? 0, L),
      sunrise: (d.sunrise || [])[0] || null,
      sunset: (d.sunset || [])[0] || null,
      tomorrow: {
        maxC: Math.round((d.temperature_2m_max || [])[1] ?? 0),
        minC: Math.round((d.temperature_2m_min || [])[1] ?? 0),
        label: weatherLabel((d.weather_code || [])[1] ?? 0, L),
      },
    }
  } catch (err) {
    console.warn('weather failed', err?.message)
    return null
  }
}

/**
 * Strip every shape of garbage the LLM might leak into the spoken reply —
 * markdown citations, bare URLs, brand-name brackets, bold/italics, bullets,
 * and any leftover [[…]] stage directions. What's left is clean prose safe
 * to render in the bubble AND send to TTS.
 */
function scrubReply(s) {
  if (!s) return ''
  return s
    .replace(/\[\[[^\]]+\]\]/g, '')                              // leftover stage directions
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')                        // images
    .replace(/\[([^\]]+)\]\((?:https?:[^)]+|\/[^)]+)\)/g, '$1')  // [text](url) -> text
    .replace(/\[(?:[a-z0-9.\-]+\.[a-z]{2,}(?:\/[^\]]*)?)\]/gi, '') // [domain.com/…]
    .replace(/\bhttps?:\/\/\S+/g, '')                            // bare URLs
    .replace(/\bwww\.\S+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')                           // **bold**
    .replace(/(^|[\s])\*([^*\n]+)\*/g, '$1$2')                   // *italic*
    .replace(/^\s*[-*•]\s+/gm, '')                               // list bullets
    .replace(/^#{1,6}\s+/gm, '')                                 // headings
    .replace(/`([^`]+)`/g, '$1')                                 // inline code
    .replace(/\s+([.,!?;:])/g, '$1')                             // space before punct
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * Strips ALL markers ([[GO:…]], [[NEAR:…]], [[SIGHT:…]], [[WEATHER]],
 * [[SUGG:…]]) from the model reply, calls the relevant data source, and
 * returns a structured action + suggestion list the frontend renders. The
 * markers are never spoken — they're stage directions to the app.
 */
async function extractActions(text, location, L) {
  if (!text) return { clean: '', action: null, suggestions: [] }
  let clean = text
  let action = null
  let suggestions = []

  // SUGG marker — three tappable chip texts pipe-separated
  const sugg = clean.match(/\[\[SUGG:\s*([^\]]+?)\s*\]\]/i)
  if (sugg) {
    clean = clean.replace(sugg[0], '').trim()
    suggestions = sugg[1]
      .split('|')
      .map((s) => s.trim())
      .filter((s) => s && s.length <= 36)
      .slice(0, 3)
  }

  const near = clean.match(/\[\[NEAR:\s*([a-z_]+)\s*\]\]/i)
  if (near && location) {
    const category = near[1].toLowerCase()
    clean = clean.replace(near[0], '')
    const items = await searchOSMPlaces(category, location.lat, location.lon)
    const embedUrl = buildOSMEmbed(location.lat, location.lon, items)
    const listUrl = `https://www.google.com/maps/search/${encodeURIComponent(category)}/@${location.lat},${location.lon},13z`
    action = { kind: 'places', category, items, embedUrl, listUrl, origin: { lat: location.lat, lon: location.lon } }
  }

  if (!action) {
    const weather = clean.match(/\[\[WEATHER\]\]/i)
    if (weather && location) {
      clean = clean.replace(weather[0], '')
      const w = await fetchWeather(location.lat, location.lon, L)
      if (w) action = w
    }
  }

  if (!action) {
    const sight = clean.match(/\[\[SIGHT:\s*([a-z]+)\s*\]\]/i)
    if (sight) {
      const bucket = sight[1].toLowerCase()
      clean = clean.replace(sight[0], '')
      const photos = pickReferences(bucket, L).slice(0, 8)
      if (photos.length) {
        const mapsQuery = encodeURIComponent(`${bucket}, Mangystau, Kazakhstan`)
        const origin =
          location && Number.isFinite(location.lat) && Number.isFinite(location.lon)
            ? `&origin=${location.lat},${location.lon}`
            : ''
        const routeUrl = `https://www.google.com/maps/dir/?api=1${origin}&destination=${mapsQuery}&travelmode=driving`
        action = { kind: 'sight', bucket, photos, routeUrl }
      }
    }
  }

  const go = clean.match(/\[\[GO:\s*([^\]]+?)\s*\]\]/i)
  if (go && !action) {
    let destination = go[1].trim()
    clean = clean.replace(go[0], '')
    if (/-?\d+\.\d+\s*,\s*-?\d+\.\d+/.test(destination)) {
      destination = destination.replace(/-?\d+\.\d+\s*,\s*-?\d+\.\d+/g, '').trim()
    }
    if (destination) {
      const dest = encodeURIComponent(
        /mangystau|mangistau|kazakhstan/i.test(destination)
          ? destination
          : `${destination}, Mangystau, Kazakhstan`,
      )
      const origin =
        location && Number.isFinite(location.lat) && Number.isFinite(location.lon)
          ? `&origin=${location.lat},${location.lon}`
          : ''
      const url = `https://www.google.com/maps/dir/?api=1${origin}&destination=${dest}&travelmode=driving`
      action = { kind: 'directions', destination, url }
    }
  }

  return { clean: scrubReply(clean), action, suggestions }
}

/**
 * Pre-canned warm openers + suggestion chips for "hi" / "hey" / "капля" / "iz".
 * Bypasses the LLM entirely — instant, free, on-brand, never tries to
 * search the web for kindergarten lesson plans about water droplets.
 */
/**
 * Deterministic intent classifier — Gemini-Flash-Lite is too small to route
 * markers reliably, so we run regexes on the user's last message and force
 * the action server-side. The model's text reply still flows through; we
 * just override which card shows up next to it.
 *
 * Order matters: GO (specific route) > SIGHT (named landmark) > WEATHER >
 * NEAR (around me). Returns { kind, payload } or null.
 */
const SIGHT_KEYWORDS = [
  { bucket: 'bozzhyra', needles: /бозжыр|бозжир|bozzhyra|bozzhira|boszhira|bozjyra|клык|fangs/i },
  { bucket: 'sherkala', needles: /шерқал|шеркал|sherkala|sherqala|shirkala|lion mountain/i },
  { bucket: 'tuzbair',  needles: /тузба|тұзбайыр|tuzbair|tuz bair|sor tuzbair|airakty|айракты/i },
  { bucket: 'torysh',   needles: /торыш|долин.{0,6}шар|valley of balls|stone balls|torysh|torish|шары|шаров|шарики/i },
  { bucket: 'kyzylkup', needles: /кызылкуп|қызылқұп|kyzylkup|qyzylqup|тирамису|tiramisu/i },
  { bucket: 'caspian',  needles: /каспий|каспи|caspian|актау|ақтау|aktau|набережн|promenade|coast|beach|пляж/i },
]
const NEAR_KEYWORDS = [
  { cat: 'cafe',         needles: /кафе|кофе|cafe|coffee/i },
  { cat: 'restaurant',   needles: /ресторан|поесть|пообедать|поужинать|restaurant|where to eat|еду|еда/i },
  { cat: 'fast_food',    needles: /фастфуд|fast food|burger|бургер|пицц/i },
  { cat: 'bar',          needles: /бар|\bbar\b|выпить|drink/i },
  { cat: 'fuel',         needles: /заправ|бензин|fuel|gas station|petrol/i },
  { cat: 'pharmacy',     needles: /аптек|pharmacy|drugstore|лекарств/i },
  { cat: 'atm',          needles: /банкомат|atm|cash machine/i },
  { cat: 'bank',         needles: /банк[^о]|\bbank\b|обмен валют|exchange office/i },
  { cat: 'hospital',     needles: /больниц|госпитал|скорая|клиник|hospital|clinic|emergency room/i },
  { cat: 'parking',      needles: /парковк|parking|park the car/i },
  { cat: 'mall',         needles: /(?:^|[^а-яё])тц(?=$|[^а-яё])|торгов.{0,4}центр|молл|mall|shopping(?: center| centre)?|трц/i },
  { cat: 'marketplace',  needles: /базар|рынок|market(?:place)?/i },
  { cat: 'mosque',       needles: /мечет|mosque|namaz|намаз/i },
  { cat: 'supermarket',  needles: /магазин|supermarket|grocery|продукт/i },
  { cat: 'hotel',        needles: /отель|гостиниц|hotel|переночев|hostel|stay the night/i },
  { cat: 'viewpoint',    needles: /смотровая|viewpoint|обзор|вид с/i },
  { cat: 'museum',       needles: /музей|museum/i },
  { cat: 'park',         needles: /парк[^о]|сквер|park|playground|детская площадк/i },
  { cat: 'beach',        needles: /пляж|beach/i },
  { cat: 'attraction',   needles: /достопримеч|attraction/i },
  { cat: 'things_to_do', needles: /сходить|погулять|развлеч|что интересн|чем зан|what to do|things to do|fun nearby/i },
  { cat: 'food',         needles: /покушать|перекус|перекусить|где едят/i },
  { cat: 'shopping',     needles: /шопинг|шоппинг|купить|shopping/i },
]
// NOTE: \b only handles Latin word boundaries in JS regex; for Cyrillic we
// match substrings directly (the keywords are specific enough to avoid
// false positives).
const WEATHER_RE = /погод|прогноз|ауа рай|\bweather\b|\bforecast\b|температур|жарко|холодно|will it rain|дожд|ветер|снег|\bwind\b|sunrise|sunset|закат|восход/i
const NEAR_GENERIC_RE = /(что|where).{0,8}(рядом|вокруг|around|near|nearby|close to me|поблизости|near me)/i
const GO_RE = /(take me to|route to|поехали в|как добраться до|проложи маршрут|маршрут до|маршрут для до|drive me to|navigate to|проводи меня|проводи до)/i
const NEAREST_RE = /(ближайш|nearest|closest|самый близкий|самой близкой)/i
const RECALL_RE = /(ту точк|эту точк|что (?:ты )?показал|показал.{0,12}карт|что это (?:был[оа]|за)|where did you|that map|that pin|that point|тот пин|та метк)/i
// "Скажи мне X" / "Найди X" / "Самый новый X" — any of these turns a category
// keyword into a clear NEAR intent even without "рядом/где".
const NEAR_VERB_RE = /(скажи|найди|поищ|посовет|покажи мне|подскажи|есть ли|какие|какой|какая|какое|самый|самая|самое|самые|лучш|новейш|tell me|find me?|show me|which|what(?:'s| is) the|recommend|nearest|best|newest)/i
// Superlatives we can't actually rank for — we still show closest, but the
// narration will say so honestly.
const SUPERLATIVE_RE = /(самый|самая|самое|самые|лучш|новейш|новая|новый|новое|новые|best|newest|nicest|fanciest|cheapest|самый дешёв|самый дорог)/i

function classifyIntent(userText) {
  if (!userText) return null
  const s = String(userText).trim()
  if (!s) return null
  // 0. RECALL — user is asking about the previous card. No fresh action; the
  //    handler will inject memory into the prompt and let the model answer.
  if (RECALL_RE.test(s)) return { kind: 'recall' }
  // 1. GO — explicit "take me to X"
  const go = s.match(GO_RE)
  if (go) {
    const after = s.slice(go.index + go[0].length).replace(/[?!.,]+$/, '').trim()
    if (after) {
      // 1a. Compound: "route to nearest <category>" → search then directions
      if (NEAREST_RE.test(after) || NEAREST_RE.test(s)) {
        for (const { cat, needles } of NEAR_KEYWORDS) {
          if (needles.test(after) || needles.test(s)) {
            return { kind: 'go_nearest', category: cat }
          }
        }
      }
      // 1b. Compound: "route to <known sight>"
      for (const { bucket, needles } of SIGHT_KEYWORDS) {
        if (needles.test(after)) return { kind: 'go_sight', bucket, destination: after }
      }
      return { kind: 'go', destination: after }
    }
  }
  // 2. NEAREST without GO — "where's the nearest ATM" → near (will sort by distance)
  if (NEAREST_RE.test(s)) {
    for (const { cat, needles } of NEAR_KEYWORDS) {
      if (needles.test(s)) return { kind: 'near', category: cat }
    }
  }
  // 3. SIGHT — explicit landmark mention
  for (const { bucket, needles } of SIGHT_KEYWORDS) {
    if (needles.test(s)) return { kind: 'sight', bucket }
  }
  // 4. WEATHER — explicit weather words
  if (WEATHER_RE.test(s)) return { kind: 'weather' }
  // 5. NEAR — "what's around" generic, or a NEAR category keyword
  if (NEAR_GENERIC_RE.test(s)) {
    for (const { cat, needles } of NEAR_KEYWORDS) {
      if (needles.test(s)) return { kind: 'near', category: cat }
    }
    return { kind: 'near', category: 'things_to_do' }
  }
  for (const { cat, needles } of NEAR_KEYWORDS) {
    // category keyword + either a locative hint OR a search verb / superlative
    if (
      needles.test(s) &&
      (/рядом|вокруг|around|near|поблизост|закрыт|открыт|где|where/i.test(s) ||
        NEAR_VERB_RE.test(s))
    ) {
      return { kind: 'near', category: cat, superlative: SUPERLATIVE_RE.test(s) }
    }
  }
  return null
}

async function applyIntent(intent, location, L) {
  if (!intent) return null
  if (intent.kind === 'weather' && location) {
    return await fetchWeather(location.lat, location.lon, L)
  }
  if (intent.kind === 'sight') {
    const photos = pickReferences(intent.bucket, L).slice(0, 8)
    if (!photos.length) return null
    const mapsQuery = encodeURIComponent(`${intent.bucket}, Mangystau, Kazakhstan`)
    const origin =
      location && Number.isFinite(location.lat) && Number.isFinite(location.lon)
        ? `&origin=${location.lat},${location.lon}`
        : ''
    const routeUrl = `https://www.google.com/maps/dir/?api=1${origin}&destination=${mapsQuery}&travelmode=driving`
    return { kind: 'sight', bucket: intent.bucket, photos, routeUrl }
  }
  if (intent.kind === 'near' && location) {
    const items = await searchOSMPlaces(intent.category, location.lat, location.lon)
    const embedUrl = buildOSMEmbed(location.lat, location.lon, items)
    const listUrl = `https://www.google.com/maps/search/${encodeURIComponent(intent.category)}/@${location.lat},${location.lon},13z`
    return { kind: 'places', category: intent.category, items, embedUrl, listUrl, origin: { lat: location.lat, lon: location.lon } }
  }
  if (intent.kind === 'go') {
    const dest = encodeURIComponent(
      /mangystau|mangistau|kazakhstan/i.test(intent.destination)
        ? intent.destination
        : `${intent.destination}, Mangystau, Kazakhstan`,
    )
    const origin =
      location && Number.isFinite(location.lat) && Number.isFinite(location.lon)
        ? `&origin=${location.lat},${location.lon}`
        : ''
    const url = `https://www.google.com/maps/dir/?api=1${origin}&destination=${dest}&travelmode=driving`
    return { kind: 'directions', destination: intent.destination, url }
  }
  if (intent.kind === 'go_sight') {
    const photos = pickReferences(intent.bucket, L).slice(0, 8)
    const mapsQuery = encodeURIComponent(`${intent.bucket}, Mangystau, Kazakhstan`)
    const origin =
      location && Number.isFinite(location.lat) && Number.isFinite(location.lon)
        ? `&origin=${location.lat},${location.lon}`
        : ''
    const url = `https://www.google.com/maps/dir/?api=1${origin}&destination=${mapsQuery}&travelmode=driving`
    return { kind: 'directions', destination: intent.bucket, url, photos }
  }
  if (intent.kind === 'go_nearest' && location) {
    // Compound: search → pick closest with coords → build directions URL
    const items = await searchOSMPlaces(intent.category, location.lat, location.lon)
    const target = items[0]
    if (!target) {
      // Fallback: just open Google Maps search for the category.
      const listUrl = `https://www.google.com/maps/search/${encodeURIComponent(intent.category)}/@${location.lat},${location.lon},13z`
      return { kind: 'directions', destination: intent.category, url: listUrl, missing: true }
    }
    const url = `https://www.google.com/maps/dir/?api=1&origin=${location.lat},${location.lon}&destination=${target.lat},${target.lon}&travelmode=driving`
    return {
      kind: 'directions',
      destination: target.name,
      url,
      category: intent.category,
      target: { name: target.name, lat: target.lat, lon: target.lon, distance_km: target.distance_km },
    }
  }
  // RECALL doesn't trigger a new action — handled via memory in the system prompt.
  return null
}

// Allow up to 3 greeting tokens in a row (e.g. "Привет капля", "Hi Iz!", "Hey hey hello").
const GREETING_RE = /^\s*(?:(?:привет|здравствуй|здарова|здорово|hi|hey|hello|hola|салам|сәлем|salem|капля|kaplya|капелька|iz|из|йо|yo)[\s!.,?]*){1,3}$/i

// CURRENT_INFO_RE — turns where the model should NOT guess from memory but
// consult live web search. Matches things like "самый новый", "цены сейчас",
// "что открыто", "newest", "today", "prices", "news", "hours", "right now".
// When this fires we swap the model id to its :online variant for ONE turn.
const CURRENT_INFO_RE = /(сам(?:ый|ая|ое|ые)\s+нов|нов(?:ый|ая|ое|ые)\s+(?:тц|молл|ресторан|кафе|отел|hotel|mall|restaurant)|цен[аы]\s*сейчас|сколько\s+стоит|расписани|часы\s+работы|открыт(?:о|ы)?\s+(?:ли|сейчас)|работа(?:ет|ют)?\s+(?:ли|сейчас)|новост|сегодня\s+(?:открыт|работа|событ)|афиш|курс\s+(?:доллар|евро|тенге|kzt|usd|eur)|newest|brand\s*new|opening\s+hours|open\s+(?:now|today)|prices?\s+(?:now|today)|exchange\s+rate|whats?\s+on\s+(?:today|tonight)|news|жаңа\s+ашыл|бүгін\s+ашық|бағас)/i
const GREETINGS = {
  en: [
    "Hey — I'm Iz. I know Mangystau cold: canyons, salt flats, weird stone balls. What do you want to see?",
    "Hi. Iz here, your local in Mangystau. Photo spots, food, sights — pick a thread.",
    "Hey there. I can route you to Bozzhyra, find a cafe nearby, or pull the weather. Your call.",
  ],
  ru: [
    "Привет, я Iz. Знаю Мангистау как свои пять — каньоны, солончаки, каменные шары. С чего начнём?",
    "Здарова. Я твой местный по Мангистау. Места для фото, еда, маршруты — выбирай.",
    "Привет. Могу проложить путь до Бозжыры, найти кафешку рядом или показать погоду. Что хочешь?",
  ],
  kk: [
    "Сәлем, мен Iz. Маңғыстауды жақсы білемін — каньондар, тұзды жазықтар, тас шарлар. Қайдан бастаймыз?",
    "Сәлем. Маңғыстаудағы жергіліктің — Iz. Фото орындар, тамақ, маршруттар — таңда.",
    "Сәлем. Бозжыраға жол сала аламын, жанынан кафе іздей аламын немесе ауа райын көрсете аламын.",
  ],
}
const GREETING_SUGGS = {
  en: ["What's around me?", "Show me Bozzhyra", "Weather today"],
  ru: ["Что рядом?", "Покажи Бозжыру", "Погода сегодня"],
  kk: ["Жақын маңда не бар?", "Бозжыраны көрсет", "Бүгінгі ауа райы"],
}

/**
 * Build a one-line summary of the last card the app rendered, so the LLM has
 * memory of its own actions and can answer "what was that point on the map?"
 * without denying it ever showed anything.
 */
function summarizeLastAction(a) {
  if (!a || typeof a !== 'object') return null
  if (a.kind === 'weather') {
    return `Last turn you showed a weather card: ${a.tempC}°C, ${a.label}, wind ${a.windKmh} km/h. Tomorrow ${a.tomorrow?.minC}–${a.tomorrow?.maxC}°C, ${a.tomorrow?.label}.`
  }
  if (a.kind === 'sight') {
    return `Last turn you showed a photo reel of ${a.bucket} (${(a.photos || []).length} reference shots) with a Route CTA.`
  }
  if (a.kind === 'places') {
    const top = (a.items || []).slice(0, 3).map((i) => `${i.name} (${i.distance_km} km)`).join(', ')
    return `Last turn you showed a map of nearby ${a.category}: ${(a.items || []).length} results — ${top || 'none in range'}. The user CAN see this card.`
  }
  if (a.kind === 'directions') {
    return `Last turn you opened directions to "${a.destination}".`
  }
  return null
}

/**
 * For DETERMINISTIC compound intents (go_nearest, near with results), template
 * the narration so it actually matches what the card shows. Avoids the LLM's
 * "I don't know" denials when the classifier already found the answer.
 * Returns null if no override needed → LLM's own text is kept.
 */
function narrateForcedAction(intent, action, L) {
  if (!intent || !action) return null
  if (intent.kind === 'go_nearest') {
    if (action.missing) {
      return {
        en: "Couldn't find one near you — opening map search.",
        ru: 'Рядом не нашёл — открою поиск на карте.',
        kk: 'Жақын маңда таппадым — картадан іздеу ашамын.',
      }[L]
    }
    const km = action.target?.distance_km
    const name = action.target?.name || action.destination
    return {
      en: `Routing to ${name}, ${km} km away.`,
      ru: `Прокладываю до ${name}, ${km} км.`,
      kk: `${name} дейін бағыт салып жатырмын, ${km} км.`,
    }[L]
  }
  if (intent.kind === 'near' && action.kind === 'places') {
    const n = action.items?.length || 0
    if (n === 0) {
      return {
        en: "Nothing tagged that close by — try a wider category.",
        ru: 'Поблизости ничего не нашлось — попробуй шире.',
        kk: 'Жақын маңда ештеңе жоқ — кеңірек санат таңда.',
      }[L]
    }
    const closest = action.items[0]
    if (intent.superlative) {
      // We can't actually rank by "newest" / "best" — admit it, show closest.
      return {
        en: `Can't filter by newest from the map, but the closest ${n} are here — ${closest.name} is just ${closest.distance_km} km away.`,
        ru: `По "самым новым" не отсортирую, но вот ближайшие ${n} — ${closest.name} всего в ${closest.distance_km} км.`,
        kk: `«Ең жаңасы» бойынша сұрыптай алмаймын, бірақ ең жақын ${n} осы — ${closest.name} ${closest.distance_km} км.`,
      }[L]
    }
    return {
      en: `${n} around you — closest is ${closest.name}, ${closest.distance_km} km.`,
      ru: `${n} вокруг — ближе всех ${closest.name}, ${closest.distance_km} км.`,
      kk: `Айналаңда ${n} орын — ең жақыны ${closest.name}, ${closest.distance_km} км.`,
    }[L]
  }
  return null
}

app.post('/api/voice/chat', async (req, res) => {
  try {
    const { messages, lang, location, lastAction } = req.body
    const L = (lang === 'en' || lang === 'ru' || lang === 'kk') ? lang : 'ru'
    const langName = LANG_NAME[L]
    const memoryLine = summarizeLastAction(lastAction)

    const hasLoc =
      location &&
      Number.isFinite(location.lat) &&
      Number.isFinite(location.lon)

    // --- greeting fast-path: skip the LLM entirely on "hi" / "привет" / "капля"
    const lastUser = Array.isArray(messages)
      ? [...messages].reverse().find((m) => m?.role === 'user')?.content || ''
      : ''
    if (GREETING_RE.test(String(lastUser).trim())) {
      const pool = GREETINGS[L]
      const text = pool[Math.floor(Math.random() * pool.length)]
      return res.json({ text, action: null, suggestions: GREETING_SUGGS[L] })
    }

    const locLine = hasLoc
      ? `The user is right now at latitude ${location.lat.toFixed(4)}, longitude ${location.lon.toFixed(4)}${location.place ? ` (near ${location.place})` : ''}. Tailor distances, drive times and "what's nearby" to that.`
      : `You don't know where the user is. If a recommendation needs their location, ask once, briefly.`
    const memorySection = memoryLine
      ? `\n\nMEMORY OF YOUR LAST ACTION: ${memoryLine}\nIf the user references "that map", "that pin", "ту точку", "что показал" — they mean THIS card. You DID show it. Acknowledge it, then answer their question about it. Never deny showing something this memory line describes.`
      : ''

    const system = `You are Iz — a Mangystau local who knows the region cold. You're texting a traveler, not writing a brochure.

VOICE RULES (these are absolute — they're for SPOKEN, not written, replies):
- Reply in ${langName}.
- Maximum TWO short sentences. Aim for one. Never three.
- Sound spoken, not written. Use contractions, em-dashes, commas, light "ah", "ну", "look", "слушай" — whatever lets a TTS engine breathe. Avoid stiff connectors like "furthermore", "однако", "таким образом".
- No emojis. No markdown. No bullet points. No URLs. No bracketed citations like "[domain.com]". No site names.
- NEVER explain what a word means in general. Assume they're a tourist in Mangystau asking about Mangystau.
- If you genuinely don't know, say so in one sentence — don't invent place names, malls, hotels, or businesses. Saying "не знаю точно" is fine; making up "Аktau City Mall" is not.
- ${locLine}

CARDS DO THE SHOWING. You only narrate; the app renders the rich card. End your reply with EXACTLY ONE marker (or none). Markers are invisible stage directions — never read them aloud, never mention them, never list place names if you're using a card marker.

INTENT ROUTING — pick the RIGHT marker. Each example shows the type of user message and the marker you MUST emit.

[[WEATHER]] — fires for ANY weather question, present or future. Trigger words: погода, ауа райы, weather, temperature, температура, жарко, холодно, will it rain, дождь, ветер.
  User: "Какая погода?" → reply "Глянем сейчас." [[WEATHER]] [[SUGG:…]]
  User: "Will it rain today?" → reply "Let me check the forecast." [[WEATHER]] [[SUGG:…]]

[[SIGHT:<bucket>]] — fires when the user asks ABOUT a Mangystau landmark by name, or wants to SEE photos of one. Buckets: bozzhyra, sherkala, tuzbair, kyzylkup, torysh, caspian. Trigger words: расскажи про X, покажи X, что такое X, show me X, tell me about X.
  User: "Расскажи про Бозжыру" → reply "Бозжыра — белые клыки в полупустыне, лучше всего на закате." [[SIGHT:bozzhyra]] [[SUGG:…]]
  User: "Show me Sherkala" → reply "Sherkala's like a stone yurt — best from the east at sunrise." [[SIGHT:sherkala]] [[SUGG:…]]
  User: "Что такое Торыш?" → reply "Долина шаров — круглые конкреции на ровной степи." [[SIGHT:torysh]] [[SUGG:…]]

[[NEAR:<category>]] — fires ONLY when the user asks what is NEAR / AROUND / CLOSE TO THEM right now. Trigger words: что рядом, что вокруг, where to eat near me, what's around, ближайший, closest, near me. Categories: cafe, restaurant, fast_food, bar, fuel, hotel, supermarket, pharmacy, atm, parking, viewpoint, attraction, museum.
  User: "Что рядом поесть?" → reply "Сейчас покажу что вокруг." [[NEAR:restaurant]] [[SUGG:…]]
  User: "Where can I refuel near me?" → reply "Pulling the closest stations." [[NEAR:fuel]] [[SUGG:…]]
  DO NOT use NEAR for weather, for sight info, or for general chat. ONLY for "what's around me".

[[GO:<clean English place name>]] — fires when the user wants the ROUTE to a SPECIFIC named place. Trigger words: take me to, поехали в, как добраться до, route to, проложи маршрут. Just the name, no coords, no categories.
  User: "Take me to Bozzhyra" → reply "Building the route." [[GO:Bozzhyra Canyon]] [[SUGG:…]]
  User: "Как добраться до Шеркалы?" → reply "Сейчас проложу." [[GO:Sherkala Mountain]] [[SUGG:…]]

NO MARKER — for greetings, small talk, opinions, history facts, or general Mangystau questions that don't need a card. Just one warm sentence.
  User: "Когда лучше ехать?" → reply "Май и сентябрь — нет жары и не толпы." [[SUGG:…]]

CRITICAL: If you're not sure between NEAR and SIGHT, pick SIGHT for named landmarks and NEAR for "around me" categories. If you're not sure between WEATHER and anything else, pick WEATHER for any weather question.

SUGGESTIONS — ALWAYS end your reply with [[SUGG:a|b|c]] containing three short follow-up taps the user might want next, each ≤30 chars, in ${langName}. Make them concrete and different from each other. Example: [[SUGG:Какая погода?|Что рядом?|Покажи Шеркалу]]${memorySection}

${SIGHT_CONTEXT}`

    const history = Array.isArray(messages)
      ? messages
          .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
          .slice(-12)
          .map((m) => ({ role: m.role, content: String(m.content).slice(0, 1200) }))
      : []

    // Default OFF — ":online" drags in unrelated Wikipedia / lesson-plan junk
    // for casual chat. Flip ON only when the user is asking for current info
    // (newest mall, prices, hours, news) so Gemini stops hallucinating places.
    const needsWeb = CURRENT_INFO_RE.test(String(lastUser || ''))
    const modelId = needsWeb
      ? 'google/gemini-2.5-flash-lite:online'
      : 'google/gemini-2.5-flash-lite'
    const webNote = needsWeb
      ? `\n\nTHIS TURN HAS WEB SEARCH. The user is asking for current info you can only know from the web. Use the search results, then answer in ONE short sentence. Never paste URLs, domains, or source names. If results are thin, say so plainly.`
      : ''

    const completion = await client.chat.completions.create({
      model: modelId,
      messages: [{ role: 'system', content: system + webNote }, ...history],
      max_tokens: 220,
      temperature: 0.6,
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? ''
    const parsed = await extractActions(raw, hasLoc ? location : null, L)

    // Deterministic intent override — Gemini-Flash-Lite is too small to route
    // markers reliably, so if our regex classifier sees a clear weather/sight/
    // near intent in the last user message, we replace the model's action.
    const intent = classifyIntent(lastUser)
    const forced = await applyIntent(intent, hasLoc ? location : null, L)
    const finalAction = forced || parsed.action

    // If we forced an action, the LLM's text may contradict it ("I don't know
    // where the nearest mall is" right before the card shows one). Override
    // with a templated narration that matches what the card actually shows.
    const forcedText = forced ? narrateForcedAction(intent, forced, L) : null
    const finalText = forcedText || parsed.clean

    res.json({ text: finalText, action: finalAction, suggestions: parsed.suggestions })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err?.message ?? 'voice chat failed' })
  }
})

/**
 * TTS via OpenRouter `/audio/speech`.
 *
 * Voice consistency: pin Gemini "Kore" only. The old Kokoro fallback (af_bella)
 * sounded like a different person — that's what caused the "he keeps speaking
 * with different voices" complaint. If Gemini blips, retry ONCE on the same
 * voice rather than swapping characters.
 *
 * Gemini only outputs raw PCM (24kHz mono), so we prepend a 44-byte WAV header
 * and serve `audio/wav` — the browser <audio> element plays it natively.
 */
const GEMINI_VOICES = new Set([
  'Kore', 'Charon', 'Puck', 'Aoede', 'Fenrir', 'Leda', 'Orus', 'Zephyr',
])

function buildWavHeader(pcmByteLength, { sampleRate = 24000, channels = 1, bitsPerSample = 16 } = {}) {
  const byteRate = sampleRate * channels * bitsPerSample / 8
  const blockAlign = channels * bitsPerSample / 8
  const buf = Buffer.alloc(44)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + pcmByteLength, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(channels, 22)
  buf.writeUInt32LE(sampleRate, 24)
  buf.writeUInt32LE(byteRate, 28)
  buf.writeUInt16LE(blockAlign, 32)
  buf.writeUInt16LE(bitsPerSample, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(pcmByteLength, 40)
  return buf
}

async function speakGemini({ voice, input }) {
  return fetch('https://openrouter.ai/api/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'IZ Mangystau · Voice',
    },
    body: JSON.stringify({
      model: 'google/gemini-3.1-flash-tts-preview',
      input: input.slice(0, 3500),
      voice,
      response_format: 'pcm',
    }),
  })
}

app.post('/api/voice/tts', async (req, res) => {
  try {
    const { text, voice } = req.body
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'missing text' })
    }

    const geminiVoice = typeof voice === 'string' && GEMINI_VOICES.has(voice) ? voice : 'Kore'
    let r = await speakGemini({ voice: geminiVoice, input: text })

    if (!r.ok) {
      const detail0 = await r.text().catch(() => '')
      console.warn('gemini tts blipped, retrying same voice', r.status, detail0.slice(0, 120))
      r = await speakGemini({ voice: geminiVoice, input: text })
    }

    if (!r.ok) {
      const detail = await r.text().catch(() => '')
      console.error('tts upstream error after retry', r.status, detail.slice(0, 200))
      return res.status(502).json({ error: 'tts upstream', status: r.status })
    }

    const pcm = Buffer.from(await r.arrayBuffer())
    const header = buildWavHeader(pcm.length)
    const wav = Buffer.concat([header, pcm])
    res.setHeader('Content-Type', 'audio/wav')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Length', String(wav.length))
    res.setHeader('X-TTS-Model', 'google/gemini-3.1-flash-tts-preview')
    res.setHeader('X-TTS-Voice', geminiVoice)
    return res.end(wav)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err?.message ?? 'tts failed' })
  }
})

const port = process.env.PORT || 8787
app.listen(port, () => console.log(`api listening on http://localhost:${port}`))
