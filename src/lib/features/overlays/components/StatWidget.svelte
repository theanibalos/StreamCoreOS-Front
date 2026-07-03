<script module lang="ts">
	import { BarChart2 } from '@lucide/svelte';
	import type { WidgetMeta } from '../types';
	import { STAT_SOURCES } from '../constants';

	export const meta: WidgetMeta = {
		label: 'Estadística',
		shortLabel: 'Dato',
		icon: BarChart2,
		defaults: {
			width: 220, height: 60,
			data_source: 'subscribers.active_total',
			template: '⭐ {value} subs',
			style: { background: '#000000aa', accent: '#9333ea', border_radius: 12, glow: false, duration_ms: 0, animation: 'fade_in', font_size: 22, text_color: '#ffffff', opacity: 100 }
		},
		style: { background: true, accent: true, textColor: true, borderRadius: true, fontSize: true, glow: true },
		hasTemplate: true,
		needs: ['stats'],
		templateVars: [{ name: 'value', label: 'Valor' }],
		fields: [
			{ key: 'data_source', type: 'select', label: 'Fuente de datos', options: STAT_SOURCES }
		]
	};
</script>

<script lang="ts">
	import type { OverlayElement } from '../types';

	let {
		element,
		statValues = {}
	}: {
		element: OverlayElement;
		// Full pool indexed by SOURCE KEY (e.g. 'subscribers.active_total'), shared by all widgets.
		statValues: Record<string, string>;
	} = $props();

	const value   = $derived(element.data_source ? (statValues[element.data_source] ?? '…') : '…');
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
		padding: 8px 16px;
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
