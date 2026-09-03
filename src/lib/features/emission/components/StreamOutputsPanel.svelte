<script lang="ts">
	import { onMount } from 'svelte';
	import { get, post, put, del } from '$lib/core/api/client';
	import type { StreamOutputData, StreamOutputsResponse, StreamOutputResponse, DeleteStreamOutputResponse } from '$lib/types/api';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Switch } from '$lib/components/ui/switch';
	import { RefreshCw, Plus, Send, X, Save } from '@lucide/svelte';
	import StreamOutputCard from './StreamOutputCard.svelte';

	let outputs = $state<StreamOutputData[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let error = $state<string | null>(null);
	let formError = $state<string | null>(null);
	let showForm = $state(false);
	let editingId = $state<number | null>(null);

	let name = $state('');
	let platform = $state('youtube');
	let channelId = $state('');
	let rtmpUrl = $state('');
	let streamKey = $state('');
	let overlayId = $state('');
	let enabled = $state(true);

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await get<StreamOutputsResponse>('/stream-outputs');
			outputs = res.success ? (res.data ?? []) : [];
			if (!res.success) error = res.error ?? 'No se pudieron cargar los destinos.';
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	function resetForm() {
		editingId = null;
		name = '';
		platform = 'youtube';
		channelId = '';
		rtmpUrl = '';
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
		name = output.name;
		platform = output.platform;
		channelId = output.channel_id;
		rtmpUrl = output.rtmp_url ?? '';
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

	function buildPayload() {
		const payload: Record<string, unknown> = {
			name: name.trim(),
			platform,
			channel_id: channelId.trim(),
			enabled,
			overlay_id: overlayId.trim() ? Number(overlayId) : null,
			rtmp_url: rtmpUrl.trim() || null
		};
		if (streamKey.trim()) payload.stream_key_secret = streamKey.trim();
		return payload;
	}

	async function save() {
		formError = null;
		if (!name.trim() || !channelId.trim()) {
			formError = 'Nombre y channel_id son obligatorios.';
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
			} else {
				formError = res.error ?? 'No se pudo guardar el destino.';
			}
		} catch (e) {
			formError = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}

	async function toggleOutput(output: StreamOutputData, next: boolean) {
		try {
			const res = await put<StreamOutputResponse>(`/stream-outputs/${output.id}`, { enabled: next });
			if (res.success && res.data) outputs = outputs.map((o) => (o.id === output.id ? res.data! : o));
			else error = res.error ?? 'No se pudo actualizar el destino.';
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	async function remove(output: StreamOutputData) {
		if (!confirm(`¿Borrar destino ${output.name}?`)) return;
		try {
			const res = await del<DeleteStreamOutputResponse>(`/stream-outputs/${output.id}`);
			if (res.success) outputs = outputs.filter((o) => o.id !== output.id);
			else error = res.error ?? 'No se pudo borrar el destino.';
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	onMount(load);
</script>

<Card class="w-full">
	<CardHeader class="flex flex-row items-center justify-between border-b pb-4">
		<div>
			<CardTitle class="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
				<Send class="w-5 h-5 text-primary" /> Destinos de emisión
			</CardTitle>
			<CardDescription>Configura a dónde se mandará la señal única que llegará desde OBS.</CardDescription>
		</div>
		<div class="flex gap-2">
			<Button variant="outline" size="icon" onclick={load} disabled={loading}>
				<RefreshCw class="w-4 h-4 {loading ? 'animate-spin' : ''}" />
			</Button>
			<Button onclick={showForm ? cancelForm : startCreate} variant={showForm ? 'secondary' : 'default'}>
				{#if showForm}<X class="w-4 h-4 mr-1.5" /> Cancelar{:else}<Plus class="w-4 h-4 mr-1.5" /> Nuevo destino{/if}
			</Button>
		</div>
	</CardHeader>

	{#if error}
		<p class="text-xs text-destructive font-medium bg-destructive/10 p-2 rounded mx-6 mt-4">{error}</p>
	{/if}

	{#if showForm}
		<CardContent class="bg-muted/30 border-b p-6 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="flex flex-col gap-2">
					<label for="output-name" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre</label>
					<Input id="output-name" bind:value={name} placeholder="YouTube principal" />
				</div>
				<div class="flex flex-col gap-2">
					<label for="output-platform" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plataforma</label>
					<select id="output-platform" bind:value={platform} class="h-9 rounded-md border bg-background px-3 text-sm">
						<option value="youtube">YouTube</option>
						<option value="twitch">Twitch</option>
						<option value="custom">Custom / futura</option>
					</select>
				</div>
				<div class="flex flex-col gap-2">
					<label for="output-channel" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Channel ID</label>
					<Input id="output-channel" bind:value={channelId} placeholder="UC..., twitch channel, custom" />
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="md:col-span-2 flex flex-col gap-2">
					<label for="output-rtmp" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">RTMP URL</label>
					<Input id="output-rtmp" bind:value={rtmpUrl} placeholder="rtmp://..." />
				</div>
				<div class="flex flex-col gap-2">
					<label for="output-key" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stream key</label>
					<Input id="output-key" type="password" bind:value={streamKey} placeholder={editingId ? 'Dejar vacío para mantener' : 'clave secreta'} />
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
				<div class="flex flex-col gap-2">
					<label for="output-overlay" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Overlay ID</label>
					<Input id="output-overlay" type="number" min="1" bind:value={overlayId} placeholder="Opcional" />
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
					<StreamOutputCard output={output} onEdit={startEdit} onDelete={remove} onToggle={toggleOutput} />
				{/each}
			</div>
		{/if}
	</CardContent>
</Card>
