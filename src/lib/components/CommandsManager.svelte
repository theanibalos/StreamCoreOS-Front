<script lang="ts">
	import { onMount } from 'svelte';
	import { get, post, put, del } from '$lib/api/client';
	import type {
		CommandData,
		ListCommandsResponse,
		CreateCommandResponse,
		UpdateCommandResponse,
		DeleteCommandResponse,
		ListChatVarsResponse,
		ChatVarData,
		UserLevel
	} from '$lib/types/api';

	// ── State ────────────────────────────────────────────────────────────────
	let commands = $state<CommandData[]>([]);
	let chatVars = $state<ChatVarData[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Inline-edit: which command id is being edited
	let editingId = $state<number | null>(null);
	let editResponse = $state('');
	let editCooldown = $state(0);
	let editGlobalCooldown = $state(0);
	let editUserLevel = $state<UserLevel>('everyone');
	let saving = $state(false);

	// New command form
	let showForm = $state(false);
	let newName = $state('');
	let newResponse = $state('');
	let newCooldown = $state(0);
	let newGlobalCooldown = $state(0);
	let newUserLevel = $state<UserLevel>('everyone');
	let creating = $state(false);
	let formError = $state<string | null>(null);

	const userLevels: UserLevel[] = ['everyone', 'subscriber', 'vip', 'regular', 'moderator', 'broadcaster'];

	const builtInVars = [
		'{user}', '{touser}', '{channel}', '{count}', '{random 1-100}',
		'{followage}', '{uptime}', '{game}', '{viewers}'
	];

	// ── Load ─────────────────────────────────────────────────────────────────
	async function load() {
		loading = true;
		error = null;
		try {
			const [cmdRes, varRes] = await Promise.all([
				get<ListCommandsResponse>('/chat/commands'),
				get<ListChatVarsResponse>('/chat/vars')
			]);
			commands = cmdRes.success && cmdRes.data ? cmdRes.data : [];
			chatVars = varRes.success && varRes.data ? varRes.data : [];
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	onMount(load);

	// ── Helpers ──────────────────────────────────────────────────────────────
	function insertVar(text: string, isEdit: boolean) {
		const inputId = isEdit ? 'edit-resp-input' : 'new-resp-input';
		const input = document.getElementById(inputId) as HTMLInputElement;
		if (!input) return;

		const start = input.selectionStart || 0;
		const end = input.selectionEnd || 0;
		const current = isEdit ? editResponse : newResponse;
		const newVal = current.slice(0, start) + text + current.slice(end);

		if (isEdit) editResponse = newVal;
		else newResponse = newVal;

		// Focus back and set cursor
		setTimeout(() => {
			input.focus();
			input.setSelectionRange(start + text.length, start + text.length);
		}, 0);
	}

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
				cooldown_s: newCooldown,
				global_cooldown_s: newGlobalCooldown,
				userlevel: newUserLevel
			});
			if (res.success && res.data) {
				commands = [...commands, res.data];
				newName = '';
				newResponse = '';
				newCooldown = 0;
				newGlobalCooldown = 0;
				newUserLevel = 'everyone';
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
		editGlobalCooldown = cmd.global_cooldown_s;
		editUserLevel = cmd.userlevel;
	}

	function cancelEdit() {
		editingId = null;
	}

	async function saveEdit(id: number) {
		saving = true;
		try {
			const res = await put<UpdateCommandResponse>(`/chat/commands/${id}`, {
				response: editResponse,
				cooldown_s: editCooldown,
				global_cooldown_s: editGlobalCooldown,
				userlevel: editUserLevel
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
					<input id="new-resp-input" type="text" placeholder="Bot reply…" bind:value={newResponse} />
				</label>
			</div>

			<div class="form-row">
				<label>
					Level
					<select bind:value={newUserLevel}>
						{#each userLevels as level}
							<option value={level}>{level}</option>
						{/each}
					</select>
				</label>
				<label>
					Cooldown (s)
					<input type="number" min="0" max="3600" bind:value={newCooldown} />
				</label>
				<label>
					Global CD (s)
					<input type="number" min="0" max="3600" bind:value={newGlobalCooldown} />
				</label>
			</div>

			<div class="var-pills">
				<span class="pill-label">Built-in:</span>
				{#each builtInVars as v}
					<button class="pill" onclick={() => insertVar(v, false)}>{v}</button>
				{/each}
			</div>

			{#if chatVars.length > 0}
				<div class="var-pills">
					<span class="pill-label">Stream Vars:</span>
					{#each chatVars as v}
						<button class="pill var" onclick={() => insertVar(`{var:${v.name}}`, false)}>{v.name}</button>
					{/each}
				</div>
			{/if}

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
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Response</th>
						<th>Level</th>
						<th class="center">CD (U/G)</th>
						<th class="center">Uses</th>
						<th class="center">Enabled</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each commands as cmd (cmd.id)}
						{#if editingId === cmd.id}
							<tr class="editing-row">
								<td colspan="7">
									<div class="edit-panel">
										<div class="form-row">
											<span class="mono">{cmd.name}</span>
											<input id="edit-resp-input" class="wide" type="text" bind:value={editResponse} />
										</div>
										<div class="form-row">
											<label>Level
												<select bind:value={editUserLevel}>
													{#each userLevels as level}
														<option value={level}>{level}</option>
													{/each}
												</select>
											</label>
											<label>User CD
												<input type="number" min="0" bind:value={editCooldown} />
											</label>
											<label>Global CD
												<input type="number" min="0" bind:value={editGlobalCooldown} />
											</label>
										</div>
										<div class="var-pills">
											{#each builtInVars as v}
												<button class="pill" onclick={() => insertVar(v, true)}>{v}</button>
											{/each}
											{#each chatVars as v}
												<button class="pill var" onclick={() => insertVar(`{var:${v.name}}`, true)}>{v.name}</button>
											{/each}
										</div>
										<div class="edit-actions">
											<button class="save-btn small" onclick={() => saveEdit(cmd.id)} disabled={saving}>
												{saving ? 'Saving…' : 'Save'}
											</button>
											<button class="ghost small" onclick={cancelEdit}>Cancel</button>
										</div>
									</div>
								</td>
							</tr>
						{:else}
							<tr class:disabled={!cmd.enabled}>
								<td class="mono">{cmd.name}</td>
								<td class="response">{cmd.response}</td>
								<td><span class="level-tag {cmd.userlevel}">{cmd.userlevel}</span></td>
								<td class="center muted">{cmd.cooldown_s}s / {cmd.global_cooldown_s}s</td>
								<td class="center count">{cmd.use_count}</td>
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
		</div>
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
	.form-box, .edit-panel {
		background: var(--surface2, #181825);
		border: 1px solid var(--border, #313244);
		border-radius: 6px;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.edit-panel {
		margin: 0.5rem;
		border-color: var(--accent);
	}

	h3 {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--subtext, #a6adc8);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 0.8rem;
	}

	.form-row {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-bottom: 0.8rem;
		align-items: center;
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

	label.wide, input.wide {
		flex: 1;
		min-width: 200px;
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

	select {
		min-width: 120px;
	}

	input:focus, select:focus {
		border-color: var(--accent, #cba6f7);
	}

	input[type='number'] {
		width: 6rem;
	}

	.var-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-bottom: 0.8rem;
		align-items: center;
	}

	.pill-label {
		font-size: 0.7rem;
		color: var(--subtext);
		margin-right: 0.2rem;
	}

	.pill {
		background: var(--surface);
		border: 1px solid var(--border);
		color: var(--subtext);
		border-radius: 4px;
		padding: 0.15rem 0.45rem;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.pill:hover {
		border-color: var(--accent);
		color: var(--text);
	}

	.pill.var {
		color: var(--blue);
	}

	.save-btn {
		background: var(--accent, #cba6f7);
		color: #11111b;
		border: none;
		border-radius: 4px;
		padding: 0.4rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}

	.save-btn:disabled {
		opacity: 0.4;
	}

	.edit-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	/* Table */
	.table-container {
		overflow-x: auto;
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
		padding: 0.5rem;
		border-bottom: 1px solid var(--border, #313244);
	}

	th.center,
	td.center {
		text-align: center;
	}

	td {
		padding: 0.75rem 0.5rem;
		border-bottom: 1px solid var(--border, #313244);
		color: var(--text, #cdd6f4);
		vertical-align: middle;
	}

	tr.disabled td {
		opacity: 0.5;
	}

	.mono {
		font-family: monospace;
		font-size: 0.85rem;
		color: var(--accent, #cba6f7);
		font-weight: 600;
	}

	.response {
		color: var(--subtext, #a6adc8);
		max-width: 250px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.level-tag {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
		background: #313244;
	}

	.level-tag.broadcaster { color: var(--red); }
	.level-tag.moderator { color: var(--yellow); }
	.level-tag.subscriber { color: var(--accent); }
	.level-tag.regular { color: var(--blue); }

	.count {
		font-weight: 700;
		color: var(--text);
		font-family: monospace;
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

	.danger {
		background: none;
		border: 1px solid transparent;
		color: var(--subtext, #a6adc8);
		border-radius: 4px;
		cursor: pointer;
	}

	.danger:hover {
		color: var(--red, #f38ba8);
		border-color: var(--red, #f38ba8);
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
		background: var(--green, #a6e3a1);
		color: #11111b;
	}

	.muted {
		color: var(--subtext);
		font-size: 0.8rem;
	}

	.err {
		color: var(--red);
		font-size: 0.85rem;
		margin-bottom: 0.5rem;
	}
</style>
