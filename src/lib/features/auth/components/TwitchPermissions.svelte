<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from '$lib/core/api/client';
	import { startTwitchAuth } from '$lib/core/stores/auth.svelte';
	import type { ScopesResponse } from '$lib/types/api';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { ShieldCheck, ShieldAlert, RefreshCw } from '@lucide/svelte';

	let loading = $state(true);
	let error = $state<string | null>(null);
	let connected = $state(false);
	let required = $state<string[]>([]);
	let granted = $state<string[]>([]);
	let missing = $state<string[]>([]);
	let reauthorizing = $state(false);

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await get<ScopesResponse>('/auth/twitch/scopes');
			if (res.success && res.data) {
				connected = res.data.connected;
				required = res.data.required ?? [];
				granted = res.data.granted ?? [];
				missing = res.data.missing ?? [];
			} else {
				error = res.error ?? 'Error al cargar los permisos';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	async function reauthorize() {
		reauthorizing = true;
		await startTwitchAuth();
		reauthorizing = false;
	}

	onMount(load);
</script>

<Card class="w-full">
	<CardHeader class="border-b pb-4">
		<div class="flex items-center gap-2">
			<ShieldCheck class="w-5 h-5 text-primary" />
			<CardTitle class="text-lg font-bold uppercase tracking-tight">Permisos de Twitch</CardTitle>
		</div>
		<CardDescription>
			Scopes OAuth requeridos por los plugins activos vs. los autorizados en el token actual.
		</CardDescription>
	</CardHeader>

	<CardContent class="p-6 flex flex-col gap-4">
		{#if loading}
			<div class="flex items-center justify-center py-12 text-muted-foreground italic">
				Verificando permisos…
			</div>
		{:else if error}
			<div class="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
				{error}
			</div>
		{:else if !connected}
			<div class="p-8 text-center border-2 border-dashed rounded-lg text-muted-foreground">
				No hay sesión activa de Twitch. Autentícate primero.
			</div>
		{:else}
			{#if missing.length > 0}
				<div class="flex items-center gap-3 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
					<ShieldAlert class="w-5 h-5 text-destructive flex-shrink-0" />
					<div class="flex-1 min-w-0">
						<p class="text-sm font-semibold text-destructive">
							{missing.length} {missing.length === 1 ? 'permiso faltante' : 'permisos faltantes'}
						</p>
						<p class="text-xs text-muted-foreground mt-0.5">
							Algunas funciones no recibirán eventos de Twitch hasta que re-autorices.
						</p>
					</div>
					<Button
						onclick={reauthorize}
						disabled={reauthorizing}
						class="flex-shrink-0 bg-[#9146ff] hover:bg-[#9146ff]/90 text-white"
						size="sm"
					>
						<RefreshCw class="w-3.5 h-3.5 mr-1.5 {reauthorizing ? 'animate-spin' : ''}" />
						{reauthorizing ? 'Redirigiendo…' : 'Re-autorizar'}
					</Button>
				</div>
			{:else}
				<div class="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-lg p-4">
					<ShieldCheck class="w-5 h-5 text-green-600 flex-shrink-0" />
					<p class="text-sm font-semibold text-green-700 dark:text-green-400">
						Todos los permisos están autorizados
					</p>
				</div>
			{/if}

			<div class="flex flex-col gap-2 mt-2">
				{#each required as scope}
					{@const isGranted = granted.includes(scope)}
					<div class="flex items-center justify-between px-4 py-2.5 rounded-lg border bg-card/50 hover:bg-muted/30 transition-colors">
						<code class="text-sm font-mono text-foreground">{scope}</code>
						{#if isGranted}
							<Badge variant="outline" class="font-mono text-xs text-green-700 dark:text-green-400 border-green-500/40 bg-green-500/10">
								✓ activo
							</Badge>
						{:else}
							<Badge variant="outline" class="font-mono text-xs text-destructive border-destructive/40 bg-destructive/10">
								✗ faltante
							</Badge>
						{/if}
					</div>
				{/each}
			</div>

			<div class="flex justify-between text-xs text-muted-foreground pt-2 px-1">
				<span>{required.length} requeridos</span>
				<span>{granted.length} autorizados · {missing.length} faltantes</span>
			</div>
		{/if}
	</CardContent>
</Card>
