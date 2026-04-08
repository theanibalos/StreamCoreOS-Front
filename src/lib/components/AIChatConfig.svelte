<script lang="ts">
	import { onMount } from 'svelte';
	import { get, put } from '$lib/api/client';
	import type { ApiResponse } from '$lib/types/api';

	const DEFAULT_PROMPT = 'You are a helpful Twitch chat assistant. Be concise and reply in under 40 words.';

	interface AIConfigData {
		chat_system_prompt: string;
		chat_max_tokens: number;
		chat_temperature: number;
		chat_cooldown_s: number;
		provider: string;
		endpoint_url: string;
		model: string;
		has_api_key: boolean;
	}

	type GetAIConfigResponse = ApiResponse<AIConfigData>;
	type SaveAIConfigResponse = ApiResponse<AIConfigData>;

	// ── State ─────────────────────────────────────────────────────────────────
	let loading = $state(true);
	let saving = $state(false);
	let error = $state<string | null>(null);
	let successMsg = $state<string | null>(null);

	// Full config needed to re-send unchanged fields on save
	let fullConfig = $state<AIConfigData | null>(null);

	let system_prompt = $state(DEFAULT_PROMPT);
	let max_tokens = $state(200);
	let temperature = $state(0.7);
	let chat_cooldown_s = $state(120);

	// ── Load ──────────────────────────────────────────────────────────────────
	async function load() {
		loading = true;
		error = null;
		try {
			const res = await get<GetAIConfigResponse>('/ai/config');
			if (res.success && res.data) {
				fullConfig = res.data;
				system_prompt = res.data.chat_system_prompt || DEFAULT_PROMPT;
				max_tokens = res.data.chat_max_tokens ?? 200;
				temperature = res.data.chat_temperature ?? 0.7;
				chat_cooldown_s = res.data.chat_cooldown_s ?? 120;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	onMount(load);

	// ── Save ──────────────────────────────────────────────────────────────────
	async function save() {
		if (!fullConfig) return;
		saving = true;
		error = null;
		successMsg = null;
		try {
			const res = await put<SaveAIConfigResponse>('/ai/config', {
				// Pass through unchanged fields
				provider:        fullConfig.provider,
				endpoint_url:    fullConfig.endpoint_url,
				model:           fullConfig.model,
				api_key:         '',  // blank = keep current key
				// Updated fields
				chat_system_prompt: system_prompt.trim() || DEFAULT_PROMPT,
				chat_max_tokens:    max_tokens,
				chat_temperature:   temperature,
				chat_cooldown_s:    chat_cooldown_s,
			});
			if (res.success) {
				successMsg = 'Saved.';
				setTimeout(() => (successMsg = null), 2500);
			} else {
				error = res.error ?? 'Failed to save.';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}

	function reset() {
		system_prompt = DEFAULT_PROMPT;
		max_tokens = 200;
		temperature = 0.7;
		chat_cooldown_s = 120;
	}
</script>

<div class="panel">
	<div class="panel-header">
		<h2>!ia Chat Personality</h2>
		{#if !loading}
			<span class="command-tag">!ia</span>
		{/if}
	</div>

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if !fullConfig}
		<p class="muted">Configure an AI provider first.</p>
	{:else}
		{#if error}<p class="err">{error}</p>{/if}
		{#if successMsg}<p class="ok">{successMsg}</p>{/if}

		<!-- System prompt -->
		<div class="field">
			<label for="sys-prompt">Personality (system prompt)</label>
			<textarea
				id="sys-prompt"
				rows="5"
				placeholder={DEFAULT_PROMPT}
				bind:value={system_prompt}
			></textarea>
			<span class="hint">
				This is the instruction the AI receives before every question. Define the personality,
				language, tone, and any restrictions.
			</span>
		</div>

		<div class="row">
			<!-- Max tokens -->
			<div class="field">
				<label for="max-tokens">Max tokens</label>
				<input id="max-tokens" type="number" min="10" max="2000" bind:value={max_tokens} />
				<span class="hint">~0.75 words per token. 200 ≈ 150 words.</span>
			</div>

			<!-- Temperature -->
			<div class="field">
				<label for="temp">Temperature <span class="val">{temperature.toFixed(1)}</span></label>
				<input
					id="temp"
					type="range"
					min="0"
					max="2"
					step="0.1"
					bind:value={temperature}
				/>
				<div class="temp-labels">
					<span>Precise</span>
					<span>Creative</span>
				</div>
			</div>
		</div>

		<!-- Cooldown -->
		<div class="field">
			<label for="cooldown">Cooldown (seconds)</label>
			<input
				id="cooldown"
				type="number"
				min="0"
				max="86400"
				bind:value={chat_cooldown_s}
			/>
			<span class="hint">Time each user must wait between !ia commands. Set to 0 to disable.</span>
		</div>

		<div class="btn-row">
			<button class="save-btn" onclick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
			<button class="ghost" onclick={reset}>Reset defaults</button>
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
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.25rem;
	}

	h2 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.command-tag {
		font-size: 0.75rem;
		font-family: monospace;
		background: rgba(203, 166, 247, 0.1);
		color: var(--accent);
		border: 1px solid rgba(203, 166, 247, 0.3);
		border-radius: 4px;
		padding: 0.1rem 0.45rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		margin-bottom: 1rem;
	}

	label {
		font-size: 0.72rem;
		color: var(--subtext);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.val {
		font-size: 0.78rem;
		color: var(--accent);
		text-transform: none;
		letter-spacing: 0;
		font-weight: 600;
	}

	textarea {
		background: var(--surface2);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text);
		padding: 0.5rem 0.6rem;
		font-size: 0.875rem;
		font-family: inherit;
		line-height: 1.55;
		resize: vertical;
		outline: none;
		width: 100%;
	}

	textarea:focus {
		border-color: var(--accent);
	}

	input[type='number'] {
		background: var(--surface2);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text);
		padding: 0.35rem 0.55rem;
		font-size: 0.875rem;
		outline: none;
		width: 7rem;
	}

	input[type='number']:focus {
		border-color: var(--accent);
	}

	input[type='range'] {
		width: 100%;
		accent-color: var(--accent);
	}

	.temp-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.68rem;
		color: var(--subtext);
		margin-top: 0.1rem;
	}

	.hint {
		font-size: 0.7rem;
		color: var(--subtext);
	}

	.row {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 1.5rem;
		align-items: start;
	}

	.btn-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-top: 0.25rem;
	}

	.save-btn {
		background: var(--accent);
		color: #11111b;
		border: none;
		border-radius: 4px;
		padding: 0.45rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
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
		padding: 0.45rem 0.9rem;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.ghost:hover {
		border-color: var(--accent);
		color: var(--text);
	}

	.muted { color: var(--subtext); font-size: 0.85rem; }
	.err   { color: var(--red);     font-size: 0.85rem; margin-bottom: 0.75rem; }
	.ok    { color: var(--green);   font-size: 0.85rem; margin-bottom: 0.75rem; }
</style>
