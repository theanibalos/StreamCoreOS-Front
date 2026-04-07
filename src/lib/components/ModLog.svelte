<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from '$lib/api/client';
	import type { ModLogResponse, ModLogEntry } from '$lib/types/api';

	let entries = $state<ModLogEntry[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await get<ModLogResponse>('/moderation/log');
			entries = res.success && res.data ? res.data : [];
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function actionColor(a: string) {
		if (a === 'ban') return '#f38ba8';
		if (a === 'timeout') return '#f9e2af';
		return '#89b4fa';
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="mod-log">
	<div class="panel-header">
		<h2>Mod Log</h2>
		<button class="refresh" onclick={load} disabled={loading}>↺</button>
	</div>

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if error}
		<p class="err">{error}</p>
	{:else if entries.length === 0}
		<p class="muted">No actions recorded yet.</p>
	{:else}
		<div class="scroll-wrap">
			<table>
				<thead>
					<tr>
						<th>User</th>
						<th class="center">Action</th>
						<th>Reason</th>
						<th class="right">When</th>
					</tr>
				</thead>
				<tbody>
					{#each entries as entry (entry.id)}
						<tr>
							<td class="name">{entry.display_name}</td>
							<td class="center">
								<span class="action-badge" style="color:{actionColor(entry.action)}">
									{entry.action}
								</span>
							</td>
							<td class="reason">{entry.reason}</td>
							<td class="right muted">{formatDate(entry.created_at)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.mod-log {
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
		padding: 0.2rem 0.5rem;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.refresh:hover:not(:disabled) { color: var(--text, #cdd6f4); }
	.refresh:disabled { opacity: 0.4; cursor: not-allowed; }

	.scroll-wrap {
		max-height: 360px;
		overflow-y: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
	}

	th {
		position: sticky;
		top: 0;
		background: var(--surface, #1e1e2e);
		text-align: left;
		color: var(--subtext, #a6adc8);
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 0 0 0.5rem;
		border-bottom: 1px solid var(--border, #313244);
	}

	th.center, td.center { text-align: center; }
	th.right, td.right { text-align: right; }

	td {
		padding: 0.45rem 0;
		border-bottom: 1px solid var(--border, #313244);
		color: var(--text, #cdd6f4);
		vertical-align: middle;
	}

	tr:last-child td { border-bottom: none; }

	.name { font-weight: 500; white-space: nowrap; padding-right: 0.5rem; }

	.action-badge {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.reason {
		color: var(--subtext, #a6adc8);
		font-size: 0.825rem;
		max-width: 240px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.muted { color: var(--subtext, #a6adc8); font-size: 0.875rem; }
	.err { color: var(--red, #f38ba8); font-size: 0.875rem; }
</style>
