import { sse } from '$lib/core/api/client';
import type { SseMessage } from '$lib/types/api';

const MAX_MESSAGES = 200;
let msgCounter = 0;
let stopFn: (() => void) | null = null;
let seenIds = new Set<string>(); // Para evitar duplicados reales del backend o de la red

let messages = $state<(SseMessage & { _id: number })[]>([]);
let connected = $state(false);

export const chat = {
	get messages() { return messages; },
	set messages(v) { messages = v; },
	get connected() { return connected; },
	set connected(v) { connected = v; }
};

export function connectChat(): () => void {
	if (stopFn) return stopFn;

	messages = [];
	connected = false;
	seenIds.clear();

	stopFn = sse(
		'/chat/stream',
		(raw) => {
			if (!raw) return;
			const items = Array.isArray(raw) ? raw : [raw];
			const newBatch: (SseMessage & { _id: number })[] = [];

			for (const obj of items) {
				if (typeof obj !== 'object' || obj === null) continue;
				const item = obj as Record<string, any>;
				
				// Crear un hash o ID basado en contenido + timestamp para de-duplicar
				const contentHash = JSON.stringify(item.data ?? item) + item.timestamp;
				if (seenIds.has(contentHash)) continue;
				seenIds.add(contentHash);
				
				// Mantener el Set bajo control
				if (seenIds.size > 500) {
					const first = seenIds.values().next().value;
					if (first !== undefined) seenIds.delete(first);
				}

				newBatch.push({
					_id: ++msgCounter,
					type: typeof item.type === 'string' ? item.type : 'chat.message.received',
					data: ('data' in item && item.data !== null) ? item.data : item,
					timestamp: typeof item.timestamp === 'string' ? item.timestamp : new Date().toISOString()
				});
			}

			if (newBatch.length > 0) {
				messages = [...messages, ...newBatch].slice(-MAX_MESSAGES);
			}
		},
		(status) => {
			connected = status;
		}
	);

	return () => {
		if (stopFn) {
			stopFn();
			stopFn = null;
		}
	};
}
