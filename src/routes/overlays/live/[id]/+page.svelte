<script lang="ts">
	import { page } from '$app/state';
	import { onMount, flushSync, untrack } from 'svelte';
	import { get } from '$lib/core/api/client';
	import { WIDGET_REGISTRY } from '$lib/features/overlays';
	import { createOverlayDataSource } from '$lib/features/overlays/dataSource.svelte';
	import type { OverlayElement } from '$lib/features/overlays';


	const overlayId = $derived(page.params.id);
	const isPreview = $derived(page.url.searchParams.has('preview'));

	// ── State ─────────────────────────────────────────────────────────────────
	let elements       = $state<OverlayElement[]>([]);

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

	// Stats (by SOURCE KEY), chat and alerts all flow through one shared
	// module so the SSE switch / preview generation logic isn't duplicated
	// between this page and the builder canvas. Mode and overlayId are fixed
	// for the lifetime of this page instance — read once intentionally.
	const ds = createOverlayDataSource(
		untrack(() => isPreview) ? 'preview' : 'live',
		() => elements,
		{
			overlayId: untrack(() => overlayId),
			onConfigUpdated: (config, stats) => {
				console.log('[SCO] Design update received via SSE');
				applyAtomicUpdate(config, stats);
			}
		}
	);

	/**
	 * Takes a new configuration and fresh live data, then applies them atomically.
	 * Compares the configuration string to avoid redrawing the DOM and breaking transitions
	 * unless the design elements actually changed.
	 */
	function applyAtomicUpdate(config: any, liveData?: Record<string, any>) {
		if (!config) return;

		const nextElements = config.elements ?? [];
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
				ds.syncChatSlots();
			}

			if (liveData) {
				console.log('[SCO] Mapping fresh stats:', liveData);
				ds.mergeServerStats(liveData);
			}
			loaded = true;
			lastSync = new Date().toLocaleTimeString();
		});

		console.log('[SCO] Atomic update applied. Changed:', configChanged, 'Elements:', elements.length);
	}

	// ── Data Fetching ────────────────────────────────────────────────────────

	async function refreshEverything() {
		if (!overlayId) return;
		try {
			const res = await get<{ success: boolean; data: { config: any, stats: any }; error?: string }>(`/overlays/${overlayId}/config?_=${Date.now()}`);

			if (res.success) {
				loadError = null;
				applyAtomicUpdate(res.data.config, res.data.stats);
			} else {
				loadError = res.error ?? 'Error al cargar';
			}
		} catch (e: any) {
			console.error('[SCO] Refresh error:', e);
			loadError = e.message ?? 'Error de red';
		}
		loaded = true;
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────────

	onMount(() => {
		console.log('[SCO] Live overlay mounted. ID:', overlayId);
		refreshEverything();

		const stop = ds.start();
		const interval = setInterval(refreshEverything, 60000);

		return () => {
			stop();
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
				{@const Widget = WIDGET_REGISTRY[el.type]?.component}
				{#if Widget}
					<div style={wrapperStyle(el, i)}>
						<Widget
							element={el}
							statValues={ds.statValues}
							activeAlerts={ds.activeAlerts}
							chatMessages={ds.chatMessages}
						/>
					</div>
				{/if}
			{/each}
		{/key}

		<!-- Micro Diagnostic Info for OBS -->
		{#if !isPreview}
			<div class="diagnostic-info" class:offline={!ds.connected}>
				{ds.connected ? '● LIVE' : '○ CONNECTING'} | {lastSync} | v{version}
			</div>
		{/if}
	</div>
{/if}

{#if loadError && !isPreview}
	<div class="error-indicator">⚠ {loadError}</div>
{/if}

<style>
	:global(html.overlay-page-html), :global(body.overlay-page-body) {
		background: transparent !important;
		background-color: transparent !important;
		color-scheme: normal !important;
		margin: 0;
		overflow: hidden;
	}
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

	.error-indicator {
		position: fixed;
		top: 8px;
		left: 8px;
		font-family: monospace;
		font-size: 9px;
		color: rgba(248, 113, 113, 0.6);
		letter-spacing: 0.5px;
		pointer-events: none;
		user-select: none;
		z-index: 1000;
		animation: pulse 1.5s infinite alternate;
	}
</style>
