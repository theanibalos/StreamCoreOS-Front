import type { ApiResponse } from './common';

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
	login: string;
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
