<script lang="ts">
	import { onMount } from 'svelte';
	import { get, put, post } from '$lib/core/api/client';
	import type { ApiResponse } from '$lib/types/api';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Brain, Save, Activity, Settings2, Info, Lock, Key, Globe, Database, ListChecks } from '@lucide/svelte';

	interface AIConfigData {
		provider: string;
		endpoint_url: string;
		model: string;
		has_api_key: boolean;
		disable_reasoning: boolean;
		timeout_s: number;
		extra_headers: Record<string, string>;
		extra_payload: Record<string, unknown>;
		chat_system_prompt: string;
		chat_max_tokens: number;
		chat_temperature: number;
		chat_cooldown_s: number;
		updated_at: string | null;
	}

	type GetAIConfigResponse = ApiResponse<AIConfigData>;
	type SaveAIConfigResponse = ApiResponse<AIConfigData>;

	const PRESETS: Record<string, { label: string; endpoint_url: string; model_placeholder: string }> = {
		openai: { label: 'OpenAI', endpoint_url: 'https://api.openai.com/v1/chat/completions', model_placeholder: 'gpt-4o-mini' },
		anthropic: { label: 'Anthropic', endpoint_url: 'https://api.anthropic.com/v1/chat/completions', model_placeholder: 'claude-3-5-haiku-latest' },
		gemini: { label: 'Google Gemini', endpoint_url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', model_placeholder: 'gemini-2.0-flash' },
		openrouter: { label: 'OpenRouter', endpoint_url: 'https://openrouter.ai/api/v1/chat/completions', model_placeholder: 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free' },
		groq: { label: 'Groq', endpoint_url: 'https://api.groq.com/openai/v1/chat/completions', model_placeholder: 'llama-3.3-70b-versatile' },
		ollama: { label: 'Ollama (local)', endpoint_url: 'http://localhost:11434/v1/chat/completions', model_placeholder: 'llama3.2' },
		lmstudio: { label: 'LM Studio (local)', endpoint_url: 'http://localhost:1234/v1/chat/completions', model_placeholder: 'local-model' },
		llamacpp: { label: 'llama.cpp (local)', endpoint_url: 'http://localhost:8080/v1/chat/completions', model_placeholder: 'local-model' },
		custom: { label: 'Custom', endpoint_url: '', model_placeholder: 'model-name' }
	};

	let loading = $state(true);
	let saving = $state(false);
	let error = $state<string | null>(null);
	let testStatus = $state<'idle' | 'testing' | 'ok' | 'fail'>('idle');
	let testMsg = $state<string | null>(null);

	let provider = $state('openai');
	let endpoint_url = $state(PRESETS.openai.endpoint_url);
	let api_key = $state('');
	let model = $state('');
	let has_api_key = $state(false);
	let disable_reasoning = $state(false);
	let timeout_s = $state(120);

	let extra_payload_raw = $state('{}');
	let extra_headers_raw = $state('{}');
	let extra_payload_err = $state<string | null>(null);
	let extra_headers_err = $state<string | null>(null);

	// Campos del chatbot (!ia) que no se editan en esta pestaña, pero deben
	// reenviarse tal cual en el PUT — si se omiten, el backend los resetea
	// a sus valores por defecto porque /ai/config guarda la fila completa.
	let chat_system_prompt = $state('');
	let chat_max_tokens = $state(200);
	let chat_temperature = $state(0.7);
	let chat_cooldown_s = $state(120);

	let modelPlaceholder = $derived(PRESETS[provider]?.model_placeholder ?? 'model-name');
	let isConfigured = $derived(Boolean(endpoint_url.trim() && model.trim()));
	let isLocalProvider = $derived(['ollama', 'lmstudio', 'llamacpp'].includes(provider));

	function validateJson(raw: string): { ok: boolean; parsed: Record<string, unknown> | null; err: string | null } {
		const trimmed = raw.trim();
		if (!trimmed || trimmed === '{}') return { ok: true, parsed: {}, err: null };
		try {
			const parsed = JSON.parse(trimmed);
			if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) return { ok: false, parsed: null, err: 'Debe ser un objeto JSON' };
			return { ok: true, parsed, err: null };
		} catch (e) {
			return { ok: false, parsed: null, err: `JSON Inválido: ${(e as Error).message}` };
		}
	}

	async function load() {
		loading = true; error = null;
		try {
			const res = await get<GetAIConfigResponse>('/ai/config');
			if (res.success && res.data) {
				provider = res.data.provider; endpoint_url = res.data.endpoint_url; model = res.data.model;
				has_api_key = res.data.has_api_key; disable_reasoning = res.data.disable_reasoning ?? false;
				timeout_s = res.data.timeout_s ?? 120;
				extra_payload_raw = JSON.stringify(res.data.extra_payload ?? {}, null, 2);
				extra_headers_raw = JSON.stringify(res.data.extra_headers ?? {}, null, 2);
				chat_system_prompt = res.data.chat_system_prompt ?? '';
				chat_max_tokens = res.data.chat_max_tokens ?? 200;
				chat_temperature = res.data.chat_temperature ?? 0.7;
				chat_cooldown_s = res.data.chat_cooldown_s ?? 120;
			}
		} catch (e) { error = e instanceof Error ? e.message : String(e); } finally { loading = false; }
	}

	onMount(load);

	async function save() {
		if (!endpoint_url.trim() || !model.trim()) { error = 'URL y modelo son requeridos.'; return; }
		const pRes = validateJson(extra_payload_raw); const hRes = validateJson(extra_headers_raw);
		extra_payload_err = pRes.err; extra_headers_err = hRes.err;
		if (!pRes.ok || !hRes.ok) return;

		saving = true; error = null; testStatus = 'idle';
		try {
			const body: Record<string, any> = {
				provider, 
				endpoint_url: endpoint_url.trim(), 
				model: model.trim(),
				disable_reasoning,
				timeout_s,
				extra_payload: pRes.parsed ?? {},
				extra_headers: hRes.parsed ?? {},
				chat_system_prompt,
				chat_max_tokens,
				chat_temperature,
				chat_cooldown_s
			};
			
			if (api_key) body.api_key = api_key;

			const res = await put<SaveAIConfigResponse>('/ai/config', body);
			if (res.success) { 
				has_api_key = Boolean(api_key) || has_api_key; 
				api_key = ''; 
				await testConnection(); 
			}
			else { error = res.error ?? 'Error al guardar.'; }
		} catch (e) { error = e instanceof Error ? e.message : String(e); } finally { saving = false; }
	}

	async function testConnection() {
		testStatus = 'testing'; testMsg = null;
		try {
			const res = await post<ApiResponse<{ latency_ms: number; response: string }>>('/ai/test', {});
			if (res.success && res.data) { testStatus = 'ok'; testMsg = `Conectado &bull; ${res.data.latency_ms}ms`; }
			else { testStatus = 'fail'; testMsg = res.error ?? 'Error de conexión.'; }
		} catch (e) { testStatus = 'fail'; testMsg = e instanceof Error ? e.message : 'Error de conexión.'; }
	}
</script>

<Card class="w-full">
	<CardHeader class="border-b pb-4">
		<div class="flex items-center justify-between">
			<CardTitle class="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
				<Brain class="w-5 h-5 text-primary" /> Proveedor de IA
			</CardTitle>
			{#if isConfigured}
				<Badge variant="default" class="bg-green-500/15 text-green-600 dark:text-green-400 border-none shadow-none">Configurado</Badge>
			{:else}
				<Badge variant="secondary">Pendiente</Badge>
			{/if}
		</div>
		<CardDescription>Configura el motor de inteligencia artificial que potenciará tu stream.</CardDescription>
	</CardHeader>

	<CardContent class="p-6 flex flex-col gap-8">
		{#if loading}
			<div class="flex items-center justify-center py-10 text-muted-foreground italic">Cargando configuración...</div>
		{:else}
			{#if error}<div class="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>{/if}
			
			{#if testStatus !== 'idle'}
				<div class="p-4 rounded-lg border flex items-center gap-3 {testStatus === 'ok' ? 'bg-green-500/5 border-green-500/20 text-green-600' : (testStatus === 'fail' ? 'bg-red-500/5 border-red-500/20 text-red-600' : 'bg-muted/50')}">
					<Activity class="w-4 h-4 {testStatus === 'testing' ? 'animate-pulse' : ''}" />
					<span class="text-sm font-medium">{@html testStatus === 'testing' ? 'Probando conexión...' : testMsg}</span>
				</div>
			{/if}

			<div class="flex flex-col gap-4">
				<Label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Elegir Proveedor</Label>
				<div class="flex flex-wrap gap-2">
					{#each Object.entries(PRESETS) as [key, preset]}
						<Button 
							variant={provider === key ? "default" : "outline"} 
							size="sm" 
							onclick={() => { provider = key; endpoint_url = preset.endpoint_url; }}
							class="h-8 text-xs"
						>
							{preset.label}
						</Button>
					{/each}
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div class="flex flex-col gap-2">
					<Label for="endpoint" class="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><Globe class="w-3 h-3" /> URL del Endpoint</Label>
					<Input id="endpoint" bind:value={endpoint_url} placeholder="https://..." />
				</div>
				<div class="flex flex-col gap-2">
					<Label for="model" class="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><Database class="w-3 h-3" /> Modelo</Label>
					<Input id="model" bind:value={model} placeholder={modelPlaceholder} />
				</div>
			</div>

			<div class="flex flex-col gap-2">
				<Label for="apikey" class="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
					<Key class="w-3 h-3" /> API Key 
					{#if has_api_key}<Badge variant="outline" class="text-[8px] h-3.5 px-1 py-0 uppercase bg-primary/5 border-primary/20 text-primary">Guardada</Badge>{/if}
				</Label>
				<Input id="apikey" type="password" bind:value={api_key} placeholder={has_api_key ? '••••••••  (deja vacío para mantener la actual)' : 'sk-...'} />
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t">
				<div class="flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<Label class="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><Settings2 class="w-3 h-3" /> Timeout (s)</Label>
						<Input type="number" bind:value={timeout_s} min="5" max="600" />
					</div>
					<div class="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/30 border">
						<div class="flex flex-col gap-1">
							<Label for="disable-reasoning" class="text-sm font-bold capitalize tracking-normal text-foreground">Deshabilitar Razonamiento</Label>
							<span class="text-[10px] text-muted-foreground leading-tight">Útil para OpenRouter o modelos sin 'thought' stream.</span>
						</div>
						<Switch id="disable-reasoning" checked={disable_reasoning} onCheckedChange={(v) => disable_reasoning = v} />
					</div>
				</div>

				<div class="flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<Label class="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><Info class="w-3 h-3" /> Extra Payload (JSON)</Label>
						<Textarea bind:value={extra_payload_raw} placeholder={'{"num_ctx": 4096}'} class="font-mono text-xs h-24" />
						{#if extra_payload_err}<p class="text-[10px] text-destructive">{extra_payload_err}</p>{/if}
					</div>
					<div class="flex flex-col gap-2">
						<Label class="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><ListChecks class="w-3 h-3" /> Extra Headers (JSON)</Label>
						<Textarea bind:value={extra_headers_raw} placeholder={'{"X-Custom": "value"}'} class="font-mono text-xs h-24" />
						{#if extra_headers_err}<p class="text-[10px] text-destructive">{extra_headers_err}</p>{/if}
					</div>
				</div>
			</div>
		{/if}
	</CardContent>

	<CardFooter class="border-t bg-muted/20 p-4 flex justify-between gap-4">
		<Button variant="outline" size="sm" onclick={testConnection} disabled={saving || testStatus === 'testing' || !isConfigured}>
			<Activity class="w-4 h-4 mr-2" /> Probar Conexión
		</Button>
		<Button size="sm" onclick={save} disabled={saving || !isConfigured}>
			<Save class="w-4 h-4 mr-2" /> {saving ? 'Guardando...' : 'Guardar y Testear'}
		</Button>
	</CardFooter>
</Card>
