import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
                port: 8500,
		proxy: {
			'/api': {
				// http://localhost:8000 works when running `pnpm dev` on the host.
				// Inside docker compose, override with VITE_API_PROXY_TARGET=http://backend:8000
				// ("localhost" inside the frontend container is the container itself, not the backend).
				target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:8000',
				changeOrigin: true,
			}
		}
	}
});
