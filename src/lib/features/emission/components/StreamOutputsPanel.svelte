<script lang="ts">
	import { onMount } from 'svelte';
	import { get, post, put, del } from '$lib/core/api/client';
	import type {
		PlatformConnectionData,
		PlatformConnectionsResponse,
		StreamOutputData,
		StreamOutputResponse,
		StreamOutputsResponse,
		StreamRuntimeStatusData,
		DeleteStreamOutputResponse
	} from '$lib/types/api';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Switch } from '$lib/components/ui/switch';
	import { RefreshCw, Plus, Send, X, Save, Play, Square, Radio, AlertTriangle, CheckCircle2 } from '@lucide/svelte';
	import StreamOutputCard from './StreamOutputCard.svelte';

	let { runtime = null, onStatusChange }: { runtime?: StreamRuntimeStatusData | null; onStatusChange?: () => void } = $props();

	type OverlayItem = { id: number; name: string; created_at?: string; updated_at?: string };

	let outputs = $state<StreamOutputData[]>([]);
	let connections = $state<PlatformConnectionData[]>([]);
	let overlays = $state<OverlayItem[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let actionBusy = $state(false);
	let error = $state<string | null>(null);
	let formError = $state<string | null>(null);
	let showForm = $state(false);
	let editingId = $state<number | null>(null);
	let editingOutput = $state<StreamOutputData | null>(null);

	let name = $state('');
	let platform = $state('youtube');
	let selectedConnectionId = $state('');
	let channelId = $state('');
	let rtmpUrl = $state('');
	let streamKey = $state('');
	let overlayId = $state('');
	let enabled = $state(true);

	const connectedForPlatform = $derived(connections.filter((c) => c.platform === platform && c.enabled));
	const selectedConnection = $derived(connections.find((c) => String(c.id) === selectedConnectionId));
	const activeOutputs = $derived(outputs.filter((o) => o.enabled));
	const liveOutputs = $derived(outputs.filter((o) => o.status === 'live'));
	const isAnyLive = $derived(liveOutputs.length > 0 || (runtime?.relays_count ?? 0) > 0);

	const defaultRtmp: Record<string, string> = {
		youtube: 'rtmp://a.rtmp.youtube.com/live2',
		twitch: 'rtmp://live.twitch.tv/app'
	};

	async function load() {
		loading = true;
		error = null;
		try {
			const [outputsRes, connectionsRes, overlaysRes] = await Promise.all([
				get<StreamOutputsResponse>('/stream-outputs'),
				get<PlatformConnectionsResponse>('/platforms/connections'),
				get<{ success: boolean; data: OverlayItem[]; error?: string }>('/overlays')
			]);
			outputs = outputsRes.success ? (outputsRes.data ?? []) : [];
			connections = connectionsRes.success ? (connectionsRes.data ?? []) : [];
			overlays = overlaysRes.success ? (overlaysRes.data ?? []) : [];
			if (!outputsRes.success) error = outputsRes.error ?? 'No se pudieron cargar los destinos.';
			if (!connectionsRes.success) error = connectionsRes.error ?? 'No se pudieron cargar las conexiones.';
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	function resetForm() {
		editingId = null;
		editingOutput = null;
		name = '';
		platform = 'youtube';
		selectedConnectionId = connections.find((c) => c.platform === 'youtube' && c.enabled)?.id.toString() ?? '';
		channelId = '';
		rtmpUrl = defaultRtmp.youtube;
		streamKey = '';
		overlayId = '';
		enabled = true;
		formError = null;
	}

	function startCreate() {
		resetForm();
		showForm = true;
	}

	function startEdit(output: StreamOutputData) {
		editingId = output.id;
		editingOutput = output;
		name = output.name;
		platform = output.platform;
		selectedConnectionId = connections.find((c) => c.platform === output.platform && c.channel_id === output.channel_id)?.id.toString() ?? '';
		channelId = output.channel_id;
		rtmpUrl = output.rtmp_url ?? defaultRtmp[output.platform] ?? '';
		streamKey = '';
		overlayId = output.overlay_id ? String(output.overlay_id) : '';
		enabled = output.enabled;
		formError = null;
		showForm = true;
	}

	function cancelForm() {
		showForm = false;
		resetForm();
	}

	$effect(() => {
		if (platform !== 'custom' && connectedForPlatform.length > 0) {
			if (!selectedConnectionId || !connectedForPlatform.some((c) => String(c.id) === selectedConnectionId)) {
				selectedConnectionId = String(connectedForPlatform[0].id);
			}
		}
	});

	function onPlatformChange() {
		const matches = connections.filter((c) => c.platform === platform && c.enabled);
		selectedConnectionId = matches[0]?.id.toString() ?? '';
		if (platform !== 'custom') channelId = '';
		rtmpUrl = defaultRtmp[platform] ?? '';
	}

	function resolvedChannelId() {
		if (selectedConnection?.channel_id) return selectedConnection.channel_id;
		return String(channelId || '').trim();
	}

	function buildPayload() {
		const numOverlay = overlayId ? Number(overlayId) : null;
		const payload: Record<string, unknown> = {
			name: String(name || '').trim(),
			platform,
			channel_id: resolvedChannelId(),
			enabled,
			overlay_id: numOverlay && !isNaN(numOverlay) ? numOverlay : null,
			rtmp_url: String(rtmpUrl || '').trim() || null
		};
		if (streamKey && String(streamKey).trim()) payload.stream_key_secret = String(streamKey).trim();
		return payload;
	}

	async function save() {
		formError = null;
		if (!String(name || '').trim()) {
			formError = 'El nombre es obligatorio.';
			return;
		}
		const finalChannel = resolvedChannelId();
		if (!finalChannel && platform === 'custom') {
			formError = 'En destinos custom hace falta un identificador de canal.';
			return;
		}
		if (!editingId && !String(streamKey || '').trim()) {
			formError = 'La Stream Key (clave de transmisión) es obligatoria para emitir a ' + platform + '.';
			return;
		}
		if (editingOutput && !editingOutput.stream_key_configured && !String(streamKey || '').trim()) {
			formError = 'Este destino aún no tiene Stream Key configurada. Debes pegar tu clave de transmisión.';
			return;
		}
		saving = true;
		try {
			const payload = buildPayload();
			const res = editingId
				? await put<StreamOutputResponse>(`/stream-outputs/${editingId}`, payload)
				: await post<StreamOutputResponse>('/stream-outputs', payload);

			if (res.success && res.data) {
				outputs = editingId
					? outputs.map((o) => (o.id === editingId ? res.data! : o))
					: [...outputs, res.data];
				cancelForm();
				onStatusChange?.();
			} else {
				formError = res.error ?? 'No se pudo guardar el destino.';
			}
		} catch (e) {
			formError = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}

	async function patchOutput(output: StreamOutputData, payload: Record<string, unknown>) {
		const res = await put<StreamOutputResponse>(`/stream-outputs/${output.id}`, payload);
		if (res.success && res.data) {
			outputs = outputs.map((o) => (o.id === output.id ? res.data! : o));
			onStatusChange?.();
		} else {
			error = res.error ?? 'No se pudo actualizar el destino.';
		}
	}

	async function toggleOutput(output: StreamOutputData, next: boolean) {
		try { await patchOutput(output, { enabled: next }); }
		catch (e) { error = e instanceof Error ? e.message : String(e); }
	}

	async function markStatus(output: StreamOutputData, status: 'live' | 'stopped') {
		try {
			actionBusy = true;
			error = null;
			const res = await post<StreamOutputResponse>(`/stream-outputs/${output.id}/${status === 'live' ? 'start' : 'stop'}`, {});
			if (res.success && res.data) {
				outputs = outputs.map((o) => (o.id === output.id ? res.data! : o));
				onStatusChange?.();
			} else {
				error = res.error ?? 'No se pudo cambiar el estado del destino.';
				await load();
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			await load();
		} finally {
			actionBusy = false;
		}
	}

	async function markAll(status: 'live' | 'stopped') {
		actionBusy = true;
		error = null;
		try {
			const res = await post<StreamOutputsResponse>(`/stream-outputs/${status === 'live' ? 'start-active' : 'stop-active'}`, {});
			if (res.success && res.data) {
				const updatedById = new Map(res.data.map((output) => [output.id, output]));
				outputs = outputs.map((output) => updatedById.get(output.id) ?? output);
				onStatusChange?.();
			} else if (!res.success) {
				error = res.error ?? 'No se pudo cambiar el estado de los destinos activos.';
				await load();
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			await load();
		} finally {
			actionBusy = false;
		}
	}

	async function remove(output: StreamOutputData) {
		if (!confirm(`¿Borrar destino ${output.name}?`)) return;
		try {
			const res = await del<DeleteStreamOutputResponse>(`/stream-outputs/${output.id}`);
			if (res.success) {
				outputs = outputs.filter((o) => o.id !== output.id);
				onStatusChange?.();
			} else {
				error = res.error ?? 'No se pudo borrar el destino.';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	onMount(load);
</script>

<!-- Panel de Control Maestro de Transmisión -->
<Card class="w-full border-2 {isAnyLive ? 'border-emerald-500 bg-emerald-950/10' : 'border-primary/40 bg-card'}">
	<CardContent class="p-6">
		<div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
			<div class="flex flex-col gap-2">
				<div class="flex items-center gap-3">
					{#if isAnyLive}
						<span class="relative flex h-4 w-4">
							<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
							<span class="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
						</span>
						<h2 class="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 uppercase">
							TRANSMITIENDO EN VIVO
						</h2>
					{:else}
						<span class="h-3.5 w-3.5 rounded-full bg-muted-foreground/50"></span>
						<h2 class="text-2xl font-black tracking-tight text-foreground uppercase">
							TRANSMISIÓN DETENIDA
						</h2>
					{/if}
				</div>

				<p class="text-sm text-muted-foreground">
					{#if isAnyLive}
						{#if runtime?.active_source === 'obs'}
							<span class="font-semibold text-emerald-500">Señal de OBS en directo</span> hacia {liveOutputs.length} plataforma(s) activa(s).
						{:else}
							<span class="font-semibold text-amber-500">Video Fallback al aire</span> hacia {liveOutputs.length} plataforma(s). (Conmutará a OBS automáticamente al detectar señal).
						{/if}
					{:else}
						Selecciona las plataformas que recibirán la señal y pulsa <strong class="text-foreground font-semibold">Transmitir</strong> para iniciar el directo.
					{/if}
				</p>

				<div class="flex flex-wrap items-center gap-2 pt-1">
					<span class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Plataformas seleccionadas:</span>
					{#if activeOutputs.length === 0}
						<Badge variant="outline" class="text-xs border-dashed text-muted-foreground">Ninguna seleccionada</Badge>
					{:else}
						{#each activeOutputs as active}
							<Badge variant="secondary" class="text-xs capitalize flex items-center gap-1">
								{#if active.status === 'live'}
									<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
								{:else if active.status === 'error'}
									<span class="h-2 w-2 rounded-full bg-destructive"></span>
								{:else}
									<span class="h-2 w-2 rounded-full bg-muted-foreground"></span>
								{/if}
								{active.name} ({active.platform})
							</Badge>
						{/each}
					{/if}
				</div>
			</div>

			<div class="flex items-center gap-3 w-full lg:w-auto justify-end">
				{#if isAnyLive}
					<Button 
						type="button"
						size="lg" 
						variant="destructive" 
						class="w-full lg:w-auto px-8 font-bold text-base shadow-lg shadow-destructive/20"
						onclick={() => markAll('stopped')} 
						disabled={actionBusy}
					>
						<Square class="w-5 h-5 mr-2 fill-current" /> Detener transmisión
					</Button>
				{:else}
					<Button 
						type="button"
						size="lg" 
						class="w-full lg:w-auto px-8 font-bold text-base bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
						onclick={() => markAll('live')} 
						disabled={actionBusy || activeOutputs.length === 0}
					>
						<Radio class="w-5 h-5 mr-2 animate-pulse" /> Transmitir en vivo
					</Button>
				{/if}
			</div>
		</div>

		{#if error}
			<div class="mt-4 p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive flex items-start gap-2.5">
				<AlertTriangle class="w-5 h-5 shrink-0 mt-0.5" />
				<div>
					<p class="text-xs font-bold uppercase tracking-wider">Error en la transmisión:</p>
					<p class="text-xs mt-0.5">{error}</p>
				</div>
			</div>
		{/if}
	</CardContent>
</Card>

<Card class="w-full">
	<CardHeader class="flex flex-row items-center justify-between border-b pb-4">
		<div>
			<CardTitle class="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
				<Send class="w-5 h-5 text-primary" /> Destinos configurados
			</CardTitle>
			<CardDescription>Activa el interruptor de los destinos que recibirán la transmisión.</CardDescription>
		</div>
		<div class="flex flex-wrap gap-2 justify-end">
			<Button variant="outline" size="icon" onclick={load} disabled={loading}>
				<RefreshCw class="w-4 h-4 {loading ? 'animate-spin' : ''}" />
			</Button>
			<Button onclick={showForm ? cancelForm : startCreate} variant={showForm ? 'secondary' : 'default'}>
				{#if showForm}<X class="w-4 h-4 mr-1.5" /> Cancelar{:else}<Plus class="w-4 h-4 mr-1.5" /> Nuevo destino{/if}
			</Button>
		</div>
	</CardHeader>

	{#if showForm}
		<CardContent class="bg-muted/30 border-b p-6 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="flex flex-col gap-2">
					<label for="output-name" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre</label>
					<Input id="output-name" bind:value={name} placeholder="YouTube principal" />
				</div>
				<div class="flex flex-col gap-2">
					<label for="output-platform" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plataforma</label>
					<select id="output-platform" bind:value={platform} onchange={onPlatformChange} class="h-9 rounded-md border bg-background px-3 text-sm">
						<option value="youtube">YouTube</option>
						<option value="twitch">Twitch</option>
						<option value="custom">Custom</option>
					</select>
				</div>
				<div class="flex flex-col gap-2">
					<label for="output-account" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Canal / cuenta</label>
					{#if platform === 'custom'}
						<Input id="output-account" bind:value={channelId} placeholder="Identificador custom" />
					{:else if connectedForPlatform.length > 0}
						<select id="output-account" bind:value={selectedConnectionId} class="h-9 rounded-md border bg-background px-3 text-sm">
							{#each connectedForPlatform as connection}
								<option value={String(connection.id)}>{connection.channel_name}</option>
							{/each}
						</select>
					{:else}
						<Input id="output-account" bind:value={channelId} placeholder="Nombre de tu canal en {platform}" />
					{/if}
					{#if platform !== 'custom'}
						<p class="text-[11px] text-muted-foreground">
							{#if connectedForPlatform.length > 0}
								Channel ID vinculado: <span class="font-mono">{resolvedChannelId() || '—'}</span>
							{:else}
								Cuenta: <span class="font-mono">{resolvedChannelId() || 'Sin vincular (puedes escribir tu canal)'}</span>
							{/if}
						</p>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="md:col-span-2 flex flex-col gap-2">
					<label for="output-rtmp" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">RTMP URL destino</label>
					<Input id="output-rtmp" bind:value={rtmpUrl} placeholder="rtmp://..." />
				</div>
				<div class="flex flex-col gap-2">
					<label for="output-key" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stream key del destino</label>
					<Input
						id="output-key"
						type="password"
						bind:value={streamKey}
						placeholder={editingOutput?.stream_key_configured ? '•••••••• (Dejar vacío para mantener)' : 'Pega aquí tu clave de emisión (Stream Key)'}
					/>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
				<div class="flex flex-col gap-2">
					<label for="output-overlay" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Overlay para este Destino</label>
					<select id="output-overlay" bind:value={overlayId} class="h-9 rounded-md border bg-background px-3 text-sm">
						<option value="">Sin Overlay (Directo / Passthrough)</option>
						{#each overlays as ov}
							<option value={String(ov.id)}>{ov.name} (ID: {ov.id})</option>
						{/each}
					</select>
				</div>
				<div class="flex items-center gap-3 h-9">
					<Switch bind:checked={enabled} />
					<span class="text-sm font-medium">Destino activo</span>
				</div>
				<Button onclick={save} disabled={saving} class="md:justify-self-end">
					<Save class="w-4 h-4 mr-1.5" /> {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear destino'}
				</Button>
			</div>

			{#if formError}
				<p class="text-xs text-destructive font-medium bg-destructive/10 p-2 rounded">{formError}</p>
			{/if}
		</CardContent>
	{/if}

	<CardContent class="p-6">
		{#if loading}
			<p class="text-sm text-muted-foreground italic">Cargando destinos…</p>
		{:else if outputs.length === 0}
			<div class="rounded-lg border border-dashed p-6 text-center">
				<p class="text-sm text-muted-foreground">No hay destinos todavía. Crea uno para Twitch, YouTube o una plataforma custom.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 xl:grid-cols-2 gap-3">
				{#each outputs as output (output.id)}
					<StreamOutputCard output={output} {overlays} onEdit={startEdit} onDelete={remove} onToggle={toggleOutput} onStart={(o) => markStatus(o, 'live')} onStop={(o) => markStatus(o, 'stopped')} />
				{/each}
			</div>
		{/if}
	</CardContent>
</Card>
