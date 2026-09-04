<script lang="ts">
	import type { StreamOutputData } from '$lib/types/api';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { Pencil, Trash2, KeyRound, Radio, Play, Square } from '@lucide/svelte';

	let {
		output,
		overlays = [],
		onEdit,
		onDelete,
		onToggle,
		onStart,
		onStop
	}: {
		output: StreamOutputData;
		overlays?: Array<{ id: number; name: string }>;
		onEdit?: (output: StreamOutputData) => void;
		onDelete?: (output: StreamOutputData) => void;
		onToggle?: (output: StreamOutputData, enabled: boolean) => void;
		onStart?: (output: StreamOutputData) => void;
		onStop?: (output: StreamOutputData) => void;
	} = $props();

	const overlayName = $derived(
		output.overlay_id ? (overlays.find((o) => o.id === output.overlay_id)?.name ?? `ID: ${output.overlay_id}`) : 'Sin Overlay'
	);

	const platformColors: Record<string, string> = {
		twitch: 'border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300',
		youtube: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
		custom: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300'
	};

	const statusLabels: Record<string, string> = {
		stopped: 'Detenido',
		ready: 'Listo',
		live: 'Transmitiendo',
		error: 'Error'
	};

	const statusColors: Record<string, string> = {
		stopped: 'bg-muted text-muted-foreground',
		ready: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
		live: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
		error: 'bg-destructive/10 text-destructive'
	};
</script>

<Card class="transition-all {output.status === 'live' ? 'border-emerald-500/80 bg-emerald-500/5 shadow-md shadow-emerald-500/5' : output.status === 'error' ? 'border-destructive/60 bg-destructive/5' : 'border-muted/80'}">
	<CardContent class="p-4 flex flex-col gap-4">
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0">
				<div class="flex items-center gap-2">
					{#if output.status === 'live'}
						<span class="relative flex h-2.5 w-2.5">
							<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
							<span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
						</span>
					{:else}
						<Radio class="w-4 h-4 text-primary" />
					{/if}
					<h3 class="font-bold truncate">{output.name}</h3>
				</div>
				<p class="text-xs text-muted-foreground font-mono truncate mt-1">{output.rtmp_url ?? 'Sin RTMP URL'}</p>
			</div>
			<div class="flex items-center gap-2 shrink-0">
				<Badge variant="outline" class="border-muted-foreground/30 bg-muted/20 text-muted-foreground text-[10px]">
					⏩ Directo (0% CPU)
				</Badge>
				<Badge variant="outline" class={platformColors[output.platform] ?? platformColors.custom}>{output.platform}</Badge>
				<Badge variant="secondary" class={statusColors[output.status] ?? ''}>{statusLabels[output.status] ?? output.status}</Badge>
			</div>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
			<div class="rounded-md bg-muted/40 p-2">
				<p class="text-muted-foreground uppercase font-black text-[10px]">Canal automático</p>
				<p class="font-mono truncate">{output.channel_id || '—'}</p>
			</div>
			<div class="rounded-md bg-muted/40 p-2">
				<p class="text-muted-foreground uppercase font-black text-[10px]">Overlay</p>
				<p class="truncate font-medium">{overlayName}</p>
			</div>
			<div class="rounded-md {output.stream_key_configured ? 'bg-muted/40' : 'bg-amber-500/10 border border-amber-500/30'} p-2">
				<p class="text-muted-foreground uppercase font-black text-[10px] flex items-center gap-1"><KeyRound class="w-3 h-3 {output.stream_key_configured ? '' : 'text-amber-500'}" /> Key</p>
				<p class="{output.stream_key_configured ? '' : 'text-amber-500 font-bold'}">{output.stream_key_configured ? `••••${output.stream_key_preview}` : '⚠️ Sin Clave'}</p>
			</div>
		</div>

		<div class="flex flex-wrap items-center justify-between gap-3 pt-1">
			<div class="flex items-center gap-2">
				<Switch checked={output.enabled} size="sm" onCheckedChange={(enabled) => onToggle?.(output, enabled)} />
				<span class="text-xs font-medium {output.enabled ? 'text-foreground' : 'text-muted-foreground'}">
					{output.enabled ? 'Incluido en transmisión' : 'Desactivado'}
				</span>
			</div>
			<div class="flex flex-wrap gap-2 justify-end">
				{#if output.status === 'live'}
					<Button variant="destructive" size="sm" onclick={() => onStop?.(output)}><Square class="w-3.5 h-3.5 mr-1.5" /> Detener</Button>
				{:else}
					<Button size="sm" variant={output.enabled ? 'default' : 'outline'} onclick={() => onStart?.(output)} disabled={!output.enabled}>
						<Play class="w-3.5 h-3.5 mr-1.5" /> Iniciar aquí
					</Button>
				{/if}
				<Button variant="outline" size="sm" onclick={() => onEdit?.(output)}><Pencil class="w-3.5 h-3.5 mr-1.5" /> Editar</Button>
				<Button variant="ghost" size="sm" class="text-destructive hover:bg-destructive/10" onclick={() => onDelete?.(output)}><Trash2 class="w-3.5 h-3.5" /></Button>
			</div>
		</div>
	</CardContent>
</Card>
