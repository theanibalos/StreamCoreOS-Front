import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		proxy: {
			// Proxy específico para evitar conflictos con las rutas de SvelteKit
			'/auth': 'http://localhost:8000',
			'/stream': 'http://localhost:8000',
			'/chat': { target: 'http://localhost:8000', changeOrigin: true },
			'/dashboard': { target: 'http://localhost:8000', changeOrigin: true },
			'/loyalty': 'http://localhost:8000',
			'/moderation': 'http://localhost:8000',
			'/ping': 'http://localhost:8000',
			'/timers': { target: 'http://localhost:8000', changeOrigin: true },
			
			// Para el sistema, solo interceptamos los endpoints de datos, 
			// dejando que /system (la página) la maneje SvelteKit.
			'/system/status': 'http://localhost:8000',
			'/system/traces': 'http://localhost:8000',
			'/system/events': 'http://localhost:8000'
		}
	}
});
