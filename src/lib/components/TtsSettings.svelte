<script lang="ts">
	import { onMount } from 'svelte';
	import { get, put } from '$lib/api/client';

	interface TtsSettingsData {
		enabled:            boolean;
		default_voice:      string;
		max_message_length: number;
		skip_commands:      boolean;
		skip_links:         boolean;
		sub_only:           boolean;
		mod_bypass:         boolean;
		cooldown_seconds:   number;
		blocked_words:      string[];
		redemption_title:   string;
		providers:          Record<string, boolean>;
		updated_at:         string;
	}

	// ── State ──────────────────────────────────────────────────────────────────
	let settings   = $state<TtsSettingsData | null>(null);
	let loading    = $state(true);
	let saving     = $state(false);
	let success    = $state(false);
	let error      = $state<string | null>(null);
	let newWord    = $state('');

	onMount(async () => {
		await loadSettings();
		loading = false;
	});

	async function loadSettings() {
		const res = await get<{ success: boolean; data: TtsSettingsData }>('/tts/settings');
		if (res.success && res.data) settings = res.data;
	}

	async function save() {
		if (!settings) return;
		saving = true;
		error  = null;
		try {
			const res = await put<{ success: boolean; data: TtsSettingsData; error?: string }>(
				'/tts/settings',
				{
					enabled:            settings.enabled,
					default_voice:      settings.default_voice,
					max_message_length: settings.max_message_length,
					skip_commands:      settings.skip_commands,
					skip_links:         settings.skip_links,
					sub_only:           settings.sub_only,
					mod_bypass:         settings.mod_bypass,
					cooldown_seconds:   settings.cooldown_seconds,
					blocked_words:      settings.blocked_words,
					redemption_title:   settings.redemption_title
				}
			);
			if (res.success && res.data) {
				settings = res.data;
				success  = true;
				setTimeout(() => (success = false), 2500);
			} else {
				error = res.error ?? 'Error al guardar';
			}
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Error desconocido';
		} finally {
			saving = false;
		}
	}

	function addWord() {
		const w = newWord.trim().toLowerCase();
		if (!w || !settings) return;
		if (!settings.blocked_words.includes(w)) {
			settings.blocked_words = [...settings.blocked_words, w];
		}
		newWord = '';
	}

	function removeWord(w: string) {
		if (!settings) return;
		settings.blocked_words = settings.blocked_words.filter((x) => x !== w);
	}
</script>

<div class="section">
	{#if loading}
		<p class="muted">Cargando...</p>
	{:else if settings}
		<form onsubmit={(e) => { e.preventDefault(); save(); }}>

			<!-- Providers (read-only, configured via .env) -->
			<fieldset>
				<legend>Providers TTS</legend>
				<p class="hint">Los providers se configuran en el archivo <code>.env</code> del servidor.</p>
				<div class="providers">
					{#each Object.entries(settings.providers) as [name, available]}
						<div class="provider-row">
							<span class="status-dot" class:ok={available} class:fail={!available}></span>
							<span class="provider-name">{name}</span>
							<span class="muted">{available ? 'disponible' : 'no disponible'}</span>
						</div>
					{/each}
				</div>
			</fieldset>

			<!-- Voz por defecto -->
			<fieldset>
				<legend>Voz por defecto</legend>
				<label>
					<span>Voice ID (formato: <code>provider:id</code>)</span>
					<input
						type="text"
						bind:value={settings.default_voice}
						placeholder="edge_tts:es-ES-AlvaroNeural"
					/>
				</label>
				<p class="hint">
					Ejemplos: <code>edge_tts:es-ES-AlvaroNeural</code> · <code>voicebox:uuid-del-perfil</code><br />
					Se usa cuando un viewer no tiene voz asignada. Consulta la lista en la pestaña <em>Voces</em>.
				</p>
			</fieldset>

			<!-- Acceso -->
			<fieldset>
				<legend>Acceso al !tts</legend>
				<div class="toggles">
					<label class="toggle">
						<input type="checkbox" bind:checked={settings.sub_only} />
						<span>Solo suscriptores pueden usar <code>!tts</code></span>
					</label>
					<label class="toggle">
						<input type="checkbox" bind:checked={settings.mod_bypass} />
						<span>Mods y broadcaster siempre pueden usar <code>!tts</code></span>
					</label>
				</div>
				<p class="hint">Los no-subs pueden seguir accediendo vía channel points (ver abajo).</p>
			</fieldset>

			<!-- Channel Points Redemption -->
			<fieldset>
				<legend>Channel Points — TTS</legend>
				<label>
					<span>Nombre exacto de la recompensa en Twitch</span>
					<input
						type="text"
						bind:value={settings.redemption_title}
						placeholder="TTS (vacío = desactivado)"
					/>
				</label>
				<p class="hint">
					Crea la recompensa en Twitch con ese nombre y activa el campo de texto.
					Cualquier viewer que la canjee tendrá su mensaje hablado con su voz asignada.
				</p>
			</fieldset>

			<!-- Filtros -->
			<fieldset>
				<legend>Filtros</legend>
				<div class="toggles">
					<label class="toggle">
						<input type="checkbox" bind:checked={settings.enabled} />
						<span>TTS activado</span>
					</label>
					<label class="toggle">
						<input type="checkbox" bind:checked={settings.skip_commands} />
						<span>Ignorar comandos (!xxx)</span>
					</label>
					<label class="toggle">
						<input type="checkbox" bind:checked={settings.skip_links} />
						<span>Ignorar links (elimina URLs del texto)</span>
					</label>
				</div>

				<div class="row mt">
					<label>
						<span>Longitud máx. mensaje (chars)</span>
						<input type="number" bind:value={settings.max_message_length} min="10" max="500" />
					</label>
					<label>
						<span>Cooldown por usuario (s)</span>
						<input type="number" bind:value={settings.cooldown_seconds} min="0" max="3600" />
					</label>
				</div>
			</fieldset>

			<!-- Palabras bloqueadas -->
			<fieldset>
				<legend>Palabras bloqueadas</legend>
				<div class="words">
					{#each settings.blocked_words as w}
						<span class="word-tag">
							{w}
							<button type="button" onclick={() => removeWord(w)}>×</button>
						</span>
					{/each}
				</div>
				<div class="word-add">
					<input
						type="text"
						bind:value={newWord}
						placeholder="Añadir palabra..."
						onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addWord())}
					/>
					<button type="button" class="btn-secondary" onclick={addWord}>Añadir</button>
				</div>
			</fieldset>

			<!-- Actions -->
			<div class="actions">
				{#if error}   <span class="error">{error}</span>   {/if}
				{#if success} <span class="ok-msg">Guardado</span> {/if}
				<button type="submit" class="btn-primary" disabled={saving}>
					{saving ? 'Guardando...' : 'Guardar'}
				</button>
			</div>
		</form>
	{/if}
</div>

<style>
	.section { display: flex; flex-direction: column; gap: 1.25rem; }

	fieldset {
		border: 1px solid var(--border, #333);
		border-radius: 8px;
		padding: 1rem 1.25rem;
	}
	legend {
		padding: 0 0.5rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--subtext, #a6adc8);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.providers { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; }
	.provider-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.875rem;
	}
	.provider-name {
		font-family: monospace;
		color: var(--text, #cdd6f4);
		font-size: 0.85rem;
	}

	.row {
		display: flex;
		gap: 1.25rem;
		flex-wrap: wrap;
		align-items: flex-end;
	}
	.mt { margin-top: 0.75rem; }

	label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.85rem;
		color: var(--subtext, #a6adc8);
	}
	label span { font-size: 0.8rem; }

	input[type='text'],
	input[type='number'] {
		padding: 0.4rem 0.65rem;
		background: var(--surface2, #1e1e2e);
		border: 1px solid var(--border, #333);
		border-radius: 6px;
		color: var(--text, #cdd6f4);
		font-size: 0.875rem;
		min-width: 160px;
	}
	input[type='number'] { min-width: 90px; }

	.toggles { display: flex; flex-direction: column; gap: 0.6rem; }
	.toggle {
		flex-direction: row;
		align-items: center;
		gap: 0.6rem;
		cursor: pointer;
	}
	.toggle input[type='checkbox'] { width: 16px; height: 16px; cursor: pointer; }
	.toggle span { font-size: 0.875rem; color: var(--text, #cdd6f4); }

	.words { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.75rem; }
	.word-tag {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		background: var(--surface2, #1e1e2e);
		border: 1px solid var(--border, #333);
		border-radius: 4px;
		padding: 2px 8px;
		font-size: 0.8rem;
		color: var(--text, #cdd6f4);
	}
	.word-tag button {
		background: none;
		border: none;
		color: var(--subtext, #a6adc8);
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		padding: 0;
	}
	.word-tag button:hover { color: var(--red, #f38ba8); }

	.word-add { display: flex; gap: 0.5rem; align-items: center; }

	.actions {
		display: flex;
		align-items: center;
		gap: 1rem;
		justify-content: flex-end;
	}

	.btn-primary {
		padding: 0.5rem 1.25rem;
		background: var(--accent, #cba6f7);
		color: #1e1e2e;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		font-size: 0.875rem;
	}
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

	.btn-secondary {
		padding: 0.4rem 0.9rem;
		background: transparent;
		border: 1px solid var(--border, #333);
		border-radius: 6px;
		color: var(--text, #cdd6f4);
		cursor: pointer;
		font-size: 0.875rem;
	}

	.status-dot {
		width: 8px; height: 8px;
		border-radius: 50%;
		display: inline-block;
		flex-shrink: 0;
	}
	.status-dot.ok   { background: #a6e3a1; }
	.status-dot.fail { background: #f38ba8; }

	.muted  { color: var(--subtext, #a6adc8); font-size: 0.875rem; }
	.error  { color: var(--red, #f38ba8);     font-size: 0.875rem; }
	.ok-msg { color: #a6e3a1;                 font-size: 0.875rem; }

	.hint {
		margin-top: 0.6rem;
		font-size: 0.78rem;
		color: var(--subtext, #a6adc8);
		line-height: 1.5;
	}

	code {
		background: var(--surface2, #1e1e2e);
		border: 1px solid var(--border, #333);
		border-radius: 3px;
		padding: 1px 5px;
		font-size: 0.78rem;
		font-family: monospace;
		color: var(--accent, #cba6f7);
	}
</style>
