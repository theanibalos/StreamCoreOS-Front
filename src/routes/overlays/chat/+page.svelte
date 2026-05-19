<script lang="ts">
	import { chat } from '$lib/features/chat';
	import { fade, fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	interface ChatMessageData {
		display_name?: string;
		user_name?: string;
		message?: string;
		text?: string;
		is_mod?: boolean;
		is_sub?: boolean;
		is_broadcaster?: boolean;
	}

	function nameColor(name: string): string {
		let hash = 0;
		for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
		const hue = ((hash % 360) + 360) % 360;
		return `hsl(${hue}, 80%, 70%)`;
	}

	function getBadges(d: ChatMessageData): string[] {
		const out = [];
		if (d.is_broadcaster) out.push('👑');
		if (d.is_mod) out.push('🛡️');
		if (d.is_sub) out.push('⭐');
		return out;
	}

	// Solo mostramos los últimos 10 mensajes para el overlay para mantenerlo limpio
	let displayMessages = $derived(chat.messages.slice(-10));
</script>

<div class="flex flex-col justify-end h-screen w-screen p-8 overflow-hidden bg-transparent">
	<div class="flex flex-col gap-4 max-w-md">
		{#each displayMessages as msg (msg._id)}
			{@const d = (msg.data ?? {}) as ChatMessageData}
			<div 
				animate:flip={{ duration: 400 }}
				in:fly={{ x: -40, duration: 500, opacity: 0 }}
				out:fade={{ duration: 300 }}
				class="flex flex-col bg-black/70 backdrop-blur-xl border-l-4 border-primary p-4 rounded-r-2xl shadow-2xl"
			>
				<div class="flex items-center gap-2 mb-1.5">
					{#if getBadges(d).length > 0}
						<span class="flex gap-0.5 text-[10px]">
							{#each getBadges(d) as b}{b}{/each}
						</span>
					{/if}
					<span class="font-black text-sm uppercase tracking-widest drop-shadow-md" style="color: {nameColor(d.display_name ?? d.user_name ?? '')}">
						{d.display_name ?? d.user_name ?? 'Anonymous'}
					</span>
				</div>
				<p class="text-white text-base font-semibold leading-relaxed drop-shadow-sm">
					{d.message ?? d.text ?? ''}
				</p>
			</div>
		{/each}
	</div>
</div>

<style>
	:global(body) {
		background: transparent !important;
	}
</style>
