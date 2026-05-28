<script lang="ts">
	import type { OverlayElement } from '../types';
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	let { element }: { element: OverlayElement } = $props();

	const rawUrl  = $derived(element.config?.url ?? '');
	// Direct to port 8000 to avoid proxy issues in OBS
	const url     = $derived(rawUrl.startsWith('/api') 
		? `${page.url.protocol}//${page.url.hostname}:8000${rawUrl}` 
		: rawUrl);

	const isVideo = $derived(url.match(/\.(mp4|webm|mov)$/i));
	const radius  = $derived(element.style.border_radius ?? 0);
	const opacity = $derived((element.style.opacity ?? 100) / 100);
	const glow    = $derived(element.style.glow ?? false);
	const accent  = $derived(element.style.accent ?? '#9147ff');
	const fit     = $derived(element.config?.fit ?? 'cover');

	onMount(() => {
		if (url) console.log('[MediaWidget] Loading Direct Backend URL:', url);
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
