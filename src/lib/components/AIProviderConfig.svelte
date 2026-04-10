<script lang="ts">
	import { onMount } from 'svelte';
	import { get, put, post } from '$lib/api/client';
	import type { ApiResponse } from '$lib/types/api';

	interface AIConfigData {
		provider: string;
		endpoint_url: string;
		model: string;
		has_api_key: boolean;
		disable_reasoning: boolean;
		timeout_s: number;
		extra_headers: Record<string, string>;
		extra_payload: Record<string, unknown>;
		updated_at: string | null;
	}

	type GetAIConfigResponse = ApiResponse<AIConfigData>;
	type SaveAIConfigResponse = ApiResponse<AIConfigData>;

	const PRESETS: Record<string, { label: string; endpoint_url: string; model_placeholder: string }> = {
		openai: {
			label: 'OpenAI',
			endpoint_url: 'https://api.openai.com/v1/chat/completions',
			model_placeholder: 'gpt-4o-mini'
		},
		anthropic: {
			label: 'Anthropic',
			endpoint_url: 'https://api.anthropic.com/v1/chat/completions',
			model_placeholder: 'claude-haiku-4-5-20251001'
		},
		gemini: {
			label: 'Google Gemini',
			endpoint_url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
			model_placeholder: 'gemini-2.0-flash'
		},
		openrouter: {
			label: 'OpenRouter',
			endpoint_url: 'https://openrouter.ai/api/v1/chat/completions',
			model_placeholder: 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free'
		},
		groq: {
			label: 'Groq',
			endpoint_url: 'https://api.groq.com/openai/v1/chat/completions',
			model_placeholder: 'llama-3.3-70b-versatile'
		},
		ollama: {
			label: 'Ollama (local)',
			endpoint_url: 'http://localhost:11434/v1/chat/completions',
			model_placeholder: 'llama3.2'
		},
		lmstudio: {
			label: 'LM Studio (local)',
			endpoint_url: 'http://localhost:1234/v1/chat/completions',
			model_placeholder: 'local-model'
		},
		llamacpp: {
			label: 'llama.cpp (local)',
			endpoint_url: 'http://localhost:8080/v1/chat/completions',
			model_placeholder: 'local-model'
		},
		custom: {
			label: 'Custom',
			endpoint_url: '',
			model_placeholder: 'model-name'
		}
	};

	// ── State ────────────────────────────────────────────────────────────────
	type TestStatus = 'idle' | 'testing' | 'ok' | 'fail';

	let loading           = $state(true);
	let saving            = $state(false);
	let error             = $state<string | null>(null);
	let testStatus        = $state<TestStatus>('idle');
	let testMsg           = $state<string | null>(null);

	let provider          = $state('openai');
	let endpoint_url      = $state(PRESETS.openai.endpoint_url);
	let api_key           = $state('');
	let model             = $state('');
	let has_api_key       = $state(false);
	let disable_reasoning = $state(false);
	let timeout_s         = $state(120);

	// JSON fields stored as raw strings for textarea editing
	let extra_payload_raw = $state('{}');
	let extra_headers_raw = $state('{}');
	let extra_payload_err = $state<string | null>(null);
	let extra_headers_err = $state<string | null>(null);

	let modelPlaceholder  = $derived(PRESETS[provider]?.model_placeholder ?? 'model-name');
	let isConfigured      = $derived(Boolean(endpoint_url.trim() && model.trim()));
	let isLocalProvider   = $derived(['ollama', 'lmstudio', 'llamacpp'].includes(provider));

	// ── JSON field helpers ────────────────────────────────────────────────────
	function validateJson(raw: string): { ok: boolean; parsed: Record<string, unknown> | null; err: string | null } {
		const trimmed = raw.trim();
		if (!trimmed || trimmed === '{}') return { ok: true, parsed: {}, err: null };
		try {
			const parsed = JSON.parse(trimmed);
			if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null)
				return { ok: false, parsed: null, err: 'Must be a JSON object: { "key": "value" }' };
			return { ok: true, parsed, err: null };
		} catch (e) {
			return { ok: false, parsed: null, err: `Invalid JSON: ${(e as Error).message}` };
		}
	}

	function onPayloadChange() {
		extra_payload_err = validateJson(extra_payload_raw).err;
	}

	function onHeadersChange() {
		extra_headers_err = validateJson(extra_headers_raw).err;
	}

	// ── Load ─────────────────────────────────────────────────────────────────
	async function load() {
		loading = true;
		error = null;
		try {
			const res = await get<GetAIConfigResponse>('/ai/config');
			if (res.success && res.data) {
				provider          = res.data.provider;
				endpoint_url      = res.data.endpoint_url;
				model             = res.data.model;
				has_api_key       = res.data.has_api_key;
				disable_reasoning = res.data.disable_reasoning ?? false;
				timeout_s         = res.data.timeout_s ?? 120;
				extra_payload_raw = JSON.stringify(res.data.extra_payload ?? {}, null, 2);
				extra_headers_raw = JSON.stringify(res.data.extra_headers ?? {}, null, 2);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	onMount(load);

	// ── Preset selection ─────────────────────────────────────────────────────
	function selectPreset(key: string) {
		provider     = key;
		endpoint_url = PRESETS[key].endpoint_url;
	}

	// ── Save + test ──────────────────────────────────────────────────────────
	async function save() {
		if (!endpoint_url.trim() || !model.trim()) {
			error = 'Endpoint URL and model are required.';
			return;
		}

		const payloadResult = validateJson(extra_payload_raw);
		const headersResult = validateJson(extra_headers_raw);
		extra_payload_err = payloadResult.err;
		extra_headers_err = headersResult.err;
		if (!payloadResult.ok || !headersResult.ok) return;

		saving    = true;
		error     = null;
		testStatus = 'idle';
		testMsg    = null;
		try {
			const res = await put<SaveAIConfigResponse>('/ai/config', {
				provider,
				endpoint_url:      endpoint_url.trim(),
				api_key:           api_key,
				model:             model.trim(),
				disable_reasoning,
				timeout_s,
				extra_payload:     payloadResult.parsed ?? {},
				extra_headers:     headersResult.parsed ?? {},
			});
			if (res.success) {
				has_api_key = Boolean(api_key) || has_api_key;
				api_key     = '';
				await testConnection();
			} else {
				error = res.error ?? 'Failed to save.';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}

	async function testConnection() {
		testStatus = 'testing';
		testMsg    = null;
		try {
			const res = await post<ApiResponse<{ latency_ms: number; response: string }>>('/ai/test', {});
			if (res.success && res.data) {
				testStatus = 'ok';
				testMsg    = `Connected · ${res.data.latency_ms}ms`;
			} else {
				testStatus = 'fail';
				testMsg    = res.error ?? 'Connection failed.';
			}
		} catch (e) {
			testStatus = 'fail';
			testMsg    = e instanceof Error ? e.message : 'Connection failed.';
		}
	}
</script>

<div class="panel">
	<div class="panel-header">
		<h2>AI Provider</h2>
		{#if !loading}
			<span class="status" class:configured={isConfigured}>
				{isConfigured ? '● Configured' : '○ Not configured'}
			</span>
		{/if}
	</div>

	{#if loading}
		<p class="muted">Loading…</p>
	{:else}
		{#if error}
			<p class="err">{error}</p>
		{/if}
		{#if testStatus !== 'idle'}
			<p
				class="test-result"
				class:ok={testStatus === 'ok'}
				class:fail={testStatus === 'fail'}
				class:testing={testStatus === 'testing'}
			>
				{#if testStatus === 'testing'}⏳ Testing connection…
				{:else if testStatus === 'ok'}✓ {testMsg}
				{:else}✗ {testMsg}
				{/if}
			</p>
		{/if}

		<!-- Provider presets -->
		<div class="field">
			<span class="field-label">Provider</span>
			<div class="presets">
				{#each Object.entries(PRESETS) as [key, preset]}
					<button
						class="preset-btn"
						class:active={provider === key}
						onclick={() => selectPreset(key)}
					>
						{preset.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Endpoint URL -->
		<div class="field">
			<label for="endpoint">Endpoint URL</label>
			<input
				id="endpoint"
				type="text"
				bind:value={endpoint_url}
				placeholder="https://api.openai.com/v1/chat/completions"
			/>
			<span class="hint">Full chat completions URL for your provider.</span>
		</div>

		<!-- API Key -->
		<div class="field">
			<label for="apikey">
				API Key
				{#if has_api_key}<span class="saved-badge">saved</span>{/if}
			</label>
			<input
				id="apikey"
				type="password"
				bind:value={api_key}
				placeholder={has_api_key ? '••••••••  (leave blank to keep current)' : 'sk-...'}
				autocomplete="off"
			/>
			<span class="hint">Stored locally. Leave blank to keep the current key.</span>
		</div>

		<!-- Model -->
		<div class="field">
			<label for="model">Model</label>
			<input
				id="model"
				type="text"
				bind:value={model}
				placeholder={modelPlaceholder}
			/>
		</div>

		<!-- ── Advanced ───────────────────────────────────────────────────── -->
		<div class="section-divider">Advanced</div>

		<!-- Timeout -->
		<div class="field field-inline">
			<label for="timeout">Timeout</label>
			<div class="input-unit">
				<input
					id="timeout"
					type="number"
					min="5"
					max="600"
					bind:value={timeout_s}
				/>
				<span class="unit">s</span>
			</div>
			<span class="hint">Request timeout in seconds (5–600). Increase for slow local models.</span>
		</div>

		<!-- Extra payload -->
		<div class="field">
			<label for="extra-payload">Extra Payload Fields</label>
			<textarea
				id="extra-payload"
				rows="3"
				bind:value={extra_payload_raw}
				oninput={onPayloadChange}
				placeholder={'{"num_ctx": 8192}'}
				spellcheck="false"
			></textarea>
			{#if extra_payload_err}
				<span class="field-err">{extra_payload_err}</span>
			{:else}
				<span class="hint">
					JSON object merged into the request body.
					{#if isLocalProvider}
						Useful for <code>num_ctx</code> (Ollama context size), <code>num_predict</code> (llama.cpp token limit).
					{:else}
						Use for provider-specific fields not covered above.
					{/if}
				</span>
			{/if}
		</div>

		<!-- Extra headers -->
		<div class="field">
			<label for="extra-headers">Extra HTTP Headers</label>
			<textarea
				id="extra-headers"
				rows="3"
				bind:value={extra_headers_raw}
				oninput={onHeadersChange}
				placeholder={'{"X-Custom-Header": "value"}'}
				spellcheck="false"
			></textarea>
			{#if extra_headers_err}
				<span class="field-err">{extra_headers_err}</span>
			{:else}
				<span class="hint">JSON object of additional HTTP headers. Useful for proxies or custom auth schemes.</span>
			{/if}
		</div>

		<!-- Disable reasoning -->
		<div class="field toggle-field">
			<label class="toggle-label" for="disable-reasoning">
				<input
					id="disable-reasoning"
					type="checkbox"
					bind:checked={disable_reasoning}
				/>
				Deshabilitar razonamiento
			</label>
			<span class="hint">
				Desactiva el pensamiento interno del modelo (reasoning).
				Actualmente solo aplica a OpenRouter — en proveedores locales no tiene efecto.
			</span>
		</div>

		<div class="btn-row">
			<button class="save-btn" onclick={save} disabled={saving || testStatus === 'testing'}>
				{saving ? 'Saving…' : 'Save'}
			</button>
			<button class="test-btn" onclick={testConnection} disabled={saving || testStatus === 'testing'}>
				Test connection
			</button>
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

	.status {
		font-size: 0.75rem;
		color: var(--subtext);
	}

	.status.configured {
		color: var(--green);
	}

	.section-divider {
		font-size: 0.68rem;
		font-weight: 600;
		color: var(--subtext);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		border-top: 1px solid var(--border);
		padding-top: 0.75rem;
		margin-bottom: 0.75rem;
		margin-top: 0.25rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin-bottom: 1rem;
	}

	.field-inline {
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-rows: auto auto;
		column-gap: 0.75rem;
		align-items: center;
	}

	.field-inline label {
		grid-row: 1;
		grid-column: 1 / -1;
	}

	.field-inline .input-unit {
		grid-row: 2;
		grid-column: 1;
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.field-inline .hint {
		grid-row: 3;
		grid-column: 1 / -1;
	}

	.input-unit input[type='number'] {
		width: 5rem;
	}

	.unit {
		font-size: 0.78rem;
		color: var(--subtext);
	}

	label, .field-label {
		font-size: 0.72rem;
		color: var(--subtext);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.saved-badge {
		font-size: 0.65rem;
		background: rgba(166, 227, 161, 0.15);
		color: var(--green);
		border: 1px solid var(--green);
		border-radius: 3px;
		padding: 0.05rem 0.35rem;
		text-transform: none;
		letter-spacing: 0;
	}

	input[type='text'],
	input[type='password'],
	input[type='number'] {
		background: var(--surface2);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text);
		padding: 0.4rem 0.6rem;
		font-size: 0.875rem;
		outline: none;
		width: 100%;
	}

	input:focus {
		border-color: var(--accent);
	}

	textarea {
		background: var(--surface2);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text);
		padding: 0.4rem 0.6rem;
		font-size: 0.8rem;
		font-family: monospace;
		outline: none;
		width: 100%;
		resize: vertical;
		line-height: 1.5;
	}

	textarea:focus {
		border-color: var(--accent);
	}

	.hint {
		font-size: 0.7rem;
		color: var(--subtext);
	}

	.hint code {
		font-family: monospace;
		background: var(--surface2);
		padding: 0.05rem 0.3rem;
		border-radius: 3px;
		font-size: 0.75rem;
	}

	.field-err {
		font-size: 0.72rem;
		color: var(--red);
	}

	.presets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.preset-btn {
		background: var(--surface2);
		border: 1px solid var(--border);
		color: var(--subtext);
		border-radius: 4px;
		padding: 0.25rem 0.65rem;
		font-size: 0.78rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.preset-btn:hover {
		border-color: var(--accent);
		color: var(--text);
	}

	.preset-btn.active {
		border-color: var(--accent);
		color: var(--accent);
		background: rgba(203, 166, 247, 0.08);
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
		margin-top: 0.25rem;
	}

	.save-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.btn-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-top: 0.25rem;
	}

	.test-btn {
		background: none;
		border: 1px solid var(--border);
		color: var(--subtext);
		border-radius: 4px;
		padding: 0.45rem 0.9rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s;
	}

	.test-btn:hover:not(:disabled) {
		border-color: var(--accent);
		color: var(--text);
	}

	.test-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.test-result {
		font-size: 0.85rem;
		margin-bottom: 0.75rem;
		padding: 0.4rem 0.7rem;
		border-radius: 4px;
	}

	.test-result.testing {
		color: var(--subtext);
		background: rgba(166, 173, 200, 0.07);
	}

	.test-result.ok {
		color: var(--green);
		background: rgba(166, 227, 161, 0.07);
		border: 1px solid rgba(166, 227, 161, 0.2);
	}

	.test-result.fail {
		color: var(--red);
		background: rgba(243, 139, 168, 0.07);
		border: 1px solid rgba(243, 139, 168, 0.2);
	}

	.err {
		color: var(--red);
		font-size: 0.85rem;
		margin-bottom: 0.75rem;
	}

	.muted {
		color: var(--subtext);
		font-size: 0.85rem;
	}

	.toggle-field {
		margin-bottom: 1rem;
	}

	.toggle-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: var(--text);
		cursor: pointer;
		text-transform: none;
		letter-spacing: 0;
	}

	.toggle-label input[type='checkbox'] {
		accent-color: var(--accent);
		width: 1rem;
		height: 1rem;
		cursor: pointer;
	}
</style>
