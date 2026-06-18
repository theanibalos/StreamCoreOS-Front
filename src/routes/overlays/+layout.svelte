<script lang="ts">
	import { page } from '$app/state';
	import '../../app.css';

	let { children } = $props();

	// El layout raíz ya maneja las conexiones SSE de forma global, 
	// así que aquí solo nos encargamos del estilo visual.
	const isActualOverlay = $derived(
		page.url.pathname !== '/overlays' &&
		!page.url.pathname.startsWith('/overlays/builder')
	);

	$effect(() => {
		if (isActualOverlay) {
			document.documentElement.classList.add('overlay-page-html');
			document.body.classList.add('overlay-page-body');
		} else {
			document.documentElement.classList.remove('overlay-page-html');
			document.body.classList.remove('overlay-page-body');
		}

		return () => {
			document.documentElement.classList.remove('overlay-page-html');
			document.body.classList.remove('overlay-page-body');
		};
	});
</script>

{#if isActualOverlay}
	<div class="fixed inset-0 overflow-hidden bg-transparent pointer-events-none">
		{@render children()}
	</div>
	<style>
		:global(html.overlay-page-html), :global(body.overlay-page-body) {
			background-color: transparent !important;
			background: transparent !important;
			color-scheme: normal !important;
			overflow: hidden;
		}
	</style>
{:else}
	{@render children()}
{/if}
