import { sse } from '$lib/core/api/client';
import type { TtsMessage } from '$lib/types/api';

let connected = $state(false);
let currentSpeaker = $state<string | null>(null);
let queue: TtsMessage[] = [];
let isPlaying = false;

export const tts = {
	get connected() { return connected; },
	get currentSpeaker() { return currentSpeaker; },
};

export function connectTTS(): () => void {
	connected = false;
	
	return sse<TtsMessage>(
		'/tts/overlay/stream',
		(msg) => {
			if (msg.type === 'audio' && msg.audio_b64) enqueue(msg);
		},
		(status) => {
			connected = status;
		}
	);
}

function enqueue(msg: TtsMessage) {
	queue.push(msg);
	if (!isPlaying) playNext();
}

async function playNext() {
	if (queue.length === 0) return;

	const item = queue.shift();
	if (item) {
		isPlaying = true;
		currentSpeaker = item.username;
		try {
			await playAudio(item.audio_b64);
		} catch (err) {
			console.error('[TTS overlay] playback error:', err);
		}
		isPlaying = false;
		currentSpeaker = null;
		await sleep(300);
	}

	playNext();
}

const playAudio = (b64: string) => new Promise<void>((resolve) => {
	const audioBlob = b64ToBlob(b64, 'audio/mpeg');
	const url = URL.createObjectURL(audioBlob);
	const audio = new Audio(url);
	audio.addEventListener('ended', () => {
		URL.revokeObjectURL(url);
		resolve();
	});
	audio.play();
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function b64ToBlob(b64Data: string, contentType = '', sliceSize = 512) {
	const byteCharacters = atob(b64Data);
	const byteArrays = [];

	for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
		const slice = byteCharacters.slice(offset, offset + sliceSize);
		const byteNumbers = new Array(slice.length);
		for (let i = 0; i < slice.length; i++) {
			byteNumbers[i] = slice.charCodeAt(i);
		}
		const byteArray = new Uint8Array(byteNumbers);
		byteArrays.push(byteArray);
	}

	return new Blob(byteArrays, { type: contentType });
}
