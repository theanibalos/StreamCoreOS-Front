<script lang="ts">
	import { onMount } from 'svelte';
	import { get, post, put, del } from '$lib/core/api/client';
	import type {
		CommandData,
		ListCommandsResponse,
		CreateCommandResponse,
		UpdateCommandResponse,
		DeleteCommandResponse,
		ListChatVarsResponse,
		ChatVarData,
		UserLevel
	} from '$lib/types/api';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Switch } from '$lib/components/ui/switch';
	import * as Table from '$lib/components/ui/table';
	import { RefreshCw, Pencil, Trash2, Variable, Hash } from '@lucide/svelte';

	let commands = $state<CommandData[]>([]);
	let chatVars = $state<ChatVarData[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let editingId = $state<number | null>(null);
	let editResponse = $state('');
	let editCooldown = $state(0);
	let editGlobalCooldown = $state(0);
	let editUserLevel = $state<UserLevel>('everyone');
	let saving = $state(false);

	let showForm = $state(false);
	let newName = $state('');
	let newResponse = $state('');
	let newCooldown = $state(0);
	let newGlobalCooldown = $state(0);
	let newUserLevel = $state<UserLevel>('everyone');
	let creating = $state(false);
	let formError = $state<string | null>(null);

	const userLevels: UserLevel[] = ['everyone', 'subscriber', 'vip', 'regular', 'moderator', 'broadcaster'];
	const builtInVars = ['{user}', '{touser}', '{channel}', '{count}', '{random 1-100}', '{followage}', '{uptime}', '{game}', '{viewers}'];

	async function load() {
		loading = true;
		error = null;
		try {
			const [cmdRes, varRes] = await Promise.all([
				get<ListCommandsResponse>('/chat/commands'),
				get<ListChatVarsResponse>('/chat/vars')
			]);
			commands = cmdRes.success && cmdRes.data ? cmdRes.data : [];
			chatVars = varRes.success && varRes.data ? varRes.data : [];
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function insertVar(text: string, isEdit: boolean) {
		const inputId = isEdit ? 'edit-resp-input' : 'new-resp-input';
		const input = document.getElementById(inputId) as HTMLInputElement;
		if (!input) return;

		const start = input.selectionStart || 0;
		const end = input.selectionEnd || 0;
		const current = isEdit ? editResponse : newResponse;
		const newVal = current.slice(0, start) + text + current.slice(end);

		if (isEdit) editResponse = newVal;
		else newResponse = newVal;

		setTimeout(() => {
			input.focus();
			input.setSelectionRange(start + text.length, start + text.length);
		}, 0);
	}

	async function create() {
		formError = null;
		const name = newName.trim();
		const response = newResponse.trim();
		if (!name || !response) {
			formError = 'El nombre y la respuesta son obligatorios.';
			return;
		}
		if (!/^![a-z0-9_]+$/.test(name)) {
			formError = 'El nombre debe seguir el formato ^![a-z0-9_]+$';
			return;
		}
		creating = true;
		try {
			const res = await post<CreateCommandResponse>('/chat/commands', {
				name, response, cooldown_s: newCooldown, global_cooldown_s: newGlobalCooldown, userlevel: newUserLevel
			});
			if (res.success && res.data) {
				commands = [...commands, res.data];
				newName = ''; newResponse = ''; newCooldown = 0; newGlobalCooldown = 0; newUserLevel = 'everyone';
				showForm = false;
			} else {
				formError = res.error ?? 'Error al crear el comando.';
			}
		} catch (e) {
			formError = e instanceof Error ? e.message : String(e);
		} finally {
			creating = false;
		}
	}

	async function toggleEnabled(cmd: CommandData) {
		try {
			const res = await put<UpdateCommandResponse>(`/chat/commands/${cmd.id}`, { enabled: !cmd.enabled });
			if (res.success && res.data) {
				commands = commands.map((c) => (c.id === cmd.id ? res.data! : c));
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	function startEdit(cmd: CommandData) {
		editingId = cmd.id; editResponse = cmd.response; editCooldown = cmd.cooldown_s;
		editGlobalCooldown = cmd.global_cooldown_s; editUserLevel = cmd.userlevel;
	}

	async function saveEdit(id: number) {
		saving = true;
		try {
			const res = await put<UpdateCommandResponse>(`/chat/commands/${id}`, {
				response: editResponse, cooldown_s: editCooldown, global_cooldown_s: editGlobalCooldown, userlevel: editUserLevel
			});
			if (res.success && res.data) {
				commands = commands.map((c) => (c.id === id ? res.data! : c));
				editingId = null;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}

	async function remove(id: number) {
		if (!confirm('¿Eliminar este comando?')) return;
		try {
			const res = await del<DeleteCommandResponse>(`/chat/commands/${id}`);
			if (res.success) {
				commands = commands.filter((c) => c.id !== id);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}
</script>

<div class="flex flex-col gap-6">
	<Card>
		<CardHeader class="flex flex-row items-center justify-between border-b pb-4">
			<div>
				<CardTitle class="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
					<Hash class="w-5 h-5 text-primary" /> Comandos de Chat
				</CardTitle>
				<CardDescription>Gestiona tus comandos personalizados y sus permisos.</CardDescription>
			</div>
			<div class="flex gap-2">
				<Button variant="outline" size="icon" onclick={load} disabled={loading}>
					<RefreshCw class="w-4 h-4 {loading ? 'animate-spin' : ''}" />
				</Button>
				<Button onclick={() => showForm = !showForm} variant={showForm ? "secondary" : "default"}>
					{showForm ? 'Cancelar' : 'Nuevo Comando'}
				</Button>
			</div>
		</CardHeader>

		{#if showForm}
			<CardContent class="bg-muted/30 border-b p-6 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="flex flex-col gap-2">
						<label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre</label>
						<Input bind:value={newName} placeholder="!hola" class="font-mono" />
					</div>
					<div class="flex flex-col gap-2">
						<label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nivel de Usuario</label>
						<select bind:value={newUserLevel} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
							{#each userLevels as level}
								<option value={level}>{level}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="flex flex-col gap-2">
					<label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Respuesta</label>
					<Input id="new-resp-input" bind:value={newResponse} placeholder={"Hola {user}!"} />
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="flex flex-col gap-2">
						<label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cooldown Usuario (s)</label>
						<Input type="number" bind:value={newCooldown} />
					</div>
					<div class="flex flex-col gap-2">
						<label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cooldown Global (s)</label>
						<Input type="number" bind:value={newGlobalCooldown} />
					</div>
				</div>

				<div class="flex flex-col gap-2">
					<label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
						<Variable class="w-3 h-3" /> Variables Disponibles
					</label>
					<div class="flex flex-wrap gap-1.5 mt-1">
						{#each builtInVars as v}
							<Badge variant="outline" class="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors" onclick={() => insertVar(v, false)}>{v}</Badge>
						{/each}
						{#each chatVars as v}
							<Badge variant="outline" class="cursor-pointer hover:bg-blue-500 hover:text-white border-blue-500/50" onclick={() => insertVar(`{var:${v.name}}`, false)}>{v.name}</Badge>
						{/each}
					</div>
				</div>

				{#if formError}
					<p class="text-xs text-destructive font-medium bg-destructive/10 p-2 rounded">{formError}</p>
				{/if}

				<Button onclick={create} disabled={creating} class="w-full sm:w-auto self-end">
					{creating ? 'Creando...' : 'Crear Comando'}
				</Button>
			</CardContent>
		{/if}

		<CardContent class="p-0">
			<Table.Root>
				<Table.Header>
					<Table.Row class="hover:bg-transparent">
						<Table.Head class="w-[150px]">Comando</Table.Head>
						<Table.Head>Respuesta</Table.Head>
						<Table.Head>Permisos</Table.Head>
						<Table.Head class="text-center">CD</Table.Head>
						<Table.Head class="text-center">Usos</Table.Head>
						<Table.Head class="text-center">Estado</Table.Head>
						<Table.Head class="text-right">Acciones</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#if loading && commands.length === 0}
						<Table.Row><Table.Cell colspan={7} class="text-center py-10 text-muted-foreground italic">Cargando comandos...</Table.Cell></Table.Row>
					{:else if commands.length === 0}
						<Table.Row><Table.Cell colspan={7} class="text-center py-10 text-muted-foreground italic">No hay comandos creados.</Table.Cell></Table.Row>
					{:else}
						{#each commands as cmd (cmd.id)}
							{#if editingId === cmd.id}
								<Table.Row class="bg-muted/50">
									<Table.Cell colspan={7} class="p-4">
										<div class="flex flex-col gap-4 border rounded-lg p-4 bg-background shadow-sm">
											<div class="flex items-center gap-2">
												<Badge class="font-mono text-sm">{cmd.name}</Badge>
												<span class="text-xs text-muted-foreground uppercase font-bold tracking-widest">Editando Modo</span>
											</div>
											<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div class="flex flex-col gap-2">
													<label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Respuesta</label>
													<Input id="edit-resp-input" bind:value={editResponse} />
												</div>
												<div class="flex flex-col gap-2">
													<label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nivel</label>
													<select bind:value={editUserLevel} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
														{#each userLevels as level}
															<option value={level}>{level}</option>
														{/each}
													</select>
												</div>
											</div>
											<div class="flex flex-wrap gap-1.5">
												{#each builtInVars as v}
													<Badge variant="outline" class="cursor-pointer text-[10px]" onclick={() => insertVar(v, true)}>{v}</Badge>
												{/each}
											</div>
											<div class="flex justify-end gap-2">
												<Button variant="ghost" size="sm" onclick={() => editingId = null}>Cancelar</Button>
												<Button size="sm" onclick={() => saveEdit(cmd.id)} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
											</div>
										</div>
									</Table.Cell>
								</Table.Row>
							{:else}
								<Table.Row class={!cmd.enabled ? "opacity-60 bg-muted/20" : ""}>
									<Table.Cell class="font-mono font-bold text-primary">{cmd.name}</Table.Cell>
									<Table.Cell class="max-w-[200px] truncate">{cmd.response}</Table.Cell>
									<Table.Cell>
										<Badge variant="secondary" class="text-[10px] uppercase font-bold tracking-tighter">{cmd.userlevel}</Badge>
									</Table.Cell>
									<Table.Cell class="text-center text-xs text-muted-foreground font-mono">{cmd.cooldown_s}s / {cmd.global_cooldown_s}s</Table.Cell>
									<Table.Cell class="text-center font-bold font-mono">{cmd.use_count}</Table.Cell>
									<Table.Cell class="text-center">
										<Switch checked={cmd.enabled} onCheckedChange={() => toggleEnabled(cmd)} />
									</Table.Cell>
									<Table.Cell class="text-right">
										<div class="flex justify-end gap-1">
											<Button variant="ghost" size="icon" class="h-8 w-8" onclick={() => startEdit(cmd)}>
												<Pencil class="w-3.5 h-3.5" />
											</Button>
											<Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-destructive" onclick={() => remove(cmd.id)}>
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
		</CardContent>
	</Card>
</div>
