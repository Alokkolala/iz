import { pickReferences } from '../references.js'

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
const WEATHER_RE = /погод|прогноз|ауа рай|\bweather\b|\bforecast\b|температур|жарко|холодно|will it rain|дожд|ветер|снег|\bwind\b|sunrise|sunset|закат|восход/i
const NEAR_GENERIC_RE = /(что|where).{0,8}(рядом|вокруг|around|near|nearby|close to me|поблизости|near me)/i
const GO_RE = /(take me to|route to|how (?:do|can) i get to|how to get to|поехали в|как добраться до|как попасть (?:до|в|к|на)|как доехать до|как пройти (?:до|в|к)|проложи маршрут|маршрут до|маршрут для до|drive me to|navigate to|проводи меня|проводи до|қалай бару|қалай жету|қалай өту)/i
const NEAREST_RE = /(ближайш|nearest|closest|самый близкий|самой близкой)/i
const RECALL_RE = /(ту точк|эту точк|что (?:ты )?показал|показал.{0,12}карт|что это (?:был[оа]|за)|where did you|that map|that pin|that point|тот пин|та метк)/i
const NEAR_VERB_RE = /(скажи|найди|поищ|посовет|покажи мне|подскажи|есть ли|какие|какой|какая|какое|самый|самая|самое|самые|лучш|новейш|tell me|find me?|show me|which|what(?:'s| is) the|recommend|nearest|best|newest)/i
const SUPERLATIVE_RE = /(самый|самая|самое|самые|лучш|новейш|новая|новый|новое|новые|best|newest|nicest|fanciest|cheapest|самый дешёв|самый дорог)/i

function classifyIntent(userText) {
  if (!userText) return null
  const s = String(userText).trim()
  if (!s) return null
  if (RECALL_RE.test(s)) return { kind: 'recall' }
  const go = s.match(GO_RE)
  if (go) {
    const after = s.slice(go.index + go[0].length).replace(/[?!.,]+$/, '').trim()
    if (after) {
      if (NEAREST_RE.test(after) || NEAREST_RE.test(s)) {
        for (const { cat, needles } of NEAR_KEYWORDS) {
          if (needles.test(after) || needles.test(s)) {
            return { kind: 'go_nearest', category: cat }
          }
        }
      }
      for (const { bucket, needles } of SIGHT_KEYWORDS) {
        if (needles.test(after)) return { kind: 'go_sight', bucket, destination: after }
      }
      return { kind: 'go', destination: after }
    }
  }
  if (NEAREST_RE.test(s)) {
    for (const { cat, needles } of NEAR_KEYWORDS) {
      if (needles.test(s)) return { kind: 'near', category: cat }
    }
  }
  for (const { bucket, needles } of SIGHT_KEYWORDS) {
    if (needles.test(s)) return { kind: 'sight', bucket }
  }
  if (WEATHER_RE.test(s)) return { kind: 'weather' }
  if (NEAR_GENERIC_RE.test(s)) {
    for (const { cat, needles } of NEAR_KEYWORDS) {
      if (needles.test(s)) return { kind: 'near', category: cat }
    }
    return { kind: 'near', category: 'things_to_do' }
  }
  for (const { cat, needles } of NEAR_KEYWORDS) {
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
    const items = await searchOSMPlaces(intent.category, location.lat, location.lon)
    const target = items[0]
    if (!target) {
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
  return null
}

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


export {
  SIGHT_CONTEXT,
  LANG_NAME,
  searchOSMPlaces,
  buildOSMEmbed,
  fetchWeather,
  extractActions,
  classifyIntent,
  applyIntent,
  GREETING_RE,
  CURRENT_INFO_RE,
  GREETINGS,
  GREETING_SUGGS,
  summarizeLastAction,
  narrateForcedAction,
}
