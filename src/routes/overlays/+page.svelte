<script lang="ts">
	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Copy, ExternalLink, Volume2, MessageSquare, Heart, Info } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let baseUrl = $state('http://localhost:5173');

	onMount(() => {
		baseUrl = window.location.origin;
	});

	const overlays = [
		{
			name: 'Chat Overlay',
			description: 'Muestra los mensajes del chat con animaciones premium y fondo transparente.',
			url: () => baseUrl + '/overlays/chat',
			icon: MessageSquare,
			status: 'active',
			isExternal: false
		},
		{
			name: 'Alerts Overlay',
			description: 'Notificaciones visuales para followers, subs y raids con animaciones y estilos modernos.',
			url: () => baseUrl + '/overlays/alerts',
			icon: Heart,
			status: 'active',
			isExternal: false
		},
		{
			name: 'TTS Overlay',
			description: 'Reproduce los mensajes mediante voz (Gestionado por el Frontend conectando al stream del backend).',
			url: () => baseUrl + '/overlays/tts',
			icon: Volume2,
			status: 'active',
			isExternal: false
		}
	];

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		alert('URL de Overlay copiada al portapapeles');
	}

	function testVoice() {
		const utterance = new SpeechSynthesisUtterance('StreamCoreOS: Prueba de audio funcionando correctamente.');
		utterance.lang = 'es-ES';
		window.speechSynthesis.speak(utterance);
	}
</script>

<div class="flex flex-col gap-6 w-full">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Gestión de Overlays</h1>
			<p class="text-muted-foreground mt-1">Fuentes de navegador optimizadas para OBS Studio (Fondo transparente).</p>
		</div>
		<div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-center gap-3 text-blue-600 max-w-sm">
			<Info class="w-5 h-5 flex-shrink-0" />
			<p class="text-[11px] leading-tight font-medium">Tip: En OBS, asegúrate de activar "Controlar audio vía OBS" en las propiedades de la fuente de navegador.</p>
		</div>
	</div>

	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each overlays as overlay}
			{@const fullUrl = overlay.url()}
			<Card class="flex flex-col border-2 {overlay.status === 'active' ? 'border-primary/20' : 'border-dashed'}">
				<CardHeader>
					<div class="flex items-center justify-between mb-2">
						<div class="p-2 bg-primary/10 rounded-lg">
							<overlay.icon class="w-6 h-6 text-primary" />
						</div>
						<Badge variant="default" class="bg-green-500/15 text-green-600 dark:text-green-400 border-none shadow-none text-[10px] uppercase font-bold tracking-widest">Activo</Badge>
					</div>
					<CardTitle class="text-xl">{overlay.name}</CardTitle>
					<CardDescription class="text-xs leading-relaxed min-h-[40px]">{overlay.description}</CardDescription>
				</CardHeader>
				<CardContent class="flex-1">
					<div class="bg-muted/50 p-2.5 rounded-md border font-mono text-[10px] break-all select-all">
						{fullUrl}
					</div>
				</CardContent>
				<CardFooter class="grid grid-cols-2 gap-2">
					<Button variant="outline" size="sm" onclick={() => copyToClipboard(fullUrl)}>
						<Copy class="w-3.5 h-3.5 mr-2" /> Copiar URL
					</Button>
					{#if overlay.name === 'TTS Overlay'}
						<Button variant="outline" size="sm" onclick={testVoice}>
							<Volume2 class="w-3.5 h-3.5 mr-2" /> Probar Voz
						</Button>
					{:else}
						<Button variant="outline" size="sm" href={fullUrl} target="_blank">
							<ExternalLink class="w-3.5 h-3.5 mr-2" /> Probar
						</Button>
					{/if}
				</CardFooter>
			</Card>
		{/each}
	</div>
</div>
