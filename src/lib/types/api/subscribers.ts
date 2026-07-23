import type { ApiResponse } from './common';

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
export type SubscribersLeaderboardResponse = {
	success: boolean;
	data: SubscriberEntry[] | null;
	total?: number;
	error?: string;
};
export type BitsLeaderboardResponse = ApiResponse<BitsEntry[]>;
export type GiftersLeaderboardResponse = ApiResponse<GifterEntry[]>;
