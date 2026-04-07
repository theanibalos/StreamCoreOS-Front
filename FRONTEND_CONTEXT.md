# FRONTEND_CONTEXT — StreamCoreOS Dashboard

Dashboard frontend for the StreamCoreOS Twitch streaming backend.
Built with **SvelteKit 2 + Svelte 5 (runes) + TypeScript**. No CSS framework — plain scoped CSS with CSS custom properties.

> Read this file before touching any frontend code.
> Backend context lives in `AI_CONTEXT.md` (plugin development) and `README.md`.

---

## Stack

| Concern | Choice |
|---|---|
| Framework | SvelteKit 2 |
| Reactivity | Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`) |
| Language | TypeScript (strict) |
| Package manager | pnpm |
| Styling | Scoped CSS + `:global()` CSS custom properties |
| API layer | `src/lib/api/client.ts` — thin fetch wrapper |
| Dev proxy | Vite server proxy — all backend paths forwarded to `http://localhost:8000` |

---

## Folder structure

```
src/
├── lib/
│   ├── api/
│   │   └── client.ts          # get / post / put / del / sse helpers
│   ├── types/
│   │   └── api.ts             # TypeScript types for every OpenAPI schema
│   ├── stores/
│   │   ├── stream.svelte.ts   # stream online/offline + viewer/follower counts
│   │   ├── alerts.svelte.ts   # SSE /dashboard/alerts rolling buffer
│   │   └── chat.svelte.ts     # SSE /chat/stream rolling buffer
│   └── components/
│       ├── StreamStatus.svelte
│       ├── AlertFeed.svelte
│       ├── ChatViewer.svelte
│       ├── LoyaltyLeaderboard.svelte
│       ├── ViewerLookup.svelte
│       ├── CommandsManager.svelte
│       ├── ModerationRules.svelte
│       ├── ModLog.svelte
│       ├── ManualActions.svelte
│       └── SystemHealth.svelte
└── routes/
    ├── +layout.svelte          # sidebar nav, mounts SSE + polling lifecycle
    ├── +page.svelte            # /            → Dashboard
    ├── chat/+page.svelte       # /chat        → Live chat
    ├── loyalty/+page.svelte    # /loyalty     → Leaderboard + viewer lookup
    ├── commands/+page.svelte   # /commands    → Chat commands CRUD
    ├── moderation/+page.svelte # /moderation  → Rules + manual actions + log
    └── system/+page.svelte     # /system      → Health check
```

---

## API client — `src/lib/api/client.ts`

All requests use a **relative base URL** (`BASE = ''`). The Vite proxy forwards every backend path to `http://localhost:8000`, so both `fetch` and `EventSource` are same-origin — no CORS issues.

```ts
import { get, post, put, del, sse } from '$lib/api/client';

// REST — throws on non-2xx
const res = await get<MyResponse>('/some/path');
const res = await post<MyResponse>('/some/path', body);
const res = await put<MyResponse>('/some/path/123', body);
const res = await del<MyResponse>('/some/path/123');

// SSE — returns cleanup () => void
const stop = sse(
  '/dashboard/alerts',
  (raw) => { /* each JSON frame */ },
  (connected) => { /* true = open, false = error/close */ }
);
```

All backend responses follow `{ success: boolean, data: T | null, error: string | null }`.
Callers always check `res.success && res.data` before using the payload.

---

## Stores — `src/lib/stores/*.svelte.ts`

Svelte 5 `.svelte.ts` files. State is exported as a **mutable object** (not a reassigned `let`) so it works across module boundaries.

### `stream.svelte.ts`

```ts
import { stream, refreshStream } from '$lib/stores/stream.svelte';
// stream.{ online, viewer_count, follower_count, broadcaster_login, started_at, loading, error }
await refreshStream(); // fetches /stream/status + /dashboard/stats
```

Polled every 30 s from `+layout.svelte` via `setInterval`.

### `alerts.svelte.ts`

```ts
import { alerts, connectAlerts } from '$lib/stores/alerts.svelte';
// alerts.{ messages: SseMessage[], connected: boolean }
// messages = newest first, max 100
const stop = connectAlerts(); // opens SSE /dashboard/alerts
```

Connected globally in `+layout.svelte` → all pages read `alerts`.

### `chat.svelte.ts`

```ts
import { chat, connectChat } from '$lib/stores/chat.svelte';
// chat.{ messages: SseMessage[], connected: boolean }
// messages = oldest first, max 200
const stop = connectChat(); // opens SSE /chat/stream
```

Connected **only** on `/chat` page → disconnects on navigation away.

#### SSE normalisation (critical)

`/dashboard/alerts` always sends `{ type, data, timestamp }`.
`/chat/stream` may send the payload **directly** with no wrapper.
`connectChat()` normalises both into `SseMessage`:

```ts
const msg: SseMessage =
  'data' in obj && typeof obj.data === 'object'
    ? (obj as unknown as SseMessage)
    : {
        type: obj.type ?? 'chat.message.received',
        data: obj,
        timestamp: obj.timestamp ?? new Date().toISOString()
      };
```

**Do not break this normalisation** if editing `chat.svelte.ts`.

---

## Types — `src/lib/types/api.ts`

Single source of truth for all API shapes. Always import from here — never inline types in components.

Key types:

| Type | Used by |
|---|---|
| `StreamStatusData`, `StreamInfo` | `stream` store |
| `SseMessage` | all stores, `AlertFeed`, `ChatViewer` |
| `CommandData`, `CreateCommandRequest`, `UpdateCommandRequest` | `CommandsManager` |
| `ModRuleData`, `CreateModRuleRequest`, `UpdateModRuleRequest` | `ModerationRules` |
| `ModLogEntry` | `ModLog` |
| `LeaderboardEntry` | `LoyaltyLeaderboard` |
| `ViewerPointsData`, `TransactionData` | `ViewerLookup` |
| `ToolStatus`, `PluginStatus` | `SystemHealth` |

**Actual API paths** (differ from backend README in two places):
- Viewer lookup → `GET /loyalty/viewers/{twitch_id}` (not `/loyalty/points/…`)
- Viewer history → `GET /loyalty/viewers/{twitch_id}/history`
- Command CRUD → path param is numeric `id`, not `name`

---

## Component conventions

### Data fetching pattern

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from '$lib/api/client';

  let data = $state<Item[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  async function load() {
    loading = true; error = null;
    try {
      const res = await get<MyResponse>('/path');
      data = res.success && res.data ? res.data : [];
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally { loading = false; }
  }

  onMount(load);  // ← always onMount, never $effect, for initial fetches
</script>

{#if loading}<p class="muted">Loading…</p>
{:else if error}<p class="err">{error}</p>
{:else}<!-- render data -->{/if}
```

### Inline CRUD pattern (used in CommandsManager, ModerationRules)

- Fetch list on mount.
- `editingId: number | null` — which row is being edited.
- Saving patches the array: `items = items.map(i => i.id === id ? updated : i)`.
- Deleting filters the array: `items = items.filter(i => i.id !== id)`.
- No optimistic UI — wait for server confirmation before mutating local state.
- Confirm before delete: `if (!confirm('Delete?')) return;`

### SSE lifecycle pattern (used in +layout.svelte and /chat page)

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { connectAlerts } from '$lib/stores/alerts.svelte';

  onMount(() => {
    const stop = connectAlerts();
    return stop; // cleanup on unmount
  });
</script>
```

---

## Svelte 5 rules enforced in this project

| Rule | Reason |
|---|---|
| Use `{@attach fromAction(fn)}` from `svelte/attachments`, never `use:fn` | autofixer enforces attachments over actions |
| Use `onMount` for initial data fetches, not `$effect` | `$effect` for fetches triggers autofixer warnings |
| `{#each items as item (item.id)}` — always provide a key | autofixer enforces keyed each blocks |
| `onMount(() => { ...; return cleanup; })` for SSE / intervals | standard Svelte lifecycle |
| Don't put DOM side effects inside `$effect` — use actions/attachments + `MutationObserver` | avoids autofixer false positives and infinite loops |
| Export store state as a mutable object, not a reassigned `let` | Svelte 5 cross-module state constraint |

---

## Styling system

Global CSS variables set in `+layout.svelte` `:global(:root)` — Catppuccin Mocha palette:

```css
--surface:  #1e1e2e  /* card background */
--surface2: #181825  /* nested / input background */
--border:   #313244  /* dividers and borders */
--text:     #cdd6f4  /* primary text */
--subtext:  #a6adc8  /* labels, secondary text */
--accent:   #cba6f7  /* purple — buttons, active states */
--green:    #a6e3a1  /* online, success */
--red:      #f38ba8  /* error, ban */
--yellow:   #f9e2af  /* warning, timeout */
--blue:     #89b4fa  /* info, delete action */
```

Body background: `#11111b`. Sidebar background: `--surface2`.

Every component uses only its own scoped `<style>` block + these variables.
**Do not add a CSS framework.**

---

## Vite proxy — `vite.config.ts`

```ts
server: {
  proxy: {
    '/auth':       'http://localhost:8000',
    '/stream':     'http://localhost:8000',
    '/chat':       { target: 'http://localhost:8000', changeOrigin: true },
    '/dashboard':  { target: 'http://localhost:8000', changeOrigin: true },
    '/loyalty':    'http://localhost:8000',
    '/moderation': 'http://localhost:8000',
    '/system':     'http://localhost:8000',
    '/ping':       'http://localhost:8000',
  }
}
```

If you add a new backend domain, add it here. `changeOrigin: true` is needed on routes that serve SSE (chat, dashboard).

---

## Known issues & fixes applied

| Symptom | Root cause | Fix applied |
|---|---|---|
| `TypeError: can't access property "is_broadcaster", data is undefined` in ChatViewer | Some SSE frames from `/chat/stream` carry no payload (keepalive/connect frames) | `getBadges` accepts `null \| undefined`; template uses `(msg.data ?? {})` cast |
| Chat messages not appearing despite SSE connected | `/chat/stream` sends payload directly — no `{ type, data, timestamp }` wrapper | `connectChat()` normalises both formats into `SseMessage` |
| `EventSource` CORS errors ("Firefox can't establish a connection") | `EventSource` with an absolute `http://localhost:8000` URL bypasses Vite proxy | `client.ts` uses `BASE = ''` (relative URLs); Vite proxy handles forwarding |

---

## Backend SSE event reference

### `GET /dashboard/alerts` — always `{ type, data, timestamp }`

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
| `loyalty.points.awarded` | `display_name`, `amount`, `reason` |
| `loyalty.reward.redeemed` | `display_name`, `reward_name`, `cost` |
| `moderation.action.taken` | `display_name`, `action`, `reason` |

### `GET /chat/stream` — payload may or may not be wrapped

Fields: `display_name`, `user_id`, `message`, `is_mod`, `is_sub`, `is_broadcaster`, `badges`, `channel`, `timestamp`.

---

## Commands

```bash
pnpm dev      # dev server at localhost:5173, proxies :8000
pnpm check    # TypeScript + Svelte type check — run after every change
pnpm build    # production build
pnpm preview  # preview production build
```

---

## What is implemented

| Route | Components | Endpoints |
|---|---|---|
| `/` | `StreamStatus`, `AlertFeed` | Poll `/stream/status` + `/dashboard/stats` (30 s); SSE `/dashboard/alerts` |
| `/chat` | `ChatViewer` | SSE `/chat/stream` |
| `/loyalty` | `LoyaltyLeaderboard`, `ViewerLookup` | `GET /loyalty/leaderboard`; `GET /loyalty/viewers/{id}`; `GET /loyalty/viewers/{id}/history` |
| `/commands` | `CommandsManager` | `GET/POST /chat/commands`; `PUT/DELETE /chat/commands/{id}` |
| `/moderation` | `ModerationRules`, `ManualActions`, `ModLog` | `GET/POST /moderation/rules`; `PUT/DELETE /moderation/rules/{id}`; `POST /moderation/ban\|timeout\|unban`; `GET /moderation/log` |
| `/system` | `SystemHealth` | `GET /ping`; `GET /system/status` |

## What is not yet implemented

- `GET /stream/sessions` — session history table
- `GET /loyalty/rewards` + `POST /loyalty/rewards` + `POST /loyalty/redeem` — reward management
- `GET /dashboard/stats/history` — viewer/follower count chart
- `GET /system/events` + `/system/traces/*` — event bus inspector / trace viewer
- SSE `/system/events/stream`, `/system/logs/stream`, `/system/traces/stream`
- Auth flow UI — button that redirects to `GET /auth/twitch`
