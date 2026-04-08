<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from '$lib/api/client';
	import type { LeaderboardResponse, LeaderboardEntry } from '$lib/types/api';

	let entries = $state<LeaderboardEntry[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await get<LeaderboardResponse>('/viewers/leaderboard');
			entries = res.success && res.data ? res.data : [];
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function medal(rank: number): string {
		if (rank === 1) return '🥇';
		if (rank === 2) return '🥈';
		if (rank === 3) return '🥉';
		return `#${rank}`;
	}

	function fmt(n: number): string {
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
		if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
		return String(n);
	}
</script>

<div class="leaderboard">
	<div class="panel-header">
		<h2>Leaderboard</h2>
		<button class="refresh" onclick={load} disabled={loading}>↺</button>
	</div>

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if error}
		<p class="err">Error: {error}</p>
	{:else if entries.length === 0}
		<p class="muted">No data yet.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Rank</th>
					<th>Viewer</th>
					<th class="right">Points</th>
					<th class="right">Total Earned</th>
				</tr>
			</thead>
			<tbody>
				{#each entries as entry (entry.twitch_id)}
					<tr>
						<td class="rank">{medal(entry.rank)}</td>
						<td class="name">
							{entry.display_name}
							{#if entry.is_regular}
								<span class="badge">REG</span>
							{/if}
						</td>
						<td class="right points">{fmt(entry.points)}</td>
						<td class="right muted">{fmt(entry.total_earned)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.leaderboard {
		background: var(--surface, #1e1e2e);
		border: 1px solid var(--border, #313244);
		border-radius: 8px;
		padding: 1rem 1.25rem;
	}

	.panel-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	h2 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text, #cdd6f4);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		flex: 1;
	}

	.refresh {
		background: none;
		border: 1px solid var(--border, #313244);
		color: var(--subtext, #a6adc8);
		border-radius: 4px;
		padding: 0.15rem 0.5rem;
		cursor: pointer;
		font-size: 0.9rem;
		line-height: 1;
	}

	.refresh:hover:not(:disabled) {
		color: var(--text, #cdd6f4);
		border-color: var(--subtext, #a6adc8);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
	}

	th {
		text-align: left;
		color: var(--subtext, #a6adc8);
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 0 0 0.5rem;
		border-bottom: 1px solid var(--border, #313244);
	}

	th.right,
	td.right {
		text-align: right;
	}

	td {
		padding: 0.45rem 0;
		border-bottom: 1px solid var(--border, #313244);
		color: var(--text, #cdd6f4);
	}

	tr:last-child td {
		border-bottom: none;
	}

	.rank {
		width: 2.5rem;
		font-size: 0.8rem;
		color: var(--subtext, #a6adc8);
	}

	.name {
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.badge {
		font-size: 0.6rem;
		font-weight: 800;
		background: var(--blue, #89b4fa);
		color: #11111b;
		padding: 0.05rem 0.3rem;
		border-radius: 3px;
	}

	.points {
		font-weight: 600;
		color: var(--accent, #cba6f7);
	}

	.muted {
		color: var(--subtext, #a6adc8);
		font-size: 0.875rem;
	}

	.err {
		color: var(--red, #f38ba8);
		font-size: 0.875rem;
	}
</style>
