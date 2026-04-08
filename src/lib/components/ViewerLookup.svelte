<script lang="ts">
	import { get, post } from '$lib/api/client';
	import type {
		ViewerResponse,
		ViewerData,
		AdjustPointsResponse
	} from '$lib/types/api';

	let query = $state('');
	let viewer = $state<ViewerData | null>(null);
	let loading = $state(false);
	let adjusting = $state(false);
	let delta = $state(0);
	let error = $state<string | null>(null);

	async function lookup() {
		const id = query.trim();
		if (!id) return;
		loading = true;
		error = null;
		viewer = null;
		try {
			const res = await get<ViewerResponse>(`/viewers/${encodeURIComponent(id)}`);
			if (res.success && res.data) {
				viewer = res.data;
			} else {
				error = res.error ?? 'Viewer not found';
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
				error = 'User not found';
			} else {
				error = msg;
			}
		} finally {
			loading = false;
		}
	}

	async function adjustPoints() {
		if (!viewer || delta === 0) return;
		adjusting = true;
		error = null;
		try {
			const res = await post<AdjustPointsResponse>(`/viewers/${viewer.twitch_id}/points`, {
				delta
			});
			if (res.success && res.data) {
				await lookup(); 
				delta = 0;
			} else {
				error = res.error ?? 'Failed to adjust points';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			adjusting = false;
		}
	}

	function fmt(n: number): string {
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
		if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
		return String(n);
	}

	function formatDate(iso: string): string {
		if (!iso) return 'Never';
		return new Date(iso).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
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
		<label for="viewer-search" class="sr-only">Search Viewer</label>
		<input
			id="viewer-search"
			type="text"
			placeholder="Twitch ID or username…"
			bind:value={query}
			onkeydown={onKeydown}
		/>
		<button class="search-btn" onclick={lookup} disabled={loading || !query.trim()}>
			{loading ? '…' : 'Search'}
		</button>
	</div>

	{#if error}
		<p class="err">{error}</p>
	{/if}

	{#if viewer}
		<div class="viewer-card">
			<div class="card-header">
				<div>
					<div class="viewer-name">
						{viewer.display_name}
						{#if viewer.is_regular}
							<span class="badge">REGULAR</span>
						{/if}
					</div>
					<div class="viewer-id">ID: {viewer.twitch_id} | login: {viewer.login}</div>
				</div>
			</div>

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

			<div class="info-grid">
				<div class="info-item">
					<span class="label">First Seen</span>
					<span class="info-value">{formatDate(viewer.first_seen)}</span>
				</div>
				<div class="info-item">
					<span class="label">Last Seen</span>
					<span class="info-value">{formatDate(viewer.last_seen)}</span>
				</div>
			</div>

			<div class="adjust-points">
				<label for="delta-input" class="label">Adjust Points</label>
				<div class="adjust-row">
					<input id="delta-input" type="number" bind:value={delta} placeholder="Delta (+/-)" />
					<button onclick={adjustPoints} disabled={adjusting || delta === 0} class:positive={delta > 0} class:negative={delta < 0}>
						{adjusting ? '…' : 'Apply'}
					</button>
				</div>
			</div>
		</div>
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

	.search-btn {
		background: var(--accent, #cba6f7);
		color: #11111b;
		border: none;
		border-radius: 4px;
		padding: 0.4rem 0.9rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}

	.search-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	.viewer-card {
		background: var(--surface2, #181825);
		border: 1px solid var(--border, #313244);
		border-radius: 6px;
		padding: 0.75rem 1rem;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.75rem;
	}

	.viewer-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text, #cdd6f4);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.badge {
		font-size: 0.65rem;
		font-weight: 800;
		background: var(--blue, #89b4fa);
		color: #11111b;
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
	}

	.viewer-id {
		font-size: 0.75rem;
		color: var(--subtext, #a6adc8);
	}

	.stats {
		display: flex;
		gap: 1.5rem;
		margin-bottom: 1rem;
		padding: 0.75rem;
		background: rgba(203, 166, 247, 0.04);
		border-radius: 4px;
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
		display: block;
		margin-bottom: 0.2rem;
	}

	.value {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text, #cdd6f4);
	}

	.accent {
		color: var(--accent, #cba6f7);
	}

	.info-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.info-value {
		font-size: 0.8rem;
		color: var(--text, #cdd6f4);
	}

	.adjust-points {
		border-top: 1px solid var(--border, #313244);
		padding-top: 0.75rem;
	}

	.adjust-row {
		display: flex;
		gap: 0.5rem;
	}

	.adjust-row input {
		width: 100px;
		flex: none;
	}

	.adjust-row button {
		flex: 1;
		background: var(--surface, #1e1e2e);
		border: 1px solid var(--border, #313244);
		color: var(--text, #cdd6f4);
		border-radius: 4px;
		font-weight: 600;
		cursor: pointer;
		font-size: 0.8rem;
	}

	.adjust-row button.positive {
		border-color: var(--green, #a6e3a1);
		color: var(--green, #a6e3a1);
	}

	.adjust-row button.negative {
		border-color: var(--red, #f38ba8);
		color: var(--red, #f38ba8);
	}

	.err {
		color: var(--red, #f38ba8);
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}
</style>
