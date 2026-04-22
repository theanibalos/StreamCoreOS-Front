<script lang="ts">
	import { onMount } from 'svelte';
	import { get, put } from '$lib/core/api/client';
	import type { ApiResponse } from '$lib/types/api';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { Slider } from '$lib/components/ui/slider';
	import { Textarea } from '$lib/components/ui/textarea';
	import { MessageSquare, Sparkles, Clock, Hash, RotateCcw, Save } from '@lucide/svelte';

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

	let loading = $state(true);
	let saving = $state(false);
	let error = $state<string | null>(null);
	let successMsg = $state<string | null>(null);

	let fullConfig = $state<AIConfigData | null>(null);

	let system_prompt = $state(DEFAULT_PROMPT);
	let max_tokens = $state(200);
	let temperature = $state(0.7);
	let chat_cooldown_s = $state(120);

	async function load() {
		loading = true; error = null;
		try {
			const res = await get<GetAIConfigResponse>('/ai/config');
			if (res.success && res.data) {
				fullConfig = res.data;
				system_prompt = res.data.chat_system_prompt || DEFAULT_PROMPT;
				max_tokens = res.data.chat_max_tokens ?? 200;
				temperature = res.data.chat_temperature ?? 0.7;
				chat_cooldown_s = res.data.chat_cooldown_s ?? 120;
			}
		} catch (e) { error = e instanceof Error ? e.message : String(e); } finally { loading = false; }
	}

	onMount(load);

	async function save() {
		if (!fullConfig) return;
		saving = true; error = null; successMsg = null;
		try {
			// Extract only fields valid for SaveAIConfigRequest
			const { 
				provider, endpoint_url, model, timeout_s, 
				disable_reasoning, extra_headers, extra_payload 
			} = fullConfig;

			const body = {
				provider,
				endpoint_url,
				model,
				timeout_s,
				disable_reasoning,
				extra_headers,
				extra_payload,
				chat_system_prompt: system_prompt.trim() || DEFAULT_PROMPT,
				chat_max_tokens: max_tokens,
				chat_temperature: temperature,
				chat_cooldown_s: chat_cooldown_s
			};

			const res = await put<SaveAIConfigResponse>('/ai/config', body);
			if (res.success) { successMsg = 'Configuración guardada correctamente.'; setTimeout(() => (successMsg = null), 3000); }
			else { error = res.error ?? 'Error al guardar.'; }
		} catch (e) { error = e instanceof Error ? e.message : String(e); } finally { saving = false; }
	}

	function reset() {
		system_prompt = DEFAULT_PROMPT; max_tokens = 200; temperature = 0.7; chat_cooldown_s = 120;
	}
</script>

<Card class="w-full h-full flex flex-col">
	<CardHeader class="border-b pb-4">
		<div class="flex items-center justify-between">
			<CardTitle class="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
				<MessageSquare class="w-5 h-5 text-primary" /> Personalidad del Chat (!ia)
			</CardTitle>
			<Badge variant="outline" class="font-mono bg-primary/5 border-primary/20 text-primary">!ia</Badge>
		</div>
		<CardDescription>Define cómo se comporta la IA cuando los usuarios interactúan con ella.</CardDescription>
	</CardHeader>

	<CardContent class="p-6 flex-1 flex flex-col gap-6">
		{#if loading}
			<div class="flex items-center justify-center py-10 text-muted-foreground italic">Cargando chatbot...</div>
		{:else if !fullConfig}
			<div class="p-8 text-center border-2 border-dashed rounded-lg text-muted-foreground">Configura un proveedor de IA primero.</div>
		{:else}
			{#if error}<div class="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>{/if}
			{#if successMsg}<div class="p-3 text-sm text-green-600 bg-green-500/10 rounded-md">{successMsg}</div>{/if}

			<div class="flex flex-col gap-2">
				<Label for="sys-prompt" class="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
					<Sparkles class="w-3 h-3" /> Personalidad (System Prompt)
				</Label>
				<Textarea 
					id="sys-prompt" 
					bind:value={system_prompt} 
					placeholder={DEFAULT_PROMPT} 
					class="min-h-[160px] text-sm leading-relaxed"
				/>
				<p class="text-[10px] text-muted-foreground">Instrucciones básicas que recibe la IA. Define el tono, idioma y límites.</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
				<div class="flex flex-col gap-6">
					<div class="flex flex-col gap-4">
						<div class="flex justify-between items-center">
							<Label class="text-xs uppercase tracking-widest text-muted-foreground">Creatividad (Temp)</Label>
							<Badge variant="secondary" class="font-mono">{temperature.toFixed(1)}</Badge>
						</div>
						<Slider value={[temperature]} min={0} max={2} step={0.1} onValueChange={(v) => temperature = v[0]} />
						<div class="flex justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
							<span>Preciso</span>
							<span>Creativo</span>
						</div>
					</div>

					<div class="flex flex-col gap-2">
						<Label for="cooldown" class="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
							<Clock class="w-3 h-3" /> Cooldown por Usuario (s)
						</Label>
						<Input id="cooldown" type="number" bind:value={chat_cooldown_s} />
					</div>
				</div>

				<div class="flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<Label for="max-tokens" class="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
							<Hash class="w-3 h-3" /> Max Tokens por Respuesta
						</Label>
						<Input id="max-tokens" type="number" bind:value={max_tokens} />
						<p class="text-[10px] text-muted-foreground">Aprox. 0.75 palabras por token. 200 tokens ≈ 150 palabras.</p>
					</div>
				</div>
			</div>
		{/if}
	</CardContent>

	<CardFooter class="border-t bg-muted/20 p-4 flex justify-between gap-4 mt-auto">
		<Button variant="ghost" size="sm" onclick={reset}>
			<RotateCcw class="w-4 h-4 mr-2" /> Restaurar
		</Button>
		<Button size="sm" onclick={save} disabled={saving || !fullConfig}>
			<Save class="w-4 h-4 mr-2" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
		</Button>
	</CardFooter>
</Card>
