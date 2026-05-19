import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
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
	'/settings',
	'/subscribers',
	'/overlays',
]);

// Sub-paths under proxied routes that are SvelteKit pages (prefix match)
const SVELTE_PREFIXES = [
	'/overlays/live/',
	'/overlays/builder/',
	'/overlays/alerts',
	'/overlays/chat',
	'/overlays/tts',
];

function bypass(req: { url?: string; headers: Record<string, string | string[] | undefined> }) {
	const url = req.url ?? '';
	const path = url.split('?')[0];
	const accept = req.headers['accept'] ?? '';
	// Let browser page navigations through to SvelteKit
	if (typeof accept === 'string' && accept.includes('text/html')) {
		if (SVELTE_PAGES.has(path)) return url;
		if (SVELTE_PREFIXES.some((p) => path.startsWith(p))) return url;
	}
	return undefined;
}

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
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
		'/subscribers': { target: 'http://localhost:8000', changeOrigin: true, bypass },
		'/bits': { target: 'http://localhost:8000', changeOrigin: true, bypass },
		'/gifters': { target: 'http://localhost:8000', changeOrigin: true, bypass },
		'/system/status': { target: 'http://localhost:8000' },
			'/system/traces': { target: 'http://localhost:8000' },
			'/system/events': { target: 'http://localhost:8000' },
			'/overlays': { target: 'http://localhost:8000', changeOrigin: true, bypass },
		}
	}
});
