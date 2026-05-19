import { get } from '$lib/core/api/client';
import type { OAuthStartResponse } from '$lib/types/api';

export const auth = $state({
	isAuthenticated: false,
	loading: true,
	error: null as string | null
});

export async function checkAuth({ silent = false } = {}) {
	if (!silent) auth.loading = true;
	try {
		// Si el backend tiene un token pero EventSub aún no conectó, reintentamos
		// hasta 5 veces con 1s de espera entre intentos antes de mostrar el login.
		for (let attempt = 0; attempt < 5; attempt++) {
			const res = await get<any>('/auth/twitch/status');
			if (res.success && res.data?.connected === true) {
				auth.isAuthenticated = true;
				return;
			}
			if (res.success && res.data?.connecting === true && attempt < 4) {
				await new Promise((r) => setTimeout(r, 1000));
				continue;
			}
			auth.isAuthenticated = false;
			return;
		}
	} catch {
		auth.isAuthenticated = false;
	} finally {
		if (!silent) auth.loading = false;
	}
}

export async function startTwitchAuth() {
	try {
		const res = await get<OAuthStartResponse>('/auth/twitch');
		if (res.success && res.data?.auth_url) {
			window.location.href = res.data.auth_url as string;
		} else {
			auth.error = res.error ?? 'Failed to get Twitch auth URL';
		}
	} catch (e) {
		auth.error = e instanceof Error ? e.message : String(e);
	}
}

export async function logout() {
	try {
		await fetch('/auth/twitch/logout', { method: 'POST' });
	} catch {
		// ignorar errores de red — igual limpiamos el estado local
	} finally {
		auth.isAuthenticated = false;
		auth.error = null;
	}
}
