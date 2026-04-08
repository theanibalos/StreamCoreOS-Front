<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import { refreshStream } from '$lib/stores/stream.svelte';
	import { connectAlerts } from '$lib/stores/alerts.svelte';
	import { auth, checkAuth, startTwitchAuth } from '$lib/stores/auth.svelte';

	let { children } = $props();

	const POLL_INTERVAL = 30_000;

	const navLinks = [
		{ href: '/', label: 'Dashboard', icon: '⬛' },
		{ href: '/chat', label: 'Chat', icon: '💬' },
		{ href: '/viewers', label: 'Viewers', icon: '⭐' },
		{ href: '/commands', label: 'Commands', icon: '⌨' },
		{ href: '/moderation', label: 'Moderation', icon: '🛡' },
		{ href: '/timers', label: 'Timers', icon: '⏱' },
		{ href: '/system', label: 'System', icon: '⚙' }
	];

	onMount(() => {
		checkAuth().then(() => {
			if (auth.isAuthenticated) {
				refreshStream();
				const pollId = setInterval(refreshStream, POLL_INTERVAL);
				const stopAlerts = connectAlerts();
				return () => {
					clearInterval(pollId);
					stopAlerts();
				};
			}
		});
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>StreamCoreOS</title>
</svelte:head>

<div class="app">
	{#if auth.loading}
		<div class="auth-loading">
			<div class="loader"></div>
			<p>Initializing StreamCoreOS…</p>
		</div>
	{:else if !auth.isAuthenticated}
		<div class="login-screen">
			<div class="login-box">
				<div class="logo-large">StreamCoreOS</div>
				<h1>Control your stream with ease</h1>
				<p>Please authenticate with Twitch to access the dashboard.</p>
				
				{#if auth.error}
					<div class="error-msg">{auth.error}</div>
				{/if}

				<button class="twitch-btn" onclick={startTwitchAuth}>
					<span class="icon">🟣</span>
					Login with Twitch
				</button>
			</div>
		</div>
	{:else}
		<nav class="sidebar">
			<div class="logo">StreamCoreOS</div>
			<ul>
				{#each navLinks as link (link.href)}
					<li>
						<a
							href={link.href}
							class:active={page.url.pathname === link.href ||
								(link.href !== '/' && page.url.pathname.startsWith(link.href))}
						>
							<span class="icon">{link.icon}</span>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<main class="content">
			{@render children()}
		</main>
	{/if}
</div>

<style>
	:global(*, *::before, *::after) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(body) {
		background: #11111b;
		color: #cdd6f4;
		font-family: 'Inter', system-ui, sans-serif;
		font-size: 14px;
		line-height: 1.5;
	}

	:global(:root) {
		--surface: #1e1e2e;
		--surface2: #181825;
		--border: #313244;
		--text: #cdd6f4;
		--subtext: #a6adc8;
		--accent: #cba6f7;
		--green: #a6e3a1;
		--red: #f38ba8;
		--yellow: #f9e2af;
		--blue: #89b4fa;
		--twitch: #9146ff;
	}

	.app {
		display: flex;
		height: 100vh;
		overflow: hidden;
	}

	/* Auth Screens */
	.auth-loading, .login-screen {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: #11111b;
	}

	.login-box {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 2.5rem;
		text-align: center;
		max-width: 400px;
		width: 90%;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
	}

	.logo-large {
		font-size: 1.5rem;
		font-weight: 800;
		color: var(--accent);
		margin-bottom: 1.5rem;
	}

	h1 {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	p {
		color: var(--subtext);
		margin-bottom: 2rem;
		font-size: 0.9rem;
	}

	.twitch-btn {
		background: var(--twitch);
		color: white;
		border: none;
		border-radius: 6px;
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		width: 100%;
		transition: transform 0.15s, filter 0.15s;
	}

	.twitch-btn:hover {
		transform: translateY(-2px);
		filter: brightness(1.1);
	}

	.error-msg {
		background: rgba(243, 139, 168, 0.1);
		border: 1px solid var(--red);
		color: var(--red);
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1.5rem;
		font-size: 0.85rem;
	}

	.loader {
		border: 3px solid var(--surface);
		border-top: 3px solid var(--accent);
		border-radius: 50%;
		width: 32px;
		height: 32px;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	/* Sidebar & Main */
	.sidebar {
		width: 200px;
		flex-shrink: 0;
		background: var(--surface2);
		border-right: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		padding: 1rem 0;
	}

	.logo {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--accent);
		padding: 0 1rem 1rem;
		border-bottom: 1px solid var(--border);
		margin-bottom: 0.5rem;
		letter-spacing: 0.03em;
	}

	ul {
		list-style: none;
	}

	a {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.55rem 1rem;
		color: var(--subtext);
		text-decoration: none;
		font-size: 0.875rem;
		border-left: 2px solid transparent;
		transition: color 0.15s, background 0.15s;
	}

	a:hover {
		color: var(--text);
		background: rgba(203, 166, 247, 0.06);
	}

	a.active {
		color: var(--accent);
		border-left-color: var(--accent);
		background: rgba(203, 166, 247, 0.08);
	}

	.icon {
		font-size: 0.9rem;
		width: 1.2rem;
		text-align: center;
	}

	.content {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
	}
</style>
