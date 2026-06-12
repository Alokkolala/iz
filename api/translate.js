import { handleTranslate } from '../server/shared/translate.js'

export const config = {
  api: { bodyParser: { sizeLimit: '256kb' } },
  maxDuration: 15,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method not allowed' })
  }
  return handleTranslate(req, res)
}
