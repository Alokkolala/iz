// whatsapp-places.js — local phone cache for popular Mangystau venues.
// Scraped from 2GIS, official sites, TripAdvisor, and Aktau expat directories
// on 2026-06-12. Used as the fast path before OSM Overpass / web search.
//
// When adding entries: prefer +7 7XX (mobile) or +7 7292 (Aktau landline).
// Aliases should include Cyrillic forms when the place is widely known by them.
// `tier` 1 = flagship/luxury/most-recommended, 2 = great, 3 = solid.

export const PLACES = [
  // ---------- Restaurants & bars ----------
  {
    name: 'Guns & Roses / Bukowski',
    aliases: ['Guns and Roses', 'GnR Pub', 'Pub Grill Bukowski', 'Bukowski', 'Буковски', 'Ганз энд Роузес'],
    phone: '+77753326326',
    category: 'restaurant',
    city: 'Aktau',
    source: 'tripadvisor',
  },
  {
    name: 'Stetson (Shamrock Irish Pub)',
    aliases: ['Stetson', 'The Shamrock', 'Shamrock Irish Pub', 'Стетсон', 'Shamrock'],
    phone: '+77292521838',
    category: 'restaurant',
    city: 'Aktau',
    source: 'aktauexpats',
  },
  {
    name: 'Karvon',
    aliases: ['Karvon Restaurant', 'Карвон'],
    phone: '+77292524848',
    category: 'restaurant',
    city: 'Aktau',
    source: '2gis',
  },
  {
    name: 'Buhara',
    aliases: ['Bukhara', 'Buhara Restaurant', 'Бухара'],
    phone: '+77073317612',
    category: 'restaurant',
    city: 'Aktau',
    source: 'tripadvisor',
  },
  {
    name: 'Arabica',
    aliases: ['Арабика', 'Arabica Restaurant'],
    phone: '+77292521243',
    category: 'restaurant',
    city: 'Aktau',
    source: 'aktauexpats',
  },
  {
    name: 'Ashoka',
    aliases: ['Ashoka Indian', 'Ашока'],
    phone: '+77292303777',
    category: 'restaurant',
    city: 'Aktau',
    source: 'aktauexpats',
  },
  {
    name: 'Assorti',
    aliases: ['Assorti Aktau Mall', 'Ассорти'],
    phone: '+77292336335',
    category: 'restaurant',
    city: 'Aktau',
    source: 'aktauexpats',
  },
  {
    name: 'Beefeater',
    aliases: ['New CinZano', 'CinZano', 'Бифитер'],
    phone: '+77071016336',
    category: 'restaurant',
    city: 'Aktau',
    source: 'aktauexpats',
  },
  {
    name: 'Cafe de Ist',
    aliases: ['Cafe de İst', 'Кафе де Ист'],
    phone: '+77292335267',
    category: 'restaurant',
    city: 'Aktau',
    source: 'aktauexpats',
  },
  {
    name: 'Coffee and People',
    aliases: ['Coffee & People', 'Кофе энд Пипл'],
    phone: '+77292530030',
    category: 'restaurant',
    city: 'Aktau',
    source: 'aktauexpats',
  },
  {
    name: 'Ellis',
    aliases: ['Ellis Pub', 'Эллис'],
    phone: '+77292438511',
    category: 'restaurant',
    city: 'Aktau',
    source: 'aktauexpats',
  },
  {
    name: 'English Bar and Grill',
    aliases: ['English Pub', 'Golden Palace Pub', 'Инглиш Бар', 'Инглиш Бар и Грилль'],
    phone: '+77292600699',
    category: 'restaurant',
    city: 'Aktau',
    source: 'aktauexpats',
  },
  {
    name: 'Modigliani',
    aliases: ['Modigliani Georgian', 'Модильяни'],
    phone: '+77292510676',
    category: 'restaurant',
    city: 'Aktau',
    source: 'aktauexpats',
  },
  {
    name: 'Napoli',
    aliases: ['Napoli Laguna', 'Наполи'],
    phone: '+77292526463',
    category: 'restaurant',
    city: 'Aktau',
    source: 'aktauexpats',
  },
  {
    name: 'Pinta',
    aliases: ['Pinta Cafe', 'Пинта'],
    phone: '+77292311740',
    category: 'restaurant',
    city: 'Aktau',
    source: 'aktauexpats',
  },
  {
    name: 'Silk Lounge',
    aliases: ['Silk', 'Silk Restaurant', 'Renaissance Silk', 'Шёлк', 'Шелк'],
    phone: '+77292300600',
    category: 'restaurant',
    city: 'Aktau',
    source: 'aktauexpats',
  },
  {
    name: 'Star of David',
    aliases: ['Звезда Давида'],
    phone: '+77292504070',
    category: 'restaurant',
    city: 'Aktau',
    source: 'aktauexpats',
  },
  {
    name: 'Sultan',
    aliases: ['Sultan Restaurant', 'Grand Nur Plaza Sultan', 'Султан'],
    phone: '+77292200000',
    category: 'restaurant',
    city: 'Aktau',
    source: 'aktauexpats',
  },
  {
    name: 'Taksim',
    aliases: ['Taksim Restaurant', 'Таксим'],
    phone: '+77292431588',
    category: 'restaurant',
    city: 'Aktau',
    source: 'aktauexpats',
  },
  {
    name: "The Old Forester's",
    aliases: ['Old Foresters', 'Old Foresters Pub', 'Grand Hotel Victory Pub'],
    phone: '+77292700000',
    category: 'restaurant',
    city: 'Aktau',
    source: 'aktauexpats',
  },
  {
    name: 'Sky Bar',
    aliases: ['SkyBar', 'Holiday Inn Sky Bar', 'Скай Бар'],
    phone: '+77292290707',
    category: 'restaurant',
    city: 'Aktau',
    source: 'aktau-gid',
  },

  // ---------- Hotels ----------
  {
    name: 'Rixos Water World Aktau',
    aliases: ['Rixos Aktau', 'Rixos', 'Риксос Актау', 'Rixos Resort'],
    phone: '+77292217777',
    category: 'hotel',
    city: 'Aktau',
    source: 'rixos.com',
  },
  {
    name: 'Renaissance Aktau Hotel',
    aliases: ['Renaissance Aktau', 'Renaissance', 'Marriott Renaissance', 'Ренессанс Актау'],
    phone: '+77292300600',
    category: 'hotel',
    city: 'Aktau',
    source: 'marriott',
  },
  {
    name: 'Holiday Inn Aktau',
    aliases: ['Holiday Inn', 'Holiday Inn Aktau City Centre', 'Холидей Инн Актау'],
    phone: '+77292290707',
    category: 'hotel',
    city: 'Aktau',
    source: 'ihg.com',
  },
  {
    name: 'Caspian Riviera Grand Palace',
    aliases: ['Caspian Riviera', 'Riviera Grand Palace', 'Каспиан Ривьера', 'Riviera Hotel'],
    phone: '+77292424000',
    category: 'hotel',
    city: 'Aktau',
    source: 'caspianriviera.kz',
  },
  {
    name: 'Grand Hotel Victory',
    aliases: ['Victory Hotel', 'Grand Victory Aktau', 'Гранд Виктори'],
    phone: '+77292700000',
    category: 'hotel',
    city: 'Aktau',
    source: 'grandhotelvictory.kz',
  },
  {
    name: 'Chagala Aktau Hotel',
    aliases: ['Chagala', 'Chagala Hotel', 'Чагала Актау'],
    phone: '+77292541010',
    category: 'hotel',
    city: 'Aktau',
    source: 'chagalagroup.kz',
  },
  {
    name: 'Aktau Hotel',
    aliases: ['Hotel Aktau', 'Гостиница Актау'],
    phone: '+77292504707',
    category: 'hotel',
    city: 'Aktau',
    source: 'instagram',
  },
  {
    name: 'Grand Nur Plaza Hotel',
    aliases: ['Grand Nur Plaza', 'Nur Plaza', 'Гранд Нур Плаза'],
    phone: '+77292405601',
    category: 'hotel',
    city: 'Aktau',
    source: 'grandnurplazahotel.com',
  },
  {
    name: 'Golden Palace Hotel',
    aliases: ['Golden Palace', 'Hotel Golden Palace Aktau', 'Голден Палас'],
    phone: '+77292600699',
    category: 'hotel',
    city: 'Aktau',
    source: 'aktauexpats',
  },

  // ---------- Tour operators ----------
  {
    name: 'Mangystau Tour 999',
    aliases: ['Mangystau Jeep Tour 999', 'Mangystautour999', 'Tour999'],
    phone: '+77009099986',
    category: 'tour',
    city: 'Aktau',
    source: 'mangystautour999.kz',
  },
  {
    name: 'Travel to Mangistau',
    aliases: ['TraveltoMangistau', 'Travel to Mangystau', 'Eduard Chuishbaev Tours'],
    phone: '+77024663322',
    category: 'tour',
    city: 'Aktau',
    source: 'traveltomangistau.kz',
  },
  {
    name: 'Mangystau Tourist',
    aliases: ['Tourist LLP', 'Aktau Tourist LLP', 'Mangystau Tourist LLP'],
    phone: '+77079800104',
    category: 'tour',
    city: 'Aktau',
    source: 'mangystau-tourist.com',
  },
  {
    name: 'Redmaya Travel',
    aliases: ['Red Maya Travel', 'Redmaya Mangystau', 'Redmaya'],
    phone: '+77712869516',
    category: 'tour',
    city: 'Aktau',
    source: 'redmaya-travel.kz',
  },

  // ---------- Attractions ----------
  {
    name: 'Laguna Aquapark',
    aliases: ['Laguna Akvapark', 'Aktau Aquapark', 'Лагуна Аквапарк', 'Аквапарк Лагуна'],
    phone: '+77055552828',
    category: 'attraction',
    city: 'Aktau',
    source: 'laguna-aktau.kz',
  },
  {
    name: 'Mangystau Regional Local History Museum',
    aliases: [
      'Mangystau Regional Museum',
      'Mangystau Museum',
      'Aktau Museum',
      'Мангистауский областной краеведческий музей',
      'Краеведческий музей',
    ],
    phone: '+77292427196',
    category: 'attraction',
    city: 'Aktau',
    source: 'ticketon.kz',
  },
]

// --- curated ranking ---------------------------------------------------------
// Hand-ordered by reputation / size / how often a traveler in Aktau actually
// asks for them. Keys must match a PLACES[].name exactly.
const RANK = {
  hotel: [
    { name: 'Rixos Water World Aktau', tier: 1, vibe: ['luxury', 'family', 'beach'], pitch: { en: 'Aktau\'s flagship beach resort — aquapark, sea-view rooms, the splashiest option in town.', ru: 'Флагман побережья Актау — аквапарк, номера с видом на море, самый эффектный вариант.', kk: 'Ақтаудың жалаушалы жағажай курорты — аквапарк, теңіз көрінісі, ең әсерлі нұсқа.' } },
    { name: 'Caspian Riviera Grand Palace', tier: 1, vibe: ['luxury', 'sea'], pitch: { en: 'Big seafront hotel on the promenade, popular for sunset terraces and event rooms.', ru: 'Большой отель на набережной, известен закатной террасой и банкетными залами.', kk: 'Жағалаудағы үлкен қонақүй, ауа-райы террасасымен танымал.' } },
    { name: 'Renaissance Aktau Hotel', tier: 1, vibe: ['business', 'central'], pitch: { en: 'Marriott\'s Aktau property — central, reliable, the safe pick for business stays.', ru: 'Marriott в Актау — центр, стабильный сервис, удобно для деловой поездки.', kk: 'Marriott желісі Ақтауда — орталықта, тұрақты қызмет, іс-сапарға ыңғайлы.' } },
    { name: 'Holiday Inn Aktau', tier: 2, vibe: ['business', 'central'], pitch: { en: 'IHG mid-tier in microdistrict 4 — Sky Bar on top, easy walk to the sea.', ru: 'IHG в 4-м микрорайоне — Sky Bar наверху, до моря пешком.', kk: '4 ықшамаудандағы IHG — үстінде Sky Bar, теңізге жаяу жетесіз.' } },
    { name: 'Grand Hotel Victory', tier: 2, vibe: ['classic'], pitch: { en: 'Classic Aktau hotel with the Old Forester\'s pub downstairs.', ru: 'Классический отель Актау с пабом Old Forester\'s внизу.', kk: 'Old Forester\'s паб орналасқан классикалық Ақтау қонақүйі.' } },
    { name: 'Chagala Aktau Hotel', tier: 2, vibe: ['business', 'expat'], pitch: { en: 'Long-time expat favourite — quiet, professional, good for longer stays.', ru: 'Давний фаворит экспатов — тихий, профессиональный, удобен для долгих поездок.', kk: 'Шетелдіктердің ұнатқан тыныш, кәсіби қонақүйі.' } },
    { name: 'Grand Nur Plaza Hotel', tier: 3, vibe: ['classic'] },
    { name: 'Golden Palace Hotel', tier: 3, vibe: ['classic'] },
    { name: 'Aktau Hotel', tier: 3, vibe: ['budget'] },
  ],
  restaurant: [
    { name: 'Guns & Roses / Bukowski', tier: 1, vibe: ['pub', 'foodie'], pitch: { en: 'The most talked-about steakhouse-pub in Aktau, busy most nights.', ru: 'Самый обсуждаемый стейк-паб Актау, по вечерам всегда людно.', kk: 'Ақтаудың ең танымал стейк-пабы, кештері әрқашан адамға толы.' } },
    { name: 'Silk Lounge', tier: 1, vibe: ['fine_dining', 'hotel_rest'], pitch: { en: 'Fine-dining lounge inside Renaissance — pick for a date or a celebration.', ru: 'Файн-дайнинг в отеле Renaissance — для свидания или повода.', kk: 'Renaissance қонақүйіндегі гурме мейрамхана — кездесуге немесе мерекеге.' } },
    { name: 'Sky Bar', tier: 1, vibe: ['view', 'cocktails'], pitch: { en: 'Top of the Holiday Inn — best sunset view in the city.', ru: 'Крыша Holiday Inn — лучший закат в городе.', kk: 'Holiday Inn-нің төбесінде — қаладағы ең әдемі күн батуы.' } },
    { name: 'Buhara', tier: 2, vibe: ['uzbek', 'family'], pitch: { en: 'Uzbek classics — plov, lagman, samsa. Reliable family choice.', ru: 'Узбекская классика — плов, лагман, самса. Надёжно для семьи.', kk: 'Өзбек классикасы — палау, лағман, самса. Отбасыға сенімді нұсқа.' } },
    { name: 'Modigliani', tier: 2, vibe: ['georgian'], pitch: { en: 'Solid Georgian food — khachapuri and khinkali in a calm setting.', ru: 'Хорошая грузинская кухня — хачапури и хинкали в спокойной обстановке.', kk: 'Жақсы грузин асы — тыныш ортада хачапури мен хинкали.' } },
    { name: 'Stetson (Shamrock Irish Pub)', tier: 2, vibe: ['pub'] },
    { name: 'Ashoka', tier: 2, vibe: ['indian'] },
    { name: 'Karvon', tier: 3, vibe: ['mixed'] },
    { name: 'Napoli', tier: 3, vibe: ['italian'] },
    { name: 'Star of David', tier: 3, vibe: ['mixed'] },
  ],
  tour: [
    { name: 'Mangystau Tour 999', tier: 1, vibe: ['jeep', 'multi_day'], pitch: { en: 'The most-booked Mangystau jeep operator — Bozzhyra, Sherkala, Tuzbair circuits.', ru: 'Самый бронируемый джип-оператор по Мангистау — Бозжыра, Шеркала, Тузбаир.', kk: 'Маңғыстау бойынша ең көп бронға алынатын джип-операторы.' } },
    { name: 'Travel to Mangistau', tier: 1, vibe: ['jeep', 'photo'], pitch: { en: 'Eduard\'s small-group desert tours — photographers love the routes.', ru: 'Тур Эдуарда по пустыне в малых группах — отлично для фотографов.', kk: 'Эдуардтың шағын топтармен шөлдегі турлары — фотографтарға ыңғайлы.' } },
    { name: 'Mangystau Tourist', tier: 2, vibe: ['jeep'], pitch: { en: 'Established Aktau operator running all the headline canyons.', ru: 'Опытный оператор по всем главным каньонам.', kk: 'Барлық негізгі шатқалдар бойынша тәжірибелі оператор.' } },
    { name: 'Redmaya Travel', tier: 2, vibe: ['jeep', 'budget'], pitch: { en: 'Budget-friendly jeep day trips, often the cheapest option that\'s still legit.', ru: 'Бюджетные джип-туры на день, часто самый дешёвый адекватный вариант.', kk: 'Бюджетті жеңіл джип турлары, көбіне ең арзан сенімді нұсқа.' } },
  ],
}

function placeByName(name) {
  return PLACES.find((p) => p.name === name) || null
}

function pickPitch(rec, lang) {
  if (!rec?.pitch) return null
  return rec.pitch[lang] || rec.pitch.en || null
}

/**
 * Curated top picks for a category, ranked by hand.
 * @param {('hotel'|'restaurant'|'tour')} category
 * @param {{ lang?: string, vibe?: string|null, limit?: number }} [opts]
 * @returns {Array<{ name:string, phone:string, tier:number, pitch:string|null, source:string }>}
 */
export function pickTopPicks(category, opts = {}) {
  const lang = opts.lang || 'en'
  const limit = opts.limit || 3
  const vibe = opts.vibe ? String(opts.vibe).toLowerCase() : null
  const ranked = RANK[category] || []
  const out = []
  // First pass: matching vibe.
  if (vibe) {
    for (const r of ranked) {
      const p = placeByName(r.name)
      if (!p) continue
      if (Array.isArray(r.vibe) && r.vibe.some((v) => v.toLowerCase().includes(vibe) || vibe.includes(v.toLowerCase()))) {
        out.push({ name: p.name, phone: p.phone, tier: r.tier, pitch: pickPitch(r, lang), source: p.source })
      }
    }
  }
  // Second pass: top tiers, skipping dupes.
  for (const r of ranked) {
    if (out.length >= limit) break
    if (out.some((o) => o.name === r.name)) continue
    const p = placeByName(r.name)
    if (!p) continue
    out.push({ name: p.name, phone: p.phone, tier: r.tier, pitch: pickPitch(r, lang), source: p.source })
  }
  return out.slice(0, limit)
}

// --- fuzzy matching ----------------------------------------------------------

function normalise(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\u0400-\u04ff]+/g, ' ') // keep latin + cyrillic
    .trim()
    .replace(/\s+/g, ' ')
}

function tokens(s) {
  const n = normalise(s)
  if (!n) return []
  return n.split(' ').filter((t) => t.length >= 2)
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'cafe', 'restaurant', 'bar', 'pub', 'hotel', 'and', 'grand',
  'aktau', 'mangystau', 'mangistau',
])

function scoreMatch(queryTokens, candidateTokens) {
  if (!queryTokens.length || !candidateTokens.length) return 0
  const candSet = new Set(candidateTokens)
  let hits = 0
  let signal = 0
  for (const q of queryTokens) {
    if (candSet.has(q)) {
      hits += 1
      if (!STOPWORDS.has(q)) signal += 1
    } else {
      // partial: candidate token starts with q (handles e.g. "rixos" matching "rixos")
      for (const c of candidateTokens) {
        if (c.length >= 4 && (c.startsWith(q) || q.startsWith(c))) {
          hits += 0.5
          if (!STOPWORDS.has(q) && !STOPWORDS.has(c)) signal += 0.5
          break
        }
      }
    }
  }
  // require at least one non-stopword signal token to match
  if (signal < 1) return 0
  return hits / Math.max(queryTokens.length, candidateTokens.length)
}

/**
 * Look up a place phone in the local cache.
 * @param {string} query  User/agent-provided place name.
 * @returns {{ name:string, phone:string, category:string, source:string }|null}
 */
export function lookupCachedPhone(query) {
  const qTokens = tokens(query)
  if (!qTokens.length) return null

  let best = null
  let bestScore = 0

  for (const place of PLACES) {
    const candidates = [place.name, ...(place.aliases || [])]
    for (const c of candidates) {
      const score = scoreMatch(qTokens, tokens(c))
      if (score > bestScore) {
        bestScore = score
        best = place
      }
    }
  }

  // Threshold tuned to avoid false positives (e.g. random "cafe" matching).
  if (bestScore >= 0.5 && best) {
    return {
      name: best.name,
      phone: best.phone,
      category: best.category,
      source: `cache:${best.source}`,
    }
  }
  return null
}
