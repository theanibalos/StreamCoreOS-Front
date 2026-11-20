# StreamCoreOS — Frontend

Dashboard and local overlay feed controls for [StreamCoreOS](https://github.com/theanibalos/StreamCoreOS). Built with SvelteKit, Tailwind CSS v4, and TypeScript.

**License:** AGPL-3.0

---

## Stack

- **SvelteKit 2** + Svelte 5 (runes)
- **Tailwind CSS v4**
- **TypeScript**
- **bits-ui** — headless components
- **d3** — charts

---

## Development

Requires the StreamCoreOS backend running on `localhost:8000`.

```bash
pnpm install
pnpm dev
# http://localhost:5173
```

The Vite proxy forwards all non-HTML requests to `http://localhost:8000` automatically. No CORS configuration needed in dev.

---

## Build

```bash
pnpm build
pnpm preview   # preview the production build locally
```

Outputs a static site to `build/`. Served by nginx in production (see `Dockerfile`).

The desktop launcher builds this same frontend with `VITE_STREAMCOREOS_DESKTOP=true`,
which hides Emission and disables its route. `STREAMCOREOS_DESKTOP_FRONTEND_DIR`
selects its separate output directory. Normal web builds keep Emission enabled.

---

## Deploy

This repo is not deployed independently — it is built and served as part of the StreamCoreOS stack. See the [backend README](https://github.com/theanibalos/StreamCoreOS) for deploy instructions.

The `Dockerfile` builds a static nginx image. It is referenced by the backend's `docker-compose.selfhost.yml` (which clones this repo automatically) and `docker-compose.prod.yml` (which pulls a pre-built image from ghcr.io).

---

## Project Structure

```
src/
├── lib/
│   ├── core/
│   │   ├── api/client.ts          # HTTP + SSE client (all calls to /api/*)
│   │   ├── components/            # Sidebar, ScopesWarning
│   │   ├── stores/                # auth, stream, scopes, toast
│   │   └── features.config.ts     # Feature flags
│   ├── features/
│   │   ├── ai/                    # AI provider config
│   │   ├── auth/                  # Login form, Twitch permissions
│   │   ├── chat/                  # Chat viewer, alerts, TTS state
│   │   ├── commands/              # Command manager
│   │   ├── dashboard/             # Stream status, manual actions
│   │   ├── moderation/            # Rules manager, mod log
│   │   ├── overlays/              # Feed token and test controls
│   │   ├── subscribers/           # Leaderboards
│   │   ├── system/                # Health graph, system status
│   │   ├── timers/                # Timer manager
│   │   ├── tts/                   # TTS config, voice assignments
│   │   └── viewers/               # Viewer lookup, leaderboard, regulars
│   └── components/ui/             # shadcn-style primitives
└── routes/
    ├── +layout.svelte             # Auth shell + sidebar
    ├── overlays/                  # Feed URL, manifest, event tests
    │   └── tts/                   # Built-in TTS browser source
    └── ...                        # One route per feature
```

---

## OBS Integration

Build an HTML overlay locally, then open it as an OBS Browser Source. On the
dashboard's **Overlays** page, copy the feed URL and manifest. In your local
JavaScript, subscribe to the feed URL:

```js
const feed = new EventSource('http://localhost:8000/api/overlays/feed?token=YOUR_TOKEN');
feed.onmessage = ({ data }) => {
  const event = JSON.parse(data);
  if (event.type === 'event.follow') console.log(event.data.user);
};
```

Use the feed URL shown in the dashboard if its origin differs from localhost.
The first event is `feed.snapshot`; subsequent events include `stat.update`,
`chat.message`, and `event.*`. See [the feed contract](OVERLAY_FEED_CONTRACT.md)
for payloads and the manifest endpoint for the current list of types. The token
grants read-only access to the feed; keep it in your local files and rotate it
from the dashboard if needed.

---

**Part of [StreamCoreOS](https://github.com/theanibalos/StreamCoreOS)**
