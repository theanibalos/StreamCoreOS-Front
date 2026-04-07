<script lang="ts">
	import { onMount } from 'svelte';
	import { get, post, put, del } from '$lib/api/client';
	import type {
		CommandData,
		ListCommandsResponse,
		CreateCommandResponse,
		UpdateCommandResponse,
		DeleteCommandResponse
	} from '$lib/types/api';

	// ── State ────────────────────────────────────────────────────────────────
	let commands = $state<CommandData[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Inline-edit: which command id is being edited
	let editingId = $state<number | null>(null);
	let editResponse = $state('');
	let editCooldown = $state(0);
	let saving = $state(false);

	// New command form
	let showForm = $state(false);
	let newName = $state('');
	let newResponse = $state('');
	let newCooldown = $state(0);
	let creating = $state(false);
	let formError = $state<string | null>(null);

	// ── Load ─────────────────────────────────────────────────────────────────
	async function load() {
		loading = true;
		error = null;
		try {
			const res = await get<ListCommandsResponse>('/chat/commands');
			commands = res.success && res.data ? res.data : [];
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	onMount(load);

	// ── Create ───────────────────────────────────────────────────────────────
	async function create() {
		formError = null;
		const name = newName.trim();
		const response = newResponse.trim();
		if (!name || !response) {
			formError = 'Name and response are required.';
			return;
		}
		if (!/^![a-z0-9_]+$/.test(name)) {
			formError = 'Name must match ^![a-z0-9_]+$';
			return;
		}
		creating = true;
		try {
			const res = await post<CreateCommandResponse>('/chat/commands', {
				name,
				response,
				cooldown_s: newCooldown
			});
			if (res.success && res.data) {
				commands = [...commands, res.data];
				newName = '';
				newResponse = '';
				newCooldown = 0;
				showForm = false;
			} else {
				formError = res.error ?? 'Failed to create command.';
			}
		} catch (e) {
			formError = e instanceof Error ? e.message : String(e);
		} finally {
			creating = false;
		}
	}

	// ── Toggle enabled ───────────────────────────────────────────────────────
	async function toggleEnabled(cmd: CommandData) {
		try {
			const res = await put<UpdateCommandResponse>(`/chat/commands/${cmd.id}`, {
				enabled: !cmd.enabled
			});
			if (res.success && res.data) {
				commands = commands.map((c) => (c.id === cmd.id ? res.data! : c));
			} else {
				error = res.error ?? 'Failed to update command.';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	// ── Edit ─────────────────────────────────────────────────────────────────
	function startEdit(cmd: CommandData) {
		editingId = cmd.id;
		editResponse = cmd.response;
		editCooldown = cmd.cooldown_s;
	}

	function cancelEdit() {
		editingId = null;
	}

	async function saveEdit(id: number) {
		saving = true;
		try {
			const res = await put<UpdateCommandResponse>(`/chat/commands/${id}`, {
				response: editResponse,
				cooldown_s: editCooldown
			});
			if (res.success && res.data) {
				commands = commands.map((c) => (c.id === id ? res.data! : c));
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
		if (!confirm('Delete this command?')) return;
		try {
			const res = await del<DeleteCommandResponse>(`/chat/commands/${id}`);
			if (res.success) {
				commands = commands.filter((c) => c.id !== id);
			} else {
				error = res.error ?? 'Failed to delete.';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}
</script>

<div class="manager">
	<!-- Header -->
	<div class="panel-header">
		<h2>Chat Commands</h2>
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

	<!-- New command form -->
	{#if showForm}
		<div class="form-box">
			<h3>New Command</h3>
			{#if formError}
				<p class="err">{formError}</p>
			{/if}
			<div class="form-row">
				<label>
					Name
					<input
						type="text"
						placeholder="!command"
						bind:value={newName}
						pattern="^![a-z0-9_]+$"
					/>
				</label>
				<label class="wide">
					Response
					<input type="text" placeholder="Bot reply…" bind:value={newResponse} />
				</label>
				<label>
					Cooldown (s)
					<input type="number" min="0" max="3600" bind:value={newCooldown} />
				</label>
			</div>
			<button class="save-btn" onclick={create} disabled={creating}>
				{creating ? 'Creating…' : 'Create'}
			</button>
		</div>
	{/if}

	<!-- Command list -->
	{#if loading}
		<p class="muted">Loading…</p>
	{:else if commands.length === 0}
		<p class="muted">No commands yet. Create one above.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Response</th>
					<th class="center">Cooldown</th>
					<th class="center">Enabled</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each commands as cmd (cmd.id)}
					{#if editingId === cmd.id}
						<tr class="editing">
							<td class="mono">{cmd.name}</td>
							<td>
								<input class="cell-input wide" type="text" bind:value={editResponse} />
							</td>
							<td class="center">
								<input class="cell-input narrow" type="number" min="0" max="3600" bind:value={editCooldown} />
							</td>
							<td class="center">
								<button
									class="toggle"
									class:on={cmd.enabled}
									onclick={() => toggleEnabled(cmd)}
								>
									{cmd.enabled ? 'On' : 'Off'}
								</button>
							</td>
							<td class="row-actions">
								<button class="save-btn small" onclick={() => saveEdit(cmd.id)} disabled={saving}>
									{saving ? '…' : '✓'}
								</button>
								<button class="ghost small" onclick={cancelEdit}>✕</button>
							</td>
						</tr>
					{:else}
						<tr class:disabled={!cmd.enabled}>
							<td class="mono">{cmd.name}</td>
							<td class="response">{cmd.response}</td>
							<td class="center muted">{cmd.cooldown_s}s</td>
							<td class="center">
								<button
									class="toggle"
									class:on={cmd.enabled}
									onclick={() => toggleEnabled(cmd)}
								>
									{cmd.enabled ? 'On' : 'Off'}
								</button>
							</td>
							<td class="row-actions">
								<button class="ghost small" onclick={() => startEdit(cmd)}>✎</button>
								<button class="danger small" onclick={() => remove(cmd.id)}>🗑</button>
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

	/* Form */
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

	/* Table */
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

	.mono {
		font-family: monospace;
		font-size: 0.8rem;
		color: var(--accent, #cba6f7);
	}

	.response {
		color: var(--subtext, #a6adc8);
		max-width: 320px;
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
