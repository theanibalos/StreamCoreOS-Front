// Prefijo /api — todas las llamadas al backend van a /api/*
const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE}${path}`, { cache: 'no-store', ...init });

	const contentType = res.headers.get('content-type');
	if (contentType && contentType.includes('application/json')) {
		const data = await res.json();
		if (!res.ok) {
			const errMsg = data.error || data.detail || `Error ${res.status}`;
			throw new Error(errMsg);
		}
		return data as T;
	}

	if (!res.ok) throw new Error(`HTTP ${res.status} — ${path}`);
	return {} as Promise<T>;
}

export function get<T>(path: string): Promise<T> {
	return request<T>(path);
}

export function post<T>(path: string, body: unknown): Promise<T> {
	return request<T>(path, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
}

export function put<T>(path: string, body: unknown): Promise<T> {
	return request<T>(path, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
}

export function del<T>(path: string): Promise<T> {
	return request<T>(path, { method: 'DELETE' });
}

export function upload<T>(path: string, file: File): Promise<T> {
	const form = new FormData();
	form.append('files', file);
	return request<T>(path, { method: 'POST', body: form });
}

export function sse<T>(
	path: string,
	onMessage: (msg: T) => void,
	onConnect?: (connected: boolean) => void
): () => void {
	let es: EventSource;
	let closed = false;
	let retryTimeout: ReturnType<typeof setTimeout>;
	// Watchdog: if no message arrives within 60s (server heartbeats every 20s),
	// the TCP connection is silently dead (zombie NAT entry). Force a reconnect.
	let watchdog: ReturnType<typeof setTimeout>;
	const WATCHDOG_MS = 60_000;

	function resetWatchdog() {
		clearTimeout(watchdog);
		watchdog = setTimeout(() => {
			if (closed) return;
			onConnect?.(false);
			es.close();
			connect();
		}, WATCHDOG_MS);
	}

	function connect() {
		if (closed) return;

		es = new EventSource(`${BASE}${path}`);

		es.onopen = () => {
			onConnect?.(true);
			resetWatchdog();
		};

		es.onerror = () => {
			onConnect?.(false);
			clearTimeout(watchdog);
			es.close();
			if (!closed) {
				clearTimeout(retryTimeout);
				retryTimeout = setTimeout(connect, 3000);
			}
		};

		function handleEvent(event: MessageEvent) {
			try {
				const data = JSON.parse(event.data);
				resetWatchdog();
				// Heartbeat messages keep the watchdog alive but carry no payload
				if ((data as any).__type === 'heartbeat') return;
				onMessage(data);
			} catch {
				// ignore
			}
		}

		// El backend emite SSE sin línea 'event:', así que el tipo siempre es 'message'.
		es.addEventListener('message', handleEvent);
	}

	connect();

	return () => {
		closed = true;
		clearTimeout(retryTimeout);
		clearTimeout(watchdog);
		if (es) es.close();
	};
}
