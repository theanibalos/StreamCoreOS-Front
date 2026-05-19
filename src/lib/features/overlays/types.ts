export type ElementStyle = {
	background: string;
	accent: string;
	border_radius: number;
	glow: boolean;
	duration_ms: number;
	animation: 'scale_in' | 'fade_in' | 'slide_up' | 'slide_down';
	font_size: number;
	text_color: string;
};

export type OverlayElement = {
	id: string;
	type: 'alert' | 'stat' | 'chat_highlight' | 'banner' | 'progress_bar';
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
	vars: Record<string, string>;
	expiresAt: number;
};

export type ChatMessage = {
	display_name: string;
	message: string;
	timestamp: number;
};
