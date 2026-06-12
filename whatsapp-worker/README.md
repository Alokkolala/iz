# iz-whatsapp-worker

Long-running Node service that drives WhatsApp Web for the Iz Mangystau
agent. Run this **outside Vercel** — Vercel's functions are serverless and
suspend after each request, but WhatsApp Web needs a persistent WebSocket
session.

## What it does

- Boots a headless Chromium via `whatsapp-web.js`.
- Stores the WA session in `./.wwebjs_auth/` (or `/data/wwebjs_auth` in
  Docker) so you only scan the QR once.
- Exposes three HTTP routes:
  - `GET  /status` — `{ ready, connectedAs }`
  - `GET  /qr`     — JSON pairing code, only useful before first ready
  - `POST /send`   — `{ phone, message }` → sends as you
- All routes (except `/qr`) require `Authorization: Bearer $WORKER_SECRET`.
  The Vercel app holds the secret server-side; users never see it.

## Caveats — read these

- **Against WhatsApp ToS.** Personal numbers running automation can get
  banned. Use a number you can afford to lose, or a secondary line.
- **Session breaks** every few weeks (Chrome update, WA Web schema bump).
  When `/status.ready` is `false`, re-scan the QR.
- **No abuse safeguards beyond a Bearer token.** Don't expose the worker to
  the public internet without something in front of it (Railway/Fly private
  network, or a Cloudflare Tunnel).

## Required env

| var              | what                                                    |
|------------------|---------------------------------------------------------|
| `WORKER_SECRET`  | Long random string. Must match `WHATSAPP_WORKER_SECRET` set in Vercel. |
| `PORT`           | Default 8088.                                           |
| `SESSION_DIR`    | Where LocalAuth caches keys. Mount a volume here.       |

## Option 1 — Railway (recommended)

```bash
# from this directory
railway init
railway up
railway variables set WORKER_SECRET=$(openssl rand -hex 32)
# In the Railway dashboard, add a volume mounted at /data so the session
# survives redeploys.
```

Once it's deployed, grab the public URL (or use a private domain) and set
in the Iz Vercel project:

```bash
vercel env add WHATSAPP_WORKER_URL production    # https://iz-wa.up.railway.app
vercel env add WHATSAPP_WORKER_SECRET production # same value as above
```

Then `vercel --prod`.

## Option 2 — Fly.io

```bash
# from this directory
fly launch --no-deploy
fly volumes create wa_session --size 1
fly secrets set WORKER_SECRET=$(openssl rand -hex 32)
# In fly.toml, mount the volume:
# [[mounts]]
#   source = "wa_session"
#   destination = "/data"
fly deploy
```

## Option 3 — Local machine (laptop / home server)

```bash
cd whatsapp-worker
npm install
WORKER_SECRET=$(openssl rand -hex 32) node index.js
```

On first run a QR will print to your terminal — scan it from
WhatsApp -> Linked devices -> Link a device.

To expose to Vercel you can use a Cloudflare Tunnel:

```bash
cloudflared tunnel --url http://localhost:8088
```

Use the resulting `https://*.trycloudflare.com` URL as
`WHATSAPP_WORKER_URL` in Vercel.

## First-time pairing

1. Start the worker.
2. Tail the logs — you'll see a QR ASCII printout.
3. WhatsApp app → Settings → Linked devices → Link a device → scan.
4. `[ready] connected as <your number>` appears.
5. The agent's WhatsApp card will now show the "Send now" button.

## Re-pairing

If the worker logs `auth_failure` or `/status` reports `ready: false` for
more than a minute:

```bash
# wipe the cached session and restart
rm -rf $SESSION_DIR     # or /data/wwebjs_auth in Docker
# restart the process — a fresh QR will appear
```
