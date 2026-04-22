<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from '$lib/core/api/client';
	import type { LeaderboardResponse, ViewerLeaderboardEntry as LeaderboardEntry } from '$lib/types/api';
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
	import { Badge } from '$lib/components/ui/badge';
	import { RefreshCw, Trophy } from '@lucide/svelte';

	let entries = $state<LeaderboardEntry[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await get<LeaderboardResponse>('/viewers/leaderboard');
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
</script>

<Card class="w-full">
	<CardHeader class="flex flex-row items-center justify-between pb-3">
		<CardTitle class="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
			<Trophy class="w-4 h-4 text-yellow-500" /> Leaderboard
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
				No hay datos disponibles.
			</div>
		{:else}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="w-[80px]">Rank</TableHead>
						<TableHead>Viewer</TableHead>
						<TableHead class="text-right">Puntos</TableHead>
						<TableHead class="text-right text-muted-foreground">Total</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each entries as entry (entry.twitch_id)}
						<TableRow>
							<TableCell class="font-medium text-lg">{medal(entry.rank)}</TableCell>
							<TableCell>
								<div class="flex items-center gap-2">
									<span class="font-semibold">{entry.display_name}</span>
									{#if entry.is_regular}
										<Badge variant="secondary" class="text-[0.6rem] px-1 py-0 h-4">REG</Badge>
									{/if}
								</div>
							</TableCell>
							<TableCell class="text-right font-bold text-primary">
								{fmt(entry.points)}
							</TableCell>
							<TableCell class="text-right text-muted-foreground">
								{fmt(entry.total_earned)}
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		{/if}
	</CardContent>
</Card>
