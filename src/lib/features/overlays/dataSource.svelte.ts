import { sse } from '$lib/core/api/client';
import { WIDGET_REGISTRY, PREVIEW_VARS, PREVIEW_STAT_VALUES } from './index';
import type { OverlayElement, ActiveAlert, ChatMessage } from './types';

/**
 * Unified overlay data provider consumed by both overlays/builder/[id]
 * (mode 'preview', always) and overlays/live/[id] (mode 'live', or mode
 * 'preview' when the ?preview query flag is set).
 *
 * Which elements receive chat / which alerts fire for an `alert` element /
 * which elements get the `__broadcast__` alert entry — all of this is
 * derived from WIDGET_REGISTRY[el.type].meta.needs, never from
 * `el.type === '...'` checks. Adding a new widget that needs, say, chat
 * only requires setting `needs: ['chat']` in its meta.
 */

const BROADCAST_ELEMENT_ID = '__broadcast__';

// Sample chat feed shown in preview mode (builder canvas + live ?preview).
const PREVIEW_CHAT_SAMPLE: ChatMessage[] = [
	{
		platform: 'twitch',
		display_name: 'TwitchFan',
		message: '¡Qué buen stream! PogChamp',
		timestamp: 1,
		color: '#9146FF',
		user: {
			id: 'twitch:12345',
			platform_id: '12345',
			display_name: 'TwitchFan',
			avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=TwitchFan'
		},
		badges: [{ set: 'subscriber', version: '6' }],
		fragments: [
			{ type: 'text', text: '¡Qué buen stream! ' },
			{ type: 'emote', text: 'PogChamp', emote_id: '88', emote_animated: false }
		],
		roles: { subscriber: true }
	},
	{
		platform: 'youtube',
		display_name: 'AlexYT',
		message: 'Saludos desde YouTube! 🔥',
		timestamp: 2,
		color: '#FF0000',
		user: {
			id: 'youtube:UC12345',
			platform_id: 'UC12345',
			display_name: 'AlexYT',
			avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AlexYT'
		},
		badges: [{ set: 'member', version: '1' }],
		fragments: [{ type: 'text', text: 'Saludos desde YouTube! 🔥' }],
		roles: { subscriber: true }
	},
	{
		platform: 'twitch',
		display_name: 'ModUser',
		message: 'Bienvenidos a todos al directo',
		timestamp: 3,
		color: '#00C8AF',
		user: {
			id: 'twitch:99999',
			platform_id: '99999',
			display_name: 'ModUser',
			avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ModUser'
		},
		badges: [{ set: 'moderator', version: '1' }],
		fragments: [{ type: 'text', text: 'Bienvenidos a todos al directo' }],
		roles: { moderator: true }
	}
];

export function normalizeChatMessage(raw: any): ChatMessage {
	if (!raw) {
		return {
			platform: 'twitch',
			display_name: 'Usuario',
			message: '',
			timestamp: Date.now(),
			user: {
				id: 'twitch:0',
				display_name: 'Usuario',
				avatar_url: null
			}
		};
	}

	const platform = raw.platform || (raw.user?.id?.startsWith('youtube') ? 'youtube' : 'twitch');
	const userObj = raw.user || {};

	const displayName =
		raw.display_name ||
		userObj.display_name ||
		raw.chatter_user_name ||
		raw.user_name ||
		raw.username ||
		userObj.name ||
		userObj.login ||
		raw.chatter_user_login ||
		'Espectador';

	const avatarUrl =
		raw.avatar_url ||
		userObj.avatar_url ||
		userObj.profileImageUrl ||
		userObj.profile_image_url ||
		raw.profileImageUrl ||
		null;

	const messageText = raw.message || raw.text || raw.content || '';
	const color = raw.color || (platform === 'youtube' ? '#ff4e45' : '#a970ff');

	return {
		platform,
		display_name: displayName,
		message: messageText,
		timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : (raw.timestamp ? new Date(raw.timestamp).getTime() : Date.now()),
		color,
		badges: raw.badges || [],
		fragments: raw.fragments || [{ type: 'text', text: messageText }],
		user: {
			id: userObj.id || raw.user_id || raw.chatter_user_id || `${platform}:${displayName}`,
			platform_id: userObj.platform_id || raw.chatter_user_id || '',
			display_name: displayName,
			avatar_url: avatarUrl,
			login: userObj.login || raw.chatter_user_login || displayName.toLowerCase()
		},
		roles: raw.roles || {
			broadcaster: false,
			moderator: false,
			subscriber: false
		},
		raw
	};
}

function widgetNeeds(el: OverlayElement, need: 'stats' | 'chat' | 'alerts'): boolean {
	return WIDGET_REGISTRY[el.type]?.meta.needs?.includes(need) ?? false;
}

/** Picks canned preview vars for an event name (exact match or prefix, e.g. 'channel.subscribe.foo'). */
function matchPreviewVars(eventName: string): Record<string, string> {
	const key =
		Object.keys(PREVIEW_VARS).find((k) => eventName === k || eventName.startsWith(k + '.')) ??
		'channel.subscribe';
	return PREVIEW_VARS[key] ?? { user_name: 'Preview' };
}

export type OverlayDataSourceMode = 'live' | 'preview';

export type OverlayDataSourceOpts = {
	/** Live mode: overlay id used to open the SSE stream (`/overlays/stream/{id}`). */
	overlayId?: string;
	/** Live mode: called on every SSE 'config_updated' message — the page owns config/canvas state. */
	onConfigUpdated?: (config: any, stats?: Record<string, any>) => void;
	/** Preview mode: optional real stat snapshot preferred over the canned PREVIEW_STAT_VALUES. */
	getLiveOverrides?: () => Record<string, string>;
};

export function createOverlayDataSource(
	mode: OverlayDataSourceMode,
	getElements: () => OverlayElement[],
	opts: OverlayDataSourceOpts = {}
) {
	// ── Live-mode backing store (mutated by SSE messages) ──────────────────
	let liveStats = $state<Record<string, string>>({});
	let liveAlerts = $state<ActiveAlert[]>([]);
	let liveChat = $state<Record<string, ChatMessage[]>>({});
	let connected = $state(false);

	function ingestStats(data: Record<string, unknown>) {
		const next = { ...liveStats };
		let changed = false;
		for (const key in data) {
			const v = String(data[key]);
			if (next[key] !== v) {
				next[key] = v;
				changed = true;
			}
		}
		if (changed) liveStats = next;
	}

	function ingestChat(rawMsg: any) {
		const msg = normalizeChatMessage(rawMsg);
		const elements = getElements();
		for (const el of elements) {
			if (!widgetNeeds(el, 'chat')) continue;
			const filterUser = el.trigger?.filter_user;
			if (filterUser && msg.display_name?.toLowerCase() !== filterUser.toLowerCase()) continue;
			const filterPlatform = (el.config?.platform as string) || (el.trigger as any)?.platform || 'all';
			if (filterPlatform !== 'all' && msg.platform && msg.platform.toLowerCase() !== filterPlatform.toLowerCase()) {
				continue;
			}
			liveChat[el.id] = [...(liveChat[el.id] ?? []).slice(-20), msg];
		}
	}

	function ingestAlert(eventType: string, eventData: Record<string, string>) {
		const elements = getElements();
		const next: ActiveAlert[] = [];
		let maxDuration = 0;

		for (const el of elements) {
			if (el.type !== 'alert' || !widgetNeeds(el, 'alerts') || !el.trigger) continue;
			if (
				eventType !== el.trigger.event &&
				!(el.trigger.event === 'channel.subscribe' && eventType === 'channel.subscription.message')
			)
				continue;
			const duration = el.style.duration_ms ?? 5000;
			maxDuration = Math.max(maxDuration, duration);
			next.push({ elementId: el.id, type: eventType, vars: eventData, expiresAt: Date.now() + duration });
		}

		// Widgets that need alerts but aren't `alert` elements themselves (e.g. custom_code)
		// receive every raw event via one shared broadcast entry.
		if (elements.some((el) => el.type !== 'alert' && widgetNeeds(el, 'alerts'))) {
			const duration = 8000;
			maxDuration = Math.max(maxDuration, duration);
			next.push({ elementId: BROADCAST_ELEMENT_ID, type: eventType, vars: eventData, expiresAt: Date.now() + duration });
		}

		if (next.length) {
			liveAlerts = [...liveAlerts, ...next];
			setTimeout(() => {
				liveAlerts = liveAlerts.filter((a) => a.expiresAt > Date.now());
			}, maxDuration + 500);
		}
	}

	/** Ensures every element that needs chat has a (possibly empty) slot — call after config changes. */
	function syncChatSlots() {
		const elements = getElements();
		const slots: Record<string, ChatMessage[]> = { ...liveChat };
		for (const el of elements) {
			if (widgetNeeds(el, 'chat') && !slots[el.id]) slots[el.id] = [];
		}
		liveChat = slots;
	}

	/** Merges a server-provided stats snapshot (e.g. from the initial config fetch) into the live pool. */
	function mergeServerStats(stats?: Record<string, unknown>) {
		if (!stats) return;
		const next = { ...liveStats };
		for (const k in stats) next[k] = String(stats[k]);
		liveStats = next;
	}

	let stopSse: (() => void) | null = null;

	function start(): () => void {
		if (mode !== 'live' || !opts.overlayId) return () => {};
		stopSse = sse(
			`/overlays/stream/${opts.overlayId}`,
			(raw: any) => {
				switch (raw.type) {
					case 'stats':
						ingestStats(raw.data);
						break;
					case 'chat':
						ingestChat(raw.data);
						break;
					case 'alert':
						ingestAlert(raw.data.type, raw.data.data);
						break;
					case 'config_updated':
						opts.onConfigUpdated?.(raw.data.config, raw.data.stats);
						break;
				}
			},
			(isConnected) => {
				connected = isConnected;
			}
		);
		return stop;
	}

	function stop() {
		stopSse?.();
		stopSse = null;
	}

	// ── Preview-mode derived data ───────────────────────────────────────────
	const previewStats = $derived.by<Record<string, string>>(() => {
		if (mode !== 'preview') return {};
		return { ...PREVIEW_STAT_VALUES, ...(opts.getLiveOverrides?.() ?? {}) };
	});

	const previewAlerts = $derived.by<ActiveAlert[]>(() => {
		if (mode !== 'preview') return [];
		const elements = getElements();
		const now = Date.now();
		const out: ActiveAlert[] = elements
			.filter((el) => el.type === 'alert' && widgetNeeds(el, 'alerts') && el.trigger?.event)
			.map((el) => ({
				elementId: el.id,
				type: el.trigger!.event,
				vars: matchPreviewVars(el.trigger!.event),
				expiresAt: now + 999999
			}));

		if (elements.some((el) => el.type !== 'alert' && widgetNeeds(el, 'alerts'))) {
			out.push({
				elementId: BROADCAST_ELEMENT_ID,
				type: 'channel.subscribe',
				vars: matchPreviewVars('channel.subscribe'),
				expiresAt: now + 999999
			});
		}
		return out;
	});

	const previewChat = $derived.by<Record<string, ChatMessage[]>>(() => {
		if (mode !== 'preview') return {};
		const elements = getElements();
		const out: Record<string, ChatMessage[]> = {};
		for (const el of elements) {
			if (widgetNeeds(el, 'chat')) {
				const filterPlatform = (el.config?.platform as string) || (el.trigger as any)?.platform || 'all';
				if (filterPlatform === 'all') {
					out[el.id] = PREVIEW_CHAT_SAMPLE;
				} else {
					out[el.id] = PREVIEW_CHAT_SAMPLE.filter((m) => m.platform === filterPlatform);
				}
			}
		}
		return out;
	});

	const statValues = $derived(mode === 'preview' ? previewStats : liveStats);
	const activeAlerts = $derived(mode === 'preview' ? previewAlerts : liveAlerts);
	const chatMessages = $derived(mode === 'preview' ? previewChat : liveChat);

	return {
		get statValues() {
			return statValues;
		},
		get activeAlerts() {
			return activeAlerts;
		},
		get chatMessages() {
			return chatMessages;
		},
		get connected() {
			return mode === 'preview' ? true : connected;
		},
		start,
		stop,
		syncChatSlots,
		mergeServerStats
	};
}
