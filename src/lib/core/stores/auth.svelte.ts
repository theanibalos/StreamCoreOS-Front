import { get } from '$lib/core/api/client';
import type { OAuthStartResponse } from '$lib/types/api';

export const auth = $state({
	isAuthenticated: false,
	loading: true,
	error: null as string | null
});

export async function checkAuth() {
	auth.loading = true;
	try {
		const res = await get<any>('/auth/twitch/status');
		auth.isAuthenticated = res.success && res.data?.connected === true;
	} catch {
		auth.isAuthenticated = false;
	} finally {
		auth.loading = false;
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
