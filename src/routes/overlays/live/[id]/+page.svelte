<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { get, sse } from '$lib/core/api/client';
	import type { Component } from 'svelte';
	import type { OverlayElement, ActiveAlert, ChatMessage } from '$lib/features/overlays/types';

	// Widget registry — add new widget types here
	import AlertWidget         from '$lib/features/overlays/components/AlertWidget.svelte';
	import StatWidget          from '$lib/features/overlays/components/StatWidget.svelte';
	import ChatHighlightWidget from '$lib/features/overlays/components/ChatHighlightWidget.svelte';
	import BannerWidget        from '$lib/features/overlays/components/BannerWidget.svelte';
	import ProgressBarWidget   from '$lib/features/overlays/components/ProgressBarWidget.svelte';

	const REGISTRY: Record<string, Component<any>> = {
		alert:          AlertWidget,
		stat:           StatWidget,
		chat_highlight: ChatHighlightWidget,
		banner:         BannerWidget,
		progress_bar:   ProgressBarWidget,
	};

	// Sample data shown in preview mode for each trigger type
	const PREVIEW_VARS: Record<string, Record<string, string>> = {
		'channel.follow':            { user_name: 'StreamFan123' },
		'channel.subscribe':         { user_name: 'TopSub99', tier: '1000', message: '¡Los mejores!' },
		'channel.subscription.gift': { user_name: 'GiftKing', total: '5', tier: '1000' },
		'channel.cheer':             { user_name: 'BitsMaster', bits: '1000' },
		'channel.raid':              { user_name: 'FriendStream', viewers: '247' },
		'chat.message':              { display_name: 'ChatUser', message: 'Hola! PogChamp' },
	};

	const PREVIEW_STAT_VALUES: Record<string, string> = {
		'subscribers.active_total': '427',
		'bits.total':               '15420',
		'stream.online':            'true',
	};

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
					startStatPolling();
				}
			} else {
				loadError = res.error ?? 'Error al cargar';
			}
		} catch (e: any) {
			loadError = e.message ?? 'Error de red';
		}
		loaded = true;
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
					{ display_name: 'StreamFan', message: '¡Qué buen stream!', timestamp: now },
					{ display_name: 'ChatUser',  message: 'PogChamp PogChamp',  timestamp: now + 1 },
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
			const msg = raw as Record<string, string>;
			const display_name = msg.display_name ?? '';
			const message      = msg.message ?? '';

			for (const el of elements) {
				if (el.type !== 'chat_highlight') continue;
				const filterUser = el.trigger?.filter_user;
				if (filterUser && display_name.toLowerCase() !== filterUser.toLowerCase()) continue;

				chatMessages[el.id] = [
					...(chatMessages[el.id] ?? []).slice(-4),
					{ display_name, message, timestamp: Date.now() }
				];
			}
		});
	}

	// ── Trigger matching ──────────────────────────────────────────────────────
	function handleAlertEvent(eventType: string, data: Record<string, string>) {
		const now = Date.now();
		for (const el of elements) {
			if (el.type !== 'alert' || !el.trigger) continue;

			const triggerEvent = el.trigger.event;
			const matches =
				eventType === triggerEvent ||
				(triggerEvent !== 'chat.message' && eventType.startsWith(triggerEvent));
			if (!matches) continue;

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

	// ── Stat & progress_bar data polling ─────────────────────────────────────
	// Flow:
	//   element.data_source = "subscribers.active_total"
	//   GET /overlays/data → { "subscribers.active_total": 423 }
	//   statValues[element.id] = "423"
	//   Widget reads statValues[element.id]
	function startStatPolling() {
		const needsData = elements.filter(
			(el) => (el.type === 'stat' || el.type === 'progress_bar') && el.data_source
		);
		if (needsData.length === 0) return;

		async function fetchData() {
			try {
				const res = await get<{ success: boolean; data: Record<string, number | boolean | string> }>(
					'/overlays/data'
				);
				if (!res.success) return;
				const live = res.data;
				const next: Record<string, string> = { ...statValues };
				for (const el of needsData) {
					if (!el.data_source) continue;
					const val = live[el.data_source];
					if (val !== undefined) next[el.id] = String(val);
				}
				statValues = next;
			} catch {
				// OBS overlay degrades silently
			}
		}

		fetchData();
		setInterval(fetchData, 30_000);
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

	onMount(() => {
		loadConfig().then(() => {
			// In preview mode: connect chat SSE for live messages, but skip alerts
			// (fake sub/follow/raid events would be noise during preview)
			const stopChat = connectChat();
			if (isPreview) return () => stopChat();
			const stopAlerts = connectAlerts();
			return () => { stopAlerts(); stopChat(); };
		});
	});
</script>

{#if loaded}
	<div class="canvas">
		{#each elements as el (el.id)}
			{@const Widget = REGISTRY[el.type]}
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
