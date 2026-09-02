<script lang="ts">
	import { get, post } from '$lib/core/api/client';
	import type {
		ViewerResponse,
		ViewerData,
		AdjustPointsResponse
	} from '$lib/types/api';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Search, User, Calendar, Coins, TrendingUp } from '@lucide/svelte';

	let query = $state('');
	let viewer = $state<ViewerData | null>(null);
	let loading = $state(false);
	let adjusting = $state(false);
	let delta = $state(0);
	let error = $state<string | null>(null);

	async function lookup() {
		const id = query.trim();
		if (!id) return;
		loading = true;
		error = null;
		viewer = null;
		try {
			const res = await get<ViewerResponse>(`/viewers/${encodeURIComponent(id)}`);
			if (res.success && res.data) {
				viewer = res.data;
			} else {
				error = res.error ?? 'Viewer not found';
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
				error = 'User not found';
			} else {
				error = msg;
			}
		} finally {
			loading = false;
		}
	}

	async function adjustPoints() {
		if (!viewer || delta === 0) return;
		adjusting = true;
		error = null;
		try {
			const res = await post<AdjustPointsResponse>(`/viewers/${encodeURIComponent(viewer.global_user_id)}/points`, {
				delta
			});
			if (res.success && res.data) {
				await lookup(); 
				delta = 0;
			} else {
				error = res.error ?? 'Failed to adjust points';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			adjusting = false;
		}
	}

	function fmt(n: number): string {
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
		if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
		return String(n);
	}

	function formatDate(iso: string): string {
		if (!iso) return 'Nunca';
		return new Date(iso).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') lookup();
	}
</script>

<Card class="w-full">
	<CardHeader class="pb-4">
		<CardTitle class="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
			<Search class="w-4 h-4" /> Buscar Viewer
		</CardTitle>
	</CardHeader>
	<CardContent class="flex flex-col gap-4">
		<div class="flex gap-2">
			<Input
				type="text"
				placeholder="ID global, ID de plataforma o username..."
				bind:value={query}
				onkeydown={onKeydown}
				class="flex-1"
			/>
			<Button onclick={lookup} disabled={loading || !query.trim()}>
				{loading ? 'Buscando...' : 'Buscar'}
			</Button>
		</div>

		{#if error}
			<div class="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
				{error}
			</div>
		{/if}

		{#if viewer}
			<div class="rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col mt-2 overflow-hidden">
				<div class="p-4 bg-muted/30 border-b flex flex-col gap-1">
					<div class="flex items-center gap-2">
						<User class="w-5 h-5 text-primary" />
						<span class="text-lg font-bold">{viewer.display_name}</span>
						<Badge variant="outline" class="text-[0.65rem] px-1.5 py-0 h-4.5 uppercase">{viewer.platform}</Badge>
						{#if viewer.is_regular}
							<Badge variant="secondary" class="text-[0.65rem] px-1.5 py-0 h-4.5 bg-blue-500/15 text-blue-600 dark:text-blue-400">REGULAR</Badge>
						{/if}
					</div>
					<div class="text-xs text-muted-foreground ml-7">
						ID: {viewer.global_user_id} &bull; plataforma: {viewer.platform_user_id} &bull; login: {viewer.login ?? '—'}
					</div>
				</div>

				<div class="grid grid-cols-2 p-4 gap-4 bg-background">
					<div class="flex flex-col gap-1">
						<span class="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
							<Coins class="h-3 w-3" /> Puntos
						</span>
						<span class="text-2xl font-black text-primary">{fmt(viewer.points)}</span>
					</div>
					<div class="flex flex-col gap-1">
						<span class="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
							<TrendingUp class="h-3 w-3" /> Ganados
						</span>
						<span class="text-xl font-bold">{fmt(viewer.total_earned)}</span>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4 px-4 pb-4 bg-background">
					<div class="flex flex-col gap-0.5">
						<span class="text-xs text-muted-foreground font-medium">Primera vez</span>
						<span class="text-sm flex items-center gap-1.5"><Calendar class="w-3 h-3 opacity-50"/> {formatDate(viewer.first_seen)}</span>
					</div>
					<div class="flex flex-col gap-0.5">
						<span class="text-xs text-muted-foreground font-medium">Última vez</span>
						<span class="text-sm flex items-center gap-1.5"><Calendar class="w-3 h-3 opacity-50"/> {formatDate(viewer.last_seen)}</span>
					</div>
				</div>

				<div class="p-4 bg-muted/20 border-t flex flex-col gap-2">
					<span class="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
						Ajustar Puntos
					</span>
					<div class="flex gap-2">
						<Input type="number" bind:value={delta} placeholder="Delta (+/-)" class="w-24" />
						<Button 
							onclick={adjustPoints} 
							disabled={adjusting || delta === 0}
							variant={delta > 0 ? 'default' : (delta < 0 ? 'destructive' : 'secondary')}
							class="flex-1"
						>
							{adjusting ? 'Aplicando...' : 'Aplicar'}
						</Button>
					</div>
				</div>
			</div>
		{/if}
	</CardContent>
</Card>
