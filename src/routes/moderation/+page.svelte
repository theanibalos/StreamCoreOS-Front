<script lang="ts">
	import ModerationRules from '$lib/components/ModerationRules.svelte';
	import ModLog from '$lib/components/ModLog.svelte';
	import ManualActions from '$lib/components/ManualActions.svelte';
</script>

<div class="page">
	<h1>Moderation</h1>
	<div class="grid">
		<div class="col-main">
			<ModerationRules />
		</div>
		<div class="col-side">
			<ManualActions />
			<ModLog />
		</div>
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
		grid-template-columns: 1fr 340px;
		gap: 1rem;
		align-items: start;
	}

	.col-side {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	@media (max-width: 900px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
