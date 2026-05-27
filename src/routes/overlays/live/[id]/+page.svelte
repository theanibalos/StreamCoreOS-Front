<script lang="ts">
	import { page } from '$app/state';
	import { onMount, flushSync } from 'svelte';
	import { get, sse } from '$lib/core/api/client';
	import { 
		WIDGET_REGISTRY, 
		PREVIEW_VARS, 
		PREVIEW_STAT_VALUES 
	} from '$lib/features/overlays';
	import type { OverlayElement, ActiveAlert, ChatMessage } from '$lib/features/overlays';


	const overlayId = $derived(page.params.id);
	const isPreview = $derived(page.url.searchParams.has('preview'));

	// ── State ─────────────────────────────────────────────────────────────────
	let elements       = $state<OverlayElement[]>([]);
	let activeAlerts   = $state<ActiveAlert[]>([]);
	let chatMessages   = $state<Record<string, ChatMessage[]>>({});
	let statValues     = $state<Record<string, string>>({});
	let loaded         = $state(false);
	let loadError      = $state<string | null>(null);
	let canvasWidth    = $state(1920);
	let canvasHeight   = $state(1080);
	let backgroundImage = $state<string | null>(null);
	let backgroundType  = $state<'image' | 'video' | null>(null);

	function applyConfig(config: any) {
		if (!config) return;
		flushSync(() => {
			elements        = config.elements        ?? [];
			canvasWidth     = config.canvas_width    ?? 1920;
			canvasHeight    = config.canvas_height   ?? 1080;
			backgroundImage = config.background_image ?? null;
			backgroundType  = config.background_type  ?? null;
			initChatSlots();
			loaded = true;
		});
	}

	// ── Load overlay config ───────────────────────────────────────────────────
	async function loadConfig() {
		if (!overlayId) return;
		try {
			const res = await get<{ success: boolean; data: { config: any }; error?: string }>(
				`/overlays/${overlayId}/config?_=${Date.now()}`
			);
			if (res.success) {
				applyConfig(res.data.config);
				if (isPreview) {
					applyPreviewData();
				} else {
					await loadInitialStats();
				}
			} else {
				loadError = res.error ?? 'Error al cargar';
			}
		} catch (e: any) {
			loadError = e.message ?? 'Error de red';
		}
		loaded = true;
	}

	async function loadInitialStats() {
		try {
			const res = await get<{ success: boolean; data: Record<string, string | number | boolean> }>('/overlays/data');
			if (!res.success) return;
			const next: Record<string, string> = {};
			for (const el of elements) {
				if ((el.type === 'stat' || el.type === 'progress_bar') && el.data_source) {
					const val = res.data[el.data_source];
					if (val !== undefined) next[el.id] = String(val);
				}
			}
			statValues = next;
		} catch { /* ignore */ }
	}

	function applyPreviewData() {
		const next: Record<string, string> = {};
		for (const el of elements) {
			if ((el.type === 'stat' || el.type === 'progress_bar') && el.data_source) {
				next[el.id] = PREVIEW_STAT_VALUES[el.data_source] ?? '42';
			}
		}
		statValues = next;
		
		const now = Date.now();
		activeAlerts = elements
			.filter((el) => el.type === 'alert' && el.trigger?.event)
			.map((el) => ({
				elementId: el.id,
				vars: PREVIEW_VARS[Object.keys(PREVIEW_VARS).find(k => el.trigger!.event.startsWith(k)) || 'channel.subscribe'],
				expiresAt: now + 999999
			}));
			
		for (const el of elements) {
			if (el.type === 'chat_highlight') {
				chatMessages[el.id] = [
					{ display_name: 'Preview', message: 'Esto es una prueba del chat', timestamp: now, color: '#9147ff', fragments: [{ type: 'text', text: 'Esto es una prueba del chat' }] }
				];
			}
		}
	}

	function initChatSlots() {
		const slots: Record<string, ChatMessage[]> = { ...chatMessages };
		for (const el of elements) {
			if (el.type === 'chat_highlight' && !slots[el.id]) slots[el.id] = [];
		}
		chatMessages = slots;
	}

	function connectChat() {
		return sse('/chat/stream', (msg: any) => {
			for (const el of elements) {
				if (el.type !== 'chat_highlight') continue;
				const filterUser = el.trigger?.filter_user;
				if (filterUser && msg.display_name.toLowerCase() !== filterUser.toLowerCase()) continue;

				chatMessages[el.id] = [
					...(chatMessages[el.id] ?? []).slice(-5),
					{ ...msg, timestamp: Date.now() }
				];
			}
		});
	}

	function connectAlerts() {
		return sse('/dashboard/alerts', (msg: any) => {
			for (const el of elements) {
				if (el.type !== 'alert' || !el.trigger) continue;
				if (msg.type !== el.trigger.event && !(el.trigger.event === 'channel.subscribe' && msg.type === 'channel.subscription.message')) continue;

				const duration = el.style.duration_ms ?? 5000;
				activeAlerts = [...activeAlerts, { elementId: el.id, vars: msg.data, expiresAt: Date.now() + duration }];
				setTimeout(() => {
					activeAlerts = activeAlerts.filter(a => a.expiresAt > Date.now());
				}, duration + 500);
			}
		});
	}

	function connectStats() {
		const id = overlayId;
		return sse(`/overlays/stats?_=${Date.now()}`, (raw: any) => {
			if (raw.__type === 'config_updated') {
				if (Number(raw.overlay_id) === Number(id) && raw.config) {
					applyConfig(raw.config);
					// Re-populate stats after config change
					loadInitialStats();
				}
				return;
			}
			const next: Record<string, string> = { ...statValues };
			for (const el of elements) {
				if ((el.type !== 'stat' && el.type !== 'progress_bar') || !el.data_source) continue;
				const val = raw[el.data_source];
				if (val !== undefined) next[el.id] = String(val);
			}
			statValues = next;
		});
	}

	onMount(() => {
		loadConfig();
		const stops = [
			isPreview ? () => {} : connectChat(),
			isPreview ? () => {} : connectAlerts(),
			isPreview ? () => {} : connectStats()
		];
		const interval = setInterval(loadConfig, 5000);
		return () => {
			stops.forEach(s => s());
			clearInterval(interval);
		};
	});

	function wrapperStyle(el: OverlayElement): string {
		return [
			'position: absolute',
			`left: ${(el.x / canvasWidth) * 100}%`,
			`top: ${(el.y / canvasHeight) * 100}%`,
			`width: ${(el.width / canvasWidth) * 100}%`,
			`height: ${(el.height / canvasHeight) * 100}%`
		].join(';');
	}
</script>

{#if loaded}
	<div class="canvas" style={backgroundImage && backgroundType !== 'video' ? `background-image: url('${backgroundImage}'); background-size: cover; background-position: center;` : ''}>
		{#if backgroundImage && backgroundType === 'video'}
			<video src={backgroundImage} autoplay loop muted playsinline style="position: fixed; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -1;"></video>
		{/if}

		{#each elements as el (el.id)}
			{@const Widget = WIDGET_REGISTRY[el.type]}
			{#if Widget}
				<div style={wrapperStyle(el)}>
					<Widget element={el} {statValues} {activeAlerts} {chatMessages} />
				</div>
			{/if}
		{/each}
	</div>
{/if}

<style>
	:global(body) { background: transparent !important; margin: 0; overflow: hidden; }
	.canvas { position: fixed; inset: 0; width: 100vw; height: 100vh; }
</style>
