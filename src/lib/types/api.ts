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
export interface CommandData {
	id: number;
	name: string;
	response: string;
	cooldown_s: number;
	enabled: boolean;
}

export interface CreateCommandRequest {
	name: string; // pattern: ^![a-z0-9_]+$, 2–50 chars
	response: string; // 1–500 chars
	cooldown_s?: number; // 0–3600
}

export interface UpdateCommandRequest {
	response?: string | null;
	cooldown_s?: number | null;
	enabled?: boolean | null;
}

export type ListCommandsResponse = ApiResponse<CommandData[]>;
export type CreateCommandResponse = ApiResponse<CommandData>;
export type UpdateCommandResponse = ApiResponse<CommandData>;
export type DeleteCommandResponse = ApiResponse<Record<string, unknown>>;

// ─── Loyalty ─────────────────────────────────────────────────────────────────
export interface LeaderboardEntry {
	rank: number;
	twitch_id: string;
	display_name: string;
	points: number;
	total_earned: number;
}

export interface ViewerPointsData {
	twitch_id: string;
	display_name: string;
	points: number;
	total_earned: number;
}

export interface TransactionData {
	id: number;
	amount: number;
	reason: string;
	created_at: string;
}

export interface RewardData {
	id: number;
	name: string;
	description: string | null;
	cost: number;
}

export interface CreateRewardRequest {
	name: string;
	description?: string | null;
	cost: number;
}

export interface RedeemRequest {
	twitch_id: string;
	reward_id: number;
}

export type LeaderboardResponse = ApiResponse<LeaderboardEntry[]>;
export type ViewerPointsResponse = ApiResponse<ViewerPointsData>;
export type PointsHistoryResponse = ApiResponse<TransactionData[]>;
export type ListRewardsResponse = ApiResponse<RewardData[]>;
export type CreateRewardResponse = ApiResponse<RewardData>;
export type RedeemResponse = ApiResponse<Record<string, unknown>>;

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

export type GetTimersResponse = ApiResponse<TimerData[]> & { data: TimerData[] };
export type TimerResponse = ApiResponse<TimerData>;
export type UpdateTimerResponse = ApiResponse<TimerData>;
export type DeleteTimerResponse = ApiResponse<null>;
