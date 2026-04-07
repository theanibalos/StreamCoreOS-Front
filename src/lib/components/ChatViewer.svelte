<script lang="ts">
	import { fromAction } from 'svelte/attachments';
	import { chat } from '$lib/stores/chat.svelte';

	interface ChatMessageData {
		display_name?: string;
		user_name?: string; // fallback if backend uses user_name
		message?: string;
		text?: string; // fallback if backend uses text
		is_mod?: boolean;
		is_sub?: boolean;
		is_broadcaster?: boolean;
		user_id?: string;
	}

	let pinned = $state(true);

	function getBadges(data: ChatMessageData | null | undefined): string[] {
		if (!data) return [];
		const out: string[] = [];
		if (data.is_broadcaster) out.push('👑');
		if (data.is_mod) out.push('🛡');
		if (data.is_sub) out.push('⭐');
		return out;
	}

	function nameColor(name: string): string {
		let hash = 0;
		for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
		const hue = ((hash % 360) + 360) % 360;
		return `hsl(${hue}, 60%, 70%)`;
	}

	// Svelte action: handles scroll-pinning and auto-scroll via MutationObserver
	function scrollable(node: HTMLElement) {
		let rafId = 0;

		function onScroll() {
			const atBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 40;
			pinned = atBottom;
		}

		const observer = new MutationObserver(() => {
			if (pinned) {
				cancelAnimationFrame(rafId);
				rafId = requestAnimationFrame(() => {
					node.scrollTop = node.scrollHeight;
				});
			}
		});

		node.addEventListener('scroll', onScroll, { passive: true });
		observer.observe(node, { childList: true, subtree: true });

		return {
			destroy() {
				node.removeEventListener('scroll', onScroll);
				observer.disconnect();
				cancelAnimationFrame(rafId);
			}
		};
	}

	function resumeScroll(event: MouseEvent) {
		const target = (event.currentTarget as HTMLElement)
			.closest('.chat-viewer')
			?.querySelector('.messages') as HTMLElement | null;
		if (target) target.scrollTop = target.scrollHeight;
		pinned = true;
	}
</script>

<div class="chat-viewer">
	<div class="chat-header">
		<h2>Live Chat</h2>
		<span class="dot" class:on={chat.connected}></span>
		{#if !pinned}
			<button class="scroll-btn" onclick={resumeScroll}>↓ Resume</button>
		{/if}
	</div>

	<div class="messages" {@attach fromAction(scrollable)} role="log" aria-live="polite">
		{#if chat.messages.length === 0}
			<p class="empty">Waiting for chat…</p>
		{:else}
			{#each chat.messages as msg (msg.timestamp + (msg.data?.user_id ?? msg.timestamp))}
				{@const d = (msg.data ?? {}) as ChatMessageData}
				<div class="message">
					<span class="badges">
						{#each getBadges(d) as badge (badge)}{badge}{/each}
					</span>
					<span class="name" style="color:{nameColor(d.display_name ?? d.user_name ?? '')}"
						>{d.display_name ?? d.user_name ?? '?'}</span
					>
					<span class="colon">:</span>
					<span class="text">{d.message ?? d.text ?? ''}</span>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.chat-viewer {
		background: var(--surface, #1e1e2e);
		border: 1px solid var(--border, #313244);
		border-radius: 8px;
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		height: 600px;
	}

	.chat-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		flex-shrink: 0;
	}

	h2 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text, #cdd6f4);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #45475a;
	}

	.dot.on {
		background: #a6e3a1;
		box-shadow: 0 0 4px #a6e3a1;
	}

	.scroll-btn {
		margin-left: auto;
		background: var(--accent, #cba6f7);
		color: #11111b;
		border: none;
		border-radius: 4px;
		padding: 0.2rem 0.6rem;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.message {
		font-size: 0.85rem;
		line-height: 1.4;
		word-break: break-word;
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.badges {
		font-size: 0.7rem;
		flex-shrink: 0;
	}

	.name {
		font-weight: 600;
		flex-shrink: 0;
	}

	.colon {
		color: var(--subtext, #a6adc8);
		flex-shrink: 0;
	}

	.text {
		color: var(--text, #cdd6f4);
	}

	.empty {
		color: var(--subtext, #a6adc8);
		font-size: 0.875rem;
		margin: auto;
		text-align: center;
	}
</style>
