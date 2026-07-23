export interface TtsMessage {
	type: string;
	username: string;
	text: string;
	voice_id: string;
	audio_b64: string;
}
