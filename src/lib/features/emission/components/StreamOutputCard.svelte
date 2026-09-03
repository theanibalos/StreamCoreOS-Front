<script lang="ts">
	import type { StreamOutputData } from '$lib/types/api';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { Pencil, Trash2, KeyRound, Radio } from '@lucide/svelte';

	let {
		output,
		onEdit,
		onDelete,
		onToggle
	}: {
		output: StreamOutputData;
		onEdit?: (output: StreamOutputData) => void;
		onDelete?: (output: StreamOutputData) => void;
		onToggle?: (output: StreamOutputData, enabled: boolean) => void;
	} = $props();

	const platformColors: Record<string, string> = {
		twitch: 'border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300',
		youtube: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
		custom: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300'
	};
</script>

<Card class="border-muted/80">
	<CardContent class="p-4 flex flex-col gap-4">
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0">
				<div class="flex items-center gap-2">
					<Radio class="w-4 h-4 text-primary" />
					<h3 class="font-bold truncate">{output.name}</h3>
				</div>
				<p class="text-xs text-muted-foreground font-mono truncate mt-1">{output.rtmp_url ?? 'Sin RTMP URL'}</p>
			</div>
			<div class="flex items-center gap-2 shrink-0">
				<Badge variant="outline" class={platformColors[output.platform] ?? platformColors.custom}>{output.platform}</Badge>
				<Badge variant="secondary">{output.status}</Badge>
			</div>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
			<div class="rounded-md bg-muted/40 p-2">
				<p class="text-muted-foreground uppercase font-black text-[10px]">Channel</p>
				<p class="font-mono truncate">{output.channel_id}</p>
			</div>
			<div class="rounded-md bg-muted/40 p-2">
				<p class="text-muted-foreground uppercase font-black text-[10px]">Overlay</p>
				<p>{output.overlay_id ?? '—'}</p>
			</div>
			<div class="rounded-md bg-muted/40 p-2">
				<p class="text-muted-foreground uppercase font-black text-[10px] flex items-center gap-1"><KeyRound class="w-3 h-3" /> Key</p>
				<p>{output.stream_key_configured ? `••••${output.stream_key_preview}` : 'No configurada'}</p>
			</div>
		</div>

		<div class="flex items-center justify-between gap-3 pt-1">
			<div class="flex items-center gap-2">
				<span class="text-xs text-muted-foreground">Enabled</span>
				<Switch checked={output.enabled} size="sm" onCheckedChange={(enabled) => onToggle?.(output, enabled)} />
			</div>
			<div class="flex gap-2">
				<Button variant="outline" size="sm" onclick={() => onEdit?.(output)}><Pencil class="w-3.5 h-3.5 mr-1.5" /> Editar</Button>
				<Button variant="destructive" size="sm" onclick={() => onDelete?.(output)}><Trash2 class="w-3.5 h-3.5 mr-1.5" /> Borrar</Button>
			</div>
		</div>
	</CardContent>
</Card>
