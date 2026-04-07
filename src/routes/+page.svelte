<script lang="ts">
	import StreamStatus from '$lib/components/StreamStatus.svelte';
	import AlertFeed from '$lib/components/AlertFeed.svelte';
</script>

<div class="dashboard">
	<h1>Dashboard</h1>
	<div class="grid">
		<StreamStatus />
		<AlertFeed />
	</div>
</div>

<style>
	.dashboard h1 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text);
		margin-bottom: 1.25rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
		gap: 1rem;
		align-items: start;
	}
</style>
