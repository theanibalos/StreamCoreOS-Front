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
	import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { Switch } from '$lib/components/ui/switch';
	import * as Dialog from '$lib/components/ui/dialog';
	import {
		RefreshCw, Settings2, ShieldCheck, ShieldAlert,
		Globe, MessageSquare, Repeat
	} from '@lucide/svelte';

	const ACTIONS = ['timeout', 'ban', 'delete'] as const;

	// Grupos que se pueden eximir de una regla puntual. El broadcaster está
	// siempre exento (no es configurable, por seguridad).
	const EXEMPT_ROLES = [
		{ id: 'mod', label: 'Mods' },
		{ id: 'vip', label: 'VIPs' },
		{ id: 'sub', label: 'Subs' },
		{ id: 'regular', label: 'Regulars' }
	] as const;

	// Un solo filtro (regla) activo por tipo, al estilo Nightbot: tarjeta con
	// descripción fija + toggle de encendido + engranaje para parámetros.
	const RULE_TYPES = [
		{
			id: 'word_filter',
			label: 'Palabras Bloqueadas',
			icon: MessageSquare,
			description: 'Permite sancionar a usuarios que escriban palabras, frases o patrones específicos.',
			usesValue: true,
			valueLabel: 'Palabras (separadas por coma)',
			valuePlaceholder: 'Ej: insulto1, insulto2'
		},
		{
			id: 'link_filter',
			label: 'Enlaces',
			icon: Globe,
			description: 'Permite sancionar a usuarios que compartan enlaces (http, https o www) en el chat.',
			usesValue: false,
			valueLabel: '',
			valuePlaceholder: ''
		},
		{
			id: 'caps_filter',
			label: 'Exceso de Mayúsculas',
			icon: ShieldAlert,
			description: 'Permite sancionar mensajes de más de 10 caracteres donde más del 70% son mayúsculas.',
			usesValue: false,
			valueLabel: '',
			valuePlaceholder: ''
		},
		{
			id: 'spam_filter',
			label: 'Repeticiones',
			icon: Repeat,
			description: 'Permite sancionar mensajes con 5 o más caracteres idénticos seguidos (ej: "holaaaaa").',
			usesValue: false,
			valueLabel: '',
			valuePlaceholder: ''
		}
	] as const;

	let rules = $state<ModRuleData[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// La "regla principal" de cada tipo — la primera encontrada. Este UI asume
	// un único filtro configurado por tipo, igual que Nightbot.
	function ruleFor(typeId: string): ModRuleData | undefined {
		return rules.find((r) => r.type === typeId);
	}

	let dialogOpen = $state(false);
	let dialogType = $state<(typeof RULE_TYPES)[number] | null>(null);
	let dialogRuleId = $state<number | null>(null);
	let dialogValue = $state('');
	let dialogAction = $state<string>('timeout');
	let dialogDuration = $state(600);
	let dialogEnabled = $state(true);
	let dialogExemptRoles = $state<string[]>(['mod']);
	let saving = $state(false);
	let dialogError = $state<string | null>(null);

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

	function openSettings(t: (typeof RULE_TYPES)[number]) {
		const rule = ruleFor(t.id);
		dialogType = t;
		dialogRuleId = rule?.id ?? null;
		dialogValue = rule?.value ?? '';
		dialogAction = rule?.action ?? 'timeout';
		dialogDuration = rule?.duration_s ?? 600;
		dialogEnabled = rule?.enabled ?? true;
		dialogExemptRoles = rule?.exempt_roles ?? ['mod'];
		dialogError = null;
		dialogOpen = true;
	}

	function toggleExemptRole(role: string) {
		dialogExemptRoles = dialogExemptRoles.includes(role)
			? dialogExemptRoles.filter((r) => r !== role)
			: [...dialogExemptRoles, role];
	}

	async function saveDialog() {
		if (!dialogType) return;
		saving = true;
		dialogError = null;
		try {
			if (dialogRuleId) {
				const body: Record<string, unknown> = {
					action: dialogAction,
					enabled: dialogEnabled,
					exempt_roles: dialogExemptRoles
				};
				if (dialogType.usesValue) body.value = dialogValue.trim() || null;
				if (dialogAction === 'timeout') body.duration_s = dialogDuration;

				const res = await put<UpdateModRuleResponse>(`/moderation/rules/${dialogRuleId}`, body);
				if (res.success && res.data) {
					rules = rules.map((r) => (r.id === dialogRuleId ? res.data! : r));
					dialogOpen = false;
				} else {
					dialogError = res.error ?? 'Error al guardar los cambios.';
				}
			} else {
				const body: Record<string, unknown> = {
					type: dialogType.id,
					action: dialogAction,
					exempt_roles: dialogExemptRoles
				};
				if (dialogType.usesValue && dialogValue.trim()) body.value = dialogValue.trim();
				if (dialogAction === 'timeout') body.duration_s = dialogDuration;

				const res = await post<CreateModRuleResponse>('/moderation/rules', body);
				if (res.success && res.data) {
					rules = [...rules, res.data];
					if (!dialogEnabled) {
						await put<UpdateModRuleResponse>(`/moderation/rules/${res.data.id}`, { enabled: false });
						rules = rules.map((r) => (r.id === res.data!.id ? { ...r, enabled: false } : r));
					}
					dialogOpen = false;
				} else {
					dialogError = res.error ?? 'Error al crear el filtro.';
				}
			}
		} catch (e) {
			dialogError = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}

	async function removeDialogRule() {
		if (!dialogRuleId) return;
		if (!confirm('¿Eliminar este filtro?')) return;
		saving = true;
		try {
			const res = await del<DeleteModRuleResponse>(`/moderation/rules/${dialogRuleId}`);
			if (res.success) {
				rules = rules.filter((r) => r.id !== dialogRuleId);
				dialogOpen = false;
			}
		} catch (e) {
			dialogError = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}

	async function toggleType(t: (typeof RULE_TYPES)[number], on: boolean) {
		const rule = ruleFor(t.id);
		error = null;
		try {
			if (rule) {
				const res = await put<UpdateModRuleResponse>(`/moderation/rules/${rule.id}`, { enabled: on });
				if (res.success && res.data) {
					rules = rules.map((r) => (r.id === rule.id ? res.data! : r));
				} else {
					error = res.error ?? 'No se pudo actualizar el filtro.';
				}
			} else if (on) {
				// No existe filtro todavía para este tipo: se crea uno con la acción por defecto.
				const res = await post<CreateModRuleResponse>('/moderation/rules', {
					type: t.id,
					action: 'timeout',
					duration_s: 600,
					exempt_roles: ['mod']
				});
				if (res.success && res.data) {
					rules = [...rules, res.data];
				} else {
					error = res.error ?? 'No se pudo crear el filtro.';
				}
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
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
			<Button variant="outline" size="icon" onclick={load} disabled={loading}>
				<RefreshCw class="w-4 h-4 {loading ? 'animate-spin' : ''}" />
			</Button>
		</div>
	</CardHeader>

	<CardContent class="p-6">
		{#if error}<p class="text-xs text-destructive bg-destructive/10 p-2 rounded mb-4">{error}</p>{/if}

		{#if loading && rules.length === 0}
			<div class="text-center py-16 text-muted-foreground italic text-sm">Cargando filtros...</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
				{#each RULE_TYPES as t}
					{@const rule = ruleFor(t.id)}
					{@const isEnabled = rule?.enabled ?? false}
					<div class="rounded-xl border bg-card flex flex-col {isEnabled ? '' : 'opacity-60 grayscale-[0.5]'} transition-all">
						<div class="p-4 flex gap-3">
							<div class="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
								<t.icon class="w-4 h-4" />
							</div>
							<div class="flex flex-col gap-0.5">
								<span class="font-bold text-sm">{t.label}</span>
								<span class="text-xs text-muted-foreground">{t.description}</span>
							</div>
						</div>
						<div class="mt-auto flex items-center justify-between border-t px-4 py-3">
							<div class="flex items-center gap-2">
								<Switch checked={isEnabled} onCheckedChange={(v) => toggleType(t, v)} />
								<span class="text-xs font-bold {isEnabled ? 'text-emerald-500' : 'text-muted-foreground/50'}">
									{isEnabled ? 'Activado' : 'Desactivado'}
								</span>
							</div>
							<Button variant="outline" size="icon" class="h-8 w-8" onclick={() => openSettings(t)}>
								<Settings2 class="w-3.5 h-3.5" />
							</Button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</CardContent>
</Card>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="sm:max-w-[480px]">
		{#if dialogType}
			<Dialog.Header>
				<Dialog.Title class="flex items-center gap-2">
					<dialogType.icon class="w-4 h-4 text-primary" /> {dialogType.label}
				</Dialog.Title>
				<Dialog.Description>{dialogType.description}</Dialog.Description>
			</Dialog.Header>

			<div class="flex flex-col gap-4 py-2">
				{#if dialogType.usesValue}
					<div class="flex flex-col gap-2">
						<label for="mod-dialog-value" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
							{dialogType.valueLabel}
						</label>
						<Input id="mod-dialog-value" bind:value={dialogValue} placeholder={dialogType.valuePlaceholder} />
					</div>
				{/if}

				<div class="grid grid-cols-2 gap-4">
					<div class="flex flex-col gap-2">
						<label for="mod-dialog-action" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Acción</label>
						<select id="mod-dialog-action" bind:value={dialogAction} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
							{#each ACTIONS as a}<option value={a}>{a}</option>{/each}
						</select>
					</div>
					{#if dialogAction === 'timeout'}
						<div class="flex flex-col gap-2">
							<label for="mod-dialog-duration" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tiempo (s)</label>
							<Input id="mod-dialog-duration" type="number" bind:value={dialogDuration} />
						</div>
					{/if}
				</div>

				<div class="flex flex-col gap-2 pt-2 border-t">
					<label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground pt-2">
						Excluir de este filtro
					</label>
					<div class="flex flex-wrap gap-2">
						{#each EXEMPT_ROLES as r}
							<Badge
								variant="outline"
								onclick={() => toggleExemptRole(r.id)}
								class="cursor-pointer rounded-full px-3 py-1 text-xs transition-colors {
									dialogExemptRoles.includes(r.id)
										? 'bg-primary/10 border-primary text-primary font-bold'
										: 'text-muted-foreground hover:bg-muted/60'
								}"
							>
								{r.label}
							</Badge>
						{/each}
					</div>
					<p class="text-[10px] text-muted-foreground italic">
						Estos grupos nunca van a disparar esta regla. El broadcaster siempre está exento.
					</p>
				</div>

				<div class="flex items-center gap-3 pt-2 border-t">
					<Switch checked={dialogEnabled} onCheckedChange={(v) => dialogEnabled = v} />
					<span class="text-xs font-black uppercase tracking-widest text-muted-foreground">Activado</span>
				</div>

				{#if dialogError}<p class="text-xs text-destructive bg-destructive/10 p-2 rounded">{dialogError}</p>{/if}
			</div>

			<Dialog.Footer class="sm:justify-between">
				{#if dialogRuleId}
					<Button variant="ghost" class="text-destructive hover:text-destructive" onclick={removeDialogRule} disabled={saving}>
						Eliminar
					</Button>
				{:else}
					<span></span>
				{/if}
				<Button onclick={saveDialog} disabled={saving}>{saving ? 'Guardando...' : 'Guardar Cambios'}</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
