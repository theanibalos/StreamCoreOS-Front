import type { ApiResponse } from './common';

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
