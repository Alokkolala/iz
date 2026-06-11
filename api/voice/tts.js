export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } },
  maxDuration: 30,
}

/**
 * TTS via OpenRouter `/audio/speech`.
 *
 * Primary:  x-ai/grok-voice-tts-1.0
 * Fallback: hexgrad/kokoro-82m  (kicks in if grok upstream errors — it does
 *           today, but the model is in OpenRouter's catalog so it'll start
 *           working as soon as xAI rolls it out, no code change needed).
 *
 * Buffers the full MP3 before responding — Vercel Functions don't reliably
 * pipe a forwarded ReadableStream, and these payloads are small enough that
 * buffering is the faster end-to-end path.
 */
async function speak({ model, voice, input, referer }) {
  return fetch('https://openrouter.ai/api/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': referer,
      'X-Title': 'IZ Mangystau · Voice',
    },
    body: JSON.stringify({
      model,
      input: input.slice(0, 3500),
      voice,
      response_format: 'mp3',
    }),
  })
}

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
    const referer = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:5173'

    // 1) try Grok TTS with caller-provided voice or `alloy`
    let r = await speak({
      model: 'x-ai/grok-voice-tts-1.0',
      voice: typeof voice === 'string' && voice ? voice : 'alloy',
      input: text,
      referer,
    })
    let usedModel = 'x-ai/grok-voice-tts-1.0'

    // 2) on any upstream error, fall back to Kokoro with a Kokoro-native voice
    if (!r.ok) {
      const detail = await r.text().catch(() => '')
      console.warn('grok tts failed, falling back to kokoro', r.status, detail)
      r = await speak({
        model: 'hexgrad/kokoro-82m',
        voice: 'af_bella',
        input: text,
        referer,
      })
      usedModel = 'hexgrad/kokoro-82m'
    }

    if (!r.ok) {
      const detail = await r.text().catch(() => '')
      console.error('tts upstream error (both models)', r.status, detail)
      return res.status(502).json({ error: 'tts upstream', status: r.status, detail })
    }

    const buf = Buffer.from(await r.arrayBuffer())
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Length', String(buf.length))
    res.setHeader('X-TTS-Model', usedModel)
    res.end(buf)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err?.message ?? 'tts failed' })
  }
}
