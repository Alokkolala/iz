import { pickReferences } from '../../../references.js'
import { fetchWeather, searchOSMPlaces } from '../../voice-primitives.js'
import { loadUserFacts } from '../memory.js'
import { pickTopPicks } from './whatsapp-places.js'

const CURATED_CATEGORIES = new Set(['hotel', 'restaurant', 'tour'])

function gmapsSearchUrl(name) {
  return `https://www.google.com/maps/search/${encodeURIComponent(name + ', Aktau, Kazakhstan')}`
}

function formatPhone(e164) {
  if (!e164) return ''
  const m = e164.match(/^\+(\d{1,3})(\d{3})(\d{3})(\d+)$/)
  return m ? `+${m[1]} ${m[2]} ${m[3]} ${m[4]}` : e164
}

const CATEGORY_HEADLINE = {
  hotel: { en: 'Top hotels in Aktau', ru: 'Лучшие отели Актау', kk: 'Ақтаудағы үздік қонақүйлер' },
  restaurant: { en: 'Top picks to eat', ru: 'Куда сходить поесть', kk: 'Тамақтанарлық жерлер' },
  tour: { en: 'Top Mangystau tour operators', ru: 'Лучшие тур-операторы по Мангистау', kk: 'Маңғыстау бойынша үздік тур-операторлар' },
}

function buildCuratedRecommendations({ category, lang, vibe }) {
  const picks = pickTopPicks(category, { lang, vibe, limit: 3 })
  if (!picks.length) return null
  const headline = CATEGORY_HEADLINE[category]?.[lang] || CATEGORY_HEADLINE[category]?.en || category
  return {
    mood: vibe || null,
    timeOfDay: headline,
    weatherNote: null,
    factsApplied: null,
    items: picks.map((p) => ({
      type: category,
      title: p.name,
      reason: p.pitch || formatPhone(p.phone),
      phone: p.phone,
      phoneDisplay: formatPhone(p.phone),
      url: gmapsSearchUrl(p.name),
      tier: p.tier,
    })),
  }
}

const SIGHTS = ['bozzhyra', 'sherkala', 'tuzbair', 'kyzylkup', 'torysh', 'caspian']

function pickSightForMood(mood, factsText) {
  const t = `${mood || ''} ${factsText || ''}`.toLowerCase()
  if (/photo|insta|reel|shot/.test(t)) return 'bozzhyra'
  if (/family|kid|easy|lazy/.test(t)) return 'caspian'
  if (/hike|active|trek/.test(t)) return 'sherkala'
  if (/colour|color|red|salt/.test(t)) return 'kyzylkup'
  return SIGHTS[Math.floor(Math.random() * SIGHTS.length)]
}

function timeOfDay(now = new Date()) {
  const h = (now.getUTCHours() + 5) % 24 // Aktau = UTC+5
  if (h < 11) return 'morning'
  if (h < 16) return 'midday'
  if (h < 20) return 'afternoon'
  return 'evening'
}

export async function buildRecommendations({ location, mood, userId, lang, category, vibe }) {
  if (category && CURATED_CATEGORIES.has(category)) {
    const curated = buildCuratedRecommendations({ category, lang, vibe: vibe || mood })
    if (curated) return curated
  }
  if (!location) return null
  const [weather, food, viewpoints, facts] = await Promise.all([
    fetchWeather(location.lat, location.lon, lang).catch(() => null),
    searchOSMPlaces('restaurant', location.lat, location.lon).catch(() => []),
    searchOSMPlaces('viewpoint', location.lat, location.lon).catch(() => []),
    loadUserFacts(userId).catch(() => ({})),
  ])

  const factsText = Object.entries(facts || {})
    .map(([k, v]) => `${k}:${v}`)
    .join(' ')

  const sightBucket = pickSightForMood(mood, factsText)
  const sightPhotos = pickReferences(sightBucket, lang).slice(0, 1)
  const tod = timeOfDay()
  const sightReason =
    tod === 'evening' || tod === 'afternoon'
      ? `${sightBucket} hits hardest at golden hour.`
      : `Morning light at ${sightBucket} keeps the heat off.`

  const foodPick = food[0]
    ? { name: food[0].name, distance_km: food[0].distance_km, url: food[0].url }
    : null
  const viewPick = viewpoints[0]
    ? { name: viewpoints[0].name, distance_km: viewpoints[0].distance_km, url: viewpoints[0].url }
    : null

  const weatherNote = weather
    ? `${weather.tempC}° ${weather.label}, wind ${weather.windKmh} km/h`
    : null

  return {
    mood: mood || null,
    timeOfDay: tod,
    weatherNote,
    factsApplied: factsText || null,
    items: [
      {
        type: 'sight',
        title: sightBucket.charAt(0).toUpperCase() + sightBucket.slice(1),
        reason: sightReason,
        photo: sightPhotos[0]?.src || null,
        action: { kind: 'show_sight', bucket: sightBucket },
      },
      foodPick && {
        type: 'food',
        title: foodPick.name,
        reason: `~${foodPick.distance_km} km from you. Fuel before the drive.`,
        url: foodPick.url,
      },
      viewPick && {
        type: 'view',
        title: viewPick.name,
        reason: `Quick viewpoint stop, ${viewPick.distance_km} km out.`,
        url: viewPick.url,
      },
    ].filter(Boolean),
  }
}
