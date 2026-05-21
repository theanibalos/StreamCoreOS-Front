<script lang="ts">
	import { ArrowLeft, Layers, Copy, ExternalLink, Play, Save } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	let { 
		overlayName = $bindable(), 
		saving, 
		liveUrl,
		onSave, 
		onCopyLiveUrl, 
		onTestAlert 
	}: { 
		overlayName: string;
		saving: boolean;
		liveUrl: string;
		onSave: () => void;
		onCopyLiveUrl: () => void;
		onTestAlert: () => void;
	} = $props();
</script>

<div class="flex items-center gap-3 px-4 py-2 border-b bg-card shrink-0">
	<Button variant="ghost" size="sm" href="/overlays" class="shrink-0 -ml-1 h-8">
		<ArrowLeft class="w-4 h-4 mr-1.5" /> Overlays
	</Button>
	<div class="w-px h-5 bg-border mx-1"></div>
	<Layers class="w-4 h-4 text-primary shrink-0" />
	<input
		class="font-semibold bg-transparent border-none outline-none text-sm flex-1 min-w-0 focus:ring-1 focus:ring-primary/20 rounded px-1"
		bind:value={overlayName}
		onblur={onSave}
	/>
	<div class="flex items-center gap-2 ml-auto">
		<Button variant="outline" size="sm" class="h-8 text-xs" onclick={onCopyLiveUrl}>
			<Copy class="w-3.5 h-3.5 mr-1.5" /> URL OBS
		</Button>
		<Button variant="outline" size="sm" class="h-8 text-xs" href={`${liveUrl}?preview=1`} target="_blank">
			<ExternalLink class="w-3.5 h-3.5 mr-1.5" /> Preview
		</Button>
		<Button variant="outline" size="sm" class="h-8 text-xs" onclick={onTestAlert} title="Prueba real en OBS">
			<Play class="w-3.5 h-3.5 mr-1.5" /> Test
		</Button>
		<Button size="sm" class="h-8 text-xs" onclick={onSave} disabled={saving}>
			<Save class="w-3.5 h-3.5 mr-1.5" /> {saving ? 'Guardando…' : 'Guardar'}
		</Button>
	</div>
</div>
