<script lang="ts">
	import { onMount } from 'svelte';
	import { get, post } from '$lib/core/api/client';
	import type { SubscribersLeaderboardResponse, SubscriberEntry } from '$lib/types/api';
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
	import { RefreshCw, Crown, ChevronLeft, ChevronRight } from '@lucide/svelte';

	type SortKey = 'months' | 'tier' | 'streak';

	const PER_PAGE = 20;

	let entries = $state<SubscriberEntry[]>([]);
	let total   = $state(0);
	let page    = $state(1);
	let loading = $state(true);
	let syncing = $state(false);
	let error   = $state<string | null>(null);
	let sort        = $state<SortKey>('months');
	let activeOnly  = $state(true);
	let excludeGift = $state(false);

	const totalPages = $derived(Math.max(1, Math.ceil(total / PER_PAGE)));

	async function sync() {
		syncing = true;
		error = null;
		try {
			await post('/subscribers/sync', {});
			page = 1;
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
			const offset = (page - 1) * PER_PAGE;
			const params = new URLSearchParams({
				sort,
				active_only: String(activeOnly),
				exclude_gift: String(excludeGift),
				limit: String(PER_PAGE),
				offset: String(offset),
			});
			const res = await get<SubscribersLeaderboardResponse>(`/subscribers/leaderboard?${params}`);
			entries = res.success && res.data ? res.data : [];
			total   = res.total ?? entries.length;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	function changePage(delta: number) {
		const next = page + delta;
		if (next < 1 || next > totalPages) return;
		page = next;
		load();
	}

	function changeSort(s: SortKey) {
		sort = s;
		page = 1;
		load();
	}

	function toggleActive() {
		activeOnly = !activeOnly;
		page = 1;
		load();
	}

	function toggleGift() {
		excludeGift = !excludeGift;
		page = 1;
		load();
	}

	onMount(load);

	function medal(rank: number): string {
		if (rank === 1) return '🥇';
		if (rank === 2) return '🥈';
		if (rank === 3) return '🥉';
		return `#${rank}`;
	}

	function tierLabel(tier: string, isPrime: boolean): string {
		if (isPrime) return 'Prime';
		if (tier === '1000') return 'T1';
		if (tier === '2000') return 'T2';
		if (tier === '3000') return 'T3';
		return tier;
	}

	function tierVariant(tier: string, isPrime: boolean): 'default' | 'secondary' | 'outline' {
		if (isPrime) return 'outline';
		if (tier === '3000') return 'default';
		if (tier === '2000') return 'secondary';
		return 'outline';
	}
</script>

<Card class="w-full">
	<CardHeader class="flex flex-row items-center justify-between pb-3">
		<CardTitle class="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
			<Crown class="w-4 h-4 text-purple-500" /> Suscriptores
			{#if total > 0}
				<span class="text-muted-foreground font-normal normal-case text-xs">({total})</span>
			{/if}
		</CardTitle>
		<div class="flex items-center gap-2">
			<div class="flex rounded-md border overflow-hidden text-xs">
				{#each (['months', 'tier', 'streak'] as SortKey[]) as s}
					<button
						class="px-2 py-1 transition-colors {sort === s ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}"
						onclick={() => changeSort(s)}
					>
						{s === 'months' ? 'Meses' : s === 'tier' ? 'Tier' : 'Racha'}
					</button>
				{/each}
			</div>
			<button
				class="px-2 py-1 rounded border text-xs transition-colors {activeOnly ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}"
				onclick={toggleActive}
			>
				{activeOnly ? 'Activos' : 'Todos'}
			</button>
			<button
				class="px-2 py-1 rounded border text-xs transition-colors {excludeGift ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}"
				onclick={toggleGift}
				title="Mostrar solo subs pagados (sin regalos)"
			>
				Sin gifts
			</button>
			<Button variant="outline" size="icon" class="h-8 w-8" title="Sync desde Twitch" onclick={sync} disabled={syncing || loading}>
				<RefreshCw class="h-4 w-4 {syncing ? 'animate-spin' : ''}" />
			</Button>
		</div>
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
				No hay suscriptores registrados.
			</div>
		{:else}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="w-[60px]">Rank</TableHead>
						<TableHead>Suscriptor</TableHead>
						<TableHead class="text-center">Tier</TableHead>
						<TableHead class="text-right">Meses</TableHead>
						<TableHead class="text-right">Racha</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each entries as entry (entry.twitch_id)}
						<TableRow>
							<TableCell class="font-medium text-lg">{medal(entry.rank)}</TableCell>
							<TableCell>
								<div class="flex items-center gap-2">
									<span class="font-semibold">{entry.display_name}</span>
									{#if entry.is_gift}
										<Badge variant="outline" class="text-[0.6rem] px-1 py-0 h-4">Gift</Badge>
									{/if}
								</div>
							</TableCell>
							<TableCell class="text-center">
								<Badge variant={tierVariant(entry.tier, entry.is_prime)} class="text-xs">
									{tierLabel(entry.tier, entry.is_prime)}
								</Badge>
							</TableCell>
							<TableCell class="text-right font-bold text-primary">
								{entry.cumulative_months}
							</TableCell>
							<TableCell class="text-right text-muted-foreground">
								{entry.streak_months ?? '—'}
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>

			{#if total > PER_PAGE}
				<div class="flex items-center justify-between pt-3 text-sm text-muted-foreground">
					<span>Página {page} de {totalPages}</span>
					<div class="flex gap-1">
						<Button variant="outline" size="icon" class="h-7 w-7" onclick={() => changePage(-1)} disabled={page <= 1 || loading}>
							<ChevronLeft class="h-4 w-4" />
						</Button>
						<Button variant="outline" size="icon" class="h-7 w-7" onclick={() => changePage(1)} disabled={page >= totalPages || loading}>
							<ChevronRight class="h-4 w-4" />
						</Button>
					</div>
				</div>
			{/if}
		{/if}
	</CardContent>
</Card>
