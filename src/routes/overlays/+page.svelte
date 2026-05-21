<script lang="ts">
	import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Copy, ExternalLink, Info, Plus, Pencil, Trash2, Layers, Loader2 } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { show } from '$lib/core/stores/toast.svelte';
	import { get, post, del } from '$lib/core/api/client';

	let baseUrl = $state('http://localhost:5173');

	// ── Built-in overlays ─────────────────────────────────────────────────────
	// ── Custom overlays ───────────────────────────────────────────────────────
	type OverlayItem = { id: number; name: string; created_at?: string };

	let customOverlays = $state<OverlayItem[]>([]);
	let loadingCustom = $state(true);
	let creating = $state(false);
	let newName = $state('');
	let showCreateForm = $state(false);

	async function loadCustom() {
		loadingCustom = true;
		try {
			const res = await get<{ success: boolean; data: OverlayItem[] }>('/overlays');
			if (res.success) customOverlays = res.data;
		} catch {
			// silently ignore — user may not be logged in on overlay page
		} finally {
			loadingCustom = false;
		}
	}

	async function createOverlay() {
		if (!newName.trim()) return;
		creating = true;
		try {
			const res = await post<{ success: boolean; data: { id: number } }>('/overlays', { name: newName.trim() });
			if (res.success) {
				window.location.href = `/overlays/builder/${res.data.id}`;
			}
		} catch (e: any) {
			show(e.message ?? 'Error al crear overlay', 'error');
		} finally {
			creating = false;
		}
	}

	async function deleteOverlay(id: number, name: string) {
		if (!confirm(`¿Eliminar "${name}"?`)) return;
		try {
			await del(`/overlays/${id}`);
			customOverlays = customOverlays.filter((o) => o.id !== id);
			show('Overlay eliminado', 'success');
		} catch {
			show('Error al eliminar', 'error');
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		show('URL de Overlay copiada al portapapeles', 'success');
	}

	onMount(() => {
		baseUrl = window.location.origin;
		loadCustom();
	});
</script>

<div class="flex flex-col gap-8 w-full">
	<!-- Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Gestión de Overlays</h1>
			<p class="text-muted-foreground mt-1">Fuentes de navegador optimizadas para OBS Studio (Fondo transparente).</p>
		</div>
		<div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-center gap-3 text-blue-600 max-w-sm">
			<Info class="w-5 h-5 flex-shrink-0" />
			<p class="text-[11px] leading-tight font-medium">Tip: En OBS, activa "Controlar audio vía OBS" en las propiedades de la fuente de navegador.</p>
		</div>
	</div>

	<!-- Custom overlays -->
	<div>
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-lg font-semibold">Overlays personalizados</h2>
			<Button size="sm" onclick={() => (showCreateForm = !showCreateForm)}>
				<Plus class="w-4 h-4 mr-1.5" /> Nuevo overlay
			</Button>
		</div>

		{#if showCreateForm}
			<div class="flex gap-2 mb-4 items-center">
				<Input
					class="max-w-xs"
					placeholder="Nombre del overlay"
					bind:value={newName}
					onkeydown={(e) => e.key === 'Enter' && createOverlay()}
					autofocus
				/>
				<Button onclick={createOverlay} disabled={creating || !newName.trim()}>
					{#if creating}
						<Loader2 class="w-4 h-4 mr-1.5 animate-spin" />
					{:else}
						<Layers class="w-4 h-4 mr-1.5" />
					{/if}
					Crear y abrir builder
				</Button>
				<Button variant="ghost" onclick={() => { showCreateForm = false; newName = ''; }}>Cancelar</Button>
			</div>
		{/if}

		{#if loadingCustom}
			<div class="flex items-center gap-2 text-muted-foreground text-sm py-4">
				<Loader2 class="w-4 h-4 animate-spin" /> Cargando overlays…
			</div>
		{:else if customOverlays.length === 0}
			<div class="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
				<Layers class="w-10 h-10 mx-auto mb-3 opacity-30" />
				<p class="text-sm font-medium">No tenés overlays personalizados todavía</p>
				<p class="text-xs mt-1">Creá uno y usá el builder asistido por IA para diseñarlo</p>
			</div>
		{:else}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each customOverlays as overlay}
					{@const liveUrl = baseUrl + '/overlays/live/' + overlay.id}
					<Card class="flex flex-col border-2 border-primary/10 hover:border-primary/30 transition-colors">
						<CardHeader class="pb-2">
							<div class="flex items-start justify-between gap-2">
								<div class="p-2 bg-primary/10 rounded-lg shrink-0">
									<Layers class="w-5 h-5 text-primary" />
								</div>
								<div class="flex gap-1 ml-auto">
									<Button variant="ghost" size="sm" href={`/overlays/builder/${overlay.id}`} title="Editar en builder">
										<Pencil class="w-3.5 h-3.5" />
									</Button>
									<Button variant="ghost" size="sm" onclick={() => deleteOverlay(overlay.id, overlay.name)} title="Eliminar">
										<Trash2 class="w-3.5 h-3.5 text-destructive" />
									</Button>
								</div>
							</div>
							<CardTitle class="text-base mt-2">{overlay.name}</CardTitle>
						</CardHeader>
						<CardContent class="flex-1 pt-0">
							<div class="bg-muted/50 p-2 rounded-md border font-mono text-[10px] break-all select-all">{liveUrl}</div>
						</CardContent>
						<CardFooter class="grid grid-cols-2 gap-2 pt-2">
							<Button variant="outline" size="sm" onclick={() => copyToClipboard(liveUrl)}>
								<Copy class="w-3.5 h-3.5 mr-1.5" /> URL OBS
							</Button>
							<Button variant="outline" size="sm" href={`/overlays/builder/${overlay.id}`}>
								<Pencil class="w-3.5 h-3.5 mr-1.5" /> Editar
							</Button>
						</CardFooter>
					</Card>
				{/each}
			</div>
		{/if}
	</div>
</div>
