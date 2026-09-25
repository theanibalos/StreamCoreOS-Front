# Local overlay feed (v1)

StreamCoreOS provides a read-only SSE feed for overlays that you build locally.
Open the **Overlays** page to copy the feed URL and run test events. The feed
URL contains a channel token; rotating it revokes every existing connection.
The backend endpoint is `GET /api/overlays/feed?token=<token>`. The public
`GET /api/overlays/manifest` endpoint lists supported types and fields.

Each SSE message is JSON with this envelope:

```json
{"type":"event.follow","v":1,"ts":1723545600000,"data":{"id":"e1","user":"viewer","user_id":"123"}}
```

Use `type` to choose how your overlay reacts. Ignore types you do not use and
allow additional fields in future messages. On connection, `feed.snapshot`
contains `stats`, `recent_chat`, and `active` (currently empty). `stat.update`
contains `key`, `value`, `previous`, and `display`; known keys include
`followers`, `subs`, `viewers`, and `bits`. Other stat keys can come from the
`overlay.vars.set` event bus topic. `chat.message` includes text, user details,
badges, and fragments with resolved emote image URLs. `chat.delete` identifies
a removed message. Render `fragments` in order: `text` fragments as text nodes
and `emote` fragments as images using their `url`. Render `badges` as images
using `url`; when a badge has no URL, show its `set` as a label. YouTube badge
events may have no image URL.

Trigger types include `event.follow`, `event.subscription`,
`event.subscription.gift`, `event.raid`, `event.cheer`, `event.redemption`,
`event.superchat`, `event.supersticker`, and `event.member`. Other Twitch
EventSub notifications arrive as `event.twitch` with their raw name in
`data.event_type`, the full EventSub payload in `data.details`, and common user fields. Stream session, regular viewer,
moderation, and chat command notifications retain their event bus names.
The manifest is the authoritative list of currently exposed types.

```html
<!doctype html>
<meta charset="utf-8">
<style>body { margin: 0; background: transparent; color: white; font: 32px sans-serif; }</style>
<div id="alert"></div>
<script>
  const feedUrl = 'http://localhost:8000/api/overlays/feed?token=PASTE_TOKEN';
  const source = new EventSource(feedUrl);
  source.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.type === 'event.follow') {
      document.getElementById('alert').textContent = `${message.data.user} followed!`;
    }
  };
</script>
```

Save this as a local HTML file and load it as an OBS Browser Source. Replace
`localhost:8000` with the backend address reachable from OBS. If you use a
separate local web server, set `HTTP_CORS_ORIGINS` to that server's origin when
CORS restrictions are enabled. The feed sends `:ping` comments every 15 seconds
and `EventSource` reconnects automatically. A bad token produces `feed.error`
and closes the stream. Dashboard test events use the same message types with
`data.test = true`.

The token grants read-only access to the feed. Keep it in your local files and
rotate it in the dashboard if it becomes exposed. Do not use the dashboard
session token in an overlay.
