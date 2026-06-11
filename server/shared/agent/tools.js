import { pickReferences } from '../../references.js'
import { saveFact } from './memory.js'
import { buildOSMEmbed, fetchWeather, searchOSMPlaces } from '../voice-primitives.js'
import { searchWeb } from './tools/web-search.js'

export const TOOL_SCHEMA = [
  {
    type: 'function',
    function: {
      name: 'search_pois',
      description: 'Search for real places near the user using OpenStreetMap. Use for cafes, restaurants, hotels, fuel, shops, attractions, viewpoints, and nearby requests.',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'cafe, restaurant, fast_food, bar, fuel, hotel, supermarket, pharmacy, atm, parking, viewpoint, attraction, museum, mall, marketplace, bank, hospital, mosque, park, beach, things_to_do, food, shopping' },
          radius_km: { type: 'number', description: 'Optional search radius in km.' },
        },
        required: ['category'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Current weather and tomorrow forecast at the user location. Use for weather, rain, wind, sunrise, sunset, heat, cold.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'show_sight',
      description: 'Show the curated photo reel and tips for a known Mangystau landmark. Buckets: bozzhyra, sherkala, tuzbair, kyzylkup, torysh, caspian.',
      parameters: {
        type: 'object',
        properties: { bucket: { type: 'string' } },
        required: ['bucket'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'directions',
      description: 'Open Google Maps driving directions from the user to a named destination.',
      parameters: {
        type: 'object',
        properties: { destination: { type: 'string', description: 'Place name, e.g. Bozzhyra Canyon.' } },
        required: ['destination'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remember',
      description: 'Persist a stable user fact such as diet, travel style, trip dates, mobility limits. Use sparingly.',
      parameters: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Short snake_case key.' },
          value: { type: 'string', description: 'Short value under 100 characters.' },
        },
        required: ['key', 'value'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'plan_day',
      description: 'Build a quick day plan in Aktau or Mangystau. Use when the user asks what to do, куда сходить, чем заняться.',
      parameters: {
        type: 'object',
        properties: {
          mood: { type: 'string', description: 'Optional: photo, family, active, lazy.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the live web for current information: news, opening hours, prices, events, anything outside Mangystau curated data. Returns title + url + snippet for top results.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query. Be specific.' },
        },
        required: ['query'],
      },
    },
  },
]

function buildGmapsUrl(location, destination) {
  const dest = encodeURIComponent(
    /mangystau|mangistau|kazakhstan/i.test(destination)
      ? destination
      : `${destination}, Mangystau, Kazakhstan`,
  )
  const origin =
    location && Number.isFinite(location.lat) && Number.isFinite(location.lon)
      ? `&origin=${location.lat},${location.lon}`
      : ''
  return `https://www.google.com/maps/dir/?api=1${origin}&destination=${dest}&travelmode=driving`
}

function placesAction(category, loc, items) {
  const embedUrl = buildOSMEmbed(loc.lat, loc.lon, items)
  const listUrl = `https://www.google.com/maps/search/${encodeURIComponent(category)}/@${loc.lat},${loc.lon},13z`
  return { kind: 'places', category, items, embedUrl, listUrl, origin: { lat: loc.lat, lon: loc.lon } }
}

async function withTimeout(promise, ms, fallback) {
  let timer
  try {
    return await Promise.race([
      promise,
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

function fallbackItems(kind) {
  if (kind === 'food') {
    return [
      { name: 'Aktau cafe stop', tip: 'Pick a central cafe, then walk the promenade before sunset.' },
    ]
  }
  return [
    { name: 'Aktau promenade viewpoint', tip: 'Use the sea wall as a leading line near sunset.' },
  ]
}

export async function dispatchTool(name, args, ctx) {
  const L = ctx.lang || 'ru'
  const loc = ctx.location || null

  if (name === 'search_pois') {
    if (!loc) return { toolResult: { error: 'no_location', hint: 'Ask the user to share their location.' } }
    const cat = String(args?.category || 'restaurant')
    const items = await withTimeout(searchOSMPlaces(cat, loc.lat, loc.lon), 12000, [])
    const action = placesAction(cat, loc, items.slice(0, 8))
    return {
      display: action,
      toolResult: {
        category: cat,
        count: items.length,
        top: items.slice(0, 5).map((i) => ({ name: i.name, distance_km: i.distance_km })),
      },
    }
  }

  if (name === 'get_weather') {
    if (!loc) return { toolResult: { error: 'no_location' } }
    const weather = await fetchWeather(loc.lat, loc.lon, L)
    return { display: weather, toolResult: weather || { error: 'weather_unavailable' } }
  }

  if (name === 'show_sight') {
    const bucket = String(args?.bucket || '').toLowerCase()
    const photos = pickReferences(bucket, L).slice(0, 8)
    if (!photos.length) return { toolResult: { error: 'unknown_bucket', bucket } }
    return {
      display: { kind: 'sight', bucket, photos, routeUrl: buildGmapsUrl(loc, bucket) },
      toolResult: { bucket, photo_count: photos.length, sample_tip: photos[0]?.tip },
    }
  }

  if (name === 'directions') {
    const destination = String(args?.destination || '').slice(0, 120)
    if (!destination) return { toolResult: { error: 'missing_destination' } }
    const url = buildGmapsUrl(loc, destination)
    return { display: { kind: 'directions', destination, url }, toolResult: { destination, url } }
  }

  if (name === 'remember') {
    const key = String(args?.key || '').toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 40)
    const value = String(args?.value || '').slice(0, 200)
    if (!key || !value) return { toolResult: { error: 'invalid_fact' } }
    const result = await saveFact(ctx.userId, key, value)
    return { toolResult: { saved: result.ok, key, value } }
  }

  if (name === 'plan_day') {
    if (!loc) return { toolResult: { error: 'no_location' } }
    const [food, viewpoint] = await Promise.all([
      withTimeout(searchOSMPlaces('restaurant', loc.lat, loc.lon), 7000, []),
      withTimeout(searchOSMPlaces('viewpoint', loc.lat, loc.lon), 7000, []),
    ])
    const caspianPhotos = pickReferences('caspian', L).slice(0, 2)
    const action = {
      kind: 'plan',
      mood: args?.mood || null,
      origin: { lat: loc.lat, lon: loc.lon },
      blocks: [
        { label: 'sight', items: caspianPhotos },
        { label: 'food', items: food.length ? food.slice(0, 3) : fallbackItems('food') },
        { label: 'view', items: viewpoint.length ? viewpoint.slice(0, 2) : fallbackItems('view') },
      ],
    }
    return {
      display: action,
      toolResult: {
        sight: caspianPhotos.map((p) => p.tip),
        food: (food.length ? food.slice(0, 3) : fallbackItems('food')).map((i) => i.name),
        view: (viewpoint.length ? viewpoint.slice(0, 2) : fallbackItems('view')).map((i) => i.name),
      },
    }
  }

  if (name === 'web_search') {
    const query = String(args?.query || '').slice(0, 200)
    if (!query) return { toolResult: { error: 'missing_query' } }
    const items = await withTimeout(searchWeb(query, 5), 8000, [])
    return {
      display: { kind: 'web_results', query, items },
      toolResult: {
        query,
        count: items.length,
        results: items.map((r) => ({ title: r.title, snippet: r.snippet, url: r.url })),
      },
    }
  }

  return { toolResult: { error: 'unknown_tool', name } }
}
