import express from 'express'
import OpenAI from 'openai'
import { z } from 'zod'
import { Readable } from 'node:stream'
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

app.post('/api/voice/chat', async (req, res) => {
  try {
    const { messages, lang } = req.body
    const L = (lang === 'en' || lang === 'ru' || lang === 'kk') ? lang : 'ru'
    const langName = LANG_NAME[L]

    const system = `You are Iz — a friendly Mangystau travel coach having a real conversation, like a friend on a road trip.
Speak entirely in ${langName}. No emojis, no markdown, no lists.
Rules:
- One or two short sentences per reply. Never lecture.
- Use contractions and casual phrasing. Match the user's energy.
- Topics: photo spots, light timing, routes, local culture and food. Mangystau focus.
- If asked something outside Mangystau or travel, answer briefly then steer back kindly.
- If you don't know, say so plainly in one sentence.

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
      temperature: 0.7,
    })

    const text = completion.choices[0]?.message?.content?.trim() ?? ''
    res.json({ text })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err?.message ?? 'voice chat failed' })
  }
})

/**
 * Text-to-speech via OpenRouter's `/api/v1/audio/speech` endpoint. Uses
 * `openai/gpt-4o-mini-tts` — natural, low-latency, multilingual. We pass
 * provider.openai.instructions so the model speaks in a casual road-trip tone
 * instead of a flat news-reader voice.
 *
 * Streams the MP3 bytes straight through to the client so playback can start
 * before the whole file is generated.
 */
app.post('/api/voice/tts', async (req, res) => {
  try {
    const { text, lang, voice } = req.body
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'missing text' })
    }
    const L = (lang === 'en' || lang === 'ru' || lang === 'kk') ? lang : 'ru'
    const langName = LANG_NAME[L]
    const voiceId = typeof voice === 'string' && voice ? voice : 'coral'

    const instructions = `You are Iz — a friendly Mangystau travel guide having a real conversation with a friend on a road trip.
Tone: warm, casual, low-key, like a close friend giving a tip — not a presenter or news anchor.
Pace: relaxed and natural. Use small breaths and tiny pauses between thoughts.
The text you are reading is written in ${langName}; speak it naturally in ${langName}.
Do not add words, sound effects, or commentary — just read the text as if it were yours.`

    const r = await fetch('https://openrouter.ai/api/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'IZ Mangystau · Voice',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini-tts',
        input: text.slice(0, 3500),
        voice: voiceId,
        response_format: 'mp3',
        speed: 1.02,
        provider: {
          options: {
            openai: { instructions },
          },
        },
      }),
    })

    if (!r.ok || !r.body) {
      const detail = await r.text().catch(() => '')
      console.error('tts upstream error', r.status, detail)
      return res.status(502).json({ error: 'tts upstream', status: r.status, detail })
    }

    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'no-store')
    Readable.fromWeb(r.body).pipe(res)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err?.message ?? 'tts failed' })
  }
})

const port = process.env.PORT || 8787
app.listen(port, () => console.log(`api listening on http://localhost:${port}`))
