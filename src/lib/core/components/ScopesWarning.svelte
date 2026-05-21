<script lang="ts">
	import { ShieldAlert } from '@lucide/svelte';
	import { scopesState } from '../stores/scopes.svelte';

	let { class: className = '' }: { class?: string } = $props();
</script>

{#if scopesState.checked && scopesState.missing.length > 0}
	<div class="flex items-center gap-3 bg-amber-500/10 border-b border-amber-500/30 px-6 py-2.5 text-sm {className}">
		<ShieldAlert class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
		<span class="text-amber-800 dark:text-amber-300 flex-1">
			<strong>{scopesState.missing.length} permiso{scopesState.missing.length > 1 ? 's' : ''} faltante{scopesState.missing.length > 1 ? 's' : ''}</strong>
			— algunas funciones no recibirán eventos hasta que re-autorices.
		</span>
		<a
			href="/settings"
			class="flex-shrink-0 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 transition-colors shadow-sm"
		>
			Ver permisos →
		</a>
	</div>
{/if}
