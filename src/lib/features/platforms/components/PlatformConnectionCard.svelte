<script lang="ts">
	import type { PlatformConnectionData } from '$lib/types/api';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Switch } from '$lib/components/ui/switch';
	import { Tv, CheckCircle2, XCircle } from '@lucide/svelte';

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

	const capabilityLabels: Record<string, string> = {
		'chat.read': 'Leer chat',
		'chat.write': 'Escribir chat',
		'moderation.delete': 'Borrar mensajes',
		'moderation.timeout': 'Timeout',
		'moderation.ban': 'Ban',
		'events.subscription': 'Subs / membresías',
		'events.cheer': 'Bits / cheers',
		'events.superchat': 'Super Chat',
		'stream.status': 'Estado del directo'
	};

	const capabilities = $derived(Object.entries(connection.capabilities ?? {}).sort(([a], [b]) => a.localeCompare(b)));
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
	<CardContent class="pt-0 flex flex-col gap-4">
		<div class="flex flex-wrap gap-1.5">
			{#if connection.chat_read_enabled}<Badge variant="secondary">chat read</Badge>{/if}
			{#if connection.chat_write_enabled}<Badge variant="secondary">chat write</Badge>{/if}
			{#if connection.moderation_enabled}<Badge variant="secondary">mod</Badge>{/if}
		</div>

		<div class="rounded-lg bg-muted/30 p-3">
			<p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Capacidades completas</p>
			{#if capabilities.length === 0}
				<p class="text-xs text-muted-foreground">Sin capacidades declaradas.</p>
			{:else}
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
					{#each capabilities as [key, value]}
						<div class="flex items-center justify-between gap-2 rounded-md bg-background/60 border px-2 py-1.5 text-xs">
							<div class="min-w-0">
								<p class="font-semibold truncate">{capabilityLabels[key] ?? key}</p>
								<p class="font-mono text-[10px] text-muted-foreground truncate">{key}</p>
							</div>
							{#if value}
								<CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
							{:else}
								<XCircle class="w-4 h-4 text-muted-foreground shrink-0" />
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="flex items-center justify-end gap-2">
			<span class="text-xs text-muted-foreground">Activo</span>
			<Switch checked={connection.enabled} size="sm" onCheckedChange={(enabled) => onToggle?.(connection, enabled)} />
		</div>
	</CardContent>
</Card>
