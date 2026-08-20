import type { Component } from 'svelte';
import type { WidgetMeta } from './types';
import AlertWidget, { meta as alertMeta } from './components/AlertWidget.svelte';
import StatWidget, { meta as statMeta } from './components/StatWidget.svelte';
import ChatHighlightWidget, { meta as chatMeta } from './components/ChatHighlightWidget.svelte';
import BannerWidget, { meta as bannerMeta } from './components/BannerWidget.svelte';
import ProgressBarWidget, { meta as progressMeta } from './components/ProgressBarWidget.svelte';
import MediaWidget, { meta as mediaMeta } from './components/MediaWidget.svelte';
import CustomCodeWidget, { meta as customMeta } from './components/CustomCodeWidget.svelte';

export * from './types';

export type WidgetRegistryEntry = { component: Component<any>; meta: WidgetMeta };

// Single source of truth: each widget contributes its component + self-described
// `meta`. To add a widget type, create the .svelte (with its `meta` export) and
// add one line here — the toolbar, property editor and defaults are all derived.
export const WIDGET_REGISTRY: Record<string, WidgetRegistryEntry> = {
	alert:         { component: AlertWidget,        meta: alertMeta },
	stat:          { component: StatWidget,         meta: statMeta },
	chat_highlight:{ component: ChatHighlightWidget, meta: chatMeta },
	banner:        { component: BannerWidget,       meta: bannerMeta },
	progress_bar:  { component: ProgressBarWidget,  meta: progressMeta },
	media:         { component: MediaWidget,        meta: mediaMeta },
	custom_code:   { component: CustomCodeWidget,   meta: customMeta }
};

export {
	AlertWidget,
	StatWidget,
	ChatHighlightWidget,
	BannerWidget,
	ProgressBarWidget,
	MediaWidget,
	CustomCodeWidget
};

// Settings surface: manage the channel overlay-feed token (link for OBS).
export { default as OverlayFeedToken } from './components/OverlayFeedToken.svelte';

// Default configurations for new elements — derived from each widget's meta.
export const DEFAULT_ELEMENT_CONFIGS: Record<string, any> = Object.fromEntries(
	Object.entries(WIDGET_REGISTRY).map(([type, { meta }]) => [type, meta.defaults])
);

export function createOverlayElement(type: string): any {
	const id = Math.random().toString(36).slice(2, 9);
	const defaults = DEFAULT_ELEMENT_CONFIGS[type] || {};
	
	return {
		id,
		type,
		x: 760,
		y: 440,
		width: 400,
		height: 150,
		template: '',
		style: { 
			background: '#000000cc', 
			accent: '#9333ea', 
			border_radius: 16, 
			glow: false, 
			duration_ms: 5000, 
			animation: 'scale_in', 
			font_size: 24, 
			text_color: '#ffffff', 
			opacity: 100 
		},
		trigger: null,
		...defaults
	};
}

/**
 * Derives the `needs` summary saved alongside an overlay's config so the
 * backend can decide which SSE message types to send without inspecting
 * element types itself (see overlay_stream_plugin.py _resolve_needs).
 */
export function computeOverlayNeeds(elements: { type: string }[]): {
	stats: boolean;
	chat: boolean;
	alerts: boolean;
} {
	const needs = { stats: false, chat: false, alerts: false };
	for (const el of elements) {
		const widgetMeta = WIDGET_REGISTRY[el.type]?.meta;
		if (!widgetMeta?.needs) continue;
		if (widgetMeta.needs.includes('stats')) needs.stats = true;
		if (widgetMeta.needs.includes('chat')) needs.chat = true;
		if (widgetMeta.needs.includes('alerts')) needs.alerts = true;
	}
	return needs;
}

// Shared Preview Data
export const PREVIEW_VARS: Record<string, Record<string, string>> = {
	'channel.follow': { user_name: 'StreamFan123' },
	'channel.subscribe': { user_name: 'TopSub99', tier: '1000', message: '¡Los mejores!' },
	'channel.subscription.gift': { user_name: 'GiftKing', total: '5', tier: '1000' },
	'channel.cheer': { user_name: 'BitsMaster', bits: '1000' },
	'channel.raid': { user_name: 'FriendStream', viewers: '247' },
	'chat.message': { display_name: 'ChatUser', message: 'Hola! PogChamp' }
};

export const PREVIEW_STAT_VALUES: Record<string, string> = {
	'subscribers.active_total': '427',
	'stream.viewer_count': '1247',
	'followers.total': '8340',
	'bits.total': '15420',
	'stream.online': 'true'
};
