import type { ApiResponse } from './common';

export type UserLevel = 'everyone' | 'subscriber' | 'vip' | 'regular' | 'moderator' | 'broadcaster';

export type CommandAction = 'shoutout';

export interface CommandData {
	id: number;
	name: string;
	response: string;
	cooldown_s: number;
	enabled: boolean;
	userlevel: UserLevel;
	global_cooldown_s: number;
	use_count: number;
	action: CommandAction | null;
}

export interface CreateCommandRequest {
	name: string; // pattern: ^![a-z0-9_]+$, 2–50 chars
	response: string; // 1–500 chars
	cooldown_s?: number; // 0–3600
	userlevel?: UserLevel;
	global_cooldown_s?: number;
	action?: CommandAction | null; // built-in behavior to run before the response, e.g. "shoutout"
}

export interface UpdateCommandRequest {
	response?: string | null;
	cooldown_s?: number | null;
	enabled?: boolean | null;
	userlevel?: UserLevel | null;
	global_cooldown_s?: number | null;
}

export type ListCommandsResponse = ApiResponse<CommandData[]>;
export type CreateCommandResponse = ApiResponse<CommandData>;
export type UpdateCommandResponse = ApiResponse<CommandData>;
export type DeleteCommandResponse = ApiResponse<Record<string, unknown> | null>;
