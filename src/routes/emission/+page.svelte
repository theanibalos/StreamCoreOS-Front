<script lang="ts">
	import { StreamOutputsPanel } from '$lib/features/emission';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { RadioTower, PlugZap } from '@lucide/svelte';
</script>

<div class="flex flex-col gap-6 w-full">
	<div>
		<h1 class="text-3xl font-bold tracking-tight flex items-center gap-2">
			<RadioTower class="w-7 h-7 text-primary" /> Emisión
		</h1>
		<p class="text-muted-foreground mt-1">
			Centro de restream: una señal desde OBS hacia Twitch, YouTube o destinos custom.
		</p>
	</div>

	<Card class="w-full border-dashed">
		<CardHeader class="border-b pb-4">
			<div class="flex items-center justify-between gap-3">
				<div>
					<CardTitle class="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
						<PlugZap class="w-5 h-5 text-primary" /> Ingest OBS
					</CardTitle>
					<CardDescription>Esta sección quedará conectada al RTMP engine en la siguiente fase.</CardDescription>
				</div>
				<Badge variant="secondary">próximamente</Badge>
			</div>
		</CardHeader>
		<CardContent class="p-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
			<div class="rounded-lg bg-muted/40 p-3">
				<p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">URL OBS esperada</p>
				<p class="font-mono mt-1">rtmp://localhost:1935/live</p>
			</div>
			<div class="rounded-lg bg-muted/40 p-3">
				<p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stream key local</p>
				<p class="font-mono mt-1">streamcore</p>
			</div>
		</CardContent>
	</Card>

	<StreamOutputsPanel />
</div>
