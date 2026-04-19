<script lang="ts">
	import { onMount } from 'svelte';
	import { get, put, del } from '$lib/api/client';

	interface Voice {
		id: string;
		name: string;
		gender: string;
		locale: string;
		provider: string;
	}

	interface UserVoice {
		id: number;
		twitch_id: string;
		twitch_login: string;
		voice_id: string;
		voice_name: string;
		updated_at: string;
	}

	// ── State ──────────────────────────────────────────────────────────────────
	let assignments  = $state<UserVoice[]>([]);
	let voices       = $state<Voice[]>([]);
	let loading      = $state(true);
	let saving       = $state<string | null>(null); // twitch_login being saved
	let error        = $state<string | null>(null);
	let localeFilter = $state('es');
	let search       = $state('');
	// Local selection state — tracks pending voice change per user, separate from DB state
	let pendingVoice = $state<Record<string, string>>({});

	// ── Load ───────────────────────────────────────────────────────────────────
	onMount(async () => {
		await Promise.all([loadAssignments(), loadVoices()]);
		loading = false;
	});

	async function loadAssignments() {
		const res = await get<{ success: boolean; data: UserVoice[] }>('/tts/user-voices');
		if (res.success) {
			assignments = res.data ?? [];
			// Seed pending state from DB so selects show the correct current voice
			pendingVoice = Object.fromEntries(assignments.map((a) => [a.twitch_id, a.voice_id]));
		}
	}

	async function loadVoices() {
		const res = await get<{ success: boolean; data: Voice[] }>(
			`/tts/voices?locale=${localeFilter}`
		);
		if (res.success) voices = res.data ?? [];
	}

	// ── Actions ────────────────────────────────────────────────────────────────

	// Called only when user clicks "Guardar" — never fires automatically
	async function saveVoice(assignment: UserVoice) {
		const newVoiceId = pendingVoice[assignment.twitch_id];
		if (!newVoiceId || newVoiceId === assignment.voice_id) return;

		const voice = voices.find((v) => v.id === newVoiceId);
		if (!voice) return;

		saving = assignment.twitch_login;
		error  = null;
		try {
			const res = await put<{ success: boolean; data: UserVoice }>('/tts/user-voices', {
				twitch_id:    assignment.twitch_id,
				twitch_login: assignment.twitch_login,
				voice_id:     voice.id,
				voice_name:   voice.name
			});
			if (res.success && res.data) {
				assignments = assignments.map((a) =>
					a.twitch_id === assignment.twitch_id ? res.data! : a
				);
				// Sync pending back to saved state
				pendingVoice[assignment.twitch_id] = voice.id;
			}
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Error al cambiar la voz';
			// Revert select to current DB value on error
			pendingVoice[assignment.twitch_id] = assignment.voice_id;
		} finally {
			saving = null;
		}
	}

	async function removeAssignment(login: string) {
		saving = login;
		try {
			await del(`/tts/user-voices/${login}`);
			assignments = assignments.filter((a) => a.twitch_login !== login);
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Error al eliminar';
		} finally {
			saving = null;
		}
	}

	// ── Computed ───────────────────────────────────────────────────────────────
	const filtered = $derived(
		search.trim()
			? assignments.filter((a) =>
					a.twitch_login.toLowerCase().includes(search.toLowerCase())
				)
			: assignments
	);

	async function onLocaleChange() {
		await loadVoices();
	}
</script>

<div class="section">
	<div class="toolbar">
		<input
			class="search"
			type="text"
			placeholder="Buscar usuario..."
			bind:value={search}
		/>
		<div class="locale-wrap">
			<label for="locale-filter">Locale voces</label>
			<input
				id="locale-filter"
				class="locale-input"
				type="text"
				placeholder="es"
				bind:value={localeFilter}
				onchange={onLocaleChange}
			/>
		</div>
	</div>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	{#if loading}
		<p class="muted">Cargando...</p>
	{:else if filtered.length === 0}
		<p class="muted">
			{search ? 'Sin resultados.' : 'Ningún usuario tiene voz asignada todavía. Los viewers pueden usar !voz en el chat.'}
		</p>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Usuario</th>
						<th>Voz asignada</th>
						<th>Cambiar voz</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each filtered as a (a.twitch_id)}
						<tr>
							<td class="login">{a.twitch_login}</td>
							<td>
								<span class="voice-badge">{a.voice_id}</span>
							</td>
							<td class="td-select">
								<select
									class="voice-select"
									bind:value={pendingVoice[a.twitch_id]}
									disabled={saving === a.twitch_login}
								>
									{#each voices as v (v.id)}
										<option value={v.id}>{v.name} ({v.gender[0]})</option>
									{/each}
								</select>
								{#if pendingVoice[a.twitch_id] !== a.voice_id}
									<button
										class="btn-save"
										disabled={saving === a.twitch_login}
										onclick={() => saveVoice(a)}
									>
										{saving === a.twitch_login ? '...' : 'Guardar'}
									</button>
								{/if}
							</td>
							<td>
								<button
									class="btn-remove"
									disabled={saving === a.twitch_login}
									onclick={() => removeAssignment(a.twitch_login)}
								>
									Reset
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.section { display: flex; flex-direction: column; gap: 1rem; }

	.toolbar {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.search {
		flex: 1;
		min-width: 160px;
		padding: 0.4rem 0.75rem;
		background: var(--surface2, #1e1e2e);
		border: 1px solid var(--border, #333);
		border-radius: 6px;
		color: var(--text, #cdd6f4);
		font-size: 0.875rem;
	}

	.locale-wrap {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
		color: var(--subtext, #a6adc8);
	}

	.locale-input {
		width: 60px;
		padding: 0.4rem 0.5rem;
		background: var(--surface2, #1e1e2e);
		border: 1px solid var(--border, #333);
		border-radius: 6px;
		color: var(--text, #cdd6f4);
		font-size: 0.875rem;
	}

	.table-wrap { overflow-x: auto; }

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	th {
		text-align: left;
		padding: 0.5rem 0.75rem;
		color: var(--subtext, #a6adc8);
		font-weight: 500;
		border-bottom: 1px solid var(--border, #333);
	}

	td {
		padding: 0.55rem 0.75rem;
		border-bottom: 1px solid var(--border-subtle, #2a2a3e);
		color: var(--text, #cdd6f4);
	}

	.login { font-weight: 600; color: var(--accent, #cba6f7); }

	.voice-badge {
		font-size: 0.75rem;
		background: var(--surface2, #1e1e2e);
		border: 1px solid var(--border, #333);
		border-radius: 4px;
		padding: 2px 6px;
		font-family: monospace;
	}

	.td-select {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.voice-select {
		padding: 0.3rem 0.5rem;
		background: var(--surface2, #1e1e2e);
		border: 1px solid var(--border, #333);
		border-radius: 6px;
		color: var(--text, #cdd6f4);
		font-size: 0.8rem;
		max-width: 240px;
	}

	.btn-save {
		padding: 0.3rem 0.7rem;
		background: var(--accent, #cba6f7);
		border: none;
		border-radius: 6px;
		color: #1e1e2e;
		cursor: pointer;
		font-size: 0.78rem;
		font-weight: 600;
		white-space: nowrap;
	}
	.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

	.btn-remove {
		padding: 0.3rem 0.7rem;
		background: transparent;
		border: 1px solid var(--border, #333);
		border-radius: 6px;
		color: var(--subtext, #a6adc8);
		cursor: pointer;
		font-size: 0.8rem;
		transition: border-color 0.15s, color 0.15s;
	}
	.btn-remove:hover:not(:disabled) {
		border-color: var(--red, #f38ba8);
		color: var(--red, #f38ba8);
	}
	.btn-remove:disabled { opacity: 0.4; cursor: not-allowed; }

	.muted { color: var(--subtext, #a6adc8); font-size: 0.875rem; }
	.error { color: var(--red, #f38ba8); font-size: 0.875rem; }
</style>
