// Voice STT via OpenRouter → Gemini 2.5 Flash multimodal.
// Client posts the raw audio blob as the request body with the original
// Content-Type (audio/webm, audio/mp4, audio/ogg). We base64-encode it and
// hand it to Gemini through OpenRouter's standard chat completions API,
// asking for a verbatim transcription in the user's language.
//
// Why this and not /audio/transcriptions:
//   OpenRouter doesn't proxy a stable Whisper transcription endpoint. The
//   Gemini multimodal path uses our existing OPENROUTER_API_KEY, no new
//   provider account, and reuses the same model family the agent uses.

const LANG_NAME = { en: 'English', ru: 'Russian', kk: 'Kazakh' }
const STT_MODEL = process.env.OPENROUTER_STT_MODEL || 'google/gemini-2.5-flash'

function pickExt(contentType) {
  const ct = String(contentType || '').toLowerCase()
  if (ct.includes('mp4')) return { ext: 'mp4', mime: 'audio/mp4' }
  if (ct.includes('ogg')) return { ext: 'ogg', mime: 'audio/ogg' }
  if (ct.includes('wav')) return { ext: 'wav', mime: 'audio/wav' }
  if (ct.includes('mp3') || ct.includes('mpeg')) return { ext: 'mp3', mime: 'audio/mpeg' }
  return { ext: 'webm', mime: 'audio/webm' }
}

async function readBody(req) {
  if (req.body && Buffer.isBuffer(req.body)) return req.body
  if (req.body && typeof req.body === 'string') return Buffer.from(req.body)
  const chunks = []
  for await (const c of req) chunks.push(c)
  return Buffer.concat(chunks)
}

export async function handleVoiceStt(req, res) {
  try {
    const key = process.env.OPENROUTER_API_KEY
    if (!key) return res.status(501).json({ error: 'no_openrouter_key' })

    const lang = String(req.headers['x-lang'] || 'ru').toLowerCase()
    const langName = LANG_NAME[lang] || 'Russian'
    const { ext, mime } = pickExt(req.headers['content-type'])

    const buf = await readBody(req)
    if (!buf || !buf.length) return res.status(400).json({ error: 'empty_audio' })
    if (buf.length > 8 * 1024 * 1024) return res.status(413).json({ error: 'audio_too_large' })

    const base64 = buf.toString('base64')
    const prompt = `You are a strict speech-to-text transcriber. Transcribe the audio verbatim in ${langName}. Output only the literal transcription text. No preface, no labels, no quotes, no explanation. If you cannot make out any speech, reply with the single word: SILENCE.`

    // Try the modern multimodal `input_audio` shape first.
    const body = {
      model: STT_MODEL,
      temperature: 0,
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'input_audio', input_audio: { data: base64, format: ext } },
          ],
        },
      ],
    }

    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://iz-psi.vercel.app',
        'X-Title': 'IZ Mangystau · Voice STT',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25000),
    })

    if (!r.ok) {
      const detail = await r.text().catch(() => '')
      // Fallback: some providers want the `file` data-URL shape instead.
      const retry = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://iz-psi.vercel.app',
          'X-Title': 'IZ Mangystau · Voice STT',
        },
        body: JSON.stringify({
          model: STT_MODEL,
          temperature: 0,
          max_tokens: 400,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'file',
                  file: {
                    file_data: `data:${mime};base64,${base64}`,
                    filename: `audio.${ext}`,
                  },
                },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(25000),
      })
      if (!retry.ok) {
        console.error('stt upstream both shapes failed', r.status, detail.slice(0, 300))
        return res.status(502).json({ error: 'stt_upstream', status: r.status })
      }
      const data = await retry.json()
      return res.json({ text: cleanTranscript(data?.choices?.[0]?.message?.content) })
    }

    const data = await r.json()
    res.json({ text: cleanTranscript(data?.choices?.[0]?.message?.content) })
  } catch (err) {
    console.error('stt error', err)
    res.status(500).json({ error: err?.message || 'stt_failed' })
  }
}

function cleanTranscript(raw) {
  const text = String(raw || '').trim()
  if (!text) return ''
  if (/^SILENCE$/i.test(text)) return ''
  return text.replace(/^["'`«»]+|["'`«»]+$/g, '').trim()
}
