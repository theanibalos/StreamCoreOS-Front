<script module lang="ts">
	import { Zap } from '@lucide/svelte';
	import type { WidgetMeta } from '../types';
	import { ALERT_EVENTS, ANIMATIONS, ALERT_EVENT_VARS } from '../constants';

	export const meta: WidgetMeta = {
		label: 'Alerta',
		icon: Zap,
		defaults: {
			width: 420, height: 160,
			trigger: { event: 'channel.subscribe', filter_user: null },
			template: '¡{user_name} se suscribió! 🎉',
			style: { background: '#000000cc', accent: '#9333ea', border_radius: 20, glow: true, duration_ms: 5000, animation: 'scale_in', font_size: 28, text_color: '#ffffff', opacity: 100 }
		},
		style: { background: true, accent: true, textColor: true, borderRadius: true, fontSize: true, glow: true },
		hasTemplate: true,
		needs: ['alerts'],
		templateVars: (el) => ALERT_EVENT_VARS[el.trigger?.event ?? ''] ?? [],
		fields: [
			{ key: 'trigger.event', type: 'select', label: 'Evento', options: ALERT_EVENTS },
			{ key: 'trigger.filter_user', type: 'text', label: 'Filtro usuario (opcional)', placeholder: 'Broadcaster...' },
			{ key: 'style.duration_ms', type: 'number', label: 'Duración (ms)', fallback: 5000 },
			{ key: 'style.animation', type: 'select', label: 'Animación', options: ANIMATIONS }
		]
	};
</script>

<script lang="ts">
	import type { OverlayElement, ActiveAlert } from '../types';
	import { scale, fade, fly } from 'svelte/transition';

	let {
		element,
		activeAlerts = []
	}: {
		element: OverlayElement;
		activeAlerts: ActiveAlert[];
	} = $props();

	const myAlerts = $derived(activeAlerts.filter((a) => a.elementId === element.id));

	const accent   = $derived(element.style.accent ?? '#9333ea');
	const bg       = $derived(element.style.background ?? '#000000cc');
	const radius   = $derived(element.style.border_radius ?? 20);
	const color    = $derived(element.style.text_color ?? '#ffffff');
	const glow     = $derived(element.style.glow ?? true);
	const fs       = $derived(element.style.font_size ?? 28);
	const opacity  = $derived((element.style.opacity ?? 100) / 100);

	function renderTemplate(template: string, vars: Record<string, string>): string {
		return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
	}

	function inTransition(anim: string) {
		switch (anim) {
			case 'fade_in':    return { fn: fade,  params: { duration: 400 } };
			case 'slide_up':   return { fn: fly,   params: { y: 60, duration: 400 } };
			case 'slide_down': return { fn: fly,   params: { y: -60, duration: 400 } };
			default:           return { fn: scale, params: { start: 0.8, duration: 400 } };
		}
	}

	const eventLabel = $derived(
		(element.trigger?.event ?? '')
			.replace('channel.subscription.gift', 'Sub Gifteada')
			.replace('channel.subscribe', 'Suscripción')
			.replace('channel.follow', 'Nuevo Seguidor')
			.replace('channel.raid', 'Raid')
			.replace('channel.cheer', 'Bits')
			.replace('chat.message', 'Mensaje')
			.toUpperCase()
	);
</script>

{#each myAlerts as alert (alert.expiresAt)}
	{@const t = inTransition(element.style.animation)}
	<div
	class="alert-root"
	style="
		background: {bg};
		border-radius: {radius}px;
		border: 2px solid {accent}55;
		box-shadow: {glow ? `0 0 50px ${accent}55, inset 0 0 30px ${accent}11` : 'none'};
		color: {color};
		font-size: {fs}px;
		opacity: {opacity};
		gap: 10px;
		padding: 16px 24px;
	"
	in:t.fn={t.params}
	out:fade={{ duration: 300 }}
>
	<div class="alert-badge" style="background: {accent}22; border: 1px solid {accent}55; color: {accent};">
		{eventLabel}
	</div>
	<p class="alert-name">
		{renderTemplate(element.template, alert.vars)}
	</p>
</div>
{/each}

<style>
	.alert-root {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 16px 24px;
		box-sizing: border-box;
		font-family: system-ui, 'Inter', sans-serif;
		font-weight: 800;
		text-align: center;
		overflow: hidden;
		backdrop-filter: blur(8px);
	}

	.alert-badge {
		font-size: 0.38em;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		padding: 4px 12px;
		border-radius: 999px;
		font-weight: 700;
	}

	.alert-name {
		margin: 0;
		line-height: 1.15;
		word-break: break-word;
	}
</style>
