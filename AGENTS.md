# StreamCoreOS Frontend — AI Context

Dashboard frontend for the StreamCoreOS Twitch backend.

## Reading Path

**To add a feature**: Read this file + `src/lib/features/{feature}/` — nothing else.
**For patterns and deeper rules**: Read `FRONTEND_CONTEXT.md`.

---

## Stack

| Concern | Choice |
|---|---|
| Framework | SvelteKit 2 + Svelte 5 (runes) |
| Styling | Tailwind CSS v4 + bits-ui (shadcn-style) |
| Icons | Lucide Svelte (`@lucide/svelte`) |
| Language | TypeScript strict |
| Package manager | pnpm |
| API layer | `src/lib/core/api/client.ts` — thin fetch wrapper |
| Charts | D3 (system graph only) |

---

## Architecture Rule

**1 feature = 1 folder** under `src/lib/features/{feature}/`:

```
src/lib/features/{feature}/
  components/   ← Svelte components for this feature only
  stores/       ← .svelte.ts state files (only if needed)
  index.ts      ← barrel export — the only import surface
```

Routes are thin. They import from `$lib/features/{feature}` and compose, nothing else.

---

## Project Structure

```
src/
├── lib/
│   ├── core/
│   │   ├── api/client.ts        # get / post / put / del / sse helpers
│   │   ├── features.config.ts   # nav sidebar feature list
│   │   └── stores/              # auth, stream, scopes — global cross-feature state
│   ├── components/ui/           # shadcn-style primitives (Button, Card, Dialog…)
│   ├── features/                # one folder per domain feature
│   │   ├── ai/
│   │   ├── auth/
│   │   ├── chat/
│   │   ├── commands/
│   │   ├── dashboard/
│   │   ├── moderation/
│   │   ├── subscribers/
│   │   ├── system/
│   │   ├── timers/
│   │   ├── tts/
│   │   └── viewers/
│   ├── types/api.ts             # TypeScript types for every backend schema
│   └── utils.ts
└── routes/
    ├── +layout.svelte           # sidebar nav, auth guard, SSE lifecycle
    ├── +page.svelte             # / → Dashboard
    ├── {feature}/+page.svelte   # one route per feature
    └── overlays/                # OBS browser source pages (transparent bg)
```

---

## Adding a Feature

1. Create `src/lib/features/{name}/components/MyFeature.svelte`
2. Export it from `src/lib/features/{name}/index.ts`
3. Create `src/routes/{name}/+page.svelte` that imports from `$lib/features/{name}`
4. Add an entry to `src/lib/core/features.config.ts`
5. Add types to `src/lib/types/api.ts`

No other files need to change.

---

## API Client

```ts
import { get, post, put, del, sse } from '$lib/core/api/client';

const res = await get<MyResponse>('/path');           // throws on non-2xx
const res = await post<MyResponse>('/path', body);
const res = await put<MyResponse>('/path/123', body);
const res = await del<MyResponse>('/path/123');

// SSE — returns cleanup fn
const stop = sse('/chat/stream', (msg) => { ... }, (connected) => { ... });
```

All backend responses: `{ success: boolean, data: T | null, error: string | null }`.
Always check `res.success && res.data` before using the payload.

---

## Component Pattern

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from '$lib/core/api/client';
  import type { MyResponse } from '$lib/types/api';

  let items = $state<Item[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  async function load() {
    loading = true; error = null;
    try {
      const res = await get<MyResponse>('/path');
      items = res.success && res.data ? res.data : [];
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally { loading = false; }
  }

  onMount(load);
</script>
```

---

## Svelte 5 Rules

| Rule | Why |
|---|---|
| `$state`, `$derived`, `$effect`, `$props` — always runes | No legacy stores |
| `onMount` for initial data fetches — never `$effect` | `$effect` triggers autofixer warnings |
| `{#each items as item (item.id)}` — always keyed | autofixer enforces it |
| `{@attach fromAction(fn)}` — not `use:fn` | attachments over actions |
| Export store state as a mutable object, not reassigned `let` | cross-module reactivity |

---

## MCP Tools (Svelte MCP Server)

If available, use these before writing any Svelte code:

1. **`list-sections`** — call first to find relevant Svelte 5 / SvelteKit docs
2. **`get-documentation`** — fetch the relevant sections from step 1
3. **`svelte-autofixer`** — run on every Svelte file before delivering; keep calling until no issues
4. **`playground-link`** — only after user confirms, never if code was written to disk

---

## Adding an Overlay Widget Type

The overlay system renders widgets inside two pages:
- **Builder** `src/routes/overlays/builder/[id]/+page.svelte` — drag-and-drop editor with preview data
- **Live** `src/routes/overlays/live/[id]/+page.svelte` — OBS browser source, transparent background

**Every widget receives these props (always declare all of them, even if unused):**

```ts
let {
  element,           // OverlayElement — position, style, template, data_source, config, trigger
  statValues = {},   // Record<string, string> — keyed by element.id, current data value
  activeAlerts = [], // ActiveAlert[] — { elementId, vars, expiresAt }
  chatMessages = {}, // Record<string, ChatMessage[]> — keyed by element.id
}: {
  element: OverlayElement;
  statValues: Record<string, string>;
  activeAlerts: ActiveAlert[];
  chatMessages: Record<string, ChatMessage[]>;
} = $props();
```

Types are in `src/lib/features/overlays/types.ts`. Note: `OverlayElement.type` is
just `string` — the source of truth for valid types is `WIDGET_REGISTRY` in
`index.ts`, so you do **not** edit `types.ts` to add a widget.

**The system is meta-driven.** Each widget self-describes its toolbar entry, defaults
and property-editor controls via an exported `meta` (`WidgetMeta`). The `WIDGET_REGISTRY`
in `index.ts` maps each type to `{ component, meta }`. From that registry, everything else
is derived automatically:
- **Canvas** (builder) and **Live** routes render `WIDGET_REGISTRY[type].component`.
- **Toolbar** builds its buttons from each `meta.icon` / `meta.label`.
- **PropertyEditor** renders style controls (`meta.style`), declarative fields
  (`meta.fields`), the template editor (`meta.hasTemplate`), and any bespoke editor
  (`meta.Editor`) — no per-type code.
- **DEFAULT_ELEMENT_CONFIGS** is derived from each `meta.defaults`.

So adding a widget is essentially: **create the component (with its `meta`) + add one
line to `WIDGET_REGISTRY`.**

### 1. Create the component
`src/lib/features/overlays/components/MyWidget.svelte`

Two script blocks: a `<script module lang="ts">` that exports `meta`, plus the normal
`<script lang="ts">`. Look at `StatWidget.svelte` (simple, declarative fields) or
`MediaWidget.svelte` (bespoke `Editor`) as references. The component fills 100% of its
wrapper div — do NOT set position/size yourself (the parent handles it).

```ts
// <script module lang="ts">
export const meta: WidgetMeta = {
  label: 'My Widget',
  shortLabel: 'Mine',          // optional, short label for the toolbar button
  icon: SomeLucideIcon,
  defaults: { width: 300, height: 100, /* style, config, trigger, data_source… */ },
  style: { background: true, accent: true, fontSize: true },  // which shared controls show
  hasTemplate: true,           // show the {value}/{user_name} template editor
  templateVars: [{ name: 'value', label: 'Value' }],  // clickable chips above the template
  fields: [                    // declarative config/trigger inputs
    { key: 'data_source', type: 'select', label: 'Source', options: STAT_SOURCES },
    { key: 'config.target', type: 'number', label: 'Target' },
    { key: 'config.show_count', type: 'toggle', label: 'Show count', default: true }
  ],
  Editor: MyWidgetEditor       // optional: bespoke editor component for custom UI
};
```

Key `meta` properties that drive the editor:
- **`style`** — which shared visual controls appear (`background`, `accent`, `textColor`,
  `borderRadius`, `fontSize`, `glow`). Only declare what the component actually reads;
  opacity + position/size/layers are always shown.
- **`hasTemplate`** — shows the template textarea. Only `true` if the component renders
  `element.template` (e.g. `chat_highlight`/`progress_bar` do NOT use it).
- **`templateVars`** — array (or `(el) => array`) of `{ name, label }` rendered as
  clickable chips that insert `{name}` at the cursor. Use a function for context-aware
  vars (e.g. alert vars depend on the selected event — see `ALERT_EVENT_VARS`).
- **`fields`** — declarative inputs. `key` is a dot-path into the element
  (`data_source`, `config.target`, `trigger.event`, `style.duration_ms`…). Types:
  `text`, `number`, `select` (needs `options`), `textarea`, `toggle` (boolean, optional
  `default`). For UI too custom for fields (uploaders, tabbed code editors), ship an
  `Editor` component under `components/editors/` — it receives
  `{ element, onUpdate, onMoveLayer, canvasWidth, canvasHeight }`.

Shared option lists (`STAT_SOURCES`, `ALERT_EVENTS`, `ANIMATIONS`, `ALERT_EVENT_VARS`)
live in `src/lib/features/overlays/constants.ts`.

### 2. Register it in the feature index
`src/lib/features/overlays/index.ts` — import the component + its `meta`, then add one
line to `WIDGET_REGISTRY`: `my_type: { component: MyWidget, meta: myMeta }`.
That's it — toolbar, property editor and defaults all pick it up.

> **Note:** the AI builder assistant (`AIAssistant.svelte` + `/overlays/generate`) is
> currently **disabled** in the builder — the component file is kept but not mounted.
> If you re-enable it, also update the AI system prompt
> (`StreamCoreOS/domains/overlays/plugins/generate_overlay_plugin.py`) to teach it the
> new `type` and its config/template rules.

---

## Core Layout Components

The main `+layout.svelte` is an orchestrator. Complex UI is extracted to:
- `$lib/features/auth/components/LoginForm.svelte`: Handled when not authenticated.
- `$lib/core/components/Sidebar.svelte`: Main navigation and theme toggle.
- `$lib/core/components/ScopesWarning.svelte`: Twitch permission alerts.

### Data flow summary
| Widget | Reads from | When it shows |
|---|---|---|
| `stat` | `statValues[element.id]` | Always (data from SSE `/overlays/stats`) |
| `progress_bar` | `statValues[element.id]` | Always |
| `alert` | `activeAlerts` filtered by `elementId` | Only while `expiresAt > Date.now()` |
| `chat_highlight` | `chatMessages[element.id]` | Always (rolling list of messages) |
| `banner` | `element.template` (static) | Always |

---

## Commands

```bash
pnpm dev      # dev server at :5173, proxies backend at :8000
pnpm check    # TypeScript + Svelte type check
pnpm build    # production build
```
