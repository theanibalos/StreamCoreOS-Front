<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from '$lib/core/api/client';
	import type { ListRemindersResponse, ReminderData } from '$lib/types/api';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { RefreshCw, Clock } from '@lucide/svelte';

	let reminders = $state<ReminderData[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function load() {
		try {
			const res = await get<ListRemindersResponse>('/chat/reminders');
			reminders = res.success && res.data ? res.data : [];
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		load();
		const interval = setInterval(load, 30_000);
		return () => clearInterval(interval);
	});

	function formatRunAt(iso: string) {
		const date = new Date(iso);
		const now = new Date();
		const diff = date.getTime() - now.getTime();
		const mins = Math.round(diff / 60000);

		if (mins <= 0) return 'Any moment now';
		if (mins < 60) return `in ${mins}m`;
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
</script>

<Card class="w-full mt-4">
	<CardHeader class="pb-3 flex flex-row items-center justify-between">
		<CardTitle class="text-sm font-bold uppercase tracking-wide">Recordatorios Activos</CardTitle>
		<Button variant="outline" size="icon" class="h-8 w-8" onclick={load} disabled={loading}>
			<RefreshCw class="h-4 w-4 {loading ? 'animate-spin' : ''}" />
		</Button>
	</CardHeader>
	<CardContent>
		{#if loading && reminders.length === 0}
			<p class="text-sm text-muted-foreground">Cargando recordatorios...</p>
		{:else if error}
			<p class="text-sm text-destructive">{error}</p>
		{:else if reminders.length === 0}
			<p class="text-sm text-muted-foreground">No hay recordatorios activos.</p>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each reminders as r (r.job_id)}
					<div class="flex flex-col gap-3 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
						<p class="text-sm italic flex-1">"{r.message}"</p>
						<div class="flex justify-between items-center text-xs">
							<span class="font-semibold text-primary">por {r.scheduled_by}</span>
							<Badge variant="outline" class="border-none rounded-md font-bold text-blue-500 bg-blue-500/10 dark:text-blue-400" title={new Date(r.run_at).toLocaleString()}>
								<Clock class="h-3 w-3" /> {formatRunAt(r.run_at)}
							</Badge>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</CardContent>
</Card>
