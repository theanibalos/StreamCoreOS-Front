<script module lang="ts">
	import { ImageIcon } from '@lucide/svelte';
	import type { WidgetMeta } from '../types';
	import MediaEditor from './editors/MediaEditor.svelte';

	export const meta: WidgetMeta = {
		label: 'Media',
		icon: ImageIcon,
		defaults: {
			width: 300, height: 300,
			config: { url: '', fit: 'cover', muted: false, loop: true, volume: 100 },
			style: { background: 'transparent', accent: '#9147ff', border_radius: 0, glow: false, duration_ms: 0, animation: 'fade_in', font_size: 0, text_color: '#ffffff', opacity: 100 }
		},
		style: { accent: true, borderRadius: true, glow: true },
		hasTemplate: false,
		needs: [],
		fields: [
			{ key: 'config.fit', type: 'select', label: 'Ajuste', options: [
				{ value: 'cover', label: 'Cubrir (recorta)' },
				{ value: 'contain', label: 'Contener (completa)' }
			] }
		],
		Editor: MediaEditor
	};
</script>

<script lang="ts">
	import type { OverlayElement } from '../types';

	let { element }: { element: OverlayElement } = $props();

	const url     = $derived((element.config?.url as string) ?? '');
	const isVideo = $derived(checkIsVideo(url));
	const radius  = $derived(element.style.border_radius ?? 0);
	const opacity = $derived((element.style.opacity ?? 100) / 100);
	const glow    = $derived(element.style.glow ?? false);
	const accent  = $derived(element.style.accent ?? '#9147ff');
	const fit     = $derived((element.config?.fit as string) ?? 'cover');
	const loop    = $derived((element.config?.loop as boolean | undefined) ?? true);
	const muted   = $derived((element.config?.muted as boolean | undefined) ?? false);
	const volume  = $derived(((element.config?.volume as number | undefined) ?? 100) / 100);

	let videoEl   = $state<HTMLVideoElement | null>(null);

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

	$effect(() => {
		if (videoEl && url && isVideo) {
			videoEl.defaultMuted = muted;
			videoEl.muted = muted;
			videoEl.volume = Math.max(0, Math.min(1, volume));
			videoEl.loop = loop;
			const playPromise = videoEl.play();
			if (playPromise !== undefined) {
				playPromise.catch((err) => {
					console.warn('[MediaWidget] Autoplay with audio was blocked by browser policy:', err);
					// If standard browser blocks autoplay with sound (requires user interaction), fallback to muted so video visually plays
					if (videoEl && !videoEl.muted) {
						videoEl.muted = true;
						videoEl.play().catch((e) => console.error('[MediaWidget] Play fallback failed:', e));
					}
				});
			}
		}
	});
</script>

<div
	class="media-root"
	style="
		border-radius: {radius}px;
		opacity: {opacity};
		box-shadow: {glow ? `0 0 30px ${accent}66` : 'none'};
		background-color: {url ? 'transparent' : 'rgba(255,255,255,0.05)'};
	"
>
	{#if !url}
		<div class="placeholder">
			<span>Media</span>
		</div>
	{:else if isVideo}
		<!-- svelte-ignore a11y_media_has_caption -->
		<video
			bind:this={videoEl}
			src={url}
			autoplay
			{loop}
			{muted}
			playsinline
			class="media-content"
			style="object-fit: {fit}; width: 100%; height: 100%;"
			onerror={() => console.error('[MediaWidget] Video load error:', url)}
		></video>
	{:else}
		<img
			src={url}
			alt="Overlay Media"
			class="media-content"
			style="object-fit: {fit}; width: 100%; height: 100%;"
			onerror={() => console.error('[MediaWidget] Image load error:', url)}
		/>
	{/if}
</div>

<style>
	.media-root {
		width: 100%;
		height: 100%;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
	}

	.media-content {
		width: 100%;
		height: 100%;
		display: block;
	}

	.placeholder {
		width: 100%;
		height: 100%;
		background: rgba(255,255,255,0.05);
		border: 2px dashed rgba(255,255,255,0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255,255,255,0.3);
		font-family: sans-serif;
		font-weight: 800;
		text-transform: uppercase;
		font-size: 14px;
	}
</style>
