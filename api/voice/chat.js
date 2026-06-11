import OpenAI from 'openai'
import { pickReferences } from '../../server/references.js'

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173',
    'X-Title': 'IZ Mangystau · Voice',
  },
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

const OSM_TAGS = {
  cafe: ['amenity', 'cafe'],
  restaurant: ['amenity', 'restaurant'],
  fast_food: ['amenity', 'fast_food'],
  bar: ['amenity', 'bar'],
  fuel: ['amenity', 'fuel'],
  pharmacy: ['amenity', 'pharmacy'],
  atm: ['amenity', 'atm'],
  parking: ['amenity', 'parking'],
  supermarket: ['shop', 'supermarket'],
  hotel: ['tourism', 'hotel'],
  viewpoint: ['tourism', 'viewpoint'],
  attraction: ['tourism', 'attraction'],
  museum: ['tourism', 'museum'],
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

async function searchOSMPlaces(category, lat, lon) {
  const tag = OSM_TAGS[category] || OSM_TAGS.attraction
  const [k, v] = tag
  const tryRadius = async (radius) => {
    const q = `[out:json][timeout:10];(node["${k}"="${v}"](around:${radius},${lat},${lon});way["${k}"="${v}"](around:${radius},${lat},${lon}););out center 40;`
    const r = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(q),
    })
    if (!r.ok) throw new Error(`overpass ${r.status}`)
    const j = await r.json()
    return Array.isArray(j.elements) ? j.elements : []
  }
  let elements = []
  try {
    elements = await tryRadius(5000)
    if (elements.length === 0) elements = await tryRadius(20000)
  } catch (err) {
    console.warn('overpass failed', err?.message)
  }
  const items = elements
    .map((e) => {
      const plat = e.lat ?? e.center?.lat
      const plon = e.lon ?? e.center?.lon
      if (!Number.isFinite(plat) || !Number.isFinite(plon)) return null
      const t = e.tags || {}
      const name = t['name:en'] || t.name || t.brand || null
      if (!name) return null
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
    .slice(0, 6)
    .map((p) => ({
      ...p,
      distance_km: Math.round(p.distance_km * 10) / 10,
      url: `https://www.google.com/maps/dir/?api=1&origin=${lat},${lon}&destination=${p.lat},${p.lon}&travelmode=driving`,
    }))
  return items
}

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

function scrubReply(s) {
  if (!s) return ''
  return s
    .replace(/\[\[[^\]]+\]\]/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\((?:https?:[^)]+|\/[^)]+)\)/g, '$1')
    .replace(/\[(?:[a-z0-9.\-]+\.[a-z]{2,}(?:\/[^\]]*)?)\]/gi, '')
    .replace(/\bhttps?:\/\/\S+/g, '')
    .replace(/\bwww\.\S+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|[\s])\*([^*\n]+)\*/g, '$1$2')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

async function extractActions(text, location, L) {
  if (!text) return { clean: '', action: null, suggestions: [] }
  let clean = text
  let action = null
  let suggestions = []

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

const SIGHT_KEYWORDS = [
  { bucket: 'bozzhyra', needles: /бозжыр|бозжир|боszhyra|боszhira|bozzhyra|bozzhira|boszhira|bozjyra|клык|fangs/i },
  { bucket: 'sherkala', needles: /шерқал|шеркал|sherkala|sherqala|shirkala|lion mountain/i },
  { bucket: 'tuzbair',  needles: /тузба|тұзбайыр|tuzbair|tuz bair|sor tuzbair|airakty|айракты/i },
  { bucket: 'torysh',   needles: /торыш|долин.{0,6}шар|valley of balls|stone balls|torysh|torish|шар(?:ы|ов|ики)/i },
  { bucket: 'kyzylkup', needles: /кызылкуп|қызылқұп|kyzylkup|qyzylqup|тирамису|tiramisu/i },
  { bucket: 'caspian',  needles: /каспий|каспи|caspian|актау|ақтау|aktau|набережн|promenade|coast|beach|пляж/i },
]
const NEAR_KEYWORDS = [
  { cat: 'cafe',         needles: /кафе|кофе|cafe|coffee/i },
  { cat: 'restaurant',   needles: /ресторан|поесть|пообедать|поужинать|restaurant|where to eat|еду\b|еда\b/i },
  { cat: 'fast_food',    needles: /фастфуд|fast food|burger|бургер|пицц/i },
  { cat: 'bar',          needles: /\bбар\b|\bbar\b|выпить|drink/i },
  { cat: 'fuel',         needles: /заправ|бензин|fuel|gas station|petrol/i },
  { cat: 'pharmacy',     needles: /аптек|pharmacy|drugstore|лекарств/i },
  { cat: 'atm',          needles: /банкомат|atm|cash machine/i },
  { cat: 'parking',      needles: /парковк|parking|park the car/i },
  { cat: 'supermarket',  needles: /магазин|supermarket|grocery|продукт/i },
  { cat: 'hotel',        needles: /отель|гостиниц|hotel|переночев|hostel|stay the night/i },
  { cat: 'viewpoint',    needles: /смотровая|viewpoint|обзор|вид с/i },
  { cat: 'museum',       needles: /музей|museum/i },
  { cat: 'attraction',   needles: /достопримеч|attraction/i },
]
const WEATHER_RE = /\bпогод|\bпрогноз|ауа рай|\bweather\b|\bforecast\b|температур|жарко|холодно|will it rain|дожд|ветер|снег|wind\b|sunrise|sunset|закат|восход/i
const NEAR_GENERIC_RE = /(что|where).{0,8}(рядом|вокруг|around|near|nearby|close to me|поблизости|near me)/i
const GO_RE = /(take me to|route to|поехали в|как добраться до|проложи маршрут|маршрут до|drive me to|navigate to)/i

function classifyIntent(userText) {
  if (!userText) return null
  const s = String(userText).trim()
  if (!s) return null
  const go = s.match(GO_RE)
  if (go) {
    const after = s.slice(go.index + go[0].length).replace(/[?!.,]+$/, '').trim()
    if (after) return { kind: 'go', destination: after }
  }
  for (const { bucket, needles } of SIGHT_KEYWORDS) {
    if (needles.test(s)) return { kind: 'sight', bucket }
  }
  if (WEATHER_RE.test(s)) return { kind: 'weather' }
  if (NEAR_GENERIC_RE.test(s)) {
    for (const { cat, needles } of NEAR_KEYWORDS) {
      if (needles.test(s)) return { kind: 'near', category: cat }
    }
    return { kind: 'near', category: 'attraction' }
  }
  for (const { cat, needles } of NEAR_KEYWORDS) {
    if (needles.test(s) && /рядом|вокруг|around|near|поблизост|закрыт|открыт|где|where/i.test(s)) {
      return { kind: 'near', category: cat }
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
  return null
}

const GREETING_RE = /^\s*(привет|здравствуй|здарова|здорово|hi|hey|hello|hola|салам|сәлем|salem|капля|kaplya|капелька|iz|из|йо|yo)[\s!.,?]*$/i
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

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } },
  maxDuration: 30,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method not allowed' })
  }
  try {
    const { messages, lang, location } = req.body ?? {}
    const L = (lang === 'en' || lang === 'ru' || lang === 'kk') ? lang : 'ru'
    const langName = LANG_NAME[L]

    const hasLoc =
      location &&
      Number.isFinite(location.lat) &&
      Number.isFinite(location.lon)

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

    const system = `You are Iz — a Mangystau local who knows the region cold. You're texting a traveler, not writing a brochure.

VOICE RULES (these are absolute):
- Reply in ${langName}.
- Maximum TWO short sentences. Aim for one. Never three.
- No emojis. No markdown. No bullet points. No URLs. No bracketed citations like "[domain.com]". No site names.
- Use contractions and warm, casual phrasing. Match the traveler's energy.
- NEVER explain what a word means in general. Assume they're a tourist in Mangystau asking about Mangystau.
- If you genuinely don't know, say so in one sentence — don't invent.
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

SUGGESTIONS — ALWAYS end your reply with [[SUGG:a|b|c]] containing three short follow-up taps the user might want next, each ≤30 chars, in ${langName}. Make them concrete and different from each other. Example: [[SUGG:Какая погода?|Что рядом?|Покажи Шеркалу]]

${SIGHT_CONTEXT}`

    const history = Array.isArray(messages)
      ? messages
          .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
          .slice(-12)
          .map((m) => ({ role: m.role, content: String(m.content).slice(0, 1200) }))
      : []

    const completion = await client.chat.completions.create({
      model: 'google/gemini-2.5-flash-lite',
      messages: [{ role: 'system', content: system }, ...history],
      max_tokens: 220,
      temperature: 0.6,
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? ''
    const parsed = await extractActions(raw, hasLoc ? location : null, L)

    const intent = classifyIntent(lastUser)
    const forced = await applyIntent(intent, hasLoc ? location : null, L)
    const finalAction = forced || parsed.action

    res.json({ text: parsed.clean, action: finalAction, suggestions: parsed.suggestions })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err?.message ?? 'voice chat failed' })
  }
}
