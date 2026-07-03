<script module lang="ts">
	import { ImageIcon } from '@lucide/svelte';
	import type { WidgetMeta } from '../types';
	import MediaEditor from './editors/MediaEditor.svelte';

	export const meta: WidgetMeta = {
		label: 'Media',
		icon: ImageIcon,
		defaults: {
			width: 300, height: 300,
			config: { url: '', fit: 'cover' },
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
	const isVideo = $derived(url.match(/\.(mp4|webm|mov)$/i));
	const radius  = $derived(element.style.border_radius ?? 0);
	const opacity = $derived((element.style.opacity ?? 100) / 100);
	const glow    = $derived(element.style.glow ?? false);
	const accent  = $derived(element.style.accent ?? '#9147ff');
	const fit     = $derived(element.config?.fit ?? 'cover');
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
		<video
			src={url}
			autoplay
			loop
			muted
			playsinline
			class="media-content"
			style="object-fit: {fit}; width: 100%; height: 100%;"
			onerror={() => console.error('[MediaWidget] Video load error:', url)}
		></video>
	{:else}
		<div 
			class="media-content" 
			style="
				background-image: url('{url}'); 
				background-size: {fit}; 
				background-position: center; 
				background-repeat: no-repeat;
				width: 100%;
				height: 100%;
			"
			aria-label="Overlay Media"
		></div>
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
		object-fit: contain;
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
