// whatsapp.js — book-via-WhatsApp tool.
// Finds a phone for a named place (OSM Overpass first, DuckDuckGo fallback),
// builds a wa.me deep link with the LLM-drafted message, and surfaces the
// "Send now" affordance if the optional whatsapp-worker is configured.

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

const PHONE_RE = /\+?\d[\d\s().-]{7,18}\d/g

function normaliseE164(raw) {
  if (!raw) return null
  let digits = String(raw).replace(/[^\d+]/g, '')
  if (!digits) return null
  if (digits.startsWith('00')) digits = '+' + digits.slice(2)
  if (!digits.startsWith('+')) {
    // Kazakhstan mobile/landline default — most numbers in Mangystau start with 7
    if (digits.length >= 10 && digits.startsWith('8')) digits = '+7' + digits.slice(1)
    else if (digits.length === 10) digits = '+7' + digits
    else if (digits.length === 11 && digits.startsWith('7')) digits = '+' + digits
    else digits = '+' + digits
  }
  const compact = digits.replace(/[^\d+]/g, '')
  // basic sanity: + plus 8–15 digits per E.164
  return /^\+\d{8,15}$/.test(compact) ? compact : null
}

function formatDisplay(e164) {
  if (!e164) return ''
  // light grouping for readability
  const m = e164.match(/^\+(\d{1,3})(\d{3})(\d{3})(\d+)$/)
  if (!m) return e164
  return `+${m[1]} ${m[2]} ${m[3]} ${m[4]}`
}

async function overpassQuery(query) {
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: query,
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) continue
      const json = await res.json()
      if (json?.elements?.length) return json.elements
    } catch {
      /* try next mirror */
    }
  }
  return []
}

async function findPhoneOSM(name, location) {
  if (!name || !location) return null
  const safeName = name.replace(/["\\]/g, '').slice(0, 60)
  const lat = Number(location.lat)
  const lon = Number(location.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  // Search up to 25 km around the user; covers Aktau + Mangystau road stops.
  const query = `[out:json][timeout:8];
(
  node["name"~"${safeName}",i](around:25000,${lat},${lon});
  way["name"~"${safeName}",i](around:25000,${lat},${lon});
);
out tags 10;`
  const elements = await overpassQuery(query)
  for (const el of elements) {
    const tags = el?.tags || {}
    const phone = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || tags['contact:whatsapp']
    if (phone) {
      const norm = normaliseE164(phone.split(';')[0])
      if (norm) return { phone: norm, source: 'osm', name: tags.name || name }
    }
  }
  return null
}

async function findPhoneWeb(name, searchFn) {
  if (!name || typeof searchFn !== 'function') return null
  const q = `${name} Aktau Mangystau phone whatsapp`
  const results = await searchFn(q, 5).catch(() => [])
  for (const r of results) {
    const text = `${r?.title || ''} ${r?.snippet || ''}`
    const matches = text.match(PHONE_RE) || []
    for (const m of matches) {
      const norm = normaliseE164(m)
      if (norm) return { phone: norm, source: 'web', name }
    }
  }
  return null
}

export function buildWaUrl(e164, message) {
  if (!e164) return null
  const num = e164.replace(/[^\d]/g, '')
  const text = encodeURIComponent(String(message || '').slice(0, 1500))
  return `https://wa.me/${num}?text=${text}`
}

export function workerConfigured() {
  return Boolean(process.env.WHATSAPP_WORKER_URL && process.env.WHATSAPP_WORKER_SECRET)
}

/**
 * Build the WhatsApp action.
 * @param {object} opts
 * @param {string} opts.name       Place name shown to the user.
 * @param {string} opts.message    LLM-drafted message body.
 * @param {string} [opts.phone]    Known phone (any common format).
 * @param {object} [opts.location] User location for OSM phone lookup.
 * @param {function} [opts.searchWeb] Web search fallback.
 * @returns {{ kind:'whatsapp', name:string, phone:string|null, phoneDisplay:string, draft:string, waUrl:string|null, source:string|null, canSendDirect:boolean }}
 */
export async function buildWhatsappBooking({ name, message, phone, location, searchWeb }) {
  const cleanName = String(name || '').trim().slice(0, 80) || 'Place'
  const draft = String(message || '').trim()

  let resolved = phone ? normaliseE164(phone) : null
  let source = phone ? 'user' : null

  if (!resolved) {
    const osm = await findPhoneOSM(cleanName, location)
    if (osm) {
      resolved = osm.phone
      source = osm.source
    }
  }
  if (!resolved) {
    const web = await findPhoneWeb(cleanName, searchWeb)
    if (web) {
      resolved = web.phone
      source = web.source
    }
  }

  const waUrl = buildWaUrl(resolved, draft)
  return {
    kind: 'whatsapp',
    name: cleanName,
    phone: resolved,
    phoneDisplay: formatDisplay(resolved),
    draft,
    waUrl,
    source,
    canSendDirect: workerConfigured() && Boolean(resolved),
  }
}
