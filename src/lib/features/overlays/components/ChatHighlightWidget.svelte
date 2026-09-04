<script module lang="ts">
	import { MessageSquare } from '@lucide/svelte';
	import type { WidgetMeta } from '../types';

	export const meta: WidgetMeta = {
		label: 'Chat Highlight',
		shortLabel: 'Chat',
		icon: MessageSquare,
		defaults: {
			width: 380, height: 500,
			trigger: { event: 'chat.message', filter_user: null },
			config: { platform: 'all' },
			template: '',
			style: { background: 'rgba(24, 24, 27, 0.82)', accent: '#9333ea', border_radius: 14, glow: false, duration_ms: 0, animation: 'fade_in', font_size: 15, text_color: '#ffffff', opacity: 100 }
		},
		style: { background: true, accent: true, borderRadius: true, fontSize: true, glow: true },
		hasTemplate: false,
		needs: ['chat'],
		fields: [
			{
				key: 'config.platform',
				type: 'select',
				label: 'Plataforma de Chat',
				options: [
					{ value: 'all', label: 'Todas las Plataformas (Twitch + YouTube)' },
					{ value: 'twitch', label: 'Solo Twitch' },
					{ value: 'youtube', label: 'Solo YouTube' }
				]
			},
			{ key: 'trigger.filter_user', type: 'text', label: 'Filtrar por Usuario (opcional)', placeholder: 'Nombre exacto...' }
		]
	};
</script>

<script lang="ts">
	import type { OverlayElement, ChatMessage, ChatFragment } from '../types';
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	let {
		element,
		chatMessages = {}
	}: {
		element: OverlayElement;
		chatMessages: Record<string, ChatMessage[]>;
	} = $props();

	const msgs    = $derived(chatMessages[element.id] ?? []);
	const radius  = $derived(element.style.border_radius ?? 14);
	const glow    = $derived(element.style.glow ?? false);
	const accent  = $derived(element.style.accent ?? '#9333ea');
	const bg      = $derived(element.style.background ?? 'rgba(24, 24, 27, 0.82)');
	const fs      = $derived(element.style.font_size ?? 15);
	const opacity = $derived((element.style.opacity ?? 100) / 100);

	type BadgeMap = Record<string, Record<string, string>>;
	let badgeMap = $state<BadgeMap>({});

	onMount(async () => {
		try {
			const res = await fetch('/api/chat/badges');
			if (res.ok) badgeMap = await res.json();
		} catch { /* sin sesión — badges omitidas */ }
	});

	function getBadges(msg: ChatMessage): { url: string; title: string; text?: string }[] {
		if (!msg.badges) return [];
		const out: { url: string; title: string; text?: string }[] = [];
		if (Array.isArray(msg.badges)) {
			for (const b of msg.badges) {
				const setId = b.set || '';
				const version = String(b.version || '1');
				const url = b.url || (badgeMap[setId]?.[version] ?? badgeMap[setId]?.['1'] ?? '');
				if (url) {
					out.push({ url, title: setId });
				} else if (setId === 'member' || setId === 'subscriber') {
					out.push({ url: '', title: 'Member', text: '★' });
				} else if (setId === 'moderator') {
					out.push({ url: '', title: 'Mod', text: '⚔' });
				} else if (setId === 'owner') {
					out.push({ url: '', title: 'Owner', text: '👑' });
				}
			}
			return out;
		}
		for (const [setId, version] of Object.entries(msg.badges)) {
			const url = badgeMap[setId]?.[version] ?? badgeMap[setId]?.['1'] ?? '';
			if (url) out.push({ url, title: setId });
			else if (setId === 'member' || setId === 'subscriber') out.push({ url: '', title: 'Member', text: '★' });
			else if (setId === 'moderator') out.push({ url: '', title: 'Mod', text: '⚔' });
		}
		return out;
	}

	function getColor(msg: ChatMessage): string {
		if (msg.color) return msg.color;
		const name = msg.display_name;
		let hash = 0;
		for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
		const hue = ((hash % 360) + 360) % 360;
		return `hsl(${hue}, 80%, 65%)`;
	}

	function getFragments(msg: ChatMessage): ChatFragment[] {
		if (msg.fragments?.length) return msg.fragments;
		return [{ type: 'text', text: msg.message }];
	}
</script>

<div
	class="chat-root"
	style="
		border-radius: {radius}px;
		box-shadow: {glow ? `0 0 20px ${accent}44` : 'none'};
		opacity: {opacity};
		gap: 0.2em;
		padding: 0.5em 0.25em;
	"
>
	{#each msgs as msg (msg.timestamp)}
		{@const badges = getBadges(msg)}
		{@const frags  = getFragments(msg)}
		{@const color  = getColor(msg)}
		<div class="chat-msg" in:fly={{ y: 16, duration: 250 }}
			style="font-size: {fs}px; background: {bg}; padding: 0.25em 0.6em; border-radius: 4px;"
		>
			{#if msg.user?.avatar_url}
				<img src={msg.user.avatar_url} alt={msg.display_name} class="avatar-img" />
			{/if}
			{#if badges.length > 0}
				<span class="badge-row">
					{#each badges as badge (badge.title)}
						{#if badge.url}
							<img src={badge.url} alt={badge.title} title={badge.title} width="18" height="18" class="badge-img" />
						{:else if badge.text}
							<span class="badge-text" title={badge.title}>{badge.text}</span>
						{/if}
					{/each}
				</span>
			{/if}
			<span class="chat-name" style="color: {color};">{msg.display_name}</span><span class="chat-colon">:</span>
			<span class="chat-text">
				{#each frags as frag, i (i)}
					{#if frag.type === 'emote' && frag.emote_id}
						{@const fmt = frag.emote_animated ? 'animated' : 'static'}
						<img
							src="https://static-cdn.jtvnw.net/emoticons/v2/{frag.emote_id}/{fmt}/dark/1.0"
							srcset="https://static-cdn.jtvnw.net/emoticons/v2/{frag.emote_id}/{fmt}/dark/2.0 2x"
							alt={frag.text}
							title={frag.text}
							class="emote-img"
						/>
					{:else}
						{frag.text}
					{/if}
				{/each}
			</span>
		</div>
	{/each}
	{#if msgs.length === 0}
		<p class="chat-empty">Esperando mensajes…</p>
	{/if}
</div>

<style>
	.chat-root {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		box-sizing: border-box;
		overflow: hidden;
		background: transparent;
	}

	.chat-msg {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0;
		background: rgba(24, 24, 27, 0.82);
		font-family: Inter, Roobert, 'Helvetica Neue', sans-serif;
		line-height: 1.5;
		word-break: break-word;
	}

	.badge-row {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		vertical-align: middle;
		position: relative;
		top: -1px;
		flex-shrink: 0;
	}

	.badge-img {
		display: inline;
	}

	.chat-name {
		font-weight: 700;
		flex-shrink: 0;
	}

	.chat-colon {
		color: #adadb8;
		flex-shrink: 0;
	}

	.chat-text {
		color: #efeff1;
		font-weight: 400;
		flex: 1;
		min-width: 0;
	}

	.emote-img {
		display: inline;
		width: auto;
		vertical-align: middle;
		margin: 0 1px;
	}

	.avatar-img {
		width: 1.15em;
		height: 1.15em;
		border-radius: 9999px;
		object-fit: cover;
		margin-right: 4px;
		display: inline-block;
		vertical-align: middle;
	}

	.badge-text {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75em;
		padding: 1px 4px;
		border-radius: 3px;
		background: rgba(255, 255, 255, 0.15);
		color: #ffffff;
		font-weight: bold;
		line-height: 1;
	}

	.chat-empty {
		margin: 0;
		color: #adadb8;
		font-family: Inter, sans-serif;
		text-align: center;
		opacity: 0.5;
	}
</style>
