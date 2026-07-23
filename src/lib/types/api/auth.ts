import type { ApiResponse } from './common';

export interface OAuthStartResponse extends ApiResponse<Record<string, unknown>> {}
export interface OAuthCallbackResponse extends ApiResponse<Record<string, unknown>> {}

export interface ScopesData {
	connected: boolean;
	required?: string[];
	granted?: string[];
	missing?: string[];
}

export type ScopesResponse = ApiResponse<ScopesData>;
