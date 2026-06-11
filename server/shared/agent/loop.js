import OpenAI from 'openai'
import { TOOL_SCHEMA, dispatchTool } from './tools.js'

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || 'missing-openrouter-key',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173',
    'X-Title': 'IZ Mangystau Voice Agent',
  },
})

const MAX_HOPS = 4
const DEADLINE_MS = 22000

export async function runAgent({ systemPrompt, history, modelId, ctx }) {
  const t0 = Date.now()
  const messages = [{ role: 'system', content: systemPrompt }, ...history]
  const trace = []
  let lastDisplay = null

  for (let hop = 0; hop < MAX_HOPS; hop++) {
    if (Date.now() - t0 > DEADLINE_MS) break

    const completion = await client.chat.completions.create({
      model: modelId,
      messages,
      tools: TOOL_SCHEMA,
      tool_choice: 'auto',
      max_tokens: 280,
      temperature: 0.5,
    })

    const msg = completion.choices?.[0]?.message
    if (!msg) break
    const toolCalls = Array.isArray(msg.tool_calls) ? msg.tool_calls : []
    messages.push(msg)

    if (toolCalls.length === 0) {
      return {
        finalText: String(msg.content || '').trim(),
        finalAction: lastDisplay,
        trace,
      }
    }

    for (const call of toolCalls) {
      let args = {}
      try {
        args = JSON.parse(call.function.arguments || '{}')
      } catch {
        args = {}
      }
      const { display, toolResult } = await dispatchTool(call.function.name, args, ctx)
      if (display) lastDisplay = display
      trace.push({ tool: call.function.name, args, result: toolResult, hasDisplay: !!display })
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(toolResult ?? { ok: true }),
      })
    }
  }

  return { finalText: '', finalAction: lastDisplay, trace }
}
