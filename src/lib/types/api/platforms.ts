import type { ApiResponse } from './common';

export interface PlatformConnectionData {
	id: number;
	platform: string;
	channel_id: string;
	channel_name: string;
	enabled: boolean;
	chat_read_enabled: boolean;
	chat_write_enabled: boolean;
	moderation_enabled: boolean;
	capabilities: Record<string, unknown>;
	created_at: string;
	updated_at: string;
}

export interface StreamOutputData {
	id: number;
	name: string;
	platform: string;
	channel_id: string;
	enabled: boolean;
	overlay_id: number | null;
	rtmp_url: string | null;
	stream_key_configured: boolean;
	stream_key_preview: string | null;
	status: string;
	settings: Record<string, unknown>;
	created_at: string;
	updated_at: string;
}

export interface CreateStreamOutputRequest {
	name: string;
	platform: string;
	channel_id: string;
	enabled?: boolean;
	overlay_id?: number | null;
	rtmp_url?: string | null;
	stream_key_secret?: string | null;
	settings?: Record<string, unknown>;
}

export interface UpdateStreamOutputRequest {
	name?: string;
	platform?: string;
	channel_id?: string;
	enabled?: boolean;
	overlay_id?: number | null;
	rtmp_url?: string | null;
	stream_key_secret?: string | null;
	status?: string;
	settings?: Record<string, unknown>;
}

export type PlatformConnectionsResponse = ApiResponse<PlatformConnectionData[]>;
export type StreamOutputsResponse = ApiResponse<StreamOutputData[]>;
export type StreamOutputResponse = ApiResponse<StreamOutputData>;
export type DeleteStreamOutputResponse = ApiResponse<{ id: number; deleted: boolean }>;
