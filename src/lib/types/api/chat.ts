import type { ApiResponse } from './common';

export interface ReminderData {
	job_id: string;
	message: string;
	run_at: string;
	scheduled_by: string;
	channel: string;
}

export interface ChatVarData {
	id: number;
	name: string;
	value: string;
	enabled: boolean;
}

export type ListRemindersResponse = ApiResponse<ReminderData[]>;
export type ListChatVarsResponse = ApiResponse<ChatVarData[]>;
