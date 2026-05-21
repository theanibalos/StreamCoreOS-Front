<script lang="ts">
	import { Sparkles, Send } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import type { OverlayElement } from '../../index';

	let { 
		messages, 
		input = $bindable(), 
		loading, 
		selected, 
		onSend 
	}: { 
		messages: { role: 'user' | 'assistant'; content: string }[];
		input: string;
		loading: boolean;
		selected: OverlayElement | null;
		onSend: () => void;
	} = $props();

	const ELEMENT_LABELS: Record<string, string> = {
		alert: 'Alerta',
		stat: 'Estadística',
		chat_highlight: 'Chat Highlight',
		banner: 'Banner',
		progress_bar: 'Progreso'
	};
</script>

<div class="border-t bg-card shrink-0 shadow-sm">
	{#if messages.length > 0}
		<div class="px-4 py-2 max-h-32 overflow-y-auto flex flex-col gap-1.5 border-b custom-scrollbar bg-card/50">
			{#each messages as msg}
				<div class="flex gap-2 text-sm {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
					<span class="px-3 py-1.5 rounded-xl max-w-[85%] {msg.role === 'user' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-foreground border shadow-sm'}">
						{msg.content}
					</span>
				</div>
			{/each}
		</div>
	{/if}
	<div class="flex items-center gap-2 px-4 py-2.5">
		<Sparkles class="w-4 h-4 text-primary shrink-0" />
		<input
			class="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
			placeholder={selected ? `Modificar "${ELEMENT_LABELS[selected.type]}"… ej: "hacelo más grande y azul"` : 'Describí qué overlay querés… ej: "un contador de subs en la esquina derecha"'}
			bind:value={input}
			onkeydown={(e) => e.key === 'Enter' && onSend()}
			disabled={loading}
		/>
		<Button size="sm" variant="ghost" class="h-8 w-8 p-0" onclick={onSend} disabled={loading || !input.trim()}>
			{#if loading}
				<span class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
			{:else}
				<Send class="w-4 h-4" />
			{/if}
		</Button>
	</div>
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.1);
		border-radius: 10px;
	}
</style>
