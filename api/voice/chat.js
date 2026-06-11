import { handleVoiceChat } from '../../server/shared/voice.js'

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } },
  maxDuration: 30,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method not allowed' })
  }
  return handleVoiceChat(req, res)
}
