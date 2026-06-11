export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } },
  maxDuration: 30,
}

/**
 * TTS via OpenRouter `/audio/speech`.
 *
 * Primary:  google/gemini-3.1-flash-tts-preview (PCM 24kHz mono → wrap as WAV)
 * Fallback: hexgrad/kokoro-82m (MP3, English-first)
 *
 * Gemini only outputs raw PCM, so we prepend a 44-byte WAV header and serve
 * `audio/wav` — the browser <audio> element plays it natively, no client
 * changes needed.
 */

const GEMINI_VOICES = new Set([
  // Gemini's named voices (alloy and friends would 500 here)
  'Kore', 'Charon', 'Puck', 'Aoede', 'Fenrir', 'Leda', 'Orus', 'Zephyr',
])

function buildWavHeader(pcmByteLength, { sampleRate = 24000, channels = 1, bitsPerSample = 16 } = {}) {
  const byteRate = sampleRate * channels * bitsPerSample / 8
  const blockAlign = channels * bitsPerSample / 8
  const buf = Buffer.alloc(44)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + pcmByteLength, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)            // PCM chunk size
  buf.writeUInt16LE(1, 20)             // PCM format
  buf.writeUInt16LE(channels, 22)
  buf.writeUInt32LE(sampleRate, 24)
  buf.writeUInt32LE(byteRate, 28)
  buf.writeUInt16LE(blockAlign, 32)
  buf.writeUInt16LE(bitsPerSample, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(pcmByteLength, 40)
  return buf
}

async function speak({ model, voice, input, format, referer }) {
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
      response_format: format,
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

    // 1) Try Gemini TTS — PCM only, we wrap as WAV.
    const geminiVoice = typeof voice === 'string' && GEMINI_VOICES.has(voice) ? voice : 'Kore'
    let r = await speak({
      model: 'google/gemini-3.1-flash-tts-preview',
      voice: geminiVoice,
      input: text,
      format: 'pcm',
      referer,
    })

    if (r.ok) {
      const pcm = Buffer.from(await r.arrayBuffer())
      const header = buildWavHeader(pcm.length)
      const wav = Buffer.concat([header, pcm])
      res.setHeader('Content-Type', 'audio/wav')
      res.setHeader('Cache-Control', 'no-store')
      res.setHeader('Content-Length', String(wav.length))
      res.setHeader('X-TTS-Model', 'google/gemini-3.1-flash-tts-preview')
      return res.end(wav)
    }

    // 2) Fallback to Kokoro MP3.
    const detail = await r.text().catch(() => '')
    console.warn('gemini tts failed, falling back to kokoro', r.status, detail)
    const kokoroVoice = typeof voice === 'string' && voice.includes('_') ? voice : 'af_bella'
    r = await speak({
      model: 'hexgrad/kokoro-82m',
      voice: kokoroVoice,
      input: text,
      format: 'mp3',
      referer,
    })
    if (!r.ok) {
      const detail2 = await r.text().catch(() => '')
      console.error('tts upstream error (both models)', r.status, detail2)
      return res.status(502).json({ error: 'tts upstream', status: r.status, detail: detail2 })
    }
    const mp3 = Buffer.from(await r.arrayBuffer())
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Length', String(mp3.length))
    res.setHeader('X-TTS-Model', 'hexgrad/kokoro-82m')
    res.end(mp3)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err?.message ?? 'tts failed' })
  }
}
