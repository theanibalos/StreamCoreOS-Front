<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import { refreshStream } from '$lib/core/stores/stream.svelte';
	import { connectAlerts, connectChat } from '$lib/features/chat';
	import { auth, checkAuth, startTwitchAuth } from '$lib/core/stores/auth.svelte';
	import { FEATURES } from '$lib/core/features.config';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { ModeWatcher, toggleMode } from 'mode-watcher';
	import { Sun, Moon } from '@lucide/svelte';

	let { children } = $props();

	const POLL_INTERVAL = 30_000;

	onMount(() => {
		checkAuth().then(() => {
			if (auth.isAuthenticated) {
				refreshStream();
				const pollId = setInterval(refreshStream, POLL_INTERVAL);
				const stopAlerts = connectAlerts();
				const stopChat = connectChat();
				return () => {
					clearInterval(pollId);
					stopAlerts();
					stopChat();
				};
			}
		});
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>StreamCoreOS</title>
</svelte:head>

<ModeWatcher />

{#if page.url.pathname.startsWith('/overlays/') && page.url.pathname !== '/overlays'}
	{@render children()}
{:else}
	<div class="flex h-screen w-full overflow-hidden bg-background text-foreground">
		{#if auth.loading}
			<div class="flex flex-1 flex-col items-center justify-center">
				<div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
				<p class="mt-4 text-muted-foreground">Initializing StreamCoreOS…</p>
			</div>
		{:else if !auth.isAuthenticated}
			<div class="flex flex-1 items-center justify-center bg-background">
				<Card class="w-full max-w-md shadow-lg">
					<CardHeader class="text-center">
						<CardTitle class="text-3xl font-extrabold text-primary mb-2">StreamCoreOS</CardTitle>
						<CardDescription>Control your stream with ease</CardDescription>
					</CardHeader>
					<CardContent class="flex flex-col gap-4">
						<p class="text-sm text-muted-foreground text-center">
							Please authenticate with Twitch to access the dashboard.
						</p>
						{#if auth.error}
							<div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/50">
								{auth.error}
							</div>
						{/if}
						<Button onclick={startTwitchAuth} class="w-full bg-[#9146ff] hover:bg-[#9146ff]/90 text-white">
							<span class="mr-2">🟣</span> Login with Twitch
						</Button>
					</CardContent>
				</Card>
			</div>
		{:else}
			<nav class="flex w-64 flex-col border-r bg-card/50 px-3 py-4">
				<div class="mb-6 px-4 flex items-center justify-between">
					<h2 class="text-lg font-bold tracking-tight text-primary">StreamCoreOS</h2>
					<Button variant="ghost" size="icon" onclick={toggleMode}>
						<Sun class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
						<Moon class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
						<span class="sr-only">Toggle theme</span>
					</Button>
				</div>
				<ul class="space-y-1">
					{#each FEATURES as link (link.href)}
						<li>
							<a
								href={link.href}
								class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors { 
									page.url.pathname === link.href || (link.href !== '/' && page.url.pathname.startsWith(link.href)) 
									? 'bg-primary/10 text-primary' 
									: 'text-muted-foreground hover:bg-muted hover:text-foreground' 
								}"
							>
								<span class="text-base">{link.icon}</span>
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
			</nav>

			<main class="flex-1 overflow-y-auto bg-background p-6">
				<div class="mx-auto max-w-6xl">
					{@render children()}
				</div>
			</main>
		{/if}
	</div>
{/if}
