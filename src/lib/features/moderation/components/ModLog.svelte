<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from '$lib/core/api/client';
	import type { ModLogResponse, ModLogEntry } from '$lib/types/api';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { RefreshCw, History, User, Shield, Info } from '@lucide/svelte';

	let entries = $state<ModLogEntry[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await get<ModLogResponse>('/moderation/log');
			entries = res.success && res.data ? res.data : [];
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function actionVariant(a: string): "destructive" | "secondary" | "default" | "outline" {
		if (a === 'ban') return 'destructive';
		if (a === 'timeout') return 'secondary';
		return 'outline';
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<Card class="w-full flex flex-col">
	<CardHeader class="flex flex-row items-center justify-between border-b pb-4">
		<div class="flex flex-col gap-1">
			<CardTitle class="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
				<History class="w-5 h-5 text-primary" /> Registro de Mod
			</CardTitle>
			<CardDescription class="text-[10px]">Historial de acciones recientes.</CardDescription>
		</div>
		<Button variant="ghost" size="icon" class="h-8 w-8" onclick={load} disabled={loading}>
			<RefreshCw class="w-4 h-4 {loading ? 'animate-spin' : ''}" />
		</Button>
	</CardHeader>

	<CardContent class="p-0 flex-1 overflow-hidden">
		{#if loading && entries.length === 0}
			<div class="p-8 text-center text-muted-foreground italic text-xs">Cargando historial...</div>
		{:else if error}
			<div class="p-4 text-xs text-destructive bg-destructive/10 border-b">{error}</div>
		{:else if entries.length === 0}
			<div class="p-8 text-center text-muted-foreground italic text-xs">Sin actividad registrada.</div>
		{:else}
			<div class="max-h-[500px] overflow-y-auto scrollbar-hide">
				<Table.Root>
					<Table.Header class="bg-muted/50 sticky top-0 z-10">
						<Table.Row>
							<Table.Head class="text-[10px] uppercase font-black py-2">Usuario</Table.Head>
							<Table.Head class="text-[10px] uppercase font-black text-center py-2">Acción</Table.Head>
							<Table.Head class="text-[10px] uppercase font-black py-2">Razón</Table.Head>
							<Table.Head class="text-[10px] uppercase font-black text-right py-2">Fecha</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each entries as entry (entry.id)}
							<Table.Row class="hover:bg-muted/30">
								<Table.Cell class="py-3">
									<div class="flex flex-col">
										<span class="font-bold text-sm flex items-center gap-1.5">
											<User class="w-3 h-3 opacity-50" /> {entry.display_name}
										</span>
									</div>
								</Table.Cell>
								<Table.Cell class="text-center">
									<Badge variant={actionVariant(entry.action)} class="text-[9px] uppercase font-black px-1.5 h-4 border-none shadow-none">
										{entry.action}
									</Badge>
								</Table.Cell>
								<Table.Cell class="max-w-[150px]">
									<span class="text-xs text-muted-foreground truncate block italic">
										{entry.reason || 'Sin motivo'}
									</span>
								</Table.Cell>
								<Table.Cell class="text-right whitespace-nowrap">
									<span class="text-[10px] font-mono text-muted-foreground">{formatDate(entry.created_at)}</span>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		{/if}
	</CardContent>
</Card>
