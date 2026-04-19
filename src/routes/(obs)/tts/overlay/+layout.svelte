<script lang="ts">
	let { children } = $props();
</script>

{@render children()}

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		background: transparent !important;
		overflow: hidden;
	}
</style>
