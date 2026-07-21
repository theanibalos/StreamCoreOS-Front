<script lang="ts">
	import { onMount } from 'svelte';
	import { get, post, put, del } from '$lib/core/api/client';
	import type { AIProviderData, ListAIProvidersResponse, SaveAIProviderResponse, ApiResponse } from '$lib/types/api';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Dialog from '$lib/components/ui/dialog';
	import {
		Brain, Plus, Trash2, Play, Settings2, CheckCircle2, Check,
		Info, Key, Globe, Database, ListChecks, AlertCircle, RefreshCw, Activity
	} from '@lucide/svelte';

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

	let providers = $state<AIProviderData[]>([]);
	let loading = $state(true);
	let listError = $state<string | null>(null);

	let isDialogOpen = $state(false);
	let editingId = $state<number | null>(null);
	let saving = $state(false);
	let saveError = $state<string | null>(null);
	let dialogTesting = $state(false);
	let dialogTestResult = $state<{ success: boolean; msg: string } | null>(null);

	let name = $state('');
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

	let modelPlaceholder = $derived(PRESETS[provider]?.model_placeholder ?? 'model-name');

	let activatingId = $state<number | null>(null);
	let testingId = $state<number | null>(null);
	let testResult = $state<{ id: number; success: boolean; msg: string } | null>(null);
	let deletingId = $state<number | null>(null);

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
		loading = true; listError = null;
		try {
			const res = await get<ListAIProvidersResponse>('/ai/providers');
			if (res.success && res.data) providers = res.data;
			else listError = res.error ?? 'Error al cargar proveedores.';
		} catch (e) { listError = e instanceof Error ? e.message : String(e); } finally { loading = false; }
	}

	onMount(load);

	function resetForm() {
		name = ''; provider = 'openai'; endpoint_url = PRESETS.openai.endpoint_url;
		api_key = ''; model = ''; has_api_key = false; disable_reasoning = false; timeout_s = 120;
		extra_payload_raw = '{}'; extra_headers_raw = '{}';
		extra_payload_err = null; extra_headers_err = null;
		editingId = null; saveError = null;
		dialogTesting = false; dialogTestResult = null;
	}

	function openCreateDialog() {
		resetForm();
		isDialogOpen = true;
	}

	function openEditDialog(p: AIProviderData) {
		editingId = p.id;
		name = p.name; provider = p.provider; endpoint_url = p.endpoint_url; model = p.model;
		has_api_key = p.has_api_key; api_key = '';
		disable_reasoning = p.disable_reasoning; timeout_s = p.timeout_s;
		extra_payload_raw = JSON.stringify(p.extra_payload ?? {}, null, 2);
		extra_headers_raw = JSON.stringify(p.extra_headers ?? {}, null, 2);
		extra_payload_err = null; extra_headers_err = null; saveError = null;
		dialogTesting = false; dialogTestResult = null;
		isDialogOpen = true;
	}

	async function testDialogProvider() {
		if (!endpoint_url.trim() || !model.trim()) { saveError = 'URL y modelo son requeridos para probar.'; return; }
		const pRes = validateJson(extra_payload_raw); const hRes = validateJson(extra_headers_raw);
		extra_payload_err = pRes.err; extra_headers_err = hRes.err;
		if (!pRes.ok || !hRes.ok) return;

		dialogTesting = true; dialogTestResult = null; saveError = null;
		try {
			const body: Record<string, any> = {
				provider,
				endpoint_url: endpoint_url.trim(),
				model: model.trim(),
				disable_reasoning,
				timeout_s,
				extra_payload: pRes.parsed ?? {},
				extra_headers: hRes.parsed ?? {}
			};
			if (api_key) body.api_key = api_key;
			if (editingId) body.provider_id = editingId;

			const res = await post<ApiResponse<{ latency_ms: number; response: string }>>('/ai/providers/test', body);
			dialogTestResult = {
				success: res.success,
				msg: res.success && res.data ? `Conectado • ${res.data.latency_ms}ms` : (res.error ?? 'Error de conexión.')
			};
		} catch (e) {
			dialogTestResult = { success: false, msg: e instanceof Error ? e.message : 'Error de conexión.' };
		} finally { dialogTesting = false; }
	}

	async function saveProvider() {
		if (!name.trim() || !endpoint_url.trim() || !model.trim()) { saveError = 'Nombre, URL y modelo son requeridos.'; return; }
		const pRes = validateJson(extra_payload_raw); const hRes = validateJson(extra_headers_raw);
		extra_payload_err = pRes.err; extra_headers_err = hRes.err;
		if (!pRes.ok || !hRes.ok) return;

		saving = true; saveError = null;
		try {
			const body: Record<string, any> = {
				name: name.trim(),
				provider,
				endpoint_url: endpoint_url.trim(),
				model: model.trim(),
				disable_reasoning,
				timeout_s,
				extra_payload: pRes.parsed ?? {},
				extra_headers: hRes.parsed ?? {}
			};
			if (api_key) body.api_key = api_key;

			const res = editingId
				? await put<SaveAIProviderResponse>(`/ai/providers/${editingId}`, body)
				: await post<SaveAIProviderResponse>('/ai/providers', body);

			if (res.success) {
				isDialogOpen = false;
				resetForm();
				await load();
			} else {
				saveError = res.error ?? 'Error al guardar.';
			}
		} catch (e) { saveError = e instanceof Error ? e.message : String(e); } finally { saving = false; }
	}

	async function deleteProvider(p: AIProviderData) {
		if (!confirm(`¿Eliminar el proveedor "${p.name}"?`)) return;
		deletingId = p.id;
		try {
			await del(`/ai/providers/${p.id}`);
			await load();
		} catch (e) { listError = e instanceof Error ? e.message : String(e); } finally { deletingId = null; }
	}

	async function activateProvider(p: AIProviderData) {
		activatingId = p.id;
		try {
			const res = await post<ApiResponse<null>>(`/ai/providers/${p.id}/activate`, {});
			if (res.success) await load();
			else listError = res.error ?? 'Error al activar.';
		} catch (e) { listError = e instanceof Error ? e.message : String(e); } finally { activatingId = null; }
	}

	async function testProvider(p: AIProviderData) {
		testingId = p.id; testResult = null;
		try {
			const res = await post<ApiResponse<{ latency_ms: number; response: string }>>(`/ai/providers/${p.id}/test`, {});
			testResult = {
				id: p.id,
				success: res.success,
				msg: res.success && res.data ? `Conectado • ${res.data.latency_ms}ms` : (res.error ?? 'Error de conexión.')
			};
		} catch (e) {
			testResult = { id: p.id, success: false, msg: e instanceof Error ? e.message : 'Error de conexión.' };
		} finally { testingId = null; }
	}
</script>

<Card class="w-full">
	<CardHeader class="border-b pb-4">
		<div class="flex items-center justify-between">
			<CardTitle class="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
				<Brain class="w-5 h-5 text-primary" /> Proveedores de IA
			</CardTitle>
			<Dialog.Root bind:open={isDialogOpen}>
				<Dialog.Trigger>
					<Button size="sm" class="gap-2" onclick={openCreateDialog}>
						<Plus class="w-4 h-4" /> Nuevo Proveedor
					</Button>
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-[600px]">
					<Dialog.Header>
						<Dialog.Title>{editingId ? 'Editar Proveedor' : 'Nuevo Proveedor de IA'}</Dialog.Title>
						<Dialog.Description>
							Guarda las credenciales de un motor de IA. Puedes guardar varios y elegir cuál usar.
						</Dialog.Description>
					</Dialog.Header>

					<div class="grid gap-6 py-2 max-h-[70vh] overflow-y-auto px-1">
						{#if saveError}
							<div class="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-xs flex gap-2 items-center">
								<AlertCircle class="w-4 h-4" /> {saveError}
							</div>
						{/if}

						{#if dialogTesting || dialogTestResult}
							<div class="p-3 rounded-lg border flex items-center gap-3 {dialogTestResult?.success ? 'bg-green-500/5 border-green-500/20 text-green-600' : (dialogTestResult && !dialogTestResult.success ? 'bg-red-500/5 border-red-500/20 text-red-600' : 'bg-muted/50')}">
								<Activity class="w-4 h-4 {dialogTesting ? 'animate-pulse' : ''}" />
								<span class="text-sm font-medium">{dialogTesting ? 'Probando conexión...' : dialogTestResult?.msg}</span>
							</div>
						{/if}

						<div class="flex flex-col gap-2">
							<Label for="prov-name">Nombre</Label>
							<Input id="prov-name" bind:value={name} placeholder="Ej: Gemini personal" />
						</div>

						<div class="flex flex-col gap-2">
							<Label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tipo de Proveedor</Label>
							<div class="flex flex-wrap gap-2">
								{#each Object.entries(PRESETS) as [key, preset]}
									<Button
										type="button"
										variant={provider === key ? 'default' : 'outline'}
										size="sm"
										onclick={() => { provider = key; endpoint_url = preset.endpoint_url; }}
										class="h-8 text-xs"
									>
										{preset.label}
									</Button>
								{/each}
							</div>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div class="flex flex-col gap-4">
								<div class="flex flex-col gap-2">
									<Label class="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><Settings2 class="w-3 h-3" /> Timeout (s)</Label>
									<Input type="number" bind:value={timeout_s} min="5" max="600" />
								</div>
								<div class="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30 border">
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
									<Textarea bind:value={extra_payload_raw} placeholder={'{"num_ctx": 4096}'} class="font-mono text-xs h-20" />
									{#if extra_payload_err}<p class="text-[10px] text-destructive">{extra_payload_err}</p>{/if}
								</div>
								<div class="flex flex-col gap-2">
									<Label class="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><ListChecks class="w-3 h-3" /> Extra Headers (JSON)</Label>
									<Textarea bind:value={extra_headers_raw} placeholder={'{"X-Custom": "value"}'} class="font-mono text-xs h-20" />
									{#if extra_headers_err}<p class="text-[10px] text-destructive">{extra_headers_err}</p>{/if}
								</div>
							</div>
						</div>
					</div>

					<Dialog.Footer class="sm:justify-between">
						<Button variant="outline" onclick={testDialogProvider} disabled={saving || dialogTesting} class="gap-2">
							<Activity class="w-4 h-4 {dialogTesting ? 'animate-pulse' : ''}" /> {dialogTesting ? 'Probando...' : 'Probar Conexión'}
						</Button>
						<div class="flex gap-2">
							<Button variant="outline" onclick={() => isDialogOpen = false} disabled={saving}>Cancelar</Button>
							<Button onclick={saveProvider} disabled={saving}>
								{saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Guardar')}
							</Button>
						</div>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
		</div>
		<CardDescription>Guarda los motores de IA que quieras usar y elige cuál está activo.</CardDescription>
	</CardHeader>

	<CardContent class="p-6">
		{#if loading}
			<div class="flex flex-col items-center justify-center py-16 text-muted-foreground animate-pulse">
				<RefreshCw class="w-8 h-8 animate-spin mb-3 opacity-20" />
				<p>Cargando proveedores...</p>
			</div>
		{:else}
			{#if listError}<div class="p-3 mb-4 text-sm text-destructive bg-destructive/10 rounded-md">{listError}</div>{/if}

			{#if providers.length === 0}
				<div class="p-10 text-center border-2 border-dashed rounded-lg text-muted-foreground">
					No hay proveedores guardados. Crea el primero con "Nuevo Proveedor".
				</div>
			{:else}
				<div class="grid gap-4 md:grid-cols-2">
					{#each providers as p (p.id)}
						<Card class="overflow-hidden {p.is_active ? 'border-primary/40' : ''} transition-all">
							<CardHeader class="pb-3">
								<div class="flex items-start justify-between gap-2">
									<div class="flex flex-col gap-1">
										<Badge variant="outline" class="h-auto w-fit rounded px-1.5 py-0.5 text-[9px] font-bold uppercase border-none bg-primary/10 text-primary">{PRESETS[p.provider]?.label ?? p.provider}</Badge>
										<CardTitle class="text-base leading-tight mt-1">{p.name}</CardTitle>
										<span class="text-[10px] font-mono text-muted-foreground truncate max-w-[220px]">{p.endpoint_url}</span>
									</div>
									{#if p.is_active}
										<Badge variant="default" class="bg-green-500/15 text-green-600 dark:text-green-400 border-none shadow-none flex items-center gap-1 shrink-0">
											<CheckCircle2 class="w-3 h-3" /> Activo
										</Badge>
									{/if}
								</div>
							</CardHeader>
							<CardContent>
								{#if testResult && testResult.id === p.id}
									<div class="mb-3 px-2 py-1.5 rounded text-[10px] font-bold {testResult.success ? 'text-emerald-500 bg-emerald-500/10' : 'text-destructive bg-destructive/10'}">
										{testResult.msg}
									</div>
								{/if}
								<div class="flex items-center justify-between gap-2 flex-wrap">
									<div class="flex gap-1">
										<Button variant="outline" size="icon" class="h-7 w-7" onclick={() => testProvider(p)} disabled={testingId === p.id} title="Probar conexión">
											<Play class="w-3 h-3 {testingId === p.id ? 'animate-spin' : ''}" />
										</Button>
										<Button variant="outline" size="icon" class="h-7 w-7" onclick={() => openEditDialog(p)} title="Editar">
											<Settings2 class="w-3 h-3" />
										</Button>
										{#if !p.is_active}
											<Button variant="outline" size="sm" class="h-7 text-xs gap-1" onclick={() => activateProvider(p)} disabled={activatingId === p.id} title="Usar este proveedor">
												<Check class="w-3 h-3" /> {activatingId === p.id ? 'Activando...' : 'Usar'}
											</Button>
										{/if}
									</div>
									<Button variant="ghost" size="icon" class="h-7 w-7 text-muted-foreground hover:text-destructive" onclick={() => deleteProvider(p)} disabled={deletingId === p.id} title="Eliminar">
										<Trash2 class="w-3 h-3" />
									</Button>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			{/if}
		{/if}
	</CardContent>
</Card>
