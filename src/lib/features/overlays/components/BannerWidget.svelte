<script module lang="ts">
	import { Type } from '@lucide/svelte';
	import type { WidgetMeta } from '../types';

	export const meta: WidgetMeta = {
		label: 'Banner',
		shortLabel: 'Texto',
		icon: Type,
		defaults: {
			width: 500, height: 70,
			template: 'Mi Stream',
			style: { background: '#000000cc', accent: '#9333ea', border_radius: 10, glow: false, duration_ms: 0, animation: 'fade_in', font_size: 24, text_color: '#ffffff', opacity: 100 }
		},
		style: { background: true, accent: true, textColor: true, borderRadius: true, fontSize: true, glow: true },
		hasTemplate: true,
		needs: []
	};
</script>

<script lang="ts">
	import type { OverlayElement } from '../types';

	let { element }: { element: OverlayElement } = $props();

	const accent   = $derived(element.style.accent ?? '#9333ea');
	const bg       = $derived(element.style.background ?? '#000000cc');
	const radius   = $derived(element.style.border_radius ?? 10);
	const color    = $derived(element.style.text_color ?? '#ffffff');
	const fs       = $derived(element.style.font_size ?? 24);
	const glow     = $derived(element.style.glow ?? false);
	const opacity  = $derived((element.style.opacity ?? 100) / 100);
</script>

<div
	class="banner-root"
	style="
		background: {bg};
		border-radius: {radius}px;
		border: 1.5px solid {accent}33;
		box-shadow: {glow ? `0 0 20px ${accent}44` : 'none'};
		color: {color};
		font-size: {fs}px;
		opacity: {opacity};
		padding: 8px 20px;
	"
>
	{element.template}
</div>

<style>
	.banner-root {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 8px 20px;
		box-sizing: border-box;
		font-family: system-ui, 'Inter', sans-serif;
		font-weight: 700;
		text-align: center;
		overflow: hidden;
	}
</style>
