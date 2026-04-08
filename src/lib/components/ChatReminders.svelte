<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from '$lib/api/client';
	import type { ListRemindersResponse, ReminderData } from '$lib/types/api';

	let reminders = $state<ReminderData[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function load() {
		try {
			const res = await get<ListRemindersResponse>('/chat/reminders');
			reminders = res.success && res.data ? res.data : [];
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		load();
		const interval = setInterval(load, 30_000);
		return () => clearInterval(interval);
	});

	function formatRunAt(iso: string) {
		const date = new Date(iso);
		const now = new Date();
		const diff = date.getTime() - now.getTime();
		const mins = Math.round(diff / 60000);

		if (mins <= 0) return 'Any moment now';
		if (mins < 60) return `in ${mins}m`;
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
</script>

<div class="reminders">
	<div class="panel-header">
		<h2>Active Reminders</h2>
		<button class="refresh" onclick={load} disabled={loading}>↺</button>
	</div>

	{#if loading && reminders.length === 0}
		<p class="muted">Loading…</p>
	{:else if error}
		<p class="err">{error}</p>
	{:else if reminders.length === 0}
		<p class="muted">No active reminders.</p>
	{:else}
		<div class="list">
			{#each reminders as r (r.job_id)}
				<div class="reminder-card">
					<p class="msg">"{r.message}"</p>
					<div class="meta">
						<span class="by">by {r.scheduled_by}</span>
						<span class="at" title={new Date(r.run_at).toLocaleString()}>
							{formatRunAt(r.run_at)}
						</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.reminders {
		background: var(--surface, #1e1e2e);
		border: 1px solid var(--border, #313244);
		border-radius: 8px;
		padding: 1rem 1.25rem;
		margin-top: 1rem;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	h2 {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text, #cdd6f4);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.refresh {
		background: none;
		border: 1px solid var(--border, #313244);
		color: var(--subtext, #a6adc8);
		border-radius: 4px;
		padding: 0.1rem 0.4rem;
		cursor: pointer;
		font-size: 0.8rem;
	}

	.list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 0.75rem;
	}

	.reminder-card {
		background: var(--surface2, #181825);
		border: 1px solid var(--border, #313244);
		border-radius: 6px;
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.msg {
		font-size: 0.875rem;
		color: var(--text, #cdd6f4);
		font-style: italic;
		line-height: 1.4;
	}

	.meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.75rem;
	}

	.by {
		color: var(--accent, #cba6f7);
		font-weight: 600;
	}

	.at {
		color: var(--blue, #89b4fa);
		font-weight: 700;
		background: rgba(137, 180, 250, 0.1);
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
	}

	.muted {
		color: var(--subtext);
		font-size: 0.8rem;
	}

	.err {
		color: var(--red);
		font-size: 0.8rem;
	}
</style>
