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
│   │   ├── components/          # Sidebar, ScopesWarning (Layout extraction)
│   │   ├── features.config.ts   # nav sidebar entries
│   │   └── stores/
│   │       ├── auth.svelte.ts   # Twitch auth state + checkAuth / startTwitchAuth / logout
│   │       ├── stream.svelte.ts # stream online/offline + counts, polled every 30s
│   │       └── scopes.svelte.ts # missing Twitch OAuth scopes warning
│   ├── components/ui/           # shadcn primitives: Button, Card, Dialog, Input, Table, Tabs…
│   ├── features/
│   │   ├── ai/
│   │   ├── auth/
│   │   │   └── components/      TwitchPermissions, LoginForm
│   │   ├── chat/
│   │   ├── dashboard/
│   │   ├── moderation/
│   │   ├── overlays/            # Modular system: WIDGET_REGISTRY, DEFAULT_ELEMENT_CONFIGS
│   │   │   └── components/      Widget components + builder/ folder
│   │   ├── subscribers/
│   │   ├── system/
│   │   ├── timers/
│   │   ├── tts/
│   │   └── viewers/
│   └── types/api.ts             # all backend response types
└── routes/
    ├── +layout.svelte            # Orchestrator (Sidebar + ScopesWarning + Main Content)
    ├── +page.svelte              # / → Dashboard
    ├── ai/+page.svelte
    ├── auth/callback/+page.svelte
    ├── commands/+page.svelte
    ├── moderation/+page.svelte
    ├── settings/+page.svelte     # Twitch scopes / re-auth
    ├── subscribers/+page.svelte  # leaderboards
    ├── system/+page.svelte       # health + D3 graph
    ├── timers/+page.svelte
    ├── tts/+page.svelte          # includes OBS overlay URL for /overlays/tts
    ├── viewers/+page.svelte
    └── overlays/
        ├── +layout.svelte        # empty layout for all /overlays/* except /overlays
        ├── +page.svelte          # overlay index
        ├── alerts/+page.svelte
        ├── tts/+page.svelte
        ├── builder/[id]/+page.svelte # Thin orchestrator for builder components
        └── live/[id]/+page.svelte    # Thin orchestrator for live widgets
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

Single source of truth for all backend API shapes. Never inline types in components.

Known quirk: `SubscribersLeaderboardResponse` does not use the generic `ApiResponse<T>` wrapper because the backend returns `total` at the top level — matches the backend contract.

---

## Overlay System — `src/lib/features/overlays/types.ts`

### `ElementStyle`

```ts
type ElementStyle = {
  background: string;    // hex with alpha e.g. '#000000cc'
  accent: string;        // hex
  border_radius: number; // 0–60 px
  glow: boolean;
  duration_ms: number;   // alerts only
  animation: 'scale_in' | 'fade_in' | 'slide_up' | 'slide_down';
  font_size: number;     // 10–120 px
  text_color: string;    // hex
  opacity: number;       // 0–100 (applied as opacity/100 on the root element)
};
```

### `ChatMessage` / `ChatFragment`

```ts
type ChatFragment = {
  type: string;            // 'text' | 'emote'
  text: string;
  emote_id?: string | null;
  emote_animated?: boolean; // true → use /animated/ CDN path, false → /static/
};

type ChatMessage = {
  display_name: string;
  message: string;         // full text fallback
  timestamp: number;
  color?: string;          // Twitch user color e.g. '#FF4500'
  badges?: Record<string, string>; // set_id → version e.g. { moderator: '1' }
  fragments?: ChatFragment[];
};
```

### Widget rendering rule for fragments

Always iterate with index key — never content key — to avoid Svelte duplicate-key errors when the same emote appears more than once:

```svelte
{#each frags as frag, i (i)}
  {#if frag.type === 'emote' && frag.emote_id}
    {@const fmt = frag.emote_animated ? 'animated' : 'static'}
    <img src="https://static-cdn.jtvnw.net/emoticons/v2/{frag.emote_id}/{fmt}/dark/1.0" ... />
  {:else}
    {frag.text}
  {/if}
{/each}
```

### Badge images

Fetched from `GET /chat/badges` on widget `onMount`. Returns `{ set_id: { version: image_url_1x } }`. Cached 1 hour server-side. Falls back silently when no Twitch session is active.

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

| Field | Type | Notes |
|---|---|---|
| `display_name` | string | |
| `user_id` | string | |
| `message` | string | full text |
| `color` | string | Twitch user color, may be empty |
| `badges` | `Record<string, string>` | set_id → version |
| `fragments` | `ChatFragment[]` | ordered parts; emotes include `emote_id` + `emote_animated` |
| `is_mod` | bool | |
| `is_sub` | bool | |
| `is_broadcaster` | bool | |
| `channel` | string | |
| `timestamp` | string | ISO8601 |

---

## Known Issues

| Symptom | Cause | Fix |
|---|---|---|
| Chat messages not appearing despite SSE connected | `/chat/stream` sends payload directly, no wrapper | `connectChat()` normalises both formats |
| `EventSource` CORS errors | absolute URL bypasses Vite proxy | `client.ts` uses `BASE = ''` |
| Some SSE frames carry no payload | keepalive/connect frames | `getBadges` accepts `null \| undefined`, template uses `(msg.data ?? {})` |
| Same emote twice in a message breaks widget | duplicate key in `{#each}` | always use index key `(i)` for fragment loops |
