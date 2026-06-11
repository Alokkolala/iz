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

function extractDirections(text, location) {
  if (!text) return { clean: '', action: null }
  const m = text.match(/\[\[GO:\s*([^\]]+?)\s*\]\]/i)
  if (!m) return { clean: text, action: null }
  const destination = m[1].trim()
  const clean = text.replace(m[0], '').replace(/\s{2,}/g, ' ').trim()
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
  return {
    clean,
    action: { kind: 'directions', destination, url },
  }
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

    const system = `You are Iz — a smart, friendly travel companion who happens to know Mangystau, Kazakhstan inside out. You sound like a close friend on a road trip, not a tour brochure.
Speak entirely in ${langName}. No emojis, no markdown, no bullet lists.

You have two superpowers:
1. LIVE WEB SEARCH — use it freely for opening hours, current weather, road conditions, festivals, prices, news, or anything you're not sure about. Prefer fresh facts over guesses.
2. MAPS — when the user wants to GO somewhere, BE SHOWN the way, get DIRECTIONS, or asks how to reach a place, end your reply with a single hidden marker on its own:
   [[GO:<destination in English, e.g. "Bozzhyra Canyon">]]
   Never mention or read the marker. The app turns it into a one-tap maps button.

How to talk:
- Answer the user's actual question first, directly, in 1–3 short sentences.
- Use contractions and casual phrasing. Match their energy.
- Travel and Mangystau are your wheelhouse, but you can answer anything useful — don't refuse small talk or general questions, just keep replies tight.
- If you searched the web, weave the fact in naturally (e.g. "looks like it's open till 8"), no need to cite.
- If you genuinely don't know and search didn't help, say so in one sentence.
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
    const { clean, action } = extractDirections(raw, hasLoc ? location : null)
    res.json({ text: clean, action })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err?.message ?? 'voice chat failed' })
  }
}
