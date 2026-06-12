import { handleWhatsappStatus } from '../../server/shared/whatsapp-send.js'

export const config = { maxDuration: 8 }

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'method not allowed' })
  }
  return handleWhatsappStatus(req, res)
}
