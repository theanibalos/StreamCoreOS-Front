<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from '$lib/core/api/client';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Video, RefreshCw, LogOut } from '@lucide/svelte';

	let loading = $state(true);
	let connecting = $state(false);
	let error = $state<string | null>(null);
	let connected = $state(false);
	let channelTitle = $state<string | null>(null);
	let channelId = $state<string | null>(null);

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await get<any>('/auth/youtube/status');
			if (res.success && res.data) {
				connected = !!res.data.connected;
				channelTitle = res.data.channel_title ?? null;
				channelId = res.data.channel_id ?? null;
			} else {
				error = res.error ?? 'Error al cargar YouTube';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	async function connect() {
		connecting = true;
		try {
			const res = await get<any>('/auth/youtube');
			if (res.success && res.data?.auth_url) window.location.href = res.data.auth_url;
			else error = res.error ?? 'No se pudo iniciar OAuth de YouTube';
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			connecting = false;
		}
	}

	async function logout() {
		await fetch('/api/auth/youtube/logout', { method: 'POST' });
		await load();
	}

	onMount(load);
</script>

<Card class="w-full">
	<CardHeader class="border-b pb-4">
		<div class="flex items-center gap-2">
			<Video class="w-5 h-5 text-red-600" />
			<CardTitle class="text-lg font-bold uppercase tracking-tight">YouTube Live</CardTitle>
		</div>
		<CardDescription>Conecta YouTube para mezclar el chat del directo con Twitch, TTS, comandos y overlays.</CardDescription>
	</CardHeader>
	<CardContent class="p-6 flex flex-col gap-4">
		{#if loading}
			<div class="text-muted-foreground italic py-6">Verificando YouTube…</div>
		{:else if error}
			<div class="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">{error}</div>
		{:else if connected}
			<div class="flex items-center justify-between gap-4 rounded-lg border p-4">
				<div class="min-w-0">
					<div class="flex items-center gap-2">
						<Badge variant="outline" class="text-green-700 dark:text-green-400 border-green-500/40 bg-green-500/10">conectado</Badge>
						<span class="font-semibold truncate">{channelTitle}</span>
					</div>
					<p class="text-xs text-muted-foreground mt-1 font-mono truncate">{channelId}</p>
				</div>
				<Button variant="outline" size="sm" onclick={logout}>
					<LogOut class="w-3.5 h-3.5 mr-1.5" /> Desconectar
				</Button>
			</div>
		{:else}
			<div class="flex items-center justify-between gap-4 rounded-lg border border-dashed p-4">
				<p class="text-sm text-muted-foreground">No hay sesión activa de YouTube.</p>
				<Button onclick={connect} disabled={connecting} class="bg-red-600 hover:bg-red-700 text-white">
					<RefreshCw class="w-3.5 h-3.5 mr-1.5 {connecting ? 'animate-spin' : ''}" />
					{connecting ? 'Redirigiendo…' : 'Conectar YouTube'}
				</Button>
			</div>
		{/if}
	</CardContent>
</Card>
