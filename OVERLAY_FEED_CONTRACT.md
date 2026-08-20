# Overlay Feed Contract — v1

> One SSE endpoint streams everything an overlay needs. Overlays are built
> **anywhere** — hand-coded, AI-generated, or in a future in-app builder — and
> just **consume** this feed. The backend owns the contract; every consumer is a
> **tolerant reader**. This document is also the "manual": paste it (or the live
> `/overlays/manifest`) into an AI and ask it to build an overlay.

---

## 1. Transport — SSE (not WebSocket)

An overlay is display-only: the backend pushes, the overlay paints, it never
replies. That is exactly SSE. It reconnects natively (critical for an OBS source
running for hours), rides plain HTTP through proxies/CDN, and reuses the existing
`sse()` tool on both ends. WebSocket is only warranted if an overlay must *talk
back* (interactive vote/minigame) — that would be a **separate channel**, never
the base transport.

```
GET /overlays/feed?token=<channel_overlay_token>
Accept: text/event-stream
```

- **Token** — one per **channel**, **read-only**, revocable. Regenerate it to
  revoke every overlay for that channel at once. It is NOT the dashboard JWT.
  Goes in the query string because `EventSource` cannot set headers. Leaked =
  someone reads your feed (follower counts, chat) in read-only → low risk.
- **Keepalive** — the server emits an SSE comment `:ping` every ~15 s so proxies
  don't drop the connection.

---

## 2. Envelope — every message has the same shape

The consumer does `switch (msg.type)`. Nothing else.

```json
{ "type": "chat.message", "v": 1, "ts": 1723545600000, "data": { } }
```

| Field  | Meaning |
|--------|---------|
| `type` | Dotted namespace (`chat.message`, `event.follow`, `stat.update`). |
| `v`    | Version **of that type**. Bumps only on a breaking change (see §5). |
| `ts`   | Epoch milliseconds. |
| `data` | Payload; shape depends on `type`. |

This is the streaming twin of the REST `{ success, data, error }` envelope.

---

## 3. Message types

### 3.1 `feed.snapshot` — first event on connect
So the overlay renders immediately instead of waiting for the next live event.

```json
{ "type": "feed.snapshot", "v": 1, "ts": 0, "data": {
    "stats": { "followers": 1234, "subs": 56, "viewers": 210 },
    "recent_chat": [ /* recent chat.message data objects */ ],
    "active": [ /* events still on screen, if any */ ]
}}
```

### 3.2 `stat.update` — generic, additive counters
A **new stat needs no contract change** — it just arrives with a new `key`.

```json
{ "type": "stat.update", "v": 1, "ts": 0, "data": {
    "key": "followers", "value": 1235, "previous": 1234, "display": "1.2K"
}}
```

**Known keys today** (the set grows over time — read the `key` you want, ignore the rest):

| key           | meaning |
|---------------|---------|
| `followers`   | total followers |
| `subs`        | total subscribers |
| `viewers`     | current viewers |
| `last_follow` | latest follower name (as `display`) |
| `last_sub`    | latest subscriber name |

### 3.3 `event.*` — namespaced triggers (alerts)
Namespaced so an overlay can react to *only* follows, *only* raids, etc.

**Events are pure facts.** One event = one thing that happened, emitted the
instant it happens. The contract carries **no duration, no queue, no template** —
timing and animation are the overlay's job. (This is already how the internal
system works: `duration_ms` is a per-element *style* prop and the client expires
the alert — the feed never dictates it.)

Every `event.*` shares a spine — `id` (dedupe on reconnect, since durable
transports may re-deliver), `user`, `user_id` — plus event-specific fields:

```json
{ "type": "event.follow",       "v":1, "ts":0, "data": { "id":"e1", "user":"juan", "user_id":"123" } }
{ "type": "event.subscription", "v":1, "ts":0, "data": { "id":"e2", "user":"ana", "user_id":"1", "tier":"1000", "months":3, "message":"vamos!" } }
{ "type": "event.raid",         "v":1, "ts":0, "data": { "id":"e3", "user":"pepe", "user_id":"2", "viewers":45 } }
{ "type": "event.cheer",        "v":1, "ts":0, "data": { "id":"e4", "user":"lu", "user_id":"3", "bits":500, "message":"gg" } }
{ "type": "event.donation",     "v":1, "ts":0, "data": { "id":"e5", "user":"sol", "user_id":"4", "amount":5.0, "currency":"USD", "message":"crack" } }
```

> **Naming is normalized.** The feed uses clean contract names
> (`event.subscription`), never Twitch's raw EventSub strings
> (`channel.subscribe`, `channel.subscription.message`). Mapping Twitch → contract
> happens **once, in the backend** — the only place that should know Twitch's
> vocabulary. Overlays never see it.

### 3.4 `overlay.test` — test injection (the build loop)
To build an overlay (by hand or with an AI) you must *see* an alert without
waiting for a real follow. The dashboard's "send test event" button injects a
fake `event.*` into the channel's live feed, flagged `test: true`, so the author
watches their overlay react in real time. It travels on the same feed and is
triggered from the **dashboard session**, never from the read-only overlay token.

```json
{ "type": "event.follow", "v":1, "ts":0, "data": { "id":"t1", "user":"TEST_USER", "user_id":"0", "test": true } }
```

### 3.5 `chat.*` — messages, fully-resolved emotes and badges
The backend already splits chat into `fragments` and tags emote fragments with
`emote_id` / `emote_animated`. For **this public feed** it also resolves the
ready-to-use `url` server-side (emotes **and** badges), so an external overlay
needs zero Twitch-CDN knowledge and makes **no extra authed calls** (contrast the
internal Svelte widget, which builds emote URLs itself and fetches
`/api/chat/badges` to resolve badge images). Plain `text` is kept for overlays
that only want a string.

```json
{ "type": "chat.message", "v":1, "ts":0, "data": {
    "id":"abc", "user":"juan", "color":"#ffff00",
    "badges": [
      { "set":"moderator", "version":"1",
        "url":"https://static-cdn.jtvnw.net/badges/v1/.../3" }
    ],
    "text":"hola Kappa gg",
    "fragments": [
      { "type":"text",  "text":"hola " },
      { "type":"emote", "name":"Kappa", "emote_id":"25", "emote_animated":false,
        "url":"https://static-cdn.jtvnw.net/emoticons/v2/25/static/dark/2.0" },
      { "type":"text",  "text":" gg" }
    ]
}}
```

- `fragments[].url` — ready to drop into `<img src>`. `emote_id` /
  `emote_animated` are kept for overlays that want to pick a different size/format.
- `badges[].url` — resolved image; `set`/`version` kept for reference.
- Additive rule: the `url` fields are always present going forward; larger emote
  sizes could arrive later as an extra field without breaking anyone.
- **Not emitted yet:** `chat.delete` / `chat.clear` (moderation deletes). The
  backend has no chat-deletion event source today; when it does, they arrive as
  new types — a purely additive change that breaks no existing overlay.

---

## 4. Discovery — `GET /overlays/manifest`
Returns, generated from the **same source of truth as the feed**, the current
list of `type`s, their fields, and the known `stat.update` keys. Because it comes
from the code it can never drift. **This is the file you hand to an AI.**

---

## 5. Extension rules — design once, extend forever
Carved in stone from day 1 (these are the MicroCoreOS event laws applied here):

1. **Additive only.** Never remove or rename a `type` or a field. Only add.
2. **Extend = new namespace** (`event.donation`) **or new key** (`stat.x`). Never
   mutate an existing one.
3. **Tolerant reader.** Consumers ignore unknown `type`s and default missing
   fields. An overlay written today keeps working when the feed grows.
4. **`v` bumps only on a genuine break**, and the old `v` is dual-published during
   a deprecation window. Being additive, you almost never touch it.

---

## 6. Backend shape (MicroCoreOS)
The feed is **one plugin that consumes the internal `event_bus`**. Events like
`user.followed`, `sub.created`, `chat.message` already travel on the bus; the
`overlay_feed_plugin` subscribes, holds the open SSE connections, and fans each
one out to connected overlays. The bus does the heavy lifting — the plugin only
re-broadcasts to the browser. One plugin, one contract.

---

## 7. Minimal overlay (copy-paste, OBS browser source)

```html
<!doctype html>
<meta charset="utf-8" />
<style>
  body { margin:0; background:transparent; font-family:system-ui; color:#fff; }
  #chat div { margin:4px 8px; text-shadow:0 1px 2px #000; }
  #chat img { height:1em; vertical-align:middle; }
</style>
<div id="followers"></div>
<div id="chat"></div>
<script>
  const TOKEN = "PASTE_CHANNEL_TOKEN";
  const es = new EventSource(`/overlays/feed?token=${TOKEN}`);
  const chat = document.getElementById("chat");

  es.onmessage = (e) => {
    const { type, data } = JSON.parse(e.data);

    if (type === "feed.snapshot")
      document.getElementById("followers").textContent = `Followers: ${data.stats.followers}`;

    if (type === "stat.update" && data.key === "followers")
      document.getElementById("followers").textContent = `Followers: ${data.display ?? data.value}`;

    if (type === "chat.message") {
      const row = document.createElement("div");
      row.innerHTML = `<b style="color:${data.color||'#fff'}">${data.user}</b>: ` +
        data.fragments.map(f =>
          f.type === "emote" ? `<img src="${f.url}" alt="${f.name}">` : escapeHtml(f.text)
        ).join("");
      chat.append(row);
      while (chat.children.length > 15) chat.firstChild.remove();
    }

    if (type === "chat.clear") chat.innerHTML = "";
  };

  function escapeHtml(s){ const d=document.createElement("div"); d.textContent=s; return d.innerHTML; }
</script>
```

---

## 8. Tokens & security — one token per channel

- **One `channel_overlay_token` per channel** (the chosen model). Every overlay of
  that channel uses the same token; the feed sends everything and each overlay
  filters the `type`s it cares about client-side. No per-overlay identity needed.
- **Minting** — generated in the dashboard (settings), an opaque random string
  (≥ 32 bytes, URL-safe), stored server-side mapped to the channel. Never the
  dashboard JWT.
- **Scope** — read-only. The token opens **only** `/overlays/feed` and reads
  `/overlays/manifest`. It can do nothing else.
- **Revocation** — "Regenerate token" invalidates the old one immediately. Because
  it is one-per-channel, regenerating rotates **all** overlays of the channel at
  once (the accepted trade-off for simplicity). Overlays fail to reconnect until
  the author pastes the new token.
- **Exposure** — the token rides in the query string (`EventSource` can't set
  headers), so it lands in server logs, browser history and the OBS config.
  Mitigations: it is read-only and rotatable, **and the feed must never carry
  sensitive data** (no email, no mod tools, no private counts) — only what is
  effectively public on stream. Design payloads assuming the token can leak.

### Backend: token validation
The feed plugin validates the token via a lookup tool (`state`/`db`), resolves the
channel, and subscribes that SSE connection to the channel's events on the
`event_bus`. Token validation is **plugin-layer composition** — a validator
passed to the endpoint, exactly like `auth_validator=self.auth.validate_token`
(Rule 11). The `http` tool never imports the token store; the plugin hands it the
check. One plugin owns the whole feed contract.
