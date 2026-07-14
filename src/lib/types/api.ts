// ─── Shared envelope ────────────────────────────────────────────────────────
export interface ApiResponse<T> {
	success: boolean;
	data: T | null;
	error: string | null;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface OAuthStartResponse extends ApiResponse<Record<string, unknown>> {}
export interface OAuthCallbackResponse extends ApiResponse<Record<string, unknown>> {}

// ─── Stream ──────────────────────────────────────────────────────────────────
export interface StreamStatusData {
	online: boolean;
	session_id: number | null;
	started_at: string | null;
	broadcaster_login: string | null;
}

export interface StreamInfo {
	online: boolean;
	started_at: string | null;
	viewer_count: number | null;
	follower_count: number | null;
	broadcaster_login: string | null;
}

export interface StreamSessionData {
	id: number;
	twitch_stream_id: string | null;
	started_at: string;
	ended_at: string | null;
}

export type StreamStatusResponse = ApiResponse<StreamStatusData>;
export type StreamHistoryResponse = ApiResponse<StreamSessionData[]>;

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface TopViewer {
	twitch_id: string;
	display_name: string;
	points: number;
}

export interface RecentModAction {
	display_name: string;
	action: string;
	reason: string;
	created_at: string;
}

export interface DashboardStatsData {
	stream: StreamInfo;
	top_viewers: TopViewer[];
	recent_mod_actions: RecentModAction[];
	total_viewers: number;
}

export interface StatsSnapshot {
	id: number;
	recorded_at: string;
	viewer_count: number;
	follower_count: number;
}

export type DashboardStatsResponse = ApiResponse<DashboardStatsData>;
export type StatsHistoryResponse = ApiResponse<StatsSnapshot[]>;

// ─── SSE ─────────────────────────────────────────────────────────────────────
export interface SseMessage {
	type: string;
	data: Record<string, unknown>;
	timestamp: string;
}

// ─── Chat commands ───────────────────────────────────────────────────────────
export type UserLevel = 'everyone' | 'subscriber' | 'vip' | 'regular' | 'moderator' | 'broadcaster';

export interface CommandData {
	id: number;
	name: string;
	response: string;
	cooldown_s: number;
	enabled: boolean;
	userlevel: UserLevel;
	global_cooldown_s: number;
	use_count: number;
}

export interface CreateCommandRequest {
	name: string; // pattern: ^![a-z0-9_]+$, 2–50 chars
	response: string; // 1–500 chars
	cooldown_s?: number; // 0–3600
	userlevel?: UserLevel;
	global_cooldown_s?: number;
}

export interface UpdateCommandRequest {
	response?: string | null;
	cooldown_s?: number | null;
	enabled?: boolean | null;
	userlevel?: UserLevel | null;
	global_cooldown_s?: number | null;
}

export type ListCommandsResponse = ApiResponse<CommandData[]>;
export type CreateCommandResponse = ApiResponse<CommandData>;
export type UpdateCommandResponse = ApiResponse<CommandData>;
export type DeleteCommandResponse = ApiResponse<Record<string, unknown> | null>;

// ─── Viewers ─────────────────────────────────────────────────────────────────
export interface ViewerData {
	id: number;
	twitch_id: string;
	login: string;
	display_name: string;
	points: number;
	total_earned: number;
	is_regular: boolean;
	first_seen: string;
	last_seen: string;
}

export interface ViewerLeaderboardEntry {
	rank: number;
	twitch_id: string;
	display_name: string;
	points: number;
	total_earned: number;
	is_regular: boolean;
}

export interface RegularData {
	twitch_id: string;
	login: string;
	display_name: string;
}

export interface RegularEntry {
	twitch_id: string;
	login: string;
	display_name: string;
	points: number;
	first_seen: string;
}

export interface AddRegularRequest {
	twitch_id: string;
	login: string;
	display_name: string;
}

export interface AdjustPointsRequest {
	delta: number;
}

export type LeaderboardResponse = ApiResponse<ViewerLeaderboardEntry[]>;
export type ViewerResponse = ApiResponse<ViewerData>;
export type ListRegularsResponse = ApiResponse<RegularEntry[]>;
export type AddRegularResponse = ApiResponse<RegularData>;
export type RegularResponse = AddRegularResponse; // Keep alias for backward compatibility
export type AdjustPointsResponse = ApiResponse<{
	twitch_id: string;
	display_name: string;
	points: number;
	total_earned: number;
}>; 
export type RemoveRegularResponse = ApiResponse<null>;

// ─── Chat Reminders & Vars ───────────────────────────────────────────────────
export interface ReminderData {
	job_id: string;
	message: string;
	run_at: string;
	scheduled_by: string;
	channel: string;
}

export interface ChatVarData {
	id: number;
	name: string;
	value: string;
	enabled: boolean;
}

export type ListRemindersResponse = ApiResponse<ReminderData[]>;
export type ListChatVarsResponse = ApiResponse<ChatVarData[]>;

// ─── Moderation ───────────────────────────────────────────────────────────────
export interface ModRuleData {
	id: number;
	type: string; // word_filter | link_filter | caps_filter | spam_filter
	value: string | null;
	action: string; // ban | timeout | delete
	duration_s: number | null;
	enabled: boolean;
}

export interface CreateModRuleRequest {
	type: string;
	value?: string | null;
	action?: string;
	duration_s?: number | null;
}

export interface UpdateModRuleRequest {
	value?: string | null;
	action?: string | null;
	duration_s?: number | null;
	enabled?: boolean | null;
}

export interface ModLogEntry {
	id: number;
	twitch_id: string;
	display_name: string;
	action: string;
	reason: string;
	rule_id: number | null;
	created_at: string;
}

export interface BanRequest {
	twitch_id: string;
	reason?: string | null;
}

export interface TimeoutRequest {
	twitch_id: string;
	duration_s?: number;
	reason?: string | null;
}

export interface UnbanRequest {
	twitch_id: string;
}

export type ListModRulesResponse = ApiResponse<ModRuleData[]>;
export type CreateModRuleResponse = ApiResponse<ModRuleData>;
export type UpdateModRuleResponse = ApiResponse<ModRuleData>;
export type DeleteModRuleResponse = ApiResponse<Record<string, unknown>>;
export type ModLogResponse = ApiResponse<ModLogEntry[]>;
export type BanResponse = ApiResponse<Record<string, unknown>>;
export type TimeoutResponse = ApiResponse<Record<string, unknown>>;
export type UnbanResponse = ApiResponse<Record<string, unknown>>;

// ─── System ───────────────────────────────────────────────────────────────────
export interface PingData {
	status: string;
	message: string;
}

export interface ToolStatus {
	name: string;
	status: string;
	message: string | null;
}

export interface PluginStatus {
	name: string;
	domain: string | null;
	status: string;
	error: string | null;
	dependencies?: string[];
}

export interface SystemStatusData {
	tools: ToolStatus[];
	plugins: PluginStatus[];
}

export interface TraceNode {
	id: string;
	parent_id: string | null;
	event: string;
	emitter: string;
	subscribers: string[];
	payload_keys: string[];
	timestamp: number;
	children: TraceNode[];
}

export type PingResponse = ApiResponse<PingData>;
export type SystemStatusResponse = ApiResponse<SystemStatusData>;
export type SystemTracesTreeResponse = ApiResponse<TraceNode[]>;

// ─── Timers ───────────────────────────────────────────────────────────────────
export interface TimerData {
	id: number;
	name: string;
	message: string;
	interval_minutes: number;
	min_lines: number;
	enabled: number; // 0 | 1
	last_executed_at: string | null;
}

export interface CreateTimerRequest {
	name: string;
	message: string;
	interval_minutes: number;
	min_lines?: number;
	enabled?: number;
}

export interface UpdateTimerRequest {
	name?: string | null;
	message?: string | null;
	interval_minutes?: number | null;
	min_lines?: number | null;
	enabled?: number | null;
}

export type GetTimersResponse = ApiResponse<TimerData[]>;
export type TimerResponse = ApiResponse<TimerData>;
export type UpdateTimerResponse = ApiResponse<TimerData>;
export type DeleteTimerResponse = ApiResponse<null>;

// ─── Subscribers ─────────────────────────────────────────────────────────────
export interface SubscriberEntry {
	rank: number;
	twitch_id: string;
	display_name: string;
	tier: string;
	is_prime: boolean;
	is_gift: boolean;
	cumulative_months: number;
	streak_months: number | null;
	subscribed_at: string;
	is_active: boolean;
}

export interface BitsEntry {
	rank: number;
	twitch_id: string;
	display_name: string;
	bits_total: number;
	last_cheer_at: string;
}

export interface SubscribersLeaderboardData {
	entries: SubscriberEntry[];
	total: number;
}

export interface GifterEntry {
	rank: number;
	twitch_id: string;
	display_name: string;
	gifts_total: number;
	last_gift_at: string;
}

// Backend devuelve total al nivel superior (fuera de data) — no usar ApiResponse<T> aquí
export type SubscribersLeaderboardResponse = { success: boolean; data: SubscriberEntry[] | null; total?: number; error?: string };
export type BitsLeaderboardResponse = ApiResponse<BitsEntry[]>;
export type GiftersLeaderboardResponse = ApiResponse<GifterEntry[]>;

// ─── AI ───────────────────────────────────────────────────────────────────────
export interface AIConfigData {
	chat_system_prompt: string;
	chat_max_tokens: number;
	chat_temperature: number;
	chat_cooldown_s: number;
	provider: string;
	endpoint_url: string;
	model: string;
	has_api_key: boolean;
	timeout_s?: number | null;
	disable_reasoning?: boolean | null;
	extra_headers?: Record<string, string> | null;
	extra_payload?: Record<string, unknown> | null;
}

export type GetAIConfigResponse = ApiResponse<AIConfigData>;
export type SaveAIConfigResponse = ApiResponse<AIConfigData>;

export interface AIProviderData {
	id: number;
	name: string;
	provider: string;
	endpoint_url: string;
	model: string;
	has_api_key: boolean;
	timeout_s: number;
	disable_reasoning: boolean;
	extra_headers: Record<string, string>;
	extra_payload: Record<string, unknown>;
	is_active: boolean;
	updated_at: string;
}

export type ListAIProvidersResponse = ApiResponse<AIProviderData[]>;
export type SaveAIProviderResponse = ApiResponse<AIProviderData>;
export type DeleteAIProviderResponse = ApiResponse<null>;

// ─── Auth / Scopes ────────────────────────────────────────────────────────────
export interface ScopesData {
	connected: boolean;
	required?: string[];
	granted?: string[];
	missing?: string[];
}

export type ScopesResponse = ApiResponse<ScopesData>;

// ─── TTS ────────────────────────────────────────────────────────────
export interface TtsMessage {
	type: string;
	username: string;
	text: string;
	voice_id: string;
	audio_b64: string;
}
