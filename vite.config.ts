import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		proxy: {
			// Proxy genérico: Captura cualquier ruta que no sea interna de Vite o SvelteKit.
			// Excluimos explícitamente recursos estáticos y carpetas de desarrollo.
			'^(?!/(_svelte_kit_assets|\.svelte-kit|favicon.svg|robots.txt|src|node_modules|@fs|@vite|@id|__)).*': {
				target: 'http://localhost:8000',
				changeOrigin: true,
				bypass: (req) => {
					// Si la petición es una navegación del navegador (acepta HTML), 
					// devolvemos la URL para que SvelteKit maneje el renderizado.
					if (req.headers.accept?.includes('text/html')) {
						return req.url;
					}
					// Para todo lo demás (JSON, SSE, POST, etc.), el proxy enviará la petición al backend.
				}
			}
		}
	}
});
