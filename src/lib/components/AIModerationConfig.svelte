<script lang="ts">
	import { onMount } from 'svelte';
	import { get, post, put, del } from '$lib/api/client';
	import type { ApiResponse } from '$lib/types/api';

	interface AIConfigData {
		provider: string;
		endpoint_url: string;
		model: string;
		has_api_key: boolean;
	}

	interface ModRuleData {
		id: number;
		type: string;
		value: string | null;
		action: string;
		duration_s: number | null;
		enabled: boolean;
	}

	type GetAIConfigResponse = ApiResponse<AIConfigData>;
	type ListModRulesResponse = ApiResponse<ModRuleData[]>;
	type CreateModRuleResponse = ApiResponse<ModRuleData>;
	type UpdateModRuleResponse = ApiResponse<ModRuleData>;
	type DeleteModRuleResponse = ApiResponse<null>;

	const ACTIONS = ['timeout', 'ban', 'delete'] as const;

	// ── State ─────────────────────────────────────────────────────────────────
	let rules = $state<ModRuleData[]>([]);
	let aiConfigured = $state(false);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// New rule form
	let showForm = $state(false);
	let newPrompt = $state('');
	let newAction = $state<string>('timeout');
	let newDuration = $state(600);
	let creating = $state(false);
	let formError = $state<string | null>(null);

	// Inline edit
	let editingId = $state<number | null>(null);
	let editPrompt = $state('');
	let editAction = $state('timeout');
	let editDuration = $state(600);
	let saving = $state(false);

	// ── Load ──────────────────────────────────────────────────────────────────
	async function load() {
		loading = true;
		error = null;
		try {
			const [rulesRes, aiRes] = await Promise.all([
				get<ListModRulesResponse>('/moderation/rules'),
				get<GetAIConfigResponse>('/ai/config')
			]);
			const all = rulesRes.success && rulesRes.data ? rulesRes.data : [];
			rules = all.filter((r) => r.type === 'ai_filter');
			aiConfigured = Boolean(aiRes.success && aiRes.data?.endpoint_url && aiRes.data?.model);
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	onMount(load);

	// ── Create ────────────────────────────────────────────────────────────────
	async function create() {
		if (!newPrompt.trim()) {
			formError = 'The detection prompt is required.';
			return;
		}
		creating = true;
		formError = null;
		try {
			const body: Record<string, unknown> = {
				type: 'ai_filter',
				value: newPrompt.trim(),
				action: newAction
			};
			if (newAction === 'timeout') body.duration_s = newDuration;

			const res = await post<CreateModRuleResponse>('/moderation/rules', body);
			if (res.success && res.data) {
				rules = [...rules, res.data];
				newPrompt = '';
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

	// ── Toggle enabled ────────────────────────────────────────────────────────
	async function toggleEnabled(rule: ModRuleData) {
		try {
			const res = await put<UpdateModRuleResponse>(`/moderation/rules/${rule.id}`, {
				enabled: !rule.enabled
			});
			if (res.success && res.data) {
				rules = rules.map((r) => (r.id === rule.id ? res.data! : r));
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	// ── Edit ──────────────────────────────────────────────────────────────────
	function startEdit(rule: ModRuleData) {
		editingId = rule.id;
		editPrompt = rule.value ?? '';
		editAction = rule.action;
		editDuration = rule.duration_s ?? 600;
	}

	function cancelEdit() {
		editingId = null;
	}

	async function saveEdit(id: number) {
		saving = true;
		try {
			const body: Record<string, unknown> = {
				value: editPrompt.trim(),
				action: editAction
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
		if (!confirm('Delete this AI rule?')) return;
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
</script>

<div class="panel">
	<div class="panel-header">
		<div class="title-row">
			<h2>AI Moderation</h2>
			{#if !loading}
				<span class="badge" class:active={aiConfigured}>
					{aiConfigured ? '● Active' : '○ No AI configured'}
				</span>
			{/if}
		</div>
		<div class="actions">
			<button class="refresh" onclick={load} disabled={loading}>↺</button>
			<button class="add-btn" onclick={() => (showForm = !showForm)}>
				{showForm ? '✕ Cancel' : '+ New Rule'}
			</button>
		</div>
	</div>

	{#if !aiConfigured && !loading}
		<div class="notice">
			Configure an AI provider above to enable AI moderation rules.
		</div>
	{/if}

	{#if error}
		<p class="err">{error}</p>
	{/if}

	<!-- New rule form -->
	{#if showForm}
		<div class="form-box">
			<h3>New AI Rule</h3>
			{#if formError}<p class="err">{formError}</p>{/if}

			<div class="field">
				<label for="new-prompt">Detection prompt</label>
				<textarea
					id="new-prompt"
					rows="3"
					placeholder="Describe what to detect, e.g.: 'Detect hate speech, insults or threats directed at other users.'"
					bind:value={newPrompt}
				></textarea>
				<span class="hint">
					The AI evaluates each message with this prompt and responds TRUE to enforce the action.
				</span>
			</div>

			<div class="form-row">
				<div class="field">
					<label for="new-action">Action</label>
					<select id="new-action" bind:value={newAction}>
						{#each ACTIONS as a}
							<option value={a}>{a}</option>
						{/each}
					</select>
				</div>
				{#if newAction === 'timeout'}
					<div class="field">
						<label for="new-duration">Duration (s)</label>
						<input id="new-duration" type="number" min="1" max="1209600" bind:value={newDuration} />
					</div>
				{/if}
			</div>

			<button class="save-btn" onclick={create} disabled={creating}>
				{creating ? 'Creating…' : 'Create'}
			</button>
		</div>
	{/if}

	<!-- Rules list -->
	{#if loading}
		<p class="muted">Loading…</p>
	{:else if rules.length === 0}
		<p class="muted">No AI rules yet. Create one to get started.</p>
	{:else}
		<div class="rules">
			{#each rules as rule (rule.id)}
				{#if editingId === rule.id}
					<div class="rule-card editing">
						<div class="field">
							<label for="edit-prompt-{rule.id}">Detection prompt</label>
							<textarea
								id="edit-prompt-{rule.id}"
								rows="3"
								bind:value={editPrompt}
							></textarea>
						</div>
						<div class="form-row">
							<div class="field">
								<label for="edit-action-{rule.id}">Action</label>
								<select id="edit-action-{rule.id}" bind:value={editAction}>
									{#each ACTIONS as a}
										<option value={a}>{a}</option>
									{/each}
								</select>
							</div>
							{#if editAction === 'timeout'}
								<div class="field">
									<label for="edit-duration-{rule.id}">Duration (s)</label>
									<input id="edit-duration-{rule.id}" type="number" min="1" bind:value={editDuration} />
								</div>
							{/if}
						</div>
						<div class="edit-actions">
							<button class="save-btn small" onclick={() => saveEdit(rule.id)} disabled={saving}>
								{saving ? 'Saving…' : 'Save'}
							</button>
							<button class="ghost small" onclick={cancelEdit}>Cancel</button>
						</div>
					</div>
				{:else}
					<div class="rule-card" class:disabled={!rule.enabled}>
						<div class="rule-prompt">{rule.value ?? '(no prompt)'}</div>
						<div class="rule-meta">
							<span class="action-tag {rule.action}">{rule.action}</span>
							{#if rule.action === 'timeout' && rule.duration_s}
								<span class="muted">{rule.duration_s}s</span>
							{/if}
							<div class="spacer"></div>
							<button class="toggle" class:on={rule.enabled} onclick={() => toggleEnabled(rule)}>
								{rule.enabled ? 'On' : 'Off'}
							</button>
							<button class="ghost small" onclick={() => startEdit(rule)}>✎</button>
							<button class="danger small" onclick={() => remove(rule.id)}>🗑</button>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.panel {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 1rem 1.25rem;
	}

	.panel-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 1rem;
		gap: 0.5rem;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	h2 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	h3 {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--subtext);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 0.8rem;
	}

	.badge {
		font-size: 0.72rem;
		color: var(--subtext);
	}

	.badge.active {
		color: var(--green);
	}

	.actions {
		display: flex;
		gap: 0.4rem;
		flex-shrink: 0;
	}

	.notice {
		background: rgba(249, 226, 175, 0.07);
		border: 1px solid rgba(249, 226, 175, 0.2);
		color: var(--yellow);
		border-radius: 4px;
		padding: 0.6rem 0.8rem;
		font-size: 0.8rem;
		margin-bottom: 1rem;
	}

	.form-box {
		background: var(--surface2);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		margin-bottom: 0.8rem;
	}

	label {
		font-size: 0.72rem;
		color: var(--subtext);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	textarea {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text);
		padding: 0.4rem 0.6rem;
		font-size: 0.875rem;
		outline: none;
		resize: vertical;
		font-family: inherit;
		line-height: 1.5;
		width: 100%;
	}

	textarea:focus {
		border-color: var(--accent);
	}

	select,
	input[type='number'] {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text);
		padding: 0.35rem 0.55rem;
		font-size: 0.875rem;
		outline: none;
	}

	select:focus,
	input:focus {
		border-color: var(--accent);
	}

	input[type='number'] {
		width: 7rem;
	}

	.form-row {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		align-items: flex-end;
	}

	.hint {
		font-size: 0.7rem;
		color: var(--subtext);
	}

	/* Rules */
	.rules {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.rule-card {
		background: var(--surface2);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.75rem 1rem;
	}

	.rule-card.editing {
		border-color: var(--accent);
	}

	.rule-card.disabled {
		opacity: 0.5;
	}

	.rule-prompt {
		font-size: 0.85rem;
		color: var(--text);
		line-height: 1.5;
		margin-bottom: 0.6rem;
		white-space: pre-wrap;
	}

	.rule-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.spacer {
		flex: 1;
	}

	.action-tag {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
		background: #313244;
	}

	.action-tag.ban { color: var(--red); }
	.action-tag.timeout { color: var(--yellow); }
	.action-tag.delete { color: var(--blue); }

	.edit-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	/* Buttons */
	.refresh {
		background: none;
		border: 1px solid var(--border);
		color: var(--subtext);
		border-radius: 4px;
		padding: 0.2rem 0.5rem;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.add-btn {
		background: var(--accent);
		color: #11111b;
		border: none;
		border-radius: 4px;
		padding: 0.25rem 0.75rem;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
	}

	.save-btn {
		background: var(--accent);
		color: #11111b;
		border: none;
		border-radius: 4px;
		padding: 0.4rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}

	.save-btn.small {
		padding: 0.25rem 0.65rem;
		font-size: 0.8rem;
	}

	.save-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.ghost {
		background: none;
		border: 1px solid var(--border);
		color: var(--subtext);
		border-radius: 4px;
		padding: 0.2rem 0.5rem;
		cursor: pointer;
		font-size: 0.8rem;
	}

	.danger {
		background: none;
		border: 1px solid transparent;
		color: var(--subtext);
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.8rem;
		padding: 0.2rem 0.5rem;
	}

	.danger:hover {
		color: var(--red);
		border-color: var(--red);
	}

	.toggle {
		font-size: 0.7rem;
		font-weight: 700;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		background: #45475a;
		color: #cdd6f4;
		border: none;
		cursor: pointer;
	}

	.toggle.on {
		background: var(--green);
		color: #11111b;
	}

	.muted {
		color: var(--subtext);
		font-size: 0.8rem;
	}

	.err {
		color: var(--red);
		font-size: 0.85rem;
		margin-bottom: 0.75rem;
	}
</style>
