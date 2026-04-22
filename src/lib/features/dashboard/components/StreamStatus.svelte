<script lang="ts">
	import { stream } from '$lib/core/stores/stream.svelte';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Users, UserPlus, Clock } from '@lucide/svelte';

	function formatDuration(startedAt: string): string {
		const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
		const h = Math.floor(diff / 3600);
		const m = Math.floor((diff % 3600) / 60);
		const s = diff % 60;
		if (h > 0) return `${h}h ${m}m`;
		if (m > 0) return `${m}m ${s}s`;
		return `${s}s`;
	}

	function fmt(n: number | null): string {
		if (n === null) return '—';
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
		if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
		return String(n);
	}
</script>

<Card>
	<CardContent class="p-6">
		{#if stream.loading}
			<div class="flex items-center text-muted-foreground">
				<div class="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
				Cargando estado del stream...
			</div>
		{:else if stream.error}
			<p class="text-sm text-destructive">Error: {stream.error}</p>
		{:else}
			<div class="flex flex-col gap-6">
				<div class="flex items-center gap-3">
					<Badge variant={stream.online ? 'default' : 'secondary'} class={stream.online ? 'bg-green-500 hover:bg-green-600 text-white' : ''}>
						{stream.online ? '● LIVE' : '○ OFFLINE'}
					</Badge>
					{#if stream.broadcaster_login}
						<span class="text-sm font-medium text-muted-foreground">{stream.broadcaster_login}</span>
					{/if}
				</div>

				<div class="flex flex-wrap gap-8">
					<div class="flex flex-col gap-1">
						<span class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							<Users class="h-3.5 w-3.5" /> Viewers
						</span>
						<span class="text-2xl font-bold">{fmt(stream.viewer_count)}</span>
					</div>
					<div class="flex flex-col gap-1">
						<span class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							<UserPlus class="h-3.5 w-3.5" /> Followers
						</span>
						<span class="text-2xl font-bold">{fmt(stream.follower_count)}</span>
					</div>
					{#if stream.online && stream.started_at}
						<div class="flex flex-col gap-1">
							<span class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								<Clock class="h-3.5 w-3.5" /> Uptime
							</span>
							<span class="text-2xl font-bold">{formatDuration(stream.started_at)}</span>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</CardContent>
</Card>
