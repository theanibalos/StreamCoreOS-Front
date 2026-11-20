import type { ApiResponse } from './common';

export interface ModRuleData {
	id: number;
	type: string; // word_filter | link_filter | caps_filter | spam_filter
	value: string | null;
	action: string; // ban | timeout | delete
	duration_s: number | null;
	enabled: boolean;
	exempt_roles: string[]; // mod | vip | sub | regular
	target_users: string[]; // specific usernames targeted by this rule
	exempt_users: string[]; // specific usernames exempt from this rule
}

export interface CreateModRuleRequest {
	type: string;
	value?: string | null;
	action?: string;
	duration_s?: number | null;
	exempt_roles?: string[];
	target_users?: string[];
	exempt_users?: string[];
}

export interface UpdateModRuleRequest {
	value?: string | null;
	action?: string | null;
	duration_s?: number | null;
	enabled?: boolean | null;
	exempt_roles?: string[] | null;
	target_users?: string[] | null;
	exempt_users?: string[] | null;
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
