// DuckDuckGo HTML scrape — no API key required. We grab the first 5 organic
// results and return { title, url, snippet }. Title and snippet are passed
// to the LLM as toolResult; the URL list is also rendered as a card.
const DDG_ENDPOINT = 'https://duckduckgo.com/html/'

function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, '')).trim()
}

function unwrapDdgRedirect(href) {
  // DDG wraps results in /l/?uddg=<urlencoded>&rut=...
  const m = String(href).match(/[?&]uddg=([^&]+)/)
  if (m) {
    try {
      return decodeURIComponent(m[1])
    } catch {
      return href
    }
  }
  return href
}

export async function searchWeb(query, limit = 5) {
  const body = new URLSearchParams({ q: query }).toString()
  const res = await fetch(DDG_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent':
        'Mozilla/5.0 (compatible; IzMangystauBot/1.0; +https://iz-psi.vercel.app)',
    },
    body,
  })
  if (!res.ok) return []
  const html = await res.text()

  const results = []
  const blockRe =
    /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[\s\S]*?>([\s\S]*?)<\/a>/g
  let m
  while ((m = blockRe.exec(html)) && results.length < limit) {
    const url = unwrapDdgRedirect(m[1])
    const title = stripTags(m[2])
    const snippet = stripTags(m[3])
    if (!url || !title) continue
    results.push({ title, url, snippet })
  }
  return results
}
