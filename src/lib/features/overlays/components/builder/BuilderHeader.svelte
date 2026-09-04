<script lang="ts">
	import { ArrowLeft, Layers, Copy, ExternalLink, Play, Save, Monitor, BookOpen, Bot } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	const PRESETS = [
		{ label: 'Full HD — 1920×1080', w: 1920, h: 1080 },
		{ label: 'HD — 1280×720', w: 1280, h: 720 },
		{ label: '2K — 2560×1440', w: 2560, h: 1440 },
		{ label: 'Chat panel — 400×600', w: 400, h: 600 },
		{ label: 'Chat vertical — 350×800', w: 350, h: 800 },
		{ label: 'Custom…', w: 0, h: 0 },
	];

	let {
		overlayName = $bindable(),
		canvasWidth = $bindable(),
		canvasHeight = $bindable(),
		saving,
		liveUrl,
		onSave,
		onCopyLiveUrl,
		onTestAlert,
		onOpenLibrary,
		onOpenPrompt
	}: {
		overlayName: string;
		canvasWidth: number;
		canvasHeight: number;
		saving: boolean;
		liveUrl: string;
		onSave: () => void;
		onCopyLiveUrl: () => void;
		onTestAlert: () => void;
		onOpenLibrary?: () => void;
		onOpenPrompt?: () => void;
	} = $props();

	let manualCustom = $state(false);

	const matchedPreset = $derived(
		PRESETS.find((p) => p.w !== 0 && p.w === canvasWidth && p.h === canvasHeight)
	);
	const isCustom = $derived(manualCustom || !matchedPreset);
	const selectIndex = $derived(
		isCustom ? PRESETS.length - 1 : PRESETS.indexOf(matchedPreset!)
	);

	function onPresetChange(e: Event) {
		const idx = parseInt((e.target as HTMLSelectElement).value);
		const p = PRESETS[idx];
		if (p.w === 0) {
			manualCustom = true;
		} else {
			manualCustom = false;
			canvasWidth = p.w;
			canvasHeight = p.h;
			onSave();
		}
	}
</script>

<div class="flex items-center gap-3 px-4 py-2 border-b bg-card shrink-0 flex-wrap">
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

	<!-- Canvas size selector -->
	<div class="flex items-center gap-1.5 border rounded-md px-2 py-1 bg-background text-xs text-muted-foreground">
		<Monitor class="w-3.5 h-3.5 shrink-0" />
		<select
			class="bg-transparent border-none outline-none text-xs cursor-pointer pr-1"
			value={selectIndex}
			onchange={onPresetChange}
		>
			{#each PRESETS as preset, i (preset.label)}
				<option value={i}>{preset.label}</option>
			{/each}
		</select>
		{#if isCustom}
			<input
				type="number" min="100" max="7680"
				class="w-16 bg-transparent border rounded px-1 text-xs outline-none focus:ring-1 focus:ring-primary/20 text-foreground"
				bind:value={canvasWidth}
				onchange={onSave}
				placeholder="W"
			/>
			<span class="opacity-50">×</span>
			<input
				type="number" min="100" max="4320"
				class="w-16 bg-transparent border rounded px-1 text-xs outline-none focus:ring-1 focus:ring-primary/20 text-foreground"
				bind:value={canvasHeight}
				onchange={onSave}
				placeholder="H"
			/>
		{:else}
			<span class="font-mono opacity-70">{canvasWidth}×{canvasHeight}</span>
		{/if}
	</div>

	<div class="flex items-center gap-2 ml-auto">
		{#if onOpenPrompt}
			<Button variant="outline" size="sm" class="h-8 text-xs text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30" onclick={onOpenPrompt} title="Copiar prompt maestro para IA">
				<Bot class="w-3.5 h-3.5 mr-1.5" /> Prompt IA
			</Button>
		{/if}
		{#if onOpenLibrary}
			<Button variant="outline" size="sm" class="h-8 text-xs text-primary bg-primary/5 hover:bg-primary/10 border-primary/20" onclick={onOpenLibrary}>
				<BookOpen class="w-3.5 h-3.5 mr-1.5" /> Librería Eventos
			</Button>
		{/if}
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
