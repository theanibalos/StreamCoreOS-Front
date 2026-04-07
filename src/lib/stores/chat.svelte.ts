import { sse } from '$lib/api/client';
import type { SseMessage } from '$lib/types/api';

const MAX_MESSAGES = 200;

export const chat = $state({
	messages: [] as SseMessage[],
	connected: false
});

export function connectChat(): () => void {
	chat.messages = [];
	chat.connected = false;

	return sse(
		'/chat/stream',
		(raw) => {
			if (!raw || typeof raw !== 'object') return;
			const obj = raw as Record<string, unknown>;

			// /chat/stream may send the payload directly (no type/data wrapper),
			// while /dashboard/alerts always wraps in { type, data, timestamp }.
			// Normalize to SseMessage so the component always sees the same shape.
			const msg: SseMessage =
				'data' in obj && obj.data !== null && typeof obj.data === 'object'
					? (obj as unknown as SseMessage)
					: {
							type: typeof obj.type === 'string' ? obj.type : 'chat.message.received',
							data: obj,
							timestamp:
								typeof obj.timestamp === 'string' ? obj.timestamp : new Date().toISOString()
						};

			chat.messages = [...chat.messages, msg].slice(-MAX_MESSAGES);
		},
		(connected) => {
			chat.connected = connected;
		}
	);
}
