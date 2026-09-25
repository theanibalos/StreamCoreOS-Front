<script lang="ts">
	import { OverlayFeedToken } from '$lib/features/overlays';
</script>

<div class="flex flex-col gap-6 w-full">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Overlays locales</h1>
		<p class="text-muted-foreground mt-1">Diseñá tus overlays en archivos locales y conectalos al feed de eventos de StreamCoreOS.</p>
	</div>
	<OverlayFeedToken />
	<div class="rounded-lg border p-5 space-y-3 text-sm">
		<h2 class="font-semibold">Cómo conectar un overlay</h2>
		<ol class="list-decimal pl-5 space-y-2 text-muted-foreground">
			<li>Copiá la URL del feed o pulsá «Copiar manual para IA» si querés generar el HTML con ayuda.</li>
			<li>En tu HTML o JavaScript local, abrí la URL con <code class="font-mono text-foreground">new EventSource(feedUrl)</code> y leé cada mensaje con <code class="font-mono text-foreground">JSON.parse(event.data)</code>.</li>
			<li>Usá <code class="font-mono text-foreground">type</code> para elegir qué evento mostrar. El primer mensaje, <code class="font-mono text-foreground">feed.snapshot</code>, trae el estado actual.</li>
			<li>Cargá tu HTML local en una fuente de navegador de OBS y usá los botones de prueba para comprobarlo.</li>
		</ol>
		<p class="text-xs text-muted-foreground">El token permite leer los eventos del canal. Guardalo dentro de tus archivos locales y regeneralo aquí si necesitás revocarlo.</p>
	</div>
</div>
