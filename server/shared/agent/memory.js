import OpenAI from 'openai'
import { supabaseAdmin } from '../supabaseAdmin.js'

export async function loadUserFacts(userId) {
  if (!userId || !supabaseAdmin) return {}
  const { data, error } = await supabaseAdmin
    .from('user_facts')
    .select('key, value')
    .eq('user_id', userId)
  if (error || !data) return {}
  const out = {}
  for (const row of data) out[row.key] = row.value
  return out
}

export async function saveFact(userId, key, value) {
  if (!userId || !supabaseAdmin || !key || value == null) return { ok: false }
  const { error } = await supabaseAdmin
    .from('user_facts')
    .upsert(
      { user_id: userId, key, value: String(value).slice(0, 200), source: 'agent' },
      { onConflict: 'user_id,key' },
    )
  return { ok: !error, error }
}

export function factsToPromptBlock(facts) {
  const keys = Object.keys(facts || {})
  if (keys.length === 0) return null
  const lines = keys.slice(0, 12).map((k) => `- ${k}: ${facts[k]}`).join('\n')
  return `STABLE FACTS ABOUT THIS USER (use them, don't ask again):\n${lines}`
}

const sumClient = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || 'missing-openrouter-key',
  baseURL: 'https://openrouter.ai/api/v1',
})

export async function summarizeConversation(history) {
  if (!Array.isArray(history) || history.length < 6) return null
  const text = history.slice(-20).map((m) => `${m.role}: ${m.content}`).join('\n')
  const r = await sumClient.chat.completions.create({
    model: 'google/gemini-2.5-flash-lite',
    messages: [
      { role: 'system', content: 'Summarize this travel-assistant conversation in 2 short factual sentences. Focus on what the user wants, where they are, and what was shown. No fluff.' },
      { role: 'user', content: text.slice(0, 4000) },
    ],
    max_tokens: 90,
    temperature: 0.2,
  })
  return r.choices?.[0]?.message?.content?.trim() || null
}
