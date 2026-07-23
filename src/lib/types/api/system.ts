import type { ApiResponse } from './common';

export interface PingData {
	status: string;
	message: string;
}

export interface ToolStatus {
	name: string;
	status: string;
	message: string | null;
}

export interface PluginStatus {
	name: string;
	domain: string | null;
	status: string;
	error: string | null;
	dependencies?: string[];
}

export interface SystemStatusData {
	tools: ToolStatus[];
	plugins: PluginStatus[];
}

export interface TraceNode {
	id: string;
	parent_id: string | null;
	event: string;
	emitter: string;
	subscribers: string[];
	payload_keys: string[];
	timestamp: number;
	children: TraceNode[];
}

export type PingResponse = ApiResponse<PingData>;
export type SystemStatusResponse = ApiResponse<SystemStatusData>;
export type SystemTracesTreeResponse = ApiResponse<TraceNode[]>;
