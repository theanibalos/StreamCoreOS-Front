import type { Component } from 'svelte';
import AlertWidget from './components/AlertWidget.svelte';
import StatWidget from './components/StatWidget.svelte';
import ChatHighlightWidget from './components/ChatHighlightWidget.svelte';
import BannerWidget from './components/BannerWidget.svelte';
import ProgressBarWidget from './components/ProgressBarWidget.svelte';
import MediaWidget from './components/MediaWidget.svelte';
import CustomCodeWidget from './components/CustomCodeWidget.svelte';

export * from './types';

// Central Registry to avoid duplication in builder and live routes
export const WIDGET_REGISTRY: Record<string, Component<any>> = {
	alert: AlertWidget as any,
	stat: StatWidget as any,
	chat_highlight: ChatHighlightWidget as any,
	banner: BannerWidget as any,
	progress_bar: ProgressBarWidget as any,
	media: MediaWidget as any,
	custom_code: CustomCodeWidget as any
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

// Default configurations for new elements
export const DEFAULT_ELEMENT_CONFIGS: Record<string, any> = {
	alert: {
		width: 420, height: 160,
		trigger: { event: 'channel.subscribe', filter_user: null },
		template: '¡{user_name} se suscribió! 🎉',
		style: { background: '#000000cc', accent: '#9333ea', border_radius: 20, glow: true, duration_ms: 5000, animation: 'scale_in', font_size: 28, text_color: '#ffffff', opacity: 100 }
	},
	stat: {
		width: 220, height: 60,
		data_source: 'subscribers.active_total',
		template: '⭐ {value} subs',
		style: { background: '#000000aa', accent: '#9333ea', border_radius: 12, glow: false, duration_ms: 0, animation: 'fade_in', font_size: 22, text_color: '#ffffff', opacity: 100 }
	},
	chat_highlight: {
		width: 380, height: 500,
		trigger: { event: 'chat.message', filter_user: null },
		template: '{display_name}: {message}',
		style: { background: '#000000bb', accent: '#9333ea', border_radius: 14, glow: false, duration_ms: 0, animation: 'fade_in', font_size: 18, text_color: '#ffffff', opacity: 100 }
	},
	banner: {
		width: 500, height: 70,
		template: 'Mi Stream',
		style: { background: '#000000cc', accent: '#9333ea', border_radius: 10, glow: false, duration_ms: 0, animation: 'fade_in', font_size: 24, text_color: '#ffffff', opacity: 100 }
	},
	progress_bar: {
		width: 700, height: 90,
		data_source: 'subscribers.active_total',
		config: { label: 'Meta de subs', target: 500 },
		style: { background: '#18181bcc', accent: '#9147ff', border_radius: 14, glow: true, duration_ms: 0, animation: 'fade_in', font_size: 20, text_color: '#ffffff', opacity: 100 }
	},
	media: {
		width: 300, height: 300,
		config: { url: '' },
		style: { background: 'transparent', accent: '#9147ff', border_radius: 0, glow: false, duration_ms: 0, animation: 'fade_in', font_size: 0, text_color: '#ffffff', opacity: 100 }
	},
	custom_code: {
		width: 400, height: 300,
		config: {
			html: '<div class="card">\n  <h2>¡Hola Stream!</h2>\n  <p>Seguidores: <span id="followers">0</span></p>\n</div>',
			css: '.card {\n  background: rgba(0, 0, 0, 0.7);\n  border: 2px solid #9147ff;\n  border-radius: 12px;\n  padding: 20px;\n  text-align: center;\n  box-shadow: 0 4px 20px rgba(145, 71, 255, 0.4);\n}\nh2 {\n  margin: 0 0 10px 0;\n  color: #9147ff;\n}',
			js: '// Escucha actualizaciones del stream en tiempo real\nwindow.addEventListener("streamupdate", (e) => {\n  const stats = e.detail.stats;\n  const followersEl = document.getElementById("followers");\n  if (followersEl) {\n    followersEl.innerText = stats["followers.total"] || "0";\n  }\n});'
		},
		style: { background: 'transparent', accent: '#9147ff', border_radius: 0, glow: false, duration_ms: 0, animation: 'fade_in', font_size: 16, text_color: '#ffffff', opacity: 100 }
	}
};

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
