<script lang="ts">
	import { onMount } from 'svelte';
	import { get, post } from '$lib/core/api/client';
	import { show } from '$lib/core/stores/toast.svelte';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Radio, Copy, Check, RefreshCw, BookOpen, Play } from '@lucide/svelte';

	type TokenData = { token: string; feed_url: string; manifest_url: string };
	type TokenResponse = { success: boolean; data?: TokenData | null; error?: string | null };

	const TEST_EVENTS: { type: string; label: string }[] = [
		{ type: 'event.follow', label: 'Follow' },
		{ type: 'event.subscription', label: 'Sub' },
		{ type: 'event.raid', label: 'Raid' },
		{ type: 'event.cheer', label: 'Cheer' },
		{ type: 'chat.message', label: 'Chat' }
	];

	let loading = $state(true);
	let regenerating = $state(false);
	let confirmingRegen = $state(false);
	let testing = $state<string | null>(null);
	let error = $state<string | null>(null);
	let data = $state<TokenData | null>(null);
	let copied = $state<string | null>(null);

	const origin = typeof window !== 'undefined' ? window.location.origin : '';
	const feedUrl = $derived(data ? origin + data.feed_url : '');
	const manifestUrl = $derived(data ? origin + data.manifest_url : '');

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await get<TokenResponse>('/overlays/token');
			if (res.success && res.data) {
				data = res.data;
			} else {
				error = res.error ?? 'No se pudo cargar el token';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	async function regenerate() {
		if (!confirmingRegen) {
			confirmingRegen = true;
			return;
		}
		confirmingRegen = false;
		regenerating = true;
		try {
			const res = await post<TokenResponse>('/overlays/token', {});
			if (res.success && res.data) {
				data = res.data;
				show('Token regenerado — actualizá el link en cada overlay', 'success');
			} else {
				show(res.error ?? 'No se pudo regenerar', 'error');
			}
		} catch (e) {
			show(e instanceof Error ? e.message : String(e), 'error');
		} finally {
			regenerating = false;
		}
	}

	async function sendTest(type: string) {
		testing = type;
		try {
			const res = await post<{ success: boolean; error?: string | null }>('/overlays/test', { type });
			if (res.success) {
				show('Evento de prueba enviado al feed', 'success');
			} else {
				show(res.error ?? 'No se pudo enviar la prueba', 'error');
			}
		} catch (e) {
			show(e instanceof Error ? e.message : String(e), 'error');
		} finally {
			testing = null;
		}
	}

	async function copy(value: string, field: string) {
		try {
			await navigator.clipboard.writeText(value);
			copied = field;
			show('Copiado', 'success');
			setTimeout(() => {
				if (copied === field) copied = null;
			}, 2000);
		} catch {
			show('No se pudo copiar', 'error');
		}
	}

	onMount(load);
</script>

<Card class="w-full">
	<CardHeader class="border-b pb-4">
		<CardTitle class="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
			<Radio class="w-4 h-4" /> Overlay Feed
		</CardTitle>
		<CardDescription>
			Un solo link con tu token que pegás en OBS. El overlay consume tus eventos (follows,
			subs, chat…) en vivo. Podés construirlo a mano o pedírselo a una IA con el manifest.
		</CardDescription>
	</CardHeader>
	<CardContent class="pt-6 flex flex-col gap-5">
		{#if loading}
			<p class="text-sm text-muted-foreground">Cargando…</p>
		{:else if error}
			<div class="flex items-center gap-3">
				<p class="text-sm text-destructive">{error}</p>
				<Button variant="outline" size="sm" onclick={load}>Reintentar</Button>
			</div>
		{:else if data}
			<!-- Feed URL -->
			<div class="flex flex-col gap-2">
				<Label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Link para OBS (browser source)
				</Label>
				<div class="flex gap-2">
					<Input value={feedUrl} readonly class="font-mono text-xs" />
					<Button variant="outline" size="icon" onclick={() => copy(feedUrl, 'feed')} title="Copiar link">
						{#if copied === 'feed'}
							<Check class="w-4 h-4 text-green-500" />
						{:else}
							<Copy class="w-4 h-4" />
						{/if}
					</Button>
				</div>
			</div>

			<!-- Manifest URL -->
			<div class="flex flex-col gap-2">
				<Label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Manifest (el "manual" para la IA)
				</Label>
				<div class="flex gap-2">
					<Input value={manifestUrl} readonly class="font-mono text-xs" />
					<Button variant="outline" size="icon" onclick={() => copy(manifestUrl, 'manifest')} title="Copiar manifest">
						{#if copied === 'manifest'}
							<Check class="w-4 h-4 text-green-500" />
						{:else}
							<BookOpen class="w-4 h-4" />
						{/if}
					</Button>
				</div>
				<p class="text-xs text-muted-foreground">
					Pegale este link a ChatGPT/Claude y pedile un overlay: describe todos los eventos y campos disponibles.
				</p>
			</div>

			<!-- Test events -->
			<div class="flex flex-col gap-2 border-t mt-1 pt-4">
				<Label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Probar (dispara un evento falso al feed)
				</Label>
				<div class="flex flex-wrap gap-2">
					{#each TEST_EVENTS as ev (ev.type)}
						<Button
							variant="secondary"
							size="sm"
							disabled={testing !== null}
							onclick={() => sendTest(ev.type)}
						>
							<Play class="w-3.5 h-3.5 {testing === ev.type ? 'animate-pulse' : ''}" />
							{ev.label}
						</Button>
					{/each}
				</div>
				<p class="text-xs text-muted-foreground">
					Con tu overlay abierto en OBS (o en una pestaña), tocá un botón y vas a verlo reaccionar en vivo.
				</p>
			</div>

			<!-- Regenerate -->
			<div class="flex items-center gap-3 border-t mt-1 pt-4">
				<Button
					variant={confirmingRegen ? 'destructive' : 'outline'}
					size="sm"
					disabled={regenerating}
					onclick={regenerate}
				>
					<RefreshCw class="w-4 h-4 {regenerating ? 'animate-spin' : ''}" />
					{confirmingRegen ? '¿Seguro? Rompe todos los overlays' : 'Regenerar token'}
				</Button>
				{#if confirmingRegen}
					<Button variant="ghost" size="sm" onclick={() => (confirmingRegen = false)}>Cancelar</Button>
				{/if}
				<p class="text-xs text-muted-foreground">
					Invalida el link anterior al instante. Habrá que re-pegar el nuevo en cada overlay.
				</p>
			</div>
		{/if}
	</CardContent>
</Card>
