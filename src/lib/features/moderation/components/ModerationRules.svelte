<script lang="ts">
	import { onMount } from 'svelte';
	import { get, post, put, del } from '$lib/core/api/client';
	import type {
		ModRuleData,
		ListModRulesResponse,
		CreateModRuleResponse,
		UpdateModRuleResponse,
		DeleteModRuleResponse
	} from '$lib/types/api';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Switch } from '$lib/components/ui/switch';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import * as Table from '$lib/components/ui/table';
	import { 
		RefreshCw, Plus, Pencil, Trash2, ShieldAlert, 
		ShieldCheck, Clock, ListFilter, Globe, Lock, AlertTriangle, MessageSquare
	} from '@lucide/svelte';

	const RULE_TYPES = [
		{ id: 'word_filter', label: 'Palabras', icon: MessageSquare },
		{ id: 'link_filter', label: 'Enlaces', icon: Globe },
		{ id: 'caps_filter', label: 'Mayúsculas', icon: ShieldAlert },
		{ id: 'spam_filter', label: 'Spam', icon: AlertTriangle }
	] as const;

	const ACTIONS = ['timeout', 'ban', 'delete'] as const;

	let rules = $state<ModRuleData[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeTab = $state<string>('word_filter');

	let editingId = $state<number | null>(null);
	let editValue = $state('');
	let editAction = $state<string>('timeout');
	let editDuration = $state(600);
	let editEnabled = $state(true);
	let saving = $state(false);

	let showForm = $state(false);
	let newValue = $state('');
	let newAction = $state<string>('timeout');
	let newDuration = $state(600);
	let creating = $state(false);
	let formError = $state<string | null>(null);

	let filteredRules = $derived(rules.filter(r => r.type === activeTab));

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await get<ListModRulesResponse>('/moderation/rules');
			rules = res.success && res.data ? res.data : [];
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function create() {
		formError = null;
		creating = true;
		try {
			const body: Record<string, unknown> = { type: activeTab, action: newAction };
			if (newValue.trim()) body.value = newValue.trim();
			if (newAction === 'timeout') body.duration_s = newDuration;

			const res = await post<CreateModRuleResponse>('/moderation/rules', body);
			if (res.success && res.data) {
				rules = [...rules, res.data];
				newValue = ''; newAction = 'timeout'; newDuration = 600;
				showForm = false;
			} else {
				formError = res.error ?? 'Error al crear la regla.';
			}
		} catch (e) {
			formError = e instanceof Error ? e.message : String(e);
		} finally {
			creating = false;
		}
	}

	function startEdit(rule: ModRuleData) {
		editingId = rule.id; editValue = rule.value ?? ''; editAction = rule.action;
		editDuration = rule.duration_s ?? 600; editEnabled = rule.enabled;
	}

	async function saveEdit(id: number) {
		saving = true;
		try {
			const body: Record<string, unknown> = { value: editValue || null, action: editAction, enabled: editEnabled };
			if (editAction === 'timeout') body.duration_s = editDuration;

			const res = await put<UpdateModRuleResponse>(`/moderation/rules/${id}`, body);
			if (res.success && res.data) {
				rules = rules.map((r) => (r.id === id ? res.data! : r));
				editingId = null;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}

	async function toggleEnabled(rule: ModRuleData) {
		try {
			const res = await put<UpdateModRuleResponse>(`/moderation/rules/${rule.id}`, { enabled: !rule.enabled });
			if (res.success && res.data) {
				rules = rules.map((r) => (r.id === rule.id ? res.data! : r));
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	async function remove(id: number) {
		if (!confirm('¿Eliminar esta regla?')) return;
		try {
			const res = await del<DeleteModRuleResponse>(`/moderation/rules/${id}`);
			if (res.success) {
				rules = rules.filter((r) => r.id !== id);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	function actionColor(a: string) {
		if (a === 'ban') return 'bg-red-500/15 text-red-600 dark:text-red-400';
		if (a === 'timeout') return 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400';
		return 'bg-blue-500/15 text-blue-600 dark:text-blue-400';
	}
</script>

<Card class="w-full">
	<CardHeader class="border-b pb-4">
		<div class="flex items-center justify-between">
			<div class="flex flex-col gap-1">
				<CardTitle class="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
					<ShieldCheck class="w-6 h-6 text-primary" /> Filtros de Auto-Moderación
				</CardTitle>
				<CardDescription>Configura cómo StreamCoreOS debe actuar ante mensajes no deseados.</CardDescription>
			</div>
			<div class="flex gap-2">
				<Button variant="outline" size="icon" onclick={load} disabled={loading}>
					<RefreshCw class="w-4 h-4 {loading ? 'animate-spin' : ''}" />
				</Button>
				<Button onclick={() => showForm = !showForm} variant={showForm ? "secondary" : "default"} class="h-9">
					<Plus class="w-4 h-4 mr-2" /> {showForm ? 'Cancelar' : 'Añadir Regla'}
				</Button>
			</div>
		</div>
	</CardHeader>

	<Tabs value={activeTab} onValueChange={(v) => { activeTab = v; showForm = false; editingId = null; }} class="w-full">
		<div class="px-6 pt-4 bg-muted/20">
			<TabsList class="grid grid-cols-4 w-full max-w-2xl h-10">
				{#each RULE_TYPES as t}
					<TabsTrigger value={t.id} class="text-xs font-bold uppercase tracking-tight flex items-center gap-2">
						<t.icon class="w-3.5 h-3.5" /> {t.label}
					</TabsTrigger>
				{/each}
			</TabsList>
		</div>

		{#each RULE_TYPES as t}
			<TabsContent value={t.id} class="mt-0">
				{#if showForm}
					<div class="p-6 bg-primary/5 border-b flex flex-col gap-4 animate-in slide-in-from-top-2 duration-300">
						<div class="flex items-center gap-2 mb-2">
							<Badge class="bg-primary/20 text-primary border-none shadow-none uppercase text-[10px] font-black tracking-widest">Nueva Regla: {t.label}</Badge>
						</div>
						<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
							<div class="md:col-span-2 flex flex-col gap-2">
								<label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor del filtro</label>
								<Input bind:value={newValue} placeholder="Ej: insulto1, insulto2, bad-domain.com" />
								<p class="text-[10px] text-muted-foreground italic">Separa por comas si el backend lo soporta o añade una por una.</p>
							</div>
							<div class="flex flex-col gap-2">
								<label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Acción</label>
								<select bind:value={newAction} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
									{#each ACTIONS as a}<option value={a}>{a}</option>{/each}
								</select>
							</div>
							{#if newAction === 'timeout'}
								<div class="flex flex-col gap-2">
									<label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tiempo (s)</label>
									<Input type="number" bind:value={newDuration} />
								</div>
							{/if}
						</div>
						{#if formError}<p class="text-xs text-destructive bg-destructive/10 p-2 rounded">{formError}</p>{/if}
						<div class="flex justify-end pt-2">
							<Button onclick={create} disabled={creating} class="px-8">{creating ? 'Creando...' : 'Crear Regla'}</Button>
						</div>
					</div>
				{/if}

				<Table.Root>
					<Table.Header class="bg-muted/30">
						<Table.Row>
							<Table.Head class="w-[350px]">Filtro / Valor</Table.Head>
							<Table.Head class="text-center">Acción</Table.Head>
							<Table.Head class="text-center">Parámetros</Table.Head>
							<Table.Head class="text-center">Habilitado</Table.Head>
							<Table.Head class="text-right">Gestión</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#if loading && filteredRules.length === 0}
							<Table.Row><Table.Cell colspan={5} class="text-center py-20 text-muted-foreground italic">Cargando filtros...</Table.Cell></Table.Row>
						{:else if filteredRules.length === 0}
							<Table.Row>
								<Table.Cell colspan={5} class="text-center py-20 border-2 border-dashed mx-6 my-4 rounded-xl text-muted-foreground">
									<div class="flex flex-col items-center gap-2">
										<ShieldCheck class="w-10 h-10 opacity-20" />
										<p>No hay reglas para {t.label}.</p>
										<Button variant="outline" size="sm" class="mt-2" onclick={() => showForm = true}>Crear la primera</Button>
									</div>
								</Table.Cell>
							</Table.Row>
						{:else}
							{#each filteredRules as rule (rule.id)}
								{#if editingId === rule.id}
									<Table.Row class="bg-muted/50">
										<Table.Cell colspan={5} class="p-6">
											<div class="flex flex-col gap-4 border-2 border-primary rounded-2xl p-6 bg-background shadow-xl">
												<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
													<div class="flex flex-col gap-2">
														<label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Editar Valor</label>
														<Input bind:value={editValue} />
													</div>
													<div class="flex gap-4">
														<div class="flex flex-col gap-2 flex-1">
															<label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Acción</label>
															<select bind:value={editAction} class="h-10 rounded-md border text-sm px-2">
																{#each ACTIONS as a}<option value={a}>{a}</option>{/each}
															</select>
														</div>
														{#if editAction === 'timeout'}
															<div class="flex flex-col gap-2 w-28">
																<label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tiempo (s)</label>
																<Input type="number" bind:value={editDuration} />
															</div>
														{/if}
													</div>
												</div>
												<div class="flex items-center justify-between pt-4 border-t">
													<div class="flex items-center gap-3">
														<Switch checked={editEnabled} onCheckedChange={(v) => editEnabled = v} />
														<span class="text-xs font-black uppercase tracking-widest text-muted-foreground">Activo</span>
													</div>
													<div class="flex gap-2">
														<Button variant="ghost" onclick={() => editingId = null}>Cancelar</Button>
														<Button onclick={() => saveEdit(rule.id)} disabled={saving}>{saving ? 'Guardando...' : 'Guardar Cambios'}</Button>
													</div>
												</div>
											</div>
										</Table.Cell>
									</Table.Row>
								{:else}
									<Table.Row class="hover:bg-muted/20 { !rule.enabled ? 'opacity-50 grayscale' : '' }">
										<Table.Cell class="py-4">
											<div class="flex flex-col gap-1">
												<span class="font-mono text-sm font-bold">{rule.value ?? '(*)'}</span>
												<span class="text-[10px] text-muted-foreground uppercase tracking-widest font-black">{t.label}</span>
											</div>
										</Table.Cell>
										<Table.Cell class="text-center">
											<Badge class="{actionColor(rule.action)} border-none shadow-none text-[10px] uppercase font-black h-5 px-2">
												{rule.action}
											</Badge>
										</Table.Cell>
										<Table.Cell class="text-center">
											{#if rule.action === 'timeout'}
												<Badge variant="outline" class="font-mono text-[10px]">{rule.duration_s}s</Badge>
											{:else}
												<span class="text-muted-foreground text-xs">—</span>
											{/if}
										</Table.Cell>
										<Table.Cell class="text-center">
											<div class="flex justify-center">
												<Switch checked={rule.enabled} onCheckedChange={() => toggleEnabled(rule)} />
											</div>
										</Table.Cell>
										<Table.Cell class="text-right">
											<div class="flex justify-end gap-1">
												<Button variant="ghost" size="icon" class="h-8 w-8 hover:bg-primary/10 hover:text-primary" onclick={() => startEdit(rule)}>
													<Pencil class="w-3.5 h-3.5" />
												</Button>
												<Button variant="ghost" size="icon" class="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onclick={() => remove(rule.id)}>
													<Trash2 class="w-3.5 h-3.5" />
												</Button>
											</div>
										</Table.Cell>
									</Table.Row>
								{/if}
							{/each}
						{/if}
					</Table.Body>
				</Table.Root>
			</TabsContent>
		{/each}
	</Tabs>
</Card>
