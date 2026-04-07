<script lang="ts">
	import { onMount } from 'svelte';
	import { get, post, put, del } from '$lib/api/client';
	import type {
		TimerData,
		GetTimersResponse,
		TimerResponse,
		UpdateTimerResponse,
		DeleteTimerResponse
	} from '$lib/types/api';

	// ── State ────────────────────────────────────────────────────────────────
	let timers = $state<TimerData[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Inline-edit
	let editingId = $state<number | null>(null);
	let editName = $state('');
	let editMessage = $state('');
	let editInterval = $state(10);
	let editMinLines = $state(0);
	let saving = $state(false);

	// New timer form
	let showForm = $state(false);
	let newName = $state('');
	let newMessage = $state('');
	let newInterval = $state(10);
	let newMinLines = $state(0);
	let creating = $state(false);
	let formError = $state<string | null>(null);

	// ── Load ─────────────────────────────────────────────────────────────────
	async function load() {
		loading = true;
		error = null;
		try {
			const res = await get<GetTimersResponse>('/timers');
			timers = res.success ? (res.data ?? []) : [];
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	onMount(load);

	// ── Toggle enabled ───────────────────────────────────────────────────────
	async function toggleEnabled(timer: TimerData) {
		const next = timer.enabled === 1 ? 0 : 1;
		try {
			const res = await put<UpdateTimerResponse>(`/timers/${timer.id}`, { enabled: next });
			if (res.success && res.data) {
				timers = timers.map((t) => (t.id === timer.id ? res.data! : t));
			} else {
				error = res.error ?? 'Failed to update timer.';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	// ── Create ───────────────────────────────────────────────────────────────
	async function create() {
		formError = null;
		const name = newName.trim();
		const message = newMessage.trim();
		if (!name || !message) {
			formError = 'Name and message are required.';
			return;
		}
		if (newInterval < 1) {
			formError = 'Interval must be at least 1 minute.';
			return;
		}
		creating = true;
		try {
			const res = await post<TimerResponse>('/timers', {
				name,
				message,
				interval_minutes: newInterval,
				min_lines: newMinLines
			});
			if (res.success && res.data) {
				timers = [...timers, res.data];
				newName = '';
				newMessage = '';
				newInterval = 10;
				newMinLines = 0;
				showForm = false;
			} else {
				formError = res.error ?? 'Failed to create timer.';
			}
		} catch (e) {
			formError = e instanceof Error ? e.message : String(e);
		} finally {
			creating = false;
		}
	}

	// ── Edit ─────────────────────────────────────────────────────────────────
	function startEdit(t: TimerData) {
		editingId = t.id;
		editName = t.name;
		editMessage = t.message;
		editInterval = t.interval_minutes;
		editMinLines = t.min_lines;
	}

	function cancelEdit() {
		editingId = null;
	}

	async function saveEdit(id: number) {
		saving = true;
		try {
			const res = await put<UpdateTimerResponse>(`/timers/${id}`, {
				name: editName.trim(),
				message: editMessage.trim(),
				interval_minutes: editInterval,
				min_lines: editMinLines
			});
			if (res.success && res.data) {
				timers = timers.map((t) => (t.id === id ? res.data! : t));
				editingId = null;
			} else {
				error = res.error ?? 'Failed to save.';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}

	// ── Delete ───────────────────────────────────────────────────────────────
	async function remove(id: number) {
		if (!confirm('Delete this timer?')) return;
		try {
			const res = await del<DeleteTimerResponse>(`/timers/${id}`);
			if (res.success) {
				timers = timers.filter((t) => t.id !== id);
			} else {
				error = res.error ?? 'Failed to delete.';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	function formatLast(ts: string | null): string {
		if (!ts) return '—';
		const d = new Date(ts);
		return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
</script>

<div class="manager">
	<!-- Header -->
	<div class="panel-header">
		<h2>Timers</h2>
		<div class="actions">
			<button class="refresh" onclick={load} disabled={loading}>↺</button>
			<button class="add-btn" onclick={() => (showForm = !showForm)}>
				{showForm ? '✕ Cancel' : '+ New'}
			</button>
		</div>
	</div>

	{#if error}
		<p class="err">{error}</p>
	{/if}

	<!-- New timer form -->
	{#if showForm}
		<div class="form-box">
			<h3>New Timer</h3>
			{#if formError}
				<p class="err">{formError}</p>
			{/if}
			<div class="form-row">
				<label>
					Name
					<input type="text" placeholder="My timer" bind:value={newName} />
				</label>
				<label class="wide">
					Message
					<input type="text" placeholder="Chat message…" bind:value={newMessage} />
				</label>
				<label>
					Interval (min)
					<input type="number" min="1" bind:value={newInterval} />
				</label>
				<label>
					Min lines
					<input type="number" min="0" bind:value={newMinLines} />
				</label>
			</div>
			<button class="save-btn" onclick={create} disabled={creating}>
				{creating ? 'Creating…' : 'Create'}
			</button>
		</div>
	{/if}

	<!-- Timer list -->
	{#if loading}
		<p class="muted">Loading…</p>
	{:else if timers.length === 0}
		<p class="muted">No timers yet. Create one above.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Message</th>
					<th class="center">Interval</th>
					<th class="center">Min lines</th>
					<th class="center">Last run</th>
					<th class="center">Enabled</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each timers as timer (timer.id)}
					{#if editingId === timer.id}
						<tr class="editing">
							<td>
								<input class="cell-input" type="text" bind:value={editName} />
							</td>
							<td>
								<input class="cell-input wide" type="text" bind:value={editMessage} />
							</td>
							<td class="center">
								<input class="cell-input narrow" type="number" min="1" bind:value={editInterval} />
							</td>
							<td class="center">
								<input class="cell-input narrow" type="number" min="0" bind:value={editMinLines} />
							</td>
							<td class="center muted">{formatLast(timer.last_executed_at)}</td>
							<td class="center">
								<button
									class="toggle"
									class:on={timer.enabled === 1}
									onclick={() => toggleEnabled(timer)}
								>
									{timer.enabled === 1 ? 'On' : 'Off'}
								</button>
							</td>
							<td class="row-actions">
								<button class="save-btn small" onclick={() => saveEdit(timer.id)} disabled={saving}>
									{saving ? '…' : '✓'}
								</button>
								<button class="ghost small" onclick={cancelEdit}>✕</button>
							</td>
						</tr>
					{:else}
						<tr class:disabled={timer.enabled === 0}>
							<td class="name">{timer.name}</td>
							<td class="msg">{timer.message}</td>
							<td class="center muted">{timer.interval_minutes}m</td>
							<td class="center muted">{timer.min_lines}</td>
							<td class="center muted">{formatLast(timer.last_executed_at)}</td>
							<td class="center">
								<button
									class="toggle"
									class:on={timer.enabled === 1}
									onclick={() => toggleEnabled(timer)}
								>
									{timer.enabled === 1 ? 'On' : 'Off'}
								</button>
							</td>
							<td class="row-actions">
								<button class="ghost small" onclick={() => startEdit(timer)}>✎</button>
								<button class="danger small" onclick={() => remove(timer.id)}>🗑</button>
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.manager {
		background: var(--surface, #1e1e2e);
		border: 1px solid var(--border, #313244);
		border-radius: 8px;
		padding: 1rem 1.25rem;
	}

	.panel-header {
		display: flex;
		align-items: center;
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

	.actions {
		display: flex;
		gap: 0.4rem;
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

	.refresh:hover:not(:disabled) {
		color: var(--text, #cdd6f4);
	}

	.add-btn {
		background: var(--accent, #cba6f7);
		color: #11111b;
		border: none;
		border-radius: 4px;
		padding: 0.25rem 0.75rem;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
	}

	.form-box {
		background: var(--surface2, #181825);
		border: 1px solid var(--border, #313244);
		border-radius: 6px;
		padding: 0.75rem 1rem;
		margin-bottom: 1rem;
	}

	h3 {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--subtext, #a6adc8);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 0.6rem;
	}

	.form-row {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-bottom: 0.6rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.72rem;
		color: var(--subtext, #a6adc8);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	label.wide {
		flex: 1;
		min-width: 200px;
	}

	input[type='text'],
	input[type='number'] {
		background: var(--surface, #1e1e2e);
		border: 1px solid var(--border, #313244);
		border-radius: 4px;
		color: var(--text, #cdd6f4);
		padding: 0.35rem 0.55rem;
		font-size: 0.875rem;
		outline: none;
		width: 100%;
	}

	input:focus {
		border-color: var(--accent, #cba6f7);
	}

	input[type='number'] {
		width: 6rem;
	}

	.save-btn {
		background: var(--accent, #cba6f7);
		color: #11111b;
		border: none;
		border-radius: 4px;
		padding: 0.35rem 0.9rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}

	.save-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.save-btn.small {
		padding: 0.2rem 0.5rem;
		font-size: 0.8rem;
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

	th.center,
	td.center {
		text-align: center;
	}

	td {
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border, #313244);
		color: var(--text, #cdd6f4);
		vertical-align: middle;
	}

	tr:last-child td {
		border-bottom: none;
	}

	tr.disabled td {
		opacity: 0.45;
	}

	tr.editing {
		background: rgba(203, 166, 247, 0.04);
	}

	.name {
		font-weight: 500;
		color: var(--accent, #cba6f7);
	}

	.msg {
		color: var(--subtext, #a6adc8);
		max-width: 300px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.cell-input {
		background: var(--surface2, #181825);
		border: 1px solid var(--accent, #cba6f7);
		border-radius: 3px;
		color: var(--text, #cdd6f4);
		padding: 0.2rem 0.4rem;
		font-size: 0.825rem;
		outline: none;
	}

	.cell-input.wide {
		width: 100%;
	}

	.cell-input.narrow {
		width: 4.5rem;
	}

	.row-actions {
		display: flex;
		gap: 0.3rem;
		justify-content: flex-end;
	}

	.toggle {
		font-size: 0.7rem;
		font-weight: 700;
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
		background: #45475a;
		color: #cdd6f4;
		border: none;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.toggle.on {
		background: var(--green, #a6e3a1);
		color: #11111b;
	}

	.ghost {
		background: none;
		border: 1px solid var(--border, #313244);
		color: var(--subtext, #a6adc8);
		border-radius: 4px;
		cursor: pointer;
	}

	.ghost:hover {
		border-color: var(--subtext, #a6adc8);
		color: var(--text, #cdd6f4);
	}

	.danger {
		background: none;
		border: 1px solid transparent;
		color: var(--subtext, #a6adc8);
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.8rem;
	}

	.danger:hover {
		color: var(--red, #f38ba8);
		border-color: var(--red, #f38ba8);
	}

	button.small {
		padding: 0.2rem 0.45rem;
		font-size: 0.8rem;
	}

	.muted {
		color: var(--subtext, #a6adc8);
		font-size: 0.875rem;
	}

	.err {
		color: var(--red, #f38ba8);
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}
</style>
