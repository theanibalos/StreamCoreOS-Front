<script lang="ts">
	import type { OverlayElement, ChatMessage } from '../types';
	import { fly } from 'svelte/transition';

	let {
		element,
		chatMessages = {}
	}: {
		element: OverlayElement;
		chatMessages: Record<string, ChatMessage[]>;
	} = $props();

	const msgs   = $derived(chatMessages[element.id] ?? []);
	const accent = $derived(element.style.accent ?? '#9333ea');
	const bg     = $derived(element.style.background ?? '#000000bb');
	const radius = $derived(element.style.border_radius ?? 14);
	const color  = $derived(element.style.text_color ?? '#ffffff');
	const fs     = $derived(element.style.font_size ?? 18);
	const glow   = $derived(element.style.glow ?? false);
</script>

<div
	class="chat-root"
	style="
		background: {bg};
		border-radius: {radius}px;
		border: 1.5px solid {accent}33;
		box-shadow: {glow ? `0 0 20px ${accent}44` : 'none'};
		color: {color};
		font-size: {fs}px;
	"
>
	{#each msgs as msg (msg.timestamp)}
		<div class="chat-msg" in:fly={{ y: 20, duration: 300 }}>
			<span class="chat-name" style="color: {accent};">{msg.display_name}</span>
			<span class="chat-text">{msg.message}</span>
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
		gap: 6px;
		padding: 12px;
		box-sizing: border-box;
		font-family: system-ui, 'Inter', sans-serif;
		overflow: hidden;
	}

	.chat-msg {
		display: flex;
		gap: 6px;
		align-items: baseline;
		background: rgba(0,0,0,0.4);
		border-radius: 8px;
		padding: 5px 10px;
		line-height: 1.35;
		word-break: break-word;
	}

	.chat-name {
		font-weight: 700;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.chat-text {
		font-weight: 400;
		opacity: 0.92;
	}

	.chat-empty {
		margin: 0;
		opacity: 0.3;
		font-size: 0.75em;
		text-align: center;
	}
</style>
