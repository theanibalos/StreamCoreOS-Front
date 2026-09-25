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
		{ type: 'event.redemption', label: 'Canje' },
		{ type: 'event.superchat', label: 'Super Chat' },
		{ type: 'event.supersticker', label: 'Super Sticker' },
		{ type: 'event.member', label: 'Miembro' },
		{ type: 'chat.message', label: 'Chat' }
	];

	let loading = $state(true);
	let regenerating = $state(false);
	let confirmingRegen = $state(false);
	let testing = $state<string | null>(null);
	let testRewardName = $state('');
	let error = $state<string | null>(null);
	let data = $state<TokenData | null>(null);
	let copied = $state<string | null>(null);
	let copyingManual = $state(false);
	let backendOrigin = $state('');

	const origin = typeof window !== 'undefined' ? window.location.origin : '';
	const feedUrl = $derived(data ? backendOrigin.replace(/\/$/, '') + data.feed_url : '');
	const manifestUrl = $derived(data ? backendOrigin.replace(/\/$/, '') + data.manifest_url : '');

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
			const body = type === 'event.redemption' && testRewardName.trim()
				? { type, reward_name: testRewardName.trim() }
				: { type };
			const res = await post<{ success: boolean; error?: string | null }>('/overlays/test', body);
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

	async function copyManual() {
		if (!data) return;
		copyingManual = true;
		try {
			const response = await get<{ success: boolean; data: unknown; error?: string }>('/overlays/manifest');
			if (!response.success || !response.data) throw new Error(response.error ?? 'No se pudo cargar el manifest');
			const endpoint = new URL(data.feed_url, backendOrigin);
			endpoint.searchParams.set('token', 'PEGA_AQUI_TU_TOKEN');
			const manual = `Construye una página HTML/CSS/JavaScript independiente para usarla como Browser Source de OBS. La página debe tener fondo transparente y conectarse con EventSource a ${endpoint.toString()}. Deja PEGA_AQUI_TU_TOKEN como marcador para que yo lo reemplace localmente; no uses cookies ni el token de sesión del panel. Cada mensaje SSE llega en event.data como JSON con {type, v, ts, data}. Procesa feed.snapshot para el estado inicial, maneja los eventos necesarios, ignora tipos desconocidos y deja que EventSource reconecte automáticamente. Para chat.message y feed.snapshot.recent_chat, dibuja data.badges como imágenes usando badge.url, y data.fragments en orden: texto como nodos de texto y emotes como imágenes usando fragment.url. Si una insignia no tiene URL, muestra su nombre como etiqueta; si faltan fragments, usa data.text. Nunca insertes texto de espectadores con innerHTML. Toda la presentación, animaciones y duración de alertas se resuelven en la página local. No dependas de rutas o componentes de StreamCoreOS para renderizar. Entrega el HTML completo y explica dónde pegar el token y cómo abrirlo en OBS.\n\nContrato actual del servidor:\n${JSON.stringify(response.data, null, 2)}`;
			await copy(manual, 'manual');
		} catch (e) {
			show(e instanceof Error ? e.message : String(e), 'error');
		} finally {
			copyingManual = false;
		}
	}

	onMount(() => {
		backendOrigin = import.meta.env.DEV
			? `${window.location.protocol}//${window.location.hostname}:8000`
			: origin;
		load();
	});
</script>

<Card class="w-full">
	<CardHeader class="border-b pb-4">
		<CardTitle class="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
			<Radio class="w-4 h-4" /> Overlay Feed
		</CardTitle>
		<CardDescription>
			Un solo feed con tu token para usar desde tus archivos locales. El overlay consume tus eventos (follows,
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
			<div class="flex flex-col gap-2">
				<Label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dirección del backend accesible desde OBS</Label>
				<Input bind:value={backendOrigin} placeholder="http://localhost:8000" class="font-mono text-xs" />
				<p class="text-xs text-muted-foreground">Si OBS está en otro equipo, usá la IP o dominio de StreamCoreOS en lugar de localhost.</p>
			</div>
			<!-- Feed URL -->
			<div class="flex flex-col gap-2">
				<Label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					URL del feed para tu código local
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
				<Button variant="secondary" size="sm" onclick={copyManual} disabled={copyingManual} class="self-start">
					<BookOpen class="w-4 h-4 mr-1.5" /> {copyingManual ? 'Preparando manual…' : 'Copiar manual para IA'}
				</Button>
				<p class="text-xs text-muted-foreground">
					El manual incluye el contrato actual y un token de ejemplo. Pegalo en tu IA para generar una página local; después reemplazá el token en el archivo resultante.
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
				<Input bind:value={testRewardName} placeholder="Nombre de recompensa para probar un canje (ej.: tlabaja)" class="max-w-md text-xs" />
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
