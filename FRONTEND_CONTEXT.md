# FRONTEND_CONTEXT — StreamCoreOS Dashboard

> Maintained manually. Update this file when architecture changes.
> Quick reference for patterns and gotchas — read AGENTS.md first.

---

## Stack (current)

| Concern | Choice |
|---|---|
| Framework | SvelteKit 2 + Svelte 5 runes |
| Styling | Tailwind CSS v4 + bits-ui (shadcn-style components) |
| Icons | Lucide Svelte |
| Language | TypeScript strict |
| Package manager | pnpm |
| Charts | D3 (system graph only) |
| Dark mode | `mode-watcher` |

CSS variables are defined in `src/app.css` using Tailwind's `@theme` block and HSL custom properties. There are legacy fallbacks (`--surface`, `--text`, etc.) for components not yet migrated to Tailwind — remove them as each component is updated.

---

## Folder Structure

```
src/
├── lib/
│   ├── core/
│   │   ├── api/client.ts        # HTTP + SSE helpers
│   │   ├── features.config.ts   # nav sidebar entries
│   │   └── stores/
│   │       ├── auth.svelte.ts   # Twitch auth state + checkAuth / startTwitchAuth / logout
│   │       ├── stream.svelte.ts # stream online/offline + counts, polled every 30s
│   │       └── scopes.svelte.ts # missing Twitch OAuth scopes warning
│   ├── components/ui/           # shadcn primitives: Button, Card, Dialog, Input, Table, Tabs…
│   ├── features/
│   │   ├── ai/
│   │   │   └── components/  AIChatConfig, AIModerationConfig, AIProviderConfig
│   │   ├── auth/
│   │   │   └── components/  TwitchPermissions
│   │   ├── chat/
│   │   │   ├── components/  AlertFeed, ChatReminders, ChatViewer
│   │   │   └── stores/      alerts.svelte.ts, chat.svelte.ts, tts.svelte.ts
│   │   ├── commands/
│   │   │   └── components/  CommandsManager
│   │   ├── dashboard/
│   │   │   └── components/  ManualActions, StreamStatus
│   │   ├── moderation/
│   │   │   └── components/  ModerationRules, ModLog
│   │   ├── subscribers/
│   │   │   └── components/  BitsLeaderboard, GiftersLeaderboard, SubscribersLeaderboard
│   │   ├── system/
│   │   │   └── components/  SystemGraph (D3), SystemHealth
│   │   ├── timers/
│   │   │   └── components/  TimersManager
│   │   ├── tts/
│   │   │   ├── components/  TTSConfig, TtsSettings, TtsVoiceAssignments
│   │   │   └── stores/      settings.svelte.ts
│   │   └── viewers/
│   │       └── components/  RegularsManager, ViewerLookup, ViewersLeaderboard
│   └── types/api.ts             # all backend response types
└── routes/
    ├── +layout.svelte            # auth guard, sidebar, SSE lifecycle, scopes banner
    ├── +page.svelte              # / → Dashboard (StreamStatus + AlertFeed)
    ├── ai/+page.svelte           # AI provider + chatbot + moderation config
    ├── auth/callback/+page.svelte
    ├── chat/+page.svelte         # live chat viewer
    ├── commands/+page.svelte
    ├── moderation/+page.svelte
    ├── settings/+page.svelte     # Twitch scopes / re-auth
    ├── subscribers/+page.svelte  # leaderboards
    ├── system/+page.svelte       # health + D3 graph
    ├── timers/+page.svelte
    ├── tts/+page.svelte
    ├── viewers/+page.svelte
    └── overlays/                 # OBS browser sources (transparent bg, no nav)
        ├── +layout.svelte        # empty layout for all /overlays/* except /overlays
        ├── +page.svelte          # overlay index card
        ├── alerts/+page.svelte
        ├── chat/+page.svelte
        └── tts/+page.svelte
```

---

## API Client — `src/lib/core/api/client.ts`

Relative BASE (`''`) — Vite proxy forwards all backend paths to `:8000` in dev. In production, nginx handles the proxy.

```ts
import { get, post, put, del, sse } from '$lib/core/api/client';
```

SSE reconnects automatically every 3s on error. Returns a `() => void` cleanup.

---

## Store Patterns

### Global stores (mounted in `+layout.svelte`)

- `auth.svelte.ts` — `auth.isAuthenticated`, `auth.loading`, `auth.error`
- `stream.svelte.ts` — `stream.online`, `stream.viewer_count`, polled every 30s
- `scopes.svelte.ts` — `scopesState.missing[]`, drives the amber warning banner

### Feature stores (mounted in the feature component or route)

- `alerts.svelte.ts` — SSE `/dashboard/alerts`, max 100 messages
- `chat.svelte.ts` — SSE `/chat/stream`, max 200 messages, oldest-first
- `tts.svelte.ts` — SSE `/tts/stream`, drives OBS TTS overlay

### SSE normalisation (chat)

`/chat/stream` may send the payload directly (no `{ type, data, timestamp }` wrapper).
`connectChat()` normalises both formats — do not break this when editing.

---

## Key Patterns

### CRUD component (CommandsManager, ModerationRules as reference)

- Fetch list on `onMount`
- `editingId: number | null` controls which row is in edit mode
- After save: patch array in place (`items = items.map(...)`)
- After delete: filter array (`items = items.filter(...)`)
- No optimistic UI — wait for server confirmation

### SSE lifecycle (layout, chat page)

```svelte
onMount(() => {
  const stop = connectAlerts();
  return stop;
});
```

### Auth retry (`auth.svelte.ts`)

On mount, `checkAuth()` retries up to 5×1s while `connecting === true`. This handles the race between OAuth callback and EventSub connection. The 5s worst case is intentional.

---

## Types — `src/lib/types/api.ts`

Single source of truth for all API shapes. Never inline types in components.

Known quirk: `SubscribersLeaderboardResponse` does not use the generic `ApiResponse<T>` wrapper because the backend returns `total` at the top level — matches the backend contract.

---

## Known Issues

| Symptom | Cause | Fix |
|---|---|---|
| Chat messages not appearing despite SSE connected | `/chat/stream` sends payload directly, no wrapper | `connectChat()` normalises both formats |
| `EventSource` CORS errors | absolute URL bypasses Vite proxy | `client.ts` uses `BASE = ''` |
| Some SSE frames carry no payload | keepalive/connect frames | `getBadges` accepts `null \| undefined`, template uses `(msg.data ?? {})` |

---

## Backend SSE Reference

### `/dashboard/alerts` — always `{ type, data, timestamp }`

| `type` | Notable `data` fields |
|---|---|
| `channel.follow` | `user_name`, `user_login` |
| `channel.subscribe` | `user_name`, `tier` |
| `channel.subscription.message` | `user_name`, `cumulative_months` |
| `channel.subscription.gift` | `user_name`, `total` |
| `channel.cheer` | `user_name`, `bits` |
| `channel.raid` | `from_broadcaster_user_name`, `viewers` |
| `stream.session.started` | `broadcaster_login`, `started_at` |
| `stream.session.ended` | `ended_at` |
| `moderation.action.taken` | `display_name`, `action`, `reason` |

### `/chat/stream` — payload may be unwrapped

Fields: `display_name`, `user_id`, `message`, `is_mod`, `is_sub`, `is_broadcaster`, `channel`, `timestamp`.
