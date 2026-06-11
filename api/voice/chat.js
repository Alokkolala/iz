import OpenAI from 'openai'

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

async function extractActions(text, location) {
  if (!text) return { clean: '', action: null }
  let clean = text
  let action = null

  const near = clean.match(/\[\[NEAR:\s*([a-z_]+)\s*\]\]/i)
  if (near && location) {
    const category = near[1].toLowerCase()
    clean = clean.replace(near[0], '').replace(/\s{2,}/g, ' ').trim()
    const items = await searchOSMPlaces(category, location.lat, location.lon)
    const embedUrl = buildOSMEmbed(location.lat, location.lon, items)
    const listUrl = `https://www.google.com/maps/search/${encodeURIComponent(category)}/@${location.lat},${location.lon},13z`
    action = { kind: 'places', category, items, embedUrl, listUrl, origin: { lat: location.lat, lon: location.lon } }
  }

  const go = clean.match(/\[\[GO:\s*([^\]]+?)\s*\]\]/i)
  if (go && !action) {
    let destination = go[1].trim()
    clean = clean.replace(go[0], '').replace(/\s{2,}/g, ' ').trim()
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

  return { clean, action }
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
    const locLine = hasLoc
      ? `The user is right now at latitude ${location.lat.toFixed(4)}, longitude ${location.lon.toFixed(4)}${location.place ? ` (near ${location.place})` : ''}. Tailor distances, drive times and "what's nearby" to that.`
      : `You don't know where the user is. If a recommendation needs their location, ask once, briefly.`

    const system = `You are Iz — a smart, friendly travel companion who knows Mangystau, Kazakhstan inside out. You sound like a close friend on a road trip, not a tour brochure.
Speak entirely in ${langName}. No emojis, no markdown, no bullet lists.

You have three superpowers. Choose at most ONE marker per reply, never both.

1. LIVE WEB SEARCH — use it freely for opening hours, current weather, road conditions, festivals, prices, news, or anything you're not sure about. Prefer fresh facts over guessing.

2. NEARBY PLACES — when the user asks what's NEAR them, AROUND, "что рядом", "what's close", "где поесть/заправиться/остановиться" — end your reply with EXACTLY ONE of these markers on its own line:
   [[NEAR:cafe]] [[NEAR:restaurant]] [[NEAR:fast_food]] [[NEAR:bar]]
   [[NEAR:fuel]] [[NEAR:hotel]] [[NEAR:supermarket]] [[NEAR:pharmacy]]
   [[NEAR:atm]] [[NEAR:parking]] [[NEAR:viewpoint]] [[NEAR:attraction]] [[NEAR:museum]]
   The app will then show a real map with up to 6 actual nearby places.
   When you emit a NEAR marker, DO NOT invent or list place names in your sentence — just say something tight like "here are the closest cafes" or "let's see what's around". The map and cards do the listing.

3. DIRECTIONS — when the user wants to GO to one specific named place ("take me to Bozzhyra", "show me the route to Sherkala"), end with:
   [[GO:<clean English place name only, e.g. "Bozzhyra Canyon">]]
   NEVER put coordinates, numbers, "near", queries or category words inside [[GO:...]]. Only a real place name.

Marker rules:
- Never mention, quote, or read the marker out loud. It is invisible stage directions for the app.
- Use NEAR when the answer is "many options around here". Use GO only for a single specific destination.
- If neither fits, no marker.

How to talk:
- Answer the user's actual question first, directly, in 1–3 short sentences.
- Use contractions and casual phrasing. Match their energy.
- Travel and Mangystau are your wheelhouse, but you can answer general questions too — just keep replies tight.
- If you searched the web, weave the fact in naturally (e.g. "looks like it's open till 8").
- If you genuinely don't know, say so in one sentence.
- ${locLine}

${SIGHT_CONTEXT}`

    const history = Array.isArray(messages)
      ? messages
          .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
          .slice(-12)
          .map((m) => ({ role: m.role, content: String(m.content).slice(0, 1200) }))
      : []

    const completion = await client.chat.completions.create({
      model: 'google/gemini-2.5-flash-lite:online',
      messages: [{ role: 'system', content: system }, ...history],
      max_tokens: 320,
      temperature: 0.7,
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? ''
    const { clean, action } = await extractActions(raw, hasLoc ? location : null)
    res.json({ text: clean, action })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err?.message ?? 'voice chat failed' })
  }
}
