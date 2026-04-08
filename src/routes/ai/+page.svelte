<script lang="ts">
	import AIProviderConfig from '$lib/components/AIProviderConfig.svelte';
	// Each AI feature is a separate component — remove the import to disable the feature.
	import AIModerationConfig from '$lib/components/AIModerationConfig.svelte';
	import AIChatConfig from '$lib/components/AIChatConfig.svelte';
</script>

<div class="page">
	<h1>Artificial Intelligence</h1>
	<div class="layout">
		<AIProviderConfig />
		<AIChatConfig />
		<AIModerationConfig />
	</div>
</div>

<style>
	.page h1 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text);
		margin-bottom: 1.25rem;
	}

	.layout {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 640px;
	}
</style>
