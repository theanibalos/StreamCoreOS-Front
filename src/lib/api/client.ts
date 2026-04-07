// Base vacía — las rutas son relativas y manejadas por el proxy de Vite.
const BASE = '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE}${path}`, init);
	if (!res.ok) throw new Error(`HTTP ${res.status} — ${path}`);
	return res.json() as Promise<T>;
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
	const es = new EventSource(`${BASE}${path}`);

	es.onopen = () => onConnect?.(true);
	es.onerror = () => onConnect?.(false);
	es.onmessage = (event) => {
		try {
			onMessage(JSON.parse(event.data));
		} catch {
			// ignore unparseable frames
		}
	};

	return () => es.close();
}
