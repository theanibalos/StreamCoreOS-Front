// Base vacía — las rutas son relativas y manejadas por el proxy de Vite.
const BASE = '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE}${path}`, init);
	
	// Si la respuesta es JSON, intentamos parsearla incluso si hay error (404, 422, etc.)
	const contentType = res.headers.get('content-type');
	if (contentType && contentType.includes('application/json')) {
		const data = await res.json();
		
		// Si es un error de HTTP pero tenemos un cuerpo JSON con información
		if (!res.ok) {
			// Prioridad: 1. data.error (nuestro estándar), 2. data.detail (estándar FastAPI)
			const errMsg = data.error || data.detail || `Error ${res.status}`;
			throw new Error(errMsg);
		}
		
		return data as T;
	}

	// Si no es JSON y hay error, lanzamos el genérico
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
