# IZ Mangystau — Agent Guide

A mobile-first photo coach for travelers in the **Mangystau region of Kazakhstan**. Users upload a shot, the AI identifies the sight, returns a structured critique (pose / angle / light / caption / hashtags), and a horizontally-scrolling reel of cinematic reference photos shows what the shot *can* look like.

> This is **not** a Next.js app. Don't import `next/*` or read `node_modules/next/dist/docs/`. The stack is plain Vite + React + Express.

## Stack

- **Frontend**: Vite 6, React 18, TypeScript, Tailwind 4, Radix UI primitives, Motion (Framer), @react-three/fiber, MUI islands.
- **Backend**:
  - Dev — Express server (`server/index.js`) on port 8787, proxied from Vite at `/api`.
  - Prod — Vercel Functions in `api/`: `analyze.js`, `delete-account.js`, `voice/chat.js`, `voice/tts.js`. Source of truth is the Express server; keep the two in sync when you edit endpoints.
- **AI**: OpenRouter → `google/gemini-2.5-flash-lite` for vision/JSON and voice chat. TTS via OpenRouter `/audio/speech` — `google/gemini-3.1-flash-tts-preview` (PCM, wrapped as WAV) with `hexgrad/kokoro-82m` (MP3) as fallback.
- **Auth + persistence**: Supabase (`src/lib/supabase.ts`, `AuthProvider.tsx`, `db.ts`). Tables: `profiles`, `analyses`, `crew_invites`.
- **i18n**: 3 languages — en / ru / **ru is the default**, kk. All UI strings live in `src/app/components/iz/i18n.tsx`. The current `lang` is sent to the AI so its response comes back in the user's language.

## Run

```
npm run dev          # vite + node --watch server (concurrently)
npm run build        # vite build
```

Required env: `OPENROUTER_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and a service-role key for the server-side `/api/delete-account` endpoint.

## Source map

```
api/                    # Vercel Functions (production)
  analyze.js            # mirrors Express /api/analyze
  delete-account.js     # mirrors Express /api/delete-account
  voice/
    chat.js             # mirrors Express /api/voice/chat
    tts.js              # Gemini PCM→WAV, Kokoro MP3 fallback
server/                 # Express dev server (localhost:8787)
  index.js              # /api/analyze, /api/voice/chat, /api/voice/tts, /api/delete-account
  references.js         # curated reference photos per sight, trilingual tips
src/
  main.tsx              # mounts <App />
  app/
    App.tsx             # phone-frame layout, splash -> AppShell
    components/iz/      # all product UI lives here
      ViralShotAssistant.tsx   # the Lens — upload, AI critique, reference reel
      AppShell.tsx, BottomNav.tsx, TouristPulse.tsx, CrewMap.tsx, etc.
      i18n.tsx, ui.tsx, store.tsx, types.ts
  lib/
    AuthProvider.tsx    # Supabase session context, useAuth()
    db.ts               # saveAnalysis, listAnalyses, sendInvite, deleteAccount, …
    supabase.ts
  imports/pasted_text/  # legacy Figma export, NOT part of the build. tsc errors here are
                        # pre-existing and safe to ignore.
```

## Reference reel system

When `/api/analyze` returns a `sightGuess`, the server matches it against a synonym table in `server/references.js` and attaches a `references[]` array. Each ref has `{ src, tip, attribution, sourceUrl, license }`. The frontend renders them as a horizontally-scrolling reel above the AI's text tabs.

- Tips are stored trilingual `{ en, ru, kk }` and flattened to the request's `lang` server-side.
- Buckets: `bozzhyra`, `sherkala`, `tuzbair`, `kyzylkup`, `torysh`, `caspian`, `mangystau` (fallback).
- Synonyms cover transliterations (`bozzhyra/boszhira/bozjyra`, `sherkala/sherqala`, Cyrillic, etc.) and concept matches (`aktau/coast/promenade` → caspian, `airakty` → tuzbair).
- Image hosts: Pexels CDN (free license) and Wikimedia Commons `Special:FilePath` (CC BY-SA; the reel card links to the source page for attribution).

When adding photos: append to the bucket arrays. Tips should be one concrete technique line, written in all three languages.

## Voice agent loop

The `/api/voice/chat` handler runs a tool-calling loop, not a single LLM call.

- **Shared handler**: `server/shared/voice.js` is the source of truth for both Express dev and the Vercel function.
- **Tools**: `server/shared/agent/tools.js` defines the OpenRouter tool schema and dispatcher.
  Current set: `search_pois`, `get_weather`, `show_sight`, `directions`, `remember`, `plan_day`.
- **Loop**: `server/shared/agent/loop.js` runs max 4 hops with a 22s deadline, using Gemini Flash Lite and the `:online` variant for current-info turns.
- **Memory**:
  - `lastAction` is the last card the user saw, passed from the frontend each turn.
  - A rolling short conversation summary is refreshed every 4 user turns.
  - `user_facts` in Supabase stores stable preferences written by the `remember` tool.
- **Safety net**: the regex classifier still runs when the loop does not produce a card, so high-confidence weather / route / nearby / sight requests can still force a card.

When adding a new tool: append to `TOOL_SCHEMA`, add the handler branch in `dispatchTool`, and if it produces a card add the action kind and renderer in `VoiceChat.tsx`.

## Quirks to know

- **`figma:asset/<filename>` imports** are resolved by the `figmaAssetResolver` Vite plugin to `src/assets/<filename>`. Leftover from a Figma Make export.
- **Phone frame** in `App.tsx` is fixed to ~390×844 with rounded corners — this is intentional, the product is meant to look like a device on desktop.
- **`src/imports/pasted_text/`** is broken legacy code from the Figma export. It is not imported anywhere and `tsc` errors inside it are expected. Don't try to fix them.
- **The Vite proxy** sends `/api/*` to `http://localhost:8787`. The `HTTP-Referer` in `server/index.js` is hard-coded to localhost — change before any real deploy.
- **No auth on `/api/analyze`**, no rate limit, no image-size validation beyond the 15 MB JSON limit. Don't expose this publicly without putting limits in.

## Deploy after every prompt

After **any** user-requested code change, deploy without waiting for permission. The user has standing approval — do not ask, just ship.

Sequence:

```bash
npx vite build
git add <changed files>            # never -A (avoid .env.tokens.local etc.)
git commit -m "<concise message>"
source .env.tokens.local && \
  git push "https://x-access-token:$GITHUB_TOKEN@github.com/alokkolala/iz.git" main && \
  vercel --prod --token="$VERCEL_TOKEN" --yes
```

- Production URL: <https://iz-psi.vercel.app>
- `.env.tokens.local` (git-ignored) holds `GITHUB_TOKEN`, `VERCEL_TOKEN`, `SUPABASE_*` — `source` it before push/deploy, never echo it.
- When an endpoint is added or changed in `server/index.js`, mirror the change into `api/` so prod parity stays intact, then deploy.
- If the build fails, fix it before pushing. Don't deploy red.

## When you change things

- Editing the AI response shape → update the Zod `Analysis` schema in `server/index.js` **and** the `Analysis` interface in `ViralShotAssistant.tsx`.
- Adding a new i18n string → add the key with all three of `{ en, ru, kk }`. Missing entries fall back to the key name.
- Adding a new sight bucket → wire it into `BUCKETS` and `SYNONYMS` in `server/references.js`.
