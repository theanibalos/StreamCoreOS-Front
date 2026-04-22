<script lang="ts">
	import { TtsVoiceAssignments, TtsSettings } from '$lib/features/tts';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Button } from '$lib/components/ui/button';
	import { Copy } from '@lucide/svelte';
	import { page } from '$app/state';

	function copyUrl() {
		const fullUrl = `${page.url.origin}/overlays/tts`;
		navigator.clipboard.writeText(fullUrl);
		alert('URL copiada al portapapeles');
	}
</script>

<div class="flex flex-col gap-6 w-full">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Text to Speech</h1>
			<p class="text-muted-foreground mt-1">Configura voces personalizadas y ajustes de locución para el chat.</p>
		</div>
		<div class="flex items-center gap-2 text-sm bg-muted p-2 px-3 rounded-xl border shadow-sm">
			<span class="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">OBS Overlay</span>
			<code class="text-primary font-mono text-xs bg-background px-2 py-1 rounded border">/overlays/tts</code>
			<Button variant="ghost" size="icon" class="h-8 w-8" onclick={copyUrl}>
				<Copy class="w-4 h-4" />
			</Button>
		</div>
	</div>

	<Tabs value="voices" class="w-full">
		<TabsList class="grid w-full max-w-md grid-cols-2 mb-6">
			<TabsTrigger value="voices">Voces por usuario</TabsTrigger>
			<TabsTrigger value="settings">Ajustes Generales</TabsTrigger>
		</TabsList>
		
		<TabsContent value="voices">
			<TtsVoiceAssignments />
		</TabsContent>
		
		<TabsContent value="settings">
			<TtsSettings />
		</TabsContent>
	</Tabs>
</div>
