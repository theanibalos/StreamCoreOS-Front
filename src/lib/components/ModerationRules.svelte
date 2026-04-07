<script lang="ts">
	import { onMount } from 'svelte';
	import { get, post, put, del } from '$lib/api/client';
	import type {
		ModRuleData,
		ListModRulesResponse,
		CreateModRuleResponse,
		UpdateModRuleResponse,
		DeleteModRuleResponse
	} from '$lib/types/api';

	const RULE_TYPES = ['word_filter', 'link_filter', 'caps_filter', 'spam_filter'] as const;
	const ACTIONS = ['timeout', 'ban', 'delete'] as const;

	// ── State ─────────────────────────────────────────────────────────────────
	let rules = $state<ModRuleData[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Inline edit
	let editingId = $state<number | null>(null);
	let editValue = $state('');
	let editAction = $state<string>('timeout');
	let editDuration = $state(600);
	let editEnabled = $state(true);
	let saving = $state(false);

	// New rule form
	let showForm = $state(false);
	let newType = $state<string>('word_filter');
	let newValue = $state('');
	let newAction = $state<string>('timeout');
	let newDuration = $state(600);
	let creating = $state(false);
	let formError = $state<string | null>(null);

	// ── Load ──────────────────────────────────────────────────────────────────
	async function load() {
		loading = true;
		error = null;
		try {
			const res = await get<ListModRulesResponse>('/moderation/rules');
			rules = res.success && res.data ? res.data : [];
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	onMount(load);

	// ── Create ────────────────────────────────────────────────────────────────
	async function create() {
		formError = null;
		creating = true;
		try {
			const body: Record<string, unknown> = {
				type: newType,
				action: newAction
			};
			if (newValue.trim()) body.value = newValue.trim();
			if (newAction === 'timeout') body.duration_s = newDuration;

			const res = await post<CreateModRuleResponse>('/moderation/rules', body);
			if (res.success && res.data) {
				rules = [...rules, res.data];
				newValue = '';
				newAction = 'timeout';
				newDuration = 600;
				showForm = false;
			} else {
				formError = res.error ?? 'Failed to create rule.';
			}
		} catch (e) {
			formError = e instanceof Error ? e.message : String(e);
		} finally {
			creating = false;
		}
	}

	// ── Edit ──────────────────────────────────────────────────────────────────
	function startEdit(rule: ModRuleData) {
		editingId = rule.id;
		editValue = rule.value ?? '';
		editAction = rule.action;
		editDuration = rule.duration_s ?? 600;
		editEnabled = rule.enabled;
	}

	function cancelEdit() {
		editingId = null;
	}

	async function saveEdit(id: number) {
		saving = true;
		try {
			const body: Record<string, unknown> = {
				value: editValue || null,
				action: editAction,
				enabled: editEnabled
			};
			if (editAction === 'timeout') body.duration_s = editDuration;

			const res = await put<UpdateModRuleResponse>(`/moderation/rules/${id}`, body);
			if (res.success && res.data) {
				rules = rules.map((r) => (r.id === id ? res.data! : r));
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

	// ── Delete ────────────────────────────────────────────────────────────────
	async function remove(id: number) {
		if (!confirm('Delete this rule?')) return;
		try {
			const res = await del<DeleteModRuleResponse>(`/moderation/rules/${id}`);
			if (res.success) {
				rules = rules.filter((r) => r.id !== id);
			} else {
				error = res.error ?? 'Failed to delete.';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	function typeLabel(t: string) {
		return t.replace(/_/g, ' ');
	}

	function actionColor(a: string) {
		if (a === 'ban') return '#f38ba8';
		if (a === 'timeout') return '#f9e2af';
		return '#89b4fa';
	}
</script>

<div class="mod-rules">
	<div class="panel-header">
		<h2>Auto-Mod Rules</h2>
		<div class="actions">
			<button class="refresh" onclick={load} disabled={loading}>↺</button>
			<button class="add-btn" onclick={() => (showForm = !showForm)}>
				{showForm ? '✕ Cancel' : '+ New'}
			</button>
		</div>
	</div>

	{#if error}<p class="err">{error}</p>{/if}

	<!-- New rule form -->
	{#if showForm}
		<div class="form-box">
			<h3>New Rule</h3>
			{#if formError}<p class="err">{formError}</p>{/if}
			<div class="form-row">
				<label>
					Type
					<select bind:value={newType}>
						{#each RULE_TYPES as t (t)}
							<option value={t}>{typeLabel(t)}</option>
						{/each}
					</select>
				</label>
				<label class="wide">
					Value <span class="hint">(keywords, threshold…)</span>
					<input type="text" placeholder="e.g. badword1,badword2" bind:value={newValue} />
				</label>
				<label>
					Action
					<select bind:value={newAction}>
						{#each ACTIONS as a (a)}
							<option value={a}>{a}</option>
						{/each}
					</select>
				</label>
				{#if newAction === 'timeout'}
					<label>
						Duration (s)
						<input type="number" min="1" max="1209600" bind:value={newDuration} />
					</label>
				{/if}
			</div>
			<button class="save-btn" onclick={create} disabled={creating}>
				{creating ? 'Creating…' : 'Create'}
			</button>
		</div>
	{/if}

	<!-- Rules table -->
	{#if loading}
		<p class="muted">Loading…</p>
	{:else if rules.length === 0}
		<p class="muted">No rules configured.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Type</th>
					<th>Value</th>
					<th class="center">Action</th>
					<th class="center">Duration</th>
					<th class="center">On</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each rules as rule (rule.id)}
					{#if editingId === rule.id}
						<tr class="editing">
							<td class="type-label">{typeLabel(rule.type)}</td>
							<td><input class="cell-input wide" type="text" bind:value={editValue} placeholder="—" /></td>
							<td class="center">
								<select class="cell-select" bind:value={editAction}>
									{#each ACTIONS as a (a)}<option value={a}>{a}</option>{/each}
								</select>
							</td>
							<td class="center">
								{#if editAction === 'timeout'}
									<input class="cell-input narrow" type="number" min="1" max="1209600" bind:value={editDuration} />
								{:else}
									<span class="muted">—</span>
								{/if}
							</td>
							<td class="center"><input type="checkbox" bind:checked={editEnabled} /></td>
							<td class="row-actions">
								<button class="save-btn small" onclick={() => saveEdit(rule.id)} disabled={saving}>
									{saving ? '…' : '✓'}
								</button>
								<button class="ghost small" onclick={cancelEdit}>✕</button>
							</td>
						</tr>
					{:else}
						<tr class:disabled={!rule.enabled}>
							<td class="type-label">{typeLabel(rule.type)}</td>
							<td class="value-cell">{rule.value ?? '—'}</td>
							<td class="center">
								<span class="action-badge" style="color:{actionColor(rule.action)}">{rule.action}</span>
							</td>
							<td class="center muted">{rule.action === 'timeout' ? `${rule.duration_s}s` : '—'}</td>
							<td class="center">
								<span class="pill" class:on={rule.enabled}>{rule.enabled ? 'On' : 'Off'}</span>
							</td>
							<td class="row-actions">
								<button class="ghost small" onclick={() => startEdit(rule)}>✎</button>
								<button class="danger small" onclick={() => remove(rule.id)}>🗑</button>
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.mod-rules {
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

	.refresh:hover:not(:disabled) { color: var(--text, #cdd6f4); }

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
		align-items: flex-end;
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

	label.wide { flex: 1; min-width: 180px; }

	.hint {
		font-size: 0.65rem;
		text-transform: none;
		color: #585b70;
	}

	input[type='text'],
	input[type='number'],
	select {
		background: var(--surface, #1e1e2e);
		border: 1px solid var(--border, #313244);
		border-radius: 4px;
		color: var(--text, #cdd6f4);
		padding: 0.35rem 0.55rem;
		font-size: 0.875rem;
		outline: none;
	}

	input[type='number'] { width: 7rem; }
	select { width: 100%; }

	input:focus, select:focus { border-color: var(--accent, #cba6f7); }

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

	.save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
	.save-btn.small { padding: 0.2rem 0.5rem; font-size: 0.8rem; }

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

	th.center, td.center { text-align: center; }

	td {
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border, #313244);
		color: var(--text, #cdd6f4);
		vertical-align: middle;
	}

	tr:last-child td { border-bottom: none; }
	tr.disabled td { opacity: 0.4; }
	tr.editing { background: rgba(203, 166, 247, 0.04); }

	.type-label {
		font-size: 0.8rem;
		color: var(--subtext, #a6adc8);
		text-transform: capitalize;
		white-space: nowrap;
	}

	.value-cell {
		font-family: monospace;
		font-size: 0.8rem;
		color: var(--text, #cdd6f4);
		max-width: 220px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.action-badge {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
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

	.cell-input.wide { width: 100%; }
	.cell-input.narrow { width: 5rem; }

	.cell-select {
		background: var(--surface2, #181825);
		border: 1px solid var(--accent, #cba6f7);
		border-radius: 3px;
		color: var(--text, #cdd6f4);
		padding: 0.2rem 0.3rem;
		font-size: 0.8rem;
		outline: none;
	}

	.row-actions {
		display: flex;
		gap: 0.3rem;
		justify-content: flex-end;
	}

	.ghost {
		background: none;
		border: 1px solid var(--border, #313244);
		color: var(--subtext, #a6adc8);
		border-radius: 4px;
		cursor: pointer;
	}

	.ghost:hover { border-color: var(--subtext); color: var(--text); }

	.danger {
		background: none;
		border: 1px solid transparent;
		color: var(--subtext, #a6adc8);
		border-radius: 4px;
		cursor: pointer;
	}

	.danger:hover { color: var(--red, #f38ba8); border-color: var(--red, #f38ba8); }

	button.small { padding: 0.2rem 0.45rem; font-size: 0.8rem; }

	.pill {
		font-size: 0.7rem;
		font-weight: 700;
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
		background: #45475a;
		color: #cdd6f4;
	}

	.pill.on { background: #a6e3a1; color: #11111b; }

	.muted { color: var(--subtext, #a6adc8); font-size: 0.875rem; }
	.err { color: var(--red, #f38ba8); font-size: 0.875rem; margin-bottom: 0.5rem; }
</style>
