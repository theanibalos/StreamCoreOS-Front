import type { ApiResponse } from './common';

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
