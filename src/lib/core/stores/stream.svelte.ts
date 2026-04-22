import { get } from '$lib/core/api/client';
import type { StreamStatusResponse, DashboardStatsResponse } from '$lib/types/api';

export const stream = $state({
	online: false,
	started_at: null as string | null,
	broadcaster_login: null as string | null,
	viewer_count: null as number | null,
	follower_count: null as number | null,
	loading: true,
	error: null as string | null
});

export async function refreshStream(): Promise<void> {
	try {
		const [statusRes, statsRes] = await Promise.all([
			get<StreamStatusResponse>('/stream/status'),
			get<DashboardStatsResponse>('/dashboard/stats')
		]);

		if (statusRes.success && statusRes.data) {
			stream.online = statusRes.data.online;
			stream.started_at = statusRes.data.started_at ?? null;
			stream.broadcaster_login = statusRes.data.broadcaster_login ?? null;
		}

		if (statsRes.success && statsRes.data?.stream) {
			const s = statsRes.data.stream;
			stream.viewer_count = s.viewer_count ?? null;
			stream.follower_count = s.follower_count ?? null;
			// broadcaster_login may also live here if not in status
			if (!stream.broadcaster_login) {
				stream.broadcaster_login = s.broadcaster_login ?? null;
			}
		}

		stream.loading = false;
		stream.error = null;
	} catch (e) {
		stream.error = e instanceof Error ? e.message : String(e);
		stream.loading = false;
	}
}
