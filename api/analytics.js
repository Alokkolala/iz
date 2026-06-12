import { handleAnalytics } from '../server/shared/analytics.js'

export const config = {
  api: { bodyParser: { sizeLimit: '64kb' } },
  maxDuration: 20,
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'method not allowed' })
  }
  return handleAnalytics(req, res)
}
