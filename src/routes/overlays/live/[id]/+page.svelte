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
	
	/**
	 * statValues stores data by SOURCE KEY (e.g., 'subscribers.active_total')
	 * NOT by element.id. This ensures all widgets sharing a source update together.
	 */
	let statValues     = $state<Record<string, string>>({});
	
	let loaded         = $state(false);
	let loadError      = $state<string | null>(null);
	let canvasWidth    = $state(1920);
	let canvasHeight   = $state(1080);
	let backgroundImage = $state<string | null>(null);
	let backgroundType  = $state<'image' | 'video' | null>(null);
	let currentConfigStr = '';

	// Diagnostic state for OBS
	let version        = $state(0);
	let lastSync       = $state<string>('--:--');
	let connected      = $state(false);

	/**
	 * Takes a new configuration and fresh live data, then applies them atomically.
	 * Compares the configuration string to avoid redrawing the DOM and breaking transitions
	 * unless the design elements actually changed.
	 */
	function applyAtomicUpdate(config: any, liveData?: Record<string, any>) {
		if (!config) return;
		
		const nextElements = config.elements ?? [];
		const nextStats: Record<string, string> = { ...statValues };

		if (liveData) {
			console.log('[SCO] Mapping fresh stats:', liveData);
			for (const k in liveData) {
				nextStats[k] = String(liveData[k]);
			}
		}

		const newConfigStr = JSON.stringify(config);
		const configChanged = newConfigStr !== currentConfigStr;

		flushSync(() => {
			if (configChanged) {
				elements        = nextElements;
				canvasWidth     = config.canvas_width    ?? 1920;
				canvasHeight    = config.canvas_height   ?? 1080;
				backgroundImage = config.background_image ?? null;
				backgroundType  = config.background_type  ?? null;
				currentConfigStr = newConfigStr;
				version++;
				initChatSlots();
			}
			
			statValues      = nextStats;
			loaded = true;
			lastSync = new Date().toLocaleTimeString();
		});
		
		console.log('[SCO] Atomic update applied. Changed:', configChanged, 'Elements:', elements.length, 'Stats cached:', Object.keys(statValues).length);
	}

	// ── Data Fetching ────────────────────────────────────────────────────────
	
	async function refreshEverything() {
		if (!overlayId) return;
		try {
			const res = await get<{ success: boolean; data: { config: any, stats: any }; error?: string }>(`/overlays/${overlayId}/config?_=${Date.now()}`);

			if (res.success) {
				applyAtomicUpdate(res.data.config, res.data.stats);
				if (isPreview) applyPreviewData();
			} else {
				loadError = res.error ?? 'Error al cargar';
			}
		} catch (e: any) {
			console.error('[SCO] Refresh error:', e);
			loadError = e.message ?? 'Error de red';
		}
		loaded = true;
	}

	function applyPreviewData() {
		const next: Record<string, string> = { ...statValues };
		// In preview, we populate common source keys with sample data
		for (const key in PREVIEW_STAT_VALUES) {
			next[key] = PREVIEW_STAT_VALUES[key];
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

	// ── Real-time Connections ─────────────────────────────────────────────────

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
			connected = true;

			// Case A: ATOMIC DESIGN + STATS PUSH
			if (raw.__type === 'config_updated') {
				if (String(raw.overlay_id) === String(id) && raw.config) {
					console.log('[SCO] Design update received via SSE');
					applyAtomicUpdate(raw.config, raw.stats);
				}
				return;
			}

			// Case B: STAT UPDATE (Subs, followers, bits, etc.)
			const next: Record<string, string> = { ...statValues };
			let changed = false;
			for (const key in raw) {
				if (key.startsWith('__')) continue; // Skip internal keys
				if (String(raw[key]) !== next[key]) {
					next[key] = String(raw[key]);
					changed = true;
				}
			}
			if (changed) {
				statValues = next;
				lastSync = new Date().toLocaleTimeString();
			}
		}, (isConnected) => {
			connected = isConnected;
		});
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────────

	onMount(() => {
		console.log('[SCO] Live overlay mounted. ID:', overlayId);
		refreshEverything();

		const stops = [
			isPreview ? () => {} : connectChat(),
			isPreview ? () => {} : connectAlerts(),
			isPreview ? () => {} : connectStats()
		];

		// Polling interval for OBS as safety net (every 60s instead of 10s to avoid database spam)
		const interval = setInterval(refreshEverything, 60000);

		return () => {
			stops.forEach(s => s());
			clearInterval(interval);
		};
	});

	function wrapperStyle(el: OverlayElement, index: number): string {
		return [
			'position: absolute',
			`left: ${(el.x / canvasWidth) * 100}%`,
			`top: ${(el.y / canvasHeight) * 100}%`,
			`width: ${(el.width / canvasWidth) * 100}%`,
			`height: ${(el.height / canvasHeight) * 100}%`,
			`z-index: ${10 + index}`
		].join(';');
	}
</script>

{#if loaded}
	<div class="canvas" style="--overlay-scale: 1;">
		{#key version}
			{#each elements as el, i (el.id)}
				{@const Widget = WIDGET_REGISTRY[el.type]}
				{#if Widget}
					<div style={wrapperStyle(el, i)}>
						<Widget 
							element={el} 
							statValues={el.data_source ? { [el.id]: statValues[el.data_source] ?? '0' } : {}}
							{activeAlerts} 
							{chatMessages} 
						/>
					</div>
				{/if}
			{/each}
		{/key}

		<!-- Micro Diagnostic Info for OBS -->
		{#if !isPreview}
			<div class="diagnostic-info" class:offline={!connected}>
				{connected ? '● LIVE' : '○ CONNECTING'} | {lastSync} | v{version}
			</div>
		{/if}
	</div>
{/if}

{#if loadError && !isPreview}
	<div style="position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.8); color: #f87171; font-family: sans-serif; font-size: 14px; text-align: center; padding: 20px;">
		{loadError}<br/>Intentando reconectar...
	</div>
{/if}

<style>
	:global(body) { background: transparent !important; margin: 0; overflow: hidden; }
	.canvas { position: fixed; inset: 0; width: 100vw; height: 100vh; }

	.diagnostic-info {
		position: fixed;
		bottom: 8px;
		right: 8px;
		font-family: monospace;
		font-size: 8px;
		color: rgba(255, 255, 255, 0.2);
		letter-spacing: 1px;
		pointer-events: none;
		user-select: none;
		z-index: 1000;
	}

	.diagnostic-info.offline {
		color: #ef4444;
		animation: pulse 1s infinite alternate;
	}

	@keyframes pulse {
		from { opacity: 0.3; }
		to { opacity: 1; }
	}
</style>
