<script lang="ts">
	import LoyaltyLeaderboard from '$lib/components/LoyaltyLeaderboard.svelte';
	import ViewerLookup from '$lib/components/ViewerLookup.svelte';
</script>

<div class="page">
	<h1>Loyalty</h1>
	<div class="grid">
		<LoyaltyLeaderboard />
		<ViewerLookup />
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
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
		gap: 1rem;
		align-items: start;
	}
</style>
