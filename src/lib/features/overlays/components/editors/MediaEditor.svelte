<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import { ImageIcon, Loader, Expand, Volume2 } from '@lucide/svelte';
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
	let galleryRef = $state<any>(null);
	let uploading = $state(false);

	const url = $derived((element.config?.url as string) ?? '');
	const isVideo = $derived(checkIsVideo(url));

	function checkIsVideo(src: string): boolean {
		if (!src) return false;
		if (src.startsWith('data:video/')) return true;
		try {
			const pathname = new URL(src, 'http://localhost').pathname;
			return /\.(mp4|webm|mov|m4v|ogg|ogv)$/i.test(pathname);
		} catch {
			return /\.(mp4|webm|mov|m4v|ogg|ogv)(\?|#|$)/i.test(src);
		}
	}

	function updateConfig(configUpdates: Record<string, any>) {
		onUpdate({ config: { ...(element.config || {}), ...configUpdates } });
	}

	async function handleFile(file: File) {
		const allowedMimes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
		const isAllowedExt = /\.(png|jpe?g|gif|webp|mp4|webm|mov)$/i.test(file.name);
		if (!allowedMimes.includes(file.type) && !isAllowedExt) {
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
			galleryRef?.load?.();
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
		<input
			bind:this={fileInputRef}
			type="file"
			accept="image/*,video/mp4,video/webm,.webm,.mp4"
			class="hidden"
			onchange={onFileInput}
		/>
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

	{#if isVideo}
		{@const isMuted = (element.config?.muted as boolean | undefined) ?? false}
		<div class="space-y-3 rounded-md border border-border/50 bg-muted/20 p-2.5">
			<p class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Opciones de Video</p>
			
			<div class="flex items-center justify-between">
				<div class="space-y-0.5">
					<Label class="text-xs font-medium cursor-pointer">Bucle (Loop)</Label>
					<p class="text-[10px] text-muted-foreground">Repetir automáticamente al terminar</p>
				</div>
				<Switch
					checked={(element.config?.loop as boolean | undefined) ?? true}
					onCheckedChange={(v) => updateConfig({ loop: v })}
				/>
			</div>

			<div class="flex items-center justify-between pt-1 border-t border-border/30">
				<div class="space-y-0.5">
					<Label class="text-xs font-medium cursor-pointer">Silenciar audio</Label>
					<p class="text-[10px] text-muted-foreground">Desactívalo para que el video suene en OBS</p>
				</div>
				<Switch
					checked={isMuted}
					onCheckedChange={(v) => updateConfig({ muted: v })}
				/>
			</div>

			{#if !isMuted}
				<div class="space-y-1.5 pt-1 border-t border-border/30">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-1.5">
							<Volume2 class="w-3.5 h-3.5 text-muted-foreground" />
							<Label class="text-xs font-medium">Volumen</Label>
						</div>
						<span class="text-[11px] font-mono text-muted-foreground">
							{((element.config?.volume as number | undefined) ?? 100)}%
						</span>
					</div>
					<Slider
						value={[((element.config?.volume as number | undefined) ?? 100)]}
						min={0}
						max={100}
						step={1}
						onValueChange={(v) => updateConfig({ volume: v[0] })}
					/>
				</div>

				<div class="rounded bg-primary/10 border border-primary/20 p-2 text-[10px] text-muted-foreground space-y-1">
					<p class="font-semibold text-foreground">💡 Audio en OBS Studio:</p>
					<p>En OBS, haz doble clic en tu fuente <em>Navegador (Browser Source)</em> y marca la casilla <strong>"Controlar audio vía OBS"</strong> para que el sonido aparezca en el Mezclador de Audio de OBS.</p>
				</div>
			{/if}
		</div>
	{/if}

	<BackgroundGallery
		bind:this={galleryRef}
		currentImage={element.config?.url as string | undefined}
		onSelect={(url) => updateConfig({ url })}
	/>
</div>
