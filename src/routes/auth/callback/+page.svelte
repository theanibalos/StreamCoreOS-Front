<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { get } from '$lib/core/api/client';
	import { checkAuth } from '$lib/core/stores/auth.svelte';
	import type { OAuthCallbackResponse } from '$lib/types/api';

	let error = $state<string | null>(null);

	onMount(async () => {
		const code = page.url.searchParams.get('code');
		const state = page.url.searchParams.get('state');

		if (!code) {
			error = 'Authorization code missing from Twitch response.';
			return;
		}

		try {
			const params = new URLSearchParams({ code });
			if (state) params.set('state', state);

			// redirect: 'manual' evita que fetch siga el 302 que manda el backend
			// y reciba HTML en vez de JSON. Un opaqueredirect = backend procesó OK.
			const res = await fetch(`/api/auth/twitch/callback?${params}`, { redirect: 'manual' });

			if (res.type === 'opaqueredirect' || res.ok) {
				await checkAuth();
				window.location.href = '/';
			} else {
				const body = await res.json().catch(() => ({}));
				error = (body as any).error ?? `Error ${res.status} al autenticar.`;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	});
</script>

<div class="callback-screen">
	<div class="box">
		{#if error}
			<div class="error-icon">✕</div>
			<h1>Authentication Error</h1>
			<p>{error}</p>
			<a href="/" class="retry-btn">Back to Login</a>
		{:else}
			<div class="loader"></div>
			<h1>Finalizing Login</h1>
			<p>Completing your connection with Twitch, please wait…</p>
		{/if}
	</div>
</div>

<style>
	.callback-screen {
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #11111b;
		color: #cdd6f4;
		font-family: sans-serif;
	}

	.box {
		background: #1e1e2e;
		border: 1px solid #313244;
		border-radius: 12px;
		padding: 3rem;
		text-align: center;
		max-width: 450px;
		width: 90%;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
	}

	h1 {
		font-size: 1.25rem;
		margin-bottom: 0.75rem;
	}

	p {
		color: #a6adc8;
		margin-bottom: 1.5rem;
		line-height: 1.4;
	}

	.error-icon {
		font-size: 3rem;
		color: #f38ba8;
		margin-bottom: 1rem;
	}

	.retry-btn {
		display: inline-block;
		background: #313244;
		color: white;
		text-decoration: none;
		padding: 0.6rem 1.2rem;
		border-radius: 6px;
		font-weight: 600;
	}

	.loader {
		border: 3px solid #181825;
		border-top: 3px solid #cba6f7;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		animation: spin 1s linear infinite;
		margin: 0 auto 1.5rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style>
