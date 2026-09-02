import type { ApiResponse } from './common';

export interface ViewerData {
	id: number;
	global_user_id: string;
	platform: string;
	platform_user_id: string;
	login: string | null;
	display_name: string;
	avatar_url: string | null;
	points: number;
	total_earned: number;
	is_regular: boolean;
	first_seen: string;
	last_seen: string;
}

export interface ViewerLeaderboardEntry {
	rank: number;
	global_user_id: string;
	platform: string;
	platform_user_id: string;
	display_name: string;
	points: number;
	total_earned: number;
	is_regular: boolean;
}

export interface RegularData {
	global_user_id: string;
	platform: string;
	platform_user_id: string;
	login: string | null;
	display_name: string;
}

export interface RegularEntry {
	global_user_id: string;
	platform: string;
	platform_user_id: string;
	login: string | null;
	display_name: string;
	points: number;
	first_seen: string;
}

export interface AddRegularRequest {
	login: string;
	platform?: string;
}

export interface AdjustPointsRequest {
	delta: number;
}

export type LeaderboardResponse = ApiResponse<ViewerLeaderboardEntry[]>;
export type ViewerResponse = ApiResponse<ViewerData>;
export type ListRegularsResponse = ApiResponse<RegularEntry[]>;
export type AddRegularResponse = ApiResponse<RegularData>;
export type RegularResponse = AddRegularResponse;
export type AdjustPointsResponse = ApiResponse<{
	global_user_id: string;
	platform: string;
	platform_user_id: string;
	display_name: string;
	points: number;
	total_earned: number;
}>;
export type RemoveRegularResponse = ApiResponse<null>;
