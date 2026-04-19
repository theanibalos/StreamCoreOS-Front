import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// SvelteKit page routes — browser navigations to these must NOT be proxied
const SVELTE_PAGES = new Set([
	'/auth/callback',
	'/chat',
	'/viewers',
	'/commands',
	'/moderation',
	'/timers',
	'/system',
	'/obs',
	'/ai',
	'/tts',
	'/tts/overlay',
]);

function bypass(req: { url?: string; headers: Record<string, string | string[] | undefined> }) {
	const url = req.url ?? '';
	const accept = req.headers['accept'] ?? '';
	// Let browser page navigations through to SvelteKit
	if (
		typeof accept === 'string' &&
		accept.includes('text/html') &&
		SVELTE_PAGES.has(url.split('?')[0])
	) {
		return url;
	}
	return undefined;
}

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		proxy: {
			'/auth': { target: 'http://localhost:8000', bypass },
			'/stream': { target: 'http://localhost:8000', bypass },
			'/chat': { target: 'http://localhost:8000', changeOrigin: true, bypass },
			'/dashboard': { target: 'http://localhost:8000', changeOrigin: true, bypass },
			'/viewers': { target: 'http://localhost:8000', bypass },
			'/moderation': { target: 'http://localhost:8000', bypass },
			'/ping': { target: 'http://localhost:8000' },
			'/timers': { target: 'http://localhost:8000', changeOrigin: true, bypass },
			'/ai': { target: 'http://localhost:8000', changeOrigin: true, bypass },
		'/tts': { target: 'http://localhost:8000', changeOrigin: true, bypass },
		'/system/status': { target: 'http://localhost:8000' },
			'/system/traces': { target: 'http://localhost:8000' },
			'/system/events': { target: 'http://localhost:8000' },
		}
	}
});
