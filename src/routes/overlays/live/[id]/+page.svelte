<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
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
	let elements     = $state<OverlayElement[]>([]);
	let activeAlerts = $state<ActiveAlert[]>([]);
	let chatMessages = $state<Record<string, ChatMessage[]>>({});
	let statValues   = $state<Record<string, string>>({});
	let loaded       = $state(false);
	let loadError    = $state<string | null>(null);

	// ── Load overlay config ───────────────────────────────────────────────────
	async function loadConfig() {
		try {
			const res = await get<{ success: boolean; data: { config: { elements: OverlayElement[] } }; error?: string }>(
				`/overlays/${overlayId}/config`
			);
			if (res.success) {
				elements = res.data.config.elements ?? [];
				initChatSlots();

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

	// ── Initial stats fetch — populates widgets immediately before SSE connects ─
	// Also serves as fallback when /overlays/stats SSE is unavailable.
	async function loadInitialStats() {
		try {
			const res = await get<{ success: boolean; data: Record<string, string | number | boolean> }>(
				'/overlays/data'
			);
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

	// ── Preview mode: inject sample data for all elements ─────────────────────
	function applyPreviewData() {
		const next: Record<string, string> = {};

		for (const el of elements) {
			// Stats and progress bars get example values
			if ((el.type === 'stat' || el.type === 'progress_bar') && el.data_source) {
				next[el.id] = PREVIEW_STAT_VALUES[el.data_source] ?? '42';
			}
		}
		statValues = next;

		// Make all alerts visible with sample data
		const now = Date.now();
		activeAlerts = elements
			.filter((el) => el.type === 'alert' && el.trigger?.event)
			.map((el) => {
				const eventKey = Object.keys(PREVIEW_VARS).find((k) => el.trigger!.event.startsWith(k))
					?? 'channel.subscribe';
				return {
					elementId: el.id,
					vars: PREVIEW_VARS[eventKey] ?? { user_name: 'Preview' },
					expiresAt: now + 999_999_999,
				};
			});

		// Chat highlights get a sample message
		for (const el of elements) {
			if (el.type === 'chat_highlight') {
				chatMessages[el.id] = [
					{ display_name: 'StreamFan', message: '¡Qué buen stream!', timestamp: now, color: '#FF4500', badges: {}, fragments: [{ type: 'text', text: '¡Qué buen stream!' }] },
					{ display_name: 'ChatUser',  message: 'PogChamp PogChamp',  timestamp: now + 1, color: '#9147FF', badges: { moderator: '1' }, fragments: [{ type: 'text', text: 'PogChamp PogChamp' }] },
				];
			}
		}
	}

	function initChatSlots() {
		const slots: Record<string, ChatMessage[]> = {};
		for (const el of elements) {
			if (el.type === 'chat_highlight') slots[el.id] = [];
		}
		chatMessages = slots;
	}

	// ── SSE — alert events ────────────────────────────────────────────────────
	function connectAlerts() {
		return sse('/dashboard/alerts', (raw) => {
			const msg = raw as { type: string; data: Record<string, string> };
			handleAlertEvent(msg.type, msg.data ?? {});
		});
	}

	// ── SSE — chat messages ───────────────────────────────────────────────────
	function connectChat() {
		return sse('/chat/stream', (raw) => {
			const msg = raw as Record<string, any>;
			const display_name = msg.display_name ?? '';
			const message      = msg.message ?? '';
			const color        = msg.color ?? '';
			const badges       = msg.badges ?? {};
			const fragments    = msg.fragments ?? [];

			for (const el of elements) {
				if (el.type !== 'chat_highlight') continue;
				const filterUser = el.trigger?.filter_user;
				if (filterUser && display_name.toLowerCase() !== filterUser.toLowerCase()) continue;

				chatMessages[el.id] = [
					...(chatMessages[el.id] ?? []).slice(-4),
					{ display_name, message, timestamp: Date.now(), color, badges, fragments }
				];
			}
		});
	}

	// ── Trigger matching ──────────────────────────────────────────────────────
	// channel.subscription.message (resub) is caught by the channel.subscribe trigger
	// since builders don't expose resub as a separate option.
	function eventMatchesTrigger(eventType: string, triggerEvent: string): boolean {
		if (eventType === triggerEvent) return true;
		if (triggerEvent === 'channel.subscribe' && eventType === 'channel.subscription.message') return true;
		return false;
	}

	function handleAlertEvent(eventType: string, data: Record<string, string>) {
		const now = Date.now();
		for (const el of elements) {
			if (el.type !== 'alert' || !el.trigger) continue;

			if (!eventMatchesTrigger(eventType, el.trigger.event)) continue;

			const vars: Record<string, string> = {
				user_name: data.user_name ?? data.from_broadcaster_user_name ?? 'Alguien',
				message:   data.message ?? '',
				bits:      data.bits ?? '',
				viewers:   data.viewers ?? '',
				total:     data.total ?? '',
				tier:      data.tier ?? ''
			};

			const duration = el.style.duration_ms ?? 5000;
			activeAlerts = [
				...activeAlerts.filter((a) => a.elementId !== el.id),
				{ elementId: el.id, vars, expiresAt: now + duration }
			];
			setTimeout(
				() => { activeAlerts = activeAlerts.filter((a) => !(a.elementId === el.id && a.expiresAt <= Date.now())); },
				duration + 600
			);
		}
	}

	// ── SSE — real-time stat updates ─────────────────────────────────────────
	// Replaces the old 30-second poll. The server pushes immediately on:
	// sub/unsub events, follow events, bits events, and the 5-min stats collect.
	function connectStats() {
		const needsData = elements.filter(
			(el) => (el.type === 'stat' || el.type === 'progress_bar') && el.data_source
		);
		if (needsData.length === 0) return () => {};

		return sse('/overlays/stats', (raw) => {
			const live = raw as Record<string, number | boolean | string>;
			const next: Record<string, string> = { ...statValues };
			for (const el of needsData) {
				if (!el.data_source) continue;
				const val = live[el.data_source];
				if (val !== undefined) next[el.id] = String(val);
			}
			statValues = next;
		});
	}

	// ── Shared wrapper positions elements on the 1920×1080 canvas ────────────
	function wrapperStyle(el: OverlayElement): string {
		return [
			'position: absolute',
			`left: ${(el.x / 1920) * 100}%`,
			`top: ${(el.y / 1080) * 100}%`,
			`width: ${(el.width / 1920) * 100}%`,
			`height: ${(el.height / 1080) * 100}%`
		].join(';');
	}

	onMount(async () => {
		await loadConfig();
		const stopChat = connectChat();
		if (isPreview) return () => stopChat();
		const stopAlerts = connectAlerts();
		const stopStats  = connectStats();
		return () => { stopAlerts(); stopChat(); stopStats(); };
	});
</script>

{#if loaded}
	<div class="canvas">
		{#each elements as el (el.id)}
			{@const Widget = WIDGET_REGISTRY[el.type]}
			{#if Widget}
				<div style={wrapperStyle(el)}>
					<Widget
						element={el}
						{statValues}
						{activeAlerts}
						{chatMessages}
					/>
				</div>
			{/if}
		{/each}

		<!-- Preview mode badge -->
		{#if isPreview}
			<div class="preview-badge">
				PREVIEW — {elements.length} elemento{elements.length !== 1 ? 's' : ''}
				{#if loadError}<span class="preview-error"> · {loadError}</span>{/if}
			</div>
		{/if}

		<!-- Load error (non-preview) -->
		{#if loadError && !isPreview}
			<div class="load-error">{loadError}</div>
		{/if}
	</div>
{/if}

<style>
	:global(body) {
		background: transparent !important;
		margin: 0;
		overflow: hidden;
	}

	.canvas {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
	}

	.preview-badge {
		position: fixed;
		top: 12px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.75);
		color: #fff;
		font-family: system-ui, sans-serif;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 5px 14px;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		pointer-events: none;
		backdrop-filter: blur(4px);
	}

	.preview-error {
		color: #f87171;
	}

	.load-error {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: rgba(0,0,0,0.8);
		color: #f87171;
		font-family: system-ui, sans-serif;
		font-size: 13px;
		padding: 12px 20px;
		border-radius: 8px;
		pointer-events: none;
	}
</style>
