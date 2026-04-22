import { sse } from '$lib/core/api/client';

let connected = $state(false);
let audioQueue: string[] = [];
let isPlaying = false;

export const tts = {
	get connected() { return connected; }
};

export function connectTTS(): () => void {
	connected = false;
	
	return sse(
		'/tts/overlay/stream',
		(raw) => {
			if (!raw || typeof raw !== 'object') return;
			const event = raw as any;

			if (event.type === 'audio' && event.audio_b64) {
				audioQueue.push(event.audio_b64);
				processQueue();
			}
		},
		(status) => {
			connected = status;
		}
	);
}

async function processQueue() {
	if (isPlaying || audioQueue.length === 0) return;
	
	isPlaying = true;
	const b64 = audioQueue.shift();
	
	if (b64) {
		try {
			const audioBlob = b64ToBlob(b64, 'audio/mpeg');
			const url = URL.createObjectURL(audioBlob);
			const audio = new Audio(url);
			
			audio.onended = () => {
				URL.revokeObjectURL(url);
				isPlaying = false;
				processQueue();
			};
			
			await audio.play();
		} catch (e) {
			console.error("[TTS] Playback error:", e);
			isPlaying = false;
			processQueue();
		}
	}
}

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
