<script lang="ts">
	import { onMount } from 'svelte';
	import { get, del } from '$lib/core/api/client';
	import { show } from '$lib/core/stores/toast.svelte';
	import { Trash2, Check, Film, RefreshCw } from '@lucide/svelte';

	type BgFile = {
		filename: string;
		url: string;
		type: 'image' | 'video';
		size: number;
	};

	let {
		currentImage = null,
		onSelect
	}: {
		currentImage?: string | null;
		onSelect: (url: string, type: 'image' | 'video') => void;
	} = $props();

	let files = $state<BgFile[]>([]);
	let loading = $state(true);
	let deleting = $state<string | null>(null);

	export async function load() {
		loading = true;
		try {
			const res = await get<{ success: boolean; data: BgFile[] }>('/overlays/backgrounds');
			if (res.success) files = res.data;
		} catch {
			// silently ignore
		} finally {
			loading = false;
		}
	}

	async function remove(file: BgFile, e: MouseEvent) {
		e.stopPropagation();
		deleting = file.filename;
		try {
			const res = await del<{ success: boolean; error?: string }>(`/overlays/backgrounds/${file.filename}`);
			if (!res.success) throw new Error(res.error);
			files = files.filter((f) => f.filename !== file.filename);
			show('Fondo eliminado', 'success');
		} catch (err: any) {
			show(`Error: ${err.message}`, 'error');
		} finally {
			deleting = null;
		}
	}

	function fmt(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
		return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	}

	onMount(load);
</script>

<div class="mt-4">
	<div class="flex items-center justify-between mb-2">
		<p class="text-xs font-medium text-muted-foreground uppercase tracking-tight">Fondos subidos</p>
		<button
			onclick={load}
			class="p-1 rounded hover:bg-muted/50 text-muted-foreground transition-colors"
			title="Actualizar"
		>
			<RefreshCw class="w-3 h-3 {loading ? 'animate-spin' : ''}" />
		</button>
	</div>

	{#if loading}
		<div class="grid grid-cols-3 gap-1.5">
			{#each Array(3) as _}
				<div class="rounded-md bg-muted/30 animate-pulse" style="aspect-ratio:16/9;"></div>
			{/each}
		</div>
	{:else if files.length === 0}
		<p class="text-[10px] text-muted-foreground/50 text-center py-4">No hay fondos subidos aún</p>
	{:else}
		<div class="grid grid-cols-3 gap-1.5">
			{#each files as file (file.filename)}
				{@const isActive = currentImage === file.url}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="relative rounded-md overflow-hidden border-2 transition-all group cursor-pointer {isActive ? 'border-primary' : 'border-transparent hover:border-muted-foreground/40'}"
					style="aspect-ratio: 16/9; background: #111;"
					onclick={() => onSelect(file.url, file.type)}
					onkeydown={(e) => e.key === 'Enter' && onSelect(file.url, file.type)}
					role="button"
					tabindex="0"
					title={`${file.filename} · ${fmt(file.size)}`}
				>
					{#if file.type === 'video'}
						<div class="absolute inset-0 flex items-center justify-center bg-black/60">
							<Film class="w-4 h-4 text-white/70" />
						</div>
						<video
							src={file.url}
							muted
							class="w-full h-full object-cover opacity-60"
							style="pointer-events:none;"
						></video>
					{:else}
						<img
							src={file.url}
							alt={file.filename}
							class="w-full h-full object-cover"
							style="pointer-events:none;"
						/>
					{/if}

					{#if isActive}
						<div class="absolute top-1 left-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
							<Check class="w-2.5 h-2.5 text-white" />
						</div>
					{/if}

					<button
						class="absolute top-1 right-1 w-5 h-5 rounded bg-black/70 hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
						onclick={(e) => remove(file, e)}
						disabled={deleting === file.filename}
						title="Eliminar"
					>
						<Trash2 class="w-2.5 h-2.5 text-white" />
					</button>

					{#if file.type === 'video'}
						<div class="absolute bottom-1 left-1 text-[8px] font-bold px-1 rounded bg-black/60 text-white/80 uppercase">
							video
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
