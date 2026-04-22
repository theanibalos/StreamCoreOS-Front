<script lang="ts">
	import { onMount } from 'svelte';
	import { get, post, del } from '$lib/core/api/client';
	import type { 
		ListRegularsResponse, 
		RegularEntry, 
		AddRegularResponse, 
		RegularData,
		RemoveRegularResponse
	} from '$lib/types/api';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { RefreshCw, UserPlus, Trash2, Users } from '@lucide/svelte';

	let regulars = $state<RegularEntry[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Add form
	let twitchId = $state('');
	let login = $state('');
	let displayName = $state('');
	let adding = $state(false);

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await get<ListRegularsResponse>('/viewers/regulars');
			regulars = res.success && res.data ? res.data : [];
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	async function addRegular() {
		if (!twitchId || !login || !displayName) return;
		adding = true;
		try {
			const res = await post<AddRegularResponse>('/viewers/regulars', {
				twitch_id: twitchId,
				login,
				display_name: displayName
			});
			if (res.success && res.data) {
				await load(); 
				twitchId = '';
				login = '';
				displayName = '';
			} else {
				error = res.error ?? 'Failed to add regular';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			adding = false;
		}
	}

	async function removeRegular(id: string) {
		if (!confirm('¿Eliminar de la lista de regulars?')) return;
		try {
			const res = await del<RemoveRegularResponse>(`/viewers/regulars/${id}`);
			if (res.success) {
				regulars = regulars.filter(r => r.twitch_id !== id);
			} else {
				error = res.error ?? 'Failed to remove regular';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	onMount(load);
</script>

<Card class="w-full">
	<CardHeader class="flex flex-row items-center justify-between pb-4 border-b">
		<CardTitle class="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
			<Users class="w-4 h-4" /> Espectadores Habituales (Regulars)
		</CardTitle>
		<Button variant="outline" size="icon" class="h-8 w-8" onclick={load} disabled={loading}>
			<RefreshCw class="h-4 w-4 {loading ? 'animate-spin' : ''}" />
		</Button>
	</CardHeader>
	<CardContent class="pt-6 flex flex-col gap-6">
		<div class="flex flex-col gap-3">
			<span class="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
				<UserPlus class="w-3 h-3" /> Añadir Nuevo Regular
			</span>
			<div class="flex flex-col sm:flex-row gap-2">
				<Input placeholder="Twitch ID" bind:value={twitchId} class="flex-1 text-xs" />
				<Input placeholder="Login" bind:value={login} class="flex-1 text-xs" />
				<Input placeholder="Nombre" bind:value={displayName} class="flex-1 text-xs" />
				<Button onclick={addRegular} disabled={adding || !twitchId} size="sm" class="sm:w-12">
					{adding ? '...' : '+'}
				</Button>
			</div>
			{#if error}
				<p class="text-xs text-destructive">{error}</p>
			{/if}
		</div>

		<div class="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
			{#if loading && regulars.length === 0}
				<p class="text-sm text-muted-foreground text-center py-8 italic">Cargando regulars...</p>
			{:else if regulars.length === 0}
				<p class="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg italic">No hay espectadores habituales registrados.</p>
			{:else}
				{#each regulars as reg (reg.twitch_id)}
					<div class="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors shadow-sm">
						<div class="flex flex-col gap-0.5">
							<span class="text-sm font-bold">{reg.display_name}</span>
							<span class="text-[10px] text-muted-foreground uppercase tracking-tight">
								{reg.login} ({reg.twitch_id}) &bull; <span class="text-primary font-bold">{reg.points} pts</span>
							</span>
						</div>
						<Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-destructive" onclick={() => removeRegular(reg.twitch_id)}>
							<Trash2 class="w-4 h-4" />
						</Button>
					</div>
				{/each}
			{/if}
		</div>
	</CardContent>
</Card>
