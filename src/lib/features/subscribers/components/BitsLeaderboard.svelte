<script lang="ts">
	import { onMount } from 'svelte';
	import { get, post } from '$lib/core/api/client';
	import type { BitsLeaderboardResponse, BitsEntry } from '$lib/types/api';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { RefreshCw, RefreshCcw, Zap } from '@lucide/svelte';

	let entries = $state<BitsEntry[]>([]);
	let loading = $state(true);
	let syncing = $state(false);
	let error = $state<string | null>(null);

	async function sync() {
		syncing = true;
		error = null;
		try {
			await post('/bits/sync', {});
			await load();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			syncing = false;
		}
	}

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await get<BitsLeaderboardResponse>('/bits/leaderboard?limit=15');
			entries = res.success && res.data ? res.data : [];
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function medal(rank: number): string {
		if (rank === 1) return '🥇';
		if (rank === 2) return '🥈';
		if (rank === 3) return '🥉';
		return `#${rank}`;
	}

	function fmt(n: number): string {
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
		if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
		return String(n);
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
	}
</script>

<Card class="w-full">
	<CardHeader class="flex flex-row items-center justify-between pb-3">
		<CardTitle class="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
			<Zap class="w-4 h-4 text-yellow-400" /> Bits
		</CardTitle>
		<Button 
			variant="outline" 
			size="icon" 
			class="h-8 w-8" 
			title="Sincronizar con Twitch" 
			onclick={sync} 
			disabled={syncing || loading}
		>
			<RefreshCw class="h-4 w-4 {syncing || loading ? 'animate-spin' : ''}" />
		</Button>
	</CardHeader>
	<CardContent>
		{#if loading && entries.length === 0}
			<div class="flex items-center justify-center p-8 text-muted-foreground">
				<RefreshCw class="h-5 w-5 animate-spin mr-2" /> Cargando...
			</div>
		{:else if error}
			<div class="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
				Error: {error}
			</div>
		{:else if entries.length === 0}
			<div class="p-8 text-center text-muted-foreground text-sm">
				No hay bits registrados.
			</div>
		{:else}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="w-[60px]">Rank</TableHead>
						<TableHead>Viewer</TableHead>
						<TableHead class="text-right">Bits</TableHead>
						<TableHead class="text-right text-muted-foreground">Último</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each entries as entry (entry.twitch_id)}
						<TableRow>
							<TableCell class="font-medium text-lg">{medal(entry.rank)}</TableCell>
							<TableCell class="font-semibold">{entry.display_name}</TableCell>
							<TableCell class="text-right font-bold text-yellow-500">
								⚡ {fmt(entry.bits_total)}
							</TableCell>
							<TableCell class="text-right text-muted-foreground text-xs">
								{fmtDate(entry.last_cheer_at)}
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		{/if}
	</CardContent>
</Card>
