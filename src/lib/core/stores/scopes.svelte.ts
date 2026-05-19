import { get } from '$lib/core/api/client';
import type { ScopesResponse } from '$lib/types/api';

export const scopesState = $state({
	checked: false,
	missing: [] as string[],
});

export async function checkScopes() {
	try {
		const res = await get<ScopesResponse>('/auth/twitch/scopes');
		if (res.success && res.data?.connected) {
			scopesState.missing = res.data.missing ?? [];
		} else {
			scopesState.missing = [];
		}
	} catch {
		scopesState.missing = [];
	} finally {
		scopesState.checked = true;
	}
}

export function resetScopes() {
	scopesState.checked = false;
	scopesState.missing = [];
}
