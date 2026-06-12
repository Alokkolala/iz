import { translateText } from './agent/tools/translate.js'

export async function handleTranslate(req, res) {
  try {
    const { text, from, to } = req.body ?? {}
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'missing_text' })
    }
    if (!to || typeof to !== 'string') {
      return res.status(400).json({ error: 'missing_target' })
    }
    const result = await translateText({ text, from, to })
    if (result.error) {
      return res.status(502).json({ error: result.error, detail: result.detail || null })
    }
    return res.json({
      translated: result.translated,
      from: result.from,
      to: result.to,
      sameLanguage: !!result.sameLanguage,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err?.message ?? 'translate failed' })
  }
}
