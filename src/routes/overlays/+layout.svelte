<script lang="ts">
	import { page } from '$app/state';
	import '../../app.css';

	let { children } = $props();

	// El layout raíz ya maneja las conexiones SSE de forma global, 
	// así que aquí solo nos encargamos del estilo visual.
	const isActualOverlay = $derived(page.url.pathname !== '/overlays');
</script>

{#if isActualOverlay}
	<div class="fixed inset-0 overflow-hidden bg-transparent pointer-events-none">
		{@render children()}
	</div>
	<style>
		:global(body) {
			background-color: transparent !important;
			overflow: hidden;
		}
	</style>
{:else}
	{@render children()}
{/if}
