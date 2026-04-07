import { sse } from '$lib/api/client';
import type { SseMessage } from '$lib/types/api';

const MAX_ALERTS = 100;

export const alerts = $state({
	messages: [] as SseMessage[],
	connected: false
});

export function connectAlerts(): () => void {
	return sse(
		'/dashboard/alerts',
		(raw) => {
			const msg = raw as SseMessage;
			alerts.messages = [msg, ...alerts.messages].slice(0, MAX_ALERTS);
		},
		(connected) => {
			alerts.connected = connected;
		}
	);
}
