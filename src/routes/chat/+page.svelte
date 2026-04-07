<script lang="ts">
	import { onMount } from 'svelte';
	import ChatViewer from '$lib/components/ChatViewer.svelte';
	import { connectChat } from '$lib/stores/chat.svelte';

	onMount(() => {
		return connectChat();
	});
</script>

<div class="page">
	<h1>Chat</h1>
	<ChatViewer />
</div>

<style>
	.page h1 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text);
		margin-bottom: 1.25rem;
	}
</style>
