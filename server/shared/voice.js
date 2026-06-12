import {
  CURRENT_INFO_RE,
  GREETINGS,
  GREETING_RE,
  GREETING_SUGGS,
  LANG_NAME,
  SIGHT_CONTEXT,
  applyIntent,
  classifyIntent,
  extractActions,
  narrateForcedAction,
  summarizeLastAction,
} from './voice-primitives.js'
import { factsToPromptBlock, loadUserFacts, summarizeConversation } from './agent/memory.js'
import { runAgent } from './agent/loop.js'
import { dispatchTool } from './agent/tools.js'

function hasLocation(location) {
  return location && Number.isFinite(location.lat) && Number.isFinite(location.lon)
}

function buildSystemPrompt({ langName, locLine, memorySection, factsBlock, summaryBlock, webNote }) {
  return [
    `You are Iz, a Mangystau local helping a traveler by voice chat.

VOICE RULES:
- Reply in ${langName}.
- Maximum TWO short sentences. Aim for one.
- Sound spoken, not written.
- No emojis, markdown, bullets, URLs, or citations.
- If you do not know, say so briefly. Never invent place names, malls, hotels, or businesses.
- ${locLine}

CARDS DO THE SHOWING. You narrate; the app renders rich cards.

TOOLS:
- For weather, rain, wind, heat, cold, sunrise, sunset: call get_weather.
- For NEARBY places, "closest", "near me", or "what's around" — food, cafes, hotels, fuel, shops, attractions, viewpoints: call search_pois.
- For "best / top / most impressive / recommended / самый-самый / лучший" hotel, restaurant, or tour operator: call recommend with category set to hotel | restaurant | tour. This returns a curated hand-ranked pick — NEVER use search_pois for these, because OSM returns the closest random place (often a hostel for "best hotel"), not the best.
- For a named Mangystau sight or photo/reference request: call show_sight.
- For routes, navigation, or "take me to X": call directions.
- For current-info questions outside Mangystau curated data — news, prices, opening hours, events, schedules: call web_search.
- For multi-stop routes, day trips, "route through A and B": call build_route.
- For "what can I do", "куда сходить", "чем заняться", or a quick itinerary: call plan_day.
- For open-ended "recommend me", "surprise me", "what should I do right now": call recommend with no category.
- For booking a table, calling a restaurant, reserving a tour, contacting a hotel: call book_whatsapp. Pass the place name and write a short polite message in ${langName} mentioning party size and time if known. The user will tap to send.
- For talking to locals when the traveler doesn't share a language ("ask the driver", "tell him", "how do I say", "translate to Kazakh"): call translate. Pass the phrase in the traveler's own language and set "to" to "ru" or "kk". The translator card handles the back-and-forth — you don't repeat the translation in your spoken reply.
- For stable user preferences you just learned: call remember.

After tools return, reply in one short spoken sentence. Do not repeat full card data. For translate cards, simply confirm "I'll ask them" (in ${langName}) — the card speaks the translation.

SUGGESTIONS: You may end with [[SUGG:a|b|c]] using three short follow-up taps in ${langName}.`,
    factsBlock,
    summaryBlock,
    memorySection,
    webNote,
    SIGHT_CONTEXT,
  ].filter(Boolean).join('\n\n')
}

function isPlanIntent(userText) {
  return /(что.{0,16}(можно|делать|сделать)|куда.{0,12}(сходить|поехать)|чем.{0,12}зан|what.{0,12}to do|things to do|plan.{0,8}day|itinerary)/i.test(String(userText || ''))
}

async function forcedFallback({ intent, lastUser, location, lang }) {
  if (isPlanIntent(lastUser) && location) {
    const result = await dispatchTool('plan_day', {}, { lang, location, userId: null })
    return {
      action: result.display || null,
      text: {
        en: 'Here is a compact day plan around Aktau.',
        ru: 'Вот короткий план по Актау: вид, еда и точка для фото.',
        kk: 'Міне, Ақтау бойынша қысқа жоспар: көрініс, тамақ және фото нүкте.',
      }[lang],
    }
  }
  const action = await applyIntent(intent, location, lang)
  return {
    action,
    text: action ? narrateForcedAction(intent, action, lang) || '' : '',
  }
}

export async function handleVoiceChat(req, res) {
  try {
    const { messages, lang, location, lastAction, userId } = req.body ?? {}
    const L = (lang === 'en' || lang === 'ru' || lang === 'kk') ? lang : 'ru'
    const langName = LANG_NAME[L]
    const hasLoc = hasLocation(location)
    const memoryLine = summarizeLastAction(lastAction)

    const lastUser = Array.isArray(messages)
      ? [...messages].reverse().find((m) => m?.role === 'user')?.content || ''
      : ''
    if (GREETING_RE.test(String(lastUser).trim())) {
      const pool = GREETINGS[L]
      const text = pool[Math.floor(Math.random() * pool.length)]
      return res.json({ text, action: null, suggestions: GREETING_SUGGS[L] })
    }

    const history = Array.isArray(messages)
      ? messages
          .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
          .slice(-12)
          .map((m) => ({ role: m.role, content: String(m.content).slice(0, 1200) }))
      : []

    const locLine = hasLoc
      ? `The user is right now at latitude ${location.lat.toFixed(4)}, longitude ${location.lon.toFixed(4)}${location.place ? ` (near ${location.place})` : ''}. Tailor distances and nearby results to that.`
      : `You don't know where the user is. If a recommendation needs their location, ask once, briefly.`
    const memorySection = memoryLine
      ? `MEMORY OF YOUR LAST ACTION: ${memoryLine}
If the user references "that map", "that pin", "ту точку", "что показал" then they mean THIS card. You DID show it.`
      : null

    const facts = await loadUserFacts(userId)
    const factsBlock = factsToPromptBlock(facts)
    const userTurnCount = history.filter((m) => m.role === 'user').length
    const summary = (userTurnCount >= 6 && userTurnCount % 4 === 0)
      ? await summarizeConversation(history)
      : null
    const summaryBlock = summary ? `CONVERSATION SO FAR: ${summary}` : null

    const needsWeb = CURRENT_INFO_RE.test(String(lastUser || ''))
    const modelId = needsWeb
      ? 'google/gemini-2.5-flash-lite:online'
      : 'google/gemini-2.5-flash-lite'
    const webNote = needsWeb
      ? `THIS TURN HAS WEB SEARCH. Use current search results when answering, but never paste URLs or source names.`
      : null

    const systemPrompt = buildSystemPrompt({
      langName,
      locLine,
      memorySection,
      factsBlock,
      summaryBlock,
      webNote,
    })

    const { finalText, finalAction, trace } = await runAgent({
      systemPrompt,
      history,
      modelId,
      ctx: { lang: L, location: hasLoc ? location : null, userId },
    })

    const parsed = await extractActions(finalText, hasLoc ? location : null, L)
    let resultText = parsed.clean
    let resultAction = finalAction || parsed.action

    const intent = classifyIntent(lastUser)
    if (!resultAction) {
      const forced = await forcedFallback({
        intent,
        lastUser,
        location: hasLoc ? location : null,
        lang: L,
      })
      if (forced.action) {
        resultAction = forced.action
        resultText = forced.text || resultText
      }
    }

    if (!resultText && resultAction) {
      resultText = {
        en: 'I found it, the card is ready.',
        ru: 'Нашёл, карточка уже готова.',
        kk: 'Таптым, карточка дайын.',
      }[L]
    }

    const failedRemember = trace.find((t) => t.tool === 'remember' && t.result?.saved === false)
    if (failedRemember && !userId) {
      resultText = {
        en: 'Sign in and I can remember that for next time.',
        ru: 'Войди в аккаунт, и я запомню это на следующий раз.',
        kk: 'Аккаунтқа кірсең, келесі жолы есте сақтаймын.',
      }[L]
    }

    res.json({
      text: resultText,
      action: resultAction,
      suggestions: parsed.suggestions,
      summary,
      trace: process.env.NODE_ENV === 'production' ? undefined : trace,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err?.message ?? 'voice chat failed' })
  }
}
