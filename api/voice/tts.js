export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } },
  maxDuration: 30,
}

/**
 * TTS via OpenRouter. Model: hexgrad/kokoro-82m (cheap, fast, English-first).
 * Default voice is `af_bella` (Kokoro voice naming: <lang><gender>_<name>).
 *
 * Note: OpenRouter's `/audio/speech` endpoint does not expose OpenAI's
 * `gpt-4o-mini-tts` (model id 404s as of this writing). For OpenAI TTS we'd
 * need an OPENAI_API_KEY and to call api.openai.com directly.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method not allowed' })
  }
  try {
    const { text, voice } = req.body ?? {}
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'missing text' })
    }
    const voiceId = typeof voice === 'string' && voice ? voice : 'af_bella'

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
        model: 'hexgrad/kokoro-82m',
        input: text.slice(0, 3500),
        voice: voiceId,
        response_format: 'mp3',
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
