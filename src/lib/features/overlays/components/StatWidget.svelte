<script lang="ts">
	import type { OverlayElement } from '../types';

	let {
		element,
		statValues = {}
	}: {
		element: OverlayElement;
		statValues: Record<string, string>;
	} = $props();

	const value   = $derived(statValues[element.id] ?? '…');
	const accent  = $derived(element.style.accent ?? '#9333ea');
	const bg      = $derived(element.style.background ?? '#000000aa');
	const radius  = $derived(element.style.border_radius ?? 12);
	const color   = $derived(element.style.text_color ?? '#ffffff');
	const fs      = $derived(element.style.font_size ?? 22);
	const glow    = $derived(element.style.glow ?? false);
	const opacity = $derived((element.style.opacity ?? 100) / 100);

	function renderTemplate(template: string, vars: Record<string, string>): string {
		return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
	}
</script>

<div
	class="stat-root"
	style="
		background: {bg};
		border-radius: {radius}px;
		border: 1.5px solid {accent}33;
		box-shadow: {glow ? `0 0 20px ${accent}44` : 'none'};
		color: {color};
		font-size: {fs}px;
		opacity: {opacity};
	"
>
	{renderTemplate(element.template, { value })}
</div>

<style>
	.stat-root {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 8px 16px;
		box-sizing: border-box;
		font-family: system-ui, 'Inter', sans-serif;
		font-weight: 700;
		white-space: nowrap;
		overflow: hidden;
	}
</style>
