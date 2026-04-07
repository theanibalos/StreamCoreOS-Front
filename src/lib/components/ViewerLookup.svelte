<script lang="ts">
	import { get } from '$lib/api/client';
	import type {
		ViewerPointsResponse,
		ViewerPointsData,
		PointsHistoryResponse,
		TransactionData
	} from '$lib/types/api';

	let query = $state('');
	let viewer = $state<ViewerPointsData | null>(null);
	let history = $state<TransactionData[]>([]);
	let showHistory = $state(false);
	let loading = $state(false);
	let historyLoading = $state(false);
	let error = $state<string | null>(null);

	async function lookup() {
		const id = query.trim();
		if (!id) return;
		loading = true;
		error = null;
		viewer = null;
		history = [];
		showHistory = false;
		try {
			const res = await get<ViewerPointsResponse>(`/loyalty/viewers/${encodeURIComponent(id)}`);
			if (res.success && res.data) {
				viewer = res.data;
			} else {
				error = res.error ?? 'Viewer not found';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	async function loadHistory() {
		if (!viewer) return;
		historyLoading = true;
		try {
			const res = await get<PointsHistoryResponse>(
				`/loyalty/viewers/${encodeURIComponent(viewer.twitch_id)}/history`
			);
			history = res.success && res.data ? res.data : [];
			showHistory = true;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			historyLoading = false;
		}
	}

	function fmt(n: number): string {
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
		if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
		return String(n);
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') lookup();
	}
</script>

<div class="viewer-lookup">
	<div class="panel-header">
		<h2>Viewer Lookup</h2>
	</div>

	<div class="search-row">
		<input
			type="text"
			placeholder="Twitch ID or username…"
			bind:value={query}
			onkeydown={onKeydown}
		/>
		<button onclick={lookup} disabled={loading || !query.trim()}>
			{loading ? '…' : 'Search'}
		</button>
	</div>

	{#if error}
		<p class="err">{error}</p>
	{/if}

	{#if viewer}
		<div class="viewer-card">
			<div class="viewer-name">{viewer.display_name}</div>
			<div class="viewer-id">ID: {viewer.twitch_id}</div>
			<div class="stats">
				<div class="stat">
					<span class="label">Current Points</span>
					<span class="value accent">{fmt(viewer.points)}</span>
				</div>
				<div class="stat">
					<span class="label">Total Earned</span>
					<span class="value">{fmt(viewer.total_earned)}</span>
				</div>
			</div>

			{#if !showHistory}
				<button class="history-btn" onclick={loadHistory} disabled={historyLoading}>
					{historyLoading ? 'Loading…' : 'Show History'}
				</button>
			{/if}
		</div>

		{#if showHistory}
			<div class="history">
				<div class="history-header">
					<span>Transaction History</span>
					<button class="small-btn" onclick={() => (showHistory = false)}>Hide</button>
				</div>
				{#if history.length === 0}
					<p class="muted">No transactions found.</p>
				{:else}
					<ul>
						{#each history as tx (tx.id)}
							<li class="tx" class:positive={tx.amount > 0} class:negative={tx.amount < 0}>
								<span class="tx-amount">{tx.amount > 0 ? '+' : ''}{fmt(tx.amount)}</span>
								<span class="tx-reason">{tx.reason}</span>
								<span class="tx-date">{formatDate(tx.created_at)}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.viewer-lookup {
		background: var(--surface, #1e1e2e);
		border: 1px solid var(--border, #313244);
		border-radius: 8px;
		padding: 1rem 1.25rem;
	}

	.panel-header {
		margin-bottom: 0.75rem;
	}

	h2 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text, #cdd6f4);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.search-row {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	input {
		flex: 1;
		background: var(--surface2, #181825);
		border: 1px solid var(--border, #313244);
		border-radius: 4px;
		color: var(--text, #cdd6f4);
		padding: 0.4rem 0.6rem;
		font-size: 0.875rem;
		outline: none;
	}

	input:focus {
		border-color: var(--accent, #cba6f7);
	}

	button {
		background: var(--accent, #cba6f7);
		color: #11111b;
		border: none;
		border-radius: 4px;
		padding: 0.4rem 0.9rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.viewer-card {
		background: var(--surface2, #181825);
		border: 1px solid var(--border, #313244);
		border-radius: 6px;
		padding: 0.75rem 1rem;
		margin-bottom: 0.75rem;
	}

	.viewer-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text, #cdd6f4);
	}

	.viewer-id {
		font-size: 0.75rem;
		color: var(--subtext, #a6adc8);
		margin-bottom: 0.75rem;
	}

	.stats {
		display: flex;
		gap: 1.5rem;
		margin-bottom: 0.75rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--subtext, #a6adc8);
	}

	.value {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text, #cdd6f4);
	}

	.accent {
		color: var(--accent, #cba6f7);
	}

	.history-btn {
		background: none;
		border: 1px solid var(--border, #313244);
		color: var(--subtext, #a6adc8);
		font-weight: 500;
		font-size: 0.8rem;
		padding: 0.3rem 0.7rem;
	}

	.history-btn:hover:not(:disabled) {
		border-color: var(--subtext, #a6adc8);
		color: var(--text, #cdd6f4);
	}

	.history {
		background: var(--surface2, #181825);
		border: 1px solid var(--border, #313244);
		border-radius: 6px;
		padding: 0.75rem 1rem;
	}

	.history-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--subtext, #a6adc8);
		margin-bottom: 0.5rem;
	}

	.small-btn {
		background: none;
		border: 1px solid var(--border, #313244);
		color: var(--subtext, #a6adc8);
		font-size: 0.7rem;
		font-weight: 500;
		padding: 0.1rem 0.4rem;
	}

	ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		max-height: 260px;
		overflow-y: auto;
	}

	.tx {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		font-size: 0.825rem;
		padding: 0.25rem 0;
		border-bottom: 1px solid var(--border, #313244);
	}

	.tx:last-child {
		border-bottom: none;
	}

	.tx-amount {
		font-weight: 700;
		width: 3.5rem;
		flex-shrink: 0;
	}

	.tx.positive .tx-amount {
		color: var(--green, #a6e3a1);
	}

	.tx.negative .tx-amount {
		color: var(--red, #f38ba8);
	}

	.tx-reason {
		flex: 1;
		color: var(--text, #cdd6f4);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tx-date {
		color: var(--subtext, #a6adc8);
		font-size: 0.7rem;
		flex-shrink: 0;
	}

	.err {
		color: var(--red, #f38ba8);
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}

	.muted {
		color: var(--subtext, #a6adc8);
		font-size: 0.875rem;
	}
</style>
