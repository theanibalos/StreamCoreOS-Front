<script lang="ts">
	import type { PlatformConnectionData } from '$lib/types/api';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Switch } from '$lib/components/ui/switch';
	import { Tv } from '@lucide/svelte';

	let {
		connection,
		onToggle
	}: {
		connection: PlatformConnectionData;
		onToggle?: (connection: PlatformConnectionData, enabled: boolean) => void;
	} = $props();

	const platformColors: Record<string, string> = {
		twitch: 'border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300',
		youtube: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300'
	};
</script>

<Card class="border-muted/80">
	<CardHeader class="pb-3">
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0">
				<CardTitle class="text-sm font-bold uppercase tracking-tight flex items-center gap-2">
					<Tv class="w-4 h-4 text-primary" />
					<span class="truncate">{connection.channel_name}</span>
				</CardTitle>
				<CardDescription class="font-mono text-[11px] truncate mt-1">{connection.channel_id}</CardDescription>
			</div>
			<Badge variant="outline" class={platformColors[connection.platform] ?? ''}>{connection.platform}</Badge>
		</div>
	</CardHeader>
	<CardContent class="pt-0 flex items-center justify-between gap-4">
		<div class="flex flex-wrap gap-1.5">
			{#if connection.chat_read_enabled}<Badge variant="secondary">chat read</Badge>{/if}
			{#if connection.chat_write_enabled}<Badge variant="secondary">chat write</Badge>{/if}
			{#if connection.moderation_enabled}<Badge variant="secondary">mod</Badge>{/if}
		</div>
		<div class="flex items-center gap-2">
			<span class="text-xs text-muted-foreground">Activo</span>
			<Switch checked={connection.enabled} size="sm" onCheckedChange={(enabled) => onToggle?.(connection, enabled)} />
		</div>
	</CardContent>
</Card>
