import { Readable } from 'node:stream'

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } },
  maxDuration: 30,
}

/**
 * TTS via OpenRouter, mirrors the dev server in server/index.js.
 * Model: hexgrad/kokoro-82m (open-source, much cheaper than OpenAI voices,
 * English-first; ru/kk quality is limited).
 *
 * Streams the MP3 straight through so playback can start before generation finishes.
 * Vercel Fluid Compute supports response streaming on Node functions.
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
    const voiceId = typeof voice === 'string' && voice ? voice : 'alloy'

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
}
