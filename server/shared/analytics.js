// Akimat tourism analytics — aggregates the `analyses` table into anonymous,
// rolled-up counts that local-government staff can use to understand tourist
// flow across Mangystau sights.
//
// Output is pure aggregate (no user ids, no payloads, no per-person rows), so
// the endpoint is safe to expose without auth. Uses the service-role key so it
// can read every row regardless of per-user RLS.

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

let _admin = null
function admin() {
  if (_admin) return _admin
  if (!url || !serviceRole) return null
  _admin = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return _admin
}

// Map free-text sight_guess strings to a small set of canonical buckets so the
// "Top sights" chart doesn't fragment over spelling variants. Mirrors the
// reference-reel synonym table conceptually but kept here so this file stays
// dependency-free and can run in the Vercel function with no extra imports.
const BUCKET_PATTERNS = [
  { key: 'bozzhyra', label: 'Bozzhyra', re: /bo[zs]{1,2}[hzj]y?ra|бозжыра|бозжира|бозжыры/i },
  { key: 'sherkala', label: 'Sherkala', re: /sher[qk]ala|шер.{0,2}кала|шеркала/i },
  { key: 'tuzbair',  label: 'Tuzbair',  re: /tuzba?ir|airakty|тузбаир|тұзбайыр|айракты/i },
  { key: 'kyzylkup', label: 'Kyzylkup', re: /kyzylkup|кызылкуп|қызылқұп/i },
  { key: 'torysh',   label: 'Torysh',   re: /torysh|valley of balls|долин.{0,4}шар|торыш/i },
  { key: 'caspian',  label: 'Caspian Sea', re: /caspian|aktau|ак?тау|каспий|teñiz|promenade|набережная/i },
  { key: 'shopan',   label: 'Shopan-Ata', re: /shopan|шопан/i },
  { key: 'beket',    label: 'Beket-Ata', re: /beket|бекет/i },
  { key: 'karagiye', label: 'Karagiye Depression', re: /karagiye|караги/i },
]

function bucketOf(raw) {
  const s = String(raw || '').trim()
  if (!s) return { key: 'unknown', label: 'Unknown' }
  for (const b of BUCKET_PATTERNS) {
    if (b.re.test(s)) return { key: b.key, label: b.label }
  }
  // fallback: keep the literal but truncated, so akimat staff still see the
  // long tail of niche spots
  const trimmed = s.length > 32 ? s.slice(0, 32) + '…' : s
  return { key: trimmed.toLowerCase(), label: trimmed }
}

function isoDay(d) {
  return d.toISOString().slice(0, 10)
}

export async function handleAnalytics(req, res) {
  try {
    const a = admin()
    if (!a) {
      return res.status(500).json({ error: 'server_not_configured' })
    }

    // We only need created_at, sight_guess, and user_id (for unique-explorers).
    // Cap at 5000 most-recent rows to keep memory predictable; the akimat use
    // case is "last few months", not historical archive.
    const { data, error } = await a
      .from('analyses')
      .select('id, user_id, sight_guess, created_at')
      .order('created_at', { ascending: false })
      .limit(5000)

    if (error) {
      console.error(error)
      return res.status(502).json({ error: 'query_failed', detail: error.message })
    }

    const rows = data || []
    const now = Date.now()
    const dayMs = 86_400_000

    const totalSnapshots = rows.length
    const uniqueExplorers = new Set(rows.map((r) => r.user_id).filter(Boolean)).size

    const sightCounts = new Map()
    const dayCounts = new Map()
    const hourCounts = new Array(24).fill(0)
    let last7 = 0
    let last30 = 0

    // Seed the last-14-days bucket with zeros so the bar chart always shows
    // a continuous timeline even when some days are empty.
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * dayMs)
      dayCounts.set(isoDay(d), 0)
    }

    for (const r of rows) {
      const t = new Date(r.created_at).getTime()
      const age = now - t
      if (age <= 7 * dayMs) last7++
      if (age <= 30 * dayMs) last30++

      const bucket = bucketOf(r.sight_guess)
      const prev = sightCounts.get(bucket.key) || { label: bucket.label, count: 0 }
      prev.count += 1
      sightCounts.set(bucket.key, prev)

      const day = isoDay(new Date(t))
      if (dayCounts.has(day)) dayCounts.set(day, dayCounts.get(day) + 1)

      const h = new Date(t).getHours()
      if (h >= 0 && h < 24) hourCounts[h]++
    }

    const bySight = [...sightCounts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    const byDay = [...dayCounts.entries()].map(([day, count]) => ({ day, count }))
    const byHour = hourCounts.map((count, hour) => ({ hour, count }))

    res.setHeader('Cache-Control', 'public, max-age=60')
    return res.json({
      totalSnapshots,
      uniqueExplorers,
      last7Days: last7,
      last30Days: last30,
      bySight,
      byDay,
      byHour,
      generatedAt: new Date().toISOString(),
      sampleWindow: rows.length === 5000 ? 'capped_5000' : 'full',
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err?.message ?? 'analytics failed' })
  }
}
