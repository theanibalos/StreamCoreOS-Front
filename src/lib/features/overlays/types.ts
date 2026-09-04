import type { Component } from 'svelte';

export type ElementStyle = {
	background: string;
	accent: string;
	border_radius: number;
	glow: boolean;
	duration_ms: number;
	animation: 'scale_in' | 'fade_in' | 'slide_up' | 'slide_down';
	font_size: number;
	text_color: string;
	opacity: number;
};

export type OverlayElement = {
	id: string;
	// Widget type key — must match an entry in WIDGET_REGISTRY (see index.ts).
	// Known types: alert, stat, chat_highlight, banner, progress_bar, media, custom_code.
	type: string;
	x: number;
	y: number;
	width: number;
	height: number;
	trigger: { event: string; filter_user?: string | null } | null;
	data_source?: string | null;
	// Widget-specific config (e.g. progress bar target, label)
	config?: Record<string, unknown>;
	style: ElementStyle;
	template: string;
};

export type ActiveAlert = {
	elementId: string;
	/** Raw event type (e.g. 'channel.follow', 'youtube.superchat', 'stream.session.started'). */
	type?: string;
	vars: Record<string, string>;
	expiresAt: number;
	raw?: any;
};

export type ChatFragment = {
	type: string;
	text: string;
	emote_id?: string | null;
	emote_animated?: boolean;
};

export type ChatUser = {
	id: string;
	platform_id?: string;
	login?: string | null;
	display_name: string;
	avatar_url?: string | null;
};

export type ChatRoles = {
	broadcaster?: boolean;
	moderator?: boolean;
	subscriber?: boolean;
	vip?: boolean;
	verified?: boolean;
};

export type ChatBadge = {
	set: string;
	version: string;
	url?: string;
};

export type ChatMessage = {
	platform: 'twitch' | 'youtube' | string;
	message_id?: string;
	display_name: string;
	message: string;
	timestamp: number;
	color?: string;
	user: ChatUser;
	badges?: ChatBadge[] | Record<string, string>;
	fragments?: ChatFragment[];
	roles?: ChatRoles;
	channel_name?: string;
	channel_id?: string;
	raw?: any;
};

// ── Widget self-description (editor schema) ─────────────────────────────
// Each widget exports a `meta` (see its .svelte module script) so the builder
// can render its toolbar entry and property editor without per-type code.

export type EditorFieldType = 'text' | 'textarea' | 'number' | 'select' | 'toggle';

export type EditorField = {
	/** Dot-path into the element, e.g. 'data_source', 'config.target', 'trigger.event', 'style.duration_ms'. */
	key: string;
	type: EditorFieldType;
	label: string;
	/** Options for `type: 'select'`. */
	options?: { value: string; label: string }[];
	placeholder?: string;
	min?: number;
	max?: number;
	/** Fallback shown for `type: 'toggle'` when the value is undefined. */
	default?: boolean;
	/** Fallback for `type: 'number'` when the input is empty/invalid (default 0). */
	fallback?: number;
};

/** A template variable a widget exposes as a clickable chip in the editor. */
export type TemplateVar = { name: string; label: string };

/** Props every bespoke widget editor component receives. */
export type WidgetEditorProps = {
	element: OverlayElement;
	onUpdate: (updates: Partial<OverlayElement>) => void;
	onMoveLayer: (dir: 'up' | 'down' | 'front' | 'back') => void;
	canvasWidth?: number;
	canvasHeight?: number;
};

/** Which shared style controls the property editor shows for this widget. */
export type WidgetStyleCaps = {
	background?: boolean;
	accent?: boolean;
	textColor?: boolean;
	borderRadius?: boolean;
	fontSize?: boolean;
	glow?: boolean;
};

export type WidgetMeta = {
	/** Display name (property editor header + layers list). */
	label: string;
	/** Short label for the toolbar button (falls back to `label`). */
	shortLabel?: string;
	/** Lucide icon component. */
	icon: Component<any>;
	/** Default element properties applied when a new instance is created. */
	defaults: Partial<OverlayElement>;
	/** Shared style controls to render. */
	style?: WidgetStyleCaps;
	/** Whether the HTML/text template editor is shown. */
	hasTemplate?: boolean;
	/** Variables shown as insertable chips above the template editor. Static or per-element. */
	templateVars?: TemplateVar[] | ((el: OverlayElement) => TemplateVar[]);
	/** Declarative config/trigger fields. */
	fields?: EditorField[];
	/** Optional bespoke editor component for custom UI (receives WidgetEditorProps). */
	Editor?: Component<WidgetEditorProps>;
	/**
	 * Data feeds this widget needs from the overlay data source. Drives SSE
	 * subscription filtering (backend), preview data generation and event
	 * routing (dataSource.svelte.ts) — no more hardcoded `el.type === '...'`
	 * checks scattered across the app.
	 */
	needs?: ('stats' | 'chat' | 'alerts')[];
};
