# Manual para crear overlays locales de StreamCoreOS

Tu overlay es una página HTML/CSS/JavaScript que guardas en tu computadora.
StreamCoreOS solo entrega datos en tiempo real; la página decide cómo dibujar,
animar y combinar esos datos. Puedes abrir el archivo en una fuente de navegador
de OBS o servirlo desde tu propio servidor local.

## 1. Obtén la conexión

Abre **Overlays** en StreamCoreOS. Copia la URL del feed. Se parece a:

```text
http://localhost:8000/api/overlays/feed?token=TU_TOKEN
```

Usa la URL exacta que muestra tu instalación. El token da acceso de lectura
al feed; guárdalo en el archivo local, no lo compartas públicamente. En la
misma pantalla puedes regenerarlo y enviar eventos de prueba.

## 2. Recibe eventos

El feed usa Server-Sent Events (SSE). `EventSource` reconecta por sí solo.
Cada `message` tiene el formato:

```json
{"type":"event.follow","v":1,"ts":1723545600000,"data":{"id":"e1","user":"Ana","user_id":"123"}}
```

El primer mensaje es `feed.snapshot`, con `stats`, `recent_chat` y `active`.
Después llegarán `stat.update`, `chat.message`, `chat.delete`, eventos de
Twitch/YouTube y eventos del sistema. Consulta la URL del **manifest** para el
listado actualizado de tipos y campos. Ignora tipos desconocidos para que tu
página siga funcionando cuando se añadan eventos.

## 3. Página mínima completa

Guarda esto como `overlay.html`. Sustituye la URL por la que copiaste en el
panel. En OBS, añade una **Fuente de navegador**, marca **Archivo local** y
selecciona `overlay.html`.

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <style>
    html, body { margin: 0; background: transparent; overflow: hidden; }
    body { color: white; font: bold 48px system-ui; }
    #alert { padding: 24px; text-shadow: 0 3px 8px black; }
  </style>
</head>
<body>
  <div id="alert" aria-live="polite"></div>
  <script>
    const feedUrl = 'http://localhost:8000/api/overlays/feed?token=TU_TOKEN';
    const alertBox = document.getElementById('alert');
    const source = new EventSource(feedUrl);
    let hideTimer;

    source.onmessage = ({ data }) => {
      const message = JSON.parse(data);
      if (message.type === 'feed.snapshot') {
        console.log('Estado inicial', message.data.stats);
      }
      if (message.type === 'event.follow') {
        alertBox.textContent = `${message.data.user || 'Alguien'} empezó a seguirte`;
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => { alertBox.textContent = ''; }, 5000);
      }
      if (message.type === 'feed.error') {
        console.error('Feed rechazado:', message.data.error);
      }
    };
  </script>
</body>
</html>
```

Usa los botones de prueba del panel para ver el resultado sin esperar un evento
real. Los eventos de prueba llevan `data.test = true` y siguen el mismo formato.
Para chat, pon nombres y texto con `textContent`; no insertes contenido de
espectadores con `innerHTML`. Si quieres mostrar emotes, recorre
`data.fragments` en orden: crea nodos de texto para fragmentos `text` e
imágenes para fragmentos `emote` usando `fragment.url`. Dibuja las insignias
de `data.badges` con `<img src="badge.url">`; si `url` está vacío, muestra
`badge.set` como etiqueta. Haz lo mismo al cargar `feed.snapshot.recent_chat`.

Si sirves el HTML desde otro origen y restringiste CORS, añade el origen de
ese servidor a `HTTP_CORS_ORIGINS` en la configuración del backend. OBS debe
poder acceder a la dirección de StreamCoreOS desde la misma máquina o red.

## 4. Texto para pasar a una IA

El botón **Copiar manual para IA** del panel prepara este encargo con el
manifest actualizado y sin tu token real. Pégalo en la IA, describe el aspecto
y comportamiento que quieres, y luego sustituye `PEGA_AQUI_TU_TOKEN` en el
HTML resultante por tu token local.

> Crea una página HTML/CSS/JavaScript independiente, con fondo transparente,
> para usar como Browser Source de OBS. Conéctala con `EventSource` al feed SSE
> de StreamCoreOS. Cada mensaje tiene `{type, v, ts, data}`. Usa `feed.snapshot`
> para el estado inicial, procesa los tipos relevantes del manifest adjunto e
> ignora los desconocidos. Haz todas las animaciones y el diseño en esta página.
> Usa `textContent` para texto de usuarios. Entrega un HTML completo, con una
> constante `feedUrl` donde pueda pegar mi URL con token. No dependas del panel
> de StreamCoreOS para renderizar. Muestra las insignias de `data.badges` y
> los emotes de `data.fragments` como imágenes usando sus campos `url`,
> respetando el orden de los fragmentos y usando `data.text` como respaldo.

El feed es de solo lectura. Para controles interactivos que escriban en
StreamCoreOS necesitarías usar sus API correspondientes y la autenticación
adecuada; el token del overlay no concede permisos de escritura.
