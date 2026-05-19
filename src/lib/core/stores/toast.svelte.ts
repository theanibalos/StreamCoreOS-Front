let nextId = 0;

interface Toast {
	id: number;
	message: string;
	type: 'success' | 'error' | 'info';
}

const toasts = $state<Toast[]>([]);

export function show(message: string, type: Toast['type'] = 'info', duration = 3000) {
	const id = nextId++;
	toasts.push({ id, message, type });
	setTimeout(() => dismiss(id), duration);
}

export function dismiss(id: number) {
	const idx = toasts.findIndex((t) => t.id === id);
	if (idx !== -1) toasts.splice(idx, 1);
}

export { toasts };
