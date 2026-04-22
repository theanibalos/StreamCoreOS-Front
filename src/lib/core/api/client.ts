// Base vacía — las rutas son relativas y manejadas por el proxy de Vite.
const BASE = '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE}${path}`, init);
	
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

export function sse(
	path: string,
	onMessage: (msg: unknown) => void,
	onConnect?: (connected: boolean) => void
): () => void {
	let es: EventSource;
	let closed = false;
	let retryTimeout: ReturnType<typeof setTimeout>;

	function connect() {
		if (closed) return;
		
		es = new EventSource(`${BASE}${path}`);

		es.onopen = () => {
			onConnect?.(true);
		};

		es.onerror = () => {
			onConnect?.(false);
			es.close();
			if (!closed) {
				clearTimeout(retryTimeout);
				retryTimeout = setTimeout(connect, 3000);
			}
		};

		function handleEvent(event: MessageEvent) {
			try {
				const data = JSON.parse(event.data);
				onMessage(data);
			} catch {
				// ignore
			}
		}

		// USAR SOLO EVENT LISTENERS (NO onmessage) para evitar duplicados
		// El evento 'message' captura todos los eventos sin nombre.
		es.addEventListener('message', handleEvent);
		
		// Otros eventos específicos por si el backend los usa
		es.addEventListener('chat_message', handleEvent);
		es.addEventListener('alert', handleEvent);
		es.addEventListener('new_message', handleEvent);
	}

	connect();

	return () => {
		closed = true;
		clearTimeout(retryTimeout);
		if (es) es.close();
	};
}
