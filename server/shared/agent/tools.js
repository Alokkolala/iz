import { pickReferences } from '../../references.js'
import { saveFact } from './memory.js'
import { buildOSMEmbed, fetchWeather, searchOSMPlaces } from '../voice-primitives.js'
import { searchWeb } from './tools/web-search.js'
import { buildMultiStopRoute } from './tools/route.js'
import { buildRecommendations } from './tools/recommend.js'
import { buildWhatsappBooking } from './tools/whatsapp.js'

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
  {
    type: 'function',
    function: {
      name: 'build_route',
      description: 'Build a multi-stop driving route from the user location through one or more places. Use for itineraries, road trips, or "take me to A then B then C".',
      parameters: {
        type: 'object',
        properties: {
          stops: {
            type: 'array',
            description: 'Ordered list of place names. Last item is the final destination.',
            items: { type: 'string' },
          },
        },
        required: ['stops'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_whatsapp',
      description: 'Draft a booking / enquiry message and prepare a WhatsApp deep link to a real place. Use when the user asks to book a table, reserve a tour, contact a hotel or shop. The agent writes the message in the user\'s language; this tool finds the phone (OSM + web) and returns a card with Open in WhatsApp.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Place name, e.g. "Cafe Riviera" or "Hotel Caspian".' },
          message: { type: 'string', description: 'Polite booking / enquiry message in the user language. Mention party size and time if known.' },
          phone: { type: 'string', description: 'Optional known phone number, any common format.' },
        },
        required: ['name', 'message'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'recommend',
      description: 'Curated personalised recommendations. Two modes:\n• Open-ended ("what should I do", "surprise me"): leave category empty, combines time of day, weather, user memory, and nearby places.\n• Best-of-category ("which hotel is the best", "recommend a restaurant", "самый-самый отель", "лучший тур"): pass category=hotel|restaurant|tour. Returns the hand-ranked top picks from the curated Aktau/Mangystau cache with phones for WhatsApp booking — NOT nearest-neighbour OSM. Always prefer this over search_pois when the user asks for the "best", "top", "most impressive", or "recommended" hotel/restaurant/tour.',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Optional. hotel | restaurant | tour. Set when the user asks for the best/top/most impressive/recommended one.' },
          mood: { type: 'string', description: 'Optional mood/vibe: luxury, family, business, photo, foodie, budget, view, pub.' },
        },
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

  if (name === 'build_route') {
    const stops = Array.isArray(args?.stops) ? args.stops : []
    const result = await withTimeout(buildMultiStopRoute(loc, stops), 12000, null)
    if (!result) return { toolResult: { error: 'route_failed', stops } }
    return {
      display: { kind: 'route', url: result.url, stops: result.stops, origin: loc },
      toolResult: {
        url: result.url,
        stops: result.stops.map((s) => s.name),
      },
    }
  }

  if (name === 'book_whatsapp') {
    const placeName = String(args?.name || '').slice(0, 80)
    const message = String(args?.message || '').slice(0, 1200)
    const phoneArg = args?.phone ? String(args.phone).slice(0, 30) : null
    if (!placeName || !message) return { toolResult: { error: 'missing_fields' } }
    const action = await withTimeout(
      buildWhatsappBooking({
        name: placeName,
        message,
        phone: phoneArg,
        location: loc,
        searchWeb,
      }),
      12000,
      null,
    )
    if (!action) return { toolResult: { error: 'whatsapp_failed' } }
    return {
      display: action,
      toolResult: {
        name: action.name,
        phone: action.phone,
        source: action.source,
        canSendDirect: action.canSendDirect,
        waUrl: action.waUrl,
      },
    }
  }

  if (name === 'recommend') {
    const mood = args?.mood ? String(args.mood).slice(0, 40) : null
    const rawCategory = args?.category ? String(args.category).toLowerCase().slice(0, 20) : null
    const category = rawCategory && ['hotel', 'restaurant', 'tour'].includes(rawCategory) ? rawCategory : null
    const rec = await buildRecommendations({
      location: loc,
      mood,
      userId: ctx.userId,
      lang: L,
      category,
      vibe: mood,
    })
    if (!rec) return { toolResult: { error: 'no_location' } }
    return {
      display: { kind: 'recommend', ...rec },
      toolResult: {
        timeOfDay: rec.timeOfDay,
        weatherNote: rec.weatherNote,
        factsApplied: rec.factsApplied,
        category,
        picks: rec.items.map((i) => ({ type: i.type, title: i.title, phone: i.phone || null })),
      },
    }
  }

  return { toolResult: { error: 'unknown_tool', name } }
}
