<script lang="ts">
	import CommandsManager from '$lib/components/CommandsManager.svelte';
	import ChatReminders from '$lib/components/ChatReminders.svelte';
</script>

<div class="page">
	<h1>Commands</h1>
	<CommandsManager />
	<ChatReminders />
</div>

<style>
	.page h1 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text);
		margin-bottom: 1.25rem;
	}
</style>
