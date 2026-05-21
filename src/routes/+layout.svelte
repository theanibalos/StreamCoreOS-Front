<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import { refreshStream } from '$lib/core/stores/stream.svelte';
	import { connectAlerts, connectChat } from '$lib/features/chat';
	import { auth, checkAuth } from '$lib/core/stores/auth.svelte';
	import { checkScopes, resetScopes } from '$lib/core/stores/scopes.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import Toaster from '$lib/components/ui/toast/Toaster.svelte';

	// Components
	import LoginForm from '$lib/features/auth/components/LoginForm.svelte';
	import Sidebar from '$lib/core/components/Sidebar.svelte';
	import ScopesWarning from '$lib/core/components/ScopesWarning.svelte';

	let { children } = $props();

	const POLL_INTERVAL = 30_000;

	onMount(() => {
		let pollId: any;
		let authPollId: any;
		let stopAlerts: () => void = () => {};
		let stopChat: () => void = () => {};

		async function initSession() {
			await checkAuth();
			if (!auth.isAuthenticated) return;

			checkScopes();
			refreshStream();
			
			pollId = setInterval(refreshStream, POLL_INTERVAL);
			stopAlerts = connectAlerts();
			stopChat = connectChat();

			// Session validation poll
			authPollId = setInterval(async () => {
				await checkAuth({ silent: true });
				if (!auth.isAuthenticated) {
					cleanup();
				}
			}, POLL_INTERVAL);
		}

		function cleanup() {
			resetScopes();
			clearInterval(pollId);
			clearInterval(authPollId);
			stopAlerts();
			stopChat();
		}

		initSession();

		return cleanup;
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>StreamCoreOS</title>
</svelte:head>

<ModeWatcher />
<Toaster />

{#if page.url.pathname === '/auth/callback' || (page.url.pathname.startsWith('/overlays/') && page.url.pathname !== '/overlays')}
	{@render children()}
{:else}
	<div class="flex h-screen w-full overflow-hidden bg-background text-foreground">
		{#if auth.loading}
			<div class="flex flex-1 flex-col items-center justify-center bg-background/50 backdrop-blur-sm">
				<div class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-sm"></div>
				<p class="mt-4 text-sm font-medium text-muted-foreground animate-pulse">Iniciando StreamCoreOS…</p>
			</div>
		{:else if !auth.isAuthenticated}
			<LoginForm />
		{:else}
			<Sidebar class="w-64 shrink-0" />

			<div class="flex flex-1 flex-col overflow-hidden relative">
				<ScopesWarning />

				<main class="flex-1 overflow-y-auto bg-background/30 p-6 custom-scrollbar">
					<div class="mx-auto max-w-6xl w-full">
						{@render children()}
					</div>
				</main>
			</div>
		{/if}
	</div>
{/if}

<style>
	:global(.custom-scrollbar)::-webkit-scrollbar {
		width: 6px;
	}
	:global(.custom-scrollbar)::-webkit-scrollbar-track {
		background: transparent;
	}
	:global(.custom-scrollbar)::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.05);
		border-radius: 10px;
	}
	:global(.dark .custom-scrollbar)::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.05);
	}
	:global(.custom-scrollbar)::-webkit-scrollbar-thumb:hover {
		background: rgba(0, 0, 0, 0.1);
	}
	:global(.dark .custom-scrollbar)::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.1);
	}
</style>
