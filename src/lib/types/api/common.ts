export interface ApiResponse<T> {
	success: boolean;
	data: T | null;
	error: string | null;
}

export interface SseMessage {
	type: string;
	data: Record<string, unknown>;
	timestamp: string;
}
