# Arquitectura del frontend

StreamCoreOS usa SvelteKit. `src/routes` define las páginas; `src/lib/features`
agrupa cada función; `src/lib/core/api/client.ts` concentra las llamadas HTTP
y SSE al backend.

```mermaid
flowchart LR
    Dashboard[Panel StreamCoreOS] --> Overlays[/overlays: URL, token, manifest y pruebas]
    Overlays --> Feed[SSE /api/overlays/feed]
    Pagina[Página HTML local] -->|EventSource con token| Feed
    Pagina --> OBS[OBS Browser Source]
```

La página `/overlays` solo administra el acceso al feed. El HTML, CSS y
JavaScript del overlay viven en la computadora del usuario. El backend emite
mensajes JSON con `type`, `v`, `ts` y `data`; el cliente decide qué mostrar.
`/api/overlays/manifest` describe el contrato actual. El manual para construir
páginas locales está en `guia_construccion_overlays.md`.

Las fuentes integradas `/overlays/tts` y `/overlays/alerts` siguen siendo páginas
de OBS independientes del feed para páginas locales.
