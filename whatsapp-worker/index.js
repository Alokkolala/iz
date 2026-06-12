/**
 * iz-whatsapp-worker
 *
 * Long-running Node service that drives WhatsApp Web via whatsapp-web.js.
 * The Iz Mangystau Vercel app posts to /send; this process keeps a
 * Puppeteer-backed Chromium session authenticated as the operator's WA
 * account.
 *
 * IMPORTANT — this CANNOT run on Vercel:
 *   - WA Web needs a persistent WebSocket; serverless functions suspend.
 *   - Puppeteer + Chromium exceeds the 250 MB bundle cap.
 *   - LocalAuth needs a persistent disk for ~/.wwebjs_auth/.
 *
 * Host this on Railway, Fly.io, a VPS, or a always-on home machine.
 *
 * Env:
 *   PORT                  default 8088
 *   WORKER_SECRET         shared secret the Vercel app sends as Bearer token
 *   SESSION_DIR           where LocalAuth keys live (default ./.wwebjs_auth)
 *
 * Routes:
 *   GET  /status   -> { ready, connectedAs, qrAvailable }
 *   GET  /qr       -> { qr } first-time pairing only
 *   POST /send     -> { phone, message }  -> { ok, id }
 *
 * All routes except /qr require Authorization: Bearer $WORKER_SECRET.
 */

import express from 'express'
import pkg from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'

const { Client, LocalAuth } = pkg

const PORT = Number(process.env.PORT || 8088)
const SECRET = process.env.WORKER_SECRET || ''
const SESSION_DIR = process.env.SESSION_DIR || './.wwebjs_auth'

if (!SECRET) {
  console.error('FATAL: set WORKER_SECRET to a strong random string before starting.')
  process.exit(1)
}

const state = {
  ready: false,
  connectedAs: null,
  lastQr: null,
  lastError: null,
}

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'iz', dataPath: SESSION_DIR }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  },
})

client.on('qr', (qr) => {
  state.lastQr = qr
  console.log('\n[QR] Scan with WhatsApp -> Linked devices -> Link a device:\n')
  qrcode.generate(qr, { small: true })
})

client.on('authenticated', () => {
  console.log('[auth] success — session keys cached')
  state.lastQr = null
})

client.on('ready', () => {
  state.ready = true
  state.connectedAs = client.info?.wid?.user || null
  console.log(`[ready] connected as ${state.connectedAs}`)
})

client.on('disconnected', (reason) => {
  console.warn('[disconnected]', reason)
  state.ready = false
  state.connectedAs = null
})

client.on('auth_failure', (msg) => {
  console.error('[auth_failure]', msg)
  state.ready = false
  state.lastError = String(msg)
})

client.initialize().catch((err) => {
  console.error('[init] failed', err)
  state.lastError = String(err?.message || err)
})

function requireSecret(req, res, next) {
  const h = req.headers.authorization || ''
  const m = /^Bearer\s+(.+)$/i.exec(h)
  if (!m || m[1].trim() !== SECRET) {
    return res.status(401).json({ error: 'unauthorized' })
  }
  next()
}

const app = express()
app.use(express.json({ limit: '256kb' }))

app.get('/status', requireSecret, (_req, res) => {
  res.json({
    ready: state.ready,
    connectedAs: state.connectedAs,
    qrAvailable: Boolean(state.lastQr),
    lastError: state.lastError,
  })
})

// /qr is intentionally unauthenticated so you can pair from any browser
// on first run. It only returns the pairing code, never message content.
app.get('/qr', (_req, res) => {
  if (state.ready) return res.json({ ready: true })
  if (!state.lastQr) return res.status(404).json({ error: 'no_qr_yet' })
  res.json({ qr: state.lastQr })
})

app.post('/send', requireSecret, async (req, res) => {
  if (!state.ready) {
    return res.status(503).json({ error: 'not_ready' })
  }
  const phone = String(req.body?.phone || '').replace(/[^\d]/g, '')
  const message = String(req.body?.message || '').slice(0, 1500)
  if (!/^\d{8,15}$/.test(phone)) return res.status(400).json({ error: 'bad_phone' })
  if (!message.trim()) return res.status(400).json({ error: 'empty_message' })

  try {
    const wid = `${phone}@c.us`
    const registered = await client.isRegisteredUser(wid).catch(() => true)
    if (!registered) return res.status(404).json({ error: 'not_on_whatsapp', phone })
    const sent = await client.sendMessage(wid, message)
    res.json({ ok: true, id: sent?.id?._serialized || null })
  } catch (err) {
    console.error('[send] failed', err)
    res.status(500).json({ error: String(err?.message || err) })
  }
})

app.listen(PORT, () => {
  console.log(`iz-whatsapp-worker listening on :${PORT}`)
  console.log('Tail this log on first run — a QR will appear; scan with WhatsApp -> Linked devices.')
})

process.on('SIGTERM', async () => {
  console.log('SIGTERM — closing WA client gracefully')
  try { await client.destroy() } catch {}
  process.exit(0)
})
