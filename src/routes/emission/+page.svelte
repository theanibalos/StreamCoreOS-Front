<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { get, upload } from '$lib/core/api/client';
	import { StreamOutputsPanel } from '$lib/features/emission';
	import type { StreamRuntimeStatusData, StreamRuntimeStatusResponse } from '$lib/types/api';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { RadioTower, PlugZap, RefreshCw, Copy, CircleCheck, CircleX } from '@lucide/svelte';

	let runtime = $state<StreamRuntimeStatusData | null>(null);
	let loadingRuntime = $state(true);
	let runtimeError = $state<string | null>(null);
	let copied = $state<string | null>(null);
	let fallbackFile = $state<File | null>(null);
	let uploadingFallback = $state(false);
	let fallbackMessage = $state<string | null>(null);
	let interval: ReturnType<typeof setInterval> | undefined;

	const sourceLabel = $derived(
		runtime?.active_source === 'obs'
			? 'Transmitiendo OBS'
			: runtime?.active_source === 'fallback'
				? 'Transmitiendo fallback'
				: 'Esperando señal'
	);
	const relayEntries = $derived(Object.entries(runtime?.relays ?? {}) as [string, any][]);

	async function loadRuntime() {
		try {
			const res = await get<StreamRuntimeStatusResponse>('/stream-outputs/runtime/status');
			if (res.success) {
				runtime = res.data ?? null;
				runtimeError = null;
			} else {
				runtimeError = res.error ?? 'No se pudo leer el estado de emisión.';
			}
		} catch (e) {
			runtimeError = e instanceof Error ? e.message : String(e);
		} finally {
			loadingRuntime = false;
		}
	}

	async function copyText(value: string, key: string) {
		await navigator.clipboard.writeText(value);
		copied = key;
		setTimeout(() => {
			if (copied === key) copied = null;
		}, 1200);
	}

	async function uploadFallbackVideo() {
		if (!fallbackFile) return;
		uploadingFallback = true;
		fallbackMessage = null;
		try {
			const res = await upload<{ success: boolean; data?: unknown; error?: string }>('/stream-outputs/fallback/video', fallbackFile);
			if (res.success) {
				fallbackMessage = 'Video fallback guardado. Se usará cuando no haya OBS.';
				fallbackFile = null;
				await loadRuntime();
			} else {
				fallbackMessage = res.error ?? 'No se pudo subir el video.';
			}
		} catch (e) {
			fallbackMessage = e instanceof Error ? e.message : String(e);
		} finally {
			uploadingFallback = false;
		}
	}

	onMount(() => {
		loadRuntime();
		interval = setInterval(loadRuntime, 2000);
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});
</script>

<div class="flex flex-col gap-6 w-full">
	<div>
		<h1 class="text-3xl font-bold tracking-tight flex items-center gap-2">
			<RadioTower class="w-7 h-7 text-primary" /> Emisión
		</h1>
		<p class="text-muted-foreground mt-1">
			Centro de restream: una señal desde OBS hacia Twitch, YouTube o destinos custom.
		</p>
	</div>

	<Card class="w-full {runtime?.obs_connected ? 'border-emerald-500/50' : 'border-dashed'}">
		<CardHeader class="border-b pb-4">
			<div class="flex items-center justify-between gap-3">
				<div>
					<CardTitle class="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
						<PlugZap class="w-5 h-5 text-primary" /> Ingest OBS
					</CardTitle>
					<CardDescription>Configura OBS con estos datos. El indicador cambia cuando StreamCoreOS recibe señal.</CardDescription>
				</div>
				<div class="flex items-center gap-2">
					{#if runtime?.active_source === 'obs'}
						<Badge variant="secondary" class="bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><CircleCheck class="w-3.5 h-3.5 mr-1" /> Recibiendo OBS</Badge>
					{:else if runtime?.active_source === 'fallback'}
						<Badge variant="secondary" class="bg-amber-500/10 text-amber-600 dark:text-amber-300">Fallback al aire</Badge>
					{:else}
						<Badge variant="secondary" class="bg-muted text-muted-foreground"><CircleX class="w-3.5 h-3.5 mr-1" /> Esperando OBS</Badge>
					{/if}
					<Button variant="outline" size="icon" onclick={loadRuntime} disabled={loadingRuntime}>
						<RefreshCw class="w-4 h-4 {loadingRuntime ? 'animate-spin' : ''}" />
					</Button>
				</div>
			</div>
		</CardHeader>
		<CardContent class="p-6 flex flex-col gap-4 text-sm">
			{#if runtimeError}
				<p class="text-xs text-destructive font-medium bg-destructive/10 p-2 rounded">{runtimeError}</p>
			{/if}

			<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
				<div class="rounded-lg bg-muted/40 p-3">
					<p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">URL OBS</p>
					<div class="flex items-center justify-between gap-2 mt-1">
						<p class="font-mono truncate">{runtime?.obs_url ?? 'rtmp://localhost:1935/live'}</p>
						<Button variant="ghost" size="icon" onclick={() => copyText(runtime?.obs_url ?? 'rtmp://localhost:1935/live', 'url')}>
							<Copy class="w-4 h-4" />
						</Button>
					</div>
					{#if copied === 'url'}<p class="text-[11px] text-emerald-500">Copiado</p>{/if}
				</div>
				<div class="rounded-lg bg-muted/40 p-3">
					<p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stream key local</p>
					<div class="flex items-center justify-between gap-2 mt-1">
						<p class="font-mono truncate">{runtime?.obs_stream_key ?? 'streamcore'}</p>
						<Button variant="ghost" size="icon" onclick={() => copyText(runtime?.obs_stream_key ?? 'streamcore', 'key')}>
							<Copy class="w-4 h-4" />
						</Button>
					</div>
					{#if copied === 'key'}<p class="text-[11px] text-emerald-500">Copiado</p>{/if}
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-4 gap-3">
				<div class="rounded-lg border bg-background/50 p-3">
					<p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fuente actual</p>
					<p class="mt-1 font-semibold">{sourceLabel}</p>
				</div>
				<div class="rounded-lg border bg-background/50 p-3">
					<p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">RTMP engine</p>
					<p class="mt-1 font-semibold">{runtime?.rtmp_engine_available ? 'Activo' : 'No disponible'}</p>
				</div>
				<div class="rounded-lg border bg-background/50 p-3">
					<p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">FFmpeg</p>
					<p class="mt-1 font-semibold">{runtime?.ffmpeg_available ? 'Disponible' : 'No instalado'}</p>
				</div>
				<div class="rounded-lg border bg-background/50 p-3">
					<p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Relays transmitiendo</p>
					<p class="mt-1 font-semibold">{runtime?.relays_count ?? 0} / {runtime?.live_outputs_count ?? 0}</p>
				</div>
			</div>

			{#if relayEntries.length > 0}
				<div class="rounded-lg border bg-background/50 p-3">
					<p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Relays en tiempo real</p>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
						{#each relayEntries as [id, relay]}
							<div class="rounded-md bg-muted/40 p-2 text-xs">
								<div class="flex items-center justify-between gap-2">
									<span class="font-mono">#{id}</span>
									<Badge variant="secondary">{relay.running ? relay.source : 'caído'}</Badge>
								</div>
								<p class="text-muted-foreground mt-1">{relay.platform} · PID {relay.pid ?? '—'} · {relay.uptime_seconds ?? 0}s</p>
								{#if relay.last_error}
									<pre class="mt-2 whitespace-pre-wrap rounded bg-destructive/10 p-2 text-[10px] text-destructive">{relay.last_error}</pre>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<div class="rounded-lg border bg-background/50 p-4 flex flex-col gap-3">
				<div class="flex items-start justify-between gap-3">
					<div>
						<p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Video fallback MP4</p>
						<p class="text-xs text-muted-foreground mt-1">Se transmite en loop si inicias destinos antes de abrir OBS o si OBS se cae.</p>
					</div>
					<Badge variant="secondary">{runtime?.fallback_video_configured ? 'MP4 configurado' : 'Sin MP4'}</Badge>
				</div>
				<div class="flex flex-col sm:flex-row gap-2">
					<input
						type="file"
						accept="video/mp4"
						class="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground"
						onchange={(e) => (fallbackFile = e.currentTarget.files?.[0] ?? null)}
					/>
					<Button onclick={uploadFallbackVideo} disabled={!fallbackFile || uploadingFallback}>
						{uploadingFallback ? 'Subiendo…' : 'Subir fallback'}
					</Button>
				</div>
				{#if runtime?.fallback_video_url}
					<video src={runtime.fallback_video_url} controls class="w-full max-h-64 rounded-md border bg-black">
						<track kind="captions" />
					</video>
				{/if}
				{#if fallbackMessage}
					<p class="text-xs text-muted-foreground">{fallbackMessage}</p>
				{/if}
			</div>
		</CardContent>
	</Card>

	<StreamOutputsPanel runtime={runtime} onStatusChange={loadRuntime} />
</div>
