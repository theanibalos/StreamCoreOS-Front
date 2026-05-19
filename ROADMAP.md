# Roadmap — StreamCoreOS Frontend

Ordered by impact / ease. Each item is a single PR scope (1 feature = 1 change).

---

## P1 — UX Polish (quick wins, visible impact)

### 1. Replace `alert()` with a toast store
**Problem**: Two places use `alert()` (overlay copy-URL, TTS copy-URL) — blocks the thread, looks terrible.
**Solution**: A `toast.svelte.ts` store in `src/lib/core/stores/` + a `<Toaster />` component in `+layout.svelte`. No library needed — 30 lines of Svelte 5 runes.
**Scope**: new `toast.svelte.ts` + `Toaster.svelte` + 2 call sites changed.

### 2. Unified language (pick one: es or en)
**Problem**: Nav labels are English ("Dashboard", "Commands", "Timers"), UI text is Spanish ("Bienvenido", "Esperando mensajes", "Desconectar Twitch"). Looks inconsistent.
**Solution**: Pick Spanish (personal tool, Spanish-speaking dev) and sweep all hardcoded strings. Does NOT require i18n — just consistency.
**Scope**: string sweep across all `.svelte` files.

### 3. Replace emoji nav icons with Lucide icons
**Problem**: Nav uses emojis (`⬛`, `💬`, `⭐`…) while the rest of the UI uses Lucide consistently. Renders differently across OSes.
**Solution**: Map each feature to the appropriate Lucide icon in `features.config.ts`. Already have `@lucide/svelte` installed.
**Scope**: `features.config.ts` only — change `icon: string` to `icon: Component`.

---

## P2 — Code Quality (technical debt)

### 4. Complete Tailwind v4 migration (remove legacy CSS vars)
**Problem**: `app.css` has a block of legacy variables (`--surface`, `--surface2`, `--text`, `--subtext`, `--accent`, `--red`, `--green`) kept as "fallbacks for unmigrated components". These are unused duplicates of the Tailwind theme tokens.
**Solution**: Grep for usage of each legacy var, replace with Tailwind classes, delete the fallback block.
**Scope**: `app.css` + any component still using raw `var(--surface)` etc.

### 5. Normalize `SubscribersLeaderboardResponse` type
**Problem**: This type breaks the `ApiResponse<T>` pattern because `total` leaks to the top level. The component works around it with a cast.
**Solution**: Fix the backend response to wrap correctly, OR document the exception explicitly and add a comment in `api.ts` explaining why.
**Scope**: `src/lib/types/api.ts` + `SubscribersLeaderboard.svelte`.

### 6. Unify overlay routing
**Problem**: OBS overlays exist in two places: `src/routes/(obs)/tts/overlay/` and `src/routes/overlays/`. The `(obs)` route group is unused except for one page.
**Solution**: Move everything under `src/routes/overlays/` and delete the `(obs)` group.
**Scope**: file moves + `+layout.svelte` detection logic update.

---

## P3 — Architecture (foundations)

### 7. Add Playwright E2E tests
**Problem**: Zero test coverage. Any refactor is blind.
**Solution**: Start with 3 critical paths: auth flow, chat SSE connects/displays, a CRUD round-trip (create + delete a command).
**Scope**: `tests/` directory, `playwright.config.ts`, `package.json` script.
**Note**: Playwright can mock SSE responses — no real Twitch connection needed.

### 8. Toast / notification system (from P1)
Already covered in item 1, but architecturally: it enables replacing `confirm('Delete?')` dialogs across all CRUD components with proper inline confirmations (next step after toasts are working).

---

## P4 — Missing Features

These are backend endpoints that exist but have no UI yet. Each is a self-contained feature addition following the existing pattern.

| Feature | Endpoint(s) | Complexity |
|---|---|---|
| Stream session history chart | `GET /stream/sessions` | Low (table or basic chart) |
| Viewer/follower count chart | `GET /dashboard/stats/history` | Medium (D3 line chart, already have D3) |
| Event bus inspector | `GET /system/events` + SSE `/system/traces/stream` | High (tree view, already partially built) |

---

## Out of scope (intentionally)

- i18n file system — personal tool, one language is enough
- Global state manager (Pinia/Redux) — Svelte 5 runes + per-feature stores is sufficient
- CSS framework swap — Tailwind v4 + bits-ui is the stack, don't introduce more layers
