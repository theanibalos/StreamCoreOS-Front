import type { ApiResponse } from './common';

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

export type GetTimersResponse = ApiResponse<TimerData[]>;
export type TimerResponse = ApiResponse<TimerData>;
export type UpdateTimerResponse = ApiResponse<TimerData>;
export type DeleteTimerResponse = ApiResponse<null>;
