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
		Globe, MessageSquare, Repeat, UserX, Plus, Trash2, Pencil, AtSign
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

	// Filtros base del chat
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

	// Filtros generales (aplican a todos los usuarios, salvo exentos)
	function generalRuleFor(typeId: string): ModRuleData | undefined {
		return rules.find((r) => r.type === typeId && (!r.target_users || r.target_users.length === 0));
	}

	// Filtros que apuntan a usuarios específicos
	let userRules = $derived(rules.filter((r) => r.target_users && r.target_users.length > 0));

	function typeMeta(typeId: string) {
		return RULE_TYPES.find((t) => t.id === typeId) ?? {
			id: typeId,
			label: typeId,
			icon: ShieldCheck,
			description: '',
			usesValue: false,
			valueLabel: '',
			valuePlaceholder: ''
		};
	}

	// Estado para el modal de filtros generales
	let dialogOpen = $state(false);
	let dialogType = $state<(typeof RULE_TYPES)[number] | null>(null);
	let dialogRuleId = $state<number | null>(null);
	let dialogValue = $state('');
	let dialogAction = $state<string>('timeout');
	let dialogDuration = $state(600);
	let dialogEnabled = $state(true);
	let dialogExemptRoles = $state<string[]>(['mod']);
	let dialogExemptUsers = $state('');
	let saving = $state(false);
	let dialogError = $state<string | null>(null);

	// Estado para el modal de reglas específicas por usuario
	let userRuleDialogOpen = $state(false);
	let userRuleId = $state<number | null>(null);
	let userRuleType = $state<string>('link_filter');
	let userRuleTargetUsers = $state('');
	let userRuleValue = $state('');
	let userRuleAction = $state<string>('timeout');
	let userRuleDuration = $state(600);
	let userRuleEnabled = $state(true);
	let userRuleSaving = $state(false);
	let userRuleError = $state<string | null>(null);

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
		const rule = generalRuleFor(t.id);
		dialogType = t;
		dialogRuleId = rule?.id ?? null;
		dialogValue = rule?.value ?? '';
		dialogAction = rule?.action ?? 'timeout';
		dialogDuration = rule?.duration_s ?? 600;
		dialogEnabled = rule?.enabled ?? true;
		dialogExemptRoles = rule?.exempt_roles ?? ['mod'];
		dialogExemptUsers = (rule?.exempt_users ?? []).join(', ');
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
			const exemptUsersList = dialogExemptUsers
				.split(',')
				.map((u) => u.trim().replace(/^@/, ''))
				.filter(Boolean);

			if (dialogRuleId) {
				const body: Record<string, unknown> = {
					action: dialogAction,
					enabled: dialogEnabled,
					exempt_roles: dialogExemptRoles,
					exempt_users: exemptUsersList
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
					exempt_roles: dialogExemptRoles,
					exempt_users: exemptUsersList
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
		const rule = generalRuleFor(t.id);
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

	// ─── Funciones para Reglas Específicas por Usuario ───────────────

	function openCreateUserRule() {
		userRuleId = null;
		userRuleType = 'link_filter';
		userRuleTargetUsers = '';
		userRuleValue = '';
		userRuleAction = 'timeout';
		userRuleDuration = 600;
		userRuleEnabled = true;
		userRuleError = null;
		userRuleDialogOpen = true;
	}

	function openEditUserRule(rule: ModRuleData) {
		userRuleId = rule.id;
		userRuleType = rule.type;
		userRuleTargetUsers = (rule.target_users ?? []).join(', ');
		userRuleValue = rule.value ?? '';
		userRuleAction = rule.action;
		userRuleDuration = rule.duration_s ?? 600;
		userRuleEnabled = rule.enabled;
		userRuleError = null;
		userRuleDialogOpen = true;
	}

	async function saveUserRuleDialog() {
		const targets = userRuleTargetUsers
			.split(',')
			.map((u) => u.trim().replace(/^@/, ''))
			.filter(Boolean);

		if (targets.length === 0) {
			userRuleError = 'Debes especificar al menos un nombre de usuario (ej: @nombre).';
			return;
		}

		if (userRuleType === 'word_filter' && !userRuleValue.trim()) {
			userRuleError = 'Debes ingresar las palabras que deseas bloquear para este usuario.';
			return;
		}

		userRuleSaving = true;
		userRuleError = null;

		try {
			if (userRuleId) {
				const body: Record<string, unknown> = {
					action: userRuleAction,
					enabled: userRuleEnabled,
					target_users: targets
				};
				if (userRuleType === 'word_filter') body.value = userRuleValue.trim() || null;
				if (userRuleAction === 'timeout') body.duration_s = userRuleDuration;

				const res = await put<UpdateModRuleResponse>(`/moderation/rules/${userRuleId}`, body);
				if (res.success && res.data) {
					rules = rules.map((r) => (r.id === userRuleId ? res.data! : r));
					userRuleDialogOpen = false;
				} else {
					userRuleError = res.error ?? 'Error al actualizar la regla.';
				}
			} else {
				const body: Record<string, unknown> = {
					type: userRuleType,
					action: userRuleAction,
					target_users: targets,
					exempt_roles: []
				};
				if (userRuleType === 'word_filter') body.value = userRuleValue.trim();
				if (userRuleAction === 'timeout') body.duration_s = userRuleDuration;

				const res = await post<CreateModRuleResponse>('/moderation/rules', body);
				if (res.success && res.data) {
					rules = [...rules, res.data];
					if (!userRuleEnabled) {
						await put<UpdateModRuleResponse>(`/moderation/rules/${res.data.id}`, { enabled: false });
						rules = rules.map((r) => (r.id === res.data!.id ? { ...r, enabled: false } : r));
					}
					userRuleDialogOpen = false;
				} else {
					userRuleError = res.error ?? 'Error al crear la regla.';
				}
			}
		} catch (e) {
			userRuleError = e instanceof Error ? e.message : String(e);
		} finally {
			userRuleSaving = false;
		}
	}

	async function toggleUserRule(rule: ModRuleData, on: boolean) {
		error = null;
		try {
			const res = await put<UpdateModRuleResponse>(`/moderation/rules/${rule.id}`, { enabled: on });
			if (res.success && res.data) {
				rules = rules.map((r) => (r.id === rule.id ? res.data! : r));
			} else {
				error = res.error ?? 'No se pudo actualizar la regla.';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	async function deleteUserRule(id: number) {
		if (!confirm('¿Eliminar esta restricción de usuario?')) return;
		try {
			const res = await del<DeleteModRuleResponse>(`/moderation/rules/${id}`);
			if (res.success) {
				rules = rules.filter((r) => r.id !== id);
			} else {
				error = res.error ?? 'No se pudo eliminar la regla.';
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
				<CardDescription>Configura cómo StreamCoreOS debe actuar ante mensajes no deseados en el chat.</CardDescription>
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
			<!-- Filtros Generales -->
			<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
				{#each RULE_TYPES as t}
					{@const rule = generalRuleFor(t.id)}
					{@const isEnabled = rule?.enabled ?? false}
					<div class="rounded-xl border bg-card flex flex-col {isEnabled ? '' : 'opacity-60 grayscale-[0.5]'} transition-all">
						<div class="p-4 flex gap-3">
							<div class="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
								<t.icon class="w-4 h-4" />
							</div>
							<div class="flex flex-col gap-0.5">
								<span class="font-bold text-sm">{t.label}</span>
								<span class="text-xs text-muted-foreground">{t.description}</span>
								{#if rule?.exempt_users && rule.exempt_users.length > 0}
									<span class="text-[10px] text-primary font-medium mt-1">
										+{rule.exempt_users.length} persona{rule.exempt_users.length > 1 ? 's' : ''} exenta{rule.exempt_users.length > 1 ? 's' : ''}
									</span>
								{/if}
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

			<!-- Sección: Filtros Específicos por Persona -->
			<div class="mt-8 border-t pt-6 flex flex-col gap-4">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div class="flex flex-col gap-0.5">
						<h3 class="text-base font-bold flex items-center gap-2">
							<UserX class="w-5 h-5 text-primary" /> Filtros Específicos por Persona
						</h3>
						<p class="text-xs text-muted-foreground">
							Aplica restricciones individuales a usuarios específicos (por ejemplo impedir que un usuario concreto comparta enlaces o use ciertas palabras).
						</p>
					</div>
					<Button size="sm" onclick={openCreateUserRule} class="gap-1.5 self-start sm:self-auto font-bold">
						<Plus class="w-4 h-4" /> Nueva regla por persona
					</Button>
				</div>

				{#if userRules.length === 0}
					<div class="p-8 text-center border border-dashed rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/20">
						<UserX class="w-8 h-8 opacity-40 mb-1" />
						<p class="text-sm font-semibold">No hay filtros específicos por persona</p>
						<p class="text-xs max-w-md">
							Actualmente los filtros aplican a nivel general. Puedes crear una regla individual para que, por ejemplo, un usuario puntual no pueda poner enlaces sin afectar al resto de la comunidad.
						</p>
						<Button variant="outline" size="sm" onclick={openCreateUserRule} class="mt-2 text-xs gap-1.5">
							<Plus class="w-3.5 h-3.5" /> Añadir regla para una persona
						</Button>
					</div>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
						{#each userRules as ur}
							{@const meta = typeMeta(ur.type)}
							<div class="rounded-xl border bg-card flex flex-col {ur.enabled ? '' : 'opacity-60 grayscale-[0.5]'} transition-all">
								<div class="p-4 flex flex-col gap-3">
									<div class="flex items-start justify-between gap-2">
										<div class="flex items-center gap-1.5 flex-wrap">
											{#each ur.target_users as u}
												<Badge variant="secondary" class="font-bold flex items-center gap-1 text-xs px-2.5 py-0.5">
													<AtSign class="w-3 h-3 text-primary" /> {u}
												</Badge>
											{/each}
										</div>
										<Badge variant="outline" class="text-[10px] uppercase font-black tracking-wider shrink-0">
											{meta.label}
										</Badge>
									</div>

									<div class="flex items-center gap-2 text-xs text-muted-foreground">
										<meta.icon class="w-4 h-4 text-primary shrink-0" />
										<span class="font-medium text-foreground">
											Acción:
											<span class="font-bold uppercase text-primary">
												{ur.action}{ur.action === 'timeout' && ur.duration_s ? ` (${ur.duration_s}s)` : ''}
											</span>
										</span>
									</div>

									{#if ur.type === 'word_filter' && ur.value}
										<p class="text-[11px] text-muted-foreground bg-muted/50 p-2 rounded">
											<span class="font-bold text-foreground">Palabras:</span> {ur.value}
										</p>
									{/if}
								</div>

								<div class="mt-auto flex items-center justify-between border-t px-4 py-3 bg-muted/10">
									<div class="flex items-center gap-2">
										<Switch checked={ur.enabled} onCheckedChange={(v) => toggleUserRule(ur, v)} />
										<span class="text-xs font-bold {ur.enabled ? 'text-emerald-500' : 'text-muted-foreground/50'}">
											{ur.enabled ? 'Activa' : 'Pausada'}
										</span>
									</div>
									<div class="flex items-center gap-1">
										<Button variant="ghost" size="icon" class="h-8 w-8" onclick={() => openEditUserRule(ur)}>
											<Pencil class="w-3.5 h-3.5" />
										</Button>
										<Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:text-destructive" onclick={() => deleteUserRule(ur.id)}>
											<Trash2 class="w-3.5 h-3.5" />
										</Button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</CardContent>
</Card>

<!-- Modal: Configuración de Filtro General -->
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
					<span id="mod-dialog-exempt-label" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground pt-2">
						Excluir grupos de este filtro
					</span>
					<div class="flex flex-wrap gap-2" role="group" aria-labelledby="mod-dialog-exempt-label">
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

				<div class="flex flex-col gap-2 pt-2 border-t">
					<label for="mod-dialog-exempt-users" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
						Excluir personas específicas (opcional)
					</label>
					<Input
						id="mod-dialog-exempt-users"
						bind:value={dialogExemptUsers}
						placeholder="Ej: @amigo1, @colaborador"
					/>
					<p class="text-[10px] text-muted-foreground italic">
						Nombres de usuario separados por coma que podrán saltarse este filtro general.
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

<!-- Modal: Filtro Específico por Persona -->
<Dialog.Root bind:open={userRuleDialogOpen}>
	<Dialog.Content class="sm:max-w-[480px]">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<UserX class="w-4 h-4 text-primary" />
				{userRuleId ? 'Editar Restricción de Persona' : 'Nueva Restricción para una Persona'}
			</Dialog.Title>
			<Dialog.Description>
				Aplica un filtro estricto a uno o varios usuarios puntuales en el chat.
			</Dialog.Description>
		</Dialog.Header>

		<div class="flex flex-col gap-4 py-2">
			<div class="flex flex-col gap-2">
				<label for="user-rule-targets" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
					Usuario(s) a sancionar
				</label>
				<Input
					id="user-rule-targets"
					bind:value={userRuleTargetUsers}
					placeholder="Ej: @usuario_molesto, @troll_chat"
				/>
				<p class="text-[10px] text-muted-foreground italic">
					Puedes ingresar uno o varios nombres de usuario separados por coma.
				</p>
			</div>

			<div class="flex flex-col gap-2">
				<label for="user-rule-type" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
					Filtro a aplicar
				</label>
				<select
					id="user-rule-type"
					bind:value={userRuleType}
					disabled={Boolean(userRuleId)}
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
				>
					{#each RULE_TYPES as t}
						<option value={t.id}>{t.label} ({t.id === 'link_filter' ? 'Bloquear enlaces' : t.description})</option>
					{/each}
				</select>
			</div>

			{#if userRuleType === 'word_filter'}
				<div class="flex flex-col gap-2">
					<label for="user-rule-value" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
						Palabras prohibidas para este usuario
					</label>
					<Input
						id="user-rule-value"
						bind:value={userRuleValue}
						placeholder="Ej: palabra1, palabra2"
					/>
				</div>
			{/if}

			<div class="grid grid-cols-2 gap-4">
				<div class="flex flex-col gap-2">
					<label for="user-rule-action" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
						Acción ante infracción
					</label>
					<select id="user-rule-action" bind:value={userRuleAction} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
						{#each ACTIONS as a}<option value={a}>{a}</option>{/each}
					</select>
				</div>
				{#if userRuleAction === 'timeout'}
					<div class="flex flex-col gap-2">
						<label for="user-rule-duration" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
							Tiempo (segundos)
						</label>
						<Input id="user-rule-duration" type="number" bind:value={userRuleDuration} />
					</div>
				{/if}
			</div>

			<div class="flex items-center gap-3 pt-2 border-t">
				<Switch checked={userRuleEnabled} onCheckedChange={(v) => userRuleEnabled = v} />
				<span class="text-xs font-black uppercase tracking-widest text-muted-foreground">Regla Activada</span>
			</div>

			{#if userRuleError}<p class="text-xs text-destructive bg-destructive/10 p-2 rounded">{userRuleError}</p>{/if}
		</div>

		<Dialog.Footer class="sm:justify-between">
			{#if userRuleId}
				<Button variant="ghost" class="text-destructive hover:text-destructive" onclick={() => { if (userRuleId) { deleteUserRule(userRuleId); userRuleDialogOpen = false; } }} disabled={userRuleSaving}>
					Eliminar
				</Button>
			{:else}
				<span></span>
			{/if}
			<Button onclick={saveUserRuleDialog} disabled={userRuleSaving}>
				{userRuleSaving ? 'Guardando...' : userRuleId ? 'Guardar Cambios' : 'Crear Restricción'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
