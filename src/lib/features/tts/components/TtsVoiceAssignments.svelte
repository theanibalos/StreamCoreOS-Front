<script lang="ts">
	import { onMount } from 'svelte';
	import { get, put, del } from '$lib/core/api/client';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Loader2, Search, Globe, User, RotateCcw, Save, Trash2 } from '@lucide/svelte';

	interface Voice {
		id: string;
		name: string;
		gender: string;
		locale: string;
		provider: string;
	}

	interface UserVoice {
		id: number;
		twitch_id: string;
		twitch_login: string;
		voice_id: string;
		voice_name: string;
		updated_at: string;
	}

	let assignments  = $state<UserVoice[]>([]);
	let voices       = $state<Voice[]>([]);
	let loading      = $state(true);
	let savingId     = $state<string | null>(null);
	let error        = $state<string | null>(null);
	let localeFilter = $state('es');
	let search       = $state('');
	let pendingVoice = $state<Record<string, string>>({});

	onMount(async () => {
		await Promise.all([loadAssignments(), loadVoices()]);
		loading = false;
	});

	async function loadAssignments() {
		const res = await get<{ success: boolean; data: UserVoice[] }>('/tts/user-voices');
		if (res.success) {
			assignments = res.data ?? [];
			pendingVoice = Object.fromEntries(assignments.map((a) => [a.twitch_id, a.voice_id]));
		}
	}

	async function loadVoices() {
		const res = await get<{ success: boolean; data: Voice[] }>(
			`/tts/voices?locale=${localeFilter}`
		);
		if (res.success) voices = res.data ?? [];
	}

	async function saveVoice(assignment: UserVoice) {
		const newVoiceId = pendingVoice[assignment.twitch_id];
		if (!newVoiceId || newVoiceId === assignment.voice_id) return;

		const voice = voices.find((v) => v.id === newVoiceId);
		if (!voice) return;

		savingId = assignment.twitch_id;
		error  = null;
		try {
			const res = await put<{ success: boolean; data: UserVoice }>('/tts/user-voices', {
				twitch_id:    assignment.twitch_id,
				twitch_login: assignment.twitch_login,
				voice_id:     voice.id,
				voice_name:   voice.name
			});
			if (res.success && res.data) {
				assignments = assignments.map((a) =>
					a.twitch_id === assignment.twitch_id ? res.data! : a
				);
				pendingVoice[assignment.twitch_id] = voice.id;
			}
		} catch (e: any) {
			error = e.message || 'Error al cambiar la voz';
			pendingVoice[assignment.twitch_id] = assignment.voice_id;
		} finally {
			savingId = null;
		}
	}

	async function removeAssignment(login: string) {
		savingId = login;
		try {
			await del(`/tts/user-voices/${login}`);
			assignments = assignments.filter((a) => a.twitch_login !== login);
		} catch (e: any) {
			error = e.message || 'Error al eliminar';
		} finally {
			savingId = null;
		}
	}

	const filtered = $derived(
		search.trim()
			? assignments.filter((a) =>
					a.twitch_login.toLowerCase().includes(search.toLowerCase())
				)
			: assignments
	);

	async function onLocaleChange() {
		await loadVoices();
	}
</script>

<Card class="border-none shadow-none bg-transparent">
	<CardHeader class="px-0">
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
			<div class="space-y-1">
				<CardTitle class="text-xl">Asignaciones de Voz</CardTitle>
				<CardDescription>Usuarios con voces personalizadas.</CardDescription>
			</div>
			<div class="flex flex-col sm:flex-row gap-2">
				<div class="relative w-full sm:w-64">
					<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Buscar usuario..."
						class="pl-8"
						bind:value={search}
					/>
				</div>
				<div class="flex items-center gap-2">
					<Badge variant="outline" class="h-10 px-3 flex gap-2">
						<Globe class="w-4 h-4" />
						<input
							class="bg-transparent border-none focus:outline-none w-8 text-center font-mono"
							bind:value={localeFilter}
							onchange={onLocaleChange}
						/>
					</Badge>
				</div>
			</div>
		</div>
	</CardHeader>
	<CardContent class="px-0">
		{#if error}
			<div class="bg-destructive/15 text-destructive p-3 rounded-lg border border-destructive/50 text-xs mb-4">
				{error}
			</div>
		{/if}

		<div class="rounded-md border bg-card">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="w-[200px]">Usuario</TableHead>
						<TableHead>Voz Actual</TableHead>
						<TableHead class="w-[300px]">Cambiar Voz</TableHead>
						<TableHead class="text-right">Acciones</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if loading}
						<TableRow>
							<TableCell colspan={4} class="h-24 text-center">
								<div class="flex items-center justify-center gap-2 text-muted-foreground">
									<Loader2 class="h-4 w-4 animate-spin" />
									Cargando asignaciones...
								</div>
							</TableCell>
						</TableRow>
					{:else if filtered.length === 0}
						<TableRow>
							<TableCell colspan={4} class="h-24 text-center text-muted-foreground">
								{search ? 'No se encontraron usuarios.' : 'No hay voces personalizadas asignadas.'}
							</TableCell>
						</TableRow>
					{:else}
						{#each filtered as a (a.twitch_id)}
							<TableRow>
								<TableCell class="font-bold text-primary flex items-center gap-2">
									<div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
										<User class="w-4 h-4" />
									</div>
									{a.twitch_login}
								</TableCell>
								<TableCell>
									<Badge variant="secondary" class="font-mono text-[10px]">
										{a.voice_id}
									</Badge>
								</TableCell>
								<TableCell>
									<div class="flex items-center gap-2">
										<select 
											class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
											bind:value={pendingVoice[a.twitch_id]}
										>
											{#each voices as v (v.id)}
												<option value={v.id}>{v.name} ({v.gender === 'Female' ? 'F' : 'M'})</option>
											{/each}
										</select>
										{#if pendingVoice[a.twitch_id] !== a.voice_id}
											<Button 
												size="icon" 
												variant="default" 
												class="h-9 w-9 shrink-0"
												onclick={() => saveVoice(a)}
												disabled={savingId === a.twitch_id}
											>
												{#if savingId === a.twitch_id}
													<Loader2 class="h-4 w-4 animate-spin" />
												{:else}
													<Save class="h-4 w-4" />
												{/if}
											</Button>
										{/if}
									</div>
								</TableCell>
								<TableCell class="text-right">
									<Button 
										variant="ghost" 
										size="icon"
										class="text-muted-foreground hover:text-destructive"
										onclick={() => removeAssignment(a.twitch_login)}
										disabled={savingId === a.twitch_id}
									>
										<Trash2 class="w-4 h-4" />
									</Button>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</div>
	</CardContent>
</Card>
