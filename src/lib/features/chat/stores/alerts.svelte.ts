import { sse } from '$lib/core/api/client';
import type { SseMessage } from '$lib/types/api';

const MAX_ALERTS = 100;
let alertCounter = 0;
let stopFn: (() => void) | null = null;

let items = $state<(SseMessage & { _id: number })[]>([]);
let connected = $state(false);

export const alerts = {
	get items() { return items; },
	get messages() { return items; },
	get connected() { return connected; },
	set connected(v) { connected = v; }
};

export function connectAlerts(): () => void {
	if (stopFn) return stopFn;

	items = [];
	connected = false;

	stopFn = sse(
		'/dashboard/alerts',
		(raw) => {
			if (!raw) return;
			const batch = Array.isArray(raw) ? raw : [raw];
			const newAlerts: (SseMessage & { _id: number })[] = [];

			for (const obj of batch) {
				if (typeof obj !== 'object' || obj === null) continue;
				newAlerts.push({
					...(obj as any),
					_id: ++alertCounter
				});
			}

			if (newAlerts.length > 0) {
				const updated = [...items, ...newAlerts];
				items = updated.slice(-MAX_ALERTS);
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
