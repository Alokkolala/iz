// Shared send-proxy used by both the Express dev server (server/index.js) and
// the Vercel function (api/whatsapp/send.js). Forwards an authenticated
// request to the user's self-hosted whatsapp-worker.
//
// Authentication: the caller must present a Supabase access token. We hand
// the worker our shared WHATSAPP_WORKER_SECRET; the user's token never leaves
// this process. If env isn't set, we return 501 so the UI can hide the button.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

let supa = null
function getSupa() {
  if (!supa && SUPABASE_URL && SUPABASE_ANON) {
    supa = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } })
  }
  return supa
}

function readBearer(req) {
  const h = req.headers?.authorization || req.headers?.Authorization || ''
  const m = /^Bearer\s+(.+)$/i.exec(h)
  return m ? m[1].trim() : null
}

export async function handleWhatsappSend(req, res) {
  try {
    const url = process.env.WHATSAPP_WORKER_URL
    const secret = process.env.WHATSAPP_WORKER_SECRET
    if (!url || !secret) {
      return res.status(501).json({ error: 'worker_not_configured' })
    }

    const token = readBearer(req)
    if (!token) return res.status(401).json({ error: 'unauthenticated' })

    const s = getSupa()
    if (s) {
      const { data, error } = await s.auth.getUser(token)
      if (error || !data?.user) return res.status(401).json({ error: 'invalid_token' })
    }

    const body = req.body ?? {}
    const phone = String(body.phone || '').replace(/[^\d]/g, '')
    const message = String(body.message || '').slice(0, 1500)
    if (!/^\d{8,15}$/.test(phone)) return res.status(400).json({ error: 'bad_phone' })
    if (!message.trim()) return res.status(400).json({ error: 'empty_message' })

    const upstream = await fetch(url.replace(/\/$/, '') + '/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ phone, message }),
      signal: AbortSignal.timeout(15000),
    })
    const text = await upstream.text()
    let json = null
    try { json = JSON.parse(text) } catch { /* not json */ }

    if (!upstream.ok) {
      return res.status(upstream.status === 503 ? 503 : 502).json({
        error: json?.error || 'worker_error',
        status: upstream.status,
      })
    }
    res.status(200).json(json || { ok: true })
  } catch (err) {
    console.error('whatsapp send error', err)
    res.status(500).json({ error: err?.message || 'send_failed' })
  }
}

export async function handleWhatsappStatus(_req, res) {
  const url = process.env.WHATSAPP_WORKER_URL
  const secret = process.env.WHATSAPP_WORKER_SECRET
  if (!url || !secret) return res.json({ configured: false, ready: false })
  try {
    const r = await fetch(url.replace(/\/$/, '') + '/status', {
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(4000),
    })
    if (!r.ok) return res.json({ configured: true, ready: false })
    const j = await r.json().catch(() => null)
    res.json({ configured: true, ready: Boolean(j?.ready), connectedAs: j?.connectedAs || null })
  } catch {
    res.json({ configured: true, ready: false })
  }
}
