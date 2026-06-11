import OpenAI from 'openai'
import { z } from 'zod'
import { pickReferences } from '../server/references.js'

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173',
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

export const config = {
  api: { bodyParser: { sizeLimit: '15mb' } },
  maxDuration: 60,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method not allowed' })
  }
  try {
    const { imageDataUrl } = req.body ?? {}
    if (!imageDataUrl) return res.status(400).json({ error: 'missing imageDataUrl' })

    const system = `You are a landscape and travel-reel photography coach for the Mangystau region.
You critique the user's photo and direct a more viral version of the same shot.
Be specific, concrete and kind. Use the photographer's vocabulary (composition, light, lens, pose).

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
  "caption": "<one short, evocative Instagram caption in the same language as the user, lowercase, no hashtags>",
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
    const references = pickReferences(parsed.sightGuess)
    res.json({ ...parsed, references })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err?.message ?? 'analysis failed' })
  }
}
