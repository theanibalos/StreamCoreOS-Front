<script lang="ts">
	import { fromAction } from 'svelte/attachments';
	import { chat } from '$lib/features/chat';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { MessageSquare, ArrowDown } from '@lucide/svelte';

	interface ChatMessageData {
		display_name?: string;
		user_name?: string;
		message?: string;
		text?: string;
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
		return `hsl(${hue}, 70%, 65%)`; // Vibrant colors for dark/light mode
	}

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
			.closest('.card-content-wrapper')
			?.querySelector('.messages-container') as HTMLElement | null;
		if (target) target.scrollTop = target.scrollHeight;
		pinned = true;
	}
</script>

<Card class="w-full flex flex-col h-[600px]">
	<CardHeader class="pb-3 border-b flex-none">
		<div class="flex items-center justify-between">
			<CardTitle class="text-lg font-bold uppercase tracking-wide flex items-center gap-2">
				<MessageSquare class="w-5 h-5" /> Chat en Vivo
			</CardTitle>
			<div class="flex items-center gap-4">
				{#if !pinned}
					<Button variant="secondary" size="sm" class="h-7 text-xs" onclick={resumeScroll}>
						<ArrowDown class="w-3 h-3 mr-1" /> Reanudar Scroll
					</Button>
				{/if}
				<span class="relative flex h-3 w-3" title={chat.connected ? 'Connected' : 'Disconnected'}>
					{#if chat.connected}
						<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
						<span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
					{:else}
						<span class="relative inline-flex rounded-full h-3 w-3 bg-muted-foreground"></span>
					{/if}
				</span>
			</div>
		</div>
	</CardHeader>
	<CardContent class="flex-1 overflow-hidden p-0 card-content-wrapper relative">
		<div class="h-full overflow-y-auto p-4 messages-container space-y-2" {@attach fromAction(scrollable)} role="log" aria-live="polite">
			{#if chat.messages.length === 0}
				<div class="h-full flex items-center justify-center text-sm text-muted-foreground">
					Esperando mensajes...
				</div>
			{:else}
				{#each chat.messages as msg (msg._id)}
					{@const d = (msg.data ?? {}) as ChatMessageData}
					<div class="text-sm leading-relaxed break-words hover:bg-muted/50 p-1.5 rounded transition-colors">
						{#if getBadges(d).length > 0}
							<span class="inline-flex gap-0.5 mr-1 text-[0.7rem]">
								{#each getBadges(d) as badge (badge)}{badge}{/each}
							</span>
						{/if}
						<span class="font-bold drop-shadow-sm" style="color:{nameColor(d.display_name ?? d.user_name ?? '')}">
							{d.display_name ?? d.user_name ?? '?'}
						</span><span class="text-muted-foreground mx-0.5">:</span>
						<span class="text-foreground">
							{d.message ?? d.text ?? ''}
						</span>
					</div>
				{/each}
			{/if}
		</div>
	</CardContent>
</Card>
