<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from '$lib/core/api/client';
	import type { GiftersLeaderboardResponse, GifterEntry } from '$lib/types/api';
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
	import { RefreshCw, Gift } from '@lucide/svelte';

	let entries = $state<GifterEntry[]>([]);
	let loading = $state(true);
	let error   = $state<string | null>(null);

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await get<GiftersLeaderboardResponse>('/gifters/leaderboard?limit=15');
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

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
	}
</script>

<Card class="w-full">
	<CardHeader class="flex flex-row items-center justify-between pb-3">
		<CardTitle class="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
			<Gift class="w-4 h-4 text-pink-400" /> Gifters
		</CardTitle>
		<Button variant="outline" size="icon" class="h-8 w-8" onclick={load} disabled={loading}>
			<RefreshCw class="h-4 w-4 {loading ? 'animate-spin' : ''}" />
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
				No hay gifters registrados aún.<br/>
				<span class="text-xs">Se registran automáticamente cuando alguien regala subs.</span>
			</div>
		{:else}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="w-[60px]">Rank</TableHead>
						<TableHead>Gifter</TableHead>
						<TableHead class="text-right">Subs regaladas</TableHead>
						<TableHead class="text-right text-muted-foreground">Último regalo</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each entries as entry (entry.twitch_id)}
						<TableRow>
							<TableCell class="font-medium text-lg">{medal(entry.rank)}</TableCell>
							<TableCell class="font-semibold">{entry.display_name}</TableCell>
							<TableCell class="text-right font-bold text-pink-400">
								🎁 {entry.gifts_total}
							</TableCell>
							<TableCell class="text-right text-muted-foreground text-xs">
								{fmtDate(entry.last_gift_at)}
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		{/if}
	</CardContent>
</Card>
