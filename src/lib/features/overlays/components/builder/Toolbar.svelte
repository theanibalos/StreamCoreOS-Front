<script lang="ts">
	import type { Component } from 'svelte';
	import { 
		Zap, 
		BarChart2, 
		MessageSquare, 
		Type, 
		TrendingUp,
		ImageIcon
	} from '@lucide/svelte';
	import type { OverlayElement } from '../../index';

	let { onAdd }: { onAdd: (type: OverlayElement['type']) => void } = $props();

	const TOOLBAR_ITEMS: { type: OverlayElement['type']; icon: any; label: string }[] = [
		{ type: 'alert',          icon: Zap,           label: 'Alerta' },
		{ type: 'stat',           icon: BarChart2,     label: 'Dato' },
		{ type: 'chat_highlight', icon: MessageSquare, label: 'Chat' },
		{ type: 'banner',         icon: Type,          label: 'Texto' },
		{ type: 'progress_bar',   icon: TrendingUp,    label: 'Meta' },
		{ type: 'media',          icon: ImageIcon,     label: 'Media' },
	];
</script>

<div class="w-14 border-r bg-card flex flex-col items-center py-3 gap-2 shrink-0">
	{#each TOOLBAR_ITEMS as item}
		<button
			class="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors w-full"
			onclick={() => onAdd(item.type)}
			title={item.label}
		>
			<item.icon class="w-5 h-5" />
			<span class="text-[9px] font-medium">{item.label}</span>
		</button>
	{/each}
</div>
