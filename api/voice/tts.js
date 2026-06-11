export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } },
  maxDuration: 30,
}

const LANG_NAME = { en: 'English', ru: 'Russian', kk: 'Kazakh' }

/**
 * TTS via OpenRouter. Model: openai/gpt-4o-mini-tts (natural, multilingual,
 * auto-detects ~50 languages — good for ru/kk).
 *
 * Buffers the full MP3 before responding — Vercel Functions don't reliably
 * stream a forwarded ReadableStream, and the buffered path is fast enough
 * for a few hundred KB.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method not allowed' })
  }
  try {
    const { text, lang, voice } = req.body ?? {}
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

    const referer = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:5173'

    const r = await fetch('https://openrouter.ai/api/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': referer,
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

    if (!r.ok) {
      const detail = await r.text().catch(() => '')
      console.error('tts upstream error', r.status, detail)
      return res.status(502).json({ error: 'tts upstream', status: r.status, detail })
    }

    const buf = Buffer.from(await r.arrayBuffer())
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Length', String(buf.length))
    res.end(buf)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err?.message ?? 'tts failed' })
  }
}
