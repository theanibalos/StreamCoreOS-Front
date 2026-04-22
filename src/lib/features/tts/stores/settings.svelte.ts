import { get, put } from '$lib/core/api/client';

export interface TtsSettings {
	enabled: boolean;
	default_voice: string;
	max_message_length: number;
	skip_commands: boolean;
	skip_links: boolean;
	sub_only: boolean;
	mod_bypass: boolean;
	cooldown_seconds: number;
	blocked_words: string[];
	redemption_title: string;
	providers: Record<string, boolean>;
	updated_at?: string;
}

const defaultSettings: TtsSettings = {
	enabled: true,
	default_voice: 'default',
	max_message_length: 200,
	skip_commands: true,
	skip_links: true,
	sub_only: false,
	mod_bypass: true,
	cooldown_seconds: 0,
	blocked_words: [],
	redemption_title: 'TTS Message',
	providers: {}
};

export const ttsSettings = $state({
	data: defaultSettings,
	loading: false,
	error: null as string | null
});

export async function fetchTtsSettings() {
	ttsSettings.loading = true;
	ttsSettings.error = null;
	try {
		const res = await get<{ success: boolean, data: TtsSettings, error?: string }>('/tts/settings');
		if (res.success) {
			ttsSettings.data = res.data;
		} else {
			ttsSettings.error = res.error || 'Failed to fetch settings';
		}
	} catch (e: any) {
		ttsSettings.error = e.message;
	} finally {
		ttsSettings.loading = false;
	}
}

export async function updateTtsSettings(data: TtsSettings) {
	ttsSettings.loading = true;
	try {
		// Pick only fields allowed in UpdateTtsSettingsRequest
		const payload = {
			enabled: data.enabled,
			default_voice: data.default_voice,
			max_message_length: data.max_message_length,
			skip_commands: data.skip_commands,
			skip_links: data.skip_links,
			sub_only: data.sub_only,
			mod_bypass: data.mod_bypass,
			cooldown_seconds: data.cooldown_seconds,
			blocked_words: data.blocked_words,
			redemption_title: data.redemption_title
		};

		const res = await put<{ success: boolean, data: TtsSettings, error?: string }>('/tts/settings', payload);
		if (res.success) {
			ttsSettings.data = res.data;
			return true;
		} else {
			ttsSettings.error = res.error || 'Failed to update settings';
			return false;
		}
	} catch (e: any) {
		ttsSettings.error = e.message;
		return false;
	} finally {
		ttsSettings.loading = false;
	}
}
