<script lang="ts">
	import { WIDGET_REGISTRY } from '../../index';

	let { onAdd }: { onAdd: (type: string) => void } = $props();

	// Derived from the widget registry — each widget's meta provides icon + label.
	const TOOLBAR_ITEMS = Object.entries(WIDGET_REGISTRY).map(([type, { meta }]) => ({
		type,
		icon: meta.icon,
		label: meta.shortLabel ?? meta.label
	}));
</script>

<div class="w-14 border-r bg-card flex flex-col items-center py-3 gap-2 shrink-0">
	{#each TOOLBAR_ITEMS as item (item.type)}
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
