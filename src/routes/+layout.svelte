<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import { refreshStream } from '$lib/stores/stream.svelte';
	import { connectAlerts } from '$lib/stores/alerts.svelte';

	let { children } = $props();

	const POLL_INTERVAL = 30_000;

	const navLinks = [
		{ href: '/', label: 'Dashboard', icon: '⬛' },
		{ href: '/chat', label: 'Chat', icon: '💬' },
		{ href: '/loyalty', label: 'Loyalty', icon: '⭐' },
		{ href: '/commands', label: 'Commands', icon: '⌨' },
		{ href: '/moderation', label: 'Moderation', icon: '🛡' },
		{ href: '/timers', label: 'Timers', icon: '⏱' },
		{ href: '/system', label: 'System', icon: '⚙' }
	];

	onMount(() => {
		refreshStream();
		const pollId = setInterval(refreshStream, POLL_INTERVAL);
		const stopAlerts = connectAlerts();

		return () => {
			clearInterval(pollId);
			stopAlerts();
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>StreamCoreOS</title>
</svelte:head>

<div class="app">
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
	}

	.app {
		display: flex;
		height: 100vh;
		overflow: hidden;
	}

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
