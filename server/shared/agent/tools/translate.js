import OpenAI from 'openai'

const LANG_TABLE = {
  en: 'English',
  ru: 'Russian',
  kk: 'Kazakh',
}

const ALIASES = {
  english: 'en',
  inglish: 'en',
  eng: 'en',
  en: 'en',
  russian: 'ru',
  russkiy: 'ru',
  ru: 'ru',
  kazakh: 'kk',
  qazaq: 'kk',
  kazak: 'kk',
  kk: 'kk',
  kz: 'kk',
}

export function normaliseLang(input) {
  if (!input || typeof input !== 'string') return null
  const key = input.trim().toLowerCase()
  return ALIASES[key] || null
}

export function isSameLanguage(a, b) {
  const na = normaliseLang(a)
  const nb = normaliseLang(b)
  if (!na || !nb) return false
  return na === nb
}

export function buildTranslatePrompt({ text, from, to }) {
  const fromName = LANG_TABLE[normaliseLang(from)] || 'the source language'
  const toName = LANG_TABLE[normaliseLang(to)] || 'the target language'
  return [
    `Translate the following ${fromName} text into ${toName}.`,
    `Reply with the translation only — one line, no quotes, no explanation, no transliteration in parentheses.`,
    `If the input is already in ${toName}, just repeat it verbatim.`,
    `Keep it natural and polite as if a traveler is speaking to a Mangystau local.`,
    ``,
    `TEXT:`,
    text,
  ].join('\n')
}

let _client = null
function client() {
  if (_client) return _client
  _client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || 'missing-openrouter-key',
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173',
      'X-Title': 'IZ Mangystau Translator',
    },
  })
  return _client
}

export async function translateText({ text, from, to }) {
  const cleanText = String(text || '').trim().slice(0, 600)
  if (!cleanText) return { error: 'missing_text' }
  const nfrom = normaliseLang(from)
  const nto = normaliseLang(to)
  if (!nto) return { error: 'unknown_target' }
  if (isSameLanguage(nfrom, nto)) {
    return { translated: cleanText, from: nfrom, to: nto, sameLanguage: true }
  }
  try {
    const completion = await client().chat.completions.create({
      model: 'google/gemini-2.5-flash-lite',
      messages: [{ role: 'user', content: buildTranslatePrompt({ text: cleanText, from: nfrom, to: nto }) }],
      max_tokens: 220,
      temperature: 0.2,
    })
    const raw = completion.choices?.[0]?.message?.content || ''
    const translated = raw.trim().replace(/^["'«»“”]+|["'«»“”]+$/g, '').split('\n')[0].trim()
    if (!translated) return { error: 'empty_translation' }
    return { translated, from: nfrom, to: nto, sameLanguage: false }
  } catch (err) {
    return { error: 'upstream', detail: String(err?.message || err).slice(0, 200) }
  }
}
