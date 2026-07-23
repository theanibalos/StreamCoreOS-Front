import type { ApiResponse } from './common';
import type { StreamInfo } from './stream';

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
