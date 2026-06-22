# StreamCoreOS — Frontend

Dashboard and overlay builder for [StreamCoreOS](https://github.com/theanibalos/StreamCoreOS). Built with SvelteKit, Tailwind CSS v4, and TypeScript.

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
│   │   ├── overlays/              # Builder, widgets, live renderer
│   │   ├── subscribers/           # Leaderboards
│   │   ├── system/                # Health graph, system status
│   │   ├── timers/                # Timer manager
│   │   ├── tts/                   # TTS config, voice assignments
│   │   └── viewers/               # Viewer lookup, leaderboard, regulars
│   └── components/ui/             # shadcn-style primitives
└── routes/
    ├── +layout.svelte             # Auth shell + sidebar
    ├── overlays/
    │   ├── builder/[id]/          # Overlay builder (drag-and-drop, meta-driven widgets)
    │   └── live/[id]/             # Live overlay renderer (OBS browser source)
    └── ...                        # One route per feature
```

---

## OBS Integration

Overlay live URLs follow the pattern:

```
http://your-domain/overlays/live/{overlay-id}
```

Add as a **Browser Source** in OBS. The page has a transparent background and connects to the backend via SSE for real-time updates (alerts, stats, chat).

Append `?preview` to test the overlay without an active stream:

```
http://localhost:5173/overlays/live/{overlay-id}?preview
```

---

**Part of [StreamCoreOS](https://github.com/theanibalos/StreamCoreOS)**
