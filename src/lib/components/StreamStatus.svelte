<script lang="ts">
	import { stream } from '$lib/stores/stream.svelte';

	function formatDuration(startedAt: string): string {
		const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
		const h = Math.floor(diff / 3600);
		const m = Math.floor((diff % 3600) / 60);
		const s = diff % 60;
		if (h > 0) return `${h}h ${m}m`;
		if (m > 0) return `${m}m ${s}s`;
		return `${s}s`;
	}

	function fmt(n: number | null): string {
		if (n === null) return '—';
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
		if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
		return String(n);
	}
</script>

<div class="stream-status">
	{#if stream.loading}
		<p class="muted">Loading stream status…</p>
	{:else if stream.error}
		<p class="error">Error: {stream.error}</p>
	{:else}
		<div class="header">
			<span class="badge" class:online={stream.online} class:offline={!stream.online}>
				{stream.online ? '● LIVE' : '○ OFFLINE'}
			</span>
			{#if stream.broadcaster_login}
				<span class="login">{stream.broadcaster_login}</span>
			{/if}
		</div>

		<div class="stats">
			<div class="stat">
				<span class="label">Viewers</span>
				<span class="value">{fmt(stream.viewer_count)}</span>
			</div>
			<div class="stat">
				<span class="label">Followers</span>
				<span class="value">{fmt(stream.follower_count)}</span>
			</div>
			{#if stream.online && stream.started_at}
				<div class="stat">
					<span class="label">Uptime</span>
					<span class="value">{formatDuration(stream.started_at)}</span>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.stream-status {
		background: var(--surface, #1e1e2e);
		border: 1px solid var(--border, #313244);
		border-radius: 8px;
		padding: 1rem 1.25rem;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.badge {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
	}

	.badge.online {
		background: #a6e3a1;
		color: #1e1e2e;
	}

	.badge.offline {
		background: #45475a;
		color: #cdd6f4;
	}

	.login {
		font-size: 0.95rem;
		color: var(--subtext, #a6adc8);
	}

	.stats {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--subtext, #a6adc8);
	}

	.value {
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--text, #cdd6f4);
	}

	.muted {
		color: var(--subtext, #a6adc8);
		font-size: 0.9rem;
	}

	.error {
		color: #f38ba8;
		font-size: 0.9rem;
	}
</style>
