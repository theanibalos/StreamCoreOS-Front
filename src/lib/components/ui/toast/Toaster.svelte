<script lang="ts">
	import { toasts, dismiss } from '$lib/core/stores/toast.svelte';
	import { fade } from 'svelte/transition';

	const typeClass: Record<string, string> = {
		success: 'bg-green-500/15 border-green-500/40 text-green-700 dark:text-green-300',
		error: 'bg-destructive/15 border-destructive/40 text-destructive',
		info: 'bg-primary/10 border-primary/20 text-foreground'
	};
</script>

{#if toasts.length > 0}
	<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 pointer-events-none">
		{#each toasts as toast (toast.id)}
			<div
				class="flex items-center justify-between rounded-lg border px-4 py-3 text-sm shadow-lg pointer-events-auto {typeClass[toast.type]}"
				in:fade={{ duration: 150 }}
				out:fade={{ duration: 200 }}
			>
				<span>{toast.message}</span>
				<button
					onclick={() => dismiss(toast.id)}
					class="ml-3 opacity-60 hover:opacity-100 transition-opacity text-base leading-none"
					aria-label="Cerrar"
				>×</button>
			</div>
		{/each}
	</div>
{/if}
