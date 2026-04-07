<script lang="ts">
	import TimersManager from '$lib/components/TimersManager.svelte';
</script>

<div class="page">
	<h1>Timers</h1>
	<TimersManager />
</div>

<style>
	.page h1 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text);
		margin-bottom: 1.25rem;
	}
</style>
