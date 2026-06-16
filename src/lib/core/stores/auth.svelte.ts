import { get } from '$lib/core/api/client';
import type { OAuthStartResponse } from '$lib/types/api';

export const auth = $state({
	isAuthenticated: false,
	isConnected: false,
	isConnecting: false,
	loading: true,
	error: null as string | null
});

export async function checkAuth({ silent = false } = {}) {
	if (!silent) auth.loading = true;
	try {
		const res = await get<any>('/auth/twitch/status');
		if (res.success && res.data) {
			auth.isAuthenticated = res.data.authenticated;
			auth.isConnected = res.data.connected;
			auth.isConnecting = res.data.connecting;
			return;
		}
		auth.isAuthenticated = false;
		auth.isConnected = false;
		auth.isConnecting = false;
	} catch {
		auth.isAuthenticated = false;
		auth.isConnected = false;
		auth.isConnecting = false;
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
		await fetch('/api/auth/twitch/logout', { method: 'POST' });
	} catch {
		// ignorar errores de red — igual limpiamos el estado local
	} finally {
		auth.isAuthenticated = false;
		auth.isConnected = false;
		auth.isConnecting = false;
		auth.error = null;
	}
}
