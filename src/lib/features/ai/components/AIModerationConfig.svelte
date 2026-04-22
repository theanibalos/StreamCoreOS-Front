<script lang="ts">
	import { onMount } from 'svelte';
	import { get, post, put, del } from '$lib/core/api/client';
	import type { ApiResponse } from '$lib/types/api';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import { ShieldAlert, ShieldCheck, RefreshCw, Plus, Pencil, Trash2, Brain, Sparkles } from '@lucide/svelte';

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

	let rules = $state<ModRuleData[]>([]);
	let aiConfigured = $state(false);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let showForm = $state(false);
	let newPrompt = $state('');
	let newAction = $state<string>('timeout');
	let newDuration = $state(600);
	let creating = $state(false);
	let formError = $state<string | null>(null);

	let editingId = $state<number | null>(null);
	let editPrompt = $state('');
	let editAction = $state('timeout');
	let editDuration = $state(600);
	let saving = $state(false);

	async function load() {
		loading = true; error = null;
		try {
			const [rulesRes, aiRes] = await Promise.all([
				get<ListModRulesResponse>('/moderation/rules'),
				get<GetAIConfigResponse>('/ai/config')
			]);
			const all = rulesRes.success && rulesRes.data ? rulesRes.data : [];
			rules = all.filter((r) => r.type === 'ai_filter');
			aiConfigured = Boolean(aiRes.success && aiRes.data?.endpoint_url && aiRes.data?.model);
		} catch (e) { error = e instanceof Error ? e.message : String(e); } finally { loading = false; }
	}

	onMount(load);

	async function create() {
		if (!newPrompt.trim()) { formError = 'El prompt de detección es obligatorio.'; return; }
		creating = true; formError = null;
		try {
			const body: Record<string, unknown> = { type: 'ai_filter', value: newPrompt.trim(), action: newAction };
			if (newAction === 'timeout') body.duration_s = newDuration;

			const res = await post<CreateModRuleResponse>('/moderation/rules', body);
			if (res.success && res.data) {
				rules = [...rules, res.data];
				newPrompt = ''; newAction = 'timeout'; newDuration = 600; showForm = false;
			} else { formError = res.error ?? 'Error al crear la regla.'; }
		} catch (e) { formError = e instanceof Error ? e.message : String(e); } finally { creating = false; }
	}

	async function toggleEnabled(rule: ModRuleData) {
		try {
			const res = await put<UpdateModRuleResponse>(`/moderation/rules/${rule.id}`, { enabled: !rule.enabled });
			if (res.success && res.data) { rules = rules.map((r) => (r.id === rule.id ? res.data! : r)); }
		} catch (e) { error = e instanceof Error ? e.message : String(e); }
	}

	function startEdit(rule: ModRuleData) {
		editingId = rule.id; editPrompt = rule.value ?? ''; editAction = rule.action; editDuration = rule.duration_s ?? 600;
	}

	async function saveEdit(id: number) {
		saving = true;
		try {
			const body: Record<string, unknown> = { value: editPrompt.trim(), action: editAction };
			if (editAction === 'timeout') body.duration_s = editDuration;
			const res = await put<UpdateModRuleResponse>(`/moderation/rules/${id}`, body);
			if (res.success && res.data) { rules = rules.map((r) => (r.id === id ? res.data! : r)); editingId = null; }
		} catch (e) { error = e instanceof Error ? e.message : String(e); } finally { saving = false; }
	}

	async function remove(id: number) {
		if (!confirm('¿Eliminar esta regla de IA?')) return;
		try {
			const res = await del<DeleteModRuleResponse>(`/moderation/rules/${id}`);
			if (res.success) { rules = rules.filter((r) => r.id !== id); }
		} catch (e) { error = e instanceof Error ? e.message : String(e); }
	}

	function actionColor(a: string) {
		if (a === 'ban') return 'bg-red-500/15 text-red-600 dark:text-red-400';
		if (a === 'timeout') return 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400';
		return 'bg-blue-500/15 text-blue-600 dark:text-blue-400';
	}
</script>

<Card class="w-full h-full flex flex-col">
	<CardHeader class="border-b pb-4">
		<div class="flex items-center justify-between">
			<CardTitle class="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
				<ShieldAlert class="w-5 h-5 text-primary" /> Moderación por IA
			</CardTitle>
			{#if aiConfigured}
				<Badge variant="default" class="bg-green-500/15 text-green-600 dark:text-green-400 border-none shadow-none">Activo</Badge>
			{:else}
				<Badge variant="secondary">Inactivo</Badge>
			{/if}
		</div>
		<CardDescription>Usa inteligencia artificial para detectar comportamientos complejos que los filtros de palabras no captan.</CardDescription>
	</CardHeader>

	<CardContent class="p-6 flex-1 flex flex-col gap-6">
		<div class="flex items-center justify-between">
			<span class="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
				<Brain class="w-3 h-3" /> Reglas de Detección
			</span>
			<div class="flex gap-2">
				<Button variant="outline" size="icon" class="h-8 w-8" onclick={load} disabled={loading}>
					<RefreshCw class="w-4 h-4 {loading ? 'animate-spin' : ''}" />
				</Button>
				<Button size="sm" onclick={() => showForm = !showForm} disabled={!aiConfigured}>
					{showForm ? 'Cancelar' : 'Nueva Regla'}
				</Button>
			</div>
		</div>

		{#if !aiConfigured && !loading}
			<div class="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-yellow-600 text-sm flex items-start gap-3">
				<Sparkles class="w-5 h-5 mt-0.5 flex-shrink-0" />
				<p>Debes configurar un proveedor de IA en la pestaña <strong>Proveedores</strong> antes de poder activar reglas de moderación automática.</p>
			</div>
		{/if}

		{#if error}<div class="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>{/if}

		{#if showForm}
			<Card class="bg-muted/30 border-dashed">
				<CardContent class="p-4 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<Label class="text-xs uppercase tracking-widest text-muted-foreground">Prompt de Detección</Label>
						<Textarea bind:value={newPrompt} placeholder="Ej: Detecta insultos pasivo-agresivos, sarcasmo tóxico o incitación al odio..." />
						<p class="text-[10px] text-muted-foreground">La IA analizará cada mensaje buscando lo que describas aquí.</p>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<Label class="text-xs uppercase tracking-widest text-muted-foreground">Acción</Label>
							<select bind:value={newAction} class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
								{#each ACTIONS as a}<option value={a}>{a}</option>{/each}
							</select>
						</div>
						{#if newAction === 'timeout'}
							<div class="flex flex-col gap-2">
								<Label class="text-xs uppercase tracking-widest text-muted-foreground">Duración (s)</Label>
								<Input type="number" bind:value={newDuration} />
							</div>
						{/if}
					</div>
					{#if formError}<p class="text-xs text-destructive">{formError}</p>{/if}
					<Button size="sm" onclick={create} disabled={creating} class="self-end">Guardar Regla</Button>
				</CardContent>
			</Card>
		{/if}

		<div class="flex flex-col gap-4">
			{#if loading && rules.length === 0}
				<div class="text-center py-10 text-muted-foreground italic">Cargando reglas de IA...</div>
			{:else if rules.length === 0}
				<div class="text-center py-10 border-2 border-dashed rounded-lg text-muted-foreground italic">No hay reglas de IA configuradas.</div>
			{:else}
				{#each rules as rule (rule.id)}
					{#if editingId === rule.id}
						<div class="p-4 border-2 border-primary rounded-lg flex flex-col gap-4 bg-background">
							<Textarea bind:value={editPrompt} />
							<div class="flex justify-between gap-4">
								<div class="flex gap-2 items-center">
									<select bind:value={editAction} class="h-8 rounded border text-xs bg-muted">
										{#each ACTIONS as a}<option value={a}>{a}</option>{/each}
									</select>
									{#if editAction === 'timeout'}
										<Input type="number" bind:value={editDuration} class="h-8 w-20 text-xs" />
									{/if}
								</div>
								<div class="flex gap-2">
									<Button variant="ghost" size="sm" onclick={() => editingId = null}>Cancelar</Button>
									<Button size="sm" onclick={() => saveEdit(rule.id)} disabled={saving}>Guardar</Button>
								</div>
							</div>
						</div>
					{:else}
						<div class="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors flex flex-col gap-3 {!rule.enabled ? 'opacity-50' : ''}">
							<p class="text-sm italic leading-relaxed text-foreground">"{rule.value}"</p>
							<div class="flex items-center justify-between border-t pt-3">
								<div class="flex items-center gap-2">
									<Badge class="{actionColor(rule.action)} border-none shadow-none text-[10px] uppercase font-black">{rule.action}</Badge>
									{#if rule.action === 'timeout'}
										<span class="text-[10px] font-mono text-muted-foreground">{rule.duration_s}s</span>
									{/if}
								</div>
								<div class="flex items-center gap-1">
									<Switch checked={rule.enabled} onCheckedChange={() => toggleEnabled(rule)} />
									<Button variant="ghost" size="icon" class="h-8 w-8" onclick={() => startEdit(rule)}><Pencil class="w-3.5 h-3.5" /></Button>
									<Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-destructive" onclick={() => remove(rule.id)}><Trash2 class="w-3.5 h-3.5" /></Button>
								</div>
							</div>
						</div>
					{/if}
				{/each}
			{/if}
		</div>
	</CardContent>
</Card>
