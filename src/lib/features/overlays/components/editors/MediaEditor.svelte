<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { ImageIcon, Loader, Expand } from '@lucide/svelte';
	import { upload } from '$lib/core/api/client';
	import { show } from '$lib/core/stores/toast.svelte';
	import BackgroundGallery from '../builder/BackgroundGallery.svelte';
	import type { OverlayElement } from '../../types';

	let {
		element,
		onUpdate,
		onMoveLayer,
		canvasWidth = 1920,
		canvasHeight = 1080
	}: {
		element: OverlayElement;
		onUpdate: (updates: Partial<OverlayElement>) => void;
		onMoveLayer: (dir: 'up' | 'down' | 'front' | 'back') => void;
		canvasWidth?: number;
		canvasHeight?: number;
	} = $props();

	let fileInputRef = $state<HTMLInputElement | null>(null);
	let uploading = $state(false);

	function updateConfig(configUpdates: Record<string, any>) {
		onUpdate({ config: { ...(element.config || {}), ...configUpdates } });
	}

	async function handleFile(file: File) {
		const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
		if (!allowed.includes(file.type)) {
			show('Formato no soportado. Usá PNG, JPG, GIF, WebP, MP4 o WebM.', 'error');
			return;
		}
		uploading = true;
		try {
			const res = await upload<{ success: boolean; data: { url: string; type: 'image' | 'video' }; error?: string }>(
				'/overlays/upload-background', file
			);
			if (!res.success) throw new Error(res.error);
			updateConfig({ url: res.data.url });
		} catch (e: any) {
			show(`Error al subir: ${e.message}`, 'error');
		} finally {
			uploading = false;
		}
	}

	function onFileInput(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) handleFile(file);
		(e.target as HTMLInputElement).value = '';
	}

	function fitToCanvas() {
		onUpdate({ x: 0, y: 0, width: canvasWidth, height: canvasHeight });
		onMoveLayer('back');
	}
</script>

<div class="space-y-4">
	<div>
		<p class="text-xs font-medium text-muted-foreground mb-2">Archivo Media</p>
		<div class="grid grid-cols-2 gap-2">
			<Button variant="outline" size="sm" class="h-8 text-[10px]" onclick={() => fileInputRef?.click()} disabled={uploading}>
				{#if uploading}
					<Loader class="w-3 h-3 mr-1.5 animate-spin" /> Subiendo…
				{:else}
					<ImageIcon class="w-3 h-3 mr-1.5" /> Subir archivo
				{/if}
			</Button>
			<Button variant="secondary" size="sm" class="h-8 text-[10px]" onclick={fitToCanvas}>
				<Expand class="w-3 h-3 mr-1.5" /> Fondo total
			</Button>
		</div>
		<input bind:this={fileInputRef} type="file" class="hidden" onchange={onFileInput} />
	</div>

	<div>
		<p class="text-xs font-medium text-muted-foreground mb-2 text-center opacity-50">— O URL directa —</p>
		<Input
			class="h-8 text-xs font-mono"
			placeholder="https://... o /api/uploads/..."
			value={element.config?.url as string | undefined}
			oninput={(e) => updateConfig({ url: (e.target as HTMLInputElement).value })}
		/>
	</div>

	<BackgroundGallery
		currentImage={element.config?.url as string | undefined}
		onSelect={(url) => updateConfig({ url })}
	/>
</div>
