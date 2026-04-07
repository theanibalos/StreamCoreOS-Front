<script lang="ts">
	import SystemHealth from '$lib/components/SystemHealth.svelte';
	import SystemGraph from '$lib/SystemGraph.svelte';
</script>

<div class="page">
	<h1>System</h1>
	
	<div class="grid">
		<SystemHealth />
		<SystemGraph />
	</div>
</div>

<style>
	.page h1 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text);
		margin-bottom: 1.25rem;
	}

	.grid {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 900px;
	}

	.page :global(.system-health),
	.page :global(.graph-container) {
		width: 100%;
	}
</style>
