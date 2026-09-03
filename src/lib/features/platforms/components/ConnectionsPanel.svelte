<script lang="ts">
	import { onMount } from 'svelte';
	import { get, put } from '$lib/core/api/client';
	import type { PlatformConnectionData, PlatformConnectionsResponse } from '$lib/types/api';
	import { TwitchPermissions, YouTubePermissions } from '$lib/features/auth';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { RefreshCw, RadioTower } from '@lucide/svelte';
	import PlatformConnectionCard from './PlatformConnectionCard.svelte';

	let connections = $state<PlatformConnectionData[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await get<PlatformConnectionsResponse>('/platforms/connections');
			connections = res.success ? (res.data ?? []) : [];
			if (!res.success) error = res.error ?? 'No se pudieron cargar las conexiones.';
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	async function toggleConnection(connection: PlatformConnectionData, enabled: boolean) {
		try {
			const res = await put<any>(`/platforms/connections/${connection.id}`, { enabled });
			if (res.success && res.data) {
				connections = connections.map((c) => (c.id === connection.id ? res.data : c));
			} else {
				error = res.error ?? 'No se pudo actualizar la conexión.';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	onMount(load);
</script>

<div class="flex flex-col gap-4">
	<Card class="w-full">
		<CardHeader class="flex flex-row items-center justify-between border-b pb-4">
			<div>
				<CardTitle class="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
					<RadioTower class="w-5 h-5 text-primary" /> Conexiones
				</CardTitle>
				<CardDescription>Cuentas/canales conectados y capacidades disponibles por plataforma.</CardDescription>
			</div>
			<Button variant="outline" size="icon" onclick={load} disabled={loading}>
				<RefreshCw class="w-4 h-4 {loading ? 'animate-spin' : ''}" />
			</Button>
		</CardHeader>
		<CardContent class="p-6 flex flex-col gap-4">
			{#if error}
				<p class="text-xs text-destructive font-medium bg-destructive/10 p-2 rounded">{error}</p>
			{/if}

			{#if loading}
				<p class="text-sm text-muted-foreground italic">Cargando conexiones…</p>
			{:else if connections.length === 0}
				<p class="text-sm text-muted-foreground">Todavía no hay canales registrados. Conecta Twitch o YouTube abajo.</p>
			{:else}
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
					{#each connections as connection (connection.id)}
						<PlatformConnectionCard {connection} onToggle={toggleConnection} />
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>

	<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
		<YouTubePermissions />
		<TwitchPermissions />
	</div>
</div>
