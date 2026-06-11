// Deletes the calling user's auth account (and via ON DELETE CASCADE,
// their profile, analyses, and crew_invites).
//
// Auth: caller passes their access token in Authorization: Bearer <jwt>.
// We verify it with the service role, then call admin.deleteUser on the
// resolved user id. The browser never sees the service role key.

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method not allowed' })
  }
  if (!url || !serviceRole) {
    return res.status(500).json({ error: 'server not configured' })
  }
  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return res.status(401).json({ error: 'missing bearer token' })

    const admin = createClient(url, serviceRole, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) {
      return res.status(401).json({ error: 'invalid token' })
    }
    const uid = userData.user.id

    const { error: delErr } = await admin.auth.admin.deleteUser(uid)
    if (delErr) {
      console.error(delErr)
      return res.status(500).json({ error: delErr.message })
    }
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err?.message ?? 'delete failed' })
  }
}
